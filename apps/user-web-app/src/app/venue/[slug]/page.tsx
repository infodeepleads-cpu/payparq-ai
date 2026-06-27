import type { Metadata } from 'next';
import Link from 'next/link';
import { VENUES } from '@/data/venues';
import { generateMetadata as generateSEOMetadata, generateAirportSchema, generateBreadcrumbSchema } from '@/lib/seo';
import VenuePageClient from './VenuePageClient';

interface VenuePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  const { slug } = await params;
  const venue = VENUES[slug];

  if (!venue) {
    return { title: 'Venue Not Found | Payparq' };
  }

  return generateSEOMetadata({
    title: `${venue.name} Parking | Reserve & Book | Payparq`,
    description: `Find convenient parking near ${venue.name} in ${venue.city}. Easy online booking with instant confirmation.`,
    keywords: [
      `${venue.name} parking`,
      `parking near ${venue.name}`,
      `${venue.city} parking`,
      `${venue.name} event parking`,
    ],
    canonical: `https://www.payparq.com/venue/${slug}`,
    ogImage: 'https://www.payparq.com/og-venue.jpg',
    ogType: 'website',
  });
}

export async function generateStaticParams() {
  return Object.keys(VENUES).map((slug) => ({ slug }));
}

export const revalidate = 3600;

export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params;
  const venue = VENUES[slug];

  if (!venue) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">Venue not found</h1>
          <Link href="/locations" className="text-blue-600 hover:underline">
            Back to locations
          </Link>
        </div>
      </div>
    );
  }

  const venueSchema = generateAirportSchema({
    name: venue.name,
    slug: `venue/${slug}`,
    city: venue.city,
    lat: venue.lat,
    lng: venue.lng,
    description: `Parking near ${venue.name}`,
    spaceCount: 50,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.payparq.com' },
    { name: 'Parking Locations', url: 'https://www.payparq.com/locations' },
    { name: venue.name, url: `https://www.payparq.com/venue/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(venueSchema) }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        suppressHydrationWarning
      />
      <VenuePageClient venue={venue} slug={slug} />
    </>
  );
}
