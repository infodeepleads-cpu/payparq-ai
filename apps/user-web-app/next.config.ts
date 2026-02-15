import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
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
