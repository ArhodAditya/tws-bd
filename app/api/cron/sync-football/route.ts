import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { TablesInsert } from "@/utils/supabase/database.types";

// Uses the Supabase service role key, so it must run on the Node.js runtime.
export const runtime = "nodejs";
// Never cache/prerender: this is a write endpoint guarded by a secret header.
export const dynamic = "force-dynamic";

// Real Madrid in API-Football.
const REAL_MADRID_TEAM_ID = 541;
const API_BASE = "https://v3.football.api-sports.io";

// --- API-Football response shapes (only the fields we consume) -----------

interface ApiSquadPlayer {
  id: number;
  name: string;
  number: number | null;
  position: string | null;
  photo: string | null;
}

interface ApiSquadResponse {
  errors: unknown;
  response: { players: ApiSquadPlayer[] }[];
}

// API-Football reports failures in an `errors` field that is `[]` on success
// but an object of `{ field: message }` (HTTP 200) on most errors.
function hasApiErrors(errors: unknown): boolean {
  if (Array.isArray(errors)) return errors.length > 0;
  if (errors && typeof errors === "object") {
    return Object.keys(errors).length > 0;
  }
  return false;
}

async function apiFootball<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API-Football GET ${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function GET(request: Request) {
  // --- Security: require the cron secret as a Bearer token ---------------
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY is not configured." },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();

  try {
    // --- 1. Squad -> players --------------------------------------------
    // Note: We are using /players/squads (with an 's') as required by the API.
    const squad = await apiFootball<ApiSquadResponse>(
      `/players/squads?team=${REAL_MADRID_TEAM_ID}`,
      apiKey
    );
    
    if (hasApiErrors(squad.errors)) {
      throw new Error(`Squad fetch error: ${JSON.stringify(squad.errors)}`);
    }

    const playerRows: TablesInsert<"players">[] = (
      squad.response[0]?.players ?? []
    ).map((p) => ({
      api_id: p.id,
      name: p.name,
      kit_number: p.number,
      position: p.position,
      image_url: p.photo,
    }));

    let playersUpserted = 0;
    if (playerRows.length > 0) {
      const { error, count } = await supabase
        .from("players")
        .upsert(playerRows, { onConflict: "api_id", count: "exact" });
        
      if (error) throw new Error(`Players upsert failed: ${error.message}`);
      playersUpserted = count ?? playerRows.length;
    }

    // Return success response just for the squad sync
    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      players: { fetched: playerRows.length, upserted: playersUpserted },
      matches: { fetched: 0, upserted: 0, note: "Manual match management active. Fixtures API disabled due to paywall." },
    });
    
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}