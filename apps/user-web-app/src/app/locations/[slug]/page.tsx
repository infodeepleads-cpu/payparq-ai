import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";
import Link from "next/link";
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
  
  const { data: locationData, error } = await client
    .from("locations")
    .select("id,name,address,display_id,canonical_slug,latitude,longitude,verification_photos,verification_metadata,rate_per_hour,base_price_hourly,base_price_daily,base_price_monthly,rate_per_hour_floor,rate_per_hour_ceiling,base_price_daily_floor,base_price_daily_ceiling,base_price_monthly_floor,base_price_monthly_ceiling")
    .eq("canonical_slug", hyphenDisplay)
    .limit(1);

  if (error) {
    console.error('[locations/[slug]] Error:', error);
  }

  const hub = locationData?.[0];

  if (!hub) {
    return null;
  }

  hub.name = normalizeLocationName(hub.name);

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
  
  return <LocationClient hub={data.hub} priceLabel={data.priceLabel} hero={data.hero} faqItems={data.faqItems} travelTime={data.travelTime} />;
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
      .select("canonical_slug")
      .contains("verification_metadata", { hub_enabled: true })
      .limit(500);
    const slugs = (locations || []).map((loc: { canonical_slug: string }) => loc.canonical_slug.trim().toLowerCase());
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}
