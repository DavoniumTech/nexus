from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]

def require(condition, message):
    if not condition:
        raise SystemExit("Nexus release contract failed: " + message)

app = (ROOT / "app.js").read_text(encoding="utf-8")
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
analytics = (ROOT / "supabase/functions/nexus-analytics/index.ts").read_text(encoding="utf-8")
intelligence = (ROOT / "supabase/functions/nexus-intelligence/index.ts").read_text(encoding="utf-8")
manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
types = (ROOT / "supabase/types/database.types.ts").read_text(encoding="utf-8")

for relative in (
    "supabase/migrations/20261123215144_nexus_finance_and_product_analytics.sql",
    "supabase/types/database.types.ts",
    "manifest.webmanifest",
    "service-worker.js",
    "offline.html",
):
    require((ROOT / relative).is_file(), f"missing {relative}")

for table in ("finance_accounts", "finance_journal_entries", "finance_journal_lines", "finance_budgets", "analytics_events"):
    require(table in types, f"generated database types missing {table}")
    require(table in (ROOT / "supabase/migrations/20261123215144_nexus_finance_and_product_analytics.sql").read_text(encoding="utf-8"), f"initial finance migration missing {table}")

for action in (
    "events.ingest", "analytics.dashboard", "finance.overview",
    "finance.accounts.list", "finance.accounts.create", "finance.accounts.update",
    "finance.entries.list", "finance.entries.create",
    "finance.budgets.list", "finance.budgets.create", "finance.budgets.update",
):
    require(action in analytics, f"analytics/finance Edge Function route missing {action}")

for key in ("finance.view", "finance.accounts.manage", "finance.entries.manage", "finance.budgets.manage"):
    require(key in analytics, f"Edge Function permission gate missing {key}")

for tool in ("get_finance_overview", "list_finance_accounts", "list_finance_entries", "list_finance_budgets"):
    require(tool in intelligence, f"DVNM Intelligence tool missing {tool}")
require("finance|financial" in intelligence, "company intelligence scope does not include finance")

for feature in ("renderAnalytics", "renderFinance", "renderIntelligence", "renderMarkdownSafe", "trackEvent", "openPrivacySettings"):
    require(feature in app, f"frontend feature missing {feature}")
for key in ("analytics:renderAnalytics", "finance:renderFinance"):
    require(key in app, f"frontend page router missing {key}")
for action in ("finance.entries.create", "finance.budgets.create", "analytics.dashboard"):
    require(action in app, f"frontend action missing {action}")

for control in ("cookieConsent", "cookieAcceptAll", "cookieReject", "cookieCustomize", "manifest.webmanifest"):
    require(control in html, f"HTML app shell missing {control}")
for selector in (".os-command-centre", ".os-module-card", ".ai-os", ".ai-messages", ".ai-composer"):
    require(selector in css, f"responsive application styles missing {selector}")
require(manifest.get("display") == "standalone", "PWA must be standalone-installable")
require(manifest.get("start_url") == "./" and manifest.get("scope") == "./", "PWA scope/start URL must support GitHub Pages subpath")
require('url.pathname.includes("/functions/")' in worker, "service worker must not cache Edge Function calls")
require('url.pathname.includes("/auth/")' in worker, "service worker must not cache authentication calls")
require('url.pathname.includes("/storage/")' in worker, "service worker must not cache private storage calls")
require("service_role" not in app and "GEMINI_API_KEY" not in app and "NEXUS_AI_LEDGER_KEY" not in app, "browser bundle must not contain service/provider/ledger secrets")

print("Nexus release contract passed: finance schema, analytics routes, AI tools, privacy controls, and offline PWA shell.")
