import * as admin from 'firebase-admin';

function getFirebaseApp(): admin.app.App | null {
  try {
    if (admin.apps.length > 0) {
      return admin.apps[0]!;
    }

    // Prefer full JSON service account key
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }

    // Fallback to individual vars
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        } as any),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }

    console.error('[Firebase Admin] No credentials found');
    return null;
  } catch (err) {
    console.error('[Firebase Admin] Init error:', err);
    return null;
  }
}

export const firebaseAdmin = getFirebaseApp();
