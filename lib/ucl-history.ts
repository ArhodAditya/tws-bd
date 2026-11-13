// Data layer for the Fans Zone "Reyes de Europa" map: every European Cup /
// UEFA Champions League final Real Madrid have won, in chronological order.
// Mirrors the conventions in lib/formations.ts — plain typed data plus the
// small pure helpers that derive display values from it.

/** `[longitude, latitude]` in decimal degrees — the order GeoJSON and d3-geo use. */
export type LngLat = [longitude: number, latitude: number];

export interface UclTitle {
  /** Calendar year the final was played. Unique, so it doubles as the key. */
  readonly year: number;
  /** Host city of the final. */
  readonly city: string;
  /** Stadium position as `[longitude, latitude]`. */
  readonly coords: LngLat;
  /** The name the win is remembered by, e.g. "La Décima". */
  readonly title: string;
  readonly opponent: string;
  /**
   * Final score with Real Madrid's goals first — "4-3", "3-2 (aet)",
   * "1-1 (5-3 pens)". Use {@link parseScore} rather than reading it directly.
   */
  readonly score: string;
  readonly story: string;
  /** Photo path under /public, e.g. "/ucl/1956.jpg". */
  readonly imageSrc: string;
}

export const uclHistory: readonly UclTitle[] = [
  { year: 1956, city: "Paris", coords: [2.2530, 48.8414], title: "The First Crown", opponent: "Stade de Reims", score: "4-3", story: "The birth of a dynasty. Real Madrid fought back from a 2-0 deficit in the inaugural European Cup final at the Parc des Princes.", imageSrc: "/ucl/1956.jpg" },
  { year: 1957, city: "Madrid", coords: [-3.6883, 40.4531], title: "Glory at Home", opponent: "Fiorentina", score: "2-0", story: "Played at the Santiago Bernabéu, Di Stéfano and Gento secured back-to-back titles in front of 124,000 roaring Madridistas.", imageSrc: "/ucl/1957.jpg" },
  { year: 1958, city: "Brussels", coords: [4.3339, 50.8955], title: "The Three-peat", opponent: "AC Milan", score: "3-2 (aet)", story: "A grueling battle in Brussels. Paco Gento's extra-time winner secured the third consecutive European Cup.", imageSrc: "/ucl/1958.jpg" },
  { year: 1959, city: "Stuttgart", coords: [9.2320, 48.7923], title: "Four in a Row", opponent: "Stade de Reims", score: "2-0", story: "A repeat of the first final. Even with Puskás absent, Mateos and Di Stéfano ensured the trophy stayed in Madrid.", imageSrc: "/ucl/1959.jpg" },
  { year: 1960, city: "Glasgow", coords: [-4.2520, 55.8258], title: "The Greatest Final", opponent: "Eintracht Frankfurt", score: "7-3", story: "Widely considered the greatest final ever played. Puskás scored four and Di Stéfano three in front of 127,000 fans at Hampden Park.", imageSrc: "/ucl/1960.jpg" },
  { year: 1966, city: "Brussels", coords: [4.3339, 50.8955], title: "The Ye-yé Team", opponent: "Partizan", score: "2-1", story: "Led by a veteran Gento and a squad of entirely Spanish players, Madrid came from behind to win their 6th crown.", imageSrc: "/ucl/1966.jpg" },
  { year: 1998, city: "Amsterdam", coords: [4.9419, 52.3144], title: "La Séptima", opponent: "Juventus", score: "1-0", story: "The 32-year wait ended. Predrag Mijatović's iconic goal returned Real Madrid to their rightful throne in Europe.", imageSrc: "/ucl/1998.jpg" },
  { year: 2000, city: "Paris", coords: [2.3600, 48.9245], title: "La Octava", opponent: "Valencia", score: "3-0", story: "The first ever final between two clubs from the same country. Raúl's breakaway goal sealed a dominant victory.", imageSrc: "/ucl/2000.jpg" },
  { year: 2002, city: "Glasgow", coords: [-4.2520, 55.8258], title: "La Novena", opponent: "Bayer Leverkusen", score: "2-1", story: "Defined by Zinédine Zidane's impossible left-footed volley—arguably the most beautiful goal in Champions League history.", imageSrc: "/ucl/2002.jpg" },
  { year: 2014, city: "Lisbon", coords: [-9.1830, 38.7526], title: "La Décima", opponent: "Atlético Madrid", score: "4-1 (aet)", story: "The obsession ended at 92:48. Sergio Ramos' historic header forced extra time, breaking Atlético hearts.", imageSrc: "/ucl/2014.jpg" },
  { year: 2016, city: "Milan", coords: [9.1240, 45.4781], title: "La Undécima", opponent: "Atlético Madrid", score: "1-1 (5-3 pens)", story: "Another agonizing derby final. Cristiano Ronaldo scored the winning penalty in the shootout at the San Siro.", imageSrc: "/ucl/2016.jpg" },
  { year: 2017, city: "Cardiff", coords: [-3.1826, 51.4783], title: "La Duodécima", opponent: "Juventus", score: "4-1", story: "Madrid became the first team to defend the Champions League in the modern era, crushing Juventus with a masterclass half.", imageSrc: "/ucl/2017.jpg" },
  { year: 2018, city: "Kyiv", coords: [30.5219, 50.4334], title: "La Decimotercera", opponent: "Liverpool", score: "3-1", story: "A historic three-peat under Zidane, sealed by Gareth Bale's spectacular overhead kick.", imageSrc: "/ucl/2018.jpg" },
  { year: 2022, city: "Paris", coords: [2.3600, 48.9245], title: "La Decimocuarta", opponent: "Liverpool", score: "1-0", story: "The campaign of miracles. After insane comebacks against PSG, Chelsea, and City, Vini Jr. and a Courtois masterclass won the final.", imageSrc: "/ucl/2022.jpg" },
  { year: 2024, city: "London", coords: [-0.2795, 51.5560], title: "La Quince", opponent: "Borussia Dortmund", score: "2-0", story: "Carvajal and Vinícius struck late at Wembley, securing the 15th title and bidding a perfect farewell to Toni Kroos.", imageSrc: "/ucl/2024.jpg" },
];

// --- Sites ------------------------------------------------------------------
// Several finals were won in the same city (Paris three times; Brussels and
// Glasgow twice), so their markers sit on top of each other at map scale. A
// site groups those titles: it is what a click on the map can actually resolve.

export interface TitleSite {
  readonly city: string;
  /** Mean position of the city's finals — the point used for hit-testing. */
  readonly coords: LngLat;
  /** The titles won here, oldest first. Never empty. */
  readonly titles: readonly UclTitle[];
}

function groupByCity(titles: readonly UclTitle[]): TitleSite[] {
  const byCity = new Map<string, UclTitle[]>();
  for (const title of titles) {
    const group = byCity.get(title.city);
    if (group) group.push(title);
    else byCity.set(title.city, [title]);
  }

  return Array.from(byCity, ([city, group]) => {
    const lng = group.reduce((sum, t) => sum + t.coords[0], 0) / group.length;
    const lat = group.reduce((sum, t) => sum + t.coords[1], 0) / group.length;
    return { city, coords: [lng, lat], titles: group };
  });
}

export const uclSites: readonly TitleSite[] = groupByCity(uclHistory);

// --- Scores -----------------------------------------------------------------

export type ScoreNote =
  | { readonly kind: "extra-time" }
  | { readonly kind: "penalties"; readonly madrid: number; readonly opponent: number }
  | { readonly kind: "other"; readonly text: string };

export interface ParsedScore {
  readonly madrid: number;
  readonly opponent: number;
  /** How the tie was settled when 90 minutes weren't enough; otherwise null. */
  readonly note: ScoreNote | null;
}

const SCORE_PATTERN = /^(\d+)-(\d+)(?:\s*\((.+)\))?$/;
const PENALTIES_PATTERN = /^(\d+)-(\d+)\s*pens?$/i;

/**
 * Split a score string into goals and an optional note. Returns null for
 * anything that doesn't match the "M-O" / "M-O (note)" shape, so callers can
 * fall back to printing the raw string instead of guessing.
 */
export function parseScore(score: string): ParsedScore | null {
  const match = SCORE_PATTERN.exec(score.trim());
  if (!match) return null;

  const [, madrid, opponent, rawNote] = match;
  let note: ScoreNote | null = null;

  if (rawNote) {
    const text = rawNote.trim();
    const pens = PENALTIES_PATTERN.exec(text);
    if (pens) {
      note = { kind: "penalties", madrid: Number(pens[1]), opponent: Number(pens[2]) };
    } else if (text.toLowerCase() === "aet") {
      note = { kind: "extra-time" };
    } else {
      note = { kind: "other", text };
    }
  }

  return { madrid: Number(madrid), opponent: Number(opponent), note };
}

/** Human wording for a {@link ScoreNote}, e.g. "5–3 on penalties". */
export function describeScoreNote(note: ScoreNote): string {
  switch (note.kind) {
    case "extra-time":
      return "After extra time";
    case "penalties":
      return `${note.madrid}–${note.opponent} on penalties`;
    case "other":
      return note.text;
  }
}
