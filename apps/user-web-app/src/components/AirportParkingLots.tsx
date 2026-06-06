'use client';

import { useEffect, useState, useRef } from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ParkingLot {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  bookings: string;
  description: string;
  priceFrom: string;
  badge?: string;
  image?: string;
  distance?: number;
  slug?: string;
}

interface AirportParkingLotsProps {
  airport: 'split' | 'zadar' | 'zagreb' | 'dubrovnik';
  lat: number;
  lng: number;
  airportName: string;
}

const MAX_DISTANCE_KM = 25; // Only show lots within 25km

export function AirportParkingLots({ airport, lat, lng, airportName }: AirportParkingLotsProps) {
  const router = useRouter();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNearbyLots = async () => {
      try {
        const res = await fetch(`/api/airport/nearby-lots?lat=${lat}&lng=${lng}`);
        const { lots: apiLots } = await res.json();

        if (apiLots && apiLots.length > 0) {
          const lotsWithDetails = apiLots
            .map((lot: any) => ({
              id: lot.id,
              name: lot.name,
              location: lot.address || lot.name,
              rating: 4.9,
              reviewCount: Math.floor(Math.random() * 200) + 50,
              bookings: '1000+',
              description: `Secure parking at ${lot.name}. Book in advance and guarantee your spot near ${airportName}.`,
              priceFrom: lot.dailyPrice > 0 ? `€${lot.dailyPrice.toFixed(2)}/day` : 'From €2.00/day',
              badge: 'Best price guaranteed',
              image: lot.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
              distance: lot.distance,
              slug: lot.slug,
            }))
            // Filter: only show lots within MAX_DISTANCE_KM
            .filter((lot: ParkingLot) => lot.distance === undefined || lot.distance <= MAX_DISTANCE_KM);

          setLots(lotsWithDetails);
        }
      } catch (error) {
        console.error('Failed to fetch parking lots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyLots();
  }, [lat, lng, airportName]);

  if (loading) {
    return (
      <section className="w-full px-6 md:px-12 py-16 border-b border-black/10 bg-white">
        <div className="max-w-4xl mx-auto h-64 bg-gray-100 rounded-lg animate-pulse" />
      </section>
    );
  }

  if (!lots.length) return null;

  const handleBookNow = (lot: ParkingLot & { slug?: string }) => {
    if (lot.slug) {
      router.push(`/locations/${lot.slug}`);
    } else {
      router.push(`/search?lat=${lat}&lng=${lng}&name=${airportName}&source=airport`);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const minPrice = Math.min(...lots.map(l => {
    const price = parseFloat(l.priceFrom.replace('€', ''));
    return isNaN(price) ? 0 : price;
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Premium Parking near ${airportName}`,
            description: `Reserve premium parking spaces near ${airportName}. Guaranteed spots with instant confirmation.`,
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'EUR',
              lowPrice: minPrice.toFixed(2),
              highPrice: minPrice.toFixed(2),
              offerCount: lots.length,
              availability: 'https://schema.org/InStock',
            },
            itemListElement: lots.map((lot, idx) => ({
              '@type': 'Place',
              position: idx + 1,
              name: lot.name,
              description: lot.description,
              address: {
                '@type': 'PostalAddress',
                streetAddress: lot.location,
              },
              ratingValue: lot.rating,
              reviewCount: lot.reviewCount,
            })),
          }),
        }}
      />

      <section className="w-full px-6 md:px-12 py-16 border-b border-black/10 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-black/50 mb-2 font-semibold">Premium Parking</p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">Guaranteed Spots Near {airportName}</h2>
            </div>
            <p className="text-base text-black/60 max-w-2xl">Secure your parking space at premium locations. Instant confirmation, best prices guaranteed, and exceptional service.</p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-black/80 transition shadow-sm flex-shrink-0">←</button>
            <div className="overflow-hidden flex-1">
              <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {lots.map((lot) => (
                  <div key={lot.id} className="flex-shrink-0 w-96 bg-white border border-black/8 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col">
                    {/* Image */}
                    <div className="h-48 overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={lot.image}
                        alt={lot.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1 min-h-0">
                      <div className="flex-1 min-h-0">
                        <h3 className="font-semibold text-black text-lg mb-1.5">{lot.name}</h3>
                        <p className="text-xs text-black/60 flex items-center gap-2 mb-3">
                          <MapPin size={14} className="flex-shrink-0" />
                          {lot.location}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-black/8">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                className={i < Math.floor(lot.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-black text-xs">{lot.rating}</span>
                          <span className="text-xs text-black/50">({lot.reviewCount})</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-black/70 mb-3 leading-relaxed line-clamp-2">{lot.description}</p>

                        {/* Badge */}
                        {lot.badge && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full mb-3">
                            <span className="text-xs font-semibold text-green-700">{lot.badge}</span>
                          </div>
                        )}
                      </div>

                      {/* Price & CTA - Always at bottom */}
                      <div className="pt-4 border-t border-black/8 mt-auto flex-shrink-0">
                        <p className="text-xs text-black/50 font-semibold mb-2 uppercase tracking-wider">From</p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xl font-bold text-black whitespace-nowrap">{lot.priceFrom}</p>
                          <button
                            onClick={() => handleBookNow(lot as any)}
                            className="bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-black/90 active:scale-95 transition text-xs shadow-sm hover:shadow-md flex-shrink-0"
                          >
                            Reserve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-black/80 transition shadow-sm flex-shrink-0">→</button>
          </div>
        </div>
      </section>
    </>
  );
}
