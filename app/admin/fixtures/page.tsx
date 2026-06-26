import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getFixtureSides, formatKickoff, type Match } from "@/lib/fans";
import { fetchPredictorSettings } from "@/lib/predictor-settings";
import SyncFixturesButton from "@/components/SyncFixturesButton";
import PredictorSettingsForm from "@/components/PredictorSettingsForm";

export const metadata: Metadata = {
  title: "Sync Fixtures — The Whites Bangladesh",
};

// Always render fresh: the list reflects the latest synced fixtures.
export const dynamic = "force-dynamic";

export default async function AdminFixturesPage() {
  const supabase = await createClient();

  // Auth + strict admin gate (mirrors /admin).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: fixtures } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "upcoming")
    .order("match_date", { ascending: true });

  const upcoming: Match[] = fixtures ?? [];

  const predictorSettings = await fetchPredictorSettings(supabase);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Control Panel
          </Link>
          <div className="mt-6 flex items-center gap-2 text-gold-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Admin
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sync Fixtures
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Pull Real Madrid&apos;s upcoming fixtures from Sofascore. Fixtures
            are matched by their Sofascore id, so syncing repeatedly is safe and
            won&apos;t create duplicates.
          </p>
          <div className="mt-6">
            <SyncFixturesButton />
          </div>
        </div>
      </header>

      {/* Upcoming fixtures */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Upcoming Fixtures
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {upcoming.length} scheduled
              </p>
            </div>
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-400">
              No upcoming fixtures yet. Hit “Sync Latest Fixtures from Sofascore”
              above to pull them in.
            </p>
          ) : (
            <ul className="mt-5 space-y-2.5">
              {upcoming.map((match) => {
                const { home, away } = getFixtureSides(match);
                return (
                  <li
                    key={match.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FixtureCrest name={home.name} logoUrl={home.logoUrl} />
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {home.name}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        vs
                      </span>
                      <FixtureCrest name={away.name} logoUrl={away.logoUrl} />
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {away.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {formatKickoff(match.match_date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Predictor Display Settings — the off-season kill switch */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Predictor Display Settings
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Toggle the public Match Predictor and set the message fans see
                while it&apos;s offline.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <PredictorSettingsForm initialSettings={predictorSettings} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Small crest used in the admin list. Plain <img> (no next/image config needed)
// with a lettered fallback baked behind it for hosts that don't resolve.
function FixtureCrest({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  if (!logoUrl) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-zinc-200">
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      referrerPolicy="no-referrer"
      className="h-7 w-7 shrink-0 rounded-full bg-white object-contain ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/15"
    />
  );
}
