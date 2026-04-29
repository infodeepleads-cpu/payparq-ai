'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const TrackMap = dynamic(() => import('./TrackMap'), { ssr: false });

type RequestStatus = 'scheduled' | 'pending' | 'accepted' | 'en_route' | 'arrived' | 'done' | 'cancelled';

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
  const m = loc.match(/POINT\(([^\s)]+)\s+([^\s)]+)\)/i);
  if (m) return [parseFloat(m[2]), parseFloat(m[1])];
  return null;
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" /></div>}>
      <TrackInner />
    </Suspense>
  );
}

function TrackInner() {
  const params = useSearchParams();
  const requestId = params.get('id');
  const type = (params.get('type') ?? 'shuttle') as 'shuttle' | 'valet';
  const isShuttle = type === 'shuttle';

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestPos, setGuestPos] = useState<[number, number] | null>(null);
  const [rated, setRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [pendingTimeout, setPendingTimeout] = useState(false);

  const SUPPORT_WA = '385915963139';

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (request?.status === 'done' || request?.status === 'cancelled') {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    // Start 90s timeout when pending, clear if driver accepts
    if (request?.status === 'pending') {
      if (!pendingTimerRef.current) {
        pendingTimerRef.current = setTimeout(() => setPendingTimeout(true), 90000);
      }
    } else {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      setPendingTimeout(false);
    }
  }, [request?.status]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => setGuestPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => { if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current); };
  }, []);

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

  const submitRating = async () => {
    if (!rating || !requestId) return;
    setSubmittingRating(true);
    await fetch('/api/service-requests/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, rating, tip }),
    });
    setRated(true);
    setSubmittingRating(false);
    setTimeout(() => { window.location.href = '/'; }, 2500);
  };

  const driverPos = parseDriverLocation(driver?.last_location ?? null);
  const pickupPos: [number, number] | null =
    request?.pickup_lat && request?.pickup_lng
      ? [request.pickup_lat, request.pickup_lng]
      : guestPos ?? null;

  const avatarLabel = driver?.avatar_initials ?? (driver?.name ?? 'V').slice(0, 2).toUpperCase();

  const statusLabel = () => {
    if (!request) return '';
    const map: Record<RequestStatus, string> = {
      scheduled: 'VOŽNJA REZERVIRANA',
      pending:   isShuttle ? 'TRAŽIMO VOZAČA' : 'TRAŽIMO VALETA',
      accepted:  isShuttle ? 'VOZAČ DOLAZI' : 'VALET DOLAZI',
      en_route:  isShuttle ? 'VOZAČ DOLAZI' : 'VALET DOLAZI',
      arrived:   isShuttle ? 'VOZAČ JE STIGAO' : 'AUTO JE SPREMAN',
      done:      'ZAVRŠENO',
      cancelled: 'OTKAZANO',
    };
    return map[request.status];
  };

  const etaLabel = () => {
    if (!request) return '';
    if (request.status === 'scheduled') return 'Vozač će biti dodijeljen ubrzo';
    if (request.status === 'pending') return 'Tražimo...';
    if (request.status === 'arrived') return isShuttle ? 'Vozilo vas čeka' : 'Vaš auto čeka';
    if (request.eta_minutes) return `Stiže za ~${request.eta_minutes} min`;
    return isShuttle ? 'Na putu je' : 'Dohvaća vaš auto';
  };

  if (error) {
    return (
      <div className="h-[100dvh] bg-white flex items-center justify-center flex-col gap-3">
        <p className="text-sm text-black/40">{error}</p>
        <a href="/" className="text-xs underline text-black/30">Povratak</a>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── RATING SCREEN ────────────────────────────────────────────────────────────
  if (request.status === 'done') {
    if (rated) {
      return (
        <div className="h-[100dvh] bg-[#7C3AED] flex flex-col items-center justify-center text-white text-center px-8">
          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[28px] font-black tracking-tight mb-2">Hvala na ocjeni!</h2>
          <p className="text-white/70 text-[15px] font-bold">Preusmjeravamo vas...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[100dvh] bg-[#F9FAFB] animate-in fade-in duration-500">
        {/* Purple header */}
        <div className="bg-[#7C3AED] relative flex flex-col items-center justify-center text-white px-8 pt-16 pb-16">
          <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
            <svg className="absolute -right-20 -top-20 w-80 h-80 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.97 4.44c-.31.17-.69.17-1 0l-7.97-4.44c-.32-.17-.53-.5-.53-.88v-9c0-.38.21-.71.53-.88l7.97-4.44c.31-.17.69-.17 1 0l7.97 4.44c.32.17.53.5.53.88v9z"/></svg>
            <svg className="absolute -left-20 -bottom-20 w-80 h-80 -rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.97 4.44c-.31.17-.69.17-1 0l-7.97-4.44c-.32-.17-.53-.5-.53-.88v-9c0-.38.21-.71.53-.88l7.97-4.44c.31-.17.69-.17 1 0l7.97 4.44c.32.17.53.5.53.88v9z"/></svg>
          </div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-5 shadow-2xl">
              <svg className="w-10 h-10 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-[28px] font-black tracking-tight mb-1">
              {isShuttle ? 'Hvala na vožnji!' : 'Predaja završena!'}
            </h2>
            <p className="text-white/80 text-[14px] font-bold">
              {isShuttle ? 'Uspješno ste stigli na odredište.' : 'Vaš auto je uspješno predan.'}
            </p>
          </div>
        </div>

        {/* Receipt card */}
        <div className="px-5 -mt-10 relative z-20 flex-1 overflow-y-auto pb-8">
          <div className="bg-white rounded-[2.5rem] p-7 shadow-[0_30px_60px_rgba(0,0,0,0.12)] flex flex-col items-center border border-black/5">

            {/* Driver avatar */}
            {driver && (
              <div className="relative mb-5">
                <div className="w-20 h-20 bg-[#F3E8FF] rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl">
                  <span className="text-[#7C3AED] text-2xl font-black">{avatarLabel}</span>
                </div>
                {driver.rating && (
                  <div className="absolute -bottom-2 -right-2 bg-[#7C3AED] text-white text-[12px] font-black px-2.5 py-1 rounded-2xl border-4 border-white shadow-lg">
                    {Number(driver.rating).toFixed(1)} ★
                  </div>
                )}
              </div>
            )}
            {driver?.name && (
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[20px] font-black text-black tracking-tight">{driver.name}</h3>
                <div className="w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </div>
              </div>
            )}
            {(driver?.vehicle_model || driver?.plate) && (
              <p className="text-black/40 text-[13px] font-bold tracking-tight mb-6">
                {[driver.vehicle_model, driver.plate].filter(Boolean).join(' • ')}
              </p>
            )}

            {/* Stars */}
            <span className="text-[11px] font-black text-black/30 uppercase tracking-widest mb-4">Ocijenite vozača</span>
            <div className="flex space-x-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`w-12 h-12 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                    rating >= star
                      ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30 scale-110'
                      : 'bg-[#F9FAFB] text-black/10 hover:text-[#7C3AED] hover:bg-[#F3E8FF]'
                  }`}
                >
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </button>
              ))}
            </div>

            {/* Tip */}
            <span className="text-[11px] font-black text-black/30 uppercase tracking-widest mb-3">Napojnica</span>
            <div className="flex items-center justify-center space-x-2 mb-2">
              {[0, 1, 2, 5].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTip(amt)}
                  className={`px-4 py-2.5 rounded-2xl text-[12px] font-black transition-all ${
                    tip === amt ? 'bg-black text-white shadow-xl' : 'bg-[#F9FAFB] text-black/40 border-2 border-transparent hover:border-black/5'
                  }`}
                >
                  {amt === 0 ? 'Bez' : `+€${amt}`}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submitRating}
            disabled={!rating || submittingRating}
            className="w-full mt-4 bg-[#7C3AED] text-white py-5 rounded-[2rem] font-black text-[15px] uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {submittingRating ? 'Šaljemo...' : 'Ocijeni vozača'}
          </button>

          <button
            onClick={() => { window.location.href = '/'; }}
            className="w-full mt-3 bg-white border border-black/10 text-black/50 py-4 rounded-[2rem] font-black text-[13px] uppercase tracking-widest"
          >
            Preskoči
          </button>
        </div>
      </div>
    );
  }

  // ── TRACKING SCREEN ──────────────────────────────────────────────────────────
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-white">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <TrackMap driverPos={driverPos} pickupPos={pickupPos} guestPos={guestPos} />
      </div>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] px-6 pt-5 pb-8">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-5" />

        {/* Status row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="text-[10px] font-black text-[#7C3AED] uppercase tracking-[0.3em] block mb-1">
              {statusLabel()}
            </span>
            <h2 className="text-[22px] font-black text-black tracking-tight leading-none">
              {etaLabel()}
            </h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-black/5 p-2.5 shrink-0">
            {isShuttle ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" className="w-full h-full">
                <rect x="1" y="8" width="22" height="10" rx="2"/><path d="M5 18v2M19 18v2"/><path d="M1 12h22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" className="w-full h-full">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="17" r="3"/><circle cx="7" cy="17" r="3"/>
              </svg>
            )}
          </div>
        </div>

        {/* Driver card */}
        {driver && (
          <div className="bg-white rounded-[2rem] px-5 py-4 flex items-center gap-4 mb-4 shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-black/5">
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-[#F3E8FF] rounded-[1.25rem] flex items-center justify-center border-2 border-white shadow-md">
                <span className="text-[#7C3AED] text-lg font-black">{avatarLabel}</span>
              </div>
              {driver.rating && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-[#7C3AED] text-white text-[10px] font-black px-1.5 py-0.5 rounded-xl border-2 border-white shadow">
                  {Number(driver.rating).toFixed(1)} ★
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-black font-black text-[15px] truncate">{driver.name ?? 'Vozač'}</p>
                <div className="w-4 h-4 bg-[#7C3AED] rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </div>
              </div>
              <p className="text-black/40 text-[12px] font-bold truncate">
                {[driver.vehicle_model, driver.plate].filter(Boolean).join(' • ') || 'Parq vozač'}
              </p>
            </div>
          </div>
        )}

        {/* Chat toggle */}
        <button
          onClick={() => setShowChat((v) => !v)}
          className="w-full flex items-center justify-between bg-[#F9FAFB] border border-black/5 rounded-2xl px-4 py-3 mb-2 text-black/40 text-[13px] font-bold"
        >
          <span>{messages.length > 0 ? `${messages.length} poruka` : 'Pošalji poruku vozaču...'}</span>
          <svg className={`w-4 h-4 transition-transform ${showChat ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>

        {showChat && (
          <div className="rounded-2xl border border-black/5 overflow-hidden mb-2">
            <div className="max-h-36 overflow-y-auto px-3 py-2 space-y-2 bg-[#F9FAFB]">
              {messages.length === 0 && (
                <p className="text-black/20 text-[12px] text-center py-2">Nema poruka</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-[13px] font-bold ${
                    m.sender === 'guest' ? 'bg-[#7C3AED] text-white' : 'bg-white text-black border border-black/5'
                  }`}>{m.body}</div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <div className="flex gap-2 px-3 py-2 bg-white border-t border-black/5">
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Poruka..."
                className="flex-1 bg-[#F9FAFB] border border-black/5 rounded-xl px-3 py-2 text-[13px] font-bold text-black placeholder:text-black/20 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !msgInput.trim()}
                className="px-3 py-2 rounded-xl bg-[#7C3AED] text-white text-[13px] font-bold disabled:opacity-40"
              >→</button>
            </div>
          </div>
        )}

        {/* 90s timeout fallback */}
        {pendingTimeout && (
          <div className="mt-3 rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-orange-700 text-[12px] font-bold leading-tight">Nema dostupnog vozača.<br/>Kontaktirajte podršku.</p>
            <a
              href={`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(`Pozivam ${isShuttle ? 'shuttle vozača' : 'valet attendanta'} — zahtjev ${request.ticket_no ?? requestId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-3 py-2 rounded-xl bg-green-500 text-white text-[12px] font-black whitespace-nowrap"
            >
              WhatsApp
            </a>
          </div>
        )}

        {/* Ticket / plate info */}
        {request.ticket_no && (
          <p className="text-center text-[11px] text-black/20 font-mono mt-2">{request.ticket_no}</p>
        )}
      </div>
    </div>
  );
}
