"use client";

import { useEffect } from "react";
import { PartyPopper } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Floating "added to cart" celebration. Re-keyed on each toast id so the
// enter animation replays for every add; auto-dismisses after a short beat.
export default function CartToast() {
  const { toast, dismissToast, openCart } = useCart();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismissToast, 2600);
    return () => window.clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
      <button
        key={toast.id}
        type="button"
        onClick={() => {
          dismissToast();
          openCart();
        }}
        className="pointer-events-auto inline-flex animate-in items-center gap-3 rounded-full border border-gold-500/40 bg-midnight-900/95 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_40px_-8px_rgba(212,175,55,0.6)] backdrop-blur fade-in slide-in-from-bottom-4 duration-300 hover:border-gold-500/70"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-midnight-950">
          <PartyPopper className="h-4 w-4" />
        </span>
        <span>{toast.message}</span>
        <span className="text-xs font-medium text-gold-300">View cart →</span>
      </button>
    </div>
  );
}
