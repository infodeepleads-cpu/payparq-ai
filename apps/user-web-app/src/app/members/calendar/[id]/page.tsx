'use client';

import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { PayparqPageHeader } from '@/components/PayparqPageHeader';
import { LotCalendarPricing } from '@/components/LotCalendarPricing';

interface Listing {
  id: string;
  name: string;
  address: string;
  capacity: number;
}

export default function CalendarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, capacity')
        .eq('id', id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setListing(data);
    } catch (err) {
      console.error('Error loading listing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-4">
            {/* Rotating white ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
            {/* Pulsating logo */}
            <div className="animate-pulse w-12 h-12 rounded-full bg-[#020617] flex items-center justify-center shadow-lg z-10">
              <span className="text-lg font-black tracking-tight text-white select-none">P</span>
            </div>
          </div>
          <p className="text-black/60 text-sm">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-600">Popis nije pronađen</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PayparqPageHeader
        title="Upravljaj kalendarom i cijenama"
        onBack={() => router.back()}
      />

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <LotCalendarPricing
          lotId={listing.id}
          lotName={listing.name}
          lotAddress={listing.address}
          lotCapacity={String(listing.capacity)}
          onBack={() => router.back()}
        />
      </div>
    </div>
  );
}
