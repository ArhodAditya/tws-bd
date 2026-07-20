import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 requires non-default quality values to be allowlisted. Nothing
    // requests a non-default quality any more, so only the default (75) is
    // permitted — keeping 100 available just invites expensive transforms.
    qualities: [75],
    // Allow Google account profile pictures (e.g. lh3.googleusercontent.com)
    // so they can be served through next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        // Supabase Storage public URLs (e.g. <ref>.supabase.co/storage/...)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
