/*
 * DAVONIUM NEXUS — COMPANY OPERATING SYSTEM
 * Browser client for the existing Supabase project and its deployed Edge Functions.
 * No service-role, Gemini, ledger, or other server secret is stored in this file.
 */
(() => {
  "use strict";

  const PROJECT_REF = "cmkroryimxskgqlaiiym";
  const DEFAULT_URL = `https://${PROJECT_REF}.supabase.co`;
  const WORKSPACE_SLUG = "davonium-technologies";
  const BUCKET = "nexus-private-documents";
  const FN = {
    analytics: "nexus-analytics", audit: "nexus-audit", command: "nexus-command-center",
    communications: "nexus-communications", content: "nexus-content", files: "nexus-files",
    intelligence: "nexus-intelligence", invitations: "nexus-invitations", member: "nexus-member-status",
    monitor: "nexus-monitor", notifications: "nexus-notifications", permissions: "bright-task",
    portal: "nexus-portal", projects: "nexus-projects", session: "nexus-session",
    workspace: "nexus-workspace", admin: "nexus-workspace-admin"
  };
  const PAGE = {
    overview: ["Nexus Overview", "The operating picture for Davonium Technologies."],
    projects: ["Projects", "Plan and deliver work across the company portfolio."],
    tasks: ["Tasks", "Track execution, ownership and deadlines across projects."],
    clients: ["Clients", "Manage client accounts and their relationships."],
    people: ["People & teams", "Company membership, departments, teams and invitations."],
    products: ["Products & metrics", "Product portfolio, verified metrics, releases and integrations."],
    analytics: ["Company analytics", "Consent-based usage and company performance."],
    finance: ["Finance control", "Chart of accounts, journal and budgets."],
    strategy: ["Strategy & decisions", "Objectives, measurable outcomes, decisions and weekly reviews."],
    investors: ["Investor relations", "Investor access and the company investor room."],
    documents: ["Documents", "Private project documents with controlled client visibility."],
    communications: ["Communications", "Company, team and project channels."],
    announcements: ["Announcements", "Publish important company updates from one place."],
    notifications: ["Your inbox", "Personal notifications and delivery preferences."],
    intelligence: ["DVNM Intelligence", "Read-only company intelligence with server-enforced safeguards."],
    monitoring: ["System health", "Service components, incidents and product integration history."],
    security: ["Security & audit", "Session assurance, access history and governance events."],
    permissions: ["Permissions", "Effective access for your account and administrative overrides."],
    settings: ["Nexus Settings", "Connection, Nexus organisation identity and personal preferences."],
    portal: ["Client portal", "Project progress and shared documents assigned to your account."]
  };
  const ICON = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    'check-square': '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 12 3 3 7-7"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6"/>',
    box: '<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z"/><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    landmark: '<path d="M3 9h18M5 9v10m4-10v10m6-10v10m4-10v10M3 21h18M12 3l9 4H3l9-4Z"/>',
    files: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    messages: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
    megaphone: '<path d="m3 11 18-5v12L3 13v-2Z"/><path d="m7 14 2 7h4l-2-6M21 11a2 2 0 0 1 0 4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
    sparkles: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM19 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM5 2l.8 2.2L8 5l-2.2.8L5 8l-.8-2.2L2 5l2.2-.8L5 2Z"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M15 15h2"/>',
    "list-tree": '<path d="M9 6h12M9 12h12M9 18h12M3 6h1M5 12h1M3 18h1"/>',
    "book-open": '<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H12v18H4.5A2.5 2.5 0 0 0 2 23V5.5ZM22 5.5A2.5 2.5 0 0 0 19.5 3H12v18h7.5A2.5 2.5 0 0 1 22 23V5.5Z"/>',
    "shield-check": '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    coins: '<circle cx="8" cy="8" r="5"/><path d="M11 12a5 5 0 1 0 5-5M3 8v2a5 5 0 0 0 10 0V8M16 12h2m-1-1v2"/>',
    "trending-up": '<path d="m3 17 6-6 4 4 8-9M15 6h6v6"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    x: '<path d="m18 6-12 12M6 6l12 12"/>'
  };

  // Bare names are element IDs; explicit CSS selectors use querySelector.
  // This keeps legacy calls such as $("#app") from returning null after authentication.
  const $ = selector => {
    if (typeof selector !== "string") return null;
    if (selector.startsWith("#") || selector.startsWith(".") || selector.startsWith("[")) {
      return document.querySelector(selector);
    }
    return document.getElementById(selector);
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const fmtDate = value => { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? esc(value) : d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); };
  const fmtTime = value => { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}); };
  const fmtNum = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(Number(value)) : "—";
  const shortId = value => value ? `${String(value).slice(0,8)}…` : "—";
  const slugify = value => String(value||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const initials = value => String(value||"D").trim().split(/[\s@._-]+/).slice(0,2).map(s=>s[0]||"").join("").toUpperCase() || "D";
  const icon = (name, cls="") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]||ICON.grid}</svg>`;
  const ACCENT_PALETTES = {
    ocean:{label:"Ocean",cyan:"#47d9f3",cyan2:"#16b8db",blue:"#5c8fff",violet:"#9c83ff"},
    azure:{label:"Azure",cyan:"#55b7ff",cyan2:"#288fe8",blue:"#4f79f5",violet:"#8e9aff"},
    violet:{label:"Violet",cyan:"#a68bff",cyan2:"#8767eb",blue:"#7385e8",violet:"#b69cff"},
    emerald:{label:"Emerald",cyan:"#48ddb0",cyan2:"#1dbd8c",blue:"#4d9eaa",violet:"#8cc6af"},
    mint:{label:"Mint",cyan:"#83e6c5",cyan2:"#42c99d",blue:"#6dbca9",violet:"#a7d9bd"},
    amber:{label:"Amber",cyan:"#f4c46f",cyan2:"#e6a943",blue:"#c98b43",violet:"#e6b68a"},
    sunset:{label:"Sunset",cyan:"#ffad83",cyan2:"#f27d72",blue:"#e37a8b",violet:"#c18fe3"},
    rose:{label:"Rose",cyan:"#ff8eb4",cyan2:"#e86d9a",blue:"#bb83c8",violet:"#d49be8"},
    indigo:{label:"Indigo",cyan:"#9aa8ff",cyan2:"#7587ee",blue:"#6776dc",violet:"#a197ff"},
    monochrome:{label:"Monochrome",cyan:"#d4dbe4",cyan2:"#aab5c2",blue:"#8492a4",violet:"#b4bec9"}
  };

  const state = {
    sb:null, session:null, user:null, profile:{}, workspace:{}, role:"member", currentPage:"overview", cache:{},
    permissions:[], permissionMap:{}, booting:false, isCollapsed:localStorage.getItem("nexus_sidebar_collapsed")==="true", theme:localStorage.getItem("nexus_theme")||"system", accentTheme:localStorage.getItem("nexus_accent_theme")||"violet",
    chatId:null, chatMode:"general", chatBusy:false, realtimeChannel:null, realtimeRefreshTimer:null, realtimeAIRefreshTimer:null, currentChannel:null, currentDirect:null, communicationsTab:"channels", directConversations:[], commandMatches:[], commandIndex:0, notifPrefs:null
  };

  const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_aaf6R55TSYLgz3wdl6VYxA_umccmSh7";
  function cfg(){
    const url=(localStorage.getItem("nexus_url")||sessionStorage.getItem("nexus_url")||DEFAULT_URL).replace(/\/$/,"");
    const savedKey=localStorage.getItem("nexus_publishable_key")||sessionStorage.getItem("nexus_publishable_key")||localStorage.getItem("nexus_anon")||"";
    // This deployment belongs to one fixed Supabase project. Use its public key by default on every origin/browser;
    // preserve an explicitly configured key only when the project URL was changed in Connection settings.
    const key=url===DEFAULT_URL?DEFAULT_PUBLISHABLE_KEY:savedKey;
    return {url,key};
  }
  async function waitForSupabaseLibrary(){
    if(window.supabase?.createClient)return true;
    const ready=window.__nexusSupabaseReady;
    if(!ready)return false;
    try{return (await ready)===true&&typeof window.supabase?.createClient==="function";}
    catch(error){console.error("Nexus Supabase library",error);return false;}
  }
  function connectedClient(){ const c=cfg(); if(!window.supabase?.createClient||!c.key) return false; try { state.sb=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}}); return true; } catch(err){ console.error(err); return false; } }
  function notify(message,type="info"){ const host=$("toastRegion"); const el=document.createElement("div");el.className="toast"+(type==="error"?" error":type==="success"?" success":"");el.textContent=message;host.appendChild(el);setTimeout(()=>el.remove(),4300); }
  function connection(ok,message){ $("connectionText").textContent=message|| (ok?"Connected securely":"Connection issue"); $("sidebarStatusDot").className="status-dot"+(ok?"": " bad"); }
  function authMessage(message,bad=false){ const el=$("authMessage");el.textContent=message;el.className="notice"+(bad?" error":""); }
  function showAuth(message="",bad=false){ $("authScreen").classList.remove("hidden");$("app").classList.add("hidden");if(message)authMessage(message,bad); }
  function applyAccentTheme(){
    if(!ACCENT_PALETTES[state.accentTheme])state.accentTheme="violet";
    const palette=ACCENT_PALETTES[state.accentTheme],root=document.documentElement;
    root.dataset.accentTheme=state.accentTheme;
    root.style.setProperty("--cyan",palette.cyan);
    root.style.setProperty("--cyan-2",palette.cyan2);
    root.style.setProperty("--blue",palette.blue);
    root.style.setProperty("--violet",palette.violet);
    root.style.setProperty("--accent-soft",palette.cyan+"18");
    try{localStorage.setItem("nexus_accent_theme",state.accentTheme);}catch(_){}
  }
  function applyTheme(){
    const media=window.matchMedia?.("(prefers-color-scheme: dark)");
    const allowedThemes=["dark","black","light","system"];
    if(!allowedThemes.includes(state.theme))state.theme="system";
    const resolved=state.theme==="system"?(media?.matches?"dark":"light"):state.theme;
    const root=document.documentElement;
    root.classList.toggle("light-theme",resolved==="light");
    root.classList.toggle("black-theme",resolved==="black");
    root.dataset.theme=resolved;
    root.style.colorScheme=resolved==="light"?"light":"dark";
    try{localStorage.setItem("nexus_theme",state.theme);}catch(_){}
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content",resolved==="light"?"#f4f8fc":resolved==="black"?"#050607":"#07111f");
    const button=$("themeToggle");
    if(button){
      button.textContent=state.theme==="system"?"◐":resolved==="light"?"☼":resolved==="black"?"●":"☾";
      const label=resolved==="black"?"Dark Mode":state.theme==="dark"?"Dark":state.theme==="light"?"Light":"System";
      button.setAttribute("aria-label","Appearance: "+label+". Select appearance.");
      button.title="Appearance: "+label+". Select appearance.";
    }
  }
  function cycleTheme(){
    const themes=["dark","black","light","system"];
    const current=themes.indexOf(state.theme);
    state.theme=themes[(current+1+themes.length)%themes.length];
    applyTheme();
    if(state.currentPage==="settings")renderSettings();
  }
  function setSidebarCollapsed(collapsed,persist=true){
    const mobile=window.matchMedia?.("(max-width: 760px)")?.matches===true;
    state.isCollapsed=mobile?false:!!collapsed;
    $("app")?.classList.toggle("sidebar-collapsed",state.isCollapsed);
    const expand=$("expandNav");
    if(expand)expand.classList.toggle("hidden",!state.isCollapsed||mobile);
    if(persist&&!mobile){try{localStorage.setItem("nexus_sidebar_collapsed",state.isCollapsed?"true":"false");}catch(_){}}
  }
  function normalizeError(payload,status){ const msg=payload?.message||payload?.error||payload?.code||`Request failed (${status})`;const error=new Error(String(msg));error.status=status;error.payload=payload;return error; }
  async function edge(functionKey,body={},options={}){
    if(!state.sb) throw new Error("Supabase is not configured. Open Connection settings first.");
    const {data:{session},error:sessionError}=await state.sb.auth.getSession();
    if(sessionError) throw sessionError;
    if(!session?.access_token) throw new Error("Your secure session has expired. Please sign in again.");
    const functionName=FN[functionKey]||functionKey;
    const c=cfg();
    const response=await fetch(`${c.url}/functions/v1/${encodeURIComponent(functionName)}`,{
      method:"POST",headers:{"Content-Type":"application/json","apikey":c.key,"Authorization":`Bearer ${session.access_token}`},
      body:JSON.stringify(body),signal:options.signal
    });
    let payload={};try{payload=await response.json();}catch{payload={error:"The Edge Function returned a non-JSON response."};}
    if(!response.ok || payload?.success===false) throw normalizeError(payload,response.status);
    return payload;
  }
  function orgBody(extra={}){ return {...(state.workspace.id?{organization_id:state.workspace.id}:{}),...extra}; }
  const api=(key,action,extra={})=>edge(key,orgBody({action,...extra}));
  function unwrap(payload){ if(payload&&typeof payload==="object"&&"data" in payload) return payload.data;return payload; }
  function records(payload,key){ const root=unwrap(payload);if(Array.isArray(root))return root;if(!root||typeof root!=="object")return[];if(key&&Array.isArray(root[key]))return root[key];const keys=["items","rows","results","records","projects","tasks","members","clients","client_accounts","products","metrics","definitions","integrations","runs","events","objectives","key_results","decisions","summaries","releases","components","services","incidents","documents","channels","messages","announcements","investor_updates","notifications","permissions","conversations","invitations","departments","teams","access","shared_documents"];for(const k of keys)if(Array.isArray(root[k]))return root[k];if(root.data&&Array.isArray(root.data))return root.data;return[]; }
  function nested(payload,...keys){let value=unwrap(payload);for(const key of keys){if(value&&typeof value==="object")value=value[key];else return null;}return value;}
  function safeStatus(value){const s=String(value||"unknown").toLowerCase();if(/inactive|not active|unhealthy|failed|blocked|overdue|outage|critical|revoked|suspended|error|archived|denied|disabled/.test(s))return"bad";if(/pending|planned|review|progress|degraded|investigating|draft|maintenance|warning|paused|unknown|not tested/.test(s))return"warning";if(/active|completed|published|verified|operational|healthy|resolved|done|sent|live|enabled|passed|allowed/.test(s))return"good";return"info";}
  function pill(value){return `<span class="status-pill ${safeStatus(value)}">${esc(value||"Not set")}</span>`;}
  function empty(title="No records yet",copy="Records will appear here as Nexus data becomes available."){return `<div class="table-empty"><div class="empty-icon">✦</div><div class="empty-title">${esc(title)}</div><div class="empty-copy">${esc(copy)}</div></div>`;}
  function pageHead(page,actions="",subtitle=null){const meta=PAGE[page]||PAGE.overview;return `<div class="page-head"><div><div class="head-overline">DAVONIUM TECHNOLOGIES / NEXUS</div><h1>${esc(meta[0])}</h1><p>${esc(subtitle||meta[1])}</p></div><div class="head-actions">${actions}</div></div>`;}
  function panel(title,copy,body,action=""){return `<section class="panel"><div class="panel-head"><div><h3>${esc(title)}</h3>${copy?`<p>${esc(copy)}</p>`:""}</div>${action}</div>${body}</section>`;}
  function stat(label,value,foot,symbol){const glyph=Object.prototype.hasOwnProperty.call(ICON,symbol)?icon(symbol):esc(symbol||"✦");return `<article class="metric-card"><div class="metric-top"><span>${esc(label)}</span><span class="metric-symbol">${glyph}</span></div><div class="metric-value">${esc(value??"—")}</div><div class="metric-foot">${esc(foot||"Live Nexus data")}</div></article>`;}
  function property(label,value){return `<div class="property"><small>${esc(label)}</small><b>${esc(value??"—")}</b></div>`;}
  function table(headers,rows,opts={}){if(!rows?.length)return empty(opts.emptyTitle||"Nothing to show yet",opts.emptyCopy||"No records are available for this view.");return `<div class="data-table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;}
  function textCell(primary,secondary=""){return `<span class="cell-title">${esc(primary||"Untitled")}</span>${secondary?`<span class="cell-sub">${esc(secondary)}</span>`:""}`;}
  function actionButton(label,act,id,kind="btn-secondary"){return `<button class="btn btn-small ${kind}" data-act="${esc(act)}" data-id="${esc(id||"")}">${esc(label)}</button>`;}
  function toolbarSearch(placeholder="Filter this view…"){return `<div class="toolbar"><input class="control" type="search" data-local-filter placeholder="${esc(placeholder)}"><span class="toolbar-spacer"></span></div>`;}
  function setPageTitle(page){const m=PAGE[page]||PAGE.overview;$("pageCrumb").textContent=m[0];}
  function has(permission){if(!permission)return true;return state.permissionMap?.[permission]===true;}
  function canAny(...keys){return keys.some(k=>state.permissionMap?.[k]===true);}
  async function safe(promise){try{return {ok:true,data:await promise};}catch(error){return {ok:false,error};}}

  function isMissingRefreshToken(error){
    const code=String(error?.code||"").toLowerCase();
    const message=String(error?.message||error||"").toLowerCase();
    return code==="refresh_token_not_found"||
      (message.includes("refresh token")&&/(not found|invalid|revoked|expired)/.test(message));
  }
  async function restore(){
    applyTheme();
    if(!(await waitForSupabaseLibrary())){
      showAuth("Nexus loaded, but the secure sign-in library could not be reached. Check your internet connection and refresh the page.",true);
      return;
    }
    if(!cfg().key){showAuth("Add your Supabase project publishable/anon key in Connection settings. No service-role key is accepted here.");openSetup(true);return;}
    if(!connectedClient()){showAuth("Nexus could not initialise the secure Supabase connection. Check Connection settings.",true);openSetup(true);return;}
    state.sb.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){void clearRealtime();state.session=null;state.user=null;showAuth();}
      else if(session){state.session=session;state.user=session.user;}
    });
    let sessionResult;
    try{sessionResult=await state.sb.auth.getSession();}
    catch(error){sessionResult={data:{session:null},error};}
    const {data,error}=sessionResult||{data:{session:null},error:null};
    if(error){
      if(isMissingRefreshToken(error)){
        try{await state.sb.auth.signOut({scope:"local"});}
        catch(cleanupError){console.warn("Nexus local session cleanup",cleanupError);}
        state.session=null;state.user=null;
        showAuth("Your saved Nexus session expired or was revoked. Sign in again.");
        return;
      }
      showAuth(error.message||"Nexus could not restore this browser session.",true);
      return;
    }
    if(data?.session){state.session=data.session;state.user=data.session.user;await boot();}else showAuth();
  }
  async function authSubmit(event){
    event.preventDefault();
    const btn=$("authSubmit"),email=$("authEmail").value.trim(),password=$("authPassword").value;
    btn.disabled=true;btn.textContent="Connecting securely…";
    try{
      if(!state.sb){
        if(!(await waitForSupabaseLibrary()))throw new Error("The secure sign-in library is unavailable. Check your internet connection and refresh Nexus.");
        if(!connectedClient())throw new Error("The Supabase connection could not be initialised. Open Connection settings and verify the project key.");
      }
      btn.textContent="Verifying secure access…";
      const {data,error}=await state.sb.auth.signInWithPassword({email,password});
      if(error)throw error;
      state.session=data.session;state.user=data.user;await boot();
    }catch(error){authMessage(error.message,true);}
    finally{btn.disabled=false;btn.innerHTML='Sign in to Nexus <span>↗</span>';}
  }
  async function forgotPassword(){
    const email=$("authEmail").value.trim();
    if(!email){authMessage("Enter your account email first, then select Forgot password.",true);return;}
    try{
      if(!state.sb){
        if(!(await waitForSupabaseLibrary()))throw new Error("The secure sign-in library is unavailable. Check your internet connection and refresh Nexus.");
        if(!connectedClient())throw new Error("The Supabase connection could not be initialised. Open Connection settings.");
      }
      const {error}=await state.sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(error)throw error;
      authMessage("Password reset instructions have been requested. Check your email.");
    }catch(error){authMessage(error.message,true);}
  }
  async function boot(){if(!state.user||state.booting)return;state.booting=true;connection(true,"Verifying Nexus access…");try{
      const sessionPayload=await edge("session",{});state.profile=sessionPayload.identity||{};
      const workspace=(sessionPayload.workspaces||[]).find(w=>w.slug===WORKSPACE_SLUG)||(sessionPayload.workspaces||[])[0];
      if(!workspace)throw new Error("Your account is authenticated, but no active Davonium Nexus organisation was returned.");
      state.workspace=workspace;state.role=workspace.role||"member";applyRoleNavigation();
      $("workspaceName").textContent=workspace.name||"Davonium Technologies";
      $("userName").textContent=state.profile.display_name||state.user.email?.split("@")[0]||"Nexus member";
      $("userAvatar").textContent=initials(state.profile.display_name||state.user.email);
      $("userRole").textContent=state.role;
      $("profileButton").textContent=initials(state.profile.display_name||state.user.email);
      $("authScreen").classList.add("hidden");$("app").classList.remove("hidden");connection(true,`Connected · ${state.role}`);
      const perm=await safe(edge("permissions",orgBody({})));
      if(perm.ok){const p=perm.data;state.permissions=p.permissions||[];state.permissionMap={};state.permissions.forEach(v=>state.permissionMap[v.key]=!!v.allowed);}
      applyRoleNavigation();
      const inviteId=new URLSearchParams(location.search).get("invitation_id");
      if(inviteId){try{await api("invitations","accept",{invitation_id:inviteId});history.replaceState({},"",location.pathname);notify("Nexus invitation accepted.","success");}catch(error){notify(error.message,"error");}}
      await updateInboxCount();await setupRealtime();await navigate(state.role==="client"?"portal":"overview");
    }catch(error){console.error("Nexus boot",error);connection(false,"Nexus access needs attention");showAuth(error.message,true);}finally{state.booting=false;}}
  async function signOut(){try{const {error}=await state.sb?.auth.signOut({scope:"local"})||{};if(error)throw error;}catch(e){notify(e.message||"The current browser session could not be revoked cleanly.","error");}await clearRealtime();state.session=null;state.user=null;state.cache={};showAuth();}
  async function updateInboxCount(){const r=await safe(api("notifications","inbox.list",{limit:100,unread_only:true}));if(r.ok){const n=records(r.data);const count=n.length;const c=$("notificationCount"),t=$("topNotificationDot");c.textContent=count?count:"";t.classList.toggle("show",count>0);}}
  async function clearRealtime(){
    if(state.realtimeRefreshTimer){clearTimeout(state.realtimeRefreshTimer);state.realtimeRefreshTimer=null;}
    if(state.realtimeAIRefreshTimer){clearTimeout(state.realtimeAIRefreshTimer);state.realtimeAIRefreshTimer=null;}
    const channel=state.realtimeChannel;state.realtimeChannel=null;
    if(channel&&state.sb){try{await state.sb.removeChannel(channel);}catch(error){console.warn("Nexus Realtime cleanup",error);}}
  }
  function scheduleRealtimeRefresh(pages){
    if(!pages.includes(state.currentPage))return;
    if(state.realtimeRefreshTimer)clearTimeout(state.realtimeRefreshTimer);
    state.realtimeRefreshTimer=setTimeout(async()=>{
      state.realtimeRefreshTimer=null;
      if(!state.user||!pages.includes(state.currentPage))return;
      if(state.currentPage==="intelligence"){
        if(state.chatBusy||!state.chatId)return;
        if(state.realtimeAIRefreshTimer)clearTimeout(state.realtimeAIRefreshTimer);
        state.realtimeAIRefreshTimer=setTimeout(()=>{state.realtimeAIRefreshTimer=null;if(state.currentPage==="intelligence"&&!state.chatBusy&&state.chatId)void loadAIConversation(state.chatId);},180);
      }else{
        await refresh();
      }
    },320);
  }
  async function setupRealtime(){
    await clearRealtime();
    if(!state.sb||typeof state.sb.channel!=="function"||!state.user?.id||!state.workspace?.id)return;
    const organizationId=state.workspace.id,userId=state.user.id;
    const channel=state.sb.channel("nexus-live-"+organizationId+"-"+userId);
    const pagesByTable={
      nexus_channel_messages:["communications"],
      nexus_channels:["communications"],
      nexus_direct_messages:["communications"],
      nexus_notifications:["overview","notifications"],
      tasks:["overview","projects","tasks"],
      project_milestones:["overview","projects"],
      product_metric_ingestion_runs:["overview","products"],
      service_components:["overview","monitoring"],
      service_incidents:["overview","monitoring"]
    };
    for(const [table,pages] of Object.entries(pagesByTable)){
      channel
        .on("postgres_changes",{event:"INSERT",schema:"public",table,filter:"organization_id=eq."+organizationId},()=>{if(table==="nexus_notifications")void updateInboxCount();scheduleRealtimeRefresh(pages);})
        .on("postgres_changes",{event:"UPDATE",schema:"public",table,filter:"organization_id=eq."+organizationId},()=>{if(table==="nexus_notifications")void updateInboxCount();scheduleRealtimeRefresh(pages);});
    }
    const aiFilter={event:"INSERT",schema:"public",table:"nexus_ai_messages",filter:"organization_id=eq."+organizationId};
    const aiUpdateFilter={event:"UPDATE",schema:"public",table:"nexus_ai_messages",filter:"organization_id=eq."+organizationId};
    const conversationFilter={event:"INSERT",schema:"public",table:"nexus_ai_conversations",filter:"organization_id=eq."+organizationId};
    const conversationUpdateFilter={event:"UPDATE",schema:"public",table:"nexus_ai_conversations",filter:"organization_id=eq."+organizationId};
    const onAIChange=payload=>{
      if(state.currentPage!=="intelligence"||state.chatBusy||!state.chatId)return;
      const record=payload.new||payload.old||{};
      if(record.owner_user_id&&record.owner_user_id!==userId)return;
      if(record.conversation_id&&record.conversation_id!==state.chatId)return;
      if(record.id&&record.owner_user_id&&record.conversation_id===undefined&&record.id!==state.chatId)return;
      scheduleRealtimeRefresh(["intelligence"]);
    };
    channel
      .on("postgres_changes",aiFilter,onAIChange)
      .on("postgres_changes",aiUpdateFilter,onAIChange)
      .on("postgres_changes",conversationFilter,onAIChange)
      .on("postgres_changes",conversationUpdateFilter,onAIChange);
    state.realtimeChannel=channel;
    channel.subscribe(status=>{
      if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")console.warn("Nexus Realtime connection status:",status);
    });
  }

  function loadingMarkup(){return `<div class="loading-shell"><div class="skeleton skeleton-title"></div><div class="skeleton-grid"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div><div class="skeleton skeleton-panel"></div></div>`;}
  async function navigate(page){
    if(!PAGE[page])page="overview";state.currentPage=page;$("app").classList.toggle("ai-mode",page==="intelligence");document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.page===page));document.querySelectorAll(".mobile-nav-item").forEach(el=>el.classList.toggle("active",el.dataset.page===page));setPageTitle(page);$("sidebar").classList.remove("open");$("mobileScrim").classList.remove("show");$("pageContent").innerHTML=loadingMarkup();
    const views={overview:renderOverview,projects:renderProjects,tasks:renderTasks,clients:renderClients,people:renderPeople,products:renderProducts,analytics:renderAnalytics,finance:renderFinance,strategy:renderStrategy,investors:renderInvestors,documents:renderDocuments,communications:renderCommunications,announcements:renderAnnouncements,notifications:renderNotifications,intelligence:renderIntelligence,monitoring:renderMonitoring,security:renderSecurity,permissions:renderPermissions,settings:renderSettings,portal:renderPortal};
    try{await (views[page]||renderOverview)();void trackEvent("page_view",page);}catch(error){console.error(`${page} render`,error);$("pageContent").innerHTML=pageHead(page,`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Retry</button>`)+`<div class="panel"><div class="notice error">${esc(error.message)}</div><p class="muted" style="font-size:10px;margin:12px 0 0">Your authenticated session is still available. The relevant Edge Function or database policy may have rejected this operation.</p></div>`;}}
  async function refresh(){state.cache={};await navigate(state.currentPage);}
  function quickAction(label,act,symbol="＋"){return `<button class="quick-action" data-act="${esc(act)}"><span class="action-icon">${symbol}</span>${esc(label)}</button>`;}
  function appendRows(items,mapper){return items?.length?items.map(mapper):[];}

  // NEXUS OVERVIEW — executive signals built only from successfully returned records.
  async function renderOverview(){
    const [c,p,t,pr,m,cl,sv,fi,an,no]=await Promise.all([
      safe(api("command","overview")),safe(api("projects","list_projects")),safe(api("projects","list_tasks",{limit:100})),
      safe(api("analytics","products")),safe(api("workspace","members")),safe(api("workspace","client_accounts")),safe(api("monitor","status")),
      state.permissionMap["finance.view"]?safe(api("analytics","finance.overview")):Promise.resolve({ok:false}),
      state.permissionMap["analytics.view"]?safe(api("analytics","analytics.dashboard")):Promise.resolve({ok:false}),safe(api("notifications","inbox.list",{limit:6}))
    ]);
    const cmd=c.ok?(unwrap(c.data)||{}):{},projects=p.ok?records(p.data,"projects"):(cmd.projects||[]),tasks=t.ok?records(t.data,"tasks"):(cmd.tasks||[]);
    const products=pr.ok?records(pr.data,"products"):[],members=m.ok?records(m.data,"members"):[],clients=cl.ok?records(cl.data,"client_accounts"):[],services=sv.ok?records(sv.data):[];
    const finance=fi.ok?(unwrap(fi.data)?.finance||{}):{},analytics=an.ok?(unwrap(an.data)?.analytics||{}):{};
    const active=projects.filter(x=>/active|progress/i.test(x.status||"")).length,open=tasks.filter(x=>!/done|complete|cancel/i.test(x.status||"")).length;
    const due=tasks.filter(x=>{let d=x.due_date||x.due_at;return d&&new Date(d)<new Date()&&!/done|complete|cancel/i.test(x.status||"");}).length;
    const healthy=services.filter(x=>safeStatus(x.status||x.component_status)==="good").length,assets={};
    (finance.accounts||[]).filter(x=>x.account_type==="asset").forEach(x=>assets[x.currency_code]=(assets[x.currency_code]||0)+Number(x.current_balance||0));
    const assetValue=Object.keys(assets).map(k=>new Intl.NumberFormat(undefined,{style:"currency",currency:k,maximumFractionDigits:0}).format(assets[k])).join(" · ")||"No balances";
    const greeting=new Date().getHours()<12?"Good morning":new Date().getHours()<18?"Good afternoon":"Good evening";
    const completed=tasks.filter(x=>/done|complete|closed/i.test(x.status||"")).length;
    const ratio=(numerator,denominator)=>denominator>0?Math.max(0,Math.min(100,Math.round(numerator/denominator*100))):null;
    const ring=(value)=>value==null?0:value;
    const kpis=[
      ["projects","Active projects",active,projects.length+" total",ratio(active,projects.length),"layers","violet"],
      ["tasks","Tasks completed",completed,tasks.length+" recent records",ratio(completed,tasks.length),"check-square","blue"],
      ["tasks","Overdue work",due,open+" open tasks",ratio(due,open),"calendar","amber"],
      ["monitoring","Service health",healthy,services.length+" monitored",ratio(healthy,services.length),"shield-check","green"]
    ];
    const kpiHtml=kpis.map(item=>`<button class="os-kpi os-kpi-ring" data-page="${item[0]}">
      <span class="os-kpi-copy"><small>${esc(item[1])}</small><strong>${fmtNum(item[2])}</strong><em>${esc(item[3])}</em></span>
      <span class="os-ring os-ring-${item[6]}" style="--ring-value:${ring(item[4])}%" role="img" aria-label="${item[4]==null?"No records":item[4]+" percent"}">
        <span>${item[4]==null?"—":item[4]+"%"}</span>
      </span>
    </button>`).join("");
    const cards=[["projects","Projects",projects.length,"Delivery portfolio","layers"],["tasks","Open tasks",open,due+" overdue","check-square"],["clients","Clients",clients.length,"Customer relationships","briefcase"],["people","People & teams",members.length,"Company directory","users"],["products","Products",products.length,"Product portfolio","box"],["analytics","Analytics",an.ok?String(analytics.events_30d??0):"Restricted","Consented events · 30 days","activity"],["finance","Finance",fi.ok?assetValue:"Restricted","Posted asset balances","wallet"],["monitoring","System health",services.length,healthy+" healthy records","shield-check"]];
    const cardHtml=cards.map(x=>`<button class="os-module-card" data-page="${x[0]}"><span class="os-module-icon">${icon(x[4])}</span><span class="os-module-copy"><b>${esc(x[1])}</b><small>${esc(x[3])}</small></span><strong>${esc(x[2])}</strong><span class="os-module-arrow">↗</span></button>`).join("");
    const chartDays=Array.from({length:30},(_,offset)=>{const day=new Date();day.setDate(day.getDate()-(29-offset));return day.toISOString().slice(0,10);});
    const chartLabels=chartDays.map(day=>day.slice(5));
    const countRecent=rows=>{const bins=new Map();for(const row of rows){const value=row.created_at||row.created_on||row.inserted_at;if(!value)continue;const key=String(value).slice(0,10);if(chartDays.includes(key))bins.set(key,(bins.get(key)||0)+1);}return chartDays.map(day=>bins.get(day)||0);};
    const pulseSeries=[];
    if(an.ok&&Array.isArray(analytics.daily))pulseSeries.push({name:"Consented activity",values:chartDays.map(day=>Number(analytics.daily.find(row=>String(row.day).slice(0,10)===day)?.events||0))});
    if(projects.some(row=>row.created_at||row.created_on))pulseSeries.push({name:"Projects added",values:countRecent(projects)});
    if(tasks.some(row=>row.created_at||row.created_on||row.inserted_at))pulseSeries.push({name:"Tasks added",values:countRecent(tasks)});
    const pulse=pulseSeries.length?renderThinLineChart(pulseSeries,chartLabels,"There are no consented or dated operating events in this period."):`<div class="os-chart-empty"><span class="os-ring os-ring-violet" style="--ring-value:0%"><span>—</span></span><b>Operating pulse is waiting for data</b><small>Enable optional analytics or create dated project and task records to populate this chart.</small></div>`;
    const rows=projects.slice(0,6).map(x=>`<tr class="os-click-row" data-act="open-project" data-id="${esc(x.id)}"><td><b>${esc(x.name||"Untitled project")}</b></td><td>${pill(x.status||"unknown")}</td><td>${x.progress_percent==null?"—":esc(fmtNum(x.progress_percent)+"%")}</td><td>${fmtDate(x.target_date)}</td></tr>`).join("");
    const feed=(no.ok?records(no.data,"notifications"):[]).map(x=>`<div class="os-feed-row"><i class="os-feed-dot"></i><div><b>${esc(x.title||"Nexus update")}</b><small>${esc(x.body||x.notification_type||"")}</small></div><time>${fmtTime(x.created_at)}</time></div>`).join("");
    const projectButton=state.permissionMap["projects.create"]?'<button class="btn btn-primary" data-act="create-project">＋ New project</button>':"";
    let html=`<section class="os-command-centre"><header class="os-welcome-row"><div><div class="os-eyebrow">DAVONIUM NEXUS / COMMAND CENTRE</div><h1>${greeting}, ${esc(state.profile.display_name?.split(" ")[0]||"there")}.</h1><p>One operating picture for delivery, people, products, finance and intelligence.</p></div><div class="os-welcome-actions">${projectButton}<button class="btn btn-secondary" data-act="create-task">＋ New task</button><button class="btn btn-secondary" data-page="intelligence">✦ Ask DVNM</button><button class="icon-button" data-act="refresh">↻</button></div></header>
    <div class="os-kpi-grid os-kpi-ring-grid">${kpiHtml}</div>
    <div class="os-section-head"><div><span class="os-eyebrow">OPERATING MODULES</span><h2>Navigate your company</h2></div><span class="os-live-indicator"><i></i> Permission-scoped services</span></div><section class="os-module-grid">${cardHtml}</section>
    <section class="os-overview-pulse">
      <section class="os-surface os-overview-chart"><header><div><span class="os-eyebrow">OPERATING PULSE</span><h2>Company activity · last 30 days</h2><p>Different colours represent separately counted, available Nexus records.</p></div><span class="os-live-indicator"><i></i> Live records</span></header>${pulse}<footer class="os-chart-footnote">Optional usage metrics appear only when analytics access and consent are available. Project and task lines use dated records returned by Nexus.</footer></section>
      <section class="os-surface os-overview-insights"><header><div><span class="os-eyebrow">AT A GLANCE</span><h2>Quick actions</h2></div></header>
        <button class="os-insight-link" data-page="analytics"><span class="os-insight-icon os-insight-violet">${icon("activity")}</span><span><b>Company analytics</b><small>${an.ok?fmtNum(analytics.events_30d??0)+" consented events":"Permission-controlled insights"}</small></span>${icon("chevron")}</button>
        <button class="os-insight-link" data-page="finance"><span class="os-insight-icon os-insight-blue">${icon("wallet")}</span><span><b>Finance control</b><small>${fi.ok?"Posted balances · "+esc(assetValue):"Finance access follows your role"}</small></span>${icon("chevron")}</button>
        <button class="os-insight-link" data-page="intelligence"><span class="os-insight-icon os-insight-amber">${icon("sparkles")}</span><span><b>DVNM Intelligence</b><small>Ask, analyse and plan</small></span>${icon("chevron")}</button>
      </section>
    </section>
    <div class="os-lower-grid"><section class="os-surface"><header><div><span class="os-eyebrow">DELIVERY CONTROL</span><h2>Project portfolio</h2></div><button class="btn btn-quiet" data-page="projects">Open projects ↗</button></header>${table(["Project","Status","Progress","Target"],rows,{emptyTitle:"No accessible projects",emptyCopy:"Projects assigned to your role will appear here."})}</section><section class="os-surface"><header><div><span class="os-eyebrow">LIVE SIGNALS</span><h2>Company activity</h2></div><button class="btn btn-quiet" data-page="notifications">Inbox ↗</button></header><div class="os-feed">${feed||empty("No new activity","Operational events and notifications will appear here.")}</div></section></div>
    <footer class="os-bottom-strip"><span><i></i> ${esc(state.workspace.name||"Davonium Technologies")}</span><span>${esc(state.role)} access</span><span>Updated ${fmtTime(new Date().toISOString())}</span><button data-page="monitoring">System health ↗</button></footer></section>`;
    $("#pageContent").innerHTML=html;
  }


  function renderThinLineChart(series,labels,emptyMessage="No verified data is available for this period."){
    const validSeries=(series||[]).filter(item=>Array.isArray(item.values)&&item.values.length===labels.length);
    if(!labels?.length||!validSeries.length)return empty("No chart data",emptyMessage);
    const allValues=validSeries.flatMap(item=>item.values.map(value=>Number(value)||0));
    if(!allValues.length)return empty("No chart data",emptyMessage);
    const width=960,height=220,left=12,right=12,top=16,bottom=16,plotHeight=height-top-bottom;
    let min=Math.min(0,...allValues),max=Math.max(0,...allValues);
    if(max===min)max=min+1;
    const padding=(max-min)*0.1||1;min-=padding;max+=padding;
    const xAt=index=>left+(labels.length<=1?0:index*(width-left-right)/(labels.length-1));
    const yAt=value=>top+(max-Number(value||0))*plotHeight/(max-min);
    const grid=[0,1,2,3].map(step=>{
      const y=top+step*plotHeight/3;
      return `<line class="os-chart-gridline" x1="${left}" y1="${y.toFixed(2)}" x2="${width-right}" y2="${y.toFixed(2)}"/>`;
    }).join("");
    const plotWidth=width-left-right,groupWidth=plotWidth/labels.length;
    const zeroY=yAt(0);
    const bars=validSeries.map((item,index)=>{
      const barWidth=Math.min(12,Math.max(3,groupWidth*.46/validSeries.length));
      return item.values.map((value,i)=>{
        const valueY=yAt(value),barHeight=Math.max(2,Math.abs(zeroY-valueY));
        const x=xAt(i)-barWidth*validSeries.length/2+barWidth*index+(barWidth*.5);
        const y=Math.min(zeroY,valueY);
        return `<rect class="os-chart-bar os-chart-series-${index}" x="${(x-barWidth/2).toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="1.5"><title>${esc(item.name)} · ${esc(labels[i])}: ${esc(fmtNum(value))}</title></rect>`;
      }).join("");
    }).join("");
    const plots=validSeries.map((item,index)=>{
      const points=item.values.map((value,i)=>[xAt(i),yAt(value)]);
      const path=points.map((point,i)=>(i?"L":"M")+point[0].toFixed(2)+" "+point[1].toFixed(2)).join(" ");
      const area=path+` L ${points[points.length-1][0].toFixed(2)} ${(height-bottom).toFixed(2)} L ${points[0][0].toFixed(2)} ${(height-bottom).toFixed(2)} Z`;
      const marker=points.map((point,i)=>`<circle class="os-chart-point os-chart-series-${index}" cx="${point[0].toFixed(2)}" cy="${point[1].toFixed(2)}" r="2.4"><title>${esc(labels[i])}: ${esc(fmtNum(item.values[i]))}</title></circle>`).join("");
      return `<path class="os-chart-area os-chart-series-${index}" d="${area}"/><path class="os-chart-line os-chart-series-${index}" d="${path}"/>${marker}`;
    }).join("");
    const tickCount=Math.min(6,labels.length);
    const ticks=Array.from({length:tickCount},(_,i)=>{
      const idx=tickCount===1?0:Math.round(i*(labels.length-1)/(tickCount-1));
      return `<span>${esc(labels[idx])}</span>`;
    }).join("");
    const legend=validSeries.map((item,index)=>`<span><i class="os-chart-legend-dot os-chart-series-${index}"></i>${esc(item.name)}</span>`).join("");
    return `<div class="os-thin-chart">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Line chart showing ${esc(validSeries.map(x=>x.name).join(" and "))}">
        ${grid}${bars}${plots}
      </svg>
      <div class="os-chart-ticks">${ticks}</div>
      <div class="os-chart-legend">${legend}</div>
    </div>`;
  }

  async function renderAnalytics(){
    const [r,pr]=await Promise.all([safe(api("analytics","analytics.dashboard")),safe(api("analytics","overview"))]);
    const d=r.ok?(unwrap(r.data)?.analytics||{}):{},prod=pr.ok?(unwrap(pr.data)||{}):{},daily=d.daily||[];
    const labels=daily.map(x=>String(x.day||"").slice(5));
    const trend=renderThinLineChart([{name:"Consented events",values:daily.map(x=>Number(x.events||0))}],labels,"Usage begins after an authorised member opts in.");
    let consent={};try{consent=JSON.parse(localStorage.getItem("nexus_privacy_consent_v1")||"{}");}catch(_){}
    let html=pageHead("analytics",`<button class="btn btn-secondary" data-act="refresh">↻ Refresh</button><button class="btn btn-primary" data-act="analytics-consent">Privacy settings</button>`,"Consent-based usage intelligence and verified product metrics.");
    html+=`<div class="os-kpi-grid">${stat("Events · 30 days",fmtNum(d.events_30d??0),"Optional usage events","activity")}${stat("Events · 7 days",fmtNum(d.events_7d??0),"Recent product usage","activity")}${stat("Active users",fmtNum(d.active_users_30d??0),"Unique accounts in 30 days","users")}${stat("Verified metrics",fmtNum(prod.counts?.verified_non_sample_metrics??0),"Existing verified metrics","trending-up")}</div>
    <div class="os-analytics-grid">
      <section class="os-surface os-chart-panel"><header><div><span class="os-eyebrow">USAGE TRENDS</span><h2>Activity · last 30 days</h2><p>Thin trend view · minimised, consented events only</p></div></header>${trend}</section>
      <section class="os-surface"><header><div><span class="os-eyebrow">MOST USED</span><h2>Module activity</h2></div></header>${table(["Page","Views"],(d.top_pages||[]).map(x=>`<tr><td>${esc(x.page)}</td><td>${fmtNum(x.views)}</td></tr>`))}</section>
    </div>
    <section class="os-surface os-privacy-panel"><div><span class="os-eyebrow">PRIVACY & GOVERNANCE</span><h2>Optional analytics is opt-in</h2><p>Essential authentication storage remains active. Optional analytics records module event type and timestamp only. It never records prompts, messages, form values, credentials or documents.</p></div><div class="os-privacy-status"><span class="${consent.analytics?"allowed":"disabled"}">${consent.analytics?"Analytics enabled":"Analytics disabled"}</span><button class="btn btn-secondary" data-act="analytics-consent">Change consent</button></div></section>`;
    $("#pageContent").innerHTML=html;
  }

  async function renderFinance(){
    const [o,a,e,b,trendR]=await Promise.all([
      safe(api("analytics","finance.overview")),
      safe(api("analytics","finance.accounts.list")),
      safe(api("analytics","finance.entries.list")),
      safe(api("analytics","finance.budgets.list")),
      safe(api("analytics","finance.analytics"))
    ]);
    const fd=o.ok?(unwrap(o.data)?.finance||{}):{},accounts=a.ok?(unwrap(a.data)?.accounts||[]):[],entries=e.ok?(unwrap(e.data)?.entries||[]):[],budgets=b.ok?(unwrap(b.data)?.budgets||[]):[];
    const analytics=trendR.ok?(unwrap(trendR.data)?.analytics||{}):{};
    state.cache.finance={finance:fd,accounts,entries,budgets,analytics};
    const canA=!!state.permissionMap["finance.accounts.manage"],canE=!!state.permissionMap["finance.entries.manage"],canB=!!state.permissionMap["finance.budgets.manage"];
    const tab=state.financeTab||"overview",tabs=[["overview","Overview"],["analytics","Analytics"],["accounts","Accounts"],["journal","Journal"],["budgets","Budgets"]];
    const tabBar=`<div class="os-module-tabs">${tabs.map(x=>`<button class="${tab===x[0]?"active":""}" data-finance-tab="${x[0]}">${x[1]}</button>`).join("")}</div>`;
    const cash=accounts.filter(x=>x.account_type==="asset"),curr=[...new Set(cash.map(x=>x.currency_code))],money=(n,c)=>{try{return new Intl.NumberFormat(undefined,{style:"currency",currency:c,maximumFractionDigits:2}).format(Number(n||0));}catch(_){return c+" "+fmtNum(n);}};
    const totals=curr.map(c=>stat("Assets · "+c,money(cash.filter(x=>x.currency_code===c).reduce((s,x)=>s+Number(x.current_balance||0),0),c),"Posted balances","wallet")).join("")||stat("Asset balances","—","No posted balances","wallet");
    const ar=accounts.map(x=>`<tr><td><b>${esc(x.account_code)}</b><small>${esc(x.name)}</small></td><td>${pill(x.account_type)}</td><td>${esc(x.currency_code)}</td><td>${money(x.current_balance,x.currency_code)}</td><td>${x.is_system?pill("system"):canA?('<button class="btn btn-small btn-secondary" data-act="finance-account-state" data-id="'+esc(x.id)+'">'+(x.is_active?"Deactivate":"Activate")+'</button>'):pill(x.is_active?"active":"inactive")}</td></tr>`);
    const er=entries.map(x=>`<tr><td>${fmtDate(x.entry_date)}</td><td><b>${esc(x.reference||"—")}</b><small>${esc(x.description)}</small></td><td>${esc(x.currency_code)}</td><td>${pill(x.status)}</td><td>${fmtDate(x.posted_at)}</td></tr>`);
    const br=budgets.map(x=>`<tr><td><b>${esc(x.name)}</b><small>${fmtDate(x.period_start)} – ${fmtDate(x.period_end)}</small></td><td>${money(x.amount,x.currency_code)}</td><td>${pill(x.status)}</td><td>${canB&&x.status!=="archived"?('<button class="btn btn-small btn-secondary" data-act="finance-budget-state" data-id="'+esc(x.id)+'" data-status="'+(x.status==="active"?"paused":"active")+'">'+(x.status==="active"?"Pause":"Resume")+'</button><button class="btn btn-small btn-quiet" data-act="finance-budget-state" data-id="'+esc(x.id)+'" data-status="archived">Archive</button>'):pill(x.status)}</td></tr>`);
    const addA=canA?'<button class="btn btn-primary" data-act="finance-account-create">＋ New account</button>':"",addE=canE?'<button class="btn btn-primary" data-act="finance-entry-create">＋ Record entry</button>':"",addB=canB?'<button class="btn btn-primary" data-act="finance-budget-create">＋ New budget</button>':"";
    let body="";
    if(tab==="overview"){
      body=`<div class="os-kpi-grid">${totals}${stat("Accounts",fmtNum(accounts.length),"Chart of accounts","list-tree")}${stat("Journal entries",fmtNum(entries.length),"Ledger records","book-open")}${stat("Active budgets",fmtNum(budgets.filter(x=>x.status==="active").length),"Budget register","target")}</div>
      <div class="os-lower-grid"><section class="os-surface"><header><div><span class="os-eyebrow">GENERAL LEDGER</span><h2>Latest entries</h2></div><button class="btn btn-quiet" data-finance-tab="journal">Open journal ↗</button></header>${table(["Date","Description","Currency","Status","Posted"],er.slice(0,8))}</section>
      <section class="os-surface"><header><div><span class="os-eyebrow">PLANNING</span><h2>Budget register</h2></div><button class="btn btn-quiet" data-finance-tab="budgets">All budgets ↗</button></header>${table(["Budget","Amount","Status",""],br.slice(0,8))}</section></div>
      <p class="os-disclaimer">Nexus finance is an internal ledger, not a bank connection. Balances are grouped by currency. No sample transactions have been created.</p>`;
    }else if(tab==="analytics"){
      const currencies=analytics.currencies||[];
      const charts=currencies.map(item=>{
        const months=item.monthly||[];
        const chart=renderThinLineChart([
          {name:"Revenue",values:months.map(x=>Number(x.revenue||0))},
          {name:"Expenses",values:months.map(x=>Number(x.expenses||0))}
        ],months.map(x=>x.label),"There are no posted income or expense lines for this currency.");
        const last=months[months.length-1]||{};
        return `<section class="os-surface os-finance-chart-card">
          <header><div><span class="os-eyebrow">POSTED LEDGER · ${esc(item.currency_code)}</span><h2>Revenue & expenses</h2><p>Monthly account movements · last 12 months</p></div><span class="os-finance-currency">${esc(item.currency_code)}</span></header>
          <div class="os-finance-chart-stats"><span>Latest month revenue <b>${money(last.revenue,item.currency_code)}</b></span><span>Latest month expenses <b>${money(last.expenses,item.currency_code)}</b></span></div>
          ${chart}
        </section>`;
      }).join("");
      body=`<div class="os-kpi-grid">${stat("Posted entries in period",fmtNum(analytics.posted_entry_count??0),"Last 12 months","book-open")}${stat("Currencies",fmtNum(currencies.length),"Reported separately","coins")}${stat("Income-statement lines",fmtNum(currencies.reduce((sum,x)=>sum+Number(x.line_count||0),0)),"Posted revenue and expense lines","activity")}${stat("Coverage",analytics.sampling_limited?"Record cap reached":"Complete returned set",analytics.sampling_limited?"More than 5,000 entries may exist":"Server query returned all matching entries","shield-check")}</div>
      <div class="os-finance-chart-grid">${charts||empty("No posted financial activity","No posted revenue or expense journal lines were found in the last 12 months. Create and post balanced entries to populate this chart. No sample values are shown.")}</div>
      <p class="os-disclaimer">Only posted double-entry journal lines are included. Revenue and expenses are grouped by account type and currency. Draft, cancelled and unposted entries are excluded; different currencies are never added together.</p>`;
    }else if(tab==="accounts"){
      body=`<section class="os-surface"><header><div><span class="os-eyebrow">CHART OF ACCOUNTS</span><h2>Organisation accounts</h2></div>${addA}</header>${table(["Account","Type","Currency","Balance","Status"],ar)}</section>`;
    }else if(tab==="journal"){
      body=`<section class="os-surface"><header><div><span class="os-eyebrow">DOUBLE-ENTRY LEDGER</span><h2>Journal register</h2><p>Entries post only when debit and credit totals balance.</p></div>${addE}</header>${table(["Date","Reference / description","Currency","Status","Posted"],er)}</section>`;
    }else{
      body=`<section class="os-surface"><header><div><span class="os-eyebrow">BUDGET PLANNING</span><h2>Budget register</h2></div>${addB}</header>${table(["Budget","Amount","Status",""],br)}</section>`;
    }
    let html=pageHead("finance",`<button class="btn btn-secondary" data-act="refresh">↻ Refresh</button>${tab==="overview"?addE:""}`,"Finance operations with chart of accounts, balanced journal and budgets.")+tabBar+body;
    $("#pageContent").innerHTML=html;
  }

  function createFinanceAccount(){openForm({title:"Create finance account",description:"Add an organisation-scoped account.",fields:[{name:"account_code",label:"Account code",required:true,max:24},{name:"name",label:"Account name",required:true,max:120},{name:"account_type",label:"Account type",type:"select",required:true,options:["asset","liability","equity","revenue","expense"].map(x=>[x,x])},{name:"normal_balance",label:"Normal balance",type:"select",required:true,options:[["debit","Debit"],["credit","Credit"]]},{name:"currency_code",label:"Currency code",value:"NGN",required:true,max:3},{name:"description",label:"Description",type:"textarea",max:1000,span:2}],submitLabel:"Create account",onSubmit:async v=>{await api("analytics","finance.accounts.create",v);await closeModal();state.financeTab="accounts";notify("Finance account created.","success");await renderFinance();}});}
  function createFinanceEntry(){
    const accounts=(state.cache.finance?.accounts||[]).filter(x=>x.is_active),curr=[...new Set(accounts.map(x=>x.currency_code))],currency=curr.includes("NGN")?"NGN":curr[0]||"NGN",opts=accounts.filter(x=>x.currency_code===currency).map(x=>[x.id,x.account_code+" · "+x.name]);
    if(opts.length<2)return notify("Create two active accounts in the same currency first.","error");
    openForm({title:"Record balanced journal entry",description:"Select debit and credit accounts in the same currency. The server validates the entry atomically.",fields:[{name:"entry_date",label:"Entry date",type:"date",required:true,value:new Date().toISOString().slice(0,10)},{name:"reference",label:"Reference",max:120},{name:"description",label:"Description",required:true,max:2000,span:2},{name:"currency_code",label:"Currency",type:"select",required:true,value:currency,options:curr.map(x=>[x,x])},{name:"debit_account_id",label:"Debit account",type:"select",required:true,options:opts},{name:"credit_account_id",label:"Credit account",type:"select",required:true,options:opts},{name:"amount",label:"Amount",type:"number",required:true,min:0.01},{name:"memo",label:"Line memo",max:500,span:2}],submitLabel:"Validate and post",onSubmit:async v=>{if(v.debit_account_id===v.credit_account_id)throw new Error("Choose two different accounts.");const amount=Number(v.amount);if(!Number.isFinite(amount)||amount<=0)throw new Error("Enter a positive amount.");await api("analytics","finance.entries.create",{entry_date:v.entry_date,reference:v.reference,description:v.description,currency_code:v.currency_code,lines:[{account_id:v.debit_account_id,debit:amount,credit:0,memo:v.memo||null},{account_id:v.credit_account_id,debit:0,credit:amount,memo:v.memo||null}]});await closeModal();state.financeTab="journal";notify("Balanced journal entry posted.","success");await renderFinance();}});
  }
  function createFinanceBudget(){const accounts=(state.cache.finance?.accounts||[]).filter(x=>x.is_active);openForm({title:"Create finance budget",description:"Budgets are planning records and do not initiate payments.",fields:[{name:"name",label:"Budget name",required:true,max:120},{name:"amount",label:"Budget amount",type:"number",required:true,min:0.01},{name:"currency_code",label:"Currency",type:"select",required:true,value:"NGN",options:[...new Set(accounts.map(x=>x.currency_code).concat(["NGN"]))].map(x=>[x,x])},{name:"period_start",label:"Period start",type:"date",required:true,value:new Date().toISOString().slice(0,10)},{name:"period_end",label:"Period end",type:"date",required:true,value:new Date(new Date().getFullYear(),11,31).toISOString().slice(0,10)},{name:"account_id",label:"Linked account (optional)",type:"select",options:[["","No linked account"],...accounts.map(x=>[x.id,x.account_code+" · "+x.name])]},{name:"notes",label:"Notes",type:"textarea",max:2000,span:2}],submitLabel:"Save budget",onSubmit:async v=>{if(!v.account_id)v.account_id=null;await api("analytics","finance.budgets.create",v);await closeModal();state.financeTab="budgets";notify("Budget created.","success");await renderFinance();}});}
  async function updateFinanceAccount(id){const a=(state.cache.finance?.accounts||[]).find(x=>x.id===id);if(!a||a.is_system)return;await api("analytics","finance.accounts.update",{account_id:id,is_active:!a.is_active});notify("Account status updated.","success");await renderFinance();}
  async function updateFinanceBudget(id,status){await api("analytics","finance.budgets.update",{budget_id:id,status});notify("Budget status updated.","success");await renderFinance();}

  // PROJECTS AND EXECUTION
  async function fetchProjects(){const d=await api("projects","list_projects");const data=records(d,"projects");state.cache.projects=data;return data;}
  async function renderProjects(){const result=await safe(fetchProjects());const projects=result.ok?result.data:[];let html=pageHead("projects",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh</button><button class="btn btn-primary" data-act="create-project">${icon("plus")} Create project</button>`);
    if(!result.ok)html+=`<div class="notice error">${esc(result.error.message)}</div>`;
    const rows=appendRows(projects,p=>`<tr><td>${textCell(p.name,p.description||p.slug)}</td><td>${pill(p.status)}</td><td>${fmtNum(p.progress_percent??0)}%</td><td>${fmtDate(p.start_date)}</td><td>${fmtDate(p.target_date)}</td><td><div class="table-actions">${actionButton("Details","open-project",p.id)}${actionButton("Edit","edit-project",p.id)}</div></td></tr>`);
    html+=`<div class="grid metric-grid">${stat("All projects",projects.length,"Visible to your account","▦")}${stat("Active",projects.filter(x=>x.status==="active").length,"Currently underway","↗")}${stat("Planned",projects.filter(x=>x.status==="planned").length,"Awaiting kickoff","◷")}${stat("Completed",projects.filter(x=>x.status==="completed").length,"Delivered","✓")}</div>`;
    html+=panel("Project portfolio","Select a project to inspect its milestones, tasks, team and decisions.",`${toolbarSearch("Search projects by name or status…")}${table(["Project","Status","Progress","Start","Target",""],rows,{emptyTitle:"Your project portfolio is ready",emptyCopy:"Create the first project to establish a home for its tasks, milestones and documents."})}`);
    $("pageContent").innerHTML=html;
  }
  async function openProject(id){try{const d=await api("projects","get_project",{project_id:id});const p=unwrap(d).project||unwrap(d);const [tasksR,milesR,membersR,docsR,decR]=await Promise.all([
      safe(api("projects","list_tasks",{project_id:id})),safe(api("projects","list_milestones",{project_id:id})),safe(api("projects","project_members",{project_id:id})),safe(api("files","documents.list",{project_id:id})),safe(api("projects","list_project_decisions",{project_id:id}))
    ]);
    const tasks=tasksR.ok?records(tasksR.data,"tasks"):[],miles=milesR.ok?records(milesR.data,"milestones"):[],members=membersR.ok?records(membersR.data,"members"):[],docs=docsR.ok?records(docsR.data):[],decisions=decR.ok?records(decR.data,"decisions"):[];state.cache.tasks=[...(state.cache.tasks||[]).filter(t=>t.project_id!==id),...tasks.map(t=>({...t,project_id:id}))];state.cache.projectMilestones=miles;
    const taskRows=tasks.map(t=>`<tr><td>${textCell(t.title,t.description)}</td><td>${pill(t.status)}</td><td>${pill(t.priority)}</td><td>${fmtDate(t.due_at)}</td><td><div class="table-actions">${actionButton("Edit","edit-task",t.id)}<button class="btn btn-small btn-secondary" data-act="task-comments" data-id="${esc(t.id)}" data-project="${esc(id)}">Comments</button></div></td></tr>`);
    const mileRows=miles.map(m=>`<tr><td>${textCell(m.title,m.description)}</td><td>${pill(m.status)}</td><td>${fmtDate(m.due_date)}</td><td>${actionButton("Edit","edit-milestone",m.id)}</td></tr>`);
    const memberRows=members.map(m=>`<tr><td>${textCell(m.display_name||m.full_name||shortId(m.user_id),m.job_title||m.email)}</td><td>${esc(m.project_role||m.role||"Member")}</td><td><button class="btn btn-small btn-danger" data-act="remove-project-member" data-id="${esc(m.user_id)}" data-project="${esc(id)}">Remove</button></td></tr>`);
    const docRows=docs.map(x=>`<tr><td>${textCell(x.file_name,x.content_type)}</td><td>${pill(x.document_status)}</td><td>${fmtDate(x.created_at)}</td><td>${actionButton("Download","download-document",x.id)}</td></tr>`);
    openModal("Project details",p.name||"Project details",`<div class="property-grid">${property("Status",p.status)}${property("Progress",`${p.progress_percent??0}%`)}${property("Target date",fmtDate(p.target_date))}</div><div class="settings-block"><h3>Project summary</h3><p>${esc(p.description||"No project description has been added.")}</p></div><div class="tab-row"><button class="tab-button active" data-project-tab="tasks">Tasks (${tasks.length})</button><button class="tab-button" data-project-tab="milestones">Milestones (${miles.length})</button><button class="tab-button" data-project-tab="people">People (${members.length})</button><button class="tab-button" data-project-tab="documents">Documents (${docs.length})</button><button class="tab-button" data-project-tab="decisions">Decisions (${decisions.length})</button></div><div id="projectTabBody">${table(["Task","Status","Priority","Due",""],taskRows)}</div><div class="modal-foot"><button class="btn btn-secondary" data-modal-act="edit-project" data-id="${esc(id)}">Edit project</button><button class="btn btn-secondary" data-modal-act="assign-project-member" data-project="${esc(id)}">Add member</button><button class="btn btn-secondary" data-modal-act="create-milestone" data-project="${esc(id)}">Add milestone</button><button class="btn btn-secondary" data-modal-act="create-project-decision" data-project="${esc(id)}">Record decision</button><button class="btn btn-primary" data-modal-act="create-task" data-project="${esc(id)}">Add task</button></div>`);
    const tabBody=$("projectTabBody");document.querySelectorAll("[data-project-tab]").forEach(tab=>tab.onclick=()=>{document.querySelectorAll("[data-project-tab]").forEach(x=>x.classList.toggle("active",x===tab));const which=tab.dataset.projectTab;tabBody.innerHTML=which==="tasks"?table(["Task","Status","Priority","Due",""],taskRows):which==="milestones"?table(["Milestone","Status","Due",""],mileRows):which==="people"?`<div class="toolbar"><button class="btn btn-primary btn-small" data-act="assign-project-member" data-id="${esc(id)}">＋ Add project member</button></div>${table(["Person","Role",""],memberRows)}`:which==="documents"?table(["Document","Status","Added",""],docRows):table(["Decision","Decision status","Decided"],decisions.map(d=>`<tr><td>${textCell(d.title,d.decision_text)}</td><td>${pill(d.decision_status)}</td><td>${fmtDate(d.decided_at)}</td></tr>`));});
    }catch(error){notify(error.message,"error");}}
  async function createProject(){const people=state.cache.people||await loadPeople();state.cache.people=people;openForm({title:"Create a project",description:"A project becomes the home for delivery tasks, milestones, documents and decisions. Link a client only when the project is authorised for that account.",fields:[{name:"name",label:"Project name",required:true,max:160},{name:"slug",label:"Project slug",required:true,max:100,help:"Lowercase letters, numbers and hyphens."},{name:"description",label:"Project description",type:"textarea",max:5000,span:2},{name:"client_account_id",label:"Client account (optional)",type:"select",options:[["","Internal project"],...(people.clients||[]).map(x=>[x.id,x.company_name||x.name||x.client_code])]},{name:"start_date",label:"Start date",type:"date"},{name:"target_date",label:"Target date",type:"date"}],onSubmit:async v=>{if(!v.client_account_id)delete v.client_account_id;await api("projects","create_project",v);notify("Project created.","success");await closeModal();await refresh();}});const name=$("field-name"),slug=$("field-slug");name?.addEventListener("input",()=>{if(!slug.dataset.touched)slug.value=slugify(name.value)});slug?.addEventListener("input",()=>slug.dataset.touched="1");}
  async function editProject(id){const projects=state.cache.projects||await fetchProjects();const p=projects.find(x=>x.id===id)||{};openForm({title:"Update project",description:"Change the project fields your role is authorised to manage.",fields:[{name:"name",label:"Project name",required:true,value:p.name,max:160},{name:"slug",label:"Slug",value:p.slug,max:100},{name:"description",label:"Description",type:"textarea",value:p.description,max:5000,span:2},{name:"status",label:"Status",type:"select",value:p.status,options:["planned","active","on_hold","completed","archived"].map(x=>[x,x.replaceAll("_"," ")])},{name:"progress_percent",label:"Progress %",type:"number",value:p.progress_percent,min:0,max:100},{name:"start_date",label:"Start date",type:"date",value:p.start_date},{name:"target_date",label:"Target date",type:"date",value:p.target_date}],onSubmit:async v=>{if(v.progress_percent!==undefined)v.progress_percent=Number(v.progress_percent);await api("projects","update_project",{project_id:id,...v});notify("Project updated.","success");await closeModal();await refresh();}});}
  async function listAllTasks(){const projects=await fetchProjects();const results=await Promise.all(projects.map(async p=>({project:p,result:await safe(api("projects","list_tasks",{project_id:p.id}))})));const all=[];results.forEach(({project,result})=>{if(result.ok)records(result.data,"tasks").forEach(t=>all.push({...t,project_name:project.name,project_id:project.id}));});state.cache.tasks=all;return {projects,tasks:all,failed:results.filter(x=>!x.result.ok)};}
  async function renderTasks(){const r=await safe(listAllTasks());const {projects=[],tasks=[],failed=[]}=r.ok?r.data:{projects:[],tasks:[],failed:[]};const rows=appendRows(tasks,t=>`<tr data-search="${esc(`${t.title} ${t.project_name} ${t.status} ${t.priority}`.toLowerCase())}"><td>${textCell(t.title,t.description)}</td><td>${esc(t.project_name)}</td><td>${pill(t.status)}</td><td>${pill(t.priority)}</td><td>${fmtDate(t.due_at)}</td><td>${actionButton("Update","edit-task",t.id)}</td></tr>`);
    let html=pageHead("tasks",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh</button><button class="btn btn-primary" data-act="create-task">${icon("plus")} New task</button>`);
    if(failed.length)html+=`<div class="info-banner">Some project task lists are restricted for your account. Tasks below are from projects you can access.</div>`;
    html+=`<div class="grid metric-grid">${stat("All tasks",tasks.length,"Across accessible projects","✓")}${stat("To do",tasks.filter(t=>t.status==="todo").length,"Not yet started","○")}${stat("In progress",tasks.filter(t=>t.status==="doing").length,"Underway","↗")}${stat("Done",tasks.filter(t=>t.status==="done").length,"Completed","✓")}</div>`;
    html+=panel("Execution board","Task status updates are permission-checked by the project service.",`${toolbarSearch("Search by task, project or priority…")}<div class="toolbar"><select class="control" id="taskStatusFilter"><option value="">All statuses</option><option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option></select><select class="control" id="taskProjectFilter"><option value="">All projects</option>${projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></div>${table(["Task","Project","Status","Priority","Due",""],rows,{emptyTitle:"No tasks to display",emptyCopy:"Create a task inside a project to begin tracking execution."})}`);
    $("pageContent").innerHTML=html;bindFilters();$("taskStatusFilter")?.addEventListener("change",e=>filterTableRows(row=>!e.target.value||row.dataset.status===e.target.value));$("taskProjectFilter")?.addEventListener("change",e=>filterTableRows(row=>!e.target.value||row.dataset.project===e.target.value));
    document.querySelectorAll("#pageContent tbody tr").forEach((tr,i)=>{const t=tasks[i];if(t){tr.dataset.status=t.status;tr.dataset.project=t.project_id;}});
  }
  function createTask(projectId=null){const projects=state.cache.projects||[];const fields=[{name:"project_id",label:"Project",type:"select",required:true,value:projectId||"",options:projects.map(p=>[p.id,p.name])},{name:"title",label:"Task title",required:true,max:180},{name:"description",label:"Description",type:"textarea",max:5000,span:2},{name:"priority",label:"Priority",type:"select",value:"normal",options:["low","normal","high","urgent"].map(x=>[x,x])},{name:"due_at",label:"Deadline",type:"datetime-local"}];openForm({title:"Create a task",description:"Tasks are scoped to one project. Assignment is a separate backend-controlled operation and is intentionally not exposed here.",fields,onSubmit:async v=>{if(v.due_at)v.due_at=new Date(v.due_at).toISOString();await api("projects","create_task",v);notify("Task created.","success");await closeModal();await refresh();}});}
  async function editTask(id){const tasks=state.cache.tasks||[];const t=tasks.find(x=>x.id===id);if(!t)return notify("Refresh the task list and try again.","error");const manager=state.permissionMap["tasks.manage"]===true;const fields=[{name:"status",label:"Task status",type:"select",value:t.status,options:[["todo","To do"],["doing","In progress"],["done","Done"]]}];if(manager)fields.push({name:"priority",label:"Priority",type:"select",value:t.priority,options:["low","normal","high","urgent"].map(x=>[x,x])},{name:"title",label:"Task title",value:t.title,max:180},{name:"due_at",label:"Deadline",type:"datetime-local",value:t.due_at?new Date(t.due_at).toISOString().slice(0,16):""});openForm({title:"Update task",description:manager?"Update the task fields permitted to project managers.":"Your assigned-task access allows you to update status. Other fields remain restricted by the backend.",fields,onSubmit:async v=>{if(v.due_at)v.due_at=new Date(v.due_at).toISOString();else if(v.due_at==="")v.due_at=null;await api("projects","update_task",{project_id:t.project_id,task_id:id,...v});notify("Task updated.","success");await closeModal();await refresh();}});}

  function createMilestone(projectId){if(!projectId)return notify("Open a project before creating a milestone.","error");openForm({title:"Create a project milestone",fields:[{name:"title",label:"Milestone title",required:true,max:180},{name:"description",label:"Description",type:"textarea",max:5000,span:2},{name:"due_date",label:"Due date",type:"date"}],onSubmit:async v=>{await api("projects","create_milestone",{project_id:projectId,...v});notify("Milestone created.","success");await closeModal();await openProject(projectId);}});}
  function createProjectDecision(projectId){if(!projectId)return notify("Open a project before recording a decision.","error");openForm({title:"Record a project decision",description:"Decision records are retained as an auditable project history.",fields:[{name:"title",label:"Decision title",required:true,max:180},{name:"decision_text",label:"Decision",type:"textarea",required:true,max:8000,span:2},{name:"context",label:"Context",type:"textarea",max:5000,span:2},{name:"rationale",label:"Rationale",type:"textarea",max:5000,span:2}],onSubmit:async v=>{await api("projects","add_project_decision",{project_id:projectId,...v});notify("Project decision recorded.","success");await closeModal();await openProject(projectId);}});}
  async function taskComments(taskId,projectId){if(!projectId)return notify("Project context is required to open task comments.","error");try{const d=await api("projects","list_task_comments",{project_id:projectId,task_id:taskId});const comments=records(d,"comments");openModal("TASK DISCUSSION","Task comments",`<div class="comment-list">${comments.length?comments.map(c=>`<article class="comment-item"><div class="comment-meta"><b>${esc(c.created_by===state.user?.id?"You":shortId(c.created_by))}</b><span>${fmtTime(c.created_at)}</span></div><p>${esc(c.body).replace(/\n/g,"<br>")}</p></article>`).join(""):empty("No comments yet","Add context, a question or a delivery update for this task.")}</div><form id="taskCommentForm" class="chat-input-row"><textarea id="taskCommentInput" rows="2" maxlength="5000" required placeholder="Write a task comment…"></textarea><button class="btn btn-primary" type="submit">Post ↗</button></form>`);$("taskCommentForm").onsubmit=async e=>{e.preventDefault();const body=$("taskCommentInput").value.trim();if(!body)return;const b=e.submitter;b.disabled=true;try{await api("projects","add_task_comment",{project_id:projectId,task_id:taskId,body});await closeModal();await taskComments(taskId,projectId);}catch(err){notify(err.message,"error");b.disabled=false;}};}catch(e){notify(e.message,"error");}}

  function editMilestone(projectId,milestoneId){const x=(state.cache.projectMilestones||[]).find(m=>m.id===milestoneId)||{};openForm({title:"Update milestone",fields:[{name:"title",label:"Milestone title",value:x.title,max:180},{name:"description",label:"Description",type:"textarea",value:x.description,max:5000,span:2},{name:"status",label:"Status",type:"select",value:x.status||"planned",options:["planned","in_progress","completed","blocked"].map(v=>[v,v.replaceAll("_"," ")])},{name:"due_date",label:"Due date",type:"date",value:x.due_date||""}],onSubmit:async v=>{await api("projects","update_milestone",{project_id:projectId,milestone_id:milestoneId,...v});notify("Milestone updated.","success");await closeModal();await openProject(projectId);}});}

  // CLIENT ACCOUNTS
  async function renderClients(){const r=await safe(api("workspace","client_accounts"));const clients=r.ok?records(r.data,"client_accounts"):[];let html=pageHead("clients",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh</button><button class="btn btn-primary" data-act="create-client">${icon("plus")} Add client</button>`);if(!r.ok)html+=`<div class="notice error">${esc(r.error.message)}</div>`;const rows=clients.map(c=>`<tr><td>${textCell(c.account_name,c.client_code)}</td><td>${pill(c.status)}</td><td>${fmtDate(c.created_at)}</td><td>${actionButton("Edit","edit-client",c.id)}</td></tr>`);html+=`<div class="grid metric-grid">${stat("Client accounts",clients.length,"Registered companies","◇")}${stat("Active",clients.filter(c=>c.status==="active").length,"Current relationships","✓")}${stat("Paused",clients.filter(c=>c.status==="paused").length,"Temporarily paused","◷")}${stat("Closed",clients.filter(c=>c.status==="closed").length,"Archived relationships","—")}</div>`+panel("Client directory","Accounts are linked to projects and client portal membership.",`${toolbarSearch("Search clients…")}${table(["Client account","Status","Created",""],rows,{emptyTitle:"No client accounts",emptyCopy:"Add your first client account before inviting client portal users."})}`);$("pageContent").innerHTML=html;bindFilters();state.cache.clients=clients;}
  function createClient(){openForm({title:"Add a client account",description:"Create a company account first, then link projects and invite client contacts.",fields:[{name:"account_name",label:"Company or client name",required:true,max:180},{name:"client_code",label:"Client code",required:true,placeholder:"CL-0001",max:20,help:"Use the CL-0001 format."}],onSubmit:async v=>{await api("workspace","create_client_account",v);notify("Client account created.","success");await closeModal();await refresh();}});}
  async function editClient(id){const c=(state.cache.clients||[]).find(x=>x.id===id)||{};openForm({title:"Update client account",fields:[{name:"account_name",label:"Account name",value:c.account_name,max:180},{name:"status",label:"Status",type:"select",value:c.status,options:[["active","Active"],["paused","Paused"],["closed","Closed"]]}],onSubmit:async v=>{await api("workspace","update_client_account",{client_account_id:id,...v});notify("Client account updated.","success");await closeModal();await refresh();}});}

  // PEOPLE, TEAMS, DEPARTMENTS AND INVITATIONS
  async function loadPeople(){const [m,d,t,i,c]=await Promise.all([safe(api("workspace","members")),safe(api("workspace","departments")),safe(api("workspace","teams")),safe(api("invitations","list")),safe(api("workspace","client_accounts"))]);return {members:m.ok?records(m.data,"members"):[],departments:d.ok?records(d.data,"departments"):[],teams:t.ok?records(t.data,"teams"):[],invitations:i.ok?records(i.data,"invitations"):[],clients:c.ok?records(c.data,"client_accounts"):[],errors:[m,d,t,i,c].filter(x=>!x.ok).map(x=>x.error)};}
  async function renderPeople(){const r=await loadPeople();state.cache.people=r;const rows=r.members.map(m=>`<tr><td>${textCell(m.display_name||m.full_name||shortId(m.user_id),m.job_title||m.email||m.user_id)}</td><td>${esc(m.role)}</td><td>${pill(m.status)}</td><td>${fmtDate(m.created_at)}</td><td><div class="table-actions">${actionButton("Profile","member-profile",m.user_id)}${actionButton("Role","member-role",m.user_id)}${actionButton("Status","member-status",m.user_id)}</div></td></tr>`);let html=pageHead("people",`<button class="btn btn-secondary" data-act="create-department">＋ Department</button><button class="btn btn-secondary" data-act="create-team">＋ Team</button><button class="btn btn-primary" data-act="invite-member">${icon("plus")} Invite member</button>`);if(r.errors.length)html+=`<div class="info-banner">Some people-management services are restricted for this role. Available records are shown below.</div>`;html+=`<div class="grid metric-grid">${stat("Members",r.members.length,"Nexus membership","♙")}${stat("Departments",r.departments.length,"Company structure","▤")}${stat("Teams",r.teams.length,"Delivery groups","♧")}${stat("Invitations",r.invitations.length,"Current and historical","✉")}</div><div class="tab-row"><button class="tab-button active" data-people-tab="members">Members</button><button class="tab-button" data-people-tab="departments">Departments</button><button class="tab-button" data-people-tab="teams">Teams</button><button class="tab-button" data-people-tab="invitations">Invitations</button></div><div id="peopleTabBody">${panel("Company directory","Account roles and active membership state.",`${toolbarSearch("Search members by name or role…")}${table(["Member","Role","Status","Joined",""],rows,{emptyTitle:"No member records",emptyCopy:"Invite colleagues to build the company."})}`)}</div>`;$("pageContent").innerHTML=html;bindFilters();document.querySelectorAll("[data-people-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-people-tab]").forEach(x=>x.classList.toggle("active",x===b));const v=b.dataset.peopleTab;$("peopleTabBody").innerHTML=v==="members"?panel("Company directory","Account roles and active membership state.",table(["Member","Role","Status","Joined",""],rows)):v==="departments"?panel("Departments","Organisational structure.",table(["Code","Department","Status",""],r.departments.map(d=>`<tr><td>${esc(d.code)}</td><td>${textCell(d.name,d.description)}</td><td>${pill(d.status)}</td><td>${actionButton("Edit","edit-department",d.id)}</td></tr>`))):v==="teams"?panel("Teams","Teams are assigned to a department.",table(["Code","Team","Department","Status",""],r.teams.map(t=>`<tr><td>${esc(t.code)}</td><td>${textCell(t.name,t.description)}</td><td>${esc(r.departments.find(d=>d.id===t.department_id)?.name||shortId(t.department_id))}</td><td>${pill(t.status)}</td><td>${actionButton("Edit","edit-team",t.id)}</td></tr>`))):panel("Invitation ledger","Prepared, sent and accepted invitations.",table(["Person","Role","Status","Expires",""],r.invitations.map(i=>`<tr><td>${textCell(i.full_name||i.email,i.job_title)}</td><td>${esc(i.role)}</td><td>${pill(i.status)}</td><td>${fmtDate(i.expires_at)}</td><td>${i.status==="pending"?`${actionButton("Send","send-invite",i.id)} ${actionButton("Cancel","cancel-invite",i.id,"btn-danger")}`:"—"}</td></tr>`)));bindFilters();});}
  function inviteMember(){const d=state.cache.people?.departments||[],t=state.cache.people?.teams||[],c=state.cache.people?.clients||[];openForm({title:"Invite a teammate or partner",description:"Invitations are prepared first. Sending email also requires NEXUS_INVITE_REDIRECT_URL to be configured in Supabase Edge Function secrets.",fields:[{name:"email",label:"Email address",type:"email",required:true},{name:"role",label:"Nexus role",type:"select",value:"team",required:true,options:["admin","manager","team","designer","developer","investor","client"].map(x=>[x,x[0].toUpperCase()+x.slice(1)])},{name:"full_name",label:"Full name",max:120},{name:"job_title",label:"Job title",max:100},{name:"department_id",label:"Department",type:"select",options:[["","No department"],...d.filter(x=>x.status==="active").map(x=>[x.id,x.name])]},{name:"team_id",label:"Team",type:"select",options:[["","No team"],...t.filter(x=>x.status==="active").map(x=>[x.id,x.name])]},{name:"client_account_id",label:"Client account (Client role only)",type:"select",options:[["","Choose client account"],...c.filter(x=>x.status==="active").map(x=>[x.id,x.account_name])]},{name:"contact_type",label:"Contact type",type:"select",value:"primary",options:["primary","project","technical","billing","other"].map(x=>[x,x])}],onSubmit:async v=>{for(const k of ["department_id","team_id","client_account_id"])if(!v[k])v[k]=null;const out=unwrap(await api("invitations","create",v));notify("Invitation prepared. Use Send from the invitation list when ready.","success");await closeModal();await refresh();if(out.invitation?.id)notify(`Invitation ${shortId(out.invitation.id)} is pending.`);}});}
  async function sendInvite(id){if(!confirm("Send this invitation email using the configured Supabase Auth invitation flow?"))return;try{await api("invitations","send",{invitation_id:id});notify("Supabase Auth accepted the invitation email request.","success");await refresh();}catch(error){notify(error.message,"error");}}
  async function cancelInvite(id){if(!confirm("Cancel this pending invitation?"))return;try{await api("invitations","cancel",{invitation_id:id});notify("Invitation cancelled.","success");await refresh();}catch(error){notify(error.message,"error");}}
  function createDepartment(){openForm({title:"Create department",fields:[{name:"code",label:"Department code",required:true,placeholder:"ENG",max:20,help:"Uppercase letters, numbers, underscores or hyphens."},{name:"name",label:"Department name",required:true,max:120},{name:"description",label:"Description",type:"textarea",max:500,span:2}],onSubmit:async v=>{await api("workspace","create_department",v);notify("Department created.","success");await closeModal();await refresh();}});}
  function editDepartment(id){const d=(state.cache.people?.departments||[]).find(x=>x.id===id)||{};openForm({title:"Update department",fields:[{name:"code",label:"Code",value:d.code,max:20},{name:"name",label:"Name",value:d.name,max:120},{name:"description",label:"Description",type:"textarea",value:d.description,max:500,span:2},{name:"status",label:"Status",type:"select",value:d.status,options:[["active","Active"],["inactive","Inactive"]]}],onSubmit:async v=>{await api("workspace","update_department",{department_id:id,...v});notify("Department updated.","success");await closeModal();await refresh();}});}
  function createTeam(){const d=state.cache.people?.departments||[];openForm({title:"Create team",fields:[{name:"department_id",label:"Department",type:"select",required:true,options:d.filter(x=>x.status==="active").map(x=>[x.id,x.name])},{name:"code",label:"Team code",required:true,max:20,placeholder:"PLATFORM"},{name:"name",label:"Team name",required:true,max:120},{name:"description",label:"Description",type:"textarea",max:500,span:2}],onSubmit:async v=>{await api("workspace","create_team",v);notify("Team created.","success");await closeModal();await refresh();}});}
  function editTeam(id){const t=(state.cache.people?.teams||[]).find(x=>x.id===id)||{};const d=state.cache.people?.departments||[];openForm({title:"Update team",fields:[{name:"department_id",label:"Department",type:"select",value:t.department_id,options:[["","No department"],...d.map(x=>[x.id,x.name])]},{name:"code",label:"Team code",value:t.code,max:20},{name:"name",label:"Team name",value:t.name,max:120},{name:"description",label:"Description",type:"textarea",value:t.description,max:500,span:2},{name:"status",label:"Status",type:"select",value:t.status,options:[["active","Active"],["inactive","Inactive"]]}],onSubmit:async v=>{if(v.department_id==="")v.department_id=null;await api("workspace","update_team",{team_id:id,...v});notify("Team updated.","success");await closeModal();await refresh();}});}
  async function memberRole(id){openForm({title:"Change member role",description:"The database enforces Owner safeguards. Only permitted role changes will be accepted.",fields:[{name:"role",label:"Nexus role",type:"select",required:true,options:["owner","admin","manager","team","designer","developer","investor","client"].map(x=>[x,x])}],onSubmit:async v=>{await api("workspace","set_member_role",{user_id:id,...v});notify("Member role updated.","success");await closeModal();await refresh();}});}
  async function memberStatus(id){openForm({title:"Update membership status",description:"The database prevents self-suspension and protects the final active Owner.",fields:[{name:"status",label:"Membership status",type:"select",required:true,options:[["active","Active"],["suspended","Suspended"],["revoked","Revoked"]]}],onSubmit:async v=>{await api("member","members.status.update",{user_id:id,new_status:v.status});notify("Membership status updated.","success");await closeModal();await refresh();}});}

  // PRODUCTS, METRICS, INTEGRATIONS AND RELEASE NOTES
  async function renderProducts(){const [p,m,d,i,runs,events,releases,pending]=await Promise.all([safe(api("analytics","products")),safe(api("analytics","latest_metrics")),safe(api("analytics","metric_definitions")),safe(api("analytics","integrations")),safe(api("analytics","ingestion_runs")),safe(api("analytics","sync_events")),safe(api("command","product_releases.list")),safe(api("analytics","pending_manual_metrics"))]);const data={products:p.ok?records(p.data,"products"):[],metrics:m.ok?records(m.data,"metrics"):[],definitions:d.ok?records(d.data,"definitions"):[],integrations:i.ok?records(i.data,"integrations"):[],runs:runs.ok?records(runs.data,"runs"):[],events:events.ok?records(events.data,"events"):[],releases:releases.ok?records(releases.data,"releases"):[],pending:pending.ok?records(pending.data,"pending_metrics"):[]};state.cache.products=data;const rows=data.products.map(x=>`<tr><td>${textCell(x.name,x.summary||x.slug)}</td><td>${pill(x.status)}</td><td>${esc(x.current_version||"—")}</td><td>${fmtDate(x.updated_at||x.created_at)}</td><td>${actionButton("Releases","product-releases",x.id)}</td></tr>`);let html=pageHead("products",`<button class="btn btn-secondary" data-act="create-manual-metric">＋ Record metric</button><button class="btn btn-secondary" data-act="create-release">＋ Release</button><button class="btn btn-primary" data-act="create-product">${icon("plus")} Add product</button>`);html+=`<div class="grid metric-grid">${stat("Products",data.products.length,"Registered portfolio","⬡")}${stat("Verified metrics",data.metrics.length,"Sample and unverified values excluded","↗")}${stat("Integrations",data.integrations.length,"Registered product connections","⌁")}${stat("Pending manual metrics",data.pending.length,"Awaiting authorised review","◷")}</div><div class="tab-row"><button class="tab-button active" data-product-tab="portfolio">Portfolio</button><button class="tab-button" data-product-tab="metrics">Verified metrics</button><button class="tab-button" data-product-tab="definitions">Metric definitions</button><button class="tab-button" data-product-tab="integrations">Integrations</button><button class="tab-button" data-product-tab="runs">Sync history</button><button class="tab-button" data-product-tab="releases">Releases</button><button class="tab-button" data-product-tab="pending">Metric review</button></div><div id="productTabBody">${panel("Product portfolio","The live product records in your organisation.",`${toolbarSearch("Search products…")}${table(["Product","Lifecycle","Version","Updated",""],rows,{emptyTitle:"No registered products",emptyCopy:"Add a product record before defining metrics or registering integrations."})}`)}</div>`;$("pageContent").innerHTML=html;bindFilters();document.querySelectorAll("[data-product-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-product-tab]").forEach(x=>x.classList.toggle("active",x===b));const v=b.dataset.productTab;const host=$("productTabBody");if(v==="portfolio")host.innerHTML=panel("Product portfolio","The live product records in your organisation.",table(["Product","Lifecycle","Version","Updated",""],rows));else if(v==="metrics")host.innerHTML=panel("Latest verified metrics","Only verified, non-sample observations are returned.",table(["Product","Metric","Value","Source","Observed",""],data.metrics.map(m=>`<tr><td>${esc(m.product_name||shortId(m.product_id))}</td><td>${textCell(m.metric_label||m.metric_key,m.metric_key)}</td><td>${esc(`${fmtNum(m.metric_value)} ${m.unit||""}`)}</td><td>${pill(m.source)}</td><td>${fmtDate(m.observed_at)}</td><td>${actionButton("History","metric-history",m.product_id)}</td></tr>`)));else if(v==="definitions")host.innerHTML=panel("Metric definitions","Definitions establish the approved metric vocabulary for a product.",`<div class="toolbar"><button class="btn btn-primary btn-small" data-act="create-metric-definition">＋ Define metric</button></div>${table(["Product","Metric key","Label","Unit","Aggregation","State",""],data.definitions.map(x=>`<tr><td>${esc(data.products.find(p=>p.id===x.product_id)?.name||shortId(x.product_id))}</td><td class="cell-mono">${esc(x.metric_key)}</td><td>${esc(x.metric_label)}</td><td>${esc(x.unit)}</td><td>${esc(x.aggregation)}</td><td>${pill(x.is_active?"active":"inactive")}</td><td>${actionButton("Edit","edit-metric-definition",x.id)}</td></tr>`))}`);else if(v==="integrations")host.innerHTML=panel("Product integrations","New integrations start pending. Activation requires a successful trusted server-side test.",`<div class="toolbar"><button class="btn btn-primary btn-small" data-act="register-integration">＋ Register integration</button></div>${table(["Integration","Product","Platform","State","Test status",""],data.integrations.map(x=>`<tr><td>${textCell(x.display_name,x.integration_key)}</td><td>${esc(data.products.find(p=>p.id===x.product_id)?.name||shortId(x.product_id))}</td><td>${esc(x.platform)}</td><td>${pill(x.state)}</td><td>${pill(x.last_test_status||"not tested")}</td><td>${actionButton("Manage","integration-state",x.id)}</td></tr>`))}`);else if(v==="runs")host.innerHTML=panel("Ingestion history","Server-side ingestion runs and safe event summaries.",table(["Run","Status","Received","Accepted","Rejected","Finished"],data.runs.map(x=>`<tr><td class="cell-mono">${shortId(x.id)}</td><td>${pill(x.run_status)}</td><td>${fmtNum(x.metrics_received)}</td><td>${fmtNum(x.metrics_accepted)}</td><td>${fmtNum(x.metrics_rejected)}</td><td>${fmtTime(x.finished_at)}</td></tr>`)));else if(v==="releases")host.innerHTML=panel("Product releases","Draft, publish and archive product release notes.",`<div class="toolbar"><button class="btn btn-primary btn-small" data-act="create-release">＋ New release</button></div>${table(["Product","Version","Release","Status","Date",""],data.releases.map(x=>`<tr><td>${esc(data.products.find(p=>p.id===x.product_id)?.name||shortId(x.product_id))}</td><td>${esc(x.version)}</td><td>${textCell(x.title,x.release_notes)}</td><td>${pill(x.release_status)}</td><td>${fmtDate(x.released_at||x.created_at)}</td><td>${`${x.release_status==="draft"?actionButton("Publish","publish-release",x.id):""} ${actionButton("Edit","edit-release",x.id)} ${x.release_status!=="archived"?actionButton("Archive","archive-release",x.id,"btn-danger"):""}`}</td></tr>`))}`);else host.innerHTML=panel("Manual metric review","Manual measurements are held pending until an authorised reviewer verifies them.",table(["Metric","Value","Period","Recorded",""],data.pending.map(x=>`<tr><td>${textCell(x.metric_label,x.metric_key)}</td><td>${esc(`${fmtNum(x.metric_value)} ${x.unit||""}`)}</td><td>${fmtDate(x.period_start)} – ${fmtDate(x.period_end)}</td><td>${fmtDate(x.observed_at)}</td><td>${actionButton("Verify","verify-metric",x.id,"btn-primary")}</td></tr>`)));});}
  function createProduct(){openForm({title:"Register a product",description:"New products start in planning. Lifecycle status cannot be declared live by creating a record.",fields:[{name:"name",label:"Product name",required:true,max:120},{name:"slug",label:"Product slug",required:true,max:100},{name:"summary",label:"Summary",type:"textarea",max:5000,span:2},{name:"current_version",label:"Current version",max:60},{name:"roadmap_summary",label:"Roadmap summary",type:"textarea",max:5000,span:2}],onSubmit:async v=>{await api("analytics","create_product",v);notify("Product registered in planning.","success");await closeModal();await refresh();}});}
  function createMetricDefinition(){const p=state.cache.products?.products||[];openForm({title:"Define a product metric",fields:[{name:"product_id",label:"Product",type:"select",required:true,options:p.map(x=>[x.id,x.name])},{name:"metric_key",label:"Metric key",required:true,max:80,placeholder:"active_users"},{name:"metric_label",label:"Metric label",required:true,max:120},{name:"unit",label:"Unit",value:"count",max:30},{name:"aggregation",label:"Aggregation",type:"select",value:"latest",options:["latest","sum","average","maximum","minimum"].map(x=>[x,x])}],onSubmit:async v=>{await api("analytics","create_metric_definition",v);notify("Metric definition created.","success");await closeModal();await refresh();}});}
  function registerIntegration(){const p=state.cache.products?.products||[];openForm({title:"Register product integration",description:"This creates a pending integration record. No credential is entered or stored in the browser, and it will not be activated until the trusted server-side test passes.",fields:[{name:"product_id",label:"Product",type:"select",required:true,options:p.map(x=>[x.id,x.name])},{name:"integration_key",label:"Integration key",required:true,max:80,placeholder:"analytics_provider"},{name:"platform",label:"Platform",required:true,max:80,placeholder:"Webhook / Provider"},{name:"display_name",label:"Display name",required:true,max:120}],onSubmit:async v=>{await api("analytics","register_integration",v);notify("Integration registered as pending.","success");await closeModal();await refresh();}});}
  async function integrationState(id){const x=(state.cache.products?.integrations||[]).find(i=>i.id===id)||{};openForm({title:"Integration lifecycle",description:"The database blocks activation unless a trusted integration test has passed.",fields:[{name:"state",label:"State",type:"select",value:x.state||"pending",options:["pending","active","paused","revoked","error"].map(s=>[s,s])},{name:"error_code",label:"Safe error code (when relevant)",max:100}],onSubmit:async v=>{await api("analytics","set_integration_state",{integration_id:id,...v});notify("Integration state request processed.","success");await closeModal();await refresh();}});}
  function createRelease(){const p=state.cache.products?.products||[];openForm({title:"Create release notes",fields:[{name:"product_id",label:"Product",type:"select",required:true,options:p.map(x=>[x.id,x.name])},{name:"version",label:"Version",required:true,max:60,placeholder:"1.0.0"},{name:"title",label:"Release title",required:true,max:180},{name:"release_notes",label:"Release notes",type:"textarea",max:20000,span:2}],onSubmit:async v=>{await api("command","product_releases.create",v);notify("Release saved as draft.","success");await closeModal();await refresh();}});}
  async function publishRelease(id){if(!confirm("Publish this release note?"))return;try{await api("command","product_releases.publish",{release_id:id});notify("Release published.","success");await refresh();}catch(e){notify(e.message,"error");}}
  function editMetricDefinition(id){const list=state.cache.products?.definitions||[];const d=list.find(x=>x.id===id);if(!d)return notify("Refresh metric definitions and try again.","error");openForm({title:"Edit metric definition",description:"Metric keys remain stable. You can update the label, unit, aggregation and active state.",fields:[{name:"metric_label",label:"Metric label",value:d.metric_label,required:true,max:120},{name:"unit",label:"Unit",value:d.unit,max:30},{name:"aggregation",label:"Aggregation",type:"select",value:d.aggregation,options:["latest","sum","average","maximum","minimum"].map(x=>[x,x])},{name:"is_active",label:"Definition active",type:"select",value:String(d.is_active),options:[["true","Active"],["false","Inactive"]]}],onSubmit:async v=>{v.is_active=v.is_active==="true";await api("analytics","update_metric_definition",{definition_id:id,...v});notify("Metric definition updated.","success");await closeModal();await refresh();}});}
  function createManualMetric(){const data=state.cache.products||{};const products=data.products||[],definitions=(data.definitions||[]).filter(x=>x.is_active);if(!products.length||!definitions.length)return notify("Add a product and an active metric definition before recording a measurement.","error");const metricOptions=definitions.map(x=>{const product=products.find(p=>p.id===x.product_id);return [`${x.product_id}::${x.metric_key}`,`${product?.name||shortId(x.product_id)} · ${x.metric_label} (${x.unit||"count"})`];});openForm({title:"Record a manual metric",description:"Manual observations are created as pending. They are excluded from verified performance metrics until an authorised reviewer verifies them.",fields:[{name:"metric_ref",label:"Product metric",type:"select",required:true,options:metricOptions},{name:"metric_value",label:"Metric value",type:"number",required:true,min:0},{name:"period_start",label:"Period start",type:"date"},{name:"period_end",label:"Period end",type:"date"},{name:"source_reference",label:"Source reference (optional)",max:300,span:2}],onSubmit:async v=>{const split=v.metric_ref.split("::");if(split.length!==2)throw new Error("Choose a valid product metric.");v.product_id=split[0];v.metric_key=split[1];delete v.metric_ref;v.metric_value=Number(v.metric_value);if(!Number.isFinite(v.metric_value)||v.metric_value<0)throw new Error("Enter a non-negative finite metric value.");if(!v.period_start)delete v.period_start;if(!v.period_end)delete v.period_end;if(!v.source_reference)delete v.source_reference;await api("analytics","create_manual_metric",v);notify("Manual metric entered as pending review.","success");await closeModal();await refresh();}});}
  function metricHistoryCharts(metrics){
    const grouped=new Map();
    metrics.forEach(item=>{
      const value=Number(item.metric_value);
      if(!Number.isFinite(value)||!item.metric_key||!item.observed_at)return;
      const key=String(item.metric_key)+"|"+String(item.unit||"");
      if(!grouped.has(key))grouped.set(key,[]);
      grouped.get(key).push(item);
    });
    return Array.from(grouped.values()).map(items=>{
      const ordered=items.slice().sort((a,b)=>new Date(a.observed_at)-new Date(b.observed_at));
      if(ordered.length<2)return "";
      const values=ordered.map(item=>Number(item.metric_value));
      const min=Math.min.apply(null,values);
      const max=Math.max.apply(null,values);
      const range=max-min||Math.max(Math.abs(max)*.08,1);
      const points=values.map((value,index)=>{
        const x=18+(index/(values.length-1))*644;
        const y=116-((value-min)/range)*88;
        return {x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),value};
      });
      const path=points.map((point,index)=>(index?"L ":"M ")+point.x+" "+point.y).join(" ");
      const dots=points.map((point,index)=>{
        const observation=ordered[index];
        const detail=fmtDate(observation.observed_at)+" · "+fmtNum(observation.metric_value)+" "+(observation.unit||"");
        return '<circle cx="'+point.x+'" cy="'+point.y+'" r="3.5" fill="var(--cyan)" stroke="var(--surface)" stroke-width="2"><title>'+esc(detail)+'</title></circle>';
      }).join("");
      const first=ordered[0],last=ordered[ordered.length-1];
      const title=first.metric_label||first.metric_key;
      return '<section class="metric-history-chart"><div class="metric-history-head"><div><h3>'+esc(title)+'</h3><p>'+esc(first.unit||"Recorded value")+' · '+ordered.length+' saved observations</p></div><strong>'+esc(fmtNum(last.metric_value))+' '+esc(last.unit||"")+'</strong></div><div class="metric-history-range"><span>Low · '+esc(fmtNum(min))+'</span><span>High · '+esc(fmtNum(max))+'</span></div><svg viewBox="0 0 680 140" role="img" aria-label="'+esc(title)+' time series with '+ordered.length+' recorded observations. Low '+esc(fmtNum(min))+'; high '+esc(fmtNum(max))+'"><path d="M 18 116 H 662 M 18 72 H 662 M 18 28 H 662" fill="none" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="4 6"/><path d="'+path+'" fill="none" stroke="var(--cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+dots+'</svg><div class="metric-history-axis"><span>'+fmtDate(first.observed_at)+'</span><span>'+fmtDate(last.observed_at)+'</span></div></section>';
    }).join("");
  }
  async function showMetricHistory(productId){
    try{
      const response=await api("analytics","metric_history",{product_id:productId,limit:100});
      const metrics=records(response,"metrics");
      const product=(state.cache.products?.products||[]).find(item=>item.id===productId);
      const charts=metricHistoryCharts(metrics);
      const rows=metrics.map(item=>'<tr><td>'+textCell(item.metric_label,item.metric_key)+'</td><td>'+esc(fmtNum(item.metric_value)+' '+(item.unit||""))+'</td><td>'+pill(item.source)+'</td><td>'+pill(item.verification)+'</td><td>'+fmtTime(item.observed_at)+'</td></tr>');
      const tableHtml=table(["Metric","Value","Source","Verification","Observed"],rows,{emptyTitle:"No observations returned",emptyCopy:"The history service returned no metric observations for this product."});
      const note=metrics.length?'<p class="metric-history-disclosure">Each line represents one metric key and unit. Only saved observations returned by Nexus are plotted; unlike metrics are never combined.</p>':"";
      openModal("METRIC HISTORY",product?.name||"Verified metric history",(charts||"")+note+tableHtml);
    }catch(error){notify(error.message,"error");}
  }

  async function verifyMetric(id){if(!confirm("Verify this manual metric? This action is recorded in the audit trail."))return;try{await api("analytics","verify_manual_metric",{metric_id:id});notify("Metric verified.","success");await refresh();}catch(e){notify(e.message,"error");}}

  // STRATEGY — objectives, key results, company decisions, weekly reports.
  async function renderStrategy(){const [o,k,d,w]=await Promise.all([safe(api("command","objectives.list")),safe(api("command","key_results.list")),safe(api("command","decisions.list")),safe(api("command","weekly_summaries.list"))]);const data={objectives:o.ok?records(o.data):[],keyResults:k.ok?records(k.data):[],decisions:d.ok?records(d.data):[],summaries:w.ok?records(w.data):[]};state.cache.strategy=data;
    let html=pageHead("strategy",`<button class="btn btn-secondary" data-act="create-decision">＋ Decision</button><button class="btn btn-secondary" data-act="create-summary">＋ Weekly review</button><button class="btn btn-primary" data-act="create-objective">${icon("plus")} New objective</button>`);
    html+=`<div class="grid metric-grid">${stat("Objectives",data.objectives.length,"Company priorities","◎")}${stat("Key results",data.keyResults.length,"Measurable outcomes","↗")}${stat("Decisions",data.decisions.length,"Decision ledger","◇")}${stat("Weekly reviews",data.summaries.length,"Operating cadence","▤")}</div><div class="tab-row"><button class="tab-button active" data-strategy-tab="objectives">Objectives</button><button class="tab-button" data-strategy-tab="key-results">Key results</button><button class="tab-button" data-strategy-tab="decisions">Decisions</button><button class="tab-button" data-strategy-tab="weekly">Weekly reviews</button></div><div id="strategyTabBody">${panel("Company objectives","Set a clear period and owner for each outcome.",table(["Objective","Period","Owner","Status",""],data.objectives.map(x=>`<tr><td>${textCell(x.title,x.description)}</td><td>${fmtDate(x.period_start)} – ${fmtDate(x.period_end)}</td><td>${esc(shortId(x.owner_user_id))}</td><td>${pill(x.objective_status)}</td><td>${actionButton("Edit","edit-objective",x.id)}</td></tr>`)))}</div>`;
    $("pageContent").innerHTML=html;document.querySelectorAll("[data-strategy-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-strategy-tab]").forEach(x=>x.classList.toggle("active",x===b));const host=$("strategyTabBody"),v=b.dataset.strategyTab;host.innerHTML=v==="objectives"?panel("Company objectives","Set a clear period and owner for each outcome.",table(["Objective","Period","Owner","Status",""],data.objectives.map(x=>`<tr><td>${textCell(x.title,x.description)}</td><td>${fmtDate(x.period_start)} – ${fmtDate(x.period_end)}</td><td>${esc(shortId(x.owner_user_id))}</td><td>${pill(x.objective_status)}</td><td>${actionButton("Edit","edit-objective",x.id)} ${actionButton("Key result","create-key-result-for",x.id)}</td></tr>`))):v==="key-results"?panel("Key results","Targets and current values. Progress reflects saved measurements.",`<div class="toolbar"><button class="btn btn-primary btn-small" data-act="create-key-result">＋ Add key result</button></div>${table(["Key result","Objective","Current","Target","Confidence",""],data.keyResults.map(x=>`<tr><td>${textCell(x.title,x.unit)}</td><td>${esc(data.objectives.find(o=>o.id===x.objective_id)?.title||shortId(x.objective_id))}</td><td>${fmtNum(x.current_value)} ${esc(x.unit||"")}</td><td>${fmtNum(x.target_value)} ${esc(x.unit||"")}</td><td>${fmtNum(x.confidence_percent)}%</td><td>${actionButton("Update","edit-key-result",x.id)}</td></tr>`))}`):v==="decisions"?panel("Decision ledger","Significant company decisions and their context.",`<div class="toolbar"><button class="btn btn-primary btn-small" data-act="create-decision">＋ Record decision</button></div>${table(["Decision","Status","Department","Date"],data.decisions.map(x=>`<tr><td>${textCell(x.title,x.decision_text)}</td><td>${pill(x.decision_status)}</td><td>${esc(x.department_id?shortId(x.department_id):"Company")}</td><td>${fmtDate(x.decided_at)}</td></tr>`))}`):panel("Weekly company reviews","Create a structured record of highlights, blockers and operating status.",`<div class="toolbar"><button class="btn btn-primary btn-small" data-act="create-summary">＋ Create weekly review</button></div>${table(["Week","Summary","Status","Created",""],data.summaries.map(x=>`<tr><td>${fmtDate(x.week_start)} – ${fmtDate(x.week_end)}</td><td>${textCell((x.summary_markdown||"").slice(0,70),`${(x.highlights||[]).length} highlights · ${(x.blockers||[]).length} blockers`)}</td><td>${pill(x.summary_status)}</td><td>${fmtDate(x.created_at)}</td><td>${`${x.summary_status==="draft"?actionButton("Publish","publish-summary",x.id):""} ${actionButton("Edit","edit-summary",x.id)} ${x.summary_status!=="archived"?actionButton("Archive","archive-summary",x.id,"btn-danger"):""}`}</td></tr>`))}`);});
  }
  function createObjective(){openForm({title:"Create company objective",description:"An objective is saved as a draft until the appropriate workflow is completed.",fields:[{name:"title",label:"Objective",required:true,max:180},{name:"description",label:"Description",type:"textarea",max:5000,span:2},{name:"period_start",label:"Period start",type:"date",required:true},{name:"period_end",label:"Period end",type:"date",required:true}],onSubmit:async v=>{await api("command","objectives.create",v);notify("Objective created as a draft.","success");await closeModal();await refresh();}});}
  function editObjective(id){const x=(state.cache.strategy?.objectives||[]).find(o=>o.id===id)||{};openForm({title:"Update objective",fields:[{name:"title",label:"Title",value:x.title,max:180},{name:"description",label:"Description",type:"textarea",value:x.description,max:5000,span:2},{name:"period_start",label:"Start date",type:"date",value:x.period_start},{name:"period_end",label:"End date",type:"date",value:x.period_end},{name:"objective_status",label:"Status",type:"select",value:x.objective_status,options:["draft","active","completed","cancelled"].map(s=>[s,s])}],onSubmit:async v=>{await api("command","objectives.update",{objective_id:id,...v});notify("Objective updated.","success");await closeModal();await refresh();}});}
  function createKeyResult(objectiveId=null){const objs=state.cache.strategy?.objectives||[];openForm({title:"Add a key result",fields:[{name:"objective_id",label:"Objective",type:"select",required:true,value:objectiveId||"",options:objs.map(o=>[o.id,o.title])},{name:"title",label:"Key result",required:true,max:180},{name:"target_value",label:"Target value",type:"number",required:true,min:0.01},{name:"current_value",label:"Current value",type:"number",value:0,min:0},{name:"unit",label:"Unit",value:"count",max:30},{name:"confidence_percent",label:"Confidence %",type:"number",value:0,min:0,max:100}],onSubmit:async v=>{v.target_value=Number(v.target_value);v.current_value=Number(v.current_value||0);v.confidence_percent=Number(v.confidence_percent||0);await api("command","key_results.create",v);notify("Key result created.","success");await closeModal();await refresh();}});}
  async function assignProjectMember(projectId){if(!projectId)return notify("Open a project before adding a member.","error");const people=state.cache.people||await loadPeople();state.cache.people=people;const members=(people.members||[]).filter(m=>m.status==="active");if(!members.length)return notify("No active Nexus members are available.","error");openForm({title:"Add a project member",description:"The project service enforces active Nexus membership and project-lead rules.",fields:[{name:"user_id",label:"Nexus member",type:"select",required:true,options:members.map(m=>[m.user_id,m.display_name||m.full_name||m.email||shortId(m.user_id)])},{name:"project_role",label:"Project role",type:"select",required:true,value:"member",options:[["lead","Lead"],["member","Member"],["viewer","Viewer"]]}],onSubmit:async v=>{await api("projects","assign_project_member",{project_id:projectId,...v});notify("Project member added.","success");await closeModal();await openProject(projectId);}});}
  async function removeProjectMember(userId,projectId){if(!projectId)return notify("Project context is required.","error");if(!confirm("Remove this person from the project? The backend protects the last project lead."))return;try{await api("projects","remove_project_member",{project_id:projectId,user_id:userId});notify("Project member removed.","success");await openProject(projectId);}catch(e){notify(e.message,"error");}}
  async function memberProfile(userId){const people=state.cache.people||await loadPeople();state.cache.people=people;const m=(people.members||[]).find(x=>x.user_id===userId)||{};openForm({title:"Member work profile",description:"Job title, employment classification and organisational placement are separate from the member's Nexus role.",fields:[{name:"job_title",label:"Job title",value:m.job_title||"",max:100},{name:"bio",label:"Short bio",type:"textarea",value:m.bio||"",max:1200,span:2},{name:"department_id",label:"Department",type:"select",value:m.department_id||"",options:[["","No department"],...(people.departments||[]).map(x=>[x.id,x.name])]},{name:"team_id",label:"Team",type:"select",value:m.team_id||"",options:[["","No team"],...(people.teams||[]).map(x=>[x.id,x.name])]},{name:"employment_type",label:"Employment type",type:"select",value:m.employment_type||"employee",options:["employee","contractor","intern","advisor","external"].map(x=>[x,x])},{name:"employment_status",label:"Employment status",type:"select",value:m.employment_status||"active",options:["active","on_leave","inactive"].map(x=>[x,x])},{name:"start_date",label:"Start date",type:"date",value:m.start_date||""}],onSubmit:async v=>{if(!v.department_id)v.department_id=null;if(!v.team_id)v.team_id=null;if(!v.start_date)delete v.start_date;await api("workspace","set_member_details",{user_id:userId,...v});notify("Member profile updated.","success");await closeModal();await refresh();}});}
  function editKeyResult(id){const x=(state.cache.strategy?.keyResults||[]).find(k=>k.id===id);if(!x)return notify("Refresh the key-result list and try again.","error");openForm({title:"Update key result",fields:[{name:"title",label:"Key result",value:x.title,max:180},{name:"target_value",label:"Target value",type:"number",value:x.target_value,min:0.01},{name:"current_value",label:"Current value",type:"number",value:x.current_value,min:0},{name:"unit",label:"Unit",value:x.unit,max:30},{name:"confidence_percent",label:"Confidence %",type:"number",value:x.confidence_percent,min:0,max:100}],onSubmit:async v=>{for(const k of ["target_value","current_value","confidence_percent"])v[k]=Number(v[k]);await api("command","key_results.update",{key_result_id:id,...v});notify("Key result updated.","success");await closeModal();await refresh();}});}
  function editWeeklySummary(id){const x=(state.cache.strategy?.summaries||[]).find(a=>a.id===id);if(!x)return notify("Refresh weekly reviews and try again.","error");openForm({title:"Edit weekly review",fields:[{name:"summary_markdown",label:"Summary",type:"textarea",value:x.summary_markdown,max:20000,span:2},{name:"highlights_text",label:"Highlights (one per line)",type:"textarea",value:(x.highlights||[]).join("\n"),max:5000},{name:"blockers_text",label:"Blockers (one per line)",type:"textarea",value:(x.blockers||[]).join("\n"),max:5000}],onSubmit:async v=>{v.highlights=v.highlights_text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);v.blockers=v.blockers_text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);delete v.highlights_text;delete v.blockers_text;await api("command","weekly_summaries.update",{summary_id:id,...v});notify("Weekly review updated.","success");await closeModal();await refresh();}});}
  async function archiveWeeklySummary(id){if(!confirm("Archive this weekly review?"))return;try{await api("command","weekly_summaries.archive",{summary_id:id});notify("Weekly review archived.","success");await refresh();}catch(e){notify(e.message,"error");}}
  function editRelease(id){const x=(state.cache.products?.releases||[]).find(a=>a.id===id);if(!x)return notify("Refresh product releases and try again.","error");openForm({title:"Edit product release",fields:[{name:"title",label:"Release title",value:x.title,max:180},{name:"release_notes",label:"Release notes",type:"textarea",value:x.release_notes,max:20000,span:2}],onSubmit:async v=>{await api("command","product_releases.update",{release_id:id,...v});notify("Release updated.","success");await closeModal();await refresh();}});}
  async function archiveRelease(id){if(!confirm("Archive this release note?"))return;try{await api("command","product_releases.archive",{release_id:id});notify("Release archived.","success");await refresh();}catch(e){notify(e.message,"error");}}
  async function archiveInvestorUpdate(id){if(!confirm("Archive this investor update? It will no longer be available in the investor room."))return;try{await api("content","investor_updates.archive",{investor_update_id:id});notify("Investor update archived.","success");await refresh();}catch(e){notify(e.message,"error");}}

  function createDecision(){const deps=state.cache.people?.departments||[];openForm({title:"Record a company decision",description:"Decisions are recorded with context and rationale for governance and future reference.",fields:[{name:"title",label:"Decision title",required:true,max:180},{name:"department_id",label:"Department",type:"select",options:[["","Company-wide"],...deps.map(d=>[d.id,d.name])]},{name:"context",label:"Context",type:"textarea",max:6000,span:2},{name:"decision_text",label:"Decision",type:"textarea",required:true,max:8000,span:2},{name:"rationale",label:"Rationale",type:"textarea",max:6000,span:2}],onSubmit:async v=>{if(!v.department_id)delete v.department_id;await api("command","decisions.create",v);notify("Decision recorded.","success");await closeModal();await refresh();}});}
  function createWeeklySummary(){const today=new Date(),start=new Date(today);start.setDate(today.getDate()-((today.getDay()+6)%7));const end=new Date(start);end.setDate(start.getDate()+6);const iso=d=>d.toISOString().slice(0,10);openForm({title:"Create weekly review",description:"Save a weekly operating summary as a draft. Highlights and blockers are entered as separate lines.",fields:[{name:"week_start",label:"Week starts",type:"date",required:true,value:iso(start)},{name:"week_end",label:"Week ends",type:"date",required:true,value:iso(end)},{name:"summary_markdown",label:"Summary",type:"textarea",max:20000,span:2},{name:"highlights_text",label:"Highlights (one per line)",type:"textarea",max:5000},{name:"blockers_text",label:"Blockers (one per line)",type:"textarea",max:5000}],onSubmit:async v=>{v.highlights=v.highlights_text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);v.blockers=v.blockers_text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);delete v.highlights_text;delete v.blockers_text;await api("command","weekly_summaries.create",v);notify("Weekly review saved as draft.","success");await closeModal();await refresh();}});}
  async function publishSummary(id){if(!confirm("Publish this weekly company summary?"))return;try{await api("command","weekly_summaries.publish",{summary_id:id});notify("Weekly summary published.","success");await refresh();}catch(e){notify(e.message,"error");}}

  // INVESTOR ROOM AND ACCESS
  async function renderInvestors(){const [u,a]=await Promise.all([safe(api("content","investor_updates.list")),safe(api("admin","investor.access.list"))]);const updates=u.ok?records(u.data,"investor_updates"):[],access=a.ok?records(a.data,"data"):[];state.cache.investors={updates,access};let html=pageHead("investors",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh</button><button class="btn btn-primary" data-act="create-investor-update">${icon("plus")} New investor update</button>`);html+=`<div class="grid metric-grid">${stat("Investor updates",updates.length,"Investor room content","▤")}${stat("Published",updates.filter(x=>x.status==="published").length,"Visible to approved investors","✓")}${stat("Drafts",updates.filter(x=>x.status==="draft").length,"Not yet published","◷")}${stat("Access records",access.length,"Explicit investor access grants","♙")}</div><div class="tab-row"><button class="tab-button active" data-investor-tab="updates">Investor updates</button><button class="tab-button" data-investor-tab="access">Access control</button></div><div id="investorTabBody">${panel("Investor room updates","Prepare and publish company updates for approved investor accounts.",table(["Update","Status","Published","Created"],updates.map(x=>`<tr><td>${textCell(x.title,x.summary||x.body)}</td><td>${pill(x.status)}</td><td>${fmtDate(x.published_at)}</td><td>${fmtDate(x.created_at)}</td><td>${x.status==="draft"?`${actionButton("Edit","edit-investor-update",x.id)} ${actionButton("Publish","publish-investor-update",x.id)}`:""} ${x.status!=="archived"?actionButton("Archive","archive-investor-update",x.id,"btn-danger"):""}</td></tr>`)))}</div>`;$("pageContent").innerHTML=html;document.querySelectorAll("[data-investor-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-investor-tab]").forEach(x=>x.classList.toggle("active",x===b));$("investorTabBody").innerHTML=b.dataset.investorTab==="updates"?panel("Investor room updates","Prepare and publish company updates.",table(["Update","Status","Published","Created",""],updates.map(x=>`<tr><td>${textCell(x.title,x.summary||x.body)}</td><td>${pill(x.status)}</td><td>${fmtDate(x.published_at)}</td><td>${fmtDate(x.created_at)}</td><td>${x.status==="draft"?`${actionButton("Edit","edit-investor-update",x.id)} ${actionButton("Publish","publish-investor-update",x.id)}`:""} ${x.status!=="archived"?actionButton("Archive","archive-investor-update",x.id,"btn-danger"):""}</td></tr>`))):panel("Investor access ledger","Access is explicitly granted or revoked for active Nexus members.",table(["User ID","Access","Granted",""],access.map(x=>`<tr><td class="cell-mono">${esc(x.user_id)}</td><td>${pill(x.status|| (x.is_active?"active":"inactive"))}</td><td>${fmtDate(x.granted_at)}</td><td>${actionButton(x.status==="active"?"Revoke":"Grant", "toggle-investor-access",x.user_id)}</td></tr>`)));});}
  function createInvestorUpdate(){openForm({title:"Create investor update",description:"The update is saved as a draft. Publishing makes it available through the investor room.",fields:[{name:"title",label:"Update title",required:true,max:180},{name:"summary",label:"Short summary",max:3000,type:"textarea",span:2},{name:"body",label:"Full update",required:true,max:20000,type:"textarea",span:2}],onSubmit:async v=>{await api("content","investor_updates.create",v);notify("Investor update saved as draft.","success");await closeModal();await refresh();}});}
  function editInvestorUpdate(id){const x=(state.cache.investors?.updates||[]).find(a=>a.id===id);if(!x)return notify("Refresh investor updates and try again.","error");if(x.status!=="draft")return notify("Only draft investor updates can be edited.","error");openForm({title:"Edit investor update",fields:[{name:"title",label:"Update title",value:x.title,required:true,max:180},{name:"summary",label:"Short summary",type:"textarea",value:x.summary||"",max:3000,span:2},{name:"body",label:"Full update",type:"textarea",value:x.body||"",required:true,max:20000,span:2}],onSubmit:async v=>{await api("content","investor_updates.update",{investor_update_id:id,...v});notify("Investor update saved.","success");await closeModal();await refresh();}});}
  async function publishInvestorUpdate(id){if(!confirm("Publish this investor update to authorised investor accounts?"))return;try{await api("content","investor_updates.publish",{investor_update_id:id});notify("Investor update published.","success");await refresh();}catch(e){notify(e.message,"error");}}
  async function toggleInvestorAccess(id){const current=(state.cache.investors?.access||[]).find(x=>x.user_id===id);const active=!(current?.status==="active"||current?.is_active===true);if(!confirm(`${active?"Grant":"Revoke"} investor room access for ${shortId(id)}?`))return;try{await api("admin","investor.access.set",{user_id:id,is_active:active});notify(`Investor room access ${active?"granted":"revoked"}.`,"success");await refresh();}catch(e){notify(e.message,"error");}}

  // PRIVATE DOCUMENT LIBRARY — signed upload and 60-second signed download.
  async function renderDocuments(){const [docsR,projectsR]=await Promise.all([safe(api("files","documents.list")),safe(api("projects","list_projects"))]);const docs=docsR.ok?records(docsR.data):[],projects=projectsR.ok?records(projectsR.data,"projects"):[];state.cache.documents={docs,projects};let html=pageHead("documents",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh</button><button class="btn btn-primary" data-act="upload-document">${icon("plus")} Upload document</button>`);html+=`<div class="info-banner">◈ <span><strong>Private storage.</strong> Documents are stored in the private <code>${BUCKET}</code> bucket. Downloads use a short-lived, permission-checked link. Current upload limit: 25 MB.</span></div>`;html+=`<div class="grid metric-grid">${stat("Active documents",docs.length,"Visible to your permissions","▤")}${stat("Client shared",docs.filter(x=>x.client_visible).length,"Explicitly marked client-visible","↗")}${stat("Projects",projects.length,"Available upload destinations","▦")}${stat("Storage policy","Private","Bucket is not public","◈")}</div>`;const rows=docs.map(x=>`<tr><td>${textCell(x.file_name,x.content_type)}</td><td>${esc(projects.find(p=>p.id===x.project_id)?.name||shortId(x.project_id))}</td><td>${esc(`${fmtNum((x.file_size_bytes||0)/1024)} KB`)}</td><td>${pill(x.client_visible?"client visible":"internal only")}</td><td>${fmtDate(x.created_at)}</td><td><div class="table-actions">${actionButton("Download","download-document",x.id)}${actionButton(x.client_visible?"Hide":"Share","toggle-document-visibility",x.id)}${actionButton("Archive","archive-document",x.id,"btn-danger")}</div></td></tr>`);html+=panel("Document library","Registered document metadata is loaded from the existing Edge Function.",`${toolbarSearch("Search file name or project…")}${table(["Document","Project","Size","Visibility","Added",""],rows,{emptyTitle:"No active documents",emptyCopy:"Upload a document to an accessible project. The file will be stored privately."})}`);$("pageContent").innerHTML=html;bindFilters();}
  function uploadDocument(){const p=state.cache.documents?.projects||[];if(!p.length)return notify("No accessible projects are available for upload.","error");openForm({title:"Upload a private document",description:"Allowed: PDF, Word, Excel, PowerPoint, CSV and plain text. Maximum 25 MB. The application obtains a one-time signed upload token, uploads to private storage, then registers the metadata.",fields:[{name:"project_id",label:"Project",type:"select",required:true,options:p.map(x=>[x.id,x.name])},{name:"file",label:"Choose file",type:"file",required:true,span:2},{name:"client_visible",label:"Make visible to linked client contacts",type:"checkbox",value:false}],onSubmit:async v=>{const file=v.file;if(!file)throw new Error("Choose a file to upload.");if(file.size>25*1024*1024)throw new Error("Files must be no larger than 25 MB.");const allowed=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain","text/csv"];const type=file.type||({pdf:"application/pdf",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",txt:"text/plain",csv:"text/csv"}[file.name.split(".").pop().toLowerCase()]||"");if(!allowed.includes(type))throw new Error("This file type is not accepted by the private documents service.");const prepared=unwrap(await api("files","upload.prepare",{project_id:v.project_id,file_name:file.name,content_type:type,file_size_bytes:file.size}));if(!prepared?.token||!prepared?.path)throw new Error("The document service did not return a valid signed upload request.");const {error:uploadError}=await state.sb.storage.from(prepared.bucket||BUCKET).uploadToSignedUrl(prepared.path,prepared.token,file,{contentType:type,upsert:false});if(uploadError)throw uploadError;await api("files","upload.complete",{project_id:v.project_id,document_id:prepared.document_id,file_name:file.name,content_type:type,file_size_bytes:file.size,client_visible:!!v.client_visible});notify("Private document uploaded and registered.","success");await closeModal();await refresh();}});}
  async function downloadDocument(id){try{const out=unwrap(await api("files","documents.download",{document_id:id}));if(!out.signed_url)throw new Error("The document service did not return a signed download URL.");window.location.assign(out.signed_url);notify("A short-lived download link was issued.","success");}catch(e){notify(e.message,"error");}}
  async function toggleDocumentVisibility(id){const x=(state.cache.documents?.docs||[]).find(d=>d.id===id);if(!x)return;const next=!x.client_visible;if(!confirm(`${next?"Share":"Hide"} this document from linked client portal contacts?`))return;try{await api("files","documents.visibility.update",{document_id:id,client_visible:next});notify(`Document is now ${next?"client visible":"internal only"}.`,"success");await refresh();}catch(e){notify(e.message,"error");}}

  async function archiveDocument(id){if(!confirm("Archive this document? It will be removed from active listings and client visibility, while its metadata remains in the audit history."))return;try{await api("files","documents.archive",{document_id:id});notify("Document archived.","success");await refresh();}catch(e){notify(e.message,"error");}}

  // COMMUNICATIONS — company channels and secure internal direct conversations.
  async function renderCommunications(){
    const [channelR,directR]=await Promise.all([safe(api("communications","channels.list")),safe(api("communications","direct.list"))]);
    const channels=channelR.ok?records(channelR.data):[],directs=directR.ok?records(directR.data):[];
    state.cache.channels=channels;state.directConversations=directs;
    if(!state.currentChannel||!channels.some(c=>c.id===state.currentChannel))state.currentChannel=channels[0]?.id||null;
    if(!state.currentDirect||!directs.some(c=>c.id===state.currentDirect))state.currentDirect=directs[0]?.id||null;
    const directMode=state.communicationsTab==="direct";
    const channel=channels.find(c=>c.id===state.currentChannel);
    const direct=directs.find(c=>c.id===state.currentDirect);
    const people=state.cache.people?.members||[];
    const otherUser=direct?(direct.participant_low===state.user?.id?direct.participant_high:direct.participant_low):null;
    const otherMember=people.find(m=>m.user_id===otherUser);
    const directTitle=otherMember?.display_name||otherMember?.full_name||otherMember?.email||shortId(otherUser);
    let html=pageHead("communications",`<button class="btn btn-secondary" data-act="direct-new">＋ New direct message</button><button class="btn btn-primary" data-act="create-channel">${icon("plus")} New channel</button>`);
    html+=`<div class="info-banner">◈ <span>Company, team and project channels are permission-scoped. Internal direct conversations are private to their participants. Membership and message access are rechecked by the communications Edge Function.</span></div>`;
    html+=`<section class="chat-shell"><aside class="chat-sidebar"><div class="chat-sidebar-head"><div><b>Messages</b><small>Nexus collaboration</small></div><button class="icon-button" data-act="direct-new" title="New direct message">＋</button></div><div class="tab-row compact-tabs"><button class="tab-button ${!directMode?"active":""}" data-comm-tab="channels">Channels</button><button class="tab-button ${directMode?"active":""}" data-comm-tab="direct">Direct</button></div>${!directMode?(channels.length?channels.map(c=>`<button class="chat-thread ${c.id===state.currentChannel?"active":""}" data-channel="${esc(c.id)}"><b># ${esc(c.name)}</b><small>${esc(c.channel_scope||"company")} · ${c.is_private?"Private":"Open"}</small></button>`).join(""):empty("No channels yet","Create a company or project channel to start team communication.")):(directs.length?directs.map(c=>{const other=c.participant_low===state.user?.id?c.participant_high:c.participant_low;const m=people.find(x=>x.user_id===other);return `<button class="chat-thread ${c.id===state.currentDirect?"active":""}" data-direct="${esc(c.id)}"><b>${esc(m?.display_name||m?.full_name||m?.email||shortId(other))}</b><small>Private conversation · ${fmtTime(c.last_message_at||c.updated_at||c.created_at)}</small></button>`;}).join(""):empty("No direct conversations","Start a private conversation with an active Nexus member."))}</aside><div class="chat-main"><div class="chat-head"><div><b>${directMode?(direct?esc(directTitle):"Select a conversation"):(channel?`# ${esc(channel.name)}`:"Select a channel")}</b><div class="muted" style="font-size:9px">${directMode?"Private one-to-one conversation":(channel?esc(channel.description||`${channel.channel_scope} channel`):"Company communications")}</div></div><span>${directMode?(direct?pill("private"):""):(channel?`${pill(channel.is_private?"private":"open")} <button class="btn btn-small btn-secondary" data-act="edit-channel" data-id="${esc(channel.id)}">Manage</button> <button class="btn btn-small btn-secondary" data-act="manage-channel-members" data-id="${esc(channel.id)}">Members</button>`:"")}</span></div><div class="chat-body" id="communicationMessages">${directMode?(direct?loadingMarkup():empty("Choose a conversation","Select a direct conversation or start a new one.")):(channel?loadingMarkup():empty("Choose a channel","Select a channel on the left to load its messages."))}</div><div class="chat-input-row"><textarea id="communicationMessageInput" placeholder="${directMode?"Write a private message…":"Write a channel message…"}" rows="1" ${(directMode?direct:channel)?"":"disabled"}></textarea><button class="btn btn-primary" id="sendCommunicationMessage" ${(directMode?direct:channel)?"":"disabled"}>Send ↗</button></div></div></section>`;
    if(!channelR.ok)html+=`<div class="notice error">Channels: ${esc(channelR.error.message)}</div>`;
    if(!directR.ok)html+=`<div class="notice error">Direct messages: ${esc(directR.error.message)}</div>`;
    $("pageContent").innerHTML=html;
    document.querySelectorAll("[data-comm-tab]").forEach(b=>b.onclick=()=>{state.communicationsTab=b.dataset.commTab;renderCommunications();});
    document.querySelectorAll("[data-channel]").forEach(b=>b.onclick=()=>{state.currentChannel=b.dataset.channel;state.communicationsTab="channels";renderCommunications();});
    document.querySelectorAll("[data-direct]").forEach(b=>b.onclick=()=>{state.currentDirect=b.dataset.direct;state.communicationsTab="direct";renderCommunications();});
    if(directMode&&direct)loadDirectMessages(direct.id);else if(!directMode&&channel)loadChannelMessages(channel.id);
    const input=$("communicationMessageInput"),send=$("sendCommunicationMessage");
    if(send)send.onclick=directMode?sendDirectMessage:sendChannelMessage;
    input?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();(directMode?sendDirectMessage:sendChannelMessage)();}});
  }
  async function loadChannelMessages(id){const host=$("communicationMessages");if(!host)return;host.innerHTML=loadingMarkup();try{const d=await api("communications","messages.list",{channel_id:id,limit:100});const msgs=records(d);host.innerHTML=msgs.length?msgs.slice().reverse().map(m=>`<div class="chat-bubble ${m.sender_user_id===state.user?.id?"user":"assistant"}"><div style="font-size:9px;color:#84b6ca;margin-bottom:4px">${esc(m.sender_name||shortId(m.sender_user_id))} · ${fmtTime(m.created_at)}</div>${esc(m.body)}${has("communication.messages.moderate")?actionButton("Hide message","moderate-message",m.id,"btn-danger"):""}</div>`).join(""):empty("No messages yet","Send the first message to this channel.");host.scrollTop=host.scrollHeight;}catch(e){host.innerHTML=`<div class="notice error">${esc(e.message)}</div>`;}}
  async function sendChannelMessage(){const input=$("communicationMessageInput"),message=input?.value.trim();if(!message||!state.currentChannel)return;const btn=$("sendCommunicationMessage");btn.disabled=true;try{await api("communications","messages.send",{channel_id:state.currentChannel,message});input.value="";await loadChannelMessages(state.currentChannel);}catch(e){notify(e.message,"error");}finally{btn.disabled=false;input?.focus();}}
  async function loadDirectMessages(id){const host=$("communicationMessages");if(!host)return;host.innerHTML=loadingMarkup();try{const d=await api("communications","direct.messages.list",{conversation_id:id,limit:100});const msgs=records(d);host.innerHTML=msgs.length?msgs.slice().reverse().map(m=>`<div class="chat-bubble ${m.sender_user_id===state.user?.id?"user":"assistant"}"><div style="font-size:9px;color:#84b6ca;margin-bottom:4px">${m.sender_user_id===state.user?.id?"You":"Nexus member"} · ${fmtTime(m.created_at)}</div>${esc(m.body)}</div>`).join(""):empty("No messages yet","Say hello to start this private conversation.");host.scrollTop=host.scrollHeight;}catch(e){host.innerHTML=`<div class="notice error">${esc(e.message)}</div>`;}}
  async function sendDirectMessage(){const input=$("communicationMessageInput"),message=input?.value.trim();if(!message||!state.currentDirect)return;const btn=$("sendCommunicationMessage");btn.disabled=true;try{await api("communications","direct.messages.send",{conversation_id:state.currentDirect,message});input.value="";await loadDirectMessages(state.currentDirect);}catch(e){notify(e.message,"error");}finally{btn.disabled=false;input?.focus();}}
  async function startDirectMessage(){const people=state.cache.people||await loadPeople();state.cache.people=people;const members=(people.members||[]).filter(m=>m.user_id!==state.user?.id&&m.status==="active");if(!members.length)return notify("No other active Nexus members are available.","error");openForm({title:"Start a private conversation",description:"Only the selected Nexus member can participate in this internal direct conversation.",fields:[{name:"other_user_id",label:"Nexus member",type:"select",required:true,options:members.map(m=>[m.user_id,m.display_name||m.full_name||m.email||shortId(m.user_id)])}],submitLabel:"Start conversation",onSubmit:async v=>{const d=unwrap(await api("communications","direct.start",v));if(!d.conversation_id)throw new Error("The communications service did not return a conversation ID.");state.currentDirect=d.conversation_id;state.communicationsTab="direct";notify("Private conversation opened.","success");await closeModal();await renderCommunications();}});}
  async function openDirectConversation(id){state.currentDirect=id;state.communicationsTab="direct";await renderCommunications();}
  function createChannel(){const people=state.cache.people||{};const projects=state.cache.projects||[];const teams=people.teams||[];openForm({title:"Create a communication channel",description:"Choose one scope and provide only the matching target. Company channels cannot have a team or project ID.",fields:[{name:"channel_scope",label:"Channel scope",type:"select",required:true,value:"company",options:[["company","Company"],["team","Team"],["project","Project"]]},{name:"name",label:"Channel name",required:true,max:100},{name:"slug",label:"Channel slug",required:true,max:100},{name:"description",label:"Purpose",type:"textarea",max:500,span:2},{name:"team_id",label:"Team (team scope only)",type:"select",options:[["","Choose a team"],...teams.map(t=>[t.id,t.name])]},{name:"project_id",label:"Project (project scope only)",type:"select",options:[["","Choose a project"],...projects.map(p=>[p.id,p.name])]},{name:"is_private",label:"Private channel",type:"checkbox",value:false}],onSubmit:async v=>{if(v.channel_scope==="company"){v.team_id=null;v.project_id=null;}else if(v.channel_scope==="team"){v.project_id=null;if(!v.team_id)throw new Error("Select a team for a team-scoped channel.");}else{v.team_id=null;if(!v.project_id)throw new Error("Select a project for a project-scoped channel.");}await api("communications","channels.create",v);notify("Channel created.","success");await closeModal();await refresh();}});const name=$("field-name"),slug=$("field-slug");name?.addEventListener("input",()=>{if(!slug.dataset.touched)slug.value=slugify(name.value)});slug?.addEventListener("input",()=>slug.dataset.touched="1");}

  function editChannel(id){const c=(state.cache.channels||[]).find(x=>x.id===id);if(!c)return notify("Refresh channels and try again.","error");openForm({title:"Manage channel",fields:[{name:"name",label:"Channel name",required:true,value:c.name,max:100},{name:"description",label:"Purpose",type:"textarea",value:c.description||"",max:500,span:2},{name:"is_private",label:"Privacy",type:"select",value:String(!!c.is_private),options:[["false","Open to eligible members"],["true","Private members only"]]}],onSubmit:async v=>{v.is_private=v.is_private==="true";await api("communications","channels.update",{channel_id:id,...v});notify("Channel updated.","success");await closeModal();await refresh();}});}
  async function manageChannelMembers(id){const people=state.cache.people||await loadPeople();state.cache.people=people;const membersR=await api("communications","channels.members.list",{channel_id:id});const current=records(membersR);const existing=new Set(current.map(x=>x.user_id));const eligible=(people.members||[]).filter(x=>x.status==="active");openForm({title:"Channel membership",description:`${current.length} current member records. Add or remove one Nexus member. Private channel access is checked by the backend.`,fields:[{name:"user_id",label:"Nexus member",type:"select",required:true,options:eligible.map(m=>[m.user_id,`${m.display_name||m.full_name||m.email||shortId(m.user_id)}${existing.has(m.user_id)?" · currently added":""}`])},{name:"operation",label:"Membership action",type:"select",required:true,options:[["add","Add member"],["remove","Remove member"]]},{name:"member_role",label:"Channel role (when adding)",type:"select",value:"member",options:[["member","Member"],["moderator","Moderator"]]}],onSubmit:async v=>{await api("communications","channels.members.set",{channel_id:id,user_id:v.user_id,add:v.operation==="add",member_role:v.member_role});notify(v.operation==="add"?"Member added to channel.":"Member removed from channel.","success");await closeModal();await refresh();}});}
  async function moderateMessage(id){if(!has("communication.messages.moderate"))return notify("Your role does not have message moderation permission.","error");if(!confirm("Hide this message from the channel? The action is recorded by the communications service."))return;try{await api("communications","messages.moderate",{message_id:id,hide:true,reason:"Hidden by an authorised Nexus moderator."});notify("Message hidden.","success");await loadChannelMessages(state.currentChannel);}catch(e){notify(e.message,"error");}}

  // CONTENT AND ANNOUNCEMENTS
  async function renderAnnouncements(){const r=await safe(api("content","announcements.list"));const items=r.ok?records(r.data,"announcements"):[];state.cache.announcements=items;let html=pageHead("announcements",`<button class="btn btn-primary" data-act="create-announcement">${icon("plus")} New announcement</button>`);if(!r.ok)html+=`<div class="notice error">${esc(r.error.message)}</div>`;html+=`<div class="grid metric-grid">${stat("Announcements",items.length,"Company update records","◉")}${stat("Published",items.filter(x=>x.status==="published").length,"Visible to Nexus members","✓")}${stat("Drafts",items.filter(x=>x.status==="draft").length,"Awaiting publication","◷")}${stat("Archived",items.filter(x=>x.status==="archived").length,"Retained for history","▤")}</div>`;html+=panel("Company announcements","Create and publish company updates.",table(["Announcement","Status","Published","Created",""],items.map(x=>`<tr><td>${textCell(x.title,x.body)}</td><td>${pill(x.status)}</td><td>${fmtDate(x.published_at)}</td><td>${fmtDate(x.created_at)}</td><td>${x.status==="draft"?`${actionButton("Publish","publish-announcement",x.id)} ${actionButton("Edit","edit-announcement",x.id)} ${actionButton("Archive","archive-announcement",x.id,"btn-danger")}`:actionButton("Archive","archive-announcement",x.id,"btn-danger")}</td></tr>`)));$("pageContent").innerHTML=html;}
  function createAnnouncement(){openForm({title:"Create an announcement",description:"Announcements are saved as draft until you publish them.",fields:[{name:"title",label:"Title",required:true,max:180},{name:"body",label:"Announcement",type:"textarea",required:true,max:20000,span:2}],onSubmit:async v=>{await api("content","announcements.create",v);notify("Announcement saved as draft.","success");await closeModal();await refresh();}});}
  function editAnnouncement(id){const x=(state.cache.announcements||[]).find(a=>a.id===id)||{};openForm({title:"Edit announcement",fields:[{name:"title",label:"Title",value:x.title,required:true,max:180},{name:"body",label:"Announcement",type:"textarea",value:x.body,required:true,max:20000,span:2}],onSubmit:async v=>{await api("content","announcements.update",{announcement_id:id,...v});notify("Announcement updated.","success");await closeModal();await refresh();}});}
  async function publishAnnouncement(id){if(!confirm("Publish this company announcement?"))return;try{await api("content","announcements.publish",{announcement_id:id});notify("Announcement published.","success");await refresh();}catch(e){notify(e.message,"error");}}

  async function archiveAnnouncement(id){if(!confirm("Archive this announcement? The record will remain in Nexus history."))return;try{await api("content","announcements.archive",{announcement_id:id});notify("Announcement archived.","success");await refresh();}catch(e){notify(e.message,"error");}}

  // PERSONAL INBOX AND DELIVERY PREFERENCES
  async function renderNotifications(){
    const [r,p,d]=await Promise.all([safe(api("notifications","inbox.list",{limit:100})),safe(api("notifications","preferences.get")),safe(api("notifications","delivery.settings.get"))]);
    const items=r.ok?records(r.data):[],prefs=p.ok?unwrap(p.data)||{}:{},delivery=d.ok?unwrap(d.data)||{}:null;
    state.cache.notifications=items;state.cache.notificationsDelivery=delivery;state.notifPrefs=prefs;const unread=items.filter(x=>!x.read_at);
    let html=pageHead("notifications",`<button class="btn btn-secondary" data-act="mark-all-read">Mark all read</button><button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh</button>`);
    html+=`<div class="grid metric-grid">${stat("All notifications",items.length,"Personal Nexus inbox","♢")}${stat("Unread",unread.length,"Awaiting your attention","◷")}${stat("In-app",prefs.in_app_enabled===false?"Off":"On","Personal preference","◉")}${stat("Email digest",prefs.digest_frequency||"immediate","Delivery cadence preference","✉")}</div>`;
    html+=`<div class="content-grid"><div>${panel("Your notifications","Unread items are highlighted until marked as read.",items.length?`<div class="activity-list">${items.map(n=>`<div class="activity-row"><span class="activity-dot" style="opacity:${n.read_at?.25:1}"></span><div class="activity-body"><b>${esc(n.title)}</b><p>${esc(n.body||n.notification_type)}</p><p>${fmtTime(n.created_at)} ${n.destination_path?`· <a href="${esc(n.destination_path)}" data-internal-path="${esc(n.destination_path)}">Open</a>`:""}</p></div>${n.read_at?pill("read"):actionButton("Mark read","mark-read",n.id)}</div>`).join("")}</div>`:empty("You're all caught up","New company and project notifications will appear here."))}</div><div>${panel("Personal preferences","Choose how Nexus should notify your account.",`<div class="settings-block"><h3>In-app notifications</h3><p>Show updates in your Nexus inbox.</p><label><input class="toggle" type="checkbox" id="prefInApp" ${prefs.in_app_enabled!==false?"checked":""}></label></div><div class="settings-block"><h3>Email notifications</h3><p>Allow email delivery when configured for Nexus.</p><label><input class="toggle" type="checkbox" id="prefEmail" ${prefs.email_enabled!==false?"checked":""}></label></div><div class="settings-block"><h3>Digest frequency</h3><p>Choose when email summaries should be sent.</p><select class="control" id="prefDigest"><option value="immediate">Immediate</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="never">Never</option></select></div><button class="btn btn-primary" id="saveNotificationPrefs">Save preferences</button>`)}</div></div>`;
    if(delivery){html+=panel("Organisation email delivery","Provider settings are permission-controlled. Changing sender configuration requires a new trusted server-side provider test before delivery can be enabled.",`<div class="property-grid">${property("Provider",delivery.provider||"none")}${property("Sender",delivery.sender_name||"Not configured")}${property("Sender address",delivery.sender_email||"Not configured")}${property("Delivery",delivery.is_enabled?"Enabled":"Disabled")}${property("Last test",delivery.last_test_status||"Not tested")}${property("Last tested",fmtTime(delivery.last_tested_at))}</div><div class="toolbar"><button class="btn btn-secondary" data-act="edit-delivery-settings">Edit delivery settings</button><span class="muted">Provider test execution stays server-side.</span></div>`);}else if(!d.ok&&d.error.status!==403){html+=`<div class="notice">Organisation email settings are not available: ${esc(d.error.message)}</div>`;}
    $("pageContent").innerHTML=html;$("prefDigest").value=prefs.digest_frequency||"immediate";$("saveNotificationPrefs").onclick=saveNotificationPrefs;
  }
  function editDeliverySettings(){const r=state.cache.notificationsDelivery||{};openForm({title:"Organisation email delivery",description:"Save provider and sender details. Delivery cannot be enabled until a trusted server-side email test succeeds after the latest configuration change.",fields:[{name:"provider",label:"Email provider",type:"select",value:r.provider||"none",options:["none","resend","postmark","sendgrid","smtp","supabase"].map(x=>[x,x])},{name:"sender_name",label:"Sender name",value:r.sender_name||"",max:100},{name:"sender_email",label:"Sender email",type:"email",value:r.sender_email||""},{name:"is_enabled",label:"Delivery state",type:"select",value:String(!!r.is_enabled),options:[["false","Disabled"],["true","Enabled — only after a passing server test"]]}],onSubmit:async v=>{v.is_enabled=v.is_enabled==="true";await api("notifications","delivery.settings.update",v);notify("Email delivery settings saved.","success");await closeModal();await refresh();}});}
  async function saveNotificationPrefs(){try{await api("notifications","preferences.update",{in_app_enabled:$("prefInApp").checked,email_enabled:$("prefEmail").checked,digest_frequency:$("prefDigest").value});notify("Notification preferences saved.","success");await updateInboxCount();}catch(e){notify(e.message,"error");}}
  async function markRead(id){try{await api("notifications","inbox.mark_read",{notification_id:id});await updateInboxCount();await refresh();}catch(e){notify(e.message,"error");}}
  async function markAllRead(){try{const d=unwrap(await api("notifications","inbox.mark_all_read"));notify(`${fmtNum(d.updated_count||0)} notifications marked as read.`,"success");await updateInboxCount();await refresh();}catch(e){notify(e.message,"error");}}

  // DVNM INTELLIGENCE — persistent, company-only, read-only and server-quota controlled.
  async function renderIntelligence(){
    const [healthR,policyR,usageR,convR]=await Promise.all([
      safe(api("intelligence","health")),safe(api("intelligence","policy.status")),
      safe(api("intelligence","usage.summary")),safe(api("intelligence","conversations.list"))
    ]);
    const health=healthR.ok?unwrap(healthR.data)||{}:{},policy=policyR.ok?(unwrap(policyR.data)?.policy||{}):{},usage=usageR.ok?(unwrap(usageR.data)?.usage||{}):{};
    const conversations=convR.ok?records(convR.data,"conversations"):[];
    state.cache.intelligence={health,policy,usage,conversations};
    if(state.chatId&&!conversations.some(c=>c.id===state.chatId))state.chatId=null;
    if(!state.chatId)state.chatId=conversations.find(c=>c.status==="active")?.id||null;
    const selected=conversations.find(c=>c.id===state.chatId);state.chatMode=selected?.assistant_mode||state.chatMode||"general";
    const enabled=policyR.ok?policy.enabled===true:(usageR.ok?usage.enabled===true:false);policy.enabled=enabled;
    const canManage=state.permissionMap["intelligence.manage"]===true||policy.can_manage_settings===true,maxChars=Number(policy.max_message_chars||10000);
    const providerReady=health.gemini_configured===true&&health.ledger_configured===true;
    const mode=state.chatMode==="general"?"General Assistant":"Company Intelligence";
    const threads=conversations.map(c=>`<div class="ai-thread-wrap"><button class="ai-thread ${c.id===state.chatId?"active":""}" data-ai-conversation="${esc(c.id)}"><span class="ai-thread-glyph">✦</span><span><b>${esc(c.title||"New conversation")}</b><small>${c.assistant_mode==="company"?"Company Intelligence":"General Assistant"} · ${fmtDate(c.last_message_at||c.updated_at||c.created_at)}</small></span></button><button class="icon-button tiny ai-thread-menu" data-act="ai-manage-conversation" data-id="${esc(c.id)}" aria-label="Manage conversation" title="Rename, archive, restore or delete">···</button></div>`).join("");
    const prompts=state.chatMode==="general"?[["Explain a difficult topic in simple steps, with examples.","Explain something"],["Help me plan my priorities for today.","Plan my day"],["Improve the clarity and structure of this writing.","Improve my writing"],["Help me understand a programming problem.","Learn and code"]]:[["Give me an executive summary of current projects, tasks and delivery risks.","Executive delivery summary"],["Summarise our latest verified product metrics.","Product performance"],["What are our current open incidents and service concerns?","Operational health"],["Review company objectives and key results.","Objectives and key results"],["Summarise authorised finance balances and recent ledger activity.","Finance overview"]];
    const welcome=`<div class="ai-welcome-state"><div class="ai-welcome-mark">✦</div><h2>${state.chatMode==="general"?"What can I help you work through?":"Ask about Davonium."}</h2><p>${state.chatMode==="general"?"Learning, planning, writing, analysis and code. General mode does not access private company records.":"Answers use company records available to your signed-in role. The assistant is read-only."}</p><div class="ai-prompt-grid">${prompts.map(p=>`<button type="button" data-ai-prompt="${esc(p[0])}">${esc(p[1])}<span>↗</span></button>`).join("")}</div></div>`;
    const warning=!enabled?`<div class="ai-service-notice"><span class="ai-service-icon">!</span><div><b>DVNM service is not yet enabled</b><p>${providerReady?"Provider and ledger credentials are present. Owner approval of provider privacy and billing disclosures is still required.":"A provider or ledger credential is missing. Configure it in Supabase Edge Function secrets; never paste it into this page."}</p></div>${canManage?`<button class="btn btn-secondary btn-small" data-act="ai-policy-enable">Review and enable</button>`:""}</div>`:"";
    const modeSelect=`<select id="aiModeSelect" class="ai-mode-select" aria-label="DVNM Intelligence mode"><option value="general" ${state.chatMode==="general"?"selected":""}>General Assistant</option><option value="company" ${state.chatMode==="company"?"selected":""}>Company Intelligence</option></select>`;
    let html=`<section class="ai-os"><header class="ai-os-top"><div class="ai-os-brand"><button class="icon-button ai-history-toggle" data-act="ai-toggle-history" title="Recent conversations" aria-label="Open conversations">${icon("list-tree")}</button><button class="icon-button ai-return-home" data-page="overview" title="Back to Nexus" aria-label="Back to Nexus">‹</button><img class="ai-brand-logo" src="./assets/branding/davonium-d-icon.webp" alt="Davonium Technologies" width="36" height="36"><div><b>DVNM Intelligence</b><small>DAVONIUM NEXUS AI</small></div></div><div class="ai-os-top-actions">${modeSelect}<button class="btn btn-secondary" data-act="ai-new">＋ New chat</button>${canManage?`<button class="icon-button" data-act="ai-manage-limits" title="AI capacity controls">⚙</button>`:""}</div></header>
    <div class="ai-history-backdrop" id="aiHistoryBackdrop" data-act="ai-close-history"></div><div class="ai-os-body"><aside class="ai-history"><div class="ai-history-title"><span>RECENT CONVERSATIONS</span><button class="icon-button tiny" data-act="ai-new">＋</button></div><div class="ai-history-list">${threads||`<div class="ai-history-empty">Your private conversations will appear here.</div>`}</div><div class="ai-history-foot"><span class="ai-status-dot ${enabled?"ready":"waiting"}"></span><span>${enabled?"AI service available":"AI service awaiting setup"}</span></div></aside>
    <main class="ai-chat-stage"><header class="ai-chat-head"><div><div class="os-eyebrow">${state.chatMode==="general"?"GENERAL ASSISTANT":"COMPANY INTELLIGENCE"}</div><h1 id="aiConversationHeading">${esc(selected?.title||mode)}</h1><p>${state.chatMode==="general"?"Everyday intelligence · no company data access":"Role-authorised Nexus records · read-only"}</p></div><div class="ai-head-tools"><span class="ai-mode-pill">${mode}</span><span class="ai-status ${enabled?"on":"off"}"><i></i>${enabled?"Available":"Paused"}</span></div></header>${warning}
    <div class="ai-messages" id="aiMessages">${state.chatId?loadingMarkup():welcome}</div>
    <form id="aiComposer" class="ai-composer"><div class="ai-composer-top"><span class="ai-composer-context">${state.chatMode==="general"?"General assistant":"Secure company context"}</span><span id="aiCharCount">0 / ${fmtNum(maxChars)}</span></div><textarea id="aiMessageInput" rows="1" maxlength="${maxChars}" placeholder="${state.chatMode==="general"?"Message DVNM Intelligence…":"Ask about authorised company records…"}" ${enabled?"":"disabled"}></textarea><div class="ai-composer-bottom"><span>Enter to send · Shift + Enter for a new line</span><button class="btn btn-primary" id="aiSend" data-act="ai-send" type="submit" ${enabled?"":"disabled"}>Send <span>↗</span></button></div></form>
    <footer class="ai-usage-strip"><span>Requests today <b>${fmtNum(usage.requests_today??0)} / ${fmtNum(usage.requests_per_day_limit??policy.max_requests_per_day??"—")}</b></span><span>5-minute rate <b>${fmtNum(usage.requests_last_5m??0)} / ${fmtNum(usage.requests_per_5m_limit??policy.max_requests_per_5m??"—")}</b></span><span>Output tokens <b>${fmtNum(usage.tokens_today??0)} / ${fmtNum(usage.tokens_per_day_limit??policy.max_tokens_per_day??"—")}</b></span><span>Response cap <b>${fmtNum(policy.max_output_tokens||8192)}</b></span></footer></main></div></section>`;
    $("#pageContent").innerHTML=html;
    const input=$("aiMessageInput");
    input?.addEventListener("input",()=>{$("aiCharCount").textContent=input.value.length+" / "+maxChars;input.style.height="auto";input.style.height=Math.min(input.scrollHeight,170)+"px";});
    $("aiModeSelect")?.addEventListener("change",e=>changeAIMode(e.target.value));
    $("aiComposer")?.addEventListener("submit",sendAIMessage);
    document.querySelectorAll("[data-ai-conversation]").forEach(btn=>btn.onclick=()=>loadAIConversation(btn.dataset.aiConversation));
    document.querySelectorAll("[data-ai-prompt]").forEach(btn=>btn.onclick=()=>{if(input){input.value=btn.dataset.aiPrompt;input.focus();input.dispatchEvent(new Event("input"));}});
    if(state.chatId)await loadAIConversation(state.chatId);
  }

  function renderMarkdownSafe(value){
    let text=String(value??""),code=[];
    const fence=String.fromCharCode(96).repeat(3);
    const fenced=new RegExp(fence+"([a-zA-Z0-9_-]*)\\n?([\\s\\S]*?)"+fence,"g");
    text=text.replace(fenced,(_,lang,body)=>{const id=code.length;code.push(`<pre class="ai-code-block"><div class="ai-code-label">${esc(lang||"code")}</div><code>${esc(body.replace(/\n$/,""))}</code></pre>`);return "%%CODE"+id+"%%";});
    text=esc(text);
    const tick=String.fromCharCode(96),inline=new RegExp(tick+"([^"+tick+"]+)"+tick,"g");
    text=text.replace(inline,'<code class="ai-inline-code">$1</code>').replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>");
    text=text.replace(/https?:\/\/[^\s<]+/g,url=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    text=text.split(/\n{2,}/).map(block=>{const lines=block.split("\n");
      if(lines.every(line=>/^[-*]\s+/.test(line)))return "<ul>"+lines.map(line=>"<li>"+line.replace(/^[-*]\s+/,"")+"</li>").join("")+"</ul>";
      if(lines.every(line=>/^\d+\.\s+/.test(line)))return "<ol>"+lines.map(line=>"<li>"+line.replace(/^\d+\.\s+/,"")+"</li>").join("")+"</ol>";
      if(/^###\s/.test(block))return "<h4>"+block.replace(/^###\s/,"")+"</h4>";
      if(/^##\s/.test(block))return "<h3>"+block.replace(/^##\s/,"")+"</h3>";
      if(/^#\s/.test(block))return "<h2>"+block.replace(/^#\s/,"")+"</h2>";
      return "<p>"+lines.join("<br>")+"</p>";
    }).join("");
    return text.replace(/%%CODE(\d+)%%/g,(_,id)=>code[Number(id)]||"");
  }

  async function loadAIConversation(id){
    state.chatId=id;
    $(".ai-history")?.classList.remove("open");
    $("#aiHistoryBackdrop")?.classList.remove("visible");
    document.querySelectorAll("[data-ai-conversation]").forEach(button=>button.classList.toggle("active",button.dataset.aiConversation===id));const host=$("aiMessages");if(host)host.innerHTML=loadingMarkup();
    try{const d=unwrap(await api("intelligence","conversation.get",{conversation_id:id}));const c=d.conversation||{},messages=d.messages||[];state.chatId=id;state.chatMode=c.assistant_mode||"company";
      const generalMode=state.chatMode==="general";
      if($("aiModeSelect"))$("aiModeSelect").value=state.chatMode;
      const title=$("#aiConversationHeading"),description=$(".ai-chat-head p"),composer=$("aiMessageInput"),counter=$("aiCharCount");
      if(title)title.textContent=c.title||"New conversation";
      $(".ai-chat-head .os-eyebrow")?.replaceChildren(document.createTextNode(generalMode?"GENERAL ASSISTANT":"COMPANY INTELLIGENCE"));
      if(description)description.textContent=generalMode?"Ask anything: learn, write, plan, calculate or code. This conversation does not access private company records.":"Ask a question about the Nexus records available to your role.";
      if(composer){composer.placeholder=generalMode?"Message DVNM Intelligence…":"Ask about authorised Davonium company records…";composer.maxLength=Number(state.cache.intelligence?.policy?.max_message_chars||10000);}
      if(counter)counter.textContent=`0 / ${fmtNum(state.cache.intelligence?.policy?.max_message_chars||10000)} characters · ${generalMode?"General AI assistant":"Read-only company data"}`;
      if(host)host.innerHTML=messages.length?messages.map(m=>`<article class="ai-message ${m.role==="user"?"user":"assistant"}"><div class="ai-message-head"><b>${m.role==="user"?"You":"DVNM Intelligence"}</b><span>${fmtTime(m.created_at)}</span></div><div class="ai-message-content">${renderMarkdownSafe(m.content)}</div>${m.source_tools?.length?`<div class="ai-source-tags">Sources: ${m.source_tools.map(esc).join(" · ")}</div>`:""}</article>`).join(""):`<div class="chat-welcome"><div class="ai-orb">✦</div><h3>${esc(c.title||"New conversation")}</h3><p>${state.chatMode==="general"?"Ask DVNM Intelligence to explain, write, plan, calculate, code or help you learn. This conversation does not read private company records.":"Ask a question about authorised Davonium company data. Answers are grounded in Nexus records your role can access."}</p></div>`;
      if(host)host.scrollTop=host.scrollHeight;
      const heading=$("#aiConversationHeading");
      if(heading)heading.textContent=c.title||"New conversation";
      const modeEyebrow=$(".ai-chat-head .os-eyebrow");
      if(modeEyebrow)modeEyebrow.textContent=generalMode?"GENERAL ASSISTANT":"COMPANY INTELLIGENCE";
      $(".ai-history")?.classList.remove("open");
      $("#aiHistoryBackdrop")?.classList.remove("visible");
    }catch(e){if(host)host.innerHTML=`<div class="notice error">${esc(e.message)}</div>`;}
  }
  async function createAIConversation(mode=state.chatMode||"general"){try{state.chatMode=mode==="company"?"company":"general";const d=unwrap(await api("intelligence","conversation.create",{title:"New conversation",assistant_mode:state.chatMode}));const id=d.conversation?.id;if(!id)throw new Error("A conversation ID was not returned.");state.chatId=id;await renderIntelligence();}catch(e){notify(e.message,"error");}}
  async function changeAIMode(mode){if(!["general","company"].includes(mode)||mode===state.chatMode)return;await createAIConversation(mode);}
  function manageAILimits(){
    const p=state.cache.intelligence?.policy||{};
    if(!p.can_manage_settings)return notify("Only a permitted Nexus owner or administrator can change AI limits.","error");
    openForm({
      title:"DVNM Intelligence limits",
      description:"Set application-side limits for General Assistant and Company Intelligence. The provider may impose lower rate limits. The $1 monthly cost ceiling is an estimated safety guard, not a payment plan.",
      fields:[
        {name:"daily_request_limit",label:"Requests per day",type:"number",required:true,min:1,max:200,value:p.max_requests_per_day??100},
        {name:"requests_per_five_minutes",label:"Requests per five minutes",type:"number",required:true,min:1,max:30,value:p.max_requests_per_5m??10},
        {name:"max_input_characters",label:"Maximum input characters",type:"number",required:true,min:100,max:10000,value:p.max_message_chars??10000},
        {name:"max_history_messages",label:"Conversation history messages",type:"number",required:true,min:0,max:20,value:p.max_history_messages??16},
        {name:"max_input_tokens_per_request",label:"Input token budget per request",type:"number",required:true,min:100,max:30000,value:p.max_input_tokens??30000},
        {name:"max_output_tokens_per_request",label:"Output tokens per response",type:"number",required:true,min:100,max:8192,value:p.max_output_tokens??8192},
        {name:"daily_output_token_limit",label:"Daily output token allowance",type:"number",required:true,min:100,max:200000,value:p.max_tokens_per_day??200000},
        {name:"max_response_characters",label:"Maximum response characters",type:"number",required:true,min:500,max:40000,value:p.max_response_characters??40000},
        {name:"monthly_budget_usd",label:"Monthly estimated-cost ceiling (USD)",type:"number",required:true,min:0,max:1,value:p.monthly_budget_usd??1,help:"Hard capped at $1 while Nexus remains on the current no-payment configuration."}
      ],
      submitLabel:"Save AI limits",
      onSubmit:async v=>{
        const payload={};
        for(const key of Object.keys(v))payload[key]=Number(v[key]);
        await api("intelligence","policy.update",payload);
        notify("DVNM Intelligence limits updated securely.","success");
        await closeModal();
        await renderIntelligence();
      }
    });
  }
  function manageAIConversation(id){
    const c=(state.cache.intelligence?.conversations||[]).find(x=>x.id===id)||{};
    const isArchived=c.status==="archived";
    openForm({
      title:"Manage DVNM conversation",
      description:"Rename your chat, archive it, restore it or permanently delete its saved history.",
      fields:[
        {name:"title",label:"Conversation title",value:c.title||"New conversation",required:true,max:120},
        {name:"operation",label:"Action",type:"select",required:true,value:"rename",options:[
          ["rename","Rename conversation"],
          [isArchived?"unarchive":"archive",isArchived?"Restore to active chats":"Archive conversation"],
          ["delete","Delete permanently"]
        ]}
      ],
      submitLabel:"Apply changes",
      onSubmit:async v=>{
        if(v.operation==="delete"&&!confirm("Permanently delete this DVNM conversation and its saved history? This cannot be undone.")){
          throw new Error("Deletion cancelled. No changes were made.");
        }
        if(v.operation==="rename"){
          await api("intelligence","conversation.rename",{conversation_id:id,title:v.title});
        }else{
          await api("intelligence",`conversation.${v.operation}`,{conversation_id:id});
          if(state.chatId===id)state.chatId=v.operation==="unarchive"?id:null;
        }
        const labels={rename:"renamed",archive:"archived",unarchive:"restored",delete:"deleted"};
        notify("Conversation "+labels[v.operation]+".","success");
        await closeModal();
        await renderIntelligence();
      }
    });
  }


  async function sendAIMessage(event){event?.preventDefault();if(state.chatBusy)return;const input=$("aiMessageInput"),message=input?.value.trim();if(!message)return;const maxChars=Number(state.cache.intelligence?.policy?.max_message_chars||10000);if(message.length>maxChars){notify(`Keep each message within ${fmtNum(maxChars)} characters. The server applies the same limit.`,"error");return;}
    const send=$("aiSend"),host=$("aiMessages");state.chatBusy=true;if(send){send.disabled=true;send.textContent="Analysing…";}if(host){host.querySelector(".chat-welcome")?.remove();host.insertAdjacentHTML("beforeend",`<article class="ai-message user"><div class="ai-message-head"><b>You</b><span>Now</span></div><div class="ai-message-content">${renderMarkdownSafe(message)}</div></article><div class="ai-thinking" id="aiThinking"><i></i><i></i><i></i><span>${state.chatMode==="general"?"Preparing your response…":"Reviewing authorised Nexus records…"}</span></div>`);host.scrollTop=host.scrollHeight;}input.value="";
    try{if(!state.chatId){const made=unwrap(await api("intelligence","conversation.create",{title:message.slice(0,76),assistant_mode:state.chatMode||"general"}));state.chatId=made.conversation?.id;}if(!state.chatId)throw new Error("Could not create a private conversation.");
      const result=unwrap(await api("intelligence","chat",{conversation_id:state.chatId,message}));$("aiThinking")?.remove();if(host){const sources=result.data_sources_used||result.tools_used||[];host.insertAdjacentHTML("beforeend",`<article class="ai-message assistant"><div class="ai-message-head"><b>DVNM Intelligence</b><span>${fmtTime(result.generated_at||new Date().toISOString())}</span></div><div class="ai-message-content">${renderMarkdownSafe(result.answer||"No answer was returned.")}</div>${sources.length?`<div class="ai-source-tags">Nexus data sources · ${sources.map(esc).join(" · ")}</div>`:""}<div class="ai-source-tags">${fmtNum(result.usage?.input_tokens||0)} input tokens · ${fmtNum(result.usage?.output_tokens||0)} output tokens · ${result.usage?.estimated_cost_usd!=null?`$${fmtNum(result.usage.estimated_cost_usd)} estimated`:"cost not reported"}</div></article>`);host.scrollTop=host.scrollHeight;}
      await updateAIConversationTitleIfNeeded(state.chatId,message);notify("DVNM Intelligence completed your request.","success");
    }catch(e){$("aiThinking")?.remove();const detail=e.payload?.provider_code?(`Provider: ${esc(e.payload.provider_code)} · HTTP ${Number(e.payload.provider_status||e.status||0)}`):"";if(host)host.insertAdjacentHTML("beforeend",`<div class="notice error ai-error-card"><b>${esc(e.message)}</b>${detail?`<small>${detail}</small>`:""}<small>Your message is saved. Retry when the service is available; Nexus will not invent an answer.</small></div>`);notify(e.message,"error");}
    finally{state.chatBusy=false;if(send){send.disabled=!state.cache.intelligence?.policy?.enabled;send.innerHTML='Ask DVNM <span>↗</span>';}await refreshAIUsageQuietly();}
  }
  async function updateAIConversationTitleIfNeeded(id,message){try{const conv=(state.cache.intelligence?.conversations||[]).find(x=>x.id===id);if(conv&&conv.title==="New conversation"){const title=message.replace(/\s+/g," ").slice(0,76);await api("intelligence","conversation.rename",{conversation_id:id,title});conv.title=title;const heading=$("aiConversationHeading");if(heading&&state.chatId===id)heading.textContent=title;}}catch(_){} }
  async function refreshAIUsageQuietly(){const r=await safe(api("intelligence","usage.summary"));if(r.ok){const u=unwrap(r.data)?.usage;if(u&&state.cache.intelligence){state.cache.intelligence.usage=u;const daily=$("aiDailyRequestUsage"),burst=$("aiBurstUsage"),output=$("aiDailyOutputUsage");if(daily)daily.textContent=`${fmtNum(u.requests_today??0)} / ${fmtNum(u.requests_per_day_limit??"—")}`;if(burst)burst.textContent=`${fmtNum(u.requests_last_5m??0)} / ${fmtNum(u.requests_per_5m_limit??"—")}`;if(output)output.textContent=`${fmtNum(u.tokens_today??0)} / ${fmtNum(u.tokens_per_day_limit??"—")}`;}}}
  async function changeAIPolicy(enable){
    const policy=state.cache.intelligence?.policy||{};
    if(!enable){if(!confirm("Pause DVNM Intelligence for the entire Nexus organisation? Existing saved conversations will remain available."))return;try{await api("intelligence","policy.disable");notify("DVNM Intelligence has been paused by Nexus policy.","success");await renderIntelligence();}catch(e){notify(e.message,"error");}return;}
    const health=state.cache.intelligence?.health||{};
    if(!health.gemini_configured||!health.ledger_configured){
      notify("Before enabling, configure the Google AI provider secret and Nexus usage-ledger secret in Supabase Edge Function Secrets. Neither secret belongs in the browser.","error");
      return;
    }
    openForm({title:"Enable DVNM Intelligence",description:"Google AI Studio Free Tier may use prompts and company information submitted through the API to improve Google products. Review https://ai.google.dev/gemini-api/terms and https://ai.google.dev/gemini-api/docs/pricing before authorising data transfer. Provider quotas can be lower than Nexus limits. The $1 estimated monthly ceiling remains in place; no payment gateway is included.",fields:[{name:"confirm_provider_privacy",label:"I understand that Google AI Studio Free Tier may use prompts and company information I submit to improve Google products. I have reviewed the terms and explicitly authorise this data transfer for DVNM Intelligence.",type:"checkbox",required:true,value:false,span:2,help:"This setting authorises transfer of the information you submit to the Google Free Tier. Do not send records that Davonium is not authorised to disclose."},{name:"confirm_free_tier_no_billing",label:"I confirm this Google AI Studio project is on the Free Tier and has no billing account attached.",type:"checkbox",required:true,value:false,span:2}],submitLabel:"Confirm and enable",onSubmit:async v=>{await api("intelligence","policy.enable",v);notify("DVNM Intelligence enabled. Server-side limits remain in force.","success");await closeModal();await renderIntelligence();}});
  }

  // SERVICE HEALTH — user-readable telemetry only. Trusted monitor execution remains server-only.
  async function renderMonitoring(){
    const [s,i,r,c]=await Promise.all([safe(api("monitor","status")),safe(api("monitor","integrations.list")),safe(api("monitor","integration_runs.list")),safe(api("command","service_status"))]);
    const services=s.ok?records(s.data):[],integrations=i.ok?records(i.data):[],runs=r.ok?records(r.data):[],cc=unwrap(c.data)||{};
    const components=Array.isArray(cc)?cc:(cc.components||cc.service_components||[]),incidents=cc.open_incidents||cc.incidents||[];
    state.cache.monitoring={services,integrations,runs,components,incidents};
    const good=services.filter(x=>/healthy|operational|online|ok/i.test(x.status||x.health_status||"")).length;
    let html=pageHead("monitoring",`<button class="btn btn-secondary" data-act="create-incident">＋ Report incident</button><button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh status</button>`,"Read the latest service component status and product integration telemetry.");
    html+=`<div class="info-banner">◈ <span>This view reads existing monitoring and integration records. Trusted monitor checks and provider credential tests execute only on the server and are not exposed as browser buttons.</span></div>`;
    html+=`<div class="grid metric-grid">${stat("Service components",services.length,"Returned by nexus-monitor","◈")}${stat("Healthy / operational",good,"Based on latest recorded status","✓")}${stat("Product integrations",integrations.length,"Registered connections","⌁")}${stat("Recent sync runs",runs.length,"Latest 100 recorded runs","↗")}</div>`;
    html+=`<div class="content-grid"><div>${panel("Service components","Latest recorded component status from the monitoring service.",table(["Component","Status","Last checked","Latency","Detail"],services.map(x=>`<tr><td>${textCell(x.display_name||x.component_key||x.component_name,x.description)}</td><td>${pill(x.status||x.health_status)}</td><td>${fmtTime(x.last_checked_at||x.checked_at)}</td><td>${x.latency_ms!=null?`${fmtNum(x.latency_ms)} ms`:"—"}</td><td>${esc(x.safe_detail||x.last_error_code||"—")}</td></tr>`),{emptyTitle:"No service status rows",emptyCopy:"The monitor returned no components visible to this account."}))}${panel("Service incidents","Open incidents recorded by the company command centre.",table(["Incident","Status","Severity","Started",""],incidents.map(x=>`<tr><td>${textCell(x.title,x.description||x.impact)}</td><td>${pill(x.incident_status||x.status)}</td><td>${pill(x.severity||"not specified")}</td><td>${fmtTime(x.started_at||x.created_at)}</td><td>${actionButton("Update","edit-incident",x.id)}</td></tr>`),{emptyTitle:"No open incidents",emptyCopy:"No unresolved incidents were returned."}))}</div><div>${panel("Product integrations","Activation is controlled by a trusted test and backend policy.",table(["Integration","State","Test","Last tested"],integrations.map(x=>`<tr><td>${textCell(x.display_name,x.platform)}</td><td>${pill(x.state)}</td><td>${pill(x.last_test_status||"not tested")}</td><td>${fmtTime(x.last_tested_at)}</td></tr>`),{emptyTitle:"No integrations registered",emptyCopy:"Register a product integration in Products & metrics."}))}${panel("Latest ingestion runs","Only saved server-side run records are displayed.",table(["Run","Status","Accepted / received","Rejected","Finished"],runs.slice(0,15).map(x=>`<tr><td class="cell-mono">${shortId(x.id)}</td><td>${pill(x.run_status)}</td><td>${fmtNum(x.metrics_accepted)} / ${fmtNum(x.metrics_received)}</td><td>${fmtNum(x.metrics_rejected)}</td><td>${fmtTime(x.finished_at)}</td></tr>`),{emptyTitle:"No ingestion history",emptyCopy:"Approved integrations will create run history when server sync is configured."}))}</div></div>`;
    html+=panel("Service component controls","Command-centre component records. Updating a component requires the corresponding Nexus permission and an operator note.",table(["Component","Recorded state","Last updated",""],components.map(x=>`<tr><td>${textCell(x.display_name||x.component_key,x.description)}</td><td>${pill(x.component_status||"unknown")}</td><td>${fmtTime(x.updated_at||x.last_checked_at)}</td><td>${actionButton("Update","edit-component",x.component_key)}</td></tr>`),{emptyTitle:"No managed components",emptyCopy:"No service components have been configured in the command centre."}));
    const errors=[s,i,r,c].filter(x=>!x.ok);if(errors.length)html=`<div class="notice">Some telemetry sources are not available for this role. The backend continues to enforce access for each source.</div>`+html;
    $("pageContent").innerHTML=html;
  }

  function editComponent(key){const x=(state.cache.monitoring?.components||[]).find(c=>c.component_key===key)||{};openForm({title:"Update service component",description:"A non-unknown status requires a note describing the actual operator check. This does not start an external monitor check.",fields:[{name:"component_status",label:"Recorded status",type:"select",required:true,value:x.component_status||x.status||"unknown",options:["operational","degraded","outage","maintenance","unknown"].map(v=>[v,v])},{name:"display_name",label:"Display name",value:x.display_name||"",max:120},{name:"description",label:"Description",type:"textarea",value:x.description||"",max:500,span:2},{name:"check_note",label:"Actual operator check note (required unless unknown)",max:200}],onSubmit:async v=>{if(v.component_status==="unknown")delete v.check_note;await api("command","service_components.update",{component_key:key,...v});notify("Service component record updated.","success");await closeModal();await refresh();}});}
  function createIncident(){const components=state.cache.monitoring?.components||[];openForm({title:"Report a service incident",description:"Creates an incident record in the company command centre. The incident starts as investigating.",fields:[{name:"title",label:"Incident title",required:true,max:180},{name:"component_id",label:"Affected component",type:"select",options:[["","Not linked to one component"],...components.filter(x=>x.id).map(x=>[x.id,x.display_name||x.component_key])]},{name:"impact",label:"Impact and current observations",type:"textarea",max:3000,span:2}],onSubmit:async v=>{if(!v.component_id)v.component_id=null;await api("command","service_incidents.create",v);notify("Incident recorded.","success");await closeModal();await refresh();}});}
  function editIncident(id){const x=(state.cache.monitoring?.incidents||[]).find(i=>i.id===id)||{};const components=state.cache.monitoring?.components||[];openForm({title:"Update service incident",fields:[{name:"title",label:"Incident title",value:x.title,max:180},{name:"component_id",label:"Affected component",type:"select",value:x.component_id||"",options:[["","Not linked"],...components.filter(c=>c.id).map(c=>[c.id,c.display_name||c.component_key])]},{name:"impact",label:"Impact and updates",type:"textarea",value:x.impact||"",max:3000,span:2},{name:"incident_status",label:"Incident status",type:"select",value:x.incident_status||"investigating",options:["investigating","identified","monitoring","resolved"].map(v=>[v,v])}],onSubmit:async v=>{if(!v.component_id)v.component_id=null;await api("command","service_incidents.update",{incident_id:id,...v});notify("Incident updated.","success");await closeModal();await refresh();}});}

  // SECURITY, MFA ASSURANCE AND APPEND-ONLY AUDIT.
  async function renderSecurity(){const [a,l]=await Promise.all([safe(api("audit","session.assurance")),safe(api("audit","audit.list",{limit:100}))]);const assurance=unwrap(a.data)?.assurance||unwrap(a.data)||{},events=records(l.data,"events");state.cache.security={assurance,events};
    let html=pageHead("security",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh audit</button>`,"Review this session's authentication assurance and the audit events visible to your account.");
    html+=`<div class="info-banner">◈ <span><strong>Important:</strong> the MFA panel reports the current Supabase session assurance. It does not enforce MFA globally on every Edge Function or database operation.</span></div>`;
    html+=`<div class="grid metric-grid">${stat("Session assurance",assurance.current_level||"Unknown","Supabase Auth assurance level","◈")}${stat("MFA enrolled",assurance.mfa_enrolled?"Yes":"Not confirmed",assurance.mfa_verified_for_this_session?"Verified for this session":"Not verified for this session","✓")}${stat("MFA recommended",assurance.mfa_recommended_for_role?"Yes":"Standard","Based on your Nexus role","⌁")}${stat("Audit events returned",events.length,"Latest records visible to your account","▤")}</div>`;
    html+=`<div class="content-grid"><div>${panel("Authentication assurance","Methods and assurance returned by Supabase Auth for this session.",`<div class="property-grid">${property("Nexus organisation",assurance.organization||state.workspace.slug)}${property("Role",assurance.role||state.role)}${property("Current level",assurance.current_level||"Unknown")}${property("Next level",assurance.next_level||"Unknown")}${property("MFA enrolled",assurance.mfa_enrolled?"Yes":"No")}${property("MFA verified",assurance.mfa_verified_for_this_session?"Yes":"No")}</div><div class="settings-block"><h3>Authentication methods</h3><p>${esc((assurance.authentication_methods||[]).map(x=>x.factor_type||x.type||x.friendly_name||"Method").join(" · ")||"No method details returned")}</p></div>`)}${panel("Session protection","The service confirms what the current session has proved; this is not an organisation-wide enforcement switch.",`<div class="capability-list"><div><span>MFA enrolled</span>${pill(assurance.mfa_enrolled?"enabled":"not enrolled")}</div><div><span>Verified for this session</span>${pill(assurance.mfa_verified_for_this_session?"verified":"not verified")}</div><div><span>Global MFA enforcement by this function</span>${pill(assurance.global_mfa_enforcement_configured_by_this_function?"configured":"not configured")}</div></div><p class="muted" style="margin-top:12px">${esc(assurance.note||"Use the account security controls in Supabase Auth to enrol an additional factor.")}</p>`)}</div><div>${panel("Append-only audit history","Events are returned only when visible under current database permissions.",`${toolbarSearch("Filter by action, entity or actor…")}${table(["Event","Actor","Entity","Timestamp","Details"],events.map(x=>`<tr><td>${textCell(x.action,x.entity_type)}</td><td class="cell-mono">${shortId(x.actor_user_id)}</td><td>${esc(x.entity_type||"—")}<span class="cell-sub">${esc(shortId(x.entity_id))}</span></td><td>${fmtTime(x.created_at)}</td><td>${esc(JSON.stringify(x.details||{}).slice(0,160))}</td></tr>`),{emptyTitle:"No audit events returned",emptyCopy:"No events are visible for the current query and role."})}`)}</div></div>`;
    if(!a.ok||!l.ok)html+=`<div class="notice">${!a.ok?`Session assurance: ${esc(a.error.message)}. `:""}${!l.ok?`Audit log: ${esc(l.error.message)}.`:""}</div>`;
    $("pageContent").innerHTML=html;bindFilters();
  }

  // EFFECTIVE PERMISSION CATALOGUE AND USER-SPECIFIC ADMINISTRATIVE OVERRIDES.
  async function renderPermissions(){
    const [p,m]=await Promise.all([safe(edge("permissions",orgBody({}))),safe(api("admin","members.list"))]);
    const catalogue=p.ok?(unwrap(p.data)?.permissions||[]):[],members=m.ok?records(m.data):[];state.cache.permissions={catalogue,members};
    const grouped=catalogue.reduce((a,x)=>{(a[x.section||"General"]??=[]).push(x);return a;},{});
    let html=pageHead("permissions",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh access</button>`,"Understand the effective permissions returned for your signed-in account and authorised user overrides.");
    html+=`<div class="info-banner">◈ <span>The permissions service calculates your effective access from role defaults and user overrides. Every action is independently re-authorised by the Edge Function and database; hiding a button is never treated as security.</span></div>`;
    html+=`<div class="grid metric-grid">${stat("Permission definitions",catalogue.length,"Live catalogue","◈")}${stat("Allowed for you",catalogue.filter(x=>x.allowed).length,"Effective access","✓")}${stat("Not allowed",catalogue.filter(x=>!x.allowed).length,"Not granted to your account","—")}${stat("Nexus members",members.length,"Members returned by admin service","♙")}</div>`;
    html+=`<div class="content-grid"><div>${Object.entries(grouped).map(([section,items])=>panel(section,`${items.filter(x=>x.allowed).length} of ${items.length} capabilities available to your account.`,`<div class="permission-list">${items.map(x=>`<div class="permission-row"><div><b>${esc(x.label||x.key)}</b><small>${esc(x.key)} · ${esc(x.description||"")}</small></div>${pill(x.allowed?"allowed":"denied")}</div>`).join("")}</div>`)).join("")||panel("Permission catalogue","No permissions returned.",empty("No permission records","The permissions endpoint returned an empty catalogue."))}</div><div>${panel("Member overrides","Set or clear an individual user's allow/deny override. Role defaults remain the baseline.",m.ok?table(["Member","Role","Status","Manage"],members.map(x=>`<tr><td class="cell-mono">${esc(shortId(x.user_id))}</td><td>${esc(x.role)}</td><td>${pill(x.status)}</td><td>${actionButton("Override","member-permission",x.user_id)} ${actionButton("Clear","clear-member-permission",x.user_id)}</td></tr>`),{emptyTitle:"No members returned",emptyCopy:"The membership administration endpoint returned no rows for this role."}):`<div class="notice error">${esc(m.error.message)}</div>`)}</div></div>`;
    if(!p.ok)html=`<div class="notice error">Permission catalogue unavailable: ${esc(p.error.message)}</div>`+html;
    $("pageContent").innerHTML=html;
  }
  function memberPermission(id){const list=state.cache.permissions?.catalogue||[];openForm({title:"Set a member permission override",description:`Override one permission for member ${shortId(id)}. Deny takes precedence through the database function; use Clear to restore the role default.`,fields:[{name:"permission_key",label:"Permission",type:"select",required:true,options:list.map(x=>[x.key,`${x.section||"General"} · ${x.label||x.key}`])},{name:"is_allowed",label:"Override decision",type:"select",required:true,options:[["true","Allow"],["false","Deny"]]}],submitLabel:"Save override",onSubmit:async v=>{await api("admin","members.permission.set",{user_id:id,permission_key:v.permission_key,is_allowed:v.is_allowed==="true"});notify("Member permission override saved.","success");await closeModal();await refresh();}});}
  async function clearMemberPermission(id){const list=state.cache.permissions?.catalogue||[];openForm({title:"Clear a member permission override",description:"This removes the explicit override and returns the permission to the member's role default.",fields:[{name:"permission_key",label:"Permission",type:"select",required:true,options:list.map(x=>[x.key,`${x.section||"General"} · ${x.label||x.key}`])}],submitLabel:"Clear override",onSubmit:async v=>{await api("admin","members.permission.clear",{user_id:id,permission_key:v.permission_key});notify("Permission override cleared.","success");await closeModal();await refresh();}});}

  // CLIENT AND INVESTOR SELF-SERVICE PORTAL — role-scoped queries only.
  async function renderPortal(){
    const investor=state.role==="investor";
    const calls=investor?[safe(api("portal","investor.updates.list"))]:[safe(api("portal","client.projects.list")),safe(api("portal","client.documents.list"))];
    const result=await Promise.all(calls);
    let html=pageHead("portal",`<button class="btn btn-secondary" data-act="refresh">${icon("refresh")} Refresh portal</button>`,investor?"Investor room information that has been published and approved for your account.":"Project progress and documents explicitly shared with your client account.");
    html+=`<div class="info-banner">◈ <span>Portal data is scoped by your active membership and assigned client account or investor access. The browser does not choose another account or bypass portal access controls.</span></div>`;
    if(investor){const investorPayload=result[0].ok?unwrap(result[0].data)||{}:{};const updates=result[0].ok?(investorPayload.published_updates||records(result[0].data,"investor_updates")):[];html+=`<div class="grid metric-grid">${stat("Published updates",updates.length,"Available to your investor account","▤")}${stat("Portal role","Investor","Access controlled by Nexus","◈")}</div>`;html+=panel("Investor room","Published company information available to your account.",updates.length?updates.map(x=>`<article class="portal-update"><div class="eyebrow">INVESTOR UPDATE · ${fmtDate(x.published_at)}</div><h3>${esc(x.title)}</h3>${x.summary?`<p class="portal-summary">${esc(x.summary)}</p>`:""}<div class="portal-body">${esc(x.body||"").replace(/\n/g,"<br>")}</div></article>`).join(""):empty("No published investor updates","The company has not made an investor update available to your account yet."));}
    else{const projectPayload=result[0].ok?unwrap(result[0].data)||{}:{},projects=projectPayload.projects||[],milestones=projectPayload.milestones||[],docs=result[1].ok?records(result[1].data,"shared_documents"):[];html+=`<div class="grid metric-grid">${stat("Assigned projects",projects.length,"Visible to your client account","▦")}${stat("Shared documents",docs.length,"Marked client-visible by the company","▤")}${stat("Portal role","Client","Access controlled by Nexus","◈")}</div>`;html+=panel("Project progress","Only projects linked to your client-account membership are shown.",table(["Project","Status","Progress","Start","Target"],projects.map(x=>`<tr><td>${textCell(x.name,x.description)}</td><td>${pill(x.status)}</td><td>${fmtNum(x.progress_percent)}%</td><td>${fmtDate(x.start_date)}</td><td>${fmtDate(x.target_date)}</td></tr>`),{emptyTitle:"No project assignments yet",emptyCopy:"Your company contact can link your account to an active project."}));html+=panel("Project milestones","Delivery milestones for projects assigned to your client account.",table(["Milestone","Project","Status","Due"],milestones.map(m=>`<tr><td>${textCell(m.title,m.description)}</td><td>${esc(projects.find(p=>p.id===m.project_id)?.name||shortId(m.project_id))}</td><td>${pill(m.status)}</td><td>${fmtDate(m.due_date)}</td></tr>`),{emptyTitle:"No milestones published",emptyCopy:"Milestones will appear when the company adds them to your projects."}));html+=panel("Documents shared with your account","The company controls client visibility for each private document. Downloads use the same permission-checked, short-lived link as the internal library.",table(["Document","Type","Size","Added",""],docs.map(x=>`<tr><td>${esc(x.file_name)}</td><td>${esc(x.content_type)}</td><td>${fmtNum((x.file_size_bytes||0)/1024)} KB</td><td>${fmtDate(x.created_at)}</td><td>${actionButton("Download","download-document",x.id)}</td></tr>`),{emptyTitle:"No shared documents",emptyCopy:"Documents appear here only after they are shared by the company."}));}
    const errors=result.filter(x=>!x.ok);if(errors.length)html=`<div class="notice error">${errors.map(x=>esc(x.error.message)).join(" · ")}</div>`+html;$("pageContent").innerHTML=html;
  }

  // CONNECTION AND PERSONAL NEXUS SETTINGS.
  function openSetup(focusAuth=false){
    const c=cfg();openForm({title:"Secure Supabase connection",description:"Connect this static frontend to your existing Davonium Nexus Supabase project. Use a publishable/anon key only. Service-role keys, Gemini keys and ledger secrets are rejected by design.",fields:[{name:"url",label:"Supabase project URL",value:c.url,required:true,type:"url",placeholder:"https://your-project.supabase.co"},{name:"key",label:"Supabase publishable / anon key",value:c.key,required:true,type:"password",max:600,span:2},{name:"remember",label:"Remember this connection in this browser",type:"checkbox",value:true,span:2}],submitLabel:"Save secure connection",onSubmit:async v=>{
      const url=v.url.trim().replace(/\/$/,"");if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url))throw new Error("Enter the HTTPS URL of your Supabase project.");if(v.key.length<20)throw new Error("The publishable/anon key appears too short.");
      const keyText=v.key;try{const parsed=JSON.parse(atob(keyText.split(".")[1]||""));if(parsed.role==="service_role")throw new Error("A service-role key cannot be used in the browser. Use the publishable/anon key.");}catch(e){if(e.message?.includes("service-role"))throw e;}
      if(v.remember){localStorage.setItem("nexus_url",url);localStorage.setItem("nexus_publishable_key",keyText);sessionStorage.removeItem("nexus_url");sessionStorage.removeItem("nexus_publishable_key");}else{localStorage.removeItem("nexus_url");localStorage.removeItem("nexus_publishable_key");sessionStorage.setItem("nexus_url",url);sessionStorage.setItem("nexus_publishable_key",keyText);}
      localStorage.removeItem("nexus_anon");await closeModal();state.sb=null;if(!(await waitForSupabaseLibrary()))throw new Error("The secure Supabase library is unavailable. Check your internet connection, then retry.");const ok=connectedClient();if(!ok)throw new Error("Could not initialise Supabase. Check the project URL and publishable key.");const {data,error}=await state.sb.auth.getSession();if(error)throw error;if(data.session){state.session=data.session;state.user=data.session.user;state.booting=false;await boot();}else{showAuth("Connection saved. Sign in with your existing authorised Nexus account.");notify("Supabase connection saved in this browser.","success");}
    }});
    if(focusAuth)setTimeout(()=>$ ("field-url")?.focus(),0);
  }
  async function renderSettings(){const c=cfg();const [profileR,sessionR]=await Promise.all([safe(api("workspace","overview")),safe(api("audit","session.assurance"))]);const profile=unwrap(profileR.data)||{},assurance=unwrap(sessionR.data)||{};
    let html=pageHead("settings",`<button class="btn btn-primary" data-act="open-connection">Connection settings</button>`,"Manage this browser connection and review your Davonium Nexus organisation identity.");
    const appearanceName={dark:"Dark",black:"Dark Mode",light:"Light",system:"System"}[state.theme]||"System";
    const accentButtons=Object.entries(ACCENT_PALETTES).map(([key,p])=>`<button type="button" class="accent-theme-choice ${state.accentTheme===key?"active":""}" data-accent-theme="${key}" aria-pressed="${state.accentTheme===key}"><span class="accent-theme-swatch" style="--swatch:${p.cyan}"></span><b>${p.label}</b></button>`).join("");
    html+=`<div class="grid metric-grid">${stat("Nexus organisation",state.workspace.name||"Davonium Technologies",state.workspace.slug||WORKSPACE_SLUG,"grid")}${stat("Your role",state.role,"Resolved from active Nexus membership","users")}${stat("Authentication","Supabase Auth",state.user?.email||"Signed in","shield-check")}${stat("Appearance",appearanceName,"Saved in this browser","activity")}</div>`;
    html+=`<div class="content-grid"><div>${panel("Nexus organisation identity","Identity resolved from the existing Nexus session Edge Function.",`<div class="property-grid">${property("Organisation",state.workspace.name||"Davonium Technologies")}${property("Slug",state.workspace.slug||WORKSPACE_SLUG)}${property("Nexus organisation ID",state.workspace.id||"Not returned")}${property("Membership role",state.role)}${property("Membership status",state.workspace.membership_status||state.workspace.status||"active")}${property("Account email",state.user?.email||"—")}</div>`)}${panel("Connection", "This browser calls your existing Supabase project directly using the signed-in user's access token.",`<div class="property-grid">${property("Project URL",c.url)}${property("Project reference",PROJECT_REF)}${property("Key type","Publishable / anon only")}${property("Session",state.session?"Authenticated":"Not authenticated")}</div><div class="toolbar"><button class="btn btn-secondary" data-act="open-connection">Edit connection</button><button class="btn btn-secondary" data-act="connection-check">Verify session</button></div>`)}</div><div>${panel("Security model","The frontend is not trusted with server credentials.",`<div class="capability-list"><div><span>Service-role key in browser</span>${pill("never")}</div><div><span>Gemini API key in browser</span>${pill("never")}</div><div><span>AI ledger key in browser</span>${pill("never")}</div><div><span>Database writes</span>${pill("Edge Function / RLS")}</div><div><span>Private documents</span>${pill("signed access only")}</div></div>`)}${panel("Appearance","Choose a theme or follow this device's appearance.",`<div class="settings-block"><h3>Interface theme</h3><p>Your choice is saved in this browser. System follows the device automatically.</p><div class="button-row theme-choice-row">
<button class="btn ${state.theme==="dark"?"btn-primary":"btn-secondary"}" data-act="theme-dark">Dark</button>
<button class="btn ${state.theme==="black"?"btn-primary":"btn-secondary"}" data-act="theme-black">Dark Mode</button>
<button class="btn ${state.theme==="light"?"btn-primary":"btn-secondary"}" data-act="theme-light">Light</button>
<button class="btn ${state.theme==="system"?"btn-primary":"btn-secondary"}" data-act="theme-system">System</button>
</div></div>`)}${panel("Themes","Choose one of ten accent palettes. This changes accent colours without changing your appearance.",`<div class="accent-theme-grid">${accentButtons}</div><p class="field-note">Your selection is saved on this device.</p>`)}${panel("Session assurance","Current Supabase MFA assurance.",`<div class="property-grid">${property("Level",assurance.current_level||"Unknown")}${property("MFA verified",assurance.mfa_verified_for_this_session?"Yes":"No")}</div><button class="btn btn-secondary btn-small" data-page="security">Open Security & audit</button>`)}</div></div>`;
    $("pageContent").innerHTML=html;
  }

  // GENERIC MODAL / FORM ENGINE.
  function openModal(eyebrow,title,body,description=""){$("modalEyebrow").textContent=eyebrow||"DAVONIUM NEXUS";$("modalTitle").textContent=title||"Details";$("modalDescription").textContent=description||"";$("modalBody").innerHTML=body||"";$("modalBackdrop").classList.remove("hidden");document.body.classList.add("modal-open");setTimeout(()=>$("modalBody").querySelector("input,select,textarea,button")?.focus(),40);}
  async function closeModal(){$("modalBackdrop").classList.add("hidden");document.body.classList.remove("modal-open");$("modalBody").innerHTML="";}
  function renderField(f){
    const name=esc(f.name),id=`field-${name}`,type=f.type||"text",value=f.value??"";let control="";
    if(type==="textarea")control=`<textarea id="${id}" name="${name}" ${f.required?"required":""} ${f.max?`maxlength="${f.max}"`:""} placeholder="${esc(f.placeholder||"")}">${esc(value)}</textarea>`;
    else if(type==="select")control=`<select id="${id}" name="${name}" ${f.required?"required":""}>${(f.options||[]).map(o=>`<option value="${esc(Array.isArray(o)?o[0]:o)}" ${(String(Array.isArray(o)?o[0]:o)===String(value))?"selected":""}>${esc(Array.isArray(o)?o[1]:o)}</option>`).join("")}</select>`;
    else if(type==="checkbox")control=`<label class="check-field"><input id="${id}" name="${name}" type="checkbox" ${value===true?"checked":""} ${f.required?"required":""}><span>${esc(f.label)}</span></label>`;
    else if(type==="file")control=`<input id="${id}" name="${name}" type="file" ${f.required?"required":""} ${f.accept?`accept="${esc(f.accept)}"`:""}>`;
    else control=`<input id="${id}" name="${name}" type="${esc(type)}" value="${esc(value)}" ${f.required?"required":""} ${f.max?`maxlength="${f.max}"`:""} ${f.min!==undefined?`min="${f.min}"`:""} ${f.max!==undefined&&type==="number"?`max="${f.max}"`:""} ${f.placeholder?`placeholder="${esc(f.placeholder)}"`:""}>`;
    return `<div class="field ${f.span===2?"span-two":""}">${type==="checkbox"?control:`<label for="${id}">${esc(f.label)}</label>${control}`}${f.help?`<small class="field-note">${esc(f.help)}</small>`:""}</div>`;
  }
  function openForm(opts){const fields=opts.fields||[];const body=`<form id="nexusDynamicForm" class="modal-form"><div class="form-grid">${fields.map(renderField).join("")}</div><div class="form-error" id="formError" role="alert"></div><div class="modal-foot"><button type="button" class="btn btn-secondary" id="cancelDynamicForm">Cancel</button><button type="submit" class="btn btn-primary" id="submitDynamicForm" data-act="modal-submit">${esc(opts.submitLabel||"Save changes")} ↗</button></div></form>`;openModal("DAVONIUM NEXUS",opts.title,body,opts.description||"");$("cancelDynamicForm").onclick=closeModal;$("nexusDynamicForm").onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,values={};for(const field of fields){const node=form.elements.namedItem(field.name);if(!node)continue;values[field.name]=field.type==="file"?node.files?.[0]||null:field.type==="checkbox"?node.checked:node.value;}
      const error=$("formError"),button=$("submitDynamicForm");error.textContent="";button.disabled=true;button.textContent="Saving securely…";try{await opts.onSubmit?.(values,event);}catch(e){error.textContent=e.message||"The request could not be completed.";button.disabled=false;button.textContent=`${opts.submitLabel||"Save changes"} ↗`;}
    };
  }


  function getPrivacyConsent(){try{return JSON.parse(localStorage.getItem("nexus_privacy_consent_v1")||"null");}catch(_){return null;}}
  function savePrivacyConsent(analytics){const v={essential:true,analytics:!!analytics,updated_at:new Date().toISOString()};localStorage.setItem("nexus_privacy_consent_v1",JSON.stringify(v));$("#cookieConsent")?.classList.add("hidden");return v;}
  function showPrivacyBanner(){const b=$("#cookieConsent");if(b)b.classList.toggle("hidden",!!getPrivacyConsent());}
  function trackEvent(eventKey,pageKey=null){const c=getPrivacyConsent();if(!c?.analytics||!state.user||!state.workspace?.id||!window.crypto?.randomUUID)return;void api("analytics","events.ingest",{analytics_consent:true,events:[{client_event_id:crypto.randomUUID(),event_key:eventKey,page_key:pageKey}]}).catch(()=>{});}
  function openPrivacySettings(){const c=getPrivacyConsent()||{analytics:false};openForm({title:"Privacy preferences",description:"Essential storage supports secure sign-in. Optional analytics is disabled unless you explicitly enable it. Nexus never records prompts, messages, form values, credentials or documents.",fields:[{name:"essential",label:"Essential storage (required for authentication)",type:"checkbox",value:true,span:2,help:"Always on. Your secure session depends on it."},{name:"analytics",label:"Allow privacy-minimised Nexus analytics",type:"checkbox",value:c.analytics===true,span:2,help:"Optional. Only module event type and timestamp are saved."}],submitLabel:"Save preferences",onSubmit:async v=>{savePrivacyConsent(v.analytics);await closeModal();notify("Privacy preferences saved.","success");if(v.analytics)trackEvent("page_view",state.currentPage);}});}

  // TABLE FILTERING AND COMMAND PALETTE.
  function filterTableRows(predicate){document.querySelectorAll("#pageContent tbody tr").forEach(row=>{const q=document.querySelector("[data-local-filter]")?.value?.toLowerCase()||"";const search=(row.dataset.search||row.textContent||"").toLowerCase();row.hidden=!(predicate?predicate(row):true)||!!q&&!search.includes(q);});}
  function bindFilters(){const input=document.querySelector("[data-local-filter]");if(input)input.addEventListener("input",()=>filterTableRows());}
  const COMMANDS=[...Object.entries(PAGE).map(([page,v])=>({label:v[0],detail:v[1],page})),{label:"Create a finance entry",detail:"Post a balanced debit and credit",act:"finance-entry-create"},{label:"Create a finance budget",detail:"Create or manage a company budget",act:"finance-budget-create"},{label:"Create a project",detail:"Start a new delivery project",act:"create-project"},{label:"Create a task",detail:"Add work to a project",act:"create-task"},{label:"Invite a teammate",detail:"Prepare a Nexus invitation",act:"invite-member"},{label:"Add a client",detail:"Register a client account",act:"create-client"},{label:"Register a product",detail:"Add to the company portfolio",act:"create-product"},{label:"Ask DVNM Intelligence",detail:"Open company intelligence",page:"intelligence"},{label:"Upload a private document",detail:"Add a controlled project document",act:"upload-document"},{label:"New announcement",detail:"Prepare a company update",act:"create-announcement"}];
  function showCommand(){const back=$("commandBackdrop");back.classList.remove("hidden");$("commandSearch").value="";renderCommandResults("");setTimeout(()=>$ ("commandSearch")?.focus(),20);}
  function hideCommand(){ $("commandBackdrop").classList.add("hidden"); }
  function renderCommandResults(query){const matches=COMMANDS.filter(x=>`${x.label} ${x.detail}`.toLowerCase().includes(query.toLowerCase()));state.commandMatches=matches;state.commandIndex=0;$ ("commandResults").innerHTML=matches.map((x,i)=>`<button class="command-result ${i===0?"active":""}" data-command-index="${i}"><span class="command-result-icon">${x.page?"◈":"＋"}</span><span><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></span><kbd>${x.page?"Open":"Action"}</kbd></button>`).join("")||empty("No commands found","Try a module name or action.");document.querySelectorAll("[data-command-index]").forEach(b=>b.onclick=()=>executeCommand(Number(b.dataset.commandIndex)));}
  async function executeCommand(index){const item=state.commandMatches[index];if(!item)return;hideCommand();if(item.page)await navigate(item.page);else await dispatchAction(item.act,"");}
  function moveCommand(delta){if(!state.commandMatches.length)return;state.commandIndex=(state.commandIndex+delta+state.commandMatches.length)%state.commandMatches.length;document.querySelectorAll("[data-command-index]").forEach((b,i)=>{b.classList.toggle("active",i===state.commandIndex);if(i===state.commandIndex)b.scrollIntoView({block:"nearest"});});}

  // SINGLE ACTION ROUTER. All mutations are sent to the existing authenticated Edge Functions.
  async function dispatchAction(act,id,extra={}){
    try{
      switch(act){
        case "refresh":case "ai-refresh":await (act==="ai-refresh"?renderIntelligence():refresh());break;
        case "analytics-consent":openPrivacySettings();break;
        case "finance-account-create":createFinanceAccount();break;case "finance-entry-create":createFinanceEntry();break;case "finance-budget-create":createFinanceBudget();break;case "finance-account-state":await updateFinanceAccount(id);break;case "finance-budget-state":await updateFinanceBudget(id,extra.status||"paused");break;
        case "create-project":await createProject();break;case "open-project":await openProject(id);break;case "edit-project":await editProject(id);break;
        case "create-task":if(!state.cache.projects?.length)await fetchProjects();createTask(extra.projectId||null);break;case "edit-task":await editTask(id);break;case "task-comments":await taskComments(id,extra.projectId);break;case "create-milestone":createMilestone(extra.projectId);break;case "edit-milestone":editMilestone(extra.projectId,id);break;case "create-project-decision":createProjectDecision(extra.projectId);break;
        case "create-client":createClient();break;case "edit-client":await editClient(id);break;case "member-profile":memberProfile(id);break;
        case "create-department":createDepartment();break;case "edit-department":editDepartment(id);break;case "create-team":createTeam();break;case "edit-team":editTeam(id);break;
        case "invite-member":if(!state.cache.people)state.cache.people=await loadPeople();inviteMember();break;case "member-role":memberRole(id);break;case "member-status":memberStatus(id);break;case "send-invite":await sendInvite(id);break;case "cancel-invite":await cancelInvite(id);break;
        case "member-permission":memberPermission(id);break;case "clear-member-permission":clearMemberPermission(id);break;
        case "create-product":createProduct();break;case "create-metric-definition":createMetricDefinition();break;case "edit-metric-definition":editMetricDefinition(id);break;case "create-manual-metric":createManualMetric();break;case "metric-history":await showMetricHistory(id);break;case "register-integration":registerIntegration();break;case "integration-state":integrationState(id);break;case "create-release":createRelease();break;case "publish-release":await publishRelease(id);break;case "verify-metric":await verifyMetric(id);break;
        case "product-releases":await navigate("products");document.querySelector('[data-product-tab="releases"]')?.click();break;case "edit-release":editRelease(id);break;case "archive-release":await archiveRelease(id);break;case "archive-investor-update":await archiveInvestorUpdate(id);break;case "assign-project-member":await assignProjectMember(id||extra.projectId);break;case "remove-project-member":await removeProjectMember(id,extra.projectId);break;
        case "create-objective":createObjective();break;case "edit-objective":await editObjective(id);break;case "create-key-result":createKeyResult();break;case "create-key-result-for":createKeyResult(id);break;case "edit-key-result":editKeyResult(id);break;case "edit-summary":editWeeklySummary(id);break;case "archive-summary":await archiveWeeklySummary(id);break;case "create-decision":createDecision();break;case "create-summary":createWeeklySummary();break;case "publish-summary":await publishSummary(id);break;
        case "create-investor-update":createInvestorUpdate();break;case "edit-investor-update":editInvestorUpdate(id);break;case "publish-investor-update":await publishInvestorUpdate(id);break;case "toggle-investor-access":await toggleInvestorAccess(id);break;
        case "upload-document":uploadDocument();break;case "download-document":await downloadDocument(id);break;case "toggle-document-visibility":await toggleDocumentVisibility(id);break;case "archive-document":await archiveDocument(id);break;
        case "create-channel":if(!state.cache.people)state.cache.people=await loadPeople();if(!state.cache.projects)await fetchProjects();createChannel();break;case "edit-channel":editChannel(id);break;case "manage-channel-members":await manageChannelMembers(id);break;case "moderate-message":await moderateMessage(id);break;case "direct-new":await startDirectMessage();break;case "open-direct":await openDirectConversation(id);break;case "create-announcement":createAnnouncement();break;case "edit-announcement":editAnnouncement(id);break;case "publish-announcement":await publishAnnouncement(id);break;case "archive-announcement":await archiveAnnouncement(id);break;
        case "edit-delivery-settings":editDeliverySettings();break;case "mark-read":await markRead(id);break;case "mark-all-read":await markAllRead();break;
        case "go-ai":await navigate("intelligence");break;case "ai-refresh":await renderIntelligence();break;case "create-incident":createIncident();break;case "edit-incident":editIncident(id);break;case "edit-component":editComponent(id);break;case "ai-new":await createAIConversation();break;case "ai-manage-conversation":manageAIConversation(id);break;case "ai-manage-limits":manageAILimits();break;case "ai-policy-enable":await changeAIPolicy(true);break;case "ai-policy-disable":await changeAIPolicy(false);break;
        case "open-connection":openSetup(false);break;case "connection-check":{const d=await edge("session",{});notify(`Session verified · ${d.identity?.email||state.user?.email||"authenticated"}.`,"success");break;}
        case "theme-dark":state.theme="dark";applyTheme();await renderSettings();break;
        case "theme-black":state.theme="black";applyTheme();await renderSettings();break;
        case "theme-light":state.theme="light";applyTheme();await renderSettings();break;
        case "theme-system":state.theme="system";applyTheme();await renderSettings();break;
        case "mobile-more":$("sidebar").classList.add("open");$("mobileScrim").classList.add("show");break;
        default:notify(`This action is not available: ${act}`,"error");
      }
    }catch(e){notify(e.message||"The action could not be completed.","error");}
  }

  // EVENT WIRING
  function applyRoleNavigation(){
    const external=["client","investor"].includes(state.role);
    if(external&&!document.querySelector('#nav [data-page="portal"]')){
      const b=document.createElement("button");b.className="nav-item";b.dataset.page="portal";
      b.innerHTML='<span class="nav-icon">◈</span><span>My portal</span>';$("#nav").appendChild(b);
    }
    document.querySelectorAll("#nav [data-page]").forEach(el=>{
      const p=el.dataset.page;
      el.hidden=external?!["portal","notifications","settings"].includes(p):p==="portal";
      if(p==="analytics"&&!state.permissionMap["analytics.view"])el.hidden=true;
      if(p==="finance"&&!state.permissionMap["finance.view"])el.hidden=true;
    });
    const home=document.querySelector('.mobile-nav-item[data-page="overview"]');
    if(home){
      home.dataset.page=external?"portal":"overview";
      const label=home.querySelector("small");if(label)label.textContent=external?"Portal":"Home";
    }
    document.querySelectorAll(".mobile-nav-item[data-page]").forEach(el=>{
      const p=el.dataset.page;
      el.hidden=external?!["portal","notifications"].includes(p):
        (p==="intelligence"&&!state.permissionMap["intelligence.use"]);
    });
  }
  function wire(){
    // One capture-phase router owns every generated navigation and action control.
    // It handles nested SVG targets and prevents duplicate delegated handlers.
    document.addEventListener("click",event=>{
      const target=event.target instanceof Element?event.target:event.target?.parentElement;
      if(!target)return;
      const financeTab=target.closest("[data-finance-tab]");
      if(financeTab&&$("#pageContent")?.contains(financeTab)){
        event.preventDefault();event.stopPropagation();
        state.financeTab=financeTab.dataset.financeTab;
        void renderFinance();
        return;
      }
      const page=target.closest("[data-page]");
      if(page){
        event.preventDefault();event.stopPropagation();
        void navigate(page.dataset.page);
        return;
      }
      const mobileMore=target.closest('[data-act="mobile-more"]');
      if(mobileMore){
        event.preventDefault();event.stopPropagation();
        // Intelligence hides the global sidebar; reveal it temporarily so More remains usable on phones.
        if(state.currentPage==="intelligence")$("#app")?.classList.remove("ai-mode");
        $("#sidebar")?.classList.add("open");
        $("#mobileScrim")?.classList.add("show");
        return;
      }
      const modalAct=target.closest("[data-modal-act]");
      if(modalAct){
        event.preventDefault();event.stopPropagation();
        const action=modalAct.dataset.modalAct,id=modalAct.dataset.id,projectId=modalAct.dataset.project;
        void closeModal().then(()=>dispatchAction(action,id,{projectId}));
        return;
      }
      const action=target.closest("[data-act]");
      if(action){
        event.preventDefault();event.stopPropagation();
        const act=action.dataset.act;
        if(act==="privacy-reject"){savePrivacyConsent(false);notify("Optional analytics disabled.","success");return;}
        if(act==="privacy-accept"){savePrivacyConsent(true);notify("Optional analytics enabled.","success");if(state.user)void trackEvent("page_view",state.currentPage);return;}
        if(act==="privacy-customize"){openPrivacySettings();return;}
        if(act==="sign-out"){void signOut();return;}
        if(act==="ai-send"){void sendAIMessage();return;}
        if(act==="modal-submit"){$("nexusDynamicForm")?.requestSubmit();return;}
        if(act==="toggle-sidebar"){setSidebarCollapsed(!state.isCollapsed);return;}
        if(act==="expand-sidebar"){setSidebarCollapsed(false);return;}
        if(act==="ai-manage-conversation"){manageAIConversation(action.dataset.id);return;}
        if(act==="ai-toggle-history"){
          const history=$(".ai-history");
          history?.classList.toggle("open");
          $("#aiHistoryBackdrop")?.classList.toggle("visible",history?.classList.contains("open")===true);
          return;
        }
        if(act==="ai-close-history"){
          $(".ai-history")?.classList.remove("open");
          $("#aiHistoryBackdrop")?.classList.remove("visible");
          return;
        }
        dispatchAction(act,action.dataset.id,{projectId:action.dataset.project,status:action.dataset.status});
        return;
      }
      const accent=target.closest("[data-accent-theme]");
      if(accent){
        event.preventDefault();event.stopPropagation();
        state.accentTheme=accent.dataset.accentTheme;
        applyAccentTheme();
        if(state.currentPage==="settings")void renderSettings();
        return;
      }
    },true);

    applyAccentTheme();setSidebarCollapsed(state.isCollapsed,false);
    document.querySelectorAll("[data-icon]").forEach(el=>el.innerHTML=icon(el.dataset.icon));
    $("authForm").addEventListener("submit",authSubmit);$("forgotPassword").onclick=forgotPassword;$("openSetupAuth").onclick=()=>openSetup(true);
    $("themeToggle").onclick=cycleTheme;window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener?.("change",()=>{if(state.theme==="system")applyTheme();});
    $("cookieAcceptAll")?.addEventListener("click",()=>{savePrivacyConsent(true);notify("Optional analytics enabled.","success");if(state.user)trackEvent("page_view",state.currentPage);});
    $("cookieReject")?.addEventListener("click",()=>{savePrivacyConsent(false);notify("Optional analytics disabled.","success");});
    $("cookieCustomize")?.addEventListener("click",openPrivacySettings);showPrivacyBanner();
    window.addEventListener("online",()=>{document.body.classList.remove("is-offline");notify("Nexus connection restored.","success");});
    window.addEventListener("offline",()=>{document.body.classList.add("is-offline");notify("Offline mode · application shell remains available.","info");});
    if(!navigator.onLine)document.body.classList.add("is-offline");
    window.addEventListener("appinstalled",()=>trackEvent("pwa_installed"));
    if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js",{scope:"./"}).catch(err=>console.warn("Nexus offline shell",err)));
    $("openCommand").onclick=showCommand;$("topNotifications").onclick=()=>navigate("notifications");$("profileButton").onclick=()=>navigate("settings");$("workspaceSwitch").onclick=()=>navigate("settings");$("connectionDetails").onclick=()=>navigate("settings");
    $("mobileMenu").onclick=()=>{$("sidebar").classList.toggle("open");$("mobileScrim").classList.toggle("show");};$("mobileScrim").onclick=()=>{$("sidebar").classList.remove("open");$("mobileScrim").classList.remove("show");if(state.currentPage==="intelligence")$("app").classList.add("ai-mode");};
    $("collapseNav").onclick=()=>setSidebarCollapsed(!state.isCollapsed);$("expandNav").onclick=()=>setSidebarCollapsed(false);window.matchMedia?.("(max-width: 760px)")?.addEventListener?.("change",()=>setSidebarCollapsed(state.isCollapsed,false));$("closeModal").onclick=closeModal;$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
    $("commandBackdrop").addEventListener("click",e=>{if(e.target===$("commandBackdrop"))hideCommand();});$("commandSearch").addEventListener("input",e=>renderCommandResults(e.target.value));$("commandSearch").addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();moveCommand(1);}else if(e.key==="ArrowUp"){e.preventDefault();moveCommand(-1);}else if(e.key==="Enter"){e.preventDefault();executeCommand(state.commandIndex);}else if(e.key==="Escape")hideCommand();});

    document.addEventListener("keydown",e=>{if(e.target?.id==="aiMessageInput"&&e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#aiComposer")?.requestSubmit();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if($("commandBackdrop").classList.contains("hidden"))showCommand();else hideCommand();}else if(e.key==="Escape"){hideCommand();if(!$ ("modalBackdrop").classList.contains("hidden"))closeModal();}else if(e.key==="/"&&!/input|textarea|select/i.test(document.activeElement?.tagName||"")){e.preventDefault();showCommand();}});
  }

  document.addEventListener("DOMContentLoaded",()=>{wire();restore();});
})();
