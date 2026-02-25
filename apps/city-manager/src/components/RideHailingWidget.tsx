"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";
import * as h3 from "h3-js";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Placeholder token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q";

export default function RideHailingWidget() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [h3Index, setH3Index] = useState<string | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<Record<string, any>>({});
  const [channel, setChannel] = useState<any>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // 0. Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [15.9819, 45.8150],
      zoom: 13,
    });

    // Add manual location selection on click
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setLocation({ lat, lng });
      const index = h3.latLngToCell(lat, lng, 7);
      setH3Index(index);
      setGeoError("Manual location set.");
      
      // Update marker
      if (map.current) {
        if (!driverMarkers.current["self"]) {
          const el = document.createElement("div");
          el.className = "w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg";
          driverMarkers.current["self"] = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current);
        } else {
          driverMarkers.current["self"].setLngLat([lng, lat]);
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

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

        // Update map markers
        if (map.current) {
          if (!driverMarkers.current[driverId]) {
            const el = document.createElement("div");
            el.className = "w-8 h-8 bg-black rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all transform hover:scale-110";
            el.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21h8M6 3h12l-1 7H7L6 3z"></path></svg>`;
            
            driverMarkers.current[driverId] = new mapboxgl.Marker(el)
              .setLngLat([lng, lat])
              .addTo(map.current);
          } else {
            driverMarkers.current[driverId].setLngLat([lng, lat]);
          }
        }
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, []);

  // Cleanup markers when drivers go offline
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.keys(driverMarkers.current).forEach(id => {
        if (!nearbyDrivers[id] || now - nearbyDrivers[id].lastUpdate > 30000) {
          driverMarkers.current[id].remove();
          delete driverMarkers.current[id];
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [nearbyDrivers]);

  const getFareEstimate = async () => {
    if (!h3Index || !location) return;
    
    setIsLoadingEstimate(true);
    try {
      const response = await fetch('/api/rides/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: location,
          destination: { lat: 45.815, lng: 15.981 }, // Mock destination (Zagreb Center)
          h3Index: h3Index,
          isPayParqLot: true // Testing the discount logic
        })
      });
      const data = await response.json();
      setEstimate(data);
    } catch (err) {
      console.error("Fare estimate failed:", err);
    } finally {
      setIsLoadingEstimate(false);
    }
  };

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

    // Fallback location for development (Zagreb Center)
    const setFallbackLocation = () => {
      const fallbackLat = 45.8150;
      const fallbackLng = 15.9819;
      setLocation({ lat: fallbackLat, lng: fallbackLng });
      const index = h3.latLngToCell(fallbackLat, fallbackLng, 7);
      setH3Index(index);
      
      if (map.current) {
        map.current.flyTo({ center: [fallbackLng, fallbackLat], zoom: 14 });
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        const index = h3.latLngToCell(latitude, longitude, 7);
        setH3Index(index);
        setGeoError(null);

        // Update Map
        if (map.current) {
          map.current.flyTo({ center: [longitude, latitude], zoom: 14 });
          
          // Add/Update user marker
          if (!driverMarkers.current["self"]) {
            const el = document.createElement("div");
            el.className = "w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg";
            driverMarkers.current["self"] = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          } else {
            driverMarkers.current["self"].setLngLat([longitude, latitude]);
          }
        }

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
      (err) => {
        console.error("Geolocation error:", err.code, err.message);
        let msg = "Location error. Using fallback (Zagreb).";
        if (err.code === 1) msg = "Permission denied. Using fallback.";
        if (err.code === 2) msg = "Location unavailable. Using fallback.";
        if (err.code === 3) msg = "Location timeout. Using fallback.";
        setGeoError(msg);
        
        // Use fallback if real GPS fails
        setFallbackLocation();
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
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
        {/* Map Visualization */}
        <div className="h-48 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative">
          <div ref={mapContainer} className="absolute inset-0" />
        </div>

        {/* Error Alert */}
        {geoError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-2 text-red-600 animate-in fade-in zoom-in duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium">{geoError}</span>
          </div>
        )}

        {/* Mock UI for now */}
        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current H3 Cell</p>
          <p className="text-sm font-mono text-black">{h3Index || 'Detecting...'}</p>
        </div>

        {/* Fare Estimate Section */}
        {estimate ? (
          <div className="p-4 border-2 border-black rounded-xl bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Estimated Fare</p>
                <h3 className="text-2xl font-black text-black">{estimate.price} {estimate.currency}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Distance</p>
                <p className="text-xs font-bold text-black">{estimate.distance_km} km</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 py-2 border-t border-gray-100 mt-2">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400">Includes -10% PayParq Discount</p>
              </div>
              <div className="flex items-center text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                PRICE MATCHED
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={getFareEstimate}
            disabled={!h3Index || isLoadingEstimate}
            className="w-full p-4 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-black hover:text-black transition-all group"
          >
            {isLoadingEstimate ? (
              <span className="flex items-center justify-center text-sm font-medium">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating Price...
              </span>
            ) : (
              <span className="text-sm font-medium">Get Upfront Price Estimate</span>
            )}
          </button>
        )}

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
