
import { withSupabase } from "npm:@supabase/server@1";

type Payload = Record<string, any>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const clean = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && UUID.test(v);

const reply = (status: number, body: Payload) =>
  Response.json(body, { status });

const ok = (data: unknown) =>
  reply(200, { success: true, data });

const fail = (status: number, code: string, message: string) =>
  reply(status, { success: false, code, message });

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
      }

      if (ctx.authMode !== "user" || !ctx.userClaims?.id) {
        return fail(
          401,
          "USER_SESSION_REQUIRED",
          "Sign in to access Davonium Nexus security records.",
        );
      }

      let body: Payload;

      try {
        body = await req.json();
      } catch {
        return fail(400, "INVALID_JSON", "The request body must be valid JSON.");
      }

      const action = clean(body.action, 80);

      if (!action) {
        return fail(400, "ACTION_REQUIRED", "A security action is required.");
      }

      const supabase = ctx.supabase;
      const actorId = ctx.userClaims.id;
      const workspace =
        clean(body.organization_id, 100) || "davonium-technologies";

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id,name,slug")
        .eq(
          isUuid(workspace) ? "id" : "slug",
          workspace,
        )
        .maybeSingle();

      if (orgError) {
        return fail(400, "WORKSPACE_LOOKUP_FAILED", "Could not resolve the workspace.");
      }

      if (!organization) {
        return fail(404, "WORKSPACE_NOT_FOUND", "Workspace not found.");
      }

      const { data: membership, error: memberError } = await supabase
        .from("organization_memberships")
        .select("role,status")
        .eq("organization_id", organization.id)
        .eq("user_id", actorId)
        .maybeSingle();

      if (memberError) {
        return fail(400, "MEMBERSHIP_LOOKUP_FAILED", "Could not verify your membership.");
      }

      if (!membership || membership.status !== "active") {
        return fail(403, "ACTIVE_MEMBERSHIP_REQUIRED", "An active workspace membership is required.");
      }

      // ------------------------------------------------------
      // MFA SESSION ASSURANCE — READ ONLY
      // ------------------------------------------------------
      if (action === "session.assurance") {
        const authorization = req.headers.get("Authorization") ?? "";
        const jwtMatch = authorization.match(/^Bearer\s+(.+)$/i);

        if (!jwtMatch?.[1]) {
          return fail(401, "SESSION_TOKEN_MISSING", "A signed-in access token is required.");
        }

        const { data, error } = await supabase.auth.mfa
          .getAuthenticatorAssuranceLevel(jwtMatch[1]);

        if (error || !data) {
          return fail(502, "MFA_ASSURANCE_LOOKUP_FAILED", "Could not inspect the current session assurance level.");
        }

        const currentLevel = data.currentLevel ?? "aal1";
        const nextLevel = data.nextLevel ?? "aal1";
        const privilegedRole = ["owner", "admin"].includes(membership.role);

        return ok({
          organization: organization.slug,
          role: membership.role,
          current_level: currentLevel,
          next_level: nextLevel,
          mfa_enrolled: nextLevel === "aal2",
          mfa_verified_for_this_session: currentLevel === "aal2",
          mfa_recommended_for_role: privilegedRole,
          authentication_methods: data.currentAuthenticationMethods ?? [],
          global_mfa_enforcement_configured_by_this_function: false,
          note: "This reports the current session's MFA assurance. It does not enforce MFA across other Edge Functions or the database.",
        });
      }

      // ------------------------------------------------------
      // APPEND-ONLY AUDIT LOG — RLS CONTROLLED
      // ------------------------------------------------------
      if (action === "audit.list") {
        const requestedLimit = Number(body.limit ?? 50);
        const limit = Number.isInteger(requestedLimit)
          ? Math.max(1, Math.min(100, requestedLimit))
          : 50;

        let query: any = supabase
          .from("audit_logs")
          .select(
            "id,actor_user_id,action,entity_type,entity_id,details,created_at",
            { count: "exact" },
          )
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (body.actor_user_id !== undefined) {
          if (!isUuid(body.actor_user_id)) {
            return fail(400, "INVALID_ACTOR_ID", "actor_user_id must be a valid UUID.");
          }

          query = query.eq("actor_user_id", body.actor_user_id);
        }

        if (body.action_prefix !== undefined) {
          const prefix = clean(body.action_prefix, 100);

          if (!/^[a-z][a-z0-9_.-]{1,99}$/.test(prefix)) {
            return fail(400, "INVALID_ACTION_PREFIX", "Provide a valid audit action prefix.");
          }

          query = query.like("action", `${prefix}%`);
        }

        if (body.since !== undefined) {
          if (typeof body.since !== "string" || !Number.isFinite(Date.parse(body.since))) {
            return fail(400, "INVALID_SINCE_DATE", "since must be a valid ISO date/time.");
          }

          query = query.gte("created_at", new Date(body.since).toISOString());
        }

        const { data, error, count } = await query;

        if (error) {
          return fail(403, "AUDIT_ACCESS_DENIED", "You do not have permission to view the audit log.");
        }

        return ok({
          events: data ?? [],
          returned_count: data?.length ?? 0,
          visible_total_count: count ?? 0,
          note: "Only audit records visible under your current database permissions are returned.",
        });
      }

      return fail(
        400,
        "UNKNOWN_ACTION",
        "Supported actions: session.assurance and audit.list.",
      );
    },
  ),
};
