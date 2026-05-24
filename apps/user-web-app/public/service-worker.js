/**
 * Service Worker for Payparq - World Class PWA
 * Handles:
 * - Comprehensive offline support for search & booking flow
 * - Smart caching strategies (network-first, cache-first, stale-while-revalidate)
 * - Web Push notifications
 * - Background sync
 * - Offline fallback pages
 */

const CACHE_VERSION = 'payparq-v2-' + new Date().toISOString().split('T')[0];
const STATIC_CACHE = CACHE_VERSION + '-static';
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
const API_CACHE = CACHE_VERSION + '-api';
const IMAGE_CACHE = CACHE_VERSION + '-images';

// Critical assets to pre-cache on install
const CRITICAL_ASSETS = [
  '/',
  '/search',
  '/success',
  '/members',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: Pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Pre-caching critical assets...');
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('Some critical assets could not be cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that don't match current version
          const isCurrentVersion = CACHE_VERSION.split('-').slice(0, 2).join('-');
          if (cacheName.startsWith('payparq-') && !cacheName.startsWith(isCurrentVersion)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          // Also delete daily caches from previous days
          if (cacheName.startsWith(isCurrentVersion) && !cacheName.includes(CACHE_VERSION.split('-')[2])) {
            console.log('Deleting old daily cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Images: cache-first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // HTML pages: network-first with fallback
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Static assets (JS, CSS): cache-first
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Network-first strategy (try network, fallback to cache)
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // No cache, return offline fallback
    return createOfflineFallback(request);
  }
}

// Cache-first strategy (try cache, fallback to network)
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return createOfflineFallback(request);
  }
}

// Offline fallback response
function createOfflineFallback(request) {
  const url = new URL(request.url);

  // Return cached pages if available
  if (request.destination === 'document') {
    return caches.match('/').catch(() => {
      return new Response(
        '<html><body><h1>Offline</h1><p>You are offline. Please check your connection.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    });
  }

  // Return 404 for other missing resources
  return new Response('Not found', { status: 404 });
}

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

// Sync pending bookings
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

// Message handling
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(DYNAMIC_CACHE).then(() => {
      console.log('Dynamic cache cleared');
    });
  }
});

console.log('✓ World-Class Service Worker loaded');
