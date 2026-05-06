'use client';

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  projectId: 'payparq-d-6rex95',
  appId: '1:105869582839721996226:web:placeholder',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: 'payparq-d-6rex95.firebaseapp.com',
  messagingSenderId: '105869582839721996226',
  storageBucket: 'payparq-d-6rex95.appspot.com',
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
      vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
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
