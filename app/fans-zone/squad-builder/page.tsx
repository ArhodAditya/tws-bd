"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  LoaderCircle,
  Plus,
  RotateCcw,
  ShieldHalf,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  CATEGORY_LABEL,
  FORMATIONS,
  playerFitsSlot,
  type Formation,
  type FormationSlot,
  type SlotCategory,
} from "@/lib/formations";

// The slice of a player row the builder needs.
interface SquadPlayer {
  id: string;
  name: string | null;
  kit_number: number | null;
  position: string | null;
  image_url: string | null;
}

type Assignments = Record<string, SquadPlayer>;

const displayName = (player: SquadPlayer): string => {
  const name = player.name?.trim();
  if (!name) return "Unknown";
  return name;
};

// "9" or "—" for the jersey badge.
const kitLabel = (player: SquadPlayer): string =>
  player.kit_number != null ? String(player.kit_number) : "—";

export default function SquadBuilderPage() {
  const [supabase] = useState(() => createClient());

  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formationId, setFormationId] = useState<string>(FORMATIONS[0].id);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [pickerSlot, setPickerSlot] = useState<FormationSlot | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const pitchRef = useRef<HTMLDivElement>(null);

  const formation: Formation =
    FORMATIONS.find((f) => f.id === formationId) ?? FORMATIONS[0];

  // Load the synced roster on mount (anon read is allowed on `players`).
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, kit_number, position, image_url")
        .order("kit_number", { ascending: true });

      if (!active) return;
      if (error) {
        setLoadError(error.message);
      } else {
        setPlayers(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  // Candidates eligible for whichever slot the picker is open on. A slot can
  // accept several positions (e.g. a 4-2-3-1 winger slot takes wingers AND wide
  // midfielders), so we filter by `playerFitsSlot` rather than one rigid
  // category bucket — this is what unblocks placing Vinícius Jr. & co.
  const candidates = useMemo(
    () =>
      pickerSlot
        ? players.filter((player) => playerFitsSlot(player.position, pickerSlot))
        : [],
    [players, pickerSlot]
  );

  const placedIds = useMemo(
    () => new Set(Object.values(assignments).map((p) => p.id)),
    [assignments]
  );

  const filledCount = Object.keys(assignments).length;

  // Switching formation: carry players over to same-category slots in order so
  // a built XI survives a shape change as much as possible.
  const handleFormationChange = useCallback(
    (nextId: string) => {
      const next = FORMATIONS.find((f) => f.id === nextId);
      if (!next) return;

      setAssignments((prev) => {
        const current = FORMATIONS.find((f) => f.id === formationId);
        if (!current) return {};

        // Pool of placed players per category, preserving slot order.
        const pool: Record<SlotCategory, SquadPlayer[]> = {
          GK: [],
          DEF: [],
          MID: [],
          FWD: [],
        };
        for (const slot of current.slots) {
          const player = prev[slot.id];
          if (player) pool[slot.category].push(player);
        }

        const carried: Assignments = {};
        for (const slot of next.slots) {
          const player = pool[slot.category].shift();
          if (player) carried[slot.id] = player;
        }
        return carried;
      });

      setFormationId(nextId);
    },
    [formationId]
  );

  const assignPlayer = (slotId: string, player: SquadPlayer) => {
    setAssignments((prev) => {
      const next: Assignments = {};
      // Ensure a player only occupies one slot: drop them from any other slot.
      for (const [id, p] of Object.entries(prev)) {
        if (p.id !== player.id) next[id] = p;
      }
      next[slotId] = player;
      return next;
    });
    setPickerSlot(null);
  };

  const removePlayer = (slotId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setPickerSlot(null);
  };

  const clearAll = () => setAssignments({});

  const handleExport = async () => {
    if (!pitchRef.current) return;
    setExportError(null);
    setExporting(true);
    try {
      const dataUrl = await toPng(pitchRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#050814",
      });
      const link = document.createElement("a");
      link.download = `the-whites-xi-${formation.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Could not export the lineup."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-midnight-950 text-white">
      {/* Ambient gold glow to match the brand surfaces */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/fans-zone"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Fans Zone
          </Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
                <ShieldHalf className="h-3.5 w-3.5" />
                Squad Builder
              </span>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Build Your <span className="text-gradient-gold">Starting XI</span>
              </h1>
              <p className="mt-3 max-w-xl text-zinc-300">
                Pick a formation, fill every position from the real Real Madrid
                squad, and export your master tactician lineup to share.
              </p>
            </div>
            <span className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold tabular-nums text-zinc-200">
              {filledCount}
              <span className="text-zinc-500">/{formation.slots.length}</span>{" "}
              picked
            </span>
          </div>
        </header>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-300">
              Formation
            </span>
            <span className="relative">
              <select
                value={formationId}
                onChange={(e) => handleFormationChange(e.target.value)}
                className="appearance-none rounded-lg border border-white/15 bg-white/5 py-2.5 pl-4 pr-10 text-sm font-semibold text-white outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 [&>option]:bg-midnight-900"
              >
                {FORMATIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </span>
          </label>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={clearAll}
              disabled={filledCount === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-gold-500/50 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:text-zinc-200"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || filledCount === 0}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {exporting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Lineup
                </>
              )}
            </button>
          </div>
        </div>

        {exportError ? (
          <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {exportError}
          </p>
        ) : null}

        {/* Pitch (this is the exported node) */}
        <div
          ref={pitchRef}
          className="mx-auto max-w-xl rounded-3xl border border-gold-500/20 bg-gradient-to-b from-midnight-900 to-midnight-950 p-4 shadow-2xl sm:p-5"
        >
          {/* Export header strip */}
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShieldHalf className="h-5 w-5 text-gold-400" />
              <span className="font-display text-base font-extrabold tracking-tight">
                The Whites <span className="text-gradient-gold">XI</span>
              </span>
            </div>
            <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-bold tracking-wide text-gold-300">
              {formation.label}
            </span>
          </div>

          <Pitch
            formation={formation}
            assignments={assignments}
            onSlotClick={(slot) => setPickerSlot(slot)}
            loading={loading}
          />

          {/* Export footer strip */}
          <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
            The Whites Bangladesh · ¡Hala Madrid!
          </p>
        </div>

        {loadError ? (
          <p className="mx-auto mt-4 max-w-xl rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Couldn’t load the squad: {loadError}
          </p>
        ) : null}
      </div>

      {/* Player picker */}
      {pickerSlot ? (
        <PlayerPicker
          slot={pickerSlot}
          candidates={candidates}
          placedIds={placedIds}
          currentPlayer={assignments[pickerSlot.id] ?? null}
          onPick={(player) => assignPlayer(pickerSlot.id, player)}
          onRemove={() => removePlayer(pickerSlot.id)}
          onClose={() => setPickerSlot(null)}
        />
      ) : null}
    </div>
  );
}

// --- The pitch ------------------------------------------------------------

function Pitch({
  formation,
  assignments,
  onSlotClick,
  loading,
}: {
  formation: Formation;
  assignments: Assignments;
  onSlotClick: (slot: FormationSlot) => void;
  loading: boolean;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl ring-1 ring-gold-500/15"
      style={{ aspectRatio: "2 / 3" }}
    >
      {/* Turf: deep green with subtle mowing stripes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(180deg, #0f3d2a 0px, #0f3d2a 36px, #0c3322 36px, #0c3322 72px)",
        }}
      />
      {/* Darken toward the brand + vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(212,175,55,0.10), transparent 55%), linear-gradient(180deg, rgba(5,8,20,0.35), rgba(5,8,20,0.55))",
        }}
      />
      {/* Line markings */}
      <PitchLines />

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="h-7 w-7 animate-spin text-gold-300/80" />
        </div>
      ) : (
        formation.slots.map((slot) => {
          const player = assignments[slot.id];
          const slotLabel = slot.label ?? CATEGORY_LABEL[slot.category];
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSlotClick(slot)}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="absolute flex w-[20%] min-w-16 flex-col items-center gap-1 outline-none"
              aria-label={
                player
                  ? `${displayName(player)} — tap to change`
                  : `Add ${slotLabel}`
              }
            >
              {player ? (
                <PlacedToken player={player} />
              ) : (
                <EmptySlot label={slotLabel} />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}

// Realistic white/gold field markings drawn as a single SVG overlay.
function PitchLines() {
  const stroke = "rgba(246,236,196,0.35)";
  return (
    <svg
      viewBox="0 0 100 150"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      fill="none"
      stroke={stroke}
      strokeWidth={0.5}
    >
      {/* Outer boundary */}
      <rect x="4" y="4" width="92" height="142" rx="1.5" />
      {/* Halfway line + centre circle + spot */}
      <line x1="4" y1="75" x2="96" y2="75" />
      <circle cx="50" cy="75" r="11" />
      <circle cx="50" cy="75" r="0.9" fill={stroke} stroke="none" />
      {/* Top penalty area + goal area + arc + spot */}
      <rect x="24" y="4" width="52" height="22" />
      <rect x="38" y="4" width="24" height="9" />
      <circle cx="50" cy="18" r="0.9" fill={stroke} stroke="none" />
      <path d="M 38 26 A 11 11 0 0 0 62 26" />
      {/* Bottom penalty area + goal area + arc + spot */}
      <rect x="24" y="124" width="52" height="22" />
      <rect x="38" y="137" width="24" height="9" />
      <circle cx="50" cy="132" r="0.9" fill={stroke} stroke="none" />
      <path d="M 38 124 A 11 11 0 0 1 62 124" />
      {/* Corner arcs */}
      <path d="M 4 7 A 3 3 0 0 1 7 4" />
      <path d="M 93 4 A 3 3 0 0 1 96 7" />
      <path d="M 96 143 A 3 3 0 0 1 93 146" />
      <path d="M 7 146 A 3 3 0 0 1 4 143" />
    </svg>
  );
}

// A filled position: premium gold jersey with the kit number + a name pill.
// Intentionally pure CSS/SVG (no external <img>) so html-to-image exports it.
function PlacedToken({ player }: { player: SquadPlayer }) {
  return (
    <>
      <span className="relative block h-11 w-11 sm:h-12 sm:w-12">
        <svg viewBox="0 0 48 48" className="h-full w-full drop-shadow-md">
          <defs>
            <linearGradient id="jersey" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6ecc4" />
              <stop offset="50%" stopColor="#e3c66e" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>
          {/* Simple jersey silhouette */}
          <path
            d="M17 5 L7 11 L4 19 L10 22 L11 17 L11 43 L37 43 L37 17 L38 22 L44 19 L41 11 L31 5 Q24 11 17 5 Z"
            fill="url(#jersey)"
            stroke="#b6912a"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <text
            x="24"
            y="31"
            textAnchor="middle"
            fontSize="15"
            fontWeight="800"
            fill="#050814"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {kitLabel(player)}
          </text>
        </svg>
      </span>
      <span className="max-w-full truncate rounded-full bg-midnight-950/85 px-2 py-0.5 text-center text-[10px] font-semibold leading-tight text-white ring-1 ring-gold-500/30 sm:text-[11px]">
        {displayName(player)}
      </span>
    </>
  );
}

// An empty position: dashed ring with a plus + the slot's role label.
function EmptySlot({ label }: { label: string }) {
  return (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-gold-300/50 bg-midnight-950/30 text-gold-200/70 transition group-hover:border-gold-300 sm:h-12 sm:w-12">
        <Plus className="h-5 w-5" />
      </span>
      <span className="rounded-full bg-midnight-950/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 sm:text-[11px]">
        {label}
      </span>
    </>
  );
}

// --- Player picker modal --------------------------------------------------

function PlayerPicker({
  slot,
  candidates,
  placedIds,
  currentPlayer,
  onPick,
  onRemove,
  onClose,
}: {
  slot: FormationSlot;
  candidates: SquadPlayer[];
  placedIds: Set<string>;
  currentPlayer: SquadPlayer | null;
  onPick: (player: SquadPlayer) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Available = same category, not already placed elsewhere (current stays).
  const available = candidates.filter(
    (p) => !placedIds.has(p.id) || p.id === currentPlayer?.id
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-gold-500/20 bg-midnight-900 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-midnight-950/40 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-white">
              Choose a {slot.label ?? CATEGORY_LABEL[slot.category]}
            </h2>
            <p className="text-xs text-zinc-400">
              {available.length} available
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-300 transition hover:border-gold-500/50 hover:text-gold-300"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3">
          {currentPlayer ? (
            <button
              type="button"
              onClick={onRemove}
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              <X className="h-4 w-4" />
              Remove {displayName(currentPlayer)}
            </button>
          ) : null}

          {available.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-zinc-400">
              No players available for this slot.
            </p>
          ) : (
            <ul className="space-y-1">
              {available.map((player) => {
                const isCurrent = player.id === currentPlayer?.id;
                return (
                  <li key={player.id}>
                    <button
                      type="button"
                      onClick={() => onPick(player)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isCurrent
                          ? "bg-gold-500/15 ring-1 ring-gold-500/40"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <PlayerAvatar player={player} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {displayName(player)}
                        </span>
                        <span className="block text-xs text-zinc-400">
                          {player.position ?? "—"}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-white/5 px-2 py-1 text-xs font-bold tabular-nums text-gold-300">
                        #{kitLabel(player)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Picker-only avatar. Uses a plain <img> (display only, never exported) with a
// kit-number fallback — the photo host isn't in next.config remotePatterns, so
// next/image is intentionally avoided here.
function PlayerAvatar({ player }: { player: SquadPlayer }) {
  const [failed, setFailed] = useState(false);
  if (player.image_url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.image_url}
        alt={displayName(player)}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-10 w-10 shrink-0 rounded-full bg-white/5 object-cover ring-1 ring-white/15"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-midnight-700 text-sm font-bold tabular-nums text-gold-300 ring-1 ring-white/15">
      {kitLabel(player)}
    </span>
  );
}
