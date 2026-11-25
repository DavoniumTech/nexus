const CACHE_NAME = "davonium-nexus-shell-v5-20261125";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./assets/branding/davonium-d-icon.webp",
  "./assets/branding/davonium-nexus.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (
    url.pathname.includes("/functions/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/rest/") ||
    url.pathname.includes("/storage/")
  ) return;

  const isAppShellAsset = APP_SHELL.some(
    path => new URL(path, self.location.href).pathname === url.pathname
  );

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-cache" });
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) ||
          (await caches.match("./offline.html")) ||
          Response.error();
      }
    })());
    return;
  }

  if (isAppShellAsset) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-cache" });
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) || Response.error();
      }
    })());
  }
});
