
import { withSupabase } from "npm:@supabase/server@1";

type Data = Record<string, any>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

const clean = (value: unknown, max = 100): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const reply = (status: number, body: Data) =>
  Response.json(body, { status });

const ok = (data: unknown) =>
  reply(200, { success: true, data });

const fail = (status: number, code: string, message: string) =>
  reply(status, { success: false, code, message });

const dbFailure = (error: any) => {
  const denied =
    error?.code === "42501" ||
    String(error?.message ?? "").toLowerCase().includes("row-level security");

  return fail(
    denied ? 403 : 400,
    denied ? "PORTAL_ACCESS_DENIED" : "PORTAL_QUERY_FAILED",
    denied
      ? "Your account cannot access this portal information."
      : "The portal request could not be completed.",
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
          "Sign in to access your Davonium Nexus portal.",
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
        return fail(400, "ACTION_REQUIRED", "A portal action is required.");
      }

      const userId = ctx.userClaims.id;
      const supabase = ctx.supabase;
      const workspace =
        clean(body.organization_id, 100) ||
        "davonium-technologies";

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id,name,slug")
        .eq(isUuid(workspace) ? "id" : "slug", workspace)
        .maybeSingle();

      if (orgError) return dbFailure(orgError);

      if (!organization) {
        return fail(404, "WORKSPACE_NOT_FOUND", "Workspace not found.");
      }

      const { data: membership, error: memberError } = await supabase
        .from("organization_memberships")
        .select("role,status")
        .eq("organization_id", organization.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (memberError) return dbFailure(memberError);

      if (!membership || membership.status !== "active") {
        return fail(403, "ACTIVE_MEMBERSHIP_REQUIRED", "An active workspace membership is required.");
      }

      // =====================================================
      // CLIENT PORTAL
      // =====================================================
      if (membership.role === "client") {
        if (!["overview", "client.projects.list", "client.documents.list"].includes(action)) {
          return fail(403, "CLIENT_ACTION_NOT_ALLOWED", "This action is not available to Client accounts.");
        }

        const { data: accountLinks, error: linksError } = await supabase
          .from("client_account_memberships")
          .select("client_account_id,job_title,contact_type")
          .eq("organization_id", organization.id)
          .eq("user_id", userId)
          .eq("is_active", true);

        if (linksError) return dbFailure(linksError);

        const accountIds = [
          ...new Set((accountLinks ?? []).map((item: Data) => item.client_account_id)),
        ].filter(isUuid);

        if (accountIds.length === 0) {
          return ok({
            portal: "client",
            organization: organization.name,
            projects: [],
            milestones: [],
            shared_documents: [],
            message: "No active client-account assignment is linked to this account yet.",
          });
        }

        let projectsQuery: any = supabase
          .from("projects")
          .select("id,slug,name,description,status,progress_percent,start_date,target_date,created_at,updated_at")
          .eq("organization_id", organization.id)
          .in("client_account_id", accountIds)
          .order("updated_at", { ascending: false })
          .limit(100);

        if (action === "client.projects.list" && body.project_id !== undefined) {
          if (!isUuid(body.project_id)) {
            return fail(400, "INVALID_PROJECT_ID", "project_id must be a valid UUID.");
          }

          projectsQuery = projectsQuery.eq("id", body.project_id);
        }

        const { data: projects, error: projectsError } =
          await projectsQuery;

        if (projectsError) return dbFailure(projectsError);

        const projectIds = (projects ?? []).map((item: Data) => item.id);

        if (action === "client.projects.list") {
          return ok({
            portal: "client",
            projects: projects ?? [],
          });
        }

        if (projectIds.length === 0) {
          return ok({
            portal: "client",
            organization: organization.name,
            projects: [],
            milestones: [],
            shared_documents: [],
          });
        }

        const [milestonesResult, documentsResult] = await Promise.all([
          supabase
            .from("project_milestones")
            .select("id,project_id,title,description,status,due_date,completed_at,sort_order")
            .eq("organization_id", organization.id)
            .in("project_id", projectIds)
            .order("sort_order", { ascending: true }),

          supabase
            .from("project_documents")
            .select("id,project_id,file_name,content_type,file_size_bytes,created_at")
            .eq("organization_id", organization.id)
            .in("project_id", projectIds)
            .eq("client_visible", true)
            .eq("document_status", "active")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

        if (milestonesResult.error) return dbFailure(milestonesResult.error);
        if (documentsResult.error) return dbFailure(documentsResult.error);

        if (action === "client.documents.list") {
          return ok({
            portal: "client",
            shared_documents: documentsResult.data ?? [],
          });
        }

        return ok({
          portal: "client",
          organization: organization.name,
          projects: projects ?? [],
          milestones: milestonesResult.data ?? [],
          shared_documents: documentsResult.data ?? [],
          contact_assignments: accountLinks ?? [],
        });
      }

      // =====================================================
      // INVESTOR ROOM
      // =====================================================
      if (membership.role === "investor") {
        if (action !== "overview" && action !== "investor.updates.list") {
          return fail(403, "INVESTOR_ACTION_NOT_ALLOWED", "This action is not available to Investor accounts.");
        }

        const { data: access, error: accessError } = await supabase
          .from("investor_access")
          .select("status,granted_at")
          .eq("organization_id", organization.id)
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        if (accessError) return dbFailure(accessError);

        if (!access) {
          return fail(403, "INVESTOR_ACCESS_NOT_GRANTED", "Investor Room access has not been granted to this account.");
        }

        const { data: updates, error: updatesError } = await supabase
          .from("investor_updates")
          .select("id,title,summary,body,published_at,created_at")
          .eq("organization_id", organization.id)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(50);

        if (updatesError) return dbFailure(updatesError);

        return ok({
          portal: "investor",
          organization: organization.name,
          access_granted_at: access.granted_at,
          published_updates: updates ?? [],
          note: "Only published Investor Room updates are returned.",
        });
      }

      return fail(
        403,
        "EXTERNAL_PORTAL_ROLE_REQUIRED",
        "This endpoint is reserved for authorised Client and Investor accounts.",
      );
    },
  ),
};
