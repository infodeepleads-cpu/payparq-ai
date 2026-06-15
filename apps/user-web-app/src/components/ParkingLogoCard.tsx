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
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with Name and Badge */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-bold text-lg text-black mb-1">
          {listing.name}
          {isOnlinePayment && <span className="text-xs text-gray-500"> (Online payment)</span>}
        </h3>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{brandName}</p>
      </div>

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

      {/* Description/Features */}
      <div className="px-6 py-3 border-b border-gray-200">
        <p className="text-sm text-gray-700 font-medium mb-2">
          {locale === 'hr' ? 'Servis valet - Vozite direktno na odlazne terminale' : 'Valet service - Drive directly to the departures lounge'}
        </p>
      </div>

      {/* Parking Type */}
      <div className="px-6 py-3 border-b border-gray-200">
        <p className="text-sm text-gray-700 font-medium">{listing.covered ? 'Covered' : 'Uncovered'}</p>
      </div>

      {/* Key Policies */}
      <div className="px-6 py-3 border-b border-gray-200 space-y-1">
        <p className="text-sm text-gray-700">
          {locale === 'hr' ? '❌ Nemojte zadržavati ključeve' : '❌ Do Not Keep Keys'}
        </p>
        <p className="text-sm text-gray-700">
          {locale === 'hr' ? '✓ Prosljeđivanje automobila' : '✓ Hand in car keys'}
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
          {locale === 'hr' ? 'Više informacija' : 'More Information'}
        </button>
      </div>

      {/* EV Charge Info */}
      <div className="px-6 py-3 border-b border-gray-200">
        <p className="text-sm text-gray-600">{locale === 'hr' ? 'Nema EV punjenja' : 'No EV charge'}</p>
      </div>

      {/* Price Section */}
      <div className="px-6 py-4 border-b border-gray-200">
        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">{durationLabel}</p>
        <p className="text-3xl font-bold text-black">€{price.toFixed(2)}</p>
      </div>

      {/* CTA Button */}
      <div className="px-6 py-4">
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
