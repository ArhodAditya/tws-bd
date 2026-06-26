import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchAndUpsertFixtures } from "@/lib/sync/fixtures";

// Uses the Supabase service role key, so it must run on the Node.js runtime.
export const runtime = "nodejs";
// Never cache/prerender: this is a write endpoint guarded by a secret header.
export const dynamic = "force-dynamic";

// Daily Sofascore fixture sync (see vercel.json crons). Guarded by the same
// CRON_SECRET bearer token as /api/cron/sync-football.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchAndUpsertFixtures();

  if (result.success) {
    // Refresh the public Fans Zone so the synced fixture appears immediately.
    revalidatePath("/fans-zone");
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
