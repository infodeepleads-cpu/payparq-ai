'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAaEjvkpPSwcJhOOTViVbiRMW3sQq9sgSI',
  authDomain: 'payparq-d-6rex95.firebaseapp.com',
  projectId: 'payparq-d-6rex95',
  storageBucket: 'payparq-d-6rex95.firebasestorage.app',
  messagingSenderId: '913890552108',
  appId: '1:913890552108:web:064f8b527aa71887986489',
};

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

if (!VAPID_KEY && typeof window !== 'undefined') {
  console.error('[FCM] NEXT_PUBLIC_VAPID_PUBLIC_KEY env var is missing — notifications will not work');
}

let messaging: any = null;

export async function initializeFirebase() {
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
    return app;
  } catch (error) {
    console.error('[FCM] Init error:', error);
    return null;
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    if (!messaging) {
      await initializeFirebase();
    }

    if (!messaging) {
      console.error('[FCM] Messaging not available');
      return null;
    }

    let swRegistration: ServiceWorkerRegistration | undefined;
    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      swRegistration = existingRegistrations.find(r =>
        r.active?.scriptURL.includes('firebase-messaging-sw')
      );

      if (!swRegistration) {
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        // Wait for this specific registration to become active
        swRegistration = await new Promise<ServiceWorkerRegistration>((resolve) => {
          if (reg.active) { resolve(reg); return; }
          const sw = reg.installing ?? reg.waiting;
          if (!sw) { resolve(reg); return; }
          sw.addEventListener('statechange', function handler(this: ServiceWorker) {
            if (this.state === 'activated') {
              sw.removeEventListener('statechange', handler);
              resolve(reg);
            }
          });
        });
      }
    } catch (swError) {
      console.error('[FCM] Service worker registration failed:', swError);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
    }

    return token || null;
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

export async function onMessageListener() {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}
