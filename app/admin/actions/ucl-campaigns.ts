"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/admin-server";
import {
  normalizeCampaignInput,
  type CampaignActionResult,
  type UclCampaignInput,
} from "@/lib/ucl-campaigns";

// NOTE: A "use server" module may only export async functions. The input and
// result types live in "@/lib/ucl-campaigns" — import them from there, never
// re-export them here. (Same constraint as sync-fixtures.ts.)
//
// Every action re-verifies the admin role: Server Actions are reachable by
// direct POST, so the page gate alone is never enough. Writes go through the
// service-role client because `ucl_campaigns` has no write policies at all —
// see the migration for why.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Postgres / PostgREST codes worth translating into something actionable.
const UNIQUE_VIOLATION = "23505";
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

function describeDbError(
  error: { code?: string; message: string },
  year: number
): string {
  if (error.code === UNIQUE_VIOLATION) {
    return `There is already a campaign for ${year}. Edit that one instead.`;
  }
  if (error.code && MISSING_TABLE_CODES.has(error.code)) {
    return "The ucl_campaigns table doesn't exist yet. Run the create_ucl_campaigns migration in the Supabase SQL editor, then try again.";
  }
  return error.message;
}

// Both the public globe and the admin list read these rows.
function revalidateCampaignViews() {
  revalidatePath("/fans-zone");
  revalidatePath("/admin/ucl-history");
}

export async function createUclCampaign(
  input: UclCampaignInput
): Promise<CampaignActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  const parsed = normalizeCampaignInput(input);
  if (!parsed.ok) return { success: false, message: parsed.message };

  const { error } = await createAdminClient()
    .from("ucl_campaigns")
    .insert(parsed.value);

  if (error) {
    return { success: false, message: describeDbError(error, parsed.value.year) };
  }

  revalidateCampaignViews();
  return { success: true };
}

export async function updateUclCampaign(
  id: string,
  input: UclCampaignInput
): Promise<CampaignActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  if (!UUID_PATTERN.test(id)) {
    return { success: false, message: "That campaign can't be edited." };
  }

  const parsed = normalizeCampaignInput(input);
  if (!parsed.ok) return { success: false, message: parsed.message };

  // `.select()` tells an applied update apart from a silent 0-row no-op.
  const { data, error } = await createAdminClient()
    .from("ucl_campaigns")
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");

  if (error) {
    return { success: false, message: describeDbError(error, parsed.value.year) };
  }
  if (!data || data.length === 0) {
    return {
      success: false,
      message: "No campaign was updated — it may have been deleted.",
    };
  }

  revalidateCampaignViews();
  return { success: true };
}

export async function deleteUclCampaign(
  id: string
): Promise<CampaignActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  if (!UUID_PATTERN.test(id)) {
    return { success: false, message: "That campaign can't be deleted." };
  }

  const { data, error } = await createAdminClient()
    .from("ucl_campaigns")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { success: false, message: error.message };
  if (!data || data.length === 0) {
    return {
      success: false,
      message: "No campaign was deleted — it may already be gone.",
    };
  }

  revalidateCampaignViews();
  return { success: true };
}
