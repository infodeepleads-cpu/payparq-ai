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
import { ReservationTypeDropdown } from './ReservationTypeDropdown';
import { DestinationPickerWidget } from './DestinationPickerWidget';
import { ScrollableDateTimePicker } from './ScrollableDateTimePicker';
import { HomeBookingFlow } from './HomeBookingFlow';
import { useLocale } from './LocaleProvider';
import { MapPin, Star, Search, ChevronRight, Info, Users, Lock, Accessibility, Zap, ChevronDown, Ticket, CheckCircle, LogOut, X, Clock, AlertCircle, List, DollarSign, Globe } from 'lucide-react';
import { resolveScannerTruthPriceEuro, getViablePrice } from '@/lib/locationPricing';
import { AMENITIES_LIST, normalizeAmenityLabels } from '@/lib/amenities';
import { LOCALE_COOKIE_NAME } from '@/lib/locale';
import { AmenitiesChips } from './AmenitiesChips';

const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

const UNIVERSAL_THINGS_TO_KNOW = 'Zbog ograničenja veličine, ova lokacija ne može primiti kamionete i putničke kombije.\n\nZa egzotična vozila obratite se izravno servisu radi dostupnosti i cijene.\n\nKamioni, kombiji i veliki SUV-ovi smatraju se super velikim i podliježu dodatnim naknadama na licu mjesta.';

const TRANSLATIONS = {
  'Satna/dnevna': { en: 'Hourly/Daily', hr: 'Satna/dnevna' },
  'Kamo ideš?': { en: 'Where are you going?', hr: 'Kamo ideš?' },
  'Trenutna lokacija': { en: 'Current Location', hr: 'Trenutna lokacija' },
  'Natkriveno/Garaža': { en: 'Covered/Garage', hr: 'Natkriveno/Garaža' },
  'Poredaj po Udaljenosti': { en: 'Sort by Distance', hr: 'Poredaj po Udaljenosti' },
  'Poredaj po Cijeni': { en: 'Sort by Price', hr: 'Poredaj po Cijeni' },
  'Poredaj po Relevantnosti': { en: 'Sort by Relevance', hr: 'Poredaj po Relevantnosti' },
  'Novi objekt': { en: 'New listing', hr: 'Novi objekt' },
  'Besplatno otkazivanje': { en: 'Free cancellation', hr: 'Besplatno otkazivanje' },
  'Garancija Mjesta': { en: 'Space guarantee', hr: 'Garancija Mjesta' },
  'Kako radi': { en: 'How it works', hr: 'Kako radi' },
  'Rezervirajte sada': { en: 'Book now', hr: 'Rezervirajte sada' },
  'Nema pronađenih parkirnih mjesta': { en: 'No parking available', hr: 'Nema pronađenih parkirnih mjesta' },
  'Nema dostupnih mjesta blizu tog područja': { en: 'No available spaces near that area', hr: 'Nema dostupnih mjesta blizu tog područja' },
  'Poredaj po': { en: 'Sort by', hr: 'Poredaj po' },
  'Najkraća Šetnja': { en: 'Shortest Walk', hr: 'Najkraća Šetnja' },
  'mjesta': { en: 'spaces', hr: 'mjesta' },
  'preostalo mjesto': { en: 'remaining space', hr: 'preostalo mjesto' },
  'preostala mjesta': { en: 'remaining spaces', hr: 'preostala mjesta' },
  'preostalih mjesta': { en: 'remaining spaces', hr: 'preostalih mjesta' },
  'Instant Access': { en: 'Instant Access', hr: 'Instant Access' },
  'Self Park': { en: 'Self Park', hr: 'Self Park' },
  'All Parking Options': { en: 'All Parking Options', hr: 'All Parking Options' },
  'Filters': { en: 'Filters', hr: 'Filteri' },
  'Show total price with fees': { en: 'Show total price with fees', hr: 'Prikaži ukupnu cijenu s naknadama' },
  'Pokušajte prilagoditi svoje filtre': { en: 'Try adjusting your filters', hr: 'Pokušajte prilagoditi svoje filtre' },
  'Pokušajte sa bližom lokacijom': { en: 'Try a closer location, different dates, or times', hr: 'Pokušajte sa bližom lokacijom, drugačijim datumima ili vremenima' },
  'Učitavanje parkinga...': { en: 'Loading parking...', hr: 'Učitavanje parkinga...' },
  'Vaša rezervacija je produžena bez dodatnih troškova!': { en: 'Your reservation has been extended at no extra cost!', hr: 'Vaša rezervacija je produžena bez dodatnih troškova!' },
  'Things You Should Know': { en: 'Things You Should Know', hr: 'Važne informacije' },
  'Valet': { en: 'Valet', hr: 'Valet' },
  'Prijevoz': { en: 'Shuttle', hr: 'Prijevoz' },
  'EV Punjenje': { en: 'EV Charging', hr: 'EV Punjenje' },
  'Pristup invalidskim kolicima': { en: 'Wheelchair Accessible', hr: 'Pristup invalidskim kolicima' },
  'Rampa': { en: 'Ramp', hr: 'Rampa' },
  'Ulazak/Izlazak': { en: 'In/Out Access', hr: 'Ulazak/Izlazak' },
  'Punjenje goriva': { en: 'Fuel Refill', hr: 'Punjenje goriva' },
  'Garaža': { en: 'Garage', hr: 'Garaža' },
  'Samoparkirani': { en: 'Self-Park', hr: 'Samoparkirani' },
  'Povratak': { en: 'Back', hr: 'Povratak' },
  'Show total price': { en: 'Show total price', hr: 'Prikaži ukupnu cijenu' },
  'Odustani': { en: 'Cancel', hr: 'Odustani' },
  'Vrijeme': { en: 'Time', hr: 'Vrijeme' },
  'Primijeni': { en: 'Apply', hr: 'Primijeni' },
  'Zračna Luka': { en: 'Airport', hr: 'Zračna Luka' },
  'Gradovi': { en: 'Cities', hr: 'Gradovi' },
  'Eventovi': { en: 'Events', hr: 'Eventovi' },
  'Parking near airports': { en: 'Parking near airports', hr: 'Parking near airports' },
  'Parking in city centers': { en: 'Parking in city centers', hr: 'Parking in city centers' },
  'Parking near event venues': { en: 'Parking near event venues', hr: 'Parking near event venues' },
  'Ulazi i izlazi dozvoljeni': { en: 'Entrance and exit allowed', hr: 'Ulazi i izlazi dozvoljeni' },
  'Nema ulaza i izlaza': { en: 'No entrance and exit', hr: 'Nema ulaza i izlaza' },
  'Sigurna plaćanja omogućuje Stripe': { en: 'Secure payments powered by Stripe', hr: 'Sigurna plaćanja omogućuje Stripe' },
  'Rezervacija parkinga': { en: 'Parking Reservation', hr: 'Rezervacija parkinga' },
  'Nema dostupnih sadržaja.': { en: 'No amenities available.', hr: 'Nema dostupnih sadržaja.' },
  'Amenities': { en: 'Amenities', hr: 'Sadržaji' },
  'Vehicle size restrictions may apply': { en: 'Vehicle size restrictions may apply', hr: 'Vehicle size restrictions may apply' },
  'Provjerite da li Vam vozilo podliježe ograničenjima i dodatnim naknadama.': { en: 'Check if your vehicle is subject to restrictions and additional fees.', hr: 'Provjerite da li Vam vozilo podliježe ograničenjima i dodatnim naknadama.' },
  'Zatvori': { en: 'Close', hr: 'Zatvori' },
  'Access Hours': { en: 'Access Hours', hr: 'Vremenske granice' },
  'Getting There': { en: 'Getting There', hr: 'Kako doći' },
  'Free Cancellation Policy': { en: 'Free Cancellation Policy', hr: 'Politika besplatnog otkazivanja' },
  'Nema dostupnih informacija.': { en: 'No information available.', hr: 'Nema dostupnih informacija.' },
  'Nema dostupnih informacija o radnom vremenu.': { en: 'No schedule information available.', hr: 'Nema dostupnih informacija o radnom vremenu.' },
  'Nema dostupnih uputa za dolazak.': { en: 'No getting there instructions available.', hr: 'Nema dostupnih uputa za dolazak.' },
  'Popis': { en: 'List', hr: 'Popis' },
  'Karta': { en: 'Map', hr: 'Karta' },
  'Uredi pretragu': { en: 'Edit search', hr: 'Uredi pretragu' },
  'Vrsta rezervacije': { en: 'Reservation type', hr: 'Vrsta rezervacije' },
  'Use current location': { en: 'Use current location', hr: 'Koristi trenutnu lokaciju' },
  'rezultata': { en: 'results', hr: 'rezultata' },
  'Lokacija': { en: 'Location', hr: 'Lokacija' },
  'Guaranteed Parking by PayParq': { en: 'Guaranteed Parking by PayParq', hr: 'Garantirana parking sa PayParq-om' },
  '365-Day Customer Support': { en: '365-Day Customer Support', hr: '365-dnevna podrška klijentima' },
  'Pregled cijene': { en: 'Price Breakdown', hr: 'Pregled cijene' },
  'Mjesečna tarifa': { en: 'Monthly Rate', hr: 'Mjesečna tarifa' },
  'Cijena parkinga': { en: 'Parking Price', hr: 'Cijena parkinga' },
  'Naknada za uslugu': { en: 'Service Fee', hr: 'Naknada za uslugu' },
  'Naknada za uslugu uključuje: Jamstvo rezerviranog mjesta, prioritetnu podršku, rješavanje sporova i ostalo.': { en: 'Service Fee includes: Guaranteed parking space, priority support, dispute resolution and more.', hr: 'Naknada za uslugu uključuje: Jamstvo rezerviranog mjesta, prioritetnu podršku, rješavanje sporova i ostalo.' },
  'Ukupno': { en: 'Total', hr: 'Ukupno' },
};

const t = (key: string, locale: 'en' | 'hr'): string => {
  const trans = TRANSLATIONS[key as keyof typeof TRANSLATIONS];
  return trans ? trans[locale] : key;
};

const translateText = (text: string, locale: 'en' | 'hr'): string => {
  if (locale === 'hr') return text;
  const commonPhrases: Record<string, string> = {
    'Vozila parkiraju lagano ukoso redom s lijeve strane od ulaza': 'Vehicles park slowly at an angle in a row from the left side of the entrance',
    'Osoblje se nalazi u jutarnjoj smjeni, u špici sezone na licu mjesta': 'Staff is available during morning shifts, in peak season on-site',
    'Parking uvijek otvoren': 'Parking always open',
    'Pokažite službeniku svoju PayParq parkirnu propusnicu, ispisanu ili na mobilnom uređaju': 'Show the attendant your PayParq parking pass, printed or on your mobile device',
    'Samo uđite ako nema nikoga': 'Only enter if no one is there',
    'Odvezite se kad budete spremni otići': 'Drive away when you\'re ready to leave',
    'Prvi parking, skreni lijevo pored Ulaza u Restoran Burin': 'First parking, turn left next to the Restaurant Burin entrance',
    'Odmah prvi se lijeve strane ulaz': 'Immediately first on the left side entrance',
    'Pratite Google Maps': 'Follow Google Maps',
    'U ovoj ustanovi imate vremena do trenutka kada vaša rezervacija počne otkazati svoje parkiranje za puni povrat novca': 'At this facility, you have until your reservation starts to cancel your parking for a full refund',
    'Rezervaciju možete otkazati na web stranici ili aplikaciji PayParq': 'You can cancel your reservation on the PayParq website or app',
    'Ako imate problema sa svojom rezervacijom, a vrijeme je nakon početka, obratite se našim PayParq timom koji će rado pomoći ispraviti svaku situaciju': 'If you have problems with your reservation after it starts, contact our PayParq team who will be happy to help fix any situation',
    'Nema dostupnih informacija o radnom vremenu.': 'No access hours information available.',
    'Zbog ograničenja veličine, ova lokacija ne može primiti kamionete i putničke kombije.': 'Due to size restrictions, this location cannot accommodate trucks and commercial vans.',
    'Za egzotična vozila obratite se izravno servisu radi dostupnosti i cijene.': 'For exotic vehicles, contact the facility directly for availability and pricing.',
    'Kamioni, kombiji i veliki SUV-ovi smatraju se super velikim i podliježu dodatnim naknadama na licu mjesta.': 'Trucks, vans and large SUVs are considered oversized and are subject to additional on-site fees.',
    'Unesite adresu lokacije u navigaciju. Ulaz je označen znakom za parkiranje.': 'Enter the location address in your navigation. The entrance is marked with a parking sign.',
    'pon – pet: 6:00 – 23:00': 'Mon - Fri: 6:00 AM - 11:00 PM',
    'sub – ned: 7:00 – 23:00': 'Sat - Sun: 7:00 AM - 11:00 PM',
    'Valet usluga': 'Valet Service',
    'Garaža - Natkrivena': 'Covered Garage',
    'Osoblje na licu mjesta': 'On-site Staff',
    'EV punjenje': 'EV Charging',
    'Pristup invalidskim kolicima': 'Wheelchair Accessible',
    'U ovoj ustanovi imate vremena do trenutka kada vaša rezervacija počne otkazati svoje parkiranje za puni povrat novca. Rezervaciju možete otkazati na web stranici ili aplikaciji PayParq.': 'At this facility, you have until your reservation starts to cancel your parking for a full refund. You can cancel your reservation on the PayParq website or app.',
    'Ako imate problema sa svojom rezervacijom, a vrijeme je nakon početka, obratite se našim PayParq timom koji će rado pomoći ispraviti svaku situaciju!': 'If you have problems with your reservation after it starts, contact our PayParq team who will be happy to help fix any situation!',
    'Nema dostupnih informacija.': 'No information available.',
    'Nema dostupnih uputa za dolazak.': 'No getting there instructions available.',
    'Kako radi': 'How it works',
  };
  let result = text;
  Object.entries(commonPhrases).forEach(([hr, en]) => {
    result = result.split(hr).join(en);
  });
  return result;
};

const getSpacesText = (count: number, locale: 'en' | 'hr'): string => {
  if (locale === 'en') {
    return count === 1 ? '1 space' : `${count} spaces`;
  }
  // Croatian pluralization
  if (count === 1) return '1 preostalo mjesto';
  if (count <= 4) return `${count} preostala mjesta`;
  return `${count} preostalih mjesta`;
};

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
  dateConfigs?: Record<string, { priceHourly?: number; priceDaily?: number; priceMonthly?: number; priceMode?: 'auto' | 'manual' }>;
}

export function SearchPage() {
  const { locale, setLocale } = useLocale();
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
  const [mapCenter, setMapCenter] = useState({ lat: 43.5388, lng: 16.2978 }); // Split Airport (SPU Kaštela)
  const [selectedListing, setSelectedListing] = useState<Parking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const isAppRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/app');
  const [showMobileMap, setShowMobileMap] = useState(isAppRoute);
  const [loading, setLoading] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [reservationType, setReservationType] = useState('Satna/dnevna');
  const [searchLocation, setSearchLocationState] = useState<string>('');
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [searchLocationPin, setSearchLocationPin] = useState<{ lat: number; lng: number } | null>(null);
  const userGpsRef = useRef<{ lat: number; lng: number } | null>(null);
  const [noResultsForLocation, setNoResultsForLocation] = useState<string | null>(null);
  const [nearbyCitiesWithParking, setNearbyCitiesWithParking] = useState<{ name: string; lat: number; lng: number; count: number; distanceKm: number }[]>([]);
  const [bookingSource, setBookingSource] = useState('platform');
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
  const [showTotalPrice, setShowTotalPrice] = useState(false);
  const [allParkingDropdownOpen, setAllParkingDropdownOpen] = useState(false);
  const [showMobileSearchEdit, setShowMobileSearchEdit] = useState(false);
  const [datePickerResetTrigger, setDatePickerResetTrigger] = useState(0);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const allParkingDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const filterModalRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'price' | 'price-low' | 'price-high' | 'rating' | 'walk' | 'value'>('distance');
  const [userData, setUserData] = useState<{ email: string; phone: string; plate: string } | null>(null);

  // Load user data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('payparq_user_data');
    if (saved) {
      try {
        setUserData(JSON.parse(saved));
      } catch {}
    }
  }, []);


  // Debug: log sortBy changes
  useEffect(() => {
    console.log('=== sortBy changed to:', sortBy);
  }, [sortBy]);

  // Focus location input and show predictions when mobile search edit modal opens
  useEffect(() => {
    if (showMobileSearchEdit) {
      setSearchLocation('');
      setTimeout(() => {
        locationInputRef.current?.focus();
        setShowPredictions(true);
        if (nearbyPlaces.length === 0) {
          fetchNearbyPlaces();
        }
      }, 100);
    }
  }, [showMobileSearchEdit]);

  const [recentSearches, setRecentSearches] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<{ name: string; lat: number; lng: number; type: string }[]>([]);
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const [translatedContent, setTranslatedContent] = useState<{ thingsToKnow?: string; accessHours?: string; gettingThere?: string } | null>(null);

  // Translate fetched Croatian listing content to English via API
  useEffect(() => {
    if (!selectedListing || locale !== 'en') {
      setTranslatedContent(null);
      return;
    }
    const textsToTranslate = [
      selectedListing.thingsToKnow || '',
      selectedListing.accessHours || '',
      selectedListing.gettingThere || '',
    ];
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: textsToTranslate, target: 'en' }),
    })
      .then(r => r.json())
      .then((data: { translations?: Array<string | null> }) => {
        const [ttk, ah, gt] = data.translations ?? [];
        setTranslatedContent({
          thingsToKnow: ttk || selectedListing.thingsToKnow,
          accessHours: ah || selectedListing.accessHours,
          gettingThere: gt || selectedListing.gettingThere,
        });
      })
      .catch(() => setTranslatedContent(null));
  }, [selectedListing?.id, locale]);

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
    const useCalendar = dayConfig?.priceMode === 'manual';
    return {
      hourly: useCalendar ? (dayConfig?.priceHourly ?? listing.baseHourlyRate ?? listing.pricePerHour) : (listing.baseHourlyRate ?? listing.pricePerHour),
      daily:  useCalendar ? (dayConfig?.priceDaily  ?? listing.baseDailyRate  ?? listing.pricePerDay)  : (listing.baseDailyRate  ?? listing.pricePerDay),
    };
  };

  const getDisplayPrice = (listing: Parking, duration: number, type: string): number => {
    if (type === 'Mjesečna') {
      return listing.pricePerMonth || listing.pricePerHour;
    }
    const hourlyTotal = listing.pricePerHour * duration;
    if (!listing.pricePerDay) return hourlyTotal;
    const fullDays = Math.floor(duration / 24);
    const remainingHours = duration % 24;
    const ceilDaysTotal = listing.pricePerDay * Math.ceil(duration / 24);
    const mixedTotal = fullDays > 0
      ? listing.pricePerDay * fullDays + listing.pricePerHour * remainingHours
      : hourlyTotal;
    return Math.min(hourlyTotal, ceilDaysTotal, mixedTotal);
  };

  const subtotal = selectedListing ? (() => {
    const rates = resolveRatesForDate(selectedListing, startTime);
    const liveListing = { ...selectedListing, pricePerHour: rates.hourly, pricePerDay: rates.daily };
    return parseFloat(getDisplayPrice(liveListing, durationHours, reservationType).toFixed(2));
  })() : 0;
  const serviceFee = Math.min(1.99, parseFloat((0.99 + subtotal * 0.10).toFixed(2)));
  const totalPrice = parseFloat((subtotal + serviceFee).toFixed(2));

  const formatDuration = () => {
    const h = durationHours;
    if (h < 24) {
      // Croatian grammar: 1=sat, 2-4=sata, 5+=sati (but 11-14=sati, 22-24=sata, 32-34=sata, etc.)
      const lastDigit = h % 10;
      const lastTwoDigits = h % 100;
      let form = 'sati';
      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        form = 'sati'; // 11-14 always use 'sati'
      } else if (h === 1) {
        form = 'sat';
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        form = 'sata'; // 2-4, 22-24, 32-34, etc.
      }
      return `${h} ${form}`;
    }
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
    const total = sub; // Always pass base price; checkout adds fee itself

    // Convert naive local datetimes to UTC ISO so the server doesn't misread them as UTC
    let checkoutStartTime = parseLocalDateTime(startTime).toISOString();
    let checkoutEndTime = parseLocalDateTime(endTime).toISOString();
    if (reservationType === 'Mjesečna') {
      const start = parseLocalDateTime(startTime);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
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
      ph: Math.round(rates.hourly * 100).toString(),
      source: bookingSource,
      ...(rates.daily ? { pd: Math.round(rates.daily * 100).toString() } : {}),
      ...(listing.pricePerMonth ? { pm: Math.round(listing.pricePerMonth * 100).toString() } : {}),
      ...(listing.display_id ? { display_id: listing.display_id } : {}),
    });
    return `/checkout?${params.toString()}`;
  };
  // ---------------------------

  const parkingCategories = [
    { id: 'airport', label: 'Zračna Luka', description: 'Parking near airports' },
    { id: 'city', label: 'Gradovi', description: 'Parking in city centers' },
    { id: 'event', label: 'Eventovi', description: 'Parking near event venues' },
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

  const setSearchLocation = (value: string | undefined) => {
    setSearchLocationState(value || '');
    if (value && value !== 'Current Location' && value !== 'Trenutna lokacija') {
      setUsingCurrentLocation(false);
    }
  };

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [parkingType, setParkingType] = useState<'all' | 'self-park' | 'garage'>('all');
  const [vehicleType, setVehicleType] = useState('compact');

  // Auto-request current location on mount, re-run when URL params change
  useEffect(() => {
    // Check for prefilled location from URL params (e.g. from landing pages)
    const paramLat = parseFloat(searchParams.get('lat') || '');
    const paramLng = parseFloat(searchParams.get('lng') || '');
    const paramName = searchParams.get('name');
    const paramStart = searchParams.get('start');
    const paramEnd = searchParams.get('end');
    const paramSource = searchParams.get('source') || 'platform';

    if (paramLat && paramLng && paramName) {
      if (paramStart) setStartTime(paramStart);
      if (paramEnd) setEndTime(paramEnd);
      setBookingSource(paramSource);
      setSearchLocationState(paramName);

      // Geocode the name to get authoritative coordinates from Google — prevents pins in the sea
      if (window.google?.maps?.Geocoder) {
        new window.google.maps.Geocoder().geocode({ address: paramName }, (results, status) => {
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            setMapCenter({ lat: loc.lat(), lng: loc.lng() });
            setSearchLocationPin({ lat: loc.lat(), lng: loc.lng() });
          } else {
            setMapCenter({ lat: paramLat, lng: paramLng });
            setSearchLocationPin({ lat: paramLat, lng: paramLng });
          }
          setLocationReady(true);
        });
      } else {
        setMapCenter({ lat: paramLat, lng: paramLng });
        setSearchLocationPin({ lat: paramLat, lng: paramLng });
        setLocationReady(true);
      }
      return;
    }

    if (paramLat || paramLng || paramName) return; // partial params, don't fall through

    // No automatic geolocation — default to Split Airport
    setMapCenter({ lat: 43.5388, lng: 16.2978 });
    setLocationReady(true);
  }, [searchParams, isLoaded]);


  // Handle locale from URL parameter (for quick reservation links)
  useEffect(() => {
    const urlLocale = searchParams.get('locale') as 'en' | 'hr' | null;
    if (urlLocale && (urlLocale === 'en' || urlLocale === 'hr') && urlLocale !== locale) {
      // Set cookie and trigger a reload to apply the locale throughout the app
      document.cookie = `${LOCALE_COOKIE_NAME}=${urlLocale}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    }
  }, [searchParams, locale]);

  // Reset date picker when modal opens
  useEffect(() => {
    if (showMobileSearchEdit) {
      setDatePickerResetTrigger(t => t + 1);
    }
  }, [showMobileSearchEdit]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const CURRENT_LOCATION_NAMES = ['Current Location', 'Trenutna lokacija', 'current location', 'trenutna lokacija'];
        const filtered = parsed.filter((s: any) => !CURRENT_LOCATION_NAMES.includes(s.name)).slice(0, 5);
        setRecentSearches(filtered);
        // Write cleaned list back to localStorage to permanently remove stale entries
        localStorage.setItem('recentSearches', JSON.stringify(filtered));
      } catch {
        localStorage.removeItem('recentSearches');
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

              if (dayConfig && dayConfig.priceMode === 'manual') {
                return {
                  hourly: dayConfig.priceHourly ?? pricePerHour,
                  daily: dayConfig.priceDaily ?? pricePerDay,
                  monthly: dayConfig.priceMonthly ?? pricePerMonth,
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

            const accessHoursText = (metadata.access_hours as string | undefined) || 'pon – pet: 6:00 – 23:00\nsub – ned: 7:00 – 23:00';
            const thingsToKnowText = (metadata.things_to_know as string | undefined) || UNIVERSAL_THINGS_TO_KNOW;
            const gettingThereText = (metadata.getting_there as string | undefined) || 'Unesite adresu lokacije u navigaciju. Ulaz je označen znakom za parkiranje.';
            const howItWorksText = (metadata.how_it_works as string | undefined) || '1. Pokažite službeniku svoju PayParq parkirnu propusnicu, ispisanu ili na mobilnom uređaju\n2. Samo uđite ako nema nikoga\n3. Odvezite se kad budete spremni otići';

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
              accessHours: locale === 'en' ? translateText(accessHoursText, locale) : accessHoursText,
              amenities: (metadata.amenities as string | undefined) || 'Valet usluga, Garaža - Natkrivena, Osoblje na licu mjesta, EV punjenje, Pristup invalidskim kolicima',
              thingsToKnow: locale === 'en' ? translateText(thingsToKnowText, locale) : thingsToKnowText,
              gettingThere: locale === 'en' ? translateText(gettingThereText, locale) : gettingThereText,
              howItWorks: locale === 'en' ? translateText(howItWorksText, locale) : howItWorksText,
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
            setSelectedListing(displayList[1] ?? displayList[0]);
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

    // Listen for pricing updates from calendar
    const handlePricingUpdate = () => {
      fetchListings();
    };
    window.addEventListener('pricing-updated', handlePricingUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('pricing-updated', handlePricingUpdate);
    };
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

  // Initialize Places service and handle location search - immediate, no debounce
  useEffect(() => {
    if (!isLoaded || !showPredictions) return;

    if (searchLocation.length > 0 && !usingCurrentLocation) {
      const sessionToken = new google.maps.places.AutocompleteSessionToken();
      const service = new google.maps.places.AutocompleteService();

      service.getPlacePredictions(
        {
          input: searchLocation,
          sessionToken,
          language: locale,
          locationBias: {
            center: { lat: 45.5, lng: 15.9 },
            radius: 150000 // ~150km radius covering Split & Zagreb
          }
        }
      ).then((response) => {
        const sortedPredictions = (response.predictions || []).sort((a, b) => {
          const aTypes = a.types || [];
          const bTypes = b.types || [];

          // Priority: city > airport > other venues
          const getCityPriority = (types: string[]) => {
            if (types.includes('locality') || types.includes('administrative_area_level_1')) return 0; // City
            if (types.includes('airport')) return 1; // Airport
            if (types.includes('stadium') || types.includes('point_of_interest') || types.includes('establishment')) return 2; // Venues
            return 3; // Other
          };

          const aPriority = getCityPriority(aTypes);
          const bPriority = getCityPriority(bTypes);
          return aPriority - bPriority;
        });

        setPredictions(sortedPredictions);
      }).catch((error) => {
        console.error('Autocomplete error:', error);
        setPredictions([]);
      });
    } else if (searchLocation.length === 0) {
      setPredictions([]);
    }
  }, [searchLocation, showPredictions, isLoaded]);

  const handleSelectPrediction = (placeId: string, mainText: string) => {
    // Validate mainText - must have at least 2 characters
    const cleanText = mainText?.trim() || '';
    if (cleanText.length < 2) return;

    setSearchLocation(cleanText);
    setShowPredictions(false);

    // Only close mobile modal on desktop (not on mobile - user needs to click Primijeni)
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      setShowMobileSearchEdit(false);
    }

    // Blur the input to prevent dropdown from reopening
    const input = document.querySelector('input[placeholder="Search location..."]') as HTMLInputElement;
    if (input) input.blur();

    // Get coordinates using Geocoding API — use placeId (exact match) not address text (ambiguous)
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        setMapCenter({ lat, lng });
        setSearchLocationPin({ lat, lng });
        addToRecentSearches(mainText || '', lat, lng);

        // Check if any parking lots are within 30km of selected location
        setListings(prev => {
          const RADIUS_KM = 30;
          const nearby = prev.filter(l => haversineKm(lat, lng, l.lat, l.lng) <= RADIUS_KM);

          if (nearby.length === 0 && prev.length > 0) {
            // Extract just the city name (first part before comma or full text if no comma)
            const cityName = mainText.split(',')[0].trim();
            setNoResultsForLocation(cityName);

            // Find unique city clusters from available lots using reverse geocoding
            const geocoder = new google.maps.Geocoder();
            const cityMap: Map<string, { lat: number; lng: number; count: number }> = new Map();
            let processed = 0;

            prev.forEach((lot, idx) => {
              // Group by proximity first
              let foundCluster = false;
              cityMap.forEach((city, key) => {
                if (haversineKm(lot.lat, lot.lng, city.lat, city.lng) < 20) {
                  cityMap.set(key, { ...city, count: city.count + 1 });
                  foundCluster = true;
                }
              });

              if (!foundCluster) {
                // Use address as city name, extract the second-to-last part (usually city)
                const parts = lot.address.split(',').map(p => p.trim()).filter(p => p && !/^\d+$/.test(p) && !/^\d{4,}/.test(p.trim()));
                const cityName = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || lot.name);
                const cleanCityName = cityName.replace(/^\d+\s+/, '').trim();

                // Only add if it's not pure digits and has actual letters
                if (cleanCityName && !cityMap.has(cleanCityName) && /[a-zčšž]/i.test(cleanCityName)) {
                  cityMap.set(cleanCityName, { lat: lot.lat, lng: lot.lng, count: 1 });
                }
              }
            });

            const suggestions = Array.from(cityMap.entries())
              .map(([name, data]) => ({
                name,
                lat: data.lat,
                lng: data.lng,
                count: data.count,
                distanceKm: Math.round(haversineKm(lat, lng, data.lat, data.lng)),
              }))
              .filter(s => s.name && s.name.length > 2 && !/^\d+$/.test(s.name) && !/^\d{4,}/.test(s.name) && !/^\d+\s+/.test(s.name))
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .slice(0, 6);

            setNearbyCitiesWithParking(suggestions);
          } else {
            setNoResultsForLocation(null);
            setNearbyCitiesWithParking([]);
          }

          return prev;
        });
      } else {
        // Geocoding failed - try to find a nearby parking lot and use that as reference
        const nearbyLots = listings.filter(l => {
          if (!l.lat || !l.lng) return false;
          // Check if lot address contains the search text (e.g. "Split" in address)
          return l.address && l.address.toLowerCase().includes(cleanText.toLowerCase());
        });

        if (nearbyLots.length > 0) {
          // Use the first nearby lot's coordinates as reference
          const lot = nearbyLots[0];
          setMapCenter({ lat: lot.lat, lng: lot.lng });
          setSearchLocationPin({ lat: lot.lat, lng: lot.lng });
          setSearchLocation(cleanText);
        } else {
          setNoResultsForLocation(cleanText);
          setNearbyCitiesWithParking([]);
        }
      }
    });
  };

  const addToRecentSearches = (name: string, lat: number, lng: number) => {
    // Don't save current location to history
    if (name === 'Current Location' || name === 'Trenutna lokacija' || !name.trim()) return;
    const updated = [{ name, lat, lng }, ...recentSearches.filter(s => s.name !== name)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleCurrentLocation = () => {
    const gps = userGpsRef.current;
    if (gps) {
      setMapCenter(gps);
      setSearchLocationPin(gps);
      setSearchLocationState(t('Trenutna lokacija', locale));
      setUsingCurrentLocation(true);
      setShowPredictions(false);
    } else if (navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        userGpsRef.current = { lat, lng };
        setMapCenter({ lat, lng });
        setSearchLocationPin({ lat, lng });
        setSearchLocationState('');
        setUsingCurrentLocation(true);
        setShowPredictions(false);
        setGeoLoading(false);
      }, () => {
        setGeoLoading(false);
      });
    }
  };

  const handleRefreshLocation = () => {
    if (navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        userGpsRef.current = { lat, lng };
        setMapCenter({ lat, lng });
        setSearchLocationPin({ lat, lng });
        setSearchLocationState('');
        setUsingCurrentLocation(true);
        setShowPredictions(false);
        setGeoLoading(false);
      }, () => {
        setGeoLoading(false);
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

    // Distance filter - only show lots within 50km of search location
    const ref = searchLocationPin || mapCenter;
    filtered = filtered.filter((l) => haversineKm(ref.lat, ref.lng, l.lat, l.lng) <= 50);

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
      case 'price-low':
      case 'cijena':
        sorted.sort((a, b) => {
          const aPricePerUnit = getDisplayPrice(a, durationHours, reservationType);
          const bPricePerUnit = getDisplayPrice(b, durationHours, reservationType);
          const aCalc = reservationType === 'Mjesečna' ? aPricePerUnit : aPricePerUnit * durationHours;
          const bCalc = reservationType === 'Mjesečna' ? bPricePerUnit : bPricePerUnit * durationHours;
          const aTotal = aCalc + Math.min(1.99, 0.99 + (aCalc * 0.10));
          const bTotal = bCalc + Math.min(1.99, 0.99 + (bCalc * 0.10));
          return aTotal - bTotal;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const aPricePerUnit = getDisplayPrice(a, durationHours, reservationType);
          const bPricePerUnit = getDisplayPrice(b, durationHours, reservationType);
          const aCalc = reservationType === 'Mjesečna' ? aPricePerUnit : aPricePerUnit * durationHours;
          const bCalc = reservationType === 'Mjesečna' ? bPricePerUnit : bPricePerUnit * durationHours;
          const aTotal = aCalc + Math.min(1.99, 0.99 + (aCalc * 0.10));
          const bTotal = bCalc + Math.min(1.99, 0.99 + (bCalc * 0.10));
          return bTotal - aTotal;
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
    // Don't include showMobileDetails - fixed inset-0 overlay already prevents background interaction
    // Also prevents scroll issues in details content
    const isModalOpen = allParkingDropdownOpen || filterModalOpen || sortModalOpen || showDestinationPicker || showPredictions || showMobileSearchEdit || showArrivalPicker || showDeparturePicker;

    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-scrollable]')) return;
      e.preventDefault();
    };

    if (isModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
      document.body.style.paddingRight = '';
    };
  }, [allParkingDropdownOpen, filterModalOpen, sortModalOpen, showDestinationPicker, showPredictions, showMobileSearchEdit, showArrivalPicker, showDeparturePicker]);

  useEffect(() => {
    setPhotoIndex(0);
    setShowVehicleModal(false);
    setVehicleInput('');
    setSelectedVehicle(null);
    setVehicleCheckResult(null);
  }, [selectedListing?.id]);

  if (loading || !locationReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
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
            <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">{locale === 'en' ? 'Reservation Type' : 'Vrsta rezervacije'}</label>
            <select
              value={reservationType}
              onChange={(e) => setReservationType(e.target.value)}
              className="bg-white border-none text-sm font-medium text-gray-900 p-0 pr-6 focus:outline-none cursor-pointer w-full leading-none -ml-1 min-w-[400px]"
            >
              <option value="Satna/dnevna">{t('Satna/dnevna', locale)}</option>
              <option value="Mjesečna">{locale === 'en' ? 'Monthly' : 'Mjesečna'}</option>
            </select>
          </div>

          {/* Big Widget - 5x width, merged sections */}
          <div className="border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus-within:border-black min-h-[50px] flex items-center px-4 py-2 w-[800px] overflow-visible">
            {/* Left half - Location search */}
            <div className="flex-1 flex flex-col justify-center relative">
              <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none">{t('Kamo ideš?', locale)}</label>
              <div className="flex items-center gap-2">
                {usingCurrentLocation ? <MapPin className="w-4 h-4 text-black flex-shrink-0" /> : <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                <input
                  type="text"
                  placeholder={usingCurrentLocation ? t('Trenutna lokacija', locale) : 'Search location...'}
                  value={searchLocation}
                  onChange={(e) => { setUsingCurrentLocation(false); setSearchLocation(e.target.value); setShowPredictions(true); }}
                  onFocus={() => {
                    setShowPredictions(true);
                    if (nearbyPlaces.length === 0) {
                      fetchNearbyPlaces();
                    }
                  }}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer flex-1 leading-none caret-blue-500"
                />
              </div>
              {/* Predictions dropdown */}
              {showPredictions && (
                <div className="absolute top-full mt-1 left-1/2 bg-white border border-gray-300 rounded-md shadow-xl z-50 max-h-80 overflow-y-auto" style={{ width: 'calc(100% + 1rem)', transform: 'translateX(-50%)' }}>
                  {/* Current Location - only when not typing */}
                  {!searchLocation && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCurrentLocation();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900"
                    >
                      <MapPin className="w-4 h-4 text-gray-600" />
                      Use current location
                    </button>
                  )}

                  {/* Recent Searches - only when not typing */}
                  {!searchLocation && recentSearches.length > 0 && (
                    <>
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          onMouseDown={(e) => { e.preventDefault(); handleRecentSearch(search.name, search.lat, search.lng); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900 border-t border-gray-200"
                        >
                          <MapPin className="w-4 h-4 text-gray-600" />
                          {search.name}
                        </button>
                      ))}
                    </>
                  )}

                  {/* Google Places Predictions - only when typing */}
                  {searchLocation && !usingCurrentLocation && predictions.length > 0 && (
                    <>
                      {predictions.map((pred) => (
                        <button
                          key={pred.place_id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectPrediction(pred.place_id, pred.main_text || pred.description?.split(',')[0] || '');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2 text-sm border-t border-gray-200"
                        >
                          <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-gray-900 font-medium">{pred.main_text || pred.description?.split(',')[0] || 'Location'}</div>
                            {(pred.secondary_text || pred.description?.split(',').slice(1).join(',')) && (
                              <div className="text-xs text-gray-500">{pred.secondary_text || pred.description?.split(',').slice(1).join(',')}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Nearby Locations Header */}
                  {!searchLocation && nearbyPlaces.length > 0 && (
                    <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-t border-gray-200">
                      Nearby Locations
                    </div>
                  )}

                  {/* Nearby Places of Interest */}
                  {!searchLocation && nearbyPlaces.map((place, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleRecentSearch(place.name, place.lat, place.lng);
                      }}
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
                  {locale === 'en' ? 'Dashboard' : 'Upravljačka Ploča'}
                </a>
                <a href="/host" className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200">
                  List your lot
                </a>
                <a href="/main" className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900 border-t border-gray-200 rounded-b-lg">
                  {locale === 'en' ? 'Home' : 'Početna'}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0" style={{ zIndex: 50 }}>
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
            <a href="/host" className="text-xs font-semibold px-2 py-1 hover:opacity-70 transition-opacity" style={{ color: '#000000' }}>
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
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[160px] sm:min-w-[180px]" style={{ display: mobileMenuOpen ? 'block' : 'none' }}>
                {userData && (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                      {userData.plate && <div className="font-semibold text-gray-700">{userData.plate}</div>}
                      {userData.email && <div className="truncate">{userData.email}</div>}
                      {userData.phone && <div>{userData.phone}</div>}
                    </div>
                  </>
                )}
                <a href="/main" className={`block w-full text-left px-4 py-3 hover:bg-gray-100 text-xs sm:text-sm text-gray-900 ${userData ? 'border-t border-gray-200' : 'rounded-t-lg'}`} onClick={() => setMobileMenuOpen(false)}>
                  {locale === 'en' ? 'Home' : 'Početna'}
                </a>
                <a href="/members" className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-xs sm:text-sm text-gray-900 border-t border-gray-200">
                  {locale === 'en' ? 'Dashboard' : 'Upravljačka Ploča'}
                </a>
              </div>
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
            {searchLocation ? <MapPin className="w-4 h-4 text-black flex-shrink-0" /> : <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />}
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <div className="text-xs text-gray-600 font-semibold truncate">{searchLocation || t('Kamo ideš?', locale)}</div>
              {startTime && endTime && (
                <div className="text-xs text-gray-700 font-medium" translate="no">
                  {new Date(startTime).toLocaleDateString(locale === 'en' ? 'en' : 'hr-HR', { month: 'long', day: 'numeric' })} {new Date(startTime).toLocaleTimeString(locale === 'en' ? 'en' : 'hr-HR', { hour: '2-digit', minute: '2-digit' })} - {new Date(endTime).toLocaleDateString(locale === 'en' ? 'en' : 'hr-HR', { month: 'long', day: 'numeric' })} {new Date(endTime).toLocaleTimeString(locale === 'en' ? 'en' : 'hr-HR', { hour: '2-digit', minute: '2-digit' })}
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
            <div className="text-xs text-gray-600 font-semibold truncate">{showMobileMap ? t('Popis', locale) : t('Karta', locale)}</div>
          </button>
        </div>
      </div>

      {/* Mobile Search Edit Modal */}
      {showMobileSearchEdit && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-center px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{t('Uredi pretragu', locale)}</h2>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Reservation Type */}
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase">{t('Vrsta rezervacije', locale)}</label>
              <div className="border border-gray-300 rounded-lg bg-white px-3 py-2">
                <ReservationTypeDropdown value={reservationType} onChange={setReservationType} />
              </div>
            </div>

            {/* Location Search */}
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase">{t('Kamo ideš?', locale)}</label>
              <div className="border border-gray-300 rounded-lg bg-white px-3 py-2 flex items-center gap-2 focus-within:border-[#000000] focus-within:ring-2 focus-within:ring-black">
                {usingCurrentLocation ? <MapPin className="w-4 h-4 text-black flex-shrink-0" /> : <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                <input
                  ref={locationInputRef}
                  type="text"
                  placeholder={usingCurrentLocation ? t('Trenutna lokacija', locale) : 'Search location...'}
                  value={searchLocation}
                  onChange={(e) => { setUsingCurrentLocation(false); setSearchLocation(e.target.value); setShowPredictions(true); }}
                  onFocus={() => {
                    setShowPredictions(true);
                    if (nearbyPlaces.length === 0) {
                      fetchNearbyPlaces();
                    }
                  }}
                  className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none flex-1"
                />
              </div>
              {/* Predictions - Uber style */}
              {showPredictions && (
                <div className="mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {/* Current Location Button - only when not typing */}
                  {!searchLocation && (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCurrentLocation();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-900"
                    >
                      <MapPin className="w-4 h-4 text-gray-600" />
                      {t('Use current location', locale)}
                    </button>
                  )}

                  {/* Recent Searches - only when not typing */}
                  {!searchLocation && recentSearches.length > 0 && (
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

                  {/* Google Places Predictions */}
                  {searchLocation && predictions.length > 0 && (
                    <>
                      {predictions.map((pred) => (
                        <button
                          key={pred.place_id}
                          onClick={() => handleSelectPrediction(pred.place_id, pred.main_text || pred.description?.split(',')[0] || '')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-start gap-2 text-sm border-t border-gray-200"
                        >
                          <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-gray-900 font-medium">{pred.main_text || pred.description?.split(',')[0] || 'Location'}</div>
                            {(pred.secondary_text || pred.description?.split(',').slice(1).join(',')) && (
                              <div className="text-xs text-gray-500">{pred.secondary_text || pred.description?.split(',').slice(1).join(',')}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Date/Time Pickers */}
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('Vrijeme', locale)}
              </label>
              <div className="border border-gray-300 rounded-lg bg-white px-3 py-2">
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
                    resetTrigger={datePickerResetTrigger}
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
              {t('Odustani', locale)}
            </button>
            <button
              onClick={() => setShowMobileSearchEdit(false)}
              className="flex-1 px-4 py-2 bg-[#000000] text-white text-sm font-semibold rounded-lg hover:bg-gray-900"
            >
              {t('Primijeni', locale)}
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
          {reservationType !== 'Mjesečna' && (
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
            {t('Natkriveno/Garaža', locale)}
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
          {reservationType !== 'Mjesečna' && (
            <>
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
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setAllParkingDropdownOpen(false)}>
                  <div
                    ref={allParkingDropdownRef}
                    className="bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-[400px] max-h-[70vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm font-semibold text-gray-900">Browse by category</p>
                      <button
                        onClick={() => setAllParkingDropdownOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
                                <p className="text-sm font-semibold text-gray-900">{t(cat.label, locale)}</p>
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
                              <p className="text-sm font-semibold text-gray-900">{t(cat.label, locale)}</p>
                              <p className="text-xs text-gray-500">{cat.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
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
            <h2 className="text-lg font-bold text-gray-900 mb-6">{locale === 'en' ? 'Filters' : 'Filteri'}</h2>

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
                    <span className="text-sm font-medium text-gray-900">{t(filter.label, locale)}</span>
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
                    <span className="text-sm font-medium text-gray-900">{t(filter.label, locale)}</span>
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
                  <span className="text-sm font-medium text-gray-900">{t('Show total price', locale)}</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setFilterModalOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {t('Povratak', locale)}
              </button>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="px-6 py-2 bg-[#000000] text-white text-sm font-medium rounded-lg hover:bg-gray-900"
              >
                {locale === 'en' ? `Show ${filteredListings.length} results` : `Prikaži ${filteredListings.length} rezultata`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Modal */}
      {sortModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-6">{t('Poredaj po', locale)}</h2>

            <div className="space-y-3 mb-8">
              {[
                { value: 'distance', label: locale === 'en' ? 'Distance' : 'Udaljenost' },
                { value: 'price-low', label: locale === 'en' ? 'Price (low-high)' : 'Cijena (nisko-visoko)' },
                { value: 'price-high', label: locale === 'en' ? 'Price (high-low)' : 'Cijena (visoko-nisko)' },
                { value: 'rating', label: locale === 'en' ? 'Rating' : 'Ocjena' },
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
                  <span className="text-sm font-medium text-gray-900 capitalize">{option.label}</span>
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
              <option value="relevance">{t('Poredaj po Relevantnosti', locale)}</option>
              <option value="distance">{t('Poredaj po Udaljenosti', locale)}</option>
              <option value="price">{t('Poredaj po Cijeni', locale)}</option>
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
              <div className="overflow-y-auto px-4 py-4">
                <div className="w-full max-w-sm">
                  {noResultsForLocation ? (
                    <>
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <p className="text-gray-900 font-bold text-lg">Nema parkinga na lokaciji {noResultsForLocation}</p>
                        <p className="text-sm text-gray-600 mt-1">Nema dostupnih parkinga na ovoj lokaciji</p>
                      </div>

                      <div>
                        <p className="text-gray-900 font-semibold text-base mb-3">Pregledaj neke druge parkinge u našem portfelju</p>
                        {listings.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {listings.slice(0, 5).map((lot) => (
                              <button
                                key={lot.id}
                                onClick={() => {
                                  setMapCenter({ lat: lot.lat, lng: lot.lng });
                                  setSearchLocationPin({ lat: lot.lat, lng: lot.lng });
                                }}
                                className="w-full text-left px-3 py-2 border border-black/20 hover:border-black/40 rounded-lg transition-colors"
                              >
                                <div className="text-sm font-semibold text-gray-900">{lot.name}</div>
                                <div className="text-xs text-gray-500">{lot.address}</div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    {lot.distance.toFixed(1)} km
                                  </span>
                                  <span className="flex items-center gap-1">
                                    €
                                    {lot.pricePerHour?.toFixed(2)}/h
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t('Učitavanje parkinga...', locale)}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">{t('Nema pronađenih parkirnih mjesta', locale)}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('Pokušajte prilagoditi svoje filtre', locale)}</p>
                    </>
                  )}
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

                    badgeMap.set(closest.id, locale === 'en' ? 'Shortest Walk' : 'Najkraća Šetnja');
                    if (cheapest.id !== closest.id) badgeMap.set(cheapest.id, locale === 'en' ? 'Best Value' : 'Najbolja Vrijednost');
                    if (!badgeMap.has(highestRated.id)) badgeMap.set(highestRated.id, locale === 'en' ? 'Highest Rated' : 'Najviše Ocijenjeno');
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
                  <p className="text-sm font-semibold text-gray-900">{t('Vehicle size restrictions may apply', locale)}</p>
                  <p className="text-xs text-gray-600 mt-1">{t('Provjerite da li Vam vozilo podliježe ograničenjima i dodatnim naknadama.', locale)}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            </button>

            {/* Book Now Suggestion Widget */}
            <div className="flex-shrink-0 w-full px-6 py-4 bg-amber-100 flex items-start gap-3 border-b border-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{locale === 'en' ? 'We recommend booking now.' : 'Predlažemo da rezervirate odmah.'}</p>
                <p className="text-xs text-gray-900 mt-1">{(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; return locale === 'en' ? `We only have ${getSpacesText(s, 'en')} at this price!` : `Ovdje imamo samo ${getSpacesText(s, 'hr')} po ovoj cijeni!`; })()}</p>
              </div>
            </div>

            {/* Location Information Widget */}
            <div className="flex-shrink-0 w-full bg-white border-b border-gray-200 overflow-hidden">
              {/* Black Badge Header */}
              <div className="font-bold text-white bg-black px-2 flex items-center justify-start" style={{ fontSize: '12px', paddingRight: '24px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '0 0 16px 0' }}>
                {t('Lokacija', locale)}
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
                    <span className="text-gray-900">{t('Novi objekt', locale)}</span>
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

                <p className="text-sm text-gray-700 font-semibold">{t('Rezervacija parkinga', locale)}</p>

                {/* Date, Time and Price Row */}
                <button
                  onClick={() => setShowPriceBreakdown(true)}
                  className="w-full text-left hover:opacity-70 transition-opacity pb-5 border-b border-gray-200 flex items-start justify-between -mt-3"
                >
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{formatTimeRange()}</p>
                    <p className="text-sm text-gray-500 mt-1.5">
                      {selectedListing?.features?.includes('in-out-allowed') ? t('Ulazi i izlazi dozvoljeni', locale) : t('Nema ulaza i izlaza', locale)}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-2xl font-bold text-gray-900">€{totalPrice.toFixed(2)}</p>
                    <span className="text-sm text-gray-500 border-b border-gray-400 pb-0.5 -mt-1">{t('Ukupno', locale)}</span>
                  </div>
                </button>

                {/* Grey Box - Reservation Extended */}
                <div className="bg-gray-200 rounded-lg p-1.5 mt-4">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-900">{t('Vaša rezervacija je produžena bez dodatnih troškova!', locale)}</p>
                    <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </div>
                </div>

                {/* Yellow Spots Widget */}
                <div className="flex items-center gap-1.5 bg-yellow-100 rounded-md px-3 py-2">
                  <Info className="w-3.5 h-3.5 text-yellow-700 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-gray-900">{(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; return getSpacesText(s, locale); })()}</span>
                    <span className="text-xs text-gray-600 ml-1">{locale === 'en' ? 'at this price' : 'po ovoj cijeni'}</span>
                  </div>
                </div>

                {/* CTA Button - Stripe checkout */}
                <a
                  href={selectedListing ? buildCheckoutUrl(selectedListing) : '#'}
                  className="inline-block px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('Rezervirajte sada', locale)} — €{totalPrice.toFixed(2)}
                </a>

                {/* Green Box */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-600 flex-shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-700 font-semibold">{t('Besplatno otkazivanje', locale)}</p>
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-600 flex-shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-700 font-semibold">{t('Garancija Mjesta', locale)}</p>
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="pt-2">
                  <p className="text-xs text-gray-600">{t('Sigurna plaćanja omogućuje Stripe', locale)}</p>
                </div>

                {/* Things You Should Know */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowThingsToKnow(!showThingsToKnow)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">{t('Things You Should Know', locale)}</p>
                  </button>
                  {showThingsToKnow && (
                    <div className="space-y-3 mt-3">
                      {/* Important Notice */}
                      <div className="bg-yellow-100 rounded-md px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Info className="w-3.5 h-3.5 text-yellow-700 flex-shrink-0" />
                          <p className="text-xs font-semibold text-gray-900">{locale === 'en' ? 'Important Notice' : 'Važna napomena'}</p>
                        </div>
                        <p className="text-xs text-gray-900">{locale === 'en' ? 'Please respect your reservation time. Do not enter before the start time or leave after the end time. If you violate these rules, the charged amount will be refunded directly by the parking operator.' : 'Molimo vas da poštujete vrijeme vaše rezervacije. Ne ulazite prije početka rezervacije niti je napuštajte nakon njezinog završetka. Ako prekršite ova pravila, naplaćeni iznos će biti izravno od operatera parkinga.'}</p>
                      </div>

                      {/* Things to Know Content */}
                      <div className="space-y-3 text-sm text-gray-900 leading-relaxed ml-7">
                        {(translatedContent?.thingsToKnow ?? selectedListing.thingsToKnow)
                          ? (translatedContent?.thingsToKnow ?? selectedListing.thingsToKnow)!.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                          : <p className="text-gray-400">{t('Nema dostupnih informacija.', locale)}</p>}
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
                    <p className="text-base font-bold text-gray-900">{t('Amenities', locale)}</p>
                  </button>
                  {showAmenities && (
                    <div className="mt-3 ml-7">
                      {selectedListing.features && selectedListing.features.length > 0
                        ? <AmenitiesChips selected={normalizeAmenityLabels(selectedListing.features)} size="sm" locale={locale} />
                        : <p className="text-gray-400 text-sm">{t('Nema dostupnih sadržaja.', locale)}</p>}
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
                    <p className="text-base font-bold text-gray-900">{t('Access Hours', locale)}</p>
                  </button>
                  {showAccessHours && (
                    <div className="space-y-2 mt-3 ml-7 text-sm text-gray-900 leading-relaxed">
                      {(translatedContent?.accessHours ?? selectedListing.accessHours)
                        ? (translatedContent?.accessHours ?? selectedListing.accessHours)!.split('\n').map((line, i) => <p key={i}>{line}</p>)
                        : <p className="text-gray-400">{t('Nema dostupnih informacija o radnom vremenu.', locale)}</p>}
                    </div>
                  )}
                </div>

                {/* Kako radi Dropdown */}
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowHowToRedeem(!showHowToRedeem)}
                    className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                    <p className="text-base font-bold text-gray-900">{t('Kako radi', locale)}</p>
                  </button>
                  {showHowToRedeem && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      {selectedListing.howItWorks
                        ? selectedListing.howItWorks.split('\n').map((step, i) => (
                            <p key={i}>{translateText(step, locale)}</p>
                          ))
                        : <p className="text-gray-400">{t('Nema dostupnih informacija.', locale)}</p>}
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
                    <p className="text-base font-bold text-gray-900">{t('Getting There', locale)}</p>
                  </button>
                  {showGettingThere && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      {(translatedContent?.gettingThere ?? selectedListing.gettingThere)
                        ? <p>{translatedContent?.gettingThere ?? selectedListing.gettingThere}</p>
                        : <p className="text-gray-400">{t('Nema dostupnih uputa za dolazak.', locale)}</p>}
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
                    <p className="text-base font-bold text-gray-900">{t('Free Cancellation Policy', locale)}</p>
                  </button>
                  {showCancellationPolicy && (
                    <div className="space-y-3 text-sm text-gray-900 leading-relaxed mt-3 ml-7">
                      <p>{translateText('U ovoj ustanovi imate vremena do trenutka kada vaša rezervacija počne otkazati svoje parkiranje za puni povrat novca. Rezervaciju možete otkazati na web stranici ili aplikaciji PayParq.', locale)}</p>
                      <p>{translateText('Ako imate problema sa svojom rezervacijom, a vrijeme je nakon početka, obratite se našim PayParq timom koji će rado pomoći ispraviti svaku situaciju!', locale)}</p>
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
                    <p className="text-base font-bold text-gray-900">{t('Guaranteed Parking by PayParq', locale)}</p>
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
                    <p className="text-base font-bold text-gray-900">{t('365-Day Customer Support', locale)}</p>
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

        {/* Vehicle Modal - Centered Overlay */}
        {/* Map 65% RIGHT (normal) or flex-1 RIGHT (details) */}
        <div className={`bg-gray-100 ${showDetailsView ? 'flex-1' : 'w-[65%]'} pb-16 pr-2`}>
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
            center={searchLocationPin || mapCenter}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            options={{
              mapTypeControl: false,
              zoomControl: false,
              fullscreenControl: false,
              streetViewControl: false,
              rotateControl: false,
              scaleControl: false,
              panControl: false,
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
              const price = parseFloat((showTotalPrice ? subtotal + Math.min(1.99, 0.99 + (subtotal * 0.10)) : subtotal).toFixed(2));
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
              {t('Filters', locale)}
            </button>
            {reservationType !== 'Mjesečna' && (
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
              {t('Natkriveno/Garaža', locale)}
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
              {t('Poredaj po', locale)}
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
            <span className="text-xs text-gray-600">{filteredListings.length} {locale === 'en' ? 'results' : 'rezultata'}</span>
          </div>
        )}

        {/* Mobile List/Map - Hidden when details open */}
        {!showMobileDetails && (showMobileMap ? (
          <div className="flex-1 overflow-hidden w-full relative">
            {isLoaded ? (
              <GoogleMap
                zoom={12}
                center={searchLocationPin || mapCenter}
                mapContainerStyle={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 200px)' }}
                options={{
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                  zoomControl: false,
                  rotateControl: false,
                  scaleControl: false,
                  panControl: false,
                }}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
              >
                {filteredListings.map((listing) => {
                  const totalPrice = getDisplayPrice(listing, durationHours, reservationType);
                  const subtotal = parseFloat(totalPrice.toFixed(2));
                  const price = parseFloat((showTotalPrice ? subtotal + Math.min(1.99, 0.99 + (subtotal * 0.10)) : subtotal).toFixed(2));
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
                        setSelectedListing(listing);
                        setShowMobileDetails(true);
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
            {/* My Location FAB */}
            {!showMobileSearchEdit && (
            <button
              onClick={() => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition((pos) => {
                  const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  userGpsRef.current = loc;
                  setMapCenter(loc);
                  setSearchLocationPin(loc);
                  setSearchLocationState(t('Trenutna lokacija', locale));
                  setUsingCurrentLocation(true);
                  mapRef.current?.panTo(loc);
                });
              }}
              className="fixed bottom-[108px] right-6 w-10 h-10 rounded-full bg-white shadow-lg border border-black/10 flex items-center justify-center hover:bg-gray-50 transition z-[1050]"
              aria-label="My location"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/>
              </svg>
            </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto w-full h-full">
            <div className="p-4 space-y-3">
            {filteredListings.length === 0 ? (
              <div className="overflow-y-auto px-4 py-4">
                <div className="w-full">
                  {noResultsForLocation ? (
                    <>
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <p className="text-gray-900 font-bold">Nema parkinga na lokaciji {noResultsForLocation}</p>
                        <p className="text-sm text-gray-600 mt-1">Nema dostupnih parkinga na ovoj lokaciji</p>
                      </div>

                      <div>
                        <p className="text-gray-900 font-semibold text-base mb-3">Pregledaj neke druge parkinge u našem portfelju</p>
                        {listings.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {listings.slice(0, 5).map((lot) => (
                              <button
                                key={lot.id}
                                onClick={() => {
                                  setMapCenter({ lat: lot.lat, lng: lot.lng });
                                  setSearchLocationPin({ lat: lot.lat, lng: lot.lng });
                                }}
                                className="w-full text-left px-3 py-2 border border-black/20 hover:border-black/40 rounded-lg transition-colors"
                              >
                                <div className="text-sm font-semibold text-gray-900">{lot.name}</div>
                                <div className="text-xs text-gray-500">{lot.address}</div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    {lot.distance.toFixed(1)} km
                                  </span>
                                  <span className="flex items-center gap-1">
                                    €
                                    {lot.pricePerHour?.toFixed(2)}/h
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t('Učitavanje parkinga...', locale)}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">{t('Nema pronađenih parkirnih mjesta', locale)}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('Pokušajte prilagoditi svoje filtre', locale)}</p>
                    </>
                  )}
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

                    mobileBadgeMap.set(closest.id, locale === 'en' ? 'Shortest Walk' : 'Najkraća Šetnja');
                    if (cheapest.id !== closest.id) mobileBadgeMap.set(cheapest.id, locale === 'en' ? 'Best Value' : 'Najbolja Vrijednost');
                    if (!mobileBadgeMap.has(highestRated.id)) mobileBadgeMap.set(highestRated.id, locale === 'en' ? 'Highest Rated' : 'Najviše Ocijenjeno');
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
                          setSelectedListing(liveListing);
                          setShowMobileDetails(true);
                        }}
                        onBook={() => {
                          setSelectedListing(liveListing);
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
          <div className="w-full bg-white overflow-y-auto overflow-x-hidden flex-1">
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
                type="button"
                onClick={() => {
                  console.log('Restrictions widget clicked');
                  setShowVehicleModal(true);
                  setVehicleCheckResult(null);
                }}
                className="w-[calc(100%+40px)] px-4 py-4 bg-gray-50 hover:bg-gray-100 flex items-start gap-3 cursor-pointer transition-colors border-b border-gray-200 -mx-4 -mt-1"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Info className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">{t('Vehicle size restrictions may apply', locale)}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{t('Provjerite da li Vam vozilo podliježe ograničenjima i dodatnim naknadama.', locale)}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </button>

              {/* Book Now Suggestion Widget */}
              <div className="flex-shrink-0 w-[calc(100%+40px)] px-4 py-4 bg-amber-100 flex items-start gap-3 border-b border-amber-300 -mx-4">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-900">{locale === 'en' ? 'We recommend booking now.' : 'Predlažemo da rezervirate odmah.'}</p>
                  <p className="text-xs text-gray-900 mt-0.5">{(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; return locale === 'en' ? `We only have ${getSpacesText(s, 'en')} at this price!` : `Ovdje imamo samo ${getSpacesText(s, 'hr')} po ovoj cijeni!`; })()}</p>
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
                      <span className="text-gray-900">{t('Novi objekt', locale)}</span>
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
                  <p className="text-sm text-gray-700 font-semibold mb-4">{t('Rezervacija parkinga', locale)}</p>

                  {/* Date, Time and Price Row */}
                  <button
                    onClick={() => setShowPriceBreakdown(true)}
                    className="w-full text-left hover:opacity-70 transition-opacity pb-4 border-b border-gray-200 flex items-start justify-between -mt-1"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{formatTimeRange()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedListing?.features?.includes('in-out-allowed') ? t('Ulazi i izlazi dozvoljeni', locale) : t('Nema ulaza i izlaza', locale)}
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
                    <p className="text-xs font-semibold text-gray-900">{t('Vaša rezervacija je produžena bez dodatnih troškova!', locale)}</p>
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
                      <p className="text-xs text-gray-700 font-semibold">{(() => { const s = selectedListing.id.charCodeAt(selectedListing.id.length - 1) % 5 + 1; return getSpacesText(s, locale); })()}</p>
                      <p className="text-xs text-gray-600">{locale === 'en' ? 'at this price!' : 'po ovoj cijeni!'}</p>
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
                      <p className="text-xs text-gray-700 font-semibold">{t('Besplatno otkazivanje', locale)}</p>
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-600 flex-shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-700 font-semibold">{t('Garancija Mjesta', locale)}</p>
                      <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="pt-3">
                  <p className="text-xs text-gray-600">{t('Sigurna plaćanja omogućuje Stripe', locale)}</p>
                </div>
              </div>

              {/* Things You Should Know */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowThingsToKnow(!showThingsToKnow)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showThingsToKnow ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">{t('Things You Should Know', locale)}</p>
                </button>
                {showThingsToKnow && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    {(translatedContent?.thingsToKnow ?? selectedListing.thingsToKnow)
                      ? (translatedContent?.thingsToKnow ?? selectedListing.thingsToKnow)!.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                      : <p className="text-gray-400">{t('Nema dostupnih informacija.', locale)}</p>}
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
                      ? <AmenitiesChips selected={normalizeAmenityLabels(selectedListing.features)} size="sm" locale={locale} />
                      : <p className="text-gray-400 text-xs">{t('Nema dostupnih sadržaja.', locale)}</p>}
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
                    {(translatedContent?.accessHours ?? selectedListing.accessHours)
                      ? (translatedContent?.accessHours ?? selectedListing.accessHours)!.split('\n').map((line, i) => <p key={i}>{line}</p>)
                      : <p className="text-gray-400">{t('Nema dostupnih informacija o radnom vremenu.', locale)}</p>}
                  </div>
                )}
              </div>

              {/* Kako radi */}
              <div className="pt-3 border-t border-gray-200 mb-4 px-4">
                <button
                  onClick={() => setShowHowToRedeem(!showHowToRedeem)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showHowToRedeem ? 'rotate-180' : ''}`} />
                  <p className="text-sm font-bold text-gray-900">{t('Kako radi', locale)}</p>
                </button>
                {showHowToRedeem && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    {selectedListing.howItWorks
                      ? selectedListing.howItWorks.split('\n').map((step, i) => <p key={i}>{translateText(step, locale)}</p>)
                      : <p className="text-gray-400">{translateText('Nema dostupnih informacija.', locale)}</p>}
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
                  <p className="text-sm font-bold text-gray-900">{t('Getting There', locale)}</p>
                </button>
                {showGettingThere && (
                  <div className="space-y-2 text-xs text-gray-900 leading-relaxed mt-2 ml-6">
                    {(translatedContent?.gettingThere ?? selectedListing.gettingThere)
                      ? <p>{translatedContent?.gettingThere ?? selectedListing.gettingThere}</p>
                      : <p className="text-gray-400">{t('Nema dostupnih uputa za dolazak.', locale)}</p>}
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
                    <p>{translateText('U ovoj ustanovi imate vremena do trenutka kada vaša rezervacija počne otkazati svoje parkiranje za puni povrat novca. Rezervaciju možete otkazati na web stranici ili aplikaciji PayParq.', locale)}</p>
                    <p>{translateText('Ako imate problema sa svojom rezervacijom, a vrijeme je nakon početka, obratite se našim PayParq timom koji će rado pomoći ispraviti svaku situaciju!', locale)}</p>
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
            <div className="sticky bottom-0 px-6 py-6 border-t border-gray-200 bg-white flex items-center justify-center">
              <a
                href={selectedListing ? buildCheckoutUrl(selectedListing) : '#'}
                className="block w-full px-5 py-5 bg-blue-500 text-white text-base font-bold rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                {t('Rezervirajte sada', locale)} — €{totalPrice.toFixed(2)}
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
          title={locale === 'en' ? 'When are you arriving?' : 'Kada dolazite?'}
          subtitle={locale === 'en' ? 'Select arrival date and time' : 'Odaberite datum i vrijeme dolaska'}
          step={locale === 'en' ? 'Step 1 of 2' : 'Korak 1 od 2'}
          locale={locale}
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
          title={locale === 'en' ? 'When are you leaving?' : 'Kada odlazite?'}
          subtitle={locale === 'en' ? 'Select departure date and time' : 'Odaberite datum i vrijeme odlaska'}
          step={locale === 'en' ? 'Step 2 of 2' : 'Korak 2 od 2'}
          initialDateTime={arrivalDateTime}
          locale={locale}
        />
      )}

      {/* Vehicle Size Restrictions Modal - Rendered after mobile details so it appears on top */}
      {showVehicleModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl md:rounded-lg shadow-2xl max-w-sm w-full md:max-h-[90vh] max-h-[90vh] overflow-auto">
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
                    {t('Zatvori', locale)}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <p className="text-gray-700">{locale === 'en' ? 'No size restrictions for this location' : 'Nema ograničenja za ovu lokaciju'}</p>
                  <button
                    onClick={() => {
                      setShowVehicleModal(false);
                      setVehicleInput('');
                      setSelectedVehicle(null);
                      setVehicleCheckResult(null);
                    }}
                    className="w-full px-4 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    {t('Zatvori', locale)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Price Breakdown Modal - Root level for mobile */}
      {showPriceBreakdown && selectedListing && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 z-[10000]">
            <div className="space-y-4">
              <p className="text-lg font-bold text-gray-900">{t('Pregled cijene', locale)}</p>

              <div className="space-y-2 border-b border-gray-200 pb-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {reservationType === 'Mjesečna'
                      ? t('Mjesečna tarifa', locale)
                      : `${t('Cijena parkinga', locale)}: €${subtotal.toFixed(2)}`
                    }
                  </p>
                  <p className="text-sm font-semibold text-gray-900">€{subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">{t('Naknada za uslugu', locale)}</p>
                  <p className="text-sm font-semibold text-gray-900">€{serviceFee.toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('Naknada za uslugu uključuje: Jamstvo rezerviranog mjesta, prioritetnu podršku, rješavanje sporova i ostalo.', locale)}</p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-lg font-bold text-gray-900">{t('Ukupno', locale)}</p>
                <p className="text-lg font-bold text-gray-900">€{totalPrice.toFixed(2)}</p>
              </div>

              <a
                href={buildCheckoutUrl(selectedListing)}
                className="block w-full mt-2 px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                {t('Rezervirajte sada', locale)} — €{totalPrice.toFixed(2)}
              </a>
              <button
                onClick={() => setShowPriceBreakdown(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('Zatvori', locale)}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
