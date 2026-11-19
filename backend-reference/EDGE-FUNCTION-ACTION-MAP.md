# Davonium Nexus — Supabase Edge Function integration map

This document describes the **browser-facing integration surface** used by this frontend. It is based on the 17 Edge Function source exports supplied for the project on 19 November 2026. It is not a replacement for the deployed TypeScript source or database policies.

## Connection and request model

- Supabase project URL: `https://cmkroryimxskgqlaiiym.supabase.co`
- Project ref: `cmkroryimxskgqlaiiym`
- Workspace selector: `davonium-technologies`
- The browser uses the Supabase publishable/anon key as `apikey` and the signed-in user's access token as `Authorization: Bearer …`.
- Organisation-scoped actions receive the active workspace's actual `organization_id` UUID in the JSON request body.
- The application reads the user's workspace identity from `nexus-session`, then loads effective permissions from the `bright-task` endpoint.
- Function responses are normalised from the function's JSON `data` envelope where present. The UI displays backend errors instead of fabricating success.

## Deployed Edge Functions

| Frontend module | Actual deployed function slug | Action surface used |
|---|---|---|
| Session and workspace identity | `nexus-session` | POST with an empty JSON body; reads `identity` and `workspaces` |
| Effective permissions | `bright-task` | POST with `organization_id`; no action field |
| Workspace / departments / teams | `nexus-workspace` | `overview`, `members`, `departments`, `create_department`, `update_department`, `teams`, `create_team`, `update_team`, `set_member_details`, `set_member_role`, `client_accounts`, `create_client_account`, `update_client_account` |
| Workspace administration | `nexus-workspace-admin` | `members.list`, `members.role.update`, `members.permission.set`, `members.permission.clear`, `departments.list/create/update`, `teams.list/create/update`, `clients.list/create/update`, `clients.members.list`, `investor.access.list`, `investor.access.set` |
| Membership lifecycle | `nexus-member-status` | `members.status.update` |
| Invitations | `nexus-invitations` | `list`, `create`, `send`, `cancel`, `accept` |
| Projects and delivery | `nexus-projects` | `list_projects`, `create_project`, `get_project`, `update_project`, `project_members`, `assign_project_member`, `remove_project_member`, `list_milestones`, `create_milestone`, `update_milestone`, `list_tasks`, `create_task`, `update_task`, `list_task_comments`, `add_task_comment`, `list_project_decisions`, `add_project_decision` |
| Products and analytics | `nexus-analytics` | `overview`, `products`, `create_product`, `latest_metrics`, `metric_history`, `metric_definitions`, `create_metric_definition`, `update_metric_definition`, `create_manual_metric`, `pending_manual_metrics`, `verify_manual_metric`, `integrations`, `register_integration`, `set_integration_state`, `ingestion_runs`, `sync_events` |
| Strategy / command centre | `nexus-command-center` | `overview`, `objectives.list/create/update`, `key_results.list/create/update`, `decisions.list/create`, `weekly_summaries.list/create/update/publish/archive`, `product_releases.list/create/update/publish/archive`, `service_status`, `service_components.update`, `service_incidents.create/update` |
| Private files | `nexus-files` | `documents.list`, `upload.prepare`, `upload.complete`, `documents.download`, `documents.visibility.update`, `documents.archive` |
| Channels and direct messages | `nexus-communications` | `channels.list/create/update`, `channels.members.list/set`, `messages.list/send/moderate`, `direct.start/list`, `direct.messages.list/send` |
| Announcements and investor updates | `nexus-content` | `announcements.list/create/update/publish/archive`, `investor_updates.list/create/update/publish/archive` |
| Notifications | `nexus-notifications` | `inbox.list`, `inbox.mark_read`, `inbox.mark_all_read`, `preferences.get/update`, `delivery.settings.get/update` |
| Monitoring | `nexus-monitor` | `status`, `integrations.list`, `integration_runs.list` |
| Audit and session assurance | `nexus-audit` | `session.assurance`, `audit.list` |
| DVNM Intelligence | `nexus-intelligence` | `health`, `capabilities`, `diagnostics`, `conversations.list`, `conversation.create/get/rename/archive/unarchive/delete`, `usage.summary`, `policy.status/enable/disable`, `chat` |
| Client / investor portal | `nexus-portal` | `client.projects.list`, `client.documents.list`, `investor.updates.list` |

## Private document flow

1. Ask `nexus-files` for `upload.prepare` with document metadata and selected project.
2. Upload the bytes to the private Supabase Storage bucket `nexus-private-documents` using the returned signed upload details.
3. Call `upload.complete` to register the stored object as a Nexus document.
4. For a download, call `documents.download` and navigate to the returned short-lived signed URL. Do not generate a public object URL.

The exported storage policy is private and the bucket limit is 25 MiB. The database and Storage RLS policies remain authoritative for both reads and uploads.

## Security and authority boundaries

- Never put a service-role key, Gemini API key, `NEXUS_AI_LEDGER_KEY`, or any other trusted server secret in this static frontend.
- Do not call tables directly from the browser to bypass Edge Functions or RLS.
- Do not expose `nexus-monitor`'s `run_checks` or `integration.check` actions to browser users; these require trusted monitor authority.
- Do not expose `nexus-notifications`'s `delivery.test` or server-side `notification.create` actions to browser users.
- `nexus-intelligence` is a read-only assistant over approved Nexus data. Its server-side reservation/completion ledger and quota/cost controls must not be bypassed. Enabling it requires the owner to review the provider's Free Tier privacy/data-use terms and confirm the project is not billed.
- The UI's permission checks are for affordance and usability only. The deployed Edge Functions, database RLS, and security-definer routines remain the actual access boundary.
- Do not treat a hidden button as authorisation; always rely on the server's permission enforcement.

## Validation status

- Frontend source is syntax-checked with `node --check app.js` and the HTML document is parsed for structural errors.
- All 17 exported function sources were reviewed and their action surfaces mapped.
- No signed-in browser session for the owner's live Supabase account was available to this build process. Therefore, live data reads and writes (including document transfer and AI chat) still require the first authenticated smoke test in the deployed environment. A source-level integration map is not a claim that every endpoint has passed end-to-end testing.
