import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, ShieldCheck, Crown } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/admin";
import { getFanName } from "@/lib/fans";
import AddAdminForm from "@/components/AddAdminForm";

export const metadata: Metadata = {
  title: "Manage Admins — Admin — The Whites Bangladesh",
};

// Clean access-denied state shown to anyone who isn't the super-admin. We render
// this instead of redirecting so the boundary is explicit and unmistakable.
function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-midnight-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900/40">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
          Unauthorized
        </h1>
        <p className="mt-2 text-slate-600 dark:text-gray-300">
          Super-Admin Access Only.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

type AdminRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  isSuper: boolean;
};

export default async function ManageAdminsPage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Client-side authorization shield: anyone who isn't the super-admin (including
  // signed-out visitors and regular admins) gets the access-denied state. The
  // server action enforces the same rule independently.
  if (!isSuperAdmin(user?.email)) {
    return <AccessDenied />;
  }

  // Build the current-admins list. profiles holds the roles; emails live in
  // auth, so we join the two by id via the service-role client (page is gated).
  const admin = createAdminClient();
  const [{ data: profiles }, { data: authList }] = await Promise.all([
    admin.from("profiles").select("id, full_name").eq("role", "admin"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const emailById = new Map(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  const admins: AdminRow[] = (profiles ?? [])
    .map((p) => {
      const email = emailById.get(p.id) ?? null;
      return {
        id: p.id,
        full_name: p.full_name,
        email,
        isSuper: isSuperAdmin(email),
      };
    })
    // Super-admin first, then alphabetical by display name.
    .sort((a, b) => {
      if (a.isSuper !== b.isSuper) return a.isSuper ? -1 : 1;
      return getFanName(a).localeCompare(getFanName(b));
    });

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
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Manage Admins
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Admin Access
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Promote an existing account to admin. Only you, the super-admin, can
            grant access here.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <AddAdminForm />
        </div>

        {/* Current admins */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
            Current Admins ({admins.length})
          </h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900/40">
            <ul className="divide-y divide-gray-200 dark:divide-white/10">
              {admins.map((row) => {
                const name = getFanName(row);
                return (
                  <li
                    key={row.id}
                    className="flex items-center gap-4 p-4 sm:p-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-base font-bold text-midnight-950 ring-1 ring-gold-500/30">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        <span className="truncate">{name}</span>
                        {row.isSuper ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700 dark:text-gold-300">
                            <Crown className="h-3 w-3" />
                            Super-Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-gray-400">
                        {row.email ?? "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-gray-500">
            The super-admin ({SUPER_ADMIN_EMAIL}) is the only account that can
            grant admin access.
          </p>
        </section>
      </div>
    </div>
  );
}
