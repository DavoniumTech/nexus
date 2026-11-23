
import { withSupabase } from "npm:@supabase/server@1";

console.info("[NEXUS] Invitation service starting");

type PermissionRow = {
  permission_key: string;
  is_allowed: boolean;
};

type MembershipRow = {
  user_id: string;
  role: string;
  status: string;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_ROLES = [
  "admin",
  "manager",
  "team",
  "designer",
  "developer",
  "investor",
  "client"
];

const CONTACT_TYPES = [
  "primary",
  "project",
  "technical",
  "billing",
  "other"
];

function reply(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
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

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function cleanText(
  value: unknown,
  min: number,
  max: number
): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length >= min && result.length <= max
    ? result
    : null;
}

function validEmail(value: unknown): value is string {
  return typeof value === "string"
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },

    async (req, ctx) => {
      try {
        // 1. Require a genuinely authenticated user.
        if (ctx.authMode !== "user" || !ctx.userClaims?.id) {
          return reply({
            success: false,
            authenticated: false,
            code: "USER_SESSION_REQUIRED",
            message: "Sign in to Davonium Nexus."
          }, 401);
        }

        if (req.method !== "POST") {
          return reply({ error: "POST method required." }, 405);
        }

        let input: Record<string, unknown>;

        try {
          const value: unknown = await req.json();

          if (
            !value ||
            typeof value !== "object" ||
            Array.isArray(value)
          ) {
            return reply({ error: "A JSON object is required." }, 400);
          }

          input = value as Record<string, unknown>;
        } catch {
          return reply({ error: "Invalid JSON request." }, 400);
        }

        const actorId = ctx.userClaims.id;
        const action = input.action;

        if (typeof action !== "string") {
          return reply({ error: "An action is required." }, 400);
        }

        // 2. Acceptance is a special operation.
        // The existing database function verifies the invitee's
        // confirmed email against the original invitation.

        if (action === "accept") {
          if (!validUuid(input.invitation_id)) {
            return reply({ error: "Invalid invitation ID." }, 400);
          }

          const { data, error } = await ctx.supabase.rpc(
            "nexus_accept_invitation",
            { p_invitation_id: input.invitation_id }
          );

          if (error) {
            return reply({
              error: "Invitation acceptance was rejected.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({
            success: true,
            message: "Davonium workspace invitation accepted.",
            membership: data
          });
        }

        // 3. Resolve the workspace through the user's RLS client.

        let organizationQuery = ctx.supabase
          .from("organizations")
          .select("id, name, slug");

        if (input.organization_id !== undefined) {
          if (!validUuid(input.organization_id)) {
            return reply({ error: "Invalid organization ID." }, 400);
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
          return reply({ error: "Workspace not found or not accessible." }, 404);
        }

        // 4. Verify the acting user's active membership.

        const {
          data: membershipResult,
          error: membershipError
        } = await ctx.supabase
          .from("organization_memberships")
          .select("user_id, role, status")
          .eq("organization_id", organization.id)
          .eq("user_id", actorId)
          .eq("status", "active")
          .maybeSingle();

        if (membershipError || !membershipResult) {
          return reply({
            error: "Active company membership is required."
          }, 403);
        }

        const membership =
          membershipResult as MembershipRow;

        // 5. Calculate effective permissions.

        const [roleResult, overrideResult] = await Promise.all([
          ctx.supabase
            .from("role_permissions")
            .select("permission_key, is_allowed")
            .eq("role", membership.role),

          ctx.supabase
            .from("user_permissions")
            .select("permission_key, is_allowed")
            .eq("organization_id", organization.id)
            .eq("user_id", actorId)
        ]);

        if (roleResult.error || overrideResult.error) {
          return reply({
            error: "Unable to verify invitation permissions."
          }, 500);
        }

        const roleRows =
          (roleResult.data ?? []) as PermissionRow[];

        const overrideRows =
          (overrideResult.data ?? []) as PermissionRow[];

        const roleMap = new Map<string, boolean>(
          roleRows.map(row => [row.permission_key, row.is_allowed])
        );

        const overrideMap = new Map<string, boolean>(
          overrideRows.map(row => [row.permission_key, row.is_allowed])
        );

        const can = (key: string): boolean => {
          if (overrideMap.has(key)) {
            return overrideMap.get(key) === true;
          }

          return roleMap.get(key) === true;
        };

        // ----------------------------------------------------
        // ACTION: LIST INVITATIONS
        // ----------------------------------------------------

        if (action === "list") {
          if (!can("invitations.view")) {
            return reply({ error: "Invitation access denied." }, 403);
          }

          const { data, error } = await ctx.supabase
            .from("member_invitations")
            .select(
              "id, email, role, status, full_name, job_title, department_id, team_id, client_account_id, contact_type, sent_at, expires_at, accepted_at, cancelled_at, created_at, created_by"
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) {
            return reply({ error: "Unable to retrieve invitations." }, 500);
          }

          return reply({
            success: true,
            workspace: organization.name,
            invitations: data ?? []
          });
        }

        // ----------------------------------------------------
        // ACTION: CANCEL INVITATION
        // Existing database RPC enforces invitations.cancel.
        // ----------------------------------------------------

        if (action === "cancel") {
          if (!validUuid(input.invitation_id)) {
            return reply({ error: "Invalid invitation ID." }, 400);
          }

          if (!can("invitations.cancel")) {
            return reply({ error: "Not authorised to cancel invitations." }, 403);
          }

          const { error } = await ctx.supabase.rpc(
            "nexus_cancel_invitation",
            { p_invitation_id: input.invitation_id }
          );

          if (error) {
            return reply({
              error: "Invitation cancellation was rejected.",
              code: error.code
            }, errorStatus(error.code));
          }

          return reply({
            success: true,
            message: "Invitation cancelled."
          });
        }

        // All remaining actions require invitation authority.
        if (!can("members.invite")) {
          return reply({
            error: "You are not authorised to invite workspace members."
          }, 403);
        }

        // ----------------------------------------------------
        // ACTION: PREPARE AN INVITATION
        // No email is sent during this action.
        // ----------------------------------------------------

        if (action === "create") {
          const email = typeof input.email === "string"
            ? input.email.trim().toLowerCase()
            : "";

          if (!validEmail(email)) {
            return reply({ error: "A valid email address is required." }, 400);
          }

          if (
            typeof ctx.userClaims.email === "string" &&
            email === ctx.userClaims.email.toLowerCase()
          ) {
            return reply({
              error: "You already have an Owner or member account."
            }, 400);
          }

          if (
            typeof input.role !== "string" ||
            !VALID_ROLES.includes(input.role)
          ) {
            return reply({
              error: "Select a valid non-Owner workspace role."
            }, 400);
          }

          // Only the Owner may appoint Admins or Managers.
          if (
            ["admin", "manager"].includes(input.role) &&
            membership.role !== "owner"
          ) {
            return reply({
              error: "Only the Owner may invite Administrators or Managers."
            }, 403);
          }

          if (input.role === "client") {
            if (!validUuid(input.client_account_id)) {
              return reply({
                error: "Client invitations must be linked to a client company."
              }, 400);
            }

            const { data: client } = await ctx.supabase
              .from("client_accounts")
              .select("id, status")
              .eq("organization_id", organization.id)
              .eq("id", input.client_account_id)
              .eq("status", "active")
              .maybeSingle();

            if (!client) {
              return reply({
                error: "Active client account not found."
              }, 404);
            }
          } else if (input.client_account_id != null) {
            return reply({
              error: "Only Client invitations can be linked to client accounts."
            }, 400);
          }

          // Internal roles may be linked to departments and teams.
          const isExternal =
            input.role === "client" || input.role === "investor";

          const departmentId = input.department_id ?? null;
          const teamId = input.team_id ?? null;

          if (isExternal && (departmentId || teamId)) {
            return reply({
              error: "Client and Investor contacts cannot join internal departments or teams."
            }, 400);
          }

          if (departmentId !== null) {
            if (!validUuid(departmentId)) {
              return reply({ error: "Invalid department ID." }, 400);
            }

            const { data: department } = await ctx.supabase
              .from("departments")
              .select("id")
              .eq("organization_id", organization.id)
              .eq("id", departmentId)
              .eq("status", "active")
              .maybeSingle();

            if (!department) {
              return reply({ error: "Active department not found." }, 404);
            }
          }

          if (teamId !== null) {
            if (!validUuid(teamId) || departmentId === null) {
              return reply({
                error: "A team requires a valid department."
              }, 400);
            }

            const { data: team } = await ctx.supabase
              .from("teams")
              .select("id")
              .eq("organization_id", organization.id)
              .eq("id", teamId)
              .eq("department_id", departmentId)
              .eq("status", "active")
              .maybeSingle();

            if (!team) {
              return reply({
                error: "The selected active team does not belong to that department."
              }, 404);
            }
          }

          if (
            input.contact_type !== undefined &&
            !CONTACT_TYPES.includes(String(input.contact_type))
          ) {
            return reply({ error: "Invalid client contact type." }, 400);
          }

          const fullName =
            input.full_name == null
              ? null
              : cleanText(input.full_name, 2, 120);

          const jobTitle =
            input.job_title == null
              ? null
              : cleanText(input.job_title, 2, 100);

          if (input.full_name != null && !fullName) {
            return reply({ error: "Invalid full name." }, 400);
          }

          if (input.job_title != null && !jobTitle) {
            return reply({ error: "Invalid job title." }, 400);
          }

          // Check for an existing open invitation.
          // Expired pending rows are closed before a new invite is created.

          const { data: openInvitation, error: openError } =
            await ctx.supabaseAdmin
              .from("member_invitations")
              .select("id, status, expires_at")
              .eq("organization_id", organization.id)
              .eq("email", email)
              .in("status", ["pending", "sent"])
              .maybeSingle();

          if (openError) {
            return reply({ error: "Unable to check existing invitations." }, 500);
          }

          if (openInvitation) {
            if (Date.parse(openInvitation.expires_at) > Date.now()) {
              return reply({
                error: "An open invitation already exists for this email.",
                invitation_id: openInvitation.id
              }, 409);
            }

            await ctx.supabaseAdmin
              .from("member_invitations")
              .update({
                status: "expired",
                updated_by: actorId
              })
              .eq("id", openInvitation.id);
          }

          // The service role is used only after permission checks.
          // No invitation token or password is stored in this database row.

          const { data: invitation, error: insertError } =
            await ctx.supabaseAdmin
              .from("member_invitations")
              .insert({
                organization_id: organization.id,
                email,
                role: input.role,
                status: "pending",
                full_name: fullName,
                job_title: jobTitle,
                department_id: departmentId,
                team_id: teamId,
                client_account_id:
                  input.role === "client"
                    ? input.client_account_id
                    : null,
                contact_type: input.contact_type ?? "primary",
                created_by: actorId,
                updated_by: actorId
              })
              .select(
                "id, email, role, status, full_name, job_title, expires_at, created_at"
              )
              .single();

          if (insertError) {
            return reply({
              error: "Invitation record could not be created.",
              code: insertError.code
            }, errorStatus(insertError.code));
          }

          return reply({
            success: true,
            message: "Invitation prepared. Email delivery is a separate step.",
            invitation
          }, 201);
        }

        // ----------------------------------------------------
        // ACTION: SEND INVITATION EMAIL
        // Requires a real deployed frontend callback URL.
        // Never falls back to localhost.
        // ----------------------------------------------------

        if (action === "send") {
          if (!validUuid(input.invitation_id)) {
            return reply({ error: "Invalid invitation ID." }, 400);
          }

          const { data: invitation, error: invitationError } =
            await ctx.supabaseAdmin
              .from("member_invitations")
              .select(
                "id, organization_id, email, role, status, full_name, job_title, department_id, team_id, client_account_id, contact_type, expires_at"
              )
              .eq("organization_id", organization.id)
              .eq("id", input.invitation_id)
              .maybeSingle();

          if (invitationError || !invitation) {
            return reply({ error: "Invitation not found." }, 404);
          }

          if (invitation.status !== "pending") {
            return reply({
              error: "Only a pending invitation can be sent."
            }, 409);
          }

          if (Date.parse(invitation.expires_at) <= Date.now()) {
            await ctx.supabaseAdmin
              .from("member_invitations")
              .update({
                status: "expired",
                updated_by: actorId
              })
              .eq("id", invitation.id);

            return reply({ error: "Invitation has expired. Prepare a new one." }, 410);
          }

          const redirectBase =
            Deno.env.get("NEXUS_INVITE_REDIRECT_URL");

          if (!redirectBase) {
            return reply({
              success: false,
              code: "INVITATION_REDIRECT_NOT_CONFIGURED",
              message: "The real Nexus frontend callback URL must be configured before sending invitations."
            }, 503);
          }

          let redirectUrl: URL;

          try {
            redirectUrl = new URL(redirectBase);

            if (
              redirectUrl.protocol !== "https:" ||
              ["localhost", "127.0.0.1"].includes(redirectUrl.hostname)
            ) {
              throw new Error("HTTPS production callback required.");
            }

            redirectUrl.searchParams.set(
              "invitation_id",
              invitation.id
            );
          } catch {
            return reply({
              error: "NEXUS_INVITE_REDIRECT_URL must be a valid HTTPS production callback."
            }, 503);
          }

          // Auth Admin invitation is a privileged server-side operation.
          const { data: authInvitation, error: authError } =
            await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(
              invitation.email,
              {
                redirectTo: redirectUrl.toString(),
                data: {
                  full_name: invitation.full_name,
                  nexus_invitation_id: invitation.id,
                  nexus_organization_id: organization.id
                }
              }
            );

          if (authError || !authInvitation.user) {
            const failureCode =
              authError?.code ?? "AUTH_INVITE_FAILED";

            await ctx.supabaseAdmin
              .from("member_invitations")
              .update({
                status: "failed",
                failure_code: failureCode,
                updated_by: actorId
              })
              .eq("id", invitation.id);

            return reply({
              success: false,
              error: "Supabase Auth could not send this invitation.",
              code: failureCode,
              note: "An email address already registered with Supabase Auth needs a separate existing-account invitation flow."
            }, 409);
          }

          const { error: updateError } = await ctx.supabaseAdmin
            .from("member_invitations")
            .update({
              status: "sent",
              invited_auth_user_id: authInvitation.user.id,
              sent_at: new Date().toISOString(),
              failure_code: null,
              updated_by: actorId
            })
            .eq("id", invitation.id);

          if (updateError) {
            console.error(
              "[NEXUS] Auth invite sent, but invitation ledger update failed:",
              updateError.code
            );

            return reply({
              error: "Invitation email was requested, but its database status could not be updated. Check the invitation record before retrying."
            }, 500);
          }

          return reply({
            success: true,
            message: "Invitation email accepted by Supabase Auth.",
            invitation_id: invitation.id,
            role: invitation.role,
            delivery_status: "sent"
          });
        }

        return reply({
          error: "Unknown invitation action.",
          supported_actions: [
            "create",
            "send",
            "list",
            "cancel",
            "accept"
          ]
        }, 400);

      } catch (error) {
        console.error(
          "[NEXUS] Invitation service failure:",
          error instanceof Error ? error.message : "Unknown error"
        );

        return reply({
          error: "Invitation operation could not be completed.",
          code: "NEXUS_INVITATION_ERROR"
        }, 500);
      }
    }
  )
};
