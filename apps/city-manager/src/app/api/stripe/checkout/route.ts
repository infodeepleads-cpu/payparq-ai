import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const supabase: SupabaseClient | null = (() => {
  try {
    return getSupabase();
  } catch {
    return null;
  }
})();

export async function POST(req: NextRequest) {
  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'missing_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2026-02-25.clover' });
  const body = await req.json().catch(() => ({} as { [key: string]: unknown }));
  console.log('[Stripe Checkout] Request body:', body);
  const url = new URL(req.url);
  const location_id =
    (typeof body.location_id === 'string' && body.location_id) || url.searchParams.get('loc') || '';
  const display_id = (typeof body.display_id === 'string' && body.display_id) || '';
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
        success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
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

  // Parse check-in/out
  const check_in = (body.check_in as string) || url.searchParams.get('in') || '';
  const check_out = (body.check_out as string) || url.searchParams.get('out') || '';

  // Calculate quantity (hours)
  let quantity = 1;
  let reservationDescription = '';
  if (check_in && check_out) {
    const start = new Date(check_in);
    const end = new Date(check_out);
    const diff = end.getTime() - start.getTime();
    
    // Always format the description if dates are provided
    // Format helper that ignores timezone shifts by parsing the ISO string directly
    const formatIso = (iso: string) => {
      if (!iso) return '';
      try {
        const [datePart, timePart] = iso.split('T');
        const [y, m, d] = datePart.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d} ${months[parseInt(m) - 1]} ${y}, ${timePart}`;
      } catch {
        return iso;
      }
    };

    reservationDescription = `From: ${formatIso(check_in)} To: ${formatIso(check_out)}`;
    if (display_id) {
      reservationDescription += `\nLocation ID: ${display_id}`;
    }

    if (diff > 0) {
      quantity = Math.ceil(diff / (1000 * 60 * 60));
    }
  } else if (flow_type === 'park_now') {
    // For Park Now, we default to 1 hour but allow user to adjust
    quantity = 1;
    // We don't set reservationDescription with dates here because user selects quantity in Stripe
    // But we still want to show Location ID if available
    // Also show "Start Time" which is effectively "Now"
    
    // Helper to format Date
    const formatNow = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const timePart = d.toTimeString().slice(0, 5); // HH:MM
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${timePart}`;
    };
    
    const nowFormatted = formatNow(new Date());
    reservationDescription = `Start Time: ${nowFormatted}`;
    
    if (display_id) {
      reservationDescription += `\nLocation ID: ${display_id}`;
    }
    
    // We add a note about end time being dependent on quantity
    reservationDescription += `\n(End time depends on selected hours)`;
  }

  let unitAmount = 500;
  if (location_id) {
    if (!supabase) {
      console.warn('Supabase client is not configured. Using default pricing.');
    } else {
      try {
        const { data } = await supabase
          .from('locations')
          .select('base_price_hourly,dynamic_pricing_enabled,dynamic_pricing_ratio,surcharge_enabled,surcharge_multiplier')
          .eq('id', location_id)
          .single();
        
        if (data) {
          // base_price_hourly is in EUR, convert to cents
          let price = (data.base_price_hourly || 5) * 100;
          
          if (data.dynamic_pricing_enabled && data.dynamic_pricing_ratio) {
            price *= data.dynamic_pricing_ratio;
          }
          if (data.surcharge_enabled && data.surcharge_multiplier) {
            price *= data.surcharge_multiplier;
          }
          
          unitAmount = Math.round(price);
        }
      } catch (err) {
        console.error('Failed to fetch pricing from Supabase:', err);
      }
    }
  }
  try {
    // Attempt to create session with SEPA and Card
    const session = await createSession(['card', 'sepa_debit']);
    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '';
    // If SEPA is not enabled, retry with just Card
    if (message.includes('sepa_debit') || message.includes('payment method type')) {
      console.warn('SEPA not enabled, falling back to Card only');
      try {
        const session = await createSession(['card']);
        return NextResponse.json({ url: session.url });
      } catch (retryErr: unknown) {
        const retryMessage = retryErr instanceof Error ? retryErr.message : 'stripe_retry_failed';
        return NextResponse.json({ error: retryMessage }, { status: 400 });
      }
    }
    return NextResponse.json({ error: message || 'stripe_payment_failed' }, { status: 400 });
  }

  async function createSession(payment_method_types: Stripe.Checkout.SessionCreateParams.PaymentMethodType[]) {
    return await stripe.checkout.sessions.create({
      mode: 'payment',
      phone_number_collection: { enabled: true },
      success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/`,
      payment_method_types,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
              name: flow_type === 'park_now' ? 'Parking Session (Adjust Hours)' : (quantity > 1 ? `Parking Session (${quantity} Hours)` : 'Parking Session (1 Hour)'),
              description: reservationDescription || undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: quantity,
          adjustable_quantity: flow_type === 'park_now' ? { 
            enabled: true,
            minimum: 1,
            maximum: 24,
          } : {
            enabled: false,
          },
        },
      ],
      custom_text: {
        submit: {
          message: 'By paying, you agree to our [Terms of Service](https://www.payparq.com/terms) and [Privacy Policy](https://www.payparq.com/privacy).',
        },
      },
      custom_fields: [
        {
          key: 'plate_number',
          label: { type: 'custom', custom: 'License Plate Number (e.g. MA679XX)' },
          type: 'text',
          optional: false,
        },
      ],
      customer_email,
      payment_intent_data: {
        metadata: {
          location_id,
          plate_number,
          flow_type,
          check_in,
          check_out,
        },
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'missing_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2026-02-25.clover' });
  const url = new URL(req.url);
  const location_id = url.searchParams.get('loc') || '';
  const plate_number = url.searchParams.get('plate') || '';
  const flow_type = url.searchParams.get('flow') || 'park_now';
  const customer_email = url.searchParams.get('email') || undefined;

  if (flow_type === 'setup') {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
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
      success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/`,
      payment_method_types: ['card'],
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
