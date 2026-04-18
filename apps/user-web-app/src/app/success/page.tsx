'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Car } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
};

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
  const [valetEnabled, setValetEnabled] = useState(false);
  const [shuttleEnabled, setShuttleEnabled] = useState(true);
  const [summonStatus, setSummonStatus] = useState<string | null>(null);

  const fallbackDisplayId =
    searchParams.get('display_id') ||
    searchParams.get('displayId') ||
    searchParams.get('id') ||
    null;
  const fallbackLocationId =
    fallbackDisplayId ||
    searchParams.get('location_id') ||
    searchParams.get('locationId') ||
    searchParams.get('loc') ||
    searchParams.get('location') ||
    null;
  const fallbackCheckIn =
    searchParams.get('check_in') ||
    searchParams.get('checkIn') ||
    searchParams.get('in') ||
    searchParams.get('start') ||
    null;
  const fallbackCheckOut =
    searchParams.get('check_out') ||
    searchParams.get('checkOut') ||
    searchParams.get('out') ||
    searchParams.get('end') ||
    null;

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    const date = parsed.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Zagreb' });
    const time = parsed.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zagreb' });
    return `${date} ${time}`;
  };

  const formatAmount = (amount: number | null | undefined, currency: string | null | undefined) => {
    const normalized = Number(amount ?? 0);
    const value = Number.isFinite(normalized) ? normalized / 100 : 0;
    const resolvedCurrency = (currency || 'EUR').toUpperCase();
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: resolvedCurrency,
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
  const refCode = summary?.ref_id ?? (hasRealSessionId && sessionId ? sessionId.slice(-8) : null);

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
          setLookupError(
            payload && 'error' in payload && payload.error
              ? payload.error
              : 'Unable to load payment details.'
          );
          return;
        }
        setSummary(payload as SessionSummary);
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

  const handleSummon = (type: 'car' | 'shuttle') => {
    setSummonStatus(
      type === 'car'
        ? 'Vaš automobil je na putu · ETA ~6 min'
        : 'Shuttle je pozvan · Dolazi za ~4 min'
    );
    setTimeout(() => setSummonStatus(null), 5000);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-sm mx-auto px-4 space-y-3 mt-8">

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
                <p className="text-[15px] font-semibold text-black leading-tight truncate">
                  {checkoutLocationName || checkoutLocationIdLabel || 'Safe Parking by PayParq'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
              <div>
                <p className="text-black/50">Ref</p>
                <p className="font-semibold text-black font-mono tracking-tight">{refCode || '—'}</p>
              </div>
              <div>
                <p className="text-black/50">Cijena</p>
                <p className="font-semibold text-black">
                  {formatAmount(summary?.amount_total ?? 0, summary?.currency ?? 'EUR')}
                </p>
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
              <p className="mt-3 text-[11px] text-black/40">
                {lookupLoading ? 'Učitavanje...' : lookupError}
              </p>
            )}
          </div>

          {/* 2 — Produži boravak */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest mb-3">
              Produži boravak
            </p>
            <div className="grid grid-cols-4 gap-2">
              {([
                { label: '+1h', minutes: 60 },
                { label: '+2h', minutes: 120 },
                { label: '+1d', minutes: 1440 },
                { label: '+2d', minutes: 2880 },
              ] as const).map(({ label, minutes }) => (
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

          {/* 3 — Dodaci */}
          {(summary?.valet_enabled || summary?.shuttle_enabled) && (
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest mb-3">
              Dodaci
            </p>
            <div className="space-y-2">

              {/* Valet */}
              {summary?.valet_enabled && (
              <button
                type="button"
                onClick={() => setValetEnabled(v => !v)}
                className="w-full flex items-center justify-between rounded-xl border border-black/10 p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F2FF] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5F3DFC" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-black">Valet parking</p>
                    <p className="text-[11px] text-black/50">Mi parkiramo vaš automobil</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[13px] font-medium text-black">5,00 €</span>
                  <div
                    className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative"
                    style={{
                      background: valetEnabled ? '#5F3DFC' : '#f3f4f6',
                      borderColor: valetEnabled ? '#5F3DFC' : '#e5e7eb',
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm"
                      style={{ left: valetEnabled ? '18px' : '2px' }}
                    />
                  </div>
                </div>
              </button>
              )}

              {/* Shuttle */}
              {summary?.shuttle_enabled && (
              <button
                type="button"
                onClick={() => setShuttleEnabled(s => !s)}
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
                    <p className="text-[14px] font-medium text-black">Shuttle prijevoz</p>
                    <p className="text-[11px] text-black/50">Do/od destinacije besplatno</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {shuttleEnabled && (
                    <span className="text-[11px] font-medium text-[#0F6E56] bg-[#E1F5EE] px-2 py-0.5 rounded-md">
                      Uključeno
                    </span>
                  )}
                  <div
                    className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative"
                    style={{
                      background: shuttleEnabled ? '#1D9E75' : '#f3f4f6',
                      borderColor: shuttleEnabled ? '#0F6E56' : '#e5e7eb',
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm"
                      style={{ left: shuttleEnabled ? '18px' : '2px' }}
                    />
                  </div>
                </div>
              </button>
              )}

            </div>
          </div>
          )}

          {/* 4 — Pozovi vozilo */}
          {(summary?.valet_enabled || summary?.shuttle_enabled) && (
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[11px] font-semibold text-black/50 uppercase tracking-widest mb-3">
              Pozovi vozilo
            </p>
            <div className={`grid gap-3 ${summary?.valet_enabled && summary?.shuttle_enabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {summary?.valet_enabled && (
              <button
                type="button"
                onClick={() => handleSummon('car')}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-black/10 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Car size={28} strokeWidth={1.5} className="text-black" />
                <span className="text-[13px] font-medium text-black">Pozovi auto</span>
                <span className="text-[11px] text-black/50">Valet dovozi</span>
              </button>
              )}
              {summary?.shuttle_enabled && (
              <button
                type="button"
                onClick={() => handleSummon('shuttle')}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-black/10 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-black">
                  <rect x="1" y="8" width="22" height="10" rx="2"/>
                  <path d="M5 18v2M19 18v2"/>
                  <path d="M1 12h22"/>
                  <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                </svg>
                <span className="text-[13px] font-medium text-black">Pozovi shuttle</span>
                <span className="text-[11px] text-black/50">ETA ~4 min</span>
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
              onClick={() => window.print()}
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
