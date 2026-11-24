"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = process.cwd();
const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const app = fs.readFileSync(path.join(root,"app.js"),"utf8");
const css = fs.readFileSync(path.join(root,"styles.css"),"utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root,"manifest.webmanifest"),"utf8"));
const worker = fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
function has(source,value,label){assert.ok(source.includes(value),label+" is missing: "+value);}
for (const feature of [
 "analytics:renderAnalytics","finance:renderFinance","intelligence:renderIntelligence",
 "async function renderOverview","async function renderAnalytics","async function renderFinance",
 "async function renderIntelligence","function renderMarkdownSafe","function openPrivacySettings",
 "function trackEvent","aiModeSelect","aiComposer","aiMessageInput",
 "finance.entries.create","finance.budgets.create","analytics.dashboard"
]) has(app,feature,"Nexus application feature");
for (const control of ["cookieConsent","cookieAcceptAll","cookieReject","cookieCustomize"]) has(html,control,"Privacy control");
for (const cls of [".os-command-centre",".os-module-card",".os-kpi-grid",".ai-os",".ai-messages",".ai-composer"]) has(css,cls,"Application UI style");
assert.equal(manifest.display,"standalone","Nexus must be installable as a standalone PWA");
assert.ok(manifest.start_url==="./"&&manifest.scope==="./","PWA paths must work at the GitHub Pages subpath");
has(worker,'url.pathname.includes("/functions/")',"API network-only exclusion");
has(worker,'url.pathname.includes("/auth/")',"Auth network-only exclusion");
has(worker,'url.pathname.includes("/storage/")',"Storage network-only exclusion");

async function main(){
 const browser=await chromium.launch({headless:true}),errors=[];
 try{
  for(const viewport of [{width:320,height:720},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
   const page=await browser.newPage({viewport});
   page.on("pageerror",e=>errors.push(viewport.width+"px: "+e.message));
   const response=await page.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
   assert.ok(response&&response.ok(),"Nexus HTML must load at "+viewport.width+"px");
   await page.waitForSelector("#authScreen");
   assert.ok(await page.locator("#authScreen").isVisible(),"Signed-out users must see secure access");
   assert.ok(await page.locator("#authForm").isVisible(),"Sign-in form must be visible");
   assert.equal(await page.locator("#authEmail").getAttribute("type"),"email","Email uses an email input");
   assert.equal(await page.locator("#authPassword").getAttribute("type"),"password","Password is masked");
   assert.ok((await page.title()).includes("Davonium Nexus"),"Product title stays branded");
   const d=await page.evaluate(()=>({w:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth,bw:document.body.scrollWidth}));
   assert.ok(d.sw<=d.w+1,"No document horizontal overflow at "+viewport.width+"px");
   assert.ok(d.bw<=d.w+1,"No body horizontal overflow at "+viewport.width+"px");
   assert.ok(await page.locator('.auth-brand img[alt="Davonium Technologies logo"]').count(),"Original Davonium mark exists");
   await page.close();
  }

  // Simulate the production sign-in and authenticated company boot with isolated test data.
  const loginContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    serviceWorkers: "block"
  });
  const loginPage = await loginContext.newPage();
  loginPage.on("pageerror", error => errors.push("signed-in: " + error.message));
  loginPage.on("console", message => {
    if (message.type() === "error") errors.push("signed-in console: " + message.text());
  });
  await loginPage.addInitScript(() => {
    const user = { id: "nexus-smoke-user", email: "nexus-smoke@example.test" };
    const session = {
      access_token: "nexus-smoke-access-token",
      refresh_token: "nexus-smoke-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      user
    };
    let activeSession = session;
    window.supabase = {
      createClient: function () {
        return {
          auth: {
            onAuthStateChange: function () {
              return { data: { subscription: { unsubscribe: function () {} } } };
            },
            getSession: async function () {
              return { data: { session: activeSession }, error: null };
            },
            signInWithPassword: async function () {
              activeSession = session;
              return { data: { session, user }, error: null };
            },
            signOut: async function () {
              activeSession = null;
              return { error: null };
            }
          }
        };
      }
    };
  });
  await loginPage.route(/supabase-js@2/, route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "/* Supabase auth is supplied by the isolated addInitScript mock. */"
  }));
  const smokeConversationId = "11111111-1111-4111-8111-111111111111";
  const mockConversations = [];
  const mockAnalyticsActions = [];
  const mockFinanceResponses = [];
  const mockAIRequests = [];
  const mockAIResponses = [];
  loginPage.on("dialog", dialog => dialog.accept());
  await loginPage.route("https://cmkroryimxskgqlaiiym.supabase.co/functions/v1/**", async route => {
    const url = new URL(route.request().url());
    const functionName = url.pathname.split("/").pop();
    let body = {};
    try { body = route.request().postDataJSON() || {}; } catch {}
    if (functionName === "nexus-analytics") mockAnalyticsActions.push(body.action || "missing-action");
    let payload = { success: true };
    if (functionName === "nexus-session") {
      payload = {
        success: true,
        identity: { display_name: "Nexus Smoke Test" },
        workspaces: [{
          id: "nexus-smoke-org",
          name: "Davonium Technologies",
          slug: "davonium-technologies",
          role: "owner",
          membership_status: "active"
        }]
      };
    } else if (functionName === "bright-task") {
      payload = {
        permissions: [
          { key: "projects.create", allowed: true },
          { key: "finance.view", allowed: true },
          { key: "finance.accounts.manage", allowed: true },
          { key: "finance.entries.manage", allowed: true },
          { key: "finance.budgets.manage", allowed: true },
          { key: "analytics.view", allowed: true },
          { key: "intelligence.use", allowed: true },
          { key: "intelligence.manage", allowed: true }
        ]
      };
    } else if (functionName === "nexus-notifications") {
      payload = { success: true, notifications: [] };
    } else if (functionName === "nexus-analytics") {
      if (body.action === "analytics.dashboard") {
        payload = { success: true, analytics: { events_30d: 4, events_7d: 3, active_users_30d: 1, daily: [{day:"2026-11-24",events:4}], top_pages: [] } };
      } else if (body.action === "finance.analytics") {
        payload = {
          success: true,
          analytics: {
            posted_entry_count: 2,
            sampling_limited: false,
            currencies: [{
              currency_code: "NGN",
              line_count: 4,
              monthly: [
                { month: "2026-10", label: "Oct 26", revenue: 1200, expenses: 700 },
                { month: "2026-11", label: "Nov 26", revenue: 1500, expenses: 850 }
              ]
            }]
          }
        };
      } else {
        payload = { success: true, analytics: {}, finance: { accounts: [], totals: {} }, accounts: [], entries: [], budgets: [] };
      }
    } else if (functionName === "nexus-intelligence") {
      if (body.action === "health") {
        payload = { success: true, gemini_configured: true, ledger_configured: true };
      } else if (body.action === "policy.status") {
        payload = { success: true, policy: { enabled: true, can_manage_settings: true, max_message_chars: 10000, max_output_tokens: 8192 } };
      } else if (body.action === "usage.summary") {
        payload = { success: true, usage: { requests_today: 0, requests_per_day_limit: 100, requests_last_5m: 0, requests_per_5m_limit: 10, tokens_today: 0, tokens_per_day_limit: 200000 } };
      } else if (body.action === "conversations.list") {
        payload = { success: true, conversations: mockConversations.map(x => ({...x})) };
      } else if (body.action === "conversation.create") {
        const conversation = { id: smokeConversationId, title: body.title || "New conversation", assistant_mode: body.assistant_mode || "company", status: "active", updated_at: new Date().toISOString() };
        if (!mockConversations.some(x => x.id === conversation.id)) mockConversations.push(conversation);
        Object.assign(mockConversations.find(x => x.id === conversation.id), conversation);
        payload = { success: true, conversation };
      } else if (body.action === "conversation.get") {
        const conversation = mockConversations.find(x => x.id === body.conversation_id);
        payload = { success: true, conversation: conversation || {}, messages: [] };
      } else if (body.action === "conversation.rename") {
        const conversation = mockConversations.find(x => x.id === body.conversation_id);
        if (conversation) { conversation.title = body.title; conversation.updated_at = new Date().toISOString(); }
        payload = { success: true, conversation: conversation || {} };
      } else if (body.action === "conversation.archive" || body.action === "conversation.unarchive") {
        const conversation = mockConversations.find(x => x.id === body.conversation_id);
        if (conversation) { conversation.status = body.action === "conversation.archive" ? "archived" : "active"; }
        payload = { success: true, conversation: conversation || {} };
      } else if (body.action === "conversation.delete") {
        const at = mockConversations.findIndex(x => x.id === body.conversation_id);
        if (at >= 0) mockConversations.splice(at, 1);
        payload = { success: true, deleted: true };
      } else if (body.action === "chat") {
        payload = { success: true, answer: "Hello from DVNM Intelligence.", tools_used: [], data_sources_used: [], usage: { input_tokens: 5, output_tokens: 12, estimated_cost_usd: 0.0001 }, generated_at: new Date().toISOString() };
      }
    }
    if (functionName === "nexus-analytics" && body.action === "finance.analytics") {
      mockFinanceResponses.push({ action: body.action, response: payload });
    }
    if (functionName === "nexus-intelligence") {
      mockAIRequests.push(body.action || "missing-action");
      mockAIResponses.push({ action: body.action || "missing-action", response: payload });
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "authorization, apikey, content-type"
      },
      body: JSON.stringify(payload)
    });
  });
  const authRequests = [];
  loginPage.on("request", request => {
    if (/supabase-js|functions\/v1|auth\//.test(request.url())) authRequests.push(request.url());
  });
  await loginPage.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await loginPage.waitForFunction(() => typeof window.supabase?.createClient === "function");
  await loginPage.waitForFunction(() => {
    const app = document.querySelector("#app");
    const auth = document.querySelector("#authScreen");
    return app && !app.classList.contains("hidden") && auth?.classList.contains("hidden");
  }, null, { timeout: 12000 }).catch(() => {});
  const bootDiagnostic = await loginPage.evaluate(() => ({
    appClass: document.querySelector("#app")?.className,
    authClass: document.querySelector("#authScreen")?.className,
    authMessage: document.querySelector("#authMessage")?.textContent,
    connection: document.querySelector("#connectionText")?.textContent,
    hasSupabase: typeof window.supabase?.createClient === "function",
    title: document.querySelector("#pageCrumb")?.textContent,
    body: document.body.innerText.slice(0, 900)
  }));
  console.log("NEXUS_BOOT_DIAGNOSTIC", JSON.stringify({ ...bootDiagnostic, errors, authRequests }));
  assert.ok(
    bootDiagnostic.hasSupabase &&
    !String(bootDiagnostic.appClass || "").split(/\s+/).includes("hidden") &&
    String(bootDiagnostic.authClass || "").split(/\s+/).includes("hidden"),
    "The isolated sign-in fixture must finish the authenticated Nexus boot"
  );
  await loginPage.waitForSelector("#pageContent .os-command-centre", { state: "visible" });
  assert.ok((await loginPage.locator("#workspaceName").textContent()).includes("Davonium Technologies"),
    "Authenticated dashboard must display the resolved company");
  assert.ok(await loginPage.locator(".os-module-card").count() >= 4,
    "Authenticated dashboard must render company modules");
  assert.ok(await loginPage.locator(".os-kpi-ring .os-ring").count() >= 3,
    "The overview must render circular operating indicators");
  await loginPage.locator('.os-module-card[data-page="projects"]').click();
  await loginPage.waitForFunction(() => document.querySelector("#pageCrumb")?.textContent === "Projects");
  await loginPage.locator('#nav [data-page="overview"]').click();
  await loginPage.waitForFunction(() => document.querySelector("#pageCrumb")?.textContent === "Nexus Overview");

  assert.equal(await loginPage.locator(".notification-bell svg").count(), 1,
    "Top navigation must use a real notification bell icon");
  await loginPage.locator("#collapseNav").click();
  await loginPage.waitForFunction(() => document.querySelector("#app").classList.contains("sidebar-collapsed"));
  assert.ok(await loginPage.locator("#expandNav").isVisible(),
    "A dedicated desktop sidebar restore control must appear after collapse");
  await loginPage.locator("#expandNav").click();
  await loginPage.waitForFunction(() => !document.querySelector("#app").classList.contains("sidebar-collapsed"));
  assert.equal(await loginPage.evaluate(() => localStorage.getItem("nexus_sidebar_collapsed")), "false",
    "Sidebar expand/collapse state must persist");


  if (await loginPage.locator("#cookieReject").isVisible()) {
    await loginPage.locator("#cookieReject").click();
    await loginPage.locator("#cookieConsent").waitFor({ state: "hidden" });
  }

  // Analytics line chart is rendered from consented fixture events.
  const analyticsNav=loginPage.locator('#nav [data-page="analytics"]');
  assert.ok(await analyticsNav.isVisible(), "Company Analytics navigation must be visible to the signed-in owner");
  await analyticsNav.click();
  await loginPage.waitForFunction(() => document.querySelector("#pageCrumb")?.textContent === "Company analytics");
  await loginPage.waitForTimeout(1200);
  const analyticsDiagnostic = await loginPage.evaluate(() => ({
    heading: document.querySelector("#pageCrumb")?.textContent,
    title: document.querySelector("#pageContent .page-head h1")?.textContent,
    text: document.querySelector("#pageContent")?.innerText?.slice(0, 1800),
    chartCount: document.querySelectorAll(".os-thin-chart svg").length,
    gridCount: document.querySelectorAll(".os-analytics-grid").length,
    pageError: document.querySelector("#pageContent .notice.error")?.textContent || ""
  }));
  console.log("NEXUS_ANALYTICS_SMOKE_DIAGNOSTIC", JSON.stringify({ ...analyticsDiagnostic, requestedActions: mockAnalyticsActions, browserErrors: errors }));
  assert.ok(analyticsDiagnostic.chartCount >= 1,
    "Company analytics must render thin SVG trend lines from its consented analytics response");
  assert.ok(await loginPage.locator(".os-thin-chart .os-chart-bar").count() > 0,
    "Company analytics must render translucent multicolour daily bars as well as trend lines");

  // Finance analytics uses posted-ledger fixture data, never production sample records.
  await loginPage.locator('#nav [data-page="finance"]').click();
  await loginPage.waitForFunction(() => document.querySelector("#pageCrumb")?.textContent === "Finance control");
  await loginPage.locator('[data-finance-tab="analytics"]').click();
  await loginPage.waitForSelector(".os-finance-chart-card .os-chart-line", { timeout: 10000 });
  const financeDiagnostic = await loginPage.evaluate(() => ({
    heading: document.querySelector("#pageCrumb")?.textContent,
    title: document.querySelector("#pageContent .page-head h1")?.textContent,
    text: document.querySelector("#pageContent")?.innerText?.slice(0, 1800),
    chartCount: document.querySelectorAll(".os-finance-chart-card .os-thin-chart svg").length,
    pageError: document.querySelector("#pageContent .notice.error")?.textContent || ""
  }));
  console.log("NEXUS_FINANCE_SMOKE_DIAGNOSTIC", JSON.stringify({ ...financeDiagnostic, requestedActions: mockAnalyticsActions, mockFinanceResponses, browserErrors: errors }));
  assert.ok(financeDiagnostic.chartCount >= 1 && await loginPage.locator(".os-finance-chart-card .os-chart-line").count() >= 2,
    "Finance analytics must render separate revenue and expense trend lines from posted ledger fixture data");
  await loginPage.locator('[data-finance-tab="overview"]').click();
  assert.ok(await loginPage.locator(".metric-symbol svg").count() >= 4,
    "Finance KPI cards must render vector icons rather than icon-name text");

  // Switch to the phone layout: app navigation, drawer recovery and no horizontal overflow.
  await loginPage.setViewportSize({ width: 390, height: 844 });
  await loginPage.waitForSelector(".mobile-app-nav", { state: "visible" });
  assert.equal(await loginPage.locator(".mobile-nav-item").count(), 5,
    "Phone layout must have five compact primary navigation destinations");
  const phoneWidth = await loginPage.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(phoneWidth.scroll <= phoneWidth.client + 1, "The authenticated phone layout must not overflow horizontally");
  await loginPage.locator('.mobile-nav-item[data-act="mobile-more"]').click();
  await loginPage.waitForFunction(() => document.querySelector("#sidebar").classList.contains("open"));
  await loginPage.locator('#sidebar [data-page="overview"]').click();
  await loginPage.waitForFunction(() => !document.querySelector("#sidebar").classList.contains("open"));
  await loginPage.locator('.mobile-nav-item[data-page="intelligence"]').click();
  await loginPage.waitForSelector(".ai-os", { state: "visible" });
  assert.notEqual(await loginPage.locator(".mobile-app-nav").evaluate(el => getComputedStyle(el).display), "none",
    "Phone navigation must stay available while DVNM Intelligence is open");
  await loginPage.locator('.mobile-nav-item[data-page="overview"]').click();
  await loginPage.waitForSelector("#pageContent .os-command-centre", { state: "visible" });
  await loginPage.setViewportSize({ width: 1440, height: 900 });
  await loginPage.waitForSelector(".mobile-app-nav", { state: "hidden" });

  // Test all four appearance modes from the real settings panel.
  await loginPage.locator('#nav [data-page="settings"]').click();
  await loginPage.waitForSelector('[data-act="theme-black"]', { state: "visible" });
  assert.equal(await loginPage.locator(".accent-theme-grid [data-accent-theme]").count(), 10,
    "Appearance settings must expose ten separate accent themes");
  assert.equal(new Set(await loginPage.locator(".accent-theme-grid [data-accent-theme]").evaluateAll(nodes => nodes.map(node => node.dataset.accentTheme))).size, 10,
    "Every accent theme must have a distinct selectable palette");
  await loginPage.locator('.accent-theme-grid [data-accent-theme="rose"]').click();
  await loginPage.waitForFunction(() => document.documentElement.dataset.accentTheme === "rose");
  assert.equal(await loginPage.evaluate(() => document.documentElement.dataset.accentTheme), "rose",
    "Accent theme selection must apply independently of appearance");
  await loginPage.locator('.accent-theme-grid [data-accent-theme="ocean"]').click();
  await loginPage.locator('[data-act="theme-black"]').click();
  await loginPage.waitForFunction(() => document.documentElement.classList.contains("black-theme"));
  assert.ok(await loginPage.evaluate(() => document.documentElement.classList.contains("black-theme")),
    "Dark Mode must apply a separate black theme");
  await loginPage.locator('[data-act="theme-light"]').click();
  await loginPage.waitForFunction(() => document.documentElement.classList.contains("light-theme") && !document.documentElement.classList.contains("black-theme"));
  assert.ok(await loginPage.evaluate(() => document.documentElement.classList.contains("light-theme") && !document.documentElement.classList.contains("black-theme")),
    "Light theme must be distinct from Dark Mode");
  await loginPage.locator('[data-act="theme-system"]').click();
  await loginPage.waitForFunction(() => localStorage.getItem("nexus_theme") === "system");
  assert.equal(await loginPage.evaluate(() => localStorage.getItem("nexus_theme")), "system",
    "System appearance preference must persist");
  await loginPage.locator('[data-act="theme-dark"]').click();
  await loginPage.waitForFunction(() => !document.documentElement.classList.contains("light-theme") && !document.documentElement.classList.contains("black-theme"));
  assert.ok(await loginPage.evaluate(() => !document.documentElement.classList.contains("light-theme") && !document.documentElement.classList.contains("black-theme")),
    "Dark appearance must remain distinct from Light and Dark Mode");

  // Exercise Company Intelligence and the complete conversation lifecycle.
  await loginPage.locator('#nav [data-page="intelligence"]').click();
  await loginPage.waitForSelector("#aiModeSelect");
  assert.ok(await loginPage.locator(".ai-return-home").isVisible(),
    "Desktop and tablet DVNM Intelligence must provide a visible route back to Nexus");
  await loginPage.locator(".ai-return-home").click();
  await loginPage.waitForSelector("#pageContent .os-command-centre", { state: "visible" });
  await loginPage.locator('#nav [data-page="intelligence"]').click();
  await loginPage.waitForSelector("#aiModeSelect");
  await loginPage.locator("#aiModeSelect").selectOption("company");
  await loginPage.waitForSelector('[data-ai-conversation]');
  await loginPage.locator("#aiMessageInput").fill("hello");
  await loginPage.locator("#aiSend").click();
  await loginPage.waitForTimeout(900);
  const aiDiagnostic = await loginPage.evaluate(() => ({
    buttonDisabled: document.querySelector("#aiSend")?.disabled,
    composerExists: !!document.querySelector("#aiComposer"),
    composerValue: document.querySelector("#aiMessageInput")?.value,
    messageText: document.querySelector("#aiMessages")?.innerText,
    formConnected: document.querySelector("#aiComposer")?.isConnected
  }));
  console.log("NEXUS_AI_SMOKE_DIAGNOSTIC", JSON.stringify({ ...aiDiagnostic, mockAIRequests, mockAIResponses, browserErrors: errors }));
  await loginPage.waitForSelector(".ai-message.assistant .ai-message-content");
  assert.ok((await loginPage.locator(".ai-message.assistant .ai-message-content").last().textContent()).includes("Hello from DVNM Intelligence"),
    "Company Intelligence chat should render its assistant response");
  assert.ok(await loginPage.locator(".ai-brand-logo").count() === 1,
    "DVNM Intelligence header must display the official Davonium logo");

  const openConversationMenu = async () => {
    await loginPage.locator('.ai-thread-menu[data-act="ai-manage-conversation"]').first().click();
    await loginPage.waitForSelector("#field-operation");
  };
  await openConversationMenu();
  await loginPage.locator("#field-title").fill("Edited smoke conversation");
  await loginPage.locator("#field-operation").selectOption("rename");
  await loginPage.locator("#submitDynamicForm").click();
  await loginPage.waitForFunction(() => document.querySelector(".ai-thread b")?.textContent === "Edited smoke conversation");
  assert.ok(await loginPage.locator(".ai-thread.active").count() === 1,
    "Renaming a conversation must preserve the active selected chat");

  await openConversationMenu();
  await loginPage.locator("#field-operation").selectOption("archive");
  await loginPage.locator("#submitDynamicForm").click();
  await loginPage.locator("#modalBackdrop").waitFor({ state: "hidden" });
  assert.equal(mockConversations[0]?.status, "archived",
    "The archive action must persist the archived state");
  await loginPage.waitForFunction(() => document.querySelectorAll(".ai-thread.active").length === 0);
  assert.equal(await loginPage.locator(".ai-thread.active").count(), 0,
    "Archiving the selected conversation must clear the active selection");

  await openConversationMenu();
  await loginPage.locator("#field-operation").selectOption("unarchive");
  await loginPage.locator("#submitDynamicForm").click();
  await loginPage.waitForFunction(() => document.querySelector(".ai-thread.active")?.textContent.includes("Edited smoke conversation"));
  assert.ok(await loginPage.locator(".ai-thread.active").count() === 1,
    "Restoring a conversation must make it active and selectable again");

  await openConversationMenu();
  await loginPage.locator("#field-operation").selectOption("delete");
  await loginPage.locator("#submitDynamicForm").click();
  await loginPage.waitForFunction(() => document.querySelectorAll("[data-ai-conversation]").length === 0);
  assert.equal(mockConversations.length, 0, "Deleting a conversation must remove it from the list");
  await loginContext.close();


  assert.deepEqual(errors,[],"Browser page errors must be empty");
  console.log("Nexus desktop and mobile UI, sidebar recovery, ten accents, four appearances, analytics, finance charts and DVNM chat lifecycle smoke tests passed.");
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
