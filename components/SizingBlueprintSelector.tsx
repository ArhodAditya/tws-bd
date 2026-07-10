"use client";

import { PencilRuler, Plus, Shirt, Snowflake, Trash2 } from "lucide-react";
import {
  FASHION_SIZE_ROWS,
  type SizeChartRow,
  type SizePattern,
} from "@/lib/shop";

// The three sizing blueprints an admin can pick for a product. Jersey uses the
// standard kit chart, Fashion the fixed winter-drop hoodie chart, and Custom
// unlocks free-form chest/length rows stored in `custom_size_chart`.
const BLUEPRINT_OPTIONS: {
  value: SizePattern;
  label: string;
  hint: string;
  icon: typeof Shirt;
}[] = [
  {
    value: "jersey",
    label: "Jersey",
    hint: "Standard football kit chart",
    icon: Shirt,
  },
  {
    value: "fashion",
    label: "Fashion",
    hint: "Winter-drop hoodie chart",
    icon: Snowflake,
  },
  {
    value: "custom",
    label: "Custom Details",
    hint: "Type your own measurements",
    icon: PencilRuler,
  },
];

const rowInputClass =
  "w-full rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-3 py-2 text-sm text-white shadow-sm outline-none transition placeholder:text-zinc-600 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30";

export default function SizingBlueprintSelector({
  pattern,
  onPatternChange,
  customRows,
  onCustomRowsChange,
}: {
  pattern: SizePattern;
  onPatternChange: (pattern: SizePattern) => void;
  customRows: SizeChartRow[];
  onCustomRowsChange: (rows: SizeChartRow[]) => void;
}) {
  const updateRow = (
    index: number,
    field: keyof SizeChartRow,
    value: string
  ) => {
    onCustomRowsChange(
      customRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () =>
    onCustomRowsChange([...customRows, { size: "", chest: "", length: "" }]);

  const removeRow = (index: number) =>
    onCustomRowsChange(customRows.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <span className="block text-sm font-semibold text-white">
        Sizing Blueprint{" "}
        <span className="font-normal text-zinc-500">
          (picks the size chart shown on the product page)
        </span>
      </span>

      {/* Three-way toggle group */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        {BLUEPRINT_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
          const active = pattern === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onPatternChange(value)}
              aria-pressed={active}
              className={`flex flex-col items-start gap-1.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                active
                  ? "border-gold-500 bg-gold-500/10 shadow-[0_0_18px_-10px_rgba(212,175,55,0.9)]"
                  : "border-zinc-800/80 bg-zinc-950/60 hover:border-gold-500/40"
              }`}
            >
              <span
                className={`flex items-center gap-2 text-sm font-bold ${
                  active ? "text-gold-300" : "text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span className="text-xs text-zinc-500">{hint}</span>
            </button>
          );
        })}
      </div>

      {/* Fashion: read-only preview of the fixed winter-drop chart */}
      {pattern === "fashion" ? (
        <div className="rounded-xl border border-sky-300/20 bg-sky-500/[0.04] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200/80">
            Winter-drop chart (auto-applied)
          </p>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="pb-1.5 pr-4">Size</th>
                <th className="pb-1.5 pr-4">Chest</th>
                <th className="pb-1.5">Length</th>
              </tr>
            </thead>
            <tbody>
              {FASHION_SIZE_ROWS.map((row) => (
                <tr key={row.size} className="border-t border-white/10">
                  <td className="py-1.5 pr-4 font-bold text-white">
                    {row.size}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums text-zinc-300">
                    {row.chest}
                  </td>
                  <td className="py-1.5 tabular-nums text-zinc-300">
                    {row.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Custom: free-form chest/length rows */}
      {pattern === "custom" ? (
        <div className="space-y-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3.5">
          <div className="grid grid-cols-[1fr_1fr_1fr_2.25rem] gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Size</span>
            <span>Chest</span>
            <span>Length</span>
            <span />
          </div>
          {customRows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1fr_2.25rem] items-center gap-2"
            >
              <input
                type="text"
                value={row.size}
                onChange={(e) => updateRow(index, "size", e.target.value)}
                placeholder="M"
                aria-label={`Row ${index + 1} size`}
                className={rowInputClass}
              />
              <input
                type="text"
                value={row.chest}
                onChange={(e) => updateRow(index, "chest", e.target.value)}
                placeholder={'40"'}
                aria-label={`Row ${index + 1} chest`}
                className={rowInputClass}
              />
              <input
                type="text"
                value={row.length}
                onChange={(e) => updateRow(index, "length", e.target.value)}
                placeholder={'27"'}
                aria-label={`Row ${index + 1} length`}
                className={rowInputClass}
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label={`Remove row ${index + 1}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800/80 text-zinc-500 transition hover:border-red-500/50 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold-500/40 bg-gold-500/5 px-3 py-1.5 text-xs font-semibold text-gold-300 transition hover:bg-gold-500/15"
          >
            <Plus className="h-3.5 w-3.5" />
            Add size row
          </button>
        </div>
      ) : null}
    </div>
  );
}
