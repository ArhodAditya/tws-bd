"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LoaderCircle, RefreshCw, XCircle } from "lucide-react";
import { syncFootballData, type SyncResult } from "@/app/admin/actions";

export default function SyncFootballButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = () => {
    setResult(null);
    startTransition(async () => {
      setResult(await syncFootballData());
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {isPending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Syncing…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sync Live Football Data
          </>
        )}
      </button>

      {result ? (
        <p
          className={`flex items-start gap-1.5 text-sm ${
            result.success ? "text-emerald-700" : "text-red-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {result.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
