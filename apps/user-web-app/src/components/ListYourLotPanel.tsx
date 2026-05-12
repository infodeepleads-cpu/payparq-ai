'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Info, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { ListingHeader } from './ListingHeader';
import { supabase } from '@/lib/supabase';

const DynamicMap = dynamic(() => import('./ParkingLocationMap'), { ssr: false });

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name' | 'type' | 'features' | 'addOns' | 'vehicleSize' | 'accessControl';
type Step2Sub = 'availability' | 'bookingStart' | 'calendarPreview' | 'bookingWindow' | 'bookingTypes' | 'pricing' | 'description' | 'postBookingInstructions' | 'review2';
type Step3Sub = 'photos' | 'streetView' | 'summary' | 'review3';

const REGIONS = [
  { id: 'HR', label: 'Croatia', center: [45.815, 15.982] },
  { id: 'SI', label: 'Slovenia', center: [46.056, 14.506] },
  { id: 'RS', label: 'Serbia', center: [44.787, 20.457] },
  { id: 'BA', label: 'Bosnia', center: [43.852, 18.396] },
  { id: 'ME', label: 'Crna Gora', center: [42.442, 19.268] },
  { id: 'IT', label: 'Italy', center: [41.902, 12.496] },
  { id: 'AT', label: 'Austria', center: [48.209, 16.370] },
  { id: 'DE', label: 'Germany', center: [52.520, 13.405] },
  { id: 'CH', label: 'Switzerland', center: [46.948, 7.447] },
];

interface ListingData {
  region: string;
  name: string;
  address: string;
  addressLine2: string;
  town: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  spaceType: string;
  vehicleSize: string;
  heightRestrictions: string;
  maxHeight: string;
  accessControl: string;
  accessControlType: string;
  permitRequired: string;
  spaceAllocated: string;
  openTime: string;
  closeTime: string;
  smartPricing: boolean;
  permits: string;
  photos: File[];
  photoUrls: string[];
  type: string;
  capacity: string;
  features: string[];
  available24_7: boolean;
  daysAvailable: string[];
  accessHoursSameForAll: boolean;
  allowOvernightBookings: boolean;
  dayHours: { [key: string]: { open: string; close: string } };
  noticeRequired: string;
  startTakingBookingsToday: boolean;
  bookingStartDate: string;
  bookingWindow: string;
  acceptMonthlyBookings: boolean;
  acceptHourlyDailyBookings: boolean;
  availablePlan: string;
  pricingModel: string;
  overrideNearbyLocations: boolean;
  addAdditionalInfo: boolean;
  additionalDescription: string;
  postBookingInstructions: string;
  addPostBookingInfo: boolean;
  addOns: string[];
}

function InfoWidget({ tip }: { tip: string }) {
  return (
    <div className="hidden md:col-span-1 md:block">
      <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-6">
        <div className="flex items-start gap-2 mb-3">
          <p className="text-sm text-gray-700 leading-snug">Korisne Informacije</p>
          <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <Info className="w-4 h-4" />
          </button>
        </div>
        <p className="text-base text-gray-700 leading-snug">{tip}</p>
      </div>
    </div>
  );
}

interface ListYourLotPanelProps {
  isFullScreen?: boolean;
  currentStep?: MainStep;
  currentSubStep?: Step1Sub;
  currentStep2Sub?: Step2Sub;
  currentStep3Sub?: Step3Sub;
  onStepChange?: (step: MainStep) => void;
  onSubStepChange?: (subStep: Step1Sub) => void;
  onStep2SubChange?: (subStep: Step2Sub) => void;
  onStep3SubChange?: (subStep: Step3Sub) => void;
}

export function ListYourLotPanel({
  isFullScreen = false,
  currentStep: propStep,
  currentSubStep: propSubStep,
  currentStep2Sub: propStep2Sub,
  currentStep3Sub: propStep3Sub,
  onStepChange,
  onSubStepChange,
  onStep2SubChange,
  onStep3SubChange
}: ListYourLotPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const [step, setStepInternal] = useState<MainStep>(propStep || 'intro');
  const [step1Sub, setStep1SubInternal] = useState<Step1Sub>(propSubStep || 'region');
  const [step2Sub, setStep2SubInternal] = useState<Step2Sub>(propStep2Sub || 'availability');
  const [step3Sub, setStep3SubInternal] = useState<Step3Sub>(propStep3Sub || 'photos');

  const currentStepValue = propStep !== undefined ? propStep : step;
  const currentSubStepValue = propSubStep !== undefined ? propSubStep : step1Sub;
  const currentStep2SubValue = propStep2Sub !== undefined ? propStep2Sub : step2Sub;
  const currentStep3SubValue = propStep3Sub !== undefined ? propStep3Sub : step3Sub;

  const setStep = (newStep: MainStep) => {
    setStepInternal(newStep);
    onStepChange?.(newStep);
  };

  const setStep1Sub = (newSubStep: Step1Sub) => {
    setStep1SubInternal(newSubStep);
    onSubStepChange?.(newSubStep);
  };

  const setStep2Sub = (newSubStep: Step2Sub) => {
    setStep2SubInternal(newSubStep);
    onStep2SubChange?.(newSubStep);
  };

  const setStep3Sub = (newSubStep: Step3Sub) => {
    setStep3SubInternal(newSubStep);
    onStep3SubChange?.(newSubStep);
  };

  const cityAutocompleteRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const streetViewInstanceRef = useRef<any>(null);
  const [citySelected, setCitySelected] = useState(false);
  const [streetViewHeading, setStreetViewHeading] = useState(0);
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 5, 1));
  const [data, setData] = useState<ListingData>({
    region: '',
    name: '',
    address: '',
    addressLine2: '',
    town: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    spaceType: '',
    vehicleSize: '',
    heightRestrictions: '',
    maxHeight: '',
    accessControl: '',
    accessControlType: '',
    permitRequired: '',
    spaceAllocated: '',
    openTime: '07:00',
    closeTime: '22:00',
    smartPricing: true,
    permits: '',
    photos: [],
    photoUrls: [],
    type: '',
    capacity: '',
    features: [],
    available24_7: true,
    daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    accessHoursSameForAll: true,
    allowOvernightBookings: false,
    dayHours: {
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
      sunday: { open: '00:00', close: '23:59' },
    },
    noticeRequired: '0',
    startTakingBookingsToday: true,
    bookingStartDate: new Date().toISOString().split('T')[0],
    bookingWindow: 'this_month',
    acceptMonthlyBookings: true,
    acceptHourlyDailyBookings: true,
    availablePlan: 'monday_to_sunday',
    pricingModel: 'dynamic',
    overrideNearbyLocations: false,
    addAdditionalInfo: false,
    additionalDescription: '',
    postBookingInstructions: '',
    addPostBookingInfo: false,
    addOns: [],
  });

  const updateData = (key: keyof ListingData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (feature: string) => {
    setData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  // Load existing listing if editing
  useEffect(() => {
    if (!editId || !supabase) return;
    const client = supabase;
    const loadListing = async () => {
      try {
        const { data: listing, error } = await client
          .from('locations')
          .select('*')
          .eq('id', editId)
          .single();
        if (error) throw error;
        if (!listing) return;

        const meta = listing.verification_metadata || {};
        setListingId(listing.id);
        setSectionsSaved(meta.section_status || { section1: false, section2: false, section3: false });
        setData((prev) => ({
          ...prev,
          name: listing.name || '',
          address: listing.address || '',
          latitude: listing.latitude != null && listing.latitude !== 0 ? String(listing.latitude) : '',
          longitude: listing.longitude != null && listing.longitude !== 0 ? String(listing.longitude) : '',
          capacity: String(listing.capacity || ''),
          spaceType: String(listing.capacity || ''),
          type: meta.type || '',
          features: meta.features || [],
          openTime: meta.openTime || '07:00',
          closeTime: meta.closeTime || '22:00',
          available24_7: meta.available24_7 !== undefined ? meta.available24_7 : false,
          daysAvailable: meta.daysAvailable || [],
          vehicleSize: meta.vehicleSize || '',
          maxHeight: meta.maxHeight || '',
          acceptMonthlyBookings: meta.acceptMonthlyBookings || false,
          acceptHourlyDailyBookings: meta.acceptHourlyDailyBookings || false,
          pricingModel: meta.pricingModel || 'dynamic',
          additionalDescription: meta.additionalDescription || '',
          postBookingInstructions: meta.postBookingInstructions || meta.getting_there || '',
          region: meta.region || '',
          town: meta.town || '',
          postalCode: meta.postalCode || '',
          addressLine2: meta.addressLine2 || '',
          accessControl: meta.accessControl || '',
          accessControlType: meta.accessControlType || '',
          permitRequired: meta.permits || '',
          noticeRequired: meta.noticeRequired || '0',
          bookingWindow: meta.bookingWindow || 'this_month',
          startTakingBookingsToday: meta.startTakingBookingsToday !== undefined ? meta.startTakingBookingsToday : true,
          addOns: meta.addOns || [],
          photoUrls: meta.photo_urls || [],
        }));
      } catch (err) {
        console.error('Error loading listing:', err);
      }
    };
    loadListing();
  }, [editId, supabase]);

  const initStreetView = (lat: number, lng: number) => {
    if (!streetViewRef.current || !window.google?.maps) return;
    const location = new window.google.maps.LatLng(lat, lng);
    if (!streetViewInstanceRef.current) {
      streetViewInstanceRef.current = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
        position: location,
        pov: { heading: streetViewHeading, pitch: 0 },
        zoom: 1,
        motionTracking: false,
        motionTrackingControl: true,
        panControl: true,
        zoomControl: true,
      });
      streetViewInstanceRef.current.addListener('pov_changed', () => {
        const pov = streetViewInstanceRef.current.getPov();
        setStreetViewHeading(pov.heading);
      });
    } else {
      streetViewInstanceRef.current.setPosition(location);
      streetViewInstanceRef.current.setPov({ heading: streetViewHeading, pitch: 0 });
    }
  };

  useEffect(() => {
    if (currentStepValue !== 3 || currentStep3SubValue !== 'streetView' || !isLoaded || !window.google?.maps) return;

    if (data.latitude && data.longitude) {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        initStreetView(lat, lng);
        return;
      }
    }

    // No coords — geocode from address as fallback
    if (data.address && data.town) {
      const geocoder = new window.google.maps.Geocoder();
      const fullAddress = [data.address, data.town, data.region].filter(Boolean).join(', ');
      geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          updateData('latitude', String(lat));
          updateData('longitude', String(lng));
          initStreetView(lat, lng);
        }
      });
    }
  }, [currentStepValue, currentStep3SubValue, isLoaded, data.latitude, data.longitude]);

  const geocodeFullAddress = async () => {
    console.log('🔍 geocodeFullAddress called - timestamp:', new Date().toISOString());
    console.log('📍 Current data state:', { address: data.address, addressLine2: data.addressLine2, town: data.town, postalCode: data.postalCode, region: data.region });

    if (!isLoaded) {
      console.error('❌ Google Maps API not loaded yet (isLoaded=false)');
      return;
    }

    if (!window.google?.maps?.Geocoder) {
      console.error('❌ Google Geocoder not available (window.google.maps.Geocoder missing)');
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const addressParts = [data.address, data.addressLine2, data.town, data.postalCode].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

    if (!fullAddress || !data.address || !data.town) {
      console.error('❌ Address incomplete - cannot geocode:', { fullAddress, address: data.address, town: data.town });
      return;
    }

    console.log('🔍 Starting geocode for address:', fullAddress, 'with country:', data.region);

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.error('❌ Geocoding timeout after 5 seconds');
        resolve();
      }, 5000);

      geocoder.geocode({ address: fullAddress, componentRestrictions: { country: data.region } }, (results, status) => {
        clearTimeout(timeout);
        console.log('📡 Geocoder callback - status:', status, 'results:', results?.length || 0);

        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          console.log('✅ Geocoding SUCCESS - coordinates:', { lat, lng });
          updateData('latitude', String(lat));
          updateData('longitude', String(lng));
          resolve();
        } else {
          console.error('❌ Geocoding FAILED - status:', status, 'results empty:', !results?.length);
          resolve();
        }
      });
    });
  };

  const handleCitySelect = () => {
    if (cityAutocompleteRef.current) {
      try {
        const place = cityAutocompleteRef.current.getPlace();
        console.log('🏙️ City selected from Google:', place?.formatted_address);

        if (!place || !place.formatted_address) {
          console.warn('❌ Invalid city selection');
          return;
        }

        updateData('town', place.formatted_address);
        setCitySelected(true);
        console.log('✅ City confirmed:', place.formatted_address);

        // Geocode the city immediately to zoom map
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          updateData('latitude', String(lat));
          updateData('longitude', String(lng));
          console.log('🗺️ City zoomed to:', lat, lng);
        }
      } catch (e) {
        console.error('❌ City selection error:', e);
      }
    }
  };



  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...Array.from(e.target.files!)],
      }));
    }
  };

  const selectedRegion = REGIONS.find((r) => r.id === data.region);
  const mapCenter = selectedRegion ? selectedRegion.center : [45.815, 15.982];

  const generateDescription = () => {
    const lines = [];

    // Parking name and location
    if (data.name && data.address && data.town) {
      lines.push(`${data.spaceType} space${parseInt(data.spaceType) > 1 ? 's' : ''} located at ${data.name}, ${data.address} in ${data.town}.`);
    } else if (data.address && data.town) {
      lines.push(`${data.spaceType} space${parseInt(data.spaceType) > 1 ? 's' : ''} located on ${data.address} in ${data.town}.`);
    }

    // Parking type
    const typeMap: Record<string, string> = {
      'private_driveway': 'private driveway',
      'commercial_carpark': 'commercial car park',
      'residential_carpark': 'residential car park',
      'lock_up': 'secure lock-up'
    };
    if (data.type) {
      lines.push(`This is a ${typeMap[data.type] || data.type} suitable for parking.`);
    }

    // Vehicle size
    if (data.vehicleSize) {
      const sizeMap: Record<string, string> = {
        'small': 'Small vehicles',
        'medium': 'Small to Medium vehicles',
        'large': 'Large vehicles (4x4)',
        'van': 'Vans and large vehicles'
      };
      lines.push(`The space is suitable for ${sizeMap[data.vehicleSize] || data.vehicleSize}.`);
    }

    // Features/Amenities
    if (data.features && data.features.length > 0) {
      lines.push(`Amenities include: ${data.features.join(', ')}.`);
    }

    // Availability
    if (data.available24_7) {
      lines.push(`The space is available 24 hours on all days.`);
    } else if (data.openTime && data.closeTime) {
      const days = data.daysAvailable ? data.daysAvailable.length : 7;
      lines.push(`The space is available ${days} days per week from ${data.openTime} to ${data.closeTime}.`);
    }

    // Permit requirements
    if (data.permitRequired === 'yes') {
      lines.push(`A permit is required for this parking space - instructions for collection will be provided in your confirmation email.`);
    }

    // Booking flexibility
    const bookingTypes = [];
    if (data.acceptMonthlyBookings) bookingTypes.push('monthly bookings');
    if (data.acceptHourlyDailyBookings) bookingTypes.push('hourly and daily bookings');
    if (bookingTypes.length > 0) {
      lines.push(`We accept ${bookingTypes.join(' and ')}.`);
    }

    // Multiple access
    if (data.spaceType) {
      lines.push(`You can enter/exit this location multiple times throughout the duration of your booking.`);
    }

    // Pricing model
    if (data.pricingModel === 'dynamic') {
      lines.push(`Pricing is dynamically adjusted based on market demand to ensure competitive rates.`);
    } else if (data.pricingModel === 'static') {
      lines.push(`Fixed pricing available for this space.`);
    }

    return lines.join(' ');
  };

  const generatePostBookingInstructions = () => {
    const lines = [];

    // Location and access
    if (data.address && data.postalCode && data.town) {
      lines.push(`The space is located at ${data.address}, ${data.town}, ${data.postalCode}.`);
    }

    // Permit instructions
    if (data.permitRequired === 'yes') {
      lines.push(`You will need to arrange to collect a permit for access to ensure that you don't receive a Parking Charge, the space owner details are below.`);
    }

    // Access control instructions
    if (data.accessControl === 'yes' && data.accessControlType) {
      const accessTypeMap: Record<string, string> = {
        'gate': 'Gate code or remote',
        'key': 'Key will be provided',
        'code': 'Access code will be provided',
        'keycard': 'Keycard will be provided',
        'remote': 'Remote control will be provided'
      };
      lines.push(`Access to the space is controlled by ${accessTypeMap[data.accessControlType] || data.accessControlType}. Instructions will be provided upon booking confirmation.`);
    }

    // Overnight and multiple access
    if (data.allowOvernightBookings) {
      lines.push(`Overnight parking is permitted. You can enter and exit the space as needed during your booking period.`);
    } else {
      lines.push(`You can enter/exit this location multiple times throughout the duration of your booking.`);
    }

    // Notice period
    if (data.noticeRequired && data.noticeRequired !== '') {
      const noticeMap: Record<string, string> = {
        'no_notice': 'No notice required',
        '15_min': '15 minutes notice',
        '30_min': '30 minutes notice',
        '1_hour': '1 hour notice',
        '2_hours': '2 hours notice',
        'half_day': 'Half day notice',
        'full_day': 'Full day notice'
      };
      if (noticeMap[data.noticeRequired]) {
        lines.push(`Please note: ${noticeMap[data.noticeRequired]} is required before visiting the space.`);
      }
    }

    // Contact information
    lines.push(`Should you require any assistance, you can contact the space owner, Karlo on [Contact Number].`);

    return lines.join(' ');
  };

  const isStep1Complete = !!(data.region && data.address && data.town && data.latitude && data.longitude);
  const isStep2Complete = !!(data.openTime && data.closeTime && data.permits);
  const isStep3Complete = data.photos.length >= 3 && !!(data.type && data.capacity && data.features.length > 0);

  const canProceed = () => {
    if (step === 1) {
      if (step1Sub === 'region') return !!(data.region && data.address && citySelected);
      if (step1Sub === 'map') return !!(data.latitude && data.longitude);
      if (step1Sub === 'name') return !!(data.name && data.spaceType && parseInt(data.spaceType) > 0);
      if (step1Sub === 'type') return !!data.type;
      if (step1Sub === 'features') return data.features.length > 0;
      if (step1Sub === 'vehicleSize') return !!data.vehicleSize;
      if (step1Sub === 'accessControl') return true;
    }
    if (step === 2) return true;
    if (step === 3) return !!data.type;
    return true;
  };



  const handleNext = async () => {
    console.log('📍 handleNext - step:', currentStepValue, 'sub:', currentSubStepValue);

    if (currentStepValue === 1) {
      if (currentSubStepValue === 'region') {
        console.log('🏠 Step 1a → geocoding full address and moving to map');
        await geocodeFullAddress();
        setStep1Sub('map');
        return;
      }
      if (currentSubStepValue === 'map') {
        console.log('🗺️ Step 1b → moving to name');
        setStep1Sub('name');
        return;
      }
      if (currentSubStepValue === 'name') {
        console.log('📝 Step 1c → moving to type');
        setStep1Sub('type');
        return;
      }
      if (currentSubStepValue === 'type') {
        console.log('🎨 Step 1d → moving to features');
        setStep1Sub('features');
        return;
      }
      if (currentSubStepValue === 'features') {
        console.log('⭐ Step 1e → moving to vehicleSize');
        setStep1Sub('vehicleSize');
        return;
      }
      if (currentSubStepValue === 'vehicleSize') {
        console.log('🚗 Step 1f → moving to accessControl');
        setStep1Sub('accessControl');
        return;
      }
      if (currentSubStepValue === 'accessControl') {
        console.log('🔐 Step 1g → moving to review');
        setStep('review');
        return;
      }
    }
    if (currentStepValue === 2) {
      if (currentStep2SubValue === 'availability') {
        console.log('📅 Step 2a → moving to booking start');
        setStep2Sub('bookingStart');
        return;
      }
      if (currentStep2SubValue === 'bookingStart') {
        console.log('📅 Step 2b → moving to calendar preview');
        setStep2Sub('calendarPreview');
        return;
      }
      if (currentStep2SubValue === 'calendarPreview') {
        console.log('🗓️ Step 2c → moving to booking window');
        setStep2Sub('bookingWindow');
        return;
      }
      if (currentStep2SubValue === 'bookingWindow') {
        console.log('📅 Step 2d → moving to booking types');
        setStep2Sub('bookingTypes');
        return;
      }
      if (currentStep2SubValue === 'bookingTypes') {
        console.log('📋 Step 2e → moving to pricing');
        setStep2Sub('pricing');
        return;
      }
      if (currentStep2SubValue === 'pricing') {
        console.log('💰 Step 2f → moving to description');
        setStep2Sub('description');
        return;
      }
      if (currentStep2SubValue === 'description') {
        console.log('📝 Step 2g → moving to post-booking instructions');
        setStep2Sub('postBookingInstructions');
        return;
      }
      if (currentStep2SubValue === 'postBookingInstructions') {
        console.log('📋 Step 2h → moving to section 2 review');
        setStep2Sub('review2');
        return;
      }
      if (currentStep2SubValue === 'review2') {
        console.log('✅ Step 2 review → published, navigating to dashboard');
        router.push('/members?refresh=listings');
        return;
      }
    }
    if (currentStepValue === 3) {
      if (currentStep3SubValue === 'photos') {
        console.log('📸 Step 3a → moving to street view');
        setStep3Sub('streetView');
        return;
      }
      if (currentStep3SubValue === 'streetView') {
        console.log('🗺️ Step 3b → moving to summary');
        setStep3Sub('summary');
        return;
      }
      if (currentStep3SubValue === 'summary') {
        console.log('✅ Step 3c → moving to review3');
        setStep3Sub('review3');
        return;
      }
      if (currentStep3SubValue === 'review3') {
        console.log('✅ Step 3 review → published, updating verification status');
        if (listingId && supabase) {
          await supabase
            .from('locations')
            .update({ verification_status: 'pending' })
            .eq('id', listingId);
        }
        router.push('/members?refresh=listings');
        return;
      }
    }
  };

  const handleBack = () => {
    if (currentStepValue === 1) {
      if (currentSubStepValue === 'region') {
        setStep('intro');
        return;
      }
      if (currentSubStepValue === 'map') {
        setStep1Sub('region');
        return;
      }
      if (currentSubStepValue === 'name') {
        setStep1Sub('map');
        return;
      }
      if (currentSubStepValue === 'type') {
        setStep1Sub('name');
        return;
      }
      if (currentSubStepValue === 'features') {
        setStep1Sub('type');
        return;
      }
      if (currentSubStepValue === 'vehicleSize') {
        setStep1Sub('features');
        return;
      }
      if (currentSubStepValue === 'accessControl') {
        setStep1Sub('vehicleSize');
        return;
      }
    } else if (currentStepValue === 2) {
      if (currentStep2SubValue === 'review2') {
        setStep2Sub('postBookingInstructions');
        return;
      }
      if (currentStep2SubValue === 'postBookingInstructions') {
        setStep2Sub('description');
        return;
      }
      if (currentStep2SubValue === 'description') {
        setStep2Sub('pricing');
        return;
      }
      if (currentStep2SubValue === 'pricing') {
        setStep2Sub('bookingTypes');
        return;
      }
      if (currentStep2SubValue === 'bookingTypes') {
        setStep2Sub('bookingWindow');
        return;
      }
      if (currentStep2SubValue === 'bookingWindow') {
        setStep2Sub('calendarPreview');
        return;
      }
      if (currentStep2SubValue === 'calendarPreview') {
        setStep2Sub('bookingStart');
        return;
      }
      if (currentStep2SubValue === 'bookingStart') {
        setStep2Sub('availability');
        return;
      }
      if (currentStep2SubValue === 'availability') {
        setStep1Sub('accessControl');
        setStep(1);
        return;
      }
    } else if (currentStepValue === 3) {
      if (currentStep3SubValue === 'review3') {
        setStep3Sub('summary');
        return;
      }
      if (currentStep3SubValue === 'summary') {
        setStep3Sub('streetView');
        return;
      }
      if (currentStep3SubValue === 'streetView') {
        setStep3Sub('photos');
        return;
      }
      if (currentStep3SubValue === 'photos') {
        setStep2Sub('postBookingInstructions');
        setStep(2);
        return;
      }
    } else if (currentStepValue === 'review') {
      setStep(3);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [listingId, setListingId] = useState<string | null>(editId || null);
  const [sectionsSaved, setSectionsSaved] = useState<{ section1: boolean; section2: boolean; section3: boolean }>({
    section1: false,
    section2: false,
    section3: false,
  });

  const completionPercent = Math.round(
    ((sectionsSaved.section1 ? 1 : 0) +
     (sectionsSaved.section2 ? 1 : 0) +
     (sectionsSaved.section3 ? 1 : 0)) / 3 * 100
  );

  const handleSaveSection = async (section: 1 | 2 | 3) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      if (!supabase) throw new Error('Supabase nije konfiguriran');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niste prijavljeni');

      // Ensure profile exists
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Niste prijavljeni');

      await fetch('/api/ensure-profile', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Section 1: Create new listing
      if (section === 1 && !listingId) {
        const address = `${data.address}${data.addressLine2 ? ', ' + data.addressLine2 : ''}, ${data.town}, ${data.postalCode}`.replace(/^,\s*|,\s*$/g, '');
        const capacity = parseInt(data.spaceType) || 1;
        const displayId = (Date.now() % 90000) + 10000;
        const nameLower = (data.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        const slugSeed = nameLower.trim() || String(displayId);
        const canonicalSlug = `${slugSeed}-${displayId}`;

        const { data: newListing, error } = await supabase.from('locations').insert({
          owner_id: user.id,
          name: data.name,
          address,
          latitude: parseFloat(data.latitude) || 0,
          longitude: parseFloat(data.longitude) || 0,
          capacity,
          total_spots: capacity,
          occupancy: 0,
          base_price_hourly: 0,
          base_price_daily: 0,
          base_price_monthly: 0,
          display_id: String(displayId),
          canonical_slug: canonicalSlug,
          valet_enabled: false,
          shuttle_enabled: false,
          addons_config: {},
          verification_status: 'unverified',
          verification_metadata: {
            listing_status: 'pending',
            section_status: { section1: true, section2: false, section3: false },
            type: data.type,
            features: data.features,
            accessControl: data.accessControl || 'no',
            accessControlType: data.accessControlType || '',
            requiresPermit: data.permitRequired === 'yes',
            spaceAllocated: data.spaceAllocated || '',
            addressLine2: data.addressLine2 || '',
            description: '',
            additionalDescription: data.additionalDescription || '',
            postBookingInstructions: data.postBookingInstructions || '',
            photos: [],
            streetView: '',
            hasHeightRestrictions: data.heightRestrictions === 'yes',
            hasAccessControl: data.accessControl === 'yes',
            spaceType: data.spaceType || '',
            openTime: data.available24_7 ? '00:00' : data.openTime,
            closeTime: data.available24_7 ? '24:00' : data.closeTime,
            available24_7: data.available24_7,
            daysAvailable: data.daysAvailable,
            vehicleSize: data.vehicleSize,
            maxHeight: data.maxHeight,
            permits: data.permitRequired || 'no',
            created_at: new Date().toISOString(),
          },
        }).select();

        if (error) throw new Error(error.message);
        const newId = newListing?.[0]?.id;
        if (newId) {
          // Promote user to manager role when creating first location
          try {
            if (user?.id) {
              await supabase
                .from('profiles')
                .upsert({ id: user.id, role: 'manager' }, { onConflict: 'id', ignoreDuplicates: false });
            }
          } catch (err) {
            console.warn('Failed to promote user to manager:', err);
          }

          setListingId(newId);
          setSectionsSaved({ section1: true, section2: false, section3: false });
          setStep('intro');
          router.push(`/list-your-parking?edit=${newId}`);
        }
      }
      // Section 1: Update existing listing
      else if (section === 1 && listingId) {
        const updateData: any = {
          name: data.name,
          address: `${data.address}${data.addressLine2 ? ', ' + data.addressLine2 : ''}, ${data.town}, ${data.postalCode}`.replace(/^,\s*|,\s*$/g, ''),
          latitude: parseFloat(data.latitude) || 0,
          longitude: parseFloat(data.longitude) || 0,
          capacity: parseInt(data.spaceType) || 1,
          verification_metadata: {
            listing_status: 'pending',
            section_status: { section1: true, section2: sectionsSaved.section2, section3: sectionsSaved.section3 },
            type: data.type,
            features: data.features,
            addOns: data.addOns,
            accessControl: data.accessControl || 'no',
            accessControlType: data.accessControlType || '',
            requiresPermit: data.permitRequired === 'yes',
            spaceAllocated: data.spaceAllocated || '',
            addressLine2: data.addressLine2 || '',
            description: '',
            additionalDescription: data.additionalDescription || '',
            postBookingInstructions: data.postBookingInstructions || '',
            photos: [],
            streetView: '',
            hasHeightRestrictions: data.heightRestrictions === 'yes',
            hasAccessControl: data.accessControl === 'yes',
            spaceType: data.spaceType || '',
            openTime: data.available24_7 ? '00:00' : data.openTime,
            closeTime: data.available24_7 ? '24:00' : data.closeTime,
            available24_7: data.available24_7,
            daysAvailable: data.daysAvailable,
            vehicleSize: data.vehicleSize,
            maxHeight: data.maxHeight,
            permits: data.permitRequired || 'no',
            town: data.town,
            postalCode: data.postalCode,
            region: data.region,
          },
        };

        const { error } = await supabase.from('locations').update(updateData).eq('id', listingId);
        if (error) throw new Error(error.message);

        setSectionsSaved({ ...sectionsSaved, section1: true });
        setStep('intro');
      }
      // Section 2: Update booking/pricing settings
      else if (section === 2 && listingId) {
        const updateData: any = {
          verification_metadata: {
            listing_status: 'pending',
            section_status: { section1: sectionsSaved.section1, section2: true, section3: sectionsSaved.section3 },
            type: data.type,
            features: data.features,
            addOns: data.addOns,
            accessControl: data.accessControl || 'no',
            accessControlType: data.accessControlType || '',
            requiresPermit: data.permitRequired === 'yes',
            spaceAllocated: data.spaceAllocated || '',
            addressLine2: data.addressLine2 || '',
            description: '',
            additionalDescription: data.additionalDescription || '',
            postBookingInstructions: data.postBookingInstructions || '',
            photos: [],
            streetView: '',
            hasHeightRestrictions: data.heightRestrictions === 'yes',
            hasAccessControl: data.accessControl === 'yes',
            spaceType: data.spaceType || '',
            openTime: data.available24_7 ? '00:00' : data.openTime,
            closeTime: data.available24_7 ? '24:00' : data.closeTime,
            available24_7: data.available24_7,
            daysAvailable: data.daysAvailable,
            vehicleSize: data.vehicleSize,
            maxHeight: data.maxHeight,
            permits: data.permitRequired || 'no',
            town: data.town,
            postalCode: data.postalCode,
            region: data.region,
            acceptMonthlyBookings: data.acceptMonthlyBookings,
            acceptHourlyDailyBookings: data.acceptHourlyDailyBookings,
            pricingModel: data.pricingModel,
            noticeRequired: data.noticeRequired,
            bookingWindow: data.bookingWindow,
            startTakingBookingsToday: data.startTakingBookingsToday,
          },
        };

        const { error } = await supabase.from('locations').update(updateData).eq('id', listingId);
        if (error) throw new Error(error.message);

        setSectionsSaved({ ...sectionsSaved, section2: true });
        setStep('intro');
      }
      // Section 3: Update photos and street view
      else if (section === 3 && listingId) {
        // Upload new File photos to Supabase Storage
        const uploadedUrls: string[] = [...data.photoUrls];
        for (const file of data.photos) {
          const ext = file.name.split('.').pop() || 'jpg';
          const path = `${listingId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('listing-photos')
            .upload(path, file, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path);
            if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
          }
        }

        const updateData: any = {
          verification_metadata: {
            listing_status: 'pending',
            section_status: { section1: sectionsSaved.section1, section2: sectionsSaved.section2, section3: true },
            type: data.type,
            features: data.features,
            addOns: data.addOns,
            accessControl: data.accessControl || 'no',
            accessControlType: data.accessControlType || '',
            requiresPermit: data.permitRequired === 'yes',
            spaceAllocated: data.spaceAllocated || '',
            addressLine2: data.addressLine2 || '',
            description: '',
            additionalDescription: data.additionalDescription || '',
            postBookingInstructions: data.postBookingInstructions || '',
            hasHeightRestrictions: data.heightRestrictions === 'yes',
            hasAccessControl: data.accessControl === 'yes',
            spaceType: data.spaceType || '',
            openTime: data.available24_7 ? '00:00' : data.openTime,
            closeTime: data.available24_7 ? '24:00' : data.closeTime,
            available24_7: data.available24_7,
            daysAvailable: data.daysAvailable,
            vehicleSize: data.vehicleSize,
            maxHeight: data.maxHeight,
            permits: data.permitRequired || 'no',
            town: data.town,
            postalCode: data.postalCode,
            region: data.region,
            acceptMonthlyBookings: data.acceptMonthlyBookings,
            acceptHourlyDailyBookings: data.acceptHourlyDailyBookings,
            pricingModel: data.pricingModel,
            noticeRequired: data.noticeRequired,
            bookingWindow: data.bookingWindow,
            startTakingBookingsToday: data.startTakingBookingsToday,
            photo_urls: uploadedUrls,
            photos_count: uploadedUrls.length,
            streetview_configured: true,
          },
        };

        const { error } = await supabase.from('locations').update(updateData).eq('id', listingId);
        if (error) throw new Error(error.message);
        // Update local state so photos show immediately after save
        setData((prev) => ({ ...prev, photoUrls: uploadedUrls, photos: [] }));

        setSectionsSaved({ ...sectionsSaved, section3: true });
        setStep('intro');
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Greška pri spremanju');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── INTRO ─────────────────────────────────────────────────────────────
  if (currentStepValue === 'intro') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Great Progress, Karlo!</h2>
          <p className="text-gray-600">Now let's get some details about your space so you can publish your listing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="col-span-2 space-y-4">
            {completionPercent === 100 ? (
              <>
                <div className="border-2 border-green-700 bg-green-50 rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-black mb-2">100% Dovršeno!</div>
                  <p className="text-black font-semibold mb-2">Vaš popis je spreman.</p>
                  <p className="text-sm text-black/70">Upravljajte kalendarom i cijenama u nastavku.</p>
                </div>
                <button
                  onClick={() => router.push('/members?refresh=listings')}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Idi na upravljanje
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                {[
                  { n: 1 as MainStep, title: 'Locations, features and more', sub: 'Add location, address and pin it on the map', done: sectionsSaved.section1 },
                  { n: 2 as MainStep, title: 'Get ready for drivers', sub: 'Bookings, settings, calendar, price', done: sectionsSaved.section2 },
                  { n: 3 as MainStep, title: 'Build the picture', sub: 'Photos and street view', done: sectionsSaved.section3 },
                ].map(({ n, title, sub, done }) => (
                  <button
                    key={String(n)}
                    disabled={done}
                    onClick={() => {
                      setStep(n);
                      if (n === 1) setStep1Sub('region');
                      if (n === 2) setStep2Sub('availability');
                      if (n === 3) setStep3Sub('photos');
                    }}
                    className={`w-full border rounded-lg p-6 transition-all text-left ${done ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-60' : 'border-gray-200 hover:shadow-md cursor-pointer hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Step {n} {done && '✓'}</h3>
                        <p className="text-gray-600">{title}</p>
                      </div>
                      <div className={`text-2xl font-bold ${done ? 'text-green-500' : 'text-[#5F3DFC]'}`}>
                        {done ? '✓' : n}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{sub}</p>
                    {done && <p className="text-xs text-green-600 font-semibold mt-2">✓ Dovršeno i zaključano (nakon objave ćete moći ponovno urediti podatke)</p>}
                  </button>
                ))}
              </>
            )}

            {!sectionsSaved.section1 && (
              <div className="space-y-2 mt-2">
                <button
                  onClick={() => { setStep(1); setStep1Sub('region'); }}
                  className="w-full px-6 py-3 bg-[#5F3DFC] text-white rounded-lg font-semibold hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2"
                >
                  Start with the basics
                  <ChevronRight className="w-5 h-5" />
                </button>
                <a
                  href="https://www.payparq.com/host"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3 bg-white border-2 border-[#5F3DFC] text-[#5F3DFC] rounded-lg font-semibold hover:bg-[#5F3DFC]/5 transition-colors flex items-center justify-center gap-2"
                >
                  ⚡ Instant Listing
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            )}
          </div>

          <div className="col-span-1">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-6">
              <div className="flex items-start gap-2 mb-3">
                <p className="text-sm text-gray-700 leading-snug">U vašem području, prostori mogu zaraditi i do</p>
                <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <p className="text-3xl font-bold text-[#5F3DFC]">
                €6,912.00
                <span className="text-lg font-normal text-gray-600 block">godišnje</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP HEADER ───────────────────────────────────────────────────────
  const stepTitle = currentStepValue === 1
    ? currentSubStepValue === 'region' ? 'Where is your parking space located?' : currentSubStepValue === 'map' ? 'Pin your exact location' : 'Name your parking space'
    : currentStepValue === 2 ? 'Get ready for drivers'
    : 'Build the picture';

  const stepSub = currentStepValue === 1
    ? currentSubStepValue === 'region' ? 'Select region, then enter your address' : currentSubStepValue === 'map' ? 'Click the map to mark your parking entrance' : 'Give your parking space a name'
    : currentStepValue === 2 ? 'Set availability and pricing'
    : 'Add photos and space details';

  const stepProgress = currentStepValue === 1
    ? currentSubStepValue === 'region' ? '1a' : currentSubStepValue === 'map' ? '1b' : '1c'
    : String(currentStepValue);

  return (
    <div className="h-full bg-white flex flex-col w-full">
      <ListingHeader currentStep={currentStepValue} currentSubStep={currentSubStepValue} onBack={handleBack} />

      {/* Section Progress Indicator */}
      {(currentStepValue === 1 || currentStepValue === 2 || currentStepValue === 3) && (
        <div className="bg-gray-50 px-4 md:px-6 py-3 border-b border-gray-200 flex items-center justify-center md:justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${sectionsSaved.section1 ? 'bg-green-500 text-white' : 'bg-[#5F3DFC] text-white'}`}>
                {sectionsSaved.section1 ? '✓' : '1'}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${sectionsSaved.section2 ? 'bg-green-500 text-white' : 'bg-[#5F3DFC] text-white'}`}>
                {sectionsSaved.section2 ? '✓' : '2'}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${sectionsSaved.section3 ? 'bg-green-500 text-white' : 'bg-[#5F3DFC] text-white'}`}>
                {sectionsSaved.section3 ? '✓' : '3'}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">Photos</span>
            </div>
          </div>
          <div className="hidden md:block text-sm font-semibold text-gray-600">{completionPercent}% Complete</div>
        </div>
      )}

      <div className="h-full w-full flex m-0 p-0">

      {/* ── STEP 1: Choose Country ── */}
      {currentStepValue === 1 && currentSubStepValue === 'region' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left white sector - 65% */}
          <div className="w-full md:flex-[0_0_65%] bg-white py-6 md:h-full">
            <div className="px-6 space-y-5 h-full">
              {/* Welcome message */}
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Bok! Pripremamo vas da postanete vlasnik parkinga.</h2>
              </div>
              {/* Main content area */}
              <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Where is your parking space located?</label>
              <select
                value={data.region}
                onChange={(e) => updateData('region', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-6 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                style={{colorScheme: 'light'}}
              >
                <option value="">Select a country</option>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {data.region && isLoaded && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <Autocomplete
                    onLoad={(instance) => {
                      console.log('🔌 City Autocomplete loaded');
                      cityAutocompleteRef.current = instance;
                    }}
                    onPlaceChanged={handleCitySelect}
                    options={{
                      componentRestrictions: { country: data.region.toLowerCase() },
                      types: ['locality', 'administrative_area_level_2']
                    }}
                  >
                    <input
                      type="text"
                      value={data.town}
                      onChange={(e) => {
                        updateData('town', e.target.value);
                        setCitySelected(false);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                    />
                  </Autocomplete>
                </div>

                {citySelected && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address 1</label>
                      <input
                        type="text"
                        value={data.address}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateData('address', value);
                          console.log('📝 Address changed to:', value);
                        }}
                        autoComplete="off"
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        translate="no"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address 2</label>
                      <input
                        type="text"
                        value={data.addressLine2}
                        onChange={(e) => updateData('addressLine2', e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Poštanski broj</label>
                      <input
                        type="text"
                        value={data.postalCode}
                        onChange={(e) => updateData('postalCode', e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={handleNext} disabled={!canProceed()} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              Nastaviti
              <ChevronRight className="w-4 h-4" />
            </button>
            </div>
            </div>
          </div>
          {/* Right white sector with widget */}
          <div className="w-full md:flex-[0_0_35%] bg-white py-6 flex items-center justify-center md:h-full">
            <div className="w-80">
              <div className="sticky top-6">
                <InfoWidget tip="Your exact address will only be shared with confirmed bookings." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Verify Location ── */}
      {currentStepValue === 1 && currentSubStepValue === 'map' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="w-full md:flex-[0_0_65%] bg-white py-6 md:h-full flex flex-col overflow-hidden">
            <div className="px-6 space-y-3 h-full flex flex-col overflow-hidden">
              <div className="animate-fadeIn flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Pritisnite kartu kako biste označili točan ulaz na svoje parkirno mjesto.</h2>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-shrink-0">
                <p className="text-sm font-medium text-gray-900">Address:</p>
                <p className="text-xs text-gray-700">
                  {data.address}{data.addressLine2 && ` ${data.addressLine2}`}{data.town && `, ${data.town}`}{data.postalCode && ` ${data.postalCode}`}
                </p>
              </div>
              <button onClick={() => setStep1Sub('region')} className="px-0 py-1 text-[#5F3DFC] text-xs font-medium hover:text-[#4330c4] transition-colors flex-shrink-0">
                ✎ Uredi adresu
              </button>
              <div style={{ height: '500px' }} className="rounded-lg overflow-hidden border border-gray-300">
                <DynamicMap
                  lat={data.latitude ? parseFloat(data.latitude) : mapCenter[0]}
                  lng={data.longitude ? parseFloat(data.longitude) : mapCenter[1]}
                  onLocationSelect={(lat, lng) => {
                    updateData('latitude', String(lat));
                    updateData('longitude', String(lng));
                  }}
                  fullScreen={true}
                />
              </div>
              {data.latitude && data.longitude && (
                <p className="text-xs text-green-600 font-medium flex-shrink-0">✓ Entrance marked at {parseFloat(data.latitude).toFixed(4)}, {parseFloat(data.longitude).toFixed(4)}</p>
              )}
              <button onClick={handleNext} disabled={!canProceed()} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 flex-shrink-0">
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-white py-6 flex items-center justify-center md:h-full">
            <div className="w-80">
              <div className="sticky top-6">
                <InfoWidget tip="Pin the exact entrance so drivers can navigate directly to your parking space." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Name Your Space ── */}
      {currentStepValue === 1 && currentSubStepValue === 'name' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-5">
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Nazovite svoje parkirno mjesto.</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parking Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  placeholder="e.g., Downtown Parking A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">This is what drivers will see when searching for parking</p>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Koliko parking mjesta imate?</label>
                <p className="text-xs text-gray-600 mb-3">Unesite točan broj dostupnih mjesta</p>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={data.spaceType ? String(data.spaceType) : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateData('spaceType', v === '' ? '' : String(parseInt(v) || ''));
                  }}
                  placeholder="npr. 1, 5, 10..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                />
              </div>

              <button onClick={handleNext} disabled={!canProceed()} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-white py-6 flex items-center justify-center md:h-full">
            <div className="w-80">
              <div className="sticky top-6 space-y-4">
                <InfoWidget tip="Choose a clear, descriptive name that helps drivers identify your parking space easily." />
                <div className="bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-6">
                  <div className="flex items-start gap-2 mb-3">
                    <p className="text-sm text-gray-700 leading-snug font-medium">Korisne Informacije</p>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">Unesite točan broj parking mjesta koja su dostupna za rezervacije. To će biti prikazano na vašem popisu i kalendaru dostupnosti.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1d: Parking Type ── */}
      {currentStepValue === 1 && currentSubStepValue === 'type' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Vrsta parkinga.</h2>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900">What best describes your parking space?</h3>
                <p className="text-sm text-gray-600">Select a type of space</p>
                <select value={data.type} onChange={(e) => updateData('type', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" style={{colorScheme: 'light'}}>
                  <option value="">Select a type of space</option>
                  <option value="private_driveway">Private Driveway</option>
                  <option value="commercial_carpark">Commercial Car Park</option>
                  <option value="residential_carpark">Residential Car Park</option>
                  <option value="lockup_garage">Lock-Up Garage</option>
                </select>
                <p className="text-sm text-gray-600 mt-2">Here are a few examples:</p>
              </div>

              <button onClick={handleNext} disabled={!canProceed()} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-900">Here are a few examples:</p>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Private Driveway</h4>
                <p className="text-xs text-gray-700 leading-relaxed">A personal residential driveway. Typically fits 1-3 vehicles. Located at a private home or residence. Single entrance/exit. Good for homeowners looking to rent their driveway space.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Commercial Car Park</h4>
                <p className="text-xs text-gray-700 leading-relaxed">Large organized parking lot or multi-level structure. Professional management with marked spaces. Located in commercial areas, city centers, or near businesses.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Residential Car Park</h4>
                <p className="text-xs text-gray-700 leading-relaxed">Parking area at apartment building or residential complex. Shared spaces for residents and guests. Multiple vehicles in designated areas. Secure access with gates or barriers.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Lock-Up Garage</h4>
                <p className="text-xs text-gray-700 leading-relaxed">Individual secure garage unit or storage space. Complete privacy and protection from weather. Single vehicle capacity. Locked access with personal keys. Ideal for secure long-term parking.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1e: Features/Add-ons ── */}
      {currentStepValue === 1 && currentSubStepValue === 'features' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Mogućnosti i dodaci.</h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Koje karakteristike ima vaš prostor?</h3>
                <p className="text-sm text-gray-600">Odaberite sve primjenjivo</p>
                <div className="space-y-2">
                  {['EV punjenje', 'Pokriveno', 'Gated', 'Dobro osvijetljen', 'CCTV', 'Pristup invalidskim kolicima', 'Zaštićeno od vremenskih uvjeta', 'Valet usluga', 'Autopraonica', 'Čuvar parkinga'].map((feature) => (
                    <button
                      key={feature}
                      onClick={() => updateData('features', data.features.includes(feature) ? data.features.filter(f => f !== feature) : [...data.features, feature])}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: data.features.includes(feature) ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.features.includes(feature) ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', border: `2px solid ${data.features.includes(feature) ? '#5F3DFC' : '#9CA3AF'}`, borderRadius: '4px', transition: 'all 0.2s'}}>
                        {data.features.includes(feature) && (
                          <span style={{color: '#5F3DFC', fontSize: '16px', lineHeight: '1'}}>✓</span>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{feature}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleNext} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-white py-6 flex items-center justify-center md:h-full">
            <div className="w-80">
              <div className="sticky top-6">
                <InfoWidget tip="Select features that make your parking space stand out. These help drivers find exactly what they need." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1f: Vehicle Size & Height ── */}
      {currentStepValue === 1 && currentSubStepValue === 'vehicleSize' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Veličina vozila.</h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Koje veličine vozila može stati vaše parkirno mjesto?</h3>
                <p className="text-sm text-gray-600">Veličina parkirnog mjesta</p>
                <div className="space-y-3">
                  {[
                    { id: 'small', label: 'Mali parking' },
                    { id: 'medium', label: 'Srednje parkirno mjesto' },
                    { id: 'large', label: 'Veliko parkirno mjesto' },
                    { id: 'commercial', label: 'Komercijalno vozilo (Kombi, kamion)' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('vehicleSize', id)}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: data.vehicleSize === id ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.vehicleSize === id ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${data.vehicleSize === id ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {data.vehicleSize === id && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900">Postoje li neka ograničenja visine?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'yes', label: 'Yes' },
                    { id: 'no', label: 'No' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('heightRestrictions', id === 'yes')}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: (data.heightRestrictions && id === 'yes') || (!data.heightRestrictions && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.heightRestrictions && id === 'yes') || (!data.heightRestrictions && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.heightRestrictions && id === 'yes') || (!data.heightRestrictions && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {((data.heightRestrictions && id === 'yes') || (!data.heightRestrictions && id === 'no')) && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {data.heightRestrictions && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Maximum Height (in meters)</label>
                  <input
                    type="number"
                    value={data.maxHeight}
                    onChange={(e) => updateData('maxHeight', e.target.value)}
                    placeholder="e.g., 2.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  />
                </div>
              )}

              <button onClick={handleNext} disabled={!canProceed()} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-white py-6 flex items-center justify-center md:h-full">
            <div className="w-80">
              <div className="sticky top-6">
                <InfoWidget tip="Be clear about vehicle size limitations. This helps drivers find parking that fits their vehicle." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1g: Access Control ── */}
      {currentStepValue === 1 && currentSubStepValue === 'accessControl' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Kako se pristupa vašem prostoru?</h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Postoji li kontrola pristupa?</h3>
                <p className="text-sm text-gray-600">Select if access control is required</p>
                <div className="space-y-3">
                  {[
                    { id: 'yes', label: 'Yes' },
                    { id: 'no', label: 'No' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('accessControl', id)}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: (data.accessControl === 'yes' && id === 'yes') || (data.accessControl === 'no' && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.accessControl === 'yes' && id === 'yes') || (data.accessControl === 'no' && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.accessControl === 'yes' && id === 'yes') || (data.accessControl === 'no' && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {((data.accessControl === 'yes' && id === 'yes') || (data.accessControl === 'no' && id === 'no')) && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {data.accessControl === 'yes' && (
                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kod (Vrsta Pristupa)</label>
                    <select value={data.accessControlType} onChange={(e) => updateData('accessControlType', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" style={{colorScheme: 'light'}}>
                      <option value="">Odaberite vrstu pristupa</option>
                      <option value="gate">Kapija/Vrata</option>
                      <option value="key">Ključ</option>
                      <option value="code">Kod</option>
                      <option value="keycard">Kartica</option>
                      <option value="remote">Daljinska</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Je li potrebna dozvola?</label>
                <div className="space-y-3">
                  {[
                    { id: 'yes', label: 'Yes' },
                    { id: 'no', label: 'No' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('permitRequired', id)}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: (data.permitRequired === 'yes' && id === 'yes') || (data.permitRequired === 'no' && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.permitRequired === 'yes' && id === 'yes') || (data.permitRequired === 'no' && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.permitRequired === 'yes' && id === 'yes') || (data.permitRequired === 'no' && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {((data.permitRequired === 'yes' && id === 'yes') || (data.permitRequired === 'no' && id === 'no')) && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Space Allocation</label>
                <input
                  type="text"
                  value={data.spaceAllocated}
                  onChange={(e) => updateData('spaceAllocated', e.target.value)}
                  placeholder="e.g., Spot A1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                />
              </div>

              <button onClick={handleNext} disabled={!canProceed()} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-6">
                Publish
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-white py-6 flex items-center justify-center md:h-full">
            <div className="w-80">
              <div className="sticky top-6">
                <InfoWidget tip="Clearly specify how drivers will access your parking space to avoid confusion." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2a: Availability Settings ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'availability' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Hi, Karlo! Let's get you ready to accept bookings from drivers</h2>
              </div>

              {/* 24/7 Question */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Is your space available 24/7?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'yes', label: 'Yes' },
                    { id: 'no', label: 'No' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('available24_7', id === 'yes')}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: (data.available24_7 && id === 'yes') || (!data.available24_7 && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.available24_7 && id === 'yes') || (!data.available24_7 && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.available24_7 && id === 'yes') || (!data.available24_7 && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {((data.available24_7 && id === 'yes') || (!data.available24_7 && id === 'no')) && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {!data.available24_7 && (
                <>
                  {/* Days Available */}
                  <div className="space-y-4 border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-base font-semibold text-gray-900">What days is your space available?</h3>
                    <div className="space-y-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <button
                          key={day}
                          onClick={() => updateData('daysAvailable', data.daysAvailable.includes(day) ? data.daysAvailable.filter(d => d !== day) : [...data.daysAvailable, day])}
                          className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                          style={{borderColor: data.daysAvailable.includes(day) ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.daysAvailable.includes(day) ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                        >
                          <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', border: `2px solid ${data.daysAvailable.includes(day) ? '#5F3DFC' : '#9CA3AF'}`, borderRadius: '4px', transition: 'all 0.2s'}}>
                            {data.daysAvailable.includes(day) && (
                              <span style={{color: '#5F3DFC', fontSize: '16px', lineHeight: '1'}}>✓</span>
                            )}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900 capitalize">{day}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Access Hours */}
                  <div className="space-y-4 border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-base font-semibold text-gray-900">What are the access hours for each day?</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'same', label: 'Same for all' },
                        { id: 'different', label: 'Different for each day' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => updateData('accessHoursSameForAll', id === 'same')}
                          className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                          style={{borderColor: (data.accessHoursSameForAll && id === 'same') || (!data.accessHoursSameForAll && id === 'different') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.accessHoursSameForAll && id === 'same') || (!data.accessHoursSameForAll && id === 'different') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                        >
                          <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.accessHoursSameForAll && id === 'same') || (!data.accessHoursSameForAll && id === 'different') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                            {((data.accessHoursSameForAll && id === 'same') || (!data.accessHoursSameForAll && id === 'different')) && (
                              <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                            )}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                        </button>
                      ))}
                    </div>

                    {data.accessHoursSameForAll && (
                      <div className="space-y-3 pt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                          <input type="time" value={data.openTime} onChange={(e) => updateData('openTime', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                          <input type="time" value={data.closeTime} onChange={(e) => updateData('closeTime', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" />
                        </div>
                      </div>
                    )}

                    {!data.accessHoursSameForAll && (
                      <div className="space-y-4 pt-4">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <div key={day} className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-900 mb-3 capitalize">{day}</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                                <input type="time" value={data.dayHours[day]?.open || '00:00'} onChange={(e) => updateData('dayHours', {...data.dayHours, [day]: {...data.dayHours[day], open: e.target.value}})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                                <input type="time" value={data.dayHours[day]?.close || '23:59'} onChange={(e) => updateData('dayHours', {...data.dayHours, [day]: {...data.dayHours[day], close: e.target.value}})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Overnight Bookings */}
                  <div className="space-y-4 border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-base font-semibold text-gray-900">Allow overnight bookings?</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'no', label: 'No' },
                        { id: 'yes', label: 'Yes' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => updateData('allowOvernightBookings', id === 'yes')}
                          className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                          style={{borderColor: (data.allowOvernightBookings && id === 'yes') || (!data.allowOvernightBookings && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.allowOvernightBookings && id === 'yes') || (!data.allowOvernightBookings && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                        >
                          <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.allowOvernightBookings && id === 'yes') || (!data.allowOvernightBookings && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                            {((data.allowOvernightBookings && id === 'yes') || (!data.allowOvernightBookings && id === 'no')) && (
                              <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                            )}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">In this step, we want to understand what your basic availability settings should be. Once your space has been listed, you'll have even more control with our new advanced availability settings.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2b: Booking Start Date ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'bookingStart' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">When would you like to start accepting bookings?</h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Do you want to start taking bookings from today?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'yes', label: 'Yes' },
                    { id: 'no', label: 'No' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('startTakingBookingsToday', id === 'yes')}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: (data.startTakingBookingsToday && id === 'yes') || (!data.startTakingBookingsToday && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.startTakingBookingsToday && id === 'yes') || (!data.startTakingBookingsToday && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.startTakingBookingsToday && id === 'yes') || (!data.startTakingBookingsToday && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {((data.startTakingBookingsToday && id === 'yes') || (!data.startTakingBookingsToday && id === 'no')) && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {!data.startTakingBookingsToday && (
                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700">What date would you like to start taking bookings from?</label>
                  <input
                    type="date"
                    value={data.bookingStartDate}
                    onChange={(e) => updateData('bookingStartDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  />
                </div>
              )}

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900">Do you require notice before a driver arrives?</h3>
                <select
                  value={data.noticeRequired}
                  onChange={(e) => updateData('noticeRequired', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  style={{colorScheme: 'light'}}
                >
                  <option value="">Select notice requirement</option>
                  <option value="no_notice">No Notice Required</option>
                  <option value="15_min">15 minutes notice</option>
                  <option value="30_min">30 minutes notice</option>
                  <option value="1_hour">1 hour notice</option>
                  <option value="2_hours">2 hours notice</option>
                  <option value="half_day">Half day notice</option>
                  <option value="full_day">Full day notice</option>
                </select>
              </div>

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 space-y-4">
              <div className="bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
                <p className="text-xs text-gray-700 leading-relaxed">You can always change this date later from your dashboard. We'll schedule your listing to go live on the date you select.</p>
              </div>
              <div className="bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Notice Requirements</p>
                <p className="text-xs text-gray-700 leading-relaxed">Requiring no notice will maximise the number of bookings you receive, particularly from our mobile apps. Please ensure though that if you do require notice - either to move another vehicle or to provide users with access equipment, that you set this time period correctly.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2c: Calendar Preview ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'calendarPreview' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="w-full md:flex-[0_0_65%] bg-white py-6 md:h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Pregledajte svoj kalendar</h2>
                <p className="text-sm text-gray-600">Možete ažurirati svoj kalendar nakon što je vaš prostor objavljen</p>
              </div>

              {(() => {
                const croatianMonths = ['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenog','prosinca'];
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                // getDay() returns 0=Sun..6=Sat; we want Mon=0..Sun=6
                const firstDayRaw = new Date(year, month, 1).getDay();
                const emptyBefore = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
                const isAvailable = data.available24_7 || data.daysAvailable?.length > 0;
                const hoursText = data.available24_7 ? '00:00 - 24:00' : `${data.openTime} - ${data.closeTime}`;
                return (
                  <div className="space-y-6">
                    {/* Calendar Navigation */}
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <button
                        onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                        className="text-[#5F3DFC] hover:text-[#4330c4] font-medium text-xs md:text-base"
                      >← Prethodna</button>
                      <h3 className="text-sm md:text-xl font-semibold text-gray-900">{croatianMonths[month]} {year}</h3>
                      <button
                        onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                        className="text-[#5F3DFC] hover:text-[#4330c4] font-medium text-xs md:text-base"
                      >Dalje →</button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="border border-gray-200 rounded-lg p-3 md:p-6">
                      <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'].map((day) => (
                          <div key={day} className="text-center font-semibold text-sm text-gray-700 py-3">
                            {day}
                          </div>
                        ))}
                        {[...Array(emptyBefore)].map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square"></div>
                        ))}
                        {[...Array(daysInMonth)].map((_, i) => {
                          const date = i + 1;
                          return (
                            <div
                              key={date}
                              className={`aspect-square border-2 rounded-lg p-1 md:p-3 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                                isAvailable
                                  ? 'border-[#5F3DFC] bg-[#5F3DFC]/5 hover:bg-[#5F3DFC]/10'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <p className="font-bold text-sm md:text-lg text-gray-900">{date}</p>
                              {isAvailable ? (
                                <>
                                  <p className="text-[10px] md:text-xs text-gray-700 mt-0.5 md:mt-1 font-medium hidden md:block">
                                    {data.spaceType || '1'} {parseInt(data.spaceType || '1') === 1 ? 'mjesto' : 'mjesta'}
                                  </p>
                                  <div className="flex items-center gap-0.5 md:gap-1 mt-0.5 md:mt-1 text-[9px] md:text-xs text-gray-600 hidden md:flex">
                                    <Clock className="w-2 h-2 md:w-3 md:h-3" />
                                    <span>{hoursText}</span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-[9px] md:text-xs text-gray-400 mt-1 md:mt-2 hidden md:block">Nedostupno</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3 mt-6">
                <button onClick={handleBack} className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Natrag
                </button>
                <button onClick={handleNext} className="flex-1 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2">
                  Nastaviti
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">Ovo je pregled kako će vaš kalendar izgledati. Nakon objavljivanja, moći ćete prilagoditi dostupnost za određene datume, postaviti datume zamračenja i</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2d: Booking Window ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'bookingWindow' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Successful hosting starts with your calendar</h2>
                <p className="text-sm text-gray-600">Drivers will be able to book your space instantly on the days that it's marked as available.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">Important Reminders</p>
                <p className="text-xs text-gray-700 leading-relaxed">Cancelling disrupts drivers' plans, so please ensure that you keep your calendar up to date by marking any days as unavailable if/when you require the space for yourself.</p>
                <div className="flex items-start gap-2 mt-2 pt-3 border-t border-blue-200">
                  <input type="checkbox" defaultChecked className="mt-0.5" />
                  <label className="text-xs text-gray-700">Got it! I'll keep my calendar up to date.</label>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900">How far in the future do you wish to enable bookings to be made?</h3>
                <select
                  value={data.bookingWindow}
                  onChange={(e) => updateData('bookingWindow', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  style={{colorScheme: 'light'}}
                >
                  <option value="this_month">This month</option>
                  <option value="3_months">3 Months</option>
                  <option value="6_months">6 Months</option>
                  <option value="1_year">1 Year</option>
                  <option value="unlimited">Unlimited (all future dates)</option>
                </select>
                <p className="text-xs text-gray-600 mt-3">
                  Sometimes it's difficult to know when your space will be available in the distant future. If you aren't sure your space will be available in a few months time, you can prevent any reservations that are too far ahead of time.
                </p>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                  <span className="font-semibold">Note:</span> any restrictions here will prevent your space from being able to accept long term bookings.
                </p>
              </div>

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Booking Window</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {data.bookingWindow === 'this_month' && 'Drivers can only book for this month. This is a good option if your availability changes frequently.'}
                {data.bookingWindow === '3_months' && 'Drivers can book up to 3 months in advance. A good balance for planning.'}
                {data.bookingWindow === '6_months' && 'Drivers can book up to 6 months in advance.'}
                {data.bookingWindow === '1_year' && 'Drivers can book up to 1 year in advance. Good for long-term planning.'}
                {data.bookingWindow === 'unlimited' && 'Drivers can book any date in the future with no restrictions.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2e: Booking Types ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'bookingTypes' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Koje vrste rezervacija prihvaćate?</h2>
              </div>

              {data.pricingModel === 'dynamic' ? (
                <div className="bg-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-5 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Dinamično cijene — sve vrste automatski uključene</p>
                  <p className="text-sm text-gray-600">Uz automatsko određivanje cijena, vaš prostor prihvaća satne, dnevne i mjesečne rezervacije. Sustav optimizira cijene za sve vrste.</p>
                </div>
              ) : (
                <>
                  {/* Monthly Bookings */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900">Primam mjesečne rezervacije</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'no', label: 'Ne' },
                        { id: 'yes', label: 'Da' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => updateData('acceptMonthlyBookings', id === 'yes')}
                          className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                          style={{borderColor: (data.acceptMonthlyBookings && id === 'yes') || (!data.acceptMonthlyBookings && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.acceptMonthlyBookings && id === 'yes') || (!data.acceptMonthlyBookings && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                        >
                          <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.acceptMonthlyBookings && id === 'yes') || (!data.acceptMonthlyBookings && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                            {((data.acceptMonthlyBookings && id === 'yes') || (!data.acceptMonthlyBookings && id === 'no')) && (
                              <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                            )}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hourly & Daily Bookings */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h3 className="text-base font-semibold text-gray-900">Primam satne i dnevne rezervacije</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'no', label: 'Ne' },
                        { id: 'yes', label: 'Da' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => updateData('acceptHourlyDailyBookings', id === 'yes')}
                          className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                          style={{borderColor: (data.acceptHourlyDailyBookings && id === 'yes') || (!data.acceptHourlyDailyBookings && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.acceptHourlyDailyBookings && id === 'yes') || (!data.acceptHourlyDailyBookings && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                        >
                          <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.acceptHourlyDailyBookings && id === 'yes') || (!data.acceptHourlyDailyBookings && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                            {((data.acceptHourlyDailyBookings && id === 'yes') || (!data.acceptHourlyDailyBookings && id === 'no')) && (
                              <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                            )}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Plans */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700">Dostupni planovi</label>
                    <select
                      value={data.availablePlan}
                      onChange={(e) => updateData('availablePlan', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                      style={{colorScheme: 'light'}}
                    >
                      <option value="monday_to_sunday">Ponedjeljak do nedjelje</option>
                      <option value="monday_to_friday">Ponedjeljak do petka</option>
                    </select>
                  </div>
                </>
              )}

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {data.pricingModel === 'dynamic'
                  ? 'Dinamično određivanje cijena automatski optimizira sve vrste rezervacija — nema potrebe za ručnim odabirom.'
                  : 'Prihvaćanje i mjesečnih i satnih/dnevnih rezervacija obično maksimizira zaradu.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2f: Pricing Model ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'pricing' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your pricing model</h2>
              </div>

              {/* Dynamic Pricing */}
              <div className="space-y-4">
                <button
                  onClick={() => updateData('pricingModel', 'dynamic')}
                  className="w-full border-2 rounded-lg p-6 transition-all text-left"
                  style={{borderColor: data.pricingModel === 'dynamic' ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.pricingModel === 'dynamic' ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Dynamic Pricing</h3>
                      <p className="text-sm text-green-600 font-medium mt-1">Recommended</p>
                    </div>
                    <div className="flex items-center justify-center flex-shrink-0" style={{width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${data.pricingModel === 'dynamic' ? '#5F3DFC' : '#D1D5DB'}`, transition: 'all 0.2s'}}>
                      {data.pricingModel === 'dynamic' && (
                        <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">Our dynamic pricing tool will automatically adjust your price to match demand to ensure you maximise your annual earnings from your space.</p>
                </button>
              </div>

              {/* Static Pricing */}
              <div className="space-y-4">
                <button
                  onClick={() => updateData('pricingModel', 'static')}
                  className="w-full border-2 rounded-lg p-6 transition-all text-left"
                  style={{borderColor: data.pricingModel === 'static' ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.pricingModel === 'static' ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Static Pricing</h3>
                    <div className="flex items-center justify-center flex-shrink-0" style={{width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${data.pricingModel === 'static' ? '#5F3DFC' : '#D1D5DB'}`, transition: 'all 0.2s'}}>
                      {data.pricingModel === 'static' && (
                        <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">Set your own price. To maximise earnings, set a competitive price when compared to other spaces listed in your area.</p>
                </button>
              </div>

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 space-y-4">
              {/* Dynamic Pricing Info */}
              <div className="bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Dynamic Pricing (Recommended)</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-3">Prices your listing automatically based on current market demands to boost your bookings. Factors include:</p>
                <ul className="text-xs text-gray-700 space-y-2 list-disc list-inside">
                  <li>How many people are searching for parking in your area</li>
                  <li>Day of the week, seasonality and local events</li>
                  <li>Past booking volume and quality of reviews</li>
                </ul>
              </div>

              {/* Static Pricing Info */}
              <div className="bg-gradient-to-br from-amber-100/20 to-amber-50/20 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Static Pricing</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-3">Allows you to set your own parking price in line with our Fair Pricing Policy.</p>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">When a listing is priced in line with the policy, the space is expected to receive the first booking within the first 4 weeks.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2g: Your Description ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'description' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Your description</h2>
                <p className="text-sm text-gray-600">We have generated a description about your space based on the information you have provided us with.</p>
              </div>

              {/* Generated Description */}
              <div className="space-y-4">
                <textarea
                  value={data.additionalDescription || generateDescription()}
                  onChange={(e) => updateData('additionalDescription', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40 font-mono"
                  rows={8}
                  placeholder="Edit the description..."
                />
              </div>

              {/* Additional Information */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900">Do you wish to add additional information?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'no', label: 'No' },
                    { id: 'yes', label: 'Yes' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('addAdditionalInfo', id === 'yes')}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: (data.addAdditionalInfo && id === 'yes') || (!data.addAdditionalInfo && id === 'no') ? '#5F3DFC' : '#D1D5DB', backgroundColor: (data.addAdditionalInfo && id === 'yes') || (!data.addAdditionalInfo && id === 'no') ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${(data.addAdditionalInfo && id === 'yes') || (!data.addAdditionalInfo && id === 'no') ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {((data.addAdditionalInfo && id === 'yes') || (!data.addAdditionalInfo && id === 'no')) && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">The description is meant to be a brief overview of your parking space to assist drivers in their understanding of its location, features and suitability, prior to booking.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2h: Post-Booking Instructions ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'postBookingInstructions' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Post-booking instructions</h2>
                <p className="text-sm text-gray-600">We have generated post-booking instructions for your space on the information you have provided.</p>
              </div>

              {/* Generated Post-Booking Instructions */}
              <div className="space-y-4">
                <textarea
                  value={data.postBookingInstructions || generatePostBookingInstructions()}
                  onChange={(e) => updateData('postBookingInstructions', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40 font-mono"
                  rows={8}
                  placeholder="Edit the post-booking instructions..."
                />
              </div>

              <button onClick={() => handleSaveSection(2)} disabled={submitting} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                {submitting ? 'Spremanje...' : 'Spremi i izlazi'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">We have generated post-booking instructions for your space on the information you have provided. This is meant to provide instruction to people who have booked your space on how to access and use your space.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2 REVIEW ── */}
      {currentStepValue === 2 && currentStep2SubValue === 'review2' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Pregledajte Korak 2</h2>
                <p className="text-sm text-gray-600">Provjera odabranih postavki dostupnosti i cijene.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 space-y-4 text-sm">
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Dostupnost</p>
                  <p className="font-medium text-gray-900">{data.available24_7 ? '24/7 — uvijek dostupno' : data.daysAvailable.length > 0 ? data.daysAvailable.join(', ') : '—'}</p>
                  {!data.available24_7 && <p className="text-gray-600 text-xs mt-0.5">{data.openTime || '—'} – {data.closeTime || '—'}</p>}
                </div>

                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Početak rezervacija</p>
                  <p className="font-medium text-gray-900">{data.startTakingBookingsToday ? 'Odmah' : data.bookingStartDate || '—'}</p>
                </div>

                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Prozor rezervacija</p>
                  <p className="font-medium text-gray-900">
                    {data.bookingWindow === 'this_month' ? 'Ovaj mjesec' :
                     data.bookingWindow === '3_months' ? '3 mjeseca' :
                     data.bookingWindow === '6_months' ? '6 mjeseci' :
                     data.bookingWindow === '1_year' ? '1 godina' :
                     data.bookingWindow === 'unlimited' ? 'Neograničeno' : '—'}
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Vrste rezervacija</p>
                  <p className="font-medium text-gray-900">
                    {[data.acceptMonthlyBookings && 'Mjesečne', data.acceptHourlyDailyBookings && 'Satne i dnevne'].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>

                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Model cijena</p>
                  <p className="font-medium text-gray-900">{data.pricingModel === 'dynamic' ? 'Dinamično' : data.pricingModel === 'static' ? 'Fiksno' : '—'}</p>
                </div>

                {data.additionalDescription && (
                  <div className="border-b border-gray-200 pb-3">
                    <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Opis</p>
                    <p className="font-medium text-gray-900 text-xs leading-relaxed line-clamp-3">{data.additionalDescription}</p>
                  </div>
                )}

                {data.postBookingInstructions && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Upute nakon rezervacije</p>
                    <p className="font-medium text-gray-900 text-xs leading-relaxed line-clamp-3">{data.postBookingInstructions}</p>
                  </div>
                )}
              </div>

              <button onClick={() => handleSaveSection(2)} disabled={submitting} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-semibold hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2">
                {submitting ? 'Spremanje...' : 'Spremi i nazad'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">Provjeri sve postavke prije nastavka. Korak 3 dodaje fotografije i opis prostora.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3a: Upload Photos ── */}
      {currentStepValue === 3 && currentStep3SubValue === 'photos' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Hi, Karlo! Show drivers what your space looks like</h2>
                <p className="text-sm text-gray-600">Step 3</p>
              </div>

              {/* Upload Widget */}
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#5F3DFC]/30 rounded-lg p-8 cursor-pointer hover:border-[#5F3DFC] hover:bg-[#5F3DFC]/5 transition-all text-center"
                >
                  <div className="space-y-2">
                    <svg className="w-10 h-10 mx-auto text-[#5F3DFC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">Kliknite za učitavanje ili povucite i ispustite</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF do 10MB</p>
                  </div>
                </div>
              </div>

              {/* Guidance Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-900 font-medium">Many hosts have at least 3 photos. You can start with just one photo and come back later to add more.</p>
                <p className="text-sm text-gray-700">Including photos of the entrance so that drivers can imagine parking in your space.</p>
              </div>

              {/* Uploaded Photos */}
              {(data.photoUrls.length > 0 || data.photos.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Fotografije ({data.photoUrls.length + data.photos.length})</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {data.photoUrls.map((url, index) => (
                      <div key={`url-${index}`} className="relative group">
                        <img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        <button
                          onClick={() => setData((prev) => ({ ...prev, photoUrls: prev.photoUrls.filter((_, i) => i !== index) }))}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </div>
                    ))}
                    {data.photos.map((photo, index) => (
                      <div key={`file-${index}`} className="relative group">
                        <img src={URL.createObjectURL(photo)} alt={`Novo ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        <button
                          onClick={() => setData((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Photos Section */}
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900">Below are some example photos posted by other hosts:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Street Example */}
                  <div className="space-y-2">
                    <div className="w-full h-40 bg-gradient-to-b from-blue-200 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                        {/* Sky */}
                        <rect width="300" height="100" fill="#87CEEB" />
                        {/* Buildings */}
                        <rect x="10" y="70" width="60" height="130" fill="#8B7355" />
                        <rect x="80" y="60" width="70" height="140" fill="#A0826D" />
                        <rect x="170" y="75" width="65" height="125" fill="#8B7355" />
                        <rect x="250" y="80" width="40" height="120" fill="#A0826D" />
                        {/* Road */}
                        <rect y="100" width="300" height="100" fill="#555555" />
                        {/* Road markings */}
                        <line x1="0" y1="130" x2="300" y2="130" stroke="#FFFF00" strokeWidth="2" strokeDasharray="10,10" />
                        {/* Parking spaces */}
                        <rect x="120" y="145" width="30" height="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                        <rect x="155" y="145" width="30" height="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600">Street view of parking location</p>
                  </div>

                  {/* Driveway/Park Example */}
                  <div className="space-y-2">
                    <div className="w-full h-40 bg-gradient-to-b from-green-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                        {/* Sky */}
                        <rect width="300" height="80" fill="#87CEEB" />
                        {/* Trees */}
                        <circle cx="40" cy="100" r="25" fill="#228B22" />
                        <circle cx="260" cy="110" r="30" fill="#228B22" />
                        {/* Building/House */}
                        <rect x="120" y="50" width="60" height="60" fill="#CD853F" />
                        <polygon points="120,50 150,20 180,50" fill="#8B4513" />
                        {/* Driveway */}
                        <rect x="80" y="120" width="140" height="50" fill="#666666" />
                        {/* Parking spaces */}
                        <rect x="95" y="130" width="35" height="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                        <rect x="170" y="130" width="35" height="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                        {/* Car parked */}
                        <rect x="98" y="133" width="28" height="28" fill="#CC0000" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600">Driveway/parking space view</p>
                  </div>
                </div>
              </div>

              {/* Recommendation Text */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-gray-900"><span className="font-medium">Recommendation:</span> We recommend uploading at least 3 photos to increase your listing's visibility and attract more drivers.</p>
              </div>

              <button onClick={handleNext} disabled={data.photos.length === 0 && data.photoUrls.length === 0} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-semibold hover:bg-[#4330c4] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">Kvalitetne fotografije su ključne za privlačenje vozača. Pokažite ulaz, parking prostor i sve prepoznatljive značajke.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3b: Google Street View ── */}
      {currentStepValue === 3 && currentStep3SubValue === 'streetView' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Google Street View</h2>
                <p className="text-sm text-gray-600">Confirm the location of your parking space</p>
              </div>

              {/* Street View Preview */}
              <div className="space-y-4">
                {data.latitude && data.longitude ? (
                  <div ref={streetViewRef} className="w-full h-96 bg-gray-200 rounded-lg border border-gray-300 overflow-hidden" />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300 overflow-hidden">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                      </svg>
                      <p className="text-sm text-gray-600">Street View Preview</p>
                      <p className="text-xs text-gray-500 mt-1">Complete Step 1 to see Street View of your location</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Guidance Text */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-900 font-medium">You can adjust the Street View direction via the preview so that it's directed at your parking space, if possible.</p>
                  <p className="text-sm text-gray-700">Use the directional controls to rotate the view toward your parking entrance.</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-gray-900"><span className="font-medium">Important:</span> Please ensure that the Street View is focused on the street, and not inside any buildings.</p>
                </div>
              </div>

              {/* Direction Controls Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Direction Control Tips:</p>
                  {data.latitude && data.longitude && (
                    <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300">
                      Heading: {Math.round(streetViewHeading)}°
                    </div>
                  )}
                </div>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Drag the Street View image to rotate and adjust direction</li>
                  <li>Focus on the entrance to your parking space</li>
                  <li>Show distinctive landmarks or features</li>
                  <li>Avoid indoor/covered areas when possible</li>
                </ul>
              </div>

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">Street View helps drivers understand exactly where your parking space is located. Adjust the view to show the entrance and any distinguishing features that help drivers find you. Make sure the view is oriented toward the street and parking area, not into buildings.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3c: Summary & Expectations ── */}
      {currentStepValue === 3 && currentStep3SubValue === 'summary' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Based on your settings, here's what you could expect</h2>
                <p className="text-sm text-gray-600">Summary of your parking listing</p>
              </div>

              {/* Expectation Cards */}
              <div className="space-y-4">
                {/* Card 1: Start Taking Bookings */}
                <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#5F3DFC]/15 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5F3DFC]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11 17H5V5h8v8h6v-2h2v7h-2v-2h-2v2zm-6-2h4v-4H5v4zm6 0h2v-2h-2v2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Your space is available to start taking bookings from the {data.bookingStartDate ? new Date(data.bookingStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : '2nd May'}</h3>
                      <p className="text-sm text-gray-600">Your space will appear in the search results and customers can begin placing bookings from this date, in line with your availability settings.</p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Driver Bookings */}
                <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Drivers can book your space on days it is available</h3>
                      <p className="text-sm text-gray-600">On booking your parking space, drivers are provided with your secure post-booking instructions. These let people know the full address and your contact details, as well as whether or not they need to arrange collection of access equipment. They may contact you if they need assistance in finding the space.</p>
                    </div>
                  </div>
                </div>

                {/* Card 3: Booking Confirmation */}
                <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zm-5.04-6.71l-2.75 3.54-2.96-3.83-1.3 1.3L9.25 16l4.05-5.16 1.59 2.04 4.5-5.81-1.41-1.41z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Receive booking confirmation</h3>
                      <p className="text-sm text-gray-600">You will receive a booking confirmation email breaking down the customer's stay, along with all the contact details you might need. To get paid make sure that you've added payment details to your account, payments will be processed to you on the first business day of each month.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleNext} disabled={false} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-6">
                Završiti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">You're almost there! Review what to expect once your listing goes live. Your parking space will be visible to drivers based on your availability and booking settings.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3d: Review Before Publishing ── */}
      {currentStepValue === 3 && currentStep3SubValue === 'review3' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Pregledajte podatke prije objavljivanja.</h2>
                <p className="text-sm text-gray-600">Final review before your listing goes live</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 space-y-4 text-sm">
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Fotografije</p>
                  <p className="font-medium text-gray-900">{data.photos?.length || 0} fotografija dodano</p>
                </div>

                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Google Street View</p>
                  <p className="font-medium text-gray-900">Konfiguracija završena</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Lokacija & Opis</p>
                  <p className="font-medium text-gray-900">{data.name || '—'}</p>
                  <p className="text-gray-600 text-xs mt-1">{data.address || '—'}</p>
                </div>
              </div>

              <button onClick={() => handleSaveSection(3)} disabled={(data.photos.length === 0 && data.photoUrls.length === 0) || submitting} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-semibold hover:bg-[#4330c4] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {submitting ? 'Spremanje...' : 'Spremi i nazad'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full md:flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto md:border-l border-gray-200">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
              <p className="text-xs text-gray-700 leading-relaxed">Sve je spremno! Vaš parking prostor će biti vidljiv potencijalnim kupcima čim ga objavite.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW ── */}
      {currentStepValue === 'review' && (
        <div className="flex flex-col md:flex-row animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="w-full md:flex-[0_0_65%] bg-white py-6 md:h-full">
            <div className="px-6 space-y-4">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Pregledajte podatke prije objavljivanja.</h2>
                <p className="text-gray-600">Pregled</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 space-y-4 text-sm">
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Mjesto</p>
                  <p className="font-medium text-gray-900">{data.name || '—'}, {data.address || '—'}, {data.postalCode || '—'}</p>
                  <p className="text-gray-600 text-xs">{selectedRegion?.label || '—'}</p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Prostor</p>
                  <p className="font-medium text-gray-900">{data.spaceType ? `${data.spaceType} mjesto${parseInt(data.spaceType) > 1 ? 'a' : ''}` : '—'}</p>
                  <p className="text-gray-600 text-xs">{data.type ? (data.type === 'private_driveway' ? 'Privatni prilaz' : data.type === 'commercial_carpark' ? 'Komercijalno parkiralište' : data.type === 'residential_carpark' ? 'Stambeno parkiralište' : 'Zaključana garaža') : '—'} • {data.features.length > 0 ? data.features.join(', ') : 'Nema odabranih značajki'}</p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Veličina vozila</p>
                  <p className="font-medium text-gray-900">{data.vehicleSize ? data.vehicleSize.charAt(0).toUpperCase() + data.vehicleSize.slice(1) : '—'}</p>
                  {data.heightRestrictions && <p className="text-gray-600 text-xs">Max visina: {data.maxHeight || '—'}</p>}
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Pristup</p>
                  <p className="font-medium text-gray-900">{data.accessControl === 'yes' ? `Kontrola: ${data.accessControlType || '—'}` : 'Nema kontrole pristupa'}</p>
                  <p className="text-gray-600 text-xs">Dozvola potrebna: {data.permitRequired === 'yes' ? 'Da' : 'Ne'}</p>
                </div>
              </div>
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
              )}
              <button onClick={() => handleSaveSection(1)} disabled={submitting} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                {submitting ? 'Spremanje...' : 'Spremi i izlazi'}
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="w-full md:flex-[0_0_35%] bg-white py-6 flex items-center justify-center md:h-full">
            <div className="w-80">
              <div className="sticky top-6">
                <InfoWidget tip="Review all details before publishing. You can edit after going live." />
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
