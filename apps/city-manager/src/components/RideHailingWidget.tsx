"use client";

import { useState, useEffect, useRef } from "react";
import * as h3 from "h3-js";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Placeholder token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q";

import { getSupabase } from "../lib/supabase";

type FlowStep = 'search' | 'destination' | 'payment' | 'tracking';

type RideClass = 'parq_go' | 'parq_taxi' | 'smart_arrival' | 'comfort' | 'van' | 'delivery';

const BRAND_VIOLET = '#5B6CFF';
const uniqueCarSvg = (accent: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <g fill="white" stroke="rgba(0,0,0,0.08)" stroke-width="2">
        <rect x="22" y="42" width="156" height="30" rx="8"/>
        <path d="M42 42 L72 24 H128 L158 42 Z"/>
      </g>
      <circle cx="62" cy="76" r="12" fill="black"/>
      <circle cx="138" cy="76" r="12" fill="black"/>
      <path d="M38 48 H162" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  );
const uniqueParqGoSvg = (stripe: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <g fill="#0B0B0B" stroke="rgba(255,255,255,0.15)" stroke-width="2">
        <rect x="22" y="42" width="156" height="30" rx="8"/>
        <path d="M42 42 L72 24 H128 L158 42 Z"/>
      </g>
      <rect x="60" y="30" width="80" height="10" rx="4" fill="white" opacity="0.85"/>
      <path d="M38 48 H162" stroke="${stripe}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="62" cy="76" r="12" fill="black"/>
      <circle cx="138" cy="76" r="12" fill="black"/>
    </svg>`
  );

const RIDE_CLASSES: Record<RideClass, { label: string; description: string; basePrice: number; multiplier: number; icon: string; capacity: number }> = {
  parq_go: { 
    label: 'UrbanX', 
    description: 'Brzo i povoljno', 
    basePrice: 1.2, 
    multiplier: 1.0,
    icon: uniqueCarSvg('white'),
    capacity: 4
  },
  parq_taxi: { 
    label: 'Premium', 
    description: 'Luksuzne vožnje', 
    basePrice: 2.4, 
    multiplier: 1.5,
    icon: uniqueCarSvg('white'),
    capacity: 4
  },
  comfort: { 
    label: 'Comfort', 
    description: 'Dodatni komfor', 
    basePrice: 1.8, 
    multiplier: 1.2,
    icon: uniqueCarSvg('white'),
    capacity: 4
  },
  van: { 
    label: 'Max', 
    description: 'Za grupe do 6 osoba', 
    basePrice: 3.0, 
    multiplier: 2.0,
    icon: uniqueCarSvg('white'),
    capacity: 6
  },
  smart_arrival: { 
    label: 'Smart', 
    description: 'Automatski dolazak', 
    basePrice: 2.5, 
    multiplier: 1.6,
    capacity: 4,
    icon: uniqueCarSvg(BRAND_VIOLET)
  },
  delivery: { 
    label: 'Delivery', 
    description: 'Dostava paketa', 
    basePrice: 1.0, 
    multiplier: 0.8,
    capacity: 1,
    icon: uniqueCarSvg('white')
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
  { id: '1', name: 'Šibenska ul. 17', address: 'Šibenska ul. 17, Split', lat: 43.5186, lng: 16.4447, type: 'history' },
  { id: '2', name: 'Poljud', address: 'Stadion Poljud, Split', lat: 43.5204, lng: 16.4316, type: 'history' },
  { id: '3', name: 'Split Airport', address: 'Zračna luka Split', lat: 43.5389, lng: 16.2980, type: 'suggestion' },
];

export default function RideHailingWidget() {
  const [step, setStep] = useState<FlowStep>('search');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>({ lat: 43.5204, lng: 16.4316 });
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState("Poljud, Split");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [h3Index, setH3Index] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<RideClass>('parq_taxi');
  const [scheduledTime, setScheduledTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'apay' | 'card' | 'cash'>('card');
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
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
  const DARK_BG = "#000000";
  const ACCENT_PURPLE = "#5A45E8";
  const CARD_BG = "#1F2035";
  const prevDriverState = useRef<{ [key: string]: { lat: number; lng: number; rotation: number } }>({});
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetSnap, setSheetSnap] = useState<'collapsed' | 'expanded'>('collapsed');
  const [sheetHeight, setSheetHeight] = useState<number>(0);
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  const geoBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  };

  const lerpAngle = (a: number, b: number, t: number) => {
    let diff = ((b - a + 540) % 360) - 180;
    return a + diff * t;
  };

  const getMarkerScale = () => {
    const z = map.current?.getZoom() ?? 16;
    const s = 0.65 + Math.max(0, z - 14) * 0.10;
    return Math.min(1.3, Math.max(0.8, s));
  };

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

        // Show only a single static car on the map
        if (drivers.length === 0) {
          // One static mock driver near the user's location (no movement)
          const radius = 0.0009;
          const angle = Math.PI / 6;
          const oneMock = [{
            id: 'mock-driver-0',
            lat: location.lat + Math.sin(angle) * radius,
            lng: location.lng + Math.cos(angle) * radius,
          }];
          setNearbyDrivers(oneMock as any);
        } else {
          setNearbyDrivers([drivers[0] as any]); // Keep only one
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
      }
    };

    fetchDrivers();
    // Do not poll; keep marker fixed/static
    return () => {};
  }, [location]);

  // Update other drivers markers on map
  useEffect(() => {
    if (!map.current) return;

    // Remove any markers not in the current list (ensure only one stays)
    const validIds = new Set(nearbyDrivers.map(d => d.id));
    Object.keys(otherDriversMarkers.current).forEach(id => {
      if (!validIds.has(id)) {
        otherDriversMarkers.current[id].remove();
        delete otherDriversMarkers.current[id];
        delete prevDriverState.current[id];
      }
    });

    if (nearbyDrivers.length === 0) return;

    nearbyDrivers.forEach(driver => {
      if (!otherDriversMarkers.current[driver.id]) {
        const el = document.createElement("div");
        el.className = "marker-driver";
        el.style.width = "34px";
        el.style.height = "34px";
        el.style.transition = "none";
        el.style.zIndex = "10";
        el.style.pointerEvents = "none";
        el.style.willChange = "transform";
        
        const inner = document.createElement("div");
        inner.className = "marker-inner";
        inner.style.width = "100%";
        inner.style.height = "100%";
        inner.style.position = "relative";
        inner.style.transform = "none";
        inner.style.transition = "none";
        inner.style.willChange = "auto";
        
        const img = document.createElement("img");
        img.src = RIDE_CLASSES[selectedClass].icon;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.transform = "scale(0.8)";
        img.style.willChange = "auto";
        
        // Robust fallback if image fails - looks like a silver car body
        img.onerror = () => {
          img.style.display = "none";
          inner.style.background = "#ffffff";
          inner.style.borderRadius = "8px";
          inner.style.width = "24px";
          inner.style.height = "40px";
          inner.style.margin = "auto";
          inner.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          inner.style.border = "1px solid #000000";
        };
        
        inner.appendChild(img);
        el.appendChild(inner);

        otherDriversMarkers.current[driver.id] = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map.current!);
        
        prevDriverState.current[driver.id] = { lat: driver.lat, lng: driver.lng, rotation: 0 };
      } else {
        const marker = otherDriversMarkers.current[driver.id];
        const el = marker.getElement();
        const inner = el.querySelector('.marker-inner') as HTMLDivElement;
        // Keep the marker icon in sync with the selected class
        const img = el.querySelector('img') as HTMLImageElement | null;
        if (img) {
          img.src = RIDE_CLASSES[selectedClass].icon;
        }
        // Keep the marker static: no movement, no rotation updates
        if (inner) {
          const scale = getMarkerScale();
          inner.style.transform = `scale(${scale})`;
        }
        prevDriverState.current[driver.id] = { lat: driver.lat, lng: driver.lng, rotation: 0 };
      }
    });
  }, [nearbyDrivers, selectedClass]);

  useEffect(() => {
    const computeHeights = () => {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      // Reverted to mid-view standard (approx 50% vh)
      const collapsed = Math.max(380, Math.min(460, Math.round(vh * 0.55)));
      const expanded = Math.round(vh * 0.88);
      setSheetHeight(sheetSnap === 'collapsed' ? collapsed : expanded);
    };
    computeHeights();
    const onResize = () => computeHeights();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [sheetSnap]);

  const onSheetPointerDown = (e: React.PointerEvent) => {
    const startY = e.clientY;
    dragStart.current = { y: startY, height: sheetHeight };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onSheetPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = dragStart.current.y - e.clientY;
    const next = Math.max(120, Math.min((typeof window !== 'undefined' ? window.innerHeight * 0.92 : 700), dragStart.current.height + dy));
    setSheetHeight(next);
  };

  const onSheetPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const collapsed = Math.max(380, Math.min(460, Math.round(vh * 0.55)));
    const expanded = Math.round(vh * 0.88);
    const mid = (collapsed + expanded) / 2;
    const snap = sheetHeight > mid ? 'expanded' : 'collapsed';
    setSheetSnap(snap);
    setSheetHeight(snap === 'collapsed' ? collapsed : expanded);
    dragStart.current = null;
  };

  // Handle step transitions and layout visibility
  useEffect(() => {
    if (step !== 'search') {
      window.dispatchEvent(new CustomEvent('toggle-layout', { detail: true }));
    } else {
      window.dispatchEvent(new CustomEvent('toggle-layout', { detail: false }));
    }
    
    // Resize map when step or confirmation changes to handle layout shifts
    if (map.current) {
      setTimeout(() => {
        map.current?.resize();
      }, 700); // Wait for transition animation
    }

    // Cleanup on unmount
    return () => {
      window.dispatchEvent(new CustomEvent('toggle-layout', { detail: false }));
    };
  }, [step, isConfirmed]);

  const getClassPrice = (cls: RideClass) => {
    const item = Array.isArray(estimate) ? (estimate as any[]).find((e: any) => e.class === cls) : null;
    if (!item) return null;
    const v = typeof item.price === 'number' ? item.price : parseFloat(item.price);
    if (!isFinite(v)) return null;
    return v;
  };

  const etaMinutes = routeData ? Math.max(1, Math.round(routeData.duration / 60)) : null;
  const arrivalTimeStr = etaMinutes ? new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const distanceKm = routeData ? (routeData.distance / 1000) : null;

  // 0. Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainer.current) return;

    try {
      if (!map.current) {
        console.log("Initializing map...");
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [16.4401, 43.5186],
          zoom: 16,
          pitch: 60,
          bearing: -20,
          attributionControl: false
        });

        map.current.on('style.load', () => {});

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
      // Cleanup markers on unmount
      Object.values(driverMarkers.current).forEach(m => m.remove());
      Object.values(otherDriversMarkers.current).forEach(m => m.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle Map Resize when step changes
  useEffect(() => {
    if (map.current) {
      setTimeout(() => {
        map.current?.resize();
        if (location && destination && step !== 'search') {
          const bounds = new mapboxgl.LngLatBounds().extend([location.lng, location.lat]).extend([destination.lng, destination.lat]);
          map.current?.fitBounds(bounds, { padding: 50, duration: 1000 });
        }
      }, 700); // Wait for transition to finish
    }
  }, [step]);

  // 1. Handle Map Clicks (Update as state changes)
  useEffect(() => {
    if (!map.current) return;

    const onClick = async (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const addr = await reverseGeocode(lng, lat);
      
      if (step === 'search' || step === 'destination') {
        if (searchType === 'pickup') {
          setPickupAddress(addr);
          setLocation({ lat, lng });
          updateMarker("self", [lng, lat], "pickup");
          if (destination) {
            fetchRoute([lng, lat], [destination.lng, destination.lat]);
          }
        } else {
          setDestinationAddress(addr);
          setDestination({ lat, lng });
          updateMarker("destination", [lng, lat], "destination");
          if (location) {
            fetchRoute([location.lng, location.lat], [lng, lat]);
            setStep('destination');
          }
        }
      }
    };

    map.current.on('click', onClick);
    return () => {
      map.current?.off('click', onClick);
    };
  }, [step, location, destination, searchType]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      // Don't overwrite the initial default unless we're actually searching
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });
          const addr = await reverseGeocode(longitude, latitude);
          setPickupAddress(addr);
          
          if (map.current) {
            map.current.flyTo({ center: [longitude, latitude], zoom: 14 });
            updateMarker("self", [longitude, latitude], "pickup");
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
          // Keep the default that's already set in state
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
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

  const updateMarker = (id: string, lngLat: [number, number], type: 'pickup' | 'destination') => {
    if (!map.current) return;
    if (driverMarkers.current[id]) {
      driverMarkers.current[id].remove();
    }

    const el = document.createElement("div");
    const label = (type === 'pickup' ? (pickupAddress || '').split(',')[0] : (destinationAddress || '').split(',')[0]) || (type === 'pickup' ? 'Start' : 'Destination');

    if (type === 'pickup') {
      el.className = 'flex flex-col items-center group cursor-pointer';
      el.innerHTML = `
        <div class="w-2.5 h-2.5 bg-white rounded-full ring-4 ring-white/20 shadow-lg"></div>
        <div class="mt-1 px-2 py-0.5 rounded-full text-[10px] font-normal bg-black/60 text-white whitespace-nowrap">${label}</div>
      `;
    } else {
      el.className = 'flex flex-col items-center group cursor-pointer';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-white/20 rounded-full animate-ping opacity-60"></div>
          <div class="absolute w-6 h-6 bg-white/30 rounded-full blur-sm"></div>
          <div class="w-3 h-3 bg-white rounded-full ring-[3px] ring-white shadow-[0_0_15px_rgba(255,255,255,0.6)] z-10"></div>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded-full text-[10px] font-normal bg-black/60 text-white whitespace-nowrap">${label}</div>
      `;
    }

    driverMarkers.current[id] = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(lngLat)
      .addTo(map.current);
  };

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();
      if (!json.routes || json.routes.length === 0) return;
      
      const data = json.routes[0];
      setRouteData({ distance: data.distance, duration: data.duration });

      if (map.current) {
        const route = data.geometry.coordinates;
        
        // Remove existing route if it exists
        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId);
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }

        // Add the route source and layer
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route
            }
          }
        });

        map.current.addLayer({
            id: `${routeLayerId}-glow`,
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': ACCENT_PURPLE,
              'line-width': 6,
              'line-opacity': 0.2,
              'line-blur': 6
            }
          });

          map.current.addLayer({
            id: routeLayerId,
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': ACCENT_PURPLE,
              'line-width': 3,
              'line-opacity': 1,
              'line-blur': 0
            }
          });

        if (driverMarkers.current['self']) {
          driverMarkers.current['self'].remove();
          delete driverMarkers.current['self'];
        }

        updateMarker("destination", end, "destination");
        
        // Fit bounds with animation
        const bounds = new mapboxgl.LngLatBounds()
          .extend(start)
          .extend(end);
        
        map.current.fitBounds(bounds, {
          padding: { top: 60, bottom: 140, left: 60, right: 60 },
          duration: 1500
        });
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
        originalPrice: est.fare / 0.65, // Calculate original price before 35% discount
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

      const fallbackEstimates = Object.entries(RIDE_CLASSES).map(([key, config]) => {
        const originalPrice = subtotal * config.multiplier;
        const discountedPrice = originalPrice * 0.65; // Apply 35% promo
        return {
          class: key,
          label: config.label,
          price: discountedPrice.toFixed(2),
          originalPrice: originalPrice.toFixed(2),
          eta: Math.round(routeData.duration / 60) + Math.floor(Math.random() * 5) + 2,
          surge: 1.0
        };
      });
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
    
    // Trigger search on first character
    if (!query || query.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Proširena pretraga: bbox za cijelu Hrvatsku
      const proximity = location ? `${location.lng},${location.lat}` : '15.9819,45.8150';
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=10&proximity=${proximity}&country=HR&bbox=13.4,42.3,19.5,46.6&types=address,poi,place`);
      const data = await res.json();
      
      if (data.features) {
        // Filter out redundant results or those matching current addresses to keep it clean
        const filteredFeatures = data.features.filter((f: any) => 
          f.place_name.toLowerCase() !== pickupAddress.toLowerCase() &&
          f.place_name.toLowerCase() !== destinationAddress.toLowerCase()
        );
        setSearchResults(filteredFeatures);
      }
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
       updateMarker("self", [lng, lat], "pickup");
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
    <div className="relative w-full h-screen bg-black font-sans text-white overflow-hidden flex flex-col" style={{ fontFamily: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif` }}>
      {/* Hidden helper for Tailwind classes used in markers */}
      <div className="hidden bg-black" />

      {/* Map Section - background */}
      <div 
        ref={mapContainer} 
        className={`absolute inset-0 z-0 bg-black transition-all duration-300 rounded-none border-0 ${
          step === 'search' ? 'invisible opacity-0' : 'visible opacity-100 h-full'
        }`}
        style={{ backfaceVisibility: 'hidden' }}
      />

      {/* UI Content Layer */}
      <div className={`relative z-10 w-full h-full pointer-events-none flex flex-col ${step === 'search' ? 'bg-black' : 'bg-transparent'}`}>
        {/* Global Header */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-black/85 backdrop-blur-sm border-b border-white/10 z-[1003] pointer-events-auto flex items-center justify-center">
          {step !== 'search' && (
            <button
              onClick={() => {
                if (isConfirmed) {
                  setIsConfirmed(false);
                } else {
                  setStep('search');
                }
              }}
              className="absolute left-3 w-9 h-9 rounded-full bg-black hover:bg-black/90 active:scale-95 transition flex items-center justify-center"
              aria-label="Back"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <span className="text-white font-normal tracking-wide select-none">PARQ</span>
          <button
            onClick={() => setIsSchedulerOpen(true)}
            className="absolute right-3 w-9 h-9 rounded-full bg-black hover:bg-black/90 active:scale-95 transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v3H2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zM2 10h20v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8zm5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
            </svg>
          </button>
        </div>

        {/* Simple Scheduler Popover */}
        {isSchedulerOpen && (
          <div className="absolute top-14 right-3 z-[1004] pointer-events-auto bg-black border border-white/10 rounded-2xl p-3 w-64 shadow-2xl">
            <div className="text-xs font-normal text-white/70 mb-2">Schedule pickup</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="bg-black/30 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-black/30 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsSchedulerOpen(false)} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white">Cancel</button>
              <button onClick={() => setIsSchedulerOpen(false)} className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white">Set</button>
            </div>
          </div>
        )}
        {/* Removed top ETA/distance/arrival pill; moved info into ride cards */}
        {/* Search Step - Full Screen Experience */}
        {step === 'search' && (
          <div className="absolute inset-0 flex flex-col bg-black pointer-events-auto animate-in fade-in duration-500">
            {/* Main Search Container */}
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 pt-12">
              <h1 className="text-[32px] font-normal tracking-tight mb-8 text-white">Kamo idemo?</h1>
              
              <div className="bg-black rounded-[2.5rem] p-4 space-y-3 relative shadow-xl ring-1 ring-white/5">
                {/* Visual connector line */}
                <div className="absolute left-[2.35rem] top-12 bottom-12 w-[1.5px] bg-white/10 z-0" />
                
                {/* Pickup Input */}
                <div className="relative z-10 flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-white/40 bg-black ml-5 mr-4" />
                  <input 
                    value={pickupAddress}
                    onChange={(e) => handleSearch(e.target.value, 'pickup')}
                    onFocus={() => {
                      setSearchType('pickup');
                      setSearchQuery(pickupAddress);
                    }}
                    placeholder="Trenutna lokacija"
                    className="flex-1 bg-transparent py-4 text-lg placeholder-white/20 focus:outline-none text-white"
                  />
                </div>
                
                {/* Destination Input */}
                <div className="relative z-10 flex items-center">
                  <div className="w-2.5 h-2.5 bg-white ml-5 mr-4" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value, 'destination')}
                    onFocus={() => {
                      setSearchType('destination');
                      setSearchQuery("");
                    }}
                    placeholder="Kamo želite ići?"
                    className="flex-1 bg-transparent py-4 text-lg placeholder-white/20 focus:outline-none text-white"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search Results / History */}
              <div className="mt-8 flex-1 overflow-y-auto">
                {isSearching ? (
                  <div className="space-y-4">
                    {searchResults.map((f: any) => (
                      <button 
                        key={f.id}
                        onClick={() => selectSearchResult(f)}
                        className="w-full flex items-center space-x-4 py-4 group"
                      >
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div className="flex-1 text-left min-w-0 border-b border-white/5 pb-4">
                          <p className="text-[17px] text-white truncate">{f.text}</p>
                          <p className="text-sm text-white/40 truncate">{f.place_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-6 py-6 border-b border-white/5 mb-2">
                      <button className="flex flex-col items-center space-y-2 group">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:bg-white/10 transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                        <span className="text-[13px] text-white">Kuća</span>
                      </button>
                      <button className="flex flex-col items-center space-y-2 group">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:bg-white/10 transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-[13px] text-white">Posao</span>
                      </button>
                    </div>
                    {MOCK_HISTORY.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => selectHistoryItem(item)}
                        className="w-full flex items-center space-x-4 py-5 group"
                      >
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1 text-left min-w-0 border-b border-white/5 pb-5">
                          <p className="text-[17px] text-white truncate">{item.name}</p>
                          <p className="text-sm text-white/40 truncate">{item.address}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back button moved into header */}

      <div className={`fixed bottom-0 left-0 right-0 z-[9999] flex flex-col justify-end transition-all duration-500 ${step === 'search' ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div
          ref={sheetRef}
          className={`relative bg-black pointer-events-auto transition-all duration-300 shadow-[0_-12px_40px_rgba(0,0,0,0.4)] rounded-t-[3rem] p-6 pb-[19px] flex flex-col`}
          style={{ height: sheetHeight, paddingBottom: 'max(19px, env(safe-area-inset-bottom))', transform: 'translateZ(0)' }}
        >
          <div className="absolute -top-px left-0 right-0 h-px bg-black" />
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" onPointerDown={onSheetPointerDown} onPointerMove={onSheetPointerMove} onPointerUp={onSheetPointerUp} />
          
          {/* Destination Step Content */}
          {step === 'destination' && !isConfirmed && (
            <div className="flex flex-col h-full animate-in fade-in duration-500">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {(['parq_go', 'parq_taxi', 'comfort', 'van'] as RideClass[]).map((key) => {
                  const config = RIDE_CLASSES[key];
                  const isSelected = selectedClass === key;
                  return (
                    <button 
                      key={key}
                      onClick={() => setSelectedClass(key)}
                      className={`w-full flex items-center justify-between h-14 px-4 rounded-xl transition-all duration-200 ${
                        isSelected 
                          ? 'bg-white ring-2 ring-inset ring-black shadow-[0_8px_24px_rgba(0,0,0,0.12)]' 
                          : 'bg-white border border-black/10 hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M3 13.5V12l1.8-2.7c.37-.55.99-.88 1.65-.88H9l2.1 1.4h3.6c.66 0 1.28.33 1.65.88L20 12v1.5a1.5 1.5 0 01-1.5 1.5h-.75a1.75 1.75 0 11-3.5 0h-4.5a1.75 1.75 0 11-3.5 0H4.5A1.5 1.5 0 013 13.5z"/>
                          </svg>
                        </div>
                        <div className="h-10 flex flex-col items-center justify-center text-center gap-[4px]">
                          <p className={`text-[16px] leading-none tracking-tight ${isSelected ? 'text-black' : 'text-black/80'}`}>
                            {config.label}
                          </p>
                          <p className={`text-[11px] leading-none ${isSelected ? 'text-black/60' : 'text-black/50'}`}>
                            {(arrivalTimeStr ? arrivalTimeStr : '—')}{etaMinutes != null ? ` ${etaMinutes} min` : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`text-[15px] ${isSelected ? 'text-black' : 'text-black/80'}`}>
                          {(() => {
                            const p = getClassPrice(key as RideClass);
                            return p != null ? `€${p.toFixed(2)}` : '—';
                          })()}
                        </span>
                        {/* price only on right; remove other info */}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Confirm Button */}
              <div className="mt-4">
                <button 
                  onClick={handleConfirmRide}
                  className="w-full bg-[#5A45E8] hover:bg-[#4F3FD1] text-white py-2.5 rounded-full text-sm shadow-[0_10px_20px_rgba(90,69,232,0.3)] active:scale-[0.98] transition-all flex items-center justify-center relative"
                >
                  <div className="absolute left-4 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center ring-1 ring-white/10">
                    <div className="w-3.5 h-3.5 border border-white rounded-full flex items-center justify-center">
                      <span className="text-[8px] leading-none text-white">P</span>
                    </div>
                  </div>
                  <span className="tracking-tight">Confirm {RIDE_CLASSES[selectedClass].label} Ride</span>
                </button>
              </div>
            </div>
          )}

          {/* Tracking Step Content */}
          {isConfirmed && (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl mb-1 text-white">Stiže za 3 min</h2>
                  <p className="text-white/50 uppercase text-xs tracking-widest">Vozač je u blizini</p>
                </div>
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
              </div>

              <div className="bg-black rounded-[2rem] p-6 flex items-center space-x-6 mb-8 ring-1 ring-white/10 shadow-xl">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/5 rounded-full overflow-hidden border-4 border-black shadow-md">
                    <img src={trackingDriver?.image || "https://i.pravatar.cc/150?u=1"} alt="Driver" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[10px] px-2 py-1 rounded-full border-2 border-black">
                    4.9 ★
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl text-white">{trackingDriver?.name || 'Marko Jurić'}</h3>
                  <p className="text-white/60 mb-1">{trackingDriver?.car || 'Škoda Octavia • ZG-1234-PQ'}</p>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-green-500 uppercase tracking-tighter">Verified Partner</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                  onClick={() => {
                    setIsConfirmed(false);
                    setTrackingDriver(null);
                    setStep('search');
                  }}
                  className="bg-white/10 ring-1 ring-white/10 py-4 rounded-2xl text-white flex items-center justify-center space-x-2 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span>Otkaži</span>
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span>Nazovi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
