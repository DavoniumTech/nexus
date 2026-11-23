const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const baseUrl = "http://127.0.0.1:4173/";
const outputDir = path.join(process.cwd(), "artifacts", "visual-smoke");
fs.mkdirSync(outputDir, { recursive: true });

const viewports = [320, 360, 390, 768, 1024, 1280, 1440];
const themes = [
  { name: "dark", stored: "dark", media: "light", expected: "dark" },
  { name: "light", stored: "light", media: "dark", expected: "light" },
  { name: "system-dark", stored: "system", media: "dark", expected: "dark" },
  { name: "system-light", stored: "system", media: "light", expected: "light" }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const theme of themes) {
      const context = await browser.newContext({
        colorScheme: theme.media,
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1
      });

      await context.addInitScript((storedTheme) => {
        localStorage.setItem("nexus_theme", storedTheme);
        // A test-only client lets the unauthenticated sign-in shell render.
        // No authentication or company API request is made by this smoke test.
        localStorage.setItem("nexus_publishable_key", "visual-test-placeholder-key");
      }, theme.stored);

      await context.route("**/supabase-js@2", route => route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `window.supabase = { createClient: () => ({
          auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
            getSession: async () => ({ data: { session: null }, error: null })
          }
        }) };`
      }));
      await context.route("https://fonts.googleapis.com/**", route => route.abort());
      await context.route("https://fonts.gstatic.com/**", route => route.abort());
      await context.route("https://cmkroryimxskgqlaiiym.supabase.co/**", route => route.abort());

      for (const width of viewports) {
        const page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.setViewportSize({ width, height: 900 });
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#authScreen:not(.hidden)", { timeout: 10000 });
        await page.waitForFunction(() => {
          const image = document.querySelector('#authScreen img[src*="davonium-d-icon.webp"]');
          return !!image && image.complete && image.naturalWidth > 0;
        }, { timeout: 10000 });

        const state = await page.evaluate(() => ({
          theme: document.documentElement.dataset.theme,
          htmlWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyText: document.body.innerText,
          bodyFont: getComputedStyle(document.body).fontSize,
          inputFont: getComputedStyle(document.querySelector("#authEmail")).fontSize,
          authVisible: !document.querySelector("#authScreen").classList.contains("hidden"),
          appVisible: !document.querySelector("#app").classList.contains("hidden"),
          logoLoaded: [...document.querySelectorAll('#authScreen img[src*="davonium-d-icon.webp"]')].every(img => img.complete && img.naturalWidth > 0)
        }));

        const label = theme.name + " / " + width + "px";
        if (state.theme !== theme.expected) failures.push(label + ": expected theme " + theme.expected + ", received " + state.theme);
        if (state.scrollWidth > state.htmlWidth + 1) failures.push(label + ": horizontal overflow (" + state.scrollWidth + " > " + state.htmlWidth + ")");
        if (!state.authVisible || state.appVisible) failures.push(label + ": unexpected authentication shell visibility");
        if (!state.logoLoaded) failures.push(label + ": official Davonium D-mark did not load");
        if (Number.parseFloat(state.bodyFont) < 16) failures.push(label + ": body font fell below 16px");
        if (Number.parseFloat(state.inputFont) < 16) failures.push(label + ": sign-in input font fell below 16px");
        if (/workspace/i.test(state.bodyText)) failures.push(label + ": forbidden visible terminology detected");
        if (pageErrors.length) failures.push(label + ": JavaScript page errors: " + pageErrors.join("; "));

        if ((theme.name === "dark" && width === 1440) ||
            (theme.name === "light" && width === 1440) ||
            (theme.name === "light" && width === 390) ||
            (theme.name === "dark" && width === 390)) {
          await page.screenshot({
            path: path.join(outputDir, theme.name + "-" + width + ".png"),
            fullPage: true
          });
        }
        await page.close();
      }
      await context.close();
    }

    // Authenticated Overview fixture: requests go through the real frontend Edge Function layer,
    // but every response is a local test fixture. This never reaches the live Supabase project.
    const overviewContext = await browser.newContext({
      colorScheme: "dark",
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1
    });
    await overviewContext.addInitScript(() => {
      localStorage.setItem("nexus_theme", "dark");
      localStorage.setItem("nexus_publishable_key", "visual-overview-fixture-key");
    });
    await overviewContext.route("**/supabase-js@2", route => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: [
        "window.supabase = { createClient: () => ({ auth: {",
        "onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),",
        "getSession: async () => ({ data: { session: { access_token: 'fixture-token', user: { id: 'fixture-user', email: 'owner@davoniumtech.test' } } }, error: null }),",
        "signOut: async () => ({ error: null })",
        "} }) };"
      ].join("\n")
    }));
    await overviewContext.route("https://fonts.googleapis.com/**", route => route.abort());
    await overviewContext.route("https://fonts.gstatic.com/**", route => route.abort());
    const aiFixtureConversations = [];
    let aiFixtureSequence = 0;
    await overviewContext.route("https://cmkroryimxskgqlaiiym.supabase.co/functions/v1/**", async route => {
      const endpoint = new URL(route.request().url()).pathname.split("/").pop();
      const requestBody = route.request().postDataJSON() || {};
      const notifications = [
        { id: "notice-1", title: "Nexus visual QA", body: "Fixture notification", created_at: "2026-11-20T08:00:00Z", read_at: null }
      ];
      let payload;
      if (endpoint === "nexus-session") {
        payload = {
          identity: { display_name: "Davonium Owner" },
          workspaces: [{ id: "fixture-org", slug: "davonium-technologies", name: "Davonium Technologies", role: "owner" }]
        };
      } else if (endpoint === "bright-task") {
        payload = { permissions: [] };
      } else if (endpoint === "nexus-command-center" && requestBody.action === "overview") {
        payload = { data: {
          tasks: [
            { id: "task-1", status: "in_progress", due_at: "2026-12-02T00:00:00Z" },
            { id: "task-2", status: "completed", due_at: "2026-11-10T00:00:00Z" }
          ],
          open_incidents: [{ id: "incident-1", title: "Fixture integration check", status: "investigating", started_at: "2026-11-20T07:00:00Z" }]
        }};
      } else if (endpoint === "nexus-command-center" && requestBody.action === "objectives.list") {
        payload = { data: { objectives: [{ id: "objective-1", title: "Deliver Nexus", objective_status: "active", progress_percent: 42 }] } };
      } else if (endpoint === "nexus-workspace" && requestBody.action === "overview") {
        payload = { data: { counts: { accessible_projects: 2 } } };
      } else if (endpoint === "nexus-workspace" && requestBody.action === "members") {
        payload = { data: { members: [
          { id: "m1", status: "active" }, { id: "m2", status: "active" },
          { id: "m3", status: "active" }, { id: "m4", status: "invited" }
        ] } };
      } else if (endpoint === "nexus-workspace" && requestBody.action === "client_accounts") {
        payload = { data: { client_accounts: [
          { id: "c1", status: "active" }, { id: "c2", status: "active" }, { id: "c3", status: "active" }
        ] } };
      } else if (endpoint === "nexus-analytics" && requestBody.action === "overview") {
        payload = { data: { counts: { products: 2, verified_non_sample_metrics: 9 } } };
      } else if (endpoint === "nexus-analytics" && requestBody.action === "products") {
        payload = { data: { products: [
          { id: "product-1", name: "Davonium Nexus", status: "development", current_version: "0.1" },
          { id: "product-2", name: "Marvel Chat", status: "development", current_version: "0.1" }
        ] } };
      } else if (endpoint === "nexus-projects" && requestBody.action === "list_projects") {
        payload = { data: { projects: [
          { id: "project-1", name: "Nexus OS", status: "active", progress_percent: 72, target_date: "2026-12-18" },
          { id: "project-2", name: "Portal integration", status: "planning", progress_percent: 28, target_date: "2027-01-15" }
        ] } };
      } else if (endpoint === "nexus-notifications") {
        payload = { data: { notifications } };
      } else if (endpoint === "nexus-monitor" && requestBody.action === "status") {
        payload = { data: { services: [{ display_name: "Nexus API", status: "operational", last_checked_at: "2026-11-20T08:00:00Z" }] } };
      } else if (endpoint === "nexus-monitor" && requestBody.action === "integrations.list") {
        payload = { data: { integrations: [{ id: "integration-1", display_name: "Metrics feed", state: "active", last_test_status: "passed" }] } };
      } else if (endpoint === "nexus-intelligence" && requestBody.action === "health") {
        payload = { success: true, assistant: "DVNM Intelligence", model: "gemini-3.5-flash-lite", gemini_configured: true, ledger_configured: true, persistent_conversations: true, read_only: true };
      } else if (endpoint === "nexus-intelligence" && requestBody.action === "policy.status") {
        payload = { success: true, policy: {
          enabled: false, provider_privacy_confirmed: false, provider_free_tier_confirmed: false,
          max_requests_per_day: 100, max_requests_per_5m: 10, max_tokens_per_day: 200000,
          max_output_tokens: 8192, max_message_chars: 10000, max_history_messages: 16,
          max_input_tokens: 30000, max_response_characters: 40000, monthly_budget_usd: 1,
          can_manage_settings: true
        }};
      } else if (endpoint === "nexus-intelligence" && requestBody.action === "usage.summary") {
        payload = { success: true, usage: {
          requests_today: 7, requests_per_day_limit: 100, requests_last_5m: 1, requests_per_5m_limit: 10,
          tokens_today: 2400, tokens_per_day_limit: 200000, output_tokens_per_request_limit: 8192,
          estimated_cost_this_month_usd: 0, monthly_budget_usd: 1, enabled: false
        }};
      } else if (endpoint === "nexus-intelligence" && requestBody.action === "capabilities") {
        payload = { success: true, capabilities: {
          general_purpose_chat: true, projects: true, tasks: true, clients: true,
          products: true, verified_metrics: true, persistent_conversations: true
        }};
      } else if (endpoint === "nexus-intelligence" && requestBody.action === "conversations.list") {
        payload = { success: true, conversations: aiFixtureConversations };
      } else if (endpoint === "nexus-intelligence" && requestBody.action === "conversation.create") {
        const conversation = {
          id: "fixture-ai-conversation-" + (++aiFixtureSequence),
          title: requestBody.title || "New conversation",
          status: "active",
          assistant_mode: requestBody.assistant_mode === "company" ? "company" : "general",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: null
        };
        aiFixtureConversations.push(conversation);
        payload = { success: true, conversation };
      } else if (endpoint === "nexus-intelligence" && requestBody.action === "conversation.get") {
        const conversation = aiFixtureConversations.find(item => item.id === requestBody.conversation_id);
        payload = conversation
          ? { success: true, conversation, messages: [] }
          : { success: false, error: "Fixture conversation not found." };
      } else {
        payload = { data: {} };
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload)
      });
    });

    const overviewPage = await overviewContext.newPage();
    const overviewErrors = [];
    const overviewConsoleErrors = [];
    overviewPage.on("pageerror", error => overviewErrors.push(error.message));
    overviewPage.on("console", message => { if (message.type() === "error") overviewConsoleErrors.push(message.text()); });
    await overviewPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const reachedOverview = await overviewPage.waitForSelector("#pageContent .overview-hero", { timeout: 15000 }).then(() => true).catch(() => false);
    if (!reachedOverview) {
      const diagnostics = await overviewPage.evaluate(() => ({
        supabaseClient: typeof window.supabase,
        authVisible: !document.querySelector("#authScreen")?.classList.contains("hidden"),
        authMessage: document.querySelector("#authMessage")?.innerText || "",
        connection: document.querySelector("#connectionText")?.innerText || "",
        dialog: document.querySelector('[role="dialog"]')?.innerText || "",
        pageContent: document.querySelector("#pageContent")?.innerText?.slice(0, 800) || ""
      }));
      failures.push("fixture overview did not boot: " + JSON.stringify(diagnostics) + "; page errors: " + overviewErrors.join("; ") + "; console errors: " + overviewConsoleErrors.join("; "));
    }
    const overviewState = await overviewPage.evaluate(() => ({
      title: document.querySelector("#pageCrumb")?.innerText || "",
      visibleText: document.body.innerText,
      cards: [...document.querySelectorAll(".overview-metrics .metric-card")].map(card => ({
        label: card.querySelector(".metric-top span")?.innerText || "",
        value: card.querySelector(".metric-value")?.innerText || ""
      })),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    const cardMap = Object.fromEntries(overviewState.cards.map(card => [card.label, card.value]));
    if (overviewState.title !== "Nexus Overview") failures.push("fixture overview: page title is not Nexus Overview");
    if (cardMap["Client accounts"] !== "3") failures.push("fixture overview: expected 3 returned client accounts");
    if (cardMap["Nexus members"] !== "4") failures.push("fixture overview: expected 4 returned member records");
    if (cardMap["Projects"] !== "2") failures.push("fixture overview: expected 2 returned projects");
    if (cardMap["Verified metrics"] !== "9") failures.push("fixture overview: expected 9 returned verified metrics");
    if (!overviewState.visibleText.includes("Project delivery") || !overviewState.visibleText.includes("Strategic priorities")) failures.push("fixture overview: key executive panels did not render");
    if (/workspace/i.test(overviewState.visibleText)) failures.push("fixture overview: forbidden visible terminology detected");
    if (overviewState.scrollWidth > overviewState.clientWidth + 1) failures.push("fixture overview: desktop layout has horizontal overflow");
    if (overviewErrors.length) failures.push("fixture overview: JavaScript page errors: " + overviewErrors.join("; "));
    await overviewPage.screenshot({ path: path.join(outputDir, "overview-desktop.png"), fullPage: true });
    await overviewPage.setViewportSize({ width: 390, height: 844 });
    await overviewPage.waitForTimeout(150);
    const mobileOverview = await overviewPage.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const overflowElements = [...document.querySelectorAll("body *")].map(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || "",
          className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          overflowX: style.overflowX
        };
      }).filter(item => item.right > width + 1 || item.left < -1)
        .sort((a,b) => (b.right-width) - (a.right-width))
        .slice(0, 12);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: width,
        overflowElements
      };
    });
    if (mobileOverview.scrollWidth > mobileOverview.clientWidth + 1) {
      failures.push("fixture overview: mobile layout has horizontal overflow: " + JSON.stringify(mobileOverview.overflowElements));
    }
    await overviewPage.screenshot({ path: path.join(outputDir, "overview-mobile.png"), fullPage: true });

    // DVNM Intelligence UI fixture: verify mode separation and owner limit controls.
    const intelligenceNav = overviewPage.locator('#nav [data-page="intelligence"]');
    if (await intelligenceNav.count()) {
      await intelligenceNav.click();
      const aiReady = await overviewPage.waitForSelector("#aiModeSelect", { timeout: 10000 }).then(() => true).catch(() => false);
      if (!aiReady) {
        failures.push("DVNM Intelligence fixture did not render the mode selector");
      } else {
        const initialMode = await overviewPage.locator("#aiModeSelect").inputValue();
        if (initialMode !== "general") failures.push("DVNM Intelligence fixture: new session should start in General Assistant mode");
        if (!(await overviewPage.locator('[data-act="ai-manage-limits"]').count())) {
          failures.push("DVNM Intelligence fixture: owner AI limits control is missing");
        } else {
          await overviewPage.locator('[data-act="ai-manage-limits"]').click();
          const limitsForm = await overviewPage.waitForSelector('#nexusDynamicForm [name="daily_request_limit"]', { timeout: 5000 }).then(() => true).catch(() => false);
          if (!limitsForm) failures.push("DVNM Intelligence fixture: AI limits form did not expose the daily request control");
          await overviewPage.locator("#closeModal").click().catch(() => {});
        }
        await overviewPage.locator("#aiModeSelect").selectOption("company");
        await overviewPage.waitForFunction(() => {
          const heading = document.querySelector(".ai-workspace-head h2")?.textContent || "";
          return heading === "Company intelligence.";
        }, { timeout: 10000 }).catch(() => failures.push("DVNM Intelligence fixture: switching to Company Intelligence did not update the workspace"));
        if (await overviewPage.locator("#aiModeSelect").inputValue() !== "company") {
          failures.push("DVNM Intelligence fixture: Company Intelligence mode was not selected");
        }
      }
    } else {
      failures.push("DVNM Intelligence fixture: navigation entry is missing");
    }

    await overviewContext.close();

  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error("Nexus browser smoke test failures:\n- " + failures.join("\n- "));
    process.exit(1);
  }
  console.log("Nexus browser smoke test passed: 28 theme/viewport combinations.");
})();
