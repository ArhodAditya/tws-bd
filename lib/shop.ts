// Shared types and helpers for the Shop (storefront + admin product form).
// Mirrors the conventions in lib/fans.ts.

import type { Database } from "@/utils/supabase/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export type ShopCategory = "jersey" | "turf" | "football" | "fashion";

export const SHOP_CATEGORIES: ShopCategory[] = [
  "jersey",
  "turf",
  "football",
  "fashion",
];

// Storefront filter tabs. `all` is a UI-only pseudo-category.
export const CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "jersey", label: "Jerseys" },
  { value: "fashion", label: "Fashion" },
  { value: "turf", label: "Turfs" },
  { value: "football", label: "Equipment" },
] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number]["value"];

// Singular label shown on cards / badges.
export const CATEGORY_LABEL: Record<ShopCategory, string> = {
  jersey: "Jersey",
  turf: "Turf",
  football: "Equipment",
  fashion: "Fashion",
};

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
  return product.category === "fashion" ? "fashion" : "jersey";
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
    `Order the ${product.name} from The Whites Bangladesh. ¡Hala Madrid!`
  );
}

// Fallback used only if NEXT_PUBLIC_WHATSAPP_NUMBER isn't configured. Clearly a
// placeholder so a misconfigured deploy is obvious rather than silently wrong.
export const FALLBACK_WHATSAPP_NUMBER = "880000000000";

// Flat surcharge (BDT) for optional custom name/number printing on a jersey.
export const CUSTOM_FONT_FEE = 250;

// Build a wa.me deep link with a pre-filled order message. `whatsappNumber`
// comes from NEXT_PUBLIC_WHATSAPP_NUMBER; only digits are kept (wa.me needs an
// international number with no +, spaces or dashes). When `customName` is set
// (jersey font upsell), the surcharge is added and the order total + custom
// text are appended to the message.
export function whatsappOrderUrl(
  product: Pick<Product, "name" | "price">,
  size: string | null,
  whatsappNumber: string,
  customName?: string | null
): string {
  const number = (whatsappNumber || FALLBACK_WHATSAPP_NUMBER).replace(
    /\D/g,
    ""
  );
  const sizePart = size ? ` in size ${size}` : "";

  // WhatsApp renders *text* as bold; encodeURIComponent turns each "\n" into
  // the %0A line break WhatsApp expects.
  const lines = [`Hala Madrid! I want to order the ${product.name}${sizePart}.`];

  const trimmedName = customName?.trim();
  if (trimmedName) {
    const total = (product.price ?? 0) + CUSTOM_FONT_FEE;
    lines.push(`*Custom Name:* ${trimmedName}`);
    lines.push(`*Custom Font:* +${formatPrice(CUSTOM_FONT_FEE)}`);
    lines.push(`*Total:* ${formatPrice(total)}`);
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}
