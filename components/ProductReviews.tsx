"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, MessageSquare, Send, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  averageRating,
  formatReviewDate,
  type ReviewWithAuthor,
} from "@/lib/reviews";

// Static row of 5 stars filled to `value` (supports halves visually by
// rounding). Used for the summary average and each review's score.
function StarRating({
  value,
  className = "h-4 w-4",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${className} ${
            star <= Math.round(value)
              ? "fill-gold-400 text-gold-400"
              : "fill-transparent text-zinc-600"
          }`}
        />
      ))}
    </div>
  );
}

// Clickable 1–5 star picker for the submit form.
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 ${
              star <= active
                ? "fill-gold-400 text-gold-400"
                : "fill-transparent text-zinc-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [supabase] = useState(() => createClient());

  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Submit-form state.
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the current user and this product's reviews on mount / product change.
  useEffect(() => {
    let active = true;

    const load = async () => {
      const [{ data: auth }, { data }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("product_reviews")
          .select("*, profiles(full_name, avatar_url)")
          .eq("product_id", productId)
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;
      setUserId(auth.user?.id ?? null);
      setReviews((data as ReviewWithAuthor[] | null) ?? []);
      setLoaded(true);
    };

    load();
    return () => {
      active = false;
    };
  }, [supabase, productId]);

  const average = averageRating(reviews);
  const alreadyReviewed = userId
    ? reviews.some((r) => r.user_id === userId)
    : false;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Please pick a star rating.");
      return;
    }
    if (!userId) return;

    setSubmitting(true);
    const { data, error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        user_id: userId,
        rating,
        comment: comment.trim() || null,
      })
      .select("*, profiles(full_name, avatar_url)")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // Prepend the new review so the fan sees it instantly.
    setReviews((prev) => [data as ReviewWithAuthor, ...prev]);
    setRating(0);
    setComment("");
    setSubmitting(false);
  };

  return (
    <section className="mt-8 border-t border-white/10 pt-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <MessageSquare className="h-5 w-5 text-gold-400" />
          Fan Reviews
        </h3>
        {reviews.length > 0 ? (
          <div className="flex items-center gap-2">
            <StarRating value={average} />
            <span className="text-sm font-semibold text-white">
              {average.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-400">
              ({reviews.length} review{reviews.length === 1 ? "" : "s"})
            </span>
          </div>
        ) : null}
      </div>

      {/* Review list */}
      <div className="mt-4 space-y-4">
        {!loaded ? (
          <p className="flex items-center gap-2 text-sm text-zinc-400">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading reviews…
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No reviews yet — be the first Madridista to share your verdict.
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  {review.profiles?.full_name?.trim() || "Anonymous Fan"}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatReviewDate(review.created_at)}
                </span>
              </div>
              <div className="mt-1.5">
                <StarRating value={review.rating} className="h-3.5 w-3.5" />
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {review.comment}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Submit form (only once we know the auth state) */}
      {loaded && userId && !alreadyReviewed ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-gold-500/20 bg-gold-500/[0.04] p-4"
        >
          <p className="text-sm font-semibold text-white">Leave your review</p>
          <div className="mt-3">
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How's the quality, fit, or feel? (optional)"
            className="mt-3 w-full resize-y rounded-lg border border-white/15 bg-midnight-950/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
          />
          {error ? (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          ) : null}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Posting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Review
                </>
              )}
            </button>
          </div>
        </form>
      ) : loaded && userId && alreadyReviewed ? (
        <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
          Thanks — you&apos;ve already reviewed this product.
        </p>
      ) : loaded && !userId ? (
        <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
          Sign in to leave a star rating and review.
        </p>
      ) : null}
    </section>
  );
}
