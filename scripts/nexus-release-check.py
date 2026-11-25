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

require(any(p.name.endswith("_nexus_finance_ledger_immutability.sql") for p in (ROOT / "supabase/migrations").glob("*.sql")), "finance ledger hardening migration is not tracked")

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
for action in ("finance.entries.create", "finance.budgets.create", "analytics.dashboard", "finance.analytics"):
    require(action in (app + analytics), f"finance/analytics action missing {action}")
require("renderThinLineChart" in app, "thin SVG analytics renderer is missing")
require("theme-black" in app and "black-theme" in css, "Elevated Black theme is missing")
require("ai-brand-logo" in app and "./assets/branding/davonium-d-icon.webp" in app, "DVNM Intelligence must use the official Davonium mark")
require('conversation.${v.operation}' in app and all(key in intelligence for key in ("conversation.rename", "conversation.archive", "conversation.unarchive", "conversation.delete")), "DVNM conversation management actions are missing")

require("COMPANY_GREETING" in intelligence and "buildCompanyGreetingInstruction" in intelligence and "companyDataRequired" in intelligence, "Company Intelligence greeting flow is missing")
require("nexus_ai_sync_server_key" in intelligence and "ctx.supabaseAdmin.rpc" in intelligence, "Server-only AI ledger hash sync is missing")
require((ROOT / "supabase/migrations/20261124001855_nexus_ai_server_key_sync.sql").is_file(), "AI ledger sync migration is not tracked")
sync_migration = (ROOT / "supabase/migrations/20261124001855_nexus_ai_server_key_sync.sql").read_text(encoding="utf-8")
require("GRANT EXECUTE" in sync_migration and "TO service_role" in sync_migration, "AI ledger sync must be service-role only")
require("FROM PUBLIC, anon, authenticated" in sync_migration, "AI ledger sync must remain unavailable to browser roles")
require("ACCENT_PALETTES" in app and all(key in app for key in ("ocean", "azure", "violet", "emerald", "mint", "amber", "sunset", "rose", "indigo", "monochrome")), "Ten accent themes are missing")
require("setSidebarCollapsed" in app and "expandNav" in app and 'id="expandNav"' in html, "Desktop sidebar collapse recovery control is missing")
require("mobile-more" in app and 'class="mobile-app-nav"' in html and ".mobile-app-nav" in css, "Mobile app navigation is missing")
require('class="notification-bell"' in html and 'data-icon="bell"' in html, "Top navigation notification bell icon is missing")
require("Elevated Black" not in app, "Appearance label still contains the rejected Elevated Black wording")
require("davonium-nexus-shell-v6-20261125" in worker, "PWA shell cache must be versioned for the current release")

for control in ("cookieConsent", "cookieAcceptAll", "cookieReject", "cookieCustomize", "manifest.webmanifest"):
    require(control in html, f"HTML app shell missing {control}")
for selector in (".os-command-centre", ".os-module-card", ".ai-os", ".ai-messages", ".ai-composer"):
    require(selector in css, f"responsive application styles missing {selector}")
require(manifest.get("display") == "standalone", "PWA must be standalone-installable")
require(manifest.get("start_url") == "./" and manifest.get("scope") == "./", "PWA scope/start URL must support GitHub Pages subpath")
require('url.pathname.includes("/functions/")' in worker, "service worker must not cache Edge Function calls")
require('url.pathname.includes("/auth/")' in worker, "service worker must not cache authentication calls")
require('url.pathname.includes("/storage/")' in worker, "service worker must not cache private storage calls")
require("SUPABASE_SERVICE_ROLE_KEY" not in app and "GEMINI_API_KEY" not in app and "NEXUS_AI_LEDGER_KEY" not in app, "browser bundle must not contain service/provider/ledger key values or environment names")
require('auth.signOut({scope:"local"})' in app, "normal sign-out must revoke only the current browser session")
require("waitForSupabaseLibrary" in app and "Nexus loaded, but the secure sign-in library could not be reached" in app, "Nexus must wire its UI independently of the Supabase CDN")
require("https://unpkg.com/@supabase/supabase-js@2" in html and "script.async = true" in html, "Supabase CDN must load asynchronously with a fallback")
require("refresh_token_not_found" in app and "isMissingRefreshToken" in app, "stale saved refresh tokens must be recoverable without revoking other sessions")

print("Nexus release contract passed: finance schema, analytics routes, AI tools, privacy controls, and offline PWA shell.")
