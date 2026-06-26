'use client';

import { useEffect, useState, useRef } from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';
import { ParkingLogoCard } from '@/components/ParkingLogoCard';

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
  locativeName?: string;
}

const MAX_DISTANCE_KM = 25; // Only show lots within 25km

export function AirportParkingLots({ airport, lat, lng, airportName, locativeName }: AirportParkingLotsProps) {
  const router = useRouter();
  const { locale } = useLocale();
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
            .map((lot: any) => {
              const sevenDayPrice = (lot.dailyPrice || 0) * 7;
              return {
                id: lot.id,
                name: lot.name,
                location: lot.address || lot.name,
                rating: 4.9,
                reviewCount: 0,
                bookings: '1000+',
                description: `Secure parking at ${lot.name}. Book in advance and guarantee your spot near ${airportName}.`,
                priceFrom: sevenDayPrice > 0 ? `€${sevenDayPrice.toFixed(2)}` : 'From €2.00',
                dailyPrice: lot.dailyPrice || 0,
                badge: 'best-price-guaranteed',
                image: lot.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
                distance: lot.distance,
                slug: lot.slug,
              };
            })
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
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-black">{locale === 'hr' ? `Parking u ${locativeName || airportName}` : `Parking in ${airportName}`}</h2>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scroll-smooth"
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
            {lots.map((lot) => (
              <div key={lot.id} className="flex-shrink-0 w-full sm:w-96 snap-center">
                <ParkingLogoCard
                  listing={{
                    name: lot.name,
                    logo: lot.image,
                    photo: lot.image,
                    rating: lot.rating,
                    reviewCount: lot.reviewCount,
                    distance: lot.distance || 0,
                  }}
                  price={parseFloat(lot.priceFrom.replace('€', ''))}
                  durationLabel={locale === 'hr' ? 'Cijena za 7 dana' : 'Price for 7 days'}
                  locale={locale}
                  checkoutUrl={`/checkout?location_id=${lot.id}&lat=${lat}&lng=${lng}&name=${airportName}`}
                  onInfo={() => {}}
                  selectedDays={7}
                  durationHours={168}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
