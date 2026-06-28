"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, LoaderCircle, MessageSquareQuote } from "lucide-react";
import { toggleReviewApproval } from "@/app/actions/reviews";
import {
  formatFanReviewDate,
  getReviewerName,
  type FanReviewWithAuthor,
} from "@/lib/fan-reviews";

// Admin moderation queue for fan reviews. Each row shows the review, its author
// and date, plus a toggle switch wired to `toggleReviewApproval`. The flip is
// optimistic and reverts on failure (same pattern as UserManagementList).
export default function ReviewModerationList({
  reviews: initial,
}: {
  reviews: FanReviewWithAuthor[];
}) {
  const [reviews, setReviews] = useState<FanReviewWithAuthor[]>(initial);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const toggle = async (review: FanReviewWithAuthor) => {
    const next = !review.is_approved;
    setError(null);
    setPending((p) => ({ ...p, [review.id]: true }));
    // Optimistic flip so the switch feels instant.
    setReviews((list) =>
      list.map((r) => (r.id === review.id ? { ...r, is_approved: next } : r))
    );

    const result = await toggleReviewApproval(review.id, next);

    if (!result.success) {
      // Revert on failure and surface the error.
      setReviews((list) =>
        list.map((r) =>
          r.id === review.id ? { ...r, is_approved: review.is_approved } : r
        )
      );
      setError(result.message ?? "Could not update this review.");
    }
    setPending((p) => ({ ...p, [review.id]: false }));
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-xl dark:border-white/10 dark:bg-slate-900/40">
        <MessageSquareQuote className="mx-auto h-10 w-10 text-slate-300 dark:text-white/20" />
        <p className="mt-4 text-slate-500 dark:text-gray-400">
          No fan reviews submitted yet.
        </p>
      </div>
    );
  }

  const approvedCount = reviews.filter((r) => r.is_approved).length;
  const pendingCount = reviews.length - approvedCount;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
        {reviews.length} review{reviews.length === 1 ? "" : "s"} ·{" "}
        <span className="text-emerald-600 dark:text-emerald-400">
          {approvedCount} live
        </span>{" "}
        ·{" "}
        <span className="text-amber-600 dark:text-amber-400">
          {pendingCount} pending
        </span>
      </p>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <ul className="space-y-4">
        {reviews.map((review) => {
          const busy = pending[review.id];
          const name = getReviewerName(review);
          const avatar = review.profiles?.avatar_url ?? null;
          const approved = review.is_approved;
          return (
            <li
              key={review.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Author + date */}
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
                    <p className="text-xs text-slate-500 dark:text-zinc-500">
                      {formatFanReviewDate(review.created_at)}
                    </p>
                  </div>
                </div>

                {/* Status pill + toggle switch */}
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      approved
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {busy ? (
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                    ) : approved ? null : (
                      <Clock className="h-3 w-3" />
                    )}
                    {approved ? "Live" : "Pending"}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={approved}
                    aria-label={
                      approved ? "Unapprove review" : "Approve review"
                    }
                    onClick={() => toggle(review)}
                    disabled={busy}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      approved
                        ? "bg-emerald-500"
                        : "bg-slate-300 dark:bg-white/15"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        approved ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Review body */}
              <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600 dark:text-gray-300">
                {review.review_text}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
