import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // Check if env vars exist
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;

    console.log('[CREDS] Checking Firebase credentials...');
    console.log('[CREDS] PROJECT_ID:', hasProjectId ? '✓' : '✗');
    console.log('[CREDS] PRIVATE_KEY:', hasPrivateKey ? '✓' : '✗');
    console.log('[CREDS] CLIENT_EMAIL:', hasClientEmail ? '✓' : '✗');

    if (!hasProjectId || !hasPrivateKey || !hasClientEmail) {
      return NextResponse.json({
        status: 'MISSING_CREDENTIALS',
        projectId: hasProjectId,
        privateKey: hasPrivateKey,
        clientEmail: hasClientEmail
      });
    }

    const hasServiceAccountKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    console.log('[CREDS] SERVICE_ACCOUNT_KEY:', hasServiceAccountKey ? '✓' : '✗');

    // Try to initialize Firebase
    let firebaseApp = null;
    try {
      if (admin.apps.length > 0) {
        firebaseApp = admin.apps[0]!;
        console.log('[CREDS] Using existing Firebase app');
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('[CREDS] Firebase initialized via SERVICE_ACCOUNT_KEY');
      } else {
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          } as any),
        });
        console.log('[CREDS] Firebase initialized via individual vars');
      }
    } catch (initErr) {
      console.error('[CREDS] Firebase init failed:', initErr);
      return NextResponse.json({
        status: 'FIREBASE_INIT_FAILED',
        error: String(initErr)
      });
    }

    // Try to send a test message to a dummy token
    try {
      const messaging = admin.messaging(firebaseApp);
      console.log('[CREDS] Got messaging instance, trying dummy send...');

      // This will fail on the token but should succeed on auth
      await messaging.send({
        token: 'dummy_token_for_auth_test',
        notification: { title: 'Test', body: 'Test' }
      }).catch((e) => {
        // We expect this to fail on token, but if auth is good it should be a token error, not auth error
        if (e.code === 'messaging/invalid-registration-token' ||
            e.code === 'messaging/mismatched-credential' ||
            e.message?.includes('Invalid registration token')) {
          console.log('[CREDS] Got expected token error (auth works!):', e.code);
          return 'AUTH_OK_TOKEN_INVALID';
        } else {
          console.error('[CREDS] Got unexpected error:', e.code, e.message);
          throw e;
        }
      });
    } catch (sendErr) {
      const errStr = String(sendErr);
      if (errStr.includes('invalid_grant') || errStr.includes('account not found')) {
        return NextResponse.json({
          status: 'FIREBASE_AUTH_FAILED',
          error: errStr,
          hint: 'Service account key is invalid or revoked'
        });
      }
      return NextResponse.json({
        status: 'FIREBASE_SEND_FAILED',
        error: errStr
      });
    }

    return NextResponse.json({
      status: 'OK',
      message: 'Firebase credentials are valid and authenticated'
    });
  } catch (err) {
    return NextResponse.json({ status: 'ERROR', error: String(err) }, { status: 500 });
  }
}
