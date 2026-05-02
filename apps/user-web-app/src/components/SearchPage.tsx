'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader } from './SiteHeader';
import { ListingCard } from './ListingCard';
import { SearchFilters } from './SearchFilters';
import { BookingModal } from './BookingModal';
import { MapPin, Star } from 'lucide-react';

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
  seoTitle?: string;
  seoDescription?: string;
}

export function SearchPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const [listings, setListings] = useState<Parking[]>([]);
  const [filteredListings, setFilteredListings] = useState<Parking[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 45.815, lng: 15.982 }); // Zagreb center
  const [selectedListing, setSelectedListing] = useState<Parking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [parkingType, setParkingType] = useState<'all' | 'self-park' | 'garage'>('all');
  const [vehicleType, setVehicleType] = useState('compact');

  // Fetch real data from Supabase - Hub locations only
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const { data: locations, error } = await supabase
          .from('locations')
          .select('id, name, address, latitude, longitude, base_price_hourly, occupancy, capacity, valet_enabled, addons_config, verification_status, verification_metadata, average_rating, review_count, seo_title, seo_description')
          .eq('verification_status', 'verified')
          .limit(50);

        if (error) throw error;

        if (locations) {
          // Get active sessions for availability check
          const { data: sessions } = await supabase
            .from('parking_sessions')
            .select('location_id')
            .gte('checkout_time', new Date().toISOString());

          const occupiedLocationIds = new Set(sessions?.map((s: any) => s.location_id) || []);

          const parkingListings: Parking[] = locations
            .filter((loc: any) => {
              // Include hub-enabled locations
              const metadata = loc.verification_metadata as Record<string, any>;
              return metadata?.hub_enabled === true;
            })
            .map((loc: any) => {
              const features: string[] = [];
              if (loc.valet_enabled) features.push('valet');
              if (loc.addons_config?.garage) features.push('garage');
              if (loc.addons_config?.on_site_staff) features.push('on-site-staff');
              if (loc.addons_config?.wheelchair_accessible) features.push('wheelchair-accessible');
              if (loc.addons_config?.ev_charging) features.push('ev-charging');
              if (loc.addons_config?.lot_uncovered) features.push('lot-uncovered');
              if (loc.addons_config?.alley_access) features.push('alley-access');
              if (loc.addons_config?.self_park) features.push('self-park');
              if (loc.addons_config?.touchless) features.push('touchless');
              if (loc.addons_config?.in_out_allowed) features.push('in-out-allowed');

              const occupied = occupiedLocationIds.has(loc.id);
              const availability = occupied ? ((loc.capacity - loc.occupancy) / loc.capacity) * 100 : 100;

              // Calculate distance (mock - in production, use user's location)
              const userLat = 45.815;
              const userLng = 15.982;
              const R = 6371; // km
              const dLat = (loc.latitude - userLat) * (Math.PI / 180);
              const dLng = (loc.longitude - userLng) * (Math.PI / 180);
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLat * (Math.PI / 180)) *
                  Math.cos(loc.latitude * (Math.PI / 180)) *
                  Math.sin(dLng / 2) *
                  Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;

              return {
                id: loc.id,
                name: loc.name,
                address: loc.address,
                lat: loc.latitude,
                lng: loc.longitude,
                pricePerHour: loc.base_price_hourly || 5.0,
                rating: loc.average_rating || 4.5,
                reviews: loc.review_count || 0,
                photo: `https://images.unsplash.com/photo-${1558618666 + Math.random() * 100}?w=400`,
                distance: parseFloat(distance.toFixed(1)),
                availability: availability > 0,
                features,
                type: loc.valet_enabled ? 'valet' : (loc.addons_config?.garage ? 'garage' : 'self-park'),
                seoTitle: loc.seo_title,
                seoDescription: loc.seo_description,
              };
            });

          setListings(parkingListings);
          setFilteredListings(parkingListings);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        setListings([]);
        setFilteredListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
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

  if (!isLoaded || loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#5F3DFC] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading parking spaces...</p>
        </div>
      </div>
    );
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
            {filteredListings.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-gray-600 font-medium">No parking spaces found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                </div>
              </div>
            ) : (
              filteredListings.map((listing) => (
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
              ))
            )}
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
              {filteredListings.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <p className="text-gray-600 font-medium">No parking spaces found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                </div>
              ) : (
                filteredListings.map((listing) => (
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
                ))
              )}
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
