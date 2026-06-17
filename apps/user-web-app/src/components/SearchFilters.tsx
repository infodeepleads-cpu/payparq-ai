'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { AMENITIES_LIST } from '@/lib/amenities';

interface SearchFiltersProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  parkingType: 'all' | 'self-park' | 'garage';
  onParkingTypeChange: (type: 'all' | 'self-park' | 'garage') => void;
  vehicleType: string;
  onVehicleTypeChange: (type: string) => void;
  desktopViewMode?: 'list' | 'logo';
  setDesktopViewMode?: (mode: 'list' | 'logo') => void;
  showTotalPrice?: boolean;
  setShowTotalPrice?: (show: boolean) => void;
  locale?: 'en' | 'hr';
}

export function SearchFilters({
  priceRange,
  onPriceChange,
  selectedFeatures,
  onFeaturesChange,
  parkingType,
  onParkingTypeChange,
  vehicleType,
  onVehicleTypeChange,
  desktopViewMode = 'list',
  setDesktopViewMode,
  showTotalPrice = false,
  setShowTotalPrice,
  locale = 'en',
}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    type: true,
    vehicle: true,
    amenities: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleFeature = (feature: string) => {
    onFeaturesChange(
      selectedFeatures.includes(feature) ? selectedFeatures.filter((f) => f !== feature) : [...selectedFeatures, feature]
    );
  };

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-3 text-sm font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>Price</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.price ? '' : '-rotate-90'}`} />
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={priceRange[0]}
                onChange={(e) => onPriceChange([parseInt(e.target.value), priceRange[1]])}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="Min"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={priceRange[1]}
                onChange={(e) => onPriceChange([priceRange[0], parseInt(e.target.value)])}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="Max"
              />
            </div>
            <div className="text-xs text-gray-500">
              ${priceRange[0]}/h - ${priceRange[1]}/h
            </div>
          </div>
        )}
      </div>

      {/* Parking Type */}
      <div>
        <button
          onClick={() => toggleSection('type')}
          className="w-full flex items-center justify-between mb-3 text-sm font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>Parking Type</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.type ? '' : '-rotate-90'}`} />
        </button>
        {expandedSections.type && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="parkingType"
                value="all"
                checked={parkingType === 'all'}
                onChange={(e) => onParkingTypeChange(e.target.value as any)}
                className="w-4 h-4 accent-black"
              />
              <span className="text-xs text-gray-700">All Types</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="parkingType"
                value="self-park"
                checked={parkingType === 'self-park'}
                onChange={(e) => onParkingTypeChange(e.target.value as any)}
                className="w-4 h-4 accent-black"
              />
              <span className="text-xs text-gray-700">Self Park</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="parkingType"
                value="garage"
                checked={parkingType === 'garage'}
                onChange={(e) => onParkingTypeChange(e.target.value as any)}
                className="w-4 h-4 accent-black"
              />
              <span className="text-xs text-gray-700">Garage</span>
            </label>
          </div>
        )}
      </div>

      {/* Vehicle Type */}
      <div>
        <button
          onClick={() => toggleSection('vehicle')}
          className="w-full flex items-center justify-between mb-3 text-sm font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>Vehicle Type</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.vehicle ? '' : '-rotate-90'}`} />
        </button>
        {expandedSections.vehicle && (
          <select
            value={vehicleType}
            onChange={(e) => onVehicleTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900"
          >
            <option value="compact">Compact</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="truck">Truck</option>
          </select>
        )}
      </div>

      {/* Amenities */}
      <div>
        <button
          onClick={() => toggleSection('amenities')}
          className="w-full flex items-center justify-between mb-3 text-sm font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>Amenities</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.amenities ? '' : '-rotate-90'}`} />
        </button>
        {expandedSections.amenities && (
          <div className="space-y-2">
            {AMENITIES_LIST.map((amenity) => (
              <label key={amenity.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(amenity.id)}
                  onChange={() => toggleFeature(amenity.id)}
                  className="w-4 h-4 accent-black rounded"
                />
                <span className="text-xs text-gray-700 flex-1">{amenity.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls - Divider */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center justify-between gap-4">
          {/* Show total price toggle - LEFT */}
          {setShowTotalPrice && (
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs font-medium text-gray-700">{locale === 'en' ? 'Show total price' : 'Prikaži ukupnu cijenu'}</span>
              <button
                onClick={() => setShowTotalPrice(!showTotalPrice)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                  showTotalPrice ? 'bg-black' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    showTotalPrice ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Prostori Popis Toggle - RIGHT */}
          {setDesktopViewMode && (
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-300 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setDesktopViewMode('list')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${desktopViewMode === 'list' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {locale === 'en' ? 'List' : 'Popis'}
              </button>
              <button
                onClick={() => setDesktopViewMode('logo')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${desktopViewMode === 'logo' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {locale === 'en' ? 'Lots' : 'Prostori'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
