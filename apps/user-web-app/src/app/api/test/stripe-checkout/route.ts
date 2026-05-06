import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

let firebaseApp: admin.app.App | null = null;
try {
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0]!;
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

    // Find a location with this user as owner
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, owner_id')
      .eq('owner_id', userId)
      .limit(1);

    if (!locations?.length) {
      return NextResponse.json({ error: 'No parking lot found for this user' }, { status: 404 });
    }

    const location = locations[0];
    const amount = 1500; // €15.00

    // Save notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'payment',
        title: `Payment received €${(amount / 100).toFixed(2)}`,
        data: { location: location.name, amount, timestamp: new Date().toISOString() },
      });

    // Get device tokens
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (!tokens?.length || !firebaseApp) {
      return NextResponse.json({
        notification_saved: !notifError,
        notification_title: `Payment received €${(amount / 100).toFixed(2)}`,
        location: location.name,
        firebase_sent: 0,
        error: 'No device tokens found - enable notifications first'
      });
    }

    // Send Firebase push
    const messaging = admin.messaging(firebaseApp);
    const results = await Promise.all(
      tokens.map((t) =>
        messaging.send({
          token: t.token,
          notification: {
            title: 'Payment Received',
            body: `€${(amount / 100).toFixed(2)} at ${location.name}`,
          },
          data: { type: 'payment', location: location.name },
        }).catch((e) => {
          console.error('Send failed:', e.message);
          return null;
        })
      )
    );

    const sent = results.filter(r => r).length;
    return NextResponse.json({
      notification_saved: !notifError,
      notification_title: `Payment received €${(amount / 100).toFixed(2)}`,
      location: location.name,
      firebase_sent: sent,
      firebase_total: tokens.length,
      status: sent > 0 ? 'SUCCESS - Check your notifications!' : 'FAILED - Token issue'
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
