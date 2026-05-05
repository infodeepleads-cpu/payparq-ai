'use client';

import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
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
        <style>{`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .logo-spin {
            animation: rotate 2s linear infinite;
          }
        `}</style>
        <div className="text-center">
          <div className="logo-spin w-16 h-16 mx-auto mb-4">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#5F3DFC" strokeWidth="2"/>
              <circle cx="50" cy="50" r="35" fill="none" stroke="#5F3DFC" strokeWidth="1" opacity="0.5"/>
              <path d="M 50 15 Q 70 30 70 50 Q 70 70 50 85 Q 30 70 30 50 Q 30 30 50 15" fill="#5F3DFC" opacity="0.8"/>
            </svg>
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
      {/* Header - Same style as onboarding */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upravljaj kalendarom i cijenama</h1>
            <p className="text-gray-600 text-sm">{listing.name}</p>
          </div>
        </div>
      </div>

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
