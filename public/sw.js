const SHELL_CACHE = "connect-shell-v3";
const SHELL_URLS = [
  "/Connect/",
  "/Connect/manifest.webmanifest",
  "/Connect/icons/connect-192.png",
  "/Connect/icons/connect-512.png",
  "/Connect/icons/connect.svg"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled(SHELL_URLS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("connect-shell-") && key !== SHELL_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (/\/(auth|rest|realtime|functions)\/v1\//.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put("/Connect/", response.clone());
        }
        return response;
      } catch {
        return (await caches.match("/Connect/")) || Response.error();
      }
    })());
    return;
  }

  if (/\/Connect\/(icons|images)\//.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request);
      const update = fetch(request).then(response => {
        if (response.ok) void cache.put(request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || update;
    })());
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/Connect/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        if ("navigate" in client && client.url !== target) await client.navigate(target);
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {}
  const title = payload.title || "CONNECT";
  const options = {
    body: payload.body || "Você tem uma nova atualização.",
    tag: payload.tag || "connect-update",
    icon: "/Connect/icons/connect-192.png",
    badge: "/Connect/icons/connect-192.png",
    lang: "pt-BR",
    data: { url: payload.url || "/Connect/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
