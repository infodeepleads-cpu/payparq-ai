/**
 * Service Worker for Payparq
 *
 * IMPORTANT: This SW intentionally does NOT cache app code (HTML/JS/CSS).
 * The app is loaded remotely (incl. the Capacitor WebView) from a server that
 * serves `no-store` HTML and content-hashed, immutable JS chunks. Any SW-level
 * caching of scripts/documents causes the installed app to run stale code while
 * the website updates, because the WebView has its own Cache Storage partition.
 *
 * Responsibilities kept here:
 * - Web Push notifications
 * - Notification click handling
 * - Background sync
 *
 * It also actively purges any caches created by previous versions of this SW,
 * so existing installs self-heal on next launch without an app rebuild.
 */

// Bump this whenever you want all clients to re-activate and purge old caches.
const SW_VERSION = 'payparq-2026-06-18-no-cache';

// Install: take over immediately, no pre-caching.
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate: delete ALL caches this app ever created, then claim clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith('payparq-'))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// No fetch handler: every request goes straight to the network / HTTP cache.
// This guarantees the WebView always runs the latest deployed code.

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === url && 'focus' in windowClients[i]) {
          return windowClients[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncPendingBookings());
  }
});

async function syncPendingBookings() {
  try {
    const response = await fetch('/api/sync-bookings', { method: 'POST' });
    if (response.ok) {
      console.log('Bookings synced successfully');
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Allow the page to force an immediate activation of an updated SW.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✓ Service Worker loaded:', SW_VERSION);
