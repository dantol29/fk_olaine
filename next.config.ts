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
    // Safe to cache long in production: uploaded photos always get a fresh
    // UUID filename (see saveUploadedPhoto), so a URL is never reused for
    // different content.
    unoptimized: process.env.NODE_ENV === "development",
    minimumCacheTTL: process.env.NODE_ENV === "development" ? 0 : 60 * 60 * 24,
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
