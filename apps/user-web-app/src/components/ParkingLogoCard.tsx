'use client';

import { Star } from 'lucide-react';

interface ParkingLogoCardProps {
  listing: any;
  price: number;
  durationLabel: string;
  locale: string;
  onBook: () => void;
  onInfo: () => void;
}

export function ParkingLogoCard({
  listing,
  price,
  durationLabel,
  locale,
  onBook,
  onInfo,
}: ParkingLogoCardProps) {
  const isOnlinePayment = listing.verification_metadata?.personal_branding_enabled;
  const brandName = listing.verification_metadata?.personal_brand_name || listing.name;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col min-h-[550px]">
      {/* Header with Name - Blue Background */}
      <div className="px-6 py-4 bg-blue-600 border-b border-blue-700">
        <h3 className="font-bold text-lg text-white">
          {listing.name}
          {isOnlinePayment && <span className="text-xs text-blue-100"> (Online payment)</span>}
        </h3>
      </div>

      {/* Content - flex-1 to push CTA to bottom */}
      <div className="flex-1 flex flex-col">
        {/* Rating Section */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(listing.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <div>
              <span className="font-semibold text-black text-sm">{listing.rating?.toFixed(1) || '0'}</span>
              <span className="text-xs text-gray-500 ml-2">({listing.reviewCount || 0} {locale === 'hr' ? 'recenzija' : 'reviews'})</span>
            </div>
          </div>
        </div>

        {/* Description - if available */}
        {listing.description && (
          <div className="px-6 py-3 border-b border-gray-200">
            <p className="text-sm text-gray-700 font-medium">{listing.description}</p>
          </div>
        )}

        {/* Distance/Walking time */}
        {listing.distance && (
          <div className="px-6 py-3 border-b border-gray-200">
            <p className="text-sm text-gray-700">
              {locale === 'hr' ? `${Math.round(listing.distance * 12)} min hoda od terminala` : `${Math.round(listing.distance * 12)} minute walk from terminal`}
            </p>
          </div>
        )}

        {/* Features - only show if data exists */}
        {(listing.covered !== undefined || listing.selfPark !== undefined) && (
          <div className="px-6 py-3 border-b border-gray-200 space-y-1">
            {listing.covered && <p className="text-sm text-gray-700">✓ {locale === 'hr' ? 'Natkrivena garaža' : 'Covered Garage'}</p>}
            {!listing.covered && <p className="text-sm text-gray-700">• {locale === 'hr' ? 'Nepokriveno' : 'Uncovered'}</p>}
            {listing.selfPark && <p className="text-sm text-gray-700">✓ {locale === 'hr' ? 'Samo parkiranje' : 'Self Park'}</p>}
          </div>
        )}

        {/* Price Section */}
        <div className="px-6 py-4 border-b border-gray-200 mt-auto">
          <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">{durationLabel}</p>
          <p className="text-3xl font-bold text-black">€{price.toFixed(2)}</p>
        </div>
      </div>

      {/* CTA Button - Always visible at bottom */}
      <div className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={onBook}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 active:scale-95 transition text-sm shadow-sm hover:shadow-md"
        >
          {locale === 'hr' ? 'Nastavi na Checkout' : 'Proceed to booking'}
        </button>
      </div>
    </div>
  );
}
