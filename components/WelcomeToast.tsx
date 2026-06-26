"use client";

import { useEffect, useState } from "react";
import { Crown, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// VIP "welcome back" toast. Fires exactly once per fresh login: the OAuth
// callback redirects back with `?welcome=1`, which this component consumes (and
// strips from the URL) before greeting the Madridista by name. Mounted once in
// the root layout, alongside CartToast.
export default function WelcomeToast() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    // Only greet right after a fresh sign-in. Normal navigation and reloads
    // never carry this marker, so the toast can't spam on every page load.
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") !== "1") return;

    // Consume the marker immediately so a reload can never re-greet.
    params.delete("welcome");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
    );

    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!active || !user) return;

      // Display name from the Google auth metadata; first name keeps it snappy.
      const fullName: string =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "Madridista";
      setName(fullName.split(" ")[0]);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Auto-dismiss a few seconds after the greeting appears.
  useEffect(() => {
    if (!name) return;
    const timer = window.setTimeout(() => setName(null), 6000);
    return () => window.clearTimeout(timer);
  }, [name]);

  if (!name) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[90] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto inline-flex max-w-sm animate-in items-center gap-3 rounded-2xl border border-gold-500/50 bg-gradient-to-br from-midnight-900/95 to-midnight-950/95 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_50px_-10px_rgba(212,175,55,0.7)] backdrop-blur fade-in slide-in-from-top-4 duration-500"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-midnight-950 shadow-[0_0_18px_-4px_rgba(212,175,55,0.9)]">
          <Crown className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <span className="leading-snug">
          Hala Madrid, <span className="text-gradient-gold">{name}</span>! Ready
          to ball out? 👑
        </span>
        <button
          type="button"
          onClick={() => setName(null)}
          aria-label="Dismiss welcome message"
          className="ml-1 shrink-0 rounded-full p-1 text-zinc-400 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
