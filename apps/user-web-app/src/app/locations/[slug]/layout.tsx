import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

async function getLocationData(slug: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("locations")
      .select(
        "id, name, canonical_slug, address, city, country, postal_code, lat, lng, " +
        "base_price_hourly, base_price_daily, base_price_monthly, photo_url, rating, review_count"
      )
      .eq("canonical_slug", slug)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to fetch location metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationData(slug);

  if (!location) {
    return {
      title: "Parking Location | Payparq",
      description: "Find parking with Payparq",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.payparq.com";
  const priceRange =
    location.base_price_hourly && location.base_price_daily
      ? `${location.base_price_hourly}€-${location.base_price_daily}€`
      : "Kontaktirajte za cijenu";

  return {
    title: `${location.name} Parking in ${location.city} | Payparq`,
    description: `Parking at ${location.name} in ${location.city}. ${location.review_count || 0} reviews, rated ${location.rating || "N/A"}/5. Hourly from ${location.base_price_hourly || "N/A"}€.`,
    canonical: `${siteUrl}/locations/${location.canonical_slug}`,
    keywords: [
      `parking ${location.city}`,
      `${location.name} parking`,
      location.city,
      location.country,
      "parkiranje",
      "parking",
    ],
    openGraph: {
      title: `Parking at ${location.name} in ${location.city}`,
      description: `Book safe parking at ${location.name}. From ${location.base_price_hourly || "N/A"}€/hour. ${location.review_count || 0} reviews.`,
      type: "website",
      url: `${siteUrl}/locations/${location.canonical_slug}`,
      images: location.photo_url ? [location.photo_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `Parking at ${location.name} in ${location.city}`,
      description: `Safe parking from ${location.base_price_hourly || "N/A"}€/hour`,
      images: location.photo_url ? [location.photo_url] : [],
    },
  };
}

export default function LocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
