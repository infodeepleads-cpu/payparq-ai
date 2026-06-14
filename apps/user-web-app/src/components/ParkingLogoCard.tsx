'use client';

import { MapPin, Clock, Zap, Car, Star } from 'lucide-react';

interface ParkingLogoCardProps {
  listing: {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number;
    reviews: number;
    distance: number;
    features: string[];
    photo: string;
    photos?: string[];
    logo_url?: string;
    pricePerHour: number;
    pricePerDay?: number;
    verification_metadata?: Record<string, unknown>;
  };
  price: number;
  durationLabel: string;
  locale: 'en' | 'hr';
  onBook: () => void;
  onInfo: () => void;
}

export function ParkingLogoCard({ listing, price, durationLabel, locale, onBook, onInfo }: ParkingLogoCardProps) {
  const logoSrc = listing.logo_url || listing.photos?.[0] || listing.photo;
  const meta = listing.verification_metadata || {};
  const is247 = meta.available24_7 as boolean | undefined;
  const accessHours = meta.access_hours as string | undefined;
  const hoursLabel = is247 ? (locale === 'en' ? 'Open 24/7' : 'Otvoreno 24/7') : accessHours || '';
  const hasEV = listing.features?.some(f => /ev|elektr|charg/i.test(f));
  const isUncovered = !listing.features?.some(f => /garage|garaž|covered|natkri/i.test(f));
  const keepKeys = !listing.features?.some(f => /valet/i.test(f));
  const walkMin = Math.round(listing.distance * 12);

  const featuredTag = listing.reviews > 15 ? (locale === 'en' ? 'Most reviewed' : 'Najviše recenzija') : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Top row: name + logo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-black leading-tight">{listing.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{listing.address}</p>
        </div>
        {logoSrc && (
          <img
            src={logoSrc}
            alt={listing.name}
            className="w-16 h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0"
          />
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-bold text-black">{listing.rating?.toFixed(1)}</span>
        </div>
        <span className="text-xs text-gray-500">{listing.reviews} {locale === 'en' ? 'reviews' : 'recenzija'}</span>
        {featuredTag && (
          <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full font-medium">{featuredTag}</span>
        )}
      </div>

      {/* Distance */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <MapPin size={13} />
        <span>{walkMin} {locale === 'en' ? 'min walk' : 'min hoda'}</span>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-700">
        {isUncovered && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
            <Car size={12} /> {locale === 'en' ? 'Uncovered' : 'Bez nadstrešnice'}
          </span>
        )}
        {keepKeys && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
            🔑 {locale === 'en' ? 'Keep car keys' : 'Zadržite ključeve'}
          </span>
        )}
        {hoursLabel && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
            <Clock size={12} /> {hoursLabel}
          </span>
        )}
        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
          <Zap size={12} className={hasEV ? 'text-green-600' : 'text-gray-400'} />
          {hasEV ? (locale === 'en' ? 'EV charging' : 'EV punjenje') : (locale === 'en' ? 'No EV charge' : 'Nema EV')}
        </span>
      </div>

      {/* Price + actions */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">{durationLabel}</p>
          <p className="text-lg font-bold text-black">€{price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onInfo}
            className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition text-black"
          >
            {locale === 'en' ? 'More Info' : 'Više info'}
          </button>
          <button
            onClick={onBook}
            className="px-4 py-2 text-xs font-bold bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            {locale === 'en' ? 'Book →' : 'Rezerviraj →'}
          </button>
        </div>
      </div>
    </div>
  );
}
