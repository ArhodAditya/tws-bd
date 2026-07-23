import type { NextConfig } from "next";

// Development needs looser rules: Turbopack HMR evaluates code (`unsafe-eval`)
// and connects over websockets to the dev origin. Production stays strict.
const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Next ships inline bootstrap/hydration scripts and
// framer-motion writes inline styles, and we don't run nonce middleware, so
// script/style must allow 'unsafe-inline'. The high-value lockdowns still hold:
// no external script origins, no plugins/objects, no framing (anti-clickjacking),
// and a locked base-uri — which is what blunts the article-HTML XSS surface.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `frame-src 'none'`,
  `img-src 'self' https: data: blob:`,
  `font-src 'self' data:`,
  `style-src 'self' 'unsafe-inline'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Supabase REST/Auth/Realtime + the unsigned Cloudinary upload endpoint; dev
  // also needs localhost websockets for HMR.
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com${
    isDev ? " ws://localhost:* http://localhost:*" : ""
  }`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

// Applied to every route via headers() below. These are safe to enforce and
// don't depend on the app's rendering.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
