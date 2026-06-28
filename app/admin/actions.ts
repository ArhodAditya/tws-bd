"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type SyncResult = {
  success: boolean;
  message: string;
};

export type ActionResult = {
  success: boolean;
  message?: string;
};

// Re-verify the caller is an admin. Server Actions are reachable via direct
// POST, so the page gate alone is never enough.
async function requireAdmin(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, message: "Admins only." };
  }
  return { success: true };
}

// Toggle whether a user appears on the public Fan Zone leaderboard. Uses the
// service-role client so an admin can update *another* user's row (profiles RLS
// typically restricts updates to the owner). Admin status is re-verified above.
export async function setLeaderboardVisibility(
  userId: string,
  visible: boolean
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ show_on_leaderboard: visible })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };

  // Reflect the change on the public leaderboard immediately.
  revalidatePath("/fans-zone");
  return { success: true };
}

// Permanently delete a news article. Uses the service-role client so an admin
// can remove *any* article regardless of articles RLS (which typically scopes
// deletes to the author). Admin status is re-verified above — Server Actions
// are reachable via direct POST, so the page gate alone is never enough.
export async function deleteArticle(id: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  const admin = createAdminClient();
  const { error } = await admin.from("articles").delete().eq("id", id);

  if (error) return { success: false, message: error.message };

  // Clear every cache the article appears in so it disappears immediately:
  // the news index, the homepage "Latest News" teaser, and the admin list.
  revalidatePath("/news");
  revalidatePath("/");
  revalidatePath("/admin/articles");
  return { success: true };
}

// Triggers the football sync route from the admin dashboard. The CRON_SECRET
// never reaches the browser: it's read server-side here and sent as the Bearer
// token on a server-to-server fetch to our own /api/cron/sync-football route.
export async function syncFootballData(): Promise<SyncResult> {
  // Server Actions are reachable via direct POST requests, not just our UI, so
  // re-verify the admin role here — never trust the page gate alone.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, message: "Admins only." };
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return { success: false, message: "CRON_SECRET is not configured." };
  }

  // Resolve our own origin so the action can call the route handler. On Vercel
  // the forwarded headers are set; locally we fall back to host + http.
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) {
    return { success: false, message: "Could not resolve the request host." };
  }
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const url = `${protocol}://${host}/api/cron/sync-football`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cronSecret}` },
      cache: "no-store",
    });
    const data = (await res.json()) as {
      success?: boolean;
      error?: string;
      players?: { fetched: number; upserted: number };
      matches?: { fetched: number; upserted: number };
    };

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error ?? `Sync failed (HTTP ${res.status}).`,
      };
    }

    // Surface the fresh squad/fixtures on the public Fans Zone immediately.
    revalidatePath("/fans-zone");

    return {
      success: true,
      message: `Synced ${data.players?.upserted ?? 0} players and ${
        data.matches?.upserted ?? 0
      } upcoming matches.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Sync request failed: ${message}` };
  }
}
