import { CalendarClock, Sparkles } from "lucide-react";

/**
 * Premium "predictor is offline" state shown on the Fan Zone when an admin has
 * switched the Match Predictor off (e.g. during the off-season). Purely
 * presentational — no interactivity — so it stays a Server Component. Sized to
 * match the live PredictorCard so the dashboard grid doesn't reflow.
 */
export default function PredictorOffline({ message }: { message: string }) {
  return (
    <section className="relative flex min-h-[28rem] flex-col items-center justify-center overflow-hidden rounded-2xl border border-gold-500/20 bg-white px-6 py-12 text-center shadow-xl backdrop-blur dark:border-white/10 dark:bg-midnight-900/60 sm:px-10 sm:py-16">
      {/* Ambient gold glow, matching the brand surfaces */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(212,175,55,0.12),transparent_60%)]" />
      </div>

      <div className="relative flex flex-col items-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-300">
          <Sparkles className="h-3.5 w-3.5" />
          Match Predictor
        </span>

        {/* Crest medallion */}
        <span className="mt-8 flex h-20 w-20 items-center justify-center rounded-full border border-gold-500/30 bg-gradient-to-br from-gold-300/25 to-gold-600/10 text-gold-600 shadow-[0_0_45px_-10px_rgba(212,175,55,0.8)] dark:text-gold-300">
          <CalendarClock className="h-9 w-9" />
        </span>

        {/* The admin's custom message — rendered as plain text (React escapes it),
            with `whitespace-pre-line` so intentional line breaks are kept. */}
        <h2 className="mt-8 max-w-md whitespace-pre-line font-display text-2xl font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {message}
        </h2>

        <p className="mt-3 max-w-sm text-sm text-slate-500 dark:text-zinc-400">
          Predictions are paused for now — check back soon. The next fixture drops
          here first. ¡Hala Madrid!
        </p>

        {/* Decorative divider */}
        <span className="mt-9 h-px w-24 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      </div>
    </section>
  );
}
