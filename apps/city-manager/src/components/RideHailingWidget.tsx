"use client";

import { useState, useEffect, useRef } from "react";
import * as h3 from "h3-js";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Placeholder token
const FALLBACK_TOKEN = "pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q";
const rawToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = (rawToken && rawToken !== "undefined" && rawToken !== "null" && rawToken.length > 10) 
  ? rawToken 
  : FALLBACK_TOKEN;

import { getSupabase } from "../lib/supabase";

type FlowStep = 'search' | 'destination' | 'payment' | 'tracking' | 'reservation';

type RideClass = 'parq_go' | 'parq_taxi' | 'smart_arrival' | 'comfort' | 'van' | 'delivery';

const BRAND_VIOLET = '#5B6CFF';
const modernRealisticCar3D = (accent: string, isVan?: boolean) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff" />
          <stop offset="40%" style="stop-color:#f8f8f8" />
          <stop offset="100%" style="stop-color:#e0e0e0" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#222" />
          <stop offset="100%" style="stop-color:#444" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Ground Shadow -->
      <ellipse cx="100" cy="135" rx="80" ry="15" fill="rgba(0,0,0,0.12)" filter="blur(10px)"/>
      
      <g transform="translate(100, 80)">
        <!-- Main Body -->
        ${isVan ? 
          `<path d="M-65 45 L-65 -35 Q-65 -50 -45 -52 H45 Q65 -50 65 -35 L65 45 L60 55 H-60 L-65 45 Z" fill="url(#bodyGrad)" stroke="rgba(0,0,0,0.08)" />
           <!-- Van Windshield -->
           <path d="M-55 -35 H55 L62 10 H-62 Z" fill="url(#glassGrad)" />
           <!-- Side Mirrors -->
           <path d="M-65 -15 L-75 -12 L-75 -5 L-65 -8 Z" fill="#eee" stroke="#ccc" />
           <path d="M65 -15 L75 -12 L75 -5 L65 -8 Z" fill="#eee" stroke="#ccc" />` :
          `<path d="M-80 50 L-75 15 Q-75 -5 -55 -10 H55 Q75 -5 75 15 L80 50 L75 60 H-75 L-80 50 Z" fill="url(#bodyGrad)" stroke="rgba(0,0,0,0.08)" />
           <!-- Hood -->
           <path d="M-55 -10 H55 L70 18 H-70 Z" fill="#f5f5f5" />
           <!-- Windshield -->
           <path d="M-65 18 H65 L72 45 H-72 Z" fill="url(#glassGrad)" />
           <!-- Side Mirrors -->
           <path d="M-75 15 L-88 18 L-88 28 L-75 25 Z" fill="#eee" stroke="#ccc" />
           <path d="M75 15 L88 18 L88 28 L75 25 Z" fill="#eee" stroke="#ccc" />`
        }
        
        <!-- Front Grill -->
        <rect x="-40" y="${isVan ? '25' : '48'}" width="80" height="18" rx="6" fill="#111" />
        <path d="M-35 ${isVan ? '31' : '54'} H35 M-35 ${isVan ? '37' : '60'} H35" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        
        <!-- Accent Line (Brand Color) -->
        <path d="M-75 ${isVan ? '15' : '45'} H75" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
        
        <!-- Headlights -->
        <g filter="url(#glow)">
          <rect x="${isVan ? '-60' : '-72'}" y="${isVan ? '22' : '45'}" width="22" height="12" rx="4" fill="#fff" opacity="0.95"/>
          <rect x="${isVan ? '38' : '50'}" y="${isVan ? '22' : '45'}" width="22" height="12" rx="4" fill="#fff" opacity="0.95"/>
        </g>
        
        <!-- Wheels -->
        <rect x="-70" y="52" width="18" height="15" rx="4" fill="#1a1a1a" />
        <rect x="52" y="52" width="18" height="15" rx="4" fill="#1a1a1a" />
      </g>
    </svg>`
  );

const RIDE_CLASSES: Record<RideClass, { label: string; description: string; basePrice: number; multiplier: number; icon: string; capacity: number }> = {
  parq_go: { 
    label: 'Parq GO', 
    description: 'GO Everyday Rides', 
    basePrice: 1.2, 
    multiplier: 1.0,
    icon: modernRealisticCar3D('#5A45E8'),
    capacity: 4
  },
  parq_taxi: { 
    label: 'GO & Back', 
    description: 'GO & Back 2 Way Ride', 
    basePrice: 2.4, 
    multiplier: 1.8,
    icon: modernRealisticCar3D('#5A45E8'),
    capacity: 4
  },
  comfort: { 
    label: 'Park GO Premium', 
    description: 'Comfort & Luxury', 
    basePrice: 1.8, 
    multiplier: 1.4,
    icon: modernRealisticCar3D('#5A45E8'),
    capacity: 4
  },
  van: { 
    label: 'Parq Van', 
    description: 'Space for Groups', 
    basePrice: 3.0, 
    multiplier: 2.0,
    icon: modernRealisticCar3D('#5A45E8', true),
    capacity: 6
  },
  smart_arrival: { 
    label: 'Parq GO Budget', 
    description: 'Economic Choice', 
    basePrice: 1.0, 
    multiplier: 0.8,
    capacity: 4,
    icon: modernRealisticCar3D(BRAND_VIOLET)
  },
  delivery: { 
    label: 'Parq Dostavljač', 
    description: 'Package Delivery', 
    basePrice: 1.0, 
    multiplier: 0.9,
    capacity: 1,
    icon: modernRealisticCar3D('#5A45E8')
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
          console.error("Mapbox error event:", e.error?.message || e.message || e);
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
          updateMarker("self", [lng, lat], "pickup", addr);
          if (destination) {
            fetchRoute([lng, lat], [destination.lng, destination.lat]);
          }
        } else {
          setDestinationAddress(addr);
          setDestination({ lat, lng });
          updateMarker("destination", [lng, lat], "destination", addr);
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
            updateMarker("self", [longitude, latitude], "pickup", addr);
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
      if (!res.ok) {
        console.warn("Geocoding API error:", res.statusText);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      const data = await res.json();
      return data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (err) {
      console.warn("Geocoding fetch error:", err);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const updateMarker = (id: string, lngLat: [number, number], type: 'pickup' | 'destination', overrideLabel?: string) => {
    if (!map.current) return;
    if (driverMarkers.current[id]) {
      driverMarkers.current[id].remove();
    }

    const el = document.createElement("div");
    const address = overrideLabel || (type === 'pickup' ? pickupAddress : destinationAddress) || '';
    const label = address.split(',')[0] || (type === 'pickup' ? 'Start' : 'Destination');

    el.className = 'flex flex-col items-center group cursor-pointer';
    
    // Uber-style markers: Circle for pickup, Square for destination
    if (type === 'pickup') {
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="px-3 py-1.5 mb-2 rounded-lg bg-white shadow-xl border border-gray-100 flex items-center gap-2 transform transition-transform group-hover:scale-105">
            <span class="text-[12px] font-bold text-gray-900 whitespace-nowrap">${label}</span>
            <svg class="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          <div class="w-4 h-4 bg-black rounded-full border-2 border-white shadow-lg ring-2 ring-black/10"></div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="px-3 py-1.5 mb-2 rounded-lg bg-white shadow-xl border border-gray-100 flex items-center gap-2 transform transition-transform group-hover:scale-105">
            <span class="text-[12px] font-bold text-gray-900 whitespace-nowrap">${label}</span>
            <svg class="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          <div class="w-4 h-4 bg-black border-2 border-white shadow-lg ring-2 ring-black/10"></div>
        </div>
      `;
    }

    // Add click event to return to previous step
    el.onclick = (e) => {
      e.stopPropagation();
      setStep('search');
      setSearchType(type === 'pickup' ? 'pickup' : 'destination');
      // Set sheet height to expanded to show search
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      setSheetHeight(Math.round(vh * 0.88));
      setSheetSnap('expanded');
    };

    driverMarkers.current[id] = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(lngLat)
      .addTo(map.current);
  };

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      if (!query.ok) {
        const errData = await query.json().catch(() => ({}));
        console.error("Directions API error:", errData.message || query.statusText);
        return;
      }
      const json = await query.json();
      if (!json.routes || json.routes.length === 0) return;
      
      const data = json.routes[0];
      setRouteData({ distance: data.distance, duration: data.duration });

      if (map.current && map.current.isStyleLoaded()) {
        const route = data.geometry.coordinates;
        
        try {
          // Remove existing route if it exists
          const glowId = `${routeLayerId}-glow`;
          if (map.current.getLayer(glowId)) {
            map.current.removeLayer(glowId);
          }
          if (map.current.getLayer(routeLayerId)) {
            map.current.removeLayer(routeLayerId);
          }
          if (map.current.getSource('route')) {
            map.current.removeSource('route');
          }
        } catch (e) {
          console.warn("Error cleaning up old route:", e);
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

        updateMarker("self", start, "pickup");
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
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&proximity=${proximity}&bbox=13.0,42.0,19.5,46.6&language=hr`);
      if (!res.ok) {
        console.warn("Search Geocoding API error:", res.statusText);
        setIsSearching(false);
        return;
      }
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
       updateMarker("self", [lng, lat], "pickup", feature.place_name);
       if (destination) {
         fetchRoute([lng, lat], [destination.lng, destination.lat]);
       }
     } else {
       setDestination({ lat, lng });
       setDestinationAddress(feature.place_name);
       updateMarker("destination", [lng, lat], "destination", feature.place_name);
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
      <div className={`relative z-10 w-full h-full pointer-events-none flex flex-col ${step === 'search' ? 'bg-white' : 'bg-transparent'}`}>
        {/* Global Header */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-white/95 backdrop-blur-md border-b border-black/5 z-[1003] pointer-events-auto flex items-center justify-center">
          {step !== 'search' && (
            <button
              onClick={() => {
                if (isConfirmed) {
                  setIsConfirmed(false);
                } else {
                  setStep('search');
                }
              }}
              className="absolute left-3 w-7 h-7 rounded-full bg-white hover:bg-black/5 active:scale-95 transition flex items-center justify-center shadow-sm border border-black/5"
              aria-label="Back"
            >
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <span className="text-[#5A45E8] font-bold tracking-tight select-none text-2xl">parq</span>
        </div>

        {/* Reservation Page Content */}
        {step === 'reservation' && (
          <div className="absolute inset-0 bg-white pointer-events-auto z-[1000] flex flex-col animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="px-6 pt-12 pb-6">
              <button 
                onClick={() => setStep('destination')}
                className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-6 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Rezervacija vožnje</h1>
              <p className="text-black/40 text-sm">Planirajte svoju vožnju unaprijed (30 min - 90 dana)</p>
            </div>

            {/* 3 Widgets Grid */}
            <div className="flex-1 px-6 space-y-6 overflow-y-auto pb-10">
              {/* Widget 1: Date Selection */}
              <div className="bg-black/[0.02] rounded-[2rem] p-6 border border-black/[0.03] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#5A45E8]/10 flex items-center justify-center text-[#5A45E8]">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v3H2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zM2 10h20v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8zm5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/></svg>
                    </div>
                    <span className="font-bold text-black text-lg">Datum</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#5A45E8] bg-[#5A45E8]/10 px-3 py-1 rounded-full uppercase tracking-wider">Obavezno</span>
                </div>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-white border border-black/5 rounded-2xl px-5 py-4 text-black font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-[#5A45E8]/10 transition-all shadow-inner"
                />
              </div>

              {/* Widget 2: Time Selection */}
              <div className="bg-black/[0.02] rounded-[2rem] p-6 border border-black/[0.03] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#5A45E8]/10 flex items-center justify-center text-[#5A45E8]">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M13 7h-2v6h6v-2h-4z"/></svg>
                    </div>
                    <span className="font-bold text-black text-lg">Vrijeme</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#5A45E8] bg-[#5A45E8]/10 px-3 py-1 rounded-full uppercase tracking-wider">Obavezno</span>
                </div>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-white border border-black/5 rounded-2xl px-5 py-4 text-black font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-[#5A45E8]/10 transition-all shadow-inner"
                />
              </div>

              {/* Widget 3: Quick Presets */}
              <div className="bg-black/[0.02] rounded-[2rem] p-6 border border-black/[0.03] shadow-sm">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-[#5A45E8]/10 flex items-center justify-center text-[#5A45E8]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>
                  </div>
                  <span className="font-bold text-black text-lg">Brzi odabir</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '+30 min', value: 30 },
                    { label: '+1 sat', value: 60 },
                    { label: '+2 sata', value: 120 },
                    { label: 'Sutra', value: 1440 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        const d = new Date(Date.now() + preset.value * 60000);
                        setScheduledDate(d.toISOString().split('T')[0]);
                        setScheduledTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
                      }}
                      className="px-4 py-3 rounded-2xl bg-white border border-black/5 text-black font-bold text-sm hover:border-[#5A45E8] hover:text-[#5A45E8] active:scale-95 transition-all shadow-sm"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Info (Separate from widgets) */}
              <div className="px-2">
                {(() => {
                  const now = new Date();
                  const sched = new Date(`${scheduledDate}T${scheduledTime}`);
                  const diffMs = sched.getTime() - now.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                  let isValid = true;
                  let message = "Vrijeme je ispravno odabrano.";
                  let statusColor = "bg-emerald-500/10 text-emerald-600";

                  if (diffMins < 30) {
                    isValid = false;
                    message = "Minimalno 30 min unaprijed.";
                    statusColor = "bg-red-500/10 text-red-600";
                  } else if (diffDays > 90) {
                    isValid = false;
                    message = "Maksimalno 90 dana unaprijed.";
                    statusColor = "bg-red-500/10 text-red-600";
                  }

                  return (
                    <div className={`w-full px-5 py-4 rounded-2xl font-bold text-sm flex items-center justify-between shadow-sm ${statusColor}`}>
                      <div className="flex items-center space-x-3">
                        {!isValid ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1.993 15.105l-4.112-4.112 1.414-1.414 2.698 2.698 6.703-6.703 1.414 1.414-8.117 8.117z"/></svg>
                        )}
                        <span>{message}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Confirm Reservation Footer */}
            <div className="p-6 border-t border-black/5 bg-white">
              <button 
                disabled={(() => {
                  const now = new Date();
                  const sched = new Date(`${scheduledDate}T${scheduledTime}`);
                  const diffMs = sched.getTime() - now.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  return diffMins < 30 || diffDays > 90;
                })()}
                onClick={() => setStep('destination')}
                className="w-full bg-[#5A45E8] hover:bg-[#4F3FD1] disabled:bg-black/10 disabled:text-black/20 text-white h-14 rounded-[1.5rem] font-bold shadow-lg shadow-[#5A45E8]/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <span>Potvrdi rezervaciju</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {/* Removed top ETA/distance/arrival pill; moved info into ride cards */}
        {/* Search Step - Full Screen Experience */}
        {step === 'search' && (
          <div className="absolute inset-0 flex flex-col bg-white pointer-events-auto animate-in fade-in duration-500">
            {/* Main Search Container */}
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 pt-12">
              <h1 className="text-[32px] font-bold tracking-tight mb-8 text-black">Kamo idemo?</h1>
              
              <div className="bg-white rounded-[2.5rem] p-4 space-y-3 relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.03]">
                {/* Visual connector line */}
                <div className="absolute left-[2.35rem] top-12 bottom-12 w-[1.5px] bg-black/[0.08] z-0" />
                
                {/* Pickup Input */}
                <div className="relative z-10 flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-black/20 bg-white ml-5 mr-4" />
                  <input 
                    value={pickupAddress}
                    onChange={(e) => handleSearch(e.target.value, 'pickup')}
                    onFocus={() => {
                      setSearchType('pickup');
                      setSearchQuery(pickupAddress);
                    }}
                    placeholder="Trenutna lokacija"
                    className="flex-1 bg-transparent py-4 text-lg placeholder-black/30 focus:outline-none text-black font-medium"
                  />
                </div>
                
                {/* Destination Input */}
                <div className="relative z-10 flex items-center">
                  <div className="w-2.5 h-2.5 bg-black ml-5 mr-4" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value, 'destination')}
                    onFocus={() => {
                      setSearchType('destination');
                      setSearchQuery("");
                    }}
                    placeholder="Kamo želite ići?"
                    className="flex-1 bg-transparent py-4 text-lg placeholder-black/30 focus:outline-none text-black font-medium"
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
                        <div className="w-10 h-10 bg-black/[0.03] rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-black/[0.06] transition-colors">
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div className="flex-1 text-left min-w-0 border-b border-black/[0.03] pb-4">
                          <p className="text-[17px] text-black font-medium truncate">{f.text}</p>
                          <p className="text-sm text-black/40 truncate">{f.place_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-6 py-6 border-b border-black/[0.03] mb-2">
                      <button className="flex flex-col items-center space-y-2 group">
                        <div className="w-14 h-14 bg-black/[0.03] rounded-full flex items-center justify-center text-black group-hover:bg-black/[0.06] transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                        <span className="text-[13px] text-black font-medium">Kuća</span>
                      </button>
                      <button className="flex flex-col items-center space-y-2 group">
                        <div className="w-14 h-14 bg-black/[0.03] rounded-full flex items-center justify-center text-black group-hover:bg-black/[0.06] transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-[13px] text-black font-medium">Posao</span>
                      </button>
                    </div>
                    {MOCK_HISTORY.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => selectHistoryItem(item)}
                        className="w-full flex items-center space-x-4 py-5 group"
                      >
                        <div className="w-12 h-12 bg-black/[0.03] rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-black/[0.06] transition-colors">
                          <svg className="w-6 h-6 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1 text-left min-w-0 border-b border-black/[0.03] pb-5">
                          <p className="text-[17px] text-black font-medium truncate">{item.name}</p>
                          <p className="text-sm text-black/40 truncate">{item.address}</p>
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
        {/* Discount Banner (Nadwidget) */}
        <div className="mb-[-18px] z-[10000] relative">
          <div className="bg-[#5A45E8] h-[22px] rounded-t-[3rem] flex items-center justify-center shadow-[0_-8px_20px_rgba(90,69,232,0.15)] relative">
            <div className="flex items-center space-x-1 pt-0.5">
              <span className="text-[10px] font-bold text-white tracking-wider">20% popust primjenjen</span>
              <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {/* Fill corners to connect with sheet */}
            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-[#5A45E8]" />
          </div>
        </div>

        <div
          ref={sheetRef}
          className={`relative bg-white pointer-events-auto transition-all duration-300 shadow-[0_-12px_60px_rgba(0,0,0,0.12)] rounded-t-[3rem] p-6 pb-[19px] flex flex-col`}
          style={{ height: sheetHeight, paddingBottom: 'max(19px, env(safe-area-inset-bottom))', transform: 'translateZ(0)' }}
        >
          <div className="absolute -top-px left-0 right-0 h-px bg-black/[0.02]" />
          <div className="w-12 h-1.5 bg-black/[0.08] rounded-full mx-auto mb-6" onPointerDown={onSheetPointerDown} onPointerMove={onSheetPointerMove} onPointerUp={onSheetPointerUp} />
          
          {/* Destination Step Content */}
          {step === 'destination' && !isConfirmed && (
            <div className="flex flex-col h-full animate-in fade-in duration-500">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {(['parq_go', 'parq_taxi', 'comfort', 'van', 'smart_arrival', 'delivery'] as RideClass[]).map((key) => {
                  const config = RIDE_CLASSES[key];
                  const isSelected = selectedClass === key;
                  return (
                    <button 
                      key={key}
                      onClick={() => setSelectedClass(key)}
                      className={`w-full flex items-center justify-between h-20 px-4 rounded-[2rem] transition-all duration-300 ${
                        isSelected 
                          ? 'bg-white ring-2 ring-inset ring-[#5A45E8] shadow-[0_15px_40px_rgba(90,69,232,0.18)] scale-[1.02]' 
                          : 'bg-white border border-black/[0.05] hover:border-black/[0.1] hover:bg-black/[0.01]'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center text-black shadow-sm overflow-hidden transition-transform duration-500 ${isSelected ? 'scale-110' : ''}`}>
                          <img src={config.icon} alt={config.label} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1 flex flex-col items-start justify-center">
                          <p className={`text-[17px] font-bold leading-none tracking-tight mb-1 ${isSelected ? 'text-black' : 'text-black/80'}`}>
                            {config.label}
                          </p>
                          <p className={`text-[11px] font-bold leading-none mb-1 ${isSelected ? 'text-[#5A45E8]' : 'text-black/40'}`}>
                            {(arrivalTimeStr ? arrivalTimeStr : '—')}{etaMinutes != null ? ` • ${etaMinutes} min` : ''}
                          </p>
                          <p className={`text-[10px] font-medium leading-none mb-[4px] ${isSelected ? 'text-black/50' : 'text-black/30'}`}>
                            {config.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-center">
                        {(() => {
                          const p = getClassPrice(key as RideClass);
                          if (p == null) return <span className="text-[16px] font-bold text-black/90">—</span>;
                          const originalPrice = p / 0.8;
                          return (
                            <>
                              <span className="text-[11px] font-medium text-black/30 line-through leading-none mb-[2px]">
                                €{originalPrice.toFixed(2)}
                              </span>
                              <span className={`text-[16px] font-bold leading-none ${isSelected ? 'text-[#5A45E8]' : 'text-black/90'}`}>
                                €{p.toFixed(2)}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Payment Method Selector */}
              <div className="relative mt-4">
                <button
                  onClick={() => setIsPaymentSelectorOpen(!isPaymentSelectorOpen)}
                  className="w-full h-10 bg-white border border-black/[0.05] rounded-xl px-4 flex items-center justify-end hover:border-black/[0.1] transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {paymentMethod === 'cash' && (
                        <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 6c0-1.1.9-2 2-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v12h16V6H4zm8 1a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zM5 7h2v2H5V7zm12 0h2v2h-2V7z"/>
                        </svg>
                      )}
                      {paymentMethod === 'card' && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#1434CB" d="M16.5 15.5h-10c-1.1 0-2-.9-2-2v-3c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2z"/>
                          <path fill="white" d="M7.5 10.5h1.2l.8 2.5.8-2.5h1.2l-1.5 4.5H8.8l-1.3-4.5zm4.5 0h1v4.5h-1v-4.5zm2.5 0c-.3 0-.5.1-.7.3-.2.2-.3.4-.3.7h1c0-.3-.2-.5-.4-.5-.2 0-.3.1-.3.2s0 .2.2.2h.5c.3 0 .5.1.7.3.2.2.3.5.3.8 0 .4-.1.7-.4.9s-.6.3-.9.3c-.4 0-.7-.1-.9-.4s-.3-.6-.3-1h1c0 .4.2.6.5.6.2 0 .3-.1.3-.2s0-.2-.2-.2h-.5c-.3 0-.5-.1-.7-.3-.2-.2-.3-.5-.3-.8 0-.4.1-.7.4-.9.2-.2.5-.3.8-.3zm3 0h1l.5 4.5h-1.1l-.1-1h-1.2l-.1 1H16l.5-4.5zm.3 2.5l-.2-1.5-.2 1.5h.4z"/>
                        </svg>
                      )}
                      {paymentMethod === 'gpay' && (
                        <svg className="w-8 h-8" viewBox="0 0 40 40">
                          <path fill="#4285F4" d="M28.4 20.4c0-.7-.1-1.3-.2-1.9H20v3.6h4.8c-.2 1.1-.8 2-1.7 2.6v2.1h2.8c1.6-1.5 2.5-3.8 2.5-6.4z"/>
                          <path fill="#34A853" d="M20 29c2.4 0 4.5-.8 6-2.2l-2.8-2.1c-.8.5-1.8.9-3.2.9-2.4 0-4.5-1.6-5.2-3.8h-2.9v2.2C13.4 27.2 16.5 29 20 29z"/>
                          <path fill="#FBBC05" d="M14.8 21.8c-.2-.5-.3-1.1-.3-1.8s.1-1.3.3-1.8v-2.2h-2.9c-.6 1.2-1 2.6-1 4s.4 2.8 1 4l2.9-2.2z"/>
                          <path fill="#EA4335" d="M20 14.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6c-1.5-1.4-3.5-2.3-6-2.3-3.5 0-6.6 1.8-8.5 4.6l2.9 2.2c.7-2.2 2.8-3.2 5.6-3.2z"/>
                        </svg>
                      )}
                    </div>
                    <svg className={`w-4 h-4 text-black/30 transition-transform duration-300 ${isPaymentSelectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>

                {isPaymentSelectorOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 p-1 z-[1005] animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col space-y-1">
                      <button 
                        onClick={() => { setPaymentMethod('gpay'); setIsPaymentSelectorOpen(false); }}
                        className={`h-10 rounded-xl flex items-center justify-center transition-all border ${paymentMethod === 'gpay' ? 'bg-white border-[#5A45E8] ring-1 ring-[#5A45E8]' : 'bg-white border-transparent hover:bg-black/[0.02]'}`}
                      >
                        <svg className="w-8 h-8" viewBox="0 0 40 40">
                          <path fill="#4285F4" d="M28.4 20.4c0-.7-.1-1.3-.2-1.9H20v3.6h4.8c-.2 1.1-.8 2-1.7 2.6v2.1h2.8c1.6-1.5 2.5-3.8 2.5-6.4z"/>
                          <path fill="#34A853" d="M20 29c2.4 0 4.5-.8 6-2.2l-2.8-2.1c-.8.5-1.8.9-3.2.9-2.4 0-4.5-1.6-5.2-3.8h-2.9v2.2C13.4 27.2 16.5 29 20 29z"/>
                          <path fill="#FBBC05" d="M14.8 21.8c-.2-.5-.3-1.1-.3-1.8s.1-1.3.3-1.8v-2.2h-2.9c-.6 1.2-1 2.6-1 4s.4 2.8 1 4l2.9-2.2z"/>
                          <path fill="#EA4335" d="M20 14.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6c-1.5-1.4-3.5-2.3-6-2.3-3.5 0-6.6 1.8-8.5 4.6l2.9 2.2c.7-2.2 2.8-3.2 5.6-3.2z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => { setPaymentMethod('card'); setIsPaymentSelectorOpen(false); }}
                        className={`h-10 rounded-xl flex items-center justify-center transition-all border ${paymentMethod === 'card' ? 'bg-white border-[#5A45E8] ring-1 ring-[#5A45E8]' : 'bg-white border-transparent hover:bg-black/[0.02]'}`}
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#1434CB" d="M16.5 15.5h-10c-1.1 0-2-.9-2-2v-3c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2z"/>
                          <path fill="white" d="M7.5 10.5h1.2l.8 2.5.8-2.5h1.2l-1.5 4.5H8.8l-1.3-4.5zm4.5 0h1v4.5h-1v-4.5zm2.5 0c-.3 0-.5.1-.7.3-.2.2-.3.4-.3.7h1c0-.3-.2-.5-.4-.5-.2 0-.3.1-.3.2s0 .2.2.2h.5c.3 0 .5.1.7.3.2.2.3.5.3.8 0 .4-.1.7-.4.9s-.6.3-.9.3c-.4 0-.7-.1-.9-.4s-.3-.6-.3-1h1c0 .4.2.6.5.6.2 0 .3-.1.3-.2s0-.2-.2-.2h-.5c-.3 0-.5-.1-.7-.3-.2-.2-.3-.5-.3-.8 0-.4.1-.7.4-.9.2-.2.5-.3.8-.3zm3 0h1l.5 4.5h-1.1l-.1-1h-1.2l-.1 1H16l.5-4.5zm.3 2.5l-.2-1.5-.2 1.5h.4z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => { setPaymentMethod('cash'); setIsPaymentSelectorOpen(false); }}
                        className={`h-10 rounded-xl flex items-center justify-center transition-all border ${paymentMethod === 'cash' ? 'bg-white border-[#5A45E8] ring-1 ring-[#5A45E8]' : 'bg-white border-transparent hover:bg-black/[0.02]'}`}
                      >
                        <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 6c0-1.1.9-2 2-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v12h16V6H4zm8 1a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zM5 7h2v2H5V7zm12 0h2v2h-2V7z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Confirm Button */}
              <div className="mt-6 flex items-center space-x-3">
                <button 
                  onClick={handleConfirmRide}
                  className="flex-1 bg-[#5A45E8] hover:bg-[#4F3FD1] text-white h-12 rounded-full text-[15px] font-bold shadow-[0_15px_30px_rgba(90,69,232,0.25)] active:scale-[0.98] transition-all flex items-center justify-center relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                  <div className="absolute left-4 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center ring-1 ring-white/20 shadow-inner">
                    <div className="w-3.5 h-3.5 border-2 border-white rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-black leading-none text-white">P</span>
                    </div>
                  </div>
                  <span className="tracking-tight">Potvrdi {RIDE_CLASSES[selectedClass].label}</span>
                </button>
                <button
                  onClick={() => setStep('reservation')}
                  className="w-12 h-12 rounded-xl bg-white border border-black/5 flex items-center justify-center text-black shadow-sm hover:border-black/10 active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v3H2V6a2 2 0 012-2h1V3a1 1 0 112 0v1zM2 10h20v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8zm5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Tracking Step Content */}
          {isConfirmed && (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-1 text-black tracking-tight">Stiže za 3 min</h2>
                  <p className="text-black/40 uppercase text-[10px] font-bold tracking-[0.2em]">Vozač je u blizini</p>
                </div>
                <div className="w-14 h-14 bg-[#5A45E8]/10 rounded-2xl flex items-center justify-center text-[#5A45E8] shadow-inner overflow-hidden p-2">
                  <img src={RIDE_CLASSES[selectedClass].icon} alt="Car Icon" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-6 flex items-center space-x-6 mb-8 ring-1 ring-black/[0.03] shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl ring-1 ring-black/[0.05]">
                    <img src={trackingDriver?.image || "https://i.pravatar.cc/150?u=1"} alt="Driver" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-[11px] font-bold px-2.5 py-1 rounded-full border-2 border-white shadow-lg">
                    4.9 ★
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-black tracking-tight">{trackingDriver?.name || 'Marko Jurić'}</h3>
                  <p className="text-black/40 text-sm font-medium mb-2">{trackingDriver?.car || 'Škoda Octavia • ZG-1234-PQ'}</p>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Verified Partner</span>
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
                  className="bg-white border border-black/[0.08] hover:bg-black/[0.02] py-4 rounded-2xl text-black font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span>Otkaži</span>
                </button>
                <button className="bg-white border border-black/[0.08] hover:bg-black/[0.02] text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
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
