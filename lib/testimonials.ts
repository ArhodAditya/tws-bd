// Shared types and helpers for fan testimonials (the public "Voices of the
// Madridistas" wall + the admin manager). Mirrors the conventions in lib/shop.ts.

import type { Database } from "@/utils/supabase/database.types";

export type Testimonial =
  Database["public"]["Tables"]["site_testimonials"]["Row"];

// Ratings are whole stars, 1–5.
export const MAX_RATING = 5;

// Clamp a possibly-null/odd rating into a 0..MAX_RATING whole-star count so the
// star row never renders a negative or out-of-range value.
export function clampRating(rating: number | null | undefined): number {
  if (rating == null || Number.isNaN(rating)) return 0;
  return Math.max(0, Math.min(MAX_RATING, Math.round(rating)));
}

// Display a handle with a single leading "@", regardless of how it was stored.
export function formatHandle(handle: string | null): string | null {
  const trimmed = handle?.trim();
  if (!trimmed) return null;
  return `@${trimmed.replace(/^@+/, "")}`;
}
