// Shared types and helpers for fixtures and fan profiles — used by the admin
// area (fixture sync list, admin management). Mirrors the conventions in
// lib/articles.ts.

import type { Database } from "@/utils/supabase/database.types";

// --- Source-of-truth row types (generated) -------------------------------

export type Match = Database["public"]["Tables"]["matches"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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
// the legacy "club vs opponent" shape used by manual rows.
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

export function getFanName(entry?: Pick<Profile, "full_name"> | null) {
  return entry?.full_name?.trim() || FALLBACK_FAN_NAME;
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
