import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      listingId,
      listingName,
      startDate,
      startTime,
      duration,
      pricePerHour,
      subtotal,
      fees,
      total,
    } = body;

    // Validate required fields
    if (!listingId || !listingName || !total) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const origin = request.nextUrl.origin || 'https://payparq.app';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: listingName,
              description: `Parking for ${duration} hours starting ${startDate} at ${startTime}`,
              metadata: {
                listingId,
                startDate,
                startTime,
                duration,
              },
            },
            unit_amount: Math.round(total * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/search`,
      metadata: {
        listingId,
        startDate,
        startTime,
        duration: duration.toString(),
        pricePerHour: pricePerHour.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
