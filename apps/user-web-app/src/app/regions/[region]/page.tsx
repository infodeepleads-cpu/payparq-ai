'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { getRegionBySlug, REGION_CONFIG } from '@/lib/regionMap';
import { MapPin, Star } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  canonical_slug: string;
  rate_per_hour: number | null;
  capacity: number | null;
  review_score: number | null;
  review_count: number | null;
}

interface PageProps {
  params: Promise<{ region: string }>;
}

export default function RegionPage({ params }: PageProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Record<string, Location[]>>({});
  const [region, setRegion] = useState<string>('');
  const [regionData, setRegionData] = useState<[string, typeof REGION_CONFIG[keyof typeof REGION_CONFIG]] | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setRegion(resolvedParams.region);
      const data = getRegionBySlug(resolvedParams.region);
      setRegionData(data);

      try {
        const response = await fetch('/api/listings');
        const responseData = await response.json();

        if (responseData.locations && Array.isArray(responseData.locations)) {
          setLocations(responseData.locations as Location[]);

          const groupByCity = (responseData.locations as Location[]).reduce((acc: Record<string, Location[]>, loc) => {
            const city = loc.address?.split(',')[0]?.trim() || 'Unknown';
            if (!acc[city]) acc[city] = [];
            acc[city].push(loc);
            return acc;
          }, {});

          setGrouped(groupByCity);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </main>
        <FooterBrand />
      </div>
    );
  }

  if (!regionData) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Region Not Found</h1>
            <Link href="/locations" className="text-blue-600 hover:underline">
              Back to All Locations
            </Link>
          </div>
        </main>
        <FooterBrand />
      </div>
    );
  }

  const [code, config] = regionData;

  const avgPrice = locations.length > 0
    ? (locations.reduce((sum, loc) => sum + (loc.rate_per_hour || 0), 0) / locations.length).toFixed(2)
    : '2.50';

  const avgReview = locations.filter(l => l.review_score).length > 0
    ? (locations.filter(l => l.review_score).reduce((sum, loc) => sum + (loc.review_score || 0), 0) / locations.filter(l => l.review_score).length).toFixed(1)
    : '4.8';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Parking ${config.name}`,
    description: `Browse all parking locations in ${config.name}. Secure parking with AI monitoring.`,
    url: `https://www.payparq.com/regions/${config.slug}`,
    geo: {
      '@type': 'Country',
      name: config.name,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: locations.length,
      itemListElement: locations.slice(0, 10).map((loc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: loc.name,
        url: `https://www.payparq.com/locations/${loc.canonical_slug}`,
        image: undefined,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="min-h-screen bg-white flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-gray-50 to-white pt-12 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {config.label}
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Pronađite i rezervirajte parkirno mjesto u {config.name}
              </p>
              <p className="text-base text-gray-500 mb-8">
                {locations.length} dostupnih lokacija • AI nadzor 24/7 • Instant rezervacija bez ulaznica
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Dostupne lokacije</p>
                  <p className="text-3xl font-bold text-gray-900">{locations.length}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Prosječna cijena</p>
                  <p className="text-3xl font-bold text-gray-900">€{avgPrice}/hr</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Prosječna ocjena</p>
                  <div className="flex items-center gap-1">
                    <p className="text-3xl font-bold text-gray-900">{avgReview}</p>
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Sigurnost</p>
                  <p className="text-3xl font-bold text-green-600">✓ 24/7</p>
                </div>
              </div>

              <Link
                href="/search"
                className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Pronađi Parkiranje
              </Link>
            </div>
          </section>

          {/* Cities Grid */}
          {!loading && Object.keys(grouped).length > 0 && (
            <section className="px-4 py-12">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Parkiranje po Gradovima
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(grouped)
                    .sort(([, a], [, b]) => b.length - a.length)
                    .slice(0, 12)
                    .map(([city, cityLocs]) => (
                      <div
                        key={city}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-900">{city}</h3>
                          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                            {cityLocs.length}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Parkirnih mjesta dostupnih u {city}
                        </p>

                        {/* Top 3 Locations in City */}
                        <ul className="space-y-3 mb-4">
                          {cityLocs.slice(0, 3).map((loc) => (
                            <li key={loc.id}>
                              <Link
                                href={`/locations/${loc.canonical_slug}`}
                                className="text-sm text-blue-600 hover:underline flex items-start gap-2"
                              >
                                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                                <span className="flex-1">{loc.name}</span>
                                {loc.rate_per_hour && <span className="font-semibold text-gray-900">€{loc.rate_per_hour.toFixed(2)}</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>

                        {cityLocs.length > 3 && (
                          <Link
                            href={`/search?city=${city}`}
                            className="text-sm text-blue-600 hover:underline font-semibold"
                          >
                            Pogledaj svih {cityLocs.length} lokacija →
                          </Link>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Info Section */}
          <section className="bg-gray-50 px-4 py-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Zašto PayParq u {config.name}?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-3">🔒</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Potpuna Sigurnost</h3>
                  <p className="text-gray-600">
                    AI nadzor svih parkova 24/7. Sve vozilo je osigurano od krađe i oštećenja.
                  </p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-3">⚡</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Rezervacija</h3>
                  <p className="text-gray-600">
                    Bez ulaznica, bez čekanja. Rezervirajte na mobitel u 10 sekundi.
                  </p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-3">💰</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Najbolje Cijene</h3>
                  <p className="text-gray-600">
                    Konkurentne cijene sa mogućnošću mjesečnih paketa i popusta.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gray-900 text-white px-4 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Počnite s PayParqom</h2>
              <p className="text-lg text-gray-300 mb-8">
                Pronađite najperfektnije parkirno mjesto u {config.name} u svega nekoliko klikova.
              </p>
              <Link
                href="/search"
                className="inline-block px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Pretraži Parkiranje Sada
              </Link>
            </div>
          </section>
        </main>
        <FooterBrand />
      </div>
    </>
  );
}
