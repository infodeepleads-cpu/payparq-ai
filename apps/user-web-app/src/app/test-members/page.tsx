'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const mockListings = [
  { id: 'abc-123', name: 'Downtown Parking', address: 'Ilica 12, Zagreb', capacity: 5, verification_status: 'verified' },
  { id: 'def-456', name: 'Airport Lot', address: 'Airport Road 1', capacity: 2, verification_status: 'pending' },
  { id: 'ghi-789', name: 'City Center', address: 'Trg bana 3, Zagreb', capacity: 10, verification_status: 'verified' },
];

export default function TestMembersPage() {
  const router = useRouter();
  const [listings] = useState(mockListings);

  const statusColor = (s: string) =>
    s === 'verified' ? 'bg-green-100 text-green-700' :
    s === 'pending' ? 'bg-amber-100 text-amber-700' :
    'bg-gray-100 text-gray-600';

  const statusLabel = (s: string) =>
    s === 'verified' ? 'Aktivno' :
    s === 'pending' ? 'Na čekanju' :
    'Neverificirano';

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* LISTINGS WIDGET */}
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-black/60">Moji prostori</p>
            <button className="w-6 h-6 rounded-full bg-[#5F3DFC] text-white flex items-center justify-center">
              <span className="text-base leading-none font-bold">+</span>
            </button>
          </div>

          <div className="space-y-2">
            {listings.map((loc) => (
              <div
                key={loc.id}
                className="w-full flex items-center justify-between py-2 px-2 rounded-lg border border-transparent hover:border-black/10 hover:bg-black/[0.02] transition-all group"
              >
                {/* Listing name — click goes to listing page */}
                <button
                  onClick={() => alert(`→ /members/listing/${loc.id}`)}
                  className="flex-1 text-left"
                >
                  <p className="text-xs font-semibold text-black truncate">{loc.name}</p>
                  <p className="text-[10px] text-black/50 truncate">{loc.address}</p>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-black/50">{loc.capacity} mj.</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusColor(loc.verification_status)}`}>
                    {statusLabel(loc.verification_status)}
                  </span>

                  {/* Calendar — verified only */}
                  {loc.verification_status === 'verified' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); alert(`→ /members/calendar/${loc.id}`); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-purple-500 hover:text-purple-700 transition-all"
                      title="Upravljaj kalendarom"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5H4v9a2 2 0 002 2h12a2 2 0 002-2V7h-2v1a1 1 0 11-2 0V7H9v1a1 1 0 11-2 0V7H6v1a1 1 0 11-2 0V7z" />
                      </svg>
                    </button>
                  )}

                  {/* Edit */}
                  <button
                    onClick={(e) => { e.stopPropagation(); alert(`→ /members/edit-listing/${loc.id}`); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 transition-all"
                    title="Uredi lot"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); alert(`Delete: ${loc.name}`); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-all"
                    title="Obriši lot"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CALENDAR WIDGET */}
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-black/60 mb-3">📅 Upravljaj kalendarima</p>
          <div className="space-y-2">
            {listings
              .filter(loc => loc.verification_status === 'verified')
              .map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => alert(`→ /members/calendar/${loc.id}`)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg border border-black/10 hover:bg-purple-50 hover:border-purple-300 transition-all group"
                >
                  <div className="text-left">
                    <p className="text-xs font-semibold text-black">{loc.name}</p>
                    <p className="text-[10px] text-black/50">{loc.capacity} mjesta</p>
                  </div>
                  <svg className="w-4 h-4 text-purple-500 group-hover:text-purple-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5H4v9a2 2 0 002 2h12a2 2 0 002-2V7h-2v1a1 1 0 11-2 0V7H9v1a1 1 0 11-2 0V7H6v1a1 1 0 11-2 0V7z" />
                  </svg>
                </button>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
