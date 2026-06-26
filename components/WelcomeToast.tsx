"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Crown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Full-screen VIP welcome overlay. Fires exactly once per fresh login: the OAuth
// callback redirects back with `?welcome=1`, which this component consumes (and
// strips from the URL) before greeting the Madridista by name.
//
// IMPORTANT: showing the overlay is gated ONLY on the marker — never on the
// session read. After the production redirect on Vercel the client's session
// can be momentarily unavailable; the name is best-effort, but the celebration
// must still fire. `useSearchParams()` is why the caller wraps this in
// <Suspense> (so the rest of the route can stay statically rendered).
export default function WelcomeToast() {
  const searchParams = useSearchParams();
  const handled = useRef(false);

  const [visible, setVisible] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    if (searchParams.get("welcome") !== "1") return;
    handled.current = true;

    // Consume the marker immediately (keeping any other params) so a reload can
    // never re-greet.
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    window.history.replaceState(
      null,
      "",
      url.pathname + url.search + url.hash
    );

    let active = true;
    (async () => {
      // Best-effort display name from the Google auth metadata. If the session
      // isn't readable yet, we still greet (generically) rather than show
      // nothing — that decoupling is what fixes the "missing on Vercel" bug.
      let firstName = "Madridista";
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const fullName: string =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            "Madridista";
          firstName = fullName.split(" ")[0];
        }
      } catch {
        // Ignore — keep the generic greeting.
      }
      if (!active) return;
      setName(firstName);
      setVisible(true);
    })();

    return () => {
      active = false;
    };
  }, [searchParams]);

  // Auto-dismiss 5s after the overlay appears, and allow Escape to close.
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 5000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to The Whites Bangladesh"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
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
            <span className="text-gradient-gold">{name ?? "Madridista"}</span>!
            👑
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
