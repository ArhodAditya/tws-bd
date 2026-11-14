// Shared types and pure helpers for the UCL campaigns — the rows behind the
// Fans Zone "Reyes de Europa" globe and its admin CMS (/admin/ucl-history).
// Mirrors the conventions in lib/articles.ts: generated row types, a graceful
// fallback, and no server-only imports, so both Server and Client Components
// (and "use server" action files, which may only export functions) can use it.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/utils/supabase/database.types";
import { SEED_CAMPAIGNS } from "@/lib/ucl-campaigns-seed";

export type UclCampaign = Tables<"ucl_campaigns">;

// --- What the Fans Zone loads -----------------------------------------------
// Everything except `detailed_history`. That column can hold many thousands of
// words per campaign, so it is fetched only for the campaign a visitor opens
// (see CampaignHistory) rather than shipped fifteen times over with the page.

export const CAMPAIGN_SUMMARY_COLUMNS =
  "id, year, city, lat, lng, title, opponent, score, heroes, route, image_url, images";

// The same list for a database where the `images` migration hasn't been run
// yet. See fetchCampaignSummaries.
const CAMPAIGN_SUMMARY_COLUMNS_LEGACY =
  "id, year, city, lat, lng, title, opponent, score, heroes, route, image_url";

export type UclCampaignSummary = Pick<
  UclCampaign,
  | "id"
  | "year"
  | "city"
  | "lat"
  | "lng"
  | "title"
  | "opponent"
  | "score"
  | "heroes"
  | "route"
  | "image_url"
  | "images"
>;

/** Where the campaigns on screen came from. */
export type CampaignSource = "database" | "fallback";

// --- Photos -----------------------------------------------------------------

/** How many photos one campaign's gallery may hold. */
export const MAX_CAMPAIGN_IMAGES = 24;

/**
 * A campaign's photos, cover first. Reads the `images` gallery, and falls back
 * to the older single `image_url` — which is all a row has before the `images`
 * migration is run, or if it was last saved before galleries existed.
 */
export function campaignImages(campaign: {
  images?: readonly string[] | null;
  image_url?: string | null;
}): string[] {
  const gallery = (campaign.images ?? [])
    .map((url) => (typeof url === "string" ? url.trim() : ""))
    .filter(Boolean);
  if (gallery.length > 0) return Array.from(new Set(gallery));

  const cover = campaign.image_url?.trim();
  return cover ? [cover] : [];
}

// --- Fallback ---------------------------------------------------------------
// Used when the table is missing (migration not run yet), unreadable, or empty.
// Fallback ids are not UUIDs on purpose: nothing may treat them as database
// rows — in particular the client must not query Supabase for their history.

const fallbackId = (year: number) => `seed-${year}`;

export const FALLBACK_CAMPAIGNS: readonly UclCampaignSummary[] =
  SEED_CAMPAIGNS.map((seed) => ({
    id: fallbackId(seed.year),
    year: seed.year,
    city: seed.city,
    lat: seed.lat,
    lng: seed.lng,
    title: seed.title,
    opponent: seed.opponent,
    score: seed.score,
    heroes: seed.heroes,
    route: seed.route,
    image_url: null,
    images: [],
  }));

/** The seeded one-line history for a fallback campaign, or null. */
export function getFallbackHistory(id: string): string | null {
  const seed = SEED_CAMPAIGNS.find((entry) => fallbackId(entry.year) === id);
  return seed ? seed.detailed_history : null;
}

// Postgres: "column does not exist".
const UNDEFINED_COLUMN = "42703";

/**
 * Load the campaigns for the Fans Zone with any Supabase client, oldest first.
 * Never throws and never comes back empty: if the table is missing, unreadable
 * or has no rows, the built-in copy is returned with `source: "fallback"`.
 *
 * Migrations on this project are applied by hand, so the code can be live
 * before the `images` column exists. Asking for a column that isn't there
 * fails the whole query; rather than drop to the fallback — and hide everything
 * already written in the CMS — the read is retried without it.
 */
export async function fetchCampaignSummaries(
  supabase: SupabaseClient<Database>
): Promise<{
  campaigns: readonly UclCampaignSummary[];
  source: CampaignSource;
}> {
  const current = await supabase
    .from("ucl_campaigns")
    .select(CAMPAIGN_SUMMARY_COLUMNS)
    .order("year", { ascending: true });

  let rows: UclCampaignSummary[] | null = current.data
    ? current.data.map((row) => ({ ...row, images: campaignImages(row) }))
    : null;

  if (rows === null && current.error?.code === UNDEFINED_COLUMN) {
    const legacy = await supabase
      .from("ucl_campaigns")
      .select(CAMPAIGN_SUMMARY_COLUMNS_LEGACY)
      .order("year", { ascending: true });
    rows = legacy.data
      ? legacy.data.map((row) => ({ ...row, images: campaignImages(row) }))
      : null;
  }

  return rows !== null && rows.length > 0
    ? { campaigns: rows, source: "database" }
    : { campaigns: FALLBACK_CAMPAIGNS, source: "fallback" };
}

// --- Sites ------------------------------------------------------------------
// Several finals were won in the same city (Paris three times; Brussels and
// Glasgow twice), so their markers coincide on a globe. A site groups those
// campaigns: it is what a click on the globe can actually resolve to.

export interface CampaignSite {
  /** Stable key — the lower-cased city name. */
  readonly key: string;
  readonly city: string;
  /** Mean position of the city's finals. */
  readonly lat: number;
  readonly lng: number;
  /** The campaigns won here, oldest first. Never empty. */
  readonly campaigns: readonly UclCampaignSummary[];
}

export const siteKey = (city: string) => city.trim().toLowerCase();

export function groupCampaignsByCity(
  campaigns: readonly UclCampaignSummary[]
): CampaignSite[] {
  const byCity = new Map<string, UclCampaignSummary[]>();
  for (const campaign of campaigns) {
    const key = siteKey(campaign.city);
    const group = byCity.get(key);
    if (group) group.push(campaign);
    else byCity.set(key, [campaign]);
  }

  return Array.from(byCity, ([key, group]) => {
    const ordered = [...group].sort((a, b) => a.year - b.year);
    return {
      key,
      city: ordered[0].city.trim(),
      lat: ordered.reduce((sum, c) => sum + c.lat, 0) / ordered.length,
      lng: ordered.reduce((sum, c) => sum + c.lng, 0) / ordered.length,
      campaigns: ordered,
    };
  });
}

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

const SCORE_PATTERN = /^(\d+)\s*[-–]\s*(\d+)(?:\s*\((.+)\))?$/;
const PENALTIES_PATTERN = /^(\d+)\s*[-–]\s*(\d+)\s*pens?\.?$/i;

/**
 * Split a score string ("4-3", "3-2 (aet)", "1-1 (5-3 pens)") into goals and
 * an optional note. Returns null for anything else — scores are free text in
 * the CMS — so callers can print the raw string instead of guessing.
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
    } else if (/^a\.?e\.?t\.?$/i.test(text)) {
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

/** The road to the final as separate rounds (`route` holds one per line). */
export function splitRoute(route: string | null): string[] {
  return (route ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

// --- Admin input ------------------------------------------------------------

/** The editable fields of a campaign, as the admin form submits them. */
export interface UclCampaignInput {
  year: number;
  city: string;
  lat: number;
  lng: number;
  title: string;
  opponent: string;
  score: string;
  heroes: string | null;
  route: string | null;
  detailed_history: string | null;
  /**
   * The photo gallery in display order; the first is the cover. `image_url` is
   * not part of the input — the Server Actions derive it from this list so the
   * two can never disagree.
   */
  images: string[];
}

/** Result of the create / update / delete Server Actions. */
export interface CampaignActionResult {
  success: boolean;
  message?: string;
}

export const CAMPAIGN_YEAR_RANGE = { min: 1955, max: 2100 } as const;

// Server Actions reject request bodies over 1 MB. This cap keeps even a history
// written entirely in a three-byte script (Bangla, say) under that limit, and
// turns an opaque transport failure into a message the admin can act on. It is
// still roughly 35,000 English words — several times a long encyclopedia entry.
export const HISTORY_MAX_CHARS = 200_000;

const SHORT_TEXT_MAX = 200;
const MEDIUM_TEXT_MAX = 2_000;

const optionalText = (value: string | null): string | null => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
};

/**
 * Trim and validate campaign input. The Server Actions call this as the
 * authority (they are reachable by direct POST); the form calls it too, purely
 * so mistakes surface before a round-trip.
 */
export function normalizeCampaignInput(
  input: UclCampaignInput
):
  | { ok: true; value: UclCampaignInput }
  | { ok: false; message: string } {
  const fail = (message: string) => ({ ok: false as const, message });

  const year = Number(input.year);
  if (
    !Number.isInteger(year) ||
    year < CAMPAIGN_YEAR_RANGE.min ||
    year > CAMPAIGN_YEAR_RANGE.max
  ) {
    return fail(
      `Year must be a whole number between ${CAMPAIGN_YEAR_RANGE.min} and ${CAMPAIGN_YEAR_RANGE.max}.`
    );
  }

  const lat = Number(input.lat);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return fail("Latitude must be a number between -90 and 90.");
  }
  const lng = Number(input.lng);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return fail("Longitude must be a number between -180 and 180.");
  }

  const required: Array<[label: string, value: string]> = [
    ["City", input.city],
    ["Title", input.title],
    ["Opponent", input.opponent],
    ["Score", input.score],
  ];
  for (const [label, value] of required) {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return fail(`${label} is required.`);
    if (trimmed.length > SHORT_TEXT_MAX) {
      return fail(`${label} must be ${SHORT_TEXT_MAX} characters or fewer.`);
    }
  }

  const heroes = optionalText(input.heroes);
  if (heroes && heroes.length > MEDIUM_TEXT_MAX) {
    return fail(`Heroes must be ${MEDIUM_TEXT_MAX.toLocaleString("en-US")} characters or fewer.`);
  }
  const route = optionalText(input.route);
  if (route && route.length > MEDIUM_TEXT_MAX) {
    return fail(`Route must be ${MEDIUM_TEXT_MAX.toLocaleString("en-US")} characters or fewer.`);
  }

  const history = optionalText(input.detailed_history);
  if (history && history.length > HISTORY_MAX_CHARS) {
    return fail(
      `The detailed history is ${history.length.toLocaleString("en-US")} characters; the limit is ${HISTORY_MAX_CHARS.toLocaleString("en-US")}.`
    );
  }

  // Only ever rendered as image sources, but keep them to real web addresses.
  // Order is preserved (it is the gallery order); blanks and repeats are not.
  const images: string[] = [];
  for (const entry of Array.isArray(input.images) ? input.images : []) {
    const url = typeof entry === "string" ? entry.trim() : "";
    if (!url) continue;
    if (!/^https:\/\/[^\s]+$/i.test(url)) {
      return fail("Every photo must be an https:// address.");
    }
    if (!images.includes(url)) images.push(url);
  }
  if (images.length > MAX_CAMPAIGN_IMAGES) {
    return fail(`A campaign can hold up to ${MAX_CAMPAIGN_IMAGES} photos.`);
  }

  return {
    ok: true,
    value: {
      year,
      lat,
      lng,
      city: input.city.trim(),
      title: input.title.trim(),
      opponent: input.opponent.trim(),
      score: input.score.trim(),
      heroes,
      route,
      detailed_history: history,
      images,
    },
  };
}

/** Rough word count, for showing how much history a campaign has. */
export function countWords(text: string | null): number {
  const trimmed = (text ?? "").trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
