// Formation definitions for the Fans Zone Squad Builder.
//
// Slot coordinates are percentages on a *portrait* pitch: x is 0 (left) → 100
// (right), y is 0 (top / attacking third) → 100 (bottom / own goal). The GK
// therefore sits near y≈88 and the forwards near the top.

export type SlotCategory = "GK" | "DEF" | "MID" | "FWD";

export interface FormationSlot {
  /** Unique within a formation, e.g. "DEF2". */
  id: string;
  category: SlotCategory;
  x: number;
  y: number;
  /**
   * Optional human label for the slot's role (e.g. "Left Wing", "Striker").
   * Falls back to the category label when absent.
   */
  label?: string;
  /**
   * Optional list of acceptable detailed position codes (e.g. ["LW","LM","LAM",
   * "LF"]). When present it WIDENS who can fill the slot beyond its base
   * `category`: a slot can then accept players from several categories. This is
   * what lets a winger/attacker (stored broadly as "Attacker") drop into a
   * 4-2-3-1 attacking-midfield slot. See `playerFitsSlot`.
   */
  accepts?: string[];
}

export interface Formation {
  id: string;
  label: string;
  slots: FormationSlot[];
}

// Human-readable singular label for each slot category (used in the picker).
export const CATEGORY_LABEL: Record<SlotCategory, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

// Plural form for section headers.
export const CATEGORY_LABEL_PLURAL: Record<SlotCategory, string> = {
  GK: "Goalkeepers",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
};

// Map a raw `players.position` value to a slot category. The API-Football sync
// stores "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"; this also
// tolerates "Forward"/"Striker"/"Winger"/"Back" variants just in case.
export function positionToCategory(position: string | null): SlotCategory {
  const p = (position ?? "").toLowerCase();
  if (p.includes("keep") || p.includes("goal")) return "GK";
  if (p.includes("def") || p.includes("back")) return "DEF";
  if (p.includes("mid")) return "MID";
  if (
    p.includes("att") ||
    p.includes("forw") ||
    p.includes("strik") ||
    p.includes("wing")
  ) {
    return "FWD";
  }
  return "MID";
}

// Maps a detailed position code (as used in slot `accepts` lists) to the broad
// category our roster actually stores. This is the bridge between fine-grained
// tactical codes (LW, CAM, ST, …) and the coarse "Attacker"/"Midfielder" values
// the API-Football sync writes into `players.position`.
const POSITION_CODE_CATEGORY: Record<string, SlotCategory> = {
  GK: "GK",
  // Defenders
  CB: "DEF",
  LB: "DEF",
  RB: "DEF",
  LWB: "DEF",
  RWB: "DEF",
  // Midfielders (incl. attacking mids and wide mids)
  CM: "MID",
  CDM: "MID",
  DM: "MID",
  CAM: "MID",
  AM: "MID",
  LM: "MID",
  RM: "MID",
  LAM: "MID",
  RAM: "MID",
  // Forwards / wingers
  ST: "FWD",
  CF: "FWD",
  LW: "FWD",
  RW: "FWD",
  LF: "FWD",
  RF: "FWD",
};

// The set of broad categories a slot will accept. With no `accepts` list this
// is just the slot's base category; with one, it's the union of categories the
// listed codes map to (plus the base category as a safety net). De-duplicated.
export function slotAcceptedCategories(slot: FormationSlot): SlotCategory[] {
  if (!slot.accepts || slot.accepts.length === 0) return [slot.category];
  const categories = new Set<SlotCategory>([slot.category]);
  for (const code of slot.accepts) {
    const category = POSITION_CODE_CATEGORY[code.trim().toUpperCase()];
    if (category) categories.add(category);
  }
  return [...categories];
}

// Whether a player (by their stored position string) may fill a given slot.
// Handles the multiple acceptable values gracefully: a direct code match wins,
// otherwise we fall back to comparing broad categories so coarse roster data
// ("Attacker", "Midfielder") still slots into the widened attacking positions.
export function playerFitsSlot(
  position: string | null,
  slot: FormationSlot
): boolean {
  if (slot.accepts && position) {
    const code = position.trim().toUpperCase();
    if (slot.accepts.some((accepted) => accepted.trim().toUpperCase() === code)) {
      return true;
    }
  }
  return slotAcceptedCategories(slot).includes(positionToCategory(position));
}

const gk = (): FormationSlot => ({ id: "GK", category: "GK", x: 50, y: 88 });

export const FORMATIONS: Formation[] = [
  {
    id: "433",
    label: "4-3-3",
    slots: [
      gk(),
      { id: "DEF1", category: "DEF", x: 14, y: 70 },
      { id: "DEF2", category: "DEF", x: 38, y: 72 },
      { id: "DEF3", category: "DEF", x: 62, y: 72 },
      { id: "DEF4", category: "DEF", x: 86, y: 70 },
      { id: "MID1", category: "MID", x: 26, y: 48 },
      { id: "MID2", category: "MID", x: 50, y: 50 },
      { id: "MID3", category: "MID", x: 74, y: 48 },
      { id: "FWD1", category: "FWD", x: 20, y: 22 },
      { id: "FWD2", category: "FWD", x: 50, y: 18 },
      { id: "FWD3", category: "FWD", x: 80, y: 22 },
    ],
  },
  {
    id: "442d",
    label: "4-4-2 (Diamond)",
    slots: [
      gk(),
      { id: "DEF1", category: "DEF", x: 14, y: 70 },
      { id: "DEF2", category: "DEF", x: 38, y: 72 },
      { id: "DEF3", category: "DEF", x: 62, y: 72 },
      { id: "DEF4", category: "DEF", x: 86, y: 70 },
      { id: "MID1", category: "MID", x: 50, y: 58 }, // holding
      { id: "MID2", category: "MID", x: 22, y: 46 }, // left
      { id: "MID3", category: "MID", x: 78, y: 46 }, // right
      { id: "MID4", category: "MID", x: 50, y: 32 }, // attacking
      { id: "FWD1", category: "FWD", x: 36, y: 18 },
      { id: "FWD2", category: "FWD", x: 64, y: 18 },
    ],
  },
  {
    id: "4231",
    label: "4-2-3-1",
    slots: [
      gk(),
      { id: "DEF1", category: "DEF", x: 14, y: 72 },
      { id: "DEF2", category: "DEF", x: 38, y: 73 },
      { id: "DEF3", category: "DEF", x: 62, y: 73 },
      { id: "DEF4", category: "DEF", x: 86, y: 72 },
      { id: "MID1", category: "MID", x: 36, y: 56 }, // double pivot
      { id: "MID2", category: "MID", x: 64, y: 56 },
      // Attacking band — widened so wingers/attacking mids (stored broadly as
      // "Attacker") can fill them, not just central midfielders.
      {
        id: "MID3",
        category: "MID",
        x: 22,
        y: 34,
        label: "Left Wing",
        accepts: ["LW", "LM", "LAM", "LF"],
      },
      {
        id: "MID4",
        category: "MID",
        x: 50,
        y: 32,
        label: "Attacking Mid",
        accepts: ["CAM", "CF", "CM"],
      },
      {
        id: "MID5",
        category: "MID",
        x: 78,
        y: 34,
        label: "Right Wing",
        accepts: ["RW", "RM", "RAM", "RF"],
      },
      {
        id: "FWD1",
        category: "FWD",
        x: 50,
        y: 16,
        label: "Striker",
        accepts: ["ST", "CF", "LW", "RW"],
      },
    ],
  },
  {
    id: "352",
    label: "3-5-2",
    slots: [
      gk(),
      { id: "DEF1", category: "DEF", x: 26, y: 72 },
      { id: "DEF2", category: "DEF", x: 50, y: 73 },
      { id: "DEF3", category: "DEF", x: 74, y: 72 },
      { id: "MID1", category: "MID", x: 10, y: 52 }, // left wing-back
      { id: "MID2", category: "MID", x: 34, y: 50 },
      { id: "MID3", category: "MID", x: 50, y: 56 },
      { id: "MID4", category: "MID", x: 66, y: 50 },
      { id: "MID5", category: "MID", x: 90, y: 52 }, // right wing-back
      { id: "FWD1", category: "FWD", x: 36, y: 20 },
      { id: "FWD2", category: "FWD", x: 64, y: 20 },
    ],
  },
];
