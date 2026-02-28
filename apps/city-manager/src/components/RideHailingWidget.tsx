"use client";

import React, { useState, useEffect, useRef } from "react";
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

type FlowStep = 'search' | 'destination' | 'payment' | 'tracking' | 'reservation' | 'confirm';

type RideClass = 'parq_go' | 'parq_taxi' | 'smart_arrival' | 'comfort' | 'van' | 'delivery';

const BRAND_VIOLET = '#5B6CFF';
const parqGoIconSide = (accent: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff" />
          <stop offset="40%" style="stop-color:#f3f4f6" />
          <stop offset="100%" style="stop-color:#d1d5db" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${accent};stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:${accent};stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:${accent};stop-opacity:0.7" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>

      <!-- Ground Shadow -->
      <ellipse cx="100" cy="85" rx="85" ry="8" fill="rgba(0,0,0,0.08)" filter="blur(5px)" />
      
      <!-- Main Car Body -->
      <path d="M20 62 
               L20 55 
               Q20 48 35 45 
               L55 42 
               Q65 15 100 14 
               L150 14 
               Q180 16 190 45 
               L195 48 
               Q205 50 205 55 
               L205 62 
               Q205 65 200 65
               L25 65
               Q20 65 20 62
               Z" 
            fill="url(#bodyGrad)" 
            stroke="#e5e7eb" 
            stroke-width="0.5" 
            filter="url(#softShadow)" />
      
      <!-- Windows -->
      <path d="M70 40 
               Q78 18 105 16 
               L148 16 
               Q175 18 182 40 
               Z" 
            fill="url(#glassGrad)" />
      
      <!-- Window Reflections -->
      <path d="M85 22 Q115 18 150 22" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.3" fill="none" />
      <rect x="120" y="16" width="1.5" height="24" fill="white" opacity="0.2" />
      
      <!-- Wheels -->
      <g>
        <circle cx="55" cy="65" r="14" fill="#1f2937" />
        <circle cx="55" cy="65" r="7" fill="#4b5563" stroke="#9ca3af" stroke-width="1" />
        <circle cx="165" cy="65" r="14" fill="#1f2937" />
        <circle cx="165" cy="65" r="7" fill="#4b5563" stroke="#9ca3af" stroke-width="1" />
      </g>
      
      <!-- Lights -->
      <path d="M20 54 Q15 54 15 58 L15 60 Q15 63 20 63" fill="#fff9c4" />
      <path d="M205 54 Q210 54 210 58 L210 60 Q210 63 205 63" fill="#ffcdd2" />
    </svg>`
  );

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

const birdViewCarSVG = (accent: string = '#7C3AED') =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg width="30" height="60" viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="carGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.25" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Glow Effect -->
      <rect x="2" y="4" width="36" height="72" rx="12" fill="${accent}" fill-opacity="0.35" filter="url(#carGlow)"/>
      
      <!-- Shadow -->
      <rect x="4" y="10" width="32" height="64" rx="10" fill="black" fill-opacity="0.15" filter="blur(3px)"/>
      
      <!-- Main Body -->
      <rect x="4" y="6" width="32" height="68" rx="10" fill="white" stroke="#D1D5DB" stroke-width="0.5"/>
      
      <!-- Roof -->
      <rect x="9" y="28" width="22" height="26" rx="4" fill="white" stroke="#F3F4F6" stroke-width="1"/>
      
      <!-- Windshield (Front) - NOW VIOLET AND CENTERED -->
      <path d="M12 22 C12 22 20 18 28 22 L28 28 C28 28 20 24 12 28 Z" fill="${accent}" fill-opacity="0.95"/>
      
      <!-- Rear Window (Now simple dark) -->
      <path d="M9 54 C9 54 20 58 31 54 L31 60 C31 60 20 64 9 60 Z" fill="#1F2937" fill-opacity="0.7"/>
      
      <!-- Side Windows -->
      <rect x="7" y="30" width="2" height="22" rx="1" fill="#1F2937" fill-opacity="0.7"/>
      <rect x="31" y="30" width="2" height="22" rx="1" fill="#1F2937" fill-opacity="0.7"/>

      <!-- Hood Details -->
      <path d="M12 12 Q20 9 28 12" stroke="#E5E7EB" stroke-width="1" fill="none"/>
      
      <!-- Trunk Details -->
      <path d="M12 68 Q20 71 28 68" stroke="#E5E7EB" stroke-width="1" fill="none"/>

      <!-- Headlights -->
      <rect x="6" y="8" width="7" height="4" rx="1.5" fill="#FFFBEB" fill-opacity="0.9"/>
      <rect x="27" y="8" width="7" height="4" rx="1.5" fill="#FFFBEB" fill-opacity="0.9"/>
      
      <!-- Taillights -->
      <rect x="6" y="70" width="7" height="3" rx="1" fill="#F87171" fill-opacity="0.8"/>
      <rect x="27" y="70" width="7" height="3" rx="1" fill="#F87171" fill-opacity="0.8"/>
    </svg>`
  );

const RIDE_CLASSES: Record<RideClass, { label: string; description: string; basePrice: number; multiplier: number; icon: string; capacity: number }> = {
  parq_go: { 
    label: 'Parq Standard', 
    description: 'GO Everyday Rides', 
    basePrice: 1.2, 
    multiplier: 1.0,
    icon: '/images/standard-car.png',
    capacity: 4
  },
  parq_taxi: { 
    label: 'GO & GO', 
    description: 'GO & GO 2 Way Ride', 
    basePrice: 2.4, 
    multiplier: 1.8,
    icon: '/images/standard-car.png',
    capacity: 4
  },
  comfort: { 
    label: 'Park GO Premium', 
    description: 'Comfort & Luxury', 
    basePrice: 1.8, 
    multiplier: 1.4,
    icon: '/images/standard-car.png',
    capacity: 4
  },
  van: { 
    label: 'Parq Van', 
    description: 'Space for Groups', 
    basePrice: 3.0, 
    multiplier: 2.0,
    icon: '/images/standard-car.png',
    capacity: 6
  },
  smart_arrival: { 
    label: 'Parq GO Budget', 
    description: 'Economic Choice', 
    basePrice: 1.0, 
    multiplier: 0.8,
    capacity: 4,
    icon: '/images/standard-car.png'
  },
  delivery: { 
    label: 'Kasnije', 
    description: 'Schedule your ride', 
    basePrice: 1.0, 
    multiplier: 1.0,
    capacity: 4,
    icon: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" ry="3" /><line x1="16" y1="2" x2="16" x2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>`)
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
  const [step, setStep] = useState<FlowStep>('search');
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

    // Handle back from /map artifact
    const params = new URLSearchParams(window.location.search);
    const hasDest = !!params.get('dest_lat') || !!params.get('dest1_lat');
    if (!hasDest && step === 'search') {
      // If we are in search step but have no destination, 
      // check if we should be redirecting back to /map
      const isMapRoute = window.location.pathname === '/map';
      if (!isMapRoute) {
        // router.replace('/map');
      }
    }

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
    if (stepParam && ['search', 'destination', 'payment', 'tracking', 'reservation', 'confirm'].includes(stepParam)) {
      setStep(stepParam);
    }
  }, []);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeData, setRouteData] = useState<{ 
    distance: number; 
    duration: number;
    geometry?: {
      type: string;
      coordinates: [number, number][];
    };
  } | null>(null);
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
  const ACCENT_PURPLE = "#6D28D9"; // Match CTA color #6D28D9
  const CARD_BG = "#FFFFFF";
  const prevDriverState = useRef<{ [key: string]: { lat: number; lng: number; rotation: number } }>({});
  const fallbackStyleTried = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [sheetSnap, setSheetSnap] = useState<'collapsed' | 'expanded'>('collapsed');
  const [sheetHeight, setSheetHeight] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
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
    const s = 0.42 + Math.max(0, z - 14) * 0.06;
    return Math.min(1.1, Math.max(0.35, s));
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
          // Simulation of a moving driver near the user
          // Move car ONLY along the road path if routeData is available
          let driverPos = { lat: location.lat, lng: location.lng };
          
          if (routeData?.geometry?.coordinates && routeData.geometry.coordinates.length > 1) {
            const coords = routeData.geometry.coordinates;
            // Cycle through the actual road path
            const t = (Date.now() / 20000) % 1; // Slow down to 20s for more realism
            const exactIndex = t * (coords.length - 1);
            const index = Math.floor(exactIndex);
            const nextIndex = (index + 1) % coords.length;
            const ratio = exactIndex % 1;
            
            const [lng1, lat1] = coords[index];
            const [lng2, lat2] = coords[nextIndex];
            
            driverPos = {
              lng: lng1 + (lng2 - lng1) * ratio,
              lat: lat1 + (lat2 - lat1) * ratio
            };
          } else {
            // Stay static near user if no road path - NEVER drive on grass/Poljud
            driverPos = {
              lat: location.lat + 0.0001,
              lng: location.lng + 0.0001
            };
          }

          const oneMock = [{
            id: 'mock-driver-0',
            ...driverPos
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
    const interval = setInterval(fetchDrivers, 5000); // 5 seconds instead of 50ms to avoid rate limits and ERR_ABORTED
    return () => clearInterval(interval);
  }, [location, routeData]);

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
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.zIndex = "10";
        el.style.pointerEvents = "none";
        el.style.willChange = "transform";
        
        const inner = document.createElement("div");
        inner.className = "marker-inner";
        inner.style.width = "100%";
        inner.style.height = "100%";
        inner.style.position = "relative";
        inner.style.transformOrigin = "center center";
        inner.style.transform = "none";
        inner.style.transition = "none"; // REMOVED transform transition to fix zoom lag
        inner.style.willChange = "auto";
        
        const img = document.createElement("img");
        img.src = birdViewCarSVG('#6D28D9'); // Match darkened CTA color
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.transform = "scale(1.2)";
        img.style.willChange = "auto";
        
        // Robust fallback if image fails - looks like a silver car body
        img.onerror = () => {
          img.style.display = "none";
          inner.style.background = "#ffffff";
          inner.style.borderRadius = "4px";
          inner.style.width = "12px";
          inner.style.height = "22px";
          inner.style.margin = "auto";
          inner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          inner.style.border = "1px solid #D1D5DB";
        };
        
        inner.appendChild(img);
        el.appendChild(inner);

        otherDriversMarkers.current[driver.id] = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
          rotationAlignment: 'map',
          pitchAlignment: 'viewport'
        })
          .setLngLat([driver.lng, driver.lat])
          .setRotation(0)
          .addTo(map.current!);
        
        prevDriverState.current[driver.id] = { lat: driver.lat, lng: driver.lng, rotation: 0 };
      } else {
        const marker = otherDriversMarkers.current[driver.id];
        const el = marker.getElement();
        const inner = el.querySelector('.marker-inner') as HTMLDivElement;
        const img = el.querySelector('img') as HTMLImageElement | null;
        
        if (img) {
          img.src = birdViewCarSVG('#6D28D9');
        }

        const prevState = prevDriverState.current[driver.id];
        let rotation = prevState?.rotation || 0;

        if (prevState && (prevState.lat !== driver.lat || prevState.lng !== driver.lng)) {
          // Calculate bearing based on movement
          rotation = geoBearing(prevState.lat, prevState.lng, driver.lat, driver.lng);
        }

        if (inner && map.current) {
          marker.setRotation(rotation);
        }

        // SMOOTHLY update marker position WITHOUT CSS transitions
        // Set position directly to stay "glued" to map during scroll/zoom
        marker.setLngLat([driver.lng, driver.lat]);
        prevDriverState.current[driver.id] = { lat: driver.lat, lng: driver.lng, rotation };
      }
    });
  }, [nearbyDrivers, selectedClass]);

  useEffect(() => {
    const computeHeights = () => {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      // 248px for collapsed to fully show selected widget + payment bar + confirm button with equal 12px gaps
    const collapsed = 248; 
    const expanded = vh; // Covers the whole screen including top widget
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
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onSheetPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = dragStart.current.y - e.clientY;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const next = Math.max(120, Math.min(vh * 0.95, dragStart.current.height + dy));
    setSheetHeight(next);
    
    // Dynamically switch snap state during drag for better visual feedback
    const collapsed = 228;
    const expanded = vh; // Covers the whole screen including top widget
    const mid = (collapsed + expanded) / 2;
    if (next > mid && sheetSnap !== 'expanded') setSheetSnap('expanded');
    if (next <= mid && sheetSnap !== 'collapsed') setSheetSnap('collapsed');
  };

  const onSheetPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const collapsed = 228;
    const expanded = vh; // Covers the whole screen including top widget
    const mid = (collapsed + expanded) / 2;
    const snap = sheetHeight > mid ? 'expanded' : 'collapsed';
    setSheetSnap(snap);
    setSheetHeight(snap === 'collapsed' ? collapsed : expanded);
    dragStart.current = null;
    setIsDragging(false);
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
          style: "mapbox://styles/mapbox/light-v11",
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

        // Update map state
        map.current.on('error', (e) => {
          const err: any = e as any;
          const msg = err?.error?.message || err?.message || err;
          console.error("Mapbox error event:", msg);
          if (!fallbackStyleTried.current && typeof msg === 'string' && /style/i.test(msg)) {
            fallbackStyleTried.current = true;
            try {
              map.current?.setStyle("mapbox://styles/mapbox/light-v11");
            } catch {}
          }
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
    
    // Use consistent keys to prevent duplicates
    const markerKey = type === 'pickup' ? 'self' : 'destination';
    
    if (driverMarkers.current[markerKey]) {
      driverMarkers.current[markerKey].remove();
    }

    const el = document.createElement("div");
    // Set explicit dimensions to ensure perfect centering with anchor: 'center'
    el.className = 'group cursor-pointer relative w-2.5 h-2.5 flex items-center justify-center';
    
    const displayTime = arrivalTimeStr || '23:04';

    if (type === 'pickup') {
      // Pickup ONLY has the bullseye, NO cloud label (removed "Poljud" cloud)
      el.innerHTML = `
        <div class="absolute w-2.5 h-2.5 rounded-full border-[1.5px] border-[#7C3AED] bg-white flex items-center justify-center shadow-sm">
          <div class="w-1 h-1 rounded-full bg-[#7C3AED]"></div>
        </div>
      `;
    } else {
      // Destination has the "Arrive [time]" cloud label
      el.innerHTML = `
        <!-- Cloud Label - Positioned absolutely above the marker -->
        <div class="absolute bottom-full mb-3 px-3 py-1.5 rounded-full bg-white shadow-xl border border-black/5 flex items-center justify-center transform transition-transform group-hover:scale-105 whitespace-nowrap pointer-events-none">
          <span class="text-[13px] font-light text-black">Arrive ${displayTime}</span>
        </div>
        <!-- Bullseye Marker -->
        <div class="absolute w-2.5 h-2.5 rounded-full border-[1.5px] border-[#7C3AED] bg-[#7C3AED] flex items-center justify-center shadow-sm">
          <div class="w-[7px] h-[7px] rounded-full border-[1.5px] border-[#7C3AED] bg-white flex items-center justify-center">
            <div class="w-0.5 h-0.5 rounded-full bg-[#7C3AED]"></div>
          </div>
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

    driverMarkers.current[markerKey] = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
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
        
        // Use the exact start and end points of the route geometry for markers
        // This ensures the markers are perfectly aligned with the route line
        const snappedPickup = route[0];
        const snappedDestination = route[route.length - 1];

        console.log(`Route fetched: ${distance}km, ${duration}min`);
        setRouteData({ 
          distance: data.distance, 
          duration: data.duration,
          geometry: data.geometry
        });
        
        setEtaMinutes(duration);
        const arrival = new Date(Date.now() + data.duration * 1000);
        const arrivalStr = arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        setArrivalTimeStr(arrivalStr);
        
        // Update markers to be exactly on the route endpoints
        updateMarker("pickup", snappedPickup, "pickup", pickupAddress);
        updateMarker("destination", snappedDestination, "destination", destinationAddress);
        
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
              'line-width': 9,
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
              'line-width': 4.5,
              'line-opacity': 1,
              'line-blur': 0
            }
          });
          
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
    }
  }, [searchParams]);

  useEffect(() => {
    const hasDest =
      !!searchParams.get("dest_lat") ||
      !!searchParams.get("dest1_lat") ||
      !!searchParams.get("dest2_lat") ||
      !!searchParams.get("dest3_lat");
    if (!hasDest) {
      const params = new URLSearchParams();
      const pLat = searchParams.get("pickup_lat");
      const pLng = searchParams.get("pickup_lng");
      const pName = searchParams.get("pickup_name");
      if (pLat && pLng) {
        params.set("pickup_lat", pLat);
        params.set("pickup_lng", pLng);
      }
      if (pName) params.set("pickup_name", pName);
      if (typeof window !== "undefined" && window.location.pathname === "/rides") {
        router.replace(params.toString() ? `/map?${params.toString()}` : "/map");
      }
    }
  }, [router, searchParams]);

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
    <div className="relative w-full h-[100dvh] bg-white font-sans text-black overflow-hidden flex flex-col scroll-smooth">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[10000] bg-black/20 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center border border-black/5 scale-90 md:scale-100">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 border-2 border-black/5 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-black text-[15px] font-normal tracking-tight">Tražimo vozača...</h3>
          </div>
        </div>
      )}

      {/* Routing overlay */}
      {isRouting && (
        <div className="absolute inset-0 z-[9999] bg-white/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
          <div className="bg-white text-black px-5 py-2.5 rounded-2xl flex items-center space-x-3 shadow-lg border border-black/5">
            <div className="w-3 h-3 border-2 border-black/10 border-t-black rounded-full animate-spin" />
            <span className="font-normal text-[12px] tracking-tight">Računamo rutu...</span>
          </div>
        </div>
      )}

      {/* Hidden helper for Tailwind classes used in markers */}
      <div className="hidden bg-white" />

      {/* Map Section - background */}
      <div 
        ref={mapContainer} 
        className={`fixed inset-0 z-0 bg-white transition-all duration-300 ${
          step === 'search' ? 'invisible opacity-0' : 'visible opacity-100'
        }`}
        style={{ backfaceVisibility: 'hidden', willChange: 'transform', filter: 'brightness(1.08) saturate(0.85) contrast(1.02)' }}
      />

      {/* UI Content Layer */}
      <div className={`relative z-10 w-full h-full pointer-events-none flex flex-col ${step === 'search' ? 'bg-white' : 'bg-transparent'}`}>
        {/* Global Header */}
        <div className={`w-full z-[1003] pointer-events-auto flex-shrink-0 transition-all duration-300 bg-white ${step === 'search' ? '' : 'border-b border-black/10 shadow-[0_15px_50px_rgba(0,0,0,0.08)] px-2'}`}>
          <div className={`relative transition-all duration-300 ${
            step === 'search' 
              ? 'w-full h-auto flex flex-col items-center justify-center' 
              : 'w-full px-2 h-[1.3cm] flex items-center justify-between'
          }`}>

            {step !== 'search' && (
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
            
            {step !== 'search' && (
              <div className="flex-1 flex items-center justify-center space-x-1.5 px-2 overflow-hidden">
                <span className="text-[14px] font-medium text-[#6D28D9] truncate min-w-0 shrink">
                  {pickupAddress.split(',')[0]}
                </span>
                
                {/* Arrow to first destination */}
                <svg className="w-3 h-3 text-black/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>

                <span className="text-[14px] font-light text-black truncate min-w-0 shrink">
                  {destinationAddress.split(',')[0]}
                </span>

                {/* Additional destinations */}
                {extraDestinations.map((dest, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 shrink-0 min-w-0">
                    <svg className="w-3 h-3 text-black/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-[13px] font-light text-black truncate min-w-0 shrink">
                      {dest.name.split(',')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {step !== 'search' && (
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

        {/* Search Step Content */}
        {step === 'search' && (
          <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pointer-events-auto bg-white min-h-screen">
            <div className="flex items-center w-full px-4 py-3 border-b border-black/5 bg-white sticky top-0 z-10">
              <button
                onClick={() => router.push('/' as any)}
                className="mr-3 p-1.5 -ml-1 hover:bg-black/5 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex items-center flex-1 bg-white border border-black/10 rounded-xl px-3 py-1.5 shadow-sm">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kamo?"
                  className="w-full bg-transparent text-[16px] font-normal placeholder-black/30 focus:outline-none text-black"
                />
              </div>
            </div>

            {/* Suggestions / Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
              {searchQuery.length > 0 ? (
                searchResults.length > 0 ? (
                  searchResults.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => selectSearchResult(item)}
                      className="w-full flex items-center p-3 rounded-2xl hover:bg-[#7C3AED]/[0.02] transition-all border border-transparent hover:border-[#7C3AED]/10 group"
                    >
                      <div className="w-10 h-10 bg-[#7C3AED]/5 rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#7C3AED]/10 transition-colors">
                        <svg className="w-4 h-4 text-[#7C3AED]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[14px] font-light text-black tracking-tight">{item.name}</span>
                        <span className="text-[11px] font-light text-black/30 truncate max-w-[250px] tracking-wide">{item.address}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-black/10">
                    <svg className="w-10 h-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-[11px] font-normal uppercase tracking-widest">Nema rezultata</span>
                  </div>
                )
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="px-2">
                    <span className="text-[10px] font-normal uppercase tracking-[0.15em] text-black/20">Popularno</span>
                  </div>
                  <div className="space-y-0.5">
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
                        className="w-full flex items-center p-3 rounded-2xl hover:bg-[#7C3AED]/[0.02] transition-all border border-transparent hover:border-[#7C3AED]/10 group"
                      >
                        <div className="w-10 h-10 bg-[#7C3AED]/5 rounded-xl flex items-center justify-center mr-4 group-hover:bg-[#7C3AED]/10 transition-colors">
                          <svg className="w-4 h-4 text-[#7C3AED]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-[14px] font-light text-black tracking-tight">{item.name}</span>
                          <span className="text-[11px] font-light text-black/30 truncate max-w-[250px] tracking-wide">{item.address}</span>
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

      <div className={`fixed bottom-0 left-0 right-0 z-[9999] flex flex-col justify-end transition-all duration-500 ${step === 'search' ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        {isAIBooking && (
          <div className="mb-[-20px] z-[10000] relative px-6">
            <div className="bg-black h-[38px] rounded-t-2xl flex items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.2)] relative border-x-[3px] border-t-[3px] border-black px-4">
              <div className="flex items-center space-x-3 w-full justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0"></div>
                <div className="flex items-center space-x-2 overflow-hidden">
                  <span className="text-[12px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap">10% AI PROMO APPLIED</span>
                  {arrivalTimeStr && (
                    <span className="text-[12px] font-black text-white uppercase tracking-[0.15em] whitespace-nowrap bg-white/20 px-2 py-0.5 rounded-md">
                      Arrive {arrivalTimeStr}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

          <div
            ref={sheetRef}
            className={`fixed bottom-0 left-0 right-0 bg-white pointer-events-auto transition-all shadow-[0_-15px_50px_rgba(0,0,0,0.1)] rounded-t-[1.5rem] border-t border-black/10 px-2 pt-0 flex flex-col antialiased z-[1005] ${isDragging ? 'duration-0' : 'duration-700'}`}
            style={{ height: `${sheetHeight}px`, paddingBottom: 'calc(max(4px, env(safe-area-inset-bottom)))', transform: 'translateZ(0)' }}
          >
          <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[40px] h-[4px] bg-black/40 rounded-full cursor-grab active:cursor-grabbing hover:bg-black/60 transition-colors shrink-0 z-10" onPointerDown={onSheetPointerDown} onPointerMove={onSheetPointerMove} onPointerUp={onSheetPointerUp} />
          
          <div className="h-[12px] shrink-0"></div>
          
          {/* Destination Step Content */}
          {step === 'destination' && !isConfirmed && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div 
                className={`flex-1 overflow-y-auto custom-scrollbar ${sheetSnap === 'collapsed' ? 'overflow-hidden pt-1' : 'space-y-2'}`}
                onPointerDown={onSheetPointerDown} 
                onPointerMove={onSheetPointerMove} 
                onPointerUp={onSheetPointerUp}
              >
                {(['parq_go', 'parq_taxi', 'comfort', 'van', 'smart_arrival', 'delivery'] as RideClass[])
                  .filter(key => sheetSnap === 'expanded' || key === selectedClass)
                  .map((key, index) => {
                  const config = RIDE_CLASSES[key];
                  const isSelected = selectedClass === key;
                  const isParqGo = key === 'parq_go';
                  return (
                    <React.Fragment key={key}>
                      <button 
                        onClick={() => {
                          setSelectedClass(key);
                          if (key === 'delivery') router.push('/calendar' as any);
                        }}
                        className={`w-full flex items-center justify-between transition-all duration-300 rounded-2xl group relative overflow-hidden ${
                          isSelected 
                            ? 'h-[3.0cm] bg-white border-[3px] border-[#6D28D9] shadow-lg px-2 py-[0.1cm]' 
                            : 'h-[1.5cm] px-2 py-[0.1cm] bg-white border-2 border-transparent hover:bg-black/[0.02]'
                        }`}
                      >
                        {isSelected ? (
                          // Expanded State (Selected)
                          <div className="flex items-center w-full justify-between">
                            <div className="w-32 h-16 flex items-center justify-center ml-[0.3cm]">
                              <img 
                                src={config.icon} 
                                alt={config.label} 
                                className="w-full h-full object-contain scale-125 contrast-[1.12] brightness-[1.04] saturate-[1.05] antialiased" 
                                style={{ imageRendering: 'auto' }}
                              />
                            </div>
                            
                              <div className="flex flex-col items-end space-y-0.5 mr-[0.2cm]">
                               <div className="flex items-center space-x-2 leading-none">
                                  <h3 className="text-[14px] font-light text-black leading-none tracking-tight">
                                  {config.label}
                                </h3>
                                  <div className="flex items-center text-black/60 leading-none">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                      <circle cx="9" cy="7" r="4" />
                                    </svg>
                                    <span className="ml-0.5 text-[11px] font-bold tracking-tight leading-none">{config.capacity}</span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end leading-none">
                                  {isLoadingEstimate ? (
                                    <div className="w-3 h-3 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                                  ) : (() => {
                                    const base = getClassPrice(key as RideClass);
                                    if (base == null) return <span className="text-[13px] font-medium text-black/5 tracking-tight leading-none">—</span>;
                                    const discounted = isAIBooking ? base * 0.9 : base;
                                    return (
                                      <span className="text-[14px] font-light text-black leading-none tracking-tight">
                                      €{discounted.toFixed(2)}
                                    </span>
                                    );
                                  })()}
                                </div>
  
                                <span className="text-[11px] text-black/60 font-light leading-none tracking-tight">
                                  {etaMinutes != null ? `${etaMinutes} min` : '— min'}
                                  {arrivalTimeStr ? (
                                    <>
                                      {' • '}
                                      <span className="font-light">{arrivalTimeStr}</span>
                                    </>
                                  ) : ''}
                                </span>
                              </div>
                          </div>
                        ) : (
                          // Normal State (Not Selected)
                          <>
                            <div className="flex items-center space-x-3 ml-[0.2cm]">
                              <div className="w-16 h-8 flex items-center justify-center overflow-hidden">
                                <img 
                                  src={config.icon} 
                                  alt={config.label} 
                                  className="w-full h-full object-contain contrast-[1.1] brightness-[1.03] saturate-[1.02] antialiased" 
                                />
                              </div>
                              <div className="flex flex-col items-start leading-none justify-center mt-[-1px]">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-[13px] font-light text-black leading-none tracking-tight">
                                      {config.label}
                                    </h3>
                                    <div className="flex items-center text-black/60">
                                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                      </svg>
                                      <span className="ml-0.5 text-[10px] font-bold tracking-tight">{config.capacity}</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-black/60 mt-[-3px] font-light leading-none tracking-tight">
                                     {etaMinutes != null ? `${etaMinutes} min` : '— min'}
                                     {arrivalTimeStr ? (
                                       <>
                                         {' • '}
                                         <span className="font-light">{arrivalTimeStr}</span>
                                       </>
                                     ) : ''}
                                   </span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end mr-[0.2cm]">
                              {isLoadingEstimate ? (
                                <div className="w-3 h-3 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                              ) : (() => {
                                const base = getClassPrice(key as RideClass);
                                if (base == null) return <span className="text-[13px] font-medium text-black/5 tracking-tight">—</span>;
                                const discounted = isAIBooking ? base * 0.9 : base;
                                return (
                                  <div className="flex flex-col items-end">
                                    {isAIBooking && (
                                      <span className="text-[9px] line-through text-black/20 tracking-tight">
                                        €{base.toFixed(2)}
                                      </span>
                                    )}
                                    <span className="text-[15px] font-light text-black tracking-tight">
                                      €{discounted.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </>
                        )}
                      </button>
                      {index === 2 && (
                        <div className="w-[38px] h-1 bg-black/10 rounded-full mx-auto my-1" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* World-Class Payment & Action Bar */}
              <div className={`w-full h-px bg-black/10 ${sheetSnap === 'collapsed' ? 'mt-[12px] mb-1' : 'mb-1'}`} />
              <div className="h-[38px] flex items-center justify-between px-4 border-2 border-black/10 rounded-2xl bg-white mb-1">
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    router.push(`/payment?${params.toString()}` as any);
                  }}
                  className="flex items-center space-x-2 active:scale-95 transition-all group bg-transparent border-0 shadow-none outline-none ring-0 focus:ring-0"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {paymentMethod === 'card' && (
                      <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    )}
                    {paymentMethod === 'cash' && (
                      <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                    {paymentMethod === 'gpay' && <span className="text-[8px] font-medium">GPay</span>}
                    {paymentMethod === 'apay' && <span className="text-[8px] font-medium">Pay</span>}
                    {paymentMethod === 'payparq' && (
                      <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                        <span className="text-[7px] font-medium text-white leading-none">PQ</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[13px] font-medium text-black group-hover:text-black/70 transition-colors">
                    {paymentMethod === 'payparq' ? 'Payparq' : paymentMethod === 'card' ? 'Visa •••• 4242' : paymentMethod === 'cash' ? 'Gotovina' : paymentMethod === 'gpay' ? 'Google Pay' : 'Apple Pay'}
                  </span>
                  <svg className="w-3.5 h-3.5 text-black group-hover:text-black/70 transition-colors ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                <div className="flex items-center space-x-4">
                  {isAIBooking && (
                    <div className="flex items-center space-x-1.5 bg-black text-white px-2 py-0.5 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                      <span className="text-[9px] font-medium uppercase tracking-wider">-10% AI</span>
                    </div>
                  )}
                  <button 
                    onClick={() => router.push('/calendar' as any)}
                    className="flex items-center space-x-1.5 active:scale-95 transition-all group bg-transparent border-0 shadow-none outline-none ring-0 focus:ring-0"
                  >
                    <svg className="w-[18px] h-[18px] text-black group-hover:text-black/70 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" />
                    </svg>
                    <span className="text-[13px] font-medium text-black group-hover:text-black/70 transition-colors">Schedule</span>
                  </button>
                </div>
              </div>

                <button 
                  onClick={handleConfirmRide}
                  className="w-full bg-[#6D28D9] text-white h-[44px] rounded-full flex items-center justify-center space-x-2 hover:bg-[#5B21B6] transition-all active:scale-[0.98] relative overflow-hidden group ring-0 focus:ring-0 shadow-none border-none"
                >
                  <span className="text-[15px] font-bold tracking-tight">Odaberi {RIDE_CLASSES[selectedClass].label}</span>
                </button>
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
                  <img src={RIDE_CLASSES[selectedClass].icon} alt="Car Icon" className="w-full h-full object-contain contrast-[1.15] brightness-[1.06] saturate-[1.08] antialiased" />
                </div>
              </div>

              {/* Driver Card */}
              <div className="bg-white rounded-[1.5rem] p-3 flex items-center space-x-3 mb-3 shadow-[0_15px_35px_rgba(0,0,0,0.1)] border-2 border-black relative overflow-hidden group">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-xl overflow-hidden border-2 border-black shadow-lg group-hover:scale-105 transition-transform duration-500">
                    <img src={trackingDriver?.image || "https://i.pravatar.cc/150?u=1"} alt="Driver" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-md">
                    {trackingDriver?.rating || '4.9'} ★
                  </div>
                </div>
                <div className="flex-1 relative z-10 min-w-0">
                  <h3 className="text-[14px] font-black text-black tracking-tight mb-0.5 truncate">{trackingDriver?.name || 'Marko Jurić'}</h3>
                  <p className="text-black/50 text-[10px] font-bold mb-1 truncate tracking-tight">{trackingDriver?.car || 'Škoda Octavia • ZG-1234-PQ'}</p>
                  <div className="flex items-center space-x-1.5">
                    <div className="px-1.5 py-0.5 bg-black text-white rounded-md text-[7px] font-black uppercase tracking-widest whitespace-nowrap">Verified Partner</div>
                  </div>
                </div>
              </div>

              {/* High-Fidelity Action Row (Share & Safety) */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button className="flex items-center justify-center space-x-2 py-2.5 bg-white border-2 border-black hover:bg-black hover:text-white rounded-xl transition-all group active:scale-95">
                  <svg className="w-3.5 h-3.5 text-black group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest">Podijeli</span>
                </button>
                <button className="flex items-center justify-center space-x-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all group active:scale-95">
                  <svg className="w-3.5 h-3.5 text-red-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Sigurnost</span>
                </button>
              </div>

              {/* Price & Payment Summary */}
              <div className="bg-black text-white rounded-[1.5rem] p-4 flex items-center justify-between mb-4 shadow-xl border-2 border-black group/price hover:scale-[1.02] transition-all">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Ukupna cijena</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-[18px] font-bold">€{getClassPrice(selectedClass)?.toFixed(2)}</span>
                    <span className="text-[10px] font-medium text-white/40">Fixed</span>
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
                  className="bg-white hover:bg-black hover:text-white py-3 rounded-[1.5rem] text-black font-black flex items-center justify-center space-x-2 border-2 border-black transition-all active:scale-[0.98] group"
                >
                  <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span className="text-[10px] uppercase tracking-widest">Otkaži</span>
                </button>
                <button className="bg-black hover:bg-black/90 text-white font-black py-3 rounded-[1.5rem] flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-xl group">
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
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
