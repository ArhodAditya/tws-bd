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
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out active:scale-[0.98] ${
                active
                  ? "bg-gradient-to-r from-gold-300 to-gold-500 text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)]"
                  : "border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 backdrop-blur-md hover:border-zinc-700/80 hover:text-amber-400"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-midnight-950/20" : "bg-white/10 text-zinc-500"
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
        <div className="mt-10 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 px-6 py-16 text-center backdrop-blur-md">
          <ShoppingBag className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-4 text-zinc-400">
            The shelves are being stocked — premium gear lands here soon.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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
      className="group flex animate-in flex-col overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 text-left shadow-xl backdrop-blur-md transition-all fade-in slide-in-from-bottom-8 duration-500 ease-out fill-mode-both hover:-translate-y-2 hover:border-zinc-700/80 hover:shadow-[0_10px_30px_rgba(251,191,36,0.15)] active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900">
        <ProductImage
          product={product}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
        {/* Category pill — pinned strictly to the top-left so the promo badge
            (top-right) can never collide with it. */}
        <span className="absolute left-2 top-2 z-10 rounded-full border border-gold-500/30 bg-zinc-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-300 backdrop-blur-md md:left-3 md:top-3">
          {CATEGORY_LABEL[product.category as ShopCategory] ?? product.category}
        </span>
        {/* Premium promo tag — a sleek gold pill in the top-right corner. Capped
            to the right half of the card so it stays clear of the category pill,
            wrapping cleanly (centered) if the text runs long. It lives inside
            the <Link>, so tapping it still navigates to the product page. */}
        {product.badge_text ? (
          <span className="absolute top-2 right-2 md:top-3 md:right-3 z-20 bg-gradient-to-r from-yellow-500 to-yellow-400 text-zinc-950 font-black uppercase tracking-wider rounded-full shadow-[0_4px_10px_rgba(234,179,8,0.3)] text-[8px] md:text-[10px] px-2.5 py-1 md:px-3 md:py-1.5 max-w-[50%] md:max-w-[60%] text-center leading-tight shadow-lg">
            {product.badge_text}
          </span>
        ) : null}
        {/* Sold-out flag — pinned bottom-right so it never collides with the
            promo tag above. */}
        {!product.in_stock ? (
          <span className="absolute bottom-2 right-2 z-10 rounded-full bg-zinc-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white ring-1 ring-white/15 backdrop-blur-md">
            Sold Out
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug tracking-tight text-white">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-lg font-extrabold text-amber-400">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 transition-all duration-300 ease-out group-hover:text-amber-400">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
