import type { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  alternates?: Record<string, string>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const siteUrl = 'https://www.payparq.com';
  const canonical = config.canonical || siteUrl;

  const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: {
      canonical: canonical,
      ...(config.alternates && { languages: config.alternates }),
    },
    openGraph: {
      title: config.title,
      description: config.description,
      type: (config.ogType as 'website' | 'article') || 'website',
      url: canonical,
      siteName: 'Payparq',
      ...(config.ogImage && { images: [{ url: config.ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      ...(config.ogImage && { images: [config.ogImage] }),
    },
  };

  if (config.articlePublishedTime) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: config.articlePublishedTime,
      ...(config.articleModifiedTime && { modifiedTime: config.articleModifiedTime }),
    };
  }

  return metadata;
}

export function generateLocationSchema(location: {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  canonicalSlug?: string;
  description?: string;
  pricePerHour?: number;
  pricePerDay?: number;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': ['ParkingFacility', 'LocalBusiness'],
    name: location.name,
    description: location.description || `Parking facility: ${location.name}`,
    ...(location.address && { address: location.address }),
    ...(location.latitude &&
      location.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: location.latitude,
          longitude: location.longitude,
        },
      }),
    url: `https://www.payparq.com/locations/${location.canonicalSlug}`,
    ...(location.pricePerHour && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        price: location.pricePerHour.toFixed(2),
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    }),
    ...(location.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: location.rating,
        reviewCount: location.reviewCount || 1,
      },
    }),
  };
}

export function generateCitySchema(city: {
  name: string;
  lat: number;
  lng: number;
  slug: string;
  description?: string;
  region?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ParkingFacility'],
    name: `PayParq Parking ${city.name}`,
    description: city.description || `Parking services in ${city.name}`,
    url: `https://www.payparq.com/city/${city.slug}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.lat,
      longitude: city.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressCountry: 'HR',
      ...(city.region && { addressRegion: city.region }),
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Credit Card, Debit Card',
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateAirportSchema(airport: {
  name: string;
  slug: string;
  city: string;
  lat: number;
  lng: number;
  description?: string;
  spaceCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': ['ParkingFacility', 'LocalBusiness'],
    name: airport.name,
    description: airport.description || `Parking facility at ${airport.name}`,
    url: `https://www.payparq.com/${airport.slug}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: airport.lat,
      longitude: airport.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: airport.city,
      addressCountry: 'HR',
    },
    ...(airport.spaceCount && {
      numberOfCapacities: airport.spaceCount,
    }),
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  };
}
