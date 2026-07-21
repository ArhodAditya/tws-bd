// Cloudinary-hosted site chrome (hero, logo, shop backdrop).
//
// These three files are the only local assets still rendered through
// next/image. They were uploaded to Cloudinary (public ids under
// `site-assets/`) so they can be delivered via the `/image/upload/` path,
// which cloudinaryLoader.ts rewrites with `f_auto,q_auto:good,c_limit,w_*`.
//
// Why not just point at /hero-bg.png and let the loader handle it? Because the
// loader would have to use Cloudinary's `fetch` delivery for a local path, and
// fetch is disabled on this account (401). Referencing the uploaded copy uses
// the `upload` path instead, which works today with no account changes.
//
// The originals remain in public/ — they still back the favicon, the
// OpenGraph/JSON-LD logo in lib/site.ts, and the fallback below.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Version-pinned so a re-upload can't be masked by a stale CDN copy. If the
// cloud name is ever unset, fall back to the local file so the image degrades
// to "unoptimized but working" rather than breaking.
function cloudinaryAsset(version: string, publicId: string, localFallback: string) {
  return CLOUD
    ? `https://res.cloudinary.com/${CLOUD}/image/upload/${version}/${publicId}`
    : localFallback;
}

export const HERO_BG_SRC = cloudinaryAsset(
  "v1784598191",
  "site-assets/hero-bg.png",
  "/hero-bg.png"
);

// Portrait companion to HERO_BG_SRC, shot for 9:16 so phones get the ball and
// the bag in frame instead of a slice of the landscape original. Art-directed
// in HomeHero via <picture>, so only one of the two is ever downloaded.
export const HERO_BG_MOBILE_SRC = cloudinaryAsset(
  "v1784618523",
  "site-assets/mhero-bg.png",
  "/mhero-bg.png"
);

export const SITE_LOGO_SRC = cloudinaryAsset(
  "v1784598192",
  "site-assets/twsbd-logo.png",
  "/twsbd-logo.png"
);

// Uploaded as .jpg — Cloudinary normalises the jpeg extension.
export const SHOP_BG_SRC = cloudinaryAsset(
  "v1784598192",
  "site-assets/shop-bg.jpg",
  "/shop-bg.jpeg"
);
