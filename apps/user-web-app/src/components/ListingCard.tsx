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
}

export function ListingCard({ listing, isSelected, onSelect, onBook }: ListingCardProps) {
  return (
    <div
      onClick={() => onSelect(listing)}
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected ? 'border-[#5F3DFC] bg-[#5F3DFC]/5 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Photo */}
      <div className="relative w-full h-32 rounded-md overflow-hidden mb-3 bg-gray-100">
        <Image
          src={listing.photo}
          alt={listing.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
          {listing.availability ? 'Available' : 'Full'}
        </div>
      </div>

      {/* Name & Address */}
      <h3 className="font-semibold text-sm text-gray-900 mb-1">{listing.name}</h3>
      <div className="flex items-start gap-1 text-xs text-gray-600 mb-2">
        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>
          {listing.address} • {listing.distance.toFixed(1)} km
        </span>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        <div className="flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-gray-900">{listing.rating}</span>
        </div>
        <span className="text-xs text-gray-500">({listing.reviews})</span>
      </div>

      {/* Price & CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <DollarSign className="w-3 h-3 text-gray-600" />
          <span className="text-sm font-bold text-gray-900">{listing.pricePerHour.toFixed(2)}</span>
          <span className="text-xs text-gray-600">/hr</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          className="px-3 py-1 bg-[#5F3DFC] text-white text-xs font-semibold rounded-md hover:bg-[#4330c4] transition-colors"
        >
          Book Now
        </button>
      </div>

      {/* Features tags with icons */}
      <div className="mt-2 flex flex-wrap gap-1">
        {listing.features.slice(0, 2).map((feature) => (
          <span
            key={feature}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1"
          >
            {AMENITY_ICONS[feature]}
            {feature.replace('-', ' ')}
          </span>
        ))}
        {listing.features.length > 2 && (
          <span className="text-xs bg-[#5F3DFC]/10 text-[#5F3DFC] px-2 py-1 rounded font-medium">
            +{listing.features.length - 2} more
          </span>
        )}
      </div>
    </div>
  );
}
