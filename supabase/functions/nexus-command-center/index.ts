
import { withSupabase } from "npm:@supabase/server@1";

type Payload = Record<string, any>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const response = (status: number, body: Payload) =>
  Response.json(body, { status });

const success = (data: unknown) =>
  response(200, { success: true, data });

const failure = (
  status: number,
  code: string,
  message: string,
  extra: Payload = {},
) => response(status, { success: false, code, message, ...extra });

const textValue = (value: unknown, maxLength = 5000): string =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value);

const isDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const numberValue = (value: unknown): number =>
  typeof value === "number" ? value : Number(value);

const isOneOf = (value: unknown, allowed: string[]): value is string =>
  typeof value === "string" && allowed.includes(value);

const databaseFailure = (error: any) => {
  const denied =
    error?.code === "42501" ||
    String(error?.message ?? "").toLowerCase().includes("row-level security") ||
    String(error?.message ?? "").toLowerCase().includes("permission denied");

  return failure(
    denied ? 403 : 400,
    denied ? "PERMISSION_DENIED" : "DATABASE_REQUEST_FAILED",
    denied
      ? "Your account does not have permission for this command-centre operation."
      : "The database could not complete this operation. Check the function logs for details.",
    { database_code: error?.code ?? null },
  );
};

export default {
  fetch: withSupabase(
    { auth: ["user", "publishable"] },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return failure(405, "METHOD_NOT_ALLOWED", "Use POST for this function.");
      }

      // A publishable key identifies the project, not an authenticated employee.
      if (ctx.authMode !== "user" || !ctx.userClaims?.id) {
        return failure(
          401,
          "USER_SESSION_REQUIRED",
          "Sign in to access the Davonium Nexus Command Center.",
        );
      }

      let body: Payload;

      try {
        body = await req.json();
      } catch {
        return failure(400, "INVALID_JSON", "The request body must be valid JSON.");
      }

      const action = textValue(body.action, 80);
      if (!action) {
        return failure(400, "ACTION_REQUIRED", "A command-centre action is required.");
      }

      const actorId = ctx.userClaims.id;
      const supabase = ctx.supabase;

      // Resolve the requested workspace, then verify active membership.
      const workspaceKey =
        textValue(body.organization_id, 100) ||
        textValue(body.organization_slug, 100) ||
        "davonium-technologies";

      const organizationQuery = supabase
        .from("organizations")
        .select("id,name,slug")
        .eq(isUuid(workspaceKey) ? "id" : "slug", workspaceKey)
        .maybeSingle();

      const { data: organization, error: organizationError } =
        await organizationQuery;

      if (organizationError) return databaseFailure(organizationError);

      if (!organization) {
        return failure(404, "WORKSPACE_NOT_FOUND", "The requested workspace was not found.");
      }

      const { data: membership, error: membershipError } = await supabase
        .from("organization_memberships")
        .select("role,status")
        .eq("organization_id", organization.id)
        .eq("user_id", actorId)
        .maybeSingle();

      if (membershipError) return databaseFailure(membershipError);

      if (!membership || membership.status !== "active") {
        return failure(
          403,
          "ACTIVE_MEMBERSHIP_REQUIRED",
          "You must have an active membership in this workspace.",
        );
      }

      try {
        switch (action) {
          // ---------------------------------------------------------
          // 1. COMMAND-CENTRE OVERVIEW
          // ---------------------------------------------------------
          case "overview": {
            const results = await Promise.all([
              supabase.from("nexus_command_center_project_summary")
                .select("*").eq("organization_id", organization.id).limit(100),

              supabase.from("nexus_command_center_task_summary")
                .select("*").eq("organization_id", organization.id).limit(200),

              supabase.from("nexus_command_center_products")
                .select("*").eq("organization_id", organization.id).limit(100),

              supabase.from("nexus_command_center_objectives")
                .select("*").eq("organization_id", organization.id).limit(100),

              supabase.from("nexus_command_center_service_status")
                .select("*").eq("organization_id", organization.id).limit(100),

              supabase.from("company_decisions")
                .select("*").eq("organization_id", organization.id)
                .order("decided_at", { ascending: false }).limit(20),

              supabase.from("weekly_company_summaries")
                .select("*").eq("organization_id", organization.id)
                .order("week_start", { ascending: false }).limit(12),

              supabase.from("product_releases")
                .select("*").eq("organization_id", organization.id)
                .order("created_at", { ascending: false }).limit(20),

              supabase.from("service_incidents")
                .select("*").eq("organization_id", organization.id)
                .neq("incident_status", "resolved")
                .order("started_at", { ascending: false }).limit(30),
            ]);

            const failed = results.find((item) => item.error);
            if (failed?.error) return databaseFailure(failed.error);

            return success({
              organization,
              projects: results[0].data ?? [],
              tasks: results[1].data ?? [],
              products: results[2].data ?? [],
              objectives: results[3].data ?? [],
              service_status: results[4].data ?? [],
              recent_decisions: results[5].data ?? [],
              weekly_summaries: results[6].data ?? [],
              recent_releases: results[7].data ?? [],
              open_incidents: results[8].data ?? [],
            });
          }

          // ---------------------------------------------------------
          // 2. COMPANY OBJECTIVES
          // ---------------------------------------------------------
          case "objectives.list": {
            const { data, error } = await supabase
              .from("company_objectives")
              .select("*")
              .eq("organization_id", organization.id)
              .order("period_start", { ascending: false })
              .limit(100);

            if (error) return databaseFailure(error);
            return success(data ?? []);
          }

          case "objectives.create": {
            const title = textValue(body.title, 180);
            const description = textValue(body.description, 5000);
            const periodStart = body.period_start;
            const periodEnd = body.period_end;
            const ownerUserId = body.owner_user_id || null;

            if (title.length < 3 || !isDate(periodStart) || !isDate(periodEnd)) {
              return failure(
                400,
                "INVALID_OBJECTIVE",
                "Provide a title of at least 3 characters and valid start and end dates.",
              );
            }

            if (periodEnd < periodStart) {
              return failure(400, "INVALID_PERIOD", "The end date cannot precede the start date.");
            }

            if (ownerUserId !== null && !isUuid(ownerUserId)) {
              return failure(400, "INVALID_OWNER", "The objective owner must be a valid user ID.");
            }

            const { data, error } = await supabase
              .from("company_objectives")
              .insert({
                organization_id: organization.id,
                title,
                description,
                owner_user_id: ownerUserId,
                period_start: periodStart,
                period_end: periodEnd,
                objective_status: "draft",
                created_by: actorId,
              })
              .select("*")
              .single();

            if (error) return databaseFailure(error);
            return success(data);
          }

          case "objectives.update": {
            if (!isUuid(body.objective_id)) {
              return failure(400, "INVALID_OBJECTIVE_ID", "A valid objective_id is required.");
            }

            const patch: Payload = {};

            if (body.title !== undefined) {
              const title = textValue(body.title, 180);
              if (title.length < 3) {
                return failure(400, "INVALID_TITLE", "The title must contain at least 3 characters.");
              }
              patch.title = title;
            }

            if (body.description !== undefined) {
              patch.description = textValue(body.description, 5000);
            }

            if (body.owner_user_id !== undefined) {
              if (body.owner_user_id !== null && !isUuid(body.owner_user_id)) {
                return failure(400, "INVALID_OWNER", "The owner must be a valid user ID or null.");
              }
              patch.owner_user_id = body.owner_user_id;
            }

            if (body.period_start !== undefined) {
              if (!isDate(body.period_start)) {
                return failure(400, "INVALID_DATE", "period_start must use YYYY-MM-DD.");
              }
              patch.period_start = body.period_start;
            }

            if (body.period_end !== undefined) {
              if (!isDate(body.period_end)) {
                return failure(400, "INVALID_DATE", "period_end must use YYYY-MM-DD.");
              }
              patch.period_end = body.period_end;
            }

            if (body.objective_status !== undefined) {
              if (!isOneOf(body.objective_status, ["draft", "active", "completed", "cancelled"])) {
                return failure(400, "INVALID_STATUS", "Invalid objective status.");
              }
              patch.objective_status = body.objective_status;
            }

            if (Object.keys(patch).length === 0) {
              return failure(400, "EMPTY_UPDATE", "Provide at least one field to update.");
            }

            const { data, error } = await supabase
              .from("company_objectives")
              .update(patch)
              .eq("id", body.objective_id)
              .eq("organization_id", organization.id)
              .select("*")
              .maybeSingle();

            if (error) return databaseFailure(error);
            if (!data) return failure(404, "OBJECTIVE_NOT_FOUND", "Objective not found or not accessible.");
            return success(data);
          }

          // ---------------------------------------------------------
          // 3. OBJECTIVE KEY RESULTS
          // ---------------------------------------------------------
          case "key_results.list": {
            const query = supabase
              .from("company_key_results")
              .select("*")
              .eq("organization_id", organization.id)
              .order("created_at", { ascending: false })
              .limit(200);

            if (body.objective_id !== undefined) {
              if (!isUuid(body.objective_id)) {
                return failure(400, "INVALID_OBJECTIVE_ID", "objective_id must be a valid UUID.");
              }
              query.eq("objective_id", body.objective_id);
            }

            const { data, error } = await query;
            if (error) return databaseFailure(error);
            return success(data ?? []);
          }

          case "key_results.create": {
            const objectiveId = body.objective_id;
            const title = textValue(body.title, 180);
            const target = numberValue(body.target_value);
            const current = body.current_value === undefined ? 0 : numberValue(body.current_value);
            const confidence = body.confidence_percent === undefined
              ? 0
              : numberValue(body.confidence_percent);
            const unit = textValue(body.unit || "count", 30);

            if (
              !isUuid(objectiveId) ||
              title.length < 3 ||
              !Number.isFinite(target) ||
              target <= 0 ||
              !Number.isFinite(current) ||
              current < 0 ||
              !Number.isInteger(confidence) ||
              confidence < 0 ||
              confidence > 100 ||
              unit.length < 1
            ) {
              return failure(
                400,
                "INVALID_KEY_RESULT",
                "Provide a valid objective, title, positive target, non-negative current value, unit and confidence from 0 to 100.",
              );
            }

            const { data, error } = await supabase
              .from("company_key_results")
              .insert({
                organization_id: organization.id,
                objective_id: objectiveId,
                title,
                target_value: target,
                current_value: current,
                unit,
                confidence_percent: confidence,
                measurement_source: "manual",
                updated_by: actorId,
                created_by: actorId,
              })
              .select("*")
              .single();

            if (error) return databaseFailure(error);
            return success(data);
          }

          case "key_results.update": {
            if (!isUuid(body.key_result_id)) {
              return failure(400, "INVALID_KEY_RESULT_ID", "A valid key_result_id is required.");
            }

            const patch: Payload = { updated_by: actorId };

            if (body.title !== undefined) {
              const title = textValue(body.title, 180);
              if (title.length < 3) {
                return failure(400, "INVALID_TITLE", "The title must contain at least 3 characters.");
              }
              patch.title = title;
            }

            if (body.target_value !== undefined) {
              const target = numberValue(body.target_value);
              if (!Number.isFinite(target) || target <= 0) {
                return failure(400, "INVALID_TARGET", "target_value must be greater than zero.");
              }
              patch.target_value = target;
            }

            if (body.current_value !== undefined) {
              const current = numberValue(body.current_value);
              if (!Number.isFinite(current) || current < 0) {
                return failure(400, "INVALID_CURRENT_VALUE", "current_value cannot be negative.");
              }
              patch.current_value = current;
            }

            if (body.unit !== undefined) {
              const unit = textValue(body.unit, 30);
              if (!unit) return failure(400, "INVALID_UNIT", "A unit is required.");
              patch.unit = unit;
            }

            if (body.confidence_percent !== undefined) {
              const confidence = numberValue(body.confidence_percent);
              if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
                return failure(400, "INVALID_CONFIDENCE", "Confidence must be an integer from 0 to 100.");
              }
              patch.confidence_percent = confidence;
            }

            if (Object.keys(patch).length === 1) {
              return failure(400, "EMPTY_UPDATE", "Provide at least one key-result field to update.");
            }

            const { data, error } = await supabase
              .from("company_key_results")
              .update(patch)
              .eq("id", body.key_result_id)
              .eq("organization_id", organization.id)
              .select("*")
              .maybeSingle();

            if (error) return databaseFailure(error);
            if (!data) return failure(404, "KEY_RESULT_NOT_FOUND", "Key result not found or not accessible.");
            return success(data);
          }

          // ---------------------------------------------------------
          // 4. COMPANY DECISION LOG
          // ---------------------------------------------------------
          case "decisions.list": {
            const { data, error } = await supabase
              .from("company_decisions")
              .select("*")
              .eq("organization_id", organization.id)
              .order("decided_at", { ascending: false })
              .limit(100);

            if (error) return databaseFailure(error);
            return success(data ?? []);
          }

          case "decisions.create": {
            const title = textValue(body.title, 180);
            const decisionText = textValue(body.decision_text, 8000);
            const departmentId = body.department_id || null;

            if (title.length < 3 || decisionText.length < 3) {
              return failure(400, "INVALID_DECISION", "A title and decision text of at least 3 characters are required.");
            }

            if (departmentId !== null && !isUuid(departmentId)) {
              return failure(400, "INVALID_DEPARTMENT", "department_id must be a valid UUID or null.");
            }

            const { data, error } = await supabase
              .from("company_decisions")
              .insert({
                organization_id: organization.id,
                department_id: departmentId,
                title,
                context: textValue(body.context, 6000),
                decision_text: decisionText,
                rationale: textValue(body.rationale, 6000),
                decision_status: "active",
                created_by: actorId,
              })
              .select("*")
              .single();

            if (error) return databaseFailure(error);
            return success(data);
          }

          // ---------------------------------------------------------
          // 5. WEEKLY COMPANY SUMMARIES
          // ---------------------------------------------------------
          case "weekly_summaries.list": {
            const { data, error } = await supabase
              .from("weekly_company_summaries")
              .select("*")
              .eq("organization_id", organization.id)
              .order("week_start", { ascending: false })
              .limit(52);

            if (error) return databaseFailure(error);
            return success(data ?? []);
          }

          case "weekly_summaries.create": {
            if (!isDate(body.week_start) || !isDate(body.week_end) || body.week_end < body.week_start) {
              return failure(400, "INVALID_WEEK", "Provide valid week_start and week_end dates.");
            }

            const highlights = body.highlights === undefined ? [] : body.highlights;
            const blockers = body.blockers === undefined ? [] : body.blockers;

            if (!Array.isArray(highlights) || !Array.isArray(blockers)) {
              return failure(400, "INVALID_REPORT_LISTS", "highlights and blockers must be arrays.");
            }

            const { data, error } = await supabase
              .from("weekly_company_summaries")
              .insert({
                organization_id: organization.id,
                week_start: body.week_start,
                week_end: body.week_end,
                summary_markdown: textValue(body.summary_markdown, 20000),
                highlights: highlights.slice(0, 50),
                blockers: blockers.slice(0, 50),
                summary_status: "draft",
                created_by: actorId,
              })
              .select("*")
              .single();

            if (error) return databaseFailure(error);
            return success(data);
          }

          case "weekly_summaries.update":
          case "weekly_summaries.publish":
          case "weekly_summaries.archive": {
            if (!isUuid(body.summary_id)) {
              return failure(400, "INVALID_SUMMARY_ID", "A valid summary_id is required.");
            }

            const patch: Payload = {};

            if (body.summary_markdown !== undefined) {
              patch.summary_markdown = textValue(body.summary_markdown, 20000);
            }

            if (body.highlights !== undefined) {
              if (!Array.isArray(body.highlights)) {
                return failure(400, "INVALID_HIGHLIGHTS", "highlights must be an array.");
              }
              patch.highlights = body.highlights.slice(0, 50);
            }

            if (body.blockers !== undefined) {
              if (!Array.isArray(body.blockers)) {
                return failure(400, "INVALID_BLOCKERS", "blockers must be an array.");
              }
              patch.blockers = body.blockers.slice(0, 50);
            }

            if (action === "weekly_summaries.publish") {
              patch.summary_status = "published";
              patch.published_by = actorId;
              patch.published_at = new Date().toISOString();
            } else if (action === "weekly_summaries.archive") {
              patch.summary_status = "archived";
            } else if (body.summary_status !== undefined) {
              if (!isOneOf(body.summary_status, ["draft", "published", "archived"])) {
                return failure(400, "INVALID_SUMMARY_STATUS", "Invalid weekly summary status.");
              }

              patch.summary_status = body.summary_status;

              if (body.summary_status === "published") {
                patch.published_by = actorId;
                patch.published_at = new Date().toISOString();
              }
            }

            if (Object.keys(patch).length === 0) {
              return failure(400, "EMPTY_UPDATE", "Provide report content or a publish/archive action.");
            }

            const { data, error } = await supabase
              .from("weekly_company_summaries")
              .update(patch)
              .eq("id", body.summary_id)
              .eq("organization_id", organization.id)
              .select("*")
              .maybeSingle();

            if (error) return databaseFailure(error);
            if (!data) return failure(404, "SUMMARY_NOT_FOUND", "Weekly summary not found or not accessible.");
            return success(data);
          }

          // ---------------------------------------------------------
          // 6. PRODUCT RELEASE NOTES
          // ---------------------------------------------------------
          case "product_releases.list": {
            const { data, error } = await supabase
              .from("product_releases")
              .select("*")
              .eq("organization_id", organization.id)
              .order("created_at", { ascending: false })
              .limit(100);

            if (error) return databaseFailure(error);
            return success(data ?? []);
          }

          case "product_releases.create": {
            if (!isUuid(body.product_id)) {
              return failure(400, "INVALID_PRODUCT_ID", "A valid product_id is required.");
            }

            const version = textValue(body.version, 60);
            const title = textValue(body.title, 180);

            if (!version || title.length < 2) {
              return failure(400, "INVALID_RELEASE", "A version and title of at least 2 characters are required.");
            }

            const { data, error } = await supabase
              .from("product_releases")
              .insert({
                organization_id: organization.id,
                product_id: body.product_id,
                version,
                title,
                release_notes: textValue(body.release_notes, 20000),
                release_status: "draft",
                created_by: actorId,
              })
              .select("*")
              .single();

            if (error) return databaseFailure(error);
            return success(data);
          }

          case "product_releases.update":
          case "product_releases.publish":
          case "product_releases.archive": {
            if (!isUuid(body.release_id)) {
              return failure(400, "INVALID_RELEASE_ID", "A valid release_id is required.");
            }

            const patch: Payload = {};

            if (body.title !== undefined) {
              const title = textValue(body.title, 180);
              if (title.length < 2) {
                return failure(400, "INVALID_TITLE", "Release title must contain at least 2 characters.");
              }
              patch.title = title;
            }

            if (body.release_notes !== undefined) {
              patch.release_notes = textValue(body.release_notes, 20000);
            }

            if (action === "product_releases.publish") {
              patch.release_status = "published";
              patch.released_at = new Date().toISOString();
            } else if (action === "product_releases.archive") {
              patch.release_status = "archived";
            }

            if (Object.keys(patch).length === 0) {
              return failure(400, "EMPTY_UPDATE", "Provide release fields or a publish/archive action.");
            }

            const { data, error } = await supabase
              .from("product_releases")
              .update(patch)
              .eq("id", body.release_id)
              .eq("organization_id", organization.id)
              .select("*")
              .maybeSingle();

            if (error) return databaseFailure(error);
            if (!data) return failure(404, "RELEASE_NOT_FOUND", "Release not found or not accessible.");
            return success(data);
          }

          // ---------------------------------------------------------
          // 7. SERVICE STATUS AND OPERATOR CHECKS
          // ---------------------------------------------------------
          case "service_status": {
            const [components, incidents] = await Promise.all([
              supabase.from("service_components")
                .select("*").eq("organization_id", organization.id)
                .order("display_name", { ascending: true }),

              supabase.from("service_incidents")
                .select("*").eq("organization_id", organization.id)
                .order("started_at", { ascending: false }).limit(100),
            ]);

            if (components.error) return databaseFailure(components.error);
            if (incidents.error) return databaseFailure(incidents.error);

            return success({
              components: components.data ?? [],
              incidents: incidents.data ?? [],
            });
          }

          case "service_components.update": {
            const componentKey = textValue(body.component_key, 100);
            const status = body.component_status;

            if (!componentKey || !isOneOf(status, [
              "operational",
              "degraded",
              "outage",
              "maintenance",
              "unknown",
            ])) {
              return failure(400, "INVALID_COMPONENT_STATUS", "Provide a component_key and valid component status.");
            }

            const patch: Payload = {};

            if (body.display_name !== undefined) {
              const displayName = textValue(body.display_name, 120);
              if (displayName.length < 2) {
                return failure(400, "INVALID_DISPLAY_NAME", "Display name must contain at least 2 characters.");
              }
              patch.display_name = displayName;
            }

            if (body.description !== undefined) {
              patch.description = textValue(body.description, 500);
            }

            patch.component_status = status;

            if (status === "unknown") {
              patch.last_checked_at = null;
              patch.monitoring_source = null;
            } else {
              const checkNote = textValue(body.check_note, 200);
              if (checkNote.length < 5) {
                return failure(
                  400,
                  "CHECK_NOTE_REQUIRED",
                  "For a non-unknown status, provide a note describing the actual operator check.",
                );
              }

              patch.last_checked_at = new Date().toISOString();
              patch.monitoring_source = `manual_operator_check: ${checkNote}`;
            }

            patch.updated_by = actorId;

            const { data, error } = await supabase
              .from("service_components")
              .update(patch)
              .eq("component_key", componentKey)
              .eq("organization_id", organization.id)
              .select("*")
              .maybeSingle();

            if (error) return databaseFailure(error);
            if (!data) return failure(404, "COMPONENT_NOT_FOUND", "Service component not found or not accessible.");
            return success(data);
          }

          // ---------------------------------------------------------
          // 8. SERVICE INCIDENTS
          // ---------------------------------------------------------
          case "service_incidents.create": {
            const title = textValue(body.title, 180);
            const componentId = body.component_id || null;

            if (title.length < 3) {
              return failure(400, "INVALID_INCIDENT_TITLE", "Incident title must contain at least 3 characters.");
            }

            if (componentId !== null && !isUuid(componentId)) {
              return failure(400, "INVALID_COMPONENT_ID", "component_id must be a valid UUID or null.");
            }

            const { data, error } = await supabase
              .from("service_incidents")
              .insert({
                organization_id: organization.id,
                component_id: componentId,
                title,
                impact: textValue(body.impact, 3000),
                incident_status: "investigating",
                created_by: actorId,
                updated_by: actorId,
              })
              .select("*")
              .single();

            if (error) return databaseFailure(error);
            return success(data);
          }

          case "service_incidents.update": {
            if (!isUuid(body.incident_id)) {
              return failure(400, "INVALID_INCIDENT_ID", "A valid incident_id is required.");
            }

            const patch: Payload = { updated_by: actorId };

            if (body.title !== undefined) {
              const title = textValue(body.title, 180);
              if (title.length < 3) {
                return failure(400, "INVALID_INCIDENT_TITLE", "Incident title must contain at least 3 characters.");
              }
              patch.title = title;
            }

            if (body.impact !== undefined) {
              patch.impact = textValue(body.impact, 3000);
            }

            if (body.component_id !== undefined) {
              if (body.component_id !== null && !isUuid(body.component_id)) {
                return failure(400, "INVALID_COMPONENT_ID", "component_id must be a valid UUID or null.");
              }
              patch.component_id = body.component_id;
            }

            if (body.incident_status !== undefined) {
              if (!isOneOf(body.incident_status, [
                "investigating",
                "identified",
                "monitoring",
                "resolved",
              ])) {
                return failure(400, "INVALID_INCIDENT_STATUS", "Invalid incident status.");
              }

              patch.incident_status = body.incident_status;
              patch.resolved_at = body.incident_status === "resolved"
                ? new Date().toISOString()
                : null;
            }

            if (Object.keys(patch).length === 1) {
              return failure(400, "EMPTY_UPDATE", "Provide at least one incident field to update.");
            }

            const { data, error } = await supabase
              .from("service_incidents")
              .update(patch)
              .eq("id", body.incident_id)
              .eq("organization_id", organization.id)
              .select("*")
              .maybeSingle();

            if (error) return databaseFailure(error);
            if (!data) return failure(404, "INCIDENT_NOT_FOUND", "Incident not found or not accessible.");
            return success(data);
          }

          default:
            return failure(
              400,
              "UNKNOWN_ACTION",
              "This command-centre action is not supported.",
              {
                supported_actions: [
                  "overview",
                  "objectives.list",
                  "objectives.create",
                  "objectives.update",
                  "key_results.list",
                  "key_results.create",
                  "key_results.update",
                  "decisions.list",
                  "decisions.create",
                  "weekly_summaries.list",
                  "weekly_summaries.create",
                  "weekly_summaries.update",
                  "weekly_summaries.publish",
                  "weekly_summaries.archive",
                  "product_releases.list",
                  "product_releases.create",
                  "product_releases.update",
                  "product_releases.publish",
                  "product_releases.archive",
                  "service_status",
                  "service_components.update",
                  "service_incidents.create",
                  "service_incidents.update",
                ],
              },
            );
        }
      } catch (_error) {
        return failure(
          500,
          "COMMAND_CENTER_INTERNAL_ERROR",
          "The command-centre request could not be completed.",
        );
      }
    },
  ),
};
