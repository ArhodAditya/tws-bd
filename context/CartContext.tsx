"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cartLineTotal } from "@/lib/checkout";
import {
  CUSTOM_FONT_FEE,
  NO_FONT,
  normalizeFontSelection,
  type FontSelection,
} from "@/lib/shop";

export type CartItem = {
  id: string; // product id
  name: string;
  // Base per-unit price. Add-ons (font printing, UCL patch) are *not* folded in
  // here — cartLineTotal applies them, so one helper owns the money math.
  price: number;
  size: string | null;
  image: string | null;
  // Which name/number print the buyer chose for a jersey: none, a squad player
  // from the product's roster, or their own name + number. Part of a line's
  // identity, so the same jersey+size with different fonts stays a separate line
  // instead of merging. Absent on lines that can't be printed.
  fontSelection?: FontSelection;
  // Whether the buyer added the +200 BDT Champions League (UCL) patch. Also part
  // of a line's identity, so a patched and un-patched jersey stay separate lines.
  uclPatch: boolean;
  quantity: number;
};

export type CartToast = { id: number; message: string };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  // Both take the line's key from cartLineKey(item) — the same string the list
  // renders as its React key.
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toast: CartToast | null;
  dismissToast: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tws-cart";

// 4 hype messages — a random one fires on every "Add to Cart".
const ADD_MESSAGES = [
  "Hala Madrid! Epic choice! 👑",
  "A true Galáctico pick! ⚽",
  "Bernabéu-worthy taste! 🤍",
  "¡Vamos! White pride secured. ✨",
];

// A cart line is unique per product + size + font selection + UCL patch, so the
// same jersey in two sizes — or with different fonts, or with vs without the
// patch — stays a separate line. Exported because callers identify a line by
// this key when removing it or changing its quantity.
export function cartLineKey(
  item: Pick<CartItem, "id" | "size" | "fontSelection" | "uclPatch">
): string {
  const font = normalizeFontSelection(item.fontSelection);
  const fontPart =
    font.type === "none"
      ? ""
      : `${font.type}:${font.text ?? ""}:${font.number ?? ""}`;
  return `${item.id}__${item.size ?? ""}__${fontPart}__${
    item.uclPatch ? "ucl" : ""
  }`;
}

// Carts saved before the font selector shipped stored a free-text `customName`
// and folded the +250 fee into `price`. Map those onto the current shape so a
// returning buyer's cart survives the upgrade — and isn't charged the fee twice
// now that cartLineTotal adds it. Anything unrecognisable is dropped.
function reviveCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<CartItem> & { customName?: unknown };
  if (typeof item.id !== "string" || typeof item.name !== "string") return null;
  if (typeof item.price !== "number" || typeof item.quantity !== "number") {
    return null;
  }

  const legacyName =
    typeof item.customName === "string" ? item.customName.trim() : "";
  const fontSelection = legacyName
    ? normalizeFontSelection({ type: "custom", text: legacyName })
    : normalizeFontSelection(item.fontSelection);

  return {
    id: item.id,
    name: item.name,
    // Unfold the legacy price so the fee isn't counted a second time.
    price: legacyName ? item.price - CUSTOM_FONT_FEE : item.price,
    size: typeof item.size === "string" ? item.size : null,
    image: typeof item.image === "string" ? item.image : null,
    fontSelection: fontSelection.type === "none" ? NO_FONT : fontSelection,
    uclPatch: item.uclPatch === true,
    quantity: Math.max(1, Math.floor(item.quantity)),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);
  // Don't persist until the initial localStorage read has happened, otherwise
  // the empty initial state would clobber a saved cart. A ref (not state) so
  // flipping it never triggers a render.
  const loaded = useRef(false);

  // Hydrate from localStorage once on mount. Deferred to a microtask so the
  // setState isn't called synchronously in the effect body (which would trip
  // react-hooks/set-state-in-effect and cause a cascading render).
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const revived = parsed.flatMap((entry) => {
            const item = reviveCartItem(entry);
            return item ? [item] : [];
          });
          if (revived.length > 0) setItems(revived);
        }
      } catch {
        // Corrupt/unavailable storage — start with an empty cart.
      }
      loaded.current = true;
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist whenever the cart changes (after the initial read).
  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write failures (private mode, quota, etc.).
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const key = cartLineKey(item);
        const existing = prev.find((p) => cartLineKey(p) === key);
        if (existing) {
          return prev.map((p) =>
            cartLineKey(p) === key
              ? { ...p, quantity: p.quantity + quantity }
              : p
          );
        }
        return [...prev, { ...item, quantity }];
      });
      setToast({
        id: Date.now(),
        message: ADD_MESSAGES[Math.floor(Math.random() * ADD_MESSAGES.length)],
      });
    },
    []
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => cartLineKey(p) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((p) => {
        if (cartLineKey(p) !== key) return [p];
        // Dropping to 0 removes the line.
        return quantity <= 0 ? [] : [{ ...p, quantity }];
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const itemCount = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity, 0),
    [items]
  );
  // Subtotal folds in every line's add-ons — cartLineTotal adds the +250 font
  // fee and the +200 UCL patch fee per unit — so the grand total is already
  // complete before shipping.
  const subtotal = useMemo(
    () => items.reduce((sum, p) => sum + cartLineTotal(p), 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isOpen,
      openCart,
      closeCart,
      toast,
      dismissToast,
    }),
    [
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isOpen,
      openCart,
      closeCart,
      toast,
      dismissToast,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a <CartProvider>.");
  }
  return ctx;
}
