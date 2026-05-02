import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-15',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

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
