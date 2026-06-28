"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, Shirt, ShoppingBag, Volleyball } from "lucide-react";
import {
  CATEGORY_FILTERS,
  CATEGORY_LABEL,
  formatPrice,
  type CategoryFilter,
  type Product,
  type ShopCategory,
} from "@/lib/shop";

// Per-category accent icon for cards and image fallbacks.
const CATEGORY_ICON: Record<ShopCategory, typeof Shirt> = {
  jersey: Shirt,
  turf: Dumbbell,
  football: Volleyball,
};

export default function ShopBrowser({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<CategoryFilter>("all");

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
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
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

// --- Card — links straight to the full product detail page ----------------

function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <Link
      href={`/shop/${product.id}`}
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
        {/* Top-right stack: eye-catching promo tag, then the sold-out flag.
            Capped width so a long badge wraps neatly in the corner instead of
            spilling across the card and overlapping the title on mobile. */}
        <div className="absolute right-3 top-3 flex max-w-[75%] flex-col items-end gap-1.5">
          {product.badge_text ? (
            <span className="max-w-[80%] break-words rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-2 py-1 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide text-white shadow-lg shadow-red-500/40 ring-1 ring-white/25 sm:px-3 sm:text-[11px]">
              {product.badge_text}
            </span>
          ) : null}
          {!product.in_stock ? (
            <span className="rounded-full bg-midnight-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/15 backdrop-blur">
              Sold Out
            </span>
          ) : null}
        </div>
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
    </Link>
  );
}
