'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LocationClient from './LocationClient';
import { resolveScannerTruthPriceEuro } from '@/lib/locationPricing';

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

export default function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const [hub, setHub] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ slug }) => {
      fetchHub(slug);
    });
  }, [params]);

  const fetchHub = async (slug: string) => {
    try {
      const res = await fetch(`/api/locations/${slug}`);
      if (!res.ok) {
        console.error('Failed to fetch location:', res.status);
        return;
      }
      const data = await res.json();
      if (data.location) {
        setHub(data.location);
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!hub) {
    return <div className="flex items-center justify-center min-h-screen">Location not found</div>;
  }

  const pricePerHour = resolveScannerTruthPriceEuro({
    rate_per_hour: hub.rate_per_hour,
    base_price_hourly: hub.base_price_hourly,
    rate_per_hour_floor: hub.rate_per_hour_floor,
    rate_per_hour_ceiling: hub.rate_per_hour_ceiling,
  }, 'hourly');

  return (
    <LocationClient
      hub={hub}
      priceLabel={`${pricePerHour || 'Contact'}€/hr`}
      hero=""
      faqItems={[]}
      travelTime="15 min"
    />
  );
}
