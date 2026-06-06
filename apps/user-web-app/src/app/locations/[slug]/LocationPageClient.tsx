'use client';

import { useState, useEffect } from 'react';
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

interface LocationPageClientProps {
  hub: HubData;
  priceLabel: string;
  hero: string;
  faqItems: any[];
  travelTime: string;
}

export default function LocationPageClient({
  hub,
  priceLabel,
  hero,
  faqItems,
  travelTime,
}: LocationPageClientProps) {
  return (
    <LocationClient
      hub={hub}
      priceLabel={priceLabel}
      hero={hero}
      faqItems={faqItems}
      travelTime={travelTime}
    />
  );
}
