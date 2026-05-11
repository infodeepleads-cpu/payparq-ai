import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { REGION_CONFIG } from "@/lib/regionMap";

const staticRoutes = [
  "/",
  "/about",
  "/business",
  "/careers",
  "/cases",
  "/contact",
  "/discover-how",
  "/experience",
  "/legal",
  "/locations",
  "/members",
  "/news",
  "/overview",
  "/parking",
  "/pay",
  "/payments",
  "/privacy",
  "/product",
  "/resources",
  "/security",
  "/support",
  "/technology",
  "/terms",
  "/vision",
];

const regionRoutes = Object.values(REGION_CONFIG).map((config) => `/regions/${config.slug}`);

const cityGuides = [
  'zagreb', 'split', 'rijeka', 'zadar', 'osijek',
  'ljubljana', 'maribor',
  'sarajevo', 'banja-luka',
  'belgrade', 'nis',
  'vienna', 'salzburg',
  'munich', 'berlin',
  'rome', 'milan',
  'zurich', 'geneva',
];

const cityRoutes = cityGuides.map((city) => `/guides/${city}`);

const blogRoutes = [
  "/news/blog/parking-aerodrom-split",
  "/news/blog/parking-trogir",
  "/news/blog/parking-baska-voda-punta-rata",
  "/news/blog/smart-parking-hrvatska-2025",
  "/news/blog/parking-dalmacija-ljeto-2025",
  "/news/blog/park-taxi-brela",
];

function resolveSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (value) return value.replace(/\/+$/, "");
  return "https://www.payparq.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  let locationEntries: MetadataRoute.Sitemap = [];
  try {
    if (!supabase) throw new Error("Supabase not configured");
    const { data } = await supabase
      .from("locations")
      .select("canonical_slug")
      .contains("verification_metadata", { hub_enabled: true })
      .limit(500);
    locationEntries = (data || []).map((loc: { canonical_slug: string }) => ({
      url: `${siteUrl}/locations/${loc.canonical_slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch {
    // fail silently — static routes still served
  }

  const blogEntries: MetadataRoute.Sitemap = blogRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const regionEntries: MetadataRoute.Sitemap = regionRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.95,
  }));

  const cityGuideEntries: MetadataRoute.Sitemap = cityRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [...staticEntries, ...regionEntries, ...cityGuideEntries, ...blogEntries, ...locationEntries];
}
