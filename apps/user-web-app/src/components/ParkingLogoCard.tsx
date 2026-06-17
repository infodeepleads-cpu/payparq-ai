'use client';

import { useState } from 'react';
import { Star, MapPin, Clock, AlertCircle, Eye, Lock, Zap, Info, X } from 'lucide-react';

interface ParkingLogoCardProps {
  listing: any;
  price: number;
  durationLabel: string;
  locale: string;
  checkoutUrl: string;
  onInfo: () => void;
  selectedDays?: number;
}

export function ParkingLogoCard({
  listing,
  price,
  durationLabel,
  locale,
  checkoutUrl,
  onInfo,
  selectedDays = 1,
}: ParkingLogoCardProps) {
  const [showFeeModal, setShowFeeModal] = useState(false);
  const isOnlinePayment = listing.verification_metadata?.personal_branding_enabled;
  const serviceFee = Math.min(1.99, 0.99 + (price * 0.10));
  const total = price + serviceFee;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[550px]">
        {/* Header - Parking Blue */}
        <div className="px-6 py-4 bg-[#5F3DFC] border-b border-purple-700">
          <h3 className="font-bold text-lg text-white leading-tight">
            {listing.name}
          </h3>
        </div>

        {/* Content - flex-1 to push CTA to bottom */}
        <div className="flex-1 flex flex-col">
          {/* Reviews Section */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" strokeWidth={3} />
            <span className="text-sm font-bold text-gray-900">
              {listing.rating || 4.8}
              <span className="text-gray-600 font-normal"> ({listing.reviewCount || 0} reviews)</span>
            </span>
          </div>

          {/* Walking Distance - 10 min hoda od terminala */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-start gap-3">
            <svg className="w-4 h-4 flex-shrink-0 text-black font-bold mt-0.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
              <circle cx="13" cy="3" r="2"/>
              <path d="M11 6.5L8 12l3 1"/>
              <path d="M13 6.5l1.5 3-3 2.5 1 5.5"/>
              <path d="M11 14l-2 6"/>
              <path d="M16 9l2 2"/>
            </svg>
            <p className="text-sm font-bold text-gray-900">10 min hoda od terminala</p>
          </div>

          {/* Premium Categories - 2x2 Grid */}
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              {/* Nepokriveno */}
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-2 rounded text-xs">
                <Eye className="w-4 h-4 text-black flex-shrink-0 font-bold" strokeWidth={3} />
                <span className="font-bold text-gray-900">⭐ {locale === 'hr' ? 'Nepokriveno' : 'Uncovered'}</span>
              </div>

              {/* Nemojte zadržavati ključe */}
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-2 rounded text-xs">
                <Lock className="w-4 h-4 text-black flex-shrink-0 font-bold" strokeWidth={3} />
                <span className="font-bold text-gray-900">⭐ {locale === 'hr' ? 'Ne drž. ključe' : 'No keys'}</span>
              </div>

              {/* Otvoreno 7-24 */}
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-2 rounded text-xs">
                <Clock className="w-4 h-4 text-black flex-shrink-0 font-bold" strokeWidth={3} />
                <span className="font-bold text-gray-900">⭐ 7-24</span>
              </div>

              {/* Otvoreno 24/7 */}
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-2 rounded text-xs">
                <Zap className="w-4 h-4 text-black flex-shrink-0 font-bold" strokeWidth={3} />
                <span className="font-bold text-gray-900">⭐ 24/7</span>
              </div>
            </div>
          </div>

          {/* More Info Link */}
          <div className="px-6 py-3 border-b border-gray-200">
            <button
              onClick={onInfo}
              className="text-[#5F3DFC] hover:text-purple-700 text-sm font-bold"
            >
              {locale === 'hr' ? 'Više informacija' : 'More information'}
            </button>
          </div>

          {/* Price Section - Right aligned with service fee modal */}
          <div className="px-6 py-4 border-b border-gray-200 mt-auto">
            <p className="text-xs text-gray-600 font-bold mb-1 uppercase tracking-wider">{locale === 'hr' ? `Cijena za ${selectedDays} ${selectedDays === 1 ? 'dan' : 'dana'}` : `Price for ${selectedDays} day${selectedDays !== 1 ? 's' : ''}`}</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-black">€{price.toFixed(2)}</p>
              <button
                onClick={() => setShowFeeModal(true)}
                className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Info className="w-5 h-5 text-[#5F3DFC] font-bold" strokeWidth={3} />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1 font-semibold">
              {listing.ticketingOnly ? (locale === 'hr' ? 'Plaćanje na dolasku' : 'Pay on arrival') : (locale === 'hr' ? 'Plaćanje online' : 'Pay online')}
            </p>
          </div>
        </div>

        {/* CTA Button - Parking Blue */}
        <div className="px-6 py-4 border-t border-gray-200">
          <a
            href={checkoutUrl}
            className="w-full inline-block text-center bg-[#5F3DFC] text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 active:scale-95 transition text-sm shadow-sm hover:shadow-md"
          >
            {locale === 'hr' ? 'Nastavi na Checkout' : 'Proceed to booking'}
          </a>
        </div>
      </div>

      {/* Service Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFeeModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{locale === 'hr' ? 'Razrada cijene' : 'Price Breakdown'}</h2>
              <button onClick={() => setShowFeeModal(false)} className="text-gray-600 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{locale === 'hr' ? `Osnovna cijena (${selectedDays}d)` : `Subtotal (${selectedDays}d)`}</span>
                <span className="font-bold text-gray-900">€{price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{locale === 'hr' ? 'Naknad za uslugu' : 'Service Fee'}</span>
                <span className="font-bold text-gray-900">€{serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">{locale === 'hr' ? 'Ukupno' : 'Total'}</span>
                <span className="text-xl font-bold text-[#5F3DFC]">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
