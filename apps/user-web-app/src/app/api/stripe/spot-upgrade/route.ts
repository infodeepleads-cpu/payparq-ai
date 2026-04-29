import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function resolveStripeSecretKey(): string | null {
  const candidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_SECRET,
    process.env.STRIPE_PRIVATE_KEY,
  ];
  for (const raw of candidates) {
    const secret = (raw ?? '').trim().replace(/^['"]+|['"]+$/g, '');
    if (!secret || !/^sk_(test|live)_/i.test(secret)) continue;
    return secret;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: {
    stripe_session_id?: string;
    new_spot_id?: string;
    current_spot_id?: string;
    email?: string;
    location_id?: string;
    location_name?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { stripe_session_id, new_spot_id, current_spot_id, email, location_id, location_name } = body;

  if (!stripe_session_id || !new_spot_id) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const secret = resolveStripeSecretKey();
  if (!secret) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 500 });
  }

  const client = supabaseAdmin ?? supabase;
  if (!client) {
    return NextResponse.json({ error: 'db_unavailable' }, { status: 503 });
  }

  // Fetch the new spot to get price modifier
  const { data: spotRow } = await client
    .from('spots')
    .select('id,label,price_modifier_cents')
    .eq('id', new_spot_id)
    .single();

  const spot = spotRow as { id: string; label: string; price_modifier_cents: number } | null;
  if (!spot) {
    return NextResponse.json({ error: 'spot_not_found' }, { status: 404 });
  }
  if (spot.price_modifier_cents <= 0) {
    return NextResponse.json({ error: 'spot_not_premium' }, { status: 400 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://www.payparq.com';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email || undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: spot.price_modifier_cents,
        product_data: {
          name: `Premium spot ${spot.label}`,
          description: location_name ? `${location_name} — parking spot upgrade` : 'Parking spot upgrade',
        },
      },
    }],
    metadata: {
      flow_type: 'spot_upgrade',
      original_session_id: stripe_session_id,
      new_spot_id: new_spot_id,
      current_spot_id: current_spot_id ?? '',
      new_spot_label: spot.label,
      location_id: location_id ?? '',
    },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&spot_upgraded=1&original=${stripe_session_id}`,
    cancel_url: `${baseUrl}/success?session_id=${stripe_session_id}`,
  });

  return NextResponse.json({ url: session.url });
}
