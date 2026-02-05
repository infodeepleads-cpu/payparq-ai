import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseUrl } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'missing_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const body = await req.json().catch(() => ({} as { [key: string]: unknown }));
  const url = new URL(req.url);
  const location_id =
    (typeof body.location_id === 'string' && body.location_id) || url.searchParams.get('loc') || '';
  const plate_number = (typeof body.plate_number === 'string' && body.plate_number) || '';
  const flow_type =
    (typeof body.flow_type === 'string' && body.flow_type) || url.searchParams.get('flow') || 'park_now';
  let customer_email: string | undefined = undefined;
  if (typeof body === 'object' && body && 'customer_email' in body) {
    const v = (body as { customer_email?: unknown }).customer_email;
    if (typeof v === 'string') customer_email = v;
  }

  if (flow_type === 'setup') {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        success_url: `${url.origin}/success`,
        cancel_url: `${url.origin}/`,
        customer_email,
        payment_method_types: ['card'],
        setup_intent_data: {
          metadata: {
            location_id,
            plate_number,
            flow_type,
          },
        },
      });
      return NextResponse.json({ url: session.url });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'stripe_setup_failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (location_id) {
    const baseUrl = supabaseUrl || 'https://iafjygownkhedereaoxw.supabase.co';
    let type = 'hourly';
    if (flow_type === 'monthly') type = 'monthly';
    else if (flow_type === 'reserve') type = 'reserve';
    const params = new URLSearchParams();
    params.set('location_id', location_id);
    params.set('type', type);
    params.set('t', Date.now().toString());
    const redirectUrl = `${baseUrl.replace(/\/+$/, '')}/functions/v1/create-checkout?${params.toString()}`;
    return NextResponse.json({ url: redirectUrl });
  }

  let unitAmount = 500;
  if (location_id) {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client is not configured.' }, { status: 500 });
    }
    const { data } = await supabase
      .from('pricing_settings')
      .select('rules_text')
      .eq('location_id', location_id)
      .eq('active', true)
      .limit(1);
    const rules = data?.[0]?.rules_text as string | undefined;
    if (rules) {
      const match = rules.match(/\$?(\d+)\s*\/\s*hr/i);
      if (match) unitAmount = parseInt(match[1], 10) * 100;
    }
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      phone_number_collection: { enabled: true },
      success_url: `${url.origin}/success`,
      cancel_url: `${url.origin}/`,
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Parking Session' },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      customer_email,
      payment_intent_data: {
        metadata: {
          location_id,
          plate_number,
          flow_type,
        },
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'stripe_payment_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'missing_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const url = new URL(req.url);
  const location_id = url.searchParams.get('loc') || '';
  const plate_number = url.searchParams.get('plate') || '';
  const flow_type = url.searchParams.get('flow') || 'park_now';
  const customer_email = url.searchParams.get('email') || undefined;

  if (flow_type === 'setup') {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        success_url: `${url.origin}/success`,
        cancel_url: `${url.origin}/`,
        customer_email,
        payment_method_types: ['card'],
        setup_intent_data: {
          metadata: {
            location_id,
            plate_number,
            flow_type,
          },
        },
      });
      return NextResponse.redirect(session.url!, { status: 303 });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'stripe_setup_failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  let unitAmount = 500;
  if (location_id) {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client is not configured.' }, { status: 500 });
    }
    const { data } = await supabase
      .from('pricing_settings')
      .select('rules_text')
      .eq('location_id', location_id)
      .eq('active', true)
      .limit(1);
    const rules = data?.[0]?.rules_text as string | undefined;
    if (rules) {
      const match = rules.match(/\$?(\d+)\s*\/\s*hr/i);
      if (match) unitAmount = parseInt(match[1], 10) * 100;
    }
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      phone_number_collection: { enabled: true },
      success_url: `${url.origin}/success`,
      cancel_url: `${url.origin}/`,
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Parking Session' },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          location_id,
          plate_number,
          flow_type,
        },
      },
    });
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'stripe_payment_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
