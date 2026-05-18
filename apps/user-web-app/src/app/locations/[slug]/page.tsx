'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Star } from 'lucide-react';

interface LocationData {
  id: string;
  name: string;
  canonical_slug: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  lat: number;
  lng: number;
  base_price_hourly: number;
  base_price_daily: number;
  base_price_monthly: number;
  photo_url: string;
  rating: number;
  review_count: number;
}

export default function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ slug }) => {
      fetchLocation(slug);
    });
  }, [params]);

  const fetchLocation = async (slug: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('locations')
        .select(
          'id, name, canonical_slug, address, city, country, postal_code, lat, lng, ' +
          'base_price_hourly, base_price_daily, base_price_monthly, photo_url, rating, review_count'
        )
        .eq('canonical_slug', slug)
        .single();

      if (error) throw error;
      setLocation(data);
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!location) {
    return <div className="flex items-center justify-center min-h-screen">Location not found</div>;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.payparq.com';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: location.city,
        item: `${siteUrl}/guides/${location.city.toLowerCase().replace(/\s+/g, '-')}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: location.name,
        item: `${siteUrl}/locations/${location.canonical_slug}`,
      },
    ],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: location.name,
    image: location.photo_url,
    description: `Parking at ${location.name} in ${location.city}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address,
      addressLocality: location.city,
      addressCountry: location.country,
      postalCode: location.postal_code,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.lat,
      longitude: location.lng,
    },
    priceRange: `${location.base_price_hourly}€-${location.base_price_daily}€`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: location.rating,
      reviewCount: location.review_count,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero Image */}
        {location.photo_url && (
          <div className="relative w-full h-96 overflow-hidden">
            <img
              src={location.photo_url}
              alt={location.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{location.name}</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={20} />
              <span>
                {location.address}, {location.city}, {location.country}
              </span>
            </div>
          </div>

          {/* Rating */}
          {location.rating > 0 && (
            <div className="flex items-center gap-2 mb-8">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.round(location.rating) ? 'fill-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">
                {location.rating}/5 ({location.review_count} reviews)
              </span>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600">Hourly</p>
                <p className="text-2xl font-bold text-blue-600">{location.base_price_hourly}€</p>
              </div>
              <div>
                <p className="text-gray-600">Daily</p>
                <p className="text-2xl font-bold text-blue-600">{location.base_price_daily}€</p>
              </div>
              <div>
                <p className="text-gray-600">Monthly</p>
                <p className="text-2xl font-bold text-blue-600">{location.base_price_monthly}€</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition">
            Book Now
          </button>
        </div>
      </div>
    </>
  );
}
