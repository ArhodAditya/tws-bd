// Shared types and helpers for Fan Reviews (product detail modal).
// Mirrors the conventions in lib/shop.ts and lib/articles.ts.

import type { Database } from "@/utils/supabase/database.types";

export type Review = Database["public"]["Tables"]["product_reviews"]["Row"];

// A review joined with its author's public profile (see the PostgREST embed in
// ProductReviews: `select("*, profiles(full_name, avatar_url)")`).
export type ReviewWithAuthor = Review & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

// Average rating rounded to one decimal (e.g. 4.3). Returns 0 for no reviews so
// callers can branch on `count === 0` rather than guard against NaN.
export function averageRating(reviews: Pick<Review, "rating">[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

// Short, friendly relative-ish date for a review (e.g. "21 Jun 2026").
export function formatReviewDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
