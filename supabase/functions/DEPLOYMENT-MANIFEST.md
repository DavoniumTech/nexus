# Supabase Edge Function deployment manifest

**Supabase project:** `davonium-nexus`  
**Project reference:** `cmkroryimxskgqlaiiym`  
**Organization:** Davonium Technologies  
**Captured:** 2026-11-24  
**Source:** Deployed function export from the connected Supabase project.

The `index.ts` files in this directory are exported from the active deployed functions. Do not edit only the Dashboard copy. Make code changes in Git, validate them, then deploy the corresponding source.

| Function | Deployed version | Gateway JWT verification | Authentication note |
|---|---:|---|---|
| `bright-task` | 13 | enabled | Authenticated-user permission catalogue |
| `nexus-audit` | 5 | enabled | User session and audit permissions |
| `nexus-command-center` | 5 | enabled | Authenticated company commands |
| `nexus-communications` | 5 | enabled | Authenticated channels and messages |
| `nexus-content` | 5 | enabled | Authenticated announcements and investor content |
| `nexus-files` | 4 | enabled | Authenticated private document operations |
| `nexus-invitations` | 5 | enabled | Authenticated invitation management |
| `nexus-intelligence` | 15 | enabled | Authenticated DVNM Intelligence; General Assistant, Company Intelligence and greeting-only conversational path |
| `nexus-member-status` | 4 | enabled | Authenticated membership status |
| `nexus-notifications` | 4 | enabled | Authenticated notifications plus configured secret mode |
| `nexus-portal` | 4 | enabled | Authenticated client/investor portal |
| `nexus-projects` | 5 | enabled | Authenticated projects, milestones and tasks |
| `nexus-session` | 8 | enabled | Authenticated workspace session |
| `nexus-workspace` | 5 | enabled | Authenticated workspace and people |
| `nexus-workspace-admin` | 4 | enabled | Authenticated administrative operations |
| `nexus-analytics` | 8 | disabled | Supports user and trusted server-secret modes; finance analytics reads posted entries only and enforces permissions |
| `nexus-monitor` | 4 | disabled | Supports user and trusted server-secret monitoring mode; function enforces both paths |

## Security rules

- Fifteen functions require a valid user JWT at the Supabase gateway before the function body runs.
- The two mixed-auth functions (`nexus-analytics` and `nexus-monitor`) keep gateway verification off only because they accept trusted server-secret calls as well as user calls. Their `withSupabase` auth configuration and in-function checks remain authoritative.
- Do not switch the mixed-auth functions to gateway JWT verification without first separating the server-secret routes.
- User-facing operations must still check the caller identity, active organisation membership, explicit permission and database RLS. Gateway JWT verification is not a replacement for those checks.
- Never store service-role, Gemini provider or Nexus AI ledger secret values in this repository or in browser code.
- Preserve the AI server-ledger guard. The three-argument AI reservation routine is not executable by application roles; the four-argument overload validates the private server ledger key before reservation.

## Release procedure

1. Edit the function source in this directory.
2. Run the backend contract check and relevant tests.
3. Review the diff and verify the target function's authentication mode.
4. Deploy with the correct `verify_jwt` value from this manifest.
5. Confirm the deployed function is active and record its deployed version here.
6. Test a signed-in user and a least-privilege user before merging the release.
