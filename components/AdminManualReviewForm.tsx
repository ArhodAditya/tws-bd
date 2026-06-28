"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, UserPlus } from "lucide-react";
import { addAdminManualReview } from "@/app/actions/reviews";
import { MAX_DISPLAY_NAME_LENGTH, MAX_REVIEW_LENGTH } from "@/lib/fan-reviews";

// Admin-only form for posting a review "on behalf of" a customer (testimonials
// collected over DMs / WhatsApp / in person). The new row has no user_id and
// goes live immediately; router.refresh() then surfaces it in the queue below.
export default function AdminManualReviewForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDone(false);

    const name = displayName.trim();
    const text = reviewText.trim();
    if (!name) {
      setError("Enter a display name.");
      return;
    }
    if (!text) {
      setError("Enter the review text.");
      return;
    }

    setSubmitting(true);
    const result = await addAdminManualReview(name, text);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "Could not add the review.");
      return;
    }

    setDisplayName("");
    setReviewText("");
    setDone(true);
    // The review is already approved — refresh so it appears in the list below.
    router.refresh();
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 dark:border-white/10 dark:bg-slate-900/40 dark:text-white dark:placeholder:text-gray-500";
  const labelClass =
    "block text-sm font-semibold text-slate-900 dark:text-white";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 sm:p-8"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400">
          <UserPlus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Add Review on Behalf of Customer
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Posts instantly to the public wall — no account needed.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="manual-display-name" className={labelClass}>
          Display Name
        </label>
        <input
          id="manual-display-name"
          type="text"
          required
          value={displayName}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Karim from Dhaka"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="manual-review-text" className={labelClass}>
          Review Text
        </label>
        <textarea
          id="manual-review-text"
          rows={4}
          required
          value={reviewText}
          maxLength={MAX_REVIEW_LENGTH}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Best Madrid fanpage in Bangladesh — fast delivery, top quality…"
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {done ? (
        <p className="inline-flex w-full items-center gap-2 rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CircleCheck className="h-4 w-4" />
          Review published to the wall. 🤍
        </p>
      ) : null}

      <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-white/10">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          {submitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Add Review
            </>
          )}
        </button>
      </div>
    </form>
  );
}
