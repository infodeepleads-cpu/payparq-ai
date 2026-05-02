'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { SiteHeader } from './SiteHeader';
import { ListingCard } from './ListingCard';
import { SearchFilters } from './SearchFilters';
import { BookingModal } from './BookingModal';
import { MapPin, List } from 'lucide-react';

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

export function SearchPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [listings, setListings] = useState<Parking[]>([]);
  const [filteredListings, setFilteredListings] = useState<Parking[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 45.815, lng: 15.982 }); // Zagreb center
  const [selectedListing, setSelectedListing] = useState<Parking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [parkingType, setParkingType] = useState<'all' | 'self-park' | 'garage'>('all');
  const [vehicleType, setVehicleType] = useState('compact');

  // Mock data - replace with Supabase query
  useEffect(() => {
    const mockListings: Parking[] = [
      {
        id: '1',
        name: 'Downtown Garage',
        address: 'Ilica 10, Zagreb',
        lat: 45.8150,
        lng: 15.9819,
        pricePerHour: 8.5,
        rating: 4.8,
        reviews: 324,
        photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        distance: 0.3,
        availability: true,
        features: ['garage', 'on-site-staff', 'wheelchair-accessible', 'ev-charging'],
        type: 'garage',
      },
      {
        id: '2',
        name: 'Main Street Lot',
        address: 'Tkalciceva 5, Zagreb',
        lat: 45.8160,
        lng: 15.9825,
        pricePerHour: 5.0,
        rating: 4.5,
        reviews: 156,
        photo: 'https://images.unsplash.com/photo-1506521295926-19bfd768e4ef?w=400',
        distance: 0.5,
        availability: true,
        features: ['self-park', 'lot-uncovered'],
        type: 'self-park',
      },
      {
        id: '3',
        name: 'Premium Valet Service',
        address: 'Ban Jelacic 8, Zagreb',
        lat: 45.8141,
        lng: 15.9815,
        pricePerHour: 15.0,
        rating: 4.9,
        reviews: 89,
        photo: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
        distance: 0.2,
        availability: true,
        features: ['valet', 'touchless', 'in-out-allowed'],
        type: 'valet',
      },
    ];

    setListings(mockListings);
    setFilteredListings(mockListings);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = listings;

    // Price filter
    filtered = filtered.filter((l) => l.pricePerHour >= priceRange[0] && l.pricePerHour <= priceRange[1]);

    // Parking type filter
    if (parkingType !== 'all') {
      filtered = filtered.filter((l) => l.type === parkingType);
    }

    // Features filter
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter((l) => selectedFeatures.some((f) => l.features.includes(f)));
    }

    setFilteredListings(filtered);
  }, [listings, priceRange, selectedFeatures, parkingType]);

  if (!isLoaded) {
    return <div className="w-full h-screen flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Find Parking</h1>
          <p className="text-gray-600">Browse available parking spaces</p>
        </div>
      </div>

      {/* Desktop: Split layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Map 65% */}
        <div className="w-[65%] bg-gray-100 border-r border-gray-200">
          <GoogleMap
            zoom={16}
            center={mapCenter}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={{
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }],
                },
              ],
            }}
          >
            {filteredListings.map((listing) => (
              <Marker
                key={listing.id}
                position={{ lat: listing.lat, lng: listing.lng }}
                onClick={() => setSelectedListing(listing)}
                icon={{
                  path: 'M0,-48c-26.4,0 -48,21.6 -48,48c0,48 48,120 48,120s48,-72 48,-120c0,-26.4 -21.6,-48 -48,-48z',
                  fillColor: '#5F3DFC',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                  scale: 0.5,
                }}
              />
            ))}
          </GoogleMap>
        </div>

        {/* List + Filters 35% */}
        <div className="w-[35%] flex flex-col overflow-hidden bg-white">
          {/* Filters */}
          <div className="border-b border-gray-200 p-4 overflow-y-auto flex-1">
            <SearchFilters
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              selectedFeatures={selectedFeatures}
              onFeaturesChange={setSelectedFeatures}
              parkingType={parkingType}
              onParkingTypeChange={setParkingType}
              vehicleType={vehicleType}
              onVehicleTypeChange={setVehicleType}
            />
          </div>

          {/* Listings */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSelected={selectedListing?.id === listing.id}
                onSelect={setSelectedListing}
                onBook={() => {
                  setSelectedListing(listing);
                  setShowBookingModal(true);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: List first with map toggle */}
      <div className="md:hidden flex flex-1 flex-col overflow-hidden">
        {/* Top section: Results count + toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">{filteredListings.length} results</span>
          <button
            onClick={() => setShowMobileMap(!showMobileMap)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
          >
            <MapPin className="w-4 h-4" />
            Map
          </button>
        </div>

        {showMobileMap ? (
          /* Mobile Map */
          <div className="flex-1 bg-gray-100 relative">
            <GoogleMap
              zoom={16}
              center={mapCenter}
              mapContainerStyle={{ width: '100%', height: '100%' }}
            >
              {filteredListings.map((listing) => (
                <Marker
                  key={listing.id}
                  position={{ lat: listing.lat, lng: listing.lng }}
                  onClick={() => {
                    setSelectedListing(listing);
                    setShowMobileMap(false);
                  }}
                  icon={{
                    path: 'M0,-48c-26.4,0 -48,21.6 -48,48c0,48 48,120 48,120s48,-72 48,-120c0,-26.4 -21.6,-48 -48,-48z',
                    fillColor: '#5F3DFC',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                    scale: 0.5,
                  }}
                />
              ))}
            </GoogleMap>
          </div>
        ) : (
          /* Mobile List */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto p-4 space-y-3">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSelected={selectedListing?.id === listing.id}
                  onSelect={setSelectedListing}
                  onBook={() => {
                    setSelectedListing(listing);
                    setShowBookingModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filters bottom sheet would go here on mobile - for now, simplified */}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedListing && (
        <BookingModal
          listing={selectedListing}
          onClose={() => setShowBookingModal(false)}
          onConfirm={() => {
            // Handle Stripe checkout redirect
            setShowBookingModal(false);
          }}
        />
      )}
    </div>
  );
}
