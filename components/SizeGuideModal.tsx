"use client";

import { useEffect } from "react";
import { Ruler, X } from "lucide-react";

// Player Version Size Chart — flat (laid-out) measurements in inches.
const SIZE_ROWS = [
  { size: "S", height: '26"', width: '36"' },
  { size: "M", height: '27"', width: '38"' },
  { size: "L", height: '28"', width: '40"' },
  { size: "XL", height: '29"', width: '42"' },
  { size: "2XL", height: '30"', width: '44"' },
] as const;

export default function SizeGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Sits above the product modal (z-50).
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Jersey size guide"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-in overflow-hidden rounded-2xl border border-gold-500/25 bg-midnight-900 shadow-2xl fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-gold-500/10 to-transparent px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-midnight-950">
              <Ruler className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-extrabold leading-tight text-white">
                Player Version Size Chart
              </h3>
              <p className="text-xs text-zinc-400">Measurements in inches</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-300 transition hover:border-gold-500/50 hover:text-gold-300"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Table */}
        <div className="px-6 py-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-[0.15em] text-gold-400">
                <th className="pb-3 pr-4">Size</th>
                <th className="pb-3 pr-4">Height</th>
                <th className="pb-3">Width</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_ROWS.map((row) => (
                <tr
                  key={row.size}
                  className="border-t border-white/10 transition-colors hover:bg-gold-500/5"
                >
                  <td className="py-3 pr-4 font-display text-base font-extrabold text-gold-300">
                    {row.size}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-zinc-200">
                    {row.height}
                  </td>
                  <td className="py-3 tabular-nums text-zinc-200">
                    {row.width}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-zinc-400">
            Measurements are taken with the jersey laid flat. Width is measured
            armpit-to-armpit. If you&rsquo;re between sizes, we recommend sizing
            up. ¡Hala Madrid! 🤍
          </p>
        </div>
      </div>
    </div>
  );
}
