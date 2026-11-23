# Davonium Nexus — owner setup and release checklist

This checklist separates code work already completed from configuration that must be completed by an authorised Davonium owner in the Supabase and Google dashboards.

## 1. Required secret configuration

In Supabase Dashboard → Project → Edge Functions → Secrets, verify that the following names exist for the `davonium-nexus` project:

- `GEMINI_API_KEY`
- `NEXUS_AI_LEDGER_KEY`

The values must stay in the Supabase secret manager. Never put them in `app.js`, GitHub, screenshots, issues or chat messages. The active private ledger-key table already contains one non-revoked key hash; do not rotate the ledger secret unless the server secret and stored hash are changed together. Use DVNM Intelligence's health/diagnostic display to check the boolean configured status, not the secret value.

## 2. Google Free Tier and AI activation

Before enabling DVNM Intelligence:
1. Check in Google AI Studio that the API project is on the Free Tier and has no billing account attached.
2. Review Google's current Gemini API terms and Free Tier data-use disclosure.
3. Understand that Google may use content submitted through the Free Tier to improve its products.
4. Only submit company data that Davonium is authorised to disclose to that provider.
5. Sign in to Nexus as the owner, open DVNM Intelligence and explicitly tick both confirmations in the enable dialog.

Do not mark the privacy or no-billing confirmations on behalf of the owner. The global AI policy remains off until these owner confirmations are made. The existing $1 estimated monthly-cost ceiling remains a guard; provider quotas may be lower than app quotas.

## 3. Supabase Auth hardening

The Supabase security advisor currently reports leaked-password protection disabled. In Supabase Dashboard → Authentication → Security and Protection, review and enable leaked-password protection. Also review:
- minimum password length and password complexity
- MFA enrolment and recovery for the owner account
- Auth rate limits and abuse protections
- redirect URLs for the Nexus domain
- email confirmation and invitation behaviour

Do not enforce mandatory MFA for all employees until the owner account has MFA enrolled and recovery has been tested.

## 4. Email delivery

Review whether a production SMTP provider is configured for Supabase Auth. The built-in email service is intended for development/testing and is rate-limited. Production invitations and password resets require a configured mail provider. No email service credentials should be committed to Git.

## 5. Backup and restore

Run the PowerShell backup helper from the repository root after installing/authenticating the Supabase CLI:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\backup-supabase.ps1
```

The helper exports the custom `public` and `private` schema, their data, and custom roles. Supabase-managed Auth/Storage schemas and Storage object files are excluded. Store the output encrypted and copy it to a second secure location. Before production use, separately define a tested procedure for Auth user recovery and the private Storage bucket's file objects.

## 6. First owner acceptance test

Using the actual owner account, verify:
- sign-in, sign-out, password recovery and MFA recovery
- dashboard overview and responsive behaviour on desktop and mobile
- projects, tasks, clients, departments, teams and invitation workflows
- product registry, metric definitions, releases and integration test states
- private document upload/download and denied cross-project access
- company and direct communications, notifications and Realtime refresh
- announcements, investor access and client portal boundaries
- role/permission override, audit trail and service monitoring
- General Assistant and Company Intelligence with separate conversation histories
- quota counters and owner AI limit changes
- a least-privilege employee account cannot access owner-only controls or another user's conversations

Do not populate production tables with guessed/sample operational records just to make the dashboard look busy.

## 7. Migration baseline

The five tracked migration files exactly match the five applied remote migration versions. The repository still needs a full initial schema baseline. Once the Supabase CLI and database password are available to the owner, follow the official workflow to pull the current remote schema and review the resulting baseline before the first CLI-driven schema deployment. Do not reset the live database.

## Current state

- Backend migrations: applied and tracked.
- Edge Function source: all 17 functions exported and tracked.
- Gateway JWT: required on 15 of 17 functions; the two mixed user/secret services have explicit custom authentication.
- RLS: enabled on exposed public tables, with selected policies optimised.
- AI: code and capacity controls ready; global service policy awaits owner secrets and provider consent.
- Payments: intentionally not included.
- Production release: awaiting CI browser run and authenticated owner acceptance test.
