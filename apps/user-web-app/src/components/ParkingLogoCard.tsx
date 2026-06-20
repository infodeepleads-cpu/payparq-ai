'use client';

import { useState } from 'react';
import { Star, MapPin, Clock, AlertCircle, Eye, Lock, Zap, Info, X, Van } from 'lucide-react';
import { openCheckout } from '@/lib/capacitorBrowser';

interface ParkingLogoCardProps {
  listing: any;
  price: number;
  durationLabel: string;
  locale: string;
  checkoutUrl: string;
  onInfo: () => void;
  selectedDays?: number;
  durationHours?: number;
  variantType?: 'ticketing' | 'online' | 'valet';
  airportSurcharge?: number;
  isSoldOut?: boolean;
  keyManagementMode?: 'operator_keeps' | 'customer_keeps';
}

export function ParkingLogoCard({
  listing,
  price,
  durationLabel,
  locale,
  checkoutUrl,
  onInfo,
  selectedDays = 1,
  durationHours = 24,
  variantType = 'online',
  airportSurcharge = 0,
  isSoldOut = false,
  keyManagementMode = 'operator_keeps',
}: ParkingLogoCardProps) {
  const [showFeeModal, setShowFeeModal] = useState(false);
  const isOnlinePayment = variantType === 'online';
  const isTicketing = variantType === 'ticketing';
  const isValet = variantType === 'valet';
  const showHours = durationHours < 24;
  const displayDays = Math.ceil(durationHours / 24);
  const dailyPrice = price / Math.max(displayDays, 1);
  const serviceFee = Math.min(1.99, 0.99 + (dailyPrice * 0.10));
  const total = price + serviceFee + airportSurcharge;

  let paymentMethodLabel = 'Pay online';
  let paymentMethodLabelHr = 'Plaćanje online';
  if (isTicketing) {
    paymentMethodLabel = `Service fee: €${serviceFee.toFixed(2)}, pay balance on arrival`;
    paymentMethodLabelHr = `Naknad za uslugu: €${serviceFee.toFixed(2)}, plati ostatak na dolasku`;
  } else if (isValet) {
    paymentMethodLabel = isOnlinePayment ? 'Valet (Pay online)' : 'Valet (Pay on arrival)';
    paymentMethodLabelHr = isOnlinePayment ? 'Valet (Plaćanje online)' : 'Valet (Plaćanje na dolasku)';
  }

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${!isSoldOut ? 'hover:shadow-lg' : ''} transition-shadow flex flex-col min-h-[420px] md:min-h-[550px] ${isSoldOut ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {/* Header - Dark Blue with Title Left + Logo Right */}
        <div className="px-6 py-5 bg-blue-600 border-b border-blue-700 flex items-center justify-between gap-4">
          <h3 className="font-black text-lg text-white leading-tight flex-1">
            {listing.name}
          </h3>
          {/* Logo on Right */}
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white">
            <img
              src={listing.logo || listing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=100'}
              alt="logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = listing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=100';
              }}
            />
          </div>
        </div>

        {/* Content - flex-1 to push CTA to bottom */}
        <div className="flex-1 flex flex-col">
          {/* Reviews Section */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-2">
            {(listing.reviewCount || 0) > 0 ? (
              <>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" strokeWidth={3} />
                <span className="text-sm font-bold text-gray-900">
                  {listing.rating || 0}/10
                  <span className="text-gray-600 font-normal"> ({listing.reviewCount || 0} {locale === 'hr' ? 'ocjena' : 'review'})</span>
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-gray-900">{locale === 'hr' ? 'Novi objekt' : 'New listing'}</span>
            )}
          </div>

          {/* Shuttle or Walking Distance */}
          <div className="px-6 py-3 border-b border-gray-200 flex items-start gap-3">
            {listing.shuttle_enabled || listing.shuttleValet ? (
              <>
                <Van className="w-4 h-4 flex-shrink-0 text-black mt-0.5" strokeWidth={3} />
                <p className="text-sm font-bold text-gray-900">{locale === 'hr' ? 'Prijevoz Uključen' : 'Shuttle included'}</p>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0 text-black font-bold mt-0.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                  <circle cx="13" cy="3" r="2"/>
                  <path d="M11 6.5L8 12l3 1"/>
                  <path d="M13 6.5l1.5 3-3 2.5 1 5.5"/>
                  <path d="M11 14l-2 6"/>
                  <path d="M16 9l2 2"/>
                </svg>
                <p className="text-sm font-bold text-gray-900">{Math.round(listing.distance * 12)} min {locale === 'hr' ? 'hoda od terminala' : 'walk from terminal'}</p>
              </>
            )}
          </div>

          {/* Premium Categories - Vertical Stack */}
          <div className="px-6 py-3 border-b border-gray-200 space-y-2">
            {/* Nepokriveno */}
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-black flex-shrink-0" strokeWidth={3} />
              <span className="text-sm font-bold text-gray-900">{locale === 'hr' ? 'Nepokriveno' : 'Uncovered'}</span>
            </div>

            {/* Key Management */}
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-black flex-shrink-0" strokeWidth={3} />
              <span className="text-sm font-bold text-gray-900">
                {keyManagementMode === 'operator_keeps'
                  ? (locale === 'hr' ? 'Zadrži ključeve' : 'Keep Keys')
                  : (locale === 'hr' ? 'Daješ ključeve' : 'Give Keys')}
              </span>
            </div>

            {/* Otvoreno 24/7 */}
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-black flex-shrink-0" strokeWidth={3} />
              <span className="text-sm font-bold text-gray-900">24/7</span>
            </div>
          </div>

          {/* More Info Link */}
          <div className="px-6 py-3 border-b border-gray-200">
            <button
              onClick={onInfo}
              className="text-blue-600 hover:text-blue-700 text-sm font-bold"
            >
              {locale === 'hr' ? 'Više informacija' : 'More information'}
            </button>
          </div>

          {/* Price Section - Right Side with Blue */}
          <div className="px-6 py-4 border-b border-gray-200 mt-auto">
            {isSoldOut ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-2xl font-bold text-red-600">{locale === 'hr' ? 'Rasprodano' : 'SOLD OUT'}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-600 font-bold mb-2 uppercase tracking-wider">
                  {showHours
                    ? (locale === 'hr' ? `Cijena za ${Math.round(durationHours)} sata` : `Price for ${Math.round(durationHours)} hour${Math.round(durationHours) !== 1 ? 's' : ''}`)
                    : (locale === 'hr' ? `Cijena za ${displayDays} ${displayDays === 1 ? 'dan' : 'dana'}` : `Price for ${displayDays} day${displayDays !== 1 ? 's' : ''}`)}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">€{price.toFixed(2)}</p>
                    <p className="text-xs text-gray-600 mt-1 font-semibold">
                      {locale === 'hr' ? paymentMethodLabelHr : paymentMethodLabel}
                    </p>
                    {airportSurcharge > 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-semibold">
                        {locale === 'hr' ? `+€${airportSurcharge.toFixed(2)} naknada` : `+€${airportSurcharge.toFixed(2)} airport fee`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFeeModal(true)}
                    className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Info className="w-5 h-5 text-blue-600 font-bold" strokeWidth={3} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CTA Button - Stripe Blue */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => !isSoldOut && openCheckout(checkoutUrl)}
            disabled={isSoldOut}
            className={`w-full inline-block text-center font-bold py-3 px-4 rounded-lg active:scale-95 transition text-sm shadow-sm ${
              isSoldOut
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            {locale === 'hr' ? 'Nastavi na Checkout' : 'Proceed to booking'}
          </button>
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
              {airportSurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{locale === 'hr' ? 'Naknada aerodroma' : 'Airport Fee'}</span>
                  <span className="font-bold text-gray-900">€{airportSurcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">{locale === 'hr' ? 'Ukupno' : 'Total'}</span>
                <span className="text-xl font-bold text-blue-600">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
