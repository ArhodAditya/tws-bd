import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";

export const metadata: Metadata = {
  title: "Events — Coming Soon — The Whites Bangladesh",
  description:
    "TWS Matchday Screenings are coming. We are preparing something massive for the next El Clásico. ¡Hala Madrid!",
};

export default function EventsPage() {
  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-24 text-center dark:bg-midnight-950">
      {/* Pulsating gold glow behind the headline */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-glow absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/20 blur-[120px] dark:bg-gold-500/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_60%)]" />
      </div>

      {/* Cinematic entrance for the content */}
      <div className="relative animate-in fade-in zoom-in duration-1000 ease-out">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-gold-700 dark:text-gold-300">
          <CalendarClock className="h-3.5 w-3.5" />
          TWS Matchday Screenings
        </span>

        <h1 className="mt-8 font-display text-6xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          <span className="text-gradient-gold">Coming Soon</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-zinc-300 sm:text-xl">
          We are preparing something massive for the next El Clásico.
        </p>

        <p className="mt-8 font-display text-sm font-bold uppercase tracking-[0.4em] text-gold-600 dark:text-gold-400">
          ¡Hala Madrid!
        </p>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-gold-600 dark:text-zinc-400 dark:hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </section>
  );
}
