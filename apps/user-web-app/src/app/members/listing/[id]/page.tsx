'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PayparqPageHeader } from '@/components/PayparqPageHeader';
import { useLocale } from '@/components/LocaleProvider';

const TRANSLATIONS = {
  'Loading': { en: 'Loading...', hr: 'Učitavanje...' },
  'Listing not found': { en: 'Listing not found', hr: 'Popis nije pronađen' },
  'Dashboard': { en: 'Dashboard', hr: 'Upravljačka ploča' },
  'Capacity': { en: 'Capacity', hr: 'Kapacitet' },
  'spaces': { en: 'spaces', hr: 'mjesta' },
  'Status': { en: 'Status', hr: 'Status' },
  'ID': { en: 'ID', hr: 'ID' },
  'Active': { en: 'Active', hr: 'Aktivno' },
  'Pending': { en: 'Pending', hr: 'Na čekanju' },
  'Unverified': { en: 'Unverified', hr: 'Neverificirano' },
  'Manage Calendar': { en: 'Manage Calendar', hr: 'Upravljaj kalendarom' },
  'Edit Listing': { en: 'Edit Listing', hr: 'Uredi popis' },
} as const;

const t = (key: string, locale: 'en' | 'hr'): string => {
  const trans = TRANSLATIONS[key as keyof typeof TRANSLATIONS];
  return trans ? trans[locale] : key;
};

interface Listing {
  id: string;
  name: string;
  address: string;
  capacity: number;
  verification_status: string;
  display_id: string | null;
}

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const id = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');

  useEffect(() => {
    loadListing();
  }, [id]);

  useEffect(() => {
    const hasDateParams = searchParams.has('in') && searchParams.has('out');
    if (!hasDateParams) {
      setShowArrivalPicker(true);
    }
  }, [searchParams]);

  const loadListing = async () => {
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const { location } = await res.json();
      if (!location) {
        setLoading(false);
        return;
      }
      setListing(location);
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
            <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
            <div className="animate-pulse w-12 h-12 rounded-full bg-[#020617] flex items-center justify-center shadow-lg z-10">
              <span className="text-lg font-black tracking-tight text-white select-none">P</span>
            </div>
          </div>
          <p className="text-black/60 text-sm">{t('Loading', locale)}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-600">{t('Listing not found', locale)}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'verified') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'verified') return t('Active', locale);
    if (status === 'pending') return t('Pending', locale);
    return t('Unverified', locale);
  };

  return (
    <div className="min-h-screen bg-white">
      <PayparqPageHeader
        title={listing.name}
        onBack={() => router.back()}
        lineColor="black"
      />

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <h2 className="hidden md:block text-2xl font-bold text-black mb-6">{t('Dashboard', locale)}</h2>

        <div className="bg-white rounded-xl border border-black/10 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-black mb-1">{listing.name}</h3>
            <p className="text-sm text-black/60">{listing.address}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-black/10">
            <div>
              <p className="text-xs font-semibold text-black/60 uppercase mb-1">{t('Capacity', locale)}</p>
              <p className="text-lg font-bold text-black">{listing.capacity} {t('spaces', locale)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-black/60 uppercase mb-1">{t('Status', locale)}</p>
              <span className={`text-sm px-2 py-1 rounded-full font-semibold inline-block ${getStatusColor(listing.verification_status)}`}>
                {getStatusLabel(listing.verification_status)}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-black/60 uppercase mb-1">{t('ID', locale)}</p>
              <p className="text-xs font-mono text-black/50 break-all">{listing.display_id ? String(listing.display_id).padStart(5, '0') : listing.id}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/members/calendar/${listing.id}`)}
              className="flex-1 px-4 py-3 bg-[#5F3DFC] text-white rounded-lg font-semibold hover:bg-[#4330c4] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5H4v9a2 2 0 002 2h12a2 2 0 002-2V7h-2v1a1 1 0 11-2 0V7H9v1a1 1 0 11-2 0V7H6v1a1 1 0 11-2 0V7z" />
              </svg>
              {t('Manage Calendar', locale)}
            </button>

            <button
              onClick={() => router.push(`/members/edit-listing/${listing.id}`)}
              className="flex-1 px-4 py-3 bg-white text-[#5F3DFC] border-2 border-[#5F3DFC] rounded-lg font-semibold hover:bg-[#5F3DFC] hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              {t('Edit Listing', locale)}
            </button>
          </div>
        </div>
      </div>

      {/* Arrival Date/Time Picker */}
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

      {/* Departure Date/Time Picker */}
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
