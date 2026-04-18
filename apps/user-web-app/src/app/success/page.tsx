'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type AddonsConfigOption = { id: string; label: string; price_cents: number };
type AddonsConfigEntry = { enabled?: boolean; price_cents?: number; options?: AddonsConfigOption[]; lot_zone?: string };
type AddonsConfig = {
  valet?: AddonsConfigEntry;
  ev_charging?: AddonsConfigEntry;
  car_wash?: AddonsConfigEntry;
  fuel?: AddonsConfigEntry;
  shuttle?: AddonsConfigEntry;
  pickup_point?: { lat?: number; lng?: number; label?: string } | null;
  phone_sms?: string;
};

type SessionSummary = {
  session_id: string;
  ref_id: string;
  email: string | null;
  amount_total: number;
  currency: string;
  flow_type: string | null;
  location_id: string | null;
  location_name?: string | null;
  location_display_id?: string | null;
  check_in: string | null;
  check_out: string | null;
  wallet_topup_credit_cents?: number;
  wallet_debit_applied_cents?: number;
  loyalty_bonus_credit_cents?: number;
  membership_exists: boolean;
  email_verified: boolean;
  valet_enabled?: boolean | null;
  shuttle_enabled?: boolean | null;
  addons_config?: AddonsConfig | null;
  valet_attendant?: string | null;
};

type Credits = number | '∞';

function CreditBadge({ value }: { value: Credits }) {
  const label = value === '∞' ? '∞' : String(value);
  const isZero = value === 0;
  return (
    <span
      className="absolute top-2 right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1"
      style={{
        background: isZero ? '#f3f4f6' : '#5F3DFC',
        color: isZero ? '#9ca3af' : 'white',
      }}
    >
      {label}
    </span>
  );
}

function deriveTicketNumber(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  const num = 1000 + (Math.abs(hash) % 9000);
  return `VLT-${num}`;
}

function deriveShuttleCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 37 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  const num = 1000 + (Math.abs(hash) % 9000);
  return `SH-${num}`;
}

function ShuttleTicket({
  sessionId,
  locationName,
  checkIn,
  checkOut,
  attendant,
  pickupPoint,
  phoneSms,
  formatDateTime,
  onSummon,
}: {
  sessionId: string;
  locationName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  attendant: string | null;
  pickupPoint: { lat?: number; lng?: number; label?: string } | null;
  phoneSms: string | null;
  formatDateTime: (v: string | null | undefined) => string;
  onSummon?: (() => void) | null;
}) {
  const ticketNo = deriveShuttleCode(sessionId);
  return (
    <div className="rounded-2xl border border-[#0F6E56]/30 overflow-hidden">
      {/* Ticket header */}
      <div className="bg-[#0F6E56] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="1" y="8" width="22" height="10" rx="2"/>
            <path d="M5 18v2M19 18v2"/>
            <path d="M1 12h22"/>
            <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
          </svg>
          <span className="text-white text-[12px] font-semibold uppercase tracking-widest">Shuttle potvrda</span>
        </div>
        <span className="text-white/80 text-[11px] font-mono">{ticketNo}</span>
      </div>
      {/* Dashed divider */}
      <div className="border-t-2 border-dashed border-[#0F6E56]/20 mx-0" />
      {/* Ticket body */}
      <div className="bg-[#E1F5EE] px-4 py-3 space-y-2 text-[12px]">
        {locationName && (
          <div className="flex justify-between">
            <span className="text-black/50">Lokacija</span>
            <span className="font-semibold text-black text-right max-w-[55%] leading-tight">{locationName}</span>
          </div>
        )}
        {(pickupPoint?.label || (pickupPoint?.lat && pickupPoint?.lng)) && (() => {
          const mapsHref = pickupPoint?.lat && pickupPoint?.lng
            ? `https://www.google.com/maps?q=${pickupPoint.lat},${pickupPoint.lng}`
            : `https://www.google.com/maps/search/${encodeURIComponent(pickupPoint?.label ?? '')}`;
          return (
            <>
              {pickupPoint?.label && (
                <div className="flex justify-between">
                  <span className="text-black/50">Pick-up / Drop-off</span>
                  <span className="font-semibold text-black text-right max-w-[55%] leading-tight">{pickupPoint.label}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-black/50">Navigacija</span>
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0F6E56] underline text-[12px]">
                  Otvori kartu
                </a>
              </div>
            </>
          );
        })()}
        {checkIn && (
          <div className="flex justify-between">
            <span className="text-black/50">Check-in</span>
            <span className="font-semibold text-black">{formatDateTime(checkIn)}</span>
          </div>
        )}
        {checkOut && (
          <div className="flex justify-between">
            <span className="text-black/50">Check-out</span>
            <span className="font-semibold text-black">{formatDateTime(checkOut)}</span>
          </div>
        )}
        {attendant && (
          <div className="flex justify-between">
            <span className="text-black/50">Vozač</span>
            <span className="font-semibold text-black">{attendant}</span>
          </div>
        )}
        {phoneSms && (
          <div className="flex justify-between items-center">
            <span className="text-black/50">SMS / WhatsApp</span>
            <a
              href={`https://wa.me/${phoneSms.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0F6E56] underline"
            >
              {phoneSms}
            </a>
          </div>
        )}
      </div>
      {/* Bottom strip */}
      <div className="bg-[#0F6E56]/10 px-4 py-3 space-y-2">
        <p className="text-[10px] text-[#0F6E56]/70 font-medium text-center">Pokažite kod vozaču shuttlea pri ukrcaju · ETA 3–8 min</p>
        {onSummon && (
          <button
            type="button"
            onClick={onSummon}
            className="w-full py-2.5 rounded-xl bg-[#0F6E56] text-white text-[13px] font-semibold hover:bg-[#0a5241] transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="1" y="8" width="22" height="10" rx="2"/><path d="M5 18v2M19 18v2"/><path d="M1 12h22"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
            </svg>
            Pozovi shuttle
          </button>
        )}
      </div>
    </div>
  );
}

function ValetTicket({
  sessionId,
  locationName,
  checkIn,
  checkOut,
  attendant,
  pickupPoint,
  phoneSms,
  lotZone,
  formatDateTime,
  onSummon,
}: {
  sessionId: string;
  locationName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  attendant: string | null;
  pickupPoint: { lat?: number; lng?: number; label?: string } | null;
  phoneSms: string | null;
  lotZone: string | null;
  formatDateTime: (v: string | null | undefined) => string;
  onSummon?: (() => void) | null;
}) {
  const ticketNo = deriveTicketNumber(sessionId);
  return (
    <div className="rounded-2xl border border-[#5F3DFC]/30 overflow-hidden">
      {/* Ticket header */}
      <div className="bg-[#5F3DFC] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
            <rect x="9" y="11" width="14" height="10" rx="1"/>
            <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
          </svg>
          <span className="text-white text-[12px] font-semibold uppercase tracking-widest">Valet potvrda</span>
        </div>
        <span className="text-white/80 text-[11px] font-mono">{ticketNo}</span>
      </div>
      {/* Dashed divider */}
      <div className="border-t-2 border-dashed border-[#5F3DFC]/20 mx-0" />
      {/* Ticket body */}
      <div className="bg-[#F5F2FF] px-4 py-3 space-y-2 text-[12px]">
        {locationName && (
          <div className="flex justify-between">
            <span className="text-black/50">Lokacija</span>
            <span className="font-semibold text-black text-right max-w-[55%] leading-tight">{locationName}</span>
          </div>
        )}
        {(pickupPoint?.label || (pickupPoint?.lat && pickupPoint?.lng)) && (() => {
          const mapsHref = pickupPoint?.lat && pickupPoint?.lng
            ? `https://www.google.com/maps?q=${pickupPoint.lat},${pickupPoint.lng}`
            : `https://www.google.com/maps/search/${encodeURIComponent(pickupPoint?.label ?? '')}`;
          return (
            <>
              {pickupPoint?.label && (
                <div className="flex justify-between">
                  <span className="text-black/50">Drop-off / Pick-up</span>
                  <span className="font-semibold text-black text-right max-w-[55%] leading-tight">{pickupPoint.label}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-black/50">Navigacija</span>
                <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#5F3DFC] underline text-[12px]">
                  Otvori kartu
                </a>
              </div>
            </>
          );
        })()}
        {lotZone && (
          <div className="flex justify-between">
            <span className="text-black/50">Lot zona</span>
            <span className="font-semibold text-black text-right max-w-[55%]">{lotZone}</span>
          </div>
        )}
        {checkIn && (
          <div className="flex justify-between">
            <span className="text-black/50">Check-in</span>
            <span className="font-semibold text-black">{formatDateTime(checkIn)}</span>
          </div>
        )}
        {checkOut && (
          <div className="flex justify-between">
            <span className="text-black/50">Check-out</span>
            <span className="font-semibold text-black">{formatDateTime(checkOut)}</span>
          </div>
        )}
        {attendant && (
          <div className="flex justify-between">
            <span className="text-black/50">Voditelj</span>
            <span className="font-semibold text-black">{attendant}</span>
          </div>
        )}
        {phoneSms && (
          <div className="flex justify-between items-center">
            <span className="text-black/50">SMS / WhatsApp</span>
            <a
              href={`https://wa.me/${phoneSms.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#5F3DFC] underline"
            >
              {phoneSms}
            </a>
          </div>
        )}
      </div>
      {/* Bottom strip */}
      <div className="bg-[#5F3DFC]/10 px-4 py-3 space-y-2">
        <p className="text-[10px] text-[#5F3DFC]/70 font-medium text-center">Pokažite kod valet agentu pri predaji ključeva</p>
        {onSummon && (
          <button
            type="button"
            onClick={onSummon}
            className="w-full py-2.5 rounded-xl bg-[#5F3DFC] text-white text-[13px] font-semibold hover:bg-[#4e2fdb] transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="1"/>
              <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
            </svg>
            Pozovi auto
          </button>
        )}
      </div>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const hasRealSessionId = Boolean(
    sessionId &&
      sessionId !== '{CHECKOUT_SESSION_ID}' &&
      !sessionId.includes('CHECKOUT_SESSION_ID')
  );
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendFeedback, setExtendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Included service toggles
  const [valetToggled, setValetToggled] = useState(false);
  const [shuttleToggled, setShuttleToggled] = useState(false);
  const [summonStatus, setSummonStatus] = useState<string | null>(null);

  // Credits: ∞ when included in price, 1 when paid addon, 0 when not available
  const [valetCredits, setValetCredits] = useState<Credits>(0);
  const [shuttleCredits, setShuttleCredits] = useState<Credits>(0);

  // Paid addon selections
  const [addonValetOn, setAddonValetOn] = useState(false);
  const [addonValetDays, setAddonValetDays] = useState(1);
  const [addonEvOn, setAddonEvOn] = useState(false);
  const [addonWashOn, setAddonWashOn] = useState(false);
  const [addonWashTier, setAddonWashTier] = useState<'basic' | 'premium'>('basic');
  const [addonFuelOn, setAddonFuelOn] = useState(false);
  const [addonFuelType, setAddonFuelType] = useState<'diesel' | 'benzin'>('diesel');
  const [addonShuttleOn, setAddonShuttleOn] = useState(false);
  const [addonsCheckoutLoading, setAddonsCheckoutLoading] = useState(false);
  const [addonsCheckoutError, setAddonsCheckoutError] = useState('');

  const fallbackDisplayId =
    searchParams.get('display_id') || searchParams.get('displayId') || searchParams.get('id') || null;
  const fallbackLocationId =
    fallbackDisplayId ||
    searchParams.get('location_id') ||
    searchParams.get('locationId') ||
    searchParams.get('loc') ||
    searchParams.get('location') ||
    null;
  const fallbackCheckIn =
    searchParams.get('check_in') || searchParams.get('checkIn') || searchParams.get('in') || searchParams.get('start') || null;
  const fallbackCheckOut =
    searchParams.get('check_out') || searchParams.get('checkOut') || searchParams.get('out') || searchParams.get('end') || null;

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    const date = parsed.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Zagreb' });
    const time = parsed.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zagreb' });
    return `${date} ${time}`;
  };

  const formatAmount = (amount: number | null | undefined, currency: string | null | undefined) => {
    const normalized = Number(amount ?? 0);
    const value = Number.isFinite(normalized) ? normalized / 100 : 0;
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: (currency || 'EUR').toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const checkoutLocationName = summary?.location_name ?? null;
  const checkoutLocationDisplayId = summary?.location_display_id ?? null;
  const checkoutLocation = summary?.location_id ?? fallbackLocationId;
  const checkoutLocationIdLabel = checkoutLocationDisplayId || checkoutLocation;
  const checkoutStart = summary?.check_in ?? (hasRealSessionId ? null : fallbackCheckIn);
  const checkoutEnd = summary?.check_out ?? (hasRealSessionId ? null : fallbackCheckOut);

  useEffect(() => {
    let active = true;
    if (!sessionId) return;
    if (!hasRealSessionId) {
      setLookupError('Payment confirmation is still syncing. Please refresh this page in a few seconds.');
      return;
    }
    const run = async () => {
      setLookupLoading(true);
      setLookupError('');
      try {
        const lookupParams = new URLSearchParams();
        lookupParams.set('session_id', sessionId);
        if (fallbackDisplayId) lookupParams.set('display_id', fallbackDisplayId);
        if (fallbackLocationId) lookupParams.set('location_id', fallbackLocationId);
        if (fallbackCheckIn) lookupParams.set('check_in', fallbackCheckIn);
        if (fallbackCheckOut) lookupParams.set('check_out', fallbackCheckOut);
        const response = await fetch(`/api/stripe/session?${lookupParams.toString()}`);
        const payload = (await response.json().catch(() => null)) as SessionSummary | { error?: string } | null;
        if (!active) return;
        if (!response.ok) {
          setSummary(null);
          setLookupError(payload && 'error' in payload && payload.error ? payload.error : 'Unable to load payment details.');
          return;
        }
        const s = payload as SessionSummary;
        setSummary(s);
        // Derive credits: ∞ when included in price
        setValetCredits(s.valet_enabled ? '∞' : 0);
        setShuttleCredits(s.shuttle_enabled ? '∞' : 0);
        // Auto-toggle included services on
        if (s.valet_enabled) setValetToggled(true);
        if (s.shuttle_enabled) setShuttleToggled(true);
      } catch {
        if (!active) return;
        setSummary(null);
        setLookupError('Unable to load payment details.');
      } finally {
        if (!active) return;
        setLookupLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [sessionId, hasRealSessionId, fallbackDisplayId, fallbackLocationId, fallbackCheckIn, fallbackCheckOut]);

  const membersHref = useMemo(() => {
    if (!summary?.email) return '/members';
    return `/members?email=${encodeURIComponent(summary.email)}`;
  }, [summary?.email]);

  const insuranceHref = useMemo(() => {
    const params = new URLSearchParams();
    if (summary?.email) params.set('email', summary.email);
    const qs = params.toString();
    return qs ? `/insurance/apply?${qs}` : '/insurance/apply';
  }, [summary?.email]);

  const getMemberAuthHeaders = async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? '';
      if (token) headers.Authorization = `Bearer ${token}`;
      const sessionEmail = data.session?.user?.email?.trim().toLowerCase() ?? '';
      if (sessionEmail) headers['x-member-email'] = sessionEmail;
    }
    if (!headers['x-member-email']) {
      const fallbackEmail = (summary?.email ?? '').trim().toLowerCase();
      if (fallbackEmail) headers['x-member-email'] = fallbackEmail;
    }
    return headers;
  };

  const handleExtendWith = async (minutes: number) => {
    const safeMinutes = Math.min(2880, Math.max(60, minutes));
    const targetSessionId = (summary?.session_id ?? sessionId ?? '').toString().trim();
    const fallbackLocation = (summary?.location_id ?? fallbackLocationId ?? '').toString().trim();
    const fallbackIn = (summary?.check_in ?? fallbackCheckIn ?? '').toString().trim();
    const fallbackOut = (summary?.check_out ?? fallbackCheckOut ?? '').toString().trim();
    setExtendLoading(true);
    setExtendFeedback(null);
    try {
      const response = await fetch('/api/members/extend', {
        method: 'POST',
        headers: await getMemberAuthHeaders(),
        body: JSON.stringify({
          minutes: safeMinutes,
          session_id: targetSessionId || undefined,
          fallback_location_id: fallbackLocation || undefined,
          fallback_check_in: fallbackIn || undefined,
          fallback_check_out: fallbackOut || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; actionUrl?: string; error?: string }
        | null;
      if (!response.ok || !payload?.ok) {
        setExtendFeedback({ type: 'error', text: payload?.error || 'Action failed. Please try again.' });
        return;
      }
      if (payload.actionUrl) window.open(payload.actionUrl, '_blank', 'noopener,noreferrer');
      setExtendFeedback({ type: 'success', text: payload.message || 'Extension prepared.' });
    } catch {
      setExtendFeedback({ type: 'error', text: 'Action failed. Please try again.' });
    } finally {
      setExtendLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    const stripeSessionId = (summary?.session_id ?? sessionId ?? '').toString().trim();
    const params = new URLSearchParams();
    if (stripeSessionId) {
      params.set('stripe_session_id', stripeSessionId);
      params.set('fallback_stripe_session_id', stripeSessionId);
    }
    if (summary?.email) params.set('fallback_location_name', summary.location_name ?? '');
    if (summary?.check_in) params.set('fallback_check_in', summary.check_in);
    if (summary?.check_out) params.set('fallback_check_out', summary.check_out);
    if (summary?.amount_total) params.set('fallback_amount', (summary.amount_total / 100).toFixed(2));
    if (summary?.currency) params.set('fallback_currency', summary.currency);
    const url = `/api/members/invoice?mode=document&${params.toString()}`;
    try {
      const headers = await getMemberAuthHeaders();
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('fetch_failed');
      const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = contentType.includes('application/pdf') ? 'payparq-receipt.pdf' : 'payparq-receipt.html';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSummon = (type: 'car' | 'shuttle') => {
    const ticketNo = summary?.session_id ? deriveTicketNumber(summary.session_id) : 'VLT-0000';
    const phone = (summary?.addons_config?.phone_sms ?? '').replace(/\D/g, '') || '385915963139';
    if (type === 'car') {
      if (valetCredits === 0) return;
      if (valetCredits !== '∞') setValetCredits((v) => (v as number) - 1);
      setSummonStatus('Vaš automobil je na putu · ETA ~6 min');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`${ticketNo} - Poziv vozila`)}`, '_blank', 'noopener,noreferrer');
    } else {
      if (shuttleCredits === 0) return;
      if (shuttleCredits !== '∞') setShuttleCredits((s) => (s as number) - 1);
      setSummonStatus('Shuttle je pozvan · Dolazi za ~4 min');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Shuttle zahtjev · ${summary?.location_name ?? summary?.location_display_id ?? ''} · ${ticketNo}`)}`, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setSummonStatus(null), 5000);
  };

  // Addon config derived values
  const cfg = summary?.addons_config ?? {};
  const addonValetCfg = cfg.valet?.enabled ? cfg.valet : null;
  const addonEvCfg = cfg.ev_charging?.enabled ? cfg.ev_charging : null;
  const addonWashCfg = cfg.car_wash?.enabled ? cfg.car_wash : null;
  const addonFuelCfg = cfg.fuel?.enabled ? cfg.fuel : null;
  const addonShuttleCfg = cfg.shuttle?.enabled ? cfg.shuttle : null;

  // "Included in price" sub-section visibility
  const showIncludedValet = Boolean(summary?.valet_enabled);
  const showIncludedShuttle = Boolean(summary?.shuttle_enabled);
  const showIncludedSection = showIncludedValet || showIncludedShuttle;

  // "Paid addon" sub-section: valet/shuttle only when NOT already included
  const showValetPaidAddon = Boolean(addonValetCfg && !summary?.valet_enabled);
  const showShuttlePaidAddon = Boolean(addonShuttleCfg && !summary?.shuttle_enabled);
  const showPaidSection = Boolean(showValetPaidAddon || showShuttlePaidAddon || addonEvCfg || addonWashCfg || addonFuelCfg);

  const hasAnyAddonWidget = showIncludedSection || showPaidSection;
  const showSummonSection = showIncludedValet || showIncludedShuttle;

  // Prices
  const addonValetPriceCents = (addonValetCfg?.price_cents ?? 500) * addonValetDays;
  const addonEvPriceCents = addonEvCfg?.price_cents ?? 2000;
  const addonWashBasicCents = addonWashCfg?.options?.find((o) => o.id === 'basic')?.price_cents ?? 1500;
  const addonWashPremiumCents = addonWashCfg?.options?.find((o) => o.id === 'premium')?.price_cents ?? 3000;
  const addonWashPriceCents = addonWashTier === 'premium' ? addonWashPremiumCents : addonWashBasicCents;
  const addonFuelDieselCents = addonFuelCfg?.options?.find((o) => o.id === 'diesel')?.price_cents ?? 6000;
  const addonFuelBenzinCents = addonFuelCfg?.options?.find((o) => o.id === 'benzin')?.price_cents ?? 5500;
  const addonFuelPriceCents = addonFuelType === 'diesel' ? addonFuelDieselCents : addonFuelBenzinCents;

  const addonShuttlePriceCents = addonShuttleCfg?.price_cents ?? 200;

  const addonsTotalCents =
    (addonValetOn ? addonValetPriceCents : 0) +
    (addonEvOn ? addonEvPriceCents : 0) +
    (addonWashOn ? addonWashPriceCents : 0) +
    (addonFuelOn ? addonFuelPriceCents : 0) +
    (addonShuttleOn ? addonShuttlePriceCents : 0);

  const anyPaidAddonSelected = addonValetOn || addonEvOn || addonWashOn || addonFuelOn || addonShuttleOn;

  const handleAddonsCheckout = async () => {
    if (!anyPaidAddonSelected) return;
    setAddonsCheckoutLoading(true);
    setAddonsCheckoutError('');
    type AddonItem = { id: string; label: string; price_cents: number; quantity?: number };
    const items: AddonItem[] = [];
    if (addonValetOn && showValetPaidAddon) {
      items.push({ id: 'valet', label: `Valet parking (${addonValetDays} dan/a)`, price_cents: addonValetCfg?.price_cents ?? 500, quantity: addonValetDays });
    }
    if (addonEvOn && addonEvCfg) {
      items.push({ id: 'ev_charging', label: 'EV punjenje', price_cents: addonEvCfg.price_cents ?? 2000 });
    }
    if (addonWashOn && addonWashCfg) {
      const tier = addonWashTier;
      const opt = addonWashCfg.options?.find((o) => o.id === tier);
      items.push({ id: `car_wash_${tier}`, label: `Pranje vozila (${tier === 'premium' ? 'Premium' : 'Basic'})`, price_cents: opt?.price_cents ?? addonWashPriceCents });
    }
    if (addonFuelOn && addonFuelCfg) {
      const opt = addonFuelCfg.options?.find((o) => o.id === addonFuelType);
      items.push({ id: `fuel_${addonFuelType}`, label: `Punjenje gorivom (${addonFuelType === 'diesel' ? 'Diesel' : 'Benzin'})`, price_cents: opt?.price_cents ?? addonFuelPriceCents });
    }
    if (addonShuttleOn && addonShuttleCfg) {
      items.push({ id: 'shuttle', label: 'Shuttle (1 smjer)', price_cents: addonShuttleCfg.price_cents ?? 200 });
    }
    try {
      const res = await fetch('/api/stripe/addons-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: summary?.session_id ?? sessionId ?? '',
          location_id: summary?.location_id ?? '',
          location_display_id: summary?.location_display_id ?? '',
          location_name: summary?.location_name ?? '',
          email: summary?.email ?? '',
          addons: items,
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setAddonsCheckoutError(data?.error || 'Greška pri kreiranju plaćanja.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setAddonsCheckoutError('Greška pri kreiranju plaćanja.');
    } finally {
      setAddonsCheckoutLoading(false);
    }
  };

  const Toggle = ({ on }: { on: boolean }) => (
    <div
      className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative shrink-0"
      style={{ background: on ? '#5F3DFC' : '#f3f4f6', borderColor: on ? '#5F3DFC' : '#e5e7eb' }}
    >
      <div
        className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm"
        style={{ left: on ? '18px' : '2px' }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-sm mx-auto px-4 space-y-3 mt-12">

          {/* 1 — Confirmation card */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#E1F5EE] flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-black/50">Rezervacija potvrđena</p>
                <p className="text-[15px] font-semibold text-black leading-tight">
                  {checkoutLocationName || checkoutLocationIdLabel || 'Safe Parking by PayParq'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
              <div>
                <p className="text-black/50">Lokacija ID</p>
                <p className="font-semibold text-black font-mono tracking-tight">{checkoutLocationDisplayId || checkoutLocationIdLabel || '—'}</p>
              </div>
              <div>
                <p className="text-black/50">Cijena</p>
                <p className="font-semibold text-black">{formatAmount(summary?.amount_total ?? 0, summary?.currency ?? 'EUR')}</p>
              </div>
              <div>
                <p className="text-black/50">Od</p>
                <p className="font-semibold text-black">{formatDateTime(checkoutStart)}</p>
              </div>
              <div>
                <p className="text-black/50">Do</p>
                <p className="font-semibold text-black">{formatDateTime(checkoutEnd)}</p>
              </div>
            </div>
            {(lookupLoading || lookupError) && (
              <p className="mt-3 text-[11px] text-black/40">{lookupLoading ? 'Učitavanje...' : lookupError}</p>
            )}
          </div>

          {/* 1b — Valet confirmation ticket (when valet included in price) */}
          {showIncludedValet && summary?.session_id && (
            <ValetTicket
              sessionId={summary.session_id}
              locationName={checkoutLocationName}
              checkIn={checkoutStart}
              checkOut={checkoutEnd}
              attendant={summary.valet_attendant ?? null}
              pickupPoint={summary.addons_config?.pickup_point ?? null}
              phoneSms={(summary.addons_config?.phone_sms as string | null | undefined) ?? null}
              lotZone={(summary.addons_config?.valet?.lot_zone as string | null | undefined) ?? null}
              formatDateTime={formatDateTime}
              onSummon={() => handleSummon('car')}
            />
          )}

          {/* 1c — Shuttle confirmation ticket (when shuttle included in price) */}
          {showIncludedShuttle && summary?.session_id && (
            <ShuttleTicket
              sessionId={summary.session_id}
              locationName={checkoutLocationName}
              checkIn={checkoutStart}
              checkOut={checkoutEnd}
              attendant={summary.valet_attendant ?? null}
              pickupPoint={summary.addons_config?.pickup_point ?? null}
              phoneSms={(summary.addons_config?.phone_sms as string | null | undefined) ?? null}
              formatDateTime={formatDateTime}
              onSummon={() => handleSummon('shuttle')}
            />
          )}

          {/* 2 — Produži boravak */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest mb-3">Produži boravak</p>
            <div className="grid grid-cols-4 gap-2">
              {([{ label: '+1h', minutes: 60 }, { label: '+2h', minutes: 120 }, { label: '+1d', minutes: 1440 }, { label: '+2d', minutes: 2880 }] as const).map(({ label, minutes }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleExtendWith(minutes)}
                  disabled={extendLoading}
                  className="py-2 rounded-xl border border-black/10 bg-gray-50 text-[13px] font-medium text-black hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  {extendLoading ? '…' : label}
                </button>
              ))}
            </div>
            {extendFeedback && (
              <p className={`mt-2 text-[11px] ${extendFeedback.type === 'error' ? 'text-red-600' : 'text-[#0F6E56]'}`}>
                {extendFeedback.text}
              </p>
            )}
          </div>

          {/* 3 — Odaberi dodatne usluge (single merged widget) */}
          {hasAnyAddonWidget && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
              <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest">
                Odaberi dodatne usluge:
              </p>

              {/* ── Included in price sub-section ── */}
              {showIncludedSection && (
                <div className="space-y-2">
                  {showIncludedValet && (
                    <button
                      type="button"
                      onClick={() => setValetToggled((v) => !v)}
                      className="w-full flex items-center justify-between rounded-xl border border-black/10 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F5F2FF] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5F3DFC" strokeWidth="2">
                            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                            <rect x="9" y="11" width="14" height="10" rx="1"/>
                            <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">Valet parking</p>
                          <p className="text-[11px] text-[#5F3DFC] font-medium">Uključeno u cijenu · ∞</p>
                        </div>
                      </div>
                      <Toggle on={valetToggled} />
                    </button>
                  )}

                  {showIncludedShuttle && (
                    <button
                      type="button"
                      onClick={() => setShuttleToggled((s) => !s)}
                      className="w-full flex items-center justify-between rounded-xl border border-black/10 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#E1F5EE] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2">
                            <rect x="1" y="8" width="22" height="10" rx="2"/>
                            <path d="M5 18v2M19 18v2"/>
                            <path d="M1 12h22"/>
                            <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">Shuttle prijevoz</p>
                          <p className="text-[11px] text-[#0F6E56] font-medium">Uključeno u cijenu · ∞</p>
                        </div>
                      </div>
                      <Toggle on={shuttleToggled} />
                    </button>
                  )}
                </div>
              )}

              {/* Divider between included and paid sections */}
              {showIncludedSection && showPaidSection && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-px bg-black/8" />
                  <span className="text-[10px] text-black/30 uppercase tracking-widest">Dodaj uslugu</span>
                  <div className="flex-1 h-px bg-black/8" />
                </div>
              )}

              {/* ── Paid addons sub-section ── */}
              {showPaidSection && (
                <div className="space-y-2">

                  {/* Paid valet (only when not already included) */}
                  {showValetPaidAddon && (
                    <div className="rounded-xl border border-black/10 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAddonValetOn((v) => !v)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${addonValetOn ? 'bg-[#5F3DFC] border-[#5F3DFC]' : 'border-black/20 bg-white'}`}>
                            {addonValetOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-black">Valet parking</p>
                            <p className="text-[11px] text-black/40">Mi parkiramo vaš automobil</p>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-black shrink-0 ml-2">
                          {formatAmount(addonValetCfg?.price_cents ?? 500, 'eur')}/dan
                        </span>
                      </button>
                      {addonValetOn && (
                        <div className="border-t border-black/5 px-3 py-2.5 bg-gray-50">
                          <p className="text-[11px] text-black/50 mb-2">Broj dana</p>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setAddonValetDays(d)}
                                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${addonValetDays === d ? 'bg-[#5F3DFC] text-white border-[#5F3DFC]' : 'bg-white text-black border-black/10 hover:bg-gray-100'}`}
                              >
                                {d}d
                              </button>
                            ))}
                          </div>
                          <p className="text-[11px] text-black/50 mt-2 text-right">
                            Ukupno: <span className="font-semibold text-black">{formatAmount(addonValetPriceCents, 'eur')}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paid shuttle (only when not included in price) */}
                  {showShuttlePaidAddon && (
                    <button
                      type="button"
                      onClick={() => setAddonShuttleOn((v) => !v)}
                      className="w-full flex items-center justify-between rounded-xl border border-black/10 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${addonShuttleOn ? 'bg-[#0F6E56] border-[#0F6E56]' : 'border-black/20 bg-white'}`}>
                          {addonShuttleOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">Shuttle</p>
                          <p className="text-[11px] text-black/40">1 smjer · do/od destinacije</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold text-black shrink-0 ml-2">
                        {formatAmount(addonShuttleCfg?.price_cents ?? 200, 'eur')}
                      </span>
                    </button>
                  )}

                  {/* EV Charging */}
                  {addonEvCfg && (
                    <button
                      type="button"
                      onClick={() => setAddonEvOn((v) => !v)}
                      className="w-full flex items-center justify-between rounded-xl border border-black/10 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${addonEvOn ? 'bg-[#2E7D32] border-[#2E7D32]' : 'border-black/20 bg-white'}`}>
                          {addonEvOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">EV punjenje</p>
                          <p className="text-[11px] text-black/40">Type 2 / CCS · do 22 kW</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold text-black shrink-0 ml-2">
                        {formatAmount(addonEvCfg.price_cents ?? 2000, 'eur')}
                      </span>
                    </button>
                  )}

                  {/* Car Wash */}
                  {addonWashCfg && (
                    <div className="rounded-xl border border-black/10 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAddonWashOn((v) => !v)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${addonWashOn ? 'bg-[#1565C0] border-[#1565C0]' : 'border-black/20 bg-white'}`}>
                            {addonWashOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-black">Pranje vozila</p>
                            <p className="text-[11px] text-black/40">Basic ili Premium</p>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-black shrink-0 ml-2">
                          od {formatAmount(addonWashBasicCents, 'eur')}
                        </span>
                      </button>
                      {addonWashOn && (
                        <div className="border-t border-black/5 px-3 py-2.5 bg-gray-50">
                          <div className="flex gap-2">
                            {(['basic', 'premium'] as const).map((tier) => {
                              const priceCents = tier === 'premium' ? addonWashPremiumCents : addonWashBasicCents;
                              return (
                                <button
                                  key={tier}
                                  type="button"
                                  onClick={() => setAddonWashTier(tier)}
                                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium border transition-colors ${addonWashTier === tier ? 'bg-[#1565C0] text-white border-[#1565C0]' : 'bg-white text-black border-black/10 hover:bg-gray-100'}`}
                                >
                                  {tier === 'premium' ? 'Premium' : 'Basic'}<br />
                                  <span className="text-[10px] opacity-75">{formatAmount(priceCents, 'eur')}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fuel */}
                  {addonFuelCfg && (
                    <div className="rounded-xl border border-black/10 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAddonFuelOn((v) => !v)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${addonFuelOn ? 'bg-[#F57F17] border-[#F57F17]' : 'border-black/20 bg-white'}`}>
                            {addonFuelOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-black">Punjenje gorivom</p>
                            <p className="text-[11px] text-black/40">Diesel ili Benzin · mobilna punjaonica</p>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-black shrink-0 ml-2">
                          od {formatAmount(Math.min(addonFuelDieselCents, addonFuelBenzinCents), 'eur')}
                        </span>
                      </button>
                      {addonFuelOn && (
                        <div className="border-t border-black/5 px-3 py-2.5 bg-gray-50">
                          <div className="flex gap-2">
                            {(['diesel', 'benzin'] as const).map((fuelType) => {
                              const priceCents = fuelType === 'diesel' ? addonFuelDieselCents : addonFuelBenzinCents;
                              return (
                                <button
                                  key={fuelType}
                                  type="button"
                                  onClick={() => setAddonFuelType(fuelType)}
                                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium border transition-colors ${addonFuelType === fuelType ? 'bg-[#F57F17] text-white border-[#F57F17]' : 'bg-white text-black border-black/10 hover:bg-gray-100'}`}
                                >
                                  {fuelType === 'diesel' ? 'Diesel' : 'Benzin'}<br />
                                  <span className="text-[10px] opacity-75">{formatAmount(priceCents, 'eur')}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkout CTA */}
                  {anyPaidAddonSelected && (
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center justify-between text-[13px] px-1">
                        <span className="text-black/50">Ukupno za usluge</span>
                        <span className="font-bold text-black">{formatAmount(addonsTotalCents, 'eur')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddonsCheckout}
                        disabled={addonsCheckoutLoading}
                        className="w-full py-3 rounded-xl bg-[#5F3DFC] text-white text-[14px] font-semibold hover:bg-[#4330c4] disabled:opacity-60 transition-colors"
                      >
                        {addonsCheckoutLoading ? 'Priprema...' : 'Plati usluge'}
                      </button>
                      {addonsCheckoutError && (
                        <p className="text-[11px] text-red-500 text-center">{addonsCheckoutError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4 — Pozovi vozilo (with credit badges) */}
          {showSummonSection && (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest mb-3">Pozovi vozilo</p>
              <div className={`grid gap-3 ${showIncludedValet && showIncludedShuttle ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {showIncludedValet && (
                  <button
                    type="button"
                    onClick={() => handleSummon('car')}
                    disabled={valetCredits === 0 || !valetToggled}
                    className="relative flex flex-col items-center gap-2 py-4 rounded-xl border border-black/10 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <CreditBadge value={valetCredits} />
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-black">
                      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                      <rect x="9" y="11" width="14" height="10" rx="1"/>
                      <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
                    </svg>
                    <span className="text-[13px] font-medium text-black">Pozovi auto</span>
                    <span className="text-[11px] text-black/50">Valet dovozi · ~6 min</span>
                  </button>
                )}
                {showIncludedShuttle && (
                  <button
                    type="button"
                    onClick={() => handleSummon('shuttle')}
                    disabled={shuttleCredits === 0 || !shuttleToggled}
                    className="relative flex flex-col items-center gap-2 py-4 rounded-xl border border-black/10 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <CreditBadge value={shuttleCredits} />
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-black">
                      <rect x="1" y="8" width="22" height="10" rx="2"/>
                      <path d="M5 18v2M19 18v2"/>
                      <path d="M1 12h22"/>
                      <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span className="text-[13px] font-medium text-black">Pozovi shuttle</span>
                    <span className="text-[11px] text-black/50">1 smjer · ~4 min</span>
                  </button>
                )}
              </div>
              {summonStatus && (
                <div className="mt-3 rounded-xl bg-[#E1F5EE] border border-[#0F6E56]/20 px-3 py-2.5 text-[13px] text-[#0F6E56] text-center">
                  {summonStatus}
                </div>
              )}
            </div>
          )}

          {/* 5 — Secondary actions */}
          <div className="flex flex-col gap-2">
            <a
              href="https://m.uber.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl border border-black/10 bg-white text-[14px] font-medium text-black text-center block hover:bg-gray-50 transition-colors"
            >
              Naruči Uber
            </a>
            <Link
              href={insuranceHref}
              className="w-full py-3 rounded-xl border border-black/10 bg-white text-[14px] font-medium text-black text-center block hover:bg-gray-50 transition-colors"
            >
              Osiguranje
            </Link>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="w-full py-3 rounded-xl border border-black/10 bg-white text-[14px] font-medium text-black text-center block hover:bg-gray-50 transition-colors"
            >
              Preuzmi potvrdu
            </button>
          </div>

          {/* 6 — Members zona link */}
          {summary?.email && (
            <p className="text-center text-[11px] text-black/40 pb-2">
              <Link href={membersHref} className="text-[#0F6E56] font-medium hover:text-[#1D9E75] transition-colors">
                Members zona
              </Link>
              {' · '}
              {summary.email}
            </p>
          )}

        </div>
      </main>

      <footer className="bg-[#020617] px-6 py-8 print:hidden">
        <div className="max-w-sm mx-auto">
          <FooterBrand />
        </div>
      </footer>

      <style jsx global>{`
        @media print {
          body { background: white; color: black; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-black/40 text-sm">
        Učitavanje...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
