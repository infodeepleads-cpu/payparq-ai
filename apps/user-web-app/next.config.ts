import type { NextConfig } from "next";
import path from "path";

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
    remotePatterns: supabaseHost
      ? [
          { protocol: "https", hostname: supabaseHost, pathname: "/storage/**" },
          { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
        ]
      : [],
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

export default nextConfig;
