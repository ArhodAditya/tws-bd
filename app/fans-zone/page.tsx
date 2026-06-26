import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ShieldHalf, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { fetchPredictorSettings } from "@/lib/predictor-settings";
import PredictorCard from "@/components/PredictorCard";
import PredictorOffline from "@/components/PredictorOffline";
import Leaderboard from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Fans Zone — The Whites Bangladesh",
  description:
    "The command center for Madridistas in Bangladesh — predict the next match and climb the global leaderboard. ¡Hala Madrid!",
};

// Streamed-in placeholder so the hub paints instantly while the leaderboard
// query resolves on the server.
function LeaderboardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl backdrop-blur dark:border-white/10 dark:bg-midnight-900/60 sm:p-6">
      <div className="animate-pulse space-y-3">
        <div className="mb-5 h-6 w-44 rounded bg-slate-200 dark:bg-white/10" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export default async function FansZonePage() {
  // The Match Predictor "kill switch": when an admin has set it offline we show
  // a premium offline card instead of the predictor (or its sample fallback).
  const supabase = await createClient();
  const predictorSettings = await fetchPredictorSettings(supabase);

  return (
    <div className="relative overflow-hidden bg-slate-50 text-slate-900 dark:bg-midnight-950 dark:text-white">
      {/* Ambient gold glow, matching the rest of the brand surfaces */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(212,175,55,0.12),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <header className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-300">
            <Users className="h-3.5 w-3.5" />
            Fans Zone
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            The Madridista <span className="text-gradient-gold">Command Center</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-zinc-300">
            Predict the next fixture, back your first goalscorer, and rise
            through the ranks of the most passionate Real Madrid community in
            Bangladesh.
          </p>
        </header>

        {/* Dashboard — Predictor (left / top) + Leaderboard (right) */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:mt-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {predictorSettings.is_active ? (
              <PredictorCard />
            ) : (
              <PredictorOffline message={predictorSettings.offline_message} />
            )}
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<LeaderboardSkeleton />}>
              <Leaderboard />
            </Suspense>
          </div>
        </div>

        {/* Squad Builder CTA */}
        <Link
          href="/fans-zone/squad-builder"
          className="group mt-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-r from-white to-slate-100 p-6 shadow-xl backdrop-blur transition-colors hover:border-gold-500/40 dark:from-midnight-900/80 dark:to-midnight-900/40 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-700 dark:text-gold-300">
              <ShieldHalf className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                Squad Builder
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                Pick your formation, build your dream XI from the real squad, and
                export it to share.
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform group-hover:scale-[1.03]">
            Open Builder
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
