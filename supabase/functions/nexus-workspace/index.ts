
import { withSupabase } from "npm:@supabase/server@1";

console.info("[NEXUS] Workspace service initialising");

type RolePermission = {
  permission_key: string;
  is_allowed: boolean;
};

type MembershipRow = {
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  invited_by: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type MemberDetailRow = {
  user_id: string;
  job_title: string | null;
  department_id: string | null;
  team_id: string | null;
  employment_type: string;
  employment_status: string;
};

const ROLES = [
  "owner", "admin", "manager", "team",
  "designer", "developer", "investor", "client"
] as const;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reply(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function dbStatus(code?: string): number {
  if (code === "42501") return 403;
  if (code === "P0002") return 404;
  if (code === "23505") return 409;
  if (["23514", "22023", "22004", "22P02"].includes(code ?? "")) {
    return 400;
  }
  return 500;
}

function textField(
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

function validCode(value: unknown): value is string {
  return typeof value === "string"
    && /^[A-Z][A-Z0-9_-]{1,19}$/.test(value);
}

function optionalUuid(value: unknown): boolean {
  return value === undefined || value === null
    || (typeof value === "string" && UUID.test(value));
}

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },

    async (req, ctx) => {
      try {
        // Authentication boundary: publishable keys alone cannot
        // access company workspace information.
        if (ctx.authMode !== "user" || !ctx.userClaims?.id) {
          return reply({
            success: false,
            code: "USER_SESSION_REQUIRED",
            message: "Sign in to Davonium Nexus."
          }, 401);
        }

        if (req.method !== "POST") {
          return reply({ error: "Use POST." }, 405);
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

        const userId = ctx.userClaims.id;
        const action = input.action;

        if (typeof action !== "string") {
          return reply({ error: "An action is required." }, 400);
        }

        // Resolve the requested workspace through the caller's RLS client.
        let orgQuery = ctx.supabase
          .from("organizations")
          .select("id, name, slug");

        if (input.organization_id !== undefined) {
          if (
            typeof input.organization_id !== "string" ||
            !UUID.test(input.organization_id)
          ) {
            return reply({ error: "Invalid organization ID." }, 400);
          }

          orgQuery = orgQuery.eq("id", input.organization_id);
        } else {
          orgQuery = orgQuery.eq(
            "slug",
            "davonium-technologies"
          );
        }

        const { data: organization, error: orgError } =
          await orgQuery.maybeSingle();

        if (orgError || !organization) {
          return reply({
            error: "Workspace not found or not accessible."
          }, 404);
        }

        // Verify this caller's active membership.
        const { data: membership, error: membershipError } =
          await ctx.supabase
            .from("organization_memberships")
            .select("user_id, role, status")
            .eq("organization_id", organization.id)
            .eq("user_id", userId)
            .eq("status", "active")
            .maybeSingle();

        if (membershipError || !membership) {
          return reply({
            error: "An active workspace membership is required."
          }, 403);
        }

        // Load role defaults and personal overrides.
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
            error: "Unable to load workspace permissions."
          }, 500);
        }

        const roleRows =
          (roleResult.data ?? []) as RolePermission[];

        const overrideRows =
          (overrideResult.data ?? []) as RolePermission[];

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
          error: "You do not have permission for this workspace operation.",
          code: "WORKSPACE_PERMISSION_DENIED"
        }, 403);

        // Workspace service is for internal workspace members.
        if (!can("workspace.view")) return denied();

        // ----------------------------------------------------
        // ACTION: WORKSPACE OVERVIEW
        // ----------------------------------------------------

        if (action === "overview") {
          const { data: profile } = await ctx.supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", userId)
            .maybeSingle();

          const counts: Record<string, number | null> = {
            active_members: null,
            departments: null,
            teams: null,
            products: null,
            accessible_projects: null,
            accessible_tasks: null
          };

          if (can("members.view")) {
            const result = await ctx.supabase
              .from("organization_memberships")
              .select("user_id", { count: "exact", head: true })
              .eq("organization_id", organization.id)
              .eq("status", "active");

            if (result.error) return reply({
              error: "Unable to count workspace members."
            }, 500);

            counts.active_members = result.count ?? 0;
          }

          if (can("departments.view")) {
            const result = await ctx.supabase
              .from("departments")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", organization.id);

            if (result.error) return reply({
              error: "Unable to count departments."
            }, 500);

            counts.departments = result.count ?? 0;
          }

          if (can("teams.view")) {
            const result = await ctx.supabase
              .from("teams")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", organization.id);

            if (result.error) return reply({
              error: "Unable to count teams."
            }, 500);

            counts.teams = result.count ?? 0;
          }

          if (can("products.view")) {
            const result = await ctx.supabase
              .from("products")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", organization.id);

            if (result.error) return reply({
              error: "Unable to count products."
            }, 500);

            counts.products = result.count ?? 0;
          }

          if (can("projects.view")) {
            const result = await ctx.supabase
              .from("projects")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", organization.id);

            if (result.error) return reply({
              error: "Unable to count accessible projects."
            }, 500);

            counts.accessible_projects = result.count ?? 0;
          }

          if (can("tasks.view")) {
            const result = await ctx.supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", organization.id);

            if (result.error) return reply({
              error: "Unable to count accessible tasks."
            }, 500);

            counts.accessible_tasks = result.count ?? 0;
          }

          return reply({
            success: true,
            service: "nexus-workspace",
            version: "1.0.0",
            workspace: organization,
            current_user: {
              id: userId,
              display_name:
                profile?.display_name ?? "Davonium member",
              role: membership.role,
              membership_status: membership.status
            },
            counts,
            permissions: {
              total_definitions: roleRows.length,
              individual_overrides: overrideRows.length,
              active: [...roleMap.keys()].filter(
                key => can(key)
              ).length
            },
            server_time: new Date().toISOString()
          });
        }

        // ----------------------------------------------------
        // ACTION: MEMBER DIRECTORY
        // ----------------------------------------------------

        if (action === "members") {
          if (!can("members.view")) return denied();

          const { data: memberData, error } = await ctx.supabase
            .from("organization_memberships")
            .select(
              "user_id, role, status, created_at, invited_by"
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: true })
            .limit(200);

          if (error) return reply({
            error: "Unable to retrieve the member directory."
          }, 500);

          const members =
            (memberData ?? []) as MembershipRow[];

          const ids = members.map(member => member.user_id);

          if (ids.length === 0) {
            return reply({
              success: true,
              members: [],
              total: 0
            });
          }

          const { data: profileData, error: profileError } =
            await ctx.supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .in("id", ids);

          if (profileError) return reply({
            error: "Unable to retrieve member profiles."
          }, 500);

          const profiles =
            (profileData ?? []) as ProfileRow[];

          const profileMap = new Map(
            profiles.map(profile => [profile.id, profile])
          );

          let detailMap = new Map<string, MemberDetailRow>();

          if (can("member_profiles.view")) {
            const { data: detailData } = await ctx.supabase
              .from("organization_member_details")
              .select(
                "user_id, job_title, department_id, team_id, employment_type, employment_status"
              )
              .eq("organization_id", organization.id)
              .in("user_id", ids);

            const details =
              (detailData ?? []) as MemberDetailRow[];

            detailMap = new Map(
              details.map(detail => [detail.user_id, detail])
            );
          }

          return reply({
            success: true,
            total: members.length,
            members: members.map(member => ({
              user_id: member.user_id,
              display_name:
                profileMap.get(member.user_id)?.display_name
                ?? "Davonium member",
              avatar_url:
                profileMap.get(member.user_id)?.avatar_url ?? null,
              role: member.role,
              status: member.status,
              joined_at: member.created_at,
              job: detailMap.get(member.user_id) ?? null
            }))
          });
        }

        // ----------------------------------------------------
        // ACTION: DEPARTMENTS
        // ----------------------------------------------------

        if (action === "departments") {
          if (!can("departments.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("departments")
            .select("id, code, name, description, status, created_at, updated_at")
            .eq("organization_id", organization.id)
            .order("name");

          if (error) return reply({
            error: "Unable to retrieve departments."
          }, 500);

          return reply({ success: true, departments: data ?? [] });
        }

        if (action === "create_department") {
          if (!can("departments.manage")) return denied();

          const name = textField(input.name, 2, 120);
          const description =
            typeof input.description === "string"
              ? input.description.trim()
              : "";

          if (!name || !validCode(input.code) ||
              description.length > 500) {
            return reply({
              error: "Provide a valid department code, name and description."
            }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("departments")
            .insert({
              organization_id: organization.id,
              code: input.code,
              name,
              description,
              created_by: userId,
              updated_by: userId
            })
            .select("id, code, name, description, status")
            .single();

          if (error) return reply({
            error: "Department could not be created.",
            code: error.code
          }, dbStatus(error.code));

          return reply({ success: true, department: data }, 201);
        }

        if (action === "update_department") {
          if (!can("departments.manage")) return denied();

          if (typeof input.department_id !== "string" ||
              !UUID.test(input.department_id)) {
            return reply({ error: "A valid department ID is required." }, 400);
          }

          const patch: Record<string, unknown> = {
            updated_by: userId
          };

          if ("code" in input) {
            if (!validCode(input.code)) {
              return reply({ error: "Invalid department code." }, 400);
            }
            patch.code = input.code;
          }

          if ("name" in input) {
            const name = textField(input.name, 2, 120);
            if (!name) return reply({ error: "Invalid department name." }, 400);
            patch.name = name;
          }

          if ("description" in input) {
            if (typeof input.description !== "string" ||
                input.description.length > 500) {
              return reply({ error: "Invalid department description." }, 400);
            }
            patch.description = input.description.trim();
          }

          if ("status" in input) {
            if (!["active", "inactive"].includes(String(input.status))) {
              return reply({ error: "Invalid department status." }, 400);
            }
            patch.status = input.status;
          }

          if (Object.keys(patch).length === 1) {
            return reply({ error: "No department changes supplied." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("departments")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("id", input.department_id)
            .select("id, code, name, description, status")
            .maybeSingle();

          if (error) return reply({
            error: "Department update failed.",
            code: error.code
          }, dbStatus(error.code));

          if (!data) return reply({
            error: "Department not found or not authorised."
          }, 404);

          return reply({ success: true, department: data });
        }

        // ----------------------------------------------------
        // ACTION: TEAMS
        // ----------------------------------------------------

        if (action === "teams") {
          if (!can("teams.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("teams")
            .select("id, department_id, code, name, description, status, created_at")
            .eq("organization_id", organization.id)
            .order("name");

          if (error) return reply({
            error: "Unable to retrieve teams."
          }, 500);

          return reply({ success: true, teams: data ?? [] });
        }

        if (action === "create_team") {
          if (!can("teams.manage")) return denied();

          if (
            typeof input.department_id !== "string" ||
            !UUID.test(input.department_id)
          ) {
            return reply({ error: "A valid department ID is required." }, 400);
          }

          const name = textField(input.name, 2, 120);
          const description =
            typeof input.description === "string"
              ? input.description.trim()
              : "";

          if (!name || !validCode(input.code) ||
              description.length > 500) {
            return reply({
              error: "Provide a valid team code, name and description."
            }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("teams")
            .insert({
              organization_id: organization.id,
              department_id: input.department_id,
              code: input.code,
              name,
              description,
              created_by: userId,
              updated_by: userId
            })
            .select("id, department_id, code, name, description, status")
            .single();

          if (error) return reply({
            error: "Team could not be created.",
            code: error.code
          }, dbStatus(error.code));

          return reply({ success: true, team: data }, 201);
        }

        if (action === "update_team") {
          if (!can("teams.manage")) return denied();

          if (typeof input.team_id !== "string" ||
              !UUID.test(input.team_id)) {
            return reply({ error: "A valid team ID is required." }, 400);
          }

          const patch: Record<string, unknown> = {
            updated_by: userId
          };

          if ("department_id" in input) {
            if (!optionalUuid(input.department_id)) {
              return reply({ error: "Invalid department ID." }, 400);
            }
            patch.department_id = input.department_id;
          }

          if ("code" in input) {
            if (!validCode(input.code)) {
              return reply({ error: "Invalid team code." }, 400);
            }
            patch.code = input.code;
          }

          if ("name" in input) {
            const name = textField(input.name, 2, 120);
            if (!name) return reply({ error: "Invalid team name." }, 400);
            patch.name = name;
          }

          if ("description" in input) {
            if (typeof input.description !== "string" ||
                input.description.length > 500) {
              return reply({ error: "Invalid team description." }, 400);
            }
            patch.description = input.description.trim();
          }

          if ("status" in input) {
            if (!["active", "inactive"].includes(String(input.status))) {
              return reply({ error: "Invalid team status." }, 400);
            }
            patch.status = input.status;
          }

          if (Object.keys(patch).length === 1) {
            return reply({ error: "No team changes supplied." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("teams")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("id", input.team_id)
            .select("id, department_id, code, name, description, status")
            .maybeSingle();

          if (error) return reply({
            error: "Team update failed.",
            code: error.code
          }, dbStatus(error.code));

          if (!data) return reply({
            error: "Team not found or not authorised."
          }, 404);

          return reply({ success: true, team: data });
        }

        // ----------------------------------------------------
        // ACTION: MEMBER WORK PROFILE
        // Job title is separate from the person's Nexus role.
        // ----------------------------------------------------

        if (action === "set_member_details") {
          if (!can("member_profiles.manage")) return denied();

          if (typeof input.user_id !== "string" ||
              !UUID.test(input.user_id)) {
            return reply({ error: "A valid member user ID is required." }, 400);
          }

          const jobTitle =
            input.job_title === null
              ? null
              : textField(input.job_title, 2, 100);

          if (input.job_title !== undefined &&
              input.job_title !== null && !jobTitle) {
            return reply({ error: "Invalid job title." }, 400);
          }

          const bio =
            typeof input.bio === "string" ? input.bio : "";

          if (bio.length > 1200) {
            return reply({ error: "Bio must not exceed 1,200 characters." }, 400);
          }

          if (!optionalUuid(input.department_id) ||
              !optionalUuid(input.team_id)) {
            return reply({ error: "Invalid department or team ID." }, 400);
          }

          const employmentTypes = [
            "employee", "contractor", "intern", "advisor", "external"
          ];

          const employmentStatuses = [
            "active", "on_leave", "inactive"
          ];

          const employmentType =
            input.employment_type ?? "employee";

          const employmentStatus =
            input.employment_status ?? "active";

          if (!employmentTypes.includes(String(employmentType)) ||
              !employmentStatuses.includes(String(employmentStatus))) {
            return reply({ error: "Invalid employment classification." }, 400);
          }

          const { error } = await ctx.supabase.rpc(
            "nexus_set_member_details",
            {
              p_organization_id: organization.id,
              p_user_id: input.user_id,
              p_job_title: jobTitle,
              p_department_id: input.department_id ?? null,
              p_team_id: input.team_id ?? null,
              p_employment_type: employmentType,
              p_employment_status: employmentStatus,
              p_start_date: input.start_date ?? null,
              p_bio: bio
            }
          );

          if (error) return reply({
            error: "Member work profile could not be updated.",
            code: error.code
          }, dbStatus(error.code));

          return reply({
            success: true,
            message: "Member work profile updated."
          });
        }

        // ----------------------------------------------------
        // ACTION: CHANGE MEMBER ROLE
        // The existing database RPC protects Owner privileges.
        // ----------------------------------------------------

        if (action === "set_member_role") {
          if (!can("members.permissions.manage")) return denied();

          if (typeof input.user_id !== "string" ||
              !UUID.test(input.user_id) ||
              typeof input.role !== "string" ||
              !ROLES.includes(input.role as typeof ROLES[number])) {
            return reply({ error: "Invalid member or role." }, 400);
          }

          const { error } = await ctx.supabase.rpc(
            "nexus_set_member_role",
            {
              p_organization_id: organization.id,
              p_user_id: input.user_id,
              p_new_role: input.role
            }
          );

          if (error) return reply({
            error: "Member role change was rejected.",
            code: error.code
          }, dbStatus(error.code));

          return reply({
            success: true,
            message: "Member role updated."
          });
        }

        // ----------------------------------------------------
        // ACTION: SUSPEND OR REVOKE MEMBER ACCESS
        // The database protects the last active Owner.
        // ----------------------------------------------------

        if (action === "set_member_status") {
          if (!can("members.manage")) return denied();

          if (typeof input.user_id !== "string" ||
              !UUID.test(input.user_id) ||
              !["active", "suspended", "revoked"].includes(String(input.status))) {
            return reply({ error: "Invalid member or status." }, 400);
          }

          const { error } = await ctx.supabase.rpc(
            "nexus_set_member_status",
            {
              p_organization_id: organization.id,
              p_user_id: input.user_id,
              p_new_status: input.status
            }
          );

          if (error) return reply({
            error: "Member access change was rejected.",
            code: error.code
          }, dbStatus(error.code));

          return reply({
            success: true,
            message: "Member access status updated."
          });
        }

        // ----------------------------------------------------
        // ACTION: INVITATION HISTORY
        // This reads invitation records; sending email is a
        // separate trusted invitation service.
        // ----------------------------------------------------

        if (action === "invitations") {
          if (!can("invitations.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("member_invitations")
            .select(
              "id, email, role, status, full_name, job_title, created_at, sent_at, expires_at, accepted_at"
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) return reply({
            error: "Unable to retrieve invitation history."
          }, 500);

          return reply({
            success: true,
            invitations: data ?? []
          });
        }

        // ----------------------------------------------------
        // ACTION: CLIENT ACCOUNTS
        // ----------------------------------------------------

        if (action === "client_accounts") {
          if (!can("client_accounts.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("client_accounts")
            .select("id, client_code, account_name, status, created_at")
            .eq("organization_id", organization.id)
            .order("account_name");

          if (error) return reply({
            error: "Unable to retrieve client accounts."
          }, 500);

          return reply({
            success: true,
            client_accounts: data ?? []
          });
        }

        if (action === "create_client_account") {
          if (!can("client_accounts.manage")) return denied();

          const accountName = textField(input.account_name, 2, 180);

          if (
            !accountName ||
            typeof input.client_code !== "string" ||
            !/^CL-[0-9]{4,}$/.test(input.client_code)
          ) {
            return reply({
              error: "Provide a company name and a valid CL-0001 style client code."
            }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("client_accounts")
            .insert({
              organization_id: organization.id,
              client_code: input.client_code,
              account_name: accountName,
              status: "active",
              notes: typeof input.notes === "string"
                ? input.notes.slice(0, 3000)
                : "",
              created_by: userId
            })
            .select("id, client_code, account_name, status, created_at")
            .single();

          if (error) return reply({
            error: "Client account could not be created.",
            code: error.code
          }, dbStatus(error.code));

          return reply({
            success: true,
            client_account: data
          }, 201);
        }

        if (action === "update_client_account") {
          if (!can("client_accounts.manage")) return denied();

          if (typeof input.client_account_id !== "string" ||
              !UUID.test(input.client_account_id)) {
            return reply({ error: "Invalid client account ID." }, 400);
          }

          const patch: Record<string, unknown> = {};

          if ("account_name" in input) {
            const name = textField(input.account_name, 2, 180);
            if (!name) return reply({ error: "Invalid client company name." }, 400);
            patch.account_name = name;
          }

          if ("status" in input) {
            if (!["active", "paused", "closed"].includes(String(input.status))) {
              return reply({ error: "Invalid client account status." }, 400);
            }
            patch.status = input.status;
          }

          if ("notes" in input) {
            if (typeof input.notes !== "string" ||
                input.notes.length > 3000) {
              return reply({ error: "Client notes are too long." }, 400);
            }
            patch.notes = input.notes;
          }

          if ("client_code" in input) {
            if (typeof input.client_code !== "string" ||
                !/^CL-[0-9]{4,}$/.test(input.client_code)) {
              return reply({ error: "Invalid client code." }, 400);
            }
            patch.client_code = input.client_code;
          }

          if (Object.keys(patch).length === 0) {
            return reply({ error: "No client account changes supplied." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("client_accounts")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("id", input.client_account_id)
            .select("id, client_code, account_name, status")
            .maybeSingle();

          if (error) return reply({
            error: "Client account update failed.",
            code: error.code
          }, dbStatus(error.code));

          if (!data) return reply({
            error: "Client account not found or not authorised."
          }, 404);

          return reply({ success: true, client_account: data });
        }

        return reply({
          error: "Unknown workspace action.",
          supported_actions: [
            "overview",
            "members",
            "departments",
            "create_department",
            "update_department",
            "teams",
            "create_team",
            "update_team",
            "set_member_details",
            "set_member_role",
            "set_member_status",
            "invitations",
            "client_accounts",
            "create_client_account",
            "update_client_account"
          ]
        }, 400);

      } catch (error) {
        console.error(
          "[NEXUS] Workspace service failure:",
          error instanceof Error ? error.message : "Unknown error"
        );

        return reply({
          error: "Workspace service could not complete the request.",
          code: "NEXUS_WORKSPACE_ERROR"
        }, 500);
      }
    }
  )
};
