// Shared types + read helper for the Match Predictor "kill switch".
//
// Kept separate from the "use server" action file on purpose: a "use server"
// module may only export async functions, so the result type and the synchronous
// helpers below cannot live there. Client Components import the result type from
// here (never from the action file — that trips the Turbopack loader).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/utils/supabase/database.types";

export type PredictorSettings = Tables<"predictor_settings">;

// Result of the admin update action.
export type PredictorSettingsResult = {
  success: boolean;
  message: string;
  settings?: PredictorSettings;
};

// Safe fallback when the settings row can't be read (table not migrated yet, or
// a transient error). Predictor is treated as OFF — the offline card is always a
// safe thing to show, whereas a broken predictor is not. Matches the DB default.
export const DEFAULT_PREDICTOR_SETTINGS: PredictorSettings = {
  id: 1,
  is_active: false,
  offline_message: "Predictor coming soon.",
  updated_at: new Date(0).toISOString(),
};

/**
 * Read the single predictor settings row (id = 1) with any Supabase client
 * (server, browser, or admin). Falls back to {@link DEFAULT_PREDICTOR_SETTINGS}
 * when the row is missing or the query errors, so callers never have to handle
 * a null/throwing read.
 */
export async function fetchPredictorSettings(
  supabase: SupabaseClient<Database>
): Promise<PredictorSettings> {
  const { data } = await supabase
    .from("predictor_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return data ?? DEFAULT_PREDICTOR_SETTINGS;
}
