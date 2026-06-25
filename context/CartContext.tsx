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

export type CartItem = {
  id: string; // product id
  name: string;
  price: number;
  size: string | null;
  image: string | null;
  quantity: number;
};

export type CartToast = { id: number; message: string };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string, size: string | null) => void;
  updateQuantity: (id: string, size: string | null, quantity: number) => void;
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

// A cart line is unique per product + size, so the same jersey in two sizes is
// two lines.
const lineKey = (id: string, size: string | null) => `${id}__${size ?? ""}`;

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
        const key = lineKey(item.id, item.size);
        const existing = prev.find((p) => lineKey(p.id, p.size) === key);
        if (existing) {
          return prev.map((p) =>
            lineKey(p.id, p.size) === key
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

  const removeItem = useCallback((id: string, size: string | null) => {
    setItems((prev) =>
      prev.filter((p) => lineKey(p.id, p.size) !== lineKey(id, size))
    );
  }, []);

  const updateQuantity = useCallback(
    (id: string, size: string | null, quantity: number) => {
      setItems((prev) =>
        prev.flatMap((p) => {
          if (lineKey(p.id, p.size) !== lineKey(id, size)) return [p];
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
  const subtotal = useMemo(
    () => items.reduce((sum, p) => sum + p.price * p.quantity, 0),
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
