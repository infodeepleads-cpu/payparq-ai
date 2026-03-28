'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Car, Shield, Download, ExternalLink } from 'lucide-react';
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
  membership_exists: boolean;
  email_verified: boolean;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const refId = summary?.ref_id ?? (sessionId ? sessionId.slice(-8) : null);
  const mailSubject = `Insurance Application${refId ? ` – Booking ${refId}` : ''}`;
  const mailBody =
    `Hello Payparq,\n\n` +
    `I’d like to apply for parking insurance.\n\n` +
    `Vehicle details:\n` +
    `- Make/Model:\n` +
    `- License plate:\n` +
    `- Year:\n\n` +
    `Please confirm price. I will attach a photo of my vehicle.\n\n` +
    `Thank you,\n`;
  const mailtoHref = `mailto:payparq@outlook.com?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

  const handleDownloadReceipt = () => {
    window.print();
  };

  useEffect(() => {
    let active = true;
    if (!sessionId) {
      return;
    }
    const run = async () => {
      setLookupLoading(true);
      setLookupError('');
      try {
        const response = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`);
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
  }, [sessionId]);

  const membersHref = useMemo(() => {
    if (!summary?.email) return '/members';
    return `/members?email=${encodeURIComponent(summary.email)}&tab=activity`;
  }, [summary?.email]);
  const extendHourlyHref = useMemo(() => {
    if (!summary?.location_id) return '';
    const params = new URLSearchParams({
      location_id: summary.location_id,
      flow: 'park_now',
      type: 'hourly',
      allow_promotion_codes: '1',
    });
    if (summary.email) {
      params.set('email', summary.email);
    }
    return `/api/stripe/checkout?${params.toString()}`;
  }, [summary?.location_id, summary?.email]);

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
                  Booking Confirmed
                </h1>
                <p className="text-sm md:text-base text-black/70 max-w-lg">
                  Your parking session has been successfully booked. 
                  {sessionId && <span className="block mt-1 text-xs text-black/40 font-mono">Ref: {sessionId.slice(-8)}</span>}
                </p>
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

          {/* Main Actions Card */}
          <div className="bg-gray-50 border border-black/5 rounded-3xl p-6 md:p-8 space-y-8 no-print shadow-sm">
            
            {/* Upsell: Uber */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Next Steps</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <a 
                  href="https://m.uber.com/ul" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 hover:border-black/10 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <Car size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-black">Order Uber</h3>
                    <p className="text-xs text-black/50 truncate">Get a ride</p>
                  </div>
                  <ExternalLink size={16} className="text-black/30 group-hover:text-black transition-colors" />
                </a>

                {/* Upsell: Insurance */}
                <div className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#5F3DFC]/10 hover:border-[#5F3DFC]/30 hover:shadow-md transition-all text-left">
                  <div className="w-12 h-12 rounded-full bg-[#5F3DFC] text-white flex items-center justify-center shadow-lg shadow-[#5F3DFC]/20 shrink-0">
                    <Shield size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-black">Add Insurance</h3>
                    <p className="text-xs text-black/50 truncate">Protect your trip</p>
                  </div>
                  <a
                    href={mailtoHref}
                    className="px-4 py-1.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors"
                  >
                    Apply
                  </a>
                </div>
              </div>
            </div>

            <div className="h-px bg-black/5" />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="text-center md:text-left">
                <p className="text-sm text-black/70">
                  Open Members to track this live session and account activity.
                </p>
                {(lookupLoading || lookupError) && (
                  <p className="text-[11px] text-black/50 mt-1">
                    {lookupLoading ? 'Loading payment details...' : lookupError}
                  </p>
                )}
              </div>
              <Link
                href={membersHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white text-[13px] font-semibold shadow-sm hover:bg-gray-900 transition-colors w-full md:w-auto"
              >
                Open Members
              </Link>
            </div>

            <div className="h-px bg-black/5" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-black">Extend Your Stay</p>
                {summary?.location_id && (
                  <p className="text-[11px] text-black/50">Location: {summary.location_id}</p>
                )}
              </div>
              <p className="text-xs text-black/60">
                Fastest conversion path: one tap to extend now, no form re-entry.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <a
                  href={extendHourlyHref || '#'}
                  aria-disabled={!extendHourlyHref}
                  className={`inline-flex items-center justify-center px-4 py-3 rounded-full text-xs font-semibold transition-colors ${
                    extendHourlyHref
                      ? 'bg-black text-white hover:bg-gray-900'
                      : 'bg-black/10 text-black/40 pointer-events-none'
                  }`}
                >
                  Extend hourly
                </a>
              </div>
              {!summary?.location_id && (
                <p className="text-[11px] text-black/50">
                  Extension links appear as soon as payment location details are loaded.
                </p>
              )}
            </div>

            <div className="h-px bg-black/5" />

            {/* Receipt Download */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <p className="text-sm text-black/60 text-center md:text-left">
                Need a copy for your records?
              </p>
              <button 
                onClick={handleDownloadReceipt}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#5F3DFC] text-white text-[13px] font-semibold shadow-sm hover:bg-[#4330c4] transition-colors w-full md:w-auto"
              >
                <Download size={16} />
                Download Receipt
              </button>
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
