"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-server";
import {
  fetchAndUpsertFixtures,
  type SyncFixturesResult,
} from "@/lib/sync/fixtures";

// NOTE: A "use server" module may only export async functions — every export is
// turned into a callable server reference by the loader. Do NOT re-export the
// result type from here (that triggers a "SyncFixturesResult is not defined"
// runtime error in the server-actions loader). Consumers import the type
// directly from "@/lib/sync/fixtures" instead.

/**
 * Admin-triggered Sofascore fixture sync. Verifies the caller is an admin, runs
 * the shared sync core, then revalidates the pages that show fixtures.
 */
export async function syncLatestFixtures(): Promise<SyncFixturesResult> {
  if (!(await requireAdmin()).success) {
    return { success: false, message: "Admins only — please sign in as an admin." };
  }

  const result = await fetchAndUpsertFixtures();

  if (result.success) {
    // Surface the fresh fixtures on the public Fans Zone and the admin list.
    revalidatePath("/fans-zone");
    revalidatePath("/admin/fixtures");
  }

  return result;
}
