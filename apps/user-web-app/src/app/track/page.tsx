'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const TrackMap = dynamic(() => import('./TrackMap'), { ssr: false });

type RequestStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'done' | 'cancelled';

type ServiceRequest = {
  id: string;
  type: 'shuttle' | 'valet';
  status: RequestStatus;
  eta_minutes: number | null;
  driver_id: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_label: string | null;
  plate: string | null;
  parking_zone: string | null;
  ticket_no: string | null;
};

type Driver = {
  id: string;
  name: string | null;
  plate: string | null;
  rating: number | null;
  avatar_initials: string | null;
  vehicle_model: string | null;
  last_location: string | null;
};

type Message = {
  id: string;
  sender: 'guest' | 'driver';
  body: string;
  created_at: string;
};

function parseDriverLocation(loc: string | null): [number, number] | null {
  if (!loc) return null;
  // PostGIS POINT(lng lat)
  const m = loc.match(/POINT\(([^\s)]+)\s+([^\s)]+)\)/i);
  if (m) return [parseFloat(m[2]), parseFloat(m[1])]; // [lat, lng]
  return null;
}

function statusLabel(status: RequestStatus, type: 'shuttle' | 'valet'): string {
  const map: Record<RequestStatus, Record<'shuttle' | 'valet', string>> = {
    pending:   { shuttle: 'Tražimo vozača...', valet: 'Tražimo attendanta...' },
    accepted:  { shuttle: 'Vozač prihvatio ✓', valet: 'Attendant prihvatio ✓' },
    en_route:  { shuttle: 'Vozač je na putu', valet: 'Dohvaćaju vaš auto' },
    arrived:   { shuttle: 'Vozač je stigao! 🚌', valet: 'Auto je spreman! 🚗' },
    done:      { shuttle: 'Vožnja završena', valet: 'Predaja završena' },
    cancelled: { shuttle: 'Otkazano', valet: 'Otkazano' },
  };
  return map[status]?.[type] ?? status;
}

function statusColor(status: RequestStatus): string {
  if (status === 'arrived' || status === 'done') return '#0F6E56';
  if (status === 'cancelled') return '#dc2626';
  if (status === 'pending') return '#6b7280';
  return '#5F3DFC';
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-white text-sm">Učitavanje...</div>}>
      <TrackInner />
    </Suspense>
  );
}

function TrackInner() {
  const params = useSearchParams();
  const requestId = params.get('id');
  const type = (params.get('type') ?? 'shuttle') as 'shuttle' | 'valet';

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestPos, setGuestPos] = useState<[number, number] | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<number | null>(null);

  const isShuttle = type === 'shuttle';
  const accent = isShuttle ? '#0F6E56' : '#5F3DFC';
  const accentLight = isShuttle ? '#E1F5EE' : '#EDE9FF';

  const fetchState = useCallback(async () => {
    if (!requestId) return;
    const [reqRes, msgRes] = await Promise.all([
      fetch(`/api/service-requests?id=${requestId}`),
      fetch(`/api/service-requests/messages?request_id=${requestId}`),
    ]);
    if (reqRes.ok) {
      const { request: r, driver: d } = await reqRes.json();
      setRequest(r);
      setDriver(d ?? null);
    } else {
      setError('Zahtjev nije pronađen.');
    }
    if (msgRes.ok) {
      const { messages: m } = await msgRes.json();
      setMessages(m ?? []);
    }
  }, [requestId]);

  useEffect(() => {
    if (!requestId) { setError('Nema ID zahtjeva.'); return; }
    fetchState();
    pollRef.current = setInterval(fetchState, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [requestId, fetchState]);

  // Guest GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => setGuestPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => { if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current); };
  }, []);

  // Stop polling when done/cancelled/arrived
  useEffect(() => {
    if (request?.status === 'done' || request?.status === 'cancelled') {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [request?.status]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!msgInput.trim() || !requestId || sending) return;
    setSending(true);
    const body = msgInput.trim();
    setMsgInput('');
    await fetch('/api/service-requests/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, sender: 'guest', body }),
    });
    await fetchState();
    setSending(false);
  };

  const driverPos = parseDriverLocation(driver?.last_location ?? null);
  const pickupPos: [number, number] | null =
    request?.pickup_lat && request?.pickup_lng
      ? [request.pickup_lat, request.pickup_lng]
      : guestPos ?? null;

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center flex-col gap-3 text-white">
        <p className="text-sm text-white/60">{error}</p>
        <a href="/" className="text-xs underline text-white/40">Povratak</a>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: accent }}>
          {isShuttle ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="1" y="8" width="22" height="10" rx="2"/><path d="M5 18v2M19 18v2"/><path d="M1 12h22"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="17" r="3"/><circle cx="7" cy="17" r="3"/>
            </svg>
          )}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">
            {isShuttle ? 'Shuttle praćenje' : 'Valet praćenje'}
          </p>
          <p className="text-white/40 text-[11px] font-mono">{request.ticket_no ?? requestId?.slice(0, 8)}</p>
        </div>
      </div>

      {/* Status bar */}
      <div className="mx-4 mb-3 px-4 py-2.5 rounded-xl flex items-center justify-between" style={{ background: accentLight }}>
        <span className="text-sm font-semibold" style={{ color: statusColor(request.status) }}>
          {statusLabel(request.status, type)}
        </span>
        {request.eta_minutes != null && request.status !== 'done' && request.status !== 'arrived' && (
          <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ background: accent }}>
            ~{request.eta_minutes} min
          </span>
        )}
      </div>

      {/* Map */}
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ height: 240 }}>
        <TrackMap
          driverPos={driverPos}
          pickupPos={pickupPos}
          guestPos={guestPos}
        />
      </div>

      {/* Valet car info */}
      {!isShuttle && (request.plate || request.parking_zone) && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10">
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Vaš automobil</p>
          <div className="flex items-center gap-4">
            {request.plate && (
              <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                <p className="text-white font-mono font-bold text-base tracking-widest">{request.plate}</p>
              </div>
            )}
            {request.parking_zone && (
              <div>
                <p className="text-white/40 text-[11px]">Zona</p>
                <p className="text-white text-sm font-semibold">{request.parking_zone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Driver card */}
      {driver && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: accent }}>
            {driver.avatar_initials ?? (driver.name ?? 'D').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{driver.name ?? 'Vozač'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {driver.rating && (
                <span className="text-[11px] text-yellow-400">★ {driver.rating.toFixed(1)}</span>
              )}
              {driver.vehicle_model && (
                <span className="text-[11px] text-white/40">{driver.vehicle_model}</span>
              )}
            </div>
          </div>
          {driver.plate && (
            <div className="px-2 py-1 rounded-md bg-white/10 border border-white/20 shrink-0">
              <p className="text-white font-mono text-[11px] font-bold">{driver.plate}</p>
            </div>
          )}
        </div>
      )}

      {/* Pickup label */}
      {request.pickup_label && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <p className="text-white/60 text-[12px]">{request.pickup_label}</p>
        </div>
      )}

      {/* Chat */}
      <div className="mx-4 mt-3 flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#111]" style={{ minHeight: 180, maxHeight: 260 }}>
        <div className="px-3 py-2 border-b border-white/10">
          <p className="text-white/40 text-[11px] uppercase tracking-widest">Poruke</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {messages.length === 0 && (
            <p className="text-white/20 text-[12px] text-center mt-4">
              {isShuttle ? 'Pošaljite poruku vozaču...' : 'Pošaljite poruku attendantu...'}
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-[13px] ${
                m.sender === 'guest'
                  ? 'text-white rounded-br-sm'
                  : 'bg-[#222] text-white/80 rounded-bl-sm'
              }`} style={m.sender === 'guest' ? { background: accent } : {}}>
                {m.body}
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        <div className="px-3 py-2 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Poruka..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[13px] placeholder:text-white/20 outline-none focus:border-white/30"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !msgInput.trim()}
            className="px-3 py-2 rounded-xl text-white text-[13px] font-semibold disabled:opacity-40"
            style={{ background: accent }}
          >
            →
          </button>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
