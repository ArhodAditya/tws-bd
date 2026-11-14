import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  DatabaseZap,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  ScrollText,
  Trophy,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import DeleteCampaignButton from "@/components/DeleteCampaignButton";
import { countWords, type UclCampaign } from "@/lib/ucl-campaigns";

export const metadata: Metadata = {
  title: "UCL History — Admin — The Whites Stories",
};

// Always fresh: this is the editing surface, never a cached view.
export const dynamic = "force-dynamic";

// PostgREST / Postgres codes for "that table isn't there".
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export default async function AdminUclHistoryPage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may manage the campaigns.
  if (!(await isCurrentUserAdmin(supabase))) {
    redirect("/");
  }

  // Service-role read, like the other admin lists — the page is gated above.
  const { data, error } = await createAdminClient()
    .from("ucl_campaigns")
    .select("*")
    .order("year", { ascending: true });

  const campaigns: UclCampaign[] = data ?? [];
  const tableMissing =
    error !== null && error.code !== undefined && MISSING_TABLE_CODES.has(error.code);
  const written = campaigns.filter((c) => countWords(c.detailed_history) > 60).length;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
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
            Back to Dashboard
          </Link>
          <div className="mt-6 flex items-center gap-2 text-gold-300">
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Reyes de Europa
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              UCL History
            </h1>
            {tableMissing ? null : (
              <Link
                href="/admin/ucl-history/new"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03]"
              >
                <Plus className="h-4 w-4" />
                Add campaign
              </Link>
            )}
          </div>
          <p className="mt-3 max-w-xl text-zinc-300">
            Every European Cup on the Fans Zone globe. Open a campaign to write
            its full history, upload the photo of the final, or correct a
            detail — changes appear on the site as soon as you save.
          </p>
          <Link
            href="/fans-zone"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-300 transition-colors hover:text-gold-200"
          >
            View the globe
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* List */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          {tableMissing ? (
            // The project's migrations are applied by hand, so this is a real
            // first-run state: say exactly what to do about it.
            <div className="rounded-2xl border border-gold-500/30 bg-gold-500/[0.06] p-6 shadow-xl backdrop-blur-md sm:p-8">
              <DatabaseZap className="h-8 w-8 text-gold-300" />
              <h2 className="mt-4 font-display text-xl font-bold text-white">
                The campaigns table hasn&apos;t been created yet
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Open the Supabase dashboard, go to the SQL editor, and run the
                contents of{" "}
                <code className="rounded bg-black/40 px-1.5 py-0.5 text-[13px] text-gold-200">
                  supabase/migrations/20261114120000_create_ucl_campaigns.sql
                </code>
                . It creates the table and adds all fifteen titles; then reload
                this page.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Until then the Fans Zone globe shows a built-in copy of the
                same fifteen titles, so nothing is broken for visitors.
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
              <p className="font-semibold">The campaigns couldn&apos;t be loaded.</p>
              <p className="mt-1 text-red-300/90">{error.message}</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium text-zinc-400">
                {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
                {campaigns.length > 0
                  ? ` · ${written} with a full history`
                  : ""}
              </p>

              {campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800/50 bg-zinc-900/40 p-10 text-center backdrop-blur-md">
                  <Trophy className="mx-auto h-10 w-10 text-white/20" />
                  <p className="mt-4 text-sm text-zinc-400">
                    No campaigns yet. Add the first title to put it on the
                    globe.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {campaigns.map((campaign) => {
                    const words = countWords(campaign.detailed_history);
                    return (
                      <li
                        key={campaign.id}
                        className="flex flex-col gap-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-md transition-all duration-300 ease-out hover:border-zinc-700/80 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <span className="w-16 shrink-0 font-display text-2xl font-extrabold tabular-nums text-gold-300">
                            {campaign.year}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-display text-lg font-bold tracking-tight text-white">
                              {campaign.title}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                                {campaign.city}
                              </span>
                              <span aria-hidden className="text-zinc-700">
                                ·
                              </span>
                              <span>
                                {campaign.opponent}, {campaign.score}
                              </span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                                  words > 60
                                    ? "border-pitch-500/30 bg-pitch-500/10 text-pitch-300"
                                    : "border-white/10 bg-white/5 text-zinc-500"
                                }`}
                              >
                                <ScrollText className="h-3 w-3" />
                                {words > 60
                                  ? `${words.toLocaleString("en-US")} words`
                                  : "History not written"}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                                  campaign.image_url
                                    ? "border-pitch-500/30 bg-pitch-500/10 text-pitch-300"
                                    : "border-white/10 bg-white/5 text-zinc-500"
                                }`}
                              >
                                <ImageIcon className="h-3 w-3" />
                                {campaign.image_url ? "Photo added" : "No photo"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-start gap-2">
                          <Link
                            href={`/admin/ucl-history/edit/${campaign.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-300 ease-out hover:border-gold-500 hover:text-amber-400 active:scale-[0.98]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <DeleteCampaignButton
                            id={campaign.id}
                            year={campaign.year}
                            title={campaign.title}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
