# Davonium Nexus — Live Frontend

A responsive, static frontend for the existing Davonium Technologies Supabase project `cmkroryimxskgqlaiiym`.

## Security and architecture

- Uses the existing Supabase Auth session and the signed-in user's access token.
- Calls the deployed Supabase Edge Functions; it does not replace, migrate, or redeploy them.
- Uses the `bright-task` URL slug for the permissions Edge Function.
- Does not include a service-role key, Gemini API key, or `NEXUS_AI_LEDGER_KEY`.
- Does not bypass Row Level Security or backend permission checks.
- Uses the organization slug `davonium-technologies`.
- Provides workspace, command centre, projects, tasks, clients, people, investors, products and analytics, objectives, documents, communications, announcements, notifications, DVNM Intelligence, monitoring, audit, and permissions areas.

## Deploy

This is a static HTML/CSS/JavaScript site. No npm, Node, CLI, Docker, or build step is required.

For Cloudflare Pages, connect this repository, select the `main` branch, use the **None** framework preset, leave the build command empty, and set the output directory to `/` (or `.` if the dashboard requires a relative path).

## First sign-in

Configure the existing Supabase project in the app's Connection settings:

- Project URL: `https://cmkroryimxskgqlaiiym.supabase.co`
- Key: Supabase publishable/anon key from Project Settings → API Keys.

Sign in with an existing authorized employee account. Never put a service-role key in the browser.

## Integration status

This is a first frontend integration pass based on the exported Edge Function source. Edge Functions remain the source of truth. Some actions still need verification against the live authenticated account and the exact backend request/response contracts. In particular, document upload, project/task writes, investor administration, permission changes, and DVNM Intelligence must be verified before production use.

## Files

- `index.html` — application shell and navigation
- `styles.css` — responsive navy/cyan starfield UI
- `app.js` — authentication, Edge Function client, module views, and actions
- `backend-reference/EDGE-FUNCTION-MAP.md` — inspected Edge Function action reference
