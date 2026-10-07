import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@olaine/database"],
  experimental: {
    serverActions: {
      // Matches the 5MB cap enforced in src/lib/uploads.ts for photo
      // uploads — Next's own default (1MB) would reject the request
      // before our validation even runs.
      bodySizeLimit: "6mb",
    },
    // cPanel has a small memory allowance even though it exposes many CPUs.
    // Limit page-data collection workers as well as static generation;
    // minPagesPerWorker alone does not limit page-data collection.
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
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
        hostname: "flagcdn.com",
        pathname: "/w80/**",
      },
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
