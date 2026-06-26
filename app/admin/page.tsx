import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  MessageSquareQuote,
  RadioTower,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import SyncFootballButton from "@/components/SyncFootballButton";

export const metadata: Metadata = {
  title: "Admin Dashboard — The Whites Bangladesh",
};

export default async function AdminPage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may reach the control panel.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex items-center gap-2 text-gold-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Admin
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Control Panel
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Publish news and keep the squad and fixtures in sync with the live
            football data feed.
          </p>
        </div>
      </header>

      {/* Cards */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6 grid gap-6 sm:grid-cols-2">
          {/* Write New Article */}
          <Link
            href="/admin/articles/new"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <FileText className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Write New Article
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-gray-300">
              Craft the next headline for the Madridista faithful and publish it
              instantly.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover:text-gold-700 dark:text-gold-400 dark:group-hover:text-gold-300">
              Open editor
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Sync Live Football Data */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <RadioTower className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Sync Live Football Data
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-gray-300">
              Pull the latest squad and upcoming fixtures from API-Football. Runs
              automatically every day — trigger it here on demand.
            </p>
            <div className="mt-4">
              <SyncFootballButton />
            </div>
          </div>

          {/* Sync Fixtures (Sofascore) */}
          <Link
            href="/admin/fixtures"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <CalendarClock className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Sync Fixtures
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-gray-300">
              Pull Real Madrid&apos;s upcoming fixtures from Sofascore and feed
              the Match Predictor — deduped by fixture id.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover:text-gold-700 dark:text-gold-400 dark:group-hover:text-gold-300">
              Open fixtures sync
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Manage Shop */}
          <Link
            href="/admin/shop"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Manage Shop
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-gray-300">
              Review the full catalogue, edit products, and flip items in or out
              of stock — or add new gear.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover:text-gold-700 dark:text-gold-400 dark:group-hover:text-gold-300">
              Manage inventory
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Manage Testimonials */}
          <Link
            href="/admin/testimonials"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <MessageSquareQuote className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Manage Testimonials
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-gray-300">
              Curate the “Voices of the Madridistas” fan reviews on the About
              page — add new ones or remove the rest.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover:text-gold-700 dark:text-gold-400 dark:group-hover:text-gold-300">
              Manage voices
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Manage Users */}
          <Link
            href="/admin/users"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <Users className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Manage Users
            </h2>
            <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-gray-300">
              Control which accounts appear on the public Fan Zone leaderboard —
              flip any user between visible and hidden.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover:text-gold-700 dark:text-gold-400 dark:group-hover:text-gold-300">
              Leaderboard visibility
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
