const CACHE_NAME = "riffsync-v1";

const PRECACHE_URLS = ["/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;
  if (url.protocol !== "https:" && url.hostname !== "localhost") return;

  // Cache-first for static assets (icons, fonts, images)
  if (
    url.pathname.startsWith("/icon-") ||
    url.pathname.startsWith("/apple-touch-icon") ||
    url.pathname.match(/\.(woff2?|ttf|otf)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first for navigations (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("/projects"))
      )
    );
    return;
  }
});

self.addEventListener("push", (event) => {
  const fallback = { title: "RiffSync", body: "You have a new notification" };

  let data;
  try {
    data = event.data?.json() ?? fallback;
  } catch {
    data = { title: "RiffSync", body: event.data?.text() ?? fallback.body };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "RiffSync", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (url) {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          for (const client of windowClients) {
            if (client.url.includes(url) && "focus" in client) {
              return client.focus();
            }
          }
          return self.clients.openWindow(url);
        })
    );
  }
});
