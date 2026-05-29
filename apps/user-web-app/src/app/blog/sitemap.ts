import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://payparq.com";

  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data || []).map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}
