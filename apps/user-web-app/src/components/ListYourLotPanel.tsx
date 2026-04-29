'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5 | 'review';

interface ListingData {
  // Step 1: Location
  name: string;
  address: string;
  latitude: string;
  longitude: string;

  // Step 2: Space Details
  type: string; // 'driveway' | 'garage' | 'lot' | 'street'
  capacity: string; // '1' | '2-5' | '5+'
  features: string[]; // 'covered', 'lighting', 'security', 'heated'

  // Step 3: Photos
  photos: File[];

  // Step 4: Availability
  openTime: string; // "07:00"
  closeTime: string; // "22:00"

  // Step 5: Pricing & Permits
  smartPricing: boolean;
  permits: string; // 'yes' | 'no'
}

export function ListYourLotPanel() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<ListingData>({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    type: '',
    capacity: '',
    features: [],
    photos: [],
    openTime: '07:00',
    closeTime: '22:00',
    smartPricing: true,
    permits: '',
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

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.name && data.address && data.latitude && data.longitude;
      case 2:
        return data.type && data.capacity && data.features.length > 0;
      case 3:
        return data.photos.length >= 5;
      case 4:
        return data.openTime && data.closeTime;
      case 5:
        return data.permits;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    // TODO: Submit to /api/listings
    console.log('Submitting listing:', data);
    alert('Listing submitted! (Demo)');
    setStep(1);
    setData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      type: '',
      capacity: '',
      features: [],
      photos: [],
      openTime: '07:00',
      closeTime: '22:00',
      smartPricing: true,
      permits: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex justify-between items-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s
                  ? 'bg-[#5F3DFC] text-white'
                  : Number(step) > s || (step === 'review' && s < 5)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {Number(step) > s || (step === 'review' && s < 5) ? '✓' : s}
            </div>
            {s < 5 && <div className="flex-1 h-1 bg-gray-200"></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Location */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">1. Location</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Lot Name</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateData('name', e.target.value)}
              placeholder="e.g., Downtown Lot A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={data.address}
              onChange={(e) => updateData('address', e.target.value)}
              placeholder="Full address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={data.latitude}
                onChange={(e) => updateData('latitude', e.target.value)}
                placeholder="43.5081"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={data.longitude}
                onChange={(e) => updateData('longitude', e.target.value)}
                placeholder="16.4402"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Space Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">2. Space Details</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={data.type}
              onChange={(e) => updateData('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            >
              <option value="">Select type</option>
              <option value="driveway">Driveway</option>
              <option value="garage">Garage</option>
              <option value="lot">Parking Lot</option>
              <option value="street">Street Parking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Capacity</label>
            <select
              value={data.capacity}
              onChange={(e) => updateData('capacity', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            >
              <option value="">Select capacity</option>
              <option value="1">1 car</option>
              <option value="2-5">2-5 cars</option>
              <option value="5+">5+ cars</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-3">Features</label>
            <div className="space-y-2">
              {['covered', 'lighting', 'security', 'heated'].map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.features.includes(f)}
                    onChange={() => toggleFeature(f)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{f}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Photos */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">3. Photos (5+ required)</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <p className="font-medium">Click to upload photos</p>
              <p className="text-sm text-gray-500">or drag and drop</p>
            </label>
          </div>
          {data.photos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                {data.photos.length} photos uploaded
              </p>
              <div className="grid grid-cols-4 gap-2">
                {data.photos.map((photo, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                    {photo.name.substring(0, 8)}...
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Availability */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">4. Availability</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Opens at</label>
              <input
                type="time"
                value={data.openTime}
                onChange={(e) => updateData('openTime', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Closes at</label>
              <input
                type="time"
                value={data.closeTime}
                onChange={(e) => updateData('closeTime', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Available every day from {data.openTime} to {data.closeTime}
          </p>
        </div>
      )}

      {/* Step 5: Pricing & Permits */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">5. Pricing & Permits</h3>
          <div className="bg-[#5F3DFC]/10 border border-[#5F3DFC]/20 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.smartPricing}
                onChange={(e) => updateData('smartPricing', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Use Smart Pricing</span>
            </label>
            <p className="text-xs text-gray-600 mt-2">
              Smart pricing automatically adjusts rates based on demand and location
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Does this space require a parking permit?
            </label>
            <div className="space-y-2">
              {['yes', 'no'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="permits"
                    value={opt}
                    checked={data.permits === opt}
                    onChange={(e) => updateData('permits', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm capitalize">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Step */}
      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Your Listing</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium">{data.name}, {data.address}</p>
            </div>
            <div>
              <p className="text-gray-600">Space</p>
              <p className="font-medium">
                {data.capacity} • {data.type} • {data.features.join(', ')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Available</p>
              <p className="font-medium">
                Daily {data.openTime} - {data.closeTime}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Pricing</p>
              <p className="font-medium">
                {data.smartPricing ? 'Smart Pricing Enabled' : 'Manual Pricing'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Permit Required</p>
              <p className="font-medium capitalize">{data.permits}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => {
            if (step === 1) return;
            setStep(step === 'review' ? 5 : (Number(step) - 1) as Step);
          }}
          disabled={step === 1}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (step === 5) {
              setStep('review');
            } else if (step === 'review') {
              handleSubmit();
            } else {
              setStep((Number(step) + 1) as Step);
            }
          }}
          disabled={!canProceed()}
          className="flex-1 px-4 py-2 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {step === 'review' ? 'Submit' : 'Next'}
          {step !== 'review' && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
