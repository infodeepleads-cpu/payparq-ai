"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const FALLBACK_TOKEN = "pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q";
const rawToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string | undefined;
mapboxgl.accessToken = rawToken && rawToken !== "undefined" && rawToken !== "null" && rawToken.length > 10 ? rawToken : FALLBACK_TOKEN;

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [originLabel, setOriginLabel] = useState<string>("Učitavanje lokacije...");
  const [destinations, setDestinations] = useState([
    { id: "d1", query: "", suggestions: [] as any[], coords: null as { lat: number; lng: number } | null }
  ]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | "hospital" | "sport" | "landmark" | "shopping" | "beach">("all");

  useEffect(() => {
    const action = searchParams.get('action');
    const pLat = searchParams.get('pickup_lat');
    const pLng = searchParams.get('pickup_lng');
    const pName = searchParams.get('pickup_name');
    const dLat = searchParams.get('dest_lat');
    const dLng = searchParams.get('dest_lng');
    const dName = searchParams.get('dest_name');

    if (pLat && pLng) {
      setOrigin({ lat: parseFloat(pLat), lng: parseFloat(pLng) });
      if (pName) setOriginLabel(pName);
    }

    if (dLat && dLng) {
      const existingDest = {
        id: "d1",
        query: dName || "",
        suggestions: [],
        coords: { lat: parseFloat(dLat), lng: parseFloat(dLng) }
      };
      
      if (action === 'add_destination') {
        setDestinations([
          existingDest,
          { id: "d2", query: "", suggestions: [], coords: null }
        ]);
      } else {
        setDestinations([existingDest]);
      }
    } else if (action === 'add_destination') {
      addDestination();
    }
  }, [searchParams]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const SPLIT_POPULAR = [
    { id: "p1", name: "Zračna luka Split", address: "Kaštela", lat: 43.5389, lng: 16.2980, cat: "landmark" },
    { id: "p2", name: "Trajektna luka Split", address: "Obala kneza Domagoja", lat: 43.5042, lng: 16.4426, cat: "landmark" },
    { id: "p3", name: "Poljud", address: "Stadion Poljud", lat: 43.5204, lng: 16.4316, cat: "sport" },
    { id: "p4", name: "Riva", address: "Obala Hrvatskog narodnog preporoda", lat: 43.5074, lng: 16.4400, cat: "landmark" },
    { id: "p5", name: "Dioklecijanova palača", address: "Kraj Sv. Ivana", lat: 43.5081, lng: 16.4402, cat: "landmark" },
    { id: "p6", name: "Marjan", address: "Marjan Park", lat: 43.5110, lng: 16.4066, cat: "landmark" },
    { id: "p7", name: "Mall of Split", address: "Ul. Josipa Jovića 93", lat: 43.5111, lng: 16.4752, cat: "shopping" },
    { id: "p8", name: "City Center one", address: "Vukovarska ul. 207", lat: 43.5135, lng: 16.4952, cat: "shopping" },
    { id: "p9", name: "Žnjan Beach", address: "Žnjan", lat: 43.5025, lng: 16.4704, cat: "beach" },
    { id: "p10", name: "Meštrovićev Kaštilac", address: "Šetalište Ivana Meštrovića", lat: 43.5072, lng: 16.4086, cat: "landmark" },
    { id: "p11", name: "Zapadna Obala", address: "Obala kneza Branimira", lat: 43.5061, lng: 16.4328, cat: "landmark" },
    { id: "p12", name: "Gripe", address: "Sportski centar Gripe", lat: 43.5068, lng: 16.4568, cat: "sport" }
  ];

  const popularNearby = useMemo(() => {
    if (origin && origin.lat > 43.4 && origin.lat < 43.6 && origin.lng > 16.2 && origin.lng < 16.6) {
      return SPLIT_POPULAR;
    }
    return SPLIT_POPULAR;
  }, [origin]);

  const filteredPopular = useMemo(() => {
    if (category === "all") return popularNearby;
    return popularNearby.filter((d: any) => d.cat === category);
  }, [popularNearby, category]);

  const showAddressesPanel = (() => {
    const d = destinations[0];
    return !!(d && d.query && d.query.trim().length > 0 && Array.isArray(d.suggestions) && d.suggestions.length > 0);
  })();

  // Hide global header/sidebar for this page
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('toggle-layout', { detail: true }));
    }
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('toggle-layout', { detail: false }));
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || typeof window === "undefined") return;
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [16.4401, 43.5186],
        zoom: 14,
        attributionControl: false
      });
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setOrigin(coords);
          setOriginLabel("Moja lokacija");
          if (mapRef.current) {
            mapRef.current.setCenter([coords.lng, coords.lat]);
            mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 15 });
          }
        },
        () => {
          setOriginLabel("Odaberi polazište");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timeouts: { [key: string]: NodeJS.Timeout } = {};

    destinations.forEach((dest) => {
      if (!dest.query || dest.query.trim().length === 0) {
        if (dest.suggestions.length > 0) {
          setDestinations(prev => prev.map(d => d.id === dest.id ? { ...d, suggestions: [] } : d));
        }
        return;
      }

      const fetchSuggestions = async () => {
        setLoadingId(dest.id);
        try {
          const prox = origin ? `&proximity=${origin.lng},${origin.lat}` : "";
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(dest.query)}.json?autocomplete=true&limit=8${prox}&access_token=${mapboxgl.accessToken}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const json = await res.json();
          if (!active) return;
          setDestinations(prev => prev.map(d => d.id === dest.id ? { ...d, suggestions: Array.isArray(json.features) ? json.features : [] } : d));
        } catch {
          // ignore
        } finally {
          if (active) setLoadingId(null);
        }
      };

      timeouts[dest.id] = setTimeout(fetchSuggestions, 300);
    });

    return () => {
      active = false;
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, [destinations.map(d => d.query).join("|"), origin]);

  const addDestination = () => {
    if (destinations.length >= 3) return; // limit to 3 for now
    setDestinations([...destinations, { id: Math.random().toString(36).substr(2, 9), query: "", suggestions: [], coords: null }]);
  };

  const handleSwap = () => {
    if (destinations.length === 0) return;
    const firstDest = destinations[0];
    const oldOriginLabel = originLabel;
    const oldOriginCoords = origin;

    setOriginLabel(firstDest.query || "Odabrana lokacija");
    setOrigin(firstDest.coords);

    setDestinations(prev => [
      {
        ...prev[0],
        query: oldOriginLabel === "GPS lokacija" || oldOriginLabel === "Moja lokacija" ? "Moja lokacija" : oldOriginLabel,
        coords: oldOriginCoords,
        suggestions: []
      },
      ...prev.slice(1)
    ]);
  };

  const handleChoose = (destId: string, feat: any) => {
    if (!feat || !feat.center) return;
    const [lng, lat] = feat.center;
    const placeName = feat.place_name.split(",")[0];
    
    setDestinations((prev: any[]) => {
      const updatedDestinations = prev.map((d: any) => d.id === destId ? { ...d, query: placeName, coords: { lat, lng }, suggestions: [] } : d);
      
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        new mapboxgl.Marker().setLngLat([lng, lat]).addTo(mapRef.current);
      }

      // Prebaci na rides stranicu s parametrima
      const params = new URLSearchParams();
      
      // Uvijek šalji polazište ako postoji
      if (origin) {
        params.set('pickup_lat', origin.lat.toString());
        params.set('pickup_lng', origin.lng.toString());
        params.set('pickup_name', originLabel);
      }

      // Šalji sve odabrane destinacije
      updatedDestinations.forEach((d, index) => {
        if (d.coords) {
          params.set(`dest${index + 1}_lat`, d.coords.lat.toString());
          params.set(`dest${index + 1}_lng`, d.coords.lng.toString());
          params.set(`dest${index + 1}_name`, d.query);
        }
      });

      // Backward compatibility for single destination
      if (lat && lng) {
        params.set('dest_lat', lat.toString());
        params.set('dest_lng', lng.toString());
        params.set('dest_name', placeName);
      }

      router.push(`/rides?${params.toString()}`);
      return updatedDestinations;
    });
  };

  return (
    <div className="relative w-full h-screen bg-white">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-white rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1000] flex flex-col border-t border-black/5">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2" style={{ height: "1cm" }}>
            <button
              onClick={() => router.back()}
              className="p-2 w-9 h-9 text-black hover:opacity-60 transition-opacity active:scale-95 bg-gray-100 rounded-full shrink-0 focus:outline-none focus:ring-0 outline-none ring-0"
              aria-label="Natrag"
            >
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="bg-transparent pl-2">
              <h1 className="text-black text-[16px] font-bold leading-[calc(1cm-4px)]">Odaberi destinaciju</h1>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-black/5">
              <div className="space-y-3">
              <div className="flex items-center justify-between h-[40px]">
                <div className="relative flex items-center rounded-xl border border-black/10 bg-white shadow-sm h-full flex-1 pl-[44px] mr-[6px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  </div>
                  <div className="font-bold text-[14px] truncate flex-1">{originLabel}</div>
                </div>
                <button
                  onClick={addDestination}
                  className="ml-1 w-9 h-9 rounded-xl flex items-center justify-center bg-white text-black hover:opacity-70 transition-all active:scale-95 border border-black/10 shadow-sm shrink-0 focus:outline-none focus:ring-0 outline-none ring-0"
                  aria-label="Dodaj odredište"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>

              {destinations.map((dest, idx) => (
                <div key={dest.id} className="space-y-2">
                  <div className="flex items-center justify-between h-[40px]">
                  <div className="relative flex items-center rounded-xl border border-black/10 bg-white shadow-sm h-full flex-1 pl-[44px] mr-[6px]">
                      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        value={dest.query}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDestinations((prev: any[]) => prev.map((d: any) => d.id === dest.id ? { ...d, query: val } : d));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && dest.suggestions.length > 0) {
                            handleChoose(dest.id, dest.suggestions[0]);
                          }
                        }}
                        placeholder={idx === 0 ? "Upiši adresu" : `Dodatno odredište ${idx + 1}`}
                        className="flex-1 pl-0 pr-10 rounded-xl border-none bg-white focus:outline-none text-[14px] font-bold h-full min-w-0"
                      />
                      {dest.query && dest.query.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDestinations((prev: any[]) => prev.map((d: any) => d.id === dest.id ? { ...d, query: "", suggestions: [] } : d));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black text-white hover:opacity-70 focus:outline-none flex items-center justify-center z-10"
                          aria-label="Obriši unos"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {idx === 0 ? (
                      <button
                        onClick={handleSwap}
                        className="ml-1 w-9 h-9 rounded-xl flex items-center justify-center bg-white text-black hover:opacity-70 transition-all active:scale-95 group shrink-0 border border-black/10 shadow-sm focus:outline-none focus:ring-0 outline-none ring-0"
                        aria-label="Zamijeni lokacije"
                      >
                        <svg className="w-5 h-5 group-active:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => setDestinations((prev: any[]) => prev.filter((d: any) => d.id !== dest.id))}
                        className="ml-1 w-9 h-9 rounded-xl flex items-center justify-center bg-white text-red-600 hover:opacity-70 transition-all active:scale-95 shrink-0 border border-black/10 shadow-sm focus:outline-none focus:ring-0 outline-none ring-0"
                        aria-label="Ukloni odredište"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                  
                  {idx !== 0 && dest.suggestions.length > 0 && (
                    <div className="mt-1 max-h-48 overflow-auto bg-white rounded-xl border border-black/5 shadow-md">
                      {dest.suggestions.map((f: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleChoose(dest.id, f)}
                          className="w-full text-left px-3 py-2 hover:bg-black hover:text-white transition-colors focus:outline-none"
                        >
                          <div className="text-[13px] font-bold truncate">{f.place_name?.split(",")[0]}</div>
                          <div className="text-[10px] font-bold truncate opacity-70">{f.place_name?.split(",").slice(1).join(",")}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-black/5 shadow-sm">
              <div className="flex items-center space-x-2 mb-2 pl-2">
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span className="text-[12px] font-bold text-black uppercase tracking-wider">{showAddressesPanel ? "Adrese" : "Popularno"}</span>
              </div>
              {showAddressesPanel ? (
                <div className="grid grid-cols-1 gap-1">
                  {destinations[0].suggestions.map((f: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleChoose(destinations[0].id, f)}
                      className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-black hover:text-white transition-colors focus:outline-none border-0"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="text-[14px] font-bold truncate">{f.place_name?.split(",")[0]}</div>
                        <div className="text-[11px] font-medium truncate opacity-60">{f.place_name?.split(",").slice(1).join(",")}</div>
                      </div>
                      <div className="text-[12px] font-black shrink-0">
                        {origin && Array.isArray(f.center) && f.center.length >= 2
                          ? `${calculateDistance(origin.lat, origin.lng, f.center[1], f.center[0]).toFixed(1)} km`
                          : "— km"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {filteredPopular.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        const firstEmpty = destinations.find(d => !d.query) || destinations[0];
                        handleChoose(firstEmpty.id, {
                          place_name: `${d.name}, ${d.address}`,
                          center: [d.lng, d.lat]
                        });
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-black hover:text-white transition-colors focus:outline-none border-0"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="text-[14px] font-bold truncate">{d.name}</div>
                        <div className="text-[11px] font-medium truncate opacity-60">{d.address}</div>
                      </div>
                      <div className="text-[12px] font-black shrink-0">
                        {origin ? `${calculateDistance(origin.lat, origin.lng, d.lat, d.lng).toFixed(1)} km` : "— km"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

