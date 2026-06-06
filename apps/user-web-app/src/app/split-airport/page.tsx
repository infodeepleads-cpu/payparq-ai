import type { Metadata } from 'next';
import { AIRPORTS } from '@/data/airports';
import { generateMetadata as generateSEOMetadata, generateAirportSchema, generateBreadcrumbSchema } from '@/lib/seo';
import SplitAirportClient from './SplitAirportClient';

const airport = AIRPORTS.split;

export const metadata: Metadata = generateSEOMetadata({
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
    `SPU parking`,
  ],
  canonical: `https://www.payparq.com/${airport.slug}`,
  ogImage: 'https://www.payparq.com/og-airport.jpg',
  ogType: 'website',
});

export const revalidate = 3600; // Revalidate every hour

export default function SplitAirportPage() {
  const airportSchema = generateAirportSchema({
    name: airport.name,
    slug: airport.slug,
    city: airport.city,
    lat: airport.lat,
    lng: airport.lng,
    description: airport.description,
    spaceCount: 100,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.payparq.com' },
    { name: 'Parking Locations', url: 'https://www.payparq.com/locations' },
    { name: airport.name, url: `https://www.payparq.com/${airport.slug}` },
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
      <SplitAirportClient airport={airport} />
    </>
  );
}
