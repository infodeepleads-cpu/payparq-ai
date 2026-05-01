'use client';

import { useState, useRef } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { ListingHeader } from './ListingHeader';

const DynamicMap = dynamic(() => import('./ParkingLocationMap'), { ssr: false });

type MainStep = 'intro' | 1 | 2 | 3 | 4 | 5 | 'review';
type Step1Sub = 'region' | 'map' | 'name';

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
  type: string;
  capacity: string;
  features: string[];
}

function InfoWidget({ tip }: { tip: string }) {
  return (
    <div className="col-span-1">
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
  onStepChange?: (step: MainStep) => void;
  onSubStepChange?: (subStep: Step1Sub) => void;
}

export function ListYourLotPanel({
  isFullScreen = false,
  currentStep: propStep,
  currentSubStep: propSubStep,
  onStepChange,
  onSubStepChange
}: ListYourLotPanelProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const [step, setStepInternal] = useState<MainStep>(propStep || 'intro');
  const [step1Sub, setStep1SubInternal] = useState<Step1Sub>(propSubStep || 'region');

  const currentStepValue = propStep !== undefined ? propStep : step;
  const currentSubStepValue = propSubStep !== undefined ? propSubStep : step1Sub;

  const setStep = (newStep: MainStep) => {
    setStepInternal(newStep);
    onStepChange?.(newStep);
  };

  const setStep1Sub = (newSubStep: Step1Sub) => {
    setStep1SubInternal(newSubStep);
    onSubStepChange?.(newSubStep);
  };

  const cityAutocompleteRef = useRef<any>(null);
  const [citySelected, setCitySelected] = useState(false);
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
    type: '',
    capacity: '',
    features: [],
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

  const isStep1Complete = !!(data.region && data.address && data.town && data.latitude && data.longitude);
  const isStep2Complete = !!(data.openTime && data.closeTime && data.permits);
  const isStep3Complete = data.photos.length >= 3 && !!(data.type && data.capacity && data.features.length > 0);

  const canProceed = () => {
    if (step === 1) {
      if (step1Sub === 'region') return !!(data.region && data.address && citySelected);
      if (step1Sub === 'map') return !!(data.latitude && data.longitude);
      if (step1Sub === 'name') return !!(data.name && data.spaceType);
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
        console.log('📝 Step 1c → moving to step 2');
        setStep(2);
        return;
      }
    }
    if (currentStepValue === 2) {
      console.log('🕐 Step 2 → moving to step 3');
      setStep(3);
      return;
    }
    if (currentStepValue === 3) {
      console.log('📸 Step 3 → moving to step 4');
      setStep(4);
      return;
    }
    if (currentStepValue === 4) {
      console.log('🚗 Step 4 → moving to step 5');
      setStep(5);
      return;
    }
    if (currentStepValue === 5) {
      console.log('🔐 Step 5 → moving to review');
      setStep('review');
      return;
    }
  };

  const handleBack = () => {
    if (step === 1) {
      if (step1Sub === 'map') { setStep1Sub('region'); return; }
      if (step1Sub === 'name') { setStep1Sub('map'); return; }
      setStep('intro');
    } else if (step === 2) {
      setStep1Sub('name');
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 4) {
      setStep(3);
    } else if (step === 5) {
      setStep(4);
    } else if (step === 'review') {
      setStep(5);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'photos') return;
        if (k === 'features') { formData.append(k, JSON.stringify(v)); return; }
        formData.append(k, String(v));
      });
      for (const photo of data.photos) formData.append('photos', photo);

      const response = await fetch('/api/listings', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) { alert(`Error: ${result.error}`); return; }

      alert('✅ Parking listing published successfully!');
      setStep('intro');
      setStep1Sub('region');
      setCitySelected(false);
    } catch {
      alert('Failed to create listing. Please try again.');
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

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            {[
              { n: 1 as MainStep, title: 'Locations, features and more', sub: 'Add location, address and pin it on the map', done: isStep1Complete },
              { n: 2 as MainStep, title: 'Get ready for drivers', sub: 'Bookings, settings, calendar, price', done: isStep2Complete },
              { n: 3 as MainStep, title: 'Build the picture', sub: 'Photos and street view', done: isStep3Complete },
            ].map(({ n, title, sub, done }) => (
              <div
                key={String(n)}
                className={`border rounded-lg p-6 transition-all cursor-pointer ${done ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:shadow-md'}`}
                onClick={() => { setStep(n); if (n === 1) setStep1Sub('region'); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Step {n}</h3>
                    <p className="text-gray-600">{title}</p>
                  </div>
                  <div className={`text-2xl font-bold ${done ? 'text-green-500' : 'text-[#5F3DFC]'}`}>
                    {done ? '✓' : n}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{sub}</p>
              </div>
            ))}

            <button
              onClick={() => { setStep(1); setStep1Sub('region'); }}
              className="w-full px-6 py-3 bg-[#5F3DFC] text-white rounded-lg font-semibold hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2 mt-2"
            >
              Start with the basics
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="col-span-1">
            <div className="sticky top-6 bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-6">
              <div className="flex items-start gap-2 mb-3">
                <p className="text-sm text-gray-700 leading-snug">In your area, we think your spaces could earn</p>
                <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <p className="text-3xl font-bold text-[#5F3DFC]">
                £6,912.00
                <span className="text-lg font-normal text-gray-600 block">per year</span>
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
      <div className="h-full w-full flex m-0 p-0">

      {/* ── STEP 1: Choose Country ── */}
      {currentStepValue === 1 && currentSubStepValue === 'region' && (
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left white sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full">
            <div className="px-6 space-y-5 h-full">
              {/* Welcome message */}
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Bok! Pripremimo vas da postanete vlasnik parkinga.</h2>
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
                        spellCheck="false"
                        inputMode="none"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zipcode</label>
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
          <div className="flex-[0_0_35%] bg-white py-6 flex items-center justify-center h-full">
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
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full flex flex-col overflow-hidden">
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
          <div className="flex-[0_0_35%] bg-white py-6 flex items-center justify-center h-full">
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
        <div className="flex animate-fadeIn h-full w-full">
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
                <label className="block text-sm font-medium text-gray-700 mb-3">What type of parking do you have?</label>
                <div className="space-y-3">
                  <button
                    onClick={() => updateData('spaceType', 'single')}
                    className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                    style={{borderColor: data.spaceType === 'single' ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.spaceType === 'single' ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                  >
                    <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${data.spaceType === 'single' ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                      {data.spaceType === 'single' && (
                        <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                      )}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">Jedno parkirno mjesto</span>
                  </button>
                  <button
                    onClick={() => updateData('spaceType', 'multiple')}
                    className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                    style={{borderColor: data.spaceType === 'multiple' ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.spaceType === 'multiple' ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                  >
                    <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${data.spaceType === 'multiple' ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                      {data.spaceType === 'multiple' && (
                        <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                      )}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900">Više parkirnih mjesta</span>
                  </button>
                </div>
              </div>

              <button onClick={handleNext} disabled={!canProceed()} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="flex-[0_0_35%] bg-white py-6 flex items-center justify-center h-full">
            <div className="w-80">
              <div className="sticky top-6 space-y-4">
                <InfoWidget tip="Choose a clear, descriptive name that helps drivers identify your parking space easily." />
                <div className="bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-6">
                  <div className="flex items-start gap-2 mb-3">
                    <p className="text-sm text-gray-700 leading-snug font-medium">Korisne Informacije</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Jedno parkirno mjesto</p>
                      <p className="text-xs text-gray-700 mt-1">For owners who only have one space available to book at any given time.</p>
                    </div>
                    <div className="border-t border-gray-300 pt-3">
                      <p className="text-sm font-medium text-gray-900">Više parkirnih mjesta</p>
                      <p className="text-xs text-gray-700 mt-1">Maximise your earnings if you can accommodate two vehicles or more at any given time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Get Ready For Drivers ── */}
      {currentStepValue === 2 && (
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Pripremite se za vozače.</h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold">Add Ons Dodaci</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'covered', label: 'Covered parking' },
                    { id: 'transfers', label: 'Arranged transfers' },
                    { id: 'cctv', label: 'CCTV' },
                    { id: 'lighting', label: 'Security lighting' },
                    { id: 'staff', label: 'On-site staff' },
                    { id: 'underground', label: 'Underground parking' },
                    { id: 'disabled', label: 'Disabled access' },
                    { id: 'charging', label: 'Electric charging' },
                    { id: 'valet', label: 'Valet' },
                    { id: 'rampa', label: 'Rampa' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => toggleFeature(id)}
                      className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: data.features.includes(id) ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.features.includes(id) ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', border: `2px solid ${data.features.includes(id) ? '#5F3DFC' : '#9CA3AF'}`, borderRadius: '4px', transition: 'all 0.2s'}}>
                        {data.features.includes(id) && (
                          <span style={{color: '#5F3DFC', fontSize: '16px', lineHeight: '1'}}>✓</span>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
                  <p className="text-sm text-gray-700">Providing what features your parking space has helps it stand out for drivers looking to book.</p>
                </div>
              </div>

              <button onClick={handleNext} disabled={!canProceed()} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="flex-[0_0_35%] bg-white py-6 flex items-center justify-center h-full">
            <div className="w-80">
              <div className="sticky top-6">
                <InfoWidget tip="Odaberite značajke koje čine vaš parking posebnim i atraktivnim za vozače." />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: Build The Picture ── */}
      {currentStepValue === 3 && (
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Dodajte slike i detalje.</h2>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold">What best describes your parking space?</h3>
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
          <div className="flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto border-l border-gray-200">
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

      {/* ── STEP 6: Vehicle Size & Height ── */}
      {currentStepValue === 4 && (
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Veličina vozila i pristupa.</h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold">What size vehicle does your parking space accommodate?</h3>
                <p className="text-sm text-gray-600">Size of parking space</p>
                <div className="space-y-3">
                  {[
                    { id: 'small', label: 'Small parking space' },
                    { id: 'medium', label: 'Medium parking space' },
                    { id: 'large', label: 'Large parking space' },
                    { id: 'commercial', label: 'Commercial vehicle' },
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

              <div className="space-y-4 border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Postoje li neka ograničenja visine prilikom pristupa vašem prostoru?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'no', label: 'No' },
                    { id: 'yes', label: 'Yes' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('heightRestrictions', id)}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: data.heightRestrictions === id ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.heightRestrictions === id ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${data.heightRestrictions === id ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {data.heightRestrictions === id && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>

                {data.heightRestrictions === 'yes' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum height in meters</label>
                    <select value={data.maxHeight} onChange={(e) => updateData('maxHeight', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" style={{colorScheme: 'light'}}>
                      <option value="">Select maximum height</option>
                      <option value="1.8">1.8m</option>
                      <option value="2.0">2.0m</option>
                      <option value="2.1">2.1m</option>
                      <option value="2.2">2.2m</option>
                      <option value="2.3">2.3m</option>
                      <option value="2.4">2.4m</option>
                      <option value="2.5">2.5m</option>
                      <option value="2.6">2.6m</option>
                      <option value="2.7">2.7m</option>
                      <option value="2.8">2.8m</option>
                      <option value="2.9">2.9m</option>
                      <option value="3.0">3.0m</option>
                      <option value="3.2">3.2m</option>
                      <option value="3.5">3.5m</option>
                      <option value="4.0">4.0m+</option>
                    </select>
                  </div>
                )}
              </div>

              <button onClick={handleNext} disabled={!data.vehicleSize || !data.heightRestrictions || (data.heightRestrictions === 'yes' && !data.maxHeight)} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto border-l border-gray-200">
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-900">Vehicle size guide:</p>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Small parking space</h4>
                <p className="text-xs text-gray-700 leading-relaxed">2 door vehicles. Compact cars, motorcycles, small sedans.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Medium parking space</h4>
                <p className="text-xs text-gray-700 leading-relaxed">4 door vehicles. Standard sedans, hatchbacks, small SUVs.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Large parking space</h4>
                <p className="text-xs text-gray-700 leading-relaxed">4x4 vehicles, Saloon cars. Large SUVs, oversized sedans.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Commercial vehicle</h4>
                <p className="text-xs text-gray-700 leading-relaxed">Van, minibus, and larger commercial vehicles.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 7: Access & Details ── */}
      {currentStepValue === 5 && (
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full overflow-auto">
            <div className="px-6 space-y-6">
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Kako se pristupa vašem prostoru.</h2>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">How is your parking space accessed?</h3>
                <p className="text-sm text-gray-600 mb-4">Does your space require access control?</p>
                <p className="text-xs text-gray-500 mb-3">E.g. key fob, pincode etc.</p>

                <div className="space-y-3">
                  {[
                    { id: 'no', label: 'No' },
                    { id: 'yes', label: 'Yes' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('accessControl', id)}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: data.accessControl === id ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.accessControl === id ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${data.accessControl === id ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {data.accessControl === id && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>

                {data.accessControl === 'yes' && (
                  <div className="space-y-2 mt-4">
                    <label className="block text-sm font-medium text-gray-700">Vrsta kontrole pristupa</label>
                    <select value={data.accessControlType} onChange={(e) => updateData('accessControlType', e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" style={{colorScheme: 'light'}}>
                      <option value="">Select access control type</option>
                      <option value="key_fob">Key fob</option>
                      <option value="pincode">Pincode</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900">Does your space require a permit?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'no', label: 'No' },
                    { id: 'yes', label: 'Yes' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('permitRequired', id)}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: data.permitRequired === id ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.permitRequired === id ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${data.permitRequired === id ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {data.permitRequired === id && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900">Is your space allocated?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'no', label: 'No' },
                    { id: 'yes', label: 'Yes' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateData('spaceAllocated', id)}
                      className="w-full flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors text-left"
                      style={{borderColor: data.spaceAllocated === id ? '#5F3DFC' : '#D1D5DB', backgroundColor: data.spaceAllocated === id ? 'rgba(95, 61, 252, 0.05)' : 'white'}}
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${data.spaceAllocated === id ? '#5F3DFC' : '#9CA3AF'}`, transition: 'all 0.2s'}}>
                        {data.spaceAllocated === id && (
                          <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5F3DFC'}}></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleNext} disabled={!data.accessControl || !data.permitRequired || !data.spaceAllocated || (data.accessControl === 'yes' && !data.accessControlType)} className="w-full px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                Nastaviti
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right sector - 35% */}
          <div className="flex-[0_0_35%] bg-gray-50 py-6 px-6 overflow-auto border-l border-gray-200">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#5F3DFC]/15 to-[#5F3DFC]/5 border border-[#5F3DFC]/30 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Korisne Informacije</p>
                <p className="text-xs text-gray-700 leading-relaxed">Providing clear information about access control, permits, and allocation helps drivers understand exactly how to use your parking space and reduces confusion or disputes.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Access Control</h4>
                <p className="text-xs text-gray-700 leading-relaxed">Key fob or pincode access ensures only authorized users can park in your space, adding security and preventing unauthorized usage.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Permits & Allocation</h4>
                <p className="text-xs text-gray-700 leading-relaxed">Specify if permits are needed or if your space is designated for specific users. This clarity helps attract the right renters and prevents booking conflicts.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW ── */}
      {currentStepValue === 'review' && (
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 h-full">
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
                  <p className="font-medium text-gray-900">{data.spaceType ? (data.spaceType === 'single' ? 'Jedno parkirno mjesto' : 'Više parkirnih mjesta') : '—'}</p>
                  <p className="text-gray-600 text-xs">{data.type || '—'} • {data.features.length > 0 ? data.features.join(', ') : 'Nema odabranih značajki'}</p>
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
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Dostupnost</p>
                  <p className="font-medium text-gray-900">Dnevno {data.openTime} – {data.closeTime}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Fotografije</p>
                  <p className="font-medium text-gray-900">{data.photos.length} fotografija učitano</p>
                </div>
              </div>
              <button onClick={handleSubmit} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                Publish Listing
              </button>
            </div>
          </div>
          {/* Right sector - 35% */}
          <div className="flex-[0_0_35%] bg-white py-6 flex items-center justify-center h-full">
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
