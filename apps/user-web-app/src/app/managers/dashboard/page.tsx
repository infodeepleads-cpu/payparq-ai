'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface OfficerAssignment {
  officer_id: string;
  lot_id: string;
  assigned_at: string;
  is_active: boolean;
  officer_name?: string;
  lot_name?: string;
}

export default function ManagerDashboard() {
  const [officers, setOfficers] = useState<OfficerAssignment[]>([]);
  const [newOfficerId, setNewOfficerId] = useState('');
  const [newLotId, setNewLotId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch('/api/officers?role=city_manager', {
        headers: { 'x-user-id': user.id },
      });

      const { data } = await res.json();
      setOfficers(data || []);
    } catch (error) {
      console.error('Failed to fetch officers:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignOfficer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch('/api/officers', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officer_id: newOfficerId,
          lot_id: newLotId,
        }),
      });

      const { success } = await res.json();
      if (success) {
        setNewOfficerId('');
        setNewLotId('');
        fetchOfficers();
      }
    } catch (error) {
      console.error('Failed to assign officer:', error);
    }
  };

  const removeOfficer = async (assignment_id: string) => {
    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetch('/api/officers', {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignment_id }),
      });

      fetchOfficers();
    } catch (error) {
      console.error('Failed to remove officer:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">City Manager Dashboard</h1>

        {/* Assign Officer */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Assign Officer</h2>
          <form onSubmit={assignOfficer} className="grid grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="Officer Email"
              value={newOfficerId}
              onChange={(e) => setNewOfficerId(e.target.value)}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Lot ID"
              value={newLotId}
              onChange={(e) => setNewLotId(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
            >
              Assign Officer
            </button>
          </form>
        </div>

        {/* Officers List */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Your Officers</h2>
          {officers.length === 0 ? (
            <p className="text-gray-600">No officers assigned yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Officer ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Lot ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Assigned At</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((officer, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3">{officer.officer_id.substring(0, 8)}</td>
                      <td className="px-6 py-3">{officer.lot_id || '—'}</td>
                      <td className="px-6 py-3">
                        {new Date(officer.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            officer.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {officer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => removeOfficer(officer.officer_id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
