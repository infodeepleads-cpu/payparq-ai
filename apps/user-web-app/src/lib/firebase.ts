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

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BK1A-3JT3V9L3wF5k7xi7T8GFrj_bbTps4PyPMp90_LUHp3nRqC6o-rXjj9w7ep3jsoKGIm2GcstFYpL-Q-8vN4';

let messaging: any = null;

export async function initializeFirebase() {
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const supported = await isSupported();
    console.log('[FCM] Messaging supported:', supported);
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

    // Reuse existing service worker if already registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      swRegistration = existingRegistrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw'));

      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      }
    } catch (swError) {
      console.error('[FCM] Service worker registration failed:', swError);
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log('[FCM] Token obtained successfully:', token.substring(0, 20) + '...');
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
      console.log('[FCM] Foreground message received:', payload);
      resolve(payload);
    });
  });
}
