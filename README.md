# Davonium Nexus — Live Frontend

A responsive, static frontend for the existing Davonium Technologies Supabase project `cmkroryimxskgqlaiiym`.

## Important design and security choices

- Uses the existing Supabase Auth session and signed-in user's JWT.
- Calls the deployed Edge Functions; it does not replace, migrate, or redeploy them.
- Uses the `bright-task` URL slug for the dashboard's `nexus-permissions` function.
- Does not contain a service-role key, Gemini API key, or `NEXUS_AI_LEDGER_KEY`.
- Does not bypass RLS or permission checks.
- Uses the existing organization slug `davonium-technologies`.
- Includes workspace, command centre, projects, tasks, clients, people, investors, products/analytics, objectives, documents, communications, announcements, notifications, DVNM Intelligence, monitoring, audit and permissions areas.

## Deploy without a local build

This is a static HTML/CSS/JavaScript site. No npm, Node, CLI, Docker or build step is required.

1. Create/open the GitHub repository `DavoniumTech/nexus`.
2. Upload the contents of this ZIP (not the ZIP file itself) to the repository root.
3. Commit to `main`.
4. In Cloudflare Pages, connect the GitHub repository.
5. Framework preset: **None**. Build command: leave empty. Build output directory: `/` (or `.` if the dashboard requires a relative path).
6. Deploy.

## First sign-in

Open the deployed site. Configure:
- Project URL: `https://cmkroryimxskgqlaiiym.supabase.co`
- Publishable/anon key: copy from Supabase Project Settings → API Keys.

Then sign in with an existing authorized employee account. Do not use the service-role key.

## Known integration notes

This is a first frontend integration pass against the exported Edge Function source. The server functions remain the source of truth. Some pages intentionally show clear empty/error states when a function action is denied, not implemented for a role, or returns a different payload shape.

The Documents page lists records and explains the private upload boundary; an end-to-end file picker/upload UI must be aligned to the exact `upload.prepare` and `upload.complete` request contract before enabling uploads. Similarly, the current project detail action is a safe read invocation; task and project creation forms use the exported function action names but must be verified against live required fields before production use.

DVNM Intelligence chat calls the existing conversation create/get and `chat` actions. The backend's free-tier quotas and privacy controls remain authoritative. The UI never raises the configured token or spend limits.

## Files

- `index.html` — application shell and navigation
- `styles.css` — responsive dark glass / luminous starfield UI
- `app.js` — authentication, Edge Function client, module views and actions
