// Shared types and helpers for the Shop (storefront + admin product form).
// Mirrors the conventions in lib/fans.ts.

import type { Database } from "@/utils/supabase/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export type ShopCategory = "jersey" | "turf" | "football";

export const SHOP_CATEGORIES: ShopCategory[] = ["jersey", "turf", "football"];

// Storefront filter tabs. `all` is a UI-only pseudo-category.
export const CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "jersey", label: "Jerseys" },
  { value: "turf", label: "Turfs" },
  { value: "football", label: "Equipment" },
] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number]["value"];

// Singular label shown on cards / badges.
export const CATEGORY_LABEL: Record<ShopCategory, string> = {
  jersey: "Jersey",
  turf: "Turf",
  football: "Equipment",
};

// Prices are stored as plain numbers; the audience is Bangladesh, so format as
// Bangladeshi Taka.
export function formatPrice(price: number | null): string {
  return `৳${(price ?? 0).toLocaleString("en-US")}`;
}

// Fallback used only if NEXT_PUBLIC_WHATSAPP_NUMBER isn't configured. Clearly a
// placeholder so a misconfigured deploy is obvious rather than silently wrong.
export const FALLBACK_WHATSAPP_NUMBER = "880000000000";

// Build a wa.me deep link with a pre-filled order message. `whatsappNumber`
// comes from NEXT_PUBLIC_WHATSAPP_NUMBER; only digits are kept (wa.me needs an
// international number with no +, spaces or dashes).
export function whatsappOrderUrl(
  product: Pick<Product, "name">,
  size: string | null,
  whatsappNumber: string
): string {
  const number = (whatsappNumber || FALLBACK_WHATSAPP_NUMBER).replace(
    /\D/g,
    ""
  );
  const sizePart = size ? ` in size ${size}` : "";
  const text = `Hala Madrid! I want to order the ${product.name}${sizePart}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
