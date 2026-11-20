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
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error("Nexus browser smoke test failures:\n- " + failures.join("\n- "));
    process.exit(1);
  }
  console.log("Nexus browser smoke test passed: 28 theme/viewport combinations.");
})();
