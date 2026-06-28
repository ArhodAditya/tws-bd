"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck, LoaderCircle, Lock, Megaphone, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { submitFanReview } from "@/app/actions/reviews";
import { MAX_DISPLAY_NAME_LENGTH, MAX_REVIEW_LENGTH } from "@/lib/fan-reviews";

// The submission box for the "Voices of the Madridistas" wall. A logged-in fan
// drops a review; it's queued for admin approval (the server action creates it
// unapproved). Logged-out fans get a Google sign-in CTA instead — the same
// OAuth flow the Navbar uses.
export default function FanReviewForm() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Track the session so the CTA swaps between "Drop Review" and the login
  // prompt, and stays live across sign-in / sign-out (same pattern as Navbar).
  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const value = text.trim();
    if (!value) {
      setError("Write something first, blud.");
      return;
    }

    setSubmitting(true);
    const result = await submitFanReview(value, displayName);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "Could not drop your review. Try again.");
      return;
    }

    setText("");
    setDisplayName("");
    setDone(true);
  };

  const remaining = MAX_REVIEW_LENGTH - text.length;

  return (
    <div className="relative mx-auto mt-12 max-w-2xl overflow-hidden rounded-3xl border border-gold-500/25 bg-gradient-to-br from-white to-slate-100 p-6 shadow-2xl dark:from-midnight-900 dark:to-midnight-950 sm:p-8">
      {/* Ambient gold bloom for that premium Bernabéu-at-night feel */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 text-gold-700 dark:text-gold-300">
          <Megaphone className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em]">
            Your Take
          </span>
        </div>
        <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Let the Bernabéu Hear You 🗣️
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
          Real Madrid runs through your veins? Drop your story for the wall —
          every voice gets a once-over before it goes live. 🤍
        </p>

        {done ? (
          // Stylish success state — the exact post-submission copy.
          <div className="mt-6 rounded-2xl border border-emerald-300/60 bg-emerald-50 px-5 py-6 text-center dark:border-emerald-400/30 dark:bg-emerald-500/10">
            <CircleCheck className="mx-auto h-9 w-9 text-emerald-500 dark:text-emerald-300" />
            <p className="mt-3 text-base font-semibold text-emerald-700 dark:text-emerald-200">
              Review dropped! It&apos;ll go live once the boss approves it. 🤍✨
            </p>
            <button
              type="button"
              onClick={() => setDone(false)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 transition-colors hover:text-gold-600 dark:text-gold-300 dark:hover:text-gold-200"
            >
              Drop another
            </button>
          </div>
        ) : authReady && !userId ? (
          // Logged-out CTA.
          <div className="mt-6">
            <button
              type="button"
              onClick={signIn}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-6 py-3 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-500/20 dark:text-gold-200"
            >
              <Lock className="h-4 w-4" />
              Log in to drop a review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-3">
              <label
                htmlFor="fan-display-name"
                className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-200"
              >
                Display Name{" "}
                <span className="font-normal text-slate-400 dark:text-zinc-500">
                  (leave blank to use your profile name)
                </span>
              </label>
              <input
                id="fan-display-name"
                type="text"
                value={displayName}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting || !authReady}
                placeholder="e.g. Cristiano Ronaldo 👑"
                className="w-full rounded-2xl border border-white/15 bg-midnight-950/60 px-4 py-3 text-white shadow-inner outline-none transition placeholder:text-zinc-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <label htmlFor="fan-review" className="sr-only">
              Your review
            </label>
            <textarea
              id="fan-review"
              rows={4}
              value={text}
              maxLength={MAX_REVIEW_LENGTH}
              onChange={(e) => setText(e.target.value)}
              disabled={submitting || !authReady}
              placeholder="Why's Madrid your everything? Spill it… 👑"
              className="w-full resize-y rounded-2xl border border-white/15 bg-midnight-950/60 px-4 py-3.5 text-white shadow-inner outline-none transition placeholder:text-zinc-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <span
                className={`text-xs ${
                  remaining < 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-400 dark:text-zinc-500"
                }`}
              >
                {remaining} characters left
              </span>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !authReady}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-7 py-3 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Dropping…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Drop Review
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
