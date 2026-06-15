'use client';

import { Star, MapPin, Clock, AlertCircle } from 'lucide-react';

interface ParkingLogoCardProps {
  listing: any;
  price: number;
  durationLabel: string;
  locale: string;
  checkoutUrl: string;
  onInfo: () => void;
}

export function ParkingLogoCard({
  listing,
  price,
  durationLabel,
  locale,
  checkoutUrl,
  onInfo,
}: ParkingLogoCardProps) {
  const isOnlinePayment = listing.verification_metadata?.personal_branding_enabled;
  const brandName = listing.verification_metadata?.personal_brand_name || listing.name;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[550px]">
      {/* Header with Name - Blue Background */}
      <div className="px-6 py-5 bg-blue-600 border-b border-blue-700">
        <h3 className="font-black text-2xl text-white leading-tight">
          {listing.name}
          {isOnlinePayment && <span className="text-xs text-blue-100 block"> (Online payment)</span>}
        </h3>
      </div>

      {/* Content - flex-1 to push CTA to bottom */}
      <div className="flex-1 flex flex-col">
        {/* Most Reviewed Badge */}
        {listing.reviewCount && listing.reviewCount > 20 && (
          <div className="px-6 py-3 border-b border-gray-200">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {locale === 'hr' ? 'Najčešće pregledavano' : 'Most reviewed'}
            </span>
          </div>
        )}

        {/* Distance/Walking time with Icon */}
        {listing.distance && (
          <div className="px-6 py-3 border-b border-gray-200 flex items-start gap-3">
            <MapPin size={16} className="flex-shrink-0 text-gray-600 mt-0.5" />
            <p className="text-sm text-gray-700">
              {locale === 'hr' ? `${Math.round(listing.distance * 12)} min hoda od terminala` : `A ${Math.round(listing.distance * 12)} minute walk from the terminal`}
            </p>
          </div>
        )}

        {/* Parking Type */}
        <div className="px-6 py-3 border-b border-gray-200">
          <p className="text-sm text-gray-700 font-medium">
            {listing.covered ? (locale === 'hr' ? 'Natkriveno' : 'Covered') : (locale === 'hr' ? 'Nepokriveno' : 'Uncovered')}
          </p>
        </div>

        {/* Key Policy */}
        <div className="px-6 py-3 border-b border-gray-200">
          <p className="text-sm text-gray-700">
            {listing.handlesKeys ? (locale === 'hr' ? '✓ Prosljeđivanje automobila' : '✓ Hand in car keys') : (locale === 'hr' ? '❌ Nemojte zadržavati ključeve' : '❌ Keep car keys')}
          </p>
        </div>

        {/* Hours */}
        <div className="px-6 py-3 border-b border-gray-200 space-y-1">
          <p className="text-sm font-semibold text-gray-900">{locale === 'hr' ? 'Otvoreno 7-24' : 'Open 7-24'}</p>
          <p className="text-sm text-gray-600">{locale === 'hr' ? 'Otvoreno 24/7' : 'Open 24/7'}</p>
        </div>

        {/* More Info Link */}
        <div className="px-6 py-3 border-b border-gray-200">
          <button
            onClick={onInfo}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {locale === 'hr' ? 'Više informacija' : 'More information'}
          </button>
        </div>

        {/* EV Charge Info */}
        <div className="px-6 py-3 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {locale === 'hr' ? (listing.evCharge ? 'EV punjenje dostupno' : 'Nema EV punjenja') : (listing.evCharge ? 'EV charge available' : 'No EV charge')}
          </p>
        </div>

        {/* Price Section */}
        <div className="px-6 py-4 border-b border-gray-200 mt-auto">
          <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">{durationLabel}</p>
          <p className="text-3xl font-bold text-black">€{price.toFixed(2)}</p>
        </div>
      </div>

      {/* CTA Button - Always visible at bottom */}
      <div className="px-6 py-4 border-t border-gray-200">
        <a
          href={checkoutUrl}
          className="w-full inline-block text-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 active:scale-95 transition text-sm shadow-sm hover:shadow-md"
        >
          {locale === 'hr' ? 'Nastavi na Checkout' : 'Proceed to booking'}
        </a>
      </div>
    </div>
  );
}
