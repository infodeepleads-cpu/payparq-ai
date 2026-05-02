'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader } from './SiteHeader';
import { ListingCard } from './ListingCard';
import { SearchFilters } from './SearchFilters';
import { BookingModal } from './BookingModal';
import { MapPin, Star, Search } from 'lucide-react';

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
  const [reservationType, setReservationType] = useState('Satna/dnevna');
  const [searchLocation, setSearchLocationState] = useState<string>('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [searchLocationPin, setSearchLocationPin] = useState<{ lat: number; lng: number } | null>(null);
  const [startTime, setStartTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState<string>(new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const setSearchLocation = (value: string | undefined) => {
    setSearchLocationState(value || '');
  };

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

  // Initialize Places service and handle location search
  useEffect(() => {
    if (!isLoaded || !showPredictions) return;

    const map = new google.maps.Map(document.createElement('div'));
    placesServiceRef.current = new google.maps.places.PlacesService(map);

    if (searchLocation.length > 2) {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: searchLocation, bounds: new google.maps.LatLngBounds({ lat: 45, lng: 15 }, { lat: 46, lng: 17 }) },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
          } else {
            setPredictions([]);
          }
        }
      );
    }
  }, [searchLocation, showPredictions, isLoaded]);

  const handleSelectPrediction = (placeId: string, mainText: string) => {
    setSearchLocation(mainText || '');
    setShowPredictions(false);

    // Blur the input to prevent dropdown from reopening
    const input = document.querySelector('input[placeholder="Search location..."]') as HTMLInputElement;
    if (input) input.blur();

    // Get place details to get coordinates
    const service = new google.maps.places.PlacesService(new google.maps.Map(document.createElement('div')));
    service.getDetails({ placeId }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMapCenter({
          lat,
          lng,
        });
        setSearchLocationPin({ lat, lng });
      }
    });
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter({
          lat,
          lng,
        });
        setSearchLocationPin({ lat, lng });
        setSearchLocation('Current Location' || '');
      });
    }
  };

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
      {/* Header - Logo + Reservation Type Only */}
      <div className="hidden md:block bg-white border-b border-gray-200 py-5 px-6">
        <div className="flex items-center gap-6">
          {/* Left: Exact Footer Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-xs font-semibold tracking-tight leading-none text-white">
                  P
                </span>
              </div>
            </div>
            <div className="text-lg font-black tracking-tight text-black select-none">
              payparq
            </div>
          </div>

          {/* Reservation Type - Tall Widget */}
          <div className="border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus-within:border-black min-h-[50px] flex flex-col justify-center px-4 py-2 mr-2 ml-40">
            <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">Vrsta rezervacije</label>
            <select
              value={reservationType}
              onChange={(e) => setReservationType(e.target.value)}
              className="bg-white border-none text-sm font-medium text-gray-900 p-0 pr-6 focus:outline-none cursor-pointer w-full leading-none -ml-1"
            >
              <option value="Satna/dnevna">Satna/dnevna</option>
              <option value="Mjesecna">Mjesecna</option>
            </select>
          </div>

          {/* Big Widget - 5x width, merged sections */}
          <div className="border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus-within:border-black min-h-[50px] flex items-center px-4 py-2 w-[800px] overflow-visible">
            {/* Left half - Location search */}
            <div className="flex-1 flex flex-col justify-center relative">
              <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">Kamo ideš?</label>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onFocus={() => setShowPredictions(true)}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer flex-1 leading-none"
                />
              </div>
              {/* Predictions dropdown */}
              {showPredictions && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-300 rounded-md shadow-xl z-50 max-h-80 overflow-y-auto">
                  {/* Current Location */}
                  <button
                    onClick={handleCurrentLocation}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900"
                  >
                    <MapPin className="w-4 h-4 text-gray-600" />
                    Use current location
                  </button>
                  {/* Predictions */}
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPredictions(false);
                        handleSelectPrediction(prediction.place_id, prediction.description || prediction.main_text || '');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2 text-sm border-t border-gray-200"
                    >
                      <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-900 font-medium">{prediction.description || prediction.main_text || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{prediction.secondary_text}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-gray-300 mx-4"></div>

            {/* Start Time */}
            <div className="flex-1 flex flex-col justify-center">
              <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none"
              />
            </div>

            {/* Separator */}
            <div className="h-8 w-px bg-gray-300 mx-4"></div>

            {/* End Time */}
            <div className="flex-1 flex flex-col justify-center">
              <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-[10px] font-semibold tracking-tight leading-none text-white">
                  P
                </span>
              </div>
            </div>
            <div className="text-sm font-black tracking-tight text-black select-none">
              payparq
            </div>
          </div>
          <button
            onClick={() => setShowMobileMap(!showMobileMap)}
            className="text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            {showMobileMap ? '← Back to List' : 'Map'}
          </button>
        </div>
        {!showMobileMap && (
          <div className="space-y-2">
            <div className="border border-gray-300 rounded-lg bg-white px-3 py-2 flex items-center focus-within:border-black gap-0 overflow-visible">
              <div className="flex-1 flex flex-col justify-center">
                <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">Vrsta rezervacije</label>
                <select
                  value={reservationType}
                  onChange={(e) => setReservationType(e.target.value)}
                  className="bg-white border-none text-sm font-medium text-gray-900 p-0 pr-6 focus:outline-none cursor-pointer w-full leading-none -ml-1"
                >
                  <option value="Satna/dnevna">Satna/dnevna</option>
                  <option value="Mjesecna">Mjesecna</option>
                </select>
              </div>

              <div className="h-8 w-px bg-gray-300 mx-2"></div>

              <div className="flex-1 flex flex-col justify-center relative">
                <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">Kamo ideš?</label>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search location..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onFocus={() => setShowPredictions(true)}
                    className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer flex-1 leading-none"
                  />
                </div>
                {/* Predictions dropdown */}
                {showPredictions && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-300 rounded-md shadow-xl z-50 max-h-80 overflow-y-auto">
                    {/* Current Location */}
                    <button
                      onClick={handleCurrentLocation}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900"
                    >
                      <MapPin className="w-4 h-4 text-gray-600" />
                      Use current location
                    </button>
                    {/* Predictions */}
                    {predictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowPredictions(false);
                          handleSelectPrediction(prediction.place_id, prediction.description || prediction.main_text || '');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2 text-sm border-t border-gray-200"
                      >
                        <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-gray-900 font-medium">{prediction.description || prediction.main_text || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{prediction.secondary_text}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-8 w-px bg-gray-300 mx-2"></div>

              <div className="flex-1 flex flex-col justify-center">
                <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none"
                />
              </div>

              <div className="h-8 w-px bg-gray-300 mx-2"></div>

              <div className="flex-1 flex flex-col justify-center">
                <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Split layout - Filters LEFT 35%, Map RIGHT 65% */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Filters + List 35% LEFT */}
        <div className="w-[35%] flex flex-col overflow-hidden bg-white border-r border-gray-200">
          {/* Filters */}
          <div className="border-b border-gray-200 p-4 overflow-y-auto flex-shrink-0 bg-gray-50">
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

        {/* Map 65% RIGHT */}
        <div className="w-[65%] bg-gray-100">
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
            {/* Search location marker */}
            {searchLocationPin && (
              <Marker
                position={searchLocationPin}
                icon={{
                  path: 'M0,-48c-26.4,0 -48,21.6 -48,48c0,48 48,120 48,120s48,-72 48,-120c0,-26.4 -21.6,-48 -48,-48z',
                  fillColor: '#FF6B6B',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                  scale: 0.5,
                }}
              />
            )}
          </GoogleMap>
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
              {/* Search location marker */}
              {searchLocationPin && (
                <Marker
                  position={searchLocationPin}
                  icon={{
                    path: 'M0,-48c-26.4,0 -48,21.6 -48,48c0,48 48,120 48,120s48,-72 48,-120c0,-26.4 -21.6,-48 -48,-48z',
                    fillColor: '#FF6B6B',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                    scale: 0.5,
                  }}
                />
              )}
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
