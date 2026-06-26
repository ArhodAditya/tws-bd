"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, RefreshCw, XCircle } from "lucide-react";
import { syncLatestFixtures } from "@/app/admin/actions/sync-fixtures";
// Import the type from the shared lib, NOT the "use server" action file:
// importing a type from a server-actions module trips the Turbopack loader.
import type { SyncFixturesResult } from "@/lib/sync/fixtures";

export default function SyncFixturesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<SyncFixturesResult | null>(null);

  // Auto-dismiss the toast a few seconds after it appears.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSync = () => {
    setToast(null);
    startTransition(async () => {
      const result = await syncLatestFixtures();
      setToast(result);
      // Refresh the server-rendered fixtures list on success.
      if (result.success) router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-3 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {isPending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Syncing…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            🔄 Sync Latest Fixtures from Sofascore
          </>
        )}
      </button>

      {/* Floating toast — same visual language as the cart toast. */}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
          <div
            key={toast.message}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto inline-flex max-w-md animate-in items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)] backdrop-blur fade-in slide-in-from-bottom-4 duration-300 ${
              toast.success
                ? "border-emerald-500/40 bg-midnight-900/95 text-emerald-200"
                : "border-red-500/40 bg-midnight-900/95 text-red-200"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                toast.success
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-red-500/15 text-red-300"
              }`}
            >
              {toast.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
