'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';

type LocationData = {
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

export default function ParkingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');

  useEffect(() => {
    fetchLocation();
  }, [id]);

  useEffect(() => {
    const hasDateParams = searchParams.has('in') && searchParams.has('out');
    if (!hasDateParams && !loading && location) {
      setShowArrivalPicker(true);
    }
  }, [searchParams, loading, location]);

  const fetchLocation = async () => {
    try {
      const res = await fetch('/api/hubs');
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.hubs && data.hubs.length > 0) {
        const hub = data.hubs.find((h: any) => h.id === id || h.displayId === id);
        if (hub) {
          const slug = hub.href?.split('/').pop();
          const locationRes = await fetch(`/api/locations/${slug}`);
          if (locationRes.ok) {
            const locationData = await locationRes.json();
            if (locationData.location) {
              setLocation(locationData.location);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasDateParams = searchParams.has('in') && searchParams.has('out');

  if (loading) return <div className="flex items-center justify-center min-h-screen">Učitavanje...</div>;
  if (!location) return <div className="flex items-center justify-center min-h-screen">Lokacija nije pronađena</div>;

  return (
    <div>
      <SiteHeader />

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-2 gap-6 max-w-6xl mx-auto p-6">
        {/* Left: Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">{location.name}</h1>
            <p className="text-lg text-black/60 mb-4">{location.address}</p>
            <p className="text-2xl font-bold text-black">{location.base_price_hourly || 'Kontaktirajte'}€/hr</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-black/60">✓ Besplatna otkazivanja</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-black/60">✓ Zajamčeno mjesto</span>
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
          <p className="text-black/60">Mapa</p>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden max-w-full p-4">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-black">{location.name}</h1>
          <p className="text-black/60">{location.address}</p>
          <p className="text-xl font-bold text-black">{location.base_price_hourly || 'Kontaktirajte'}€/hr</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-black/60 text-sm">✓ Besplatna otkazivanja</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-black/60 text-sm">✓ Zajamčeno mjesto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arrival Date Picker Modal */}
      {showArrivalPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full md:w-96 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-black">Odaberi dolazak</h2>
            <input
              type="datetime-local"
              value={arrivalDateTime}
              onChange={(e) => setArrivalDateTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowArrivalPicker(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black font-semibold"
              >
                Otkaži
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
                Dalje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Departure Date Picker Modal */}
      {showDeparturePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full md:w-96 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-black">Odaberi polazak</h2>
            <input
              type="datetime-local"
              value={departureDateTime}
              onChange={(e) => setDepartureDateTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeparturePicker(false);
                  setShowArrivalPicker(true);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black font-semibold"
              >
                Natrag
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
                Gotovo
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterBrand />
    </div>
  );
}
