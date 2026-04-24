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

const ACCENT = '#7C3AED';

const birdViewCarSVG = () =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg width="30" height="60" viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="carGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.25" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect x="2" y="4" width="36" height="72" rx="12" fill="${ACCENT}" fill-opacity="0.35" filter="url(#carGlow)"/>
      <rect x="4" y="10" width="32" height="64" rx="10" fill="black" fill-opacity="0.15" filter="blur(3px)"/>
      <rect x="4" y="6" width="32" height="68" rx="10" fill="white" stroke="#D1D5DB" stroke-width="0.5"/>
      <rect x="9" y="28" width="22" height="26" rx="4" fill="white" stroke="#F3F4F6" stroke-width="1"/>
      <path d="M12 22 C12 22 20 18 28 22 L28 28 C28 28 20 24 12 28 Z" fill="${ACCENT}" fill-opacity="0.95"/>
      <path d="M9 54 C9 54 20 58 31 54 L31 60 C31 60 20 64 9 60 Z" fill="#1F2937" fill-opacity="0.7"/>
      <rect x="7" y="30" width="2" height="22" rx="1" fill="#1F2937" fill-opacity="0.7"/>
      <rect x="31" y="30" width="2" height="22" rx="1" fill="#1F2937" fill-opacity="0.7"/>
      <path d="M12 12 Q20 9 28 12" stroke="#E5E7EB" stroke-width="1" fill="none"/>
      <path d="M12 68 Q20 71 28 68" stroke="#E5E7EB" stroke-width="1" fill="none"/>
      <rect x="6" y="8" width="7" height="4" rx="1.5" fill="#FFFBEB" fill-opacity="0.9"/>
      <rect x="27" y="8" width="7" height="4" rx="1.5" fill="#FFFBEB" fill-opacity="0.9"/>
      <rect x="6" y="70" width="7" height="3" rx="1" fill="#F87171" fill-opacity="0.8"/>
      <rect x="27" y="70" width="7" height="3" rx="1" fill="#F87171" fill-opacity="0.8"/>
    </svg>`
  );

function makePickupEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'relative w-2.5 h-2.5 flex items-center justify-center';
  el.innerHTML = `
    <div class="absolute w-2.5 h-2.5 rounded-full border-[1.5px] bg-white flex items-center justify-center shadow-sm" style="border-color:${ACCENT}">
      <div class="w-1 h-1 rounded-full" style="background:${ACCENT}"></div>
    </div>`;
  return el;
}

function makeGuestEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="width:14px;height:14px;border-radius:50%;background:${ACCENT};border:2px solid white;box-shadow:0 0 0 4px ${ACCENT}33"></div>`;
  return el;
}

function makeDriverEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:30px;height:60px;';
  const img = document.createElement('img');
  img.src = birdViewCarSVG();
  img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
  el.appendChild(img);
  return el;
}

type Props = {
  driverPos: [number, number] | null;
  pickupPos: [number, number] | null;
  guestPos: [number, number] | null;
};

export default function TrackMap({ driverPos, pickupPos, guestPos }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const guestMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeDrawnRef = useRef(false);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      guestPos ? [guestPos[1], guestPos[0]] :
      pickupPos ? [pickupPos[1], pickupPos[0]] :
      driverPos ? [driverPos[1], driverPos[0]] :
      [16.44, 43.51];

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 14,
      attributionControl: false,
      zoomControl: false,
    } as mapboxgl.MapboxOptions);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Driver marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverPos) return;
    const lngLat: [number, number] = [driverPos[1], driverPos[0]];
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(lngLat);
    } else {
      driverMarkerRef.current = new mapboxgl.Marker({ element: makeDriverEl(), anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, [driverPos]);

  // Pickup marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickupPos) return;
    const lngLat: [number, number] = [pickupPos[1], pickupPos[0]];
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLngLat(lngLat);
    } else {
      pickupMarkerRef.current = new mapboxgl.Marker({ element: makePickupEl(), anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, [pickupPos]);

  // Guest marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !guestPos) return;
    const lngLat: [number, number] = [guestPos[1], guestPos[0]];
    if (guestMarkerRef.current) {
      guestMarkerRef.current.setLngLat(lngLat);
    } else {
      guestMarkerRef.current = new mapboxgl.Marker({ element: makeGuestEl(), anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, [guestPos]);

  // Route line + fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const points: [number, number][] = [];
    if (driverPos) points.push([driverPos[1], driverPos[0]]);
    const refPos = pickupPos ?? guestPos;
    if (refPos) points.push([refPos[1], refPos[0]]);

    const drawRoute = () => {
      if (map.getLayer('route-line')) map.removeLayer('route-line');
      if (map.getSource('route')) map.removeSource('route');

      if (points.length === 2) {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: points } },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': ACCENT, 'line-width': 3, 'line-dasharray': [2, 3] },
        });
        const bounds = new mapboxgl.LngLatBounds();
        points.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      } else if (points.length === 1) {
        map.setCenter(points[0]);
        map.setZoom(15);
      }
      routeDrawnRef.current = true;
    };

    if (map.isStyleLoaded()) {
      drawRoute();
    } else {
      map.once('load', drawRoute);
    }
  }, [driverPos, pickupPos, guestPos]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
