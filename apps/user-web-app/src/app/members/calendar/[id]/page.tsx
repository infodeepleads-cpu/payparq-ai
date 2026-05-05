'use client';

import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
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
        <p className="text-black/50">Učitavanje...</p>
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Nazad
        </button>

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
