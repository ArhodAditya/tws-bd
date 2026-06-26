// Shared types, helpers and sample data for the Fans Zone (Match Predictor +
// Global Leaderboard). Mirrors the conventions in lib/articles.ts.

import type { Database } from "@/utils/supabase/database.types";

// --- Source-of-truth row types (generated) -------------------------------

export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];

// The subset of a player we need for the goalscorer dropdown.
export type RosterPlayer = Pick<
  Player,
  "id" | "name" | "kit_number" | "position"
>;

// The subset of a profile shown on the leaderboard.
export type LeaderboardEntry = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "avatar_url" | "points"
>;

// Our club's display name — used as the home side for legacy/manual fixtures
// that predate the Sofascore sync (which stores real home/away teams).
export const CLUB_NAME = "The Whites";

// Build a team crest URL from the synced *_team_id columns. We route through
// our own image proxy (/api/team-logo/[id]) which fetches the Sofascore crest
// server-side — avoiding browser hotlink/CORS blocks and needing no next/image
// remotePatterns entry. Returns null when there's no id to build from.
export function sofascoreTeamLogo(
  teamId: number | null | undefined
): string | null {
  return teamId != null ? `/api/team-logo/${teamId}` : null;
}

export type FixtureSide = {
  name: string;
  logoUrl: string | null;
  // True only for the legacy "club" side, which renders the gold crown rather
  // than a fetched crest.
  isClub: boolean;
};

// Resolve a fixture's home/away sides for display. Prefers the synced
// home_team_*/away_team_* columns (real fixtures from Sofascore); falls back to
// the legacy "club vs opponent" shape used by manual rows and the demo fixture.
export function getFixtureSides(match: Match): {
  home: FixtureSide;
  away: FixtureSide;
} {
  if (match.home_team_id != null || match.away_team_id != null) {
    return {
      home: {
        name: match.home_team_name?.trim() || "Home",
        logoUrl: sofascoreTeamLogo(match.home_team_id),
        isClub: false,
      },
      away: {
        name: match.away_team_name?.trim() || "Away",
        logoUrl: sofascoreTeamLogo(match.away_team_id),
        isClub: false,
      },
    };
  }

  return {
    home: { name: CLUB_NAME, logoUrl: null, isClub: true },
    away: {
      name: match.opponent?.trim() || "Opponent",
      logoUrl: match.opponent_logo_url,
      isClub: false,
    },
  };
}

// Shown when a profile has no name set.
export const FALLBACK_FAN_NAME = "Anonymous Madridista";

export function getFanName(entry?: Pick<LeaderboardEntry, "full_name"> | null) {
  return entry?.full_name?.trim() || FALLBACK_FAN_NAME;
}

// A clean label for a player in the dropdown, e.g. "9 · Mbappé (FWD)".
export function getPlayerLabel(player: RosterPlayer): string {
  const name = player.name?.trim() || "Unknown Player";
  const number = player.kit_number != null ? `${player.kit_number} · ` : "";
  const position = player.position?.trim()
    ? ` (${player.position.trim()})`
    : "";
  return `${number}${name}${position}`;
}

// Format an ISO timestamp into a premium, locale-stable kickoff label.
export function formatKickoff(value?: string | null): string {
  if (!value) return "Date TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBC";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Compact points label, e.g. 1240 → "1,240".
export function formatPoints(points?: number | null): string {
  return (points ?? 0).toLocaleString("en-US");
}

// --- Graceful fallbacks --------------------------------------------------
// Like MOCK_ARTICLES, these keep the Fans Zone looking complete before the
// `matches` / `players` / `profiles` tables have rows.

export const MOCK_MATCH: Match = {
  id: "00000000-0000-4000-8000-0000000000aa",
  api_id: null,
  api_fixture_id: null,
  home_team_id: null,
  home_team_name: null,
  away_team_id: null,
  away_team_name: null,
  opponent: "FC Barcelona",
  competition: "La Liga · El Clásico",
  match_date: "2026-06-27T19:00:00.000Z",
  venue: "Santiago Bernabéu",
  status: "upcoming",
  home_score: null,
  away_score: null,
  opponent_logo_url: null,
};

export const MOCK_ROSTER: RosterPlayer[] = [
  { id: "p-1", name: "Kylian Mbappé", kit_number: 9, position: "FWD" },
  { id: "p-2", name: "Vinícius Júnior", kit_number: 7, position: "FWD" },
  { id: "p-3", name: "Jude Bellingham", kit_number: 5, position: "MID" },
  { id: "p-4", name: "Rodrygo", kit_number: 11, position: "FWD" },
  { id: "p-5", name: "Federico Valverde", kit_number: 8, position: "MID" },
  { id: "p-6", name: "Arda Güler", kit_number: 15, position: "MID" },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: "l-1",
    full_name: "Tanvir Ahmed",
    avatar_url: null,
    points: 1840,
  },
  { id: "l-2", full_name: "Sadia Rahman", avatar_url: null, points: 1610 },
  { id: "l-3", full_name: "Imran Hossain", avatar_url: null, points: 1485 },
  { id: "l-4", full_name: "Nusrat Jahan", avatar_url: null, points: 1320 },
  { id: "l-5", full_name: "Fahim Karim", avatar_url: null, points: 1190 },
  { id: "l-6", full_name: "Rumana Akter", avatar_url: null, points: 1075 },
  { id: "l-7", full_name: "Shakib Al Hasan", avatar_url: null, points: 940 },
  { id: "l-8", full_name: "Maliha Chowdhury", avatar_url: null, points: 815 },
];
