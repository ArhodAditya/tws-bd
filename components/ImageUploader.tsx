"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addUrl = (url: string) => {
    if (!multiple) {
      onChange([url]); // single-image mode replaces.
      return;
    }
    // Functional update: when several uploads finish in the same tick their
    // callbacks all share one stale `value` closure, so `[...value, url]` would
    // let them clobber each other. Reading `prev` applies each append on top of
    // the latest state instead.
    onChange((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  const removeAt = (index: number) => {
    onChange((prev) => prev.filter((_, i) => i !== index));
  };

  // Reorder by swapping with the neighbour. Index 0 is the storefront
  // thumbnail, so this is how an admin picks which photo leads the product
  // card. Functional update for the same reason as addUrl: an in-flight upload
  // resolving mid-reorder would otherwise write back a stale array.
  const moveBy = (index: number, delta: number) => {
    onChange((prev) => {
      const target = index + delta;
      // Guard the ends. The buttons are disabled there too, but state is the
      // thing that has to stay correct.
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // Ordering is meaningless for the single-image article form, and for a
  // one-item gallery there is nothing to swap with.
  const showReorder = multiple && value.length > 1;

  // Uploads are signed server-side (admin-only) and posted straight to
  // Cloudinary — no unsigned preset, no third-party widget script.
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const chosen = multiple ? Array.from(files) : [files[0]!];
      for (const file of chosen) {
        const url = await uploadImageToCloudinary(file);
        addUrl(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      // Reset so re-selecting the same file still fires onChange.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-gold-500/5 px-5 py-2.5 text-sm font-semibold text-gold-700 transition-all duration-300 hover:bg-gold-500/15 hover:shadow-[0_0_22px_-10px_rgba(212,175,55,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" />
            {value.length > 0 && !multiple ? "Replace Image" : "Upload Image"}
          </>
        )}
      </button>

      {error ? (
        <p className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

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
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              {/* First image is the storefront thumbnail. Sits top-left so the
                  reorder bar owns the bottom edge. */}
              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-gold-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-midnight-950 shadow">
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

              {/* Reorder bar. Always visible rather than hover-revealed — the
                  admin screens get used on phones, where hover never fires. */}
              {showReorder ? (
                <div className="absolute inset-x-0 bottom-0 flex border-t border-white/15 bg-midnight-950/80 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => moveBy(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move image ${index + 1} left`}
                    className="flex flex-1 items-center justify-center py-2 text-white transition hover:bg-gold-500 hover:text-midnight-950 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span aria-hidden className="w-px bg-white/15" />
                  <button
                    type="button"
                    onClick={() => moveBy(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label={`Move image ${index + 1} right`}
                    className="flex flex-1 items-center justify-center py-2 text-white transition hover:bg-gold-500 hover:text-midnight-950 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-midnight-900/40">No images uploaded yet.</p>
      )}

      {showReorder ? (
        <p className="text-xs text-midnight-900/50">
          The <strong className="font-semibold">Primary</strong> image leads the
          product card and the gallery. Use the arrows to reorder, then save.
        </p>
      ) : null}
    </div>
  );
}
