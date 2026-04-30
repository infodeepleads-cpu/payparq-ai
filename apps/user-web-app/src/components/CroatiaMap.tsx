'use client';

import { useState } from 'react';
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api';

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

const LIBRARIES: ('places')[] = ['places'];

const MAP_OPTIONS = {
  zoom: 6,
  scrollwheel: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  restriction: {
    latLngBounds: { north: 47.5, south: 41.0, east: 20.5, west: 12.5 },
    strictBounds: false,
  },
} as const;

export default function CroatiaMap({ hubs }: { hubs: ReadonlyArray<Hub> }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [isTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });
  const [activeHub, setActiveHub] = useState<string | null>(null);

  if (!isLoaded) {
    return <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#05020A]" />;
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: 45, lng: 16 }}
        zoom={6}
        options={MAP_OPTIONS}
        onClick={() => setActiveHub(null)}
      >
        {hubs.map((hub) => {
          const hasCoords = typeof hub.lat === 'number' && typeof hub.lng === 'number' && hub.lat !== 0 && hub.lng !== 0;
          if (!hasCoords) return null;
          const isActive = activeHub === hub.id;
          const premiumPriceLabel = hub.priceLabel || '€';

          return (
            <OverlayView
              key={hub.id}
              position={{ lat: hub.lat, lng: hub.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
            >
              <div
                style={{ position: 'relative', cursor: 'pointer' }}
                onMouseEnter={() => !isTouch && setActiveHub(hub.id)}
                onMouseLeave={() => !isTouch && setActiveHub(null)}
                onClick={(e) => { e.stopPropagation(); isTouch && setActiveHub(isActive ? null : hub.id); }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #020617, #0b0f1a)',
                  border: '2px solid #ffffff',
                  boxShadow: '0 6px 16px rgba(2,6,23,0.50), 0 0 0 1px rgba(0,0,0,0.25)',
                }}>
                  <span style={{ color: '#ffffff', fontSize: '7px', fontWeight: '700', lineHeight: '1' }}>P</span>
                </span>

                {isActive && (
                  <div style={{
                    position: 'absolute', bottom: '26px', left: '50%',
                    transform: 'translateX(-50%)', zIndex: 10,
                    pointerEvents: isTouch ? 'auto' : 'none',
                  }}>
                    <div style={{
                      fontSize: '12px', borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(5,2,10,0.95)', color: 'white',
                      padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      whiteSpace: 'nowrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{hub.name}</div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{hub.label}</div>
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '4px 10px', borderRadius: '9999px',
                          background: 'white', color: 'black',
                          fontSize: '11px', fontWeight: '600',
                          border: '1px solid rgba(0,0,0,0.2)',
                        }}>
                          {premiumPriceLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </OverlayView>
          );
        })}
      </GoogleMap>
    </div>
  );
}
