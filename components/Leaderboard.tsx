import Image from "next/image";
import { Crown, Medal, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import {
  type LeaderboardEntry,
  formatPoints,
  getFanName,
} from "@/lib/fans";

// Exact empty-state copy (kept as a string so JSX never has to escape the
// apostrophe, and the wording stays verbatim).
const EMPTY_LEADERBOARD_COPY =
  "Ain't nobody up here yet! Drop your predictions, secure the bag, and rule the Bernabéu, blud. 🤍✨";

// Circular fan avatar — uses next/image when a picture exists, otherwise a
// gold initial chip. `highlight` gives the #1 rank a brighter gold ring.
function FanAvatar({
  src,
  name,
  highlight,
}: {
  src: string | null;
  name: string;
  highlight?: boolean;
}) {
  const ring = highlight ? "ring-2 ring-gold-400" : "ring-1 ring-gold-500/30";
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={44}
        height={44}
        referrerPolicy="no-referrer"
        className={`h-11 w-11 rounded-full object-cover ${ring}`}
      />
    );
  }
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-base font-bold text-midnight-950 ${ring}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

// The little rank chip on the left of each row. Top three get metallic accents.
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-midnight-950 shadow-[0_0_16px_-4px_rgba(212,175,55,0.9)]">
        <Crown className="h-4 w-4" strokeWidth={2.4} />
      </span>
    );
  }
  if (rank === 2 || rank === 3) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-slate-100 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200">
        <Medal className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold tabular-nums text-slate-400 dark:text-zinc-500">
      {rank}
    </span>
  );
}

function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const name = getFanName(entry);
  const isGalactico = rank === 1;

  // The #1 "Galáctico" gets the premium gold treatment; everyone else sits on
  // a subtle translucent surface that lifts on hover.
  const rowClass = isGalactico
    ? "border-gold-500/40 bg-gradient-to-r from-gold-500/15 via-gold-500/5 to-transparent shadow-[0_0_24px_-10px_rgba(212,175,55,0.8)]"
    : "border-gray-200 bg-slate-50 hover:border-gold-500/25 hover:bg-slate-100 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-gold-500/25 dark:hover:bg-white/[0.06]";

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors sm:gap-4 sm:px-4 ${rowClass}`}
    >
      <RankBadge rank={rank} />
      <FanAvatar
        src={entry.avatar_url}
        name={name}
        highlight={isGalactico}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold ${
            isGalactico
              ? "text-slate-900 dark:text-white"
              : "text-slate-800 dark:text-zinc-100"
          }`}
        >
          {name}
        </p>
        {isGalactico ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-300">
            <Trophy className="h-3 w-3" />
            Galáctico
          </span>
        ) : (
          <p className="text-xs text-slate-500 dark:text-zinc-500">Madridista</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`font-display text-lg font-extrabold tabular-nums ${
            isGalactico
              ? "text-gradient-gold"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {formatPoints(entry.points)}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          pts
        </p>
      </div>
    </li>
  );
}

export default async function Leaderboard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, points")
    // Strictly only accounts an admin has marked visible appear on the board.
    .eq("show_on_leaderboard", true)
    .order("points", { ascending: false, nullsFirst: false })
    .limit(20);

  const entries: LeaderboardEntry[] = data ?? [];
  const isEmpty = entries.length === 0;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl backdrop-blur dark:border-white/10 dark:bg-midnight-900/60">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-midnight-950/40 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-700 dark:text-gold-300">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-extrabold leading-tight text-slate-900 dark:text-white">
              Global Leaderboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Top 20 Madridistas</p>
          </div>
        </div>
      </div>

      {/* Standings — or the Gen Z empty state when nobody's been curated yet. */}
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          {/* Crown medallion with a little sparkle flourish */}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/30 bg-gradient-to-br from-gold-300/20 to-gold-600/10 text-gold-600 shadow-[0_0_40px_-10px_rgba(212,175,55,0.8)] dark:text-gold-300">
            <Crown className="h-8 w-8" strokeWidth={2} />
            <Sparkles className="absolute -right-1.5 -top-1.5 h-5 w-5 text-gold-400" />
          </span>

          <p className="mt-6 max-w-xs text-base font-semibold leading-relaxed text-slate-700 dark:text-zinc-100">
            {EMPTY_LEADERBOARD_COPY}
          </p>

          {/* Decorative gold divider */}
          <span className="mt-7 h-px w-20 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
        </div>
      ) : (
        <div className="flex-1 px-3 py-4 sm:px-4">
          <ol className="space-y-2">
            {entries.map((entry, index) => (
              <LeaderboardRow key={entry.id} entry={entry} rank={index + 1} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
