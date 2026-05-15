'use client';

import { AMENITIES_LIST, getAmenityLabel, getAmenityIcon } from '@/lib/amenities';

interface AmenitiesChipsProps {
  selected: string[];
  onToggle?: (amenityId: string) => void;
  editable?: boolean;
  size?: 'sm' | 'md';
}

export function AmenitiesChips({ selected, onToggle, editable = false, size = 'md' }: AmenitiesChipsProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  // Show selected amenities (even if not in AMENITIES_LIST) + all unselected from list
  const allAmenityIds = new Set([...selected, ...AMENITIES_LIST.map(a => a.id)]);
  const amenities = Array.from(allAmenityIds).map(id => ({
    id,
    label: getAmenityLabel(id),
    icon: getAmenityIcon(id),
  }));

  // Only show selected amenities (when not editable) or all amenities (when editable)
  const displayAmenities = editable ? amenities : amenities.filter(a => selected.includes(a.id));

  return (
    <div className="flex flex-wrap gap-2">
      {displayAmenities.map((amenity) => {
        const isSelected = selected.includes(amenity.id);

        return (
          <button
            key={amenity.id}
            onClick={() => editable && onToggle?.(amenity.id)}
            disabled={!editable}
            className={`${sizeClass} rounded-full font-medium transition-colors flex items-center gap-1.5 flex-shrink-0 ${
              isSelected
                ? 'bg-black text-white'
                : editable
                  ? 'border border-gray-300 text-gray-900 hover:border-gray-400'
                  : 'border border-gray-200 text-gray-600 bg-gray-50'
            } ${editable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {amenity.icon && <amenity.icon className={iconSize} />}
            <span>{amenity.label}</span>
          </button>
        );
      })}
    </div>
  );
}
