"use client";

// Global image loader — replaces Vercel's Image Optimization for every
// next/image on the site (wired up via `images.loader/loaderFile` in
// next.config.ts).
//
// This runs for EVERY <Image>, so it has to handle each src shape we actually
// use, not just local files:
//
//   1. local files      /hero-bg.png, /twsbd-logo.png, /shop-bg.jpeg
//   2. our Cloudinary   res.cloudinary.com/<our cloud>/image/upload/...
//   3. Supabase Storage <ref>.supabase.co/storage/v1/object/public/...
//   4. Google avatars   lh3.googleusercontent.com/...
//   5. data:/blob:      never routed through a CDN
//
// Case 2 is deliberately rewritten in place rather than re-fetched: the asset
// already lives in our Cloudinary account, so we inject transformations into
// the existing delivery URL instead of asking Cloudinary to fetch its own CDN.
// Everything else goes through Cloudinary's `fetch` delivery type.

type LoaderArgs = { src: string; width: number; quality?: number };

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Cloudinary `fetch` pulls the origin file over the public internet, so local
// paths must be absolutised against a publicly reachable host. Mirrors the
// default in lib/site.ts.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://twsbd.page"
).replace(/\/+$/, "");

// In development the origin is localhost, which Cloudinary cannot reach — so
// local paths are served straight from Next's dev server. Set
// NEXT_PUBLIC_IMAGE_LOADER=cloudinary to exercise the production path locally
// (remote srcs still work, since those are publicly reachable).
const FORCE_CLOUDINARY = process.env.NEXT_PUBLIC_IMAGE_LOADER === "cloudinary";
const IS_DEV = process.env.NODE_ENV === "development";

// Cloudinary's `fetch` delivery type is DISABLED on this account today: every
// /image/fetch/ URL currently returns 401. Verified 2026-07-21 against cloud
// `db9yszqyt` for both a third-party URL and our own domain.
//
// So the fetch path stays behind a flag that defaults OFF. With it off we
// return the raw src, which still meets the actual goal — next/image no longer
// routes through Vercel's optimizer, so nothing is billed against the exhausted
// quota — it just forgoes CDN resizing until fetch is turned on.
//
// To enable: in Cloudinary console → Settings → Security, allow "fetch" as a
// delivery type (and add twsbd.page under Allowed fetch domains), then set
// NEXT_PUBLIC_CLOUDINARY_FETCH_ENABLED=true locally and in Vercel.
//
// Note this flag does NOT gate the /image/upload/ rewrite below — that path is
// verified working (200) and is applied unconditionally.
const FETCH_ENABLED =
  process.env.NEXT_PUBLIC_CLOUDINARY_FETCH_ENABLED === "true";

function transforms(width: number, quality?: number): string {
  return [
    "f_auto", // let Cloudinary negotiate AVIF/WebP per Accept header
    quality ? `q_${quality}` : "q_auto:good",
    "c_limit", // never upscale past the source's own dimensions
    `w_${width}`,
  ].join(",");
}

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: LoaderArgs): string {
  // Inline data and object URLs are already local to the document.
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  // Misconfigured env must degrade to a working image, never a broken one.
  if (!CLOUD_NAME) return src;

  const isRemote = /^https?:\/\//i.test(src);
  const t = transforms(width, quality);

  // Case 2 — already in our Cloudinary account: splice transformations into
  // the delivery URL rather than paying for a redundant fetch of our own CDN.
  // Uses `upload` delivery, which is verified working, so this needs no gate.
  const ourUpload = new RegExp(
    `^https?://res\\.cloudinary\\.com/${CLOUD_NAME}/image/upload/(.+)$`,
    "i"
  );
  const match = src.match(ourUpload);
  if (match) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}/${match[1]}`;
  }

  // --- everything below needs `fetch` delivery -----------------------------

  // Not enabled on the account yet: hand back the raw src. next/image renders
  // it directly, so it costs nothing against Vercel's optimizer quota.
  if (!FETCH_ENABLED) return src;

  // Local dev: Cloudinary cannot reach localhost, so local files are served by
  // the dev server. Remote srcs are publicly reachable and still go through.
  if (IS_DEV && !FORCE_CLOUDINARY && !isRemote) return src;

  // Local paths are absolutised so Cloudinary has something to pull from.
  const origin = isRemote
    ? src
    : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${t}/${encodeURIComponent(
    origin
  )}`;
}
