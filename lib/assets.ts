// Site chrome (hero pair, logo, shop backdrop) rendered through next/image.
//
// All four are served straight out of public/. They used to point at copies
// uploaded to Cloudinary under `site-assets/`, delivered via the
// `/image/upload/` path; those URLs no longer resolve, so the local files are
// the source of truth again.
//
// Consequence worth knowing: with Cloudinary `fetch` delivery disabled on the
// account, cloudinaryLoader.ts hands a local path straight back — no
// `f_auto,q_auto,w_*` on the way out. Nothing resizes these, so whatever is on
// disk is exactly what ships, at full resolution, to every viewport. That is
// why the heroes are pre-compressed WebP rather than the original PNGs
// (2.2 MB -> 140 KB and 2.0 MB -> 155 KB, same pixel dimensions, quality 82).
// If you replace either one, compress it first; there is no CDN backstop.
//
// public/ also backs the favicon (app/layout.tsx) and the OpenGraph/JSON-LD
// logo (lib/site.ts), which both still reference twsbd-logo.png.

// Full-bleed backdrop behind a dark gradient wash, and the LCP element on a
// mostly-mobile audience.
export const HERO_BG_SRC = "/hero-bg.webp";

// Portrait companion to HERO_BG_SRC, shot for 9:16 so phones get the ball and
// the bag in frame instead of a slice of the landscape original. Art-directed
// in HomeHero via <picture>, so only one of the two is ever downloaded.
export const HERO_BG_MOBILE_SRC = "/mhero-bg.webp";

export const SITE_LOGO_SRC = "/twsbd-logo.png";

// Already a reasonably compressed JPEG at ~310 KB, so it stays as-is.
export const SHOP_BG_SRC = "/shop-bg.jpeg";
