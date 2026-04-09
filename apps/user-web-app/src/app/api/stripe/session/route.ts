import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';
import { normalizeLocationName } from '@/lib/locationPricing';

function resolveStripeSecretKey(): string | null {
  const secret = (process.env.STRIPE_SECRET_KEY ?? '').trim();
  if (!secret) return null;
  if (!/^sk_(test|live)_/i.test(secret)) return null;
  if (/your_stripe|replace_me|changeme|example/i.test(secret)) return null;
  return secret;
}

async function buildFallbackSummaryFromParkingSession(sessionId: string) {
  const dbClient = supabaseAdmin ?? supabase;
  if (!dbClient) return null;
  const { data: sessionRow } = await dbClient
    .from('parking_sessions')
    .select('stripe_session_id,location_id,entry_time,exit_time,email,price,amount_cents,currency,type,stripe_metadata')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();
  if (!sessionRow) return null;

  const row = sessionRow as {
    stripe_session_id?: string | null;
    location_id?: string | null;
    entry_time?: string | null;
    exit_time?: string | null;
    email?: string | null;
    price?: number | null;
    amount_cents?: number | null;
    currency?: string | null;
    type?: string | null;
    stripe_metadata?: Record<string, unknown> | null;
  };

  const email = (row.email ?? '').trim().toLowerCase();
  let membershipExists = false;
  let emailVerified = false;
  if (email && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!error) {
      const existing = data.users.find(
        (item) => (item.email ?? '').trim().toLowerCase() === email
      );
      membershipExists = Boolean(existing);
      emailVerified = Boolean(existing?.email_confirmed_at);
    }
  }

  const locationCandidate = (row.location_id ?? '').toString().trim();
  let locationName: string | null = null;
  let locationDisplayId: string | null = null;
  if (locationCandidate) {
    const byId = await dbClient
      .from('locations')
      .select('id,display_id,name')
      .eq('id', locationCandidate)
      .maybeSingle();
    let locationRow = byId.data as
      | { id?: string | null; display_id?: string | null; name?: string | null }
      | null;
    if (!locationRow) {
      const byDisplayId = await dbClient
        .from('locations')
        .select('id,display_id,name')
        .eq('display_id', locationCandidate)
        .maybeSingle();
      locationRow = byDisplayId.data as
        | { id?: string | null; display_id?: string | null; name?: string | null }
        | null;
    }
    if (locationRow) {
      locationName = locationRow.name ? normalizeLocationName(String(locationRow.name)) : null;
      locationDisplayId = locationRow.display_id ? String(locationRow.display_id) : null;
    }
  }

  const amountTotal =
    typeof row.amount_cents === 'number'
      ? row.amount_cents
      : typeof row.price === 'number'
        ? Math.round(row.price * 100)
        : 0;
  const currency = (row.currency ?? 'eur').toString() || 'eur';
  const flowType = (row.type ?? null) as string | null;

  return {
    session_id: sessionId,
    ref_id: sessionId.slice(-8),
    email: email || null,
    amount_total: amountTotal,
    currency,
    flow_type: flowType,
    location_id: locationCandidate || null,
    location_name: locationName,
    location_display_id: locationDisplayId,
    check_in: row.entry_time ?? null,
    check_out: row.exit_time ?? null,
    wallet_topup_credit_cents: Number(row.stripe_metadata?.wallet_topup_credit_cents ?? 0) || 0,
    wallet_debit_applied_cents: Number(row.stripe_metadata?.wallet_debit_applied_cents ?? 0) || 0,
    loyalty_bonus_credit_cents: Number(row.stripe_metadata?.loyalty_bonus_credit_cents ?? 0) || 0,
    membership_exists: membershipExists,
    email_verified: emailVerified,
  };
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim() ?? '';
  const isCheckoutPlaceholderSessionId =
    sessionId === '{CHECKOUT_SESSION_ID}' ||
    sessionId.toUpperCase() === 'CHECKOUT_SESSION_ID' ||
    /\{?CHECKOUT_SESSION_ID\}?/i.test(sessionId);
  const fallbackDisplayId =
    req.nextUrl.searchParams.get('display_id')?.trim() ??
    req.nextUrl.searchParams.get('displayId')?.trim() ??
    req.nextUrl.searchParams.get('id')?.trim() ??
    '';
  const fallbackLocationId =
    req.nextUrl.searchParams.get('location_id')?.trim() ??
    req.nextUrl.searchParams.get('locationId')?.trim() ??
    req.nextUrl.searchParams.get('loc')?.trim() ??
    req.nextUrl.searchParams.get('location')?.trim() ??
    '';
  const fallbackCheckIn =
    req.nextUrl.searchParams.get('check_in')?.trim() ??
    req.nextUrl.searchParams.get('checkIn')?.trim() ??
    req.nextUrl.searchParams.get('in')?.trim() ??
    req.nextUrl.searchParams.get('start')?.trim() ??
    '';
  const fallbackCheckOut =
    req.nextUrl.searchParams.get('check_out')?.trim() ??
    req.nextUrl.searchParams.get('checkOut')?.trim() ??
    req.nextUrl.searchParams.get('out')?.trim() ??
    req.nextUrl.searchParams.get('end')?.trim() ??
    '';
  if (!sessionId) {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });
  }
  if (isCheckoutPlaceholderSessionId) {
    return NextResponse.json(
      {
        error: 'checkout_session_id_not_resolved',
        session_id: sessionId,
        ref_id: 'PENDING',
        email: null,
        amount_total: 0,
        currency: 'eur',
        flow_type: null,
        location_id: fallbackLocationId || fallbackDisplayId || null,
        location_name: null,
        location_display_id: fallbackDisplayId || null,
        check_in: fallbackCheckIn || null,
        check_out: fallbackCheckOut || null,
        wallet_topup_credit_cents: 0,
        wallet_debit_applied_cents: 0,
        loyalty_bonus_credit_cents: 0,
        membership_exists: false,
        email_verified: false,
      },
      { status: 400 }
    );
  }
  const secret = resolveStripeSecretKey();
  if (!secret) {
    let fallback = await buildFallbackSummaryFromParkingSession(sessionId);
    if (!fallback && (fallbackDisplayId || fallbackLocationId || fallbackCheckIn || fallbackCheckOut)) {
      fallback = {
        session_id: sessionId,
        ref_id: sessionId.slice(-8),
        email: null,
        amount_total: 0,
        currency: 'eur',
        flow_type: null,
        location_id: fallbackLocationId || fallbackDisplayId || null,
        location_name: null,
        location_display_id: fallbackDisplayId || null,
        check_in: fallbackCheckIn || null,
        check_out: fallbackCheckOut || null,
        wallet_topup_credit_cents: 0,
        wallet_debit_applied_cents: 0,
        loyalty_bonus_credit_cents: 0,
        membership_exists: false,
        email_verified: false,
      };
    }
    if (fallback) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: 'missing_or_invalid_stripe_secret' }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionMetadata = session.metadata ?? {};
    const email = (session.customer_details?.email ?? '').trim().toLowerCase();
    const metadataCheckIn = (sessionMetadata.check_in ?? '').toString().trim();
    const metadataCheckOut = (sessionMetadata.check_out ?? '').toString().trim();
    let entryTime: string | null = null;
    let exitTime: string | null = null;
    let activityLocationId =
      (sessionMetadata.display_id ?? sessionMetadata.location_id ?? '').toString().trim() || null;
    let activityLocationName: string | null = null;
    let activityLocationDisplayId: string | null = null;
    let membershipExists = false;
    let emailVerified = false;
    let walletTopupCreditCents = Number(sessionMetadata.minimum_charge_topup_cents ?? 0) || 0;
    let walletDebitAppliedCents = Number(sessionMetadata.wallet_debit_planned_cents ?? 0) || 0;
    let loyaltyBonusCreditCents = 0;
    if (email && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (!error) {
        const existing = data.users.find(
          (item) => (item.email ?? '').trim().toLowerCase() === email
        );
        membershipExists = Boolean(existing);
        emailVerified = Boolean(existing?.email_confirmed_at);
      }
    }
    const dbClient = supabaseAdmin ?? supabase;
    if (dbClient) {
      const { data: sessionRow } = await dbClient
        .from('parking_sessions')
        .select('location_id,entry_time,exit_time,stripe_metadata')
        .eq('stripe_session_id', session.id)
        .maybeSingle();
      if (sessionRow) {
        const row = sessionRow as {
          location_id?: string | null;
          entry_time?: string | null;
          exit_time?: string | null;
          stripe_metadata?: Record<string, unknown> | null;
        };
        if (row.location_id && !activityLocationId) {
          activityLocationId = row.location_id;
        }
        if (row.entry_time) {
          entryTime = row.entry_time;
        }
        if (row.exit_time) {
          exitTime = row.exit_time;
        }
        walletTopupCreditCents = Number(row.stripe_metadata?.wallet_topup_credit_cents ?? walletTopupCreditCents) || 0;
        walletDebitAppliedCents = Number(row.stripe_metadata?.wallet_debit_applied_cents ?? walletDebitAppliedCents) || 0;
        loyaltyBonusCreditCents = Number(row.stripe_metadata?.loyalty_bonus_credit_cents ?? loyaltyBonusCreditCents) || 0;
      }
      if (!entryTime && metadataCheckIn) {
        entryTime = metadataCheckIn;
      }
      if (!exitTime && metadataCheckOut) {
        exitTime = metadataCheckOut;
      }
      const locationCandidate = activityLocationId;
      if (locationCandidate) {
        const byId = await dbClient
          .from('locations')
          .select('id,display_id,name')
          .eq('id', locationCandidate)
          .maybeSingle();
        let locationRow = byId.data as
          | { id?: string | null; display_id?: string | null; name?: string | null }
          | null;
        if (!locationRow) {
          const byDisplayId = await dbClient
            .from('locations')
            .select('id,display_id,name')
            .eq('display_id', locationCandidate)
            .maybeSingle();
          locationRow = byDisplayId.data as
            | { id?: string | null; display_id?: string | null; name?: string | null }
            | null;
        }
        if (locationRow) {
          activityLocationName = locationRow.name ? normalizeLocationName(String(locationRow.name)) : null;
          activityLocationDisplayId = locationRow.display_id ? String(locationRow.display_id) : null;
          if (!activityLocationId && locationRow.id) {
            activityLocationId = String(locationRow.id);
          }
        }
      }
    } else {
      entryTime = metadataCheckIn || null;
      exitTime = metadataCheckOut || null;
    }
    return NextResponse.json({
      session_id: session.id,
      ref_id: session.id.slice(-8),
      email: email || null,
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? 'eur',
      flow_type: sessionMetadata.flow_type ?? null,
      location_id: activityLocationId,
      location_name: activityLocationName,
      location_display_id: activityLocationDisplayId,
      check_in: entryTime,
      check_out: exitTime,
      wallet_topup_credit_cents: walletTopupCreditCents,
      wallet_debit_applied_cents: walletDebitAppliedCents,
      loyalty_bonus_credit_cents: loyaltyBonusCreditCents,
      membership_exists: membershipExists,
      email_verified: emailVerified,
    });
  } catch (error) {
    let fallback = await buildFallbackSummaryFromParkingSession(sessionId);
    if (
      fallback &&
      !fallback.location_name &&
      (fallbackDisplayId || fallbackLocationId || fallback.location_id) &&
      (supabaseAdmin ?? supabase)
    ) {
      const locationHintCandidates = [fallbackDisplayId, fallbackLocationId, fallback.location_id ?? '']
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      const dbClient = supabaseAdmin ?? supabase;
      if (!dbClient) {
        return NextResponse.json(fallback);
      }
      for (const candidate of locationHintCandidates) {
        const byId = await dbClient
          .from('locations')
          .select('id,display_id,name')
          .eq('id', candidate)
          .maybeSingle();
        let locationRow = byId.data as
          | { id?: string | null; display_id?: string | null; name?: string | null }
          | null;
        if (!locationRow) {
          const byDisplayId = await dbClient
            .from('locations')
            .select('id,display_id,name')
            .eq('display_id', candidate)
            .maybeSingle();
          locationRow = byDisplayId.data as
            | { id?: string | null; display_id?: string | null; name?: string | null }
            | null;
        }
        if (locationRow) {
          fallback = {
            ...fallback,
            location_name: locationRow.name
              ? normalizeLocationName(String(locationRow.name))
              : fallback.location_name,
            location_display_id: locationRow.display_id
              ? String(locationRow.display_id)
              : fallback.location_display_id,
          };
          break;
        }
      }
    }
    if (fallback) {
      return NextResponse.json(fallback);
    }
    const message = error instanceof Error ? error.message : 'stripe_session_lookup_failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
