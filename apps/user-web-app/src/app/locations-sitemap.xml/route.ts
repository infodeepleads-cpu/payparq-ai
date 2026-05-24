import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

function resolveSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (value) return value.replace(/\/+$/, "");
  return "https://www.payparq.com";
}

export async function GET() {
  const siteUrl = resolveSiteUrl();

  try {
    if (!supabase) throw new Error("Supabase not configured");

    const { data, error } = await supabase
      .from("locations")
      .select("canonical_slug, updated_at")
      .contains("verification_metadata", { hub_enabled: true })
      .limit(50000);

    if (error) throw error;

    const locationEntries = (data || []).map((loc: any) => ({
      url: `${siteUrl}/locations/${loc.canonical_slug}`,
      lastModified: loc.updated_at || new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locationEntries.map((entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Locations sitemap generation failed:", error);
    return new Response("", { status: 500 });
  }
}
