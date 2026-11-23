
import { withSupabase } from "npm:@supabase/server@1";

type Data = Record<string, any>;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const clean = (v: unknown, max = 1000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && UUID.test(v);

const emailValid = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length <= 254 &&
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

const reply = (status: number, data: Data) =>
  Response.json(data, { status });

const ok = (data: unknown) =>
  reply(200, { success: true, data });

const fail = (status: number, code: string, message: string) =>
  reply(status, { success: false, code, message });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);

async function sendResendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
) {
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  const response = await result.json().catch(() => ({}));

  return {
    accepted: result.ok,
    provider_id: typeof response?.id === "string" ? response.id : null,
  };
}

export default {
  fetch: withSupabase(
    { auth: ["user", "secret", "publishable"] },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
      }

      let body: Data;

      try {
        body = await req.json();
      } catch {
        return fail(400, "INVALID_JSON", "The request body must be valid JSON.");
      }

      const action = clean(body.action, 80);

      if (!action) {
        return fail(400, "ACTION_REQUIRED", "A notification action is required.");
      }

      const userMode =
        ctx.authMode === "user" && Boolean(ctx.userClaims?.id);
      const secretMode = ctx.authMode === "secret";

      if (!userMode && !secretMode) {
        return fail(
          401,
          "USER_SESSION_REQUIRED",
          "Sign in to use Davonium Nexus Notifications.",
        );
      }

      const db = secretMode ? ctx.supabaseAdmin : ctx.supabase;

      if (!db) {
        return fail(500, "DATABASE_UNAVAILABLE", "The database client is unavailable.");
      }

      const workspace =
        clean(body.organization_id, 100) || "davonium-technologies";

      const { data: organization, error: orgError } = await db
        .from("organizations")
        .select("id,name,slug")
        .eq(isUuid(workspace) ? "id" : "slug", workspace)
        .maybeSingle();

      if (orgError) {
        return fail(400, "WORKSPACE_LOOKUP_FAILED", "Could not resolve the workspace.");
      }

      if (!organization) {
        return fail(404, "WORKSPACE_NOT_FOUND", "Workspace not found.");
      }

      const actorId = userMode ? ctx.userClaims!.id : null;

      if (userMode) {
        const { data: membership, error } = await db
          .from("organization_memberships")
          .select("role,status")
          .eq("organization_id", organization.id)
          .eq("user_id", actorId)
          .maybeSingle();

        if (error) {
          return fail(400, "MEMBERSHIP_LOOKUP_FAILED", "Could not verify workspace membership.");
        }

        if (!membership || membership.status !== "active") {
          return fail(403, "ACTIVE_MEMBERSHIP_REQUIRED", "An active workspace membership is required.");
        }
      }

      // -----------------------------------------------------
      // PERSONAL NOTIFICATION INBOX — signed-in user only
      // -----------------------------------------------------
      if (userMode && action === "inbox.list") {
        const requestedLimit = Number(body.limit ?? 50);
        const limit = Number.isInteger(requestedLimit)
          ? Math.max(1, Math.min(100, requestedLimit))
          : 50;

        let query: any = db
          .from("nexus_notifications")
          .select("id,notification_type,title,body,destination_path,source_entity_type,source_entity_id,created_at,read_at")
          .eq("organization_id", organization.id)
          .eq("recipient_user_id", actorId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (body.unread_only === true) {
          query = query.is("read_at", null);
        }

        const { data, error } = await query;

        if (error) {
          return fail(403, "INBOX_ACCESS_DENIED", "Could not read your notification inbox.");
        }

        return ok(data ?? []);
      }

      if (userMode && action === "inbox.mark_read") {
        if (!isUuid(body.notification_id)) {
          return fail(400, "INVALID_NOTIFICATION_ID", "A valid notification_id is required.");
        }

        const { data, error } = await db
          .from("nexus_notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("organization_id", organization.id)
          .eq("recipient_user_id", actorId)
          .eq("id", body.notification_id)
          .select("id,read_at")
          .maybeSingle();

        if (error) {
          return fail(403, "MARK_READ_FAILED", "Could not update this notification.");
        }

        if (!data) {
          return fail(404, "NOTIFICATION_NOT_FOUND", "Notification not found.");
        }

        return ok(data);
      }

      if (userMode && action === "inbox.mark_all_read") {
        const { data, error } = await db
          .from("nexus_notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("organization_id", organization.id)
          .eq("recipient_user_id", actorId)
          .is("read_at", null)
          .select("id");

        if (error) {
          return fail(403, "MARK_ALL_READ_FAILED", "Could not mark notifications as read.");
        }

        return ok({ updated_count: data?.length ?? 0 });
      }

      // -----------------------------------------------------
      // PERSONAL NOTIFICATION PREFERENCES
      // -----------------------------------------------------
      if (userMode && action === "preferences.get") {
        const { data, error } = await db
          .from("nexus_notification_preferences")
          .select("in_app_enabled,email_enabled,digest_frequency,updated_at")
          .eq("organization_id", organization.id)
          .eq("user_id", actorId)
          .maybeSingle();

        if (error) {
          return fail(403, "PREFERENCES_READ_FAILED", "Could not read your notification preferences.");
        }

        return ok(data ?? {
          in_app_enabled: true,
          email_enabled: true,
          digest_frequency: "immediate",
          defaults: true,
        });
      }

      if (userMode && action === "preferences.update") {
        const patch: Data = {
          organization_id: organization.id,
          user_id: actorId,
          updated_at: new Date().toISOString(),
        };

        for (const key of ["in_app_enabled", "email_enabled"]) {
          if (body[key] !== undefined) {
            if (typeof body[key] !== "boolean") {
              return fail(400, "INVALID_PREFERENCE", `${key} must be true or false.`);
            }
            patch[key] = body[key];
          }
        }

        if (body.digest_frequency !== undefined) {
          if (!["immediate", "daily", "weekly", "never"].includes(body.digest_frequency)) {
            return fail(400, "INVALID_DIGEST_FREQUENCY", "Choose immediate, daily, weekly or never.");
          }
          patch.digest_frequency = body.digest_frequency;
        }

        if (Object.keys(patch).length === 3) {
          return fail(400, "EMPTY_PREFERENCE_UPDATE", "Provide at least one preference to change.");
        }

        const { data, error } = await db
          .from("nexus_notification_preferences")
          .upsert(patch, { onConflict: "organization_id,user_id" })
          .select("in_app_enabled,email_enabled,digest_frequency,updated_at")
          .single();

        if (error) {
          return fail(403, "PREFERENCES_UPDATE_FAILED", "Could not save your preferences.");
        }

        return ok(data);
      }

      // -----------------------------------------------------
      // ORGANISATION EMAIL SETTINGS — permission controlled
      // -----------------------------------------------------
      if (userMode && action === "delivery.settings.get") {
        const { data, error } = await db
          .from("nexus_notification_delivery_settings")
          .select("provider,sender_name,sender_email,is_enabled,last_tested_at,last_test_status,updated_at")
          .eq("organization_id", organization.id)
          .maybeSingle();

        if (error) {
          return fail(403, "DELIVERY_SETTINGS_ACCESS_DENIED", "You cannot view organisation email settings.");
        }

        return ok(data);
      }

      if (userMode && action === "delivery.settings.update") {
        const { data: current, error: readError } = await db
          .from("nexus_notification_delivery_settings")
          .select("*")
          .eq("organization_id", organization.id)
          .maybeSingle();

        if (readError || !current) {
          return fail(400, "DELIVERY_SETTINGS_NOT_FOUND", "Email delivery settings were not found.");
        }

        const patch: Data = { updated_by: actorId };
        const configChanged =
          (body.provider !== undefined && body.provider !== current.provider) ||
          (body.sender_email !== undefined && body.sender_email !== current.sender_email) ||
          (body.sender_name !== undefined && body.sender_name !== current.sender_name);

        if (body.provider !== undefined) {
          if (!["none", "resend", "postmark", "sendgrid", "smtp", "supabase"].includes(body.provider)) {
            return fail(400, "INVALID_EMAIL_PROVIDER", "Unsupported email provider.");
          }
          patch.provider = body.provider;
        }

        if (body.sender_email !== undefined) {
          if (body.sender_email !== null && !emailValid(body.sender_email)) {
            return fail(400, "INVALID_SENDER_EMAIL", "Provide a valid sender email.");
          }
          patch.sender_email = body.sender_email;
        }

        if (body.sender_name !== undefined) {
          const name = clean(body.sender_name, 100);
          patch.sender_name = name || null;
        }

        if (body.is_enabled !== undefined) {
          if (typeof body.is_enabled !== "boolean") {
            return fail(400, "INVALID_DELIVERY_STATE", "is_enabled must be true or false.");
          }

          if (body.is_enabled && configChanged) {
            return fail(409, "TEST_REQUIRED", "Save sender settings while disabled, test the email provider, then enable delivery.");
          }

          if (body.is_enabled) {
            const testedAt = current.last_tested_at
              ? Date.parse(current.last_tested_at)
              : 0;
            const settingsAt = current.updated_at
              ? Date.parse(current.updated_at)
              : 0;

            if (
              current.provider === "none" ||
              !current.sender_email ||
              current.last_test_status !== "passed" ||
              !Number.isFinite(testedAt) ||
              testedAt < settingsAt
            ) {
              return fail(409, "SUCCESSFUL_TEST_REQUIRED", "Configure the sender and pass a fresh email test before enabling delivery.");
            }
          }

          patch.is_enabled = body.is_enabled;
        }

        if (configChanged && body.is_enabled === true) {
          return fail(409, "TEST_REQUIRED", "Test the changed sender configuration before enabling delivery.");
        }

        if (Object.keys(patch).length === 1) {
          return fail(400, "EMPTY_SETTINGS_UPDATE", "Provide an email setting to update.");
        }

        const { data, error } = await db
          .from("nexus_notification_delivery_settings")
          .update(patch)
          .eq("organization_id", organization.id)
          .select("provider,sender_name,sender_email,is_enabled,last_tested_at,last_test_status,updated_at")
          .single();

        if (error) {
          return fail(403, "DELIVERY_SETTINGS_UPDATE_FAILED", "Could not save email delivery settings.");
        }

        return ok(data);
      }

      // -----------------------------------------------------
      // PROVIDER TEST — trusted server only
      // -----------------------------------------------------
      if (action === "delivery.test" && secretMode) {
        const testEmail = clean(body.test_email, 254);

        if (!emailValid(testEmail)) {
          return fail(400, "INVALID_TEST_EMAIL", "Provide a valid test_email address.");
        }

        const { data: settings, error } = await db
          .from("nexus_notification_delivery_settings")
          .select("provider,sender_name,sender_email")
          .eq("organization_id", organization.id)
          .maybeSingle();

        if (error || !settings) {
          return fail(400, "DELIVERY_SETTINGS_NOT_FOUND", "Email delivery settings were not found.");
        }

        if (settings.provider !== "resend" || !settings.sender_email) {
          return fail(409, "RESEND_NOT_CONFIGURED", "Select Resend and configure a verified sender email before testing.");
        }

        const apiKey = Deno.env.get("RESEND_API_KEY");

        if (!apiKey) {
          return fail(409, "EMAIL_SECRET_MISSING", "Add RESEND_API_KEY to Supabase Edge Function Secrets first.");
        }

        const from = settings.sender_name
          ? `${settings.sender_name} <${settings.sender_email}>`
          : settings.sender_email;

        let sent = false;

        try {
          const result = await sendResendEmail(
            apiKey,
            from,
            testEmail,
            "Davonium Nexus email delivery test",
            "<p>This is a test of the Davonium Nexus notification delivery service.</p><p>No action is required.</p>",
          );
          sent = result.accepted;
        } catch {
          sent = false;
        }

        const { error: recordError } = await db.rpc(
          "nexus_record_notification_delivery_test",
          {
            p_organization_id: organization.id,
            p_test_passed: sent,
          },
        );

        if (recordError) {
          return fail(500, "TEST_RESULT_RECORD_FAILED", "The provider test ran, but its result could not be saved.");
        }

        if (!sent) {
          return fail(502, "EMAIL_PROVIDER_TEST_FAILED", "The email provider did not accept the test message. Check the Resend domain and API key.");
        }

        return ok({
          test_status: "passed",
          provider: "resend",
          recipient: testEmail,
          note: "Resend accepted the test message. This does not by itself prove inbox delivery.",
        });
      }

      // -----------------------------------------------------
      // CREATE NOTIFICATION — trusted server only
      // -----------------------------------------------------
      if (action === "notification.create" && secretMode) {
        const recipientId = body.recipient_user_id;
        const type = clean(body.notification_type, 80);
        const title = clean(body.title, 160);
        const message = clean(body.body, 1000);
        const destination = body.destination_path == null
          ? null
          : clean(body.destination_path, 500);

        if (
          !isUuid(recipientId) ||
          !/^[a-z][a-z0-9_.-]{1,80}$/.test(type) ||
          !title ||
          (destination !== null &&
            (!destination.startsWith("/") ||
              destination.startsWith("//")))
        ) {
          return fail(400, "INVALID_NOTIFICATION", "Provide a recipient, valid type, title and safe internal destination path.");
        }

        const { data: recipient, error: recipientError } = await db
          .from("organization_memberships")
          .select("user_id,status")
          .eq("organization_id", organization.id)
          .eq("user_id", recipientId)
          .maybeSingle();

        if (recipientError || !recipient || recipient.status !== "active") {
          return fail(404, "ACTIVE_RECIPIENT_NOT_FOUND", "The recipient is not an active member of this workspace.");
        }

        const { data: preferences } = await db
          .from("nexus_notification_preferences")
          .select("in_app_enabled,email_enabled,digest_frequency")
          .eq("organization_id", organization.id)
          .eq("user_id", recipientId)
          .maybeSingle();

        const inAppEnabled = preferences?.in_app_enabled ?? true;
        const emailEnabled = preferences?.email_enabled ?? true;
        const frequency = preferences?.digest_frequency ?? "immediate";

        let inboxId: string | null = null;

        if (inAppEnabled) {
          const { data: notification, error } = await db
            .from("nexus_notifications")
            .insert({
              organization_id: organization.id,
              recipient_user_id: recipientId,
              notification_type: type,
              title,
              body: message,
              destination_path: destination,
              source_entity_type: body.source_entity_type
                ? clean(body.source_entity_type, 80)
                : null,
              source_entity_id: isUuid(body.source_entity_id)
                ? body.source_entity_id
                : null,
            })
            .select("id")
            .single();

          if (error) {
            return fail(500, "NOTIFICATION_CREATE_FAILED", "Could not create the in-app notification.");
          }

          inboxId = notification.id;
        }

        let emailStatus = "not_requested";

        if (emailEnabled && frequency === "immediate") {
          const { data: settings } = await db
            .from("nexus_notification_delivery_settings")
            .select("provider,sender_name,sender_email,is_enabled")
            .eq("organization_id", organization.id)
            .maybeSingle();

          if (
            settings?.is_enabled &&
            settings.provider === "resend" &&
            settings.sender_email
          ) {
            const apiKey = Deno.env.get("RESEND_API_KEY");

            if (!apiKey) {
              emailStatus = "skipped_secret_missing";
            } else {
              const { data: authUser } = await db.auth.admin.getUserById(recipientId);
              const recipientEmail = authUser?.user?.email;

              if (!recipientEmail) {
                emailStatus = "skipped_recipient_email_unavailable";
              } else {
                const from = settings.sender_name
                  ? `${settings.sender_name} <${settings.sender_email}>`
                  : settings.sender_email;

                try {
                  const result = await sendResendEmail(
                    apiKey,
                    from,
                    recipientEmail,
                    title,
                    `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><p>Davonium Nexus</p>`,
                  );

                  emailStatus = result.accepted
                    ? "accepted_by_provider"
                    : "provider_rejected";
                } catch {
                  emailStatus = "provider_request_failed";
                }
              }
            }
          } else {
            emailStatus = "delivery_not_enabled_or_provider_not_supported";
          }
        } else if (emailEnabled && frequency !== "immediate") {
          emailStatus = "digest_not_dispatched";
        } else if (!emailEnabled) {
          emailStatus = "disabled_by_recipient";
        }

        return ok({
          notification_created: Boolean(inboxId),
          notification_id: inboxId,
          email_status: emailStatus,
          note: "Email status indicates provider acceptance where applicable, not guaranteed inbox delivery.",
        });
      }

      return fail(
        403,
        "ACTION_NOT_AVAILABLE",
        "This action is unavailable for the current authentication mode.",
      );
    },
  ),
};
