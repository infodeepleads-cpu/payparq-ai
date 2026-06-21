import type { Metadata } from 'next';
import { AIRPORTS } from '@/data/airports';
import { generateMetadata as generateSEOMetadata, generateAirportSchema, generateBreadcrumbSchema } from '@/lib/seo';
import AirportPageClient from './AirportPageClient';

interface AirportPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AirportPageProps): Promise<Metadata> {
  const { slug } = await params;
  const airport = Object.values(AIRPORTS).find((a) => a.slug === slug);

  if (!airport) {
    return { title: 'Airport Not Found | Payparq' };
  }

  // For high-ranking city pages, use them as canonical
  const airportCities = ['split-airport', 'zagreb-airport', 'dubrovnik-airport', 'zadar-airport'];
  const canonicalUrl = airportCities.includes(slug)
    ? `https://www.payparq.com/city/${slug}`
    : `https://www.payparq.com/airport/${slug}`;

  return generateSEOMetadata({
    title: `${airport.name} Parking | Reserve & Book | Payparq`,
    description: `${airport.description} Easy online booking with instant confirmation. Safe & affordable.`,
    keywords: [
      `${airport.name} parking`,
      `parking near ${airport.name}`,
      `reserve ${airport.name} parking`,
      `book ${airport.name} parking`,
      `${airport.city} airport parking`,
      `affordable ${airport.name} parking`,
      `${airport.name} long-term parking`,
    ],
    canonical: canonicalUrl,
    ogImage: 'https://www.payparq.com/og-airport.jpg',
    ogType: 'website',
  });
}

export async function generateStaticParams() {
  return Object.values(AIRPORTS).map((airport) => ({ slug: airport.slug }));
}

export const revalidate = 3600;

export default async function AirportPage({ params }: AirportPageProps) {
  const { slug } = await params;
  const airport = Object.values(AIRPORTS).find((a) => a.slug === slug);

  if (!airport) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">Zračna Luka nije pronađena</h1>
          <a href="/locations" className="text-blue-600 hover:underline">natrag na lokacije</a>
        </div>
      </div>
    );
  }

  const airportSchema = generateAirportSchema({
    name: airport.name,
    slug: `airport/${slug}`,
    city: airport.city,
    lat: airport.lat,
    lng: airport.lng,
    description: airport.description,
    spaceCount: 100,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.payparq.com' },
    { name: 'Parking Locations', url: 'https://www.payparq.com/locations' },
    { name: airport.name, url: `https://www.payparq.com/airport/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(airportSchema) }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        suppressHydrationWarning
      />
      <AirportPageClient airport={airport} slug={slug} />
    </>
  );
}
