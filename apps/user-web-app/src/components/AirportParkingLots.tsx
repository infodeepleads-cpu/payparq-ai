'use client';

import { useEffect, useState } from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';

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
  airport: string;
  lat: number;
  lng: number;
  airportName: string;
}

const MAX_DISTANCE_KM = 25; // Only show lots within 25km

export function AirportParkingLots({ airport, lat, lng, airportName }: AirportParkingLotsProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);

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
              badge: 'best-price-guaranteed',
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
    router.push(`/checkout?location_id=${lot.id}&lat=${lat}&lng=${lng}&name=${airportName}`);
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

      <section className="w-full px-6 md:px-12 py-16 border-b border-black/10 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">{locale === 'hr' ? `Parking u ${airportName}` : `Parking in ${airportName}`}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {lots.map((lot) => (
              <div key={lot.id} className="bg-white border border-black/8 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center">
                {/* Logo */}
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center mb-4 flex-shrink-0 border border-black/10 overflow-hidden">
                  {lot.image && (
                    <img
                      src={lot.image}
                      alt={lot.name}
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                </div>

                {/* Name */}
                <h3 className="font-bold text-black text-base mb-2 line-clamp-2">{lot.name}</h3>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 mb-3">
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

                {/* Divider */}
                <div className="w-full h-px bg-black/8 mb-3" />

                {/* Distance + Features (compact) */}
                <div className="text-xs text-black/70 space-y-1 mb-4 flex-1">
                  {lot.distance !== undefined && (
                    <p className="flex items-center justify-center gap-1">
                      <MapPin size={12} className="flex-shrink-0" />
                      {locale === 'hr' ? `Većina čeka ${Math.round(lot.distance * 12)} min` : `Most people wait ${Math.round(lot.distance * 12)} min`}
                    </p>
                  )}
                  <p>✓ {locale === 'hr' ? 'Natkrivena garaža' : 'Covered Garage'}</p>
                  <p>✓ {locale === 'hr' ? 'Bez ograničenja veličine' : 'No max. height'}</p>
                  <p>✓ {locale === 'hr' ? 'Nemojte zadržavati ključeve' : 'Do Not Keep Keys'}</p>
                  <p>✓ {locale === 'hr' ? 'Prosljeđivanje automobila' : 'Hand in car keys'}</p>
                  <p className="font-semibold mt-2">{locale === 'hr' ? 'Otvoreno 7-24' : 'Open 7-24'}</p>
                </div>

                {/* Price */}
                <div className="w-full mb-4 pb-4 border-t border-black/8">
                  <p className="text-xs text-black/50 font-semibold mb-1 uppercase tracking-wider">{locale === 'hr' ? 'Cijena za 7 dana' : 'Price for 7 days'}</p>
                  <p className="text-2xl font-bold text-black">{lot.priceFrom}</p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleBookNow(lot as any)}
                  className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 active:scale-95 transition text-sm shadow-sm hover:shadow-md"
                >
                  {locale === 'hr' ? 'Nastavi na Checkout' : 'Proceed to Checkout'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
