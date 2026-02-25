"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";
import * as h3 from "h3-js";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Placeholder token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q";

export default function RideHailingWidget() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [h3Index, setH3Index] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<Record<string, any>>({});
  const [channel, setChannel] = useState<any>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<{ distance: number; duration: number } | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const routeLayerId = "route-line";

  // 0. Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Use a small delay to ensure container is rendered and has dimensions
    const timer = setTimeout(() => {
      if (map.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [15.9819, 45.8150],
        zoom: 13,
      });

      map.current.on('load', () => {
        map.current?.resize();
      });

      // Add manual location selection on click
      map.current.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        
        setLocation(prevLocation => {
          if (!prevLocation) {
            // Set Pickup
            const index = h3.latLngToCell(lat, lng, 7);
            setH3Index(index);
            setGeoError("Pickup set manually.");
            
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
            return { lat, lng };
          } else {
            // Set Destination
            setDestination({ lat, lng });
            setGeoError("Destination set.");
            fetchRoute([prevLocation.lng, prevLocation.lat], [lng, lat]);
            return prevLocation;
          }
        });
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
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

  // 1.5 Auto-trigger Fare Estimate when routeData changes
  useEffect(() => {
    if (routeData && location && destination) {
      getFareEstimate();
    }
  }, [routeData]);

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

  // Fetch Route from Mapbox
  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );
      const json = await query.json();
      const data = json.routes[0];
      const route = data.geometry.coordinates;
      
      setRouteData({
        distance: data.distance, // meters
        duration: data.duration, // seconds
      });

      if (map.current) {
        // Update or add route line
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route
            }
          });
        } else {
          map.current.addLayer({
            id: routeLayerId,
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: route
                }
              }
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }

        // Add destination marker
        if (driverMarkers.current["destination"]) {
          driverMarkers.current["destination"].setLngLat(end);
        } else {
          const el = document.createElement("div");
          el.className = "w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg";
          driverMarkers.current["destination"] = new mapboxgl.Marker(el)
            .setLngLat(end)
            .addTo(map.current);
        }

        // Fit map to show both
        const bounds = new mapboxgl.LngLatBounds()
          .extend(start)
          .extend(end);
        map.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (err) {
      console.error("Error fetching route:", err);
    }
  };

  const getFareEstimate = async () => {
    if (!location || !destination || !routeData) return;
    
    setIsLoadingEstimate(true);
    try {
      const res = await fetch("/api/rides/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dist_meters: routeData.distance,
          time_seconds: routeData.duration,
          h3_zone_id: h3Index,
          is_payparq_lot: false // Could be dynamic later
        }),
      });
      const data = await res.json();
      setEstimate(data.fare);
    } catch (err) {
      console.error("Estimate error:", err);
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

  const resetRoute = () => {
    setLocation(null);
    setDestination(null);
    setRouteData(null);
    setEstimate(null);
    setGeoError("Select pickup on map.");
    
    if (map.current) {
      if (driverMarkers.current["self"]) {
        driverMarkers.current["self"].remove();
        delete driverMarkers.current["self"];
      }
      if (driverMarkers.current["destination"]) {
        driverMarkers.current["destination"].remove();
        delete driverMarkers.current["destination"];
      }
      if (map.current.getLayer(routeLayerId)) {
        map.current.removeLayer(routeLayerId);
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-black">Ride Hailing</h2>
        <div className="flex items-center space-x-2">
          {(location || destination) && (
            <button 
              onClick={resetRoute}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors uppercase tracking-wider"
            >
              Reset
            </button>
          )}
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isOnline ? 'ONLINE' : 'GO ONLINE'}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Map Visualization */}
        <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative bg-gray-50">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
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
        <div className="space-y-3">
          <div className="relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Pickup</label>
            <input
              type="text"
              placeholder={location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Click on map to set pickup..."}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
              readOnly
            />
            <div className="absolute right-4 top-9 w-2 h-2 rounded-full bg-blue-500" />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Destination</label>
            <input
              type="text"
              placeholder={destination ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : "Click on map to set destination..."}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
              readOnly
            />
            <div className="absolute right-4 top-9 w-2 h-2 rounded-full bg-red-500" />
          </div>
        </div>

        {routeData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Distance</p>
              <p className="text-sm font-bold text-black">{(routeData.distance / 1000).toFixed(1)} km</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Duration</p>
              <p className="text-sm font-bold text-black">{Math.round(routeData.duration / 60)} min</p>
            </div>
          </div>
        )}

        {(isLoadingEstimate || estimate) && (
          <div className={`p-4 border-2 ${isLoadingEstimate ? 'border-gray-200 bg-gray-50' : 'border-black bg-white'} rounded-xl shadow-sm transition-all duration-300`}>
            {isLoadingEstimate ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <svg className="animate-spin h-6 w-6 text-black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Calculating Price...</p>
              </div>
            ) : estimate ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Estimated Fare</p>
                    <h3 className="text-2xl font-black text-black">€{Number(estimate).toFixed(2)}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Price Match</p>
                    <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Uber 2026 Adjusted</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 py-2 border-t border-gray-100 mt-2">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400">Includes -10% PayParq Discount</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
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
