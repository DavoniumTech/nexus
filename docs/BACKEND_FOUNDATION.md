# Davonium Nexus — backend foundation

This repository retains the existing Supabase implementation. Work is being staged on the `backend-foundation` branch; the production frontend and `main` branch remain unchanged until validation and review.

## Existing services

- 51 public tables with Row Level Security and 103 public policies.
- 17 deployed Edge Functions.
- Supabase Auth and a private `nexus-private-documents` Storage bucket.
- Role permissions with user-specific overrides.
- Audit triggers and read-only DVNM Intelligence tools.
- Product metrics, service monitoring, communications, notifications and investor portal foundations.
- Supabase Realtime publication for collaboration, tasks, milestones, notifications, service telemetry, and private DVNM Intelligence conversations/messages.

## Migration discipline

The current remote database reported no migration history at the time of the initial audit. The first tracked change is therefore additive and must not be mistaken for a complete historical baseline. Before future schema work, export and review the full current schema with the Supabase CLI (`supabase db pull`) and preserve it as a reviewed baseline migration. Do not attempt to recreate the current schema from generated TypeScript types alone.

## DVNM Intelligence capacity target

The tracked migration raises app limits to:
- 100 requests per day and 10 per five minutes.
- 10,000 characters per input.
- 16 history messages.
- 30,000 estimated input tokens per request.
- 8,192 output tokens per response.
- 200,000 output tokens per day.
- 40,000 response characters.

The existing $1 monthly estimated-cost ceiling remains unchanged. Google Gemini Free Tier currently advertises zero token charges for eligible models, but says submitted content may be used to improve Google products. Enabling company-data analysis therefore requires an explicit organisation decision about that data transfer. The provider's quotas are not controlled by Nexus and may be lower than the local app limits.

## Realtime delivery

The existing `supabase_realtime` publication already contains the secured collaboration, task, notification and service tables. The tracked `nexus_realtime_intelligence` migration adds `nexus_ai_conversations` and `nexus_ai_messages`. The browser subscribes with the authenticated Supabase client and organisation filters; table RLS remains authoritative. The current implementation subscribes to INSERT and UPDATE only (never DELETE events) and removes the channel on sign-out. The design uses Postgres Changes for the early company deployment; evaluate private Broadcast channels and server-authorised fan-out before scaling to large subscriber counts. The Supabase Free plan has finite Realtime limits.

## Production safeguards

- All company data must remain behind authenticated sessions, RLS and permission checks.
- Service-role, provider and ledger secrets must never be shipped to the browser.
- The public three-argument AI reservation routine is revoked from application roles; the four-argument routine verifies the private server ledger key before reserving quota.
- The Edge Function must match the live SQL RPC parameter names exactly.
- No payment provider, subscription, billing or commission feature is included.
- Do not enable general-purpose external AI features against private company data until the provider privacy mode has been reviewed.

## Remaining release gates

1. Verify the full remote schema baseline and migration history.
2. Verify required Supabase secrets without displaying their values.
3. Test authenticated flows under owner, admin, manager and least-privilege test accounts.
4. Test Edge Function and database contracts, including quota reservation and completion.
5. Configure Auth SMTP, password protection and MFA policy for production.
6. Exercise storage, realtime, communications, notifications and export/restore.
7. Complete accessible desktop/mobile visual and interaction QA before merging to `main`.
