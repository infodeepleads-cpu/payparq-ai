import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Firebase
let firebaseApp: admin.app.App | null = null;
try {
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0]!;
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      } as any),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
} catch (err) {
  console.error('Firebase initialization error:', err);
}

interface SessionData {
  location: string;
  amount: number;
  plate?: string | null;
  customerEmail?: string | null;
  startDate?: string | null;
  startTime?: string | null;
  duration?: string | null;
}

async function sendPaymentNotification(ownerId: string, session: SessionData) {
  try {
    console.log('[webhook] Sending notification for owner:', ownerId);
    const amountStr = session.amount > 0 ? `€${(session.amount / 100).toFixed(2)}` : 'Free';
    const title = `New booking — ${session.location}`;
    const body = [
      session.plate ? `Plate: ${session.plate}` : null,
      session.startDate ? `Date: ${session.startDate}` : null,
      session.duration ? `Duration: ${session.duration}h` : null,
      `Amount: ${amountStr}`,
    ].filter(Boolean).join(' · ');

    // Save to notifications table
    await supabase.from('notifications').insert({
      user_id: ownerId,
      type: 'payment',
      title,
      data: { ...session, body },
    });
    console.log('[webhook] Notification saved to DB');

    // Get device tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', ownerId);

    console.log('[webhook] Device tokens found:', tokens?.length ?? 0, 'error:', tokensError?.message);

    if (!tokens || tokens.length === 0 || !firebaseApp) {
      console.log('[webhook] Skipping FCM send - no tokens, firebaseApp, or tokens empty');
      return;
    }

    // Send Firebase push
    const messaging = admin.messaging(firebaseApp);
    const results = await Promise.all(
      tokens.map((t) =>
        messaging.send({
          token: t.token,
          notification: { title, body },
          data: { type: 'payment', location: session.location },
        }).catch((err) => {
          console.error('[webhook] FCM send failed for token:', err);
          return null;
        })
      )
    );
    console.log('[webhook] FCM sent to', results.filter(Boolean).length, 'devices');
  } catch (err) {
    console.error('[webhook] Notification error:', err);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const {
          listingId,
          startDate,
          startTime,
          duration,
          pricePerHour,
          plate,
          plateNumber,
          customerEmail,
          customer_email,
        } = session.metadata || {};

        if (!listingId || !startDate || !startTime || !duration) {
          throw new Error('Missing booking metadata');
        }

        // Create parking session record
        const checkoutTime = new Date(startDate + 'T' + startTime);
        const checkinTime = new Date(
          checkoutTime.getTime() + parseInt(duration) * 60 * 60 * 1000
        );

        const { error: bookingError } = await supabase
          .from('parking_sessions')
          .insert({
            location_id: listingId,
            user_id: null, // Will be set from auth context in production
            booking_time: new Date().toISOString(),
            checkout_time: checkoutTime.toISOString(),
            checkin_time: checkinTime.toISOString(),
            duration: parseInt(duration),
            total_cost: (session.amount_total || 0) / 100, // Convert cents to dollars
            status: 'confirmed',
            payment_id: session.payment_intent,
            metadata: {
              session_id: session.id,
              price_per_hour: parseFloat(pricePerHour || '0'),
            },
          });

        if (bookingError) {
          throw bookingError;
        }

        // Get lot owner and send notification
        const { data: location } = await supabase
          .from('locations')
          .select('owner_id, name')
          .eq('id', listingId)
          .single();

        if (location?.owner_id) {
          await sendPaymentNotification(location.owner_id, {
            location: location.name || 'Parking lot',
            amount: session.amount_total || 0,
            plate: plate || plateNumber || session.customer_details?.email || null,
            customerEmail: customerEmail || customer_email || session.customer_details?.email || null,
            startDate: startDate || null,
            startTime: startTime || null,
            duration: duration || null,
          });
        }

        console.log('Booking created successfully:', listingId);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session expired:', session.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
