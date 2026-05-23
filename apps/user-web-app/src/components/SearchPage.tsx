'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleMap, Marker, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import { SiteHeader } from './SiteHeader';
import { ListingCard } from './ListingCard';
import { SearchFilters } from './SearchFilters';
import { BookingModal } from './BookingModal';
import { DateTimePickerDropdown } from './DateTimePickerDropdown';
import { MonthlyDatePickerDropdown } from './MonthlyDatePickerDropdown';
import { DestinationPickerWidget } from './DestinationPickerWidget';
import { ScrollableDateTimePicker } from './ScrollableDateTimePicker';
import { useLocale } from './LocaleProvider';
import { MapPin, Star, Search, ChevronRight, Info, Users, Lock, Accessibility, Zap, ChevronDown, Ticket, CheckCircle, LogOut, X, Clock, AlertCircle, List } from 'lucide-react';
import { resolveScannerTruthPriceEuro, getViablePrice } from '@/lib/locationPricing';
import { AMENITIES_LIST } from '@/lib/amenities';
import { AmenitiesChips } from './AmenitiesChips';

const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

const UNIVERSAL_THINGS_TO_KNOW = 'Zbog ograničenja veličine, ova lokacija ne može primiti kamionete i putničke kombije.\n\nZa egzotična vozila obratite se izravno servisu radi dostupnosti i cijene.\n\nKamioni, kombiji i veliki SUV-ovi smatraju se super velikim i podliježu dodatnim naknadama na licu mjesta.';

const HOTSPOTS_BY_REGION: Record<string, Array<{ name: string; lat: number; lng: number; type: string }>> = {
  split: [
    { name: 'Riva', lat: 43.5088, lng: 16.4406, type: 'landmark' },
    { name: 'Bačvice Beach', lat: 43.5095, lng: 16.4470, type: 'beach' },
    { name: 'Marjan Park', lat: 43.5150, lng: 16.4200, type: 'park' },
    { name: 'Diocletian Palace', lat: 43.5086, lng: 16.4399, type: 'landmark' },
    { name: 'Split Airport', lat: 43.5388, lng: 16.2973, type: 'airport' },
    { name: 'City Center Shopping', lat: 43.5088, lng: 16.4350, type: 'shopping' },
  ],
  zagreb: [
    { name: 'Ban Jelačić Square', lat: 45.8150, lng: 15.9819, type: 'landmark' },
    { name: 'Zrinjevac Park', lat: 45.8113, lng: 15.9765, type: 'park' },
    { name: 'Maksimir Park', lat: 45.8234, lng: 16.0089, type: 'park' },
    { name: 'Zagreb Airport', lat: 45.7429, lng: 16.0688, type: 'airport' },
    { name: 'Avenue Mall', lat: 45.8166, lng: 15.9797, type: 'shopping' },
    { name: 'Mirogoj Cemetery', lat: 45.8303, lng: 15.9736, type: 'landmark' },
  ],
};

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
  display_id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  pricePerHour: number;
  pricePerDay?: number;
  pricePerMonth?: number;
  rating: number;
  reviews: number;
  photo: string;
  photos?: string[];
  distance: number;
  availability: boolean;
  features: string[];
  type: 'self-park' | 'garage' | 'valet' | 'lot';
  seoTitle?: string;
  seoDescription?: string;
  maxHeight?: number;
  heightRestrictions?: boolean;
  accessHours?: string;
  amenities?: string;
  thingsToKnow?: string;
  gettingThere?: string;
  howItWorks?: string;
  spots?: number;
  baseHourlyRate?: number;
  baseDailyRate?: number;
  dateConfigs?: Record<string, { priceHourly?: number; priceDaily?: number; priceMonthly?: number }>;
}

export function SearchPage() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const [isHubIdMode, setIsHubIdMode] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [showTotalPrice, setShowTotalPrice] = useState(true);
  const [allParkingDropdownOpen, setAllParkingDropdownOpen] = useState(false);
  const [showMobileSearchEdit, setShowMobileSearchEdit] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const allParkingDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const filterModalRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'price' | 'rating' | 'walk' | 'value'>('distance');
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    const handleAppInstalled = () => {
      setPwaPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    await pwaPrompt.userChoice;
    setPwaPrompt(null);
  };

  // Debug: log sortBy changes
  useEffect(() => {
    console.log('=== sortBy changed to:', sortBy);
  }, [sortBy]);
  const [recentSearches, setRecentSearches] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<{ name: string; lat: number; lng: number; type: string }[]>([]);
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [vehicleInput, setVehicleInput] = useState('');
  const [vehicleCheckResult, setVehicleCheckResult] = useState<'fits' | 'prohibited' | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<{ make: string; model: string; height: number } | null>(null);
  const [showOnlineSpecialReminder, setShowOnlineSpecialReminder] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showThingsToKnow, setShowThingsToKnow] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [showAccessHours, setShowAccessHours] = useState(false);
  const [showHowToRedeem, setShowHowToRedeem] = useState(false);
  const [showGettingThere, setShowGettingThere] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);
  const [showGuaranteedParking, setShowGuaranteedParking] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [destinationVenueType, setDestinationVenueType] = useState<'airport' | 'city' | 'event' | 'hotel'>('airport');

  useEffect(() => {
    if (!selectedListing) return;

    setTimeout(() => {
      document.querySelectorAll('[data-lot-id]').forEach((el) => {
        if (el.getAttribute('data-lot-id') === selectedListing.id) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }, 200);
  }, [selectedListing?.id]);

  useEffect(() => {
    if (!mapRef.current || !mapCenter) return;
    mapRef.current.panTo({ lat: mapCenter.lat, lng: mapCenter.lng });
    mapRef.current.setZoom(13);
  }, [mapCenter]);

  const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // --- Live pricing helpers ---
  const parseLocalDateTime = (isoStr: string) => {
    const [date, time] = isoStr.split('T');
    if (!date || !time) return new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  };

  const durationHours = (() => {
    if (!startTime || !endTime) return 1;
    const start = parseLocalDateTime(startTime);
    const end = parseLocalDateTime(endTime);
    const diff = end.getTime() - start.getTime();
    if (isNaN(diff) || diff < 0) return 1;
    return Math.max(1, Math.ceil(diff / 3_600_000));
  })();

  // Resolve base rates for a listing on a specific date, applying any calendar overrides.
  const resolveRatesForDate = (listing: Parking, isoDatetime: string) => {
    const d = new Date(isoDatetime);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayConfig = listing.dateConfigs?.[dateStr];
    return {
      hourly: (dayConfig?.priceHourly ?? listing.baseHourlyRate) || listing.pricePerHour,
      daily:  (dayConfig?.priceDaily  ?? listing.baseDailyRate)  || listing.pricePerDay,
    };
  };

  const getDisplayPrice = (listing: Parking, duration: number, type: string): number => {
    if (type === 'Mjesečna') {
      return listing.pricePerMonth || listing.pricePerHour;
    }
    const hourlyTotal = listing.pricePerHour * duration;
    if (!listing.pricePerDay) return hourlyTotal;
    const numberOfDays = Math.ceil(duration / 24);
    const dailyTotal = listing.pricePerDay * numberOfDays;
    return Math.min(hourlyTotal, dailyTotal);
  };

  const subtotal = selectedListing ? (() => {
    const rates = resolveRatesForDate(selectedListing, startTime);
    const liveListing = { ...selectedListing, pricePerHour: rates.hourly, pricePerDay: rates.daily };
    return parseFloat(getDisplayPrice(liveListing, durationHours, reservationType).toFixed(2));
  })() : 0;
  const serviceFee = parseFloat((0.99 + subtotal * 0.05).toFixed(2));
  const totalPrice = parseFloat((subtotal + serviceFee).toFixed(2));

  const formatDuration = () => {
    const h = durationHours;
    if (h < 24) return `${h} ${h === 1 ? 'sat' : h < 5 ? 'sata' : 'sati'}`;
    const days = Math.floor(h / 24), rem = h % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days} ${days === 1 ? 'dan' : 'dana'}`;
  };

  const formatTimeRange = () => {
    const s = new Date(startTime), e = new Date(endTime);
    const pad = (n: number) => String(n).padStart(2, '0');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const sameDay = s.getDate() === e.getDate() && s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();

    if (sameDay) {
      const dateStr = `${s.getDate()}. ${months[s.getMonth()]}`;
      return `${dateStr} ${pad(s.getHours())}:${pad(s.getMinutes())} – ${pad(e.getHours())}:${pad(e.getMinutes())}`;
    } else {
      return `${s.getDate()}. ${months[s.getMonth()]} ${pad(s.getHours())}:${pad(s.getMinutes())} – ${e.getDate()}. ${months[e.getMonth()]} ${pad(e.getHours())}:${pad(e.getMinutes())}`;
    }
  };

  const buildCheckoutUrl = (listing: Parking) => {
    const rates = resolveRatesForDate(listing, startTime);
    const checkoutListing = { ...listing, pricePerHour: rates.hourly, pricePerDay: rates.daily };
    const totalPrice = getDisplayPrice(checkoutListing, durationHours, reservationType);
    const sub = parseFloat(totalPrice.toFixed(2));
    const fee = parseFloat((0.99 + sub * 0.05).toFixed(2));
    const total = parseFloat((showTotalPrice ? sub + fee : sub).toFixed(2));

    // For monthly bookings, set duration to 1 month
    let checkoutStartTime = startTime;
    let checkoutEndTime = endTime;
    if (reservationType === 'Mjesečna') {
      const start = new Date(startTime);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1); // Add 1 month
      checkoutStartTime = start.toISOString();
      checkoutEndTime = end.toISOString();
    }

    const params = new URLSearchParams({
      loc: listing.id,
      in: checkoutStartTime,
      out: checkoutEndTime,
      amount_cents: Math.round(total * 100).toString(),
      name: listing.name || listing.address,
      address: listing.address,
      ...(listing.display_id ? { display_id: listing.display_id } : {}),
    });
    return `/checkout?${params.toString()}`;
  };
  // ---------------------------

  const parkingCategories = [
    { id: 'airport', label: 'Zračna Luka', description: 'Parking near airports' },
    { id: 'city', label: 'Gradovi', description: 'Parking in city centers' },
    { id: 'event', label: 'Eventovi', description: 'Parking near event venues' },
    { id: 'list-lot', label: 'List your lot', description: 'List your parking space', action: 'navigate', link: '/host' },
  ];

  const toggleQuickFilter = (filterId: string) => {
    setQuickFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  };

  const FILTER_OPTIONS = AMENITIES_LIST.map(amenity => ({
    id: amenity.id,
    label: amenity.label,
    count: listings.filter(l => l.features.includes(amenity.id)).length
  }));

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

  // Auto-request current location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setMapCenter({ lat, lng });
      setSearchLocationPin({ lat, lng });
      setSearchLocation('Current Location');
    });
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Fetch real data from Supabase - Hub locations only
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/listings');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { locations, error } = await res.json();

        if (error) throw new Error(error);
        if (!locations) throw new Error('No data');

        if (locations && locations.length > 0) {
          const parkingListings: Parking[] = locations.map((loc: any) => {
            const features: string[] = [];

            // Parse features from addons_config (correct column name)
            const addonsConfig = loc.addons_config
              ? (typeof loc.addons_config === 'string' ? JSON.parse(loc.addons_config) : loc.addons_config)
              : {};
            if (addonsConfig.valet) features.push('valet');
            if (addonsConfig.garage) features.push('garage');
            if (addonsConfig.staff) features.push('on-site-staff');
            if (addonsConfig.wheelchair) features.push('wheelchair-accessible');
            if (addonsConfig.ev_charging) features.push('ev-charging');

            // Fallback: also check verification_metadata
            const meta = loc.verification_metadata
              ? (typeof loc.verification_metadata === 'string' ? JSON.parse(loc.verification_metadata) : loc.verification_metadata)
              : {};

            // Check new amenities_ids (from mobile scanner)
            if (Array.isArray(meta.amenities_ids)) {
              for (const id of meta.amenities_ids) {
                if (!features.includes(id)) features.push(id);
              }
            }

            // Fallback: check old features array
            if (Array.isArray(meta.features)) {
              for (const f of meta.features) {
                if (!features.includes(f)) features.push(f);
              }
            }

            const lat = loc.latitude || loc.lat || 45.815;
            const lng = loc.longitude || loc.lng || 15.982;
            const refLat = mapCenter.lat;
            const refLng = mapCenter.lng;
            const distance = haversineKm(refLat, refLng, lat, lng);

            const pricePerHour = resolveScannerTruthPriceEuro({
              rate_per_hour: loc.rate_per_hour,
              base_price_hourly: loc.base_price_hourly,
              rate_per_hour_floor: loc.rate_per_hour_floor,
              rate_per_hour_ceiling: loc.rate_per_hour_ceiling,
            }, 'hourly');

            const pricePerDay = resolveScannerTruthPriceEuro({
              base_price_daily: loc.base_price_daily,
              base_price_daily_floor: loc.base_price_daily_floor,
              base_price_daily_ceiling: loc.base_price_daily_ceiling,
            }, 'daily');

            const pricePerMonth = resolveScannerTruthPriceEuro({
              base_price_monthly: loc.base_price_monthly,
              base_price_monthly_floor: loc.base_price_monthly_floor,
              base_price_monthly_ceiling: loc.base_price_monthly_ceiling,
              base_price_daily: loc.base_price_daily,
            }, 'monthly');

            // Parse verification_metadata if it's a string
            let metadata: any = {};
            if (loc.verification_metadata) {
              metadata = typeof loc.verification_metadata === 'string'
                ? JSON.parse(loc.verification_metadata)
                : loc.verification_metadata;
            }

            // Check for calendar overrides on the booking start date
            const getCalendarOverridePrices = () => {
              const startDate = new Date(startTime);
              const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
              const dateConfigs = metadata?.dateConfigs || {};
              const dayConfig = dateConfigs[dateStr];

              if (dayConfig) {
                return {
                  hourly: dayConfig.priceHourly || pricePerHour,
                  daily: dayConfig.priceDaily || pricePerDay,
                  monthly: dayConfig.priceMonthly || pricePerMonth,
                };
              }
              return { hourly: pricePerHour, daily: pricePerDay, monthly: pricePerMonth };
            };

            const calendarPrices = getCalendarOverridePrices();
            const finalPricePerHour = calendarPrices.hourly;
            const finalPricePerDay = calendarPrices.daily;
            const finalPricePerMonth = calendarPrices.monthly;
            const verificationPhotos = (() => {
              if (Array.isArray(loc.verification_photos)) return loc.verification_photos;
              if (typeof loc.verification_photos === 'string') {
                try {
                  return JSON.parse(loc.verification_photos);
                } catch {
                  return [];
                }
              }
              return [];
            })();

            const photoUrl = verificationPhotos.length > 0 ? verificationPhotos[0] : (loc.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400');

            return {
              id: loc.id,
              display_id: loc.display_id || undefined,
              name: loc.name || 'Parking',
              address: loc.address || '',
              lat: lat,
              lng: lng,
              pricePerHour: finalPricePerHour,
              pricePerDay: finalPricePerDay,
              pricePerMonth: finalPricePerMonth,
              rating: loc.review_score || 0,
              reviews: loc.review_count || 0,
              photo: photoUrl,
              photos: verificationPhotos.length > 0 ? verificationPhotos : [photoUrl],
              distance: parseFloat(distance.toFixed(1)),
              availability: true,
              features,
              type: (loc.type || 'self-park') as any,
              maxHeight: loc.max_height ? parseFloat(loc.max_height) : undefined,
              heightRestrictions: loc.height_restrictions === true || loc.height_restrictions === 'yes',
              accessHours: (metadata.access_hours as string | undefined) || 'pon – pet: 6:00 – 23:00\nsub – ned: 7:00 – 23:00',
              amenities: (metadata.amenities as string | undefined) || 'Valet usluga, Garaža - Natkrivena, Osoblje na licu mjesta, EV punjenje, Pristup invalidskim kolicima',
              thingsToKnow: (metadata.things_to_know as string | undefined) || UNIVERSAL_THINGS_TO_KNOW,
              gettingThere: (metadata.getting_there as string | undefined) || 'Unesite adresu lokacije u navigaciju. Ulaz je označen znakom za parkiranje.',
              howItWorks: (metadata.how_it_works as string | undefined) || '1. Pokažite službeniku svoju PayParq parkirnu propusnicu, ispisanu ili na mobilnom uređaju\n2. Samo uđite ako nema nikoga\n3. Odvezite se kad budete spremni otići',
              spots: loc.total_spots || loc.capacity,
              baseHourlyRate: pricePerHour,
              baseDailyRate: pricePerDay,
              dateConfigs: metadata?.dateConfigs || {},
            };
          });

          setListings(parkingListings);
          const urlHubId = new URLSearchParams(window.location.search).get('hubId');
          setIsHubIdMode(!!urlHubId);
          const displayList = urlHubId
            ? parkingListings.filter((l) => l.id === urlHubId || l.display_id === urlHubId)
            : parkingListings;
          setFilteredListings(displayList);
          if (displayList.length > 0) {
            setSelectedListing(displayList[0]);
            if (urlHubId) {
              setShowDetailsView(true);
              setShowMobileDetails(true);
              setMapCenter({ lat: displayList[0].lat, lng: displayList[0].lng });
            }
          }
        } else {
          setListings([]);
          setFilteredListings([]);
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

    // Auto-refresh listings every 60 seconds
    const refreshInterval = setInterval(fetchListings, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Show arrival picker on load when hubId is present
  useEffect(() => {
    if (isHubIdMode && !arrivalDateTime) {
      setShowArrivalPicker(true);
    }
  }, [isHubIdMode, arrivalDateTime]);

  // Reset photo index when listing selection changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [selectedListing?.id]);

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
        addToRecentSearches(mainText || '', lat, lng);
      }
    });
  };

  const addToRecentSearches = (name: string, lat: number, lng: number) => {
    const updated = [{ name, lat, lng }, ...recentSearches.filter(s => s.name !== name)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
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
        addToRecentSearches('Current Location', lat, lng);
      });
    }
  };

  const handleRecentSearch = (name: string, lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    setSearchLocationPin({ lat, lng });
    setSearchLocation(name);
    setShowPredictions(false);
    addToRecentSearches(name, lat, lng);
  };

  const fetchNearbyPlaces = () => {
    const lat = mapCenter.lat;
    const lng = mapCenter.lng;

    // Detect region: Split area (43.4-43.6 lat, 16.2-16.5 lng) or Zagreb area (45.7-45.9 lat, 15.8-16.1 lng)
    let region = 'split';
    if (lat > 45.7 && lat < 45.9 && lng > 15.8 && lng < 16.1) {
      region = 'zagreb';
    }

    const hotspots = HOTSPOTS_BY_REGION[region] || HOTSPOTS_BY_REGION.split;
    setNearbyPlaces(hotspots);
  };

  // Apply filters
  useEffect(() => {
    let filtered = listings;

    // Quick filters
    if (quickFilters.includes('instant-access')) {
      filtered = filtered.filter((l) => l.availability);
    }
    if (quickFilters.includes('covered-garage')) {
      filtered = filtered.filter((l) => l.type === 'garage' || l.features.includes('garage') || l.features.includes('covered'));
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

    // Filter modal selections
    if (selectedFilters.length > 0) {
      filtered = filtered.filter((l) => {
        return selectedFilters.every((filterId) => {
          switch (filterId) {
            case 'valet': return l.features.includes('valet');
            case 'garage-covered': return l.type === 'garage' || l.features.includes('garage');
            case 'lot-uncovered': return l.type === 'lot';
            case 'immediate-parking': return l.availability;
            case 'on-site-staff': return l.features.includes('on-site-staff');
            case 'month-to-month': return true;
            case 'wheelchair-accessible': return l.features.includes('wheelchair-accessible');
            case 'self-park': return l.type === 'self-park';
            case 'ev-charging': return l.features.includes('ev-charging');
            case 'rampa': return l.features.includes('rampa');
            default: return true;
          }
        });
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    const ref = searchLocationPin || mapCenter;
    console.log(`=== SORTING: ${sortBy}`);
    console.log(`ref point (searchLocationPin=${searchLocationPin ? 'yes' : 'no'}):`, ref);
    console.log(`filtered listings count: ${filtered.length}`);
    filtered.forEach((l, i) => {
      const dist = haversineKm(ref.lat, ref.lng, l.lat, l.lng);
      console.log(`  [${i}] ${l.name}: lat=${l.lat}, lng=${l.lng}, dist=${dist.toFixed(2)}km`);
    });

    switch (sortBy as string) {
      case 'distance':
      case 'walk':
      case 'udaljenost': // fallback for Croatian locale
        sorted.sort((a, b) => {
          const aDist = haversineKm(ref.lat, ref.lng, a.lat, a.lng);
          const bDist = haversineKm(ref.lat, ref.lng, b.lat, b.lng);
          const diff = aDist - bDist;
          return diff;
        });
        console.log('After sort (distance):');
        sorted.forEach((l, i) => {
          const dist = haversineKm(ref.lat, ref.lng, l.lat, l.lng);
          console.log(`  [${i}] ${l.name}: dist=${dist.toFixed(2)}km`);
        });
        break;
      case 'price':
      case 'cijena': // fallback for Croatian locale
        sorted.sort((a, b) => {
          const aPricePerUnit = getDisplayPrice(a, durationHours, reservationType);
          const bPricePerUnit = getDisplayPrice(b, durationHours, reservationType);
          const aCalc = reservationType === 'Mjesečna' ? aPricePerUnit : aPricePerUnit * durationHours;
          const bCalc = reservationType === 'Mjesečna' ? bPricePerUnit : bPricePerUnit * durationHours;
          const aTotal = aCalc + 0.99 + (aCalc * 0.05);
          const bTotal = bCalc + 0.99 + (bCalc * 0.05);
          return aTotal - bTotal;
        });
        break;
      case 'rating':
      case 'ocjena': // fallback for Croatian locale
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'value':
      case 'vrijednost': // fallback for Croatian locale
        sorted.sort((a, b) => {
          const aPrice = getDisplayPrice(a, durationHours, reservationType);
          const bPrice = getDisplayPrice(b, durationHours, reservationType);
          return (b.rating / bPrice) - (a.rating / aPrice);
        });
        break;
      case 'relevance':
      case 'relevantnost': // fallback for Croatian locale
      default:
        // Find and move closest listing to top for relevance
        if (sorted.length > 0) {
          const closest = sorted.reduce((min, curr) => {
            const minDist = haversineKm(ref.lat, ref.lng, min.lat, min.lng);
            const currDist = haversineKm(ref.lat, ref.lng, curr.lat, curr.lng);
            return currDist < minDist ? curr : min;
          });
          const closestIndex = sorted.findIndex(l => l.id === closest.id);
          if (closestIndex > 0) {
            sorted.splice(closestIndex, 1);
            sorted.unshift(closest);
          }
        }
        break;
    }

    console.log(`Sorted result (${sortBy}):`, sorted.slice(0, 5).map(l => ({ name: l.name, dist: haversineKm(ref.lat, ref.lng, l.lat, l.lng).toFixed(2) })));
    if (!isHubIdMode) {
      setFilteredListings(sorted);
    }
  }, [listings, priceRange[0], priceRange[1], selectedFeatures.join(','), selectedFilters.join(','), parkingType, quickFilters.join(','), sortBy, `${searchLocationPin?.lat},${searchLocationPin?.lng}`, durationHours, startTime, endTime, isHubIdMode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (homeDropdownRef.current && !homeDropdownRef.current.contains(e.target as Node)) {
        setHomeDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (homeDropdownOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [homeDropdownOpen, mobileMenuOpen]);

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
        <div className="relative flex items-center justify-center w-20 h-20">
          {/* Rotating white ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
          {/* Pulsating logo */}
          <div className="animate-pulse w-12 h-12 rounded-full bg-[#020617] flex items-center justify-center shadow-lg z-10">
            <span className="text-lg font-black tracking-tight text-white select-none">P</span>
          </div>
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
          <div className="border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus-within:border-black min-h-[50px] flex flex-col justify-center px-4 py-2 mr-2 flex-1">
            <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">Vrsta rezervacije</label>
            <select
              value={reservationType}
              onChange={(e) => setReservationType(e.target.value)}
              className="bg-white border-none text-sm font-medium text-gray-900 p-0 pr-6 focus:outline-none cursor-pointer w-full leading-none -ml-1 min-w-[400px]"
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
                  onFocus={() => {
                    setShowPredictions(true);
                    if (nearbyPlaces.length === 0) {
                      fetchNearbyPlaces();
                    }
                  }}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer flex-1 leading-none"
                />
              </div>
              {/* Predictions dropdown */}
              {showPredictions && (
                <div className="absolute top-full mt-1 left-1/2 bg-white border border-gray-300 rounded-md shadow-xl z-50 max-h-80 overflow-y-auto" style={{ width: 'calc(100% + 1rem)', transform: 'translateX(-50%)' }}>
                  {/* Current Location */}
                  <button
                    onClick={handleCurrentLocation}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900"
                  >
                    <MapPin className="w-4 h-4 text-gray-600" />
                    Use current location
                  </button>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <>
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRecentSearch(search.name, search.lat, search.lng)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900 border-t border-gray-200"
                        >
                          <MapPin className="w-4 h-4 text-gray-600" />
                          {search.name}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Nearby Locations Header */}
                  {nearbyPlaces.length > 0 && (
                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-t border-gray-200">
                      Nearby Locations
                    </div>
                  )}

                  {/* Nearby Places of Interest */}
                  {nearbyPlaces.map((place, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentSearch(place.name, place.lat, place.lng)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2 text-sm border-t border-gray-200"
                    >
                      <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-900 font-medium">{place.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{place.type}</div>
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
                <a href="/members" className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 rounded-t-lg">
                  Log In / Sign Up
                </a>
                <a href="/host" className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200">
                  List your lot
                </a>
                <a href="https://www.payparq.com" className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200 rounded-b-lg">
                  Početna
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 relative z-50">
        {/* Logo Row with Menu */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                <span className="text-xs font-semibold tracking-tight leading-none text-white">
                  P
                </span>
              </div>
            </div>
            <div className="text-base font-black tracking-tight text-black select-none">
              payparq
            </div>
          </div>

          {/* Menu Dropdown on Right */}
          <div className="flex items-center gap-3">
            <a href="/host" className="text-xs font-semibold px-2 py-1 hover:opacity-70 transition-opacity" style={{ color: '#5F3DFC' }}>
              {locale === 'en' ? 'List' : 'Objavi'}
            </a>
            <div className="relative" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center p-2 hover:opacity-70 transition-opacity"
              >
                <div className="flex flex-col gap-1">
                  <div className="w-4 h-px bg-gray-600"></div>
                  <div className="w-4 h-px bg-gray-600"></div>
                </div>
              </button>
              {mobileMenuOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[160px] sm:min-w-[180px]">
                  <a href="/" className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-xs sm:text-sm text-gray-900 rounded-t-lg">
                    Home
                  </a>
                  <a href="/members" className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-xs sm:text-sm text-gray-900 border-t border-gray-200">
                    Log In
                  </a>
                  {pwaPrompt && (
                    <button onClick={handleInstallPWA} className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-xs sm:text-sm text-gray-900 border-t border-gray-200 rounded-b-lg">
                      Install App
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Widget + Map Button */}
        <div className="flex gap-2 h-12">
          {/* Search Widget - Clickable Summary */}
          <button
            onClick={() => setShowMobileSearchEdit(true)}
            className="flex-1 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-1 text-left flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="flex flex-col justify-center flex-1">
              <div className="text-xs text-gray-600 font-semibold truncate">{searchLocation || 'Gdje ideš?'}</div>
              {startTime && endTime && (
                <div className="text-xs text-gray-700 font-medium">
                  {new Date(startTime).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })} to {new Date(endTime).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </button>

          {/* Map Button - Enlarged */}
          <button
            onClick={() => setShowMobileMap(!showMobileMap)}
            className="w-20 rounded-lg border border-gray-300 bg-white hover:border-gray-400 flex items-center justify-center gap-1.5 flex-shrink-0 px-2"
          >
            <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="text-xs text-gray-600 font-semibold truncate">{showMobileMap ? 'Popis' : 'Karta'}</div>
          </button>
        </div>
      </div>

      {/* Mobile Search Edit Modal */}
      {showMobileSearchEdit && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-center px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Uredi pretragu</h2>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Reservation Type */}
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase">Vrsta rezervacije</label>
              <select
                value={reservationType}
                onChange={(e) => setReservationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Satna/dnevna">Satna/dnevna</option>
                <option value="Mjesecna">Mjesecna</option>
              </select>
            </div>

            {/* Location Search */}
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase">Kamo ideš?</label>
              <div className="border border-gray-300 rounded-lg bg-white px-3 py-2 flex items-center gap-2 focus-within:border-[#000000] focus-within:ring-2 focus-within:ring-blue-500">
                <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onFocus={() => {
                    setShowPredictions(true);
                    if (nearbyPlaces.length === 0) {
                      fetchNearbyPlaces();
                    }
                  }}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none flex-1"
                />
              </div>
              {/* Predictions */}
              {showPredictions && (
                <div className="mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  <button
                    onClick={handleCurrentLocation}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900"
                  >
                    <MapPin className="w-4 h-4 text-gray-600" />
                    Use current location
                  </button>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <>
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRecentSearch(search.name, search.lat, search.lng)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900 border-t border-gray-200"
                        >
                          <MapPin className="w-4 h-4 text-gray-600" />
                          {search.name}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Nearby Locations Header */}
                  {nearbyPlaces.length > 0 && (
                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-t border-gray-200">
                      Nearby Locations
                    </div>
                  )}

                  {/* Nearby Places of Interest */}
                  {nearbyPlaces.map((place, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentSearch(place.name, place.lat, place.lng)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2 text-sm border-t border-gray-200"
                    >
                      <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-gray-900 font-medium">{place.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{place.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date/Time Pickers */}
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vrijeme
              </label>
              <div className="border border-gray-300 rounded-lg bg-white px-3 py-2 focus-within:border-[#000000] focus-within:ring-2 focus-within:ring-blue-500">
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
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 flex gap-2">
            <button
              onClick={() => setShowMobileSearchEdit(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-50"
            >
              Odustani
            </button>
            <button
              onClick={() => setShowMobileSearchEdit(false)}
              className="flex-1 px-4 py-2 bg-[#000000] text-white text-sm font-semibold rounded-lg hover:bg-gray-900"
            >
              Primijeni
            </button>
          </div>
        </div>
      )}

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
                  ? 'bg-[#000000] text-white border border-[#000000]'
                  : 'border border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
              translate="no"
              data-no-translate="true"
            >
              {'Instant Access'}
            </button>
          )}
          <button
            onClick={() => toggleQuickFilter('covered-garage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              quickFilters.includes('covered-garage')
                ? 'bg-[#000000] text-white border border-[#000000]'
                : 'border border-gray-300 text-gray-900 hover:border-gray-400'
            }`}
          >
            Natkriveno/Garaža
          </button>
          <button
            onClick={() => toggleQuickFilter('self-park')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              quickFilters.includes('self-park')
                ? 'bg-[#000000] text-white border border-[#000000]'
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
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 w-[320px]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Browse by category</p>
                <div className="flex flex-col gap-2">
                  {parkingCategories.map((cat) => {
                    const isListLot = (cat as any).link;
                    if (isListLot) {
                      return (
                        <a
                          key={cat.id}
                          href={(cat as any).link}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-100 text-left transition-colors"
                          onClick={() => setAllParkingDropdownOpen(false)}
                        >
                          <div translate="no">
                            <p className="text-sm font-semibold text-gray-900">{cat.label}</p>
                            <p className="text-xs text-gray-500">{cat.description}</p>
                          </div>
                        </a>
                      );
                    }
                    return (
                      <button
                        key={cat.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-100 text-left transition-colors"
                        onClick={() => {
                          setDestinationVenueType(cat.id as 'airport' | 'city' | 'event');
                          setShowDestinationPicker(true);
                          setAllParkingDropdownOpen(false);
                        }}
                      >
                        <div translate="no">
                          <p className="text-sm font-semibold text-gray-900">{cat.label}</p>
                          <p className="text-xs text-gray-500">{cat.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                showTotalPrice ? 'bg-black' : 'bg-gray-300'
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
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
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
                      className="w-4 h-4 accent-[#000000] rounded cursor-pointer"
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
                      className="w-4 h-4 accent-[#000000] rounded cursor-pointer"
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
                      showTotalPrice ? 'bg-[#000000]' : 'bg-gray-300'
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
                onClick={() => setFilterModalOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Povratak
              </button>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="px-6 py-2 bg-[#000000] text-white text-sm font-medium rounded-lg hover:bg-gray-900"
              >
                Show {filteredListings.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Modal */}
      {sortModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Poredaj po</h2>

            <div className="space-y-3 mb-8">
              {[
                { value: 'distance', label: 'Udaljenost' },
                { value: 'price-low', label: 'Cijena (nisko-visoko)' },
                { value: 'price-high', label: 'Cijena (visoko-nisko)' },
                { value: 'rating', label: 'Ocjena' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={() => setSortBy(option.value as typeof sortBy)}
                    className="w-4 h-4 accent-[#000000] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setSortModalOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Povratak
              </button>
              <button
                onClick={() => setSortModalOpen(false)}
                className="px-6 py-2 bg-[#000000] text-white text-sm font-medium rounded-lg hover:bg-gray-900"
              >
                Primjeni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Split layout - 2 column (normal) or 3 column (details view) */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Parking Lots Cards - hidden when hubId present */}
        <div className={`flex flex-col overflow-hidden bg-gray-50 border-r border-gray-200 ${isHubIdMode ? 'hidden' : showDetailsView ? 'flex-1' : 'w-[35%]'} max-h-[calc(100vh-120px)]`}>
          {/* Sort Dropdown - Top Right */}
          <div className="flex-shrink-0 px-4 py-3 bg-gray-100 border-b border-gray-200 flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => {
                const newVal = e.target.value as typeof sortBy;
                console.log('Dropdown changed to:', newVal, 'from:', sortBy);
                setSortBy(newVal);
              }}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Poredaj po relevantnosti</option>
              <option value="distance">Poredaj po udaljenosti</option>
              <option value="price">Poredaj po cijeni</option>
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
              (() => {
                const badgeMap = new Map<string, string>();

                if (filteredListings.length > 0) {
                  const validListings = filteredListings.filter(l => l.distance != null && l.pricePerHour != null && l.rating != null);
                  if (validListings.length > 0) {
                    const cheapest = validListings.reduce((min, curr) => {
                      const currPrice = getDisplayPrice(curr, durationHours, reservationType);
                      const minPrice = getDisplayPrice(min, durationHours, reservationType);
                      return currPrice < minPrice ? curr : min;
                    });
                    // Use real-time distance calculation for closest (should be at index 0 after sorting)
                    const refPoint = searchLocationPin || mapCenter;
                    const closest = validListings.reduce((min, curr) => {
                      const minDist = haversineKm(refPoint.lat, refPoint.lng, min.lat, min.lng);
                      const currDist = haversineKm(refPoint.lat, refPoint.lng, curr.lat, curr.lng);
                      return currDist < minDist ? curr : min;
                    });
                    const highestRated = validListings.reduce((max, curr) =>
                      curr.rating > max.rating ? curr : max
                    );

                    badgeMap.set(closest.id, 'Najkraća Šetnja');
                    if (cheapest.id !== closest.id) badgeMap.set(cheapest.id, 'Najbolja Vrijednost');
                    if (!badgeMap.has(highestRated.id)) badgeMap.set(highestRated.id, 'Najviše Ocijenjeno');
                  }
                }

                return filteredListings.map((listing) => {
                  const badgeText = badgeMap.get(listing.id);
                  const isSelected = selectedListing?.id === listing.id;
                  const liveRef = searchLocationPin || mapCenter;
                  const liveListing = { ...listing, distance: parseFloat(haversineKm(liveRef.lat, liveRef.lng, listing.lat, listing.lng).toFixed(1)) };
                  return (
                    <div
                      key={listing.id}
                      data-lot-id={listing.id}
                      className={`transition-all duration-200 rounded-2xl ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                    >
                      <ListingCard
                        listing={liveListing}
                        isSelected={isSelected}
                        onSelect={setSelectedListing}
                        onBook={() => {
                          setSelectedListing(listing);
                          setShowBookingModal(true);
                        }}
                        onDetails={() => setShowDetailsView(true)}
                        badgeText={badgeText}
                        checkoutUrl={buildCheckoutUrl(listing)}
                        durationHours={durationHours}
                        showFee={showTotalPrice}
                        spots={liveListing.spots}
                        reservationType={reservationType}
                      />
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>

        {/* Details Panel - flex-1 MIDDLE (only in details view) */}
        {showDetailsView && selectedListing && (
          <div className="flex-1 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Photo Gallery - Fixed Height */}
            <div className="flex-shrink-0 bg-gray-100 relative overflow-hidden" style={{ height: '394px' }}>
              {(() => {
                const photosArray = selectedListing.photos && selectedListing.photos.length > 0 ? selectedListing.photos : [selectedListing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'];
                return (
                  <img
                    src={photosArray[photoIndex]}
                    alt={selectedListing.name}
                    className="w-full h-full object-cover"
                  />
                );
              })()}

              {/* Close Button - Top Right (hidden in hubId mode) */}
              {!isHubIdMode && (
                <button
                  onClick={() => setShowDetailsView(false)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-lg p-2 shadow-md transition-all z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Left Arrow */}
              <button
                onClick={() => {
                  const photosArray = selectedListing.photos && selectedListing.photos.length > 0 ? selectedListing.photos : [selectedListing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'];
                  setPhotoIndex((photoIndex - 1 + photosArray.length) % photosArray.length);
                }}
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                className="bg-black/60 hover:bg-black/70 text-white rounded-full p-2.5 shadow-md transition-all inline-flex items-center justify-center leading-none w-10 h-10"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const photosArray = selectedListing.photos && selectedListing.photos.length > 0 ? selectedListing.photos : [selectedListing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'];
                  setPhotoIndex((photoIndex + 1) % photosArray.length);
                }}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                className="bg-black/60 hover:bg-black/70 text-white rounded-full p-2.5 shadow-md transition-all inline-flex items-center justify-center leading-none w-10 h-10"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* PayParq Watermark */}
              <div className="absolute bottom-4 right-4 text-gray-300 text-5xl font-black tracking-tight opacity-80 z-20">
                payparq
              </div>

              {/* Photo Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium z-20">
                {(() => { const photosArray = selectedListing.photos && selectedListing.photos.length > 0 ? selectedListing.photos : [selectedListing.photo || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']; return `${photoIndex + 1}/${photosArray.length}`; })()}
              </div>
            </div>

            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto">
              {/* Vehicle Size Info - Below Photo - Clickable */}
              <button
                onClick={() => {
                  setShowVehicleModal(true);
                  setVehicleCheckResult(null);
                }}
                className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-start gap-3 justify-between cursor-pointer transition-colors border-b border-gray-200"
              >
              <div className="flex items-start gap-3 flex-1">
                <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Vehicle size restrictions may apply</p>
                  <p className="text-xs text-gray-600 mt-1">Provjerite da li Vam vozilo podliježe ograničenjima i dodatnim naknadama.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            </button>

            {/* Book Now Suggestion Widget */}
            <div className="flex-shrink-0 w-full px-6 py-4 bg-amber-100 flex items-start gap-3 border-b border-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Predlažemo da rezervirate odmah.</p>
                <p className="text-xs text-gray-900 mt-1">Ovdje imamo samo {(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; if (s === 1) return '1 preostalo mjesto'; if (s <= 4) return `${s} preostala mjesta`; return `${s} preostalih mjesta`; })()} po ovoj cijeni!</p>
              </div>
            </div>

            {/* Location Information Widget */}
            <div className="flex-shrink-0 w-full bg-white border-b border-gray-200 overflow-hidden">
              {/* Black Badge Header */}
              <div className="font-bold text-white bg-black px-2 flex items-center justify-start" style={{ fontSize: '12px', paddingRight: '24px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '0 0 16px 0' }}>
                Lokacija
              </div>

              {/* Location Content - Card Style */}
              <div className="px-8 py-6 space-y-3">
                {/* Address */}
                <p className="font-semibold text-gray-900" style={{ fontSize: '18px' }}>{selectedListing.address}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {selectedListing.reviews > 0 ? (
                    <>
                      <span className="text-gray-900">{selectedListing.rating}</span>
                      <span className="text-gray-900">({selectedListing.reviews})</span>
                    </>
                  ) : (
                    <span className="text-gray-900">Novi objekt</span>
                  )}
                </div>

                {/* Walking Distance */}
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13" cy="3" r="2"/>
                    <path d="M11 6.5L8 12l3 1"/>
                    <path d="M13 6.5l1.5 3-3 2.5 1 5.5"/>
                    <path d="M11 14l-2 6"/>
                    <path d="M16 9l2 2"/>
                  </svg>
                  <span>{Math.round(selectedListing.distance * 12)} min ({selectedListing.distance.toFixed(1)} km)</span>
                </div>
              </div>
            </div>

            {/* Reservation Details Widget */}
            <div className="flex-shrink-0 w-full bg-white border-b border-gray-200">
              {/* Header and Content Combined */}
              <div className="px-8 py-6 space-y-4">

                <p className="text-sm text-gray-700 font-semibold">Rezervacija parkinga</p>

                {/* Date, Time and Price Row */}
                <button
                  onClick={() => setShowPriceBreakdown(true)}
                  className="w-full text-left hover:opacity-70 transition-opacity pb-5 border-b border-gray-200 flex items-start justify-between -mt-3"
                >
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{formatTimeRange()}</p>
                    <p className="text-sm text-gray-500 mt-1.5">
                      {selectedListing?.features?.includes('in-out-allowed') ? 'Ulazi i izlazi dozvoljeni' : 'Nema ulaza i izlaza'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-2xl font-bold text-gray-900">€{totalPrice.toFixed(2)}</p>
                    <span className="text-sm text-gray-500 border-b border-gray-400 pb-0.5 -mt-1">Ukupno</span>
                  </div>
                </button>

                {/* Grey Box - Reservation Extended */}
                <div className="bg-gray-200 rounded-lg p-1.5 mt-4">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-900">Vaša rezervacija je produžena bez dodatnih troškova!</p>
                    <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                </div>

                {/* Yellow Spots Widget */}
                <div className="flex items-center gap-1.5 bg-yellow-100 rounded-md px-3 py-2">
                  <Info className="w-3.5 h-3.5 text-yellow-700 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-gray-900">{(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; if (s === 1) return '1 preostalo mjesto'; if (s <= 4) return `${s} preostala mjesta`; return `${s} preostalih mjesta`; })()}</span>
                    <span className="text-xs text-gray-600 ml-1">po ovoj cijeni</span>
                  </div>
                </div>

                {/* CTA Button - Stripe checkout */}
                <a
                  href={selectedListing ? buildCheckoutUrl(selectedListing) : '#'}
                  className="inline-block px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Rezervirajte sada — €{totalPrice.toFixed(2)}
                </a>

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
                    <div className="space-y-3 mt-3">
                      {/* Important Notice */}
                      <div className="bg-yellow-100 rounded-md px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Info className="w-3.5 h-3.5 text-yellow-700 flex-shrink-0" />
                          <p className="text-xs font-semibold text-gray-900">Važna napomena</p>
                        </div>
                        <p className="text-xs text-gray-900">Molimo vas da poštujete vrijeme vaše rezervacije. Ne ulazite prije početka rezervacije niti je napuštajte nakon njezinog završetka. Ako prekršite ova pravila, naplaćeni iznos će biti izravno od operatera parkinga.</p>
                      </div>

                      {/* Things to Know Content */}
                      <div className="space-y-3 text-sm text-gray-900 leading-relaxed ml-7">
                        {selectedListing.thingsToKnow
                          ? selectedListing.thingsToKnow.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                          : <p className="text-gray-400">Nema dostupnih informacija.</p>}
                      </div>
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
                    <div className="mt-3 ml-7">
                      {selectedListing.features && selectedListing.features.length > 0
                        ? <AmenitiesChips selected={selectedListing.features} size="sm" />
                        : <p className="text-gray-400 text-sm">Nema dostupnih sadržaja.</p>}
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
                      {selectedListing.accessHours
                        ? selectedListing.accessHours.split('\n').map((line, i) => <p key={i}>{line}</p>)
                        : <p className="text-gray-400">Nema dostupnih informacija o radnom vremenu.</p>}
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
                      {selectedListing.howItWorks
                        ? selectedListing.howItWorks.split('\n').map((step, i) => (
                            <p key={i}>{step}</p>
                          ))
                        : <p className="text-gray-400">Nema dostupnih informacija.</p>}
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
                      {selectedListing.gettingThere
                        ? <p>{selectedListing.gettingThere}</p>
                        : <p className="text-gray-400">Nema dostupnih uputa za dolazak.</p>}
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

          </div>
        )}

        {/* Price Breakdown Modal */}
        {showPriceBreakdown && selectedListing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4">
              <div className="space-y-4">
                <p className="text-lg font-bold text-gray-900">Pregled cijene</p>

                <div className="space-y-2 border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {reservationType === 'Mjesečna'
                        ? `Mjesečna tarifa`
                        : `Cijena parkinga: €${subtotal.toFixed(2)}`
                      }
                    </p>
                    <p className="text-sm font-semibold text-gray-900">€{subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Naknada za uslugu</p>
                    <p className="text-sm font-semibold text-gray-900">€{serviceFee.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Naknada za uslugu uključuje: Jamstvo rezerviranog mjesta, prioritetnu podršku, rješavanje sporova i ostalo.</p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-lg font-bold text-gray-900">Ukupno</p>
                  <p className="text-lg font-bold text-gray-900">€{totalPrice.toFixed(2)}</p>
                </div>

                <a
                  href={buildCheckoutUrl(selectedListing)}
                  className="block w-full mt-2 px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Rezervirajte sada — €{totalPrice.toFixed(2)}
                </a>
                <button
                  onClick={() => setShowPriceBreakdown(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Zatvori
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Modal - Centered Overlay */}
        {showVehicleModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full">
              <div className="p-6">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowVehicleModal(false);
                    setVehicleInput('');
                    setSelectedVehicle(null);
                    setVehicleCheckResult(null);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Height Restriction Info */}
                {selectedListing?.maxHeight ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M2 12h20"/>
                        <path d="M12 2L8 8M12 2l4 6"/>
                      </svg>
                      <div>
                        <p className="text-lg font-bold text-gray-900">Max Height Restriction</p>
                        <p className="text-3xl font-bold text-amber-600 mt-2">{selectedListing.maxHeight.toFixed(2)}m</p>
                        <p className="text-sm text-gray-600 mt-3">Additional charges or access restrictions may apply if this limit is exceeded</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowVehicleModal(false);
                        setVehicleInput('');
                        setSelectedVehicle(null);
                        setVehicleCheckResult(null);
                      }}
                      className="w-full mt-6 px-4 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Zatvori
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-4">
                    <p className="text-gray-700">No height restriction data available for this lot.</p>
                    <button
                      onClick={() => {
                        setShowVehicleModal(false);
                        setVehicleInput('');
                        setSelectedVehicle(null);
                        setVehicleCheckResult(null);
                      }}
                      className="w-full px-4 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Zatvori
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map 65% RIGHT (normal) or flex-1 RIGHT (details) */}
        <div className={`bg-gray-100 ${showDetailsView ? 'flex-1' : 'w-[65%]'}`}>
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative flex items-center justify-center w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
                <div className="animate-pulse w-8 h-8 rounded-full bg-[#020617] flex items-center justify-center z-10">
                  <span className="text-sm font-black text-white select-none">P</span>
                </div>
              </div>
            </div>
          ) : (
          <GoogleMap
            zoom={16}
            center={mapCenter}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            onLoad={(map) => {
              mapRef.current = map;
            }}
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
            {/* Parking lot location markers - Cloud with price (native Marker, no twitch) */}
            {filteredListings.map((listing) => {
              const totalPrice = getDisplayPrice(listing, durationHours, reservationType);
              const subtotal = parseFloat(totalPrice.toFixed(2));
              const price = parseFloat((showTotalPrice ? subtotal + 0.99 + (subtotal * 0.05) : subtotal).toFixed(2));
              const label = `€${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
              const shouldShowIntegerOnly = showTotalPrice && (reservationType === 'Mjesečna' || price >= 100);
              const mapLabel = shouldShowIntegerOnly ? `€${Math.floor(price)}` : label;
              const isSelected = selectedListing?.id === listing.id;
              const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 115" width="48.75" height="56.0625">
                <path d="M 50,8 C 73,8 92,22 92,38 C 92,54 73,68 58,70 Q 54,79 50,88 Q 46,79 42,70 C 27,68 8,54 8,38 C 8,22 27,8 50,8 Z"
                  fill="${isSelected ? '#3b82f6' : 'white'}"/>
                <text x="50" y="41" text-anchor="middle" dominant-baseline="middle"
                  font-family="Arial,sans-serif" font-size="31.2" font-weight="bold"
                  fill="${isSelected ? 'white' : 'black'}">${mapLabel}</text>
              </svg>`;
              const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgStr)}`;
              const scaledWidth = 150;
              const scaledHeight = 58.305;
              const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
              return (
                <Marker
                  key={listing.id}
                  position={{ lat: listing.lat, lng: listing.lng }}
                  onClick={() => {
                    setSelectedListing(listing);
                    if (!isDesktop) {
                      setShowMobileDetails(true);
                    }
                  }}
                  icon={{
                    url: iconUrl,
                    anchor: new google.maps.Point(scaledWidth / 2, scaledHeight),
                    scaledSize: new google.maps.Size(scaledWidth, scaledHeight)
                  }}
                />
              );
            })}

            {/* Search location marker - Native Marker, no spike */}
            {searchLocationPin && (() => {
              const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="31.5">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 8 12 20 12 20s12-12 12-20c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#0047FF" stroke="white" stroke-width="1"/>
              </svg>`;
              const pinScaledWidth = 31.2;
              const pinScaledHeight = 40.95;
              return (
                <Marker
                  position={searchLocationPin}
                  icon={{
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
                    anchor: new google.maps.Point(pinScaledWidth / 2, pinScaledHeight),
                    scaledSize: new google.maps.Size(pinScaledWidth, pinScaledHeight)
                  }}
                  clickable={false}
                />
              );
            })()}
          </GoogleMap>
          )}
        </div>
      </div>

      {/* Mobile: List view with filters */}
      <div className="md:hidden flex flex-1 flex-col overflow-hidden w-full">
        {/* Mobile Filters - Horizontal scrollable */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white overflow-x-auto relative bg-white">
          <div className="flex gap-2 px-4 py-3">
            <button
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium hover:border-gray-400 flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtri
            </button>
            {reservationType !== 'Mjesecna' && (
              <button
                onClick={() => toggleQuickFilter('instant-access')}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                  quickFilters.includes('instant-access')
                    ? 'bg-[#000000] text-white'
                    : 'border border-gray-300 text-gray-900 hover:border-gray-400'
                }`}
                translate="no"
                data-no-translate="true"
              >
                {'Instant'}
              </button>
            )}
            <button
              onClick={() => toggleQuickFilter('covered-garage')}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                quickFilters.includes('covered-garage')
                  ? 'bg-[#000000] text-white'
                  : 'border border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
            >
              Natkriveno/Garaža
            </button>
            <button
              onClick={() => toggleQuickFilter('self-park')}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                quickFilters.includes('self-park')
                  ? 'bg-[#000000] text-white'
                  : 'border border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
            >
              Self Park
            </button>
            <button
              onClick={() => setSortModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium hover:border-gray-400 flex-shrink-0 bg-white"
            >
              Poredaj po
            </button>
            <button
              onClick={() => setShowDestinationPicker(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 text-xs font-medium hover:border-gray-400 flex-shrink-0"
            >
              All Parking Options
            </button>
          </div>
        </div>

        {/* Results count */}
        {!showMobileDetails && (
          <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 relative">
            <span className="text-xs text-gray-600">{filteredListings.length} rezultata</span>
          </div>
        )}

        {/* Mobile List/Map - Hidden when details open */}
        {!showMobileDetails && (showMobileMap ? (
          <div className="flex-1 overflow-hidden w-full">
            {isLoaded ? (
              <GoogleMap
                zoom={15}
                center={mapCenter}
                mapContainerStyle={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 200px)' }}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
              >
                {filteredListings.map((listing) => {
                  const totalPrice = getDisplayPrice(listing, durationHours, reservationType);
                  const subtotal = parseFloat(totalPrice.toFixed(2));
                  const price = parseFloat((showTotalPrice ? subtotal + 0.99 + (subtotal * 0.05) : subtotal).toFixed(2));
                  const label = `€${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
                  const shouldShowIntegerOnly = showTotalPrice && (reservationType === 'Mjesečna' || price >= 100);
                  const mapLabel = shouldShowIntegerOnly ? `€${Math.floor(price)}` : label;
                  const isSelected = selectedListing?.id === listing.id;
                  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 115" width="48.75" height="56.0625">
                    <path d="M 50,8 C 73,8 92,22 92,38 C 92,54 73,68 58,70 Q 54,79 50,88 Q 46,79 42,70 C 27,68 8,54 8,38 C 8,22 27,8 50,8 Z"
                      fill="${isSelected ? '#3b82f6' : 'white'}" stroke="${isSelected ? '#1d4ed8' : 'black'}" stroke-width="2"/>
                    <text x="50" y="41" text-anchor="middle" dominant-baseline="middle"
                      font-family="Arial,sans-serif" font-size="31.2" font-weight="bold"
                      fill="${isSelected ? 'white' : 'black'}">${mapLabel}</text>
                  </svg>`;
                  const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgStr)}`;
                  const scaledWidth = 48.75;
                  const scaledHeight = 44.85;
                  return (
                    <Marker
                      key={listing.id}
                      position={{ lat: listing.lat, lng: listing.lng }}
                      onClick={() => {
                        setShowMobileMap(false);
                      }}
                      icon={{
                        url: iconUrl,
                        anchor: new google.maps.Point(scaledWidth / 2, scaledHeight),
                        scaledSize: new google.maps.Size(scaledWidth, scaledHeight)
                      }}
                    />
                  );
                })}

                {/* Search location marker - Blue pin */}
                {searchLocationPin && (() => {
                  const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="31.5">
                    <path d="M12 0C5.4 0 0 5.4 0 12c0 8 12 20 12 20s12-12 12-20c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#0047FF" stroke="white" stroke-width="1"/>
                  </svg>`;
                  const pinScaledWidth = 31.2;
                  const pinScaledHeight = 40.95;
                  return (
                    <Marker
                      position={searchLocationPin}
                      icon={{
                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
                        anchor: new google.maps.Point(pinScaledWidth / 2, pinScaledHeight),
                        scaledSize: new google.maps.Size(pinScaledWidth, pinScaledHeight)
                      }}
                      clickable={false}
                    />
                  );
                })()}
              </GoogleMap>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600">Loading map...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto w-full h-full">
            <div className="p-4 space-y-3">
            {filteredListings.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-gray-600 font-medium">Nema pronađenih parkirnih mjesta</p>
                  <p className="text-sm text-gray-500 mt-1">Pokušajte prilagoditi svoje filtre</p>
                </div>
              </div>
            ) : (
              (() => {
                const mobileBadgeMap = new Map<string, string>();

                if (filteredListings.length > 0) {
                  const validListings = filteredListings.filter(l => l.distance != null && l.pricePerHour != null && l.rating != null);
                  if (validListings.length > 0) {
                    const cheapest = validListings.reduce((min, curr) => {
                      const currPrice = getDisplayPrice(curr, durationHours, reservationType);
                      const minPrice = getDisplayPrice(min, durationHours, reservationType);
                      return currPrice < minPrice ? curr : min;
                    });
                    // Use real-time distance calculation for closest (should be at index 0 after sorting)
                    const refPoint = searchLocationPin || mapCenter;
                    const closest = validListings.reduce((min, curr) => {
                      const minDist = haversineKm(refPoint.lat, refPoint.lng, min.lat, min.lng);
                      const currDist = haversineKm(refPoint.lat, refPoint.lng, curr.lat, curr.lng);
                      return currDist < minDist ? curr : min;
                    });
                    const highestRated = validListings.reduce((max, curr) =>
                      curr.rating > max.rating ? curr : max
                    );

                    mobileBadgeMap.set(closest.id, 'Najkraća Šetnja');
                    if (cheapest.id !== closest.id) mobileBadgeMap.set(cheapest.id, 'Najbolja Vrijednost');
                    if (!mobileBadgeMap.has(highestRated.id)) mobileBadgeMap.set(highestRated.id, 'Najviše Ocijenjeno');
                  }
                }

                return filteredListings.map((listing) => {
                  const badgeText = mobileBadgeMap.get(listing.id);
                  const isSelected = selectedListing?.id === listing.id;
                  const liveRef = searchLocationPin || mapCenter;
                  const liveListing = { ...listing, distance: parseFloat(haversineKm(liveRef.lat, liveRef.lng, listing.lat, listing.lng).toFixed(1)) };
                  return (
                    <div
                      key={listing.id}
                      data-lot-id={listing.id}
                      className={`transition-all duration-200 rounded-2xl ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                    >
                      <ListingCard
                        listing={liveListing}
                        isSelected={isSelected}
                        onSelect={() => {
                          setSelectedListing(listing);
                          setShowMobileDetails(true);
                        }}
                        onBook={() => {
                          setSelectedListing(listing);
                          setShowMobileDetails(true);
                        }}
                        badgeText={badgeText}
                        checkoutUrl={buildCheckoutUrl(listing)}
                        durationHours={durationHours}
                        showFee={showTotalPrice}
                        hideDetailsButton={true}
                        spots={liveListing.spots}
                        reservationType={reservationType}
                      />
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      ))}
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

      {/* Mobile Details - Full screen replacement */}
      {showMobileDetails && selectedListing && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                    <span className="text-xs font-semibold tracking-tight leading-none text-white">P</span>
                  </div>
                </div>
                <div className="text-base font-black tracking-tight text-black">payparq</div>
              </div>
              {!isHubIdMode && (
                <button
                  onClick={() => setShowMobileDetails(false)}
                  className="text-gray-600 hover:text-gray-900 text-xl font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Details Content */}
          <div className="w-full bg-white overflow-y-auto flex-1">
            <div className="px-4 pb-6 space-y-0">
              {/* Photo Carousel */}
              {selectedListing.photos && selectedListing.photos.length > 0 && (
                <div className="relative -mx-4">
                  <div className="bg-gray-100 h-56 cursor-pointer relative overflow-hidden" onClick={() => selectedListing.photos && selectedListing.photos.length > 1 && setPhotoIndex((photoIndex + 1) % selectedListing.photos.length)}>
                    <img
                      src={selectedListing.photos[photoIndex] || selectedListing.photo}
                      alt={selectedListing.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Left Arrow */}
                    {selectedListing.photos && selectedListing.photos.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const photosArray = selectedListing.photos || [];
                          setPhotoIndex((photoIndex - 1 + photosArray.length) % photosArray.length);
                        }}
                        style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
                        className="bg-black/60 hover:bg-black/70 text-white rounded-full p-1.5 shadow-md transition-all inline-flex items-center justify-center leading-none w-8 h-8 z-10"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}

                    {/* Right Arrow */}
                    {selectedListing.photos && selectedListing.photos.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const photosArray = selectedListing.photos || [];
                          setPhotoIndex((photoIndex + 1) % photosArray.length);
                        }}
                        style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
                        className="bg-black/60 hover:bg-black/70 text-white rounded-full p-1.5 shadow-md transition-all inline-flex items-center justify-center leading-none w-8 h-8 z-10"
                      >
                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}

                    {/* PayParq Watermark */}
                    <div className="absolute bottom-4 right-2 text-gray-300 text-3xl font-black tracking-tight opacity-80 z-20">
                      payparq
                    </div>

                    {/* Photo Counter */}
                    {selectedListing.photos.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium z-20">
                        {photoIndex + 1}/{selectedListing.photos.length}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Size Restrictions - Clickable */}
              <button
                onClick={() => {
                  setShowVehicleModal(true);
                  setVehicleCheckResult(null);
                }}
                className="w-[calc(100%+40px)] px-4 py-4 bg-gray-50 hover:bg-gray-100 flex items-start gap-3 cursor-pointer transition-colors border-b border-gray-200 -mx-4 -mt-1"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Info className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Vehicle size restrictions may apply</p>
                    <p className="text-xs text-gray-600 mt-0.5">Provjerite da li Vam vozilo podliježi ograničenjima i dodatnim naknadama.</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </button>

              {/* Book Now Suggestion Widget */}
              <div className="flex-shrink-0 w-[calc(100%+40px)] px-4 py-4 bg-amber-100 flex items-start gap-3 border-b border-amber-300 -mx-4">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-900">Predlažemo da rezervirate odmah.</p>
                  <p className="text-xs text-gray-900 mt-0.5">Ovdje imamo samo {(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; if (s === 1) return '1 preostalo mjesto'; if (s <= 4) return `${s} preostala mjesta`; return `${s} preostalih mjesta`; })()} po ovoj cijeni!</p>
                </div>
              </div>

              {/* Location Information Widget */}
              <div className="flex-shrink-0 w-full bg-white border-b border-gray-200 overflow-hidden -ml-[15px]">
                {/* Black Badge Header */}
                <div className="font-bold text-white bg-black px-2 flex items-center justify-start" style={{ fontSize: '12px', paddingRight: '24px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '0 0 16px 0' }}>
                  Lokacija
                </div>

                {/* Location Content - Card Style */}
                <div className="px-8 py-6 space-y-3">
                  {/* Address */}
                  <p className="font-semibold text-gray-900" style={{ fontSize: '18px' }}>{selectedListing.address}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {selectedListing.reviews > 0 ? (
                      <>
                        <span className="text-gray-900">{selectedListing.rating}</span>
                        <span className="text-gray-900">({selectedListing.reviews})</span>
                      </>
                    ) : (
                      <span className="text-gray-900">Novi objekt</span>
                    )}
                  </div>

                  {/* Walking Distance */}
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="13" cy="3" r="2"/>
                      <path d="M11 6.5L8 12l3 1"/>
                      <path d="M13 6.5l1.5 3-3 2.5 1 5.5"/>
                      <path d="M11 14l-2 6"/>
                      <path d="M16 9l2 2"/>
                    </svg>
                    <span>{Math.round(selectedListing.distance * 12)} min ({selectedListing.distance.toFixed(1)} km)</span>
                  </div>
                </div>
              </div>

              {/* Reservation Details Widget */}
              <div className="flex-shrink-0 w-full bg-white border-b border-gray-200 py-3">
                <div className="px-4">
                  <p className="text-sm text-gray-700 font-semibold mb-4">Rezervacija parkinga</p>

                  {/* Date, Time and Price Row */}
                  <button
                    onClick={() => setShowPriceBreakdown(true)}
                    className="w-full text-left hover:opacity-70 transition-opacity pb-4 border-b border-gray-200 flex items-start justify-between -mt-1"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{formatTimeRange()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedListing?.features?.includes('in-out-allowed') ? 'Ulazi i izlazi dozvoljeni' : 'Nema ulaza i izlaza'}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end ml-2">
                      <p className="text-xl font-bold text-gray-900">€{totalPrice.toFixed(2)}</p>
                      <span className="text-xs text-gray-500 border-b border-gray-400 pb-0.5 -mt-1">Ukupno</span>
                    </div>
                  </button>
                </div>

                {/* Grey Box - Reservation Extended */}
                <div className="bg-gray-200 rounded-lg p-3 mt-3 px-4 -mx-4">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-900">Vaša rezervacija je produžena bez dodatnih troškova!</p>
                    <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                </div>

                {/* Yellow Spots Widget */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3 px-4 -mx-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-yellow-600 flex-shrink-0">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-700 font-semibold">{(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; if (s === 1) return '1 preostalo mjesto'; if (s <= 4) return `${s} preostala mjesta`; return `${s} preostalih mjesta`; })()}</p>
                      <p className="text-xs text-gray-600">po ovoj cijeni!</p>
                    </div>
                  </div>
                </div>

                {/* Green Box */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2 mt-3 px-4">
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
                <div className="pt-3">
                  <p className="text-xs text-gray-600">Sigurna plaćanja omogućuje Stripe</p>
                </div>
              </div>

              {/* Things You Should Know */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowThingsToKnow(!showThingsToKnow)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showThingsToKnow ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">Things You Should Know</p>
                </button>
                {showThingsToKnow && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    {selectedListing.thingsToKnow
                      ? selectedListing.thingsToKnow.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                      : <p className="text-gray-400">Nema dostupnih informacija.</p>}
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowAmenities(!showAmenities)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showAmenities ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">Amenities</p>
                </button>
                {showAmenities && (
                  <div className="mt-2 ml-6">
                    {selectedListing.features && selectedListing.features.length > 0
                      ? <AmenitiesChips selected={selectedListing.features} size="sm" />
                      : <p className="text-gray-400 text-xs">Nema dostupnih sadržaja.</p>}
                  </div>
                )}
              </div>

              {/* Access Hours */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowAccessHours(!showAccessHours)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showAccessHours ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">Access Hours</p>
                </button>
                {showAccessHours && (
                  <div className="space-y-1 mt-2 ml-6 text-xs text-gray-900 leading-relaxed">
                    {selectedListing.accessHours
                      ? selectedListing.accessHours.split('\n').map((line, i) => <p key={i}>{line}</p>)
                      : <p className="text-gray-400">Nema dostupnih informacija o radnom vremenu.</p>}
                  </div>
                )}
              </div>

              {/* Kako Radi */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowHowToRedeem(!showHowToRedeem)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showHowToRedeem ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">Kako Radi</p>
                </button>
                {showHowToRedeem && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    {selectedListing.howItWorks
                      ? selectedListing.howItWorks.split('\n').map((step, i) => <p key={i}>{step}</p>)
                      : <p className="text-gray-400">Nema dostupnih informacija.</p>}
                  </div>
                )}
              </div>

              {/* Getting There */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowGettingThere(!showGettingThere)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showGettingThere ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">Getting There</p>
                </button>
                {showGettingThere && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    {selectedListing.gettingThere
                      ? <p>{selectedListing.gettingThere}</p>
                      : <p className="text-gray-400">Nema dostupnih uputa za dolazak.</p>}
                  </div>
                )}
              </div>

              {/* Free Cancellation Policy */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowCancellationPolicy(!showCancellationPolicy)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showCancellationPolicy ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">Free Cancellation Policy</p>
                </button>
                {showCancellationPolicy && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    <p>U ovoj ustanovi imate vremena do trenutka kada vaša rezervacija počne otkazati svoje parkiranje za puni povrat novca. Rezervaciju možete otkazati na web stranici ili aplikaciji PayParq.</p>
                    <p>Ako imate problema sa svojom rezervacijom, a vrijeme je nakon početka, obratite se našim PayParq timom koji će rado pomoći ispraviti svaku situaciju!</p>
                  </div>
                )}
              </div>

              {/* Guaranteed Parking */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowGuaranteedParking(!showGuaranteedParking)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showGuaranteedParking ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">Guaranteed Parking by PayParq</p>
                </button>
                {showGuaranteedParking && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    <p>When you park and pay with PayParq, we guarantee you will have a spot to park in at the price you paid or your money back.</p>
                    <p>If you need help with your reservation, please contact us, and we'll do our best to make it right. Our world-class customer support team is available 7 days a week, 365 days a year.</p>
                    <p>For specifics, please refer to the PayParq Parking Guarantee.</p>
                  </div>
                )}
              </div>

              {/* 365-Day Customer Support */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowCustomerSupport(!showCustomerSupport)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showCustomerSupport ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">365-Day Customer Support</p>
                </button>
                {showCustomerSupport && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    <p>PayParq has your back. If you have any issues while parking, please call our customer support team immediately at <span className="font-semibold">+385 91 596 3139</span>. We're here 365 days a year, Daily, 7am – midnight.</p>
                    <p>For non-urgent issues shoot us an email at payparq@outlook.com. We'll get back you within 24 hours.</p>
                  </div>
                )}
              </div>

              {/* Company Credentials Footer */}
              <div className="pt-3 border-t border-gray-200 text-xs text-gray-600 text-center space-y-0.5 px-4 mb-4">
                <p>✓ Industry Leading Guarantees</p>
                <p>✓ PCI DSS Certified • SSL Secure</p>
              </div>
            </div>

            {/* Sticky Footer - Book Now Button */}
            <div className="sticky bottom-0 px-4 py-6 border-t border-gray-200 bg-white flex items-center justify-center">
              <a
                href={selectedListing ? buildCheckoutUrl(selectedListing) : '#'}
                className="block w-full px-5 py-5 bg-blue-500 text-white text-base font-bold rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Rezervirajte sada — €{totalPrice.toFixed(2)}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Destination Picker Widget */}
      {showDestinationPicker && (
        <DestinationPickerWidget
          onClose={() => setShowDestinationPicker(false)}
          defaultTab={destinationVenueType}
          onSelect={(venue, startTime, endTime) => {
            setMapCenter({ lat: venue.lat, lng: venue.lng });
            setSearchLocationPin({ lat: venue.lat, lng: venue.lng });
            setSearchLocation(venue.name);
            setStartTime(startTime);
            setEndTime(endTime);
          }}
        />
      )}

      {/* Arrival Date/Time Picker Modal */}
      {showArrivalPicker && (
        <ScrollableDateTimePicker
          value={arrivalDateTime}
          onChange={setArrivalDateTime}
          onConfirm={() => {
            if (arrivalDateTime) {
              setStartTime(arrivalDateTime);
              setShowArrivalPicker(false);
              setShowDeparturePicker(true);
            }
          }}
          onCancel={() => setShowArrivalPicker(false)}
          title="Kada dolazite?"
          subtitle="Odaberite datum i vrijeme dolaska"
          step="Korak 1 od 2"
        />
      )}

      {/* Departure Date/Time Picker Modal */}
      {showDeparturePicker && (
        <ScrollableDateTimePicker
          value={departureDateTime}
          onChange={setDepartureDateTime}
          onConfirm={() => {
            let finalDepartureTime = departureDateTime;
            if (!finalDepartureTime && arrivalDateTime) {
              const [date, time] = arrivalDateTime.split('T');
              const [year, month, day] = date.split('-').map(Number);
              let [hour, minute] = time.split(':').map(Number);
              hour += 3;
              if (hour >= 24) {
                hour -= 24;
                const nextDay = new Date(year, month - 1, day + 1);
                const ny = nextDay.getFullYear();
                const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
                const nd = String(nextDay.getDate()).padStart(2, '0');
                const nh = String(hour).padStart(2, '0');
                const nmm = String(minute).padStart(2, '0');
                finalDepartureTime = `${ny}-${nm}-${nd}T${nh}:${nmm}`;
              } else {
                const nh = String(hour).padStart(2, '0');
                const nmm = String(minute).padStart(2, '0');
                finalDepartureTime = `${date}T${nh}:${nmm}`;
              }
            }
            if (finalDepartureTime && arrivalDateTime) {
              setStartTime(arrivalDateTime);
              setEndTime(finalDepartureTime);
              setShowDeparturePicker(false);
            }
          }}
          onCancel={() => {
            setShowDeparturePicker(false);
            setShowArrivalPicker(true);
          }}
          title="Kada odlazite?"
          subtitle="Odaberite datum i vrijeme odlaska"
          step="Korak 2 od 2"
          initialDateTime={arrivalDateTime}
        />
      )}
    </div>
  );
}
