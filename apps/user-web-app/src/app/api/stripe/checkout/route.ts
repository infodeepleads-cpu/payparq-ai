import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveScannerTruthPriceEuro } from '@/lib/locationPricing';

type PricingType = 'hourly' | 'daily' | 'monthly';
const unifiedStripeSuccessUrl = 'https://www.payparq.com/success?session_id={CHECKOUT_SESSION_ID}';
const unifiedStripeCancelUrl = 'https://www.payparq.com/success';

function parseBooleanFlag(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function normalizePricingType(rawType: string | null | undefined, flowType: string): PricingType {
  if (rawType === 'daily') return 'daily';
  if (rawType === 'monthly') return 'monthly';
  if (flowType === 'monthly') return 'monthly';
  return 'hourly';
}

function buildSwitchCheckoutUrl(params: {
  baseUrl: string;
  locationId: string;
  displayId: string;
  flowType: string;
  targetType: PricingType;
  customerEmail?: string;
  allowPromotionCodes: boolean;
}) {
  const { baseUrl, locationId, displayId, flowType, targetType, customerEmail, allowPromotionCodes } = params;
  const switchUrl = new URL('/api/stripe/checkout', baseUrl);
  switchUrl.searchParams.set('location_id', locationId);
  if (displayId) {
    switchUrl.searchParams.set('display_id', displayId);
  }
  if (flowType) {
    switchUrl.searchParams.set('flow', flowType);
  }
  switchUrl.searchParams.set('type', targetType);
  if (customerEmail) {
    switchUrl.searchParams.set('email', customerEmail);
  }
  if (allowPromotionCodes) {
    switchUrl.searchParams.set('allow_promotion_codes', '1');
  }
  return switchUrl.toString();
}

function buildSubmitMessage(params: {
  pricingType: PricingType;
  baseUrl: string;
  locationId: string;
  displayId: string;
  flowType: string;
  customerEmail?: string;
  allowPromotionCodes: boolean;
}) {
  const termsLine =
    'By paying, you agree to our [Terms of Service](https://www.payparq.com/terms) and [Privacy Policy](https://www.payparq.com/privacy).';
  if (params.pricingType === 'daily') {
    const hourlyUrl = buildSwitchCheckoutUrl({
      baseUrl: params.baseUrl,
      locationId: params.locationId,
      displayId: params.displayId,
      flowType: params.flowType,
      targetType: 'hourly',
      customerEmail: params.customerEmail,
      allowPromotionCodes: params.allowPromotionCodes,
    });
    return `Need hourly for this location? [Open hourly checkout](${hourlyUrl})\n${termsLine}`;
  }
  if (params.pricingType === 'hourly') {
    const dailyUrl = buildSwitchCheckoutUrl({
      baseUrl: params.baseUrl,
      locationId: params.locationId,
      displayId: params.displayId,
      flowType: params.flowType,
      targetType: 'daily',
      customerEmail: params.customerEmail,
      allowPromotionCodes: params.allowPromotionCodes,
    });
    return `Need daily for this location? [Open daily checkout](${dailyUrl})\n${termsLine}`;
  }
  return termsLine;
}

async function resolveUnitAmountCents(locationId: string, pricingType: PricingType): Promise<number> {
  if (!supabase) {
    throw { status: 500, message: 'supabase_not_configured' };
  }
  const { data, error } = await supabase
    .from('locations')
    .select(
      'rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly,rate_per_hour_floor,rate_per_hour_ceiling,base_price_daily_floor,base_price_daily_ceiling,base_price_monthly_floor,base_price_monthly_ceiling'
    )
    .eq('id', locationId)
    .maybeSingle();
  if (error) {
    throw { status: 500, message: error.message };
  }
  if (!data) {
    throw { status: 404, message: 'location_not_found' };
  }
  const resolvedEuro = resolveScannerTruthPriceEuro(data, pricingType);
  const resolvedCents = Math.round(resolvedEuro * 100);
  if (!Number.isFinite(resolvedCents) || resolvedCents < 0) {
    throw { status: 500, message: 'invalid_resolved_amount' };
  }
  return resolvedCents;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'missing_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const body = await req.json().catch(() => ({} as { [key: string]: unknown }));
  console.log('[Stripe Checkout] Request body:', body);
  const url = new URL(req.url);
  const location_id =
    (typeof body.location_id === 'string' && body.location_id) ||
    url.searchParams.get('loc') ||
    url.searchParams.get('location_id') ||
    '';
  const display_id =
    (typeof body.display_id === 'string' && body.display_id) || url.searchParams.get('display_id') || '';
  const plate_number = (typeof body.plate_number === 'string' && body.plate_number) || '';
  const flow_type =
    (typeof body.flow_type === 'string' && body.flow_type) || url.searchParams.get('flow') || 'park_now';
  const rawPricingType =
    (typeof body.type === 'string' && body.type) || url.searchParams.get('type') || null;
  const pricing_type = normalizePricingType(rawPricingType, flow_type);
  const allowPromotionCodes =
    (typeof body.allow_promotion_codes === 'boolean' && body.allow_promotion_codes) ||
    parseBooleanFlag(url.searchParams.get('allow_promotion_codes'));
  const hasTamperedAmountParams =
    (typeof body === 'object' &&
      body !== null &&
      ('price' in body || 'amount' in body || 'amount_cents' in body)) ||
    url.searchParams.has('price') ||
    url.searchParams.has('amount') ||
    url.searchParams.has('amount_cents');
  let customer_email: string | undefined = undefined;
  if (typeof body === 'object' && body && 'customer_email' in body) {
    const v = (body as { customer_email?: unknown }).customer_email;
    if (typeof v === 'string') customer_email = v;
  }
  const submitMessage = buildSubmitMessage({
    pricingType: pricing_type,
    baseUrl: url.origin,
    locationId: location_id,
    displayId: display_id,
    flowType: flow_type,
    customerEmail: customer_email,
    allowPromotionCodes,
  });

  if (flow_type === 'setup') {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        success_url: unifiedStripeSuccessUrl,
        cancel_url: unifiedStripeCancelUrl,
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

  if (hasTamperedAmountParams) {
    console.warn('[Stripe Checkout] Ignoring client-provided amount params', {
      location_id,
      pricing_type,
    });
  }

  if (!location_id) {
    return NextResponse.json({ error: 'missing_location_id' }, { status: 400 });
  }

  /* 
   * Bypass Supabase Function redirect to handle reservation logic locally
   * and include custom text/metadata as requested.
   */
  // if (location_id) {
  //   const baseUrl = supabaseUrl || 'https://iafjygownkhedereaoxw.supabase.co';
  //   let type = 'hourly';
  //   if (flow_type === 'monthly') type = 'monthly';
  //   else if (flow_type === 'reserve') type = 'reserve';
  //   const params = new URLSearchParams();
  //   params.set('location_id', location_id);
  //   params.set('type', type);
  //   params.set('t', Date.now().toString());
  //   const redirectUrl = `${baseUrl.replace(/\/+$/, '')}/functions/v1/create-checkout?${params.toString()}`;
  //   return NextResponse.json({ url: redirectUrl });
  // }

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

  let unitAmount = 0;
  try {
    unitAmount = await resolveUnitAmountCents(location_id, pricing_type);
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const message =
      typeof error === 'object' && error && 'message' in error ? String(error.message) : 'pricing_resolution_failed';
    return NextResponse.json({ error: message }, { status });
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
      success_url: unifiedStripeSuccessUrl,
      cancel_url: unifiedStripeCancelUrl,
      payment_method_types,
      allow_promotion_codes: allowPromotionCodes,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
              name:
                pricing_type === 'daily'
                  ? 'Parking Session (Daily)'
                  : pricing_type === 'monthly'
                    ? 'Parking Session (Monthly)'
                    : flow_type === 'park_now'
                      ? 'Parking Session (Adjust Hours)'
                      : quantity > 1
                        ? `Parking Session (${quantity} Hours)`
                        : 'Parking Session (1 Hour)',
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
          message: submitMessage,
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
          display_id,
          plate_number,
          flow_type,
          pricing_type,
          check_in,
          check_out,
        },
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'missing_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const url = new URL(req.url);
  const location_id = url.searchParams.get('loc') || url.searchParams.get('location_id') || '';
  const display_id = url.searchParams.get('display_id') || '';
  const plate_number = url.searchParams.get('plate') || '';
  const flow_type = url.searchParams.get('flow') || 'park_now';
  const pricing_type = normalizePricingType(url.searchParams.get('type'), flow_type);
  const allowPromotionCodes = parseBooleanFlag(url.searchParams.get('allow_promotion_codes'));
  const customer_email = url.searchParams.get('email') || undefined;
  const submitMessage = buildSubmitMessage({
    pricingType: pricing_type,
    baseUrl: url.origin,
    locationId: location_id,
    displayId: display_id,
    flowType: flow_type,
    customerEmail: customer_email,
    allowPromotionCodes,
  });
  const hasTamperedAmountParams =
    url.searchParams.has('price') ||
    url.searchParams.has('amount') ||
    url.searchParams.has('amount_cents');

  if (flow_type === 'setup') {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        success_url: unifiedStripeSuccessUrl,
        cancel_url: unifiedStripeCancelUrl,
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

  if (hasTamperedAmountParams) {
    console.warn('[Stripe Checkout GET] Ignoring client-provided amount params', {
      location_id,
      pricing_type,
    });
  }

  if (!location_id) {
    return NextResponse.json({ error: 'missing_location_id' }, { status: 400 });
  }

  let unitAmount = 0;
  try {
    unitAmount = await resolveUnitAmountCents(location_id, pricing_type);
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const message =
      typeof error === 'object' && error && 'message' in error ? String(error.message) : 'pricing_resolution_failed';
    return NextResponse.json({ error: message }, { status });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      phone_number_collection: { enabled: true },
      success_url: unifiedStripeSuccessUrl,
      cancel_url: unifiedStripeCancelUrl,
      payment_method_types: ['card'],
      allow_promotion_codes: allowPromotionCodes,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name:
                pricing_type === 'daily'
                  ? 'Parking Session (Daily)'
                  : pricing_type === 'monthly'
                    ? 'Parking Session (Monthly)'
                    : 'Parking Session (Hourly)',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      custom_text: {
        submit: {
          message: submitMessage,
        },
      },
      payment_intent_data: {
        metadata: {
          location_id,
          display_id,
          plate_number,
          flow_type,
          pricing_type,
        },
      },
    });
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'stripe_payment_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
