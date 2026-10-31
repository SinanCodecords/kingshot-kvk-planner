import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // postgres.js uses Node APIs; keep it out of the bundle.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
