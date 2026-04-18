'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';

type AddonSession = {
  session_id: string;
  flow_type: string | null;
  email: string | null;
  amount_total: number;
  currency: string;
  location_name: string | null;
  location_display_id: string | null;
  valet_code: string | null;
  addons: string | null;
  original_session_id: string | null;
};

function parseAddons(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.split(':')[0]).filter(Boolean);
}

function AddonsSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState<AddonSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}' || sessionId.includes('CHECKOUT_SESSION_ID')) return;
    setLoading(true);
    fetch(`/api/stripe/addons-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setSession(data as AddonSession);
        else setError('Nije moguće učitati detalje.');
      })
      .catch(() => setError('Greška pri učitavanju.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const addonIds = parseAddons(session?.addons ?? null);
  const hasValet = addonIds.includes('valet');
  const hasEv = addonIds.includes('ev_charging');
  const hasWash = addonIds.some((id) => id.startsWith('car_wash'));
  const hasFuel = addonIds.some((id) => id.startsWith('fuel'));

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <SiteHeader />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-sm mx-auto px-4 space-y-3 mt-12">

          {/* Header confirmation */}
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#E1F5EE] flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-black/50">Usluge potvrđene</p>
                <p className="text-[15px] font-semibold text-black leading-tight">
                  {session?.location_name || 'Payparq usluge'}
                </p>
              </div>
            </div>
            {session && (
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                <div>
                  <p className="text-black/50">Lokacija ID</p>
                  <p className="font-semibold text-black font-mono tracking-tight">{session.location_display_id || '—'}</p>
                </div>
                <div>
                  <p className="text-black/50">Cijena</p>
                  <p className="font-semibold text-black">
                    {formatAmount(session.amount_total, session.currency || 'eur')}
                  </p>
                </div>
              </div>
            )}
            {loading && <p className="mt-3 text-[11px] text-black/40">Učitavanje...</p>}
            {error && <p className="mt-3 text-[11px] text-red-500">{error}</p>}
          </div>

          {/* Valet instructions */}
          {(hasValet || session?.valet_code) && (
            <div className="rounded-2xl border border-[#5F3DFC]/20 bg-[#F5F2FF] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5F3DFC] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                    <rect x="9" y="11" width="14" height="10" rx="1"/>
                    <path d="M13 16v-1a2 2 0 1 1 4 0v1"/>
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-[#5F3DFC]">Valet upute</p>
              </div>

              {session?.valet_code && (
                <div className="rounded-xl bg-white border border-[#5F3DFC]/20 px-4 py-3 text-center">
                  <p className="text-[11px] text-black/50 mb-1">Vaš valet kod</p>
                  <p className="text-[28px] font-bold tracking-widest text-[#5F3DFC] font-mono">{session.valet_code}</p>
                  <p className="text-[10px] text-black/40 mt-1">Pokažite kodu valet agentu pri predaji vozila</p>
                </div>
              )}

              <div className="space-y-2 text-[13px]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5F3DFC]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#5F3DFC]">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Predaja vozila</p>
                    <p className="text-black/50 text-[12px]">Parkirajte se na označenom području ispred ulaza (zona &quot;VALET DROP-OFF&quot;). Agent vas dočekuje.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5F3DFC]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#5F3DFC]">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Dočekuje vas agent</p>
                    <p className="text-black/50 text-[12px]">Valet agent u uniformi će preuzeti ključeve i potpisati primitak. ETA preuzimanja: <strong className="text-black">~3 min</strong>.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#5F3DFC]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#5F3DFC]">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Preuzimanje vozila</p>
                    <p className="text-black/50 text-[12px]">Kad ste spremni, vratite se na zonu &quot;VALET PICK-UP&quot;. Vaše vozilo bit će dostavljeno za ~6 min.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#E1F5EE] flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-black">Sigurnost osigurana</p>
                    <p className="text-black/50 text-[12px]">Vozilo je pod videonadzorom. Svi agenti su verificirani i osigurani putem Payparq sustava.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EV Charging */}
          {hasEv && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-black">EV punjenje</p>
                  <p className="text-[11px] text-black/50">Vozilo se puni dok ste odsutni</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1 text-[12px]">
                <div className="flex justify-between"><span className="text-black/50">Konektor</span><span className="font-medium">Type 2 / CCS</span></div>
                <div className="flex justify-between"><span className="text-black/50">Snaga punjenja</span><span className="font-medium">do 22 kW AC</span></div>
                <div className="flex justify-between"><span className="text-black/50">Status</span><span className="font-medium text-[#2E7D32]">Aktivno</span></div>
              </div>
            </div>
          )}

          {/* Car Wash */}
          {hasWash && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2">
                    <path d="M12 2a10 10 0 0 1 10 10"/>
                    <path d="M12 6a6 6 0 0 1 6 6"/>
                    <path d="M12 10a2 2 0 0 1 2 2"/>
                    <path d="M5 12H2"/>
                    <path d="M5.5 15.5L3 18"/>
                    <path d="M5.5 8.5L3 6"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-black">Pranje vozila</p>
                  <p className="text-[11px] text-black/50">Vozilo će biti oprano za vrijeme vašeg boravka</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-2 text-[12px]">
                <p className="text-black/50">Odabrana opcija: <span className="font-medium text-black">{addonIds.includes('car_wash_premium') ? 'Premium' : 'Basic'}</span></p>
                <p className="text-[11px] text-black/40 mt-1">Vozilo će biti vraćeno čisto na valet pick-up lokaciju.</p>
              </div>
            </div>
          )}

          {/* Fuel */}
          {hasFuel && (
            <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF8E1] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F57F17" strokeWidth="2">
                    <path d="M3 22V8l7-6 7 6v14"/>
                    <path d="M10 22V12h4v10"/>
                    <path d="M18 10h1a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1 1 1 0 0 1-1 1v3a2 2 0 0 1-2 2h-1"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-black">Punjenje gorivom</p>
                  <p className="text-[11px] text-black/50">Agent puni gorivo dok ste odsutni</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-2 text-[12px]">
                <p className="text-black/50">Vrsta goriva: <span className="font-medium text-black">{addonIds.includes('fuel_diesel') ? 'Diesel' : 'Benzin'}</span></p>
                <p className="text-[11px] text-black/40 mt-1">Agent dolazi s mobilnom punjaonicom. Obavijest po završetku.</p>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="flex flex-col gap-2 pt-2">
            {session?.original_session_id && (
              <Link
                href={`/success?session_id=${encodeURIComponent(session.original_session_id)}`}
                className="w-full py-3 rounded-xl border border-black/10 bg-white text-[14px] font-medium text-black text-center block hover:bg-gray-50 transition-colors"
              >
                Nazad na rezervaciju
              </Link>
            )}
            <Link
              href="/members"
              className="w-full py-3 rounded-xl bg-[#5F3DFC] text-white text-[14px] font-semibold text-center block hover:bg-[#4330c4] transition-colors"
            >
              Members zona
            </Link>
          </div>

        </div>
      </main>

      <footer className="bg-[#020617] px-6 py-8 print:hidden">
        <div className="max-w-sm mx-auto">
          <FooterBrand />
        </div>
      </footer>
    </div>
  );
}

export default function AddonsSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-black/40 text-sm">
        Učitavanje...
      </div>
    }>
      <AddonsSuccessContent />
    </Suspense>
  );
}
