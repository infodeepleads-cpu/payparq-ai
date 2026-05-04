'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Listing {
  id: string;
  name: string;
  address: string;
  capacity: number;
  verification_status: string;
  verification_metadata: any;
}

export default function ParkingManagementPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [capacity, setCapacity] = useState('');
  const [openTime, setOpenTime] = useState('07:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [available24_7, setAvailable24_7] = useState(false);
  const [pricingMode, setPricingMode] = useState<'smart' | 'manual'>('smart');
  const [dailyPrice, setDailyPrice] = useState('');
  const [hourlyPrice, setHourlyPrice] = useState('');

  // Fetch listing
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', listingId)
          .single();

        if (fetchError) throw fetchError;
        setListing(data);

        // Load current values
        const meta = data.verification_metadata || {};
        setCapacity(String(data.capacity || 1));
        setAvailable24_7(meta.available24_7 || false);
        setOpenTime(meta.openTime || '07:00');
        setCloseTime(meta.closeTime || '22:00');
        setPricingMode(meta.pricingModel === 'smart' ? 'smart' : 'manual');
        setDailyPrice(String(data.base_price_daily || ''));
        setHourlyPrice(String(data.base_price_hourly || ''));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) fetchListing();
  }, [listingId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          capacity: parseInt(capacity) || 1,
          total_spots: parseInt(capacity) || 1,
          base_price_daily: parseFloat(dailyPrice) || 0,
          base_price_hourly: parseFloat(hourlyPrice) || 0,
          verification_metadata: {
            ...listing?.verification_metadata,
            available24_7,
            openTime: available24_7 ? '00:00' : openTime,
            closeTime: available24_7 ? '24:00' : closeTime,
            pricingModel: pricingMode,
          },
        })
        .eq('id', listingId);

      if (updateError) throw updateError;
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save on field changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (listing) handleSave();
    }, 1500);
    return () => clearTimeout(timer);
  }, [capacity, available24_7, openTime, closeTime, pricingMode, dailyPrice, hourlyPrice]);

  if (loading) return <div className="p-4">Učitavanje...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!listing) return <div className="p-4">Parking prostor nije pronađen</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="hover:opacity-70">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{listing.name}</h1>
          <p className="text-xs text-white/60">{listing.address}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Capacity */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-black">Kapacitet (mjesta)</label>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-lg"
          />
        </div>

        {/* Hours */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-black">Radno vrijeme</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={available24_7}
              onChange={(e) => setAvailable24_7(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-black">Dostupno 24/7</span>
          </div>

          {!available24_7 && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-black/60">Otvaranje</label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm"
                />
              </div>
              <span className="text-black/40 mt-5">—</span>
              <div className="flex-1">
                <label className="text-xs text-black/60">Zatvaranje</label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-black">Cijena</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPricingMode('smart')}
              className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
                pricingMode === 'smart'
                  ? 'border-[#5F3DFC] bg-[#5F3DFC]/5'
                  : 'border-black/10 hover:border-black/20'
              }`}
            >
              <span className="text-sm font-semibold text-black">Smart Pricing</span>
            </button>
            <button
              onClick={() => setPricingMode('manual')}
              className={`flex-1 py-2 px-3 rounded-lg border transition-all ${
                pricingMode === 'manual'
                  ? 'border-[#5F3DFC] bg-[#5F3DFC]/5'
                  : 'border-black/10 hover:border-black/20'
              }`}
            >
              <span className="text-sm font-semibold text-black">Ručno</span>
            </button>
          </div>

          {pricingMode === 'manual' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-black/60">Dnevna cijena (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dailyPrice}
                  onChange={(e) => setDailyPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-black/60">Satna cijena (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyPrice}
                  onChange={(e) => setHourlyPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {pricingMode === 'smart' && (
            <div className="bg-[#5F3DFC]/5 border border-[#5F3DFC]/20 rounded-lg p-3">
              <p className="text-xs text-black/70">Smart pricing koristi AI za optimizaciju cijena na temelju potražnje.</p>
            </div>
          )}
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {saving && (
            <>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-600">Spremanje...</span>
            </>
          )}
          {!saving && !error && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">Spremljeno</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
