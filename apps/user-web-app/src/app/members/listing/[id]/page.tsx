'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Listing {
  id: string;
  name: string;
  address: string;
  capacity: number;
  verification_status: string;
}

export default function ListingPage() {
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
        .select('id, name, address, capacity, verification_status')
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

  const getStatusColor = (status: string) => {
    if (status === 'verified') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'verified') return 'Aktivno';
    if (status === 'pending') return 'Na čekanju';
    return 'Neverificirano';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Nazad
        </button>

        <div className="bg-white rounded-xl border border-black/10 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black mb-2">{listing.name}</h1>
            <p className="text-black/60">{listing.address}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-black/10">
            <div>
              <p className="text-xs font-semibold text-black/60 uppercase mb-1">Kapacitet</p>
              <p className="text-lg font-bold text-black">{listing.capacity} mjesta</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-black/60 uppercase mb-1">Status</p>
              <span className={`text-sm px-2 py-1 rounded-full font-semibold inline-block ${getStatusColor(listing.verification_status)}`}>
                {getStatusLabel(listing.verification_status)}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-black/60 uppercase mb-1">ID</p>
              <p className="text-xs font-mono text-black/50">{listing.id.substring(0, 8)}...</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/members/calendar/${listing.id}`)}
              className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5H4v9a2 2 0 002 2h12a2 2 0 002-2V7h-2v1a1 1 0 11-2 0V7H9v1a1 1 0 11-2 0V7H6v1a1 1 0 11-2 0V7z" />
              </svg>
              Upravljaj kalendarom
            </button>

            <button
              onClick={() => router.push(`/members/edit-listing/${listing.id}`)}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Uredi popis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
