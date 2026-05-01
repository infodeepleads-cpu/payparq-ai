'use client';

import { useState, useRef } from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { ListingHeader } from './ListingHeader';

const DynamicMap = dynamic(() => import('./ParkingLocationMap'), { ssr: false });

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
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
  postalCode: string;
  latitude: string;
  longitude: string;
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
        </div>
        <p className="text-base text-gray-700 leading-snug">{tip}</p>
      </div>
    </div>
  );
}

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name';

interface ListYourLotPanelProps {
  isFullScreen?: boolean;
  onStepChange?: (step: MainStep) => void;
  onSubStepChange?: (subStep: Step1Sub) => void;
}

export function ListYourLotPanel({ isFullScreen = false, onStepChange, onSubStepChange }: ListYourLotPanelProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const [step, setStepInternal] = useState<MainStep>('intro');
  const [step1Sub, setStep1SubInternal] = useState<Step1Sub>('region');

  const setStep = (newStep: MainStep) => {
    setStepInternal(newStep);
    onStepChange?.(newStep);
  };

  const setStep1Sub = (newSubStep: Step1Sub) => {
    setStep1SubInternal(newSubStep);
    onSubStepChange?.(newSubStep);
  };

  const autocompleteRef = useRef<any>(null);
  const [data, setData] = useState<ListingData>({
    region: '',
    name: '',
    address: '',
    postalCode: '',
    latitude: '',
    longitude: '',
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

  const handlePlaceSelect = () => {
    if (autocompleteRef.current && window.google) {
      try {
        const places = (autocompleteRef.current as any).getPlaces?.();
        if (!places || places.length === 0) return;

        const place = places[0];
        if (place.formatted_address) {
          updateData('address', place.formatted_address);
        }
        if (place.geometry?.location) {
          updateData('latitude', String(place.geometry.location.lat()));
          updateData('longitude', String(place.geometry.location.lng()));
        }
        const postalCode = place.address_components?.find((c: any) =>
          c.types.includes('postal_code')
        )?.long_name || '';
        if (postalCode) {
          updateData('postalCode', postalCode);
        }
      } catch (e) {
        console.warn('Place selection error:', e);
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

  const isStep1Complete = !!(data.region && data.address && data.postalCode && data.latitude && data.longitude);
  const isStep2Complete = !!(data.openTime && data.closeTime && data.permits);
  const isStep3Complete = data.photos.length >= 3 && !!(data.type && data.capacity && data.features.length > 0);

  const canProceed = () => {
    if (step === 1) {
      if (step1Sub === 'region') return !!(data.region && data.address && data.postalCode);
      if (step1Sub === 'map') return !!(data.latitude && data.longitude);
      if (step1Sub === 'name') return !!data.name;
    }
    if (step === 2) return !!(data.openTime && data.closeTime && data.permits);
    if (step === 3) return data.photos.length >= 3 && !!(data.type && data.capacity && data.features.length > 0);
    return true;
  };

  const [geocoding, setGeocoding] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      if (step1Sub === 'region') {
        // Geocode address if not already set by Autocomplete
        if (!data.latitude || !data.longitude) {
          try {
            setGeocoding(true);
            const query = `${data.address}, ${data.postalCode}, ${selectedRegion?.label}`;
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const results = await res.json();
            if (results.results.length > 0) {
              const { lat, lng } = results.results[0].geometry.location;
              updateData('latitude', String(lat));
              updateData('longitude', String(lng));
            }
          } catch {
            // silently fall through — user can still pin manually
          } finally {
            setGeocoding(false);
          }
        }
        setStep1Sub('map');
        return;
      }
      if (step1Sub === 'map') { setStep1Sub('name'); return; }
      if (step1Sub === 'name') { setStep(2); return; }
    }
    if (step === 2) { setStep(3); return; }
    if (step === 3) { setStep('review'); return; }
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
      setData({ region: '', name: '', address: '', postalCode: '', latitude: '', longitude: '', openTime: '07:00', closeTime: '22:00', smartPricing: true, permits: '', photos: [], type: '', capacity: '', features: [] });
    } catch {
      alert('Failed to create listing. Please try again.');
    }
  };

  // ─── INTRO ─────────────────────────────────────────────────────────────
  if (step === 'intro') {
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
                  <HelpCircle className="w-4 h-4" />
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
  const stepTitle = step === 1
    ? step1Sub === 'region' ? 'Where is your parking space located?' : step1Sub === 'map' ? 'Pin your exact location' : 'Name your parking space'
    : step === 2 ? 'Get ready for drivers'
    : 'Build the picture';

  const stepSub = step === 1
    ? step1Sub === 'region' ? 'Select region, then enter your address' : step1Sub === 'map' ? 'Click the map to mark your parking entrance' : 'Give your parking space a name'
    : step === 2 ? 'Set availability and pricing'
    : 'Add photos and space details';

  const stepProgress = step === 1
    ? step1Sub === 'region' ? '1a' : step1Sub === 'map' ? '1b' : '1c'
    : String(step);

  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      {/* Main content */}
      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full w-full flex flex-col">
          <div className="h-full w-full flex m-0 p-0">

      {/* ── STEP 1: Choose Country ── */}
      {step === 1 && step1Sub === 'region' && (
        <div className="flex animate-fadeIn h-full w-full">
          {/* Left white sector - 65% */}
          <div className="flex-[0_0_65%] bg-white py-6 overflow-auto h-full">
            <div className="px-6 space-y-5 h-full">
              {/* Welcome message */}
              <div className="animate-fadeIn mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Bok! Pripremimo vas da postanete vlasnik prostora.</h2>
                <p className="text-gray-600 mb-6">Korak 1 od 5</p>
              </div>
              {/* Main content area */}
              <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Where is your parking space located?</label>
              <select
                value={data.region}
                onChange={(e) => updateData('region', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-6 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40 appearance-none"
              >
                <option value="" className="text-gray-900">Select a country</option>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="text-gray-900">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {data.region && isLoaded && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <Autocomplete
                    ref={autocompleteRef}
                    onPlaceChanged={handlePlaceSelect}
                  >
                    <input
                      type="text"
                      value={data.address}
                      onChange={(e) => updateData('address', e.target.value)}
                      placeholder="Search address..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                    />
                  </Autocomplete>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poštanski broj</label>
                  <input
                    type="text"
                    value={data.postalCode}
                    onChange={(e) => updateData('postalCode', e.target.value)}
                    placeholder="e.g., 10000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  />
                </div>
              </div>
            )}
            <button onClick={handleNext} disabled={!canProceed() || geocoding} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {geocoding ? 'Finding location…' : 'Continue'}
              {!geocoding && <ChevronRight className="w-4 h-4" />}
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
      {step === 1 && step1Sub === 'map' && (
        <div className={isFullScreen ? "space-y-4 h-full" : "flex gap-[19px] animate-fadeIn"}>
          <div className={isFullScreen ? "space-y-4 h-full flex flex-col" : "flex-1 space-y-4"}>
            <p className="text-sm text-gray-600">Click the map to pin the exact entrance to your parking space</p>
            <div className={isFullScreen ? "flex-1 rounded-lg overflow-hidden border border-gray-300" : ""}>
              <DynamicMap
                lat={data.latitude ? parseFloat(data.latitude) : mapCenter[0]}
                lng={data.longitude ? parseFloat(data.longitude) : mapCenter[1]}
                onLocationSelect={(lat, lng) => {
                  updateData('latitude', String(lat));
                  updateData('longitude', String(lng));
                }}
              />
            </div>
            {data.latitude && data.longitude && (
              <p className="text-sm text-green-600 font-medium">✓ Entrance marked at {parseFloat(data.latitude).toFixed(4)}, {parseFloat(data.longitude).toFixed(4)}</p>
            )}
            <button onClick={handleNext} disabled={!canProceed()} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-80">
            <div className="sticky top-6">
              <InfoWidget tip="Pin the exact entrance so drivers can navigate directly to your parking space." />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Name Your Space ── */}
      {step === 1 && step1Sub === 'name' && (
        <div className="flex gap-[19px] animate-fadeIn">
          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parking Name</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => updateData('name', e.target.value)}
                placeholder="e.g., Downtown Parking A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">This is what drivers will see when searching for parking</p>
            </div>
            <button onClick={handleNext} disabled={!canProceed()} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-80">
            <div className="sticky top-6">
              <InfoWidget tip="Choose a clear, descriptive name that helps drivers identify your parking space easily." />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Get Ready For Drivers ── */}
      {step === 2 && (
        <div className="flex gap-[19px] animate-fadeIn">
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Availability</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Opens at</label>
                  <input type="time" value={data.openTime} onChange={(e) => updateData('openTime', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Closes at</label>
                  <input type="time" value={data.closeTime} onChange={(e) => updateData('closeTime', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Available every day from {data.openTime} to {data.closeTime}</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold">Pricing Strategy</h3>
              <div className="bg-[#5F3DFC]/10 border border-[#5F3DFC]/20 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={data.smartPricing} onChange={(e) => updateData('smartPricing', e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                  <div>
                    <span className="text-sm font-medium block">Use Smart Pricing</span>
                    <span className="text-xs text-gray-600">Automatically adjusts rates based on demand and location</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold">Parking Permit</h3>
              <p className="text-sm text-gray-600">Does this space require a parking permit?</p>
              <div className="space-y-2">
                {[{ v: 'yes', l: 'Yes, permit required' }, { v: 'no', l: 'No permit needed' }].map(({ v, l }) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="permits" value={v} checked={data.permits === v} onChange={(e) => updateData('permits', e.target.value)} className="w-4 h-4" />
                    <span className="text-sm">{l}</span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleNext} disabled={!canProceed()} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-80">
            <div className="sticky top-6">
              <InfoWidget tip="Set realistic hours and pricing to attract more bookings and earn more." />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: Build The Picture ── */}
      {step === 3 && (
        <div className="flex gap-[19px] animate-fadeIn">
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Photos</h3>
              <p className="text-sm text-gray-600">Upload 3–5 photos to showcase your parking space</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <p className="font-medium">Click to upload photos</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </label>
              </div>
              {data.photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{data.photos.length} photo{data.photos.length !== 1 ? 's' : ''} uploaded</p>
                  <div className="grid grid-cols-4 gap-2">
                    {data.photos.map((photo, i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">{photo.name.substring(0, 8)}...</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold">Space Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select value={data.type} onChange={(e) => updateData('type', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40">
                    <option value="">Select type</option>
                    <option value="kolnik">Kolnik (Paved)</option>
                    <option value="garage">Garage</option>
                    <option value="lot">Parking Lot</option>
                    <option value="street">Street Parking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Capacity (cars)</label>
                  <input type="number" value={data.capacity} onChange={(e) => updateData('capacity', e.target.value)} placeholder="e.g. 5" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'covered', label: 'Covered' }, { id: 'lighting', label: 'Lighting' },
                    { id: 'ramp', label: 'Ramp' }, { id: 'asphalt', label: 'Asphalt' },
                    { id: 'concrete', label: 'Concrete' }, { id: 'earth', label: 'Earth' },
                    { id: 'rough_terrain', label: 'Rough Terrain' },
                  ].map((f) => (
                    <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={data.features.includes(f.id)} onChange={() => toggleFeature(f.id)} className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-sm">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleNext} disabled={!canProceed() || data.photos.length < 3} className="w-full mt-6 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              Review & Publish
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-80">
            <div className="sticky top-6">
              <InfoWidget tip="High-quality photos increase bookings by up to 40%. Include entrance, layout and surroundings." />
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && (
        <div className="flex gap-[19px] animate-fadeIn">
          <div className="flex-1 space-y-4">
            <div className="bg-gray-50 rounded-lg p-5 space-y-3 text-sm">
              <div><p className="text-gray-500">Location</p><p className="font-medium">{data.name}, {data.address}, {data.postalCode} ({selectedRegion?.label})</p></div>
              <div><p className="text-gray-500">Space</p><p className="font-medium">{data.capacity} cars • {data.type} • {data.features.join(', ')}</p></div>
              <div><p className="text-gray-500">Available</p><p className="font-medium">Daily {data.openTime} – {data.closeTime}</p></div>
              <div><p className="text-gray-500">Pricing</p><p className="font-medium">{data.smartPricing ? 'Smart Pricing' : 'Manual'} • Permit: {data.permits}</p></div>
              <div><p className="text-gray-500">Photos</p><p className="font-medium">{data.photos.length} uploaded</p></div>
            </div>
            <button onClick={handleSubmit} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
              Publish Listing
            </button>
          </div>
          <div className="w-80">
            <div className="sticky top-6">
              <InfoWidget tip="Review all details before publishing. You can edit after going live." />
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
