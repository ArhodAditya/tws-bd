import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import UserManagementList, {
  type ManagedUser,
} from "@/components/UserManagementList";

export const metadata: Metadata = {
  title: "Manage Users — Admin — The Whites Bangladesh",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may manage users.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Use the service-role client for the listing so every account is visible to
  // the admin regardless of profiles RLS. (The page itself is already gated.)
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, role, points, show_on_leaderboard")
    .order("points", { ascending: false, nullsFirst: false });

  const users: ManagedUser[] = data ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="mt-6 flex items-center gap-2 text-gold-300">
            <Users className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Manage Users
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Leaderboard Visibility
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Control which accounts appear on the public Fan Zone leaderboard.
            Toggle a user to “Hidden” to remove them instantly.
          </p>
        </div>
      </header>

      {/* List */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <p className="mb-3 text-sm font-medium text-slate-500 dark:text-gray-400">
            {users.length} user{users.length === 1 ? "" : "s"}
          </p>
          <UserManagementList users={users} />
        </div>
      </div>
    </div>
  );
}
