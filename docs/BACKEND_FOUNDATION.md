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

The current remote database reported no migration history at the time of the initial audit. There are now six applied, tracked migrations covering AI reservation hardening/capacity, assistant modes/settings, RLS policy optimisation, AI Realtime publication, core join indexes, and the RLS event-trigger ACL. These are additive changes and must not be mistaken for a complete historical baseline. Before future schema work, export and review the full current schema with the Supabase CLI (`supabase db pull`) and preserve it as a reviewed baseline migration. Do not attempt to recreate the current schema from generated TypeScript types alone.

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

## Query and join indexes

The `nexus_core_join_indexes` migration adds targeted composite indexes for organisation-scoped membership, invitations, channel membership, direct conversations/messages, notifications, team membership, product metrics/releases, project membership/documents/milestones/decisions, assigned tasks and service incident lookups. It is additive and preserves all existing indexes. Supabase's unindexed-FK advisory count decreased from 86 to 62. The remaining warnings are largely single-user audit references or less-used relationship paths; do not blanket-index them. Newly added indexes can appear in the unused-index advisory until real workload arrives. Reassess with representative production queries before removing any index.

## Realtime delivery

The existing `supabase_realtime` publication already contains the secured collaboration, task, notification and service tables. The tracked `nexus_realtime_intelligence` migration adds `nexus_ai_conversations` and `nexus_ai_messages`. The browser subscribes with the authenticated Supabase client and organisation filters; table RLS remains authoritative. The current implementation subscribes to INSERT and UPDATE only (never DELETE events) and removes the channel on sign-out. The design uses Postgres Changes for the early company deployment; evaluate private Broadcast channels and server-authorised fan-out before scaling to large subscriber counts. The Supabase Free plan has finite Realtime limits.

## Free-plan backup and continuity

Davonium Technologies currently uses the Supabase Free plan. Supabase documents that Free projects do not receive automatic daily database backups and can be paused after a week of low activity. The project should therefore be checked regularly for activity and manually exported.

A Windows backup helper is available at `scripts/backup-supabase.ps1`. After installing the Supabase CLI and authenticating, run it from PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\backup-supabase.ps1
```

It writes private backup files under the ignored local `backups/` directory. The export includes the custom `public` and `private` schema, application data from those schemas, and custom roles. It does **not** export managed Auth/Storage schemas, Storage file objects, or a point-in-time recovery snapshot. Keep encrypted copies somewhere other than the same computer. Never commit backups to Git.

Before a recovery or migration to another project, review the dump, restore privileges/default privileges carefully, and verify Storage bucket policies, Auth users/configuration, Edge Function source/secrets and external assets separately.

The full historical schema baseline is still missing from Git. Once the local Supabase CLI is installed and the owner can authenticate to the project database, use the documented remote workflow to pull the current schema into a reviewed baseline migration. Do not run `db reset --remote` or use destructive reset operations against the live project.

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
