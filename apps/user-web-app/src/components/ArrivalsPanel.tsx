'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocale } from './LocaleProvider';

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

const ARRIVALS_TRANSLATIONS = {
  'Arrivals': { en: 'Arrivals', hr: 'Dolasci' },
  'Live': { en: 'Live', hr: 'Uživo' },
  'Upcoming': { en: 'Upcoming', hr: 'Nadolazeće' },
  'Expired': { en: 'Expired', hr: 'Završeno' },
  'History': { en: 'History', hr: 'povijest' },
  'Updated': { en: 'Updated', hr: 'Ažurirano' },
  'No active sessions': { en: 'No active sessions', hr: 'Nema aktivnih sesija' },
  'No upcoming sessions': { en: 'No upcoming sessions', hr: 'Nema nadolazećih sesija' },
  'No history': { en: 'No history', hr: 'Nema povijesti' },
} as const;

const arrivalsT = (key: string, locale: 'en' | 'hr'): string => {
  const trans = ARRIVALS_TRANSLATIONS[key as keyof typeof ARRIVALS_TRANSLATIONS];
  return trans ? trans[locale] : key;
};

function StatusBadge({ computedStatus, locale }: { computedStatus: 'active' | 'upcoming' | 'expired'; locale: 'en' | 'hr' }) {
  if (computedStatus === 'active') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">{arrivalsT('Live', locale)}</span>;
  if (computedStatus === 'upcoming') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">{arrivalsT('Upcoming', locale)}</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">{arrivalsT('Expired', locale)}</span>;
}

interface ArrivalsPanelProps {
  userId: string;
}

export function ArrivalsPanel({ userId }: ArrivalsPanelProps) {
  const { locale } = useLocale();
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

  const withNames = sessions.map(s => ({
    ...s,
    location_name: locationNames[s.location_id ?? ''] ?? s.location_id,
  }));

  const now = new Date();

  const getExitTime = (s: typeof withNames[0]): Date | null => {
    if (s.exit_time) return new Date(s.exit_time);
    if (s.entry_time && s.duration_minutes) {
      return new Date(new Date(s.entry_time).getTime() + s.duration_minutes * 60000);
    }
    return null;
  };

  const getComputedStatus = (s: typeof withNames[0]): 'active' | 'upcoming' | 'expired' => {
    const entry = s.entry_time ? new Date(s.entry_time) : null;
    const exit = getExitTime(s);
    if (!entry) return 'expired';
    if (entry > now) return 'upcoming';
    if (exit && exit <= now) return 'expired';
    return 'active';
  };

  const live = withNames.filter(s => getComputedStatus(s) === 'active');
  const upcoming = withNames.filter(s => getComputedStatus(s) === 'upcoming');
  const history = withNames.filter(s => getComputedStatus(s) === 'expired');

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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-black/60">{arrivalsT('Arrivals', locale)}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-black/40">{arrivalsT('Updated', locale)} {fmtTime(lastRefresh.toISOString())}</span>
            <button onClick={fetchSessions} className="text-[10px] text-black/40 hover:text-black px-2 py-0.5 rounded border border-black/10 transition-colors">↻</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {([
            ['live', `${arrivalsT('Live', locale)} (${live.length})`, 'bg-[#2563EB] text-white', 'text-[#2563EB] border border-[#2563EB]/30'],
            ['upcoming', `${arrivalsT('Upcoming', locale)} (${upcoming.length})`, 'bg-[#2563EB] text-white', 'text-[#2563EB] border border-[#2563EB]/30'],
            ['history', `${arrivalsT('History', locale)} (${history.length})`, 'bg-black text-white', 'text-black/60 border border-black/15'],
          ] as const).map(([id, label, activeClass, inactiveClass]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${tab === id ? activeClass : `bg-transparent ${inactiveClass} hover:bg-black/5`}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {tab === 'history' && (
        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Pretraži tablicu, email, lokaciju..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/5 text-black text-xs placeholder-black/30 rounded-lg px-3 py-2 outline-none border border-black/10 focus:border-[#2563EB]/50"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-black/40 text-sm">Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-black/40">
            <p className="text-sm">{tab === 'live' ? arrivalsT('No active sessions', locale) : tab === 'upcoming' ? arrivalsT('No upcoming sessions', locale) : arrivalsT('No history', locale)}</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-xl border border-black/10 bg-white p-3 hover:border-[#2563EB]/30 hover:bg-[#2563EB]/5 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm text-[#2563EB]">{s.plate || '—'}</span>
                  <StatusBadge computedStatus={getComputedStatus(s)} locale={locale} />
                </div>
                <p className="text-xs font-semibold text-black truncate">{s.location_name || '—'}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  <span className="text-[10px] text-black/50">Ulaz: <span className="text-black font-medium">{fmt(s.entry_time)}</span></span>
                  {s.exit_time && <span className="text-[10px] text-black/50">Izlaz: <span className="text-black font-medium">{fmt(s.exit_time)}</span></span>}
                  {s.duration_minutes && <span className="text-[10px] text-black/50">Trajanje: <span className="text-[#2563EB] font-semibold">{fmtDuration(s.duration_minutes)}</span></span>}
                  {s.price !== null && <span className="text-[10px] text-black/50">Iznos: <span className="text-black font-semibold">{fmtAmount(s.price, s.currency)}</span></span>}
                  {s.email && <span className="text-[10px] text-black/50 truncate max-w-[180px]">Email: <span className="text-black/70">{s.email}</span></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
