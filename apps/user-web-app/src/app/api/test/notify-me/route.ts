import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

let firebaseApp: admin.app.App | null = null;
try {
  if (admin.apps.length > 0) {
    // Firebase already initialized
    firebaseApp = admin.apps[0]!;
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      } as any),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
} catch (err) {
  console.error('Firebase init error:', err);
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Save test notification to Supabase
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'test',
        title: 'Test Notification',
        data: { message: 'Firebase notification system test' },
      });

    if (notifError) {
      console.error('Failed to save notification:', notifError);
    }

    // Get user's device tokens
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (!tokens?.length) {
      return NextResponse.json({
        supabaseNotification: !notifError,
        error: 'No device tokens found',
        userId
      }, { status: 404 });
    }

    if (!firebaseApp) {
      return NextResponse.json({
        supabaseNotification: !notifError,
        error: 'Firebase not configured'
      }, { status: 500 });
    }

    // Send to all tokens
    const messaging = admin.messaging(firebaseApp);
    const results = await Promise.all(
      tokens.map((t) =>
        messaging.send({
          token: t.token,
          notification: { title: 'Test', body: 'Firebase is working!' },
        }).catch((e) => {
          console.error('Send failed:', e.message);
          return null;
        })
      )
    );

    const sent = results.filter(r => r).length;
    const tokenPreviews = tokens.map(t => t.token.substring(0, 20) + '...');
    return NextResponse.json({
      supabaseNotification: !notifError,
      firebaseSent: sent,
      firebaseTotal: tokens.length,
      tokens: tokenPreviews,
      isFakeToken: tokens.some(t => t.token.startsWith('web_')),
      status: sent > 0 ? 'Firebase push sent!' : 'Check token — may be fake (web_xxx)'
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
