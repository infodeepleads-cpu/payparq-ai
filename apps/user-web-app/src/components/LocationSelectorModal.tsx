'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { CITIES } from '@/data/cities';
import { AIRPORTS } from '@/data/airports';
import { VENUES } from '@/data/venues';
import { useRouter } from 'next/navigation';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug: string;
}

type LocationType = 'cities' | 'events' | 'airports';

export function LocationSelectorModal({ isOpen, onClose, currentSlug }: LocationSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<LocationType>('cities');
  const router = useRouter();

  if (!isOpen) return null;

  const allCities = Object.values(CITIES);
  const allAirports = Object.values(AIRPORTS).map(airport => ({
    ...airport,
    id: airport.slug || airport.id,
  }));
  const allVenues = Object.values(VENUES).map(venue => ({
    id: venue.id,
    name: venue.name,
    region: venue.city,
  }));

  const getFilteredLocations = () => {
    let source = activeTab === 'cities' ? allCities : activeTab === 'events' ? allVenues : allAirports;
    return source.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.region || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredLocations = getFilteredLocations();

  const handleSelectLocation = (slug: string) => {
    router.push(`/city/${slug}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-black">Odaberite Lokaciju</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {(['cities', 'events', 'airports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
              className={`px-4 py-2 font-medium transition text-sm ${
                activeTab === tab
                  ? 'text-black border-b-2 border-black -mb-[2px]'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {tab === 'cities' ? 'Gradovi' : tab === 'events' ? 'Događaji' : 'Aerodrom'}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
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
              filteredLocations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (activeTab === 'cities') {
                      handleSelectLocation(item.id);
                    } else if (activeTab === 'airports') {
                      handleSelectLocation(item.id);
                    } else {
                      // For events/venues, just close the modal
                      onClose();
                    }
                  }}
                  className={`p-4 rounded-lg border-2 transition text-left ${
                    item.id === currentSlug
                      ? 'border-black bg-gray-100'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-black">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.region || ''}</div>
                </button>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No {activeTab} found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
