'use client';

import { useState } from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./ParkingLocationMap'), { ssr: false });

type MainStep = 'intro' | 1 | 2 | 3 | 'review';

interface ListingData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  type: string;
  capacity: string;
  features: string[];
  openTime: string;
  closeTime: string;
  smartPricing: boolean;
  permits: string;
  photos: File[];
}

export function ListYourLotPanel() {
  const [step, setStep] = useState<MainStep>('intro');
  const [data, setData] = useState<ListingData>({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    type: '',
    capacity: '',
    features: [],
    openTime: '07:00',
    closeTime: '22:00',
    smartPricing: true,
    permits: '',
    photos: [],
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
        return data.name && data.address && data.latitude && data.longitude && data.type && data.capacity && data.features.length > 0;
      case 2:
        return data.openTime && data.closeTime && data.permits;
      case 3:
        return data.photos.length >= 3;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('address', data.address);
      formData.append('latitude', data.latitude);
      formData.append('longitude', data.longitude);
      formData.append('type', data.type);
      formData.append('capacity', data.capacity);
      formData.append('features', JSON.stringify(data.features));
      formData.append('openTime', data.openTime);
      formData.append('closeTime', data.closeTime);
      formData.append('smartPricing', String(data.smartPricing));
      formData.append('permits', data.permits);

      for (const photo of data.photos) {
        formData.append('photos', photo);
      }

      const response = await fetch('/api/listings', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error: ${result.error}`);
        return;
      }

      alert('✅ Parking listing published successfully!');
      setStep('intro');
      setData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        type: '',
        capacity: '',
        features: [],
        openTime: '07:00',
        closeTime: '22:00',
        smartPricing: true,
        permits: '',
        photos: [],
      });
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to create listing. Please try again.');
    }
  };

  if (step === 'intro') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Great Progress, Karlo!</h2>
          <p className="text-gray-600">Now let's get some details about your space so you can publish your listing.</p>
        </div>

        <div className="grid gap-6">
          {/* Section 1 */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStep(1)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Step 1</h3>
                <p className="text-gray-600">Locations, features and more</p>
              </div>
              <div className="text-[#5F3DFC] text-2xl font-bold">1</div>
            </div>
            <p className="text-sm text-gray-500">Add your parking location on a map, describe the space type, capacity, and features</p>
          </div>

          {/* Section 2 */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStep(2)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Step 2</h3>
                <p className="text-gray-600">Get ready for drivers</p>
              </div>
              <div className="text-[#5F3DFC] text-2xl font-bold">2</div>
            </div>
            <p className="text-sm text-gray-500">Set availability hours, pricing strategy, and permit requirements</p>
          </div>

          {/* Section 3 */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStep(3)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Step 3</h3>
                <p className="text-gray-600">Build the picture</p>
              </div>
              <div className="text-[#5F3DFC] text-2xl font-bold">3</div>
            </div>
            <p className="text-sm text-gray-500">Upload photos and street view to showcase your parking space</p>
          </div>
        </div>

        {/* Earnings Estimate */}
        <div className="bg-gradient-to-r from-[#5F3DFC]/10 to-[#5F3DFC]/5 border border-[#5F3DFC]/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm text-gray-700">In your area, we think that your spaces could earn up to</p>
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-3xl font-bold text-[#5F3DFC]">€6,912.00 <span className="text-lg font-normal text-gray-600">per year</span></p>
        </div>

        <button
          onClick={() => setStep(1)}
          className="w-full px-6 py-3 bg-[#5F3DFC] text-white rounded-lg font-semibold hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2"
        >
          Start with the basics
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with step indicator */}
      <div>
        <button
          onClick={() => setStep('intro')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">
              {step === 1 ? 'Locations, features and more' : step === 2 ? 'Get ready for drivers' : 'Build the picture'}
            </h2>
            <p className="text-gray-600">
              {step === 1 ? 'Start with the basics' : step === 2 ? 'Set availability and pricing' : 'Add photos and details'}
            </p>
          </div>
          <div className="text-4xl font-bold text-[#5F3DFC]">{step}</div>
        </div>
      </div>

      {/* Step 1: Locations, features and more */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parking Name</h3>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateData('name', e.target.value)}
              placeholder="e.g., Downtown Parking A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address</h3>
            <input
              type="text"
              value={data.address}
              onChange={(e) => updateData('address', e.target.value)}
              placeholder="Full address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Mark Your Parking Location</h3>
            <p className="text-sm text-gray-600">Click on the map to mark the exact entrance to your parking</p>
            <DynamicMap
              lat={data.latitude ? parseFloat(data.latitude) : 45.815}
              lng={data.longitude ? parseFloat(data.longitude) : 15.982}
              onLocationSelect={(lat, lng) => {
                updateData('latitude', String(lat));
                updateData('longitude', String(lng));
              }}
            />
            {data.latitude && data.longitude && (
              <p className="text-sm text-green-600">✓ Location marked</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Type</h3>
              <select
                value={data.type}
                onChange={(e) => updateData('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
              >
                <option value="">Select type</option>
                <option value="kolnik">Kolnik (Paved)</option>
                <option value="garage">Garage</option>
                <option value="lot">Parking Lot</option>
                <option value="street">Street Parking</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Capacity</h3>
              <input
                type="number"
                value={data.capacity}
                onChange={(e) => updateData('capacity', e.target.value)}
                placeholder="Number of cars"
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'covered', label: 'Covered' },
                { id: 'lighting', label: 'Lighting' },
                { id: 'ramp', label: 'Ramp' },
                { id: 'asphalt', label: 'Asphalt' },
                { id: 'concrete', label: 'Concrete' },
                { id: 'earth', label: 'Earth' },
                { id: 'rough_terrain', label: 'Rough Terrain' },
              ].map((f) => (
                <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.features.includes(f.id)}
                    onChange={() => toggleFeature(f.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Get ready for drivers */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Availability</h3>
            <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing Strategy</h3>
            <div className="bg-[#5F3DFC]/10 border border-[#5F3DFC]/20 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.smartPricing}
                  onChange={(e) => updateData('smartPricing', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium block">Use Smart Pricing</span>
                  <span className="text-xs text-gray-600">Automatically adjusts rates based on demand and location</span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parking Permit</h3>
            <p className="text-sm text-gray-600 mb-3">Does this space require a parking permit?</p>
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
                  <span className="text-sm capitalize">{opt === 'yes' ? 'Yes, permit required' : 'No permit needed'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Build the picture */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Photos</h3>
            <p className="text-sm text-gray-600">Upload 3-5 photos to showcase your parking space</p>
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
                <p className="text-sm font-medium mb-3">
                  {data.photos.length} photo{data.photos.length !== 1 ? 's' : ''} uploaded
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
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={() => {
            if (step === 1) setStep('intro');
            else setStep((Number(step) - 1) as MainStep);
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (step === 3) {
              setStep('review');
            } else {
              setStep((Number(step) + 1) as MainStep);
            }
          }}
          disabled={!canProceed()}
          className="flex-1 px-4 py-2 bg-[#5F3DFC] text-white rounded-lg text-sm font-medium hover:bg-[#4330c4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {step === 3 ? 'Review & Publish' : 'Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Review step */}
      {step === 'review' && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Review Your Parking Listing</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium">{data.name}, {data.address}</p>
            </div>
            <div>
              <p className="text-gray-600">Space</p>
              <p className="font-medium">
                {data.capacity} cars • {data.type} • {data.features.join(', ')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Available</p>
              <p className="font-medium">Daily {data.openTime} - {data.closeTime}</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Publish Listing
          </button>
        </div>
      )}
    </div>
  );
}
