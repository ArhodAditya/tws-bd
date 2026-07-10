"use client";

import { useEffect } from "react";
import { Ruler, Snowflake, X } from "lucide-react";
import {
  FASHION_SIZE_ROWS,
  type SizeChartRow,
  type SizePattern,
} from "@/lib/shop";

// Player Version Size Chart — flat (laid-out) measurements in inches.
const JERSEY_SIZE_ROWS = [
  { size: "S", height: '26"', width: '36"' },
  { size: "M", height: '27"', width: '38"' },
  { size: "L", height: '28"', width: '40"' },
  { size: "XL", height: '29"', width: '42"' },
  { size: "2XL", height: '30"', width: '44"' },
] as const;

// Per-pattern header copy so the modal reads right for every blueprint.
const HEADER_COPY: Record<SizePattern, { title: string; subtitle: string }> = {
  jersey: {
    title: "Player Version Size Chart",
    subtitle: "Measurements in inches",
  },
  fashion: {
    title: "Winter Drop Size Chart",
    subtitle: "Hoodie measurements in inches",
  },
  custom: {
    title: "Size Chart",
    subtitle: "Measurements for this drop",
  },
};

const headCellClass =
  "pb-3 pr-4 text-left text-xs font-bold uppercase tracking-[0.15em]";

// Shared chest/length table used by the fashion and custom charts.
function ChestLengthTable({
  rows,
  accent,
}: {
  rows: SizeChartRow[];
  accent: "ice" | "gold";
}) {
  const headColor = accent === "ice" ? "text-sky-200/90" : "text-gold-400";
  const sizeColor = accent === "ice" ? "text-sky-100" : "text-gold-300";
  const hoverBg = accent === "ice" ? "hover:bg-sky-400/5" : "hover:bg-gold-500/5";
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className={headColor}>
          <th className={headCellClass}>Size</th>
          <th className={headCellClass}>Chest</th>
          <th className={`${headCellClass} pr-0`}>Length</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.size}
            className={`border-t border-white/10 transition-colors ${hoverBg}`}
          >
            <td
              className={`py-3 pr-4 font-display text-base font-extrabold ${sizeColor}`}
            >
              {row.size}
            </td>
            <td className="py-3 pr-4 tabular-nums text-zinc-200">
              {row.chest || "—"}
            </td>
            <td className="py-3 tabular-nums text-zinc-200">
              {row.length || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function SizeGuideModal({
  open,
  onClose,
  pattern = "jersey",
  customRows = [],
}: {
  open: boolean;
  onClose: () => void;
  pattern?: SizePattern;
  customRows?: SizeChartRow[];
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

  const { title, subtitle } = HEADER_COPY[pattern];
  const HeaderIcon = pattern === "fashion" ? Snowflake : Ruler;

  return (
    // Sits above the product modal (z-50).
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md animate-in overflow-hidden rounded-2xl border shadow-2xl fade-in zoom-in-95 duration-200 ${
          pattern === "fashion"
            ? "border-sky-300/25 bg-midnight-900"
            : "border-gold-500/25 bg-midnight-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4 ${
            pattern === "fashion"
              ? "bg-gradient-to-r from-sky-400/10 to-transparent"
              : "bg-gradient-to-r from-gold-500/10 to-transparent"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                pattern === "fashion"
                  ? "bg-gradient-to-br from-sky-200 to-sky-400 text-midnight-950"
                  : "bg-gradient-to-br from-gold-300 to-gold-500 text-midnight-950"
              }`}
            >
              <HeaderIcon className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-extrabold leading-tight text-white">
                {title}
              </h3>
              <p className="text-xs text-zinc-400">{subtitle}</p>
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

        {/* Body */}
        <div className="px-6 py-5">
          {pattern === "jersey" ? (
            <>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-gold-400">
                    <th className={headCellClass}>Size</th>
                    <th className={headCellClass}>Height</th>
                    <th className={`${headCellClass} pr-0`}>Width</th>
                  </tr>
                </thead>
                <tbody>
                  {JERSEY_SIZE_ROWS.map((row) => (
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
                Measurements are taken with the jersey laid flat. Width is
                measured armpit-to-armpit. If you&rsquo;re between sizes, we
                recommend sizing up. ¡Hala Madrid! 🤍
              </p>
            </>
          ) : null}

          {pattern === "fashion" ? (
            <>
              {/* Winter lookbook panel: icy border, frosted glow, and a faint
                  rotated tracking layer behind the table. */}
              <div className="relative overflow-hidden rounded-xl border border-sky-300/20 bg-gradient-to-br from-sky-950/50 via-midnight-950/60 to-midnight-900/40 p-4 shadow-[0_0_45px_-18px_rgba(125,211,252,0.55)] backdrop-blur-md">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 rotate-90 select-none text-xs font-black uppercase tracking-[0.5em] text-sky-200/10"
                >
                  Winter Drop
                </span>
                <Snowflake
                  aria-hidden
                  className="pointer-events-none absolute -left-5 -top-5 h-20 w-20 text-sky-200/[0.07]"
                />
                <div className="relative">
                  <ChestLengthTable rows={FASHION_SIZE_ROWS} accent="ice" />
                </div>
              </div>

              <p className="mt-5 rounded-lg border border-sky-300/15 bg-sky-400/[0.04] px-4 py-3 text-xs leading-relaxed text-zinc-400">
                Measurements are taken with the hoodie laid flat. Chest is
                measured armpit-to-armpit and doubled. For a relaxed winter
                fit, size up. ¡Hala Madrid! 🤍
              </p>
            </>
          ) : null}

          {pattern === "custom" ? (
            <>
              <ChestLengthTable rows={customRows} accent="gold" />

              <p className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-zinc-400">
                Measurements are taken with the garment laid flat. If
                you&rsquo;re between sizes, we recommend sizing up. ¡Hala
                Madrid! 🤍
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
