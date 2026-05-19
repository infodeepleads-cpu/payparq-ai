import type { Metadata } from "next";

interface LocationData {
  id: string;
  name: string;
  canonical_slug: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  base_price_hourly?: number | null;
  base_price_daily?: number | null;
  base_price_monthly?: number | null;
  verification_metadata?: Record<string, unknown>;
}

async function getLocationData(slug: string): Promise<LocationData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/locations/${slug}`, { cache: 'force-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.location || null;
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

  return {
    title: `${location.name} Parking | Payparq`,
    description: `Parking at ${location.name}. Reserve your spot safely with Payparq.`,
    alternates: {
      canonical: `${siteUrl}/locations/${location.canonical_slug}`,
    },
    keywords: [
      `${location.name} parking`,
      "parking",
      "parkiranje",
    ],
    openGraph: {
      title: `Parking at ${location.name}`,
      description: `Book parking at ${location.name} with Payparq.`,
      type: "website",
      url: `${siteUrl}/locations/${location.canonical_slug}`,
    },
    twitter: {
      card: "summary",
      title: `Parking at ${location.name}`,
      description: `Book parking with Payparq`,
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
