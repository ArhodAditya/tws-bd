"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldPlus,
} from "lucide-react";
import { addAdminByEmail } from "@/app/admin/actions";

type Status = { type: "success" | "error"; message: string };

export default function AddAdminForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      try {
        const result = await addAdminByEmail(email);
        if (result.success) {
          setStatus({
            type: "success",
            message: result.message ?? "Admin access granted.",
          });
          setEmail("");
        } else {
          setStatus({
            type: "error",
            message: result.message ?? "Something went wrong.",
          });
        }
      } catch (err) {
        // The server action throws for the super-admin gate; surface it cleanly.
        setStatus({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Unauthorized: Super-Admin access only.",
        });
      }
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
          <ShieldPlus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Invite an Admin
          </h2>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Grant full admin access to an existing account by email.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="admin-email"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-gray-200"
          >
            Enter Gmail Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com"
              disabled={pending}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-slate-900 shadow-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || email.trim().length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 px-4 py-2.5 text-sm font-bold text-midnight-950 shadow-lg transition hover:from-gold-300 hover:to-gold-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Granting…
            </>
          ) : (
            <>
              <ShieldPlus className="h-4 w-4" />
              Grant Admin Access
            </>
          )}
        </button>
      </form>

      {status ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            status.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      ) : null}
    </div>
  );
}
