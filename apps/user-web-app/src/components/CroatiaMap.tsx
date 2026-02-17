'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

type Hub = {
  id: string;
  name: string;
  label: string;
  href: string;
  lat: number;
  lng: number;
  location_id?: string;
  priceLabel?: string;
};

const croatiaBounds = L.latLngBounds([42.1, 13.5], [46.6, 19.5]);

const blackLogoPinIcon = new L.DivIcon({
  className: '',
  html: `
    <span style="
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:18px;height:18px;border-radius:50%;
      background: linear-gradient(135deg, #020617, #0b0f1a);
      border:2px solid #ffffff;
      box-shadow: 0 6px 16px rgba(2,6,23,0.50), 0 0 0 1px rgba(0,0,0,0.25);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    ">
      <span style="
        display:flex;align-items:center;justify-content:center;
        width:14px;height:14px;border-radius:50%;
        border:1px solid rgba(255,255,255,0.4);
      ">
        <span style="color:#ffffff;font-size:7px;font-weight:700;line-height:1;">P</span>
      </span>
    </span>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function CroatiaMap({ hubs }: { hubs: ReadonlyArray<Hub> }) {
  const center = useMemo(() => ({ lat: 45, lng: 16 }), []);
  const [isTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={center}
        zoom={6}
        maxBounds={croatiaBounds}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#05020A' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />
        {hubs.map(hub => {
          const hasCoords = typeof hub.lat === 'number' && typeof hub.lng === 'number' && hub.lat !== 0 && hub.lng !== 0;
          if (!hasCoords) return null;
          const premiumPriceLabel = hub.priceLabel || '€';
          return (
            <Marker
              key={hub.id}
              position={[hub.lat, hub.lng]}
              icon={blackLogoPinIcon}
            >
              {isTouch ? (
                <Popup offset={[0, -8]} closeButton>
                  <div className="text-xs rounded-xl border border-white/10 bg-[#05020A] text-white p-3 shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{hub.name}</div>
                        <div className="text-white/70">{hub.label}</div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-semibold border border-black/20">
                        {premiumPriceLabel}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Link href={hub.href} className="text-[11px] font-semibold text-white underline-offset-2 hover:underline">
                        View hub
                      </Link>
                    </div>
                  </div>
                </Popup>
              ) : (
                <Tooltip direction="top" offset={[0, -12]} opacity={1} interactive sticky>
                  <div className="text-xs rounded-xl border border-white/10 bg-[#05020A]/95 text-white p-3 shadow-md pointer-events-auto">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{hub.name}</div>
                        <div className="text-white/70">{hub.label}</div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-semibold border border-black/20">
                        {premiumPriceLabel}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Link href={hub.href} className="text-[11px] font-semibold text-white underline-offset-2 hover:underline">
                        View hub
                      </Link>
                    </div>
                  </div>
                </Tooltip>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
