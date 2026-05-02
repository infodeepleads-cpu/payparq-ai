'use client';

import Image from 'next/image';
import {
  MapPin,
  Star,
  DollarSign,
  Zap,
  Users,
  Accessibility,
  Lock,
  Waves,
  ParkingCircle,
  Repeat2,
} from 'lucide-react';

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  valet: <Users className="w-4 h-4" />,
  garage: <Lock className="w-4 h-4" />,
  'on-site-staff': <Users className="w-4 h-4" />,
  'wheelchair-accessible': <Accessibility className="w-4 h-4" />,
  'ev-charging': <Zap className="w-4 h-4" />,
  'lot-uncovered': <ParkingCircle className="w-4 h-4" />,
  'alley-access': <Repeat2 className="w-4 h-4" />,
  'self-park': <ParkingCircle className="w-4 h-4" />,
  touchless: <Waves className="w-4 h-4" />,
  'in-out-allowed': <Repeat2 className="w-4 h-4" />,
};

interface Parking {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  pricePerHour: number;
  rating: number;
  reviews: number;
  photo: string;
  distance: number;
  availability: boolean;
  features: string[];
  type: 'self-park' | 'garage' | 'valet' | 'lot';
}

interface ListingCardProps {
  listing: Parking;
  isSelected: boolean;
  onSelect: (listing: Parking) => void;
  onBook: () => void;
  onDetails?: () => void;
}

export function ListingCard({ listing, isSelected, onSelect, onBook, onDetails }: ListingCardProps) {
  return (
    <div
      onClick={() => onSelect(listing)}
      className={`p-3 rounded-lg border transition-all cursor-pointer h-[143px] flex flex-col overflow-hidden bg-white ${
        isSelected ? 'border-blue-500 bg-blue-500/10 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Shortest Walk Badge */}
      <div className="text-[10px] font-semibold text-white bg-black px-2 py-1 rounded w-fit mb-1">Najkraća Šetnja</div>

      {/* Main Content */}
      <div className="flex flex-row gap-3 flex-1">
        {/* Photo LEFT */}
        <div className="relative w-24 h-full rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={listing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'}
          alt={listing.name}
          fill
          className="object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'; }}
          unoptimized={!listing.photo?.includes('unsplash.com') && !listing.photo?.includes('supabase')}
        />
      </div>

      {/* Content RIGHT */}
      <div className="flex-1 flex flex-col relative">
        {/* Price - Top Right */}
        <div className="absolute top-0 right-0">
          <span className="text-base font-bold text-gray-900">€{listing.pricePerHour.toFixed(0)}/sat</span>
        </div>

        {/* Name & Address */}
        <div className="flex-1">
          <h3 className="font-semibold text-xs text-gray-900 mb-0.5 line-clamp-1">{listing.name}</h3>
          <div className="flex items-start gap-1 text-xs text-gray-600 mb-1">
            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {listing.distance.toFixed(1)} km
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-gray-900">{listing.rating}</span>
            </div>
            <span className="text-xs text-gray-500">({listing.reviews})</span>
          </div>
        </div>

        {/* Bottom Right - CTA Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(listing);
              onDetails?.();
            }}
            className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className="px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Rezervirajte sad
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
