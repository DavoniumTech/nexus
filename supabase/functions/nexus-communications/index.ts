
import { withSupabase } from "npm:@supabase/server@1";

type Payload = Record<string, any>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && uuidPattern.test(value);

const cleanText = (value: unknown, max = 5000): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const reply = (status: number, body: Payload) =>
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
    denied ? "PERMISSION_DENIED" : "DATABASE_REQUEST_FAILED",
    denied
      ? "Your account is not authorised to perform this communication action."
      : "The communication request could not be completed. Check the function logs.",
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
          "Sign in to use Davonium Nexus Communications.",
        );
      }

      let body: Payload;

      try {
        body = await req.json();
      } catch {
        return fail(400, "INVALID_JSON", "The request body must be valid JSON.");
      }

      const action = cleanText(body.action, 80);

      if (!action) {
        return fail(400, "ACTION_REQUIRED", "A communication action is required.");
      }

      const actorId = ctx.userClaims.id;
      const supabase = ctx.supabase;

      // Resolve workspace and confirm that this caller is an active member.
      const workspaceKey =
        cleanText(body.organization_id, 100) ||
        cleanText(body.organization_slug, 100) ||
        "davonium-technologies";

      const orgQuery = supabase
        .from("organizations")
        .select("id,name,slug")
        .eq(isUuid(workspaceKey) ? "id" : "slug", workspaceKey);

      const { data: organization, error: orgError } =
        await orgQuery.maybeSingle();

      if (orgError) return dbError(orgError);

      if (!organization) {
        return fail(404, "WORKSPACE_NOT_FOUND", "Workspace not found.");
      }

      const { data: membership, error: memberError } = await supabase
        .from("organization_memberships")
        .select("role,status")
        .eq("organization_id", organization.id)
        .eq("user_id", actorId)
        .maybeSingle();

      if (memberError) return dbError(memberError);

      if (!membership || membership.status !== "active") {
        return fail(
          403,
          "ACTIVE_MEMBERSHIP_REQUIRED",
          "An active workspace membership is required.",
        );
      }

      try {
        switch (action) {
          // --------------------------------------------------
          // CHANNELS
          // --------------------------------------------------
          case "channels.list": {
            const { data, error } = await supabase
              .from("nexus_channels")
              .select("*")
              .eq("organization_id", organization.id)
              .order("created_at", { ascending: false })
              .limit(200);

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "channels.create": {
            const scope = body.channel_scope;
            const slug = cleanText(body.slug, 100).toLowerCase();
            const name = cleanText(body.name, 100);

            if (!["company", "team", "project"].includes(scope)) {
              return fail(400, "INVALID_CHANNEL_SCOPE", "Choose company, team or project scope.");
            }

            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
              return fail(400, "INVALID_CHANNEL_SLUG", "Use lowercase letters, numbers and single hyphens.");
            }

            if (name.length < 2) {
              return fail(400, "INVALID_CHANNEL_NAME", "Channel name must contain at least 2 characters.");
            }

            const teamId = body.team_id ?? null;
            const projectId = body.project_id ?? null;

            if (
              (scope === "company" && (teamId !== null || projectId !== null)) ||
              (scope === "team" && (!isUuid(teamId) || projectId !== null)) ||
              (scope === "project" && (!isUuid(projectId) || teamId !== null))
            ) {
              return fail(400, "INVALID_CHANNEL_SCOPE_TARGET", "The team or project reference does not match the chosen channel scope.");
            }

            if (body.is_private !== undefined && typeof body.is_private !== "boolean") {
              return fail(400, "INVALID_PRIVACY_SETTING", "is_private must be true or false.");
            }

            const { data, error } = await supabase
              .from("nexus_channels")
              .insert({
                organization_id: organization.id,
                channel_scope: scope,
                team_id: teamId,
                project_id: projectId,
                slug,
                name,
                description: cleanText(body.description, 500),
                is_private: body.is_private ?? false,
                created_by: actorId,
              })
              .select("*")
              .single();

            if (error) return dbError(error);

            return ok({
              channel: data,
              note: "The channel creator is automatically added as its moderator.",
            });
          }

          case "channels.update": {
            if (!isUuid(body.channel_id)) {
              return fail(400, "INVALID_CHANNEL_ID", "A valid channel_id is required.");
            }

            const patch: Payload = {};

            if (body.name !== undefined) {
              const name = cleanText(body.name, 100);
              if (name.length < 2) {
                return fail(400, "INVALID_CHANNEL_NAME", "Channel name must contain at least 2 characters.");
              }
              patch.name = name;
            }

            if (body.description !== undefined) {
              patch.description = cleanText(body.description, 500);
            }

            if (body.is_private !== undefined) {
              if (typeof body.is_private !== "boolean") {
                return fail(400, "INVALID_PRIVACY_SETTING", "is_private must be true or false.");
              }
              patch.is_private = body.is_private;
            }

            if (Object.keys(patch).length === 0) {
              return fail(400, "EMPTY_UPDATE", "Provide a channel field to update.");
            }

            const { data, error } = await supabase
              .from("nexus_channels")
              .update(patch)
              .eq("organization_id", organization.id)
              .eq("id", body.channel_id)
              .select("*")
              .maybeSingle();

            if (error) return dbError(error);
            if (!data) return fail(404, "CHANNEL_NOT_FOUND", "Channel not found or not accessible.");

            return ok(data);
          }

          // --------------------------------------------------
          // CHANNEL MEMBERS
          // --------------------------------------------------
          case "channels.members.list": {
            if (!isUuid(body.channel_id)) {
              return fail(400, "INVALID_CHANNEL_ID", "A valid channel_id is required.");
            }

            const { data, error } = await supabase
              .from("nexus_channel_members")
              .select("*")
              .eq("organization_id", organization.id)
              .eq("channel_id", body.channel_id)
              .order("added_at", { ascending: true });

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "channels.members.set": {
            if (!isUuid(body.channel_id) || !isUuid(body.user_id)) {
              return fail(400, "INVALID_MEMBER_REFERENCE", "Valid channel_id and user_id are required.");
            }

            if (typeof body.add !== "boolean") {
              return fail(400, "INVALID_MEMBER_ACTION", "add must be true or false.");
            }

            const memberRole = body.member_role ?? "member";

            if (!["member", "moderator"].includes(memberRole)) {
              return fail(400, "INVALID_MEMBER_ROLE", "Choose member or moderator.");
            }

            const { error } = await supabase.rpc("nexus_set_channel_member", {
              p_channel_id: body.channel_id,
              p_user_id: body.user_id,
              p_add: body.add,
              p_member_role: memberRole,
            });

            if (error) return dbError(error);

            return ok({
              channel_id: body.channel_id,
              user_id: body.user_id,
              added: body.add,
            });
          }

          // --------------------------------------------------
          // CHANNEL MESSAGES
          // --------------------------------------------------
          case "messages.list": {
            if (!isUuid(body.channel_id)) {
              return fail(400, "INVALID_CHANNEL_ID", "A valid channel_id is required.");
            }

            const requestedLimit = Number(body.limit ?? 50);
            const limit = Number.isInteger(requestedLimit)
              ? Math.min(100, Math.max(1, requestedLimit))
              : 50;

            let query: any = supabase
              .from("nexus_channel_messages")
              .select("*")
              .eq("organization_id", organization.id)
              .eq("channel_id", body.channel_id)
              .order("created_at", { ascending: false })
              .limit(limit);

            if (body.before !== undefined) {
              const before = Date.parse(body.before);

              if (
                typeof body.before !== "string" ||
                !Number.isFinite(before)
              ) {
                return fail(400, "INVALID_MESSAGE_CURSOR", "before must be a valid timestamp.");
              }

              query = query.lt("created_at", new Date(before).toISOString());
            }

            const { data, error } = await query;

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "messages.send": {
            if (!isUuid(body.channel_id)) {
              return fail(400, "INVALID_CHANNEL_ID", "A valid channel_id is required.");
            }

            const message = cleanText(body.message, 5000);

            if (!message) {
              return fail(400, "EMPTY_MESSAGE", "A message cannot be empty.");
            }

            const { data, error } = await supabase
              .from("nexus_channel_messages")
              .insert({
                organization_id: organization.id,
                channel_id: body.channel_id,
                sender_user_id: actorId,
                body: message,
              })
              .select("*")
              .single();

            if (error) return dbError(error);
            return ok(data);
          }

          case "messages.moderate": {
            if (!isUuid(body.message_id) || typeof body.hide !== "boolean") {
              return fail(400, "INVALID_MODERATION_REQUEST", "Provide a message_id and a true or false hide value.");
            }

            const { error } = await supabase.rpc("nexus_moderate_channel_message", {
              p_message_id: body.message_id,
              p_hide: body.hide,
              p_reason: cleanText(body.reason, 500) || null,
            });

            if (error) return dbError(error);

            return ok({
              message_id: body.message_id,
              hidden: body.hide,
            });
          }

          // --------------------------------------------------
          // INTERNAL DIRECT CONVERSATIONS
          // --------------------------------------------------
          case "direct.start": {
            if (!isUuid(body.other_user_id)) {
              return fail(400, "INVALID_USER_ID", "A valid other_user_id is required.");
            }

            const { data, error } = await supabase.rpc(
              "nexus_start_direct_conversation",
              {
                p_organization_id: organization.id,
                p_other_user_id: body.other_user_id,
              },
            );

            if (error) return dbError(error);

            return ok({ conversation_id: data });
          }

          case "direct.list": {
            const { data, error } = await supabase
              .from("nexus_direct_conversations")
              .select("*")
              .eq("organization_id", organization.id)
              .or(`participant_low.eq.${actorId},participant_high.eq.${actorId}`)
              .order("created_at", { ascending: false })
              .limit(100);

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "direct.messages.list": {
            if (!isUuid(body.conversation_id)) {
              return fail(400, "INVALID_CONVERSATION_ID", "A valid conversation_id is required.");
            }

            const requestedLimit = Number(body.limit ?? 50);
            const limit = Number.isInteger(requestedLimit)
              ? Math.min(100, Math.max(1, requestedLimit))
              : 50;

            let query: any = supabase
              .from("nexus_direct_messages")
              .select("*")
              .eq("organization_id", organization.id)
              .eq("conversation_id", body.conversation_id)
              .order("created_at", { ascending: false })
              .limit(limit);

            if (body.before !== undefined) {
              const before = Date.parse(body.before);

              if (
                typeof body.before !== "string" ||
                !Number.isFinite(before)
              ) {
                return fail(400, "INVALID_MESSAGE_CURSOR", "before must be a valid timestamp.");
              }

              query = query.lt("created_at", new Date(before).toISOString());
            }

            const { data, error } = await query;

            if (error) return dbError(error);
            return ok(data ?? []);
          }

          case "direct.messages.send": {
            if (!isUuid(body.conversation_id)) {
              return fail(400, "INVALID_CONVERSATION_ID", "A valid conversation_id is required.");
            }

            const message = cleanText(body.message, 5000);

            if (!message) {
              return fail(400, "EMPTY_MESSAGE", "A direct message cannot be empty.");
            }

            const { data, error } = await supabase
              .from("nexus_direct_messages")
              .insert({
                organization_id: organization.id,
                conversation_id: body.conversation_id,
                sender_user_id: actorId,
                body: message,
              })
              .select("*")
              .single();

            if (error) return dbError(error);
            return ok(data);
          }

          default:
            return fail(
              400,
              "UNKNOWN_ACTION",
              "This communications action is not supported.",
            );
        }
      } catch {
        return fail(
          500,
          "COMMUNICATIONS_INTERNAL_ERROR",
          "The communications request could not be completed.",
        );
      }
    },
  ),
};
