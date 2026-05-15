'use client';

import { AMENITIES_LIST } from '@/lib/amenities';

interface AmenitiesChipsProps {
  selected: string[];
  onToggle?: (amenityId: string) => void;
  editable?: boolean;
  size?: 'sm' | 'md';
}

export function AmenitiesChips({ selected, onToggle, editable = false, size = 'md' }: AmenitiesChipsProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES_LIST.map((amenity) => {
        const isSelected = selected.includes(amenity.id);
        const Icon = amenity.icon;

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
            <Icon className={iconSize} />
            <span>{amenity.label}</span>
          </button>
        );
      })}
    </div>
  );
}
