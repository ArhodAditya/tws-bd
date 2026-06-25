"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/shop";
import {
  BD_DISTRICTS,
  BKASH_NUMBER,
  buildWhatsappOrderLink,
  getShipping,
  type PaymentMethod,
} from "@/lib/checkout";

export default function CartDrawer() {
  const {
    items,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    isOpen,
    closeCart,
  } = useCart();

  // --- Checkout form state ---
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");
  const [districtOpen, setDistrictOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("partial");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = getShipping(district);
  const total = subtotal + shipping;

  const filteredDistricts = useMemo(() => {
    const q = districtQuery.trim().toLowerCase();
    if (!q) return BD_DISTRICTS;
    return BD_DISTRICTS.filter((d) => d.toLowerCase().includes(q));
  }, [districtQuery]);

  // Close on Escape and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, closeCart]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill in your name, phone number and address.");
      return;
    }
    if (!district) {
      setError("Please choose your district.");
      return;
    }

    setSubmitting(true);
    const url = buildWhatsappOrderLink(
      {
        name: name.trim(),
        phone: phone.trim(),
        district,
        address: address.trim(),
        payment,
      },
      items,
      subtotal,
      shipping
    );
    // Hand the order off to WhatsApp. assign() (not `location.href =`) keeps
    // the react-hooks/immutability lint rule happy while navigating the same.
    window.location.assign(url);
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500";
  const labelClass =
    "block text-sm font-semibold text-slate-800 dark:text-zinc-200";

  return (
    <div
      className="fixed inset-0 z-[70]"
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel — slides in from the right; the transform transition handles
          both the enter and the exit. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart and checkout"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-midnight-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-slate-900 dark:text-white">
            <ShoppingBag className="h-5 w-5 text-gold-500" />
            Your Cart
            {itemCount > 0 ? (
              <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-bold text-gold-700 dark:text-gold-300">
                {itemCount}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-slate-500 transition hover:border-gold-500/50 hover:text-gold-600 dark:border-white/15 dark:text-zinc-300 dark:hover:text-gold-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-zinc-700" />
            <p className="font-semibold text-slate-700 dark:text-zinc-200">
              Your cart is empty
            </p>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Add some white pride from the shop to get started.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-2 rounded-full border border-gold-500/50 bg-gold-500/5 px-5 py-2 text-sm font-semibold text-gold-600 transition hover:bg-gold-500/15 dark:text-gold-300"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Scrollable middle: items + checkout fields */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* Items */}
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={`${item.id}__${item.size ?? ""}`}
                    className="flex gap-3 rounded-xl border border-gray-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-midnight-950 dark:border-white/10">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      {item.size ? (
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Size: {item.size}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-sm font-bold text-gold-700 dark:text-gold-300">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.size)}
                        aria-label={`Remove ${item.name}`}
                        className="text-slate-400 transition hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.size,
                              item.quantity - 1
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-slate-600 transition hover:border-gold-500/50 hover:text-gold-600 dark:border-white/15 dark:text-zinc-200 dark:hover:text-gold-300"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.size,
                              item.quantity + 1
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-slate-600 transition hover:border-gold-500/50 hover:text-gold-600 dark:border-white/15 dark:text-zinc-200 dark:hover:text-gold-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Checkout fields */}
              <div className="space-y-4 border-t border-gray-200 pt-5 dark:border-white/10">
                <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                  Delivery Details
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="cart-name" className={labelClass}>
                    Full Name
                  </label>
                  <input
                    id="cart-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Karim Benzema"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cart-phone" className={labelClass}>
                    Contact Number
                  </label>
                  <input
                    id="cart-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className={inputClass}
                  />
                </div>

                {/* Searchable district picker */}
                <div className="space-y-1.5">
                  <label htmlFor="cart-district" className={labelClass}>
                    District
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="cart-district"
                      type="text"
                      autoComplete="off"
                      value={districtQuery}
                      onChange={(e) => {
                        setDistrictQuery(e.target.value);
                        setDistrict("");
                        setDistrictOpen(true);
                      }}
                      onFocus={() => setDistrictOpen(true)}
                      placeholder="Search 64 districts…"
                      className={`${inputClass} pl-9 pr-9`}
                    />
                    <ChevronDown
                      className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${
                        districtOpen ? "rotate-180" : ""
                      }`}
                    />
                    {district ? (
                      <Check className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                    ) : null}
                  </div>

                  {districtOpen ? (
                    <div className="mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-midnight-800">
                      {filteredDistricts.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500 dark:text-zinc-400">
                          No district matches “{districtQuery}”.
                        </p>
                      ) : (
                        filteredDistricts.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setDistrict(d);
                              setDistrictQuery(d);
                              setDistrictOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-gold-500/10 hover:text-gold-700 dark:text-zinc-200 dark:hover:text-gold-300"
                          >
                            {d}
                            <span className="text-xs text-slate-400 dark:text-zinc-500">
                              {d === "Chattogram" ? "৳70" : "৳130"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cart-address" className={labelClass}>
                    Shipping Address
                  </label>
                  <textarea
                    id="cart-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, road, area…"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                  <span className={labelClass}>Payment Method</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        { value: "full", label: "Full Advance" },
                        { value: "partial", label: "Partial Advance" },
                      ] as const
                    ).map((opt) => {
                      const active = payment === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                            active
                              ? "border-gold-500 bg-gold-500/15 text-gold-700 dark:text-gold-200"
                              : "border-gray-300 text-slate-600 hover:border-gold-500/40 dark:border-white/15 dark:text-zinc-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={opt.value}
                            checked={active}
                            onChange={() => setPayment(opt.value)}
                            className="sr-only"
                          />
                          {active ? <Check className="h-4 w-4" /> : null}
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Note: Delivery charge must be advanced to confirm the order.
                  </p>

                  {/* bKash advance-payment instructions */}
                  <div className="flex items-start gap-2.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3 dark:bg-gold-500/[0.07]">
                    <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-200">
                      To confirm your order, please send your{" "}
                      <span className="font-semibold">Full Advance</span> or{" "}
                      <span className="font-semibold">
                        Partial Advance (Delivery Charge)
                      </span>{" "}
                      via bKash to:{" "}
                      <span className="font-bold tracking-wide text-gold-700 dark:text-gold-300">
                        {BKASH_NUMBER}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky footer: totals + submit */}
            <div className="space-y-3 border-t border-gray-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-midnight-950/60">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <dt>Delivery {district ? `(${district})` : ""}</dt>
                  <dd className="tabular-nums">
                    {district ? formatPrice(shipping) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-extrabold text-slate-900 dark:border-white/10 dark:text-white">
                  <dt>Grand Total</dt>
                  <dd className="tabular-nums text-gold-700 dark:text-gold-300">
                    {formatPrice(total)}
                  </dd>
                </div>
              </dl>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-3 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Opening WhatsApp…
                  </>
                ) : (
                  <>
                    <WhatsAppGlyph className="h-5 w-5" />
                    Place Order via WhatsApp
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

// Inline WhatsApp glyph (lucide ships no brand icons).
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.728-.979zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
