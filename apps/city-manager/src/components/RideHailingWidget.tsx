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
    label: 'Parq GO', 
    description: 'Brzo i povoljno', 
    basePrice: 1.2, 
    multiplier: 1.0,
    capacity: 4,
    icon: uniqueParqGoSvg(BRAND_VIOLET)
  },
  parq_taxi: { 
    label: 'GO & Back', 
    description: 'Luksuzne vožnje', 
    basePrice: 2.4, 
    multiplier: 1.2,
    capacity: 4,
    icon: uniqueCarSvg(BRAND_VIOLET)
  },
  smart_arrival: { 
    label: 'Comfort', 
    description: 'Premium iskustvo', 
    basePrice: 2.5, 
    multiplier: 1.6,
    capacity: 4,
    icon: uniqueCarSvg(BRAND_VIOLET)
  },
  comfort: { 
    label: 'Comfort', 
    description: 'Premium iskustvo', 
    basePrice: 2.5, 
    multiplier: 1.5,
    capacity: 4,
    icon: uniqueCarSvg(BRAND_VIOLET)
  },
  van: { 
    label: 'Van', 
    description: 'Za grupe do 6 osoba', 
    basePrice: 3.0, 
    multiplier: 1.8,
    capacity: 6,
    icon: uniqueCarSvg(BRAND_VIOLET)
  },
  delivery: { 
    label: 'Delivery', 
    description: 'Dostava paketa', 
    basePrice: 1.0, 
    multiplier: 0.8,
    capacity: 1,
    icon: 'https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,w_552,h_368/v1559051515/assets/0c/33f272-132e-4613-92f9-717088923a41/original/Package.png'
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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
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
  const prevDriverState = useRef<{ [key: string]: { lat: number; lng: number; rotation: number } }>({});

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
    const s = 0.9 + Math.max(0, z - 14) * 0.12;
    return Math.min(1.6, Math.max(0.9, s));
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

        // If no real drivers, keep some mock ones for demo purposes
        if (drivers.length === 0) {
          const time = Date.now() / 8000; // Slower time factor for more realistic movement
          const mockDrivers = Array.from({ length: 6 }).map((_, i) => {
            // Smaller radius to keep cars in the immediate vicinity on the map
            const radius = 0.002 + (i * 0.0008);
            const angle = time + (i * (Math.PI / 3));
            // Very subtle jitter
            const jitter = Math.sin(time * 0.2 + i) * 0.0001;
            return {
              id: `mock-driver-${i}`,
              lat: location.lat + Math.sin(angle) * radius + jitter,
              lng: location.lng + Math.cos(angle) * radius + jitter,
              rotation: (angle * 180 / Math.PI) + 90
            };
          });
          setNearbyDrivers(mockDrivers);
        } else {
          setNearbyDrivers(drivers);
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
      }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 1000); // Faster refresh for smoother movement
    return () => clearInterval(interval);
  }, [location]);

  // Update other drivers markers on map
  useEffect(() => {
    if (!map.current || nearbyDrivers.length === 0) return;

    nearbyDrivers.forEach(driver => {
      if (!otherDriversMarkers.current[driver.id]) {
        const el = document.createElement("div");
        el.className = "marker-driver";
        el.style.width = "48px";
        el.style.height = "48px";
        el.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.zIndex = "10";
        el.style.pointerEvents = "none";
        el.style.willChange = "transform";
        
        const inner = document.createElement("div");
        inner.className = "marker-inner";
        inner.style.width = "100%";
        inner.style.height = "100%";
        inner.style.position = "relative";
        inner.style.transform = "perspective(600px) rotateX(55deg)";
        inner.style.transformOrigin = "50% 60%";
        inner.style.transition = "transform 0.35s ease-out";
        inner.style.willChange = "transform";
        
        // Soft ground shadow
        const shadow = document.createElement("div");
        shadow.style.position = "absolute";
        shadow.style.bottom = "-2px";
        shadow.style.left = "10%";
        shadow.style.width = "80%";
        shadow.style.height = "18px";
        shadow.style.background = "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0) 80%)";
        shadow.style.filter = "blur(1px)";
        shadow.style.transform = "translateZ(0)";
        shadow.style.pointerEvents = "none";
        
        const img = document.createElement("img");
        // Use the icon of the currently selected class to match pricing list
        img.src = RIDE_CLASSES[selectedClass].icon;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.transform = "translateZ(12px) scale(1.15)";
        img.style.willChange = "transform, filter, opacity";
        
        // Enhance for map visibility (Realistic 3D look - Branded White)
        img.style.filter = "brightness(1.03) contrast(1.12) drop-shadow(0 10px 12px rgba(0,0,0,0.45))";
        
        // Specular highlight overlay
        const shine = document.createElement("div");
        shine.style.position = "absolute";
        shine.style.top = "6px";
        shine.style.left = "20%";
        shine.style.right = "20%";
        shine.style.height = "10px";
        shine.style.borderRadius = "12px";
        shine.style.background = "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0) 100%)";
        shine.style.opacity = "0.6";
        shine.style.mixBlendMode = "screen";
        
        // Robust fallback if image fails - looks like a silver car body
        img.onerror = () => {
          img.style.display = "none";
          inner.style.background = "linear-gradient(135deg, #f0f0f0 0%, #c0c0c0 100%)";
          inner.style.borderRadius = "12px 12px 8px 8px";
          inner.style.width = "28px";
          inner.style.height = "48px";
          inner.style.margin = "auto";
          inner.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4)";
          inner.style.border = "2px solid #ffffff";
          inner.style.position = "relative";
          
          // Add "windows" to the fallback car
          const window = document.createElement("div");
          window.style.position = "absolute";
          window.style.top = "8px";
          window.style.left = "4px";
          window.style.right = "4px";
          window.style.height = "12px";
          window.style.background = "rgba(0,0,0,0.2)";
          window.style.borderRadius = "4px";
          inner.appendChild(window);
        };
        
        inner.appendChild(shadow);
        inner.appendChild(img);
        inner.appendChild(shine);
        el.appendChild(inner);

        otherDriversMarkers.current[driver.id] = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map.current!);
        
        prevDriverState.current[driver.id] = { lat: driver.lat, lng: driver.lng, rotation: driver.rotation ?? 0 };
      } else {
        const marker = otherDriversMarkers.current[driver.id];
        const el = marker.getElement();
        const inner = el.querySelector('.marker-inner') as HTMLDivElement;
        // Keep the marker icon in sync with the selected class
        const img = el.querySelector('img') as HTMLImageElement | null;
        if (img) {
          img.src = RIDE_CLASSES[selectedClass].icon;
        }
        // Compute smooth heading from previous to current
        const prev = prevDriverState.current[driver.id];
        const targetBearing = prev ? geoBearing(prev.lat, prev.lng, driver.lat, driver.lng) : (driver.rotation ?? 0);
        const currentRotation = prev ? prev.rotation : targetBearing;
        const smoothRotation = lerpAngle(currentRotation, targetBearing, 0.25);
        const scale = getMarkerScale();
        if (inner) {
          inner.style.transform = `perspective(600px) rotateX(55deg) rotate(${smoothRotation}deg) scale(${scale})`;
        }
        marker.setLngLat([driver.lng, driver.lat]);
        prevDriverState.current[driver.id] = { lat: driver.lat, lng: driver.lng, rotation: smoothRotation };
      }
    });
  }, [nearbyDrivers, selectedClass]);

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

        map.current.on('load', () => {
          console.log("Map loaded successfully");
          map.current?.resize();

          // Add 3D building layer
          const layers = map.current?.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
          )?.id;

          map.current?.addLayer(
            {
              'id': '3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 14,
              'paint': {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0, '#f2eae2',
                  50, '#dfdbd7',
                  100, '#c9c5c1'
                ],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.8
              }
            },
            labelLayerId
          );
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
    
    if (type === 'pickup') {
      el.className = 'flex flex-col items-center group cursor-pointer';
      el.innerHTML = `
        <div class="bg-white px-3 py-1 rounded-md shadow-lg border border-black/5 mb-1 flex items-center space-x-2 animate-in fade-in zoom-in duration-300">
          <span class="text-[14px] font-medium text-black">${pickupAddress.split(',')[0]}</span>
          <svg class="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </div>
        <div class="w-2.5 h-2.5 bg-black rounded-sm"></div>
      `;
    } else {
      el.className = 'flex flex-col items-center group cursor-pointer';
      el.innerHTML = `
        <div class="flex items-center mb-1 animate-in fade-in zoom-in duration-300 shadow-lg rounded-md overflow-hidden">
          <div class="bg-[#1F1F1F] text-white px-1.5 py-1 flex flex-col items-center justify-center min-w-[32px] leading-none">
            <span class="text-[10px] font-bold">4</span>
            <span class="text-[7px] font-bold uppercase tracking-tighter">MIN</span>
          </div>
          <div class="bg-white px-3 py-2 flex items-center space-x-2 border-l border-black/10">
            <span class="text-[14px] font-medium text-black">${destinationAddress.split(',')[0] || 'Odredište'}</span>
            <svg class="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
        <div class="w-4 h-4 bg-black rounded-full border-[3px] border-white shadow-md flex items-center justify-center">
          <div class="w-1 h-1 bg-white rounded-full"></div>
        </div>
      `;
    }

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
          id: routeLayerId,
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#000000',
            'line-width': 4,
            'line-opacity': 1
          }
        });

        // Ensure markers are visible and correct
        updateMarker("self", start, "pickup");
        updateMarker("destination", end, "destination");
        
        // Fit bounds with animation
        const bounds = new mapboxgl.LngLatBounds()
          .extend(start)
          .extend(end);
        
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
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
    <div className="relative w-full h-screen bg-white font-sans text-black overflow-hidden flex flex-col">
      {/* Hidden helper for Tailwind classes used in markers */}
      <div className="hidden bg-black" />

      {/* Map Section - ONLY visible on second page onwards (40% height) */}
      <div 
        ref={mapContainer} 
        className={`absolute top-0 left-0 right-0 z-0 bg-white transition-all duration-1000 ${
          step === 'search' ? 'invisible opacity-0 h-0 overflow-hidden' : 'visible opacity-100 h-[40vh]'
        }`}
      />

      {/* UI Content Layer */}
      <div className={`relative z-10 w-full h-full pointer-events-none flex flex-col ${step === 'search' ? 'bg-white' : 'bg-transparent'}`}>
        {/* Search Step - Full Screen Experience */}
        {step === 'search' && (
          <div className="absolute inset-0 flex flex-col bg-white pointer-events-auto animate-in fade-in duration-500">
            {/* Main Search Container */}
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 pt-12">
              <h1 className="text-[32px] font-black tracking-tight mb-8">Kamo idemo?</h1>
              
              <div className="bg-white rounded-[2.5rem] p-4 space-y-3 relative shadow-sm ring-1 ring-[#5B6CFF]/20">
                {/* Visual connector line */}
                <div className="absolute left-[2.35rem] top-12 bottom-12 w-[1.5px] bg-black/10 z-0" />
                
                {/* Pickup Input */}
                <div className="relative z-10 flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-black/40 bg-white ml-5 mr-4" />
                  <input 
                    value={pickupAddress}
                    onChange={(e) => handleSearch(e.target.value, 'pickup')}
                    onFocus={() => {
                      setSearchType('pickup');
                      setSearchQuery(pickupAddress);
                    }}
                    placeholder="Trenutna lokacija"
                    className="flex-1 bg-transparent py-4 text-lg font-bold placeholder-black/30 focus:outline-none"
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
                    className="flex-1 bg-transparent py-4 text-lg font-bold placeholder-black/30 focus:outline-none"
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
                        <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-black/10 transition-colors">
                          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div className="flex-1 text-left min-w-0 border-b border-black/5 pb-4">
                          <p className="font-bold text-[17px] text-black truncate">{f.text}</p>
                          <p className="text-sm text-black/40 truncate">{f.place_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-6 py-6 border-b border-black/5 mb-2">
                      <button className="flex flex-col items-center space-y-2 group">
                        <div className="w-14 h-14 bg-black/5 rounded-full flex items-center justify-center text-black group-hover:bg-black/10 transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                        <span className="text-[13px] font-bold">Kuća</span>
                      </button>
                      <button className="flex flex-col items-center space-y-2 group">
                        <div className="w-14 h-14 bg-black/5 rounded-full flex items-center justify-center text-black group-hover:bg-black/10 transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-[13px] font-bold">Posao</span>
                      </button>
                    </div>
                    {MOCK_HISTORY.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => selectHistoryItem(item)}
                        className="w-full flex items-center space-x-4 py-5 group"
                      >
                        <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-black/10 transition-colors">
                          <svg className="w-6 h-6 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1 text-left min-w-0 border-b border-black/5 pb-5">
                          <p className="font-bold text-[17px] text-black truncate">{item.name}</p>
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

      {/* Back Button */}
      {step !== 'search' && (
        <button 
          onClick={() => {
            if (isConfirmed) {
              setIsConfirmed(false);
            } else {
              setStep('search');
            }
          }}
          className="absolute top-6 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center z-[1002] active:scale-95 transition-all border-0 ring-0 outline-none"
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      )}

      {/* Floating Bottom Sheet - For Destination, Payment, Tracking */}
      <div className={`fixed bottom-0 left-0 right-0 z-[1001] flex flex-col justify-end transition-all duration-700 ${step === 'search' ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className={`bg-white pointer-events-auto transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1) shadow-[0_-30px_60px_rgba(0,0,0,0.12)] rounded-t-[3rem] p-8 pb-[19px] border-t border-black/5 h-[60vh] flex flex-col`}>
          
          {/* Destination Step Content */}
          {step === 'destination' && !isConfirmed && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-normal uppercase tracking-wider">30% POPUSTA</h2>
                <div className="bg-black/5 px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-widest opacity-60">PROMO AKTIVAN</div>
              </div>
              
              {/* Content moved from Price Step overlay below to fit into the sheet */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {(['parq_go', 'parq_taxi', 'comfort', 'van'] as RideClass[]).map((key, index) => {
                    const config = RIDE_CLASSES[key];
                    const isSelected = selectedClass === key;
                    return (
                      <button 
                        key={key}
                        onClick={() => setSelectedClass(key as RideClass)}
                        className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 bg-white ring-1 ${
                          isSelected ? 'ring-[#5B6CFF] shadow-md' : 'ring-[#5B6CFF]/20 hover:ring-[#5B6CFF]/30'
                        }`}
                      >
                        <div className="w-20 h-[76px] mr-4 flex-shrink-0 flex items-center justify-center relative z-10 bg-white rounded-xl ring-1 ring-[#5B6CFF]/18 shadow-[0_8px_18px_rgba(91,108,255,0.12)]">
                          <img 
                            src={config.icon} 
                            alt={config.label} 
                            className="w-full h-full object-contain filter drop-shadow-xl brightness-[1.05] contrast-[1.15]" 
                            onError={(e) => {
                              console.warn("Icon fallback triggered for:", config.label);
                              e.currentTarget.src = 'https://cn-geo1.uber.com/image-proc/resize/e_sharpen:70,f_png,h_192,q_high,w_192/v1/64/73f055-6804-4c67-916a-040f7d54949a/original/UberX.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">{config.label}</span>
                            <span className="text-xs text-black/40 font-bold flex items-center">
                              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                              {config.capacity}
                            </span>
                          </div>
                          <p className="text-sm text-black/50">2 min udaljenosti</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black">€{(config.basePrice * 0.7).toFixed(2)}</div>
                          <div className="text-xs text-black/30 line-through">€{config.basePrice.toFixed(2)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Payment and Confirm */}
              <div className="mt-6 space-y-4">
                {/* Scheduler Inputs (Visible when isSchedulerOpen is true) */}
                {isSchedulerOpen && (
                  <div className="flex space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 bg-white rounded-xl p-3 flex flex-col ring-1 ring-[#5B6CFF]/20">
                      <span className="text-[10px] font-black uppercase text-black/40 mb-1">Datum</span>
                      <input 
                        type="date" 
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="bg-transparent text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-3 flex flex-col ring-1 ring-[#5B6CFF]/20">
                      <span className="text-[10px] font-black uppercase text-black/40 mb-1">Vrijeme</span>
                      <input 
                        type="time" 
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-transparent text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsPaymentSelectorOpen(!isPaymentSelectorOpen)}>
                    <div className="w-8 h-5 bg-[#5B6CFF] rounded-sm flex items-center justify-center text-[8px] text-white font-bold shadow-sm">VISA</div>
                    <span className="font-bold text-sm">•••• 4242</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <div className="text-sm font-bold text-black/40">Osobno</div>
                </div>
                
                <div className="flex space-x-3 items-end">
                  <button 
                    onClick={handleConfirmRide}
                    className="flex-1 bg-[#5B6CFF] hover:bg-[#4C5BFF] text-white h-[57px] rounded-xl font-normal text-[10px] flex items-center justify-center active:scale-[0.98] transition-colors transition-transform shadow-xl uppercase tracking-widest"
                  >
                    Naruči {RIDE_CLASSES[selectedClass].label}
                  </button>
                  <button 
                    onClick={() => setIsSchedulerOpen(!isSchedulerOpen)}
                    className={`w-[57px] h-[57px] flex-none rounded-xl flex items-center justify-center transition-all bg-white ${isSchedulerOpen ? 'ring-2 ring-[#5B6CFF]' : 'ring-1 ring-[#5B6CFF]/20'}`}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Step Content */}
          {isConfirmed && (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black mb-1">Stiže za 3 min</h2>
                  <p className="text-black/50 font-bold uppercase text-xs tracking-widest">Vozač je u blizini</p>
                </div>
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 flex items-center space-x-6 mb-8 ring-1 ring-[#5B6CFF]/20">
                <div className="relative">
                  <div className="w-20 h-20 bg-black/10 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <img src={trackingDriver?.image || "https://i.pravatar.cc/150?u=1"} alt="Driver" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-black px-2 py-1 rounded-full border-2 border-white">
                    4.9 ★
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black">{trackingDriver?.name || 'Marko Jurić'}</h3>
                  <p className="text-black/60 font-medium mb-1">{trackingDriver?.car || 'Škoda Octavia • ZG-1234-PQ'}</p>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Verified Partner</span>
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
                  className="bg-white ring-1 ring-[#5B6CFF]/20 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:ring-[#5B6CFF]/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span>Otkaži</span>
                </button>
                <button className="bg-[#5B6CFF] hover:bg-[#4C5BFF] text-white py-4 rounded-2xl font-normal flex items-center justify-center space-x-2 transition-colors">
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
