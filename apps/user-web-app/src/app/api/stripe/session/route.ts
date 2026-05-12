import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';
import { normalizeLocationName } from '@/lib/locationPricing';

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
  // Naive datetime is interpreted as Zagreb local time, convert to UTC
  let utcMillis = Date.UTC(naive.year, naive.month - 1, naive.day, naive.hour, naive.minute, naive.second);
  const offsetMinutes = resolveZagrebOffsetMinutes(new Date(utcMillis));
  utcMillis -= offsetMinutes * 60000;
  return new Date(utcMillis).toISOString();
}

function resolveStripeSecretKey(): string | null {
  const secret = (process.env.STRIPE_SECRET_KEY ?? '').trim();
  if (!secret) return null;
  if (!/^sk_(test|live)_/i.test(secret)) return null;
  if (/your_stripe|replace_me|changeme|example/i.test(secret)) return null;
  return secret;
}

async function resolveValetAttendant(locationId: string): Promise<string | null> {
  const dbClient = supabaseAdmin;
  if (!dbClient || !locationId) return null;
  try {
    const { data: assignments } = await dbClient
      .from('officer_assignments')
      .select('officer_id')
      .eq('location_id', locationId)
      .limit(1);
    const officerId = (assignments as { officer_id?: string }[] | null)?.[0]?.officer_id ?? null;
    if (!officerId) return null;
    const { data: { user } } = await dbClient.auth.admin.getUserById(officerId);
    return (user?.user_metadata?.full_name as string | null) ?? null;
  } catch {
    return null;
  }
}

async function buildFallbackSummaryFromParkingSession(sessionId: string) {
  const dbClient = supabaseAdmin ?? supabase;
  if (!dbClient) return null;
  const { data: sessionRows } = await dbClient
    .from('parking_sessions')
    .select('stripe_session_id,location_id,entry_time,exit_time,email,price,amount_cents,currency,type,stripe_metadata,plate')
    .eq('stripe_session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1);
  const sessionRow = Array.isArray(sessionRows) ? sessionRows[0] ?? null : null;
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
    plate?: string | null;
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
      .select('id,display_id,name,valet_enabled,shuttle_enabled')
      .eq('id', locationCandidate)
      .maybeSingle();
    let locationRow = byId.data as
      | { id?: string | null; display_id?: string | null; name?: string | null }
      | null;
    if (!locationRow) {
      const byDisplayId = await dbClient
        .from('locations')
        .select('id,display_id,name,valet_enabled,shuttle_enabled')
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
    plate: (row.plate ?? (row.stripe_metadata?.plate as string | null) ?? (row.stripe_metadata?.plateNumber as string | null)) || null,
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
        plate: null,
        wallet_topup_credit_cents: 0,
        wallet_debit_applied_cents: 0,
        loyalty_bonus_credit_cents: 0,
        membership_exists: false,
        email_verified: false,
      },
      { status: 400 }
    );
  }
  // PaymentIntent flow (Stripe Elements) — ID starts with pi_
  const isPaymentIntent = sessionId.startsWith('pi_');

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
        plate: null,
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

  // ── PaymentIntent branch (Stripe Elements checkout) ──────────────────────
  if (isPaymentIntent) {
    try {
      const pi = await stripe.paymentIntents.retrieve(sessionId);
      const meta = pi.metadata ?? {};
      const email = ((pi as unknown as { receipt_email?: string | null }).receipt_email ?? '').trim().toLowerCase();
      const locationId = (meta.location_id ?? '').trim() || null;
      const checkIn = parseMetadataDatetime(meta.check_in ?? null);
      const checkOut = parseMetadataDatetime(meta.check_out ?? null);

      let locationName: string | null = null;
      let locationDisplayId: string | null = null;
      let valetEnabled = false;
      let shuttleEnabled = false;
      let addonsConfig: Record<string, unknown> = {};
      let valetAttendant: string | null = null;
      let lotPoint: { lat: number; lng: number } | null = null;
      let membershipExists = false;
      let emailVerified = false;

      const dbClient = supabaseAdmin ?? supabase;
      if (dbClient && locationId) {
        const { data: locRow } = await dbClient
          .from('locations')
          .select('id,display_id,name,lat,lng,valet_enabled,shuttle_enabled,addons_config')
          .eq('id', locationId)
          .maybeSingle();
        const lr = locRow as { id?: string; display_id?: string; name?: string; lat?: number; lng?: number; valet_enabled?: boolean; shuttle_enabled?: boolean; addons_config?: Record<string, unknown> } | null;
        if (lr) {
          locationName = lr.name ? normalizeLocationName(lr.name) : null;
          locationDisplayId = lr.display_id ?? null;
          valetEnabled = lr.valet_enabled ?? false;
          shuttleEnabled = lr.shuttle_enabled ?? false;
          addonsConfig = lr.addons_config ?? {};
          if (lr.lat && lr.lng) lotPoint = { lat: lr.lat, lng: lr.lng };
          valetAttendant = await resolveValetAttendant(lr.id ?? locationId);
        }
      }
      if (email && supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (!error) {
          const existing = data.users.find((u) => (u.email ?? '').trim().toLowerCase() === email);
          membershipExists = Boolean(existing);
          emailVerified = Boolean(existing?.email_confirmed_at);
        }
      }

      return NextResponse.json({
        session_id: pi.id,
        ref_id: pi.id.slice(-8),
        email: email || null,
        amount_total: pi.amount ?? 0,
        currency: pi.currency ?? 'eur',
        flow_type: meta.flow_type ?? null,
        location_id: locationId,
        location_name: locationName,
        location_display_id: locationDisplayId,
        valet_enabled: valetEnabled,
        shuttle_enabled: shuttleEnabled,
        addons_config: addonsConfig,
        valet_attendant: valetAttendant,
        lot_point: lotPoint,
        assigned_spot: null,
        check_in: checkIn,
        check_out: checkOut,
        plate: null,
        wallet_topup_credit_cents: 0,
        wallet_debit_applied_cents: 0,
        loyalty_bonus_credit_cents: 0,
        membership_exists: membershipExists,
        email_verified: emailVerified,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'payment_intent_lookup_failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  // ── Checkout Session branch (existing — unchanged below) ─────────────────
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionMetadata = session.metadata ?? {};
    let stripeLineItemQuantity = 0;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
      });
      stripeLineItemQuantity = lineItems.data.reduce((sum, item) => {
        const qty = Number(item?.quantity ?? 0);
        return Number.isFinite(qty) && qty > 0 ? sum + qty : sum;
      }, 0);
    } catch {}
    if (stripeLineItemQuantity <= 1) {
      const subtotalCents = Number(session.amount_subtotal ?? 0);
      const unitCents = Number(sessionMetadata.amount_cents ?? 0);
      if (
        Number.isFinite(subtotalCents) &&
        Number.isFinite(unitCents) &&
        subtotalCents > 0 &&
        unitCents > 0
      ) {
        const derivedQuantity = Math.round(subtotalCents / unitCents);
        if (Number.isFinite(derivedQuantity) && derivedQuantity > 1) {
          stripeLineItemQuantity = derivedQuantity;
        }
      }
    }
    const email = (session.customer_details?.email ?? '').trim().toLowerCase();
    const metadataCheckIn = (sessionMetadata.check_in ?? '').toString().trim();
    const metadataCheckOut = (sessionMetadata.check_out ?? '').toString().trim();
    let entryTime: string | null = null;
    let exitTime: string | null = null;
    let foundDbSessionWindow = false;
    let activityLocationId =
      (sessionMetadata.display_id ?? sessionMetadata.location_id ?? '').toString().trim() || null;
    let activityLocationName: string | null = null;
    let activityLocationDisplayId: string | null = null;
    let valetEnabled = false;
    let shuttleEnabled = false;
    let addonsConfig: Record<string, unknown> = {};
    let valetAttendant: string | null = null;
    let lotPoint: { lat: number; lng: number } | null = null;
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
      const { data: sessionRows } = await dbClient
        .from('parking_sessions')
        .select('location_id,entry_time,exit_time,stripe_metadata')
        .eq('stripe_session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const sessionRow = Array.isArray(sessionRows) ? sessionRows[0] ?? null : null;
      if (sessionRow) {
        foundDbSessionWindow = true;
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
        entryTime = parseMetadataDatetime(metadataCheckIn);
      }
      if (!exitTime && metadataCheckOut) {
        exitTime = parseMetadataDatetime(metadataCheckOut);
      }
      if (!foundDbSessionWindow && entryTime && stripeLineItemQuantity > 1) {
        const typeRaw = (sessionMetadata.type ?? 'hourly').toString().trim().toLowerCase();
        const durationMinutes =
          typeRaw === 'monthly'
            ? stripeLineItemQuantity * 30 * 24 * 60
            : typeRaw === 'daily'
              ? stripeLineItemQuantity * 24 * 60
              : stripeLineItemQuantity * 60;
        const startDate = new Date(entryTime);
        if (!Number.isNaN(startDate.getTime())) {
          exitTime = new Date(startDate.getTime() + durationMinutes * 60 * 1000).toISOString();
        }
      }
      const locationCandidate = activityLocationId;
      if (locationCandidate) {
        const byId = await dbClient
          .from('locations')
          .select('id,display_id,name,lat,lng')
          .eq('id', locationCandidate)
          .maybeSingle();
        let locationRow = byId.data as
          | { id?: string | null; display_id?: string | null; name?: string | null; lat?: number | null; lng?: number | null }
          | null;
        if (!locationRow) {
          const byDisplayId = await dbClient
            .from('locations')
            .select('id,display_id,name,lat,lng')
            .eq('display_id', locationCandidate)
            .maybeSingle();
          locationRow = byDisplayId.data as
            | { id?: string | null; display_id?: string | null; name?: string | null; lat?: number | null; lng?: number | null }
            | null;
        }
        if (locationRow) {
          activityLocationName = locationRow.name ? normalizeLocationName(String(locationRow.name)) : null;
          activityLocationDisplayId = locationRow.display_id ? String(locationRow.display_id) : null;
          if (!activityLocationId && locationRow.id) {
            activityLocationId = String(locationRow.id);
          }
          if (locationRow.lat && locationRow.lng) {
            lotPoint = { lat: Number(locationRow.lat), lng: Number(locationRow.lng) };
          }
        }
        // Separate query for service flags — gracefully handles missing columns
        const resolvedId = locationRow?.id ?? locationCandidate;
        try {
          const { data: flagsRow } = await dbClient
            .from('locations')
            .select('valet_enabled,shuttle_enabled,addons_config')
            .eq('id', resolvedId)
            .maybeSingle();
          valetEnabled = (flagsRow as { valet_enabled?: boolean | null } | null)?.valet_enabled ?? false;
          shuttleEnabled = (flagsRow as { shuttle_enabled?: boolean | null } | null)?.shuttle_enabled ?? false;
          addonsConfig = (flagsRow as { addons_config?: Record<string, unknown> | null } | null)?.addons_config ?? {};
        } catch {}
        // Query city manager (officer assignment) for valet attendant name
        valetAttendant = await resolveValetAttendant(resolvedId);
      }
    } else {
      entryTime = metadataCheckIn || null;
      exitTime = metadataCheckOut || null;
    }
    // Park & Taxi always includes shuttle with 2 credits
    if (sessionMetadata.flow_type === 'park_now') {
      shuttleEnabled = true;
    }

    // Spot assignment
    let assignedSpot: { label: string; lat: number | null; lng: number | null; col_num: number | null } | null = null;
    if (dbClient) {
      try {
        const { data: assignmentRows } = await dbClient
          .from('spot_assignments')
          .select('spot_id')
          .eq('parking_session_id', session.id)
          .eq('status', 'active')
          .limit(1);
        const spotId = (assignmentRows as { spot_id: string }[] | null)?.[0]?.spot_id ?? null;
        if (spotId) {
          const { data: spotRow } = await dbClient
            .from('spots')
            .select('label,lat,lng,col_num')
            .eq('id', spotId)
            .single();
          const sr = spotRow as { label?: string; lat?: number | null; lng?: number | null; col_num?: number | null } | null;
          if (sr?.label) assignedSpot = { label: sr.label, lat: sr.lat ?? null, lng: sr.lng ?? null, col_num: sr.col_num ?? null };
        }
      } catch {}
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
      valet_enabled: valetEnabled,
      shuttle_enabled: shuttleEnabled,
      addons_config: addonsConfig,
      valet_attendant: valetAttendant,
      lot_point: lotPoint,
      assigned_spot: assignedSpot,
      check_in: entryTime,
      check_out: exitTime,
      plate: null,
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
          .select('id,display_id,name,valet_enabled,shuttle_enabled')
          .eq('id', candidate)
          .maybeSingle();
        let locationRow = byId.data as
          | { id?: string | null; display_id?: string | null; name?: string | null }
          | null;
        if (!locationRow) {
          const byDisplayId = await dbClient
            .from('locations')
            .select('id,display_id,name,valet_enabled,shuttle_enabled')
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
