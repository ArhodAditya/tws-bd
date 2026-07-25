// Shared types and helpers for the Shop (storefront + admin product form).
// Mirrors the conventions in lib/fans.ts.

import type { Database } from "@/utils/supabase/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

// Storefront taxonomy. `kits` carries the jersey-specific behaviour (size guide
// + custom-font upsell), so any code that keyed off the old "jersey" category
// now keys off "kits". NOTE: this is distinct from `size_pattern` below, which
// keeps its own "jersey"/"fashion"/"custom" chart keys.
export type ShopCategory = "kits" | "streetwear" | "accessories";

export const SHOP_CATEGORIES: ShopCategory[] = [
  "kits",
  "streetwear",
  "accessories",
];

// Storefront filter tabs. `all` is a UI-only pseudo-category.
export const CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "kits", label: "Kits" },
  { value: "streetwear", label: "Streetwear" },
  { value: "accessories", label: "Accessories" },
] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number]["value"];

// Singular label shown on cards / badges.
export const CATEGORY_LABEL: Record<ShopCategory, string> = {
  kits: "Kits",
  streetwear: "Streetwear",
  accessories: "Accessories",
};

// `products.category` is a free-text column, so every read is really a string.
// These two helpers are the only places that reconcile it with the union —
// callers no longer sprinkle `as ShopCategory` assertions over DB rows.
const CATEGORY_LABEL_LOOKUP: Record<string, string> = CATEGORY_LABEL;

// Display label for a raw category value, tolerating legacy/unknown values.
export function categoryLabel(value: string): string {
  return CATEGORY_LABEL_LOOKUP[value] ?? value;
}

// Narrow a raw category value to the union, falling back to the default bucket
// rather than asserting an unvalidated string into it.
export function toShopCategory(value: string): ShopCategory {
  return SHOP_CATEGORIES.includes(value as ShopCategory)
    ? (value as ShopCategory)
    : "kits";
}

// Split a comma / newline separated string into a clean string[]. Shared by the
// New/Edit product forms for the sizes field.
export function toList(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// --- Sizing blueprints ------------------------------------------------------
// Which size chart the product page renders: the standard jersey chart, the
// fixed winter-drop fashion chart, or admin-typed custom measurements.

export type SizePattern = "jersey" | "fashion" | "custom";

export const SIZE_PATTERNS: SizePattern[] = ["jersey", "fashion", "custom"];

// One row of a chest/length size chart. Values are stored as display strings
// (e.g. '40"') so admins can write whatever unit or note fits the drop.
export type SizeChartRow = { size: string; chest: string; length: string };

// Winter-drop hoodie chart (flat measurements, inches) — the fixed "fashion"
// blueprint.
export const FASHION_SIZE_ROWS: SizeChartRow[] = [
  { size: "M", chest: '40"', length: '27"' },
  { size: "L", chest: '42"', length: '28"' },
  { size: "XL", chest: '44"', length: '29"' },
];

// Sizes pre-filled in the admin form when the fashion blueprint is picked.
export const FASHION_DEFAULT_SIZES = FASHION_SIZE_ROWS.map((row) => row.size);

// Resolve which chart a product should show. Falls back to inferring from the
// category for rows created before `size_pattern` existed.
export function resolveSizePattern(
  product: Pick<Product, "category" | "size_pattern">
): SizePattern {
  const stored = product.size_pattern;
  if (stored === "jersey" || stored === "fashion" || stored === "custom") {
    return stored;
  }
  return product.category === "streetwear" ? "fashion" : "jersey";
}

// Defensive parse of the `custom_size_chart` jsonb column — a malformed row
// must never crash the storefront. Rows without a size label are dropped.
export function parseCustomSizeChart(
  value: Product["custom_size_chart"]
): SizeChartRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const { size, chest, length } = row as Record<string, unknown>;
    if (typeof size !== "string" || !size.trim()) return [];
    return [
      {
        size: size.trim(),
        chest: typeof chest === "string" ? chest.trim() : "",
        length: typeof length === "string" ? length.trim() : "",
      },
    ];
  });
}

// Roster entries offered in the kit font dropdown, stored exactly as the admin
// typed them (e.g. "Bellingham - 5"). Defensive parse of the
// `available_player_names` text[] column — a null or malformed value must never
// break the product page, it just means no player dropdown.
export function parsePlayerNames(
  value: Product["available_player_names"]
): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((name) =>
    typeof name === "string" && name.trim() ? [name.trim()] : []
  );
}

// Prices are stored as plain numbers; the audience is Bangladesh, so format as
// Bangladeshi Taka.
export function formatPrice(price: number | null): string {
  return `৳${(price ?? 0).toLocaleString("en-US")}`;
}

// Plain-text product summary for meta descriptions and structured data: strip
// Markdown markers, collapse whitespace and clamp. Falls back to a branded line
// when the product has no description. `maxLength` defaults to ~150 (good for
// meta descriptions); pass a larger value for fuller JSON-LD descriptions.
export function getProductDescription(
  product: Pick<Product, "name" | "description">,
  maxLength = 150
): string {
  const summary = (product.description ?? "")
    .replace(/[#>*_`~[\]()!-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  return (
    summary ||
    `Order the ${product.name} from The Whites Stories. ¡Hala Madrid!`
  );
}

// Fallback used only if NEXT_PUBLIC_WHATSAPP_NUMBER isn't configured. Clearly a
// placeholder so a misconfigured deploy is obvious rather than silently wrong.
export const FALLBACK_WHATSAPP_NUMBER = "880000000000";

// --- Font selection ---------------------------------------------------------
// A kit can be ordered plain, with a squad player's name/number picked from the
// roster the admin curated on the product, or with the buyer's own name and
// number. The choice rides on the cart line and into the WhatsApp receipt, so it
// lives here beside the fees it drives.

export type FontType = "none" | "player" | "custom";

export type FontSelection = {
  type: FontType;
  // "player": the roster entry verbatim (e.g. "Bellingham - 5").
  // "custom": just the name the buyer typed.
  text?: string;
  // "custom" only — the shirt number typed alongside the name.
  number?: string;
};

export const NO_FONT: FontSelection = { type: "none" };

// Flat surcharge (BDT) for name/number printing on a jersey — the same for a
// squad player's print and a buyer's own.
export const CUSTOM_FONT_FEE = 250;

// Extra advance (BDT) required on top of the delivery charge when the buyer asks
// for their *own* name/number: a personalised print can't be resold if the order
// is abandoned, so it's collected up front. Squad-player prints are stock items
// and don't carry it.
export const CUSTOM_FONT_ADVANCE = 300;

// Canonical form of a raw selection: trimmed, and collapsed to "none" whenever
// nothing usable was actually typed — so a half-filled form can never charge the
// font fee. Every fee/label helper below funnels through this, which is what
// keeps the product page, the cart and the receipt agreeing on one answer.
export function normalizeFontSelection(
  selection?: FontSelection | null
): FontSelection {
  if (!selection || selection.type === "none") return NO_FONT;

  const text = selection.text?.trim() ?? "";
  const number = selection.number?.trim() ?? "";

  if (selection.type === "player") {
    return text ? { type: "player", text } : NO_FONT;
  }
  if (!text && !number) return NO_FONT;
  return { type: "custom", text, number };
}

// +250 for either kind of print, 0 for a plain kit.
export function fontFee(selection?: FontSelection | null): number {
  return normalizeFontSelection(selection).type === "none"
    ? 0
    : CUSTOM_FONT_FEE;
}

// +300 advance for a buyer's own print only.
export function fontAdvance(selection?: FontSelection | null): number {
  return normalizeFontSelection(selection).type === "custom"
    ? CUSTOM_FONT_ADVANCE
    : 0;
}

// Human-readable summary — "Player (Bellingham - 5)" or "Custom (ADITYA - 10)".
// null when no font was chosen, so callers can skip the line entirely.
export function describeFontSelection(
  selection?: FontSelection | null
): string | null {
  const font = normalizeFontSelection(selection);
  if (font.type === "none") return null;
  if (font.type === "player") return `Player (${font.text})`;
  // A custom print may be name-only or number-only; join whatever is there.
  const detail = [font.text, font.number].filter(Boolean).join(" - ");
  return `Custom (${detail})`;
}

// The bracketed tag the seller reads off the WhatsApp order, e.g.
// "[Font: Custom (ADITYA - 10)]". null when no font was chosen.
export function fontTag(selection?: FontSelection | null): string | null {
  const description = describeFontSelection(selection);
  return description ? `[Font: ${description}]` : null;
}

// Flat surcharge (BDT) for the optional Champions League (UCL) sleeve patch
// upsell. Applied per unit, like the custom-font fee. Only offered on products
// an admin has flagged with `has_ucl_patch`.
export const UCL_PATCH_FEE = 200;

// Build a wa.me deep link with a pre-filled order message. `whatsappNumber`
// comes from NEXT_PUBLIC_WHATSAPP_NUMBER; only digits are kept (wa.me needs an
// international number with no +, spaces or dashes). When a font is selected
// (jersey font upsell), the surcharge is added and the order total + the
// bracketed font tag are appended to the message.
export function whatsappOrderUrl(
  product: Pick<Product, "name" | "price">,
  size: string | null,
  whatsappNumber: string,
  fontSelection?: FontSelection | null,
  uclPatch?: boolean
): string {
  const number = (whatsappNumber || FALLBACK_WHATSAPP_NUMBER).replace(
    /\D/g,
    ""
  );
  const sizePart = size ? ` in size ${size}` : "";

  // WhatsApp renders *text* as bold; encodeURIComponent turns each "\n" into
  // the %0A line break WhatsApp expects.
  const lines = [`Hala Madrid! I want to order the ${product.name}${sizePart}.`];

  // Optional add-ons accumulate onto the base price; a Total line is appended
  // whenever at least one is selected.
  let addOns = 0;
  const tag = fontTag(fontSelection);
  if (tag) {
    addOns += CUSTOM_FONT_FEE;
    lines.push(tag);
    lines.push(`*Font Printing:* +${formatPrice(CUSTOM_FONT_FEE)}`);
    // A buyer's own print is made to order, so flag its advance right here —
    // the cart checkout folds the same amount into its Advance Payable line.
    const advance = fontAdvance(fontSelection);
    if (advance > 0) {
      lines.push(
        `*Custom Font Advance:* ${formatPrice(advance)} (payable in advance)`
      );
    }
  }
  if (uclPatch) {
    addOns += UCL_PATCH_FEE;
    lines.push(`*Add-ons:* UCL Patch +${formatPrice(UCL_PATCH_FEE)}`);
  }
  if (addOns > 0) {
    lines.push(`*Total:* ${formatPrice((product.price ?? 0) + addOns)}`);
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}
