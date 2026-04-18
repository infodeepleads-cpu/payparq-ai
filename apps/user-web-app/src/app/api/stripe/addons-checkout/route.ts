import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AddonItem = {
  id: string;       // e.g. 'valet', 'ev_charging', 'car_wash_basic', 'fuel_diesel'
  label: string;
  price_cents: number;
  quantity?: number;
};

function resolveStripeSecretKey(): string | null {
  const candidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_SECRET,
    process.env.STRIPE_PRIVATE_KEY,
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

function generateValetCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VLT-${num}`;
}

export async function POST(req: NextRequest) {
  let body: {
    session_id?: string;
    location_id?: string;
    location_display_id?: string;
    location_name?: string;
    email?: string;
    addons: AddonItem[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { session_id, location_id, location_display_id, location_name, email, addons } = body;

  if (!addons || addons.length === 0) {
    return NextResponse.json({ error: 'no_addons_selected' }, { status: 400 });
  }

  const secret = resolveStripeSecretKey();
  if (!secret) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = addons.map((addon) => ({
    quantity: addon.quantity ?? 1,
    price_data: {
      currency: 'eur',
      unit_amount: addon.price_cents,
      product_data: {
        name: addon.label,
        metadata: { addon_id: addon.id },
      },
    },
  }));

  const valetAddon = addons.find((a) => a.id === 'valet');
  const valetCode = valetAddon ? generateValetCode() : undefined;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://www.payparq.com';
  const successUrl = `${baseUrl}/success/addons?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/success${session_id ? `?session_id=${session_id}` : ''}`;

  const addonsSummary = addons.map((a) => `${a.id}:${a.quantity ?? 1}`).join(',');

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email || undefined,
    metadata: {
      flow_type: 'addons',
      original_session_id: session_id ?? '',
      location_id: location_id ?? '',
      location_display_id: location_display_id ?? '',
      location_name: location_name ?? '',
      addons: addonsSummary,
      ...(valetCode ? { valet_code: valetCode } : {}),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
