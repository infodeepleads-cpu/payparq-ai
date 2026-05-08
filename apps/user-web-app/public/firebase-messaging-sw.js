importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

firebase.initializeApp({
  apiKey: 'AIzaSyAaEjvkpPSwcJhOOTViVbiRMW3sQq9sgSI',
  authDomain: 'payparq-d-6rex95.firebaseapp.com',
  projectId: 'payparq-d-6rex95',
  storageBucket: 'payparq-d-6rex95.firebasestorage.app',
  messagingSenderId: '913890552108',
  appId: '1:913890552108:web:064f8b527aa71887986489',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Payparq', {
    body: body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
  });
});
