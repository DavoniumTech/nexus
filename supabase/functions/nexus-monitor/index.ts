
import { withSupabase } from "npm:@supabase/server@1";

type Payload = Record<string, any>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const clean = (value: unknown, max = 200): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

const send = (status: number, body: Payload) =>
  Response.json(body, { status });

const ok = (data: unknown) =>
  send(200, { success: true, data });

const fail = (status: number, code: string, message: string) =>
  send(status, { success: false, code, message });

function safeHttpsUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > 2000) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host === "::1" ||
      host.startsWith("[fc") ||
      host.startsWith("[fd") ||
      /^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function parseHeaders(value: unknown): Record<string, string> {
  if (value === undefined || value === null) return {};

  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("INVALID_MONITOR_HEADERS");
  }

  const result: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(value as Payload)) {
    const name = key.toLowerCase();

    if (
      !/^[a-z0-9-]{1,80}$/.test(name) ||
      ["host", "content-length", "connection", "transfer-encoding"].includes(name) ||
      typeof rawValue !== "string" ||
      rawValue.length > 4000
    ) {
      throw new Error("INVALID_MONITOR_HEADERS");
    }

    result[key] = rawValue;
  }

  return result;
}

function safeErrorCode(value: unknown): string {
  const code = clean(value, 100).replace(/[^A-Za-z0-9_.-]/g, "_");
  return code || "MONITOR_CHECK_FAILED";
}

function expectedStatus(value: unknown): number | null {
  const n = value === undefined ? 200 : Number(value);

  return Number.isInteger(n) && n >= 200 && n <= 399 ? n : null;
}

async function fetchHealthCheck(
  url: URL,
  headers: Record<string, string>,
  expected: number,
) {
  const controller = new AbortController();
  const started = Date.now();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      redirect: "error",
      signal: controller.signal,
    });

    const durationMs = Date.now() - started;

    try {
      await response.body?.cancel();
    } catch {
      // The response body is intentionally not read or logged.
    }

    return {
      status: response.status === expected
        ? "operational"
        : "degraded",
      passed: response.status === expected,
      http_status: response.status,
      duration_ms: durationMs,
      error_code: response.status === expected
        ? null
        : `HTTP_${response.status}`,
    };
  } catch (error) {
    const timedOut = error instanceof DOMException &&
      error.name === "AbortError";

    return {
      status: "outage",
      passed: false,
      http_status: null,
      duration_ms: Date.now() - started,
      error_code: timedOut ? "HEALTHCHECK_TIMEOUT" : "HEALTHCHECK_NETWORK_ERROR",
    };
  } finally {
    clearTimeout(timer);
  }
}

export default {
  fetch: withSupabase(
    { auth: ["user", "secret", "publishable"] },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
      }

      let body: Payload;

      try {
        body = await req.json();
      } catch {
        return fail(400, "INVALID_JSON", "The request body must be valid JSON.");
      }

      const action = clean(body.action, 80);
      if (!action) {
        return fail(400, "ACTION_REQUIRED", "A monitoring action is required.");
      }

      const isUser = ctx.authMode === "user" && Boolean(ctx.userClaims?.id);
      const isSecret = ctx.authMode === "secret";

      if (!isUser && !isSecret) {
        return fail(
          401,
          "USER_SESSION_REQUIRED",
          "Sign in to Davonium Nexus, or use an authorised trusted monitoring server.",
        );
      }

      const db = isSecret ? ctx.supabaseAdmin : ctx.supabase;

      if (!db) {
        return fail(500, "DATABASE_CLIENT_UNAVAILABLE", "The required database client is unavailable.");
      }

      // This project currently uses one primary organisation.
      // A caller may supply its UUID; otherwise use its registered slug.
      const workspaceKey =
        clean(body.organization_id, 100) ||
        "davonium-technologies";

      const orgQuery = db
        .from("organizations")
        .select("id,name,slug")
        .eq(isUuid(workspaceKey) ? "id" : "slug", workspaceKey);

      const { data: organization, error: orgError } =
        await orgQuery.maybeSingle();

      if (orgError) {
        return fail(400, "WORKSPACE_LOOKUP_FAILED", "Could not resolve the monitoring workspace.");
      }

      if (!organization) {
        return fail(404, "WORKSPACE_NOT_FOUND", "Davonium Technologies workspace was not found.");
      }

      // User-facing read actions remain under the user's RLS-scoped client.
      if (isUser) {
        const actorId = ctx.userClaims!.id;

        const { data: membership, error: membershipError } = await db
          .from("organization_memberships")
          .select("role,status")
          .eq("organization_id", organization.id)
          .eq("user_id", actorId)
          .maybeSingle();

        if (membershipError) {
          return fail(400, "MEMBERSHIP_LOOKUP_FAILED", "Could not verify workspace membership.");
        }

        if (!membership || membership.status !== "active") {
          return fail(403, "ACTIVE_MEMBERSHIP_REQUIRED", "An active workspace membership is required.");
        }

        if (action === "status") {
          const { data, error } = await db
            .from("nexus_command_center_service_status")
            .select("*")
            .eq("organization_id", organization.id)
            .order("display_name", { ascending: true });

          if (error) {
            return fail(403, "STATUS_ACCESS_DENIED", "You cannot view service status, or the query failed.");
          }

          return ok(data ?? []);
        }

        if (action === "integrations.list") {
          const { data, error } = await db
            .from("product_integrations")
            .select(
              "id,product_id,integration_key,platform,display_name,state,credential_location,verified_by,verified_at,last_tested_at,last_test_status,last_successful_sync_at,last_error_code,created_at,updated_at",
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) {
            return fail(403, "INTEGRATION_ACCESS_DENIED", "You cannot view product integrations, or the query failed.");
          }

          return ok(data ?? []);
        }

        if (action === "integration_runs.list") {
          let query: any = db
            .from("product_metric_ingestion_runs")
            .select(
              "id,product_id,integration_id,idempotency_key,run_status,metrics_received,metrics_accepted,metrics_rejected,error_code,started_at,finished_at",
            )
            .eq("organization_id", organization.id)
            .order("started_at", { ascending: false })
            .limit(100);

          if (body.integration_id !== undefined) {
            if (!isUuid(body.integration_id)) {
              return fail(400, "INVALID_INTEGRATION_ID", "integration_id must be a valid UUID.");
            }

            query = query.eq("integration_id", body.integration_id);
          }

          const { data, error } = await query;

          if (error) {
            return fail(403, "INTEGRATION_RUNS_ACCESS_DENIED", "You cannot view integration runs, or the query failed.");
          }

          return ok(data ?? []);
        }

        return fail(
          403,
          "TRUSTED_MONITOR_REQUIRED",
          "This action is reserved for the trusted server-side monitoring process.",
        );
      }

      // Secret-authenticated operations must use the project secret key
      // from a trusted server, never from a browser or public client.
      if (!isSecret) {
        return fail(401, "TRUSTED_MONITOR_REQUIRED", "A trusted monitor credential is required.");
      }

      // --------------------------------------------------------
      // A. RUN REAL HTTPS HEALTH CHECKS
      // --------------------------------------------------------
      if (action === "run_checks") {
        const rawTargets = Deno.env.get("NEXUS_MONITOR_TARGETS");

        if (!rawTargets) {
          return fail(
            409,
            "MONITOR_TARGETS_NOT_CONFIGURED",
            "Configure NEXUS_MONITOR_TARGETS after the real health-check URLs are available.",
          );
        }

        let targets: Payload[];

        try {
          const parsed = JSON.parse(rawTargets);
          if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 20) {
            throw new Error("INVALID_TARGET_LIST");
          }
          targets = parsed;
        } catch {
          return fail(
            500,
            "MONITOR_TARGETS_INVALID",
            "NEXUS_MONITOR_TARGETS must be a JSON array containing between 1 and 20 checks.",
          );
        }

        const keys = new Set<string>();

        for (const target of targets) {
          const key = clean(target.component_key, 80);
          const url = safeHttpsUrl(target.url);
          const expected = expectedStatus(target.expected_status);

          if (
            !/^[a-z][a-z0-9_-]{1,79}$/.test(key) ||
            !url ||
            expected === null ||
            keys.has(key)
          ) {
            return fail(
              400,
              "INVALID_MONITOR_TARGET",
              "Each check needs a unique component_key, a public HTTPS health URL and an expected HTTP status from 200 to 399.",
            );
          }

          try {
            parseHeaders(target.headers);
          } catch {
            return fail(400, "INVALID_MONITOR_HEADERS", "A monitor target contains invalid headers.");
          }

          keys.add(key);
        }

        const results = await Promise.all(targets.map(async (target) => {
          const componentKey = target.component_key as string;
          const url = safeHttpsUrl(target.url)!;
          const expected = expectedStatus(target.expected_status)!;
          const monitorName = clean(target.monitor_name || "configured-healthcheck", 60)
            .replace(/[^A-Za-z0-9_.-]/g, "_");

          let result;

          try {
            result = await fetchHealthCheck(
              url,
              parseHeaders(target.headers),
              expected,
            );
          } catch {
            result = {
              status: "outage",
              passed: false,
              http_status: null,
              duration_ms: 0,
              error_code: "HEALTHCHECK_CONFIGURATION_ERROR",
            };
          }

          const { data: recorded, error } = await db
            .from("service_components")
            .update({
              component_status: result.status,
              last_checked_at: new Date().toISOString(),
              monitoring_source: `nexus-monitor:${monitorName}`,
              updated_by: null,
            })
            .eq("organization_id", organization.id)
            .eq("component_key", componentKey)
            .select("component_key,display_name,component_status,last_checked_at")
            .maybeSingle();

          return {
            component_key: componentKey,
            status: result.status,
            http_status: result.http_status,
            duration_ms: result.duration_ms,
            error_code: result.error_code,
            recorded: Boolean(recorded) && !error,
            record_error: error ? "DATABASE_STATUS_UPDATE_FAILED" : null,
          };
        }));

        return ok({
          organization: organization.slug,
          checked_at: new Date().toISOString(),
          checks: results,
          note: "A service is marked operational only when its configured health endpoint returns the expected status.",
        });
      }

      // --------------------------------------------------------
      // B. TEST A REGISTERED PRODUCT INTEGRATION
      // --------------------------------------------------------
      if (action === "integration.check") {
        if (!isUuid(body.integration_id)) {
          return fail(400, "INVALID_INTEGRATION_ID", "Provide a valid integration_id.");
        }

        const { data: integration, error: lookupError } = await db
          .from("product_integrations")
          .select("id,organization_id,product_id,integration_key,display_name,state")
          .eq("organization_id", organization.id)
          .eq("id", body.integration_id)
          .maybeSingle();

        if (lookupError) {
          return fail(400, "INTEGRATION_LOOKUP_FAILED", "Could not retrieve the registered integration.");
        }

        if (!integration) {
          return fail(404, "INTEGRATION_NOT_FOUND", "The requested integration was not found.");
        }

        if (integration.state === "revoked") {
          return fail(409, "INTEGRATION_REVOKED", "A revoked integration cannot be tested.");
        }

        const envKey = integration.integration_key
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "_");

        const urlSecret = `NEXUS_INTEGRATION_${envKey}_HEALTHCHECK_URL`;
        const headersSecret = `NEXUS_INTEGRATION_${envKey}_HEALTHCHECK_HEADERS`;
        const expectedSecret = `NEXUS_INTEGRATION_${envKey}_EXPECTED_STATUS`;

        const rawUrl = Deno.env.get(urlSecret);
        const url = safeHttpsUrl(rawUrl);
        const expectedRaw = Deno.env.get(expectedSecret);
        const expected = expectedStatus(
          expectedRaw === undefined ? 200 : Number(expectedRaw),
        );

        if (!url || expected === null) {
          return fail(
            409,
            "INTEGRATION_HEALTHCHECK_NOT_CONFIGURED",
            `Configure ${urlSecret} with the integration's real HTTPS health-check endpoint before testing it.`,
          );
        }

        let headers: Record<string, string>;

        try {
          const rawHeaders = Deno.env.get(headersSecret);
          headers = rawHeaders ? parseHeaders(JSON.parse(rawHeaders)) : {};
        } catch {
          return fail(500, "INTEGRATION_HEADERS_INVALID", "The integration health-check headers secret is invalid.");
        }

        const result = await fetchHealthCheck(url, headers, expected);

        // This database RPC is service_role-only. It records the result
        // of the real HTTPS check; it does not invent a successful test.
        const { error: recordError } = await db.rpc(
          "nexus_record_product_integration_test",
          {
            p_integration_id: integration.id,
            p_test_passed: result.passed,
            p_error_code: result.error_code,
          },
        );

        if (recordError) {
          return fail(
            500,
            "INTEGRATION_TEST_RECORD_FAILED",
            "The health check ran, but Supabase could not record its result.",
          );
        }

        return ok({
          integration_id: integration.id,
          integration_name: integration.display_name,
          test_status: result.passed ? "passed" : "failed",
          http_status: result.http_status,
          duration_ms: result.duration_ms,
          error_code: result.error_code,
          state_changed: false,
          note: result.passed
            ? "The test passed. An Owner or authorised Admin must activate the integration separately."
            : "The test failed. The integration has not been activated.",
        });
      }

      return fail(
        400,
        "UNKNOWN_ACTION",
        "Supported monitoring actions are status, integrations.list, integration_runs.list, run_checks and integration.check.",
      );
    },
  ),
};
