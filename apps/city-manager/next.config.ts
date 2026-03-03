import type { NextConfig } from "next";
import { config as loadDotenv } from "dotenv";
import { existsSync } from "fs";
import path from "path";

const rootEnvPath = path.resolve(__dirname, "../../.env.local");
if ((!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && existsSync(rootEnvPath)) {
  loadDotenv({ path: rootEnvPath, override: false });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  turbopack: {
    root: __dirname
  }
};

export default nextConfig;
