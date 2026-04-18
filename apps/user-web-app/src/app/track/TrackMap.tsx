'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  driverPos: [number, number] | null;   // [lat, lng]
  pickupPos: [number, number] | null;
  accent: string;
  isShuttle: boolean;
};

function makeDotIcon(color: string, size = 16) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 0 0 3px ${color}44"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeBusIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <rect x="1" y="8" width="22" height="10" rx="2"/><path d="M5 18v2M19 18v2"/><path d="M1 12h22"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function makeCarIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="17" r="3"/><circle cx="7" cy="17" r="3"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function TrackMap({ driverPos, pickupPos, accent, isShuttle }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = pickupPos ?? driverPos ?? [43.5, 16.4];
    mapRef.current = L.map(containerRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update driver marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!driverPos) return;

    const icon = isShuttle ? makeBusIcon(accent) : makeCarIcon(accent);
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(driverPos).setIcon(icon);
    } else {
      driverMarkerRef.current = L.marker(driverPos, { icon }).addTo(map);
    }
  }, [driverPos, accent, isShuttle]);

  // Update pickup marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickupPos) return;

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng(pickupPos);
    } else {
      pickupMarkerRef.current = L.marker(pickupPos, { icon: makeDotIcon('#22c55e', 14) }).addTo(map);
    }
  }, [pickupPos]);

  // Draw dashed route line and fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const points: [number, number][] = [];
    if (driverPos) points.push(driverPos);
    if (pickupPos) points.push(pickupPos);

    if (points.length === 2) {
      routeLineRef.current = L.polyline(points, {
        color: accent,
        weight: 2,
        opacity: 0.6,
        dashArray: '6 8',
      }).addTo(map);
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [driverPos, pickupPos, accent]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
