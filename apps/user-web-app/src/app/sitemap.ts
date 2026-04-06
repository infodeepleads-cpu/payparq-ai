import type { MetadataRoute } from "next";

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

function resolveSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (value) return value.replace(/\/+$/, "");
  return "https://payparq.ai";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl();
  const now = new Date();
  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
