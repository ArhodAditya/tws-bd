"use client";

import { useCallback, useSyncExternalStore } from "react";

// Both hooks read browser-only state through useSyncExternalStore, which is
// what makes them hydration-safe: React renders the server snapshot during
// hydration (matching the HTML it was sent) and only then switches to the live
// value — no mismatch, and no setState-in-an-effect flash.

const subscribeNever = () => () => {};

/** False on the server and during hydration, true from then on. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

/**
 * Tracks a CSS media query. Always false on the server, so anything that
 * depends on it must already be correct for the "no match" case at first paint.
 *
 * Pass breakpoints in `rem` to stay in lockstep with Tailwind's (which are
 * rem-based and so move with the user's browser font size).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

// Tailwind's `sm` and `lg`, as media queries.
export const MQ_SM = "(min-width: 40rem)";
export const MQ_LG = "(min-width: 64rem)";
