
import { withSupabase } from "npm:@supabase/server@1";

console.info("[NEXUS] Analytics service starting");

type PermissionRow = {
  permission_key: string;
  is_allowed: boolean;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRODUCT_STATUSES = [
  "planning",
  "development",
  "beta",
  "live",
  "maintenance",
  "retired"
];

const AGGREGATIONS = [
  "latest",
  "sum",
  "average",
  "maximum",
  "minimum"
];

const INTEGRATION_STATES = [
  "pending",
  "active",
  "paused",
  "revoked",
  "error"
];

function reply(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function cleanText(
  value: unknown,
  min: number,
  max: number
): string | null {
  if (typeof value !== "string") return null;

  const text = value.trim();

  return text.length >= min && text.length <= max
    ? text
    : null;
}

function validDate(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && !Number.isNaN(Date.parse(value));
}

function errorStatus(code?: string): number {
  if (code === "42501") return 403;
  if (code === "P0002") return 404;
  if (code === "23505") return 409;
  if (["23514", "22023", "22004", "22P02"].includes(code ?? "")) {
    return 400;
  }
  return 500;
}

export default {
  fetch: withSupabase(
    { auth: ["user", "secret", "publishable"] },

    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return reply({ error: "POST method required." }, 405);
        }

        let input: Record<string, unknown>;

        try {
          const parsed: unknown = await req.json();

          if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
          ) {
            return reply({ error: "A JSON object is required." }, 400);
          }

          input = parsed as Record<string, unknown>;
        } catch {
          return reply({ error: "Invalid JSON request." }, 400);
        }

        const action = input.action;

        if (typeof action !== "string") {
          return reply({ error: "An action is required." }, 400);
        }

        // ====================================================
        // TRUSTED SERVER-TO-SERVER INGESTION
        // This path accepts only a Supabase secret API key.
        // It never accepts a publishable key as an ingestion credential.
        // ====================================================

        if (ctx.authMode === "secret") {
          if (action !== "ingest") {
            return reply({
              error: "The trusted integration credential is restricted to metric ingestion."
            }, 403);
          }

          if (
            !validUuid(input.integration_id) ||
            typeof input.idempotency_key !== "string" ||
            input.idempotency_key.length < 8 ||
            input.idempotency_key.length > 180 ||
            typeof input.metric_key !== "string" ||
            !/^[a-z][a-z0-9_]*$/.test(input.metric_key) ||
            typeof input.metric_value !== "number" ||
            !Number.isFinite(input.metric_value) ||
            input.metric_value < 0 ||
            typeof input.payload_sha256 !== "string" ||
            !/^[a-fA-F0-9]{64}$/.test(input.payload_sha256)
          ) {
            return reply({
              error: "Invalid aggregate metric ingestion request."
            }, 400);
          }

          const observedAt = input.observed_at ?? null;
          const periodStart = input.period_start ?? null;
          const periodEnd = input.period_end ?? null;

          if (
            observedAt !== null &&
            !validTimestamp(observedAt)
          ) {
            return reply({ error: "Invalid metric observation timestamp." }, 400);
          }

          if (
            periodStart !== null &&
            !validDate(periodStart)
          ) {
            return reply({ error: "Invalid metric period start." }, 400);
          }

          if (
            periodEnd !== null &&
            !validDate(periodEnd)
          ) {
            return reply({ error: "Invalid metric period end." }, 400);
          }

          if (
            periodStart !== null &&
            periodEnd !== null &&
            Date.parse(periodEnd) < Date.parse(periodStart)
          ) {
            return reply({
              error: "Metric period end cannot precede its start."
            }, 400);
          }

          if (
            input.source_reference !== undefined &&
            (
              typeof input.source_reference !== "string" ||
              input.source_reference.length > 300
            )
          ) {
            return reply({ error: "Invalid source reference." }, 400);
          }

          // The existing SQL function independently checks:
          // - service_role authentication
          // - active integration
          // - registered metric definition
          // - idempotency
          // - non-negative values
          // - audit trail and sync history

          const { data, error } = await ctx.supabaseAdmin.rpc(
            "nexus_ingest_product_metric",
            {
              p_integration_id: input.integration_id,
              p_idempotency_key: input.idempotency_key,
              p_metric_key: input.metric_key,
              p_metric_value: input.metric_value,
              p_observed_at: observedAt,
              p_period_start: periodStart,
              p_period_end: periodEnd,
              p_payload_sha256: input.payload_sha256,
              p_source_reference:
                input.source_reference ?? null
            }
          );

          if (error) {
            console.error(
              "[NEXUS] Trusted ingestion failed:",
              error.code
            );

            return reply({
              error: "Trusted product metric ingestion was rejected.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({
            success: true,
            service: "nexus-analytics",
            operation: "ingest",
            result: data
          });
        }

        // A publishable key identifies the project, not an employee.
        if (
          ctx.authMode !== "user" ||
          !ctx.userClaims?.id
        ) {
          return reply({
            success: false,
            authenticated: false,
            code: "USER_SESSION_REQUIRED",
            message: "Sign in to access company analytics."
          }, 401);
        }

        const userId = ctx.userClaims.id;

        // ====================================================
        // WORKSPACE AND USER PERMISSIONS
        // ====================================================

        let organizationQuery = ctx.supabase
          .from("organizations")
          .select("id, name, slug");

        if (input.organization_id !== undefined) {
          if (!validUuid(input.organization_id)) {
            return reply({ error: "Invalid workspace ID." }, 400);
          }

          organizationQuery =
            organizationQuery.eq("id", input.organization_id);
        } else {
          organizationQuery =
            organizationQuery.eq("slug", "davonium-technologies");
        }

        const {
          data: organization,
          error: organizationError
        } = await organizationQuery.maybeSingle();

        if (organizationError || !organization) {
          return reply({
            error: "Workspace not found or not accessible."
          }, 404);
        }

        const {
          data: membership,
          error: membershipError
        } = await ctx.supabase
          .from("organization_memberships")
          .select("role, status")
          .eq("organization_id", organization.id)
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        if (membershipError || !membership) {
          return reply({
            error: "Active company membership is required."
          }, 403);
        }

        const [roleResult, overrideResult] = await Promise.all([
          ctx.supabase
            .from("role_permissions")
            .select("permission_key, is_allowed")
            .eq("role", membership.role),

          ctx.supabase
            .from("user_permissions")
            .select("permission_key, is_allowed")
            .eq("organization_id", organization.id)
            .eq("user_id", userId)
        ]);

        if (roleResult.error || overrideResult.error) {
          return reply({
            error: "Unable to load analytics permissions."
          }, 500);
        }

        const roleRows =
          (roleResult.data ?? []) as PermissionRow[];

        const overrideRows =
          (overrideResult.data ?? []) as PermissionRow[];

        const roleMap = new Map<string, boolean>(
          roleRows.map(row => [
            row.permission_key,
            row.is_allowed
          ])
        );

        const overrideMap = new Map<string, boolean>(
          overrideRows.map(row => [
            row.permission_key,
            row.is_allowed
          ])
        );

        const can = (key: string): boolean => {
          if (overrideMap.has(key)) {
            return overrideMap.get(key) === true;
          }
          return roleMap.get(key) === true;
        };

        const denied = () => reply({
          error: "You are not authorised for this analytics operation.",
          code: "ANALYTICS_PERMISSION_DENIED"
        }, 403);

        // ====================================================
        // ACTION: DASHBOARD OVERVIEW
        // ====================================================

        if (action === "overview") {
          if (!can("products.view")) return denied();

          const productQuery = ctx.supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organization.id);

          const metricQuery = can("products.metrics.view")
            ? ctx.supabase
                .from("product_metrics")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", organization.id)
                .eq("verification", "verified")
                .neq("source", "sample")
            : null;

          const [productsResult, metricsResult] = await Promise.all([
            productQuery,
            metricQuery
          ]);

          if (productsResult.error || metricsResult?.error) {
            return reply({
              error: "Unable to calculate analytics overview."
            }, 500);
          }

          return reply({
            success: true,
            service: "nexus-analytics",
            workspace: organization.name,
            counts: {
              products: productsResult.count ?? 0,
              verified_non_sample_metrics:
                metricsResult?.count ?? null
            },
            metric_policy: {
              sample_metrics_included: false,
              unverified_manual_metrics_included: false,
              customer_level_personal_data: false
            },
            generated_at: new Date().toISOString()
          });
        }

        // ====================================================
        // ACTION: LIST PRODUCTS
        // ====================================================

        if (action === "products") {
          if (!can("products.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("products")
            .select(
              "id, slug, name, summary, status, current_version, roadmap_summary, created_at, updated_at"
            )
            .eq("organization_id", organization.id)
            .order("name");

          if (error) {
            return reply({ error: "Unable to retrieve products." }, 500);
          }

          return reply({
            success: true,
            total: data?.length ?? 0,
            products: data ?? []
          });
        }

        // ====================================================
        // ACTION: CREATE PRODUCT
        // ====================================================

        if (action === "create_product") {
          if (!can("products.manage")) return denied();

          const name = cleanText(input.name, 2, 120);
          const summary =
            typeof input.summary === "string"
              ? input.summary
              : "";

          if (!name || summary.length > 5000) {
            return reply({
              error: "Provide a valid product name and summary."
            }, 400);
          }

          if (
            typeof input.slug !== "string" ||
            !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug) ||
            input.slug.length > 100
          ) {
            return reply({ error: "Invalid product slug." }, 400);
          }

          if (
            input.current_version != null &&
            !cleanText(input.current_version, 1, 60)
          ) {
            return reply({ error: "Invalid product version." }, 400);
          }

          // Products start in planning. A product is not declared
          // live simply because somebody creates its database record.
          const { data, error } = await ctx.supabase
            .from("products")
            .insert({
              organization_id: organization.id,
              slug: input.slug,
              name,
              summary,
              status: "planning",
              current_version: input.current_version ?? null,
              roadmap_summary:
                typeof input.roadmap_summary === "string"
                  ? input.roadmap_summary.slice(0, 5000)
                  : null,
              created_by: userId
            })
            .select(
              "id, slug, name, summary, status, current_version, created_at"
            )
            .single();

          if (error) {
            return reply({
              error: "Product could not be created.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({ success: true, product: data }, 201);
        }

        // ====================================================
        // ACTION: LATEST VERIFIED METRICS
        // ====================================================

        if (action === "latest_metrics") {
          if (!can("products.metrics.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("nexus_product_metric_latest")
            .select(
              "product_id, product_name, metric_key, metric_label, metric_value, unit, source, verification, period_start, period_end, observed_at"
            )
            .eq("organization_id", organization.id)
            .order("observed_at", { ascending: false })
            .limit(500);

          if (error) {
            return reply({
              error: "Unable to retrieve verified product metrics."
            }, 500);
          }

          return reply({
            success: true,
            total: data?.length ?? 0,
            metrics: data ?? []
          });
        }

        // ====================================================
        // ACTION: METRIC HISTORY
        // ====================================================

        if (action === "metric_history") {
          if (!can("products.metrics.view")) return denied();

          if (!validUuid(input.product_id)) {
            return reply({ error: "A valid product ID is required." }, 400);
          }

          if (
            input.metric_key !== undefined &&
            (
              typeof input.metric_key !== "string" ||
              !/^[a-z][a-z0-9_]*$/.test(input.metric_key)
            )
          ) {
            return reply({ error: "Invalid metric key." }, 400);
          }

          const limit =
            Number.isInteger(input.limit)
              ? Math.min(Math.max(Number(input.limit), 1), 200)
              : 50;

          const offset =
            Number.isInteger(input.offset)
              ? Math.max(Number(input.offset), 0)
              : 0;

          let query = ctx.supabase
            .from("product_metrics")
            .select(
              "id, product_id, metric_key, metric_label, metric_value, unit, source, verification, period_start, period_end, observed_at, source_reference"
            )
            .eq("organization_id", organization.id)
            .eq("product_id", input.product_id)
            .eq("verification", "verified")
            .neq("source", "sample")
            .order("observed_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (typeof input.metric_key === "string") {
            query = query.eq("metric_key", input.metric_key);
          }

          const { data, error } = await query;

          if (error) {
            return reply({ error: "Unable to retrieve metric history." }, 500);
          }

          return reply({
            success: true,
            metrics: data ?? [],
            pagination: { limit, offset }
          });
        }

        // ====================================================
        // ACTION: LIST METRIC DEFINITIONS
        // ====================================================

        if (action === "metric_definitions") {
          if (!can("product_metrics.definitions.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("product_metric_definitions")
            .select(
              "id, product_id, metric_key, metric_label, unit, aggregation, privacy_class, is_active, created_at, updated_at"
            )
            .eq("organization_id", organization.id)
            .order("metric_label");

          if (error) {
            return reply({
              error: "Unable to retrieve metric definitions."
            }, 500);
          }

          return reply({
            success: true,
            definitions: data ?? []
          });
        }

        // ====================================================
        // ACTION: CREATE METRIC DEFINITION
        // ====================================================

        if (action === "create_metric_definition") {
          if (!can("product_metrics.definitions.manage")) return denied();

          if (!validUuid(input.product_id)) {
            return reply({ error: "Invalid product ID." }, 400);
          }

          const metricKey =
            typeof input.metric_key === "string"
              ? input.metric_key.trim()
              : "";

          const label = cleanText(input.metric_label, 2, 120);
          const unit = cleanText(input.unit ?? "count", 1, 30);
          const aggregation = input.aggregation ?? "latest";

          if (
            !/^[a-z][a-z0-9_]*$/.test(metricKey) ||
            !label ||
            !unit ||
            !AGGREGATIONS.includes(String(aggregation))
          ) {
            return reply({ error: "Invalid metric definition." }, 400);
          }

          const { data: product } = await ctx.supabase
            .from("products")
            .select("id")
            .eq("organization_id", organization.id)
            .eq("id", input.product_id)
            .maybeSingle();

          if (!product) {
            return reply({ error: "Product not found." }, 404);
          }

          const { data, error } = await ctx.supabase
            .from("product_metric_definitions")
            .insert({
              organization_id: organization.id,
              product_id: input.product_id,
              metric_key: metricKey,
              metric_label: label,
              unit,
              aggregation,
              privacy_class: "aggregate_only",
              created_by: userId
            })
            .select(
              "id, product_id, metric_key, metric_label, unit, aggregation, privacy_class, is_active"
            )
            .single();

          if (error) {
            return reply({
              error: "Metric definition could not be created.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({ success: true, definition: data }, 201);
        }

        // ====================================================
        // ACTION: UPDATE METRIC DEFINITION
        // ====================================================

        if (action === "update_metric_definition") {
          if (!can("product_metrics.definitions.manage")) return denied();

          if (!validUuid(input.definition_id)) {
            return reply({ error: "Invalid metric definition ID." }, 400);
          }

          const patch: Record<string, unknown> = {};

          if ("metric_label" in input) {
            const label = cleanText(input.metric_label, 2, 120);
            if (!label) return reply({ error: "Invalid metric label." }, 400);
            patch.metric_label = label;
          }

          if ("unit" in input) {
            const unit = cleanText(input.unit, 1, 30);
            if (!unit) return reply({ error: "Invalid metric unit." }, 400);
            patch.unit = unit;
          }

          if ("aggregation" in input) {
            if (!AGGREGATIONS.includes(String(input.aggregation))) {
              return reply({ error: "Invalid aggregation method." }, 400);
            }
            patch.aggregation = input.aggregation;
          }

          if ("is_active" in input) {
            if (typeof input.is_active !== "boolean") {
              return reply({ error: "Invalid active status." }, 400);
            }
            patch.is_active = input.is_active;
          }

          if (Object.keys(patch).length === 0) {
            return reply({ error: "No metric definition changes supplied." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("product_metric_definitions")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("id", input.definition_id)
            .select(
              "id, product_id, metric_key, metric_label, unit, aggregation, is_active"
            )
            .maybeSingle();

          if (error) {
            return reply({
              error: "Metric definition update failed.",
              code: error.code
            }, errorStatus(error.code));
          }

          if (!data) {
            return reply({ error: "Metric definition not found." }, 404);
          }

          return reply({ success: true, definition: data });
        }

        // ====================================================
        // ACTION: CREATE MANUAL METRIC
        // New manual records always begin as PENDING.
        // The verification column is protected by migration 011.
        // ====================================================

        if (action === "create_manual_metric") {
          if (!can("products.metrics.manage")) return denied();

          if (
            !validUuid(input.product_id) ||
            typeof input.metric_key !== "string" ||
            !/^[a-z][a-z0-9_]*$/.test(input.metric_key) ||
            typeof input.metric_value !== "number" ||
            !Number.isFinite(input.metric_value) ||
            input.metric_value < 0
          ) {
            return reply({ error: "Invalid manual metric request." }, 400);
          }

          if (
            input.period_start != null &&
            !validDate(input.period_start)
          ) {
            return reply({ error: "Invalid metric period start." }, 400);
          }

          if (
            input.period_end != null &&
            !validDate(input.period_end)
          ) {
            return reply({ error: "Invalid metric period end." }, 400);
          }

          if (
            input.period_start &&
            input.period_end &&
            Date.parse(input.period_end as string) <
              Date.parse(input.period_start as string)
          ) {
            return reply({ error: "Invalid metric reporting period." }, 400);
          }

          const { data: definition } = await ctx.supabase
            .from("product_metric_definitions")
            .select("metric_label, unit")
            .eq("organization_id", organization.id)
            .eq("product_id", input.product_id)
            .eq("metric_key", input.metric_key)
            .eq("is_active", true)
            .maybeSingle();

          if (!definition) {
            return reply({
              error: "An active metric definition is required before entering data."
            }, 404);
          }

          const reference =
            input.source_reference == null
              ? null
              : cleanText(input.source_reference, 1, 300);

          if (
            input.source_reference != null &&
            !reference
          ) {
            return reply({ error: "Invalid metric source reference." }, 400);
          }

          // Do not supply verification. PostgreSQL defaults it to pending.
          const { data, error } = await ctx.supabase
            .from("product_metrics")
            .insert({
              organization_id: organization.id,
              product_id: input.product_id,
              metric_key: input.metric_key,
              metric_label: definition.metric_label,
              metric_value: input.metric_value,
              unit: definition.unit,
              source: "manual",
              period_start: input.period_start ?? null,
              period_end: input.period_end ?? null,
              observed_at: new Date().toISOString(),
              source_reference: reference,
              recorded_by: userId
            })
            .select(
              "id, product_id, metric_key, metric_label, metric_value, unit, source, verification, period_start, period_end, observed_at"
            )
            .single();

          if (error) {
            return reply({
              error: "Manual metric could not be recorded.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({
            success: true,
            message: "Metric recorded and awaiting authorised verification.",
            metric: data
          }, 201);
        }

        // ====================================================
        // ACTION: REVIEW PENDING MANUAL METRICS
        // ====================================================

        if (action === "pending_manual_metrics") {
          if (!can("products.metrics.manage")) return denied();

          const { data, error } = await ctx.supabase
            .from("product_metrics")
            .select(
              "id, product_id, metric_key, metric_label, metric_value, unit, source, verification, period_start, period_end, observed_at, recorded_by"
            )
            .eq("organization_id", organization.id)
            .eq("source", "manual")
            .eq("verification", "pending")
            .order("created_at", { ascending: false })
            .limit(200);

          if (error) {
            return reply({
              error: "Unable to retrieve pending manual metrics."
            }, 500);
          }

          return reply({
            success: true,
            pending_metrics: data ?? []
          });
        }

        // ====================================================
        // ACTION: VERIFY MANUAL METRIC
        // The database RPC performs the final permission check.
        // ====================================================

        if (action === "verify_manual_metric") {
          if (!can("products.metrics.manage")) return denied();

          if (!validUuid(input.metric_id)) {
            return reply({ error: "Invalid metric ID." }, 400);
          }

          const { error } = await ctx.supabase.rpc(
            "nexus_verify_manual_product_metric",
            { p_metric_id: input.metric_id }
          );

          if (error) {
            return reply({
              error: "Metric verification was rejected.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({
            success: true,
            message: "Manual metric verified and recorded in the audit trail."
          });
        }

        // ====================================================
        // ACTION: LIST PRODUCT INTEGRATIONS
        // ====================================================

        if (action === "integrations") {
          if (!can("integrations.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("product_integrations")
            .select(
              "id, product_id, integration_key, platform, display_name, state, credential_location, last_tested_at, last_test_status, last_successful_sync_at, last_error_code, created_at"
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false });

          if (error) {
            return reply({
              error: "Unable to retrieve product integrations."
            }, 500);
          }

          return reply({
            success: true,
            integrations: data ?? []
          });
        }

        // ====================================================
        // ACTION: REGISTER PRODUCT INTEGRATION
        // Secrets are stored outside PostgreSQL.
        // ====================================================

        if (action === "register_integration") {
          if (!can("integrations.manage")) return denied();

          if (!validUuid(input.product_id)) {
            return reply({ error: "Invalid product ID." }, 400);
          }

          const integrationKey =
            typeof input.integration_key === "string"
              ? input.integration_key.trim()
              : "";

          const platform = cleanText(input.platform, 2, 80);
          const displayName = cleanText(input.display_name, 2, 120);

          if (
            !/^[a-z][a-z0-9_-]*$/.test(integrationKey) ||
            !platform ||
            !displayName
          ) {
            return reply({ error: "Invalid integration details." }, 400);
          }

          const { data: product } = await ctx.supabase
            .from("products")
            .select("id")
            .eq("organization_id", organization.id)
            .eq("id", input.product_id)
            .maybeSingle();

          if (!product) {
            return reply({ error: "Product not found." }, 404);
          }

          const { data, error } = await ctx.supabase
            .from("product_integrations")
            .insert({
              organization_id: organization.id,
              product_id: input.product_id,
              integration_key: integrationKey,
              platform,
              display_name: displayName,
              state: "pending",
              credential_location: "edge_function_secret",
              created_by: userId
            })
            .select(
              "id, product_id, integration_key, platform, display_name, state, credential_location, created_at"
            )
            .single();

          if (error) {
            return reply({
              error: "Product integration could not be registered.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({
            success: true,
            message: "Integration registered in pending state. It has not been tested or activated.",
            integration: data
          }, 201);
        }

        // ====================================================
        // ACTION: CHANGE INTEGRATION STATE
        // Existing SQL function blocks activation before a
        // successful trusted server-side integration test.
        // ====================================================

        if (action === "set_integration_state") {
          if (!can("integrations.manage")) return denied();

          if (
            !validUuid(input.integration_id) ||
            typeof input.state !== "string" ||
            !INTEGRATION_STATES.includes(input.state)
          ) {
            return reply({ error: "Invalid integration or state." }, 400);
          }

          const errorCode =
            typeof input.error_code === "string"
              ? input.error_code.slice(0, 100)
              : null;

          const { error } = await ctx.supabase.rpc(
            "nexus_set_product_integration_state",
            {
              p_integration_id: input.integration_id,
              p_new_state: input.state,
              p_error_code: errorCode
            }
          );

          if (error) {
            return reply({
              error: "Integration state change was rejected.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({
            success: true,
            message: "Integration state updated."
          });
        }

        // ====================================================
        // ACTION: VIEW INGESTION HISTORY
        // ====================================================

        if (action === "ingestion_runs") {
          if (!can("integrations.runs.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("product_metric_ingestion_runs")
            .select(
              "id, product_id, integration_id, run_status, metrics_received, metrics_accepted, metrics_rejected, error_code, started_at, finished_at"
            )
            .eq("organization_id", organization.id)
            .order("started_at", { ascending: false })
            .limit(100);

          if (error) {
            return reply({
              error: "Unable to retrieve ingestion history."
            }, 500);
          }

          return reply({
            success: true,
            runs: data ?? []
          });
        }

        // ====================================================
        // ACTION: VIEW INTEGRATION EVENTS
        // ====================================================

        if (action === "sync_events") {
          if (!can("integrations.runs.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("product_metric_sync_events")
            .select(
              "id, product_id, run_id, event_code, safe_message, created_at"
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) {
            return reply({
              error: "Unable to retrieve synchronization events."
            }, 500);
          }

          return reply({
            success: true,
            events: data ?? []
          });
        }

        return reply({
          error: "Unknown analytics operation.",
          supported_actions: [
            "overview",
            "products",
            "create_product",
            "latest_metrics",
            "metric_history",
            "metric_definitions",
            "create_metric_definition",
            "update_metric_definition",
            "create_manual_metric",
            "pending_manual_metrics",
            "verify_manual_metric",
            "integrations",
            "register_integration",
            "set_integration_state",
            "ingestion_runs",
            "sync_events",
            "ingest"
          ]
        }, 400);

      } catch (error) {
        console.error(
          "[NEXUS] Analytics service failure:",
          error instanceof Error ? error.message : "Unknown error"
        );

        return reply({
          error: "Analytics operation could not be completed.",
          code: "NEXUS_ANALYTICS_ERROR"
        }, 500);
      }
    }
  )
};
