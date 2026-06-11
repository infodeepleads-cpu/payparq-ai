import type { Metadata } from 'next';
import { CITIES } from '@/data/cities';
import { generateMetadata as generateSEOMetadata, generateCitySchema, generateBreadcrumbSchema } from '@/lib/seo';
import CityPageClient from './CityPageClient';

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES[slug];

  if (!city) {
    return { title: 'City Not Found | Payparq' };
  }

  const title = `Parking in ${city.name} | Book & Reserve | Payparq`;
  const description = `${city.description} Reserve parking spaces in ${city.name} with Payparq. Secure, affordable parking available 24/7. Compare prices and book online.`;
  const keywords = [
    `parking ${city.name}`,
    `${city.name} parking spaces`,
    `reserve parking ${city.name}`,
    `affordable parking ${city.name}`,
    `secure ${city.name} parking`,
    `book parking online ${city.name}`,
    `parking near ${city.name}`,
  ];

  const metadata = generateSEOMetadata({
    title,
    description,
    keywords,
    canonical: `https://www.payparq.com/city/${slug}`,
    ogImage: 'https://www.payparq.com/og-parking.jpg',
    ogType: 'website',
  });

  return {
    ...metadata,
    other: {
      'geo.region': 'HR',
      'geo.placename': city.name,
      'geo.position': `${city.lat};${city.lng}`,
      'ICBM': `${city.lat}, ${city.lng}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(CITIES).map((slug) => ({
    slug,
  }));
}

export const revalidate = 3600; // Revalidate every hour

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = CITIES[slug];

  if (!city) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">City not found</h1>
          <a href="/locations" className="text-blue-600 hover:underline">
            Back to locations
          </a>
        </div>
      </div>
    );
  }

  const citySchema = generateCitySchema({ ...city, slug, region: city.region });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.payparq.com' },
    { name: 'Parking Locations', url: 'https://www.payparq.com/locations' },
    { name: city.name, url: `https://www.payparq.com/city/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(citySchema) }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        suppressHydrationWarning
      />
      <CityPageClient city={city} slug={slug} />
    </>
  );
}
