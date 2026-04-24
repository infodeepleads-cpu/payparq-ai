import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim() ?? '';
  if (!sessionId) return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });

  const secret = resolveStripeSecretKey();
  if (!secret) return NextResponse.json({ error: 'stripe_not_configured' }, { status: 500 });

  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const meta = session.metadata ?? {};

  // Fetch addons_config from the location for pickup point / phone
  let pickupPoint: { lat?: number; lng?: number; label?: string } | null = null;
  let phoneSms: string | null = null;
  const locationId = (meta.location_id ?? '').trim();
  if (locationId) {
    const client = supabaseAdmin ?? supabase;
    if (client) {
      const { data: locRow } = await client
        .from('locations')
        .select('addons_config')
        .eq('id', locationId)
        .maybeSingle();
      const cfg = (locRow as { addons_config?: Record<string, unknown> | null } | null)?.addons_config ?? null;
      if (cfg) {
        pickupPoint = (cfg.pickup_point as { lat?: number; lng?: number; label?: string } | null) ?? null;
        phoneSms = (cfg.phone_sms as string | null) ?? null;
      }
    }
  }

  return NextResponse.json({
    session_id: session.id,
    flow_type: meta.flow_type ?? null,
    email: session.customer_details?.email ?? null,
    amount_total: session.amount_total ?? 0,
    currency: session.currency ?? 'eur',
    location_name: meta.location_name ?? null,
    location_display_id: meta.location_display_id ?? null,
    valet_code: meta.valet_code ?? null,
    addons: meta.addons ?? null,
    original_session_id: meta.original_session_id ?? null,
    pickup_point: pickupPoint,
    phone_sms: phoneSms,
  });
}
