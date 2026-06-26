"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { PredictorSettingsResult } from "@/lib/predictor-settings";

// NOTE: A "use server" module may only export async functions. Do NOT re-export
// types (e.g. PredictorSettingsResult) from here — consumers import them from
// "@/lib/predictor-settings" instead. (Same constraint as sync-fixtures.ts.)

// Server Actions are reachable via direct POST, so the page gate alone is never
// enough — re-verify the caller is an admin here.
async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

/**
 * Update the global Match Predictor display settings (the off-season kill
 * switch). Re-verifies the caller is an admin, upserts the single settings row
 * (id = 1) via the service-role client, then revalidates the pages that read it.
 *
 * Upsert (not update) so the row is recreated if it's ever missing — the read
 * path tolerates a missing row, and this keeps the write self-healing too.
 */
export async function updatePredictorSettings(input: {
  isActive: boolean;
  offlineMessage: string;
}): Promise<PredictorSettingsResult> {
  if (!(await isAdmin())) {
    return { success: false, message: "Admins only — please sign in as an admin." };
  }

  const offlineMessage = input.offlineMessage.trim();
  if (!offlineMessage) {
    return { success: false, message: "The offline message can't be empty." };
  }
  if (offlineMessage.length > 280) {
    return { success: false, message: "Keep the offline message under 280 characters." };
  }

  // Service-role client: bypasses RLS so the write never depends on the
  // caller's session row-level permissions (admin status is verified above).
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("predictor_settings")
    .upsert(
      {
        id: 1,
        is_active: input.isActive,
        offline_message: offlineMessage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return { success: false, message: `Couldn't save settings: ${error.message}` };
  }

  // Reflect the change on the public Fan Zone and the admin form immediately.
  revalidatePath("/fans-zone");
  revalidatePath("/admin/fixtures");

  return {
    success: true,
    message: input.isActive
      ? "Saved — the predictor is now live on the Fan Zone."
      : "Saved — the predictor is now offline; fans will see your message.",
    settings: data,
  };
}
