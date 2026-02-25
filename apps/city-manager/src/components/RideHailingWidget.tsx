"use client";

import { useState, useEffect, useRef } from "react";
import * as h3 from "h3-js";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Placeholder token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q";

import { getSupabase } from "../lib/supabase";

type FlowStep = 'search' | 'destination' | 'payment' | 'tracking';

type RideClass = 'parq_go' | 'parq_taxi' | 'smart_arrival' | 'van' | 'comfort';

const RIDE_CLASSES: Record<RideClass, { label: string; description: string; basePrice: number; multiplier: number; icon: string }> = {
  parq_go: { 
    label: 'Parq Go', 
    description: 'Like UberX, quick and affordable', 
    basePrice: 1.2, 
    multiplier: 1.0,
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`
  },
  parq_taxi: { 
    label: 'Parq & Taxi', 
    description: 'Free parking spot + 2 rides included', 
    basePrice: 1.5, 
    multiplier: 1.2,
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.39 2.1-1.39 1.47 0 2.01.73 2.09 1.63h1.6c-.11-1.62-1.15-2.73-2.71-3.08V5h-2v1.59c-1.38.31-2.5 1.21-2.5 2.72 0 1.83 1.52 2.75 3.71 3.28 2.01.48 2.4 1.12 2.4 1.87 0 1-.88 1.6-2.16 1.6-1.51 0-2.11-.61-2.25-1.69h-1.61c.14 1.83 1.39 2.81 2.92 3.16V19h2v-1.58c1.39-.28 2.5-1.11 2.5-2.73 0-1.92-1.38-2.75-3.82-3.55z"/></svg>`
  },
  smart_arrival: { 
    label: 'Smart Arrival', 
    description: 'Guaranteed return ride for your trip', 
    basePrice: 2.5, 
    multiplier: 1.6,
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>`
  },
  van: { 
    label: 'Van', 
    description: 'Spacious for groups up to 6', 
    basePrice: 3.0, 
    multiplier: 1.8,
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>`
  },
  comfort: { 
    label: 'Comfort', 
    description: 'Premium cars with top-rated drivers', 
    basePrice: 2.5, 
    multiplier: 1.5,
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>`
  },
};

interface LocationHistory {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'history' | 'suggestion';
}

const MOCK_HISTORY: LocationHistory[] = [
  { id: '1', name: 'Home', address: 'Savska cesta 1, Zagreb', lat: 45.8050, lng: 15.9650, type: 'history' },
  { id: '2', name: 'Work', address: 'Radnička cesta 50, Zagreb', lat: 45.8040, lng: 15.9990, type: 'history' },
  { id: '3', name: 'Zagreb Airport', address: 'Ul. Rudolfa Fizira 21, Velika Gorica', lat: 45.7420, lng: 16.0680, type: 'suggestion' },
];

export default function RideHailingWidget() {
  const [step, setStep] = useState<FlowStep>('search');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState("Detecting location...");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [h3Index, setH3Index] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<RideClass>('parq_go');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [routeData, setRouteData] = useState<{ distance: number; duration: number } | null>(null);
  const [trackingDriver, setTrackingDriver] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [searchType, setSearchType] = useState<'pickup' | 'destination'>('destination');
  const [isPaymentSelectorOpen, setIsPaymentSelectorOpen] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const otherDriversMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const routeLayerId = "route-line";

  // Fetch nearby drivers from Supabase
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!location) return;

      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('drivers')
          .select('id, last_location, is_online')
          .eq('is_online', true);

        if (error) throw error;

        const drivers = (data || []).map(d => {
          // Parse POINT(lng lat) string
          const match = d.last_location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
          if (match) {
            return {
              id: d.id,
              lng: parseFloat(match[1]),
              lat: parseFloat(match[2]),
            };
          }
          return null;
        }).filter(Boolean);

        // If no real drivers, keep some mock ones for demo purposes
        if (drivers.length === 0) {
          const mockDrivers = Array.from({ length: 3 }).map((_, i) => ({
            id: `mock-driver-${i}`,
            lat: location.lat + (Math.random() - 0.5) * 0.01,
            lng: location.lng + (Math.random() - 0.5) * 0.01,
          }));
          setNearbyDrivers(mockDrivers);
        } else {
          setNearbyDrivers(drivers);
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
      }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, [location]);

  // Update other drivers markers on map
  useEffect(() => {
    if (!map.current || nearbyDrivers.length === 0) return;

    nearbyDrivers.forEach(driver => {
      if (!otherDriversMarkers.current[driver.id]) {
        const el = document.createElement("div");
        el.className = "w-8 h-8 pointer-events-none";
        el.innerHTML = `<svg viewBox="0 0 24 24" fill="black" class="w-full h-full"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;
        otherDriversMarkers.current[driver.id] = new mapboxgl.Marker(el)
          .setLngLat([driver.lng, driver.lat])
          .addTo(map.current!);
      } else {
        otherDriversMarkers.current[driver.id].setLngLat([driver.lng, driver.lat]);
      }
    });
  }, [nearbyDrivers]);

  // 0. Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainer.current) return;

    try {
      if (!map.current) {
        console.log("Initializing map...");
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [15.9819, 45.8150],
          zoom: 13,
        });

        map.current.on('load', () => {
          console.log("Map loaded successfully");
          map.current?.resize();
        });

        map.current.on('error', (e) => {
          console.error("Mapbox error event:", e);
        });
      }
    } catch (err) {
      console.error("Critical map initialization error:", err);
    }

    // Geolocation detection
    detectLocation();

    return () => {
      // We don't want to remove the map on every re-render, 
      // but only when the component unmounts.
    };
  }, []);

  // 1. Handle Map Clicks (Update as state changes)
  useEffect(() => {
    if (!map.current) return;

    const onClick = async (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const addr = await reverseGeocode(lng, lat);
      
      if (step === 'search' || step === 'destination') {
        setPickupAddress(addr);
        setLocation({ lat, lng });
        updateMarker("self", [lng, lat], "blue");
        
        if (destination) {
          fetchRoute([lng, lat], [destination.lng, destination.lat]);
        }
      }
    };

    map.current.on('click', onClick);
    return () => {
      map.current?.off('click', onClick);
    };
  }, [step, destination]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      setPickupAddress("Detecting location...");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });
          const addr = await reverseGeocode(longitude, latitude);
          setPickupAddress(addr);
          
          if (map.current) {
            map.current.flyTo({ center: [longitude, latitude], zoom: 14 });
            updateMarker("self", [longitude, latitude], "blue");
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setPickupAddress("Location access denied");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setPickupAddress("Geolocation not supported");
    }
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
      const data = await res.json();
      return data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (err) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const updateMarker = (id: string, lngLat: [number, number], color: 'blue' | 'black') => {
    if (!map.current) return;
    if (!driverMarkers.current[id]) {
      const el = document.createElement("div");
      const colorClass = color === 'blue' ? 'bg-blue-500' : 'bg-black';
      el.className = `w-4 h-4 ${colorClass} rounded-full border-2 border-white shadow-lg`;
      driverMarkers.current[id] = new mapboxgl.Marker(el).setLngLat(lngLat).addTo(map.current);
    } else {
      driverMarkers.current[id].setLngLat(lngLat);
    }
  };

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();
      const data = json.routes[0];
      setRouteData({ distance: data.distance, duration: data.duration });

      if (map.current) {
        const route = data.geometry.coordinates;
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route }
          });
        } else {
          map.current.addLayer({
            id: routeLayerId, type: 'line', source: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route } } },
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#000000', 'line-width': 3, 'line-opacity': 0.8 }
          });
        }
        updateMarker("self", start, "blue");
        updateMarker("destination", end, "black");
        const bounds = new mapboxgl.LngLatBounds().extend(start).extend(end);
        map.current.fitBounds(bounds, { padding: 80 });
      }
    } catch (err) {
      console.error("Route error:", err);
    }
  };

  const getFareEstimate = async () => {
    if (!routeData || !destinationAddress) {
      console.log("Missing routeData or destinationAddress for estimate", { routeData, destinationAddress });
      return;
    }
    setIsLoadingEstimate(true);
    try {
      // Detekcija regije iz adrese odredišta
      let region = 'zagreb';
      const addr = destinationAddress.toLowerCase();
      if (addr.includes('split')) region = 'split';
      else if (addr.includes('dubrovnik')) region = 'dubrovnik';
      else if (addr.includes('zadar')) region = 'zadar';
      else if (addr.includes('rijeka')) region = 'rijeka';
      else if (addr.includes('istra') || addr.includes('pula') || addr.includes('poreč') || addr.includes('rovinj')) region = 'istria';

      console.log("Fetching estimate for region:", region, "route:", routeData);

      // Call the Uber-like pricing API
      const response = await fetch('/api/rides/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dist_meters: routeData.distance,
          time_seconds: routeData.duration,
          h3_zone_id: region, 
          is_payparq_lot: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch estimate: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Estimate API Response:", data);
      
      if (!data.estimates || !Array.isArray(data.estimates)) {
        throw new Error("Invalid estimate data structure");
      }

      const estimates = data.estimates.map((est: any) => ({
        class: est.id,
        label: est.name,
        price: est.fare,
        eta: est.arrival_estimate,
        surge: est.surge_multiplier
      }));
      
      setEstimate(estimates);
    } catch (err) { 
      console.error("Fare estimate error:", err);
      // Fallback to local calculation if API fails
      const baseFare = 5;
      const distanceFare = (routeData.distance / 1000) * 0.8;
      const durationFare = (routeData.duration / 60) * 0.2;
      const subtotal = baseFare + distanceFare + durationFare;

      const fallbackEstimates = Object.entries(RIDE_CLASSES).map(([key, config]) => ({
        class: key,
        label: config.label,
        price: (subtotal * config.multiplier).toFixed(2),
        eta: Math.round(routeData.duration / 60) + 2,
        surge: 1.0
      }));
      setEstimate(fallbackEstimates);
    } finally { 
      setIsLoadingEstimate(false); 
    }
  };

  useEffect(() => {
    if (routeData && step === 'destination') getFareEstimate();
  }, [routeData, step]);

  const selectHistoryItem = (item: LocationHistory) => {
    setDestination({ lat: item.lat, lng: item.lng });
    setDestinationAddress(item.address);
    setStep('destination');
    if (location) {
      fetchRoute([location.lng, location.lat], [item.lng, item.lat]);
    }
  };

  const handleSearch = async (query: string, type: 'pickup' | 'destination' = 'destination') => {
    setSearchQuery(query);
    setSearchType(type);
    if (type === 'pickup') setPickupAddress(query);
    
    if (query.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Proširena pretraga: bbox za cijelu Hrvatsku (cca [13.4, 42.3, 19.5, 46.6])
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=10&proximity=${location ? `${location.lng},${location.lat}` : '15.98,45.81'}&country=HR&bbox=13.4,42.3,19.5,46.6`);
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleConfirmRide = () => {
    setIsConfirmed(true);
    // Simulate finding a driver after 2 seconds
    setTimeout(() => {
      setTrackingDriver({
        name: 'Marko Jurić',
        car: 'Škoda Octavia • ZG-1234-PQ',
        rating: 4.9,
        trips: 1250,
        image: 'https://i.pravatar.cc/150?u=marko'
      });
      // Move map to simulation location or follow driver
      if (map.current && location) {
        map.current.flyTo({
          center: [location.lng + 0.005, location.lat + 0.005],
          zoom: 16,
          pitch: 45
        });
      }
    }, 2500);
  };


   const selectSearchResult = (feature: any) => {
     const [lng, lat] = feature.center;
     
     if (searchType === 'pickup') {
       setLocation({ lat, lng });
       setPickupAddress(feature.place_name);
       updateMarker("self", [lng, lat], "blue");
       if (destination) {
         fetchRoute([lng, lat], [destination.lng, destination.lat]);
       }
     } else {
       setDestination({ lat, lng });
       setDestinationAddress(feature.place_name);
       if (location) {
         fetchRoute([location.lng, location.lat], [lng, lat]);
       }
       setStep('destination');
     }
     
     setSearchQuery("");
     setSearchResults([]);
     setIsSearching(false);
   };

  return (
    <div className="relative w-full h-full bg-white font-sans text-black overflow-hidden flex flex-col">
      {/* Hidden helper for Tailwind classes used in markers */}
      <div className="hidden bg-blue-500 bg-black" />

      {/* Background Map - Hidden in search step, visible from destination onwards */}
      <div 
        ref={mapContainer} 
        className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-500 ${step === 'search' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
      />

      {/* 1. Header with elegant 'parq' branding - Floating Overlay */}
      {step !== 'search' && (
        <div className="absolute top-0 left-0 right-0 z-[100] px-6 py-8 pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="bg-white/80 backdrop-blur-md px-5 py-2 rounded-2xl shadow-sm border border-white/20">
              <span className="text-2xl font-light tracking-tight text-gray-900">parq</span>
            </div>
            <button 
              onClick={() => setStep('search')} 
              className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors shadow-sm border border-white/20"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Full-screen Search Step - Completely separate from map/bottom sheet for stability */}
      {step === 'search' && (
        <div className="fixed inset-0 z-[1001] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
          <div className="p-6 pt-12 space-y-8 shrink-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-1">Where to?</h1>
                <p className="text-gray-400 text-sm font-medium">Find your next destination</p>
              </div>
              <button 
                onClick={() => setStep('destination')} 
                className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-3 relative">
              {/* Vertical line connecting markers - Elegant gradient style */}
              <div className="absolute left-[1.45rem] top-12 bottom-12 w-[2px] bg-gradient-to-b from-blue-500 via-gray-100 to-black rounded-full" />

              {/* From Field */}
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-white z-10" />
                <input 
                  value={pickupAddress}
                  onChange={(e) => handleSearch(e.target.value, 'pickup')}
                  onFocus={() => {
                    setSearchType('pickup');
                    if (pickupAddress.length > 0) handleSearch(pickupAddress, 'pickup');
                  }}
                  placeholder="Current location"
                  className="w-full bg-gray-50 rounded-[1.5rem] py-5 pl-14 pr-14 text-sm font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-blue-100 transition-all shadow-sm focus:shadow-md"
                />
                <button 
                  onClick={detectLocation}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>

              {/* To Field */}
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black rounded-sm z-10" />
                <input 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value, 'destination')}
                  onFocus={() => setSearchType('destination')}
                  placeholder="Enter destination"
                  className="w-full bg-gray-50 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-semibold outline-none border-2 border-transparent focus:bg-white focus:border-black/5 transition-all shadow-sm focus:shadow-md"
                />
              </div>

              {/* Search Dropdown - Modern floating cards */}
              {isSearching && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white z-[1002] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] mt-4 border border-gray-50 overflow-hidden max-h-[55vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                  {searchResults.map((feature: any) => (
                    <button 
                      key={feature.id}
                      onClick={() => selectSearchResult(feature)}
                      className="w-full flex items-center space-x-5 group p-2 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 shadow-sm">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base leading-tight text-gray-900 line-clamp-1">{feature.place_name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{feature.text}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* History & Suggestions - Parq Style Grid */}
          {!isSearching && (
            <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-10 pt-4">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Saved Places</p>
                  <button className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-500">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', color: 'bg-blue-500' },
                    { label: 'Work', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'bg-orange-500' }
                  ].map((item) => (
                    <button key={item.label} className="flex flex-col items-start p-5 bg-gray-50 rounded-[2rem] hover:bg-gray-100 transition-all group">
                      <div className={`w-10 h-10 ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
                      </div>
                      <p className="font-black text-sm">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-6">Recent History</p>
                <div className="space-y-4">
                  {MOCK_HISTORY.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => selectHistoryItem(item)}
                      className="w-full flex items-center space-x-5 group"
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                        <svg className="w-6 h-6 text-gray-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0 border-b border-gray-50 pb-4 group-last:border-none">
                        <p className="font-black text-base text-gray-900">{item.name}</p>
                        <p className="text-xs font-bold text-gray-400 truncate mt-1">{item.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Sheet - For Destination, Payment, Tracking */}
      <div className={`absolute inset-x-0 bottom-0 z-40 pointer-events-none flex flex-col justify-end ${step === 'search' ? 'hidden' : ''}`}>
        <div className={`bg-white pointer-events-auto transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1) shadow-[0_-30px_60px_rgba(0,0,0,0.12)] rounded-t-[3rem] p-8 pb-12 border-t border-gray-50 ${isConfirmed ? 'min-h-[40vh]' : ''}`}>
          
          {step === 'destination' && !isConfirmed && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
              <div className="space-y-6">
                {/* Header with Route Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-8 bg-black rounded-full" />
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Select Ride</h2>
                      {routeData && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                          {Math.round(routeData.duration / 60)} min • {(routeData.distance / 1000).toFixed(1)} km
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden">
                          <div className="w-full h-full bg-gray-200" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter mt-1">{nearbyDrivers.length} drivers near you</span>
                  </div>
                </div>

                {/* Elegant Location Preview */}
                <div className="bg-gray-50/50 rounded-[2rem] p-5 flex items-center space-x-4 border border-gray-50">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <div className="w-[1px] h-4 bg-gray-200" />
                    <div className="w-2 h-2 bg-black rounded-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Destination</p>
                    <p className="text-sm font-black text-gray-900 truncate">{destinationAddress || 'Select destination...'}</p>
                  </div>
                  <button onClick={() => setStep('search')} className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-black transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>

                {/* Ride Classes Selection - Premium Horizontal/Vertical Mix */}
                <div className="space-y-3 max-h-[32vh] overflow-y-auto pr-2 scrollbar-hide py-1">
                  {Object.entries(RIDE_CLASSES).map(([key, config]) => {
                    const estItem = estimate?.find((e: any) => e.class === key);
                    const price = estItem?.price;
                    const surge = estItem?.surge;
                    const isSelected = selectedClass === key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedClass(key as RideClass)}
                        className={`w-full flex items-center justify-between p-5 rounded-[2.2rem] border-2 transition-all duration-300 relative overflow-hidden ${
                          isSelected 
                            ? 'border-black bg-black text-white shadow-2xl shadow-black/20 scale-[1.02] z-10' 
                            : 'border-transparent bg-gray-50/80 text-gray-900 hover:bg-gray-100 hover:border-gray-100'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-2xl" />
                        )}
                        
                        <div className="flex items-center space-x-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative transition-transform duration-500 ${isSelected ? 'bg-white/10 scale-110' : 'bg-white shadow-md'}`}>
                            <div dangerouslySetInnerHTML={{ __html: config.icon }} className={isSelected ? 'text-white' : 'text-black'} />
                            {surge > 1.1 && (
                              <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-lg">
                                ⚡
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center space-x-2">
                              <p className="font-black text-base">{config.label}</p>
                              {surge > 1.1 && (
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                  {surge}x
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] font-bold mt-0.5 ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>{config.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="font-black text-xl tracking-tight">
                            {isLoadingEstimate ? (
                              <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded-md" />
                            ) : price ? (
                              `${price} €`
                            ) : (
                              '...'
                            )}
                          </p>
                          <div className={`flex items-center space-x-1 mt-1 ${isSelected ? 'text-white/40' : 'text-gray-300'}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                              {estItem?.eta || Math.round((routeData?.duration || 0) / 60) + 1} min
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Payment & Action */}
                <div className="space-y-4 pt-2 relative">
                  <div className="relative">
                    <button 
                      onClick={() => setIsPaymentSelectorOpen(!isPaymentSelectorOpen)}
                      className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-4 rounded-2xl transition-all border border-transparent hover:border-gray-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                          {paymentMethod === 'stripe' ? (
                            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Payment Method</p>
                          <p className="font-black text-sm">{paymentMethod === 'stripe' ? 'Stripe (Apple/Google Pay)' : 'Cash'}</p>
                        </div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isPaymentSelectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isPaymentSelectorOpen && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-2 space-y-1">
                          <button 
                            onClick={() => {
                              setPaymentMethod('stripe');
                              setIsPaymentSelectorOpen(false);
                            }}
                            className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${paymentMethod === 'stripe' ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-900'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'stripe' ? 'bg-white/20' : 'bg-gray-100'}`}>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-black text-sm">Stripe</p>
                              <p className={`text-[10px] font-bold uppercase tracking-tighter ${paymentMethod === 'stripe' ? 'text-white/60' : 'text-gray-400'}`}>Apple / Google Pay</p>
                            </div>
                            {paymentMethod === 'stripe' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          
                          <button 
                            onClick={() => {
                              setPaymentMethod('cash');
                              setIsPaymentSelectorOpen(false);
                            }}
                            className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${paymentMethod === 'cash' ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-900'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-white/20' : 'bg-gray-100'}`}>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-black text-sm">Cash</p>
                              <p className={`text-[10px] font-bold uppercase tracking-tighter ${paymentMethod === 'cash' ? 'text-white/60' : 'text-gray-400'}`}>Pay driver directly</p>
                            </div>
                            {paymentMethod === 'cash' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleConfirmRide}
                    className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                  >
                    <span>Request {RIDE_CLASSES[selectedClass].label}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
              {!trackingDriver ? (
                // Finding Driver State
                <div className="py-10 text-center space-y-8">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-[6px] border-black/5 rounded-full" />
                    <div className="absolute inset-0 border-[6px] border-black border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-4 bg-gray-50 rounded-full flex items-center justify-center">
                      <div dangerouslySetInnerHTML={{ __html: RIDE_CLASSES[selectedClass].icon }} className="w-8 h-8 text-black" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight">Connecting you...</h2>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Searching for nearby {RIDE_CLASSES[selectedClass].label}s</p>
                  </div>
                  <button 
                    onClick={() => setIsConfirmed(false)}
                    className="bg-gray-50 text-red-500 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-colors border border-gray-100"
                  >
                    Cancel Request
                  </button>
                </div>
              ) : (
                // Driver Found / Tracking State
                <div className="space-y-8">
                  {/* Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">Driver is coming</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Arriving in 4 mins</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all border border-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </button>
                      <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all border border-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Driver Card */}
                  <div className="bg-gray-50/50 rounded-[2.5rem] p-6 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-5">
                      <div className="relative">
                        <img src={trackingDriver.image} alt={trackingDriver.name} className="w-16 h-16 rounded-3xl object-cover border-2 border-white shadow-md" />
                        <div className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg border-2 border-gray-50">
                          ★ {trackingDriver.rating}
                        </div>
                      </div>
                      <div>
                        <p className="font-black text-lg leading-none">{trackingDriver.name}</p>
                        <p className="text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-tighter">{trackingDriver.car}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                         <div dangerouslySetInnerHTML={{ __html: RIDE_CLASSES[selectedClass].icon }} className="w-8 h-8 text-black" />
                      </div>
                    </div>
                  </div>

                  {/* Ride Details Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 rounded-[2rem] p-5 border border-gray-100">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Payment</p>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                        <p className="text-sm font-black">{paymentMethod === 'stripe' ? 'Card •••• 4242' : 'Cash'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50/50 rounded-[2rem] p-5 border border-gray-100">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Price</p>
                      <p className="text-sm font-black text-black">{estimate?.find((e: any) => e.class === selectedClass)?.price || '...'} €</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsConfirmed(false);
                      setTrackingDriver(null);
                      setStep('search');
                    }}
                    className="w-full bg-white text-gray-400 py-4 rounded-2xl font-bold text-sm hover:text-black transition-all"
                  >
                    Cancel Ride
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'tracking' && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500 bg-white p-6 rounded-t-[40px]">
               <div className="py-10 text-center space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black">Finding your ride</h2>
                    <p className="text-gray-500 font-medium">Connecting to closest parq driver...</p>
                  </div>
                  <button onClick={() => setStep('search')} className="bg-gray-100 px-8 py-3 rounded-full text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">Cancel</button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
