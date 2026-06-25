"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type SyncResult = {
  success: boolean;
  message: string;
};

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
