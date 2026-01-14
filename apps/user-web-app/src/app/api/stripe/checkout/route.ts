import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
  const body = await req.json().catch(() => ({}));
  const url = new URL(req.url);
  const location_id = (body.location_id as string) || url.searchParams.get('loc') || '';
  const plate_number = (body.plate_number as string) || '';
  let unitAmount = 500;
  if (location_id) {
    const { data } = await supabase.from('pricing_settings').select('rules_text').eq('location_id', location_id).eq('active', true).limit(1);
    const rules = data?.[0]?.rules_text as string | undefined;
    if (rules) {
      const match = rules.match(/\$?(\d+)\s*\/\s*hr/i);
      if (match) unitAmount = parseInt(match[1], 10) * 100;
    }
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    phone_number_collection: { enabled: true },
    success_url: `${url.origin}/success`,
    cancel_url: `${url.origin}/`,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Parking Session' },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    customer_email: body.customer_email || undefined,
    payment_intent_data: {
      metadata: {
        location_id,
        plate_number,
      },
    },
  });
  return NextResponse.json({ url: session.url });
}

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
  const url = new URL(req.url);
  const location_id = url.searchParams.get('loc') || '';
  const plate_number = url.searchParams.get('plate') || '';
  let unitAmount = 500;
  if (location_id) {
    const { data } = await supabase.from('pricing_settings').select('rules_text').eq('location_id', location_id).eq('active', true).limit(1);
    const rules = data?.[0]?.rules_text as string | undefined;
    if (rules) {
      const match = rules.match(/\$?(\d+)\s*\/\s*hr/i);
      if (match) unitAmount = parseInt(match[1], 10) * 100;
    }
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    phone_number_collection: { enabled: true },
    success_url: `${url.origin}/success`,
    cancel_url: `${url.origin}/`,
    line_items: [
      {
        price_data: {
          currency: 'usd',
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
      },
    },
  });
  return NextResponse.redirect(session.url!, { status: 303 });
}
