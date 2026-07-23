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

export type CartItem = {
  id: string; // product id
  name: string;
  price: number; // per-unit price, incl. the custom-font fee when customName is set
  size: string | null;
  image: string | null;
  // Free-text custom name/number the buyer typed for a jersey (e.g.
  // "VINÍCIUS JR - 7"). null when no customisation was requested. Part of a
  // line's identity, so the same jersey+size with different fonts stays a
  // separate line instead of merging.
  customName: string | null;
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
  removeItem: (
    id: string,
    size: string | null,
    customName: string | null,
    uclPatch: boolean
  ) => void;
  updateQuantity: (
    id: string,
    size: string | null,
    customName: string | null,
    uclPatch: boolean,
    quantity: number
  ) => void;
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

// A cart line is unique per product + size + custom name + UCL patch, so the
// same jersey in two sizes — or with different fonts, or with vs without the
// patch — stays a separate line.
const lineKey = (
  id: string,
  size: string | null,
  customName: string | null,
  uclPatch: boolean
) => `${id}__${size ?? ""}__${customName ?? ""}__${uclPatch ? "ucl" : ""}`;

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
        if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
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
        const key = lineKey(item.id, item.size, item.customName, item.uclPatch);
        const existing = prev.find(
          (p) => lineKey(p.id, p.size, p.customName, p.uclPatch) === key
        );
        if (existing) {
          return prev.map((p) =>
            lineKey(p.id, p.size, p.customName, p.uclPatch) === key
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

  const removeItem = useCallback(
    (
      id: string,
      size: string | null,
      customName: string | null,
      uclPatch: boolean
    ) => {
      setItems((prev) =>
        prev.filter(
          (p) =>
            lineKey(p.id, p.size, p.customName, p.uclPatch) !==
            lineKey(id, size, customName, uclPatch)
        )
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (
      id: string,
      size: string | null,
      customName: string | null,
      uclPatch: boolean,
      quantity: number
    ) => {
      setItems((prev) =>
        prev.flatMap((p) => {
          if (
            lineKey(p.id, p.size, p.customName, p.uclPatch) !==
            lineKey(id, size, customName, uclPatch)
          )
            return [p];
          // Dropping to 0 removes the line.
          return quantity <= 0 ? [] : [{ ...p, quantity }];
        })
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const itemCount = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity, 0),
    [items]
  );
  // Subtotal folds in every line's add-ons (custom-font fee lives in price; the
  // UCL patch fee is added by cartLineTotal) so the grand total already covers
  // "+200 BDT for every item with uclPatch === true".
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
