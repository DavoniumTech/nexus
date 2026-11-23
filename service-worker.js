const CACHE_NAME="davonium-nexus-shell-v1";
const APP_SHELL=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./offline.html","./assets/branding/davonium-d-icon.webp","./assets/branding/davonium-nexus.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(url.pathname.includes("/functions/")||url.pathname.includes("/auth/")||url.pathname.includes("/rest/")||url.pathname.includes("/storage/"))return;
 if(request.mode==="navigate"){event.respondWith(fetch(request).catch(()=>caches.match("./offline.html")));return;}
 if(APP_SHELL.some(path=>new URL(path,self.location.href).pathname===url.pathname)){
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;})));
 }
});
