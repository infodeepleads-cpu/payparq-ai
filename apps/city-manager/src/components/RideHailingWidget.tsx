"use client";

import { useState, useEffect } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";
import * as h3 from "h3-js";

export default function RideHailingWidget() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [h3Index, setH3Index] = useState<string | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<Record<string, any>>({});
  const [channel, setChannel] = useState<any>(null);

  // 1. Initialize Realtime Channel
  useEffect(() => {
    const supabase = getSupabase();
    const newChannel = supabase.channel('ride-hailing-v1', {
      config: {
        broadcast: { self: false },
      },
    });

    newChannel
      .on('broadcast', { event: 'driver-location' }, (payload) => {
        const { driverId, lat, lng, h3Index: driverH3 } = payload.payload;
        
        // Update nearby drivers state
        setNearbyDrivers(prev => ({
          ...prev,
          [driverId]: { lat, lng, h3Index: driverH3, lastUpdate: Date.now() }
        }));
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, []);

  // 2. Track location and H3 index
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        const index = h3.latLngToCell(latitude, longitude, 7);
        setH3Index(index);

        // Broadcast location if online
        if (isOnline && channel) {
          getCurrentUser().then(user => {
            if (user) {
              channel.send({
                type: 'broadcast',
                event: 'driver-location',
                payload: { driverId: user.id, lat: latitude, lng: longitude, h3Index: index }
              });
              updateDriverLocation(latitude, longitude, index);
            }
          });
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, channel]);

  // Cleanup stale drivers (not updated in 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNearbyDrivers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(id => {
          if (now - next[id].lastUpdate > 30000) {
            delete next[id];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateDriverLocation = async (lat: number, lng: number, index: string) => {
    const user = await getCurrentUser();
    if (!user) return;

    const supabase = getSupabase();
    await supabase.from("drivers").upsert({
      id: user.id,
      last_location: `POINT(${lng} ${lat})`,
      last_h3_index: index,
      is_online: true,
      updated_at: new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-full bg-white p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-black">Ride Hailing</h2>
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isOnline ? 'ONLINE' : 'GO ONLINE'}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Mock UI for now */}
        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current H3 Cell</p>
          <p className="text-sm font-mono text-black">{h3Index || 'Detecting...'}</p>
        </div>

        <div className="p-4 border border-gray-100 rounded-xl">
          <h3 className="text-sm font-medium mb-3">Nearby Drivers</h3>
          <div className="space-y-3">
            {Object.keys(nearbyDrivers).length > 0 ? (
              Object.entries(nearbyDrivers).map(([id, driver]) => (
                <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M6 3h12l-1 7H7L6 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-black">Driver {id.slice(0, 5)}</p>
                      <p className="text-[10px] text-gray-500">{driver.h3Index}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-green-600 font-bold">LIVE</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Looking for drivers in your area...</p>
            )}
          </div>
        </div>

        <button className="w-full py-3 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-900 transition-colors">
          Request a Ride
        </button>
      </div>
    </div>
  );
}
