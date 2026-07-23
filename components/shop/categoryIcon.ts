import { Gem, Shirt, ShoppingBag, Volleyball } from "lucide-react";
import { type ShopCategory } from "@/lib/shop";

type IconComponent = typeof Shirt;

// `satisfies` keeps this exhaustive against ShopCategory — add a category and
// this fails to compile until it gets an icon.
const ICONS = {
  kits: Shirt,
  streetwear: Gem,
  accessories: Volleyball,
} satisfies Record<ShopCategory, IconComponent>;

// Per-category accent icon, shared by the product card and the product page so
// the two can't drift. Exported as a plain lookup (not a getter function) so
// callers resolve the component reference statically rather than "creating" one
// during render. Keys are widened to string because `products.category` is a
// free-text column — unknown/legacy values miss and fall back below.
export const CATEGORY_ICON: Record<string, IconComponent> = ICONS;

export const CATEGORY_ICON_FALLBACK: IconComponent = ShoppingBag;
