'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LocationClient from './LocationClient';

type HubData = {
  id: string;
  name: string;
  address?: string;
  display_id?: string;
  canonical_slug?: string;
  latitude?: number;
  longitude?: number;
  verification_metadata?: Record<string, unknown>;
  base_price_hourly?: number;
  base_price_daily?: number;
  base_price_monthly?: number;
};

export default function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hub, setHub] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');

  useEffect(() => {
    params.then(({ slug }) => {
      fetchHub(slug);
    });
  }, [params]);

  useEffect(() => {
    const hasDateParams = searchParams.has('in') && searchParams.has('out');
    if (!hasDateParams && !loading) {
      setShowArrivalPicker(true);
    }
  }, [searchParams, loading]);

  const fetchHub = async (slug: string) => {
    try {
      const res = await fetch(`/api/locations/${slug}`);
      if (!res.ok) {
        console.error('Failed to fetch location:', res.status);
        return;
      }
      const data = await res.json();
      if (data.location) {
        setHub(data.location);
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!hub) {
    return <div className="flex items-center justify-center min-h-screen">Location not found</div>;
  }

  const hasDateParams = searchParams.has('in') && searchParams.has('out');

  return (
    <div>
      <LocationClient
        hub={hub}
        priceLabel={`${hub.base_price_hourly || 'Contact'}€/hr`}
        hero=""
        faqItems={[]}
        travelTime="15 min"
      />

      {/* Arrival Picker Modal */}
      {showArrivalPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full md:w-96 rounded-2xl p-6 space-y-4 relative z-50">
            <h2 className="text-xl font-bold text-black">Select Arrival</h2>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={arrivalDateTime}
                onChange={(e) => setArrivalDateTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black text-base focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowArrivalPicker(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (arrivalDateTime) {
                    setShowArrivalPicker(false);
                    setShowDeparturePicker(true);
                  }
                }}
                disabled={!arrivalDateTime}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Departure Picker Modal */}
      {showDeparturePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full md:w-96 rounded-2xl p-6 space-y-4 relative z-50">
            <h2 className="text-xl font-bold text-black">Select Departure</h2>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={departureDateTime}
                onChange={(e) => setDepartureDateTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black text-base focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeparturePicker(false);
                  setShowArrivalPicker(true);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (departureDateTime) {
                    router.push(`?in=${encodeURIComponent(arrivalDateTime)}&out=${encodeURIComponent(departureDateTime)}`);
                    setShowDeparturePicker(false);
                  }
                }}
                disabled={!departureDateTime}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
