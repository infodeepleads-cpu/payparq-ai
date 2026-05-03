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
import { MapPin, Star, Search, ChevronRight, Info, Footprints, Users, Lock, Accessibility, Zap, ChevronDown, Ticket, CheckCircle, LogOut } from 'lucide-react';

const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

const VEHICLE_DATABASE = [
  { make: 'Honda', model: 'Civic', height: 1.46 },
  { make: 'Toyota', model: 'Camry', height: 1.47 },
  { make: 'Ford', model: 'Focus', height: 1.48 },
  { make: 'BMW', model: '3 Series', height: 1.42 },
  { make: 'Volkswagen', model: 'Golf', height: 1.45 },
  { make: 'Toyota', model: 'RAV4', height: 1.68 },
  { make: 'Honda', model: 'CR-V', height: 1.66 },
  { make: 'Ford', model: 'Escape', height: 1.68 },
  { make: 'Chevrolet', model: 'Equinox', height: 1.68 },
  { make: 'Toyota', model: 'Highlander', height: 1.76 },
  { make: 'Ford', model: 'Expedition', height: 1.90 },
  { make: 'Chevrolet', model: 'Silverado', height: 1.88 },
  { make: 'Ford', model: 'F-150', height: 1.87 },
  { make: 'Ram', model: '1500', height: 1.89 },
  { make: 'Mercedes', model: 'E-Class', height: 1.46 },
  { make: 'Audi', model: 'A6', height: 1.47 },
  { make: 'Nissan', model: 'Altima', height: 1.48 },
];

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
  maxHeight?: number;
  heightRestrictions?: boolean;
}

export function SearchPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
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
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'price' | 'rating' | 'walk' | 'value'>('relevance');
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showAllParkingOptions, setShowAllParkingOptions] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleInput, setVehicleInput] = useState('');
  const [vehicleCheckResult, setVehicleCheckResult] = useState<'fits' | 'prohibited' | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<{ make: string; model: string; height: number } | null>(null);
  const [showOnlineSpecialReminder, setShowOnlineSpecialReminder] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showThingsToKnow, setShowThingsToKnow] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [showAccessHours, setShowAccessHours] = useState(false);
  const [showHowToRedeem, setShowHowToRedeem] = useState(false);
  const [showFacilityReviews, setShowFacilityReviews] = useState(false);
  const [showGettingThere, setShowGettingThere] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);
  const [showGuaranteedParking, setShowGuaranteedParking] = useState(false);

  const parkingOptions = [
    'All Types',
    'Best Value',
    'Highest Rated',
    'Valet Parking',
    'Covered Garage',
    'Open Lot',
    'Street Parking',
    'Parking Deck',
    'Basement Parking',
    'Underground Parking',
    'Ground Level',
    'Multi-Level',
    'Attended Parking',
    'Unattended Parking',
    'Gated Parking',
    'Secure Parking',
    'Climate Controlled',
    'Heated Parking',
    'EV Charging Available',
    'Disability Accessible',
  ];

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

  // Fetch real data from Supabase - Hub locations only
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const { data: locations, error } = await supabase
          .from('locations')
          .select('*')
          .limit(50);

        if (error) throw error;

        if (locations && locations.length > 0) {
          const parkingListings: Parking[] = locations.map((loc: any) => {
            const features: string[] = [];

            // Parse features from addons if available
            if (loc.addons) {
              const addons = typeof loc.addons === 'string' ? JSON.parse(loc.addons) : loc.addons || {};
              if (addons.valet) features.push('valet');
              if (addons.garage) features.push('garage');
              if (addons.staff) features.push('on-site-staff');
              if (addons.wheelchair) features.push('wheelchair-accessible');
              if (addons.ev_charging) features.push('ev-charging');
            }

            // Calculate distance from center
            const userLat = 45.815;
            const userLng = 15.982;
            const lat = loc.latitude || loc.lat || 45.815;
            const lng = loc.longitude || loc.lng || 15.982;
            const R = 6371; // km
            const dLat = (lat - userLat) * (Math.PI / 180);
            const dLng = (lng - userLng) * (Math.PI / 180);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLat * (Math.PI / 180)) *
                Math.cos(lat * (Math.PI / 180)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return {
              id: loc.id,
              name: loc.name || 'Parking',
              address: loc.address || '',
              lat: lat,
              lng: lng,
              pricePerHour: loc.price_per_hour || loc.base_price || 5.0,
              rating: loc.rating || 4.5,
              reviews: loc.reviews || Math.floor(Math.random() * 200),
              photo: loc.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400',
              distance: parseFloat(distance.toFixed(1)),
              availability: true,
              features,
              type: (loc.type || 'self-park') as any,
              maxHeight: loc.max_height ? parseFloat(loc.max_height) : undefined,
              heightRestrictions: loc.height_restrictions === true || loc.height_restrictions === 'yes',
            };
          });

          setListings(parkingListings);
          setFilteredListings(parkingListings);
        } else {
          setListings([]);
          setFilteredListings([]);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        console.error('Error details:', {
          message: (err as any)?.message,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
        });
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

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'distance':
        sorted.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        sorted.sort((a, b) => a.pricePerHour - b.pricePerHour);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'walk':
        sorted.sort((a, b) => a.distance - b.distance);
        break;
      case 'value':
        sorted.sort((a, b) => (b.rating / b.pricePerHour) - (a.rating / a.pricePerHour));
        break;
      case 'relevance':
      default:
        break;
    }

    setFilteredListings(sorted);
  }, [listings, priceRange, selectedFeatures, parkingType, quickFilters, sortBy]);

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

  useEffect(() => {
    setPhotoIndex(0);
    setShowVehicleModal(false);
    setVehicleInput('');
    setSelectedVehicle(null);
    setVehicleCheckResult(null);
  }, [selectedListing?.id]);

  if (loading) {
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
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[250px] max-h-96 overflow-y-auto">
                {parkingOptions.slice(0, showAllParkingOptions ? parkingOptions.length : 3).map((option, index) => (
                  <button
                    key={index}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200 ${
                      index === 0 ? 'rounded-t-lg border-t-0' : ''
                    }`}
                  >
                    {option}
                  </button>
                ))}

                {/* Toggle Slider at Bottom */}
                {parkingOptions.length > 3 && (
                  <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50 rounded-b-lg">
                    <span className="text-xs font-medium text-gray-600">
                      {showAllParkingOptions ? 'Show Less' : `Show All (${parkingOptions.length})`}
                    </span>
                    <button
                      onClick={() => setShowAllParkingOptions(!showAllParkingOptions)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showAllParkingOptions ? 'bg-[#5F3DFC]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showAllParkingOptions ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
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

      {/* Desktop: Split layout - 2 column (normal) or 3 column (details view) */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Parking Lots Cards - 35% (normal) or flex-1 (details) LEFT */}
        <div className={`flex flex-col overflow-hidden bg-gray-50 border-r border-gray-200 ${showDetailsView ? 'flex-1' : 'w-[35%]'}`}>
          {/* Sort Dropdown - Top Right */}
          <div className="flex-shrink-0 px-4 py-3 bg-gray-100 border-b border-gray-200 flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="distance">Sort by Distance</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>

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
              filteredListings.map((listing, index) => {
                const badges = ['Najkraća Šetnja', 'Najbolja Vrijednost', 'Najviše Ocijenjeno'];
                const badgeText = index < badges.length ? badges[index] : undefined;
                return (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSelected={selectedListing?.id === listing.id}
                    onSelect={setSelectedListing}
                    onBook={() => {
                      setSelectedListing(listing);
                      setShowBookingModal(true);
                    }}
                    onDetails={() => setShowDetailsView(true)}
                    badgeText={badgeText}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Details Panel - flex-1 MIDDLE (only in details view) */}
        {showDetailsView && selectedListing && (
          <div className="flex-1 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Photo Gallery - Top 2/3 */}
            <div className="flex-1 bg-gray-100 relative overflow-hidden">
              <img
                src={selectedListing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'}
                alt={selectedListing.name}
                className="w-full h-full object-cover"
              />

              {/* Back Button - Top Left */}
              <button
                onClick={() => setShowDetailsView(false)}
                className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-md transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Left Arrow */}
              <button
                onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))}
                disabled={photoIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white disabled:opacity-50 text-gray-900 rounded-full p-3 shadow-md transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => setPhotoIndex(photoIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-md transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Photo Counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {photoIndex + 1}
              </div>
            </div>

            {/* Vehicle Size Info - Below Photo - Clickable */}
            <button
              onClick={() => {
                setShowVehicleModal(true);
                setVehicleCheckResult(null);
              }}
              className="flex-shrink-0 w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-start gap-3 justify-between cursor-pointer transition-colors border-b border-gray-200"
            >
              <div className="flex items-start gap-3 flex-1">
                <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Vehicle size restrictions may apply</p>
                  <p className="text-xs text-gray-600 mt-1">Add your vehicle details to check if your car fits and view any oversize fees.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            </button>

            {/* Book Now Suggestion Widget */}
            <button className="flex-shrink-0 w-full px-6 py-4 bg-yellow-50 hover:bg-yellow-100 flex items-start gap-3 justify-between cursor-pointer transition-colors border-b border-yellow-200">
              <div className="flex items-start gap-3 flex-1">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">We suggest you book now.</p>
                  <p className="text-xs text-gray-900 mt-1">We only have 2 spots remaining here during the times you selected.</p>
                </div>
              </div>
            </button>

            {/* Location Information Widget */}
            <div className="flex-shrink-0 w-full bg-white border-b border-gray-200 overflow-hidden">
              {/* Black Badge Header */}
              <div className="font-bold text-white bg-black px-2 flex items-center justify-start" style={{ fontSize: '12px', paddingRight: '24px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '0 0 16px 0' }}>
                Lokacija
              </div>

              {/* Location Content - Card Style */}
              <div className="px-6 py-4 space-y-2">
                {/* Address */}
                <p className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>{selectedListing.address}</p>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-gray-900">{selectedListing.rating}</span>
                  <span className="text-xs text-gray-500">({selectedListing.reviews})</span>
                </div>

                {/* Walking Distance */}
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Footprints className="w-3 h-3 flex-shrink-0" />
                  <span>{Math.round(selectedListing.distance * 12)} min ({selectedListing.distance.toFixed(1)} km)</span>
                </div>
              </div>
            </div>

            {/* Reservation Details Widget */}
            <div className="flex-shrink-0 w-full bg-white border-b border-gray-200">
              {/* Header and Content Combined */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button className="inline-block bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 transition-colors">
                    <p className="text-xs font-semibold text-gray-900">Online specijal</p>
                  </button>
                  <button
                    onClick={() => setShowOnlineSpecialReminder(!showOnlineSpecialReminder)}
                    className="text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Detalji
                  </button>
                </div>

                {/* Important Notice - Show below Detalji on click */}
                {showOnlineSpecialReminder && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Važna napomena</p>
                    <p className="text-xs text-yellow-800 leading-relaxed">Molimo vas da poštujete vrijeme vaše rezervacije. Ne ulazite prije početka rezervacije niti je napuštajte nakon njezinog završetka. Ako prekršite ova pravila, naplaćeni iznos će biti izravno od vlasnika parkinga.</p>
                  </div>
                )}

                <p className="text-lg font-bold text-gray-900">Rezervacija parkinga</p>

                {/* Date, Time and Price Row */}
                <button
                  onClick={() => setShowPriceBreakdown(true)}
                  className="w-full text-left hover:opacity-70 transition-opacity pb-4 border-b border-gray-200 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <p className="text-xs text-gray-700 font-semibold">Danas 8:30 - 21:00</p>
                    <p className="text-sm text-gray-900 mt-1">12 sati, 30 minuta</p>
                    <p className="text-xs text-gray-600 mt-1">Nema ulaza i izlaza</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">$44.99</p>
                    <p className="text-xs text-gray-500 mt-1">Međuzbroj</p>
                  </div>
                </button>

                {/* Grey Box - Reservation Extended */}
                <div className="bg-gray-200 rounded-lg p-1.5 mt-4">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-900">Vaša rezervacija je produžena bez dodatnih troškova!</p>
                    <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                </div>

                {/* CTA Button - Between boxes, left-aligned */}
                <button className="px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors" style={{ width: 'fit-content' }}>
                  Book Now
                </button>

                {/* Green Box */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-600 flex-shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-700 font-semibold">Besplatno otkazivanje</p>
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-600 flex-shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-700 font-semibold">Garancija Mjesta</p>
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="pt-2">
                  <p className="text-xs text-gray-600">Sigurna plaćanja omogućuje Stripe</p>
                </div>

                {/* Things You Should Know */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowThingsToKnow(!showThingsToKnow)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Things You Should Know</p>
                  </button>
                  {showThingsToKnow && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <p>Zbog ograničenja veličine, ova lokacija ne može primiti kamionete i putničke kombije.</p>
                      <p>Procijenjena naknada za prekoračenje od 10 USD dnevno za vozila između 65" i 75" visine i preko 180" duljine, ili bilo koja vozila viša od 75". Te se naknade plaćaju izravno u objektu po izlasku ako ih niste uključili u rezervaciju.</p>
                      <p>Za egzotična vozila obratite se izravno servisu radi dostupnosti i cijene.</p>
                      <p>Imajte na umu da se kamioni, kombiji i veliki SUV-ovi smatraju super velikim i podliježu dodatnim naknadama na licu mjesta.</p>
                    </div>
                  )}
                </div>

                {/* Amenities Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowAmenities(!showAmenities)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Amenities</p>
                  </button>
                  {showAmenities && (
                    <div className="space-y-2 mt-3 ml-7 text-sm text-gray-900 leading-relaxed">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span>Sobar</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-gray-600" />
                        <span>Garaža - Natkrivena</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span>Osoblje na licu mjesta</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-gray-600" />
                        <span>EV punjenje</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Accessibility className="w-4 h-4 text-gray-600" />
                        <span>Pristup invalidskim kolicima</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Access Hours Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowAccessHours(!showAccessHours)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Access Hours</p>
                  </button>
                  {showAccessHours && (
                    <div className="space-y-2 mt-3 ml-7 text-sm text-gray-900 leading-relaxed">
                      <div className="flex justify-between items-center">
                        <span>pon – pet</span>
                        <span>6:00 – 23:00 sata</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>sub – ned</span>
                        <span>7:00 – 23:00 sata</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kako Radi Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowHowToRedeem(!showHowToRedeem)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Kako Radi</p>
                  </button>
                  {showHowToRedeem && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="flex-shrink-0">1</span>
                          <span>Pokažite službeniku svoju PayParq parkirnu propusnicu, ispisanu ili na mobilnom uređaju</span>
                        </div>
                        <Ticket className="w-8 h-8 text-gray-600 flex-shrink-0" />
                      </div>
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="flex-shrink-0">2</span>
                          <span>Samo uđite ako nema nikoga</span>
                        </div>
                        <CheckCircle className="w-8 h-8 text-gray-600 flex-shrink-0" />
                      </div>
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="flex-shrink-0">3</span>
                          <span>Odvezite se kad budete spremni otići</span>
                        </div>
                        <LogOut className="w-8 h-8 text-gray-600 flex-shrink-0" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Facility Reviews Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowFacilityReviews(!showFacilityReviews)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Facility Reviews</p>
                  </button>
                  {showFacilityReviews && (
                    <div className="space-y-2 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl text-gray-900">4.8</span>
                        <span>/5</span>
                      </div>
                      <p>Izvrsno</p>
                      <p>Na temelju 265 recenzija.</p>
                    </div>
                  )}
                </div>

                {/* Getting There Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowGettingThere(!showGettingThere)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Getting There</p>
                  </button>
                  {showGettingThere && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <p>Enter this location at 35 Reade St. This is the Roger LLC garage, operated by Parkit. It is located on the southwest/lefthand side of Reade St. (a one-way street) between Elk St. and Broadway. The entrance is marked by a red 'parking' sign with white lettering.</p>
                    </div>
                  )}
                </div>

                {/* Free Cancellation Policy Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowCancellationPolicy(!showCancellationPolicy)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Free Cancellation Policy</p>
                  </button>
                  {showCancellationPolicy && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <p>U ovoj ustanovi imate vremena do trenutka kada vaša rezervacija počne otkazati svoje parkiranje za puni povrat novca. Rezervaciju možete otkazati na web stranici ili aplikaciji PayParq.</p>
                      <p>Ako imate problema sa svojom rezervacijom, a vrijeme je nakon početka, obratite se našim PayParq timom koji će rado pomoći ispraviti svaku situaciju!</p>
                    </div>
                  )}
                </div>

                {/* Guaranteed Parking Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowGuaranteedParking(!showGuaranteedParking)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">Guaranteed Parking by PayParq</p>
                  </button>
                  {showGuaranteedParking && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <p>When you park and pay with PayParq, we guarantee you will have a spot to park in at the price you paid or your money back.</p>
                      <p>If you need help with your reservation, please contact us, and we'll do our best to make it right. Our world-class customer support team is available 7 days a week, 365 days a year.</p>
                      <p>For specifics, please refer to the PayParq Parking Guarantee.</p>
                    </div>
                  )}
                </div>

                {/* 365-Day Customer Support Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowCustomerSupport(!showCustomerSupport)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">365-Day Customer Support</p>
                  </button>
                  {showCustomerSupport && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <p>PayParq has your back. If you have any issues while parking, please call our customer support team immediately at <span className="font-semibold">+385 91 596 3139</span>. We're here 365 days a year, Daily, 7am – midnight.</p>
                      <p>For non-urgent issues shoot us an email at payparq@outlook.com. We'll get back you within 24 hours.</p>
                    </div>
                  )}
                </div>

                {/* Company Credentials Footer */}
                <div className="pt-4 mt-4 border-t border-gray-200 text-xs text-gray-600 text-center space-y-1">
                  <p>✓ Industry Leading Guarantees</p>
                  <p>✓ PCI DSS Certified • SSL Secure</p>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Price Breakdown Modal */}
        {showPriceBreakdown && selectedListing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4">
              <div className="space-y-4">
                <p className="text-lg font-bold text-gray-900">Price Breakdown</p>

                <div className="space-y-2 border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Međuzbroj</p>
                    <p className="text-sm font-semibold text-gray-900">€{selectedListing.pricePerHour.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Service Fee (5%)</p>
                    <p className="text-sm font-semibold text-gray-900">€{(selectedListing.pricePerHour * 0.05).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-lg font-bold text-gray-900">Total</p>
                  <p className="text-lg font-bold text-gray-900">€{(selectedListing.pricePerHour * 1.05).toFixed(2)}</p>
                </div>

                <button
                  onClick={() => setShowPriceBreakdown(false)}
                  className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Modal - Centered Overlay */}
        {showVehicleModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-y-auto max-h-[90vh]">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add Vehicle</h3>
                  <p className="text-sm text-gray-600 mt-1">Tell us what you need to park and we'll help you find the best spot.</p>
                </div>

                {/* Make and Model Input */}
                <div className="space-y-2 relative">
                  <label className="text-sm font-semibold text-gray-900">Make and Model</label>
                  <input
                    type="text"
                    placeholder="Type to Search"
                    value={vehicleInput}
                    onChange={(e) => setVehicleInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]"
                  />
                  <p className="text-xs text-gray-500">Example: Honda Civic</p>

                  {/* Search Results Dropdown */}
                  {vehicleInput && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {VEHICLE_DATABASE.filter((v) =>
                        `${v.make} ${v.model}`.toLowerCase().includes(vehicleInput.toLowerCase())
                      ).map((vehicle, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setVehicleInput(`${vehicle.make} ${vehicle.model}`);
                            if (selectedListing?.maxHeight) {
                              setVehicleCheckResult(vehicle.height <= selectedListing.maxHeight ? 'fits' : 'prohibited');
                            }
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 text-sm"
                        >
                          {vehicle.make} {vehicle.model} <span className="text-gray-500">({vehicle.height}m)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vehicle Check Result */}
                {selectedVehicle && vehicleCheckResult && (
                  <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    vehicleCheckResult === 'fits'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    <span>{vehicleCheckResult === 'fits' ? '✓ Fits' : '✗ Prohibited'}</span>
                    <span className="text-xs">
                      {vehicleCheckResult === 'fits'
                        ? `Your ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.height}m) fits within the limit (${selectedListing?.maxHeight}m)`
                        : `Your ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.height}m) exceeds the limit (${selectedListing?.maxHeight}m)`}
                    </span>
                  </div>
                )}

                {!selectedListing?.maxHeight && selectedVehicle && (
                  <div className="p-3 rounded-lg text-sm text-gray-700 bg-gray-100 border border-gray-300">
                    No height restriction data available for this lot.
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowVehicleModal(false);
                      setVehicleInput('');
                      setSelectedVehicle(null);
                      setVehicleCheckResult(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-50"
                  >
                    Not Now
                  </button>
                  <button
                    onClick={() => {
                      if (selectedVehicle) {
                        setShowVehicleModal(false);
                      }
                    }}
                    disabled={!selectedVehicle}
                    className="flex-1 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Vehicle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map 65% RIGHT (normal) or flex-1 RIGHT (details) */}
        <div className={`bg-gray-100 ${showDetailsView ? 'flex-1' : 'w-[65%]'}`}>
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#5F3DFC] rounded-full animate-spin" />
            </div>
          ) : (
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
          )}
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
                filteredListings.map((listing, index) => {
                  const badges = ['Najkraća Šetnja', 'Najbolja Vrijednost', 'Najviše Ocijenjeno'];
                  const badgeText = index < badges.length ? badges[index] : undefined;
                  return (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isSelected={selectedListing?.id === listing.id}
                      onSelect={setSelectedListing}
                      onBook={() => {
                        setSelectedListing(listing);
                        setShowBookingModal(true);
                      }}
                      badgeText={badgeText}
                    />
                  );
                })
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
