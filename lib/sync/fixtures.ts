// Core Sofascore fixture sync — shared by the admin Server Action
// (app/admin/actions/sync-fixtures.ts) and the daily cron route
// (app/api/cron/sync-fixtures/route.ts).
//
// SERVER-ONLY: this imports the service-role Supabase client and reads
// RAPIDAPI_KEY. Never import it into a Client Component. It performs NO
// authorization of its own — each caller guards access (admin session / cron
// secret) before invoking it.

import { createAdminClient } from "@/utils/supabase/admin";
import type { TablesInsert } from "@/utils/supabase/database.types";

// Real Madrid's team id in Sofascore. Verified against this same wrapper's
// `teams/detail` and `teams/search` endpoints (2829 → "Real Madrid"). Note: the
// dashboard's example URL uses teamId=38, but that id is *Chelsea*, not us.
export const REAL_MADRID_SOFASCORE_ID = 2829;
export const RAPIDAPI_HOST = "sofascore.p.rapidapi.com";
// Upcoming-fixtures endpoint from the apidojo Sofascore wrapper. `pageIndex=0`
// is the first (and, for one club, sufficient) page of next matches. This route
// returns the standard event shape consumed below. Caveat: when a team has no
// scheduled upcoming matches it responds HTTP 200 with an `{ error }` body
// (see the handling in fetchAndUpsertFixtures), not an empty events array.
export const SCHEDULE_URL = `https://${RAPIDAPI_HOST}/teams/get-next-matches?teamId=${REAL_MADRID_SOFASCORE_ID}&pageIndex=0`;

export type SyncFixturesResult = {
  success: boolean;
  message: string;
  synced?: number;
};

// --- Sofascore response shapes (only the fields we consume) ----------------

interface SofascoreTeam {
  id?: number;
  name?: string;
}

interface SofascoreEvent {
  id?: number;
  startTimestamp?: number; // unix seconds
  homeTeam?: SofascoreTeam;
  awayTeam?: SofascoreTeam;
  status?: { type?: string }; // "notstarted" | "inprogress" | "finished"
}

interface SofascoreScheduleResponse {
  events?: SofascoreEvent[];
  // Returned (with HTTP 200) when the team has no upcoming matches.
  error?: { code?: number; message?: string };
}

/**
 * Fetch Real Madrid's upcoming fixtures from the Sofascore RapidAPI wrapper and
 * upsert them into `public.matches`, deduping on `api_fixture_id`. Logos are not
 * stored — the public Predictor builds them from the team ids.
 */
export async function fetchAndUpsertFixtures(): Promise<SyncFixturesResult> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return { success: false, message: "RAPIDAPI_KEY is not configured." };
  }

  try {
    const res = await fetch(SCHEDULE_URL, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        success: false,
        message: `Sofascore request failed (HTTP ${res.status}).`,
      };
    }

    const data = (await res.json()) as SofascoreScheduleResponse;

    // `teams/get-next-matches` answers HTTP 200 with an `{ error }` body when a
    // team has no scheduled upcoming matches (e.g. off-season). A 404 there is a
    // legitimate "nothing to sync", not a transport failure — so report it as an
    // empty sync. Any other error code is surfaced as a real failure.
    if (data.error) {
      if (data.error.code === 404) {
        return {
          success: true,
          synced: 0,
          message: "Sofascore lists no upcoming fixtures for Real Madrid right now.",
        };
      }
      return {
        success: false,
        message: `Sofascore returned an error (code ${data.error.code ?? "?"}: ${data.error.message ?? "unknown"}).`,
      };
    }

    const events = Array.isArray(data.events) ? data.events : [];
    const nowMs = Date.now();

    // Keep only upcoming fixtures that carry the ids/names we need.
    const rows: TablesInsert<"matches">[] = events
      .filter(
        (event) =>
          event.id != null &&
          event.homeTeam?.id != null &&
          event.awayTeam?.id != null &&
          event.status?.type !== "finished" &&
          (event.startTimestamp == null ||
            event.startTimestamp * 1000 >= nowMs)
      )
      .map((event) => ({
        api_fixture_id: event.id!,
        home_team_id: event.homeTeam!.id!,
        home_team_name: event.homeTeam!.name ?? null,
        away_team_id: event.awayTeam!.id!,
        away_team_name: event.awayTeam!.name ?? null,
        match_date: event.startTimestamp
          ? new Date(event.startTimestamp * 1000).toISOString()
          : null,
        // The public Predictor queries `status = 'upcoming'`, so tag synced rows.
        status: "upcoming",
      }));

    if (rows.length === 0) {
      return {
        success: true,
        synced: 0,
        message: "No upcoming fixtures were returned by Sofascore.",
      };
    }

    // Service-role client: bypasses RLS so the sync can write fixtures.
    const admin = createAdminClient();
    const { error, count } = await admin
      .from("matches")
      .upsert(rows, { onConflict: "api_fixture_id", count: "exact" });

    if (error) {
      return { success: false, message: `Database upsert failed: ${error.message}` };
    }

    const synced = count ?? rows.length;
    return {
      success: true,
      synced,
      message: `Synced ${synced} upcoming fixture${synced === 1 ? "" : "s"} from Sofascore.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Sync failed: ${message}` };
  }
}
