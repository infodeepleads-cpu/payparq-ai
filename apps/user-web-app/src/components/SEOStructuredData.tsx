interface AirportParkingSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  image?: string;
  url: string;
  areaServed: {
    '@type': string;
    name: string;
  };
  offers: {
    '@type': string;
    availability: string;
    priceCurrency: string;
    priceRange: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    reviewCount: string;
  };
}

interface LocalBusinessSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  image?: string;
  areaServed: {
    '@type': string;
    name: string;
  };
  address: {
    '@type': string;
    addressCountry: string;
    addressRegion: string;
  };
}

export function AirportParkingStructuredData({
  name,
  description,
  url,
  city,
  region,
}: {
  name: string;
  description: string;
  url: string;
  city: string;
  region: string;
}) {
  const schema: AirportParkingSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${name} Parking | Payparq`,
    description,
    url,
    areaServed: {
      '@type': 'Place',
      name: city,
    },
    offers: {
      '@type': 'Offer',
      availability: 'PreOrder',
      priceCurrency: 'EUR',
      priceRange: '€',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function CityParkingStructuredData({
  cityName,
  description,
  url,
  region,
}: {
  cityName: string;
  description: string;
  url: string;
  region: string;
}) {
  const schema: LocalBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Parking in ${cityName} | Payparq`,
    description,
    url,
    areaServed: {
      '@type': 'Place',
      name: cityName,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'HR',
      addressRegion: region,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
