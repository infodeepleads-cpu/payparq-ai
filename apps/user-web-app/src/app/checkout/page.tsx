'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Shield, Lock, ChevronLeft, MapPin, Clock, Tag, CheckCircle, X } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// ─── Payment form ─────────────────────────────────────────────────────────────

function CheckoutForm({
  amountEur,
  locationName,
  checkIn,
  checkOut,
  locationId,
  originalAmountCents,
  onAmountChange,
}: {
  amountEur: number;
  locationName: string;
  checkIn: string;
  checkOut: string;
  locationId: string;
  originalAmountCents: number;
  onAmountChange: (newAmountCents: number) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [discountCents, setDiscountCents] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const isFree = amountEur <= 0;

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoStatus('loading');
    setPromoError(null);

    try {
      const res = await fetch('/api/stripe/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          location_id: locationId,
          amount_cents: originalAmountCents,
        }),
      });
      const data = await res.json();

      if (data.valid) {
        setPromoStatus('valid');
        setDiscountCents(data.discount_cents);
        setDiscountPercent(data.discount_percent);
        onAmountChange(data.final_amount_cents);
      } else {
        setPromoStatus('invalid');
        setPromoError(data.error || 'Nevažeći promo kod');
      }
    } catch {
      setPromoStatus('invalid');
      setPromoError('Greška pri provjeri. Pokušajte ponovo.');
    }
  };

  const handleRemovePromo = () => {
    setPromoStatus('idle');
    setPromoInput('');
    setPromoError(null);
    setDiscountCents(0);
    setDiscountPercent(0);
    onAmountChange(originalAmountCents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (isFree) {
      // 100% off — no payment needed, just redirect to success
      router.push('/success');
      return;
    }

    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setSubmitError(submitErr.message ?? 'Plaćanje nije uspjelo.');
      setSubmitting(false);
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (confirmErr) {
      setSubmitError(confirmErr.message ?? 'Plaćanje nije uspjelo.');
      setSubmitting(false);
    }
  };

  const fmt = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['sij', 'velj', 'ožu', 'tra', 'svi', 'lip', 'srp', 'kol', 'ruj', 'lis', 'stu', 'pro'];
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${d.getDate()}. ${months[d.getMonth()]} ${hh}:${mm}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Reservation summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-[#5F3DFC] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{locationName}</p>
            {checkIn && checkOut && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">{fmt(checkIn)} – {fmt(checkOut)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-1">
          {discountCents > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Cijena</span>
              <span className="text-sm text-gray-400 line-through">€{(originalAmountCents / 100).toFixed(2)}</span>
            </div>
          )}
          {discountCents > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600 font-medium">Popust ({discountPercent}%)</span>
              <span className="text-sm text-green-600 font-medium">-€{(discountCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Ukupno</span>
            <span className="text-2xl font-bold text-gray-900">
              {isFree ? <span className="text-green-600">Besplatno!</span> : `€${amountEur.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Promo code */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[#5F3DFC]" />
          <span className="text-sm font-semibold text-gray-900">Promo kod</span>
        </div>

        {promoStatus === 'valid' ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{promoInput.toUpperCase()} — {discountPercent}% popust</span>
            </div>
            <button type="button" onClick={handleRemovePromo} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
              placeholder="Unesite promo kod"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5F3DFC] focus:ring-1 focus:ring-[#5F3DFC] uppercase"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={!promoInput.trim() || promoStatus === 'loading'}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: '#5F3DFC' }}
            >
              {promoStatus === 'loading' ? '...' : 'Primijeni'}
            </button>
          </div>
        )}

        {promoError && (
          <p className="text-xs text-red-500 mt-2 font-medium">{promoError}</p>
        )}
      </div>

      {/* Stripe Elements — hide if free */}
      {!isFree && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>
      )}

      {submitError && (
        <p className="text-sm text-red-500 font-medium">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={(!stripe || submitting) && !isFree}
        className="w-full py-4 rounded-xl font-bold text-base text-white transition-opacity disabled:opacity-60"
        style={{ background: isFree ? '#16a34a' : '#5F3DFC' }}
      >
        {submitting
          ? 'Obrađujem…'
          : isFree
          ? 'Potvrdi rezervaciju besplatno'
          : `Plati €${amountEur.toFixed(2)}`}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" />SSL enkripcija</span>
        <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Sigurna naplata</span>
      </div>
    </form>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function CheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const locId = searchParams.get('loc') || '';
  const checkIn = searchParams.get('in') || '';
  const checkOut = searchParams.get('out') || '';
  const initialAmountCents = parseInt(searchParams.get('amount_cents') || '0', 10);
  const locationName = searchParams.get('name') || 'Parking';

  const [amountCents, setAmountCents] = useState(initialAmountCents);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const intentAmountRef = useRef<number | null>(null);

  const createIntent = useCallback(async (cents: number) => {
    if (cents < 50) {
      // Free — no PaymentIntent needed
      setClientSecret('free');
      return;
    }
    try {
      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locId,
          amount_cents: cents,
          check_in: checkIn,
          check_out: checkOut,
          description: `PayParq — ${locationName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.client_secret) {
        setFetchError('Nije moguće pokrenuti plaćanje. Pokušajte ponovo.');
        return;
      }
      intentAmountRef.current = cents;
      setClientSecret(data.client_secret);
    } catch {
      setFetchError('Mrežna greška. Pokušajte ponovo.');
    }
  }, [locId, checkIn, checkOut, locationName]);

  useEffect(() => {
    if (!locId) { setFetchError('Nevaljani parametri rezervacije.'); return; }
    createIntent(initialAmountCents);
  }, []);

  // When promo reduces amount, create a new PaymentIntent
  const handleAmountChange = useCallback((newCents: number) => {
    setAmountCents(newCents);
    setClientSecret(null);
    createIntent(newCents);
  }, [createIntent]);

  const amountEur = amountCents / 100;
  const isFree = amountCents < 50;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#05020A' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Natrag
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#5F3DFC' }}>
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">PayParq</span>
        </div>
        <div className="w-16" />
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dovršite rezervaciju</h1>
            <p className="text-sm text-white/50 mt-1">Sigurna naplata putem Stripe-a</p>
          </div>

          {fetchError && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
              <p className="text-sm text-red-300">{fetchError}</p>
            </div>
          )}

          {!clientSecret && !fetchError && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl h-36 animate-pulse" />
              <div className="bg-white/5 rounded-2xl h-24 animate-pulse" />
              <div className="bg-white/5 rounded-2xl h-48 animate-pulse" />
            </div>
          )}

          {clientSecret && (isFree || clientSecret !== 'free') && (
            isFree ? (
              <CheckoutForm
                amountEur={0}
                locationName={locationName}
                checkIn={checkIn}
                checkOut={checkOut}
                locationId={locId}
                originalAmountCents={initialAmountCents}
                onAmountChange={handleAmountChange}
              />
            ) : (
              <Elements
                stripe={stripePromise}
                key={clientSecret}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#5F3DFC',
                      colorBackground: '#ffffff',
                      colorText: '#111111',
                      borderRadius: '12px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    },
                    rules: {
                      '.Label': { color: '#111111', fontWeight: '600', fontSize: '13px' },
                      '.Input': { borderColor: '#e5e7eb', boxShadow: 'none' },
                      '.Input:focus': { borderColor: '#5F3DFC', boxShadow: '0 0 0 2px rgba(95,61,252,0.15)' },
                    },
                  },
                  locale: 'hr',
                }}
              >
                <CheckoutForm
                  amountEur={amountEur}
                  locationName={locationName}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  locationId={locId}
                  originalAmountCents={initialAmountCents}
                  onAmountChange={handleAmountChange}
                />
              </Elements>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
