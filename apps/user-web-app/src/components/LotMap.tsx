'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const FALLBACK_TOKEN = 'pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q';
const rawToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken =
  rawToken && rawToken !== 'undefined' && rawToken !== 'null' && rawToken.length > 10
    ? rawToken
    : FALLBACK_TOKEN;

type Spot = {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
  price_modifier_cents: number;
  available: boolean;
};

type BoundaryPoint = { lat: number; lng: number };

type Props = {
  lat: number;
  lng: number;
  label?: string;
  interactive?: boolean;
  locationId?: string;
  assignedSpotLabel?: string;
  boundary?: BoundaryPoint[];
};

export default function LotMap({ lat, lng, label, interactive = false, locationId, assignedSpotLabel, boundary }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    if (!locationId) return;
    fetch(`/api/spots?location_id=${encodeURIComponent(locationId)}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.spots)) setSpots(d.spots); })
      .catch(() => {});
  }, [locationId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lng, lat],
      zoom: 17.5,
      attributionControl: false,
      interactive,
      pitchWithRotate: false,
    } as mapboxgl.MapboxOptions);

    mapRef.current = map;

    map.on('load', () => {
      // Lot center pin — only show when no spot coords to avoid clutter
      if (spots.filter((s) => s.lat && s.lng).length === 0) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width:36px;height:36px;border-radius:50%;
            background:#5F3DFC;border:3px solid white;
            box-shadow:0 4px 20px rgba(95,61,252,0.55);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="color:white;font-size:14px;font-weight:700;line-height:1;">P</span>
          </div>`;
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);
      }

      // Boundary polygon
      if (boundary && boundary.length >= 3) {
        const coords = boundary.map((p) => [p.lng, p.lat] as [number, number]);
        coords.push(coords[0]); // close ring
        map.addSource('lot-boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {},
          },
        });
        map.addLayer({
          id: 'lot-boundary-fill',
          type: 'fill',
          source: 'lot-boundary',
          paint: { 'fill-color': '#5F3DFC', 'fill-opacity': 0.12 },
        });
        map.addLayer({
          id: 'lot-boundary-line',
          type: 'line',
          source: 'lot-boundary',
          paint: { 'line-color': '#5F3DFC', 'line-width': 2, 'line-opacity': 0.8 },
        });
      }

      // Spot markers
      spots.forEach((spot) => {
        if (!spot.lat || !spot.lng) return;
        const isPremium = spot.price_modifier_cents > 0;
        const isAssigned = assignedSpotLabel === spot.label;
        const color = isAssigned ? '#5F3DFC' : isPremium ? '#F59E0B' : spot.available ? '#10B981' : '#9CA3AF';
        const border = isAssigned ? 'white' : 'rgba(255,255,255,0.8)';

        const el = document.createElement('div');
        el.style.cssText = `
          width:28px;height:28px;border-radius:6px;
          background:${color};border:2px solid ${border};
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
        `;
        el.innerHTML = `<span style="color:white;font-size:9px;font-weight:700;line-height:1;">${spot.label}</span>`;

        const popup = new mapboxgl.Popup({ offset: 16, closeButton: false })
          .setHTML(`
            <div style="font-family:sans-serif;font-size:12px;padding:4px 2px;">
              <strong>${spot.label}</strong>
              ${isPremium ? `<span style="color:#F59E0B;margin-left:6px;">+${(spot.price_modifier_cents / 100).toFixed(2)} €</span>` : ''}
              <br/>
              <span style="color:${spot.available ? '#10B981' : '#9CA3AF'}">${spot.available ? 'Slobodno' : 'Zauzeto'}</span>
            </div>
          `);

        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([spot.lng, spot.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, interactive, spots, assignedSpotLabel, boundary]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="absolute top-3 left-3 bg-[#5F3DFC]/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 pointer-events-none">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="white" aria-hidden="true">
          <path d="M12 2c3.9 0 7 3.1 7 7 0 5.2-7 13-7 13S5 14.2 5 9c0-3.9 3.1-7 7-7Z" />
        </svg>
        Parking mapa
      </div>
      {spots.length > 0 && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
            <span className="text-white text-[9px] font-medium">Slobodno</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
            <span className="text-white text-[9px] font-medium">Premium</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#9CA3AF]" />
            <span className="text-white text-[9px] font-medium">Zauzeto</span>
          </div>
        </div>
      )}
      {label && !interactive && spots.length === 0 && (
        <div className="absolute bottom-3 left-3 bg-black/55 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
}
