"use client";

import { useState, useEffect, useRef } from "react";
import * as h3 from "h3-js";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Placeholder token
const FALLBACK_TOKEN = "pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q";
const rawToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = (rawToken && rawToken !== "undefined" && rawToken !== "null" && rawToken.length > 10) 
  ? rawToken 
  : FALLBACK_TOKEN;

import { getSupabase } from "../lib/supabase";

import { LocalNotifications } from '@capacitor/local-notifications';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';

type FlowStep = 'home' | 'search' | 'destination' | 'payment' | 'tracking' | 'reservation' | 'confirm';

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
        <rect x="-40" y="${isVan ? '25' : '48'}" width="80" height="18" rx="10" fill="#4B5563" />
        <path d="M-35 ${isVan ? '31' : '54'} H35 M-35 ${isVan ? '37' : '60'} H35" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        
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
    icon: modernRealisticCar3D('#8B5CF6'),
    capacity: 4
  },
  parq_taxi: { 
    label: 'GO & Back', 
    description: 'GO & Back 2 Way Ride', 
    basePrice: 2.4, 
    multiplier: 1.8,
    icon: modernRealisticCar3D('#8B5CF6'),
    capacity: 4
  },
  comfort: { 
    label: 'Park GO Premium', 
    description: 'Comfort & Luxury', 
    basePrice: 1.8, 
    multiplier: 1.4,
    icon: modernRealisticCar3D('#8B5CF6'),
    capacity: 4
  },
  van: { 
    label: 'Parq Van', 
    description: 'Space for Groups', 
    basePrice: 3.0, 
    multiplier: 2.0,
    icon: modernRealisticCar3D('#8B5CF6', true),
    capacity: 6
  },
  smart_arrival: { 
    label: 'Parq GO Budget', 
    description: 'Economic Choice', 
    basePrice: 1.0, 
    multiplier: 0.8,
    capacity: 4,
    icon: modernRealisticCar3D('#8B5CF6')
  },
  delivery: { 
    label: 'Kasnije', 
    description: 'Schedule your ride', 
    basePrice: 1.0, 
    multiplier: 1.0,
    capacity: 4,
    icon: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" ry="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>`)
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

const POPULAR_DESTINATIONS = [
  { id: 'p1', name: 'Zračna luka Split', address: 'Zračna luka Split (SPU), Kaštela', lat: 43.5389, lng: 16.2980 },
  { id: 'p2', name: 'Trajektna luka Split', address: 'Obala kneza Domagoja, Split', lat: 43.5042, lng: 16.4426 },
  { id: 'p3', name: 'Zapadna Obala', address: 'Obala kneza Branimira, Split', lat: 43.5061, lng: 16.4328 },
  { id: 'p4', name: 'Mall of Split', address: 'Ul. Josipa Jovića 93, Split', lat: 43.5111, lng: 16.4752 },
  { id: 'p5', name: 'City Center one Split', address: 'Vukovarska ul. 207, Split', lat: 43.5135, lng: 16.4952 },
];

export default function RideHailingWidget() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<FlowStep>('home');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>({ lat: 43.5204, lng: 16.4316 });
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupAddress, setPickupAddress] = useState("Poljud, Split");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [extraDestinations, setExtraDestinations] = useState<any[]>([]);
  const [h3Index, setH3Index] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<RideClass>('parq_taxi');
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const now = new Date();
    const defaultTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const defaultDate = now.toISOString().split('T')[0];

    const loadScheduled = () => {
      if (typeof window !== 'undefined') {
        const savedDate = localStorage.getItem('pp_scheduledDate');
        const savedTime = localStorage.getItem('pp_scheduledTime');
        setScheduledDate(savedDate || defaultDate);
        setScheduledTime(savedTime || defaultTime);
      }
    };

    loadScheduled();

    // Hide layout when in rides widget (since it's full screen)
    window.dispatchEvent(new CustomEvent('toggle-layout', { detail: true }));

    // Listen for visibility change or focus to update state when coming back from calendar page
    const handleFocus = () => loadScheduled();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.dispatchEvent(new CustomEvent('toggle-layout', { detail: false }));
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'apay' | 'card' | 'cash' | 'payparq'>('card');
  const [isScheduledMode, setIsScheduledMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_mode') === 'scheduled') {
      setIsScheduledMode(true);
      if (paymentMethod === 'cash') {
        setPaymentMethod('card');
      }
    }
    
    const stepParam = params.get('step') as FlowStep | null;
    if (stepParam && ['home', 'search', 'destination', 'payment', 'tracking', 'reservation', 'confirm'].includes(stepParam)) {
      setStep(stepParam);
    }
  }, []);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeData, setRouteData] = useState<{ distance: number; duration: number } | null>(null);
  const [trackingDriver, setTrackingDriver] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [arrivalTimeStr, setArrivalTimeStr] = useState<string>("");
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [searchType, setSearchType] = useState<'pickup' | 'destination'>('destination');
  const initialParamsHandled = useRef(false);
  const [isPaymentSelectorOpen, setIsPaymentSelectorOpen] = useState(false);
  const [accountType, setAccountType] = useState<'osobno' | 'posao'>('osobno');
  const [payparqBalance, setPayparqBalance] = useState<number>(0);
  const [showPayparqInfo, setShowPayparqInfo] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'parking' | 'rides' | 'delivery'>('rides');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAIBooking, setIsAIBooking] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const otherDriversMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const routeLayerId = "route-line";
  const DARK_BG = "#000000";
  const ACCENT_PURPLE = "#8B5CF6"; // Vibrant Violet
  const CARD_BG = "#FFFFFF";
  const prevDriverState = useRef<{ [key: string]: { lat: number; lng: number; rotation: number } }>({});
  const sheetRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [sheetSnap, setSheetSnap] = useState<'collapsed' | 'expanded'>('collapsed');
  const [sheetHeight, setSheetHeight] = useState<number>(0);
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMethod = localStorage.getItem('pp_paymentMethod') as ('gpay' | 'apay' | 'card' | 'cash' | 'payparq' | null);
      const savedAcct = localStorage.getItem('pp_accountType') as ('osobno' | 'posao' | null);
      if (savedMethod) setPaymentMethod(savedMethod);
      if (savedAcct) setAccountType(savedAcct);
    }
    const onVis = () => {
      if (document.visibilityState === 'visible' && typeof window !== 'undefined') {
        const savedMethod = localStorage.getItem('pp_paymentMethod') as ('gpay' | 'apay' | 'card' | 'cash' | 'payparq' | null);
        const savedAcct = localStorage.getItem('pp_accountType') as ('osobno' | 'posao' | null);
        if (savedMethod) setPaymentMethod(savedMethod);
        if (savedAcct) setAccountType(savedAcct);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

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

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

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
          inner.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
          inner.style.border = "1px solid #D1D5DB";
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
          const err: any = e as any;
          console.error("Mapbox error event:", err?.error?.message || err?.message || err);
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

  const updateMarker = (id: string, lngLat: [number, number], type: 'pickup' | 'destination', overrideLabel?: string, waitTime?: number) => {
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
          <div class="px-3 py-1.5 mb-2 rounded-lg bg-white shadow-xl border-2 border-black flex items-center gap-2 transform transition-transform group-hover:scale-105">
            <span class="text-[12px] font-black text-black whitespace-nowrap">${label}</span>
            <svg class="w-3 h-3 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          <div class="w-4 h-4 bg-black rounded-full border-2 border-white shadow-lg"></div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="flex items-stretch mb-2 border-2 border-black rounded-lg overflow-hidden shadow-xl">
            <div class="bg-black text-white px-2 flex items-center justify-center">
              <div class="flex flex-col items-center">
                <span class="text-[11px] font-black leading-none">${waitTime || 4}</span>
                <span class="text-[6px] font-bold uppercase leading-none mt-0.5">min</span>
              </div>
            </div>
            <div class="px-3 py-1.5 bg-white flex items-center gap-2 transform transition-transform group-hover:scale-105">
              <span class="text-[12px] font-black text-black whitespace-nowrap">${label}</span>
              <svg class="w-3 h-3 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
          <div class="w-4 h-4 bg-black rounded-md border-2 border-white shadow-lg"></div>
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
    if (!start[0] || !start[1] || !end[0] || !end[1]) {
      console.warn("Invalid coordinates for fetchRoute:", { start, end });
      return;
    }
    
    setIsRouting(true);
    try {
      console.log('Fetching route for:', start, end);
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
      );
      if (!query.ok) {
        const errData = await query.json().catch(() => ({}));
        console.error("Directions API error:", errData.message || query.statusText);
        return;
      }
      const json = await query.json();
      
      if (json.routes && json.routes[0]) {
        const data = json.routes[0];
        const route = data.geometry.coordinates;
        const duration = Math.ceil(data.duration / 60);
        const distance = (data.distance / 1000).toFixed(1);
        
        console.log(`Route fetched: ${distance}km, ${duration}min`);
        setRouteData({ distance: data.distance, duration: data.duration });
        
        setEtaMinutes(duration);
        const arrival = new Date(Date.now() + data.duration * 1000);
        setArrivalTimeStr(arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        
        if (map.current && map.current.isStyleLoaded()) {
          const mapInstance = map.current;
          
          try {
            // Clean up existing route layers and source
            const glowId = `${routeLayerId}-glow`;
            if (mapInstance.getLayer(glowId)) mapInstance.removeLayer(glowId);
            if (mapInstance.getLayer(routeLayerId)) mapInstance.removeLayer(routeLayerId);
            if (mapInstance.getSource('route')) mapInstance.removeSource('route');
          } catch (e) {
            console.warn("Error cleaning up old route:", e);
          }

          mapInstance.addSource('route', {
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
          
          mapInstance.addLayer({
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

          mapInstance.addLayer({
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
          updateMarker("destination", end, "destination", undefined, 4);
          
          // Fit map to route bounds
          const bounds = new mapboxgl.LngLatBounds();
          route.forEach((coord: [number, number]) => bounds.extend(coord));
          mapInstance.fitBounds(bounds, { 
            padding: { top: 80, bottom: 440, left: 40, right: 40 },
            duration: 1500
          });
        }
      } else {
        console.error("No routes found in Mapbox response:", json);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setIsRouting(false);
    }
  };

  // Handle query parameters from map page
  useEffect(() => {
    if (initialParamsHandled.current) return;
    
    const lat = searchParams.get('dest_lat');
    const lng = searchParams.get('dest_lng');
    const name = searchParams.get('dest_name');
    const pLat = searchParams.get('pickup_lat');
    const pLng = searchParams.get('pickup_lng');
    const pName = searchParams.get('pickup_name');

    // Handle multiple destinations
    const extra: any[] = [];
    let i = 2;
    while (searchParams.has(`dest${i}_lat`)) {
      extra.push({
        lat: parseFloat(searchParams.get(`dest${i}_lat`)!),
        lng: parseFloat(searchParams.get(`dest${i}_lng`)!),
        name: searchParams.get(`dest${i}_name`)!
      });
      i++;
    }

    if (pLat && pLng && pName) {
      setLocation({ lat: parseFloat(pLat), lng: parseFloat(pLng) });
      setPickupAddress(pName);
    }

    if (lat && lng && name && (location || pLat)) {
      initialParamsHandled.current = true;
      const destinationCoords = { lat: parseFloat(lat), lng: parseFloat(lng) };
      setDestination(destinationCoords);
      setDestinationAddress(name);
      setExtraDestinations(extra);
      setStep('destination');
      
      // Pokušaj dohvatiti rutu čim je mapa spremna
      const tryFetch = () => {
        if (map.current && map.current.loaded()) {
          const origin = pLat ? { lat: parseFloat(pLat), lng: parseFloat(pLng!) } : location;
          if (origin) {
            // Here we could handle multi-point routing if the API supports it, 
            // but for now let's just use the final destination.
            fetchRoute([origin.lng, origin.lat], [destinationCoords.lng, destinationCoords.lat]);
          }
        } else {
          setTimeout(tryFetch, 100);
        }
      };
      tryFetch();
    }
  }, [searchParams, location]);

  // Default experience when nema parametara iz /map:
  // prikaži odmah destination step umjesto praznog search stepa
  useEffect(() => {
    if (initialParamsHandled.current) return;
    const lat = searchParams.get('dest_lat');
    const lng = searchParams.get('dest_lng');
    if (!lat || !lng) {
      initialParamsHandled.current = true;
      setStep('destination');
    }
  }, [searchParams]);

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
        originalPrice: est.fare,
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
        return {
          class: key,
          label: config.label,
          price: originalPrice.toFixed(2),
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
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsConfirmed(true);
      setStep('tracking');
      // Simulate finding a driver after 1.5 seconds
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
      }, 1500);
    }, 1500);
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
     setShowSuggestions(false);
   };

  return (
    <div className="relative w-full h-screen bg-white font-sans text-black overflow-y-auto custom-scrollbar flex flex-col scroll-smooth">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[10000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-black/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-4 bg-black rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-white text-[24px] font-black uppercase tracking-[0.2em] animate-pulse">Tražimo vozača</h3>
          <p className="text-white/40 text-[13px] font-bold mt-2 uppercase tracking-widest">Pripremite se za polazak</p>
        </div>
      )}

      {/* Routing overlay (less intrusive) */}
      {isRouting && (
        <div className="absolute inset-0 z-[9999] bg-white/40 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="bg-black text-white px-6 py-3 rounded-2xl flex items-center space-x-3 shadow-2xl animate-pulse">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="font-black text-[14px] uppercase tracking-widest">Računamo rutu...</span>
          </div>
        </div>
      )}

      {/* Hidden helper for Tailwind classes used in markers */}
      <div className="hidden bg-white" />

      {/* Map Section - background */}
      <div 
        ref={mapContainer} 
        className={`absolute inset-0 z-0 bg-white transition-all duration-300 rounded-none border-0 ${
          step === 'home' || step === 'search' ? 'invisible opacity-0' : 'visible opacity-100 h-full'
        }`}
        style={{ backfaceVisibility: 'hidden' }}
      />

      {/* UI Content Layer */}
      <div className={`relative z-10 w-full h-full pointer-events-none flex flex-col ${step === 'home' || step === 'search' ? 'bg-white' : 'bg-transparent'}`}>
        {/* Global Header */}
        <div className={`w-full z-[1003] pointer-events-auto flex-shrink-0 transition-all duration-300 ${step === 'home' || step === 'search' ? 'bg-white' : 'px-4 pt-4'}`}>
          <div className={`relative transition-all duration-300 ${
            step === 'home' || step === 'search' 
              ? 'w-full h-auto flex flex-col items-center justify-center' 
              : 'w-full px-2 h-10 bg-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-black/10 flex items-center justify-between'
          }`}>

            {step === 'home' && (
              <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col p-6 pointer-events-auto space-y-8 bg-white overflow-y-auto custom-scrollbar h-full">
                {/* AI Promo Banner */}
                {isAIBooking && (
                  <div className="bg-black text-white p-4 rounded-3xl flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[14px] font-black uppercase tracking-wider">10% AI PROMO</div>
                        <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Primijenjeno na sve AI rezervacije</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Aktivno</div>
                  </div>
                )}

                {/* Main Search Section */}
                <div className="space-y-4">
                  <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Kamo?</h1>
                  <button
                    onClick={() => { setStep('search'); }}
                    className="w-full flex items-center bg-black/[0.03] hover:bg-black/[0.05] border-2 border-black/5 rounded-[2rem] px-6 h-[1.6cm] transition-all active:scale-95 group"
                  >
                    <svg className="w-6 h-6 text-black/20 group-hover:text-black/40 transition-colors mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-[18px] font-bold text-black/30">Gdje želite ići?</span>
                  </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => { setStep('search'); }}
                    className={`group relative overflow-hidden p-6 rounded-[2.5rem] border-2 transition-all active:scale-[0.98] ${activeCategory === 'rides' ? 'bg-black border-black text-white' : 'bg-white border-black/5 text-black hover:border-black/20'}`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex flex-col items-start">
                        <span className="text-[20px] font-black uppercase tracking-tighter">Vožnja</span>
                        <span className={`text-[11px] font-bold uppercase tracking-widest opacity-50`}>Naruči odmah</span>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeCategory === 'rides' ? 'bg-white/10' : 'bg-black/5'}`}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveCategory('parking')}
                      className={`group relative overflow-hidden p-6 rounded-[2.5rem] border-2 transition-all active:scale-[0.98] ${activeCategory === 'parking' ? 'bg-black border-black text-white' : 'bg-white border-black/5 text-black hover:border-black/20'}`}
                    >
                      <div className="flex flex-col items-start space-y-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeCategory === 'parking' ? 'bg-white/10' : 'bg-black/5'}`}>
                          <span className="font-black text-lg">P</span>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[15px] font-black uppercase tracking-tighter">Parking</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Rezerviraj</span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveCategory('delivery')}
                      className={`group relative overflow-hidden p-6 rounded-[2.5rem] border-2 transition-all active:scale-[0.98] ${activeCategory === 'delivery' ? 'bg-black border-black text-white' : 'bg-white border-black/5 text-black hover:border-black/20'}`}
                    >
                      <div className="flex flex-col items-start space-y-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeCategory === 'delivery' ? 'bg-white/10' : 'bg-black/5'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[15px] font-black uppercase tracking-tighter">Dostava</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Paketi</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Locations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30">Nedavno</span>
                    <button className="text-[11px] font-black uppercase tracking-[0.2em] text-black/60">Vidi sve</button>
                  </div>
                  <div className="space-y-2">
                    {MOCK_HISTORY.slice(0, 2).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setDestination({ lat: item.lat, lng: item.lng });
                          setDestinationAddress(item.address);
                          setStep('destination');
                          if (location) {
                            fetchRoute([location.lng, location.lat], [item.lng, item.lat]);
                          }
                        }}
                        className="w-full flex items-center p-4 rounded-[1.5rem] hover:bg-black/[0.02] transition-colors border border-transparent hover:border-black/5 group"
                      >
                        <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center mr-4 group-hover:bg-black/10 transition-colors">
                          <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-[14px] font-bold text-black">{item.name}</span>
                          <span className="text-[11px] font-medium text-black/30 truncate max-w-[200px]">{item.address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step !== 'home' && step !== 'search' && (
              <button
                  onClick={() => {
                    if (isConfirmed) {
                      setIsConfirmed(false);
                      setTrackingDriver(null);
                      setStep('destination');
                    } else {
                      const params = new URLSearchParams();
                      if (location) {
                        params.set('pickup_lat', location.lat.toString());
                        params.set('pickup_lng', location.lng.toString());
                        params.set('pickup_name', pickupAddress);
                      }
                      if (destination) {
                        params.set('dest_lat', destination.lat.toString());
                        params.set('dest_lng', destination.lng.toString());
                        params.set('dest_name', destinationAddress);
                      }
                      router.push(`/map?${params.toString()}` as any);
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-white hover:bg-black/5 active:scale-95 transition flex items-center justify-center shrink-0 border border-black/10"
                  aria-label="Back"
                >
                <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            
            {step !== 'home' && step !== 'search' && (
              <div className="flex-1 flex items-center justify-center space-x-1.5 px-2 overflow-hidden">
                <span className="text-[13px] font-bold text-black truncate min-w-0 shrink">
                  {pickupAddress.split(',')[0]}
                </span>
                
                {/* Arrow to first destination */}
                <svg className="w-3 h-3 text-black/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>

                <span className="text-[13px] font-black text-black truncate min-w-0 shrink">
                  {destinationAddress.split(',')[0]}
                </span>

                {/* Additional destinations */}
                {extraDestinations.map((dest, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 shrink-0 min-w-0">
                    <svg className="w-3 h-3 text-black/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-[13px] font-black text-black truncate min-w-0 shrink">
                      {dest.name.split(',')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {step !== 'home' && step !== 'search' && (
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('action', 'add_destination');
                  if (location) {
                    params.set('pickup_lat', location.lat.toString());
                    params.set('pickup_lng', location.lng.toString());
                    params.set('pickup_name', pickupAddress);
                  }
                  if (destination) {
                    params.set('dest_lat', destination.lat.toString());
                    params.set('dest_lng', destination.lng.toString());
                    params.set('dest_name', destinationAddress);
                  }
                  router.push(`/map?${params.toString()}` as any);
                }}
                className="w-7 h-7 rounded-full bg-white hover:bg-black/5 active:scale-95 transition flex items-center justify-center shrink-0 border border-black/10"
                aria-label="Add Route"
              >
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Step Content intentionally minimal to match old look */}
        {step === 'search' && (
          <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pointer-events-auto bg-white min-h-screen">
            <div className="flex items-center w-full px-6 py-4 border-b border-black/5 bg-white sticky top-0 z-10">
              <button
                onClick={() => setStep('home')}
                className="mr-4 p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex items-center flex-1 bg-black/[0.03] rounded-2xl border border-black/5 px-4 py-2">
                <svg className="w-5 h-5 text-black/30 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kamo?"
                  className="w-full bg-transparent text-[16px] font-bold placeholder-black/20 focus:outline-none text-black"
                />
              </div>
            </div>

            {/* Suggestions / Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {searchQuery.length > 0 ? (
                searchResults.length > 0 ? (
                  searchResults.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => selectSearchResult(item)}
                      className="w-full flex items-center p-4 rounded-3xl hover:bg-black/[0.02] transition-all border border-transparent hover:border-black/5 group"
                    >
                      <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-black/10 transition-colors">
                        <svg className="w-5 h-5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[15px] font-black text-black uppercase tracking-tight">{item.name}</span>
                        <span className="text-[12px] font-bold text-black/30 truncate max-w-[250px] uppercase tracking-wider">{item.address}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-black/20">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-sm font-black uppercase tracking-widest">Nema rezultata</span>
                  </div>
                )
              ) : (
                <div className="space-y-6 pt-4">
                  <div className="px-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30">Popularno</span>
                  </div>
                  <div className="space-y-1">
                    {POPULAR_DESTINATIONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setDestination({ lat: item.lat, lng: item.lng });
                          setDestinationAddress(item.name);
                          setStep('destination');
                          if (location) {
                            fetchRoute([location.lng, location.lat], [item.lng, item.lat]);
                          }
                        }}
                        className="w-full flex items-center p-4 rounded-3xl hover:bg-black/[0.02] transition-all border border-transparent hover:border-black/5 group"
                      >
                        <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-black/10 transition-colors">
                          <svg className="w-5 h-5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[14px] font-black text-black uppercase tracking-tight">{item.name}</span>
                          <span className="text-[11px] font-bold text-black/30 truncate max-w-[250px] uppercase tracking-wider">{item.address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <div className={`fixed bottom-0 left-0 right-0 z-[9999] flex flex-col justify-end transition-all duration-500 ${step === 'home' || step === 'search' ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        {isAIBooking && (
          <div className="mb-[-20px] z-[10000] relative px-6">
            <div className="bg-black h-[32px] rounded-t-2xl flex items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.2)] relative border-x-[3px] border-t-[3px] border-black">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">10% AI PROMO APPLIED</span>
              </div>
            </div>
          </div>
        )}

          <div
            ref={sheetRef}
            className="relative bg-white pointer-events-auto transition-all duration-700 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] rounded-t-[3.5rem] border-x border-t border-black/5 p-8 flex flex-col"
            style={{ height: 'calc(50vh + 1.5cm)', paddingBottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 0.5cm)', transform: 'translateZ(0)' }}
          >
          <div className="w-16 h-1.5 bg-black/10 rounded-full mx-auto mb-8 cursor-grab active:cursor-grabbing hover:bg-black/20 transition-colors" onPointerDown={onSheetPointerDown} onPointerMove={onSheetPointerMove} onPointerUp={onSheetPointerUp} />
          
          {/* Destination Step Content */}
          {step === 'destination' && !isConfirmed && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {(['parq_go', 'parq_taxi', 'comfort', 'van', 'smart_arrival', 'delivery'] as RideClass[]).map((key) => {
                  const config = RIDE_CLASSES[key];
                  const isSelected = selectedClass === key;
                  return (
                    <button 
                      key={key}
                      onClick={() => {
                        setSelectedClass(key);
                        if (key === 'delivery') router.push('/calendar' as any);
                      }}
                      className={`w-full flex items-center justify-between p-5 rounded-[2.5rem] transition-all duration-500 ${
                        isSelected 
                            ? 'bg-black text-white shadow-[0_25px_50px_rgba(0,0,0,0.25)] scale-[1.03] z-10' 
                            : 'bg-gray-50/50 hover:bg-gray-100/80 text-black'
                      }`}
                    >
                      <div className="flex items-center space-x-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${isSelected ? 'bg-white/10 rotate-6 scale-110' : 'bg-white shadow-sm'}`}>
                          <img src={config.icon} alt={config.label} className="w-10 h-10 object-contain" />
                        </div>
                        <div className="flex flex-col items-start">
                          <h3 className={`text-[17px] font-bold leading-tight mb-1 ${isSelected ? 'text-white' : 'text-black'}`}>
                            {config.label}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[12px] font-medium h-[20px] flex items-center px-2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-black/60'}`}>
                              {etaMinutes != null ? `${etaMinutes} min` : '— min'}
                            </span>
                            <span className={`text-[12px] font-medium ${isSelected ? 'text-white/60' : 'text-black/40'}`}>
                              {(arrivalTimeStr ? arrivalTimeStr : '—')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        {isLoadingEstimate ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                          </div>
                        ) : (() => {
                          const base = getClassPrice(key as RideClass);
                          if (base == null) return <span className={`text-[16px] font-bold ${isSelected ? 'text-white/20' : 'text-black/5'}`}>—</span>;
                          const discounted = isAIBooking ? base * 0.9 : base;
                          return (
                            <>
                              {isAIBooking && (
                                <span className={`text-[12px] font-medium line-through mb-0.5 ${isSelected ? 'text-white/40' : 'text-black/20'}`}>
                                  €{base.toFixed(2)}
                                </span>
                              )}
                              <span className={`text-[20px] font-bold ${isSelected ? 'text-white' : 'text-black'}`}>
                                €{discounted.toFixed(2)}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* World-Class Payment & Action Bar */}
              <div className="mt-auto pt-4 border-t border-black/5 space-y-4">
                <div className="flex items-center justify-between">
                  {/* Payment Widget */}
                  <button 
                    onClick={() => router.push('/payment' as any)}
                    className="bg-white border-2 border-black rounded-2xl flex items-center justify-between px-4 shadow-md active:scale-95 transition-all group/payment overflow-hidden"
                    style={{ height: '0.8cm' }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 flex items-center justify-center">
                        {paymentMethod === 'card' && (
                          <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                        )}
                        {paymentMethod === 'cash' && (
                          <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                        {paymentMethod === 'gpay' && <span className="text-[8px] font-bold">GPay</span>}
                        {paymentMethod === 'apay' && <span className="text-[8px] font-bold">Pay</span>}
                        {paymentMethod === 'payparq' && (
                          <div className="w-4 h-4 bg-black rounded-[6px] flex items-center justify-center">
                            <span className="text-[7px] font-black text-white leading-none">PQ</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] font-bold text-black truncate">
                        {paymentMethod === 'payparq' ? 'Payparq račun' : paymentMethod === 'card' ? 'Visa •••• 4242' : paymentMethod === 'cash' ? 'Gotovina' : paymentMethod === 'gpay' ? 'Google Pay' : 'Apple Pay'}
                      </span>
                    </div>
                    <svg className={`w-4 h-4 text-black/20 transition-transform duration-500 ${isPaymentSelectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className="flex items-center space-x-2">
                    {isScheduledMode && (
                      <div className="flex items-center space-x-2 bg-black text-white px-3 rounded-full shadow-lg" style={{ height: '0.8cm' }}>
                        <span className="text-[9px] font-black uppercase tracking-wider">Kako biste željeli platiti?</span>
                      </div>
                    )}
                    {isAIBooking && (
                      <div className="flex items-center space-x-2 bg-black text-white px-3 rounded-full shadow-lg" style={{ height: '0.8cm' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">-10% AI</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-[0.2cm] mb-[2cm] md:mb-[1.5cm]">
                  <button 
                    onClick={handleConfirmRide}
                    className="flex-1 bg-black text-white h-[1.4cm] rounded-[2.5rem] flex items-center justify-center space-x-4 hover:bg-black/90 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 group/order overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    <span className="text-[18px] font-bold tracking-tight relative z-10">Odaberi {RIDE_CLASSES[selectedClass].label}</span>
                    <svg className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                  {/* Calendar Widget - Sized to match CTA height, fully rounded */}
                  <button 
                    onClick={() => router.push('/calendar' as any)}
                    className="bg-black text-white rounded-full flex items-center justify-center shrink-0 shadow-xl active:scale-95 transition-all hover:bg-black/90 w-[1.4cm] h-[1.4cm]"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Step Content */}
          {isConfirmed && (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-700 p-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[20px] font-black text-black tracking-tight leading-none mb-1">Stiže za 3 min</h2>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></div>
                    <p className="text-black/40 uppercase text-[9px] font-black tracking-[0.2em]">Vozač je u blizini</p>
                  </div>
                </div>
                <div className="w-14 h-14 bg-black rounded-[1.2rem] flex items-center justify-center shadow-xl overflow-hidden p-2 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <img src={RIDE_CLASSES[selectedClass].icon} alt="Car Icon" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Driver Card */}
              <div className="bg-white rounded-[1.5rem] p-3 flex items-center space-x-3 mb-3 shadow-[0_15px_35px_rgba(0,0,0,0.1)] border-2 border-black relative overflow-hidden group/driver">
                <div className="absolute inset-0 bg-black opacity-0 group-hover/driver:opacity-5 transition-opacity"></div>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-xl overflow-hidden border-2 border-black shadow-lg group-hover/driver:scale-105 transition-transform duration-500">
                    <img src={trackingDriver?.image || "https://i.pravatar.cc/150?u=1"} alt="Driver" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-md">
                    {trackingDriver?.rating || '4.9'} ★
                  </div>
                </div>
                <div className="flex-1 relative z-10 min-w-0">
                  <h3 className="text-[14px] font-black text-black tracking-tight mb-0.5 truncate">{trackingDriver?.name || 'Marko Jurić'}</h3>
                  <p className="text-black/50 text-[10px] font-bold mb-1 truncate">{trackingDriver?.car || 'Škoda Octavia • ZG-1234-PQ'}</p>
                  <div className="flex items-center space-x-1.5">
                    <div className="px-1.5 py-0.5 bg-black text-white rounded-md text-[7px] font-black uppercase tracking-widest whitespace-nowrap">Verified Partner</div>
                  </div>
                </div>
              </div>

              {/* High-Fidelity Action Row (Share & Safety) */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button className="flex items-center justify-center space-x-2 py-2.5 bg-white border-2 border-black hover:bg-black hover:text-white rounded-xl transition-all group/share active:scale-95">
                  <svg className="w-3.5 h-3.5 text-black group-hover/share:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">Podijeli</span>
                </button>
                <button className="flex items-center justify-center space-x-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all group/safety active:scale-95">
                  <svg className="w-3.5 h-3.5 text-red-600 group-hover/safety:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Sigurnost</span>
                </button>
              </div>

              {/* Price & Payment Summary */}
              <div className="bg-black text-white rounded-[1.5rem] p-4 flex items-center justify-between mb-4 shadow-xl border-2 border-black group/price hover:scale-[1.02] transition-all">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Ukupna cijena</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-[18px] font-black">€{getClassPrice(selectedClass)?.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-white/40">Fixed</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Plaćanje</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-black uppercase">
                      {paymentMethod === 'payparq' ? 'PAYPARQ' : paymentMethod === 'card' ? 'KARTICA' : paymentMethod === 'cash' ? 'GOTOVINA' : paymentMethod === 'gpay' ? 'GOOGLE PAY' : 'APPLE PAY'}
                    </span>
                    <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button 
                  onClick={() => {
                    setIsConfirmed(false);
                    setTrackingDriver(null);
                    setStep('search');
                  }}
                  className="bg-white hover:bg-black hover:text-white py-3 rounded-[1.5rem] text-black font-black flex items-center justify-center space-x-2 border-2 border-black transition-all active:scale-[0.98] group/cancel"
                >
                  <svg className="w-4 h-4 group-hover/cancel:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span className="text-[10px] uppercase tracking-widest">Otkaži</span>
                </button>
                <button className="bg-black hover:bg-black/90 text-white font-black py-3 rounded-[1.5rem] flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-xl group/call">
                  <svg className="w-4 h-4 group-hover/call:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="text-[10px] uppercase tracking-widest">Nazovi</span>
                </button>
              </div>
            </div>
          )}
          {isPaymentSelectorOpen && (
            <div className="absolute inset-0 z-[200] bg-white rounded-t-[3.5rem] border-x border-t border-black/5 p-5 md:p-6 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] md:text-[18px] font-black tracking-tight">Plaćanje</h3>
                <button
                  onClick={() => setIsPaymentSelectorOpen(false)}
                  className="w-9 h-9 rounded-xl border-2 border-black flex items-center justify-center active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center bg-black/5 rounded-xl p-1 mb-4">
                <button
                  onClick={() => setAccountType('osobno')}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-black ${accountType === 'osobno' ? 'bg-white border-2 border-black' : 'text-black/60'}`}
                >
                  Osobno
                </button>
                <button
                  onClick={() => setAccountType('posao')}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-black ${accountType === 'posao' ? 'bg-white border-2 border-black' : 'text-black/60'}`}
                >
                  Posao
                </button>
              </div>

              <div className="space-y-3">
                {(!isScheduledMode) && (
                  <button
                    onClick={() => { setPaymentMethod('payparq'); setIsPaymentSelectorOpen(false); }}
                    className="w-full flex items-center justify-between p-4 border-2 border-black rounded-2xl bg-white active:scale-95 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-[9px] font-black text-white leading-none">PQ</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[13px] font-black">Payparq račun</span>
                        <span className="text-[10px] text-black/50">Saldo: €{payparqBalance.toFixed(2)}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-black/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}

                {(!isScheduledMode) && (
                  <button
                    onClick={() => { setPaymentMethod('cash'); setIsPaymentSelectorOpen(false); }}
                    className="w-full flex items-center justify-between p-4 border-2 border-black rounded-2xl bg-white active:scale-95 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 bg-black/5 rounded-lg border-2 border-black flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
                      </div>
                      <span className="text-[13px] font-black">Gotovina</span>
                    </div>
                    <svg className="w-4 h-4 text-black/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                )}

                <button
                  onClick={() => { setPaymentMethod('gpay'); setIsPaymentSelectorOpen(false); }}
                  className="w-full flex items-center justify-between p-4 border-2 border-black rounded-2xl bg-white active:scale-95 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-black/5 rounded-lg border-2 border-black flex items-center justify-center">
                      <span className="text-[10px] font-black">GPay</span>
                    </div>
                    <span className="text-[13px] font-black">Google Pay</span>
                  </div>
                  <svg className="w-4 h-4 text-black/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                <button
                  onClick={() => { setPaymentMethod('card'); setIsPaymentSelectorOpen(false); }}
                  className="w-full flex items-center justify-between p-4 border-2 border-dashed border-black rounded-2xl bg-white active:scale-95 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-black/5 rounded-lg border-2 border-black flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                    </div>
                    <span className="text-[13px] font-black">{isScheduledMode ? 'Kartica' : 'Dodaj karticu / način plaćanja'}</span>
                  </div>
                  <svg className="w-4 h-4 text-black/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>

              <button
                onClick={() => setShowPayparqInfo(!showPayparqInfo)}
                className="mt-4 text-[12px] font-bold underline underline-offset-4"
              >
                Što je Payparq račun?
              </button>
              {showPayparqInfo && (
                <div className="mt-2 text-[11px] text-black/70">
                  Payparq račun je interni novčanik za plaćanje vožnji i usluga. Možete ga nadoplatiti i koristiti kao primarni način plaćanja.
                </div>
              )}
            </div>
          )}

          {/* Calendar block removed - now uses separate /calendar page */}
        </div>
      </div>
    </div>
  );
}
