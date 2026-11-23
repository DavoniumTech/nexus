
import { withSupabase } from "npm:@supabase/server@1";

console.info("[DAVONIUM NEXUS] Session service starting");

type ProfileRow = {
  display_name: string;
  avatar_url: string | null;
};

type MembershipRow = {
  organization_id: string;
  role: string;
  status: string;
  created_at: string;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
};

function jsonResponse(
  data: unknown,
  status = 200
): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },

    async (_req, ctx) => {
      try {
        // 1. Only a verified user may access company information.
        // Publishable-only requests are permitted to reach this guard,
        // but they cannot access the database through this function.

        if (ctx.authMode !== "user" || !ctx.userClaims?.id) {
          return jsonResponse(
            {
              success: false,
              authenticated: false,
              workspace_access: false,
              code: "USER_SESSION_REQUIRED",
              message: "Please sign in to Davonium Nexus."
            },
            401
          );
        }

        const userId = ctx.userClaims.id;

        // 2. Retrieve the authenticated user's own profile.

        const {
          data: profileResult,
          error: profileError
        } = await ctx.supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          console.error(
            "[NEXUS] Profile query failed:",
            profileError.code
          );

          return jsonResponse(
            { error: "Unable to retrieve account profile." },
            500
          );
        }

        const profile =
          profileResult as ProfileRow | null;

        // 3. Verify active company membership.

        const {
          data: membershipResult,
          error: membershipError
        } = await ctx.supabase
          .from("organization_memberships")
          .select(
            "organization_id, role, status, created_at"
          )
          .eq("user_id", userId)
          .eq("status", "active");

        if (membershipError) {
          console.error(
            "[NEXUS] Membership query failed:",
            membershipError.code
          );

          return jsonResponse(
            { error: "Unable to verify company membership." },
            500
          );
        }

        const memberships =
          (membershipResult ?? []) as MembershipRow[];

        if (memberships.length === 0) {
          return jsonResponse(
            {
              authenticated: true,
              workspace_access: false,
              code: "ACTIVE_MEMBERSHIP_REQUIRED"
            },
            403
          );
        }

        // 4. Retrieve the user's accessible workspaces.

        const organizationIds = [
          ...new Set(
            memberships.map(
              membership => membership.organization_id
            )
          )
        ];

        const {
          data: organizationResult,
          error: organizationError
        } = await ctx.supabase
          .from("organizations")
          .select("id, name, slug")
          .in("id", organizationIds);

        if (organizationError) {
          console.error(
            "[NEXUS] Workspace query failed:",
            organizationError.code
          );

          return jsonResponse(
            { error: "Unable to retrieve workspace information." },
            500
          );
        }

        const organizations =
          (organizationResult ?? []) as OrganizationRow[];

        // 5. Create a strongly typed workspace lookup.

        const organizationEntries: Array<
          [string, OrganizationRow]
        > = organizations.map(organization => [
          organization.id,
          organization
        ]);

        const organizationMap =
          new Map<string, OrganizationRow>(
            organizationEntries
          );

        // 6. Return only workspaces successfully authorised by RLS.

        const workspaces = memberships.flatMap(
          membership => {
            const organization = organizationMap.get(
              membership.organization_id
            );

            if (!organization) {
              return [];
            }

            return [{
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              role: membership.role,
              membership_status: membership.status,
              joined_at: membership.created_at
            }];
          }
        );

        if (workspaces.length === 0) {
          return jsonResponse(
            {
              authenticated: true,
              workspace_access: false,
              code: "WORKSPACE_ACCESS_UNAVAILABLE"
            },
            403
          );
        }

        // 7. Return the verified Nexus session.

        return jsonResponse({
          success: true,
          service: "davonium-nexus",
          function: "nexus-session",
          version: "1.0.1",

          identity: {
            user_id: userId,

            email:
              typeof ctx.userClaims.email === "string"
                ? ctx.userClaims.email
                : null,

            display_name:
              profile?.display_name ?? "Davonium member",

            avatar_url:
              profile?.avatar_url ?? null
          },

          authenticated: true,
          workspace_access: true,
          workspaces,

          security: {
            authentication: "verified_user_jwt",
            authentication_mode: "user",
            database_access: "user_scoped",
            row_level_security: "enforced"
          },

          server_time: new Date().toISOString()
        });

      } catch (error) {
        console.error(
          "[NEXUS] Session service error:",
          error instanceof Error
            ? error.message
            : "Unknown error"
        );

        return jsonResponse(
          {
            error: "Unable to establish Nexus session.",
            code: "NEXUS_SESSION_ERROR"
          },
          500
        );
      }
    }
  )
};
