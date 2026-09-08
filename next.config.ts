import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Matches the 5MB cap enforced in src/lib/uploads.ts for photo
      // uploads — Next's own default (1MB) would reject the request
      // before our validation even runs.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Skip the image optimizer/cache in dev so edited local images (logos, etc.)
    // show up immediately on reload instead of serving a stale cached transform.
    unoptimized: process.env.NODE_ENV === "development",
    minimumCacheTTL: 0,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "lff.lv",
      },
    ],
  },
};

export default nextConfig;
