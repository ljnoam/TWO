self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Nouveau mot doux 💌';
  const body = data.body || 'Tu as reçu un message';
  const url = data.url || '/notes';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/notes';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const same = all.find((c) => new URL(c.url).pathname === url);
      if (same) { same.focus(); } else { self.clients.openWindow(url); }
    })()
  );
});
