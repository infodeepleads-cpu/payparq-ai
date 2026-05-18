import type { Metadata } from 'next';

const cityMetadata: Record<string, { title: string; description: string }> = {
  'zagreb': {
    title: 'Zagreb Parking Guide | Find Safe & Affordable Parking',
    description: 'Complete parking guide for Zagreb, Croatia. Discover rates, tips, and best locations for parking in the capital.',
  },
  'split': {
    title: 'Split Parking Guide | Dalmatian Coast Parking Solutions',
    description: 'Find parking in Split, Croatia. Guide to rates, beachfront parking, and summer parking tips.',
  },
  'rijeka': {
    title: 'Rijeka Parking Guide | Port City Parking',
    description: 'Parking solutions in Rijeka, Croatia. Discover affordable rates and convenient locations.',
  },
  'vienna': {
    title: 'Vienna Parking Guide | Austrian Capital Parking',
    description: 'Find parking in Vienna, Austria. Comprehensive guide to rates, regulations, and locations.',
  },
  'ljubljana': {
    title: 'Ljubljana Parking Guide | Slovenia Parking Solutions',
    description: 'Parking in Ljubljana, Slovenia. Affordable rates and convenient parking near city center.',
  },
  'belgrade': {
    title: 'Belgrade Parking Guide | Serbia Capital Parking',
    description: 'Find affordable parking in Belgrade, Serbia. Rates, tips, and best locations.',
  },
  'nis': {
    title: 'Niš Parking Guide | Southern Serbia Parking',
    description: 'Parking solutions in Niš, Serbia. Affordable rates and convenient locations.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const normalizedCity = city.toLowerCase();
  const data = cityMetadata[normalizedCity];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.payparq.com';

  return {
    title: data?.title || `${city} Parking Guide | Payparq`,
    description: data?.description || `Find safe and affordable parking in ${city}`,
    keywords: [
      `parking ${city}`,
      `${city} parking guide`,
      `${city} parking rates`,
      city,
      'parking',
      'parkiranje',
    ],
    alternates: {
      canonical: `${siteUrl}/guides/${normalizedCity}`,
    },
    openGraph: {
      title: data?.title || `${city} Parking Guide`,
      description: data?.description || `Find parking in ${city}`,
      type: 'website',
      url: `${siteUrl}/guides/${normalizedCity}`,
    },
    twitter: {
      card: 'summary',
      title: data?.title || `${city} Parking Guide`,
      description: data?.description || `Find parking in ${city}`,
    },
  };
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
