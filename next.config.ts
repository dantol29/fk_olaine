import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Matches the 5MB cap enforced in src/lib/uploads.ts for photo
      // uploads — Next's own default (1MB) would reject the request
      // before our validation even runs.
      bodySizeLimit: "6mb",
    },
    // The cPanel host's build gets OOM-killed with the default worker count
    // (each parallel worker is its own Node process). Setting this above
    // the app's total page count forces static generation onto a single
    // worker instead, trading build speed for a much smaller memory peak.
    staticGenerationMinPagesPerWorker: 50,
  },
  images: {
    // Always unoptimized: in dev so edited local images (logos, etc.) show
    // up immediately on reload instead of a stale cached transform; in
    // production because the optimizer needs the `sharp` native binary,
    // which fails to load on the cPanel host's old glibc (same issue that
    // forced @next/swc onto WASM there) — serving images as-is is the
    // reliable option on that platform.
    unoptimized: true,
    // Safe to cache long: uploaded photos always get a fresh UUID filename
    // (see saveUploadedPhoto), so a URL is never reused for different content.
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
