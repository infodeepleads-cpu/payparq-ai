'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { CITIES } from '@/data/cities';
import { useRouter } from 'next/navigation';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug: string;
}

export function LocationSelectorModal({ isOpen, onClose, currentSlug }: LocationSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

  const filteredLocations = Object.values(CITIES).filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (slug: string) => {
    router.push(`/city/${slug}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-black">Select Location</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search parking locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 text-black placeholder-gray-500"
          />
        </div>

        {/* Locations List */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelectLocation(city.id)}
                  className={`p-4 rounded-lg border-2 transition text-left ${
                    city.id === currentSlug
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-black">{city.name}</div>
                  <div className="text-sm text-gray-600">{city.region}</div>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No locations found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
