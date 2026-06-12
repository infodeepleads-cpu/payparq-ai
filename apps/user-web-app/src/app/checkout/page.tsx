'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from 'next/link';
import { Star, CheckCircle, X, Phone, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useLocale } from '@/components/LocaleProvider';
import { resolveScannerTruthPriceEuro } from '@/lib/locationPricing';

const supabaseCheckout = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type CheckoutSlot = { type: 'hour' | 'vrsta'; value: number | string };

const VRSTA_MULTIPLIERS: Record<string, number> = {
  oversized: 1.25,
  premium: 1.5,
  kamper: 2,
  bus: 5,
  valet: 2,
  vip_valet: 3,
  late_checkout: 1.5,
};

const VRSTA_LABELS: Record<string, string> = {
  oversized: 'Oversized',
  premium: 'Premium',
  kamper: 'Kamper',
  bus: 'Bus',
  valet: 'Valet',
  vip_valet: 'VIP Valet',
  late_checkout: 'Late Checkout',
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Hardcoded footer text - NEVER translate Stripe branding
const FOOTER_TEXT = 'Powered by Stripe';

// ─── Translations ─────────────────────────────────────────────────────────────
const CHECKOUT_TRANSLATIONS = {
  'Promijeni': { en: 'Change', hr: 'Promijeni' },
  'Odustani': { en: 'Cancel', hr: 'Odustani' },
  'Promo kod': { en: 'Promo code', hr: 'Promo kod' },
  'Unesite kod': { en: 'Enter code', hr: 'Unesite kod' },
  'Primijeni': { en: 'Apply', hr: 'Primijeni' },
  'Otkaži besplatno do vremena početka': { en: 'Cancel for free until start time', hr: 'Otkaži besplatno do vremena početka' },
  'Jednostavno promijenite rezervaciju': { en: 'Simply change your reservation', hr: 'Jednostavno promijenite rezervaciju' },
  'Raščlamba cijena': { en: 'Price breakdown', hr: 'Raščlamba cijena' },
  'Telefon': { en: 'Phone', hr: 'Telefon' },
  'Registarska pločica': { en: 'License plate', hr: 'Registarska pločica' },
  'Način plaćanja': { en: 'Payment method', hr: 'Način plaćanja' },
  'ili': { en: 'or', hr: 'ili' },
  'Završetkom kupnje pristajete na naše': { en: 'By completing your purchase you agree to our', hr: 'Završetkom kupnje pristajete na naše' },
  'uvjete': { en: 'terms', hr: 'uvjete' },
  'Obrada...': { en: 'Processing...', hr: 'Obrada...' },
  'Potvrdi - Besplatno': { en: 'Confirm - Free', hr: 'Potvrdi - Besplatno' },
  'Plaćajte': { en: 'Pay', hr: 'Plaćajte' },
  'Potvrđivanjem plaćanja dopuštate tvrtki INDIREKTNO da vas se tereti za ovo plaćanje i buduća plaćanja u skladu s njenim uvjetima.': { en: 'By confirming the payment you authorize INDIREKTNO to bill you for this payment and future payments in accordance with its terms.', hr: 'Potvrđivanjem plaćanja dopuštate tvrtki INDIREKTNO da vas se tereti za ovo plaćanje i buduća plaćanja u skladu s njenim uvjetima.' },
  'ID Lokacije': { en: 'Location ID', hr: 'ID Lokacije' },
  'Sesija parkiranja': { en: 'Parking session', hr: 'Sesija parkiranja' },
  'sat': { en: 'hour', hr: 'sat' },
  'sata': { en: 'hours', hr: 'sata' },
  'sati': { en: 'hours', hr: 'sati' },
  'dan': { en: 'day', hr: 'dan' },
  'dana': { en: 'days', hr: 'dana' },
  'danu': { en: 'days', hr: 'danu' },
  'Subtotal': { en: 'Subtotal', hr: 'Međuzbrojno' },
  'Service Fee': { en: 'Service Fee', hr: 'Naknada za uslugu' },
  'Total': { en: 'Total', hr: 'Ukupno' },
  'Promo Discount': { en: 'Promo Discount', hr: 'Popust od promokoda' },
  'Check-in → Check-out': { en: 'Check-in → Check-out', hr: 'Ulazak → Izlazak' },
  'Change Reservation': { en: 'Change Reservation', hr: 'Promijeni rezervaciju' },
  'Start Date': { en: 'Start Date', hr: 'Početni datum' },
  'Start Time': { en: 'Start Time', hr: 'Vrijeme početka' },
  'End Date': { en: 'End Date', hr: 'Završni datum' },
  'End Time': { en: 'End Time', hr: 'Vrijeme završetka' },
  'Price breakdown': { en: 'Price breakdown', hr: 'Raščlamba cijena' },
  'COUPON APPLIED': { en: 'COUPON APPLIED', hr: 'KUPON PRIMIJENJEN' },
  'CHECKOUT FREE': { en: 'CHECKOUT FREE', hr: 'BESPLATNA KUPNJA' },
  'Kod primijenjen': { en: 'Code applied', hr: 'Kod primijenjen' },
  'Popust': { en: 'Discount', hr: 'Popust' },
  'Secure Checkout': { en: 'Secure Checkout', hr: 'Sigurna kupnja' },
  'Contact Info': { en: 'Contact Info', hr: 'Kontaktni podaci' },
  'Email Address': { en: 'Email Address', hr: 'Email adresa' },
  'Service fee helps us provide best-in-market service': { en: 'Service fee helps us provide best-in-market service', hr: 'Naknada za uslugu omogućuje nam pružanje najbolje usluge na tržištu' },
} as const;

const checkoutT = (key: string, locale: 'en' | 'hr'): string => {
  const trans = CHECKOUT_TRANSLATIONS[key as keyof typeof CHECKOUT_TRANSLATIONS];
  return trans ? trans[locale] : key;
};

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
  locationName, locationId, displayId, address, checkIn, checkOut,
  originalAmountCents, amountEur,
  promoStatus, promoInput, promoError, promoDiscountCents, promoDiscountPercent,
  onApplyPromo, onRemovePromo, onInputChange,
  onCheckInChange, onCheckOutChange, onDatePickerToggle, onAddHours, hourlyRateCents,
  checkoutSlots, locale, ticketingOnlyEnabled, freeCancellationEnabled, freeCancellationDays,
}: {
  locationName: string;
  locationId: string;
  displayId?: string;
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
  onCheckInChange?: (newCheckIn: string) => void;
  onCheckOutChange?: (newCheckOut: string) => void;
  onDatePickerToggle?: (open: boolean) => void;
  onAddHours?: (hours: number, addCents: number) => void;
  hourlyRateCents?: number;
  checkoutSlots?: CheckoutSlot[];
  locale: 'en' | 'hr';
  ticketingOnlyEnabled?: boolean;
  freeCancellationEnabled?: boolean;
  freeCancellationDays?: number;
}) {
  const subtotalEur = originalAmountCents / 100;
  const serviceFeeEurCents = promoDiscountPercent === 100 ? 0 : Math.min(199, Math.round(99 + (originalAmountCents * 0.10)));
  const serviceFeeEur = serviceFeeEurCents / 100;
  const discountEur = promoDiscountCents / 100;
  const isFree = amountEur <= 0;

  const durationHours = (() => {
    if (!checkIn?.trim() || !checkOut?.trim()) return 1;
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
      const diff = end.getTime() - start.getTime();
      return Math.max(1, Math.round(diff / (1000 * 60 * 60)));
    } catch {
      return 1;
    }
  })();
  const [showPromoDropdown, setShowPromoDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState(checkOut);
  const [selectedAddOn, setSelectedAddOn] = useState<string | null>(null);

  const hr = hourlyRateCents ?? 0;
  const add1hCents = Math.round(hr);
  const add2hCents = Math.round(2 * hr * 0.90);
  const add3hCents = Math.round(3 * hr * 0.85);

  const defaultSlots: CheckoutSlot[] = [
    { type: 'hour', value: 1 },
    { type: 'hour', value: 2 },
    { type: 'hour', value: 3 },
  ];
  const resolvedSlots = checkoutSlots && checkoutSlots.length === 3 ? checkoutSlots : defaultSlots;

  const getSlotDisplay = (slot: CheckoutSlot): { label: string; sublabel: string; key: string; hours: number; cents: number } => {
    if (slot.type === 'hour') {
      const h = Number(slot.value);
      const cents = h === 1 ? add1hCents : h === 2 ? add2hCents : add3hCents;
      return { label: `+${h}h`, sublabel: `+€${(cents / 100).toFixed(2)}`, key: `h:${h}`, hours: h, cents };
    } else {
      const key = String(slot.value);
      const mult = VRSTA_MULTIPLIERS[key] ?? 1;
      const addCents = Math.round((mult - 1) * originalAmountCents);
      return {
        label: VRSTA_LABELS[key] ?? key,
        sublabel: `+€${(addCents / 100).toFixed(2)}`,
        key: `v:${key}`,
        hours: 0,
        cents: addCents,
      };
    }
  };

  // Generate date options (next 30 days)
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      const label = date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      dates.push({ value: formatted, label });
    }
    return dates;
  };

  // Generate time options (every 30 min)
  const generateTimeOptions = () => {
    const times: Array<{ value: string; label: string }> = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        times.push({ value: timeStr, label: timeStr });
      }
    }
    return times;
  };

  function toDateTimeLocal(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${date}T${hours}:${minutes}`;
  }

  function fromDateTimeLocal(dateStr: string, timeStr: string) {
    if (!dateStr || !timeStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;
  }

  function handleApplyDateChanges() {
    if (onCheckInChange) onCheckInChange(tempCheckIn);
    if (onCheckOutChange) onCheckOutChange(tempCheckOut);
    setShowDatePicker(false);
    onDatePickerToggle?.(false);
  }

  function openDatePicker() {
    setTempCheckIn(checkIn);
    setTempCheckOut(checkOut);
    setShowDatePicker(true);
    onDatePickerToggle?.(true);
  }

  return (
    <div className="bg-white rounded-none md:rounded-lg border-0 md:border md:border-gray-200 md:sticky md:top-8 p-2 md:p-6 space-y-4 md:space-y-6 overflow-hidden">
      <div className="hidden lg:block">
        <p className="text-sm font-semibold text-gray-900 mb-1">{locationName}</p>
        <p className="text-xs text-gray-600 mb-2">{address || locationId}</p>
        {displayId && <p className="text-xs text-gray-700">{checkoutT('ID Lokacije', locale)}: <span className="font-mono font-medium text-gray-900">{displayId}</span></p>}
      </div>

      <div className="lg:hidden">
        <p className="text-xs font-semibold text-gray-600 text-center" translate="no">{checkoutT('Sesija parkiranja', locale)} ({(() => {
          if (durationHours >= 24) {
            const days = Math.round(durationHours / 24);
            return `${days} ${locale === 'en' ? (days === 1 ? checkoutT('dan', locale) : checkoutT('dana', locale)) : (days === 1 ? checkoutT('dan', locale) : checkoutT('dana', locale))}`;
          }
          return `${durationHours} ${locale === 'en' ? (durationHours === 1 ? checkoutT('sat', locale) : checkoutT('sati', locale)) : (() => {
            const h = durationHours;
            const lastDigit = h % 10;
            const lastTwoDigits = h % 100;
            if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return checkoutT('sati', locale);
            if (h === 1) return checkoutT('sat', locale);
            if (lastDigit >= 2 && lastDigit <= 4) return checkoutT('sata', locale);
            return checkoutT('sati', locale);
          })()}`;
        })()})</p>
        <p className="font-bold text-gray-900 text-3xl mt-2 text-center">€{amountEur.toFixed(2)}</p>
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-600">{locationName} {displayId && <span className="text-gray-700">ID: <span className="font-mono font-medium">{displayId}</span></span>}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-2 md:pt-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2.5">{checkoutT('Check-in → Check-out', locale)}</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-sm font-medium text-gray-900 leading-tight truncate">
              {checkIn && checkOut
                ? `${new Date(checkIn).toLocaleString('en-US', { month: 'short', day: 'numeric' })} · ${new Date(checkIn).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} → ${new Date(checkOut).toLocaleString('en-US', { month: 'short', day: 'numeric' })} · ${new Date(checkOut).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                : '—'}
            </span>
            <button onClick={openDatePicker} className="px-3 py-1 text-xs font-bold text-gray-900 hover:text-gray-700 focus:outline-none whitespace-nowrap">
              {checkoutT('Promijeni', locale)}
            </button>
          </div>
        </div>
      </div>

      {showDatePicker && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{background:'rgba(0,0,0,0.18)', zIndex: 2147483647}} onClick={() => { setShowDatePicker(false); onDatePickerToggle?.(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 pb-6 w-96 mx-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-gray-900 mb-4 text-center">{checkoutT('Change Reservation', locale)}</p>
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{checkoutT('Start Date', locale)}</label>
                  <select
                    value={tempCheckIn.split('T')[0]}
                    onChange={(e) => { setTempCheckIn(fromDateTimeLocal(e.target.value, tempCheckIn.split('T')[1]?.slice(0, 5) || '00:00')); e.target.blur(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 touch-manipulation"
                  >
                    {generateDateOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{checkoutT('Start Time', locale)}</label>
                  <select
                    value={tempCheckIn.split('T')[1]?.slice(0, 5) || '00:00'}
                    onChange={(e) => { setTempCheckIn(fromDateTimeLocal(tempCheckIn.split('T')[0], e.target.value)); e.target.blur(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 touch-manipulation"
                  >
                    {generateTimeOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{checkoutT('End Date', locale)}</label>
                  <select
                    value={tempCheckOut.split('T')[0]}
                    onChange={(e) => { setTempCheckOut(fromDateTimeLocal(e.target.value, tempCheckOut.split('T')[1]?.slice(0, 5) || '00:00')); e.target.blur(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 touch-manipulation"
                  >
                    {generateDateOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{checkoutT('End Time', locale)}</label>
                  <select
                    value={tempCheckOut.split('T')[1]?.slice(0, 5) || '00:00'}
                    onChange={(e) => { setTempCheckOut(fromDateTimeLocal(tempCheckOut.split('T')[0], e.target.value)); e.target.blur(); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 touch-manipulation"
                  >
                    {generateTimeOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-6 space-y-2">
              <button
                onClick={handleApplyDateChanges}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                {checkoutT('Promijeni', locale)}
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {checkoutT('Odustani', locale)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="-mt-4 md:-mt-6 border-t border-gray-100 pt-3 md:pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {resolvedSlots.map((slot) => {
            const { label, sublabel, key, hours, cents } = getSlotDisplay(slot);
            const isSelected = selectedAddOn === key;
            const isDisabled = selectedAddOn !== null && !isSelected;
            return (
              <button
                key={key}
                disabled={isDisabled}
                onClick={() => {
                  onAddHours?.(isSelected ? -hours : hours, isSelected ? -cents : cents);
                  setSelectedAddOn(isSelected ? null : key);
                }}
                className={`px-2 py-2 text-xs font-medium border border-gray-300 rounded transition-colors text-center text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white`}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-xs mt-0.5 text-gray-600">{sublabel}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <button onClick={() => setShowPromoDropdown(!showPromoDropdown)} className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              {promoStatus === 'valid' ? promoInput : checkoutT('Promo kod', locale)}
            </button>
          </div>

          {showPromoDropdown && (
            promoStatus === 'valid' ? (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">{promoInput}</span>
                </div>
                <button type="button" onClick={() => { onRemovePromo(); setShowPromoDropdown(false); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input autoFocus type="text" value={promoInput} onChange={(e) => onInputChange(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onApplyPromo())} placeholder={checkoutT('Unesite kod', locale)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-600" />
                <button type="button" onClick={() => onApplyPromo()} disabled={!promoInput.trim() || promoStatus === 'loading'} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-40">
                  {promoStatus === 'loading' ? '...' : checkoutT('Primijeni', locale)}
                </button>
              </div>
            )
          )}
          {promoError && showPromoDropdown && <p className="text-xs text-red-600 text-center">{promoError}</p>}
        </div>

        <div className="flex flex-col gap-1 mb-4">
          {ticketingOnlyEnabled ? (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-700 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </span>
                <span>{locale === 'en' ? 'Take a ticket when you arrive and pay on spot' : 'Uzmite kartu kada stignete i platite na mjestu'}</span>
              </div>
              <p className="text-xs text-gray-600 ml-6">{locale === 'en' ? 'Full parking price will be paid when you exit' : 'Cijela cijena parkinga će biti plaćena pri izlasku'}</p>
            </>
          ) : freeCancellationEnabled && !freeCancellationDays && (
            <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-700 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </span>
              <span>{checkoutT('Otkaži besplatno do vremena početka', locale)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-700 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </span>
            <span>{checkoutT('Jednostavno promijenite rezervaciju', locale)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-700 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </span>
            <span>{checkoutT('Service fee helps us provide best-in-market service', locale)}</span>
          </div>
        </div>

        {promoStatus === 'valid' && promoDiscountPercent > 0 ? (
          <div className="border-t border-gray-100 pt-4">
            {promoDiscountPercent === 100 ? (
              <div className="text-center">
                <div className="text-sm font-bold text-green-600 mb-2">{checkoutT('COUPON APPLIED', locale)}</div>
                <div className="text-2xl font-bold text-green-600">{checkoutT('CHECKOUT FREE', locale)}</div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700">{checkoutT('Kod primijenjen', locale)}</span>
                </div>
                <div className="flex justify-between text-xs text-green-700">
                  <span>{promoInput}</span>
                  <span>-{promoDiscountPercent}%</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-green-700 pt-2 border-t border-green-200">
                  <span>{checkoutT('Popust', locale)}</span>
                  <span>-€{(promoDiscountCents / 100).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-4 hidden lg:block">
            <p className="text-xs font-bold text-gray-900 mb-3">{checkoutT('Raščlamba cijena', locale)}</p>
            <div className="space-y-2 text-xs">
              {!ticketingOnlyEnabled && (
                <div className="flex justify-between text-gray-700">
                  <span>{checkoutT('Subtotal', locale)}</span>
                  <span className="font-medium">€{subtotalEur.toFixed(2)}</span>
                </div>
              )}
              {promoDiscountCents > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>{checkoutT('Promo Discount', locale)} (-{promoDiscountPercent}%)</span>
                  <span>-€{(promoDiscountCents / 100).toFixed(2)}</span>
                </div>
              )}
              {serviceFeeEur > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>{checkoutT('Service Fee', locale)}</span>
                  <span className="font-medium">€{serviceFeeEur.toFixed(2)}</span>
                </div>
              )}
              {amountEur > 0 && (
                <div className="flex justify-between text-gray-900 font-bold pt-2 border-t border-gray-100">
                  <span>{checkoutT('Total', locale)}</span>
                  <span>€{amountEur.toFixed(2)}</span>
                </div>
              )}
              {amountEur <= 0 && (
                <div className="flex justify-between text-green-600 font-bold pt-2 border-t border-gray-100">
                  <span>{checkoutT('Total', locale)}</span>
                  <span>€0.00</span>
                </div>
              )}
            </div>
          </div>
        )}
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
  amountEur, locationName, checkIn: initialCheckIn, checkOut: initialCheckOut,
  locationId, displayId, originalAmountCents, onAmountChange, isFree, address, clientSecret,
  phCents = 0, pdCents = 0, pmCents = 0, checkoutSlots, onPaymentReady, initialRefCode,
  ticketingOnlyEnabled, freeCancellationEnabled, freeCancellationDays,
}: {
  amountEur: number;
  locationName: string;
  checkIn: string;
  checkOut: string;
  locationId: string;
  displayId?: string;
  originalAmountCents: number;
  onAmountChange: (cents: number, promoCode?: string) => void;
  isFree?: boolean;
  address?: string;
  clientSecret?: string | null;
  phCents?: number;
  pdCents?: number;
  pmCents?: number;
  checkoutSlots?: CheckoutSlot[];
  onPaymentReady?: () => void;
  initialRefCode?: string;
  ticketingOnlyEnabled?: boolean;
  freeCancellationEnabled?: boolean;
  freeCancellationDays?: number;
}) {
  const { locale } = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');

  // Prefill from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('payparq_user_data');
    if (saved) {
      try {
        const { email: savedEmail, phone: savedPhone, plate: savedPlate } = JSON.parse(saved);
        if (savedEmail) setEmail(savedEmail);
        if (savedPhone) setPhone(savedPhone);
        if (savedPlate) setPlate(savedPlate);
      } catch {}
    }
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [displayAmountCents, setDisplayAmountCents] = useState(originalAmountCents);
  const [parkingAmountCents, setParkingAmountCents] = useState(originalAmountCents); // Tracks parking price before promo discount
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscountCents, setPromoDiscountCents] = useState(0);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referralCodeV2, setReferralCodeV2] = useState<string | null>(null);

  // For free bookings, no PaymentElement loads — signal ready immediately
  useEffect(() => {
    if (isFree) onPaymentReady?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFree]);

  // Service fee: 0.99€ + 10% of parking price (no fee if 100% discount)
  const serviceFeeEurCents = promoDiscountPercent === 100 ? 0 : Math.min(199, Math.round(99 + (displayAmountCents * 0.10)));
  // For ticketing-only lots, charge only service fee; otherwise charge parking + service fee
  const totalWithFeeEurCents = ticketingOnlyEnabled ? serviceFeeEurCents : (displayAmountCents + serviceFeeEurCents);

  function calcAmountCents(durationHours: number): number {
    const ph = phCents || (originalAmountCents / Math.max(0.5, (new Date(initialCheckOut).getTime() - new Date(initialCheckIn).getTime()) / (1000 * 60 * 60)));
    const hourly = durationHours * ph;
    const daily = pdCents ? Math.ceil(durationHours / 24) * pdCents : Infinity;
    const monthly = (pmCents && durationHours >= 24 * 28) ? pmCents : Infinity;
    return Math.max(100, Math.round(Math.min(hourly, daily, monthly)));
  }

  // Auto-apply referral code from URL ?ref= param
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (initialRefCode) applyPromo(initialRefCode); }, []);

  // Mobile payment options toggle
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update payment intent with email, plate, phone when they change
  useEffect(() => {
    if (!clientSecret || clientSecret === 'free') return;
    const piId = clientSecret.split('_secret_')[0];
    if (!piId?.startsWith('pi_')) return;
    if (!email && !plate && !phone) return; // Skip if nothing to update

    fetch('/api/stripe/payment-intent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_intent_id: piId,
        email: email || undefined,
        plate: plate || undefined,
        phone: phone || undefined,
      }),
    }).catch(() => {});
  }, [email, plate, phone, clientSecret]);

  function updatePIAmount(totalAmountCents: number) {
    if (!clientSecret || clientSecret === 'free') return;
    const piId = clientSecret.split('_secret_')[0];
    if (!piId?.startsWith('pi_')) return;
    const fee = Math.round(99 + (totalAmountCents * 0.10));
    const finalAmount = ticketingOnlyEnabled ? fee : (totalAmountCents + fee);
    fetch('/api/stripe/payment-intent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_intent_id: piId, amount_cents: finalAmount }),
    }).catch(() => {});
  }

  const handleCheckInChange = useCallback((newCheckIn: string) => {
    setCheckIn(newCheckIn);
    const newDurationHours = Math.max(0.5, (new Date(checkOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60));
    const newAmountCents = calcAmountCents(newDurationHours);
    setDisplayAmountCents(newAmountCents);
    setParkingAmountCents(newAmountCents); // Update base parking price
    updatePIAmount(newAmountCents);
    if (ticketingOnlyEnabled) {
      sessionStorage.setItem('payparq_ticketing_only', JSON.stringify({ enabled: true, full_parking_cents: newAmountCents }));
    }
  }, [checkOut, clientSecret, phCents, pdCents, pmCents, ticketingOnlyEnabled]);

  const handleCheckOutChange = useCallback((newCheckOut: string) => {
    setCheckOut(newCheckOut);
    const newDurationHours = Math.max(0.5, (new Date(newCheckOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60));
    const newAmountCents = calcAmountCents(newDurationHours);
    setDisplayAmountCents(newAmountCents);
    setParkingAmountCents(newAmountCents); // Update base parking price
    updatePIAmount(newAmountCents);
    if (ticketingOnlyEnabled) {
      sessionStorage.setItem('payparq_ticketing_only', JSON.stringify({ enabled: true, full_parking_cents: newAmountCents }));
    }
  }, [checkIn, clientSecret, phCents, pdCents, pmCents, ticketingOnlyEnabled]);

  const handleAddHours = useCallback((hours: number, addCents: number) => {
    const newCheckOut = new Date(checkOut);
    newCheckOut.setHours(newCheckOut.getHours() + hours);
    setCheckOut(newCheckOut.toISOString());
    const newAmountCents = parkingAmountCents + addCents; // Use parking price, not discounted amount
    setDisplayAmountCents(newAmountCents);
    setParkingAmountCents(newAmountCents); // Update base parking price
    updatePIAmount(newAmountCents);
    // Update sessionStorage for parking pass
    if (ticketingOnlyEnabled) {
      sessionStorage.setItem('payparq_ticketing_only', JSON.stringify({ enabled: true, full_parking_cents: newAmountCents }));
    }
  }, [checkOut, parkingAmountCents, clientSecret, ticketingOnlyEnabled]);

  const applyPromo = async (codeOverride?: string) => {
    const code = (codeOverride !== undefined ? codeOverride : promoInput).trim().toUpperCase();
    if (!code) return;
    if (codeOverride) setPromoInput(code);
    setPromoStatus('loading');
    setPromoError(null);
    try {
      // Try new auto referral code first (also handles V2 referral codes)
      const res = await fetch('/api/promo/validate-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, location_id: locationId }),
      });
      const data = (await res.json()) as any;
      if (data?.valid) {
        const discountCents = Math.round(originalAmountCents * ((data.discount_percent || 0) / 100));
        const finalAmountCents = originalAmountCents - discountCents;
        setPromoDiscountCents(discountCents);
        setPromoDiscountPercent(data.discount_percent || 0);
        setPromoCodeId(data.promo_code_id || null);
        if (data.is_referral_v2 && data.referrer_id) {
          setReferrerId(data.referrer_id);
          setReferralCodeV2(code);
        }
        setDisplayAmountCents(finalAmountCents);
        updatePIAmount(finalAmountCents);
        setPromoStatus('valid');
        return;
      }

      // Fallback to old 100% free code validation
      const stripeRes = await fetch('/api/stripe/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, location_id: locationId, amount_cents: originalAmountCents }),
      });
      const stripeData = (await stripeRes.json()) as any;
      if (stripeData?.valid) {
        const finalCents = stripeData.final_amount_cents ?? 0;
        setPromoDiscountCents(stripeData.discount_cents || 0);
        setPromoDiscountPercent(stripeData.discount_percent || 0);
        if (stripeData.discount_percent === 100) {
          // 100% free — trigger isFree flow via parent so CTA shows "Potvrdi - Besplatno"
          onAmountChange(0, code);
        } else {
          setDisplayAmountCents(finalCents);
          updatePIAmount(finalCents);
        }
        setPromoStatus('valid');
        return;
      }

      // Both failed
      setPromoStatus('invalid');
      setPromoError((stripeData?.error || data?.error || 'Invalid promo code').substring(0, 100));
    } catch (e) {
      setPromoStatus('invalid');
      setPromoError('Error applying code.');
    }
  };

  const removePromo = () => {
    setPromoStatus('idle');
    setPromoInput('');
    setPromoError(null);
    setPromoDiscountCents(0);
    setPromoDiscountPercent(0);
    setPromoCodeId(null);
    setReferrerId(null);
    setReferralCodeV2(null);
    setDisplayAmountCents(parkingAmountCents); // Reset to current parking price (may have been adjusted by adding hours)
    updatePIAmount(parkingAmountCents);
    onAmountChange(parkingAmountCents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    if (isFree) {
      try {
        const freeRes = await fetch('/api/stripe/free-session', {
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
        const freeData = await freeRes.json().catch(() => null);
        if (freeData?.session_id) {
          sessionStorage.setItem('last_payment_intent', freeData.session_id);
        }
        if (freeData?.cover_photo) {
          sessionStorage.setItem('payparq_cover_photo', freeData.cover_photo);
        }
      } catch (err) {
        console.error('Free session creation failed:', err);
      }
      // Save user data for sidebar prefill
      localStorage.setItem('payparq_user_data', JSON.stringify({ email, phone, plate }));
      if (ticketingOnlyEnabled) {
        sessionStorage.setItem('payparq_ticketing_only', JSON.stringify({ enabled: true, full_parking_cents: parkingAmountCents }));
      } else {
        sessionStorage.removeItem('payparq_ticketing_only');
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
            body: JSON.stringify({
              payment_intent_id: piId,
              email,
              plate,
              phone,
              promoCodeId: promoCodeId || undefined,
              discountAmount: promoDiscountCents || undefined,
              referrer_id: referrerId || undefined,
              referral_code: referralCodeV2 || undefined,
            }),
          });
        } catch { /* non-blocking */ }
      }
    }

    const piId = clientSecret?.split('_secret_')[0] || '';

    // Store PI ID in sessionStorage so success page can find it even if URL params are lost
    if (piId) sessionStorage.setItem('last_payment_intent', piId);
    // Store ticketing-only data so success page can show full parking price on pass
    if (ticketingOnlyEnabled) {
      sessionStorage.setItem('payparq_ticketing_only', JSON.stringify({
        enabled: true,
        full_parking_cents: parkingAmountCents,
      }));
    } else {
      sessionStorage.removeItem('payparq_ticketing_only');
    }

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
      localStorage.setItem('payparq_user_data', JSON.stringify({ email, phone, plate }));
      window.location.href = `${window.location.origin}/success?payment_intent=${paymentIntent.id || piId}`;
    } else if (piId) {
      // Fallback: no paymentIntent object but we have the ID from clientSecret
      localStorage.setItem('payparq_user_data', JSON.stringify({ email, phone, plate }));
      window.location.href = `${window.location.origin}/success?payment_intent=${piId}`;
    }
  };

  return (
    <div className="min-h-screen bg-white" translate="no">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-sm md:text-base font-semibold tracking-tight leading-none text-white">P</span>
              </div>
            </div>
            <span className="text-base font-black tracking-tight text-black">payparq</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Lock className="w-3 h-3" />
            <span className="font-medium">{checkoutT('Secure Checkout', locale)}</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-2 md:px-6 py-0 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-0 md:gap-8 items-start">

          {/* ── Left: summary ── */}
          <SummaryPanel
            locationName={locationName}
            locationId={locationId}
            displayId={displayId}
            address={address || ''}
            checkIn={checkIn}
            checkOut={checkOut}
            originalAmountCents={displayAmountCents}
            amountEur={totalWithFeeEurCents / 100}
            promoStatus={promoStatus}
            promoInput={promoInput}
            promoError={promoError}
            promoDiscountCents={promoDiscountCents}
            promoDiscountPercent={promoDiscountPercent}
            onApplyPromo={applyPromo}
            onRemovePromo={removePromo}
            onInputChange={(v) => { setPromoInput(v); setPromoError(null); }}
            onCheckInChange={handleCheckInChange}
            onCheckOutChange={handleCheckOutChange}
            onDatePickerToggle={setDatePickerOpen}
            onAddHours={handleAddHours}
            hourlyRateCents={phCents || undefined}
            checkoutSlots={checkoutSlots}
            locale={locale}
            ticketingOnlyEnabled={ticketingOnlyEnabled}
            freeCancellationEnabled={freeCancellationEnabled}
            freeCancellationDays={freeCancellationDays}
          />

          {/* ── Right: form ── */}
          <form onSubmit={handleSubmit} className="space-y-0 md:space-y-4 px-0 md:px-0">

            {/* Contact Info Display Widget */}
            <div className="bg-white rounded-none md:rounded-lg border-0 md:border md:border-gray-200 p-2 md:p-6 space-y-2 md:space-y-5">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{checkoutT('Contact Info', locale)}</p>
              <div className="space-y-3">
                <div>
                  <label className="hidden md:block text-xs font-black text-gray-600 mb-1.5 block leading-none">{checkoutT('Email Address', locale)}</label>
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
                  <label className="hidden md:block text-xs font-black text-gray-600 mb-1.5 block leading-none">{checkoutT('Telefon', locale)}</label>
                  <input
                    type="tel"
                    placeholder="+385 91 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-900 mb-1.5 block leading-none uppercase tracking-widest">{checkoutT('Registarska pločica', locale)}</label>
                  <input
                    type="text"
                    placeholder="MA679XX"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-md px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-colors uppercase"
                  />
                </div>
              </div>
            </div>


            {/* Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-600 font-medium">{submitError}</p>
              </div>
            )}

            {/* Payment Method Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-4 overflow-hidden">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{checkoutT('Način plaćanja', locale)}</p>
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
                <span className="text-xs text-gray-400">{checkoutT('ili', locale)}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <PaymentElement
                key={isMobile ? 'mobile' : 'desktop'}
                onReady={() => onPaymentReady?.()}
                options={isMobile ? {
                  layout: { type: 'tabs' },
                  paymentMethodOrder: ['card'],
                  wallets: { googlePay: 'never', applePay: 'never' },
                  fields: { billingDetails: { email: 'never', phone: 'never' } },
                } : {
                  layout: { type: 'accordion' },
                  paymentMethodOrder: ['google_pay', 'apple_pay', 'card', 'paypal'],
                  wallets: { googlePay: 'auto', applePay: 'auto' },
                  fields: { billingDetails: { email: 'never', phone: 'never' } },
                }}
              />
            </div>

            <p className="text-center text-xs text-gray-400 mb-1 mt-1">
              {checkoutT('Završetkom kupnje pristajete na naše', locale)}{' '}
              <a href="/terms" className="underline hover:text-gray-600">{checkoutT('uvjete', locale)}</a>
            </p>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={!stripe || submitting}
              className="w-full py-4 rounded-lg font-bold text-base text-white disabled:opacity-60 transition-opacity shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? checkoutT('Obrada...', locale) : isFree ? checkoutT('Potvrdi - Besplatno', locale) : checkoutT('Plaćajte', locale)}
            </button>


            <p className="hidden md:block text-center text-xs text-gray-500 pb-1 mt-1">
              {checkoutT('Potvrđivanjem plaćanja dopuštate tvrtki INDIREKTNO da vas se tereti za ovo plaćanje i buduća plaćanja u skladu s njenim uvjetima.', locale)}
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-0">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>© 2026 PayParq</span>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span>+385915963139</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5" translate="no">
            <span className="text-gray-500">{FOOTER_TEXT}</span>
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
  const displayId = searchParams.get('display_id') || '';
  const phCents = parseInt(searchParams.get('ph') || '0', 10);
  const pdCents = parseInt(searchParams.get('pd') || '0', 10);
  const pmCents = parseInt(searchParams.get('pm') || '0', 10);
  const source = searchParams.get('source') || 'platform';
  const refCode = searchParams.get('ref') || '';

  const [amountCents, setAmountCents] = useState(initialAmountCents);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [checkoutSlots, setCheckoutSlots] = useState<CheckoutSlot[] | undefined>(undefined);
  const [paymentReady, setPaymentReady] = useState(false);
  const [freeCancellationEnabled, setFreeCancellationEnabled] = useState(false);
  const [freeCancellationDays, setFreeCancellationDays] = useState(0);
  const [ticketingOnlyEnabled, setTicketingOnlyEnabled] = useState(false);

  useEffect(() => {
    if (!locId) return;
    // For QR scans: fetch live prices via API (supabaseAdmin, bypasses RLS) then redirect
    if (source === 'qr') {
      fetch(`/api/listings/${locId}`)
        .then((r) => {
          if (!r.ok) {
            console.error(`API error: ${r.status}`);
            throw new Error(`HTTP ${r.status}`);
          }
          return r.json();
        })
        .then((json) => {
          console.log('API response:', json);
          if (json?.error) {
            console.error('API error:', json.error);
            setFetchError('Location not found.');
            return;
          }
          const data = json?.location;
          if (!data) {
            console.error('No location in response:', json);
            setFetchError('Location not found.');
            return;
          }
          if (data?.verification_metadata?.checkoutSlots) {
            setCheckoutSlots(data.verification_metadata.checkoutSlots);
          }
          // Feature 3: Free Cancellation
          if (data?.verification_metadata?.free_cancellation_enabled) {
            setFreeCancellationEnabled(true);
            setFreeCancellationDays(data.verification_metadata.free_cancellation_days || 0);
          }
          // Feature 4: Ticketing Only
          if (data?.verification_metadata?.ticketing_only_enabled) {
            setTicketingOnlyEnabled(true);
          }
          const liveHourly = resolveScannerTruthPriceEuro(data, 'hourly');
          const liveDaily = resolveScannerTruthPriceEuro(data, 'daily');
          const now = new Date();
          const ci = new Date(now);
          ci.setMinutes(0, 0, 0);
          ci.setHours(ci.getHours() + 1);
          const co = new Date(ci);
          co.setHours(co.getHours() + 3);
          const hourlyTotal = liveHourly * 3;
          const dailyTotal = liveDaily > 0 ? liveDaily : Infinity;
          const amount = Math.round(Math.min(hourlyTotal, dailyTotal) * 100);
          const params = new URLSearchParams({
            loc: locId,
            in: ci.toISOString(),
            out: co.toISOString(),
            amount_cents: amount.toString(),
            name: data.name || locId,
            address: data.address || '',
            ph: Math.round(liveHourly * 100).toString(),
            pd: Math.round(liveDaily * 100).toString(),
            source: 'qr_resolved',
            ...(data.display_id ? { display_id: String(data.display_id) } : {}),
          });
          window.location.replace(`/checkout?${params.toString()}`);
        })
        .catch(() => setFetchError('Unable to load location.'));
      return;
    }

    supabaseCheckout
      .from('locations')
      .select('verification_metadata')
      .eq('id', locId)
      .single()
      .then(({ data }) => {
        if (data?.verification_metadata?.checkoutSlots) {
          setCheckoutSlots(data.verification_metadata.checkoutSlots);
        }
        // Feature 3: Free Cancellation
        if (data?.verification_metadata?.free_cancellation_enabled) {
          setFreeCancellationEnabled(true);
          setFreeCancellationDays(data.verification_metadata.free_cancellation_days || 0);
        }
        // Feature 4: Ticketing Only
        if (data?.verification_metadata?.ticketing_only_enabled) {
          setTicketingOnlyEnabled(true);
        }
      });
  }, [locId]);

  // Store booking details in sessionStorage immediately so success page can display them
  // even if Stripe's redirect drops the URL query params.
  useEffect(() => {
    if (locId) {
      try {
        sessionStorage.setItem('payparq_booking', JSON.stringify({
          locationId: locId,
          locationName,
          address,
          checkIn,
          checkOut,
          amountCents: initialAmountCents,
        }));
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCommissionRate = (src: string): number => {
    if (src === 'member') return 0;
    return 0.25; // 25% for 'platform' and 'airport'
  };

  const createIntent = useCallback(async (cents: number, promoCode?: string, userEmail?: string) => {
    if (cents < 50) { setClientSecret('free'); return; }
    try {
      const commissionCents = Math.round(cents * getCommissionRate(source));
      const serviceFee = Math.min(199, Math.round(99 + (cents * 0.10)));
      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locId, amount_cents: cents,
          check_in: checkIn, check_out: checkOut,
          description: `PayParq — ${locationName}`,
          email: userEmail || undefined,
          address: address || undefined,
          booking_source: source,
          commission: commissionCents,
          service_fee: serviceFee,
          ...(promoCode ? { promo_code: promoCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.client_secret) { setFetchError('Unable to start payment.'); return; }
      setClientSecret(data.client_secret);
    } catch { setFetchError('Network error.'); }
  }, [locId, checkIn, checkOut, locationName, source]);

  useEffect(() => {
    if (!locId) { setFetchError('Invalid parameters.'); return; }
    if (source === 'qr') return;
    const fee = Math.round(99 + (initialAmountCents * 0.10));
    createIntent(initialAmountCents + fee);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAmountChange = useCallback((newCents: number, promoCode?: string) => {
    setAmountCents(newCents);
    const fee = newCents > 0 ? Math.round(99 + (newCents * 0.10)) : 0;
    createIntent(newCents + fee, promoCode);
  }, [createIntent]);

  const amountEur = amountCents / 100;

  const showSpinner = !clientSecret || !paymentReady;

  if (!clientSecret && !fetchError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
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
    <>
      {!paymentReady && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
          </div>
        </div>
      )}
      <div className={`transition-opacity duration-300 ${paymentReady ? 'opacity-100' : 'opacity-0'}`}>
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
        locationId={locId} displayId={displayId} originalAmountCents={initialAmountCents}
        onAmountChange={handleAmountChange}
        isFree={clientSecret === 'free'}
        address={address}
        clientSecret={clientSecret}
        phCents={phCents} pdCents={pdCents} pmCents={pmCents}
        checkoutSlots={checkoutSlots}
        onPaymentReady={() => setPaymentReady(true)}
        initialRefCode={refCode || undefined}
        ticketingOnlyEnabled={ticketingOnlyEnabled}
        freeCancellationEnabled={freeCancellationEnabled}
        freeCancellationDays={freeCancellationDays}
      />
    </Elements>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
