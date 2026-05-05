import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";
import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { formatEuroLabel, normalizeLocationName, resolveScannerTruthPriceEuro } from "@/lib/locationPricing";
import LocationClient from "./LocationClient";

const supabaseClient = supabase;

type HubData = {
  id: string;
  name: string;
  address?: string;
  display_id?: string;
  canonical_slug?: string;
  latitude?: number;
  longitude?: number;
  verification_photos?: string[];
  verification_metadata?: Record<string, unknown>;
  addons_config?: Record<string, unknown> | null;
};

async function fetchHub(slug: string): Promise<{ hub: HubData; priceLabel: string; hero: string; faqItems: Array<{ q: string; a: string }>; travelTime: string } | null> {
  const hyphenDisplay = String(slug || "").trim().toLowerCase();
  console.log('[locations/[slug]] fetching canonical_slug:', hyphenDisplay);
  
  // Use supabaseAdmin with fallback to supabase
  const client = supabaseAdmin ?? supabaseClient;
  if (!client) {
    console.error('Supabase client not configured');
    return null;
  }
  
  const selectCols = "id,name,address,display_id,canonical_slug,latitude,longitude,verification_photos,verification_metadata,rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly,rate_per_hour_floor,rate_per_hour_ceiling,base_price_daily_floor,base_price_daily_ceiling,base_price_monthly_floor,base_price_monthly_ceiling,addons_config,review_score,review_count,review_scores";

  const { data: locationData, error } = await client
    .from("locations")
    .select(selectCols)
    .eq("canonical_slug", hyphenDisplay)
    .limit(1);

  if (error) {
    console.error('[locations/[slug]] Error:', error);
  }

  let hub = locationData?.[0];

  // Fallback 1: try hub_slug in metadata (older locations before canonical_slug was added)
  if (!hub) {
    const { data: fallback } = await client
      .from("locations")
      .select(selectCols)
      .contains("verification_metadata", { hub_slug: hyphenDisplay })
      .limit(1);
    hub = fallback?.[0];
  }

  // Fallback 2: extract display_id from slug suffix (e.g. "parking-trogir-61440" → "61440")
  if (!hub) {
    const displayIdMatch = hyphenDisplay.match(/-(\d{4,6})$/);
    if (displayIdMatch) {
      const { data: fallback } = await client
        .from("locations")
        .select(selectCols)
        .eq("display_id", displayIdMatch[1])
        .limit(1);
      hub = fallback?.[0];
    }
  }

  if (!hub) {
    return null;
  }

  hub.name = normalizeLocationName(hub.name || '');
  if (!hub.name) {
    hub.name = 'Parking ' + (hub.display_id || 'Unknown');
  }

  const priceLabel = formatEuroLabel(resolveScannerTruthPriceEuro(hub, "hourly"));

  const hero = Array.isArray(hub.verification_photos) ? (hub.verification_photos[0] as string) : "";
  const faqItems: Array<{ q: string; a: string }> = [];

  // Calculate travel time
  let travelTime = "2 minutes";
  if (hub.latitude && hub.longitude) {
    // Default to Split Airport (SPU)
    let targetLat = 43.538;
    let targetLng = 16.298;

    // Allow overriding target coordinates via metadata (e.g. for other airports)
    if (hub.verification_metadata && 
        typeof hub.verification_metadata.target_lat === 'number' && 
        typeof hub.verification_metadata.target_lng === 'number') {
      targetLat = hub.verification_metadata.target_lat;
      targetLng = hub.verification_metadata.target_lng;
    }
    
    const R = 6371; // Radius of the earth in km
    const dLat = (targetLat - hub.latitude) * (Math.PI / 180);
    const dLon = (targetLng - hub.longitude) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(hub.latitude * (Math.PI / 180)) * Math.cos(targetLat * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    
    const minutes = Math.ceil(d * 2 + 1);
    const capped = Math.min(minutes, 5);
    travelTime = `${capped} minutes`;
  }

  return { hub, priceLabel, hero, faqItems, travelTime };
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const data = await fetchHub(params.slug);

  if (!data) {
    return {
      title: "Parking Location | PayParq",
      description: "Find and book secure parking with PayParq.",
    };
  }

  const { hub, priceLabel, travelTime } = data;
  // Parse Croatian addresses robustly — formats vary (full 6-part vs. short municipality-only)
  const addrParts = hub.address ? hub.address.split(",").map((s: string) => s.trim()) : [];
  const _isAdmin = (p: string) => /^(?:Općina|Grad|Gradska\s+četvrt)\s+/i.test(p);
  const _isRegion = (p: string) => /županija/i.test(p);
  const _isPostal = (p: string) => /^\d{5}$/.test(p);
  const _isCountry = (p: string) => /^hrvatska$/i.test(p);
  const _stripAdmin = (p: string) => p.replace(/^(?:Općina|Grad|Gradska\s+četvrt)\s+/i, "").trim();
  const hasStreet = addrParts.length >= 4 && !_isAdmin(addrParts[0]);
  const city = (() => {
    const candidates = hasStreet ? addrParts.slice(1) : addrParts;
    for (const p of candidates) {
      if (_isRegion(p) || _isPostal(p) || _isCountry(p)) continue;
      return _stripAdmin(p);
    }
    return _stripAdmin(addrParts[0]) || hub.name;
  })();
  const address = hub.address || hub.name;
  const url = `https://payparq.ai/locations/${hub.canonical_slug}`;
  const heroImage = Array.isArray(hub.verification_photos) && hub.verification_photos[0]
    ? hub.verification_photos[0] as string
    : undefined;

  const title = `Parking ${city} | PayParq – From ${priceLabel}/hr`;
  const description = `Secure parking at ${address}. ${travelTime} transfer to your destination. From ${priceLabel}/hr – AI camera monitoring, no ticket needed, instant booking on PayParq.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "PayParq",
      type: "website",
      locale: "hr_HR",
      ...(heroImage ? { images: [{ url: heroImage, width: 1200, height: 630, alt: `PayParq ${city} parking` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(heroImage ? { images: [heroImage] } : {}),
    },
  };
}

export default async function LocationPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  console.log('=== LOCATION PAGE DEBUG ===');
  console.log('1. Slug received:', params?.slug);
  console.log('2. supabaseAdmin exists?', !!supabaseAdmin);

  if (!params?.slug || typeof params.slug !== "string") {
    return (
      <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-white/70">Location not found</p>
            <Link href="/locations" className="text-xs font-semibold underline">
              Back to Locations
            </Link>
          </div>
        </main>
        <FooterBrand />
      </div>
    );
  }

  const data = await fetchHub(params.slug);
  if (!data) {
    console.error('[locations/[slug]] not found for canonical_slug:', params.slug);
    return (
      <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-white/70">Location not found</p>
            <Link href="/locations" className="text-xs font-semibold underline">
              Back to Locations
            </Link>
          </div>
        </main>
        <FooterBrand />
      </div>
    );
  }
  
  const { hub, priceLabel } = data;
  const hubUrl = `https://www.payparq.com/locations/${hub.canonical_slug ?? params.slug}`;
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "ParkingFacility",
    "@id": `${hubUrl}#parking`,
    "name": hub.name,
    "url": hubUrl,
    "description": `Secure parking at ${hub.name}. From ${priceLabel}/hr — AI camera monitoring, no ticket needed, instant booking on PayParq.`,
    "priceRange": priceLabel,
    "openingHours": "Mo-Su 00:00-24:00",
    "paymentAccepted": "Credit Card, Debit Card",
    "currenciesAccepted": "EUR",
    ...(hub.address ? {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": hub.address.split(",")[0]?.trim() ?? hub.address,
        "addressCountry": "HR",
      },
    } : {}),
    ...(hub.latitude && hub.longitude ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": hub.latitude,
        "longitude": hub.longitude,
      },
    } : {}),
    "image": Array.isArray(hub.verification_photos) && hub.verification_photos[0]
      ? hub.verification_photos[0]
      : undefined,
    "brand": { "@type": "Brand", "name": "PayParq" },
    "amenityFeature": [
      { "@type": "LocationFeatureSpecification", "name": "AI License Plate Recognition", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "24/7 Surveillance", "value": true },
      { "@type": "LocationFeatureSpecification", "name": "Online Booking", "value": true },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }} />
      <LocationClient hub={data.hub} priceLabel={data.priceLabel} hero={data.hero} faqItems={data.faqItems} travelTime={data.travelTime} />
    </>
  );
}

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const client = supabaseAdmin ?? supabaseClient;
    if (!client) {
      console.error('Supabase client not configured for static generation');
      return [];
    }
    const { data: locations } = await client
      .from("locations")
      .select("canonical_slug,display_id,name,verification_metadata")
      .contains("verification_metadata", { hub_enabled: true })
      .limit(500);
    const slugs = (locations || []).flatMap((loc: { canonical_slug?: string | null; display_id?: string; name?: string }) => {
      if (loc.canonical_slug?.trim()) return [loc.canonical_slug.trim().toLowerCase()];
      // For locations without canonical_slug, build slug from name + display_id
      if (loc.display_id) {
        const namePart = String(loc.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return [namePart ? `${namePart}-${loc.display_id}` : loc.display_id];
      }
      return [];
    });
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}
