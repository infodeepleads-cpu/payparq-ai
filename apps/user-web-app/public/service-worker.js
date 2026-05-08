/**
 * Service Worker for Payparq Notifications
 * Handles:
 * - Web Push notifications (even when browser closed)
 * - Background notification handling
 * - Click routing
 * - Realtime sync
 */

const CACHE_VERSION = 'payparq-v1-' + new Date().toISOString().split('T')[0];

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('payparq-v') && !cacheName.startsWith(CACHE_VERSION.split('-').slice(0, 3).join('-'))) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications (from Web Push protocol)
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.data?.url || '/',
      ...data.data,
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Payparq', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/members/mapa';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if URL is already open
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === url && 'focus' in windowClients[i]) {
          return windowClients[i].focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Periodic background sync (optional - for offline support)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install handler to ensure latest version
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Helpers
async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/sync');
    const data = await response.json();

    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach((notification) => {
        self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          tag: notification.tag,
          data: notification.data,
        });
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Clients update
self.addEventListener('controllerchange', () => {
  console.log('Service Worker controller changed');
});

console.log('✓ Service Worker loaded');
