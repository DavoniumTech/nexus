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
  await loginPage.route("**/supabase-js@2*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `
      window.supabase = {
        createClient: function () {
          let activeSession = null;
          const user = { id: "nexus-smoke-user", email: "nexus-smoke@example.test" };
          const session = {
            access_token: "nexus-smoke-access-token",
            refresh_token: "nexus-smoke-refresh-token",
            token_type: "bearer",
            expires_in: 3600,
            user: user
          };
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
                return { data: { session: session, user: user }, error: null };
              },
              signOut: async function () {
                activeSession = null;
                return { error: null };
              }
            }
          };
        }
      };
    `
  }));
  await loginPage.route("https://cmkroryimxskgqlaiiym.supabase.co/functions/v1/**", async route => {
    const url = new URL(route.request().url());
    let payload = { success: true };
    if (url.pathname.endsWith("/nexus-session")) {
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
    } else if (url.pathname.endsWith("/bright-task")) {
      payload = {
        permissions: [
          { key: "projects.create", allowed: true },
          { key: "finance.view", allowed: true },
          { key: "analytics.view", allowed: true }
        ]
      };
    } else if (url.pathname.endsWith("/nexus-notifications")) {
      payload = { notifications: [] };
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
  await loginPage.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await loginPage.locator("#authEmail").fill("nexus-smoke@example.test");
  await loginPage.locator("#authPassword").fill("test-only-password");
  await loginPage.locator("#authSubmit").click();
  await loginPage.waitForFunction(() =>
    document.querySelector("#app") &&
    !document.querySelector("#app").classList.contains("hidden") &&
    document.querySelector("#authScreen") &&
    document.querySelector("#authScreen").classList.contains("hidden")
  );
  await loginPage.waitForSelector("#pageContent .os-command-centre", { state: "visible" });
  assert.ok((await loginPage.locator("#workspaceName").textContent()).includes("Davonium Technologies"),
    "Authenticated dashboard must display the resolved company");
  assert.ok(await loginPage.locator(".os-module-card").count() >= 4,
    "Authenticated dashboard must render company modules");
  await loginContext.close();

  assert.deepEqual(errors,[],"Browser page errors must be empty");
  console.log("Nexus application contract, responsive sign-in, and authenticated dashboard smoke tests passed.");
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
