"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Star, Trash2 } from "lucide-react";
import { deleteProductReview } from "@/app/actions/reviews";
import {
  averageRating,
  formatReviewDate,
  getProductReviewerName,
  type ReviewWithContext,
} from "@/lib/reviews";

// Static row of 5 stars filled to `value` — mirrors the display used on the
// public product modal so a review reads the same in both places.
function StarRating({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(value)
              ? "fill-gold-400 text-gold-400"
              : "fill-transparent text-slate-300 dark:text-zinc-600"
          }`}
        />
      ))}
    </div>
  );
}

// Admin moderation queue for product reviews (the star ratings fans leave on
// shop items). Unlike fan reviews there is no approve step — product reviews
// publish immediately — so delete is the only moderation lever, and it is
// permanent. Guarded by a confirm(); the row is filtered out on success.
export default function ProductReviewModerationList({
  reviews: initial,
}: {
  reviews: ReviewWithContext[];
}) {
  const [reviews, setReviews] = useState<ReviewWithContext[]>(initial);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const remove = async (review: ReviewWithContext) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setError(null);
    setDeleting((d) => ({ ...d, [review.id]: true }));

    const result = await deleteProductReview(review.id);

    if (!result.success) {
      setError(result.message ?? "Could not delete this review.");
      setDeleting((d) => ({ ...d, [review.id]: false }));
      return;
    }
    setReviews((list) => list.filter((r) => r.id !== review.id));
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-xl dark:border-white/10 dark:bg-slate-900/40">
        <Star className="mx-auto h-10 w-10 text-slate-300 dark:text-white/20" />
        <p className="mt-4 text-slate-500 dark:text-gray-400">
          No product reviews yet.
        </p>
      </div>
    );
  }

  const average = averageRating(reviews);

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500 dark:text-gray-400">
        <span>
          {reviews.length} review{reviews.length === 1 ? "" : "s"} across the
          catalogue
        </span>
        <span aria-hidden>·</span>
        <StarRating value={average} />
        <span>{average} average</span>
      </p>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <ul className="space-y-4">
        {reviews.map((review) => {
          const removing = deleting[review.id];
          const name = getProductReviewerName(review);
          const avatar = review.profiles?.avatar_url ?? null;
          // The product row is gone only if it was deleted out from under the
          // review; show the raw id so the orphan is still actionable.
          const productName = review.products?.name ?? "Deleted product";

          return (
            <li
              key={review.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Author + rating + date */}
                <div className="flex min-w-0 items-center gap-3">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={name}
                      width={40}
                      height={40}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-gold-500/30"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-sm font-bold text-midnight-950 ring-1 ring-gold-500/30">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StarRating value={review.rating} />
                      <span className="text-xs text-slate-500 dark:text-zinc-500">
                        {formatReviewDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(review)}
                  disabled={removing}
                  aria-label={`Delete review by ${name} on ${productName}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                >
                  {removing ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>

              {/* Which product this review is attached to */}
              <Link
                href={`/shop/${review.product_id}`}
                className="mt-3 inline-flex max-w-full items-center rounded-full bg-gold-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-700 transition-colors hover:bg-gold-500/20 dark:text-gold-300"
              >
                <span className="truncate">{productName}</span>
              </Link>

              {/* Review body — a rating with no comment is valid, so this is
                  rendered only when the fan actually wrote something. */}
              {review.comment ? (
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-gray-300">
                  {review.comment}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400 dark:text-zinc-500">
                  Rating only — no comment left.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
