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
  const [selectedClass, setSelectedClass] = useState<string>('economy');
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
    setGeoError(null);
    console.log("Fetching estimate for:", { routeData, h3Index });

    try {
      const res = await fetch("/api/rides/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dist_meters: routeData.distance,
          time_seconds: routeData.duration,
          h3_zone_id: h3Index || h3.latLngToCell(location.lat, location.lng, 7),
          is_payparq_lot: false
        }),
      });

      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error data:", errorData);
        throw new Error(errorData.error || "Failed to fetch estimate");
      }

      const data = await res.json();
      console.log("Estimate API Full Response:", data);
      
      if (data.estimates && data.estimates.length > 0) {
        console.log("Setting estimates:", data.estimates);
        setEstimate(data.estimates);
        setGeoError(null);
      } else {
        throw new Error("Invalid fare data received");
      }
    } catch (err: any) {
      console.error("Estimate error details:", err);
      setGeoError(`Price Calculation Error: ${err.message}`);
      setEstimate(null);
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

        {/* Vehicle Class Selection */}
        {(isLoadingEstimate || (estimate && estimate.length > 0)) && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Rides</h3>
            <div className="space-y-2">
              {isLoadingEstimate ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />
                ))
              ) : (
                estimate.map((vClass: any) => (
                  <button
                    key={vClass.id}
                    onClick={() => setSelectedClass(vClass.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedClass === vClass.id 
                        ? 'border-black bg-white shadow-lg scale-[1.02]' 
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {/* Car Icon Placeholder */}
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-black">{vClass.name}</p>
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex items-center">
                            <svg className="w-2.5 h-2.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 7H7v6h6V7z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {vClass.arrival_estimate} min
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">{vClass.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-black">€{vClass.fare.toFixed(2)}</p>
                      {vClass.id === 'economy' && (
                        <p className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">-10% PayParq</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <button 
          disabled={!destination || isLoadingEstimate}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl ${
            !destination || isLoadingEstimate 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-900 active:scale-[0.98]'
          }`}
        >
          {isLoadingEstimate ? 'Calculating...' : `Request ${estimate?.find((e: any) => e.id === selectedClass)?.name || 'Ride'}`}
        </button>
      </div>
    </div>
  );
}
