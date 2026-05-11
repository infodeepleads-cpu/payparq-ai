'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { FooterBrand } from '@/components/FooterBrand';
import { MapPin, Star, AlertCircle } from 'lucide-react';

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
  params: Promise<{ city: string }>;
}

export default function CityGuidePage({ params }: PageProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>('');

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setCity(resolvedParams.city);

      try {
        const response = await fetch('/api/listings');
        const data = await response.json();

        if (data.locations && Array.isArray(data.locations)) {
          const filtered = (data.locations as Location[]).filter(
            (loc) => loc.address?.toLowerCase().includes(resolvedParams.city.replace(/-/g, ' ').toLowerCase())
          );
          setLocations(filtered.sort((a, b) => (b.review_score || 0) - (a.review_score || 0)));
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  const cityName = city.replace(/-/g, ' ');
  const cityTitle = cityName.charAt(0).toUpperCase() + cityName.slice(1);

  const avgPrice = locations.length > 0
    ? (locations.reduce((sum, loc) => sum + (loc.rate_per_hour || 0), 0) / locations.length).toFixed(2)
    : '2.50';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Koliko košta parkiranje u ${cityTitle}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Prosječna cijena parkiranje u ${cityTitle} je €${avgPrice}/sat na PayParqu. Cijene variraju ovisno o lokaciji i vremenu.`,
        },
      },
      {
        '@type': 'Question',
        name: `Gdje mogu parkirati u ${cityTitle}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `PayParq ima ${locations.length} dostupnih lokacija u ${cityTitle}. Sve su osigurane sa AI nadzorem.`,
        },
      },
      {
        '@type': 'Question',
        name: `Je li parkiranje u ${cityTitle} sigurno?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Svi PayParq parkovi u ${cityTitle} imaju AI nadzor i 24/7 sigurnost. Vozila su osigurana od krađe i oštećenja.`,
        },
      },
      {
        '@type': 'Question',
        name: `Mogu li rezervirati parkiranje unaprijed u ${cityTitle}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Da, sve lokacije u ${cityTitle} dozvoljavaju unaprijed rezervaciju. Možete rezervirati do 30 dana unaprijed.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="min-h-screen bg-white flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-blue-50 to-white pt-12 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Parkiranje {cityTitle} - Kompletan Vodič
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Pronađite i rezervirajte sigurno parkirno mjesto u {cityTitle}
              </p>
              <p className="text-base text-gray-500">
                {locations.length} dostupnih lokacija • AI nadzor 24/7 • Od €{avgPrice}/sat
              </p>
            </div>
          </section>

          {/* Quick Facts */}
          <section className="bg-blue-50 px-4 py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Dostupne lokacije</p>
                <p className="text-3xl font-bold text-gray-900">{locations.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Prosječna cijena</p>
                <p className="text-3xl font-bold text-blue-600">€{avgPrice}/sat</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Kapacitet</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(locations.reduce((sum, loc) => sum + (loc.capacity || 0), 0)).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Sigurnost</p>
                <p className="text-2xl font-bold text-green-600">✓ 24/7</p>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="px-4 py-12">
            <div className="max-w-4xl mx-auto">
              {/* Top Locations */}
              {!loading && locations.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">
                    Najbolje Lokacije u {cityTitle}
                  </h2>
                  <div className="space-y-4">
                    {locations.slice(0, 10).map((loc, index) => (
                      <Link
                        key={loc.id}
                        href={`/locations/${loc.canonical_slug}`}
                        className="block border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-xl font-bold text-gray-400 w-8 text-center">{index + 1}</span>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{loc.name}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {loc.address}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold text-blue-600">€{loc.rate_per_hour?.toFixed(2) || 'N/A'}</p>
                            <p className="text-xs text-gray-500">/sat</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {loc.review_score && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="font-semibold text-gray-900">{loc.review_score.toFixed(1)}</span>
                              <span className="text-gray-500">({loc.review_count || 0} ocjena)</span>
                            </div>
                          )}
                          {loc.capacity && (
                            <span className="text-gray-500">
                              Kapacitet: {loc.capacity} mjesta
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  {locations.length > 10 && (
                    <div className="mt-8 text-center">
                      <Link
                        href={`/search?city=${cityName}`}
                        className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                      >
                        Pogledaj svih {locations.length} Lokacija
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Tips Section */}
              <div className="mb-12 bg-amber-50 border border-amber-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Savjeti za Parkiranje u {cityTitle}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-l-4 border-amber-600 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Rezervirajte Unaprijed</h3>
                    <p className="text-gray-700 text-sm">
                      Rezervacija unaprijed osigurava vam najbolje lokacije i dostupnost. Možete rezervirati do 30 dana unaprijed.
                    </p>
                  </div>
                  <div className="border-l-4 border-amber-600 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Mjesečni Paketi</h3>
                    <p className="text-gray-700 text-sm">
                      Za česte korisnike, mjesečni paketi nude popuste do 40%. Odličnog za dnevne dokumice.
                    </p>
                  </div>
                  <div className="border-l-4 border-amber-600 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">24/7 Sigurnost</h3>
                    <p className="text-gray-700 text-sm">
                      Svi parkovi su nadzirati s AI kamerama. Vozila su osigurana od krađe i oštećenja.
                    </p>
                  </div>
                  <div className="border-l-4 border-amber-600 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Bez Ulaznica</h3>
                    <p className="text-gray-700 text-sm">
                      Nema potrebe za traženjem ulaznica. Sve je digitalno i osigurano kroz PayParq aplikaciju.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Često Postavljena Pitanja</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Koliko košta parkiranje u {cityTitle}?
                    </h3>
                    <p className="text-gray-700">
                      Prosječna cijena je €{avgPrice}/sat, ali cijene variraju ovisno o lokaciji i vremenu dana. Neke lokacije nude i mjesečne pakete.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Je li parkiranje u {cityTitle} sigurno?
                    </h3>
                    <p className="text-gray-700">
                      Da, svi PayParq parkovi u {cityTitle} imaju AI nadzor i 24/7 sigurnost. Vozila su osigurana od krađe i oštećenja.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Kako mogu rezervirati parkiranje?
                    </h3>
                    <p className="text-gray-700">
                      Jednostavno! Otvorite PayParq aplikaciju, pronađite lokaciju, odaberite vrijeme i rezervirajte. Potvrda je trenutna.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Mogu li otkazati rezervaciju?
                    </h3>
                    <p className="text-gray-700">
                      Da, možete otkazati rezervaciju do 2 sata prije početka. Povrat novca je automatski.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Pronađite Parkiranje Sada</h2>
              <p className="text-lg text-blue-100 mb-8">
                Rezervirajte sigurno parkirno mjesto u {cityTitle} u svega nekoliko klikova.
              </p>
              <Link
                href="/search"
                className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Pretraži Parkiranje u {cityTitle}
              </Link>
            </div>
          </section>
        </main>
        <FooterBrand />
      </div>
    </>
  );
}
