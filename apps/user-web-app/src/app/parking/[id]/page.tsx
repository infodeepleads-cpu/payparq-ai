'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Star, X } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';

export default function ParkingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');

  useEffect(() => {
    fetchParking();
  }, [id]);

  useEffect(() => {
    const hasDateParams = searchParams.has('in') && searchParams.has('out');
    if (!hasDateParams && !loading && parking) {
      setShowArrivalPicker(true);
    }
  }, [searchParams, loading, parking]);

  const fetchParking = async () => {
    try {
      const res = await fetch('/api/hubs');
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.hubs && data.hubs.length > 0) {
        const found = data.hubs.find((h: any) => h.id === id || h.displayId === id);
        if (found) setParking(found);
      }
    } catch (error) {
      console.error('Failed to fetch parking:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasDateParams = searchParams.has('in') && searchParams.has('out');

  if (loading) return <div className="flex items-center justify-center min-h-screen">Učitavanje...</div>;
  if (!parking) return <div className="flex items-center justify-center min-h-screen">Parking nije pronađen</div>;

  return (
    <div className={!hasDateParams ? 'blur-sm' : ''}>
      <SiteHeader />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">{(parking as any)?.name}</h1>
          <p className="text-lg text-black/60 mb-4">{(parking as any)?.priceLabel}</p>
        </div>
      </div>
      
      {showArrivalPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-96 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-black">Select Arrival</h2>
            <input type="datetime-local" value={arrivalDateTime} onChange={(e) => setArrivalDateTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black" />
            <div className="flex gap-2">
              <button onClick={() => setShowArrivalPicker(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black">Cancel</button>
              <button onClick={() => { if (arrivalDateTime) { setShowArrivalPicker(false); setShowDeparturePicker(true); }}} className="flex-1 px-4 py-2 bg-black text-white rounded-lg">Next</button>
            </div>
          </div>
        </div>
      )}
      
      {showDeparturePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-96 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-black">Select Departure</h2>
            <input type="datetime-local" value={departureDateTime} onChange={(e) => setDepartureDateTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-black" />
            <div className="flex gap-2">
              <button onClick={() => { setShowDeparturePicker(false); setShowArrivalPicker(true); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black">Back</button>
              <button onClick={() => { if (departureDateTime) { router.push(`?in=${encodeURIComponent(arrivalDateTime)}&out=${encodeURIComponent(departureDateTime)}`); setShowDeparturePicker(false); }}} className="flex-1 px-4 py-2 bg-black text-white rounded-lg">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
