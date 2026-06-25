"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { setLeaderboardVisibility } from "@/app/admin/actions";
import { formatPoints, getFanName } from "@/lib/fans";

export type ManagedUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  points: number | null;
  show_on_leaderboard: boolean;
};

export default function UserManagementList({
  users: initial,
}: {
  users: ManagedUser[];
}) {
  const [users, setUsers] = useState<ManagedUser[]>(initial);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const toggleVisibility = async (user: ManagedUser) => {
    const next = !user.show_on_leaderboard;
    setError(null);
    setPending((p) => ({ ...p, [user.id]: true }));
    // Optimistic flip so the toggle feels instant.
    setUsers((list) =>
      list.map((u) =>
        u.id === user.id ? { ...u, show_on_leaderboard: next } : u
      )
    );

    const result = await setLeaderboardVisibility(user.id, next);

    if (!result.success) {
      // Revert on failure and surface the error.
      setUsers((list) =>
        list.map((u) =>
          u.id === user.id
            ? { ...u, show_on_leaderboard: user.show_on_leaderboard }
            : u
        )
      );
      setError(result.message ?? "Could not update visibility.");
    }
    setPending((p) => ({ ...p, [user.id]: false }));
  };

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-xl dark:border-white/10 dark:bg-slate-900/40">
        <p className="text-slate-600 dark:text-gray-300">No users yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900/40">
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-gray-200 dark:divide-white/10">
        {users.map((user) => {
          const busy = pending[user.id];
          const name = getFanName(user);
          const visible = user.show_on_leaderboard;
          const isAdmin = user.role === "admin";
          return (
            <li
              key={user.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
            >
              {/* Avatar / initial */}
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-base font-bold text-midnight-950 ring-1 ring-gold-500/30">
                {name.charAt(0).toUpperCase()}
              </span>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-semibold text-slate-900 dark:text-white">
                  {name}
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700 dark:text-gold-300">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-gray-400">
                  {formatPoints(user.points)} pts
                </p>
              </div>

              {/* Leaderboard visibility toggle */}
              <button
                type="button"
                onClick={() => toggleVisibility(user)}
                disabled={busy}
                aria-pressed={visible}
                title={
                  visible
                    ? "Visible on the leaderboard — click to hide"
                    : "Hidden from the leaderboard — click to show"
                }
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  visible
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                }`}
              >
                {busy ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {visible ? "Visible" : "Hidden"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
