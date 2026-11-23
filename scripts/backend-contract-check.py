#!/usr/bin/env python3
"""Static contract checks for the Davonium Nexus frontend/backend source tree.

These checks do not connect to Supabase and never inspect project secrets.
They catch accidental drift between committed SQL migrations, the AI Edge
Function contract, and browser integration before a pull request is merged.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
EDGE = ROOT / "supabase" / "functions" / "nexus-intelligence" / "index.ts"
APP = ROOT / "app.js"
INDEX = ROOT / "index.html"

required_migrations = [
    "20261123200353_nexus_ai_guard_and_capacity.sql",
    "20261123200528_nexus_ai_modes_and_extended_limits.sql",
    "20261123201433_nexus_rls_policy_performance.sql",
    "20261123203000_nexus_realtime_intelligence.sql",
]
missing = [name for name in required_migrations if not (MIGRATIONS / name).is_file()]
if missing:
    raise SystemExit("Missing tracked Supabase migrations: " + ", ".join(missing))

guard = (MIGRATIONS / required_migrations[0]).read_text(encoding="utf-8")
modes = (MIGRATIONS / required_migrations[1]).read_text(encoding="utf-8")
rls = (MIGRATIONS / required_migrations[2]).read_text(encoding="utf-8")
realtime = (MIGRATIONS / required_migrations[3]).read_text(encoding="utf-8")
edge = EDGE.read_text(encoding="utf-8")
app = APP.read_text(encoding="utf-8")
html = INDEX.read_text(encoding="utf-8")

contracts = {
    "four-argument AI reservation RPC": "p_server_key text" in guard,
    "direct three-argument reservation is revoked": "nexus_ai_reserve_request(uuid, uuid, uuid)" in guard and "FROM PUBLIC, anon, authenticated" in guard,
    "ledger credential hash validation": "private.nexus_ai_server_keys" in guard and "extensions.digest" in guard,
    "general/company conversation mode": "assistant_mode" in modes and "('general','company')" in modes,
    "bounded AI settings RPC": "nexus_ai_update_settings" in modes and "p_max_output_tokens_per_request NOT BETWEEN 100 AND 8192" in modes,
    "daily AI response quota": "200000" in modes and "p_daily_request_limit NOT BETWEEN 1 AND 200" in modes,
    "monthly budget ceiling": "p_monthly_budget_usd NOT BETWEEN 0 AND 1" in modes,
    "optimised AI RLS policies": "CREATE POLICY nexus_ai_conversations_owner" in rls and "(SELECT auth.uid())" in rls,
    "AI conversations in Realtime publication": "public.nexus_ai_conversations" in realtime,
    "AI messages in Realtime publication": "public.nexus_ai_messages" in realtime,
    "authenticated Edge Function": "withSupabase" in edge and 'auth: "user"' in edge,
    "private server ledger secret used": 'Deno.env.get("NEXUS_AI_LEDGER_KEY")' in edge,
    "general assistant prompt": "buildGeneralSystemInstruction" in edge,
    "company assistant tool gate": 'assistantMode === "company" ? getAvailableTools(can) : []' in edge,
    "owner AI settings action": '"policy.update"' in edge and '"nexus_ai_update_settings"' in edge,
    "policy enable argument matches SQL": "p_enabled: enabling" in edge,
    "browser contains no provider key references": "GEMINI_API_KEY" not in app and "NEXUS_AI_LEDGER_KEY" not in app,
    "frontend exposes two AI modes": 'id="aiModeSelect"' in app and "General Assistant" in app and "Company Intelligence" in app,
    "frontend exposes bounded limit controls": "function manageAILimits()" in app,
    "Realtime setup cleans up subscriptions": "async function clearRealtime()" in app and "await clearRealtime();" in app,
    "Realtime excludes DELETE events": 'event:"DELETE"' not in app and 'event: "DELETE"' not in app,
    "official Davonium D-mark referenced": './assets/branding/davonium-d-icon.webp' in html,
}

failed = [label for label, passed in contracts.items() if not passed]
for label, passed in contracts.items():
    print(("PASS" if passed else "FAIL") + "  " + label)

if failed:
    print("\nBackend/frontend contract checks failed: " + "; ".join(failed), file=sys.stderr)
    raise SystemExit(1)

print(f"\nAll {len(contracts)} Nexus source contract checks passed.")
