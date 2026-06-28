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
// POST, so the page gate alone is never enough. Returns the authenticated
// user's id on success so callers can attribute writes (e.g. an article's
// author_id) to the session rather than trusting a client-supplied value.
async function requireAdmin(): Promise<ActionResult & { userId?: string }> {
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
  return { success: true, userId: user.id };
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

export type UpdateArticleInput = {
  id: string;
  title: string;
  slug: string;
  category: string;
  image_url: string | null;
  content: string;
};

// Update an existing news article. Routed through the service-role client on
// purpose: the public Edit form previously wrote with the browser (anon) client,
// and articles RLS scopes UPDATE to the author — so an admin editing *another*
// author's post matched zero rows and Supabase returned `error: null`, making
// the save silently no-op. The admin client bypasses RLS, and we re-verify the
// admin role above (Server Actions are reachable via direct POST).
export async function updateArticle(
  input: UpdateArticleInput
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  const admin = createAdminClient();
  // `.select()` lets us detect a 0-row update instead of reporting a false
  // success — the exact silent failure this action exists to fix.
  const { data, error } = await admin
    .from("articles")
    .update({
      title: input.title,
      slug: input.slug,
      category: input.category,
      image_url: input.image_url,
      content: input.content,
    })
    .eq("id", input.id)
    .select("id");

  if (error) return { success: false, message: error.message };
  if (!data || data.length === 0) {
    return {
      success: false,
      message: "No article was updated — it may have been removed.",
    };
  }

  // Flush every surface the article appears on so the fresh content shows
  // immediately: the news index, homepage teaser, the article page itself
  // (both the literal slug and the dynamic route), and the admin list.
  revalidatePath("/news");
  revalidatePath("/");
  revalidatePath(`/news/${input.slug}`);
  revalidatePath("/news/[slug]", "page");
  revalidatePath("/admin/articles");
  return { success: true };
}

export type CreateArticleInput = {
  title: string;
  slug: string;
  category: string;
  image_url: string | null;
  content: string;
};

// Publish a new article. Mirrors updateArticle: the insert runs on the
// service-role client (consistent write path, immune to articles RLS), gated by
// requireAdmin. The author_id is taken from the verified session — never from
// the client — and we return the inserted slug so the form can route to the
// freshly published article.
export async function createArticle(
  input: CreateArticleInput
): Promise<ActionResult & { slug?: string }> {
  const gate = await requireAdmin();
  if (!gate.success || !gate.userId) return gate;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("articles")
    .insert({
      title: input.title,
      slug: input.slug,
      category: input.category,
      image_url: input.image_url,
      content: input.content,
      author_id: gate.userId,
    })
    .select("slug")
    .single();

  if (error) return { success: false, message: error.message };

  // Surface the new post everywhere it appears immediately.
  revalidatePath("/news");
  revalidatePath("/");
  revalidatePath("/admin/articles");
  return { success: true, slug: data?.slug ?? input.slug };
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
