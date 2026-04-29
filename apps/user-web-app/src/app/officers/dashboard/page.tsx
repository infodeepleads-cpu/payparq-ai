'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EnforcementCheckout {
  id: string;
  lot_id: string;
  shift_start: string;
  shift_end?: string;
  fines_count: number;
  tickets_issued: number;
  enforcement_done_at?: string;
  notes?: string;
}

export default function OfficerDashboard() {
  const [checkouts, setCheckouts] = useState<EnforcementCheckout[]>([]);
  const [currentCheckout, setCurrentCheckout] = useState<EnforcementCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [finesCount, setFinesCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCheckouts();
  }, []);

  const fetchCheckouts = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/enforcement/checkout?lot_id=`, {
        headers: { 'x-user-id': user.id },
      });

      const { data } = await res.json();
      setCheckouts(data || []);
    } catch (error) {
      console.error('Failed to fetch checkouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const startShift = async (lot_id: string) => {
    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch('/api/enforcement/checkout', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lot_id,
          shift_start: new Date().toISOString(),
        }),
      });

      const { data } = await res.json();
      setCurrentCheckout(data);
      setFinesCount(0);
      setTicketsCount(0);
      setNotes('');
    } catch (error) {
      console.error('Failed to start shift:', error);
    }
  };

  const endShift = async () => {
    if (!currentCheckout) return;
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch('/api/enforcement/checkout', {
        method: 'PATCH',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentCheckout.id,
          enforcement_done_at: new Date().toISOString(),
          fines_count: finesCount,
          tickets_issued: ticketsCount,
          notes,
        }),
      });

      const { data } = await res.json();
      setCurrentCheckout(null);
      setCheckouts([...checkouts, data]);
    } catch (error) {
      console.error('Failed to end shift:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Officer Dashboard</h1>

        {currentCheckout ? (
          // Active shift
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-600">Active Enforcement Shift</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fines Count</label>
                <input
                  type="number"
                  value={finesCount}
                  onChange={(e) => setFinesCount(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tickets Issued</label>
                <input
                  type="number"
                  value={ticketsCount}
                  onChange={(e) => setTicketsCount(Number(e.target.value))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                rows={4}
              />
            </div>
            <button
              onClick={endShift}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700"
            >
              ✓ Enforcement Done
            </button>
          </div>
        ) : (
          // No active shift
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <p className="text-gray-600 mb-4">No active enforcement shift</p>
            <button
              onClick={() => startShift('lot-default')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700"
            >
              Start Enforcement Shift
            </button>
          </div>
        )}

        {/* Past checkouts */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Enforcement History</h2>
          {checkouts.length === 0 ? (
            <p className="text-gray-600">No enforcement history yet</p>
          ) : (
            <div className="space-y-4">
              {checkouts.map((checkout) => (
                <div key={checkout.id} className="border-l-4 border-blue-600 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {new Date(checkout.shift_start).toLocaleDateString()} -{' '}
                        {new Date(checkout.shift_start).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Fines: {checkout.fines_count} | Tickets: {checkout.tickets_issued}
                      </p>
                      {checkout.notes && <p className="text-sm text-gray-500 mt-1">{checkout.notes}</p>}
                    </div>
                    {checkout.enforcement_done_at && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Done at {new Date(checkout.enforcement_done_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
