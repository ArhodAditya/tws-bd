"use client";

import type { Dispatch, SetStateAction } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, TriangleAlert, X } from "lucide-react";

// Unsigned upload preset — configured per the task via the public env var. The
// widget also needs NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (read by next-cloudinary
// internally).
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function ImageUploader({
  value,
  onChange,
  multiple = true,
}: {
  value: string[];
  // Accepts React's state setter so updates can be functional — this is what
  // makes concurrent uploads safe (see addUrl below).
  onChange: Dispatch<SetStateAction<string[]>>;
  // Products allow a gallery; the article form takes a single hero image.
  multiple?: boolean;
}) {
  const addUrl = (url: string) => {
    if (!multiple) {
      onChange([url]); // single-image mode replaces.
      return;
    }
    // Functional update: when several uploads finish in the same tick their
    // onSuccess callbacks all share one stale `value` closure, so `[...value,
    // url]` would let them clobber each other. Reading `prev` applies each
    // append on top of the latest state instead.
    onChange((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  const removeAt = (index: number) => {
    onChange((prev) => prev.filter((_, i) => i !== index));
  };

  if (!UPLOAD_PRESET) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <TriangleAlert className="h-4 w-4 shrink-0" />
        Image uploads are unavailable — set{" "}
        <code className="font-mono text-xs">
          NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
        </code>{" "}
        to enable them.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <CldUploadWidget
        uploadPreset={UPLOAD_PRESET}
        options={{
          multiple,
          maxFiles: multiple ? 10 : 1,
          sources: ["local", "url", "camera"],
        }}
        onSuccess={(result) => {
          // `info` is typed string | object; narrow before reading secure_url.
          const info = result?.info;
          if (info && typeof info === "object" && "secure_url" in info) {
            const url = (info as { secure_url?: string }).secure_url;
            if (url) addUrl(url);
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-gold-500/5 px-5 py-2.5 text-sm font-semibold text-gold-700 transition-all duration-300 hover:bg-gold-500/15 hover:shadow-[0_0_22px_-10px_rgba(212,175,55,0.9)]"
          >
            <ImagePlus className="h-4 w-4" />
            {value.length > 0 && !multiple ? "Replace Image" : "Upload Image"}
          </button>
        )}
      </CldUploadWidget>

      {value.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border-2 border-midnight-900/10 bg-midnight-950 shadow-sm ring-1 ring-black/5 transition-colors hover:border-gold-500/50"
            >
              {/* Cloudinary host isn't in next.config remotePatterns, so a plain
                  <img> avoids the optimizer (matches the storefront). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {/* First image is the storefront thumbnail. */}
              {index === 0 ? (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-gold-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-midnight-950 shadow">
                  Primary
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-midnight-950/85 text-white shadow-lg backdrop-blur transition hover:scale-110 hover:border-red-400 hover:bg-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-midnight-900/40">No images uploaded yet.</p>
      )}
    </div>
  );
}
