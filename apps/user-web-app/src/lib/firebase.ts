'use client';

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAaEjvkpPSwcJhOOTViVbiRMW3sQq9sgSI',
  authDomain: 'payparq-d-6rex95.firebaseapp.com',
  projectId: 'payparq-d-6rex95',
  storageBucket: 'payparq-d-6rex95.firebasestorage.app',
  messagingSenderId: '913890552108',
  appId: '1:913890552108:web:064f8b527aa71887986489',
  measurementId: 'G-2FHJVX51E4',
};

let app: any = null;
let messaging: any = null;

export async function initializeFirebase() {
  if (app) return app;
  try {
    app = initializeApp(firebaseConfig);
    if (await isSupported()) {
      messaging = getMessaging(app);
    }
    return app;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    if (!messaging) {
      await initializeFirebase();
    }
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: 'BBivN-xqjRD52mFXWci9qxl6DOonvFPlME_XCmoVGMkhJqda8HkMN6AKqvkK69TrPxnqOBxzbOkQj-n-4_cxjho',
    });
    return token || null;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
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
