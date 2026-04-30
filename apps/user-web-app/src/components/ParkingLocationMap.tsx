'use client';

import { useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions = {
  zoom: 13,
  mapTypeControl: false,
  fullscreenControl: true,
  streetViewControl: false,
};

interface MapProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function ParkingLocationMap({ lat, lng, onLocationSelect }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);

  const onLoad = (map: any) => {
    setMap(map);
  };

  const onUnmount = () => {
    setMap(null);
  };

  const handleMapClick = (e: any) => {
    onLocationSelect(e.latLng.lat(), e.latLng.lng());
  };

  if (!isLoaded) {
    return (
      <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat, lng }}
        zoom={mapOptions.zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {lat && lng && (
          <Marker
            position={{ lat, lng }}
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
    </div>
  );
}
