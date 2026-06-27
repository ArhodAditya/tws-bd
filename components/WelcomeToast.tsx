"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Crown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Full-screen VIP welcome overlay. Fires exactly once per fresh login: the OAuth
// callback sets a short-lived `tws_vip_welcome` cookie, which this component
// detects on mount (via document.cookie) and deletes immediately so it can't
// re-fire on a refresh.
//
// Cookie (not a ?welcome query param) because Vercel's static route caching was
// swallowing the query string across the OAuth redirect — the cookie is read at
// runtime client-side and is immune to HTML caching. No useSearchParams, so no
// Suspense boundary is required around this component.
//
// The overlay is guaranteed to appear within 500ms regardless of network: we
// try getSession() (fast local read), fall back to getUser() if needed, and a
// hard 500ms timeout forces a generic "Madridista" greeting otherwise.
export default function WelcomeToast() {
  const handled = useRef(false);

  // `null` until resolved (by session lookup OR the 500ms fallback); gates the UI.
  const [firstName, setFirstName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (handled.current) return;
    if (!document.cookie.includes("tws_vip_welcome=true")) return;
    handled.current = true;

    // Delete the cookie immediately so a refresh can never re-fire the toast.
    document.cookie = "tws_vip_welcome=; Max-Age=0; path=/";

    let resolved = false;
    // Resolve the greeting exactly once — whichever of (session lookup) or the
    // (hard 500ms fallback) wins first.
    const resolve = (name: string) => {
      if (resolved) return;
      resolved = true;
      setFirstName(name);
    };

    const fallback = window.setTimeout(() => resolve("Madridista"), 500);

    (async () => {
      let name = "Madridista";
      try {
        const supabase = createClient();
        // getSession() reads the locally-stored session and is typically the
        // fastest to resolve right after the OAuth redirect.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        let meta = session?.user?.user_metadata;
        // Only hit the network if the session hasn't hydrated yet.
        if (!meta) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          meta = user?.user_metadata;
        }
        name =
          meta?.full_name?.split(" ")[0] ||
          meta?.name?.split(" ")[0] ||
          "Madridista";
      } catch {
        // Network/auth hiccup — keep the generic greeting.
      }
      resolve(name);
    })();

    return () => window.clearTimeout(fallback);
  }, []);

  // Auto-dismiss 5s after the overlay appears; Escape also closes it.
  useEffect(() => {
    if (!firstName || dismissed) return;
    const timer = window.setTimeout(() => setDismissed(true), 5000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDismissed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [firstName, dismissed]);

  // Only render the massive VIP UI once the name state is populated.
  if (!firstName || dismissed) return null;

  const dismiss = () => setDismissed(true);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to The Whites Bangladesh"
      // z-[9999] + pointer-events-auto so the overlay dominates the screen and
      // can never be hidden behind the navbar (z-50) or any other layer.
      className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      {/* Dark, blurred backdrop — click anywhere to dismiss. */}
      <button
        type="button"
        aria-label="Dismiss welcome"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-midnight-950/70 backdrop-blur-md"
      />

      {/* The centerpiece card. */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-midnight-900 via-midnight-950 to-black p-8 text-center shadow-[0_30px_120px_-20px_rgba(212,175,55,0.5)] ring-1 ring-yellow-500/50 animate-in zoom-in-95 slide-in-from-bottom-6 duration-500 sm:p-10">
        {/* Ambient gold glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(212,175,55,0.18),transparent_60%)]" />
        </div>

        <div className="relative flex flex-col items-center">
          {/* Massive crown medallion */}
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-midnight-950 shadow-[0_0_60px_-8px_rgba(212,175,55,0.95)] ring-4 ring-gold-400/30">
            <Crown className="h-12 w-12" strokeWidth={2.2} />
          </span>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.35em] text-gold-300">
            VIP Access Unlocked
          </p>

          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Hala Madrid,
            <br />
            <span className="text-gradient-gold">{firstName}</span>! 👑
          </h2>

          <p className="mt-4 text-lg font-semibold text-zinc-300">
            Ready to ball out?
          </p>

          <button
            type="button"
            onClick={dismiss}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-8 py-4 text-base font-extrabold text-midnight-950 shadow-[0_0_30px_-6px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] sm:w-auto sm:px-12"
          >
            Let&apos;s Go
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
