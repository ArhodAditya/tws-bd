import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All optimization is delegated to Cloudinary (see cloudinaryLoader.ts).
    // Vercel's Image Optimization is bypassed entirely, which is what keeps us
    // off its transformation quota.
    loader: "custom",
    loaderFile: "./cloudinaryLoader.ts",
    // NOTE: `remotePatterns` and `qualities` only govern Next's built-in
    // optimizer, which no longer runs — the custom loader builds every URL
    // itself. They are removed rather than left as dead config that implies
    // an allowlist is still being enforced. Host restriction now lives in
    // Cloudinary's "Allowed fetch domains" setting instead.
  },
};

export default nextConfig;
