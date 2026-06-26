"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  LoaderCircle,
  Radio,
  Save,
  XCircle,
} from "lucide-react";
import { updatePredictorSettings } from "@/app/admin/actions/predictor-settings";
// Import the type from the shared lib, NOT the "use server" action file:
// importing a type from a server-actions module trips the Turbopack loader.
import type {
  PredictorSettings,
  PredictorSettingsResult,
} from "@/lib/predictor-settings";

export default function PredictorSettingsForm({
  initialSettings,
}: {
  initialSettings: PredictorSettings;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<PredictorSettingsResult | null>(null);

  // Working copy of the form fields…
  const [isActive, setIsActive] = useState(initialSettings.is_active);
  const [message, setMessage] = useState(initialSettings.offline_message);
  // …and the last-saved values, so we can tell whether there's anything to save.
  const [saved, setSaved] = useState({
    is_active: initialSettings.is_active,
    offline_message: initialSettings.offline_message,
  });

  const trimmed = message.trim();
  const dirty =
    isActive !== saved.is_active || trimmed !== saved.offline_message.trim();
  const canSave = dirty && trimmed.length > 0 && !isPending;

  // Auto-dismiss the toast a few seconds after it appears.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSave = () => {
    if (!canSave) return;
    setToast(null);
    startTransition(async () => {
      const result = await updatePredictorSettings({
        isActive,
        offlineMessage: message,
      });
      setToast(result);
      if (result.success && result.settings) {
        // Re-sync the form + baseline with what the server actually stored.
        setIsActive(result.settings.is_active);
        setMessage(result.settings.offline_message);
        setSaved({
          is_active: result.settings.is_active,
          offline_message: result.settings.offline_message,
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Active toggle */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Radio
              className={`h-4 w-4 ${
                isActive ? "text-emerald-500" : "text-slate-400 dark:text-zinc-500"
              }`}
            />
            Predictor Active Status
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {isActive
              ? "Live — fans see the normal Match Predictor."
              : "Offline — fans see your custom message below instead."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label="Toggle predictor active status"
          onClick={() => setIsActive((v) => !v)}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              isActive ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Offline message */}
      <div className="space-y-2">
        <label
          htmlFor="offline-message"
          className="block text-sm font-semibold text-slate-900 dark:text-white"
        >
          Offline Message
        </label>
        <textarea
          id="offline-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isPending}
          rows={3}
          maxLength={280}
          placeholder="Predictor coming soon."
          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500"
        />
        <p className="text-right text-xs text-slate-400 dark:text-zinc-500">
          {trimmed.length}/280
        </p>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Settings
          </>
        )}
      </button>

      {/* Floating toast — same visual language as SyncFixturesButton. */}
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
    </div>
  );
}
