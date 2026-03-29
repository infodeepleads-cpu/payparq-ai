'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Car } from 'lucide-react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';

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
  membership_exists: boolean;
  email_verified: boolean;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
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
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('hr-HR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Europe/Zagreb',
    });
  };
  const checkoutLocation = summary?.location_id ?? fallbackLocationId;
  const checkoutLocationName = summary?.location_name ?? null;
  const checkoutLocationDisplayId = summary?.location_display_id ?? null;
  const checkoutLocationIdLabel = checkoutLocationDisplayId || checkoutLocation;
  const checkoutStart = summary?.check_in ?? fallbackCheckIn;
  const checkoutEnd = summary?.check_out ?? fallbackCheckOut;
  const checkoutFlowType = summary?.flow_type ?? searchParams.get('flow');
  const isParkTaxiFlow = checkoutFlowType === 'park_now';
  const parkTaxiDays = useMemo(() => {
    if (!checkoutStart || !checkoutEnd) return 1;
    const start = new Date(checkoutStart);
    const end = new Date(checkoutEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return 1;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [checkoutEnd, checkoutStart]);
  const formatStartTimeShort = (value: string | null | undefined) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleTimeString('hr-HR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Zagreb',
    });
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
  const parkTaxiUltrabrief = isParkTaxiFlow
    ? `${checkoutLocationName || 'Safe Parking by PayParq Split Airport/Trogir'} • ID ${checkoutLocationIdLabel || '—'} • Od ${formatDateTime(checkoutStart)} • Do ${formatDateTime(checkoutEnd)} • Ukupno ${formatAmount(summary?.amount_total, summary?.currency)} • Prva vožnja ${formatStartTimeShort(checkoutStart)} • Uključeno ${parkTaxiDays} ${parkTaxiDays === 1 ? 'dan' : 'dana'} parkinga + 2 vožnje dnevno • Povratak aktiviraj 15 min prije.`
    : '';
  useEffect(() => {
    let active = true;
    if (!sessionId) {
      return;
    }
    const run = async () => {
      setLookupLoading(true);
      setLookupError('');
      try {
        const lookupParams = new URLSearchParams();
        lookupParams.set('session_id', sessionId);
        if (fallbackDisplayId) {
          lookupParams.set('display_id', fallbackDisplayId);
        }
        if (fallbackLocationId) {
          lookupParams.set('location_id', fallbackLocationId);
        }
        if (fallbackCheckIn) {
          lookupParams.set('check_in', fallbackCheckIn);
        }
        if (fallbackCheckOut) {
          lookupParams.set('check_out', fallbackCheckOut);
        }
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
    return () => {
      active = false;
    };
  }, [sessionId, fallbackDisplayId, fallbackLocationId, fallbackCheckIn, fallbackCheckOut]);

  const membersHref = useMemo(() => {
    if (!summary?.email) return '/members';
    return `/members?email=${encodeURIComponent(summary.email)}`;
  }, [summary?.email]);
  const trackDriverHref = useMemo(() => {
    const params = new URLSearchParams({
      tab: 'activity',
    });
    if (summary?.email) {
      params.set('email', summary.email);
    }
    return `/members?${params.toString()}`;
  }, [summary?.email]);
  const orderParqRideHref = useMemo(() => {
    const params = new URLSearchParams({
      tab: 'home',
    });
    if (summary?.email) {
      params.set('email', summary.email);
    }
    return `/members?${params.toString()}`;
  }, [summary?.email]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 pt-24 md:pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          
          {/* Success Header */}
          <div className="mt-[0.5cm] mb-10 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">
                  Rezervacija potvrđena
                </h1>
                <p className="text-sm md:text-base text-black/70 max-w-lg">
                  Vaša sesija parkiranja je uspješno rezervirana.
                  {sessionId && <span className="block mt-1 text-xs text-black/40 font-mono">Ref: {sessionId.slice(-8)}</span>}
                </p>
                <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-xs text-black/70 space-y-1">
                  <p>
                    <span className="font-semibold text-black">Lokacija:</span>{' '}
                    {checkoutLocationName || checkoutLocationIdLabel || '—'}
                  </p>
                  <p>
                    <span className="font-semibold text-black">ID lokacije:</span>{' '}
                    {checkoutLocationIdLabel || '—'}
                  </p>
                  <p>
                    <span className="font-semibold text-black">Vrijedi od:</span> {formatDateTime(checkoutStart)}
                  </p>
                  <p>
                    <span className="font-semibold text-black">Vrijedi do:</span> {formatDateTime(checkoutEnd)}
                  </p>
                </div>
                {parkTaxiUltrabrief && (
                  <p className="mt-2 text-[11px] text-black/70">
                    {parkTaxiUltrabrief}
                  </p>
                )}
                {summary?.email && (
                  <p className="text-xs text-black/50 mt-2">
                    Membership is ready for {summary.email}. Verify email to unlock promotions.
                  </p>
                )}
                {!summary?.email_verified && summary?.email && (
                  <p className="text-[11px] text-black/50 mt-1">
                    Check Inbox and Junk/Spam after tapping verify.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-black/5 rounded-3xl p-6 md:p-8 space-y-5 no-print shadow-sm">
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-black">Nastavite u Members zoni</h3>
              <p className="text-sm text-black/70">
                Osiguranje, Uber, produženje boravka i preuzimanje potvrde računa dostupni su unutar Members zone.
              </p>
              {(lookupLoading || lookupError) && (
                <p className="text-[11px] text-black/50">
                  {lookupLoading ? 'Loading payment details...' : lookupError}
                </p>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <Link
                href={membersHref}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-sm hover:bg-gray-900 transition-colors"
              >
                Otvori Members page
              </Link>
              <Link
                href={trackDriverHref}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-black/15 bg-white text-black text-xs font-semibold hover:bg-black/5 transition-colors"
              >
                24/7 tracking Parq vozača
              </Link>
              <Link
                href={orderParqRideHref}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-[#5F3DFC]/25 bg-[#F5F2FF] text-[#5F3DFC] text-xs font-semibold hover:bg-[#ECE7FF] transition-colors"
              >
                <Car size={14} />
                Naruči Parq vožnju
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center md:text-left no-print">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-medium text-black/40 hover:text-black transition-colors"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </main>

      <section className="bg-[#05020A] border-t border-white/10 no-print">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Company
              </p>
              <Link href="/about" className="block hover:text-white transition-colors">
                About
              </Link>
              <Link href="/careers" className="block hover:text-white transition-colors">
                Careers
              </Link>
              <Link href="/news" className="block hover:text-white transition-colors">
                News
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Vision
              </p>
              <Link href="/product" className="block hover:text-white transition-colors">
                Product
              </Link>
              <Link href="/parking" className="block hover:text-white transition-colors">
                Parking
              </Link>
              <Link href="/security" className="block hover:text-white transition-colors">
                Security
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Policies
              </p>
              <Link href="/legal" className="block hover:text-white transition-colors">
                Legal
              </Link>
              <Link href="/privacy" className="block hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="block hover:text-white transition-colors">
                Terms
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                Platform
              </p>
              <Link href="/locations" className="block hover:text-white transition-colors">
                Locations
              </Link>
              <Link href="/members" className="block hover:text-white transition-colors">
                Members
              </Link>
              <Link href="/support" className="block hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10">
            <FooterBrand />
          </div>
        </div>
      </section>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white; color: black; }
          .no-print { display: none !important; }
          header, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05020A] text-white flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
