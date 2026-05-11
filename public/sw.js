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
    event.waitUntil(clients.openWindow(url));
  }
});
