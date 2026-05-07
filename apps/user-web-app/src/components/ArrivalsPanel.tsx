'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Session = {
  id: string;
  plate: string | null;
  email: string | null;
  location_id: string | null;
  location_name?: string | null;
  type: string | null;
  status: string | null;
  payment_status: string | null;
  price: number | null;
  currency: string | null;
  entry_time: string | null;
  exit_time: string | null;
  duration_minutes: number | null;
  quantity: number | null;
  created_at: string | null;
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtAmount(price: number | null, currency: string | null): string {
  if (price === null) return '—';
  if (price === 0) return 'Free';
  return `€${price.toFixed(2)}`;
}

function StatusBadge({ status, paymentStatus }: { status: string | null; paymentStatus: string | null }) {
  if (status === 'active') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Active</span>;
  if (status === 'scheduled') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Upcoming</span>;
  if (status === 'expired' || status === 'completed') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Completed</span>;
  if (status === 'pending') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">Pending</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">{status || '—'}</span>;
}

interface ArrivalsPanelProps {
  userId: string;
}

export function ArrivalsPanel({ userId }: ArrivalsPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'live' | 'upcoming' | 'history'>('live');
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchSessions = useCallback(async () => {
    if (!supabase) return;

    // Get owner's location IDs
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('owner_id', userId);

    if (!locations?.length) {
      setLoading(false);
      return;
    }

    const locationMap: Record<string, string> = {};
    locations.forEach(l => { locationMap[l.id] = l.name; });
    setLocationNames(locationMap);

    const locationIds = locations.map(l => l.id);

    const { data } = await supabase
      .from('parking_sessions')
      .select('*')
      .in('location_id', locationIds)
      .order('entry_time', { ascending: false })
      .limit(2000);

    setSessions(data || []);
    setLastRefresh(new Date());
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const now = new Date();

  const withNames = sessions.map(s => {
    const entry = s.entry_time ? new Date(s.entry_time) : null;
    // Calculate exit_time: entry_time + duration (quantity in minutes)
    const exit = entry && s.duration_minutes ? new Date(entry.getTime() + s.duration_minutes * 60000) : null;
    return { ...s, location_name: locationNames[s.location_id ?? ''] ?? s.location_id, calculated_exit: exit };
  });

  const live = withNames.filter(s => {
    const entry = s.entry_time ? new Date(s.entry_time) : null;
    const exit = s.calculated_exit;
    return entry && entry <= now && (exit ? exit >= now : true);
  });

  const upcoming = withNames.filter(s => {
    const entry = s.entry_time ? new Date(s.entry_time) : null;
    return entry && entry > now;
  });

  const history = withNames.filter(s => {
    const exit = s.calculated_exit;
    return exit && exit < now;
  });

  const filtered = (tab === 'live' ? live : tab === 'upcoming' ? upcoming : history).filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.plate?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.location_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        {([['live', `Live (${live.length})`, 'bg-green-500'], ['upcoming', `Upcoming (${upcoming.length})`, 'bg-blue-500'], ['history', `History (${history.length})`, 'bg-gray-500']] as const).map(([id, label, color]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${tab === id ? `${color} text-white` : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/30">Updated {fmtTime(lastRefresh.toISOString())}</span>
          <button onClick={fetchSessions} className="text-[10px] text-white/50 hover:text-white/80 px-2 py-1 rounded border border-white/10">↻</button>
        </div>
      </div>

      {/* Search */}
      {tab === 'history' && (
        <div className="px-4 py-2 border-b border-white/10">
          <input
            type="text"
            placeholder="Search plate, email, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/10 text-white text-xs placeholder-white/30 rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-white/30"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-white/40 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/40">
            <p className="text-sm">{tab === 'live' ? 'No active sessions' : tab === 'upcoming' ? 'No upcoming sessions' : 'No history found'}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#05020A]">
              <tr className="text-white/40 text-left">
                <th className="px-4 py-2 font-medium">Plate</th>
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Check-in</th>
                <th className="px-4 py-2 font-medium">Check-out</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={`border-t border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="px-4 py-2.5 font-mono font-bold text-white">{s.plate || '—'}</td>
                  <td className="px-4 py-2.5 text-white/70">{s.location_name || '—'}</td>
                  <td className="px-4 py-2.5 text-white/60">{fmt(s.entry_time)}</td>
                  <td className="px-4 py-2.5 text-white/60">{fmt(s.calculated_exit?.toISOString() || null)}</td>
                  <td className="px-4 py-2.5 text-white/60">{fmtDuration(s.duration_minutes)}</td>
                  <td className="px-4 py-2.5 font-semibold text-white/80">{fmtAmount(s.price, s.currency)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={s.status} paymentStatus={s.payment_status} /></td>
                  <td className="px-4 py-2.5 text-white/40 truncate max-w-[140px]">{s.email || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
