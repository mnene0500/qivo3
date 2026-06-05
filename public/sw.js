
/**
 * QIVO Service Worker v1.2
 * Handles push notifications and background message sync.
 */

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Message from QIVO';
  const options = {
    body: data.body || 'You have a new interaction waiting.',
    icon: '/icon-192.png',
    badge: '/notification.png',
    data: data.url || '/',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});
