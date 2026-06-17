'use client';

import { useState } from 'react';
import { useLocale } from './LocaleProvider';
import Image from 'next/image';
import { getTieredDailyConfig, calculateTieredDailyPrice } from '@/lib/locationPricing';
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
  Info,
  X,
  AlertCircle,
  Eye,
  Clock,
} from 'lucide-react';

interface Parking {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  pricePerHour: number;
  pricePerDay?: number;
  pricePerMonth?: number;
  rating: number;
  reviews: number;
  photo: string;
  distance: number;
  availability: boolean;
  features: string[];
  type: 'self-park' | 'garage' | 'valet' | 'lot';
  verification_metadata?: Record<string, unknown>;
  ticketingOnly?: boolean;
}

interface ListingCardProps {
  listing: Parking;
  isSelected: boolean;
  onSelect: (listing: Parking) => void;
  onBook: () => void;
  onDetails?: () => void;
  badgeText?: string;
  checkoutUrl?: string;
  durationHours?: number;
  showFee?: boolean;
  hideDetailsButton?: boolean;
  spots?: number;
  reservationType?: string;
  selectedDays?: number;
}

export function ListingCard({ listing, isSelected, onSelect, onBook, onDetails, badgeText, checkoutUrl, durationHours = 1, showFee = false, hideDetailsButton = false, spots, reservationType = 'Satna/dnevna', selectedDays = 1 }: ListingCardProps) {
  const { locale } = useLocale();
  const [showFeeModal, setShowFeeModal] = useState(false);

  const getDisplayPrice = (list: Parking, duration: number, type: string): number => {
    if (type === 'Mjesečna') {
      return list.pricePerMonth || list.pricePerHour;
    }
    const hourlyTotal = list.pricePerHour * duration;
    const days = Math.ceil(duration / 24);
    if (duration >= 8 && list.verification_metadata) {
      const tiered = getTieredDailyConfig({ verification_metadata: list.verification_metadata });
      if (tiered) return calculateTieredDailyPrice(tiered, days);
    }
    if (!list.pricePerDay) return hourlyTotal;
    const fullDays = Math.floor(duration / 24);
    const remainingHours = duration % 24;
    const ceilDaysTotal = list.pricePerDay * days;
    const mixedTotal = fullDays > 0
      ? list.pricePerDay * fullDays + list.pricePerHour * remainingHours
      : hourlyTotal;
    return Math.min(hourlyTotal, ceilDaysTotal, mixedTotal);
  };

  const subtotal = getDisplayPrice(listing, durationHours, reservationType);
  const serviceFee = Math.min(1.99, 0.99 + (subtotal * 0.10));
  const total = parseFloat((subtotal + serviceFee).toFixed(2));

  return (
    <>
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          onSelect(listing);
          onDetails?.();
        }}
        className={`p-3 rounded-2xl border transition-all cursor-pointer h-auto flex flex-col overflow-hidden bg-white ${
          isSelected ? 'border-[#5F3DFC] bg-purple-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        {/* Header - Parking Blue */}
        <div className="bg-[#5F3DFC] text-white px-3 py-2 rounded-lg mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold">{listing.address}</h3>
          {badgeText && <span className="text-xs bg-white text-[#5F3DFC] px-2 py-0.5 rounded font-bold">{badgeText}</span>}
        </div>

        {/* Reviews Row */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
          {listing.reviews > 0 ? (
            <span className="text-xs font-bold text-gray-900">{listing.rating} <span className="text-gray-600">({listing.reviews} reviews)</span></span>
          ) : (
            <span className="text-xs font-bold text-gray-900">{locale === 'en' ? 'New' : 'Novo'}</span>
          )}
        </div>

        {/* Photo */}
        <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 mb-2" style={{ height: '120px' }}>
          <Image
            src={listing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'}
            alt={listing.name}
            fill
            className="object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'; }}
            unoptimized={!listing.photo?.includes('unsplash.com') && !listing.photo?.includes('supabase')}
          />
        </div>

        {/* Walking Distance Badge */}
        <div className="flex items-center gap-2 mb-2 bg-gray-50 px-2 py-1.5 rounded-lg">
          <svg className="w-4 h-4 flex-shrink-0 text-black font-bold" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <circle cx="13" cy="3" r="2"/>
            <path d="M11 6.5L8 12l3 1"/>
            <path d="M13 6.5l1.5 3-3 2.5 1 5.5"/>
            <path d="M11 14l-2 6"/>
            <path d="M16 9l2 2"/>
          </svg>
          <span className="text-xs font-bold text-gray-900">10 min hoda od terminala</span>
        </div>

        {/* Premium Categories - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {[
            { icon: Eye, label: 'Nepokriveno' },
            { icon: Lock, label: 'Nemojte zadržavati ključe' },
            { icon: Clock, label: 'Otvoreno 7-24' },
            { icon: Zap, label: 'Otvoreno 24/7' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-50 px-1.5 py-1 rounded text-xs">
              <item.icon className="w-4 h-4 text-black font-bold flex-shrink-0" strokeWidth={3} />
              <span className="font-bold text-gray-900">⭐ {item.label}</span>
            </div>
          ))}
        </div>

        {/* Price Section */}
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between items-center mb-1.5">
            <div>
              <p className="text-xs text-gray-600">Cijena za {selectedDays} {selectedDays === 1 ? 'dan' : 'dana'}</p>
              <p className="text-2xl font-bold text-gray-900">€{subtotal.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {listing.ticketingOnly ? (locale === 'en' ? 'Pay on arrival' : 'Plaćanje na dolasku') : (locale === 'en' ? 'Pay online' : 'Plaćanje online')}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFeeModal(true);
              }}
              className="flex items-center gap-1 text-[#5F3DFC] hover:opacity-70 transition-opacity"
            >
              <Info className="w-5 h-5 text-[#5F3DFC] font-bold" strokeWidth={3} />
            </button>
          </div>

          {/* Checkout Button - Parking Blue */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (checkoutUrl) {
                window.location.href = checkoutUrl;
              }
            }}
            className="w-full px-4 py-3 bg-[#5F3DFC] text-white text-sm font-bold rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors"
          >
            {locale === 'en' ? 'Checkout' : 'Nastavite na plaćanje'}
          </button>
        </div>
      </div>

      {/* Service Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFeeModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Price Breakdown</h2>
              <button onClick={() => setShowFeeModal(false)} className="text-gray-600 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({selectedDays}d)</span>
                <span className="font-semibold text-gray-900">€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-semibold text-gray-900">€{serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#5F3DFC]">€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
