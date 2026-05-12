import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';
import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;
try {
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0]!;
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  }
} catch {}

async function sendOwnerPushNotification(locationId: string, sessionData: { plate: string; amount: number; email: string; entryTime?: string }) {
  try {
    if (!firebaseApp || !supabaseAdmin) return;
    const { data: location } = await supabaseAdmin.from('locations').select('owner_id, name').eq('id', locationId).single();
    if (!location?.owner_id) return;

    const { data: tokens } = await supabaseAdmin.from('device_tokens').select('token').eq('user_id', location.owner_id);
    if (!tokens?.length) return;

    const amountStr = sessionData.amount > 0 ? `€${(sessionData.amount / 100).toFixed(2)}` : 'Free';
    const title = `Nova rezervacija — ${location.name || locationId}`;
    const entryTimeStr = sessionData.entryTime ? new Date(sessionData.entryTime).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }) : '';
    const body = [sessionData.plate ? `Tablica: ${sessionData.plate}` : null, entryTimeStr, amountStr].filter(Boolean).join(' · ');

    await supabaseAdmin.from('notifications').insert({ user_id: location.owner_id, type: 'payment', title, data: { body } });

    const messaging = admin.messaging(firebaseApp);
    await Promise.all(tokens.map(t => messaging.send({ token: t.token, notification: { title, body } }).catch(() => null)));
  } catch (err) {
    console.error('[webhook] push notification failed:', err);
  }
}

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

function deriveReservationCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 41 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  const num = 1000 + (Math.abs(hash) % 9000);
  return `RZ-${num}`;
}

function deriveValetCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  return `VLT-${1000 + (Math.abs(hash) % 9000)}`;
}

function deriveShuttleCodeEmail(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 37 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  return `SH-${1000 + (Math.abs(hash) % 9000)}`;
}

function formatDateTimeHr(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  const date = parsed.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Zagreb' });
  const time = parsed.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zagreb' });
  return `${date} ${time}`;
}

function formatAmountEmail(cents: number, currency: string): string {
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function buildBookingConfirmationEmail(params: {
  sessionId: string;
  reservationCode: string;
  email: string;
  locationName: string | null;
  locationDisplayId: string | null;
  entryTime: string | null;
  exitTime: string | null;
  amountCents: number;
  currency: string;
  valetEnabled: boolean;
  shuttleEnabled: boolean;
  membersUrl: string;
}): string {
  const {
    sessionId, reservationCode, email, locationName, locationDisplayId,
    entryTime, exitTime, amountCents, currency, valetEnabled, shuttleEnabled, membersUrl,
  } = params;

  const BASE = 'https://www.payparq.com';
  const locationLabel = locationName || locationDisplayId || 'Safe Parking by PayParq';
  const successUrl = `${BASE}/success?session_id=${encodeURIComponent(sessionId)}`;
  const insuranceUrl = `${BASE}/insurance/apply?email=${encodeURIComponent(email)}`;
  const invoiceUrl = `${BASE}/api/members/invoice?mode=document&stripe_session_id=${encodeURIComponent(sessionId)}&fallback_stripe_session_id=${encodeURIComponent(sessionId)}`;

  const card = (bg: string, border: string, content: string) =>
    `<table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:16px;border:1px solid ${border};margin-top:12px;"><tr><td style="padding:16px;">${content}</td></tr></table>`;

  const sectionLabel = (text: string) =>
    `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#999;margin-bottom:10px;">${text}</div>`;

  const trackingUrl = `https://www.payparq.com/api/track?session=${encodeURIComponent(sessionId)}`;

  const valetTicket = valetEnabled ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #d0c4ff;margin-top:12px;">
      <tr><td style="background:#5F3DFC;padding:10px 14px;">
        <span style="color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Valet potvrda</span>
        <span style="float:right;color:rgba(255,255,255,0.75);font-size:11px;font-family:monospace;">${deriveValetCode(sessionId)}</span>
      </td></tr>
      <tr><td style="background:#F5F2FF;padding:12px 14px;font-size:12px;color:#111;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;padding-bottom:6px;">Lokacija</td><td style="font-weight:600;text-align:right;padding-bottom:6px;">${locationLabel}</td></tr>
          <tr><td style="color:#888;padding-bottom:6px;">1. vožnja</td><td style="font-weight:600;text-align:right;padding-bottom:6px;">${formatDateTimeHr(entryTime)}</td></tr>
          <tr><td style="color:#888;">2. vožnja</td><td style="font-weight:600;text-align:right;">${formatDateTimeHr(exitTime)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="background:rgba(95,61,252,0.08);padding:10px 14px;text-align:center;font-size:10px;color:rgba(95,61,252,0.6);">Pokažite kod valet agentu pri predaji ključeva</td></tr>
      <tr><td style="padding:10px 14px;text-align:center;">
        <a href="${trackingUrl}" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#5F3DFC;color:#fff;font-size:12px;font-weight:700;text-decoration:none;">Prati vozača uživo →</a>
        <div style="margin-top:6px;font-size:10px;color:#aaa;">Dostupno 15 min prije polaska</div>
      </td></tr>
    </table>` : '';

  const shuttleTicket = shuttleEnabled ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #a7d8c9;margin-top:12px;">
      <tr><td style="background:#0F6E56;padding:10px 14px;">
        <span style="color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">Shuttle potvrda</span>
        <span style="float:right;color:rgba(255,255,255,0.75);font-size:11px;font-family:monospace;">${deriveShuttleCodeEmail(sessionId)}</span>
      </td></tr>
      <tr><td style="background:#E1F5EE;padding:12px 14px;font-size:12px;color:#111;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;padding-bottom:6px;">Lokacija</td><td style="font-weight:600;text-align:right;padding-bottom:6px;">${locationLabel}</td></tr>
          <tr><td style="color:#888;padding-bottom:6px;">1. vožnja</td><td style="font-weight:600;text-align:right;padding-bottom:6px;">${formatDateTimeHr(entryTime)}</td></tr>
          <tr><td style="color:#888;">2. vožnja</td><td style="font-weight:600;text-align:right;">${formatDateTimeHr(exitTime)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="background:rgba(15,110,86,0.08);padding:10px 14px;text-align:center;font-size:10px;color:rgba(15,110,86,0.6);">Pokažite kod vozaču shuttlea pri ukrcaju</td></tr>
      <tr><td style="padding:10px 14px;text-align:center;">
        <a href="${trackingUrl}" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#0F6E56;color:#fff;font-size:12px;font-weight:700;text-decoration:none;">Prati vozača uživo →</a>
        <div style="margin-top:6px;font-size:10px;color:#aaa;">Dostupno 15 min prije polaska</div>
      </td></tr>
    </table>` : '';

  // Produži boravak — 4 link-buttons pointing to success page
  const extendCard = card('#fff', 'rgba(0,0,0,0.08)', `
    ${sectionLabel('Produži boravak')}
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      ${['+1h', '+2h', '+1d', '+2d'].map(label => `
        <td width="25%" style="padding:0 3px;">
          <a href="${successUrl}" style="display:block;text-align:center;padding:9px 0;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:#f9f9f9;font-size:13px;font-weight:600;color:#111;text-decoration:none;">${label}</a>
        </td>`).join('')}
    </tr></table>
    <div style="margin-top:8px;font-size:10px;color:#bbb;text-align:center;">Kliknite za produženje na stranici rezervacije</div>
  `);

  // Summon section — only if valet or shuttle included
  const summonCard = (valetEnabled || shuttleEnabled) ? card('#fff', 'rgba(0,0,0,0.08)', `
    ${sectionLabel('Pozovi vozilo')}
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      ${valetEnabled ? `<td width="${shuttleEnabled ? '50%' : '100%'}" style="padding:0 3px;">
        <a href="${successUrl}" style="display:block;text-align:center;padding:14px 0;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:#f9f9f9;font-size:13px;font-weight:600;color:#111;text-decoration:none;">
          🚗 Pozovi auto<br><span style="font-size:10px;font-weight:400;color:#999;">Valet dovozi · ~6 min</span>
        </a>
      </td>` : ''}
      ${shuttleEnabled ? `<td width="${valetEnabled ? '50%' : '100%'}" style="padding:0 3px;">
        <a href="${successUrl}" style="display:block;text-align:center;padding:14px 0;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:#f9f9f9;font-size:13px;font-weight:600;color:#111;text-decoration:none;">
          🚌 Pozovi shuttle<br><span style="font-size:10px;font-weight:400;color:#999;">1 smjer · ~4 min</span>
        </a>
      </td>` : ''}
    </tr></table>
  `) : '';

  // Quick actions
  const actionBtn = (href: string, label: string) =>
    `<a href="${href}" style="display:block;text-align:center;padding:12px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);background:#fff;font-size:13px;font-weight:500;color:#111;text-decoration:none;margin-bottom:8px;">${label}</a>`;

  const actionsCard = card('#fff', 'rgba(0,0,0,0.08)', `
    ${sectionLabel('Brze akcije')}
    ${actionBtn('https://m.uber.com/', 'Naruči Uber')}
    ${actionBtn(insuranceUrl, 'Osiguranje vozila')}
    ${actionBtn(invoiceUrl, 'Preuzmi potvrdu')}
  `);

  return `<!DOCTYPE html>
<html lang="hr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">

      <!-- Brand -->
      <tr><td style="padding-bottom:20px;text-align:center;">
        <span style="font-size:20px;font-weight:700;color:#111;">Payparq</span>
      </td></tr>

      <!-- 1. Rezervacija potvrđena card -->
      <tr><td style="background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,0.08);padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td width="40" valign="top" style="padding-top:2px;">
              <table cellpadding="0" cellspacing="0"><tr><td style="width:36px;height:36px;border-radius:50%;background:#E1F5EE;text-align:center;vertical-align:middle;font-size:16px;font-weight:700;color:#0F6E56;">✓</td></tr></table>
            </td>
            <td style="padding-left:12px;">
              <div style="font-size:11px;color:#999;">Rezervacija potvrđena &nbsp;<span style="font-family:monospace;color:#333;font-weight:700;">${reservationCode}</span></div>
              <div style="font-size:15px;font-weight:700;color:#111;margin-top:3px;">${locationLabel}</div>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;">
          <tr>
            <td width="50%" style="padding-bottom:10px;"><div style="color:#999;margin-bottom:2px;">Lokacija ID</div><div style="font-weight:700;font-family:monospace;color:#111;">${locationDisplayId || '—'}</div></td>
            <td width="50%" style="padding-bottom:10px;"><div style="color:#999;margin-bottom:2px;">Cijena</div><div style="font-weight:700;color:#111;">${formatAmountEmail(amountCents, currency)}</div></td>
          </tr>
          <tr>
            <td><div style="color:#999;margin-bottom:2px;">Od</div><div style="font-weight:700;color:#111;">${formatDateTimeHr(entryTime)}</div></td>
            <td><div style="color:#999;margin-bottom:2px;">Kraj</div><div style="font-weight:700;color:#111;">${formatDateTimeHr(exitTime)}</div></td>
          </tr>
        </table>
        ${valetTicket}
        ${shuttleTicket}
      </td></tr>

      <!-- 2. Produži boravak -->
      <tr><td>${extendCard}</td></tr>

      <!-- 3. Pozovi vozilo (conditional) -->
      ${summonCard ? `<tr><td>${summonCard}</td></tr>` : ''}

      <!-- 4. Brze akcije -->
      <tr><td>${actionsCard}</td></tr>

      <!-- 5. Members zona CTA -->
      <tr><td style="padding-top:16px;text-align:center;">
        <a href="${membersUrl}" style="display:inline-block;padding:13px 32px;border-radius:999px;background:#5F3DFC;color:#fff;text-decoration:none;font-weight:700;font-size:14px;">Otvori Members zonu</a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:24px;text-align:center;font-size:11px;color:#bbb;line-height:1.6;">
        Payparq &middot; <a href="https://www.payparq.com" style="color:#bbb;">payparq.com</a><br>
        Ova poruka šalje se automatski. Molimo ne odgovarajte na nju.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

async function sendBookingConfirmation(
  session: Stripe.Checkout.Session,
  client: SupabaseClient,
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_SECRET_KEY;
  const fromAddress = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PayParq <team@info.payparq.com>';
  const meta = session.metadata ?? {};
  const email = [
    session.customer_details?.email,
    session.customer_email,
    meta.customer_email,
    meta.email,
  ].map((v) => (v ?? '').toString().trim().toLowerCase()).find((v) => v.length > 0) ?? '';

  console.log(`📧 sendBookingConfirmation: email="${email}" key=${resendKey ? 'set' : 'MISSING'}`);
  if (!email || !resendKey) return;

  const reservationCode = deriveReservationCode(session.id);
  const locationId = (meta.location_id ?? '').toString().trim();
  const entryIso = meta.check_in
    ? new Date(meta.check_in as string).toISOString()
    : new Date(session.created * 1000).toISOString();
  const exitIso = meta.check_out
    ? new Date(meta.check_out as string).toISOString()
    : new Date(new Date(entryIso).getTime() + 3_600_000).toISOString();

  const metaFlowType = (meta.flow_type ?? '').toString().trim().toLowerCase();
  let locationName: string | null = null;
  let locationDisplayId: string | null = (meta.display_id as string | null) ?? null;
  let valetEnabled = false;
  let shuttleEnabled = metaFlowType === 'park_now';
  try {
    if (locationId) {
      const { data: locRow } = await client
        .from('locations')
        .select('name,display_id,valet_enabled,shuttle_enabled')
        .eq('id', locationId)
        .maybeSingle();
      if (locRow) {
        locationName = (locRow as { name?: string | null }).name ?? null;
        locationDisplayId = (locRow as { display_id?: string | null }).display_id ?? locationDisplayId;
        valetEnabled = Boolean((locRow as { valet_enabled?: boolean | null }).valet_enabled);
        if (!shuttleEnabled) shuttleEnabled = Boolean((locRow as { shuttle_enabled?: boolean | null }).shuttle_enabled);
      }
    }
  } catch { /* best effort */ }

  const html = buildBookingConfirmationEmail({
    sessionId: session.id,
    reservationCode,
    email,
    locationName,
    locationDisplayId,
    entryTime: entryIso,
    exitTime: exitIso,
    amountCents: Number(session.amount_total ?? 0),
    currency: session.currency || 'EUR',
    valetEnabled,
    shuttleEnabled,
    membersUrl: `https://www.payparq.com/members?email=${encodeURIComponent(email)}`,
  });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress, to: email, subject: `Rezervacija potvrđena · ${reservationCode}`, html }),
    });
    const resBody = await res.text().catch(() => '');
    console.log(`📧 Resend: ${res.status} to ${email} (${reservationCode}) — ${resBody}`);
  } catch (e) {
    console.error('📧 Email error:', e);
  }
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
      .select('id, payment_status')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking existing session:', fetchError);
    }

    if (existingSession) {
      const existingPayStatus = ((existingSession as { id: string; payment_status?: string | null }).payment_status ?? '').toLowerCase();
      if (existingPayStatus === 'paid') {
        console.log(`🔄 Session ${session.id} already paid. Skipping.`);
        return NextResponse.json({ received: true });
      }
      // Pre-seeded pending row — mark as paid
      console.log(`🔄 Session ${session.id} was pending, marking paid.`);
      await client
        .from('parking_sessions')
        .update({ payment_status: 'paid', status: 'active', updated_at: new Date().toISOString() })
        .eq('stripe_session_id', session.id);
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

    if (flowType === 'addons') {
      console.log('✅ Addons payment received:', session.id, sessionMetadata.addons ?? '');
      const originalSessionId = (sessionMetadata.original_session_id ?? '').toString().trim();
      if (originalSessionId) {
        const dbClient = supabaseAdmin ?? supabase;
        if (dbClient) {
          try {
            const { data: origRows } = await dbClient
              .from('parking_sessions')
              .select('id,stripe_metadata')
              .eq('stripe_session_id', originalSessionId)
              .limit(1);
            const origRow = Array.isArray(origRows) ? origRows[0] ?? null : null;
            if (origRow) {
              const existingMeta = (origRow as { stripe_metadata?: Record<string, unknown> | null }).stripe_metadata ?? {};
              const updatedMeta = {
                ...existingMeta,
                purchased_addons: (sessionMetadata.addons ?? '').toString(),
                addon_session_id: session.id,
                ...(sessionMetadata.valet_code ? { valet_code: sessionMetadata.valet_code } : {}),
              };
              await dbClient
                .from('parking_sessions')
                .update({ stripe_metadata: updatedMeta })
                .eq('id', (origRow as { id: string }).id);
            }
          } catch (e) {
            console.error('Failed to update original session with addon info:', e);
          }
        }
      }
      return NextResponse.json({ received: true });
    }
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

    // 2b. SPOT UPGRADE
    if (sessionMetadata.flow_type === 'spot_upgrade') {
      const newSpotId = (sessionMetadata.new_spot_id ?? '').toString().trim();
      const currentSpotId = (sessionMetadata.current_spot_id ?? '').toString().trim();
      const originalSessionId = (sessionMetadata.original_session_id ?? '').toString().trim();
      if (newSpotId && originalSessionId) {
        try {
          if (currentSpotId) {
            await client.from('spot_assignments').update({ status: 'released' }).eq('spot_id', currentSpotId).eq('parking_session_id', originalSessionId);
          }
          await client.from('spot_assignments').upsert({
            spot_id: newSpotId,
            parking_session_id: originalSessionId,
            status: 'active',
          }, { onConflict: 'parking_session_id' });
          console.log(`🅿️ Spot upgraded to ${newSpotId} for session ${originalSessionId}`);
        } catch (e) {
          console.error('⚠️ Spot upgrade assignment failed:', e);
        }
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
    await sendBookingConfirmation(session, client);
    await sendOwnerPushNotification(location_id, {
      plate: plate_number || 'Unknown',
      amount: session.amount_total || 0,
      email: email || '',
      entryTime,
    });

    // 4. AUTO-ASSIGN SPOT (best effort)
    try {
      if (location_id) {
        const { data: availableSpots } = await client
          .from('spots')
          .select('id')
          .eq('location_id', location_id)
          .eq('active', true);

        if (availableSpots && availableSpots.length > 0) {
          const spotIds = (availableSpots as { id: string }[]).map((s) => s.id);
          const { data: takenAssignments } = await client
            .from('spot_assignments')
            .select('spot_id')
            .in('spot_id', spotIds)
            .eq('status', 'active');

          const takenIds = new Set(
            (takenAssignments as { spot_id: string }[] | null)?.map((a) => a.spot_id) ?? []
          );
          const freeSpots = spotIds.filter((id) => !takenIds.has(id));

          if (freeSpots.length > 0) {
            const pickedId = freeSpots[Math.floor(Math.random() * freeSpots.length)];
            await client.from('spot_assignments').insert({
              spot_id: pickedId,
              parking_session_id: session.id,
              status: 'active',
            });
            console.log(`🅿️ Spot assigned: ${pickedId}`);
          }
        }
      }
    } catch (e) {
      console.error('⚠️ Spot assignment failed:', e);
    }

    // 5. UPDATE OCCUPANCY (Optional, best effort)
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

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log('✅ PaymentIntent succeeded:', paymentIntent.id);

    const meta = paymentIntent.metadata ?? {};
    let location_id = (meta.location_id ?? '').toString().trim();
    const plate_number = (meta.plate_number ?? meta.plate ?? '').toString().trim() || 'UNKNOWN';
    if (!location_id) location_id = 'DEFAULT_LOC';

    const client = supabaseAdmin ?? supabase;
    if (!client) {
      console.warn('Supabase client not configured; skipping DB writes for PaymentIntent.');
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if already stored
    const { data: existing } = await client
      .from('parking_sessions')
      .select('id')
      .eq('stripe_session_id', paymentIntent.id)
      .maybeSingle();

    if (existing) {
      console.log(`🔄 PaymentIntent ${paymentIntent.id} already recorded. Skipping.`);
      return NextResponse.json({ received: true });
    }

    const checkInIso = parseMetadataDatetime(meta.check_in);
    const checkOutIso = parseMetadataDatetime(meta.check_out);
    const pricingType = (meta.pricing_type ?? 'hourly').toString();
    const entryTime = checkInIso ?? new Date(paymentIntent.created * 1000).toISOString();
    const exitTime =
      checkOutIso ??
      resolveExitTimeFromQuantity({ entryIso: entryTime, quantity: 1, pricingType });

    const durationMinutes =
      exitTime
        ? Math.max(1, Math.round((new Date(exitTime).getTime() - new Date(entryTime).getTime()) / 60000))
        : null;

    const email =
      [paymentIntent.receipt_email, meta.customer_email, meta.email]
        .map((v) => (v ?? '').toString().trim().toLowerCase())
        .find((v) => v.length > 0) ?? '';

    const customerPhone = (meta.customer_phone ?? '').toString().trim();
    const amountCents = paymentIntent.amount ?? 0;

    const { error: insertError } = await client.from('parking_sessions').insert({
      location_id,
      plate: plate_number,
      mobile: customerPhone,
      email,
      price: amountCents / 100,
      currency: (paymentIntent.currency || 'eur').toLowerCase(),
      stripe_session_id: paymentIntent.id,
      payment_status: 'paid',
      status: 'active',
      entry_time: entryTime,
      exit_time: exitTime,
      quantity: 1,
      duration_minutes: durationMinutes,
      stripe_metadata: {
        ...meta,
        source: 'payment_intent_succeeded',
      },
    });

    if (insertError) {
      console.error('❌ Supabase INSERT failed (PaymentIntent):', insertError);
      return NextResponse.json({ error: insertError.message, received: true });
    }

    console.log('✨ Successfully inserted parking session from PaymentIntent!');
    await sendOwnerPushNotification(location_id, {
      plate: plate_number,
      amount: amountCents,
      email,
      entryTime,
    });
  }

  return NextResponse.json({ received: true });
}
