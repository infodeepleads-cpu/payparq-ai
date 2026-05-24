import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseHost: string | undefined;
try {
  supabaseHost = supabaseUrlEnv ? new URL(supabaseUrlEnv).hostname : undefined;
} catch {
  supabaseHost = undefined;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  images: {
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/**" }, { protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/refund-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/terms-and-conditions",
        destination: "/terms",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/business",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/business/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/security",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/security/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/parking",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/parking/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "payparq",
  project: "javascript-nextjs",
  silent: true,
});
