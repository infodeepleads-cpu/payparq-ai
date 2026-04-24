import type { MetadataRoute } from "next";

function resolveSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (value) return value.replace(/\/+$/, "");
  return "https://www.payparq.com";
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      {
        userAgent: "CCBot",
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
