'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ShuttleReservation {
  id: string;
  reserved_time: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  driver_id?: string;
  session_id?: string;
}

interface Driver {
  id: string;
  name?: string;
  plate?: string;
  last_location?: { latitude: number; longitude: number };
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
}

function getCountdown(reservedTime: string): { minutes: number; seconds: number; isNear: boolean; isPast: boolean } {
  const now = new Date();
  const reserved = new Date(reservedTime);
  const diff = reserved.getTime() - now.getTime();

  if (diff < 0) return { minutes: 0, seconds: 0, isNear: false, isPast: true };

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const isNear = minutes <= 15;

  return { minutes, seconds, isNear, isPast: false };
}

export function ShuttleReservationCard({ sessionId, locationId }: { sessionId?: string; locationId?: string }) {
  const [reservation, setReservation] = useState<ShuttleReservation | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [countdown, setCountdown] = useState<{ minutes: number; seconds: number; isNear: boolean; isPast: boolean } | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch reservation
  useEffect(() => {
    if (!supabase || !sessionId) {
      setLoading(false);
      return;
    }

    const fetchReservation = async () => {
      if (!supabase) return;

      const { data } = await supabase
        .from('service_requests')
        .select('id, type, status, driver_id, created_at')
        .eq('session_id', sessionId)
        .eq('type', 'shuttle')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setReservation({
          id: data.id,
          reserved_time: data.created_at,
          status: (data.status as any) || 'pending',
          driver_id: data.driver_id,
          session_id: sessionId,
        });
      }
      setLoading(false);
    };

    fetchReservation();
  }, [sessionId]);

  // Subscribe to driver location in real-time
  useEffect(() => {
    if (!supabase || !reservation?.driver_id) return;

    const sub = supabase
      .channel(`driver_location:${reservation.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${reservation.driver_id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setDriver({
              id: payload.new.id,
              name: payload.new.name,
              plate: payload.new.plate,
              last_location: payload.new.last_location ? { latitude: payload.new.last_location.coordinates?.[1], longitude: payload.new.last_location.coordinates?.[0] } : undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [reservation?.driver_id]);

  // Countdown timer
  useEffect(() => {
    if (!reservation) return;

    const updateCountdown = () => {
      setCountdown(getCountdown(reservation.reserved_time));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  if (loading || !reservation) return null;

  const { minutes, seconds, isNear, isPast } = countdown || { minutes: 0, seconds: 0, isNear: false, isPast: false };
  const dateStr = new Date(reservation.reserved_time).toLocaleDateString('hr-HR', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className={`min-w-[280px] rounded-xl border p-4 space-y-3 ${isNear ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50/30'}`}>
      <div className="flex items-center justify-between">
        <p className={`font-semibold ${isNear ? 'text-red-700' : 'text-green-700'}`}>Shuttle prijevoz</p>
        {isNear && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">🔴 AKTIVNO</span>}
      </div>

      <div className="text-sm">
        <p className="text-black/60">{dateStr}</p>
        <p className="text-lg font-semibold text-black">{formatTime(reservation.reserved_time)}</p>
      </div>

      {!isPast && (
        <div className="text-sm">
          {isNear ? (
            <p className={`font-semibold ${minutes <= 5 ? 'text-red-700' : 'text-orange-600'}`}>
              ⏰ Dolazi za {minutes}:{String(seconds).padStart(2, '0')} min
            </p>
          ) : (
            <p className="text-black/60">⏳ Dolazi za {minutes} min</p>
          )}
        </div>
      )}

      {isNear && driver && (
        <div className="rounded-lg bg-white border border-green-200 p-3 space-y-2">
          <div className="text-xs space-y-1">
            <p className="font-medium text-black">Vozač: {driver.name || 'Vozač'}</p>
            <p className="text-black/60">Vozilo: {driver.plate || 'N/A'}</p>
            {driver.last_location && (
              <p className="text-green-700 font-semibold">📍 ~2 min od lokacije</p>
            )}
          </div>

          {showTracking ? (
            <button
              type="button"
              onClick={() => setShowTracking(false)}
              className="w-full bg-red-500 text-white text-xs py-1.5 rounded font-semibold hover:bg-red-600"
            >
              Sakrij praćenje
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowTracking(true)}
              className="w-full bg-green-600 text-white text-xs py-1.5 rounded font-semibold hover:bg-green-700"
            >
              🚗 Prati vozilo
            </button>
          )}
        </div>
      )}

      {showTracking && driver?.last_location && (
        <div className="rounded-lg overflow-hidden border border-green-300 h-32 bg-gray-100 flex items-center justify-center">
          <a
            href={`https://maps.google.com/?q=${driver.last_location.latitude},${driver.last_location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            📍 Otvori u Mapama
          </a>
        </div>
      )}

      <p className="text-[11px] text-black/40">{reservation.status}</p>
    </div>
  );
}
