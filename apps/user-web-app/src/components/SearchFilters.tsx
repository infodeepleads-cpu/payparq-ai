'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FEATURES = [
  { id: 'valet', label: 'Valet', count: 128 },
  { id: 'garage', label: 'Garage - Covered', count: 128 },
  { id: 'on-site-staff', label: 'On-Site Staff', count: 126 },
  { id: 'wheelchair-accessible', label: 'Wheelchair Accessible', count: 93 },
  { id: 'ev-charging', label: 'EV Charging', count: 56 },
  { id: 'lot-uncovered', label: 'Lot - Uncovered', count: 15 },
  { id: 'alley-access', label: 'Alley Access', count: 2 },
  { id: 'self-park', label: 'Self Park', count: 20 },
  { id: 'touchless', label: 'Touchless', count: 10 },
  { id: 'in-out-allowed', label: 'In & Out Allowed', count: 6 },
];

interface SearchFiltersProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  parkingType: 'all' | 'self-park' | 'garage';
  onParkingTypeChange: (type: 'all' | 'self-park' | 'garage') => void;
  vehicleType: string;
  onVehicleTypeChange: (type: string) => void;
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
                className="w-4 h-4 accent-[#5F3DFC]"
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
                className="w-4 h-4 accent-[#5F3DFC]"
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
                className="w-4 h-4 accent-[#5F3DFC]"
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
            {FEATURES.map((feature) => (
              <label key={feature.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature.id)}
                  onChange={() => toggleFeature(feature.id)}
                  className="w-4 h-4 accent-[#5F3DFC] rounded"
                />
                <span className="text-xs text-gray-700 flex-1">{feature.label}</span>
                <span className="text-xs text-gray-500">({feature.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
