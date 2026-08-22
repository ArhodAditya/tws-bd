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

// A review joined with both its author and the product it belongs to — the
// shape the admin moderation queue needs, since it lists reviews across the
// whole catalogue rather than one product at a time. Either side is null only
// if the referenced row was removed.
export type ReviewWithContext = Review & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  products: {
    name: string;
  } | null;
};

// Name shown against a product review. Product reviews always carry a real
// user_id (RLS enforces it), so the only gap is a profile with no name set.
export const FALLBACK_REVIEWER_NAME = "Anonymous Madridista";

export function getProductReviewerName(
  review: Pick<ReviewWithContext, "profiles">
): string {
  return review.profiles?.full_name?.trim() || FALLBACK_REVIEWER_NAME;
}
