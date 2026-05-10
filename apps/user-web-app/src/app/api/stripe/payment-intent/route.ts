import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function resolveStripeSecretKey(): string | null {
  const candidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_SECRET,
    process.env.STRIPE_PRIVATE_KEY,
    process.env.STRIPE_LIVE_SECRET_KEY,
    process.env.STRIPE_TEST_SECRET_KEY,
    process.env.NEXT_PRIVATE_STRIPE_SECRET_KEY,
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY,
  ];
  for (const rawValue of candidates) {
    const secret = (rawValue ?? '').trim().replace(/^['"]+|['"]+$/g, '');
    if (!secret) continue;
    if (!/^sk_(test|live)_/i.test(secret)) continue;
    if (/your_stripe|replace_me|changeme|example/i.test(secret)) continue;
    return secret;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const secretKey = resolveStripeSecretKey();
    if (!secretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-03-31.basil' as unknown as Stripe.LatestApiVersion,
    });

    const body = await req.json();
    const { location_id, amount_cents, check_in, check_out, description } = body;

    if (!location_id || !amount_cents || amount_cents < 50) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount_cents),
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      description: description || 'PayParq rezervacija parkinga',
      metadata: {
        location_id,
        check_in: check_in || '',
        check_out: check_out || '',
        source: 'user-web-app',
      },
    });

    return NextResponse.json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    console.error('PaymentIntent error:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
