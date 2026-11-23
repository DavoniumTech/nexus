
import { withSupabase } from "npm:@supabase/server@1";

const WORKSPACE_SLUG = "davonium-technologies";

const ALLOWED_STATUSES = new Set([
  "active",
  "suspended",
  "revoked",
]);

// Accept the standard UUID format, including the all-zero
// UUID used for our harmless nonexistent-member test.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function mapRpcError(error: {
  code?: string;
  message?: string;
}) {
  const code = error.code ?? "UNKNOWN";

  if (code === "42501" || code === "28000") {
    return {
      status: 403,
      code,
      message: "You are not authorised to change this member's access.",
    };
  }

  if (code === "P0002") {
    return {
      status: 404,
      code,
      message: "The target workspace membership was not found.",
    };
  }

  if (code === "23514") {
    return {
      status: 409,
      code,
      message: "This change would violate a workspace membership safeguard.",
    };
  }

  if (code === "22004" || code === "22P02") {
    return {
      status: 400,
      code,
      message: "The supplied membership details are invalid.",
    };
  }

  return {
    status: 500,
    code,
    message: "The membership status operation failed. Check function logs.",
  };
}

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return json({
          success: false,
          code: "METHOD_NOT_ALLOWED",
          message: "Use POST.",
        }, 405);
      }

      let body: Record<string, unknown>;

      try {
        body = await req.json();
      } catch {
        return json({
          success: false,
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        }, 400);
      }

      if (body.action !== "members.status.update") {
        return json({
          success: false,
          code: "UNSUPPORTED_ACTION",
          message: "Supported action: members.status.update.",
        }, 400);
      }

      const userId =
        typeof body.user_id === "string"
          ? body.user_id.trim()
          : "";

      const newStatus =
        typeof body.new_status === "string"
          ? body.new_status.trim()
          : "";

      if (!UUID_RE.test(userId)) {
        return json({
          success: false,
          code: "INVALID_USER_ID",
          message: "user_id must be a valid UUID.",
        }, 400);
      }

      if (!ALLOWED_STATUSES.has(newStatus)) {
        return json({
          success: false,
          code: "INVALID_MEMBERSHIP_STATUS",
          message: "Status must be active, suspended, or revoked.",
        }, 400);
      }

      // Resolve the Davonium workspace using the user's
      // RLS-scoped Supabase client.
      const {
        data: organization,
        error: organizationError,
      } = await ctx.supabase
        .from("organizations")
        .select("id")
        .eq("slug", WORKSPACE_SLUG)
        .maybeSingle();

      if (organizationError) {
        console.error(
          "Workspace lookup failed:",
          organizationError.code
        );

        return json({
          success: false,
          code: "WORKSPACE_LOOKUP_FAILED",
          message: "Could not resolve the Davonium workspace.",
        }, 500);
      }

      if (!organization?.id) {
        return json({
          success: false,
          code: "WORKSPACE_NOT_FOUND",
          message: "The Davonium workspace was not found.",
        }, 404);
      }

      // The database RPC is the authoritative security layer.
      // It checks permission, blocks self-suspension, protects
      // the last active Owner and records an audit event.
      const { error: rpcError } =
        await ctx.supabase.rpc(
          "nexus_set_member_status",
          {
            p_organization_id: organization.id,
            p_user_id: userId,
            p_new_status: newStatus,
          }
        );

      if (rpcError) {
        const mapped = mapRpcError(rpcError);

        console.error(
          "Member status RPC rejected:",
          rpcError.code
        );

        return json({
          success: false,
          code: mapped.code,
          message: mapped.message,
        }, mapped.status);
      }

      return json({
        success: true,
        action: "members.status.update",
        user_id: userId,
        status: newStatus,
        audit_recorded: true,
      });
    }
  ),
};
