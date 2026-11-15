self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL("/Connect/", self.location.origin).href;
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
    data: { url: payload.url || "/Connect/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
