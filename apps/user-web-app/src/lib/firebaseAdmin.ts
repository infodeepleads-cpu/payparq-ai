import admin from 'firebase-admin';

let initialized = false;

export function initializeFirebase() {
  if (initialized || admin.apps.length > 0) {
    return admin;
  }

  // Check if FIREBASE_SERVICE_ACCOUNT_KEY is set
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY not configured. FCM notifications will use fallback method.'
    );
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    console.log('✓ Firebase Admin SDK initialized');
    return admin;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

export function getMessaging() {
  const app = initializeFirebase();
  return app ? admin.messaging() : null;
}
