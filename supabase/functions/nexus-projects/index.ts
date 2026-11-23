
import { withSupabase } from "npm:@supabase/server@1";

console.info("[NEXUS] Project operations service starting");

type RolePermission = {
  permission_key: string;
  is_allowed: boolean;
};

type ProjectStatus =
  | "planned"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

type MilestoneStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "blocked";

type TaskStatus = "todo" | "doing" | "done";
type TaskPriority = "low" | "normal" | "high" | "urgent";

type TaskRow = {
  id: string;
  project_id: string;
  assigned_to: string | null;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROJECT_STATUSES: ProjectStatus[] = [
  "planned", "active", "on_hold", "completed", "archived"
];

const MILESTONE_STATUSES: MilestoneStatus[] = [
  "planned", "in_progress", "completed", "blocked"
];

const TASK_STATUSES: TaskStatus[] = [
  "todo", "doing", "done"
];

const TASK_PRIORITIES: TaskPriority[] = [
  "low", "normal", "high", "urgent"
];

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

function validDate(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && !Number.isNaN(Date.parse(value));
}

function uuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },

    async (req, ctx) => {
      try {
        // 1. Require a verified user.
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

        // 2. Resolve workspace and active membership.
        let orgQuery = ctx.supabase
          .from("organizations")
          .select("id, name, slug");

        if (input.organization_id !== undefined) {
          if (!uuid(input.organization_id)) {
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

        const { data: membership, error: membershipError } =
          await ctx.supabase
            .from("organization_memberships")
            .select("role, status")
            .eq("organization_id", organization.id)
            .eq("user_id", userId)
            .eq("status", "active")
            .maybeSingle();

        if (membershipError || !membership) {
          return reply({
            error: "An active workspace membership is required."
          }, 403);
        }

        // 3. Resolve effective permissions:
        // individual overrides take precedence over role defaults.
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
            error: "Unable to load project permissions."
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
          error: "You are not authorised for this project operation.",
          code: "PROJECT_PERMISSION_DENIED"
        }, 403);

        // ----------------------------------------------------
        // ACTION: LIST PROJECTS
        // Clients see only their specifically linked projects.
        // Other internal roles remain subject to project membership.
        // ----------------------------------------------------

        if (action === "list_projects") {
          if (!can("projects.view") && !can("client_portal.view")) {
            return denied();
          }

          const { data, error } = await ctx.supabase
            .from("projects")
            .select(
              "id, slug, name, description, status, progress_percent, start_date, target_date, client_account_id, created_by, created_at, updated_at"
            )
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) return reply({
            error: "Unable to retrieve accessible projects."
          }, 500);

          return reply({
            success: true,
            total: data?.length ?? 0,
            projects: data ?? []
          });
        }

        // ----------------------------------------------------
        // ACTION: CREATE PROJECT
        // The database trigger makes the creator a project lead.
        // ----------------------------------------------------

        if (action === "create_project") {
          if (!can("projects.create")) return denied();

          const name = textField(input.name, 3, 160);
          const description =
            typeof input.description === "string"
              ? input.description
              : "";

          if (!name || description.length > 5000) {
            return reply({
              error: "Provide a valid project name and description."
            }, 400);
          }

          if (
            typeof input.slug !== "string" ||
            !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug) ||
            input.slug.length > 100
          ) {
            return reply({
              error: "Project slug must use lowercase letters, numbers and hyphens."
            }, 400);
          }

          if (
            input.start_date != null &&
            !validDate(input.start_date)
          ) {
            return reply({ error: "Invalid project start date." }, 400);
          }

          if (
            input.target_date != null &&
            !validDate(input.target_date)
          ) {
            return reply({ error: "Invalid project target date." }, 400);
          }

          if (
            input.start_date &&
            input.target_date &&
            Date.parse(input.target_date as string) <
              Date.parse(input.start_date as string)
          ) {
            return reply({
              error: "The target date cannot precede the start date."
            }, 400);
          }

          if (
            input.client_account_id != null &&
            !uuid(input.client_account_id)
          ) {
            return reply({ error: "Invalid client account ID." }, 400);
          }

          if (
            input.client_account_id != null &&
            !can("client_accounts.view")
          ) {
            return denied();
          }

          const { data, error } = await ctx.supabase
            .from("projects")
            .insert({
              organization_id: organization.id,
              slug: input.slug,
              name,
              description,
              status: "planned",
              progress_percent: 0,
              start_date: input.start_date ?? null,
              target_date: input.target_date ?? null,
              client_account_id: input.client_account_id ?? null,
              created_by: userId
            })
            .select(
              "id, slug, name, description, status, progress_percent, start_date, target_date, client_account_id, created_at"
            )
            .single();

          if (error) return reply({
            error: "Project could not be created.",
            code: error.code
          }, dbStatus(error.code));

          return reply({
            success: true,
            project: data,
            message: "Project created. The creator is assigned as its initial lead."
          }, 201);
        }

        // All remaining project-specific actions need a project ID.
        const needsProjectId = [
          "get_project",
          "update_project",
          "project_members",
          "assign_project_member",
          "remove_project_member",
          "list_milestones",
          "create_milestone",
          "update_milestone",
          "list_tasks",
          "create_task",
          "update_task",
          "list_task_comments",
          "add_task_comment",
          "list_project_decisions",
          "add_project_decision"
        ];

        if (needsProjectId.includes(action)) {
          if (!uuid(input.project_id)) {
            return reply({ error: "A valid project ID is required." }, 400);
          }
        }

        const projectId =
          typeof input.project_id === "string"
            ? input.project_id
            : null;

        // ----------------------------------------------------
        // ACTION: GET PROJECT DETAILS
        // ----------------------------------------------------

        if (action === "get_project") {
          if (!can("projects.view") && !can("client_portal.view")) {
            return denied();
          }

          const { data, error } = await ctx.supabase
            .from("projects")
            .select(
              "id, organization_id, slug, name, description, status, progress_percent, start_date, target_date, client_account_id, created_by, created_at, updated_at"
            )
            .eq("organization_id", organization.id)
            .eq("id", projectId)
            .maybeSingle();

          if (error) return reply({
            error: "Unable to retrieve project."
          }, 500);

          if (!data) return reply({
            error: "Project not found or not accessible."
          }, 404);

          return reply({ success: true, project: data });
        }

        // ----------------------------------------------------
        // ACTION: UPDATE PROJECT
        // ----------------------------------------------------

        if (action === "update_project") {
          if (!can("projects.manage")) return denied();

          const patch: Record<string, unknown> = {};

          if ("name" in input) {
            const name = textField(input.name, 3, 160);
            if (!name) return reply({ error: "Invalid project name." }, 400);
            patch.name = name;
          }

          if ("slug" in input) {
            if (
              typeof input.slug !== "string" ||
              !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug) ||
              input.slug.length > 100
            ) {
              return reply({ error: "Invalid project slug." }, 400);
            }
            patch.slug = input.slug;
          }

          if ("description" in input) {
            if (typeof input.description !== "string" ||
                input.description.length > 5000) {
              return reply({ error: "Invalid project description." }, 400);
            }
            patch.description = input.description;
          }

          if ("status" in input) {
            if (!PROJECT_STATUSES.includes(input.status as ProjectStatus)) {
              return reply({ error: "Invalid project status." }, 400);
            }
            patch.status = input.status;
          }

          if ("progress_percent" in input) {
            if (
              typeof input.progress_percent !== "number" ||
              !Number.isInteger(input.progress_percent) ||
              input.progress_percent < 0 ||
              input.progress_percent > 100
            ) {
              return reply({
                error: "Project progress must be an integer from 0 to 100."
              }, 400);
            }
            patch.progress_percent = input.progress_percent;
          }

          for (const field of ["start_date", "target_date"] as const) {
            if (field in input) {
              if (
                input[field] !== null &&
                !validDate(input[field])
              ) {
                return reply({ error: `Invalid ${field}.` }, 400);
              }
              patch[field] = input[field];
            }
          }

          if ("client_account_id" in input) {
            if (
              input.client_account_id !== null &&
              !uuid(input.client_account_id)
            ) {
              return reply({ error: "Invalid client account ID." }, 400);
            }

            if (
              input.client_account_id !== null &&
              !can("client_accounts.view")
            ) {
              return denied();
            }

            patch.client_account_id = input.client_account_id;
          }

          if (Object.keys(patch).length === 0) {
            return reply({ error: "No project changes supplied." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("projects")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("id", projectId)
            .select(
              "id, slug, name, description, status, progress_percent, start_date, target_date, client_account_id, updated_at"
            )
            .maybeSingle();

          if (error) return reply({
            error: "Project update failed.",
            code: error.code
          }, dbStatus(error.code));

          if (!data) return reply({
            error: "Project not found or you are not its authorised lead."
          }, 404);

          return reply({ success: true, project: data });
        }

        // ----------------------------------------------------
        // ACTION: PROJECT MEMBERS
        // ----------------------------------------------------

        if (action === "project_members") {
          if (!can("projects.view") && !can("projects.members.manage")) {
            return denied();
          }

          const { data, error } = await ctx.supabase
            .from("project_members")
            .select("user_id, project_role, added_by, added_at")
            .eq("organization_id", organization.id)
            .eq("project_id", projectId)
            .order("added_at");

          if (error) return reply({
            error: "Unable to retrieve project members."
          }, 500);

          return reply({
            success: true,
            members: data ?? []
          });
        }

        // ----------------------------------------------------
        // ACTION: ASSIGN PROJECT MEMBER
        // Existing database RPC enforces membership and lead rules.
        // ----------------------------------------------------

        if (action === "assign_project_member") {
          if (!can("projects.members.manage")) return denied();

          if (
            !uuid(input.user_id) ||
            !["lead", "member", "viewer"].includes(String(input.project_role))
          ) {
            return reply({
              error: "Provide a valid member ID and project role."
            }, 400);
          }

          const { error } = await ctx.supabase.rpc(
            "nexus_set_project_member",
            {
              p_organization_id: organization.id,
              p_project_id: projectId,
              p_user_id: input.user_id,
              p_project_role: input.project_role
            }
          );

          if (error) return reply({
            error: "Project member assignment was rejected.",
            code: error.code
          }, dbStatus(error.code));

          return reply({
            success: true,
            message: "Project member assigned."
          });
        }

        // ----------------------------------------------------
        // ACTION: REMOVE PROJECT MEMBER
        // Existing database RPC protects the last project lead.
        // ----------------------------------------------------

        if (action === "remove_project_member") {
          if (!can("projects.members.manage")) return denied();

          if (!uuid(input.user_id)) {
            return reply({ error: "A valid member ID is required." }, 400);
          }

          const { error } = await ctx.supabase.rpc(
            "nexus_remove_project_member",
            {
              p_organization_id: organization.id,
              p_project_id: projectId,
              p_user_id: input.user_id
            }
          );

          if (error) return reply({
            error: "Project member removal was rejected.",
            code: error.code
          }, dbStatus(error.code));

          return reply({
            success: true,
            message: "Project member removed."
          });
        }

        // ----------------------------------------------------
        // ACTION: LIST MILESTONES
        // Clients may read milestones only through client portal RLS.
        // ----------------------------------------------------

        if (action === "list_milestones") {
          if (!can("milestones.view") && !can("client_portal.view")) {
            return denied();
          }

          const { data, error } = await ctx.supabase
            .from("project_milestones")
            .select(
              "id, title, description, status, due_date, completed_at, sort_order, created_at, updated_at"
            )
            .eq("organization_id", organization.id)
            .eq("project_id", projectId)
            .order("sort_order")
            .order("due_date");

          if (error) return reply({
            error: "Unable to retrieve project milestones."
          }, 500);

          return reply({
            success: true,
            milestones: data ?? []
          });
        }

        // ----------------------------------------------------
        // ACTION: CREATE MILESTONE
        // ----------------------------------------------------

        if (action === "create_milestone") {
          if (!can("milestones.manage")) return denied();

          const title = textField(input.title, 2, 180);
          const description =
            typeof input.description === "string"
              ? input.description
              : "";

          if (!title || description.length > 5000) {
            return reply({
              error: "Provide a valid milestone title and description."
            }, 400);
          }

          if (
            input.due_date != null &&
            !validDate(input.due_date)
          ) {
            return reply({ error: "Invalid milestone due date." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("project_milestones")
            .insert({
              organization_id: organization.id,
              project_id: projectId,
              title,
              description,
              status: "planned",
              due_date: input.due_date ?? null,
              sort_order:
                Number.isInteger(input.sort_order)
                  ? input.sort_order
                  : 0,
              created_by: userId
            })
            .select(
              "id, title, description, status, due_date, sort_order, created_at"
            )
            .single();

          if (error) return reply({
            error: "Milestone could not be created.",
            code: error.code
          }, dbStatus(error.code));

          return reply({ success: true, milestone: data }, 201);
        }

        // ----------------------------------------------------
        // ACTION: UPDATE MILESTONE
        // ----------------------------------------------------

        if (action === "update_milestone") {
          if (!can("milestones.manage")) return denied();

          if (!uuid(input.milestone_id)) {
            return reply({ error: "A valid milestone ID is required." }, 400);
          }

          const patch: Record<string, unknown> = {};

          if ("title" in input) {
            const title = textField(input.title, 2, 180);
            if (!title) return reply({ error: "Invalid milestone title." }, 400);
            patch.title = title;
          }

          if ("description" in input) {
            if (typeof input.description !== "string" ||
                input.description.length > 5000) {
              return reply({ error: "Invalid milestone description." }, 400);
            }
            patch.description = input.description;
          }

          if ("status" in input) {
            if (!MILESTONE_STATUSES.includes(input.status as MilestoneStatus)) {
              return reply({ error: "Invalid milestone status." }, 400);
            }

            patch.status = input.status;
            patch.completed_at =
              input.status === "completed"
                ? new Date().toISOString()
                : null;
          }

          if ("due_date" in input) {
            if (input.due_date !== null && !validDate(input.due_date)) {
              return reply({ error: "Invalid milestone due date." }, 400);
            }
            patch.due_date = input.due_date;
          }

          if ("sort_order" in input) {
            if (!Number.isInteger(input.sort_order)) {
              return reply({ error: "Invalid milestone sort order." }, 400);
            }
            patch.sort_order = input.sort_order;
          }

          if (Object.keys(patch).length === 0) {
            return reply({ error: "No milestone changes supplied." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("project_milestones")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("project_id", projectId)
            .eq("id", input.milestone_id)
            .select(
              "id, title, description, status, due_date, completed_at, sort_order"
            )
            .maybeSingle();

          if (error) return reply({
            error: "Milestone update failed.",
            code: error.code
          }, dbStatus(error.code));

          if (!data) return reply({
            error: "Milestone not found or not authorised."
          }, 404);

          return reply({ success: true, milestone: data });
        }

        // ----------------------------------------------------
        // ACTION: LIST TASKS
        // ----------------------------------------------------

        if (action === "list_tasks") {
          if (!can("tasks.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("tasks")
            .select(
              "id, title, description, status, priority, assigned_to, due_at, sort_order, created_by, created_at, updated_at"
            )
            .eq("organization_id", organization.id)
            .eq("project_id", projectId)
            .order("sort_order")
            .order("created_at");

          if (error) return reply({
            error: "Unable to retrieve project tasks."
          }, 500);

          return reply({
            success: true,
            tasks: data ?? []
          });
        }

        // ----------------------------------------------------
        // ACTION: CREATE TASK
        // Assignment is deliberately separate until its
        // dedicated database-controlled assignment operation exists.
        // ----------------------------------------------------

        if (action === "create_task") {
          if (!can("tasks.create")) return denied();

          if ("assigned_to" in input) {
            return reply({
              error: "Task assignment is not enabled in this operation yet."
            }, 400);
          }

          const title = textField(input.title, 2, 180);
          const description =
            typeof input.description === "string"
              ? input.description
              : "";

          if (!title || description.length > 5000) {
            return reply({
              error: "Provide a valid task title and description."
            }, 400);
          }

          const priority =
            input.priority ?? "normal";

          if (!TASK_PRIORITIES.includes(priority as TaskPriority)) {
            return reply({ error: "Invalid task priority." }, 400);
          }

          if (
            input.due_at != null &&
            !validTimestamp(input.due_at)
          ) {
            return reply({ error: "Invalid task deadline." }, 400);
          }

          const sortOrder =
            input.sort_order === undefined ? 0 : input.sort_order;

          if (!Number.isInteger(sortOrder)) {
            return reply({ error: "Invalid task sort order." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("tasks")
            .insert({
              organization_id: organization.id,
              project_id: projectId,
              title,
              description,
              status: "todo",
              priority,
              due_at: input.due_at ?? null,
              sort_order: sortOrder,
              created_by: userId
            })
            .select(
              "id, title, description, status, priority, due_at, sort_order, created_at"
            )
            .single();

          if (error) return reply({
            error: "Task could not be created.",
            code: error.code
          }, dbStatus(error.code));

          return reply({ success: true, task: data }, 201);
        }

        // ----------------------------------------------------
        // ACTION: UPDATE TASK
        // Managers can update allowed task fields.
        // An assigned person can update status only.
        // ----------------------------------------------------

        if (action === "update_task") {
          if (!uuid(input.task_id)) {
            return reply({ error: "A valid task ID is required." }, 400);
          }

          const { data: taskData, error: taskError } =
            await ctx.supabase
              .from("tasks")
              .select("id, project_id, assigned_to")
              .eq("organization_id", organization.id)
              .eq("project_id", projectId)
              .eq("id", input.task_id)
              .maybeSingle();

          if (taskError || !taskData) {
            return reply({
              error: "Task not found or not accessible."
            }, 404);
          }

          const task = taskData as TaskRow;
          const canManageTasks = can("tasks.manage");

          const isAssignedSelf =
            task.assigned_to === userId &&
            can("tasks.update_assigned");

          if (!canManageTasks && !isAssignedSelf) {
            return denied();
          }

          const patch: Record<string, unknown> = {};

          if ("status" in input) {
            if (!TASK_STATUSES.includes(input.status as TaskStatus)) {
              return reply({ error: "Invalid task status." }, 400);
            }
            patch.status = input.status;
          }

          // Non-managers are restricted to status changes.
          if (!canManageTasks) {
            const allowedKeys = ["action", "organization_id", "project_id", "task_id", "status"];

            const extraKeys = Object.keys(input).filter(
              key => !allowedKeys.includes(key)
            );

            if (extraKeys.length > 0 || !("status" in input)) {
              return reply({
                error: "Assigned members may update task status only."
              }, 403);
            }
          } else {
            if ("title" in input) {
              const title = textField(input.title, 2, 180);
              if (!title) return reply({ error: "Invalid task title." }, 400);
              patch.title = title;
            }

            if ("description" in input) {
              if (typeof input.description !== "string" ||
                  input.description.length > 5000) {
                return reply({ error: "Invalid task description." }, 400);
              }
              patch.description = input.description;
            }

            if ("priority" in input) {
              if (!TASK_PRIORITIES.includes(input.priority as TaskPriority)) {
                return reply({ error: "Invalid task priority." }, 400);
              }
              patch.priority = input.priority;
            }

            if ("due_at" in input) {
              if (input.due_at !== null && !validTimestamp(input.due_at)) {
                return reply({ error: "Invalid task deadline." }, 400);
              }
              patch.due_at = input.due_at;
            }

            if ("sort_order" in input) {
              if (!Number.isInteger(input.sort_order)) {
                return reply({ error: "Invalid task sort order." }, 400);
              }
              patch.sort_order = input.sort_order;
            }
          }

          if (Object.keys(patch).length === 0) {
            return reply({ error: "No task changes supplied." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("tasks")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("project_id", projectId)
            .eq("id", input.task_id)
            .select(
              "id, title, description, status, priority, due_at, sort_order, updated_at"
            )
            .maybeSingle();

          if (error) return reply({
            error: "Task update failed.",
            code: error.code
          }, dbStatus(error.code));

          if (!data) return reply({
            error: "Task update was not authorised."
          }, 403);

          return reply({ success: true, task: data });
        }

        // ----------------------------------------------------
        // ACTION: LIST TASK COMMENTS
        // ----------------------------------------------------

        if (action === "list_task_comments") {
          if (!can("task_comments.view")) return denied();

          if (!uuid(input.task_id)) {
            return reply({ error: "A valid task ID is required." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("project_task_comments")
            .select("id, task_id, body, created_by, created_at")
            .eq("organization_id", organization.id)
            .eq("project_id", projectId)
            .eq("task_id", input.task_id)
            .order("created_at");

          if (error) return reply({
            error: "Unable to retrieve task comments."
          }, 500);

          return reply({ success: true, comments: data ?? [] });
        }

        // ----------------------------------------------------
        // ACTION: ADD TASK COMMENT
        // ----------------------------------------------------

        if (action === "add_task_comment") {
          if (!can("task_comments.create")) return denied();

          if (!uuid(input.task_id)) {
            return reply({ error: "A valid task ID is required." }, 400);
          }

          const body = textField(input.body, 1, 5000);

          if (!body) {
            return reply({ error: "Comment must contain 1–5,000 characters." }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("project_task_comments")
            .insert({
              organization_id: organization.id,
              project_id: projectId,
              task_id: input.task_id,
              body,
              created_by: userId
            })
            .select("id, task_id, body, created_by, created_at")
            .single();

          if (error) return reply({
            error: "Comment could not be added.",
            code: error.code
          }, dbStatus(error.code));

          return reply({ success: true, comment: data }, 201);
        }

        // ----------------------------------------------------
        // ACTION: LIST PROJECT DECISIONS
        // ----------------------------------------------------

        if (action === "list_project_decisions") {
          if (!can("project_decisions.view")) return denied();

          const { data, error } = await ctx.supabase
            .from("project_decisions")
            .select(
              "id, title, context, decision_text, rationale, decision_status, decided_at, created_by"
            )
            .eq("organization_id", organization.id)
            .eq("project_id", projectId)
            .order("decided_at", { ascending: false });

          if (error) return reply({
            error: "Unable to retrieve project decisions."
          }, 500);

          return reply({
            success: true,
            decisions: data ?? []
          });
        }

        // ----------------------------------------------------
        // ACTION: RECORD PROJECT DECISION
        // Decisions are recorded, not silently overwritten.
        // ----------------------------------------------------

        if (action === "add_project_decision") {
          if (!can("project_decisions.manage")) return denied();

          const title = textField(input.title, 3, 180);
          const decisionText =
            textField(input.decision_text, 3, 8000);

          const context =
            typeof input.context === "string" ? input.context : "";

          const rationale =
            typeof input.rationale === "string" ? input.rationale : "";

          if (!title || !decisionText ||
              context.length > 5000 || rationale.length > 5000) {
            return reply({
              error: "Provide a valid decision title, text, context and rationale."
            }, 400);
          }

          const { data, error } = await ctx.supabase
            .from("project_decisions")
            .insert({
              organization_id: organization.id,
              project_id: projectId,
              title,
              context,
              decision_text: decisionText,
              rationale,
              created_by: userId
            })
            .select(
              "id, title, context, decision_text, rationale, decision_status, decided_at"
            )
            .single();

          if (error) return reply({
            error: "Project decision could not be recorded.",
            code: error.code
          }, dbStatus(error.code));

          return reply({ success: true, decision: data }, 201);
        }

        return reply({
          error: "Unknown project operation.",
          supported_actions: [
            "list_projects",
            "create_project",
            "get_project",
            "update_project",
            "project_members",
            "assign_project_member",
            "remove_project_member",
            "list_milestones",
            "create_milestone",
            "update_milestone",
            "list_tasks",
            "create_task",
            "update_task",
            "list_task_comments",
            "add_task_comment",
            "list_project_decisions",
            "add_project_decision"
          ]
        }, 400);

      } catch (error) {
        console.error(
          "[NEXUS] Project operations failure:",
          error instanceof Error ? error.message : "Unknown error"
        );

        return reply({
          error: "Project operation could not be completed.",
          code: "NEXUS_PROJECT_OPERATION_ERROR"
        }, 500);
      }
    }
  )
};
