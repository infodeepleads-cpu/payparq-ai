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
        const meta = session.metadata || {};

        // New-format checkout (from /api/stripe/checkout)
        const locationId = meta.location_id || meta.listingId || '';
        const chargedCents = parseInt(meta.charged_amount_cents || '0') || (session.amount_total || 0);
        const commissionRate = parseFloat(meta.lot_commission_rate || '0.15');
        const plate = meta.plate_number || meta.plate || meta.plateNumber || '';
        const customerEmail = meta.customer_email || meta.customerEmail || session.customer_details?.email || '';

        if (locationId) {
          const { data: location } = await supabase
            .from('locations')
            .select('owner_id, name')
            .eq('id', locationId)
            .maybeSingle();

          if (location?.owner_id) {
            // Calculate ledger amounts
            // Stripe fee: ~2.9% + €0.30
            const stripeFee = Math.round(chargedCents * 0.029) + 30;
            const afterStripeFee = chargedCents - stripeFee;
            // Service fee: €0.99 + 5% of charged amount (always to PayParq)
            const serviceFee = 99 + Math.round(chargedCents * 0.05);
            const distributable = Math.max(0, afterStripeFee - serviceFee);
            // Owner gets (1 - commissionRate) of distributable
            const ownerReserved = Math.round(distributable * (1 - commissionRate));
            const payparqReserved = distributable - ownerReserved;

            await supabase.from('owner_ledger').insert({
              owner_id: location.owner_id,
              location_id: locationId,
              stripe_session_id: session.id,
              stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
              charged_amount_cents: chargedCents,
              stripe_fee_cents: stripeFee,
              service_fee_cents: serviceFee,
              commission_rate: commissionRate,
              owner_reserved_cents: ownerReserved,
              payparq_reserved_cents: payparqReserved,
              flow_type: meta.flow_type || '',
              pricing_type: meta.pricing_type || '',
              check_in: meta.check_in || '',
              check_out: meta.check_out || '',
              status: 'reserved',
            });

            await sendPaymentNotification(location.owner_id, {
              location: location.name || 'Parking lot',
              amount: chargedCents,
              plate: plate || null,
              customerEmail: customerEmail || null,
              startDate: meta.check_in || meta.startDate || null,
              startTime: meta.startTime || null,
              duration: meta.duration || null,
            });

            console.log('[webhook] Ledger entry created for owner:', location.owner_id);
          }
        }

        console.log('[webhook] checkout.session.completed:', session.id);
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
