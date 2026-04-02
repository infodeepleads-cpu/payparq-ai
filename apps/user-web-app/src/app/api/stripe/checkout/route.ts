import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { resolveParkTaxiPriceEuro, resolveScannerTruthPriceEuro } from '@/lib/locationPricing';

type PricingType = 'hourly' | 'daily' | 'monthly';
const unifiedStripeSuccessUrl = 'https://www.payparq.com/success?session_id={CHECKOUT_SESSION_ID}';
const unifiedStripeCancelUrl = 'https://www.payparq.com/success';

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
    const secret = (rawValue ?? '')
      .trim()
      .replace(/^['"]+|['"]+$/g, '');
    if (!secret) continue;
    if (!/^sk_(test|live)_/i.test(secret)) continue;
    if (/your_stripe|replace_me|changeme|example/i.test(secret)) continue;
    return secret;
  }
  return null;
}

function buildSupabaseFunctionCheckoutUrl(params: {
  locationId: string;
  displayId?: string;
  flowType: string;
  pricingType: PricingType;
  checkIn?: string;
  checkOut?: string;
  quantity?: number;
  reservationDescription?: string;
  allowPromotionCodes: boolean;
  customerEmail?: string;
}): string | null {
  const supabaseBase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').trim();
  if (!supabaseBase) return null;
  const url = new URL('/functions/v1/create-checkout', supabaseBase.replace(/\/+$/, ''));
  url.searchParams.set('location_id', params.locationId);
  if (params.displayId) {
    url.searchParams.set('display_id', params.displayId);
  }
  if (params.flowType) {
    url.searchParams.set('flow', params.flowType);
  }
  if (params.flowType === 'park_now') {
    url.searchParams.set('park_taxi', '1');
  }
  url.searchParams.set('type', params.pricingType);
  if (params.checkIn) {
    url.searchParams.set('check_in', params.checkIn);
  }
  if (params.checkOut) {
    url.searchParams.set('check_out', params.checkOut);
  }
  if (typeof params.quantity === 'number' && Number.isFinite(params.quantity) && params.quantity > 0) {
    url.searchParams.set('quantity', String(Math.max(1, Math.ceil(params.quantity))));
  }
  const trimmedDescription = (params.reservationDescription ?? '').trim();
  if (trimmedDescription) {
    url.searchParams.set('description', trimmedDescription);
    url.searchParams.set('reservation_description', trimmedDescription);
  }
  if (params.customerEmail) {
    url.searchParams.set('email', params.customerEmail);
  }
  url.searchParams.set('allow_promotion_codes', params.allowPromotionCodes ? '1' : '0');
  url.searchParams.set('t', Date.now().toString());
  return url.toString();
}

function buildSuccessUrl(params: {
  locationId?: string;
  displayId?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const url = new URL('https://www.payparq.com/success');
  url.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
  if (params.locationId) {
    url.searchParams.set('location_id', params.locationId);
  }
  if (params.displayId) {
    url.searchParams.set('display_id', params.displayId);
  }
  if (params.checkIn) {
    url.searchParams.set('check_in', params.checkIn);
  }
  if (params.checkOut) {
    url.searchParams.set('check_out', params.checkOut);
  }
  return url.toString();
}

function normalizeEmailValue(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

async function resolveStripeCustomerIdByEmail(
  stripe: Stripe,
  email: string | null
): Promise<string | null> {
  if (!email) return null;
  try {
    const list = await stripe.customers.list({
      email,
      limit: 10,
    });
    const exact = list.data.find(
      (customer) => (customer.email ?? '').trim().toLowerCase() === email
    );
    return exact?.id ?? list.data[0]?.id ?? null;
  } catch {
    return null;
  }
}

function buildCheckoutCustomerParams(params: {
  customerId: string | null;
  customerEmail: string | null;
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  'customer' | 'customer_email' | 'customer_creation'
> {
  if (params.customerId) {
    return { customer: params.customerId };
  }
  if (params.customerEmail) {
    return {
      customer_email: params.customerEmail,
      customer_creation: 'always',
    };
  }
  return {};
}

function parseOptionalBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  return undefined;
}

function resolveAllowPromotionCodesDefaultOn(bodyValue: unknown, queryValue: string | null | undefined): boolean {
  const bodyResolved = parseOptionalBooleanValue(bodyValue);
  if (bodyResolved !== undefined) return bodyResolved;
  const queryResolved = parseOptionalBooleanValue(queryValue);
  if (queryResolved !== undefined) return queryResolved;
  return true;
}

function formatBerlinDateTime(value: Date): string {
  try {
    const dateParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(value);
    const tzFormatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      timeZoneName: 'short',
    }).format(value);
    const tzMatch = tzFormatted.match(/\b(CET|CEST)\b/i);
    const tz = (tzMatch?.[1] ?? 'CET').toUpperCase();
    const get = (type: string) => dateParts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} ${tz}`;
  } catch {
    return `${value.toISOString().replace('T', ' ').split('.')[0]} CET`;
  }
}

function normalizePricingType(rawType: string | null | undefined, flowType: string): PricingType {
  if (rawType === 'daily') return 'daily';
  if (rawType === 'monthly') return 'monthly';
  if (flowType === 'park_now') return 'daily';
  if (flowType === 'monthly') return 'monthly';
  return 'hourly';
}

function validateParkTaxiReservationWindow(flowType: string, checkIn: string, checkOut: string): string | null {
  if (flowType !== 'park_now') return null;
  if (!checkIn || !checkOut) {
    return 'park_taxi_requires_check_in_and_check_out';
  }
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'invalid_check_in_or_check_out';
  }
  if (end.getTime() <= start.getTime()) {
    return 'check_out_must_be_after_check_in';
  }
  if (start.getTime() < Date.now() + 60 * 60 * 1000) {
    return 'park_taxi_requires_60_min_advance';
  }
  return null;
}

function exceedsOneDayDuration(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return end.getTime() - start.getTime() > 24 * 60 * 60 * 1000;
}

function formatCheckoutIso(iso: string): string {
  if (!iso) return '';
  try {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return formatBerlinDateTime(parsed);
    }
    return iso;
  } catch {
    return iso;
  }
}

function buildFallbackCheckoutDetails(params: {
  flowType: string;
  pricingType: PricingType;
  checkIn: string;
  checkOut: string;
  displayId: string;
}) {
  const isParkTaxiFlow = params.flowType === 'park_now';
  const isReserveDailyFlow = params.flowType === 'reserve' && params.pricingType === 'daily';
  let quantity = 1;
  let reservationDescription = '';
  if (params.checkIn && params.checkOut) {
    const start = new Date(params.checkIn);
    const end = new Date(params.checkOut);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      quantity = isParkTaxiFlow || isReserveDailyFlow
        ? Math.ceil(diff / (1000 * 60 * 60 * 24))
        : Math.ceil(diff / (1000 * 60 * 60));
    }
    reservationDescription = `From: ${formatCheckoutIso(params.checkIn)} To: ${formatCheckoutIso(params.checkOut)}`;
    if (params.displayId) {
      reservationDescription += `\nLocation ID: ${params.displayId}`;
    }
  } else if (isParkTaxiFlow) {
    reservationDescription = `Start Time: ${formatBerlinDateTime(new Date())}`;
    if (params.displayId) {
      reservationDescription += `\nLocation ID: ${params.displayId}`;
    }
  }
  return { quantity: Math.max(1, quantity), reservationDescription };
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
  switchUrl.searchParams.set('allow_promotion_codes', allowPromotionCodes ? '1' : '0');
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

type LocationPricingResolution = {
  unitAmountCents: number;
  resolvedLocationId: string;
  resolvedDisplayId: string;
  resolvedLocationName: string;
};

async function resolveLocationPricing(
  locationId: string,
  displayId: string,
  pricingType: PricingType,
  flowType: string
): Promise<LocationPricingResolution> {
  if (!supabase) {
    throw { status: 500, message: 'supabase_not_configured' };
  }

  const selectedColumns =
    'id,display_id,name,verification_metadata,rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly,rate_per_hour_floor,rate_per_hour_ceiling,base_price_daily_floor,base_price_daily_ceiling,base_price_monthly_floor,base_price_monthly_ceiling';

  const fallbackDisplayId = displayId || locationId;
  let data: Record<string, unknown> | null = null;
  if (fallbackDisplayId) {
    const byDisplayId = await supabase
      .from('locations')
      .select(selectedColumns)
      .eq('display_id', fallbackDisplayId)
      .maybeSingle();
    if (byDisplayId.error) {
      throw { status: 500, message: byDisplayId.error.message };
    }
    data = byDisplayId.data;
  }

  if (!data && locationId) {
    const byId = await supabase
      .from('locations')
      .select(selectedColumns)
      .eq('id', locationId)
      .maybeSingle();
    if (byId.error) {
      throw { status: 500, message: byId.error.message };
    }
    data = byId.data;
  }

  if (!data) {
    throw { status: 404, message: 'location_not_found' };
  }

  const isParkTaxiFlow = flowType === 'park_now';
  const parkTaxiEuro = isParkTaxiFlow ? resolveParkTaxiPriceEuro(data) : 0;
  const resolvedEuro = parkTaxiEuro > 0 ? parkTaxiEuro : resolveScannerTruthPriceEuro(data, pricingType);
  const resolvedCents = Math.round(resolvedEuro * 100);
  if (!Number.isFinite(resolvedCents) || resolvedCents < 0) {
    throw { status: 500, message: 'invalid_resolved_amount' };
  }
  return {
    unitAmountCents: resolvedCents,
    resolvedLocationId: String(data.id ?? locationId),
    resolvedDisplayId: String(data.display_id ?? displayId ?? ''),
    resolvedLocationName: String(data.name ?? '').trim(),
  };
}

export async function POST(req: NextRequest) {
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
  const check_in = (body.check_in as string) || url.searchParams.get('in') || '';
  const check_out = (body.check_out as string) || url.searchParams.get('out') || '';
  const rawPricingType =
    (typeof body.type === 'string' && body.type) || url.searchParams.get('type') || null;
  const normalizedPricingType = normalizePricingType(rawPricingType, flow_type);
  const pricing_type: PricingType =
    flow_type === 'reserve' && exceedsOneDayDuration(check_in, check_out) ? 'daily' : normalizedPricingType;
  const shouldAutoFillHourlyWindow =
    pricing_type === 'hourly' && flow_type === 'reserve' && !check_in && !check_out;
  const effectiveCheckIn = shouldAutoFillHourlyWindow ? new Date().toISOString() : check_in;
  const effectiveCheckOut = shouldAutoFillHourlyWindow
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : check_out;
  const allowPromotionCodes = resolveAllowPromotionCodesDefaultOn(
    (body as { allow_promotion_codes?: unknown }).allow_promotion_codes,
    url.searchParams.get('allow_promotion_codes')
  );
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
  const secret = resolveStripeSecretKey();
  if (!secret) {
    const fallbackCheckoutDetails = buildFallbackCheckoutDetails({
      flowType: flow_type,
      pricingType: pricing_type,
      checkIn: effectiveCheckIn,
      checkOut: effectiveCheckOut,
      displayId: display_id,
    });
    const fallbackUrl = location_id
      ? buildSupabaseFunctionCheckoutUrl({
          locationId: location_id,
          displayId: display_id || undefined,
          flowType: flow_type,
          pricingType: pricing_type,
          checkIn: effectiveCheckIn || undefined,
          checkOut: effectiveCheckOut || undefined,
          quantity: fallbackCheckoutDetails.quantity,
          reservationDescription: fallbackCheckoutDetails.reservationDescription,
          allowPromotionCodes,
          customerEmail: customer_email,
        })
      : null;
    if (fallbackUrl) {
      return NextResponse.json({ url: fallbackUrl });
    }
    return NextResponse.json({ error: 'missing_or_invalid_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const normalizedCustomerEmail = normalizeEmailValue(customer_email ?? url.searchParams.get('email'));
  const existingCustomerId = await resolveStripeCustomerIdByEmail(stripe, normalizedCustomerEmail);
  const checkoutCustomerParams = buildCheckoutCustomerParams({
    customerId: existingCustomerId,
    customerEmail: normalizedCustomerEmail,
  });
  if (flow_type === 'setup') {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        success_url: unifiedStripeSuccessUrl,
        cancel_url: unifiedStripeCancelUrl,
        ...checkoutCustomerParams,
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

  const parkTaxiWindowError = validateParkTaxiReservationWindow(
    flow_type,
    effectiveCheckIn,
    effectiveCheckOut
  );
  if (parkTaxiWindowError) {
    return NextResponse.json({ error: parkTaxiWindowError }, { status: 400 });
  }

  const isParkTaxiFlow = flow_type === 'park_now';
  const isReserveDailyFlow = flow_type === 'reserve' && pricing_type === 'daily';
  let quantity = 1;
  let reservationDescription = '';
  const formatIso = (iso: string) => {
    if (!iso) return '';
    try {
      const parsed = new Date(iso);
      if (!Number.isNaN(parsed.getTime())) {
        return formatBerlinDateTime(parsed);
      }
      return iso;
    } catch {
      return iso;
    }
  };
  const formatIsoNoSeconds = (iso: string) => formatIso(iso).replace(/:(\d{2}) CET$/, ' CET');
  const formatTimeShort = (iso: string) => {
    const formatted = formatIso(iso);
    const match = formatted.match(/\b(\d{2}):(\d{2})(?::\d{2})?\sCET$/);
    if (match) return `${match[1]}:${match[2]}`;
    return '';
  };
  if (check_in && check_out) {
    const start = new Date(check_in);
    const end = new Date(check_out);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      quantity = isParkTaxiFlow || isReserveDailyFlow
        ? Math.ceil(diff / (1000 * 60 * 60 * 24))
        : Math.ceil(diff / (1000 * 60 * 60));
    }
  } else if (isParkTaxiFlow) {
    quantity = 1;
    const nowFormatted = formatBerlinDateTime(new Date());
    reservationDescription = `Start Time: ${nowFormatted}`;
    if (display_id) {
      reservationDescription += `\nLocation ID: ${display_id}`;
    }
    reservationDescription += `\n(End time depends on selected days)`;
  }

  let unitAmount = 0;
  let resolvedLocationId = location_id;
  let resolvedDisplayId = display_id;
  let resolvedLocationName = '';
  try {
    const pricingResolution = await resolveLocationPricing(location_id, display_id, pricing_type, flow_type);
    unitAmount = pricingResolution.unitAmountCents;
    resolvedLocationId = pricingResolution.resolvedLocationId;
    resolvedDisplayId = pricingResolution.resolvedDisplayId;
    resolvedLocationName = pricingResolution.resolvedLocationName;
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const message =
      typeof error === 'object' && error && 'message' in error ? String(error.message) : 'pricing_resolution_failed';
    return NextResponse.json({ error: message }, { status });
  }
  if (effectiveCheckIn && effectiveCheckOut) {
    if (isParkTaxiFlow) {
      const locationTitle = resolvedLocationName || 'Safe Parking by PayParq Split Airport/Trogir';
      const locationIdLabel = resolvedDisplayId || display_id || resolvedLocationId || location_id || '—';
      const totalAmountEuro = ((unitAmount * quantity) / 100).toFixed(2);
      const firstRideTime = formatTimeShort(effectiveCheckIn) || '--:--';
      reservationDescription = `${locationTitle} • ID ${locationIdLabel} • Od ${formatIsoNoSeconds(effectiveCheckIn)} • Do ${formatIsoNoSeconds(effectiveCheckOut)} • Ukupno €${totalAmountEuro} • Prva vožnja ${firstRideTime} • Uključeno ${quantity} ${quantity === 1 ? 'dan' : 'dana'} parkinga + 2 vožnje dnevno • Povratak aktiviraj 15 min prije.`;
    } else {
      reservationDescription = `From: ${formatIso(effectiveCheckIn)} To: ${formatIso(effectiveCheckOut)}`;
      if (resolvedDisplayId || display_id) {
        reservationDescription += `\nLocation ID: ${resolvedDisplayId || display_id}`;
      }
    }
  }
  const submitMessageBase = buildSubmitMessage({
    pricingType: pricing_type,
    baseUrl: url.origin,
    locationId: resolvedLocationId,
    displayId: resolvedDisplayId,
    flowType: flow_type,
    customerEmail: customer_email,
    allowPromotionCodes,
  });
  const submitMessage = reservationDescription
    ? `${reservationDescription}\n${submitMessageBase}`
    : submitMessageBase;
  const checkoutSuccessUrl = buildSuccessUrl({
    locationId: resolvedLocationId,
    displayId: resolvedDisplayId,
    checkIn: effectiveCheckIn || undefined,
    checkOut: effectiveCheckOut || undefined,
  });
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
      success_url: checkoutSuccessUrl,
      cancel_url: unifiedStripeCancelUrl,
      payment_method_types,
      allow_promotion_codes: allowPromotionCodes,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { 
              name:
                isParkTaxiFlow
                  ? quantity > 1
                    ? `Park & Taxi Package (${quantity} Days)`
                    : 'Park & Taxi Package (1 Day)'
                  : pricing_type === 'daily'
                  ? quantity > 1
                    ? `Parking Session (${quantity} Days)`
                    : 'Parking Session (1 Day)'
                  : pricing_type === 'monthly'
                    ? 'Parking Session (Monthly)'
                    : quantity > 1
                        ? `Parking Session (${quantity} Hours)`
                        : 'Parking Session (1 Hour)',
              description: reservationDescription || undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: quantity,
          adjustable_quantity: {
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
      ...checkoutCustomerParams,
      metadata: {
        location_id: resolvedLocationId,
        display_id: resolvedDisplayId,
        plate_number,
        flow_type,
        pricing_type,
        check_in: effectiveCheckIn,
        check_out: effectiveCheckOut,
      },
      payment_intent_data: {
        setup_future_usage: 'off_session',
        metadata: {
          location_id: resolvedLocationId,
          display_id: resolvedDisplayId,
          plate_number,
          flow_type,
          pricing_type,
          check_in: effectiveCheckIn,
          check_out: effectiveCheckOut,
        },
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const location_id = url.searchParams.get('loc') || url.searchParams.get('location_id') || '';
  const display_id = url.searchParams.get('display_id') || '';
  const plate_number = url.searchParams.get('plate') || '';
  const flow_type = url.searchParams.get('flow') || 'park_now';
  const check_in = url.searchParams.get('in') || '';
  const check_out = url.searchParams.get('out') || '';
  const normalizedPricingType = normalizePricingType(url.searchParams.get('type'), flow_type);
  const pricing_type: PricingType =
    flow_type === 'reserve' && exceedsOneDayDuration(check_in, check_out) ? 'daily' : normalizedPricingType;
  const shouldAutoFillHourlyWindow =
    pricing_type === 'hourly' && flow_type === 'reserve' && !check_in && !check_out;
  const effectiveCheckIn = shouldAutoFillHourlyWindow ? new Date().toISOString() : check_in;
  const effectiveCheckOut = shouldAutoFillHourlyWindow
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : check_out;
  const parkTaxiWindowError = validateParkTaxiReservationWindow(
    flow_type,
    effectiveCheckIn,
    effectiveCheckOut
  );
  if (parkTaxiWindowError) {
    return NextResponse.json({ error: parkTaxiWindowError }, { status: 400 });
  }
  const allowPromotionCodes = resolveAllowPromotionCodesDefaultOn(
    undefined,
    url.searchParams.get('allow_promotion_codes')
  );
  const customer_email = url.searchParams.get('email') || undefined;
  const secret = resolveStripeSecretKey();
  if (!secret) {
    const fallbackCheckoutDetails = buildFallbackCheckoutDetails({
      flowType: flow_type,
      pricingType: pricing_type,
      checkIn: effectiveCheckIn,
      checkOut: effectiveCheckOut,
      displayId: display_id,
    });
    const fallbackUrl = location_id
      ? buildSupabaseFunctionCheckoutUrl({
          locationId: location_id,
          displayId: display_id || undefined,
          flowType: flow_type,
          pricingType: pricing_type,
          checkIn: effectiveCheckIn || undefined,
          checkOut: effectiveCheckOut || undefined,
          quantity: fallbackCheckoutDetails.quantity,
          reservationDescription: fallbackCheckoutDetails.reservationDescription,
          allowPromotionCodes,
          customerEmail: customer_email,
        })
      : null;
    if (fallbackUrl) {
      return NextResponse.redirect(fallbackUrl, { status: 303 });
    }
    return NextResponse.json({ error: 'missing_or_invalid_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  const normalizedCustomerEmail = normalizeEmailValue(customer_email);
  const existingCustomerId = await resolveStripeCustomerIdByEmail(stripe, normalizedCustomerEmail);
  const checkoutCustomerParams = buildCheckoutCustomerParams({
    customerId: existingCustomerId,
    customerEmail: normalizedCustomerEmail,
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
        ...checkoutCustomerParams,
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

  const isParkTaxiFlow = flow_type === 'park_now';
  const isReserveDailyFlow = flow_type === 'reserve' && pricing_type === 'daily';
  let quantity = 1;
  let reservationDescription = '';
  const formatIso = (iso: string) => {
    if (!iso) return '';
    try {
      const parsed = new Date(iso);
      if (!Number.isNaN(parsed.getTime())) {
        return formatBerlinDateTime(parsed);
      }
      return iso;
    } catch {
      return iso;
    }
  };
  const formatIsoNoSeconds = (iso: string) => formatIso(iso).replace(/:(\d{2}) CET$/, ' CET');
  const formatTimeShort = (iso: string) => {
    const formatted = formatIso(iso);
    const match = formatted.match(/\b(\d{2}):(\d{2})(?::\d{2})?\sCET$/);
    if (match) return `${match[1]}:${match[2]}`;
    return '';
  };
  if (effectiveCheckIn && effectiveCheckOut) {
    const start = new Date(effectiveCheckIn);
    const end = new Date(effectiveCheckOut);
    const diff = end.getTime() - start.getTime();
    if (diff > 0) {
      quantity = isParkTaxiFlow || isReserveDailyFlow
        ? Math.ceil(diff / (1000 * 60 * 60 * 24))
        : Math.ceil(diff / (1000 * 60 * 60));
    }
  } else if (isParkTaxiFlow) {
    quantity = 1;
    const nowFormatted = formatBerlinDateTime(new Date());
    reservationDescription = `Start Time: ${nowFormatted}`;
    if (display_id) {
      reservationDescription += `\nLocation ID: ${display_id}`;
    }
    reservationDescription += `\n(End time depends on selected days)`;
  }
  let unitAmount = 0;
  let resolvedLocationId = location_id;
  let resolvedDisplayId = display_id;
  let resolvedLocationName = '';
  try {
    const pricingResolution = await resolveLocationPricing(location_id, display_id, pricing_type, flow_type);
    unitAmount = pricingResolution.unitAmountCents;
    resolvedLocationId = pricingResolution.resolvedLocationId;
    resolvedDisplayId = pricingResolution.resolvedDisplayId;
    resolvedLocationName = pricingResolution.resolvedLocationName;
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const message =
      typeof error === 'object' && error && 'message' in error ? String(error.message) : 'pricing_resolution_failed';
    return NextResponse.json({ error: message }, { status });
  }
  const checkoutSuccessUrl = buildSuccessUrl({
    locationId: resolvedLocationId,
    displayId: resolvedDisplayId,
    checkIn: effectiveCheckIn || undefined,
    checkOut: effectiveCheckOut || undefined,
  });
  if (effectiveCheckIn && effectiveCheckOut) {
    if (isParkTaxiFlow) {
      const locationTitle = resolvedLocationName || 'Safe Parking by PayParq Split Airport/Trogir';
      const locationIdLabel = resolvedDisplayId || display_id || resolvedLocationId || location_id || '—';
      const totalAmountEuro = ((unitAmount * quantity) / 100).toFixed(2);
      const firstRideTime = formatTimeShort(effectiveCheckIn) || '--:--';
      reservationDescription = `${locationTitle} • ID ${locationIdLabel} • Od ${formatIsoNoSeconds(effectiveCheckIn)} • Do ${formatIsoNoSeconds(effectiveCheckOut)} • Ukupno €${totalAmountEuro} • Prva vožnja ${firstRideTime} • Uključeno ${quantity} ${quantity === 1 ? 'dan' : 'dana'} parkinga + 2 vožnje dnevno • Povratak aktiviraj 15 min prije.`;
    } else {
      reservationDescription = `From: ${formatIso(effectiveCheckIn)} To: ${formatIso(effectiveCheckOut)}`;
      if (resolvedDisplayId || display_id) {
        reservationDescription += `\nLocation ID: ${resolvedDisplayId || display_id}`;
      }
    }
  }
  const submitMessageBase = buildSubmitMessage({
    pricingType: pricing_type,
    baseUrl: url.origin,
    locationId: resolvedLocationId,
    displayId: resolvedDisplayId,
    flowType: flow_type,
    customerEmail: customer_email,
    allowPromotionCodes,
  });
  const submitMessage = reservationDescription
    ? `${reservationDescription}\n${submitMessageBase}`
    : submitMessageBase;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      phone_number_collection: { enabled: true },
      success_url: checkoutSuccessUrl,
      cancel_url: unifiedStripeCancelUrl,
      payment_method_types: ['card'],
      allow_promotion_codes: allowPromotionCodes,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name:
                isParkTaxiFlow
                  ? quantity > 1
                    ? `Park & Taxi Package (${quantity} Days)`
                    : 'Park & Taxi Package (1 Day)'
                  : pricing_type === 'daily'
                  ? quantity > 1
                    ? `Parking Session (${quantity} Days)`
                    : 'Parking Session (1 Day)'
                  : pricing_type === 'monthly'
                    ? 'Parking Session (Monthly)'
                    : quantity > 1
                        ? `Parking Session (${quantity} Hours)`
                        : 'Parking Session (1 Hour)',
              description: reservationDescription || undefined,
            },
            unit_amount: unitAmount,
          },
          quantity,
          adjustable_quantity: {
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
      ...checkoutCustomerParams,
      metadata: {
        location_id: resolvedLocationId,
        display_id: resolvedDisplayId,
        plate_number,
        flow_type,
        pricing_type,
        check_in: effectiveCheckIn,
        check_out: effectiveCheckOut,
      },
      payment_intent_data: {
        setup_future_usage: 'off_session',
        metadata: {
          location_id: resolvedLocationId,
          display_id: resolvedDisplayId,
          plate_number,
          flow_type,
          pricing_type,
          check_in: effectiveCheckIn,
          check_out: effectiveCheckOut,
        },
      },
    });
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'stripe_payment_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
