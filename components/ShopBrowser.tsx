"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Dumbbell,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Volleyball,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  CATEGORY_FILTERS,
  CATEGORY_LABEL,
  CUSTOM_FONT_FEE,
  formatPrice,
  whatsappOrderUrl,
  type CategoryFilter,
  type Product,
  type ShopCategory,
} from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";
import SizeGuideModal from "@/components/SizeGuideModal";

// Per-category accent icon for cards and image fallbacks.
const CATEGORY_ICON: Record<ShopCategory, typeof Shirt> = {
  jersey: Shirt,
  turf: Dumbbell,
  football: Volleyball,
};

export default function ShopBrowser({
  products,
  whatsappNumber,
}: {
  products: Product[];
  whatsappNumber: string;
}) {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [selected, setSelected] = useState<Product | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    for (const p of products) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [products]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? products
        : products.filter((p) => p.category === filter),
    [products, filter]
  );

  return (
    <>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2.5">
        {CATEGORY_FILTERS.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-gold-300 to-gold-500 text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)]"
                  : "border border-gray-300 bg-white text-slate-600 hover:border-gold-500/50 hover:text-gold-700 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-gold-300"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active
                    ? "bg-midnight-950/20"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-400"
                }`}
              >
                {counts[tab.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <ShoppingBag className="mx-auto h-10 w-10 text-slate-400 dark:text-zinc-600" />
          <p className="mt-4 text-slate-500 dark:text-zinc-400">
            The shelves are being stocked — premium gear lands here soon.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onOpen={() => setSelected(product)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected ? (
        <ProductModal
          product={selected}
          whatsappNumber={whatsappNumber}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

// --- Product image with a premium, on-brand fallback ----------------------

function ProductImage({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = product.images?.[0];
  const Icon = CATEGORY_ICON[product.category as ShopCategory] ?? ShoppingBag;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={product.name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-midnight-800 to-midnight-950 ${className ?? ""}`}
    >
      <Icon className="h-1/3 w-1/3 text-gold-500/40" />
    </div>
  );
}

// --- Image gallery (modal) -----------------------------------------------

function ProductGallery({ product }: { product: Product }) {
  const images = (product.images ?? []).filter(Boolean);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const Icon = CATEGORY_ICON[product.category as ShopCategory] ?? ShoppingBag;
  const category =
    CATEGORY_LABEL[product.category as ShopCategory] ?? product.category;

  const showFallback = images.length === 0 || failed[active];

  return (
    <div className="flex h-full flex-col">
      {/* Main image — every image is stacked and crossfaded via opacity so a
          source swap fades smoothly. object-contain on a premium backdrop keeps
          landscape and portrait photos perfectly uniform (no cropping). */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-midnight-800/50 to-midnight-950 shadow-inner">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${product.name} — image ${i + 1}`}
            referrerPolicy="no-referrer"
            onError={() => setFailed((f) => ({ ...f, [i]: true }))}
            className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 ease-in-out ${
              i === active && !failed[i] ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* On-brand fallback when there are no images or the active one fails. */}
        {showFallback ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-midnight-800 to-midnight-950">
            <Icon className="h-1/3 w-1/3 text-gold-500/40" />
          </div>
        ) : null}

        <span className="absolute left-4 top-4 rounded-full border border-gold-500/30 bg-midnight-950/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-300 backdrop-blur">
          {category}
        </span>
      </div>

      {/* Thumbnail strip — only when there's more than one image. */}
      {images.length > 1 ? (
        <div className="flex gap-2.5 overflow-x-auto p-3">
          {images.map((src, i) => {
            const isActive = i === active;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={isActive}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                  isActive
                    ? "scale-105 border-gold-500"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// --- Card -----------------------------------------------------------------

function ProductCard({
  product,
  index,
  onOpen,
}: {
  product: Product;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="group flex animate-in flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-xl backdrop-blur transition-all fade-in slide-in-from-bottom-8 duration-500 ease-out fill-mode-both hover:-translate-y-2 hover:border-gold-500/30 hover:shadow-[0_10px_30px_rgba(251,191,36,0.15)] dark:border-white/10 dark:bg-midnight-900/60"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/5 dark:bg-midnight-900">
        <ProductImage
          product={product}
          className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
        />
        <span className="absolute left-3 top-3 rounded-full border border-gold-500/30 bg-midnight-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-300 backdrop-blur">
          {CATEGORY_LABEL[product.category as ShopCategory] ?? product.category}
        </span>
        {!product.in_stock ? (
          <span className="absolute right-3 top-3 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Sold Out
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 dark:text-white">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-lg font-extrabold text-gold-700 dark:text-gold-300">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-gold-700 dark:text-zinc-400 dark:group-hover:text-gold-300">
            View →
          </span>
        </div>
      </div>
    </button>
  );
}

// --- Detail modal ---------------------------------------------------------

function ProductModal({
  product,
  whatsappNumber,
  onClose,
}: {
  product: Product;
  whatsappNumber: string;
  onClose: () => void;
}) {
  const hasSizes = product.sizes && product.sizes.length > 0;
  const isJersey = product.category === "jersey";
  const [size, setSize] = useState<string | null>(
    hasSizes ? product.sizes[0] : null
  );
  // Optional custom name/number printing (jerseys only). Empty = no upsell.
  const [customName, setCustomName] = useState("");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem } = useCart();

  // Push the current product (with the chosen size) into the global cart. The
  // context fires the celebration toast; closing the modal lets the badge and
  // toast take over as confirmation.
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price ?? 0,
      size,
      image: product.images?.[0] ?? null,
    });
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const orderUrl = whatsappOrderUrl(
    product,
    size,
    whatsappNumber,
    isJersey ? customName : null
  );

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-gold-500/20 bg-midnight-900 shadow-2xl sm:rounded-3xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image gallery — full width while stacked on mobile/tablet, half the
            modal once the layout goes side-by-side at lg. */}
        <div className="w-full bg-midnight-950 lg:w-1/2">
          <ProductGallery product={product} />
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-2xl font-extrabold leading-tight text-white">
              {product.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-300 transition hover:border-gold-500/50 hover:text-gold-300"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <p className="mt-3 font-display text-3xl font-extrabold text-gold-300">
            {formatPrice(product.price)}
          </p>

          {product.description ? (
            <div className="prose prose-invert prose-sm md:prose-base dark:prose-slate mt-4 max-w-none text-slate-300">
              {/* remark-breaks turns the admin's single line breaks into <br>,
                  so a plain-textarea description keeps its line breaks while
                  still supporting Markdown bold/bullets/paragraphs. */}
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {product.description}
              </ReactMarkdown>
            </div>
          ) : null}

          {/* Size chips */}
          {hasSizes ? (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Select size</p>
                {isJersey ? (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/5 px-3 py-1.5 text-xs font-semibold text-gold-300 transition-transform duration-300 hover:scale-105 hover:bg-gold-500/15"
                  >
                    📏 View Size Guide
                  </button>
                ) : null}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.sizes.map((option) => {
                  const active = option === size;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      className={`min-w-11 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-gold-500 bg-gold-500/15 text-gold-200"
                          : "border-white/15 bg-white/5 text-zinc-300 hover:border-gold-500/50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Custom font upsell — jerseys only. The surcharge and the typed
              text are appended to the WhatsApp order message below. */}
          {isJersey ? (
            <div className="mt-6">
              <label
                htmlFor="custom-name"
                className="text-sm font-semibold text-white"
              >
                Add Fonts{" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="custom-name"
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="E.g., VINÍCIUS JR - 7"
                maxLength={32}
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
              />
              <p className="mt-1.5 text-sm text-slate-400">
                Font Quality: High Quality Official Fonts (+250/- BDT extra
                charge)
              </p>
              {customName.trim() ? (
                <p className="mt-1.5 text-sm font-semibold text-gold-300">
                  New total: {formatPrice((product.price ?? 0) + CUSTOM_FONT_FEE)}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Stock + order */}
          <div className="mt-auto pt-8">
            {product.in_stock ? (
              // Full-width, thumb-friendly CTAs on mobile; the wrapper's
              // `items-start` lets them shrink back to content width on desktop
              // where the buttons opt into `md:w-auto`.
              <div className="flex flex-col items-start gap-2.5">
                {/* Primary action — add to the cart and check out together. */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-3.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.02] md:w-auto"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                {/* Secondary — quick single-item order straight to WhatsApp. */}
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-gold-500/50 hover:text-gold-300 md:w-auto"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Order this item via WhatsApp
                </a>
              </div>
            ) : (
              <div className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-400">
                Currently Sold Out
              </div>
            )}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
              <Check className="h-3.5 w-3.5 text-gold-500/70" />
              Secure your order with our team — fast delivery across Bangladesh.
            </p>
          </div>

          {/* Fan Reviews */}
          <ProductReviews productId={product.id} />
        </div>
      </div>
    </div>
    <SizeGuideModal
      open={sizeGuideOpen}
      onClose={() => setSizeGuideOpen(false)}
    />
    </>
  );
}

// Inline WhatsApp glyph (lucide has no brand icons).
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.728-.979zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
