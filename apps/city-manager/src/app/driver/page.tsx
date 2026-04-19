'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';

type RequestStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'done' | 'cancelled';

type ServiceRequest = {
  id: string;
  type: 'shuttle' | 'valet';
  status: RequestStatus;
  ticket_no: string | null;
  guest_name: string | null;
  pickup_label: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  plate: string | null;
  parking_zone: string | null;
  eta_minutes: number | null;
  created_at: string;
  driver_id: string | null;
};

type Message = {
  id: string;
  sender: 'guest' | 'driver';
  body: string;
  created_at: string;
};

const STATUS_NEXT: Partial<Record<RequestStatus, RequestStatus>> = {
  accepted: 'en_route',
  en_route: 'arrived',
  arrived: 'done',
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Na čekanju',
  accepted: 'Prihvaćeno',
  en_route: 'Na putu',
  arrived: 'Stigao',
  done: 'Završeno',
  cancelled: 'Otkazano',
};

const STATUS_NEXT_LABEL: Partial<Record<RequestStatus, string>> = {
  accepted: '🚗 Kreći na put',
  en_route: '📍 Stigao sam',
  arrived: '✓ Predaja završena',
};

export default function DriverPage() {
  const supabase = getSupabase();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'shuttle' | 'valet'>('shuttle');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [etaInput, setEtaInput] = useState('5');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    });
  }, [supabase]);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext not available
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .in('status', ['pending', 'accepted', 'en_route', 'arrived'])
      .order('created_at', { ascending: false });
    const rows = (data as ServiceRequest[]) ?? [];
    setRequests(rows);

    // Detect new pending requests for notifications
    const newPending = rows.filter(
      (r) => r.status === 'pending' && !knownIdsRef.current.has(r.id)
    );
    if (newPending.length > 0 && knownIdsRef.current.size > 0) {
      // Only notify after initial load (size > 0 means we already have a baseline)
      newPending.forEach((r) => {
        const label = r.type === 'shuttle' ? '🚌 Shuttle' : '🚗 Valet';
        const detail = r.guest_name ?? r.pickup_label ?? r.ticket_no ?? '';
        if (Notification.permission === 'granted') {
          new Notification(`Novi ${r.type} zahtjev`, {
            body: detail ? `${label} · ${detail}` : label,
            icon: '/icon-192.png',
            tag: r.id,
          });
        }
        playBeep();
      });
    }
    // Always update known IDs baseline
    rows.forEach((r) => knownIdsRef.current.add(r.id));

    // Update tab title with pending count
    const pendingCount = rows.filter((r) => r.status === 'pending').length;
    document.title = pendingCount > 0 ? `(${pendingCount}) PayParq Driver` : 'PayParq Driver';
  }, [supabase, playBeep]);

  const fetchMessages = useCallback(async (requestId: string) => {
    const { data } = await supabase
      .from('service_messages')
      .select('id,sender,body,created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchRequests();
    pollRef.current = setInterval(fetchRequests, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchRequests]);

  useEffect(() => {
    if (!selectedId) return;
    fetchMessages(selectedId);
    const interval = setInterval(() => fetchMessages(selectedId), 3000);
    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // GPS broadcasting
  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const startGps = useCallback(() => {
    if (!user) return;
    if (!navigator.geolocation) { setGpsError('GPS nije dostupan'); return; }
    setGpsError(null);
    requestNotificationPermission();

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        if (!effectiveUser) return;
        const { latitude, longitude } = pos.coords;
        await supabase.from('drivers').upsert({
          id: effectiveUser.id,
          last_location: `POINT(${longitude} ${latitude})`,
          is_online: true,
        }, { onConflict: 'id' });
      },
      (err) => setGpsError(`GPS greška: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, [effectiveUser, supabase]);

  const stopGps = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (effectiveUser) {
      await supabase.from('drivers').upsert({ id: effectiveUser.id, is_online: false }, { onConflict: 'id' });
    }
    knownIdsRef.current.clear();
    document.title = 'PayParq Driver';
  }, [user, supabase]);

  const toggleOnline = () => {
    if (isOnline) {
      setIsOnline(false);
      stopGps();
    } else {
      setIsOnline(true);
      startGps();
    }
  };

  const acceptRequest = async (req: ServiceRequest) => {
    if (!effectiveUser) return;
    await supabase.from('service_requests').update({
      status: 'accepted',
      driver_id: effectiveUser.id,
      eta_minutes: parseInt(etaInput) || 5,
    }).eq('id', req.id);
    setSelectedId(req.id);
    fetchRequests();
  };

  const advanceStatus = async (req: ServiceRequest) => {
    const next = STATUS_NEXT[req.status];
    if (!next) return;
    if (next === 'done') setCompletingId(req.id);
    await supabase.from('service_requests').update({ status: next }).eq('id', req.id);
    if (next === 'done') {
      setTimeout(() => setCompletingId(null), 2500);
    }
    fetchRequests();
  };

  const sendMessage = async () => {
    if (!selectedId || !msgInput.trim()) return;
    const body = msgInput.trim();
    setMsgInput('');
    await supabase.from('service_messages').insert({ request_id: selectedId, sender: 'driver', body });
    fetchMessages(selectedId);
  };

  const visible = requests.filter((r) => r.type === activeTab);
  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const isDev = process.env.NODE_ENV === 'development';
  const effectiveUser = user ?? (isDev ? { id: 'dev-driver', email: 'dev@local.test' } : null);

  if (!effectiveUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
        <p className="text-white/60 text-sm">Molimo prijavite se u sustav.</p>
        <a href="/auth" className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl">Prijava</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="text-white font-bold text-base">PayParq Driver</p>
          <p className="text-white/40 text-[11px]">{effectiveUser.email}</p>
        </div>
        <button
          onClick={toggleOnline}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            isOnline ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'
          }`}
        >
          {isOnline ? '● Online' : '○ Offline'}
        </button>
      </div>

      {gpsError && (
        <div className="mx-4 mt-2 px-3 py-2 bg-red-900/40 border border-red-500/30 rounded-xl text-red-300 text-[12px]">
          {gpsError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex mx-4 mt-3 gap-2">
        {(['shuttle', 'valet'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
              activeTab === tab ? 'bg-white text-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {tab === 'shuttle' ? '🚌 Shuttle' : '🚗 Valet'}
          </button>
        ))}
      </div>

      {/* ETA input */}
      <div className="mx-4 mt-3 flex items-center gap-3">
        <p className="text-white/40 text-[12px]">ETA pri prihvaćanju:</p>
        <input
          type="number"
          min={1} max={30}
          value={etaInput}
          onChange={(e) => setEtaInput(e.target.value)}
          className="w-16 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-[13px] text-center"
        />
        <p className="text-white/40 text-[12px]">min</p>
      </div>

      {/* Request list */}
      <div className="mx-4 mt-3 space-y-2 flex-1">
        {visible.length === 0 && (
          <p className="text-white/20 text-sm text-center mt-8">Nema aktivnih zahtjeva</p>
        )}
        {visible.map((req) => {
          const isSelected = req.id === selectedId;
          const isPending = req.status === 'pending';
          const isOwnedByMe = req.driver_id === effectiveUser.id;
          const canAdvance = isOwnedByMe && !!STATUS_NEXT[req.status];

          return (
            <div
              key={req.id}
              className={`rounded-2xl border transition-all ${
                isSelected ? 'border-white/30 bg-white/5' : 'border-white/10 bg-[#111]'
              }`}
            >
              <div
                className="px-4 py-3 cursor-pointer"
                onClick={() => setSelectedId(isSelected ? null : req.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-white/40">{req.ticket_no ?? req.id.slice(0, 8)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      req.status === 'arrived' || req.status === 'done' ? 'bg-green-500/20 text-green-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{STATUS_LABEL[req.status]}</span>
                  </div>
                  {req.eta_minutes && <span className="text-[11px] text-white/40">~{req.eta_minutes} min</span>}
                </div>

                {req.guest_name && <p className="text-white text-sm font-semibold mt-1">{req.guest_name}</p>}
                {req.pickup_label && <p className="text-white/50 text-[12px] mt-0.5">{req.pickup_label}</p>}

                {/* Valet: plate prominently */}
                {req.type === 'valet' && req.plate && (
                  <div className="mt-2 inline-flex px-2 py-1 bg-white/10 border border-white/20 rounded-lg">
                    <span className="font-mono font-bold text-white text-sm tracking-widest">{req.plate}</span>
                    {req.parking_zone && <span className="ml-2 text-white/40 text-[12px] self-center">· {req.parking_zone}</span>}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-3 flex gap-2">
                {completingId === req.id && (
                  <div className="flex-1 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-[13px] font-bold text-center">
                    ✓ Završeno
                  </div>
                )}
                {completingId !== req.id && isPending && !req.driver_id && (
                  <button
                    onClick={() => acceptRequest(req)}
                    className="flex-1 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold"
                  >
                    ✓ Prihvati
                  </button>
                )}
                {completingId !== req.id && canAdvance && STATUS_NEXT_LABEL[req.status] && (
                  <button
                    onClick={() => advanceStatus(req)}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold ${
                      req.status === 'arrived'
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 border border-white/20 text-white font-semibold'
                    }`}
                  >
                    {STATUS_NEXT_LABEL[req.status]}
                  </button>
                )}
              </div>

              {/* Inline chat when selected */}
              {isSelected && isOwnedByMe && (
                <div className="border-t border-white/10">
                  <div className="px-3 py-2 space-y-1 max-h-40 overflow-y-auto">
                    {messages.length === 0 && (
                      <p className="text-white/20 text-[12px] text-center py-2">Nema poruka</p>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-1.5 rounded-xl text-[12px] ${
                          m.sender === 'driver' ? 'bg-white text-black' : 'bg-white/10 text-white/80'
                        }`}>
                          {m.body}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                  <div className="px-3 pb-3 flex gap-2">
                    <input
                      type="text"
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Odgovorite gostu..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[12px] placeholder:text-white/20 outline-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!msgInput.trim()}
                      className="px-3 py-2 bg-white text-black rounded-xl text-[12px] font-bold disabled:opacity-40"
                    >→</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-6" />
    </div>
  );
}
