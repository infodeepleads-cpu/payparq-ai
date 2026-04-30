'use client';

import { useState } from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./ParkingLocationMap'), { ssr: false });

type MainStep = 'intro' | 1 | 2 | 3 | 'review';
type Step1Sub = 'region' | 'map' | 'name';

const REGIONS = [
  { id: 'HR', label: 'Croatia', center: [45.815, 15.982] },
  { id: 'SI', label: 'Slovenia', center: [46.056, 14.506] },
  { id: 'RS', label: 'Serbia', center: [44.787, 20.457] },
  { id: 'BA', label: 'Bosnia', center: [43.852, 18.396] },
  { id: 'ME', label: 'Montenegro', center: [42.442, 19.268] },
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
      <div className="sticky top-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Useful Info</h4>
            <p className="text-sm text-gray-700">{tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListYourLotPanel() {
  const [step, setStep] = useState<MainStep>('intro');
  const [step1Sub, setStep1Sub] = useState<Step1Sub>('region');
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
        // Geocode address before showing map
        try {
          setGeocoding(true);
          const query = `${data.address}, ${data.postalCode}, ${selectedRegion?.label}`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
          const results = await res.json();
          if (results.length > 0) {
            updateData('latitude', results[0].lat);
            updateData('longitude', results[0].lon);
          }
        } catch {
          // silently fall through — user can still pin manually
        } finally {
          setGeocoding(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={handleBack} className="text-sm text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-1">← Back</button>
          <h2 className="text-2xl font-bold mb-1">{stepTitle}</h2>
          <p className="text-gray-600">{stepSub}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">Step {stepProgress} of 3</p>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1 rounded-full transition-all ${s === Number(step) ? 'bg-[#5F3DFC] w-8' : s < Number(step) ? 'bg-green-500 w-6' : 'bg-gray-300 w-6'}`} />
              ))}
            </div>
          </div>
          <button onClick={() => setStep('intro')} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Save & Exit
          </button>
        </div>
      </div>

      {/* ── STEP 1a: Region + Address ── */}
      {step === 1 && step1Sub === 'region' && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Region</p>
              <div className="grid grid-cols-3 gap-3">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => updateData('region', r.id)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${data.region === r.id ? 'border-[#5F3DFC] bg-[#5F3DFC]/10 text-[#5F3DFC]' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {data.region && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => updateData('address', e.target.value)}
                    placeholder="Street and house number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={data.postalCode}
                    onChange={(e) => updateData('postalCode', e.target.value)}
                    placeholder="e.g., 10000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                  />
                </div>
              </div>
            )}
          </div>
          <InfoWidget tip="Your exact address will only be shared with confirmed bookings." />
        </div>
      )}

      {/* ── STEP 1b: Map ── */}
      {step === 1 && step1Sub === 'map' && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            <p className="text-sm text-gray-600">Click the map to pin the exact entrance to your parking space</p>
            <DynamicMap
              lat={data.latitude ? parseFloat(data.latitude) : mapCenter[0]}
              lng={data.longitude ? parseFloat(data.longitude) : mapCenter[1]}
              onLocationSelect={(lat, lng) => {
                updateData('latitude', String(lat));
                updateData('longitude', String(lng));
              }}
            />
            {data.latitude && data.longitude && (
              <p className="text-sm text-green-600 font-medium">✓ Entrance marked at {parseFloat(data.latitude).toFixed(4)}, {parseFloat(data.longitude).toFixed(4)}</p>
            )}
          </div>
          <InfoWidget tip="Pin the exact entrance so drivers can navigate directly to your parking space." />
        </div>
      )}

      {/* ── STEP 1c: Name ── */}
      {step === 1 && step1Sub === 'name' && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-5">
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
          </div>
          <InfoWidget tip="Choose a clear, descriptive name that helps drivers identify your parking space easily." />
        </div>
      )}

      {/* ── STEP 2: Get ready for drivers ── */}
      {step === 2 && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
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
          </div>
          <InfoWidget tip="Set realistic hours and pricing to attract more bookings and earn more." />
        </div>
      )}

      {/* ── STEP 3: Build the picture ── */}
      {step === 3 && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
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
          </div>
          <InfoWidget tip="High-quality photos increase bookings by up to 40%. Include entrance, layout and surroundings." />
        </div>
      )}

      {/* ── REVIEW ── */}
      {step === 'review' && (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
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
          <InfoWidget tip="Review all details before publishing. You can edit after going live." />
        </div>
      )}

      {/* Navigation */}
      {step !== 'review' && (
        <div className="flex gap-3 pt-4 border-t">
          <button onClick={handleBack} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Back</button>
          <button onClick={handleNext} disabled={!canProceed() || geocoding} className="flex-1 px-4 py-2 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {geocoding ? 'Finding location…' : step === 3 ? 'Review & Publish' : 'Continue'}
            {!geocoding && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
