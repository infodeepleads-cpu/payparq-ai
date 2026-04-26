'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface OfficerAssignment {
  officer_id: string;
  lot_id: string;
  assigned_at: string;
  is_active: boolean;
}

export function ManagementPanel() {
  const [officers, setOfficers] = useState<OfficerAssignment[]>([]);
  const [newOfficerId, setNewOfficerId] = useState('');
  const [newLotId, setNewLotId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOfficers();
  }, []);

  async function fetchOfficers() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch('/api/officers?role=city_manager', { headers: { 'x-user-id': user.id } });
      const { data } = await res.json();
      setOfficers(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function assignOfficer(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'x-user-id': user.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: newOfficerId, lot_id: newLotId }),
      });
      const { success } = await res.json();
      if (success) {
        setNewOfficerId('');
        setNewLotId('');
        fetchOfficers();
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeOfficer(officer_id: string) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await fetch('/api/officers', {
      method: 'DELETE',
      headers: { 'x-user-id': user.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment_id: officer_id }),
    });
    fetchOfficers();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-black">Management</h2>

      {/* Assign officer form */}
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <p className="text-sm font-semibold text-black mb-3">Assign Officer</p>
        <form onSubmit={assignOfficer} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Officer email"
            value={newOfficerId}
            onChange={(e) => setNewOfficerId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-black/10 rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Lot ID (optional)"
            value={newLotId}
            onChange={(e) => setNewLotId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-black/10 rounded-lg"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black/80 disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </form>
      </div>

      {/* Officers list */}
      <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3">
          <p className="font-semibold text-sm">Your Officers</p>
        </div>
        {loading ? (
          <p className="px-4 py-4 text-sm text-black/40">Loading...</p>
        ) : officers.length === 0 ? (
          <p className="px-4 py-4 text-sm text-black/40">No officers assigned yet</p>
        ) : (
          <div className="divide-y divide-black/5">
            {officers.map((o, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{o.officer_id.substring(0, 8)}…</p>
                  <p className="text-[11px] text-black/50">
                    {o.lot_id || 'No lot'} · {new Date(o.assigned_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${o.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {o.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => removeOfficer(o.officer_id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
