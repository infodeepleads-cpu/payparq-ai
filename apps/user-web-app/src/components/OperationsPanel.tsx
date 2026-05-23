'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RideRequest {
  id: string;
  lot_id: string;
  lot_name?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
  driver_id?: string;
  customer_email?: string;
}

interface DriverPerformance {
  accepted_count: number;
  declined_count: number;
  completed_count: number;
  accept_rate: number;
  total_score: number;
}

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

type OpsTab = 'driver' | 'officers' | 'valet';

export function OperationsPanel() {
  const [activeTab, setActiveTab] = useState<OpsTab>('driver');
  const [userId, setUserId] = useState<string | null>(null);

  // Driver state
  const [pendingRides, setPendingRides] = useState<RideRequest[]>([]);
  const [acceptedRides, setAcceptedRides] = useState<RideRequest[]>([]);
  const [performance, setPerformance] = useState<DriverPerformance | null>(null);
  const [processingRideId, setProcessingRideId] = useState<string | null>(null);

  // Officer state
  const [checkouts, setCheckouts] = useState<EnforcementCheckout[]>([]);
  const [currentCheckout, setCurrentCheckout] = useState<EnforcementCheckout | null>(null);
  const [finesCount, setFinesCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [shiftNotes, setShiftNotes] = useState('');
  const [officerLoading, setOfficerLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        fetchDriverData(data.user.id);
        fetchOfficerData(data.user.id);

        const sub = supabase!
          .channel(`ops_rides:${data.user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests', filter: `driver_id=eq.${data.user.id}` }, () => {
            fetchAcceptedRides(data.user.id);
            fetchPerformance(data.user.id);
          })
          .subscribe();

        return () => { sub.unsubscribe(); };
      }
    });
  }, []);

  async function fetchDriverData(uid: string) {
    await Promise.all([fetchPendingRides(uid), fetchAcceptedRides(uid), fetchPerformance(uid)]);
  }

  async function fetchPendingRides(_uid: string) {
    if (!supabase) return;
    const { data } = await supabase.from('ride_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(20);
    setPendingRides(data || []);
  }

  async function fetchAcceptedRides(uid: string) {
    if (!supabase) return;
    const { data } = await supabase.from('ride_requests').select('*').eq('driver_id', uid).in('status', ['accepted', 'completed']).order('created_at', { ascending: false }).limit(20);
    setAcceptedRides(data || []);
  }

  async function fetchPerformance(uid: string) {
    if (!supabase) return;
    const { data } = await supabase.from('driver_performance').select('*').eq('driver_id', uid).single();
    if (data) setPerformance(data);
  }

  async function acceptRide(rideId: string) {
    if (!userId) return;
    setProcessingRideId(rideId);
    await fetch('/api/rides', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ride_id: rideId, driver_id: userId, action: 'accept' }) });
    await Promise.all([fetchPendingRides(userId), fetchAcceptedRides(userId), fetchPerformance(userId)]);
    setProcessingRideId(null);
  }

  async function declineRide(rideId: string) {
    if (!userId) return;
    setProcessingRideId(rideId);
    await fetch('/api/rides', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ride_id: rideId, driver_id: userId, action: 'decline' }) });
    await Promise.all([fetchPendingRides(userId), fetchPerformance(userId)]);
    setProcessingRideId(null);
  }

  async function completeRide(rideId: string) {
    if (!userId) return;
    setProcessingRideId(rideId);
    await fetch('/api/rides', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ride_id: rideId, action: 'complete' }) });
    await Promise.all([fetchAcceptedRides(userId), fetchPerformance(userId)]);
    setProcessingRideId(null);
  }

  async function fetchOfficerData(uid: string) {
    setOfficerLoading(true);
    const res = await fetch('/api/enforcement/checkout?lot_id=', { headers: { 'x-user-id': uid } });
    const { data } = await res.json();
    setCheckouts(data || []);
    setOfficerLoading(false);
  }

  async function startShift() {
    if (!userId) return;
    const res = await fetch('/api/enforcement/checkout', { method: 'POST', headers: { 'x-user-id': userId, 'Content-Type': 'application/json' }, body: JSON.stringify({ lot_id: 'lot-default', shift_start: new Date().toISOString() }) });
    const { data } = await res.json();
    setCurrentCheckout(data);
    setFinesCount(0);
    setTicketsCount(0);
    setShiftNotes('');
  }

  async function endShift() {
    if (!currentCheckout || !userId) return;
    await fetch('/api/enforcement/checkout', { method: 'PATCH', headers: { 'x-user-id': userId, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentCheckout.id, enforcement_done_at: new Date().toISOString(), fines_count: finesCount, tickets_issued: ticketsCount, notes: shiftNotes }) });
    setCurrentCheckout(null);
    fetchOfficerData(userId);
  }

  const tabs: { id: OpsTab; label: string }[] = [
    { id: 'driver', label: 'Driver' },
    { id: 'officers', label: 'Officers' },
    { id: 'valet', label: 'Valet' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight text-black">Operations</h2>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-black/10 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-black text-black'
                : 'border-transparent text-black/50 hover:text-black/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Driver tab */}
      {activeTab === 'driver' && (
        <div className="space-y-4">
          {performance && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Accept Rate', value: `${performance.accept_rate.toFixed(1)}%` },
                { label: 'Accepted', value: performance.accepted_count },
                { label: 'Completed', value: performance.completed_count },
                { label: 'Score', value: performance.total_score },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-black/10 bg-white p-3 text-center">
                  <p className="text-[11px] text-black/50">{m.label}</p>
                  <p className="text-lg font-bold text-black">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
              <div className="border-b border-black/10 px-4 py-3">
                <p className="font-semibold text-sm text-black">Available Rides ({pendingRides.length})</p>
              </div>
              <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {pendingRides.length === 0 ? (
                  <p className="text-sm text-black/40 text-center py-4">No pending rides</p>
                ) : pendingRides.map((ride) => (
                  <div key={ride.id} className="rounded-lg border border-black/10 p-3 bg-blue-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm">{ride.lot_name || ride.lot_id}</p>
                      <p className="text-[11px] text-black/40">{new Date(ride.created_at).toLocaleTimeString()}</p>
                    </div>
                    {ride.customer_email && <p className="text-[11px] text-black/50 mb-2">{ride.customer_email}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => acceptRide(ride.id)} disabled={processingRideId === ride.id} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded font-semibold hover:bg-green-700 disabled:opacity-50">✓ Accept</button>
                      <button onClick={() => declineRide(ride.id)} disabled={processingRideId === ride.id} className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded font-semibold hover:bg-red-600 disabled:opacity-50">✕ Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
              <div className="border-b border-black/10 px-4 py-3">
                <p className="font-semibold text-sm text-black">My Rides ({acceptedRides.length})</p>
              </div>
              <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {acceptedRides.length === 0 ? (
                  <p className="text-sm text-black/40 text-center py-4">No active rides</p>
                ) : acceptedRides.map((ride) => (
                  <div key={ride.id} className={`rounded-lg border p-3 ${ride.status === 'completed' ? 'border-black/10 bg-gray-50' : 'border-green-200 bg-green-50/50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm">{ride.lot_name || ride.lot_id}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${ride.status === 'completed' ? 'bg-gray-200 text-gray-700' : 'bg-green-200 text-green-800'}`}>{ride.status.toUpperCase()}</span>
                    </div>
                    {ride.status === 'accepted' && (
                      <button onClick={() => completeRide(ride.id)} disabled={processingRideId === ride.id} className="w-full bg-blue-600 text-white text-xs py-1.5 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 mt-1">✓ Complete Ride</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Officers tab */}
      {activeTab === 'officers' && (
        <div className="space-y-4">
          {officerLoading ? (
            <p className="text-sm text-black/40">Loading...</p>
          ) : currentCheckout ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4">
              <p className="font-semibold text-sm text-blue-700">Active Enforcement Shift</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-black/60 mb-1">Fines Count</label>
                  <input type="number" value={finesCount} onChange={(e) => setFinesCount(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-black/60 mb-1">Tickets Issued</label>
                  <input type="number" value={ticketsCount} onChange={(e) => setTicketsCount(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg" />
                </div>
              </div>
              <textarea value={shiftNotes} onChange={(e) => setShiftNotes(e.target.value)} placeholder="Notes..." className="w-full px-3 py-2 text-sm border border-black/10 rounded-lg" rows={3} />
              <button onClick={endShift} className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700">✓ Enforcement Done</button>
            </div>
          ) : (
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-sm text-black/50 mb-3">No active enforcement shift</p>
              <button onClick={startShift} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700">Start Enforcement Shift</button>
            </div>
          )}

          {checkouts.length > 0 && (
            <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
              <div className="border-b border-black/10 px-4 py-3">
                <p className="font-semibold text-sm">Enforcement History</p>
              </div>
              <div className="divide-y divide-black/5 max-h-72 overflow-y-auto">
                {checkouts.map((c) => (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{new Date(c.shift_start).toLocaleDateString()}</p>
                        <p className="text-[11px] text-black/50">Fines: {c.fines_count} · Tickets: {c.tickets_issued}</p>
                        {c.notes && <p className="text-[11px] text-black/40 mt-0.5">{c.notes}</p>}
                      </div>
                      {c.enforcement_done_at && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Done</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Valet tab */}
      {activeTab === 'valet' && <ValetTab userId={userId} />}
    </div>
  );
}

interface ServiceRequest {
  id: string;
  type: 'valet' | 'shuttle';
  location_id: string;
  status: string;
  ticket_no?: string;
  guest_name?: string;
  plate?: string;
  pickup_label?: string;
  created_at: string;
}

function ValetTab({ userId }: { userId: string | null }) {
  const [pending, setPending] = useState<ServiceRequest[]>([]);
  const [active, setActive] = useState<ServiceRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !supabase) return;
    fetchRequests(userId);

    const sub = supabase!
      .channel(`valet_requests:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        fetchRequests(userId);
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [userId]);

  async function fetchRequests(uid: string) {
    if (!supabase) return;
    setLoading(true);

    // Get officer's assigned lots
    const { data: assignments } = await supabase
      .from('officer_assignments')
      .select('lot_id')
      .eq('officer_id', uid)
      .eq('is_active', true);

    const lotIds = (assignments ?? []).map((a: { lot_id: string }) => a.lot_id).filter(Boolean);

    if (lotIds.length === 0) {
      setPending([]);
      setActive([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .in('location_id', lotIds)
      .in('status', ['pending', 'accepted', 'en_route', 'arrived'])
      .order('created_at', { ascending: false })
      .limit(30);

    const all = (data ?? []) as ServiceRequest[];
    setPending(all.filter(r => r.status === 'pending'));
    setActive(all.filter(r => r.status !== 'pending'));
    setLoading(false);
  }

  async function updateRequest(id: string, action: string) {
    if (!userId) return;
    setProcessing(id);
    await fetch('/api/service-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ id, action }),
    });
    if (userId) fetchRequests(userId);
    setProcessing(null);
  }

  const typeLabel = (type: string) => type === 'valet' ? 'Valet' : 'Prijevoz';
  const typeColor = (type: string) => type === 'valet' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700';

  if (loading) return <p className="text-sm text-black/40">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pending requests */}
        <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
          <div className="border-b border-black/10 px-4 py-3">
            <p className="font-semibold text-sm">Pending ({pending.length})</p>
          </div>
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            {pending.length === 0 ? (
              <p className="text-sm text-black/40 text-center py-4">No pending requests</p>
            ) : pending.map((r) => (
              <div key={r.id} className="rounded-lg border border-black/10 p-3 bg-purple-50/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${typeColor(r.type)}`}>{typeLabel(r.type)}</span>
                    {r.ticket_no && <span className="ml-2 text-[11px] font-mono text-black/50">{r.ticket_no}</span>}
                  </div>
                  <p className="text-[11px] text-black/40">{new Date(r.created_at).toLocaleTimeString()}</p>
                </div>
                {r.guest_name && <p className="text-xs text-black/60 mb-1">{r.guest_name}</p>}
                {r.plate && <p className="text-xs text-black/50 mb-1">Plate: {r.plate}</p>}
                {r.pickup_label && <p className="text-xs text-black/50 mb-2">{r.pickup_label}</p>}
                <div className="flex gap-2">
                  <button onClick={() => updateRequest(r.id, 'accept')} disabled={processing === r.id} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded font-semibold hover:bg-green-700 disabled:opacity-50">✓ Accept</button>
                  <button onClick={() => updateRequest(r.id, 'cancel')} disabled={processing === r.id} className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded font-semibold hover:bg-red-600 disabled:opacity-50">✕ Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active requests */}
        <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
          <div className="border-b border-black/10 px-4 py-3">
            <p className="font-semibold text-sm">Active ({active.length})</p>
          </div>
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            {active.length === 0 ? (
              <p className="text-sm text-black/40 text-center py-4">No active requests</p>
            ) : active.map((r) => (
              <div key={r.id} className="rounded-lg border border-purple-200 bg-purple-50/30 p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${typeColor(r.type)}`}>{typeLabel(r.type)}</span>
                    {r.ticket_no && <span className="ml-2 text-[11px] font-mono text-black/50">{r.ticket_no}</span>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-semibold">{r.status.toUpperCase()}</span>
                </div>
                {r.guest_name && <p className="text-xs text-black/60 mb-2">{r.guest_name}</p>}
                {r.status === 'accepted' && (
                  <button onClick={() => updateRequest(r.id, 'arrive')} disabled={processing === r.id} className="w-full bg-blue-600 text-white text-xs py-1.5 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 mb-1">Arrived</button>
                )}
                {r.status === 'arrived' && (
                  <button onClick={() => updateRequest(r.id, 'done')} disabled={processing === r.id} className="w-full bg-black text-white text-xs py-1.5 rounded font-semibold hover:bg-black/80 disabled:opacity-50">✓ Done</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
