'use client';

import { MapPin } from 'lucide-react';
import { NEARBY_PLACES } from '@/data/nearbyPlaces';

interface NearbyPlace {
  name: string;
  distance: number;
  lat: number;
  lng: number;
  type?: string;
  image?: string;
}

interface NearbyPlacesProps {
  locationName: string;
  locationKey?: string;
  nearbyPlaces?: NearbyPlace[];
}

export function NearbyPlaces({ locationName, locationKey, nearbyPlaces }: NearbyPlacesProps) {
  // Use provided nearbyPlaces or fetch from data file using locationKey
  const places = nearbyPlaces || (locationKey && NEARBY_PLACES[locationKey]) || [];

  if (!places || places.length === 0) return null;

  const handleOpenMaps = (place: NearbyPlace) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.lat},${place.lng},15z`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: locationName,
            nearbyPlaces: places.map((place: NearbyPlace) => ({
              '@type': 'Place',
              name: place.name,
              geo: {
                '@type': 'GeoCoordinates',
                latitude: place.lat,
                longitude: place.lng,
              },
              distance: {
                '@type': 'Distance',
                unitCode: 'KMT',
                value: place.distance,
              },
            })),
          }),
        }}
      />

      <section className="w-full px-6 md:px-12 py-16 bg-white border-b border-black/10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-black mb-3">
              What's Nearby
            </h2>
            <p className="text-lg text-black/70">
              Discover attractions near <strong>{locationName}</strong>.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left: Places List */}
            <div className="space-y-3">
              {places.map((place, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenMaps(place)}
                  className="w-full text-left p-4 rounded-lg border border-black/10 hover:border-black/30 hover:bg-black/2 transition group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black text-sm mb-1.5 group-hover:text-black/80 transition">
                        {place.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-black/60">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span>{place.distance} km away</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-black/40 group-hover:text-black/70 transition">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: 4 photos — bottom-left 2, upper-right 2 */}
            <div className="relative h-96 grid grid-cols-2 gap-3">
              {/* Left column — photos sit at the bottom half */}
              <div className="flex flex-col gap-3">
                <div className="flex-1" /> {/* spacer pushes photos down */}
                {places.slice(0, 2).map((place, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenMaps(place)}
                    className="group relative overflow-hidden rounded-xl cursor-pointer h-40"
                    title={place.name}
                  >
                    <img
                      src={place.image || 'https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=300&h=300&fit=crop'}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  </button>
                ))}
              </div>
              {/* Right column — photos sit at the top half */}
              <div className="flex flex-col gap-3">
                {places.slice(2, 4).map((place, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenMaps(place)}
                    className="group relative overflow-hidden rounded-xl cursor-pointer h-40"
                    title={place.name}
                  >
                    <img
                      src={place.image || 'https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=300&h=300&fit=crop'}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  </button>
                ))}
                <div className="flex-1" /> {/* spacer fills bottom */}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-10 p-6 rounded-xl bg-black/5">
            <p className="text-sm text-black/60">
              <strong>Tip:</strong> Distances are shown in kilometres. Click any location or photo to open it in Google Maps and get directions from {locationName}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
