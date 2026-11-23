
import { withSupabase } from "npm:@supabase/server@1";

type Data = Record<string, any>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const clean = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && UUID.test(v);

const send = (status: number, body: Data) =>
  Response.json(body, { status });

const ok = (data: unknown) =>
  send(200, { success: true, data });

const fail = (status: number, code: string, message: string) =>
  send(status, { success: false, code, message });

const dbError = (error: any) => {
  const denied =
    error?.code === "42501" ||
    String(error?.message ?? "").toLowerCase().includes("row-level security") ||
    String(error?.message ?? "").toLowerCase().includes("permission denied");

  return fail(
    denied ? 403 : 400,
    denied ? "PERMISSION_DENIED" : "DATABASE_REQUEST_FAILED",
    denied
      ? "Your account is not authorised for this administration operation."
      : "The database could not complete the request.",
  );
};

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
          "Sign in to access Davonium Nexus administration.",
        );
      }

      let body: Data;
      try {
        body = await req.json();
      } catch {
        return fail(400, "INVALID_JSON", "The request body must be valid JSON.");
      }

      const action = clean(body.action, 80);
      if (!action) {
        return fail(400, "ACTION_REQUIRED", "An administration action is required.");
      }

      const supabase = ctx.supabase;
      const actorId = ctx.userClaims.id;
      const workspace = clean(body.organization_id, 100) ||
        "davonium-technologies";

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id,name,slug")
        .eq(isUuid(workspace) ? "id" : "slug", workspace)
        .maybeSingle();

      if (orgError) return dbError(orgError);
      if (!org) return fail(404, "WORKSPACE_NOT_FOUND", "Workspace not found.");

      const { data: membership, error: memberError } = await supabase
        .from("organization_memberships")
        .select("role,status")
        .eq("organization_id", org.id)
        .eq("user_id", actorId)
        .maybeSingle();

      if (memberError) return dbError(memberError);
      if (!membership || membership.status !== "active") {
        return fail(403, "ACTIVE_MEMBERSHIP_REQUIRED", "An active workspace membership is required.");
      }

      try {
        switch (action) {
          // -----------------------------------------------
          // COMPANY MEMBER DIRECTORY
          // -----------------------------------------------
          case "members.list": {
            const { data, error } = await supabase
              .from("organization_memberships")
              .select("organization_id,user_id,role,status,created_at,updated_at")
              .eq("organization_id", org.id)
              .order("created_at", { ascending: true })
              .limit(300);

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "members.role.update": {
            if (!isUuid(body.user_id)) {
              return fail(400, "INVALID_USER_ID", "A valid user_id is required.");
            }

            const roles = [
              "owner", "admin", "manager", "team",
              "designer", "developer", "investor", "client",
            ];

            if (!roles.includes(body.new_role)) {
              return fail(400, "INVALID_ROLE", "Choose a valid Nexus workspace role.");
            }

            const { error } = await supabase.rpc("nexus_set_member_role", {
              p_organization_id: org.id,
              p_user_id: body.user_id,
              p_new_role: body.new_role,
            });

            if (error) return dbError(error);

            return ok({
              user_id: body.user_id,
              new_role: body.new_role,
              note: "The database enforces Owner-only protection and prevents demoting the last active Owner.",
            });
          }

          case "members.permission.set": {
            if (!isUuid(body.user_id)) {
              return fail(400, "INVALID_USER_ID", "A valid user_id is required.");
            }

            const permission = clean(body.permission_key, 120);

            if (
              !/^[a-z][a-z0-9_]*([.][a-z][a-z0-9_]*)+$/.test(permission) ||
              typeof body.is_allowed !== "boolean"
            ) {
              return fail(400, "INVALID_PERMISSION_OVERRIDE", "Provide a valid permission_key and boolean is_allowed.");
            }

            const { error } = await supabase.rpc("nexus_set_user_permission", {
              p_organization_id: org.id,
              p_user_id: body.user_id,
              p_permission_key: permission,
              p_is_allowed: body.is_allowed,
            });

            if (error) return dbError(error);

            return ok({
              user_id: body.user_id,
              permission_key: permission,
              is_allowed: body.is_allowed,
            });
          }

          case "members.permission.clear": {
            if (!isUuid(body.user_id)) {
              return fail(400, "INVALID_USER_ID", "A valid user_id is required.");
            }

            const permission = clean(body.permission_key, 120);

            if (!/^[a-z][a-z0-9_]*([.][a-z][a-z0-9_]*)+$/.test(permission)) {
              return fail(400, "INVALID_PERMISSION_KEY", "Provide a valid permission_key.");
            }

            const { error } = await supabase.rpc("nexus_clear_user_permission", {
              p_organization_id: org.id,
              p_user_id: body.user_id,
              p_permission_key: permission,
            });

            if (error) return dbError(error);
            return ok({ user_id: body.user_id, permission_key: permission, override_cleared: true });
          }

          // -----------------------------------------------
          // DEPARTMENTS
          // -----------------------------------------------
          case "departments.list": {
            const { data, error } = await supabase
              .from("departments")
              .select("id,code,name,description,status,created_at,updated_at")
              .eq("organization_id", org.id)
              .order("name", { ascending: true });

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "departments.create": {
            const code = clean(body.code, 20).toUpperCase();
            const name = clean(body.name, 120);

            if (!/^[A-Z][A-Z0-9_-]{1,19}$/.test(code) || name.length < 2) {
              return fail(400, "INVALID_DEPARTMENT", "Provide a valid uppercase department code and name.");
            }

            const { data, error } = await supabase
              .from("departments")
              .insert({
                organization_id: org.id,
                code,
                name,
                description: clean(body.description, 500),
                status: "active",
                created_by: actorId,
                updated_by: actorId,
              })
              .select("*")
              .single();

            if (error) return dbError(error);
            return ok(data);
          }

          case "departments.update": {
            if (!isUuid(body.department_id)) {
              return fail(400, "INVALID_DEPARTMENT_ID", "A valid department_id is required.");
            }

            const patch: Data = { updated_by: actorId };

            if (body.code !== undefined) {
              const code = clean(body.code, 20).toUpperCase();
              if (!/^[A-Z][A-Z0-9_-]{1,19}$/.test(code)) {
                return fail(400, "INVALID_DEPARTMENT_CODE", "Invalid department code.");
              }
              patch.code = code;
            }

            if (body.name !== undefined) {
              const name = clean(body.name, 120);
              if (name.length < 2) return fail(400, "INVALID_NAME", "Department name is too short.");
              patch.name = name;
            }

            if (body.description !== undefined) patch.description = clean(body.description, 500);

            if (body.status !== undefined) {
              if (!["active", "inactive"].includes(body.status)) {
                return fail(400, "INVALID_STATUS", "Department status must be active or inactive.");
              }
              patch.status = body.status;
            }

            if (Object.keys(patch).length === 1) {
              return fail(400, "EMPTY_UPDATE", "Provide a department field to update.");
            }

            const { data, error } = await supabase
              .from("departments")
              .update(patch)
              .eq("organization_id", org.id)
              .eq("id", body.department_id)
              .select("*")
              .maybeSingle();

            if (error) return dbError(error);
            if (!data) return fail(404, "DEPARTMENT_NOT_FOUND", "Department not found.");
            return ok(data);
          }

          // -----------------------------------------------
          // TEAMS
          // -----------------------------------------------
          case "teams.list": {
            let query: any = supabase
              .from("teams")
              .select("id,department_id,code,name,description,status,created_at,updated_at")
              .eq("organization_id", org.id)
              .order("name", { ascending: true });

            if (body.department_id !== undefined) {
              if (!isUuid(body.department_id)) {
                return fail(400, "INVALID_DEPARTMENT_ID", "department_id must be a valid UUID.");
              }
              query = query.eq("department_id", body.department_id);
            }

            const { data, error } = await query;
            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "teams.create": {
            if (!isUuid(body.department_id)) {
              return fail(400, "INVALID_DEPARTMENT_ID", "A valid department_id is required.");
            }

            const code = clean(body.code, 20).toUpperCase();
            const name = clean(body.name, 120);

            if (!/^[A-Z][A-Z0-9_-]{1,19}$/.test(code) || name.length < 2) {
              return fail(400, "INVALID_TEAM", "Provide a valid uppercase team code and name.");
            }

            const { data, error } = await supabase
              .from("teams")
              .insert({
                organization_id: org.id,
                department_id: body.department_id,
                code,
                name,
                description: clean(body.description, 500),
                status: "active",
                created_by: actorId,
                updated_by: actorId,
              })
              .select("*")
              .single();

            if (error) return dbError(error);
            return ok(data);
          }

          case "teams.update": {
            if (!isUuid(body.team_id)) {
              return fail(400, "INVALID_TEAM_ID", "A valid team_id is required.");
            }

            const patch: Data = { updated_by: actorId };

            if (body.department_id !== undefined) {
              if (!isUuid(body.department_id)) {
                return fail(400, "INVALID_DEPARTMENT_ID", "department_id must be a valid UUID.");
              }
              patch.department_id = body.department_id;
            }

            if (body.code !== undefined) {
              const code = clean(body.code, 20).toUpperCase();
              if (!/^[A-Z][A-Z0-9_-]{1,19}$/.test(code)) {
                return fail(400, "INVALID_TEAM_CODE", "Invalid team code.");
              }
              patch.code = code;
            }

            if (body.name !== undefined) {
              const name = clean(body.name, 120);
              if (name.length < 2) return fail(400, "INVALID_NAME", "Team name is too short.");
              patch.name = name;
            }

            if (body.description !== undefined) patch.description = clean(body.description, 500);

            if (body.status !== undefined) {
              if (!["active", "inactive"].includes(body.status)) {
                return fail(400, "INVALID_STATUS", "Team status must be active or inactive.");
              }
              patch.status = body.status;
            }

            if (Object.keys(patch).length === 1) {
              return fail(400, "EMPTY_UPDATE", "Provide a team field to update.");
            }

            const { data, error } = await supabase
              .from("teams")
              .update(patch)
              .eq("organization_id", org.id)
              .eq("id", body.team_id)
              .select("*")
              .maybeSingle();

            if (error) return dbError(error);
            if (!data) return fail(404, "TEAM_NOT_FOUND", "Team not found.");
            return ok(data);
          }

          // -----------------------------------------------
          // CLIENT ACCOUNTS
          // -----------------------------------------------
          case "clients.list": {
            const { data, error } = await supabase
              .from("client_accounts")
              .select("id,client_code,account_name,status,notes,created_at,updated_at")
              .eq("organization_id", org.id)
              .order("account_name", { ascending: true })
              .limit(200);

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "clients.create": {
            const code = clean(body.client_code, 20).toUpperCase();
            const name = clean(body.account_name, 160);

            if (!/^CL-[0-9]{4,}$/.test(code) || name.length < 2) {
              return fail(400, "INVALID_CLIENT_ACCOUNT", "Client code must look like CL-0001 and account name must contain at least 2 characters.");
            }

            const { data, error } = await supabase
              .from("client_accounts")
              .insert({
                organization_id: org.id,
                client_code: code,
                account_name: name,
                status: "active",
                notes: clean(body.notes, 2000),
                created_by: actorId,
              })
              .select("*")
              .single();

            if (error) return dbError(error);
            return ok(data);
          }

          case "clients.update": {
            if (!isUuid(body.client_account_id)) {
              return fail(400, "INVALID_CLIENT_ACCOUNT_ID", "A valid client_account_id is required.");
            }

            const patch: Data = {};

            if (body.client_code !== undefined) {
              const code = clean(body.client_code, 20).toUpperCase();
              if (!/^CL-[0-9]{4,}$/.test(code)) {
                return fail(400, "INVALID_CLIENT_CODE", "Client code must look like CL-0001.");
              }
              patch.client_code = code;
            }

            if (body.account_name !== undefined) {
              const name = clean(body.account_name, 160);
              if (name.length < 2) return fail(400, "INVALID_ACCOUNT_NAME", "Account name is too short.");
              patch.account_name = name;
            }

            if (body.notes !== undefined) patch.notes = clean(body.notes, 2000);

            if (body.status !== undefined) {
              if (!["active", "paused", "closed"].includes(body.status)) {
                return fail(400, "INVALID_CLIENT_STATUS", "Client status must be active, paused or closed.");
              }
              patch.status = body.status;
            }

            if (Object.keys(patch).length === 0) {
              return fail(400, "EMPTY_UPDATE", "Provide a client account field to update.");
            }

            const { data, error } = await supabase
              .from("client_accounts")
              .update(patch)
              .eq("organization_id", org.id)
              .eq("id", body.client_account_id)
              .select("*")
              .maybeSingle();

            if (error) return dbError(error);
            if (!data) return fail(404, "CLIENT_ACCOUNT_NOT_FOUND", "Client account not found.");
            return ok(data);
          }

          case "clients.members.list": {
            if (!isUuid(body.client_account_id)) {
              return fail(400, "INVALID_CLIENT_ACCOUNT_ID", "A valid client_account_id is required.");
            }

            const { data, error } = await supabase
              .from("client_account_memberships")
              .select("client_account_id,user_id,job_title,contact_type,is_active,added_at")
              .eq("organization_id", org.id)
              .eq("client_account_id", body.client_account_id)
              .order("added_at", { ascending: true });

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          // -----------------------------------------------
          // INVESTOR ROOM ACCESS
          // -----------------------------------------------
          case "investor.access.list": {
            const { data, error } = await supabase
              .from("investor_access")
              .select("user_id,status,granted_by,granted_at,updated_at")
              .eq("organization_id", org.id)
              .order("granted_at", { ascending: false });

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "investor.access.set": {
            if (!isUuid(body.user_id) || typeof body.is_active !== "boolean") {
              return fail(400, "INVALID_INVESTOR_ACCESS", "Provide a valid user_id and boolean is_active.");
            }

            const { error } = await supabase.rpc("nexus_set_investor_access", {
              p_organization_id: org.id,
              p_user_id: body.user_id,
              p_is_active: body.is_active,
            });

            if (error) return dbError(error);

            return ok({
              user_id: body.user_id,
              investor_room_access: body.is_active ? "active" : "revoked",
            });
          }

          default:
            return fail(
              400,
              "UNKNOWN_ACTION",
              "Unsupported workspace administration action.",
            );
        }
      } catch {
        return fail(
          500,
          "WORKSPACE_ADMIN_INTERNAL_ERROR",
          "The administration request could not be completed.",
        );
      }
    },
  ),
};
