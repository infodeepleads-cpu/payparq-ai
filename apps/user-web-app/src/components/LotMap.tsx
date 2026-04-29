'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const FALLBACK_TOKEN = 'pk.eyJ1Ijoia3phbWljIiwiYSI6ImNtbTF2MmFkOTAwbG0yc3Nld2MzaTE2dmMifQ.q4dvho0LQS1TY11pewfm1Q';
const rawToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken =
  rawToken && rawToken !== 'undefined' && rawToken !== 'null' && rawToken.length > 10
    ? rawToken
    : FALLBACK_TOKEN;

type Props = {
  lat: number;
  lng: number;
  label?: string;
  interactive?: boolean;
};

export default function LotMap({ lat, lng, label, interactive = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

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
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:#5F3DFC;
          border:3px solid white;
          box-shadow:0 4px 20px rgba(95,61,252,0.55);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="color:white;font-size:14px;font-weight:700;line-height:1;">P</span>
        </div>`;
      new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, interactive]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="absolute top-3 left-3 bg-[#5F3DFC]/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 pointer-events-none">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="white" aria-hidden="true">
          <path d="M12 2c3.9 0 7 3.1 7 7 0 5.2-7 13-7 13S5 14.2 5 9c0-3.9 3.1-7 7-7Z" />
        </svg>
        Parking mapa
      </div>
      {label && !interactive && (
        <div className="absolute bottom-3 left-3 bg-black/55 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
}
