import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

let firebaseApp: admin.app.App | null = null;
try {
  if (admin.apps.length === 0 && process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
} catch (err) {
  console.error('Firebase init:', err);
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user's device tokens
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (!tokens?.length) {
      return NextResponse.json({ error: 'No device tokens found', userId }, { status: 404 });
    }

    if (!firebaseApp) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
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
    return NextResponse.json({ sent, total: tokens.length, tokens: tokens.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
