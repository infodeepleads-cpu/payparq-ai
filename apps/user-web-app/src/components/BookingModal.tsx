'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { useLocale } from './LocaleProvider';

interface Parking {
  id: string;
  name: string;
  address: string;
  pricePerHour: number;
  rating: number;
  reviews: number;
  photo: string;
}

interface BookingModalProps {
  listing: Parking;
  onClose: () => void;
  onConfirm: () => void;
}

const BOOKING_MODAL_TRANSLATIONS = {
  'Book Parking': { en: 'Book Parking', hr: 'Rezerviraj parking' },
  'reviews': { en: 'reviews', hr: 'recenzije' },
  'Start Date': { en: 'Start Date', hr: 'Početni datum' },
  'Start Time': { en: 'Start Time', hr: 'Vrijeme početka' },
  'Duration (hours)': { en: 'Duration (hours)', hr: 'Trajanje (sati)' },
  'Checkout in': { en: 'Checkout in', hr: 'Odjava za' },
  'from start time': { en: 'from start time', hr: 'od vremena početka' },
  'hrs': { en: 'hrs', hr: 'h' },
  'Fees (15%)': { en: 'Fees (15%)', hr: 'Naknada (15%)' },
  'Total': { en: 'Total', hr: 'Ukupno' },
  'Cancel': { en: 'Cancel', hr: 'Odustani' },
  'Processing...': { en: 'Processing...', hr: 'Obrada...' },
  'Proceed to Checkout': { en: 'Proceed to Checkout', hr: 'Nastavite na plaćanje' },
  'You will be redirected to secure Stripe checkout': { en: 'You will be redirected to secure Stripe checkout', hr: 'Bit ćete preusmjereni na sigurnu Stripe plaćanja' },
} as const;

function bookingModalT(key: keyof typeof BOOKING_MODAL_TRANSLATIONS, locale: string): string {
  const translations = BOOKING_MODAL_TRANSLATIONS[key];
  return locale === 'en' ? translations.en : translations.hr;
}

export function BookingModal({ listing, onClose, onConfirm }: BookingModalProps) {
  const { locale } = useLocale();
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(3); // 3 hours default
  const [fees, setFees] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Set default start time to 3 hours from now
  useEffect(() => {
    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const dateStr = threeHoursLater.toISOString().split('T')[0];
    const timeStr = threeHoursLater.toTimeString().split(':').slice(0, 2).join(':');

    setStartDate(dateStr);
    setStartTime(timeStr);
  }, []);

  // Calculate total
  useEffect(() => {
    const subtotal = listing.pricePerHour * duration;
    const feesAmount = subtotal * 0.15; // 15% fees
    setFees(Math.round(feesAmount * 100) / 100);
    setTotal(Math.round((subtotal + feesAmount) * 100) / 100);
  }, [duration, listing.pricePerHour]);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      // Call backend API to create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          listingName: listing.name,
          startDate,
          startTime,
          duration,
          pricePerHour: listing.pricePerHour,
          subtotal: listing.pricePerHour * duration,
          fees,
          total,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      if (typeof window !== 'undefined') {
        window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to proceed to checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[60]">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center justify-between p-4">
          <h2 className="text-lg font-bold text-gray-900">{bookingModalT('Book Parking', locale)}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Listing Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-1">{listing.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{listing.address}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-gray-900">{listing.rating}</span>
                <span className="text-xs text-gray-500">({listing.reviews} {bookingModalT('reviews', locale)})</span>
              </div>
              <span className="font-semibold text-gray-900">${listing.pricePerHour.toFixed(2)}/hr</span>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{bookingModalT('Start Date', locale)}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5F3DFC] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{bookingModalT('Start Time', locale)}</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5F3DFC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{bookingModalT('Duration (hours)', locale)}</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5F3DFC] focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex gap-2">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                {bookingModalT('Checkout in', locale)} <strong>3 hours</strong> {bookingModalT('from start time', locale)}
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>${listing.pricePerHour.toFixed(2)}/hr × {duration} {bookingModalT('hrs', locale)}</span>
              <span>${(listing.pricePerHour * duration).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{bookingModalT('Fees (15%)', locale)}</span>
              <span>${fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>{bookingModalT('Total', locale)}</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingModalT('Cancel', locale)}
            </button>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#5F3DFC] text-white font-semibold rounded-lg hover:bg-[#4330c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {bookingModalT('Processing...', locale)}
                </>
              ) : (
                bookingModalT('Proceed to Checkout', locale)
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {bookingModalT('You will be redirected to secure Stripe checkout', locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
