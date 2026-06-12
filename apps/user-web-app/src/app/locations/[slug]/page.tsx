import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateMetadata as generateSEOMetadata, generateLocationSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { resolveScannerTruthPriceEuro } from '@/lib/locationPricing';
import LocationPageClient from './LocationPageClient';

type HubData = {
  id: string;
  name: string;
  address?: string;
  display_id?: string;
  canonical_slug?: string;
  latitude?: number;
  longitude?: number;
  verification_metadata?: Record<string, unknown>;
  rate_per_hour?: number;
  rate_per_hour_floor?: number;
  rate_per_hour_ceiling?: number;
  base_price_hourly?: number;
  base_price_daily?: number;
  base_price_monthly?: number;
};

interface LocationPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchLocationData(slug: string): Promise<HubData | null> {
  try {
    const client = supabaseAdmin ?? supabase;
    if (!client) return null;
    const { data } = await client
      .from('locations')
      .select('*')
      .eq('canonical_slug', slug)
      .limit(1)
      .single();
    return data as HubData | null;
  } catch (error) {
    console.error('Failed to fetch location:', error);
    return null;
  }
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = await fetchLocationData(slug);

  if (!location) {
    return { title: 'Location Not Found | Payparq' };
  }

  const title = `${location.name} Parking | Reserve & Book | Payparq`;
  const description = `Reserve parking at ${location.name}${location.address ? ` (${location.address})` : ''}. Safe, affordable parking with real-time availability. Book online with Payparq.`;
  const keywords = [
    `${location.name} parking`,
    `parking at ${location.name}`,
    `reserve parking ${location.name}`,
    `book parking ${location.name}`,
    `secure parking ${location.name}`,
    `affordable ${location.name} parking`,
  ];

  return generateSEOMetadata({
    title,
    description,
    keywords,
    canonical: `https://www.payparq.com/locations/${slug}`,
    ogImage: 'https://www.payparq.com/og-parking.jpg',
    ogType: 'website',
  });
}

export const revalidate = 3600; // Revalidate every hour

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;
  const location = await fetchLocationData(slug);

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-black mb-2">Location not found</h1>
          <a href="/locations" className="text-blue-600 hover:underline">
            Back to locations
          </a>
        </div>
      </div>
    );
  }

  const pricePerHour = resolveScannerTruthPriceEuro(
    {
      rate_per_hour: location.rate_per_hour,
      base_price_hourly: location.base_price_hourly,
      rate_per_hour_floor: location.rate_per_hour_floor,
      rate_per_hour_ceiling: location.rate_per_hour_ceiling,
    },
    'hourly'
  );

  const locationSchema = generateLocationSchema({
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    canonicalSlug: location.canonical_slug,
    description: `${location.name}${location.address ? ` located at ${location.address}` : ''}. Reserve safe parking online with Payparq.`,
    pricePerHour: pricePerHour,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.payparq.com' },
    { name: 'Parking Locations', url: 'https://www.payparq.com/locations' },
    { name: location.name, url: `https://www.payparq.com/locations/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(locationSchema) }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        suppressHydrationWarning
      />
      <LocationPageClient
        hub={location}
        priceLabel={`${pricePerHour || 'Contact'}€/hr`}
        hero=""
        faqItems={[]}
        travelTime="15 min"
      />
    </>
  );
}
