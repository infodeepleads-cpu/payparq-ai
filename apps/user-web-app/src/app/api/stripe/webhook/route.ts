import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

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

function parseIso(value: string | null | undefined) {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function isNaiveDatetime(value: string): boolean {
  const trimmed = value.trim();
  if (/(?:Z|[+\-]\d{2}:\d{2})$/i.test(trimmed)) return false;
  return /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(trimmed);
}

function parseNaiveDateParts(value: string) {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/,
  );
  if (!match) return null;
  return {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
    hour: Number(match[4]), minute: Number(match[5]), second: Number(match[6] ?? '0'),
  };
}

function resolveZagrebOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const zonedAsUtc = Date.UTC(get('year'), Math.max(0, get('month') - 1), get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((zonedAsUtc - date.getTime()) / 60000);
}

function parseMetadataDatetime(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  if (!isNaiveDatetime(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  const naive = parseNaiveDateParts(raw);
  if (!naive) return null;
  let utcMillis = Date.UTC(naive.year, naive.month - 1, naive.day, naive.hour, naive.minute, naive.second);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const offsetMinutes = resolveZagrebOffsetMinutes(new Date(utcMillis));
    utcMillis = Date.UTC(naive.year, naive.month - 1, naive.day, naive.hour, naive.minute, naive.second)
      - offsetMinutes * 60000;
  }
  return new Date(utcMillis).toISOString();
}

function toCents(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.round(numeric));
}

function toCommissionRate(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0.15;
  if (numeric > 1) return Math.min(1, numeric / 100);
  return Math.min(1, numeric);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function resolveLevel(pointsYear: number): 'level_1' | 'level_2' | 'level_3' {
  if (pointsYear >= 1200) return 'level_3';
  if (pointsYear >= 300) return 'level_2';
  return 'level_1';
}

function resolveLevelBonusRate(level: 'level_1' | 'level_2' | 'level_3', commissionRate: number): number {
  const normalizedCommission = clamp(commissionRate, 0, 1);
  if (level === 'level_3') return 0.05 + normalizedCommission * 0.15;
  if (level === 'level_2') return 0.01 + normalizedCommission * 0.14;
  return 0;
}

function resolveYearStartDate(value: string | null | undefined): string {
  const parsed = new Date((value ?? '').toString());
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function resolveExitTimeFromQuantity(params: {
  entryIso: string;
  quantity: number;
  pricingType: string;
}) {
  const entry = new Date(params.entryIso);
  if (Number.isNaN(entry.getTime())) return null;
  const quantity = Number.isFinite(params.quantity) && params.quantity > 0 ? params.quantity : 1;
  const pricingType = params.pricingType.trim().toLowerCase();
  const exit = new Date(entry.getTime());
  if (pricingType === 'daily') {
    exit.setUTCDate(exit.getUTCDate() + quantity);
  } else if (pricingType === 'monthly') {
    exit.setUTCDate(exit.getUTCDate() + quantity * 30);
  } else {
    exit.setUTCHours(exit.getUTCHours() + quantity);
  }
  return exit.toISOString();
}

async function resolveExtensionEntryTime(params: {
  client: SupabaseClient;
  email: string;
  locationId: string;
  extendTargetSessionId?: string;
}) {
  const normalizedEmail = (params.email ?? '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  const targetSessionId = (params.extendTargetSessionId ?? '').trim();
  if (targetSessionId) {
    const { data: targetRow } = await params.client
      .from('parking_sessions')
      .select('exit_time,status,payment_status')
      .eq('id', targetSessionId)
      .ilike('email', normalizedEmail)
      .maybeSingle();
    const target = targetRow as
      | {
          exit_time?: string | null;
          status?: string | null;
          payment_status?: string | null;
        }
      | null;
    const paymentStatus = (target?.payment_status ?? '').toString().trim().toLowerCase();
    const statusValue = (target?.status ?? '').toString().trim().toLowerCase();
    const isPaid =
      paymentStatus === 'paid' ||
      paymentStatus === 'succeeded' ||
      paymentStatus === 'complete' ||
      paymentStatus === 'completed';
    if (isPaid || statusValue === 'active') {
      const targetExitIso = parseIso(target?.exit_time ?? null);
      if (targetExitIso) {
        return targetExitIso;
      }
    }
  }
  let query = params.client
    .from('parking_sessions')
    .select('exit_time,status,payment_status')
    .eq('email', normalizedEmail)
    .in('payment_status', ['paid', 'succeeded', 'complete', 'completed'])
    .not('exit_time', 'is', null)
    .order('exit_time', { ascending: false })
    .limit(20);
  const normalizedLocation = (params.locationId ?? '').trim();
  if (normalizedLocation && normalizedLocation !== 'DEFAULT_LOC') {
    query = query.eq('location_id', normalizedLocation);
  }
  const { data } = await query;
  const rows = (data ?? []) as Array<{
    exit_time?: string | null;
    status?: string | null;
    payment_status?: string | null;
  }>;
  const row = rows.find((item) => {
    const paymentStatus = (item.payment_status ?? '').toString().trim().toLowerCase();
    const statusValue = (item.status ?? '').toString().trim().toLowerCase();
    const isPaid =
      paymentStatus === 'paid' ||
      paymentStatus === 'succeeded' ||
      paymentStatus === 'complete' ||
      paymentStatus === 'completed';
    return isPaid || statusValue === 'active';
  }) ?? null;
  const exitIso = parseIso(row?.exit_time ?? null);
  return exitIso;
}

async function ensureMemberAccountByEmail(rawEmail: string | null | undefined) {
  const email = (rawEmail ?? '').trim().toLowerCase();
  if (!email || !supabaseAdmin) {
    return { ok: false, created: false };
  }
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    console.error('❌ Failed to list auth users:', listError.message);
    return { ok: false, created: false };
  }
  const existing = listData.users.find(
    (item) => (item.email ?? '').trim().toLowerCase() === email
  );
  if (existing) {
    return { ok: true, created: false };
  }
  const generatedPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: false,
    user_metadata: {
      role: 'member',
      membership_source: 'stripe_checkout',
    },
  });
  if (createError) {
    console.error('❌ Failed to create member auth user:', createError.message);
    return { ok: false, created: false };
  }
  return { ok: true, created: true };
}

function normalizePlateValue(value: unknown) {
  return (value ?? '').toString().trim().toUpperCase();
}

function toBoolFromMetadata(value: unknown) {
  const normalized = (value ?? '').toString().trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

async function updateMemberStripeDefaults(params: {
  email: string | null;
  stripeCustomerId: string | null;
  defaultPaymentMethodId: string | null;
  plateNumber: string | null;
  autoChargeOptIn: boolean;
}) {
  const email = (params.email ?? '').trim().toLowerCase();
  if (!email || !supabaseAdmin) return;
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) return;
  const authUser = data.users.find((candidate) => (candidate.email ?? '').trim().toLowerCase() === email);
  if (!authUser?.id) return;
  const existingMetadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const existingPlates = Array.isArray(existingMetadata.member_plates)
    ? existingMetadata.member_plates
        .map((value) => normalizePlateValue(value))
        .filter((value) => value.length > 0)
    : [];
  const incomingPlate = normalizePlateValue(params.plateNumber);
  const mergedPlates = Array.from(new Set([...(incomingPlate ? [incomingPlate] : []), ...existingPlates]));
  await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    user_metadata: {
      ...existingMetadata,
      stripe_customer_id: params.stripeCustomerId ?? (existingMetadata.stripe_customer_id as string | undefined) ?? null,
      default_payment_method: params.defaultPaymentMethodId ?? (existingMetadata.default_payment_method as string | undefined) ?? null,
      auto_charge_opt_in:
        params.autoChargeOptIn ||
        toBoolFromMetadata(existingMetadata.auto_charge_opt_in),
      member_plates: mergedPlates,
      default_plate:
        mergedPlates[0] ??
        normalizePlateValue(existingMetadata.default_plate) ??
        null,
    },
  });
}

export async function POST(req: Request) {
  const stripeSecret = resolveStripeSecretKey();
  if (!stripeSecret) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' as unknown as Stripe.LatestApiVersion });
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = (await headers()).get('stripe-signature') || '';
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('✅ Checkout session completed:', session.id);
    if (session.mode === 'setup') {
      const sessionMetadata = session.metadata ?? {};
      const metadataEmail = (sessionMetadata.customer_email ?? sessionMetadata.email ?? '').toString().trim().toLowerCase();
      let memberEmail = metadataEmail || (session.customer_details?.email ?? session.customer_email ?? '').toString().trim().toLowerCase();
      const customerIdFromSession = typeof session.customer === 'string' ? session.customer : null;
      const customerIdFromMetadata = (sessionMetadata.stripe_customer_id ?? '').toString().trim();
      let customerId =
        customerIdFromSession ??
        (customerIdFromMetadata || null);
      if (!memberEmail && customerId) {
        try {
          const stripeCustomer = await stripe.customers.retrieve(customerId);
          if (!('deleted' in stripeCustomer) && stripeCustomer.email) {
            memberEmail = stripeCustomer.email.trim().toLowerCase();
          }
        } catch {
        }
      }
      const setupIntentId = typeof session.setup_intent === 'string' ? session.setup_intent : null;
      let paymentMethodId: string | null = null;
      let autoChargeOptIn = toBoolFromMetadata(sessionMetadata.auto_charge_opt_in);
      if (setupIntentId) {
        try {
          const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
            expand: ['payment_method'],
          });
          autoChargeOptIn = autoChargeOptIn || toBoolFromMetadata(setupIntent.metadata?.auto_charge_opt_in);
          paymentMethodId =
            typeof setupIntent.payment_method === 'string'
              ? setupIntent.payment_method
              : setupIntent.payment_method?.id ?? null;
          if (!customerId) {
            customerId =
              typeof setupIntent.customer === 'string'
                ? setupIntent.customer
                : setupIntent.customer?.id ?? null;
          }
        } catch {
        }
      }
      if (customerId && paymentMethodId) {
        try {
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        } catch {
        }
      }
      await updateMemberStripeDefaults({
        email: memberEmail || null,
        stripeCustomerId: customerId,
        defaultPaymentMethodId: paymentMethodId,
        plateNumber: (sessionMetadata.plate_number ?? '').toString().trim() || null,
        autoChargeOptIn,
      });
      return NextResponse.json({ received: true });
    }
    const paymentStatus = (session.payment_status ?? '').toString().trim().toLowerCase();
    if (paymentStatus !== 'paid') {
      return NextResponse.json({ received: true });
    }

    const sessionMetadata = session.metadata ?? {};

    // 1. EXTRACT DATA
    let location_id = sessionMetadata.location_id || '';
    let plate_number = sessionMetadata.plate_number || '';
    let submittedPlateOverride = '';
    let submittedPhoneOverride = '';

    // If metadata is empty, check custom fields (Payment Links)
    if (session.custom_fields) {
      for (const f of session.custom_fields) {
        const key = f.key.toLowerCase();
        const val = (f.text?.value || f.numeric?.value || '').toString().trim();
        if (!val) {
          continue;
        }
        if (key.includes('location') && !location_id) location_id = val;
        if (key.includes('plate')) submittedPlateOverride = val.toUpperCase();
        if (key.includes('phone')) submittedPhoneOverride = val;
      }
    }
    if (submittedPlateOverride) {
      plate_number = submittedPlateOverride;
    }

    // Fallback defaults if still missing (prevents DB errors)
    if (!location_id) location_id = 'DEFAULT_LOC';
    if (!plate_number) plate_number = 'UNKNOWN';

    console.log(`📦 Data extracted - Plate: ${plate_number}, Location: ${location_id}`);

    // Ensure Supabase client
    const client = supabaseAdmin ?? supabase;
    if (!client) {
      console.warn('Supabase client not configured; skipping DB writes.');
      return NextResponse.json({ received: true });
    }

    // 2. CHECK IDEMPOTENCY
    const { data: existingSession, error: fetchError } = await client
      .from('parking_sessions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle(); // maybeSingle avoids error if not found

    if (fetchError) {
      console.error('❌ Error checking existing session:', fetchError);
    }

    if (existingSession) {
      console.log(`🔄 Session ${session.id} already processed. Skipping.`);
      return NextResponse.json({ received: true });
    }

    let lineItemQuantity = 1;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const quantityFromStripe = Number(lineItems.data?.[0]?.quantity ?? 1);
      if (Number.isFinite(quantityFromStripe) && quantityFromStripe > 0) {
        lineItemQuantity = quantityFromStripe;
      }
    } catch {
      lineItemQuantity = 1;
    }

    const pricingType = (sessionMetadata.pricing_type ?? 'hourly').toString();
    const flowType = (sessionMetadata.flow_type ?? '').toString().trim().toLowerCase();
    const emailCandidates = [
      session.customer_details?.email,
      session.customer_email,
      sessionMetadata.customer_email,
      sessionMetadata.email,
    ];
    let email = emailCandidates
      .map((value) => (value ?? '').toString().trim().toLowerCase())
      .find((value) => value.length > 0) ?? '';
    if (!email) {
      const customerId = typeof session.customer === 'string' ? session.customer.trim() : '';
      if (customerId) {
        try {
          const stripeCustomer = await stripe.customers.retrieve(customerId);
          if (!('deleted' in stripeCustomer) && stripeCustomer.email) {
            email = stripeCustomer.email.trim().toLowerCase();
          }
        } catch (error) {
          console.warn('Unable to resolve Stripe customer email:', customerId, error);
        }
      }
    }
    const customerPhone =
      (submittedPhoneOverride || session.customer_details?.phone || sessionMetadata.customer_phone || '')
        .toString()
        .trim();
    const extendTargetSessionId = (sessionMetadata.extend_target_session_id ?? '').toString().trim();
    const extendRequestedMinutes = toCents(sessionMetadata.extend_minutes);
    const sessionAmountCents = toCents(sessionMetadata.session_amount_cents ?? session.amount_total ?? 0);
    const chargedAmountCents = toCents(sessionMetadata.charged_amount_cents ?? session.amount_total ?? 0);
    const walletDebitPlannedCents = toCents(sessionMetadata.wallet_debit_planned_cents);
    const lotCommissionRate = toCommissionRate(sessionMetadata.lot_commission_rate);
    const checkInFromMetadata = parseMetadataDatetime(sessionMetadata.check_in);
    const checkOutFromMetadata = parseMetadataDatetime(sessionMetadata.check_out);
    const shouldResolveExtensionFallback =
      flowType === 'reserve' && (!checkInFromMetadata || !checkOutFromMetadata);
    const extensionEntryTime = shouldResolveExtensionFallback
      ? await resolveExtensionEntryTime({
          client,
          email,
          locationId: location_id,
          extendTargetSessionId,
        })
      : null;
    const createdAtIso = new Date(session.created * 1000).toISOString();
    const entryTime =
      checkInFromMetadata ??
      extensionEntryTime ??
      (flowType === 'reserve' ? null : createdAtIso);
    const exitTime =
      checkOutFromMetadata ??
      (entryTime
        ? resolveExitTimeFromQuantity({
            entryIso: entryTime,
            quantity: lineItemQuantity,
            pricingType,
          })
        : null);
    if (!entryTime || !exitTime) {
      console.error('❌ Unable to resolve reservation window for session:', session.id, {
        flowType,
        hasMetadataCheckIn: Boolean(checkInFromMetadata),
        hasMetadataCheckOut: Boolean(checkOutFromMetadata),
        usedExtensionEntryFallback: Boolean(extensionEntryTime),
      });
      return NextResponse.json({ received: true });
    }
    const durationMinutes =
      exitTime != null
        ? Math.max(1, Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000))
        : null;
    const isTargetedExtensionFlow =
      flowType === 'reserve' && Boolean(extendTargetSessionId) && Boolean(checkOutFromMetadata);

    let walletBalanceBeforeCents = 0;
    let walletDebitAppliedCents = 0;
    let walletTopupCreditCents = 0;
    let loyaltyPointsDelta = 0;
    let loyaltyBonusCreditCents = 0;
    let loyaltyLevelAfter: 'level_1' | 'level_2' | 'level_3' = 'level_1';
    let loyaltyPointsYearAfter = 0;
    let loyaltyProgressPercent = 0;
    if (email) {
      const { data: walletAccount } = await client
        .from('wallet_accounts')
        .select('balance_cents')
        .eq('email', email)
        .maybeSingle();
      walletBalanceBeforeCents = toCents((walletAccount as { balance_cents?: unknown } | null)?.balance_cents);
      const minimumWalletDebitNeeded = Math.max(0, sessionAmountCents - chargedAmountCents);
      const baseWalletDebit = Math.min(walletBalanceBeforeCents, walletDebitPlannedCents);
      walletDebitAppliedCents = Math.min(
        walletBalanceBeforeCents,
        Math.max(baseWalletDebit, minimumWalletDebitNeeded)
      );
      const effectiveShortfallCents = Math.max(0, sessionAmountCents - walletDebitAppliedCents);
      walletTopupCreditCents = Math.max(0, chargedAmountCents - effectiveShortfallCents);
      const walletBalanceAfterCents = walletBalanceBeforeCents - walletDebitAppliedCents + walletTopupCreditCents;

      await client
        .from('wallet_accounts')
        .upsert(
          {
            email,
            balance_cents: walletBalanceAfterCents,
            currency: (session.currency || 'eur').toLowerCase(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

      if (walletDebitAppliedCents > 0) {
        await client.from('wallet_ledger').upsert({
          email,
          amount_cents: walletDebitAppliedCents,
          direction: 'debit',
          entry_type: 'parking_session',
          stripe_session_id: session.id,
          location_id,
          idempotency_key: `wallet:debit:${session.id}`,
          metadata: {
            source: 'checkout_session_completed',
            planned_wallet_debit_cents: walletDebitPlannedCents,
            session_amount_cents: sessionAmountCents,
          },
        }, { onConflict: 'idempotency_key', ignoreDuplicates: true });
      }

      if (walletTopupCreditCents > 0) {
        await client.from('wallet_ledger').upsert({
          email,
          amount_cents: walletTopupCreditCents,
          direction: 'credit',
          entry_type: 'stripe_minimum_topup',
          stripe_session_id: session.id,
          location_id,
          idempotency_key: `wallet:topup:${session.id}`,
          metadata: {
            source: 'checkout_session_completed',
            charged_amount_cents: chargedAmountCents,
            session_amount_cents: sessionAmountCents,
            commission_rate: lotCommissionRate,
          },
        }, { onConflict: 'idempotency_key', ignoreDuplicates: true });
      }

      loyaltyPointsDelta = Math.max(1, Math.round(sessionAmountCents / 100));
      const { data: loyaltyAccount } = await client
        .from('loyalty_accounts')
        .select('points_year,points_total,current_level,year_start_date')
        .eq('email', email)
        .maybeSingle();
      const currentYear = new Date().getUTCFullYear();
      const rawYearStart = resolveYearStartDate(
        (loyaltyAccount as { year_start_date?: string | null } | null)?.year_start_date
      );
      const yearStartYear = new Date(rawYearStart).getUTCFullYear();
      const resetYearCounter = yearStartYear !== currentYear;
      const basePointsYear = resetYearCounter
        ? 0
        : Math.max(0, Number((loyaltyAccount as { points_year?: unknown } | null)?.points_year ?? 0));
      const basePointsTotal = Math.max(
        0,
        Number((loyaltyAccount as { points_total?: unknown } | null)?.points_total ?? 0)
      );
      loyaltyPointsYearAfter = basePointsYear + loyaltyPointsDelta;
      loyaltyLevelAfter = resolveLevel(loyaltyPointsYearAfter);
      const levelBonusRate = resolveLevelBonusRate(loyaltyLevelAfter, lotCommissionRate);
      loyaltyBonusCreditCents = Math.round(sessionAmountCents * levelBonusRate);
      const nextLevelTarget = loyaltyLevelAfter === 'level_1' ? 300 : loyaltyLevelAfter === 'level_2' ? 1200 : 1200;
      loyaltyProgressPercent =
        loyaltyLevelAfter === 'level_3'
          ? 100
          : clamp(Math.round((loyaltyPointsYearAfter / nextLevelTarget) * 100), 0, 100);

      await client
        .from('loyalty_accounts')
        .upsert(
          {
            email,
            points_year: loyaltyPointsYearAfter,
            points_total: basePointsTotal + loyaltyPointsDelta,
            current_level: loyaltyLevelAfter,
            year_start_date: resetYearCounter ? `${currentYear}-01-01` : rawYearStart,
            level_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

      await client.from('loyalty_ledger').upsert({
        email,
        points_delta: loyaltyPointsDelta,
        source: 'parking_session',
        stripe_session_id: session.id,
        idempotency_key: `loyalty:points:${session.id}`,
        metadata: {
          session_amount_cents: sessionAmountCents,
          lot_commission_rate: lotCommissionRate,
          level_after: loyaltyLevelAfter,
          level_progress_percent: loyaltyProgressPercent,
        },
      }, { onConflict: 'idempotency_key', ignoreDuplicates: true });

      if (loyaltyBonusCreditCents > 0) {
        await client.from('wallet_accounts').upsert(
          {
            email,
            balance_cents: walletBalanceAfterCents + loyaltyBonusCreditCents,
            currency: (session.currency || 'eur').toLowerCase(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
        await client.from('wallet_ledger').upsert({
          email,
          amount_cents: loyaltyBonusCreditCents,
          direction: 'credit',
          entry_type: 'loyalty_bonus',
          stripe_session_id: session.id,
          location_id,
          idempotency_key: `wallet:bonus:${session.id}`,
          metadata: {
            level: loyaltyLevelAfter,
            lot_commission_rate: lotCommissionRate,
            bonus_rate: resolveLevelBonusRate(loyaltyLevelAfter, lotCommissionRate),
            session_amount_cents: sessionAmountCents,
          },
        }, { onConflict: 'idempotency_key', ignoreDuplicates: true });
      }
    }

    if (isTargetedExtensionFlow) {
      let extensionApplied = false;
      if (email && extendTargetSessionId) {
        const { data: targetRow } = await client
          .from('parking_sessions')
          .select('id,email,entry_time,exit_time,status,mobile,plate,stripe_metadata')
          .eq('id', extendTargetSessionId)
          .ilike('email', email)
          .maybeSingle();
        const target = targetRow as
          | {
              id?: string | null;
              entry_time?: string | null;
              exit_time?: string | null;
              status?: string | null;
              mobile?: string | null;
              plate?: string | null;
              stripe_metadata?: Record<string, unknown> | null;
            }
          | null;
        if (target?.id) {
          const priorExitIso = parseIso(target.exit_time);
          const nowMillis = Date.now();
          const existingMetadata =
            target.stripe_metadata && typeof target.stripe_metadata === 'object'
              ? target.stripe_metadata
              : {};
          const alreadyAppliedForSession =
            (existingMetadata as { last_extension_checkout_session_id?: unknown })
              .last_extension_checkout_session_id === session.id;
          if (alreadyAppliedForSession) {
            extensionApplied = true;
          } else if (checkOutFromMetadata) {
            const extensionEntryIso =
              checkInFromMetadata ??
              priorExitIso ??
              parseIso(target.entry_time) ??
              entryTime;
            if (extensionEntryIso) {
              const extensionDurationMinutes = Math.max(
                1,
                Math.round(
                  (new Date(checkOutFromMetadata).getTime() - new Date(extensionEntryIso).getTime()) / 60000
                )
              );
              const extensionStatus =
                new Date(extensionEntryIso).getTime() > nowMillis ? 'scheduled' : 'active';
              const plateForUpdate =
                plate_number && plate_number !== 'UNKNOWN'
                  ? plate_number
                  : (target.plate ?? '').toString().trim() || 'UNKNOWN';
              const mobileForUpdate = customerPhone || (target.mobile ?? '').toString().trim();
              const extensionMetadata = {
                ...sessionMetadata,
                extension_of_session_id: target.id,
                extension_checkout_session_id: session.id,
                extension_requested_minutes: extendRequestedMinutes,
                extension_previous_exit_time: priorExitIso,
                extension_new_exit_time: checkOutFromMetadata,
              };
              const { error: extensionInsertError } = await client
                .from('parking_sessions')
                .insert({
                  location_id: location_id || null,
                  plate: plateForUpdate,
                  mobile: mobileForUpdate,
                  email,
                  price: sessionAmountCents / 100,
                  currency: session.currency || 'usd',
                  stripe_session_id: session.id,
                  payment_status: 'paid',
                  status: extensionStatus,
                  entry_time: extensionEntryIso,
                  exit_time: checkOutFromMetadata,
                  quantity: lineItemQuantity,
                  duration_minutes: extensionDurationMinutes,
                  stripe_metadata: extensionMetadata,
                });
              if (!extensionInsertError) {
                const nextMetadata = {
                  ...existingMetadata,
                  last_extension_checkout_session_id: session.id,
                  last_extension_requested_minutes: extendRequestedMinutes,
                  last_extension_previous_exit_time: priorExitIso,
                  last_extension_new_exit_time: checkOutFromMetadata,
                  last_extension_applied_at: new Date().toISOString(),
                };
                await client
                  .from('parking_sessions')
                  .update({
                    stripe_metadata: nextMetadata,
                  })
                  .eq('id', target.id)
                  .ilike('email', email);
                extensionApplied = true;
              }
            }
          }
        }
      }
      if (extensionApplied) {
        return NextResponse.json({ received: true });
      }
      return NextResponse.json({ received: true });
    }
    // 3. INSERT INTO SUPABASE
    const insertData = {
      location_id,
      plate: plate_number,
      mobile: customerPhone,
      email,
      price: sessionAmountCents / 100,
      currency: session.currency || 'usd',
      stripe_session_id: session.id,
      payment_status: 'paid',
      status: 'active',
      entry_time: entryTime,
      exit_time: exitTime,
      quantity: lineItemQuantity,
      duration_minutes: durationMinutes,
      stripe_metadata: {
        ...sessionMetadata,
        wallet_balance_before_cents: walletBalanceBeforeCents,
        wallet_debit_applied_cents: walletDebitAppliedCents,
        wallet_topup_credit_cents: walletTopupCreditCents,
        loyalty_points_delta: loyaltyPointsDelta,
        loyalty_bonus_credit_cents: loyaltyBonusCreditCents,
        loyalty_level_after: loyaltyLevelAfter,
        loyalty_points_year_after: loyaltyPointsYearAfter,
        loyalty_progress_percent: loyaltyProgressPercent,
      },
    };

    console.log('🚀 Inserting into Supabase:', insertData);

    await ensureMemberAccountByEmail(email || null);

    const { error: insertError } = await client
      .from('parking_sessions')
      .insert(insertData);

    if (insertError) {
      console.error('❌ Supabase INSERT failed:', insertError);
      // Don't return 500, or Stripe will retry indefinitely. Log error and return 200.
      return NextResponse.json({ error: insertError.message, received: true }); 
    }

    console.log('✨ Successfully inserted parking session!');

    // 4. UPDATE OCCUPANCY (Optional, best effort)
    try {
        // First check if location exists, if not create a dummy one to avoid error
        const { data: loc } = await client.from('locations').select('occupancy').eq('id', location_id).maybeSingle();
        if (loc) {
             await client.from('locations').update({ occupancy: (loc.occupancy || 0) + 1 }).eq('id', location_id);
             console.log('📈 Occupancy updated.');
        } else {
            console.log(`⚠️ Location ${location_id} not found, skipping occupancy update.`);
        }
    } catch (e) {
        console.error('⚠️ Failed to update occupancy:', e);
    }
  }

  return NextResponse.json({ received: true });
}
