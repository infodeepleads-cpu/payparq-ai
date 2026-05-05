'use client';

import { useState } from 'react';

export default function TestMembersListingPage() {
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  const listings = [
    { id: '1', name: 'Downtown Premium Parking', address: '123 Main Street', capacity: 5, status: 'verified', statusLabel: 'Aktivno' },
    { id: '2', name: 'Airport Parking Spot', address: '456 Airport Road', capacity: 2, status: 'pending', statusLabel: 'Na čekanju' },
    { id: '3', name: 'City Center Lot', address: '789 Center Ave', capacity: 10, status: 'verified', statusLabel: 'Aktivno' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-black/60">Moji prostori</p>
            <button
              type="button"
              className="w-6 h-6 rounded-full bg-[#5F3DFC] text-white flex items-center justify-center hover:bg-[#4330c4] transition-colors"
              title="Dodaj novi prostor"
            >
              <span className="text-base leading-none font-bold">+</span>
            </button>
          </div>

          <div className="space-y-2">
            {listings.map((loc) => (
              <div
                key={loc.id}
                className="w-full flex items-center justify-between py-2 px-2 rounded-lg border border-transparent hover:border-black/10 hover:bg-black/2 transition-all group"
              >
                <button className="flex-1 text-left">
                  <p className="text-xs font-semibold text-black truncate">{loc.name}</p>
                  <p className="text-[10px] text-black/50 truncate">{loc.address}</p>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-black/50">{loc.capacity} mj.</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    loc.status === 'verified' ? 'bg-green-100 text-green-700' :
                    loc.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {loc.statusLabel}
                  </span>

                  {loc.status === 'verified' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLot(loc.id);
                        alert('Calendar CTA clicked for: ' + loc.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-purple-500 hover:text-purple-700 transition-all"
                      title="Upravljaj kalendarom i cijenama"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5H4v9a2 2 0 002 2h12a2 2 0 002-2V7h-2v1a1 1 0 11-2 0V7H9v1a1 1 0 11-2 0V7H6v1a1 1 0 11-2 0V7z" />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Edit page for: ' + loc.name);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 transition-all"
                    title="Uredi lot"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Delete listing: ' + loc.name);
                    }}
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

          <p className="text-[11px] text-black/50 mt-4 text-center">Hover over listings to see action buttons</p>
        </div>

        <div className="mt-8 p-4 bg-black/5 rounded-lg border border-black/10">
          <h3 className="text-sm font-bold text-black mb-2">Legend:</h3>
          <ul className="text-xs text-black/60 space-y-1">
            <li>🟪 <strong>Calendar button (purple)</strong> - Opens calendar & pricing manager (only for verified listings)</li>
            <li>🔵 <strong>Edit button (blue)</strong> - Opens edit page with all listing details</li>
            <li>🔴 <strong>Delete button (red)</strong> - Deletes the listing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
