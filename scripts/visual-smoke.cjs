"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");

function requireText(source, value, label) {
  assert.ok(source.includes(value), label + " is missing: " + value);
}

// Static product-contract checks cover routes that require an authenticated session.
for (const route of ["overview", "analytics", "finance", "intelligence"]) {
  requireText(app, route + ":render", "Nexus module route");
}
for (const feature of [
  "async function renderOverview",
  "async function renderAnalytics",
  "async function renderFinance",
  "async function renderIntelligence",
  "function renderMarkdownSafe",
  "function openPrivacySettings",
  "function trackEvent",
  "aiModeSelect",
  "aiComposer",
  "aiMessageInput",
  "finance.entries.create",
  "finance.budgets.create",
  "analytics.dashboard"
]) requireText(app, feature, "Nexus frontend feature");

for (const control of ["cookieConsent", "cookieAcceptAll", "cookieReject", "cookieCustomize"]) {
  requireText(html, control, "Privacy control");
}
for (const cls of [".os-command-centre", ".os-module-card", ".os-kpi-grid", ".ai-os", ".ai-messages", ".ai-composer"]) {
  requireText(css, cls, "Application UI style");
}
assert.equal(manifest.display, "standalone", "Nexus must be installable as a standalone PWA");
assert.ok(manifest.start_url === "./" && manifest.scope === "./", "PWA paths must work from the GitHub Pages subpath");
requireText(worker, "service-worker.js", "Service worker");
requireText(worker, 'url.pathname.includes("/functions/")', "API network-only exclusion");
requireText(worker, 'url.pathname.includes("/auth/")', "Auth network-only exclusion");
requireText(worker, 'url.pathname.includes("/storage/")', "Storage network-only exclusion");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const viewport of [
      { width: 320, height: 720 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 }
    ]) {
      const page = await browser.newPage({ viewport });
      page.on("pageerror", error => errors.push(viewport.width + "px: " + error.message));
      const failedRequests = [];
      page.on("requestfailed", request => failedRequests.push(request.url()));
      const response = await page.goto("http://127.0.0.1:4173/nexus/", { waitUntil: "networkidle" }).catch(async () => {
        return page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
      });
      assert.ok(response && response.ok(), "Nexus document must load at " + viewport.width + "px");
      await page.waitForSelector("#authScreen");
      assert.ok(await page.locator("#authScreen").isVisible(), "Signed-out users must see the secure access screen");
      assert.ok(await page.locator("#authForm").isVisible(), "Sign-in form must be visible");
      assert.ok(await page.locator("#authEmail").getAttribute("type") === "email", "Email must use an email input");
      assert.ok(await page.locator("#authPassword").getAttribute("type") === "password", "Password must be masked");
      assert.ok((await page.title()).includes("Davonium Nexus"), "Product title must remain branded");
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth
      }));
      assert.ok(dimensions.scrollWidth <= dimensions.width + 1, "No horizontal document overflow at " + viewport.width + "px");
      assert.ok(dimensions.bodyWidth <= dimensions.width + 1, "No body horizontal overflow at " + viewport.width + "px");
      const logo = page.locator('.auth-brand img[alt="Davonium Technologies logo"]');
      assert.ok(await logo.count(), "Exact Davonium corporate mark must be present");
      await page.close();
    }
    assert.deepEqual(errors, [], "Browser page errors must be empty");
    console.log("Nexus UI contract and responsive signed-out smoke tests passed.");
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
