'use client';

import React, { Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';
const LotMap = lazy(() => import('@/components/LotMap'));
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FooterBrand } from '@/components/FooterBrand';
import { SiteHeader } from '@/components/SiteHeader';
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
  lot_point?: { lat: number; lng: number } | null;
  assigned_spot?: { label: string; lat?: number | null; lng?: number | null; col_num?: number | null } | null;
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

function deriveReservationCode(sessionId: string): string {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 41 + sessionId.charCodeAt(i)) & 0xffffffff;
  }
  const num = 1000 + (Math.abs(hash) % 9000);
  return `RZ-${num}`;
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
  lotPoint,
  phoneSms,
  trackUrl,
  formatDateTime,
  onSummon,
}: {
  sessionId: string;
  locationName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  attendant: string | null;
  pickupPoint: { lat?: number; lng?: number; label?: string } | null;
  lotPoint?: { lat: number; lng: number } | null;
  phoneSms: string | null;
  trackUrl?: string | null;
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
        {checkIn && (
          <div className="flex justify-between">
            <span className="text-black/50">1. vožnja</span>
            <span className="font-semibold text-black">{formatDateTime(checkIn)}</span>
          </div>
        )}
        {lotPoint && (
          <div className="flex justify-between items-center">
            <span className="text-black/50">Pick-up point</span>
            <a
              href={`https://www.google.com/maps?q=${lotPoint.lat},${lotPoint.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0F6E56] underline text-[12px]"
            >
              {locationName ?? 'Parking'}
            </a>
          </div>
        )}
        {checkOut && (
          <div className="flex justify-between">
            <span className="text-black/50">2. vožnja</span>
            <span className="font-semibold text-black">{formatDateTime(checkOut)}</span>
          </div>
        )}
        {(pickupPoint?.label || (pickupPoint?.lat && pickupPoint?.lng)) && (
          <div className="flex justify-between items-center">
            <span className="text-black/50">Pick-up point</span>
            <a
              href={pickupPoint?.lat && pickupPoint?.lng
                ? `https://www.google.com/maps?q=${pickupPoint.lat},${pickupPoint.lng}`
                : `https://www.google.com/maps/search/${encodeURIComponent(pickupPoint?.label ?? '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0F6E56] underline text-[12px]"
            >
              {pickupPoint?.label ?? 'Otvori kartu'}
            </a>
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
        <p className="text-[10px] text-[#0F6E56]/70 font-medium text-center">Pokažite kod vozaču shuttlea pri ukrcaju</p>
        {trackUrl ? (
          <a
            href={trackUrl}
            className="w-full py-2.5 rounded-xl bg-[#0F6E56] text-white text-[13px] font-semibold hover:bg-[#0a5241] transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            Prati vozača uživo →
          </a>
        ) : onSummon ? (
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
        ) : null}
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
  lotPoint,
  phoneSms,
  lotZone,
  trackUrl,
  formatDateTime,
  onSummon,
}: {
  sessionId: string;
  locationName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  attendant: string | null;
  pickupPoint: { lat?: number; lng?: number; label?: string } | null;
  lotPoint?: { lat: number; lng: number } | null;
  phoneSms: string | null;
  lotZone: string | null;
  trackUrl?: string | null;
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
        {lotZone && (
          <div className="flex justify-between">
            <span className="text-black/50">Lot zona</span>
            <span className="font-semibold text-black text-right max-w-[55%]">{lotZone}</span>
          </div>
        )}
        {checkIn && (
          <div className="flex justify-between">
            <span className="text-black/50">1. vožnja</span>
            <span className="font-semibold text-black">{formatDateTime(checkIn)}</span>
          </div>
        )}
        {lotPoint && (
          <div className="flex justify-between items-center">
            <span className="text-black/50">Pick-up point</span>
            <a
              href={`https://www.google.com/maps?q=${lotPoint.lat},${lotPoint.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#5F3DFC] underline text-[12px]"
            >
              {locationName ?? 'Parking'}
            </a>
          </div>
        )}
        {checkOut && (
          <div className="flex justify-between">
            <span className="text-black/50">2. vožnja</span>
            <span className="font-semibold text-black">{formatDateTime(checkOut)}</span>
          </div>
        )}
        {(pickupPoint?.label || (pickupPoint?.lat && pickupPoint?.lng)) && (
          <div className="flex justify-between items-center">
            <span className="text-black/50">Pick-up point</span>
            <a
              href={pickupPoint?.lat && pickupPoint?.lng
                ? `https://www.google.com/maps?q=${pickupPoint.lat},${pickupPoint.lng}`
                : `https://www.google.com/maps/search/${encodeURIComponent(pickupPoint?.label ?? '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#5F3DFC] underline text-[12px]"
            >
              {pickupPoint?.label ?? 'Otvori kartu'}
            </a>
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
        {trackUrl ? (
          <a
            href={trackUrl}
            className="w-full py-2.5 rounded-xl bg-[#5F3DFC] text-white text-[13px] font-semibold hover:bg-[#4e2fdb] transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            Prati vozača uživo →
          </a>
        ) : onSummon ? (
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
        ) : null}
      </div>
    </div>
  );
}

type StoredBooking = {
  locationId?: string;
  locationName?: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  amountCents?: number;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const [storedPiId, setStoredPiId] = useState<string | null>(null);
  const [storedBooking, setStoredBooking] = useState<StoredBooking | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('last_payment_intent');
    if (stored) setStoredPiId(stored);
    const booking = sessionStorage.getItem('payparq_booking');
    if (booking) {
      try { setStoredBooking(JSON.parse(booking)); } catch {}
    }
  }, []);

  const sessionId = searchParams.get('session_id') || searchParams.get('payment_intent') || storedPiId;
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
  const [activeTrackUrl, setActiveTrackUrl] = useState<string | null>(null);

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

  // Spot upgrade
  const [premiumSpots, setPremiumSpots] = useState<{ id: string; label: string; price_modifier_cents: number }[]>([]);
  const [spotUpgradeLoading, setSpotUpgradeLoading] = useState(false);

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

  const checkoutLocationName = summary?.location_name ?? storedBooking?.locationName ?? null;
  const checkoutLocationDisplayId = summary?.location_display_id ?? null;
  const checkoutLocation = summary?.location_id ?? fallbackLocationId ?? storedBooking?.locationId ?? null;
  const checkoutLocationIdLabel = checkoutLocationDisplayId || checkoutLocation;
  const checkoutStart = summary?.check_in || fallbackCheckIn || storedBooking?.checkIn || null;
  const checkoutEnd = summary?.check_out || fallbackCheckOut || storedBooking?.checkOut || null;

  useEffect(() => {
    if (sessionId && typeof window !== 'undefined') {
      sessionStorage.removeItem('last_payment_intent');
    }
  }, [sessionId]);

  useEffect(() => {
    if (summary?.session_id) {
      sessionStorage.removeItem('payparq_booking');
    }
  }, [summary?.session_id]);

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
        // Derive credits: Park & Taxi gets 2 shuttle credits, others get ∞ when included
        setValetCredits(s.valet_enabled ? '∞' : 0);
        if (s.flow_type === 'park_now' && s.shuttle_enabled) {
          setShuttleCredits(2);
        } else {
          setShuttleCredits(s.shuttle_enabled ? '∞' : 0);
        }
        // Auto-toggle included services on
        if (s.valet_enabled) setValetToggled(true);
        if (s.shuttle_enabled) setShuttleToggled(true);

        // Fetch premium spots for upgrade
        if (s.location_id && s.assigned_spot) {
          fetch(`/api/spots?location_id=${encodeURIComponent(s.location_id)}`)
            .then((r) => r.json())
            .then((d) => {
              if (!active) return;
              const available = (d.spots ?? []).filter(
                (sp: { available: boolean; price_modifier_cents: number; label: string }) =>
                  sp.available && sp.price_modifier_cents > 0 && sp.label !== s.assigned_spot?.label
              );
              setPremiumSpots(available);
            })
            .catch(() => {});
        }

        // For P&T: silently subscribe to push notifications for 15-min ride reminder
        if (s.flow_type === 'park_now' && 'serviceWorker' in navigator && 'PushManager' in window) {
          import('@/lib/push-notifications-v2').then(({ subscribeToNotifications }) => {
            subscribeToNotifications().catch(() => {});
          });
        }
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

  // P&T pre-ride: auto-summon + notify 15 min before check-in
  useEffect(() => {
    const isParkNow = summary?.flow_type === 'park_now';
    if (!isParkNow || !checkoutStart || activeTrackUrl) return;

    const rideTime = new Date(checkoutStart).getTime();
    if (Number.isNaN(rideTime)) return;

    const triggerAt = rideTime - 15 * 60 * 1000;
    const delay = triggerAt - Date.now();

    if (delay < 0) return; // ride time already passed

    // Request notification permission proactively
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const timer = setTimeout(async () => {
      // Fire browser notification
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Vaša vožnja kreće za 15 minuta', {
          body: 'Vozač je pozvan i dolazi po vas.',
          icon: '/favicon.ico',
        });
      }
      // Auto-summon
      await handleSummon('shuttle');
    }, delay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.flow_type, checkoutStart, activeTrackUrl]);

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
    if (summary?.email) params.set('fallback_email', summary.email);
    if (summary?.location_name) params.set('fallback_location_name', summary.location_name);
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

  const SUPPORT_WHATSAPP = '385915963139';

  const openWhatsAppFallback = (requestType: 'shuttle' | 'valet') => {
    const label = requestType === 'shuttle' ? 'shuttle vozača' : 'valet attendanta';
    const loc = summary?.location_name ?? 'lokaciji';
    const msg = encodeURIComponent(`Pozdrav! Pozivam ${label} na lokaciji: ${loc}. Molim hitnu pomoć.`);
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleSummon = async (type: 'car' | 'shuttle') => {
    const requestType = type === 'car' ? 'valet' : 'shuttle';
    const ticketNo = summary?.session_id
      ? (requestType === 'shuttle' ? deriveShuttleCode(summary.session_id) : deriveTicketNumber(summary.session_id))
      : null;
    const cfg = summary?.addons_config ?? {};
    const pickup = cfg.pickup_point as { lat?: number; lng?: number; label?: string } | null | undefined;

    if (type === 'car' && valetCredits === 0) return;
    if (type === 'shuttle' && shuttleCredits === 0) return;

    setSummonStatus('Provjera dostupnosti...');
    try {
      // Check if any driver is online before creating a request
      const availRes = await fetch('/api/drivers/available');
      const { available } = availRes.ok ? await availRes.json() : { available: false };

      if (!available) {
        setSummonStatus(null);
        openWhatsAppFallback(requestType);
        return;
      }

      setSummonStatus('Vozač dolazi...');
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: requestType,
          location_id: summary?.location_id ?? null,
          session_id: summary?.session_id ?? null,
          ticket_no: ticketNo,
          guest_name: null,
          pickup_label: pickup?.label ?? summary?.location_name ?? null,
          pickup_lat: pickup?.lat ?? null,
          pickup_lng: pickup?.lng ?? null,
          plate: null,
          parking_zone: type === 'car' ? ((cfg.valet as { lot_zone?: string } | undefined)?.lot_zone ?? null) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSummonStatus(null);
        openWhatsAppFallback(requestType);
        return;
      }
      const { request } = json;
      if (request?.id) {
        if (type === 'car') {
          if (valetCredits !== '∞') setValetCredits((v) => (v as number) - 1);
        } else {
          if (shuttleCredits !== '∞') setShuttleCredits((s) => (s as number) - 1);
        }
        const trackUrl = `/track?id=${request.id}&type=${requestType}`;
        setActiveTrackUrl(trackUrl);
        window.location.href = trackUrl;
        return;
      }
      openWhatsAppFallback(requestType);
    } catch {
      openWhatsAppFallback(requestType);
    }
    setSummonStatus(null);
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
  const showPaidSection = Boolean(
    showValetPaidAddon ||
    showShuttlePaidAddon ||
    addonEvCfg ||
    addonWashCfg ||
    addonFuelCfg ||
    (summary?.flow_type === 'park_now' && (addonValetCfg || addonShuttleCfg)) // Park & Taxi shows addon section if any addon config exists
  );

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
      items.push({ id: 'shuttle', label: 'Prijevoz (1 smjer)', price_cents: addonShuttleCfg.price_cents ?? 200 });
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

  // QR code
  const qrRef = useRef<HTMLCanvasElement>(null);
  const qrData = sessionId || `payparq-${checkoutLocationIdLabel || 'pass'}`;
  useEffect(() => {
    const canvas = qrRef.current;
    if (!canvas) return;
    import('qrcode').then((mod) => {
      const QRCode = mod.default ?? mod;
      (QRCode as { toCanvas: (el: HTMLCanvasElement, data: string, opts: object) => Promise<void> })
        .toCanvas(canvas, qrData, { width: 128, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
        .catch(() => {});
    });
  }, [qrData]);

  const mapsUrl = useMemo(() => {
    const addr = storedBooking?.address || checkoutLocationName || checkoutLocation || '';
    if (!addr) return null;
    return `https://www.google.com/maps/search/${encodeURIComponent(addr)}`;
  }, [storedBooking?.address, checkoutLocationName, checkoutLocation]);

  const passDate = useMemo(() => {
    if (!checkoutStart) return null;
    const d = new Date(checkoutStart);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('hr-HR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Zagreb' });
  }, [checkoutStart]);

  const passTimeIn = useMemo(() => {
    if (!checkoutStart) return '—';
    const d = new Date(checkoutStart);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zagreb' });
  }, [checkoutStart]);

  const passTimeOut = useMemo(() => {
    if (!checkoutEnd) return '—';
    const d = new Date(checkoutEnd);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zagreb' });
  }, [checkoutEnd]);

  const emergencyPhone = (summary?.addons_config?.phone_sms as string | undefined) ?? '+385915963139';
  const resCode = summary?.session_id ? deriveReservationCode(summary.session_id) : (storedPiId ? 'PP-' + storedPiId.slice(-4).toUpperCase() : null);

  const [howStep, setHowStep] = useState<number | null>(null);
  const howSteps = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
          <rect x="9" y="11" width="14" height="10" rx="1"/>
          <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
        </svg>
      ),
      title: 'Vozite se unutra',
      desc: 'Uđite direktno na parking. Ako je rampa zatvorena, pritisnite gumb ili nazovite broj za hitne slučajeve.',
      phone: emergencyPhone,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h5l3 3v5h-8V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
      title: 'Parkirajte',
      desc: 'Pronađite slobodan spot i parkirajte. Ako je prisutan attendant, pokažite mu ovaj pass.',
      phone: null,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      ),
      title: 'Vozite se van',
      desc: 'Izađite s parkinga slobodno. Ako je rampa zatvorena, nazovite broj za hitne slučajeve.',
      phone: emergencyPhone,
    },
  ];

  return (
    <div className="min-h-screen text-black flex flex-col" style={{ background: '#EBF0FA' }}>

      <SiteHeader hideAnnouncementBar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 space-y-3">

          {/* ══════════════════════════════════════
              PARKING PASS CARD
          ══════════════════════════════════════ */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg" style={{ border: '2px solid #1A3A6B' }}>

            {/* Pass header */}
            <div style={{ background: '#1A3A6B' }} className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-black text-[17px] uppercase tracking-wide leading-tight">Parking Pass</p>
                  <p className="text-white/50 text-[10px] font-mono mt-0.5 tracking-widest">1 / 1</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {resCode && (
                    <span className="text-white font-mono text-[12px] font-bold bg-white/10 rounded px-2 py-0.5">{resCode}</span>
                  )}
                  {lookupLoading && <p className="text-white/40 text-[9px] animate-pulse">syncing...</p>}
                </div>
              </div>
            </div>

            {/* Blue accent bar */}
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #2451A0 0%, #3B82F6 50%, #2451A0 100%)' }} />

            {/* Pass body */}
            <div className="px-5 pt-4 pb-3 flex gap-4 items-start">

              {/* Left: booking details */}
              <div className="flex-1 min-w-0 space-y-3">

                {/* Location */}
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-0.5" style={{ color: '#2451A0' }}>Lokacija / Location</p>
                  <p className="text-[17px] font-black text-black leading-tight">
                    {checkoutLocationName || checkoutLocationIdLabel || 'Parking'}
                  </p>
                  {storedBooking?.address && (
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#64748b' }}>{storedBooking.address}</p>
                  )}
                </div>

                {/* Date */}
                {passDate && (
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-0.5" style={{ color: '#2451A0' }}>Datum / Date</p>
                    <p className="text-[13px] font-bold text-black capitalize">{passDate}</p>
                  </div>
                )}

                {/* Times */}
                <div className="flex items-end gap-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-0.5" style={{ color: '#2451A0' }}>Ulaz</p>
                    <p className="text-[30px] font-black leading-none tabular-nums" style={{ color: '#1A3A6B' }}>{passTimeIn}</p>
                  </div>
                  <div className="pb-2" style={{ color: '#94a3b8' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-0.5" style={{ color: '#2451A0' }}>Izlaz</p>
                    <p className="text-[30px] font-black leading-none tabular-nums" style={{ color: '#1A3A6B' }}>{passTimeOut}</p>
                  </div>
                </div>

              </div>

              {/* Right: QR code */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="rounded-lg overflow-hidden p-1.5 bg-white" style={{ border: '2px solid #2451A0' }}>
                  <canvas ref={qrRef} width={112} height={112} className="block" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-center" style={{ color: '#2451A0' }}>Scan / Prikaži</p>
              </div>

            </div>

            {/* Perforated separator */}
            <div className="relative flex items-center my-0">
              <div className="absolute -left-3 w-5 h-5 rounded-full" style={{ background: '#EBF0FA', zIndex: 1 }} />
              <div className="flex-1 border-t-2 border-dashed mx-3" style={{ borderColor: '#2451A0' }} />
              <div className="absolute -right-3 w-5 h-5 rounded-full" style={{ background: '#EBF0FA', zIndex: 1 }} />
            </div>

            {/* Price footer */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#F0F5FF' }}>
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] font-bold mb-0.5" style={{ color: '#2451A0' }}>Ukupno plaćeno</p>
                <p className="text-[24px] font-black leading-none" style={{ color: '#1A3A6B' }}>
                  {formatAmount(summary?.amount_total ?? storedBooking?.amountCents ?? 0, summary?.currency ?? 'EUR')}
                </p>
              </div>
              <div className="text-right">
                {summary?.email && (
                  <p className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>{summary.email}</p>
                )}
                <p className="text-[9px] uppercase tracking-widest font-bold mt-1" style={{ color: '#2451A0' }}>VRIJEDI · VALID</p>
              </div>
            </div>


            {/* ── Getting There ── */}
            <div style={{ background: '#F0F5FF', borderBottom: '1px solid #CBD5E1' }} className="px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#2451A0' }}>Kako doći · Getting There</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {(checkoutLocationName || storedBooking?.address) && (
                <div>
                  <p className="text-[14px] font-bold text-black">{checkoutLocationName || ''}</p>
                  {storedBooking?.address && <p className="text-[12px] mt-0.5" style={{ color: '#64748b' }}>{storedBooking.address}</p>}
                </div>
              )}
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                  style={{ background: '#EBF0FA', border: '1px solid #2451A0' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#2451A0' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold" style={{ color: '#1A3A6B' }}>Otvori u Google Maps</p>
                    <p className="text-[11px] truncate" style={{ color: '#64748b' }}>{storedBooking?.address || checkoutLocationName || ''}</p>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2451A0" strokeWidth="2" className="shrink-0 ml-auto">
                    <path d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                </a>
              ) : (
                <p className="text-[12px] italic" style={{ color: '#94a3b8' }}>Adresa nije dostupna</p>
              )}
            </div>

            {/* ── Instructions ── */}
            <div style={{ background: '#F0F5FF', borderTop: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }} className="px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#2451A0' }}>Upute za korištenje · Instructions</p>
            </div>
            <div className="px-5 py-1 divide-y" style={{ borderColor: '#E2E8F0' }}>
              {howSteps.map((step, i) => (
                <div key={i} className="flex gap-3 py-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] text-white mt-0.5" style={{ background: '#2451A0' }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-black">{step.title}</p>
                    <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: '#64748b' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Contact numbers ── */}
            <div style={{ background: '#F0F5FF', borderTop: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' }} className="px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#2451A0' }}>Kontakt · Support</p>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              <a href="tel:+385915963139"
                className="block rounded-xl px-4 py-3"
                style={{ background: '#EBF0FA', border: '1px solid #CBD5E1' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#2451A0' }}>PayParq Priority Support</p>
                <p className="text-[15px] font-black text-black mt-0.5">+385 91 596 3139</p>
              </a>
              {emergencyPhone && emergencyPhone !== '+385915963139' && (
                <a href={`tel:${emergencyPhone}`} className="block rounded-xl px-4 py-3"
                  style={{ background: '#EBF0FA', border: '1px solid #CBD5E1' }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#2451A0' }}>Lot Emergency Number</p>
                  <p className="text-[15px] font-black text-black mt-0.5">{emergencyPhone}</p>
                </a>
              )}
              {(!emergencyPhone || emergencyPhone === '+385915963139') && (
                <div className="block rounded-xl px-4 py-3"
                  style={{ background: '#EBF0FA', border: '1px solid #CBD5E1' }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#2451A0' }}>Lot Emergency Number</p>
                  <p className="text-[13px] font-medium mt-0.5" style={{ color: '#94a3b8' }}>Prikazat će se pri dolasku</p>
                </div>
              )}
            </div>

            {/* ── (services removed) ── */}
            {false && (
              <>
                <div style={{ display: 'none' }} />
                <div style={{ display: 'none' }}>

                {/* ── Parking spot row ── */}
                {summary?.assigned_spot ? (
                  <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EBF0FA' }}>
                        <span className="text-[16px] font-black" style={{ color: '#1A3A6B' }}>{summary.assigned_spot.label}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-black">Spot {summary.assigned_spot.label}</p>
                        <p className="text-[11px]" style={{ color: '#64748b' }}>Vaš dodijeljeni parking spot</p>
                      </div>
                    </div>
                    {(() => {
                      const navLat = summary.assigned_spot?.lat ?? summary.lot_point?.lat;
                      const navLng = summary.assigned_spot?.lng ?? summary.lot_point?.lng;
                      return navLat && navLng ? (
                        <a href={`https://www.google.com/maps?q=${navLat},${navLng}`} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] font-bold underline shrink-0" style={{ color: '#2451A0' }}>
                          Navigiraj
                        </a>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="px-5 py-3">
                    <p className="text-[13px] font-medium text-black">Automatski dodjeljujemo slobodan spot</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>Spot će biti potvrđen pri dolasku</p>
                  </div>
                )}

                {/* ── Included valet toggle ── */}
                {showIncludedValet && (
                  <button type="button" onClick={() => setValetToggled((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EBF0FA' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2451A0" strokeWidth="2">
                          <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                          <rect x="9" y="11" width="14" height="10" rx="1"/>
                          <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-black">Valet parking</p>
                        <p className="text-[11px] font-medium" style={{ color: '#2451A0' }}>Uključeno · ∞</p>
                      </div>
                    </div>
                    <Toggle on={valetToggled} />
                  </button>
                )}

                {/* ── Included shuttle toggle ── */}
                {showIncludedShuttle && (
                  <button type="button" onClick={() => setShuttleToggled((s) => !s)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EBF0FA' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2451A0" strokeWidth="2">
                          <rect x="1" y="8" width="22" height="10" rx="2"/>
                          <path d="M5 18v2M19 18v2M1 12h22M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-black">Shuttle prijevoz</p>
                        <p className="text-[11px] font-medium" style={{ color: '#2451A0' }}>Uključeno · ∞</p>
                      </div>
                    </div>
                    <Toggle on={shuttleToggled} />
                  </button>
                )}

                {/* ── Paid addons ── */}
                {showPaidSection && (
                  <div className="px-5 py-3 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: '#2451A0' }}>Dodaj uslugu</p>
                    {showValetPaidAddon && (
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #CBD5E1' }}>
                        <button type="button" onClick={() => setAddonValetOn((v) => !v)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${addonValetOn ? 'border-[#2451A0]' : 'border-gray-300'}`}
                              style={addonValetOn ? { background: '#2451A0' } : {}}>
                              {addonValetOn && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                            </div>
                            <p className="text-[13px] font-medium text-black">Valet parking</p>
                          </div>
                          <span className="text-[12px] font-bold shrink-0" style={{ color: '#1A3A6B' }}>{formatAmount(addonValetCfg?.price_cents ?? 500, 'eur')}/dan</span>
                        </button>
                        {addonValetOn && (
                          <div className="px-3 pb-2.5 pt-1 flex gap-2" style={{ background: '#F0F5FF', borderTop: '1px solid #E2E8F0' }}>
                            {[1,2,3,4].map((d) => (
                              <button key={d} type="button" onClick={() => setAddonValetDays(d)}
                                className="flex-1 py-1 rounded text-[12px] font-bold transition-colors"
                                style={addonValetDays === d ? { background: '#2451A0', color: 'white' } : { background: 'white', color: '#1A3A6B', border: '1px solid #CBD5E1' }}>
                                {d}d
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {showShuttlePaidAddon && (
                      <button type="button" onClick={() => setAddonShuttleOn((v) => !v)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-gray-50"
                        style={{ border: '1px solid #CBD5E1' }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${addonShuttleOn ? 'border-[#2451A0]' : 'border-gray-300'}`}
                            style={addonShuttleOn ? { background: '#2451A0' } : {}}>
                            {addonShuttleOn && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <p className="text-[13px] font-medium text-black">Prijevoz (1 smjer)</p>
                        </div>
                        <span className="text-[12px] font-bold shrink-0" style={{ color: '#1A3A6B' }}>{formatAmount(addonShuttleCfg?.price_cents ?? 200, 'eur')}</span>
                      </button>
                    )}
                    {addonEvCfg && (
                      <button type="button" onClick={() => setAddonEvOn((v) => !v)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-gray-50"
                        style={{ border: '1px solid #CBD5E1' }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${addonEvOn ? 'border-[#2451A0]' : 'border-gray-300'}`}
                            style={addonEvOn ? { background: '#2451A0' } : {}}>
                            {addonEvOn && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <p className="text-[13px] font-medium text-black">EV punjenje</p>
                        </div>
                        <span className="text-[12px] font-bold shrink-0" style={{ color: '#1A3A6B' }}>{formatAmount(addonEvCfg.price_cents ?? 2000, 'eur')}</span>
                      </button>
                    )}
                    {addonWashCfg && (
                      <button type="button" onClick={() => setAddonWashOn((v) => !v)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-gray-50"
                        style={{ border: '1px solid #CBD5E1' }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${addonWashOn ? 'border-[#2451A0]' : 'border-gray-300'}`}
                            style={addonWashOn ? { background: '#2451A0' } : {}}>
                            {addonWashOn && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <p className="text-[13px] font-medium text-black">Pranje vozila</p>
                        </div>
                        <span className="text-[12px] font-bold shrink-0" style={{ color: '#1A3A6B' }}>od {formatAmount(addonWashBasicCents, 'eur')}</span>
                      </button>
                    )}
                    {addonFuelCfg && (
                      <button type="button" onClick={() => setAddonFuelOn((v) => !v)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-gray-50"
                        style={{ border: '1px solid #CBD5E1' }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${addonFuelOn ? 'border-[#2451A0]' : 'border-gray-300'}`}
                            style={addonFuelOn ? { background: '#2451A0' } : {}}>
                            {addonFuelOn && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <p className="text-[13px] font-medium text-black">Punjenje gorivom</p>
                        </div>
                        <span className="text-[12px] font-bold shrink-0" style={{ color: '#1A3A6B' }}>od {formatAmount(Math.min(addonFuelDieselCents, addonFuelBenzinCents), 'eur')}</span>
                      </button>
                    )}
                    {anyPaidAddonSelected && (
                      <div className="pt-1 space-y-2">
                        <div className="flex items-center justify-between text-[12px] px-1">
                          <span style={{ color: '#64748b' }}>Ukupno za usluge</span>
                          <span className="font-black" style={{ color: '#1A3A6B' }}>{formatAmount(addonsTotalCents, 'eur')}</span>
                        </div>
                        <button type="button" onClick={handleAddonsCheckout} disabled={addonsCheckoutLoading}
                          className="w-full py-2.5 rounded-xl text-white text-[13px] font-bold disabled:opacity-60"
                          style={{ background: '#1A3A6B' }}>
                          {addonsCheckoutLoading ? 'Priprema...' : 'Plati usluge'}
                        </button>
                        {addonsCheckoutError && <p className="text-[11px] text-red-500 text-center">{addonsCheckoutError}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Summon buttons ── */}
                {showSummonSection && (
                  <div className="px-5 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-3" style={{ color: '#2451A0' }}>Pozovi vozilo</p>
                    <div className={`grid gap-2 ${showIncludedValet && showIncludedShuttle ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {showIncludedValet && (
                        <button type="button" onClick={() => handleSummon('car')}
                          disabled={valetCredits === 0 || !valetToggled}
                          className="relative flex flex-col items-center gap-1.5 py-3 rounded-xl disabled:opacity-40 transition-colors"
                          style={{ background: '#EBF0FA', border: '1px solid #2451A0' }}>
                          <CreditBadge value={valetCredits} />
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A3A6B" strokeWidth="1.5">
                            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                            <rect x="9" y="11" width="14" height="10" rx="1"/>
                            <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
                          </svg>
                          <span className="text-[12px] font-bold" style={{ color: '#1A3A6B' }}>Pozovi auto</span>
                          <span className="text-[10px]" style={{ color: '#64748b' }}>~6 min</span>
                        </button>
                      )}
                      {showIncludedShuttle && (
                        <button type="button" onClick={() => handleSummon('shuttle')}
                          disabled={shuttleCredits === 0 || !shuttleToggled}
                          className="relative flex flex-col items-center gap-1.5 py-3 rounded-xl disabled:opacity-40 transition-colors"
                          style={{ background: '#EBF0FA', border: '1px solid #2451A0' }}>
                          <CreditBadge value={shuttleCredits} />
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A3A6B" strokeWidth="1.5">
                            <rect x="1" y="8" width="22" height="10" rx="2"/>
                            <path d="M5 18v2M19 18v2M1 12h22M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                          </svg>
                          <span className="text-[12px] font-bold" style={{ color: '#1A3A6B' }}>Pozovi shuttle</span>
                          <span className="text-[10px]" style={{ color: '#64748b' }}>~4 min</span>
                        </button>
                      )}
                    </div>
                    {summonStatus && (
                      <div className="mt-2 rounded-xl px-3 py-2 text-[12px] font-medium text-center" style={{ background: '#EBF0FA', color: '#1A3A6B', border: '1px solid #2451A0' }}>
                        {summonStatus}
                      </div>
                    )}
                  </div>
                )}

                </div>
              </>
            )}

          </div>

          {/* Members zona — slim single link */}
          {summary?.email && (
            <div className="flex items-center justify-center py-1">
              <Link href={membersHref} className="text-[12px] font-semibold underline underline-offset-2" style={{ color: '#2451A0' }}>
                Members zona
              </Link>
            </div>
          )}

        </div>
      </main>

      {/* Footer — matches home page */}
      <footer className="bg-[#05020A] border-t border-white/10 print:hidden notranslate" translate="no" data-no-translate="true">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid gap-12 md:grid-cols-[2fr,3fr] items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-4">Parking · Made Simple</p>
              <p className="text-sm text-white/70 max-w-md">Rezervirajte, i parkirajte bez problema.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Company</p>
                <Link href="/about" className="block hover:text-white transition-colors">About</Link>
                <Link href="/careers" className="block hover:text-white transition-colors">Careers</Link>
                <Link href="/news" className="block hover:text-white transition-colors">News</Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Vision</p>
                <Link href="/product" className="block hover:text-white transition-colors">Product</Link>
                <Link href="/parking" className="block hover:text-white transition-colors">Parking</Link>
                <Link href="/security" className="block hover:text-white transition-colors">Security</Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Policies</p>
                <Link href="/legal" className="block hover:text-white transition-colors">Legal</Link>
                <Link href="/privacy" className="block hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="block hover:text-white transition-colors">Terms</Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">Platform</p>
                <Link href="/locations" className="block hover:text-white transition-colors">Locations</Link>
                <Link href="/members" className="block hover:text-white transition-colors">Members</Link>
                <Link href="/support" className="block hover:text-white transition-colors">Support</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10">
            <FooterBrand />
          </div>
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
      <div className="min-h-screen flex items-center justify-center text-black/30 text-sm" style={{ background: '#EBF0FA' }}>
        Učitavanje...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
