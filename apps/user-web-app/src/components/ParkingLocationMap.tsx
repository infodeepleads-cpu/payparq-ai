'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Navigation, Plus, Minus } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  zoom: 17,
  mapTypeControl: false,
  fullscreenControl: true,
  streetViewControl: false,
};

interface MapProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
  fullScreen?: boolean;
}

export default function ParkingLocationMap({ lat, lng, onLocationSelect, fullScreen = false }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const [map, setMap] = useState<any>(null);
  const [locating, setLocating] = useState(false);
  const [zoom, setZoom] = useState(17);
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !window.google || !lat || !lng) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    if (!circleRef.current) {
      circleRef.current = new window.google.maps.Circle({
        center: { lat, lng },
        radius: 50,
        map: map,
        fillColor: '#5F3DFC',
        fillOpacity: 0.1,
        strokeColor: '#5F3DFC',
        strokeOpacity: 0.6,
        strokeWeight: 2,
      });
    } else {
      circleRef.current.setCenter({ lat, lng });
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, lat, lng]);

  const onLoad = (map: any) => {
    setMap(map);
  };

  const onUnmount = () => {
    setMap(null);
  };

  const handleMapClick = (e: any) => {
    onLocationSelect(e.latLng.lat(), e.latLng.lng());
  };

  const handleCurrentLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationSelect(latitude, longitude);
          if (map) {
            map.panTo({ lat: latitude, lng: longitude });
            map.setZoom(17);
            setZoom(17);
          }
          setLocating(false);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          alert('Unable to get your location. Please enable location access.');
          setLocating(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setLocating(false);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 1, 21);
    setZoom(newZoom);
    if (map) map.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 1, 0);
    setZoom(newZoom);
    if (map) map.setZoom(newZoom);
  };

  if (!isLoaded) {
    return (
      <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }} className="rounded-lg overflow-hidden border border-gray-300 relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat, lng }}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {lat && lng && (
          <Marker
            position={{ lat, lng }}
            draggable={true}
            onDragEnd={(e) => {
              const newLat = e.latLng?.lat();
              const newLng = e.latLng?.lng();
              if (newLat !== undefined && newLng !== undefined) {
                onLocationSelect(newLat, newLng);
              }
            }}
            icon={{
              path: 'M0,-28c-7.7,0 -14,6.3 -14,14c0,10.5 14,28 14,28s14,-17.5 14,-28c0,-7.7 -6.3,-14 -14,-14z',
              fillColor: '#5F3DFC',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
              scale: 1.2,
            }}
          />
        )}
      </GoogleMap>

      {/* Zoom Controls */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-white border border-gray-300 rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
          title="Zoom in"
        >
          <Plus className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white border border-gray-300 rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
          title="Zoom out"
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Current Location Button */}
      <button
        onClick={handleCurrentLocation}
        disabled={locating}
        className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-2.5 shadow-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        title="Use current location"
      >
        <Navigation className={`w-5 h-5 text-gray-700 ${locating ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
