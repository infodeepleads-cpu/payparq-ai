'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';

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

export function BookingModal({ listing, onClose, onConfirm }: BookingModalProps) {
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
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center justify-between p-4">
          <h2 className="text-lg font-bold text-gray-900">Book Parking</h2>
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
                <span className="text-xs text-gray-500">({listing.reviews} reviews)</span>
              </div>
              <span className="font-semibold text-gray-900">${listing.pricePerHour.toFixed(2)}/hr</span>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5F3DFC] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#5F3DFC] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Duration (hours)</label>
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
                Checkout in <strong>3 hours</strong> from start time
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>${listing.pricePerHour.toFixed(2)}/hr × {duration} hrs</span>
              <span>${(listing.pricePerHour * duration).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Fees (15%)</span>
              <span>${fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Total</span>
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
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#5F3DFC] text-white font-semibold rounded-lg hover:bg-[#4330c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You will be redirected to secure Stripe checkout
          </p>
        </div>
      </div>
    </div>
  );
}
