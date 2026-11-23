
import { withSupabase } from "npm:@supabase/server@1";

type Data = Record<string, any>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const clean = (v: unknown, max = 20000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && UUID.test(v);

const reply = (status: number, body: Data) =>
  Response.json(body, { status });

const ok = (data: unknown) =>
  reply(200, { success: true, data });

const fail = (status: number, code: string, message: string) =>
  reply(status, { success: false, code, message });

const dbError = (error: any) => {
  const denied =
    error?.code === "42501" ||
    String(error?.message ?? "").toLowerCase().includes("row-level security") ||
    String(error?.message ?? "").toLowerCase().includes("permission denied");

  return fail(
    denied ? 403 : 400,
    denied ? "CONTENT_PERMISSION_DENIED" : "CONTENT_DATABASE_ERROR",
    denied
      ? "Your account is not authorised to access or change this content."
      : "The content request could not be completed.",
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
          "Sign in to manage Davonium Nexus company content.",
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
        return fail(400, "ACTION_REQUIRED", "A content action is required.");
      }

      const supabase = ctx.supabase;
      const actorId = ctx.userClaims.id;
      const workspace = clean(body.organization_id, 100) ||
        "davonium-technologies";

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id,name,slug")
        .eq(isUuid(workspace) ? "id" : "slug", workspace)
        .maybeSingle();

      if (orgError) return dbError(orgError);
      if (!organization) return fail(404, "WORKSPACE_NOT_FOUND", "Workspace not found.");

      const { data: membership, error: memberError } = await supabase
        .from("organization_memberships")
        .select("role,status")
        .eq("organization_id", organization.id)
        .eq("user_id", actorId)
        .maybeSingle();

      if (memberError) return dbError(memberError);

      if (!membership || membership.status !== "active") {
        return fail(403, "ACTIVE_MEMBERSHIP_REQUIRED", "An active workspace membership is required.");
      }

      try {
        // =====================================================
        // COMPANY ANNOUNCEMENTS
        // =====================================================
        if (action === "announcements.list") {
          const { data, error } = await supabase
            .from("announcements")
            .select("id,title,body,status,published_at,created_by,created_at,updated_at")
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) return dbError(error);
          return ok(data ?? []);
        }

        if (action === "announcements.create") {
          const title = clean(body.title, 180);
          const content = clean(body.body, 20000);

          if (title.length < 3 || content.length < 1) {
            return fail(400, "INVALID_ANNOUNCEMENT", "Provide a title of at least 3 characters and announcement content.");
          }

          const { data, error } = await supabase
            .from("announcements")
            .insert({
              organization_id: organization.id,
              title,
              body: content,
              status: "draft",
              published_at: null,
              created_by: actorId,
            })
            .select("*")
            .single();

          if (error) return dbError(error);
          return ok(data);
        }

        if (
          action === "announcements.update" ||
          action === "announcements.publish" ||
          action === "announcements.archive"
        ) {
          if (!isUuid(body.announcement_id)) {
            return fail(400, "INVALID_ANNOUNCEMENT_ID", "A valid announcement_id is required.");
          }

          const patch: Data = {};

          if (body.title !== undefined) {
            const title = clean(body.title, 180);
            if (title.length < 3) return fail(400, "INVALID_TITLE", "Announcement title is too short.");
            patch.title = title;
          }

          if (body.body !== undefined) {
            const content = clean(body.body, 20000);
            if (!content) return fail(400, "EMPTY_ANNOUNCEMENT", "Announcement content cannot be empty.");
            patch.body = content;
          }

          if (action === "announcements.publish") {
            patch.status = "published";
            patch.published_at = new Date().toISOString();
          } else if (action === "announcements.archive") {
            patch.status = "archived";
          }

          if (Object.keys(patch).length === 0) {
            return fail(400, "EMPTY_UPDATE", "Provide content changes or a publish/archive action.");
          }

          const { data, error } = await supabase
            .from("announcements")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("id", body.announcement_id)
            .select("*")
            .maybeSingle();

          if (error) return dbError(error);
          if (!data) return fail(404, "ANNOUNCEMENT_NOT_FOUND", "Announcement not found or not accessible.");

          return ok(data);
        }

        // =====================================================
        // INVESTOR ROOM UPDATES
        // =====================================================
        if (action === "investor_updates.list") {
          const { data, error } = await supabase
            .from("investor_updates")
            .select("id,title,summary,body,status,published_at,created_by,created_at,updated_at")
            .eq("organization_id", organization.id)
            .order("created_at", { ascending: false })
            .limit(100);

          if (error) return dbError(error);
          return ok(data ?? []);
        }

        if (action === "investor_updates.create") {
          const title = clean(body.title, 180);
          const summary = clean(body.summary, 3000);
          const content = clean(body.body, 20000);

          if (title.length < 3 || !content) {
            return fail(400, "INVALID_INVESTOR_UPDATE", "Provide a title of at least 3 characters and update content.");
          }

          const { data, error } = await supabase
            .from("investor_updates")
            .insert({
              organization_id: organization.id,
              title,
              summary,
              body: content,
              status: "draft",
              published_at: null,
              created_by: actorId,
            })
            .select("*")
            .single();

          if (error) return dbError(error);
          return ok(data);
        }

        if (
          action === "investor_updates.update" ||
          action === "investor_updates.publish" ||
          action === "investor_updates.archive"
        ) {
          if (!isUuid(body.investor_update_id)) {
            return fail(400, "INVALID_INVESTOR_UPDATE_ID", "A valid investor_update_id is required.");
          }

          const patch: Data = {};

          if (body.title !== undefined) {
            const title = clean(body.title, 180);
            if (title.length < 3) return fail(400, "INVALID_TITLE", "Investor update title is too short.");
            patch.title = title;
          }

          if (body.summary !== undefined) {
            patch.summary = clean(body.summary, 3000);
          }

          if (body.body !== undefined) {
            const content = clean(body.body, 20000);
            if (!content) return fail(400, "EMPTY_INVESTOR_UPDATE", "Investor update content cannot be empty.");
            patch.body = content;
          }

          if (action === "investor_updates.publish") {
            patch.status = "published";
            patch.published_at = new Date().toISOString();
          } else if (action === "investor_updates.archive") {
            patch.status = "archived";
          }

          if (Object.keys(patch).length === 0) {
            return fail(400, "EMPTY_UPDATE", "Provide content changes or a publish/archive action.");
          }

          const { data, error } = await supabase
            .from("investor_updates")
            .update(patch)
            .eq("organization_id", organization.id)
            .eq("id", body.investor_update_id)
            .select("*")
            .maybeSingle();

          if (error) return dbError(error);
          if (!data) return fail(404, "INVESTOR_UPDATE_NOT_FOUND", "Investor update not found or not accessible.");

          return ok(data);
        }

        return fail(
          400,
          "UNKNOWN_ACTION",
          "Supported actions include announcements.list/create/update/publish/archive and investor_updates.list/create/update/publish/archive.",
        );
      } catch {
        return fail(
          500,
          "CONTENT_INTERNAL_ERROR",
          "The company content request could not be completed.",
        );
      }
    },
  ),
};
