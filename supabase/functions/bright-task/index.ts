
import { withSupabase } from "npm:@supabase/server@1";

console.info("[NEXUS] Permission service starting");

type MembershipRow = {
  organization_id: string;
  role: string;
  status: string;
};

type PermissionDefinition = {
  permission_key: string;
  section: string;
  label: string;
  description: string;
};

type PermissionGrant = {
  permission_key: string;
  is_allowed: boolean;
};

const response = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },

    async (req, ctx) => {
      try {
        // 1. Require a real signed-in user.
        // A publishable project key alone is never sufficient.

        if (ctx.authMode !== "user" || !ctx.userClaims?.id) {
          return response({
            success: false,
            code: "USER_SESSION_REQUIRED",
            message: "Sign in to access Davonium permissions."
          }, 401);
        }

        const userId = ctx.userClaims.id;

        if (req.method !== "POST") {
          return response({
            error: "Use POST for permission requests."
          }, 405);
        }

        // 2. Read the requested workspace.
        let body: { organization_id?: string } = {};

        try {
          body = await req.json();
        } catch {
          return response({
            error: "Request body must be valid JSON."
          }, 400);
        }

        // Our first workspace is Davonium Technologies.
        // An explicit organization_id is supported for future expansion.

        let organizationQuery = ctx.supabase
          .from("organizations")
          .select("id, name, slug");

        if (body.organization_id !== undefined) {
          if (
            typeof body.organization_id !== "string" ||
            !UUID_PATTERN.test(body.organization_id)
          ) {
            return response({
              error: "Invalid organization ID."
            }, 400);
          }

          organizationQuery =
            organizationQuery.eq("id", body.organization_id);
        } else {
          organizationQuery =
            organizationQuery.eq("slug", "davonium-technologies");
        }

        const {
          data: organization,
          error: organizationError
        } = await organizationQuery.maybeSingle();

        if (organizationError || !organization) {
          return response({
            error: "Workspace not found or not accessible."
          }, 404);
        }

        // 3. Verify active membership in this workspace.

        const {
          data: membershipResult,
          error: membershipError
        } = await ctx.supabase
          .from("organization_memberships")
          .select("organization_id, role, status")
          .eq("organization_id", organization.id)
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        if (membershipError) {
          console.error(
            "[NEXUS] Membership lookup failed:",
            membershipError.code
          );

          return response({
            error: "Unable to verify workspace membership."
          }, 500);
        }

        if (!membershipResult) {
          return response({
            success: false,
            code: "ACTIVE_MEMBERSHIP_REQUIRED"
          }, 403);
        }

        const membership =
          membershipResult as MembershipRow;

        // 4. Load the permission catalogue and role defaults.
        // These queries use the user's RLS-scoped database client.

        const [
          definitionsResult,
          roleResult,
          overridesResult
        ] = await Promise.all([
          ctx.supabase
            .from("permissions")
            .select(
              "permission_key, section, label, description"
            )
            .order("section")
            .order("label"),

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

        if (definitionsResult.error ||
            roleResult.error ||
            overridesResult.error) {
          console.error(
            "[NEXUS] Permission data could not be loaded."
          );

          return response({
            error: "Unable to retrieve permission information."
          }, 500);
        }

        const definitions =
          (definitionsResult.data ?? []) as PermissionDefinition[];

        const roleDefaults =
          (roleResult.data ?? []) as PermissionGrant[];

        const userOverrides =
          (overridesResult.data ?? []) as PermissionGrant[];

        // 5. Build permission lookup maps.

        const roleMap = new Map<string, boolean>(
          roleDefaults.map(item => [
            item.permission_key,
            item.is_allowed
          ])
        );

        const overrideMap = new Map<string, boolean>(
          userOverrides.map(item => [
            item.permission_key,
            item.is_allowed
          ])
        );

        // 6. Calculate effective permissions.
        // An explicit personal override takes precedence.
        // A permission not granted by either source is denied.

        const permissions = definitions.map(definition => {
          const hasOverride =
            overrideMap.has(definition.permission_key);

          const hasRoleDefault =
            roleMap.has(definition.permission_key);

          const allowed = hasOverride
            ? overrideMap.get(definition.permission_key)!
            : hasRoleDefault
              ? roleMap.get(definition.permission_key)!
              : false;

          return {
            key: definition.permission_key,
            section: definition.section,
            label: definition.label,
            description: definition.description,
            allowed,
            source: hasOverride
              ? "individual_override"
              : hasRoleDefault
                ? "role_default"
                : "default_deny"
          };
        });

        const granted = permissions.filter(p => p.allowed);

        // 7. Return the signed-in user's permission profile.

        return response({
          success: true,

          service: "davonium-nexus",
          function: "nexus-permissions",
          version: "1.0.0",

          identity: {
            user_id: userId,
            role: membership.role,
            membership_status: membership.status
          },

          workspace: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          },

          permission_summary: {
            total: permissions.length,
            granted: granted.length,
            denied: permissions.length - granted.length
          },

          permissions,

          security: {
            authentication: "verified_user_jwt",
            database_access: "user_scoped",
            row_level_security: "enforced",
            default_access: "deny",
            overrides: "individual_permissions"
          },

          generated_at: new Date().toISOString()
        });

      } catch (error) {
        console.error(
          "[NEXUS] Permission service failed:",
          error instanceof Error
            ? error.message
            : "Unknown error"
        );

        return response({
          error: "Unable to calculate workspace permissions.",
          code: "PERMISSION_SERVICE_ERROR"
        }, 500);
      }
    }
  )
};
