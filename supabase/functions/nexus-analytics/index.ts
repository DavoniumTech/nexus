
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
        // NEXUS PRIVACY-MINIMISED ANALYTICS + FINANCE LEDGER
        // User session, workspace permissions and RLS remain mandatory.
        // ====================================================

        if (action === "events.ingest") {
          if (!can("workspace.view")) return denied();
          if (input.analytics_consent !== true) return reply({ success: false, code: "ANALYTICS_CONSENT_REQUIRED" }, 403);
          if (!Array.isArray(input.events) || input.events.length < 1 || input.events.length > 30) return reply({ error: "Provide between 1 and 30 consented analytics events." }, 400);
          const allowedEvents = new Set(["page_view", "command_used", "pwa_installed", "offline_session"]);
          const rows = [];
          for (const item of input.events) {
            if (!item || typeof item !== "object" || Array.isArray(item) ||
                typeof item.client_event_id !== "string" || !validUuid(item.client_event_id) ||
                typeof item.event_key !== "string" || !allowedEvents.has(item.event_key) ||
                (item.page_key != null && (typeof item.page_key !== "string" || !/^[a-z][a-z0-9_-]{0,50}$/.test(item.page_key)))) {
              return reply({ error: "An analytics event is invalid." }, 400);
            }
            rows.push({ organization_id: organization.id, client_event_id: item.client_event_id, actor_user_id: userId, event_key: item.event_key, page_key: item.page_key ?? null });
          }
          const { error } = await ctx.supabase.from("analytics_events").upsert(rows, { onConflict: "organization_id,client_event_id", ignoreDuplicates: true });
          if (error) return reply({ error: "Consent-based analytics could not be recorded.", code: error.code }, errorStatus(error.code));
          return reply({ success: true, accepted: rows.length, privacy: "No content, form values, credentials, IP address, or personal event properties are collected." });
        }

        if (action === "analytics.dashboard") {
          if (!can("analytics.view")) return denied();
          const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
          const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
          const [recentResult, allTimeResult] = await Promise.all([
            ctx.supabase.from("analytics_events").select("event_key,page_key,occurred_at,actor_user_id")
              .eq("organization_id", organization.id).gte("occurred_at", since30)
              .order("occurred_at", { ascending: false }).limit(2000),
            ctx.supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("organization_id", organization.id)
          ]);
          if (recentResult.error || allTimeResult.error) return reply({ error: "Analytics data could not be loaded." }, 500);
          const recent = recentResult.data ?? [], dayBins = new Map(), pageCounts = new Map(), activeUsers = new Set();
          let events7d = 0;
          for (const row of recent) {
            const day = String(row.occurred_at).slice(0,10);
            dayBins.set(day,(dayBins.get(day) ?? 0)+1);
            if (row.page_key) pageCounts.set(row.page_key,(pageCounts.get(row.page_key) ?? 0)+1);
            activeUsers.add(row.actor_user_id);
            if (row.occurred_at >= since7) events7d += 1;
          }
          const daily = [];
          for (let offset=29; offset>=0; offset-=1) {
            const day = new Date(Date.now()-offset*86400000).toISOString().slice(0,10);
            daily.push({ day, events: dayBins.get(day) ?? 0 });
          }
          return reply({ success: true, analytics: {
            events_30d: recent.length, events_7d: events7d, events_all_time: allTimeResult.count ?? 0,
            active_users_30d: activeUsers.size, sampling_limited: recent.length>=2000,
            daily, top_pages: [...pageCounts.entries()].map(([page,count])=>({page,views:count})).sort((a,b)=>b.views-a.views).slice(0,10)
          }, privacy: { consent_required: true, payload_collection: false, personal_content_collection: false }, generated_at: new Date().toISOString() });
        }

        if (action === "finance.overview") {
          if (!can("finance.view")) return denied();
          const [balancesR, entriesR, budgetsR] = await Promise.all([
            ctx.supabase.from("nexus_finance_account_balances").select("id,account_code,name,account_type,normal_balance,currency_code,current_balance,is_active")
              .eq("organization_id", organization.id).eq("is_active", true).order("account_code"),
            ctx.supabase.from("finance_journal_entries").select("id,entry_date,reference,description,currency_code,status,created_at")
              .eq("organization_id", organization.id).eq("status","posted").order("entry_date",{ascending:false}).limit(12),
            ctx.supabase.from("finance_budgets").select("id,name,period_start,period_end,amount,currency_code,status,account_id")
              .eq("organization_id", organization.id).eq("status","active").order("period_start",{ascending:false}).limit(30)
          ]);
          if (balancesR.error || entriesR.error || budgetsR.error) return reply({ error: "Finance overview could not be loaded." },500);
          const balances = balancesR.data ?? [], totals = { asset:{}, liability:{}, equity:{}, revenue:{}, expense:{} };
          for (const row of balances) {
            const key = row.account_type;
            if (!totals[key]) continue;
            totals[key][row.currency_code] = (totals[key][row.currency_code] ?? 0)+Number(row.current_balance ?? 0);
          }
          return reply({ success:true, finance:{ accounts:balances, recent_entries:entriesR.data ?? [], budgets:budgetsR.data ?? [], totals,
            currency_policy:"Balances are grouped by currency. Do not combine different currencies." }});
        }

        if (action === "finance.analytics") {
          if (!can("finance.view")) return denied();

          const now = new Date();
          const monthDates = Array.from({ length: 12 }, (_, offset) =>
            new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + offset, 1))
          );
          const fromDate = monthDates[0].toISOString().slice(0, 10);
          const monthKeys = monthDates.map(date => date.toISOString().slice(0, 7));
          const monthLabels = monthDates.map(date =>
            new Intl.DateTimeFormat("en", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date)
          );

          const { data, error } = await ctx.supabase
            .from("finance_journal_entries")
            .select("entry_date,currency_code,finance_journal_lines(debit,credit,finance_accounts(account_type,normal_balance,currency_code))")
            .eq("organization_id", organization.id)
            .eq("status", "posted")
            .gte("entry_date", fromDate)
            .order("entry_date", { ascending: true })
            .limit(5000);

          if (error) {
            return reply({ error: "Posted finance analytics could not be retrieved." }, 500);
          }

          const buckets = new Map<string, { revenue: number[]; expenses: number[]; lines: number }>();
          for (const entry of data ?? []) {
            const monthIndex = monthKeys.indexOf(String(entry.entry_date ?? "").slice(0, 7));
            if (monthIndex < 0) continue;

            for (const line of entry.finance_journal_lines ?? []) {
              const relation = line.finance_accounts;
              const account = Array.isArray(relation) ? relation[0] : relation;
              if (!account || !["revenue", "expense"].includes(String(account.account_type))) continue;

              const currency = String(account.currency_code || entry.currency_code || "").toUpperCase();
              if (!/^[A-Z]{3}$/.test(currency)) continue;
              if (!buckets.has(currency)) {
                buckets.set(currency, {
                  revenue: Array(12).fill(0),
                  expenses: Array(12).fill(0),
                  lines: 0
                });
              }

              const bucket = buckets.get(currency)!;
              const debit = Number(line.debit ?? 0);
              const credit = Number(line.credit ?? 0);
              const normalBalance = account.normal_balance ||
                (account.account_type === "revenue" ? "credit" : "debit");
              const movement = normalBalance === "credit" ? credit - debit : debit - credit;

              if (!Number.isFinite(movement)) continue;
              if (account.account_type === "revenue") bucket.revenue[monthIndex] += movement;
              if (account.account_type === "expense") bucket.expenses[monthIndex] += movement;
              bucket.lines += 1;
            }
          }

          const currencies = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([currency_code, values]) => ({
            currency_code,
            line_count: values.lines,
            monthly: monthKeys.map((month, index) => ({
              month,
              label: monthLabels[index],
              revenue: Number(values.revenue[index].toFixed(2)),
              expenses: Number(values.expenses[index].toFixed(2))
            }))
          }));

          return reply({
            success: true,
            analytics: {
              period_start: fromDate,
              period_end: now.toISOString().slice(0, 10),
              months: 12,
              posted_entry_count: (data ?? []).length,
              sampling_limited: (data ?? []).length >= 5000,
              currencies,
              source: "posted double-entry journal lines only",
              currency_policy: "Each currency is reported separately; currencies are never combined."
            }
          });
        }

        if (action === "finance.accounts.list") {
          if (!can("finance.view")) return denied();
          const { data,error } = await ctx.supabase.from("nexus_finance_account_balances")
            .select("id,account_code,name,account_type,normal_balance,currency_code,is_system,is_active,total_debits,total_credits,current_balance")
            .eq("organization_id",organization.id).order("account_code").limit(500);
          if (error) return reply({error:"Finance accounts could not be retrieved."},500);
          return reply({success:true,accounts:data ?? []});
        }

        if (action === "finance.accounts.create") {
          if (!can("finance.accounts.manage")) return denied();
          const code=cleanText(input.account_code,2,24), name=cleanText(input.name,2,120);
          const types=["asset","liability","equity","revenue","expense"];
          const normal=input.normal_balance, currency=typeof input.currency_code==="string"?input.currency_code.toUpperCase():"NGN";
          if (!code || !/^[A-Za-z0-9._-]+$/.test(code) || !name || !types.includes(String(input.account_type)) ||
              !["debit","credit"].includes(String(normal)) || !/^[A-Z]{3}$/.test(currency)) return reply({error:"Account code, name, type, normal balance and three-letter currency are required."},400);
          const {data,error}=await ctx.supabase.from("finance_accounts").insert({
            organization_id:organization.id,account_code:code,name,account_type:input.account_type,normal_balance:normal,currency_code:currency,
            description:typeof input.description==="string"?input.description.slice(0,1000):null,created_by:userId
          }).select("id,account_code,name,account_type,normal_balance,currency_code,is_active").single();
          if(error) return reply({error:"Finance account could not be created.",code:error.code},errorStatus(error.code));
          return reply({success:true,account:data},201);
        }

        if (action === "finance.accounts.update") {
          if (!can("finance.accounts.manage")) return denied();
          if (!validUuid(input.account_id) || typeof input.is_active!=="boolean") return reply({error:"A valid account and active state are required."},400);
          const {data,error}=await ctx.supabase.from("finance_accounts").update({is_active:input.is_active,updated_at:new Date().toISOString()})
            .eq("id",input.account_id).eq("organization_id",organization.id).eq("is_system",false)
            .select("id,account_code,name,is_active").maybeSingle();
          if(error || !data) return reply({error:"Account status could not be changed."},errorStatus(error?.code));
          return reply({success:true,account:data});
        }

        if (action === "finance.entries.list") {
          if (!can("finance.view")) return denied();
          const {data,error}=await ctx.supabase.from("finance_journal_entries")
            .select("id,entry_date,reference,description,currency_code,status,source,posted_at,created_at,finance_journal_lines(id,line_number,memo,debit,credit,finance_accounts(account_code,name))")
            .eq("organization_id",organization.id).order("entry_date",{ascending:false}).limit(100);
          if(error) return reply({error:"Finance journal could not be retrieved."},500);
          return reply({success:true,entries:data ?? []});
        }

        if (action === "finance.entries.create") {
          if (!can("finance.entries.manage")) return denied();
          if (!validDate(input.entry_date) || !cleanText(input.description,2,2000) || !Array.isArray(input.lines)) return reply({error:"Provide a valid date, description and balanced journal lines."},400);
          const {data,error}=await ctx.supabase.rpc("nexus_finance_create_entry",{
            p_organization_id:organization.id,p_entry_date:input.entry_date,p_description:input.description,
            p_reference:typeof input.reference==="string"?input.reference.slice(0,120):null,
            p_currency_code:typeof input.currency_code==="string"?input.currency_code:"NGN",p_lines:input.lines
          });
          if(error) return reply({error:"Journal entry failed its balance, currency or permission checks.",code:error.code},errorStatus(error.code));
          return reply({success:true,entry:data},201);
        }

        if (action === "finance.budgets.list") {
          if (!can("finance.view")) return denied();
          const {data,error}=await ctx.supabase.from("finance_budgets")
            .select("id,name,account_id,period_start,period_end,amount,currency_code,status,notes,created_at")
            .eq("organization_id",organization.id).order("period_start",{ascending:false}).limit(200);
          if(error) return reply({error:"Finance budgets could not be retrieved."},500);
          return reply({success:true,budgets:data ?? []});
        }

        if (action === "finance.budgets.create") {
          if (!can("finance.budgets.manage")) return denied();
          const name=cleanText(input.name,2,120),currency=typeof input.currency_code==="string"?input.currency_code.toUpperCase():"NGN";
          const amount=Number(input.amount);
          if(!name || !validDate(input.period_start) || !validDate(input.period_end) || Date.parse(input.period_end)<Date.parse(input.period_start) ||
             !Number.isFinite(amount) || amount<=0 || !/^[A-Z]{3}$/.test(currency) || (input.account_id!=null && !validUuid(input.account_id)))
            return reply({error:"Budget name, valid date range, positive amount and ISO currency are required."},400);
          const {data,error}=await ctx.supabase.from("finance_budgets").insert({
            organization_id:organization.id,name,period_start:input.period_start,period_end:input.period_end,amount,currency_code:currency,
            account_id:input.account_id ?? null,notes:typeof input.notes==="string"?input.notes.slice(0,2000):null,created_by:userId
          }).select("id,name,period_start,period_end,amount,currency_code,status").single();
          if(error) return reply({error:"Budget could not be created.",code:error.code},errorStatus(error.code));
          return reply({success:true,budget:data},201);
        }

        if (action === "finance.budgets.update") {
          if (!can("finance.budgets.manage")) return denied();
          if(!validUuid(input.budget_id) || !["active","paused","archived"].includes(String(input.status))) return reply({error:"A valid budget and status are required."},400);
          const {data,error}=await ctx.supabase.from("finance_budgets").update({status:input.status,updated_at:new Date().toISOString()})
            .eq("id",input.budget_id).eq("organization_id",organization.id).select("id,name,status").maybeSingle();
          if(error || !data) return reply({error:"Budget status could not be updated."},errorStatus(error?.code));
          return reply({success:true,budget:data});
        }

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
            "ingest",
            "events.ingest",
            "analytics.dashboard",
            "finance.overview",
            "finance.analytics",
            "finance.accounts.list",
            "finance.accounts.create",
            "finance.accounts.update",
            "finance.entries.list",
            "finance.entries.create",
            "finance.budgets.list",
            "finance.budgets.create",
            "finance.budgets.update"
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
