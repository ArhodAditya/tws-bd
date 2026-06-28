// Shared types and helpers for Fan Reviews — the user-submitted "Voices of the
// Madridistas" wall on the Fans Zone plus the admin moderation queue. Mirrors
// the conventions in lib/reviews.ts (product reviews).

import type { Database } from "@/utils/supabase/database.types";

export type FanReview = Database["public"]["Tables"]["fan_reviews"]["Row"];

// A fan review joined with its author's public profile (see the PostgREST embed
// `select("*, profiles(full_name, avatar_url)")` used by the Fans Zone wall and
// the admin queue). `profiles` is null only if the author row was removed.
export type FanReviewWithAuthor = FanReview & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

// Hard cap on a submission — long enough for a real take, short enough to fit a
// card. Enforced both client-side (textarea) and in the submit server action.
export const MAX_REVIEW_LENGTH = 500;

// Cap on a custom display name so it never blows out the card layout.
export const MAX_DISPLAY_NAME_LENGTH = 50;

// Shown when a reviewer has no name set on their profile.
export const FALLBACK_REVIEWER_NAME = "Anonymous Madridista";

// Name shown on a review: the fan's custom display_name wins, then the joined
// profile's full_name, and finally the anonymous fallback. (Admin manual
// reviews always carry a display_name and have no profile.)
export function getReviewerName(
  review: Pick<FanReviewWithAuthor, "display_name" | "profiles">
): string {
  return (
    review.display_name?.trim() ||
    review.profiles?.full_name?.trim() ||
    FALLBACK_REVIEWER_NAME
  );
}

// Friendly date for a review (e.g. "21 Jun 2026"). Matches lib/reviews.ts.
export function formatFanReviewDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
