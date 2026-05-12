'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from 'next/link';
import { Star, CheckCircle, X, Phone, Lock } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${h12}:${mm} ${ampm}`;
}

function fmtTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm} ${ampm}`;
}

// ─── Right summary panel ──────────────────────────────────────────────────────

function SummaryPanel({
  locationName, locationId, address, checkIn, checkOut,
  originalAmountCents, amountEur,
  promoStatus, promoInput, promoError, promoDiscountCents, promoDiscountPercent,
  onApplyPromo, onRemovePromo, onInputChange,
}: {
  locationName: string;
  locationId: string;
  address: string;
  checkIn: string;
  checkOut: string;
  originalAmountCents: number;
  amountEur: number;
  promoStatus: 'idle' | 'loading' | 'valid' | 'invalid';
  promoInput: string;
  promoError: string | null;
  promoDiscountCents: number;
  promoDiscountPercent: number;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
  onInputChange: (v: string) => void;
}) {
  const subtotalEur = originalAmountCents / 100;
  const serviceFeeEur = parseFloat((subtotalEur * 0.05).toFixed(2));
  const discountEur = promoDiscountCents / 100;
  const isFree = amountEur <= 0;

  const durationHours = checkIn && checkOut ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60)) : 1;
  const [showPromoDropdown, setShowPromoDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  function formatFullDateTime(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds + ' CET';
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 sticky top-8 p-6 space-y-6">
      <div className="hidden lg:block">
        <p className="text-sm font-semibold text-gray-900 mb-1">{locationName}</p>
        <p className="text-xs text-gray-600">{address || locationId}</p>
      </div>

      <div className="lg:hidden">
        <p className="text-xs font-semibold text-gray-600 text-center">Sesija parkiranja ({durationHours} Sat{durationHours > 1 ? 'a' : ''})</p>
        <p className="font-bold text-gray-900 text-3xl mt-1 text-center">€{amountEur.toFixed(2)}</p>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-600">Reservation Period</p>
          <button onClick={() => setShowDatePicker(!showDatePicker)} className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700">
            Change
          </button>
        </div>
        <div className="space-y-2 text-xs text-gray-700">
          <p>From: <span className="font-mono font-medium">{checkIn ? formatFullDateTime(checkIn) : '—'}</span></p>
          <p>To: <span className="font-mono font-medium">{checkOut ? formatFullDateTime(checkOut) : '—'}</span></p>
        </div>
        <p className="text-xs text-gray-700 mt-3">ID Lokacije: <span className="font-mono font-medium">{locationName || '—'}</span></p>
      </div>

      {showDatePicker && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setShowDatePicker(false)}>
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Change Reservation Period</h3>
            <p className="text-sm text-gray-600 mb-4">Date/time picker widget would go here</p>
            <button onClick={() => setShowDatePicker(false)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <button className="px-2 py-2 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors text-center">
            <div className="font-semibold text-gray-900">+1h</div>
            <div className="text-xs text-gray-600 mt-0.5">+€{(subtotalEur * 0.75).toFixed(2)}</div>
          </button>
          <button className="px-2 py-2 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors text-center">
            <div className="font-semibold text-gray-900">+2h</div>
            <div className="text-xs text-gray-600 mt-0.5">+€{(subtotalEur * 1.5).toFixed(2)}</div>
          </button>
          <button className="px-2 py-2 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors text-center">
            <div className="font-semibold text-gray-900">+3h</div>
            <div className="text-xs text-gray-600 mt-0.5">+€{(subtotalEur * 2.25).toFixed(2)}</div>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <button onClick={() => setShowPromoDropdown(!showPromoDropdown)} className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              {promoStatus === 'valid' ? promoInput : 'Promo kod'}
            </button>
          </div>

          {showPromoDropdown && (
            promoStatus === 'valid' ? (
              <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">{promoInput}</span>
                </div>
                <button type="button" onClick={() => { onRemovePromo(); setShowPromoDropdown(false); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input autoFocus type="text" value={promoInput} onChange={(e) => onInputChange(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onApplyPromo())} placeholder="Unesite kod" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-600" />
                <button type="button" onClick={onApplyPromo} disabled={!promoInput.trim() || promoStatus === 'loading'} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-40">
                  {promoStatus === 'loading' ? '...' : 'Primijeni'}
                </button>
              </div>
            )
          )}
          {promoError && showPromoDropdown && <p className="text-xs text-red-600 text-center">{promoError}</p>}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">Price Breakdown</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span className="font-medium">€{subtotalEur.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Service Fee</span>
              <span className="font-medium">€{serviceFeeEur.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>€{amountEur.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">{number}</span>
      </div>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────

function Field({ label, note, ...props }: { label: string; note?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full border border-gray-200 rounded-lg px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
      />
      {note && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{note}</p>}
    </div>
  );
}

// ─── Paid checkout form ───────────────────────────────────────────────────────

function PaidCheckoutForm({
  amountEur, locationName, checkIn, checkOut,
  locationId, originalAmountCents, onAmountChange, isFree, address, clientSecret,
}: {
  amountEur: number;
  locationName: string;
  checkIn: string;
  checkOut: string;
  locationId: string;
  originalAmountCents: number;
  onAmountChange: (cents: number, promoCode?: string) => void;
  isFree?: boolean;
  address?: string;
  clientSecret?: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscountCents, setPromoDiscountCents] = useState(0);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoStatus('loading');
    setPromoError(null);
    try {
      const res = await fetch('/api/stripe/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, location_id: locationId, amount_cents: originalAmountCents }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoStatus('valid');
        setPromoDiscountCents(data.discount_cents);
        setPromoDiscountPercent(data.discount_percent);
        onAmountChange(data.final_amount_cents, code);
      } else {
        setPromoStatus('invalid');
        setPromoError(data.error || 'Invalid promo code');
      }
    } catch {
      setPromoStatus('invalid');
      setPromoError('Error. Please try again.');
    }
  };

  const removePromo = () => {
    setPromoStatus('idle');
    setPromoInput('');
    setPromoError(null);
    setPromoDiscountCents(0);
    setPromoDiscountPercent(0);
    onAmountChange(originalAmountCents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    if (isFree) {
      try {
        await fetch('/api/stripe/free-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location_id: locationId,
            email,
            plate,
            phone,
            check_in: checkIn,
            check_out: checkOut,
            promo_code: promoInput || undefined,
          }),
        });
      } catch (err) {
        console.error('Free session creation failed:', err);
      }
      router.push('/success');
      return;
    }

    if (!stripe || !elements) { setSubmitting(false); return; }

    const { error: submitErr } = await elements.submit();
    if (submitErr) { setSubmitError(submitErr.message ?? 'Payment failed.'); setSubmitting(false); return; }

    // Update PaymentIntent metadata with user-entered details before confirming
    if (clientSecret && clientSecret !== 'free') {
      const piId = clientSecret.split('_secret_')[0];
      if (piId?.startsWith('pi_')) {
        try {
          await fetch('/api/stripe/payment-intent', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_intent_id: piId, email, plate, phone }),
          });
        } catch { /* non-blocking */ }
      }
    }

    const piId = clientSecret?.split('_secret_')[0] || '';

    // Store PI ID in sessionStorage so success page can find it even if URL params are lost
    if (piId) sessionStorage.setItem('last_payment_intent', piId);

    const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/success${piId ? `?payment_intent=${piId}` : ''}`,
        payment_method_data: {
          billing_details: {
            email: email || undefined,
            phone: phone || undefined,
          },
        },
      },
    });

    if (confirmErr) {
      setSubmitError(confirmErr.message ?? 'Payment failed.');
      setSubmitting(false);
    } else if (paymentIntent) {
      // Any status (succeeded, processing) — redirect to success with PI ID
      window.location.href = `${window.location.origin}/success?payment_intent=${paymentIntent.id || piId}`;
    } else if (piId) {
      // Fallback: no paymentIntent object but we have the ID from clientSecret
      window.location.href = `${window.location.origin}/success?payment_intent=${piId}`;
    }
  };

  return (
    <div className="min-h-screen bg-white" translate="no">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-sm font-black tracking-tight leading-none text-white">P</span>
              </div>
            </div>
            <span className="text-base font-black tracking-tight text-black">payparq</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Lock className="w-3 h-3" />
            <span className="font-medium">Sigurna naplata</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">

          {/* ── Left: summary ── */}
          <SummaryPanel
            locationName={locationName}
            locationId={locationId}
            address={address || ''}
            checkIn={checkIn}
            checkOut={checkOut}
            originalAmountCents={originalAmountCents}
            amountEur={amountEur}
            promoStatus={promoStatus}
            promoInput={promoInput}
            promoError={promoError}
            promoDiscountCents={promoDiscountCents}
            promoDiscountPercent={promoDiscountPercent}
            onApplyPromo={applyPromo}
            onRemovePromo={removePromo}
            onInputChange={(v) => { setPromoInput(v); setPromoError(null); }}
          />

          {/* ── Right: form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Contact Info Display Widget */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Contact Info</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block leading-none">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block leading-none">Telefon</label>
                  <input
                    type="tel"
                    placeholder="+385 91 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 mb-1.5 block leading-none">Registarska pločica</label>
                  <input
                    type="text"
                    placeholder="ZG-1234-AB"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Način plaćanja</p>
              <ExpressCheckoutElement
                options={{ wallets: { googlePay: 'always', applePay: 'always' } }}
                onConfirm={async () => {
                  if (!stripe || !elements) return;
                  if (clientSecret && clientSecret !== 'free') {
                    const piId = clientSecret.split('_secret_')[0];
                    if (piId?.startsWith('pi_')) {
                      try {
                        await fetch('/api/stripe/payment-intent', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ payment_intent_id: piId, email, plate, phone }),
                        });
                      } catch { /* non-blocking */ }
                    }
                  }
                  const piId = clientSecret && clientSecret !== 'free' ? clientSecret.split('_secret_')[0] : '';
                  const successUrl = piId ? `${window.location.origin}/success?payment_intent=${piId}` : `${window.location.origin}/success`;
                  const { error } = await stripe.confirmPayment({
                    elements,
                    confirmParams: { return_url: successUrl },
                  });
                  if (error) console.error(error);
                }}
              />
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ili</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <PaymentElement
                options={{
                  layout: { type: 'accordion' },
                  paymentMethodOrder: ['card', 'google_pay', 'apple_pay', 'paypal'],
                  wallets: { googlePay: 'auto', applePay: 'auto' },
                  fields: { billingDetails: { email: 'never', phone: 'never' } },
                }}
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-600 font-medium">{submitError}</p>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 pb-4">
              By completing your purchase you agree to our{' '}
              <a href="/terms" className="underline hover:text-gray-600">Terms of Service</a>
            </p>

            {/* CTA */}
            <button
              type="submit"
              disabled={!stripe || submitting}
              className="w-full py-4 rounded-lg font-bold text-base text-white disabled:opacity-60 transition-opacity shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Obrada...' : isFree ? 'Potvrdi - Besplatno' : 'Plaćajte'}
            </button>

            <p className="text-center text-xs text-gray-500 pb-4">
              Potvrđivanjem plaćanja dopuštate tvrtki INDIREKTNO da vas se tereti za ovo plaćanje i buduća plaćanja u skladu s njenim uvjetima.
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>© 2026 PayParq</span>
            <div className="flex items-center gap-1.5 ml-3">
              <Phone className="w-3 h-3" />
              <span>+385915963139</span>
            </div>
          </div>
          <div className="flex items-center gap-4" translate="no">
            <span className="text-gray-500">Powered by <span className="font-black text-gray-900">Stripe</span></span>
            <span>·</span>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Uvjeti</a>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/contact" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// FreeConfirmForm removed — PaidCheckoutForm handles free case via isFree prop

// ─── Inner page ───────────────────────────────────────────────────────────────

function CheckoutInner() {
  const searchParams = useSearchParams();

  const locId = searchParams.get('loc') || '';
  const checkIn = searchParams.get('in') || '';
  const checkOut = searchParams.get('out') || '';
  const initialAmountCents = parseInt(searchParams.get('amount_cents') || '0', 10);
  const locationName = searchParams.get('name') || 'Parking';
  const address = searchParams.get('address') || '';

  const [amountCents, setAmountCents] = useState(initialAmountCents);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const createIntent = useCallback(async (cents: number, promoCode?: string) => {
    setClientSecret(null);
    if (cents < 50) { setClientSecret('free'); return; }
    try {
      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locId, amount_cents: cents,
          check_in: checkIn, check_out: checkOut,
          description: `PayParq — ${locationName}`,
          ...(promoCode ? { promo_code: promoCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.client_secret) { setFetchError('Unable to start payment.'); return; }
      setClientSecret(data.client_secret);
    } catch { setFetchError('Network error.'); }
  }, [locId, checkIn, checkOut, locationName]);

  useEffect(() => {
    if (!locId) { setFetchError('Invalid parameters.'); return; }
    createIntent(initialAmountCents);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAmountChange = useCallback((newCents: number, promoCode?: string) => {
    setAmountCents(newCents);
    createIntent(newCents, promoCode);
  }, [createIntent]);

  const amountEur = amountCents / 100;

  if (!clientSecret && !fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-md px-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">{fetchError}</p>
      </div>
    );
  }

  const elementsOptions = clientSecret === 'free'
    ? { mode: 'payment' as const, amount: 100, currency: 'eur' }
    : { clientSecret: clientSecret! };

  return (
    <Elements
      stripe={stripePromise}
      key={clientSecret!}
      options={{
        ...elementsOptions,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#111827',
            colorBackground: '#ffffff',
            colorText: '#111827',
            colorDanger: '#ef4444',
            colorIconTab: '#6b7280',
            colorIconTabSelected: '#111827',
            borderRadius: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSizeBase: '14px',
            spacingUnit: '4px',
          },
          rules: {
            '.Label': { fontWeight: '600', color: '#4b5563', fontSize: '12px', marginBottom: '6px' },
            '.Input': { borderColor: '#e5e7eb', boxShadow: 'none', padding: '12px 14px' },
            '.Input:focus': { borderColor: '#111827', boxShadow: 'none' },
            '.Tab': { borderColor: '#e5e7eb', borderRadius: '8px', color: '#6b7280' },
            '.Tab--selected': { borderColor: '#111827', boxShadow: 'none', color: '#111827', fontWeight: '600' },
            '.Tab:hover': { color: '#111827', borderColor: '#d1d5db' },
            '.AccordionItem': { borderColor: '#e5e7eb' },
            '.AccordionItem--selected': { borderColor: '#111827', boxShadow: 'none' },
          },
        },
        locale: 'hr',
      }}
    >
      <PaidCheckoutForm
        amountEur={amountEur} locationName={locationName}
        checkIn={checkIn} checkOut={checkOut}
        locationId={locId} originalAmountCents={initialAmountCents}
        onAmountChange={handleAmountChange}
        isFree={clientSecret === 'free'}
        address={address}
        clientSecret={clientSecret}
      />
    </Elements>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
