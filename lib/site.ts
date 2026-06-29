// Canonical site identity for SEO — used by the sitemap, robots, OpenGraph /
// canonical URLs and JSON-LD structured data.

// Production origin. Override per-environment with NEXT_PUBLIC_SITE_URL (e.g.
// preview deploys); defaults to the live domain. Never has a trailing slash.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://twsbd.page"
).replace(/\/+$/, "");

export const SITE_NAME = "The Whites Bangladesh";

// Brand logo (absolute URL) used as the publisher logo in structured data and
// as the OpenGraph image fallback when a product/article has no image.
export const SITE_LOGO = `${SITE_URL}/twsbd-logo.png`;
