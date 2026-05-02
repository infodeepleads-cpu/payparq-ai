'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader } from './SiteHeader';
import { ListingCard } from './ListingCard';
import { SearchFilters } from './SearchFilters';
import { BookingModal } from './BookingModal';
import { DateTimePickerDropdown } from './DateTimePickerDropdown';
import { MonthlyDatePickerDropdown } from './MonthlyDatePickerDropdown';
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
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0);
    const y = now.getFullYear(), mo = String(now.getMonth() + 1).padStart(2,'0'), d = String(now.getDate()).padStart(2,'0');
    const h = String(now.getHours()).padStart(2,'0'), m = String(now.getMinutes()).padStart(2,'0');
    return `${y}-${mo}-${d}T${h}:${m}`;
  });
  const [endTime, setEndTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0);
    now.setHours(now.getHours() + 3);
    const y = now.getFullYear(), mo = String(now.getMonth() + 1).padStart(2,'0'), d = String(now.getDate()).padStart(2,'0');
    const h = String(now.getHours()).padStart(2,'0'), m = String(now.getMinutes()).padStart(2,'0');
    return `${y}-${mo}-${d}T${h}:${m}`;
  });
  const [monthlyStartDate, setMonthlyStartDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear(), mo = String(now.getMonth() + 1).padStart(2,'0'), d = String(now.getDate()).padStart(2,'0');
    return `${y}-${mo}-${d}`;
  });
  const [homeDropdownOpen, setHomeDropdownOpen] = useState(false);
  const homeDropdownRef = useRef<HTMLDivElement>(null);
  const [showTotalPrice, setShowTotalPrice] = useState(false);
  const [allParkingDropdownOpen, setAllParkingDropdownOpen] = useState(false);
  const allParkingDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const filterModalRef = useRef<HTMLDivElement>(null);

  const toggleQuickFilter = (filterId: string) => {
    setQuickFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  };

  const FILTER_OPTIONS = [
    { id: 'valet', label: 'Valet', count: 29 },
    { id: 'garage-covered', label: 'Garage - Covered', count: 26 },
    { id: 'lot-uncovered', label: 'Lot - Uncovered', count: 29 },
    { id: 'immediate-parking', label: 'Immediate Parking', count: 11 },
    { id: 'on-site-staff', label: 'On-Site Staff', count: 23 },
    { id: 'month-to-month', label: 'Month to Month', count: 29 },
    { id: 'wheelchair-accessible', label: 'Wheelchair Accessible', count: 13 },
    { id: 'self-park', label: 'Self Park', count: 4 },
    { id: 'ev-charging', label: 'EV Charging', count: 3 },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
  };
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const setSearchLocation = (value: string | undefined) => {
    setSearchLocationState(value || '');
  };

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [parkingType, setParkingType] = useState<'all' | 'self-park' | 'garage'>('all');
  const [vehicleType, setVehicleType] = useState('compact');

  // Mock listings data
  useEffect(() => {
    setLoading(true);
    const mockListings: Parking[] = [
      {
        id: '1',
        name: 'Shortest Walk',
        address: '2 Spruce St. (150 Nassau St.)',
        lat: 45.815,
        lng: 15.982,
        pricePerHour: 57.0,
        rating: 4.2,
        reviews: 149,
        photo: 'https://images.unsplash.com/photo-1558618666-e2816b86d4ca?w=400',
        distance: 0.2,
        availability: true,
        features: ['valet', 'garage'],
        type: 'valet',
      },
      {
        id: '2',
        name: 'Downtown Premium',
        address: '45 Broadway Ave. (200 Park Ave.)',
        lat: 45.82,
        lng: 15.99,
        pricePerHour: 65.0,
        rating: 4.7,
        reviews: 284,
        photo: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400',
        distance: 0.15,
        availability: true,
        features: ['garage', 'on-site-staff', 'ev-charging'],
        type: 'garage',
      },
      {
        id: '3',
        name: 'Budget Friendly',
        address: '88 Madison St. (300 5th Ave.)',
        lat: 45.81,
        lng: 15.97,
        pricePerHour: 42.0,
        rating: 4.0,
        reviews: 156,
        photo: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400',
        distance: 0.3,
        availability: true,
        features: ['self-park', 'wheelchair-accessible'],
        type: 'self-park',
      },
      {
        id: '4',
        name: 'Valet Express',
        address: '12 Central Park Ave.',
        lat: 45.825,
        lng: 15.985,
        pricePerHour: 72.0,
        rating: 4.6,
        reviews: 203,
        photo: 'https://images.unsplash.com/photo-1552519507-da3dc3b7c5f9?w=400',
        distance: 0.25,
        availability: true,
        features: ['valet', 'touchless', 'ev-charging'],
        type: 'valet',
      },
      {
        id: '5',
        name: 'Secure Parking',
        address: '67 Market St.',
        lat: 45.812,
        lng: 15.975,
        pricePerHour: 55.0,
        rating: 4.4,
        reviews: 178,
        photo: 'https://images.unsplash.com/photo-1597045866519-c90900e4d3e0?w=400',
        distance: 0.35,
        availability: true,
        features: ['garage', 'security', 'on-site-staff'],
        type: 'garage',
      },
      {
        id: '6',
        name: 'Quick Park',
        address: '99 Harbor View',
        lat: 45.818,
        lng: 15.988,
        pricePerHour: 48.0,
        rating: 4.1,
        reviews: 132,
        photo: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
        distance: 0.4,
        availability: true,
        features: ['self-park', 'alley-access'],
        type: 'self-park',
      },
    ];

    setListings(mockListings);
    setFilteredListings(mockListings);
    setLoading(false);
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
        setSearchLocation('Current Location');
        setShowPredictions(false);
      });
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = listings;

    // Quick filters
    if (quickFilters.includes('instant-access')) {
      filtered = filtered.filter((l) => l.availability);
    }
    if (quickFilters.includes('covered-garage')) {
      filtered = filtered.filter((l) => l.type === 'garage');
    }
    if (quickFilters.includes('self-park')) {
      filtered = filtered.filter((l) => l.type === 'self-park');
    }

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
  }, [listings, priceRange, selectedFeatures, parkingType, quickFilters]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (homeDropdownRef.current && !homeDropdownRef.current.contains(e.target as Node)) {
        setHomeDropdownOpen(false);
      }
    };
    if (homeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [homeDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (allParkingDropdownRef.current && !allParkingDropdownRef.current.contains(e.target as Node)) {
        setAllParkingDropdownOpen(false);
      }
    };
    if (allParkingDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [allParkingDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterModalRef.current && !filterModalRef.current.contains(e.target as Node)) {
        setFilterModalOpen(false);
      }
    };
    if (filterModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filterModalOpen]);

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

            {/* DateTime/Date Picker Dropdown */}
            {reservationType === 'Mjesečna' ? (
              <MonthlyDatePickerDropdown
                startDate={monthlyStartDate}
                onStartDateChange={setMonthlyStartDate}
              />
            ) : (
              <DateTimePickerDropdown
                startTime={startTime}
                endTime={endTime}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
              />
            )}
          </div>

          {/* Right: Home Dropdown */}
          <div ref={homeDropdownRef} className="ml-auto flex items-center gap-3 flex-shrink-0 relative">
            <button
              onClick={() => setHomeDropdownOpen(!homeDropdownOpen)}
              className="flex flex-col items-center justify-center gap-1.5 p-2 hover:opacity-70 transition-opacity"
            >
              <div className="w-5 h-px bg-black"></div>
              <div className="w-5 h-px bg-black"></div>
            </button>

            {homeDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[200px]">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 rounded-t-lg rounded-b-lg">
                  Log In / Sign Up
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200 rounded-b-lg">
                  Home
                </button>
              </div>
            )}
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

              {reservationType === 'Mjesečna' ? (
                <MonthlyDatePickerDropdown
                  startDate={monthlyStartDate}
                  onStartDateChange={setMonthlyStartDate}
                />
              ) : (
                <DateTimePickerDropdown
                  startTime={startTime}
                  endTime={endTime}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subheader - Filter widgets */}
      <div className="hidden md:block bg-white border-b border-gray-200 py-3 px-6">
        <div className="flex items-center gap-4">
          {/* Filters Button */}
          <button
            onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 text-sm font-medium text-gray-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

          {/* Quick filter buttons - only show for hourly/daily */}
          {reservationType !== 'Mjesecna' && (
            <button
              onClick={() => toggleQuickFilter('instant-access')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quickFilters.includes('instant-access')
                  ? 'bg-[#5F3DFC] text-white border border-[#5F3DFC]'
                  : 'border border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
            >
              Instant Access
            </button>
          )}
          <button
            onClick={() => toggleQuickFilter('covered-garage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              quickFilters.includes('covered-garage')
                ? 'bg-[#5F3DFC] text-white border border-[#5F3DFC]'
                : 'border border-gray-300 text-gray-900 hover:border-gray-400'
            }`}
          >
            Covered Garage
          </button>
          <button
            onClick={() => toggleQuickFilter('self-park')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              quickFilters.includes('self-park')
                ? 'bg-[#5F3DFC] text-white border border-[#5F3DFC]'
                : 'border border-gray-300 text-gray-900 hover:border-gray-400'
            }`}
          >
            Self Park
          </button>

          {/* All Parking Options Dropdown - only show for hourly/daily */}
          {reservationType !== 'Mjesecna' && (
            <div ref={allParkingDropdownRef} className="relative">
              <button
                onClick={() => setAllParkingDropdownOpen(!allParkingDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 text-sm font-medium text-gray-900"
              >
                All Parking Options
                <svg className={`w-4 h-4 transition-transform ${allParkingDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            {allParkingDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[250px]">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 rounded-t-lg">
                  All Types
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200">
                  Indoor Parking
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200">
                  Outdoor Parking
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200 rounded-b-lg">
                  Valet Parking
                </button>
              </div>
            )}
            </div>
          )}

          {/* Right: Toggle show total price */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Show total price with fees</span>
            <button
              onClick={() => setShowTotalPrice(!showTotalPrice)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showTotalPrice ? 'bg-[#5F3DFC]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showTotalPrice ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div
            ref={filterModalRef}
            className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left column - 5 filters */}
              <div className="space-y-4">
                {FILTER_OPTIONS.slice(0, 5).map((filter) => (
                  <label key={filter.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => toggleFilter(filter.id)}
                      className="w-4 h-4 accent-[#5F3DFC] rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900">{filter.label}</span>
                    <span className="text-xs text-gray-500">({filter.count})</span>
                  </label>
                ))}
              </div>

              {/* Right column - 4 filters + show price toggle */}
              <div className="space-y-4">
                {FILTER_OPTIONS.slice(5).map((filter) => (
                  <label key={filter.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => toggleFilter(filter.id)}
                      className="w-4 h-4 accent-[#5F3DFC] rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900">{filter.label}</span>
                    <span className="text-xs text-gray-500">({filter.count})</span>
                  </label>
                ))}

                {/* Show price toggle */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setShowTotalPrice(!showTotalPrice)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 ${
                      showTotalPrice ? 'bg-[#5F3DFC]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        showTotalPrice ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-900">Show total price</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="px-6 py-2 bg-[#5F3DFC] text-white text-sm font-medium rounded-lg hover:bg-[#4F2DEC]"
              >
                Show {filteredListings.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Split layout - Filters LEFT 35%, Map RIGHT 65% */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Parking Lots Cards 35% LEFT */}
        <div className="w-[35%] flex flex-col overflow-hidden bg-white border-r border-gray-200">
          {/* Listings Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {error ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-red-600 font-medium">Error: {error}</p>
                  <p className="text-sm text-gray-500 mt-1">Check browser console for details</p>
                </div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-gray-600 font-medium">Nema pronađenih parkirnih mjesta</p>
                  <p className="text-sm text-gray-500 mt-1">Pokušajte prilagoditi svoje filtre</p>
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
