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
  Footprints,
  Info,
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
  badgeText?: string;
  checkoutUrl?: string;
}

export function ListingCard({ listing, isSelected, onSelect, onBook, onDetails, badgeText = 'Najkraća Šetnja', checkoutUrl }: ListingCardProps) {
  return (
    <div
      onClick={() => onSelect(listing)}
      className={`p-3 rounded-2xl border transition-all cursor-pointer h-[155px] flex flex-col overflow-hidden bg-white ${
        isSelected ? 'border-blue-500 bg-blue-500/10 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Badge */}
      {badgeText && (
        <div className="font-bold text-white bg-black px-2 w-fit mb-1 flex items-center justify-center" style={{ fontSize: '12px', paddingRight: '24px', paddingTop: '6px', paddingBottom: '6px', marginTop: '-12px', marginLeft: '-12px', borderRadius: '0 0 16px 0' }}>{badgeText}</div>
      )}

      {/* Main Content */}
      <div className="flex flex-row gap-3 flex-1">
        {/* Photo LEFT - Clickable for details */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(listing);
            onDetails?.();
          }}
          className="relative w-24 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          style={{ height: '95px' }}
        >
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
        <div className="absolute top-0 right-0 z-10 flex flex-col items-end">
          <span className="font-bold text-gray-900" style={{ fontSize: '20px' }}>€{listing.pricePerHour.toFixed(2)}</span>
          <span className="text-xs text-gray-500">/ sat</span>
        </div>

        {/* Address & Info */}
        <div className="flex-1">
          {/* Address - Bold on top */}
          <p className="font-semibold text-gray-900 mb-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ maxWidth: '200px', fontSize: '15px' }}>{listing.address}</p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-900">{listing.rating}</span>
            <span className="text-xs text-gray-500">({listing.reviews})</span>
          </div>

          {/* Walking Distance */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Footprints className="w-3 h-3 flex-shrink-0" />
            <span>
              {Math.round(listing.distance * 12)} min ({listing.distance.toFixed(1)} km)
            </span>
          </div>
        </div>

        {/* Bottom Right - CTA Buttons & Spots Widget */}
        <div className="flex gap-2 justify-end items-center" style={{ marginLeft: '-8px' }}>
          {/* Spots Left Widget - Only show when selected */}
          {isSelected && (
            <div className="flex items-center gap-1 bg-yellow-100 rounded-md whitespace-nowrap" style={{ padding: '4px 6px' }}>
              <Info className="w-3.5 h-3.5 text-yellow-700" />
              <span className="text-xs font-semibold text-gray-900">3 spots left</span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(listing);
              onDetails?.();
            }}
            className="text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Detalji
          </button>
          <a
            href={checkoutUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); if (!checkoutUrl) e.preventDefault(); }}
            className="px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Rezervirajte sad
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
