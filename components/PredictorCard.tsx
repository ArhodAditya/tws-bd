"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  LoaderCircle,
  Lock,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  type Match,
  type RosterPlayer,
  MOCK_MATCH,
  MOCK_ROSTER,
  formatKickoff,
  getFixtureSides,
  getPlayerLabel,
} from "@/lib/fans";

// Small circular team crest. The Whites get the gold crown; the opponent uses
// their logo when available, otherwise a lettered chip.
function TeamCrest({
  name,
  logoUrl,
  isClub,
}: {
  name: string;
  logoUrl?: string | null;
  isClub?: boolean;
}) {
  // Sofascore crest URLs occasionally fail (host hiccups / unknown team) — fall
  // back to the lettered chip instead of showing a broken image.
  const [failed, setFailed] = useState(false);

  if (isClub) {
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 shadow-[0_0_20px_-6px_rgba(212,175,55,0.9)]">
        <Crown className="h-7 w-7 text-midnight-950" strokeWidth={2.2} />
      </span>
    );
  }
  if (logoUrl && !failed) {
    return (
      // Plain <img> (not next/image) so dynamically built Sofascore crest URLs
      // don't need to be allow-listed in next.config remotePatterns.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-14 w-14 rounded-full bg-slate-100 object-contain ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/15"
      />
    );
  }
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-slate-100 text-xl font-bold text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

// One team's column: crest, name, and a +/- score stepper.
function TeamColumn({
  name,
  logoUrl,
  isClub,
  value,
  onChange,
  disabled,
}: {
  name: string;
  logoUrl?: string | null;
  isClub?: boolean;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  const stepBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-slate-600 transition hover:border-gold-500/50 hover:text-gold-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-gold-300 dark:disabled:hover:border-white/15 dark:disabled:hover:text-zinc-200";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <TeamCrest name={name} logoUrl={logoUrl} isClub={isClub} />
      <p className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900 dark:text-white">
        {name}
      </p>
      <span className="font-display text-5xl font-extrabold tabular-nums text-slate-900 dark:text-white">
        {value}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${name} score`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
          className={stepBtn}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Increase ${name} score`}
          onClick={() => onChange(Math.min(20, value + 1))}
          disabled={disabled}
          className={stepBtn}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
      <Icon className="h-3.5 w-3.5 text-gold-500/70" />
      {children}
    </span>
  );
}

export default function PredictorCard() {
  const [supabase] = useState(() => createClient());

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  // `isDemo` is true when there's no real upcoming match and we're rendering a
  // sample fixture purely for visual completeness (submissions are disabled).
  const [isDemo, setIsDemo] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [scorerId, setScorerId] = useState("");

  const [existingPredictionId, setExistingPredictionId] = useState<
    string | null
  >(null);
  const [alreadyPredicted, setAlreadyPredicted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load the user, the next upcoming fixture, the roster, and any existing
  // prediction — all on mount.
  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "upcoming")
        .order("match_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      const { data: playersData } = await supabase
        .from("players")
        .select("id, name, kit_number, position")
        .order("kit_number", { ascending: true });

      if (!active) return;

      const realMatch = matchData ?? null;
      setIsDemo(!realMatch);
      setMatch(realMatch ?? MOCK_MATCH);
      setRoster(
        playersData && playersData.length > 0 ? playersData : MOCK_ROSTER
      );
      setUserId(user?.id ?? null);

      // Prefill if this fan has already predicted this (real) match.
      if (user && realMatch) {
        const { data: existing } = await supabase
          .from("predictions")
          .select(
            "id, predicted_home_score, predicted_away_score, predicted_scorer_id"
          )
          .eq("user_id", user.id)
          .eq("match_id", realMatch.id)
          .maybeSingle();

        if (active && existing) {
          setExistingPredictionId(existing.id);
          setHomeScore(existing.predicted_home_score ?? 0);
          setAwayScore(existing.predicted_away_score ?? 0);
          setScorerId(existing.predicted_scorer_id ?? "");
          setAlreadyPredicted(true);
        }
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (isDemo || !match) {
      setError(
        "This is a sample fixture — predictions open once the next match is scheduled."
      );
      return;
    }
    if (!userId) {
      setError("Please log in to submit your prediction.");
      return;
    }

    setSubmitting(true);

    const payload = {
      predicted_home_score: homeScore,
      predicted_away_score: awayScore,
      predicted_scorer_id: scorerId || null,
    };

    try {
      // Update an existing prediction, otherwise insert a fresh one.
      let dbError = null;
      if (existingPredictionId) {
        const { error: updateError } = await supabase
          .from("predictions")
          .update(payload)
          .eq("id", existingPredictionId);
        dbError = updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("predictions")
          .insert({ ...payload, user_id: userId, match_id: match.id })
          .select("id")
          .single();
        dbError = insertError;
        if (data) setExistingPredictionId(data.id);
      }

      if (dbError) {
        setError(dbError.message);
        return;
      }

      setSuccess(true);
      setAlreadyPredicted(true);
    } catch (err) {
      // A thrown error (network drop, unexpected response) would otherwise
      // leave the button stuck on "Saving…" with no feedback — exactly the
      // kind of silent failure this handler must not produce.
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting your prediction. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading skeleton ---------------------------------------------------
  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-midnight-900/60 sm:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-40 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-56 rounded bg-slate-100 dark:bg-white/5" />
          <div className="flex items-center justify-between gap-6 py-4">
            <div className="h-32 flex-1 rounded-xl bg-slate-100 dark:bg-white/5" />
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-32 flex-1 rounded-xl bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="h-11 rounded-lg bg-slate-100 dark:bg-white/5" />
          <div className="h-11 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
      </section>
    );
  }

  // Real home/away sides from the synced columns (falls back to the legacy
  // club-vs-opponent shape for manual rows and the demo fixture).
  const sides = match ? getFixtureSides(match) : null;
  const fieldsDisabled = isDemo || submitting;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl backdrop-blur dark:border-white/10 dark:bg-midnight-900/60">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-midnight-950/40 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-700 dark:text-gold-300">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-extrabold leading-tight text-slate-900 dark:text-white">
              Match Predictor
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Call the result, earn points</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-300">
          {isDemo ? "Preview" : "Upcoming"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
        {/* Fixture meta */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <MetaItem icon={Trophy}>{match?.competition}</MetaItem>
          <MetaItem icon={CalendarDays}>
            {formatKickoff(match?.match_date)}
          </MetaItem>
          <MetaItem icon={MapPin}>{match?.venue}</MetaItem>
        </div>

        {/* Scoreline */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 rounded-xl border border-gray-200 bg-slate-50 px-2 py-5 dark:border-white/5 dark:bg-white/[0.02] sm:gap-4 sm:px-4">
          <TeamColumn
            name={sides?.home.name ?? "Home"}
            logoUrl={sides?.home.logoUrl}
            isClub={sides?.home.isClub}
            value={homeScore}
            onChange={setHomeScore}
            disabled={fieldsDisabled}
          />
          <span className="self-center pt-12 font-display text-xl font-bold text-slate-300 dark:text-zinc-600">
            –
          </span>
          <TeamColumn
            name={sides?.away.name ?? "Away"}
            logoUrl={sides?.away.logoUrl}
            isClub={sides?.away.isClub}
            value={awayScore}
            onChange={setAwayScore}
            disabled={fieldsDisabled}
          />
        </div>

        {/* First goalscorer */}
        <div className="space-y-2">
          <label
            htmlFor="scorer"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white"
          >
            <Sparkles className="h-4 w-4 text-gold-500 dark:text-gold-400" />
            First Goalscorer
          </label>
          <div className="relative">
            <select
              id="scorer"
              value={scorerId}
              onChange={(event) => setScorerId(event.target.value)}
              disabled={fieldsDisabled}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-slate-900 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white [&>option]:bg-white dark:[&>option]:bg-midnight-900"
            >
              <option value="">No goalscorer pick</option>
              {roster.map((player) => (
                <option key={player.id} value={player.id}>
                  {getPlayerLabel(player)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
          </div>
        </div>

        {/* Feedback */}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="inline-flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            Prediction locked in! ¡Hala Madrid!
          </p>
        ) : null}

        {/* Action */}
        {isDemo ? (
          <p className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-gold-500 dark:text-gold-400" />
            Sample fixture — predictions open once the next match is scheduled.
          </p>
        ) : !userId ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-center text-sm font-medium text-gold-700 dark:text-gold-200">
            <Lock className="h-4 w-4" />
            Log in to lock in your prediction.
          </div>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-3 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                {alreadyPredicted ? "Update Prediction" : "Submit Prediction"}
              </>
            )}
          </button>
        )}
      </form>
    </section>
  );
}
