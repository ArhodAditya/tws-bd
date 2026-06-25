// Shared types, helpers and sample data for the News section.

import type { Database } from "@/utils/supabase/database.types";

// Source of truth: the generated `articles` row type.
export type Article = Database["public"]["Tables"]["articles"]["Row"];

// The subset of the author's profile we join onto an article.
export type ArticleAuthor = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "avatar_url"
>;

// An article joined with its author profile, matching the shape returned by
// `.select("*, profiles(full_name, avatar_url)")`.
export type ArticleWithAuthor = Article & {
  profiles: ArticleAuthor | null;
};

// Shown when an article has no linked profile / the profile has no name.
export const FALLBACK_AUTHOR_NAME = "The Whites Admin";

// Resolve the display name for an article's author.
export function getAuthorName(author?: ArticleAuthor | null): string {
  return author?.full_name?.trim() || FALLBACK_AUTHOR_NAME;
}

// Format an ISO timestamp into a clean, locale-stable date label.
export function formatArticleDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// There is no `excerpt` column, so derive one by safely truncating the body to
// ~120 characters without cutting a word in half.
export function getExcerpt(content?: string | null, maxLength = 120): string {
  if (!content) return "";
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const slice = normalized.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const truncated = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${truncated.trimEnd()}…`;
}

export type CategoryStyle = {
  label: string;
  /** Classes for the badge pill (tuned for dark surfaces). */
  badge: string;
  /** Classes for the small status dot. */
  dot: string;
};

// Category badges are styled distinctly so 'breaking' reads as urgent (red)
// while 'analysis' carries the premium gold accent.
export function getCategoryStyle(category?: string | null): CategoryStyle {
  switch ((category ?? "").toLowerCase()) {
    case "breaking":
      return {
        label: "Breaking",
        badge: "border-red-400/30 bg-red-500/15 text-red-300",
        dot: "bg-red-400",
      };
    case "analysis":
      return {
        label: "Analysis",
        badge: "border-gold-500/40 bg-gold-500/15 text-gold-300",
        dot: "bg-gold-400",
      };
    default: {
      const raw = (category ?? "news").trim() || "news";
      return {
        label: raw.charAt(0).toUpperCase() + raw.slice(1),
        badge: "border-white/20 bg-white/10 text-zinc-200",
        dot: "bg-zinc-300",
      };
    }
  }
}

// Elegant sample articles. Used as a graceful fallback so the News portal
// always looks complete — even before the `articles` table has rows. Shapes
// match the joined `ArticleWithAuthor` type.
export const MOCK_ARTICLES: ArticleWithAuthor[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    author_id: "a0000000-0000-4000-8000-000000000001",
    created_at: "2026-06-18T20:30:00.000Z",
    category: "breaking",
    image_url: null,
    slug: "real-madrid-clinch-la-liga-at-the-bernabeu",
    title: "Real Madrid Clinch La Liga Title in Front of a Roaring Bernabéu",
    content:
      "The Santiago Bernabéu erupted as Real Madrid lifted the La Liga trophy once again, confirming the title with two fixtures still to play.\n\nFrom the opening whistle the home side dictated the tempo, pressing high and moving the ball with the kind of authority that has defined this campaign. The breakthrough arrived early and the lead never looked in doubt.\n\nFor the supporters of The Whites Bangladesh watching from thousands of miles away, it was another night to remember in a season that has delivered drama, brilliance, and silverware. ¡Hala Madrid!",
    profiles: { full_name: "TWS Newsroom", avatar_url: null },
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    author_id: "a0000000-0000-4000-8000-000000000002",
    created_at: "2026-06-15T09:00:00.000Z",
    category: "analysis",
    image_url: null,
    slug: "tactical-breakdown-midfield-control",
    title: "Tactical Breakdown: How Madrid Strangled the Midfield",
    content:
      "Control in the middle third has been the foundation of Madrid's success, and the latest performance was a masterclass in structure.\n\nBy staggering the midfield three and inviting pressure onto a single pivot, the side consistently created numerical superiority on the half-turn. Every time the opposition stepped up, a passing lane opened behind them.\n\nIt is the sort of detail that rarely makes the highlight reel but wins matches — and titles.",
    profiles: { full_name: "A. Rahman", avatar_url: null },
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    author_id: "a0000000-0000-4000-8000-000000000001",
    created_at: "2026-06-12T14:10:00.000Z",
    category: "breaking",
    image_url: null,
    slug: "galactico-extension-through-2030",
    title: "Star Forward Commits Future With Extension Through 2030",
    content:
      "Real Madrid have announced a contract extension that keeps a cornerstone of the attack at the club until 2030.\n\nThe agreement ends a summer of speculation and signals the club's intent to build the next era around a core of elite, in-prime talent.\n\nFans greeted the news with relief and celebration across social media.",
    profiles: { full_name: "TWS Newsroom", avatar_url: null },
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    author_id: null,
    created_at: "2026-06-08T07:45:00.000Z",
    category: "analysis",
    image_url: null,
    slug: "la-fabrica-rising-stars",
    title: "The Next Generation: La Fábrica's Rising Stars to Watch",
    content:
      "La Fábrica continues to be one of the most productive academies in world football, and a fresh crop of talent is knocking on the first-team door.\n\nEach of these players brings something different — pace, vision, composure — but they share the technical grounding and competitive edge that the badge demands.\n\nKeep an eye on these names; the future of the club is bright.",
    // No linked profile — exercises the "The Whites Admin" fallback.
    profiles: null,
  },
];
