"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell, Gem, Shirt, ShoppingBag, Volleyball } from "lucide-react";
import { MagneticTilt } from "@/components/motion/primitives";
import {
  CATEGORY_LABEL,
  formatPrice,
  type Product,
  type ShopCategory,
} from "@/lib/shop";

// Per-category accent icon, reused for the image fallback.
const CATEGORY_ICON: Record<ShopCategory, typeof Shirt> = {
  jersey: Shirt,
  turf: Dumbbell,
  football: Volleyball,
  fashion: Gem,
};

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

// Premium trading-card treatment: gold foil frame, a holo sheen that sweeps on
// hover, hard-edged category tag, and the price set in display weight like a
// kit number. Magnetic tilt is mouse-only so carousel swiping stays native.
export default function ProductCard({
  product,
  index = 0,
  className,
}: {
  product: Product;
  index?: number;
  className?: string;
}) {
  const soldOut = !product.in_stock;

  return (
    // Fixed width on mobile (swipe shelf), full column width from md up.
    // `md:w-full` is load-bearing: with `w-auto` the card sizes to the product
    // photo's intrinsic width and overflows its grid column, which the
    // aspect-[4/5] box then turns into runaway height.
    <MagneticTilt
      className={`w-[74vw] max-w-[19rem] shrink-0 snap-center sm:w-[52vw] md:w-full md:max-w-none ${className ?? ""}`}
    >
      <Link
        href={`/shop/${product.id}`}
        style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
        className="group relative flex h-full animate-in flex-col overflow-hidden rounded-[1.25rem] border border-gold-500/25 bg-midnight-900/70 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md fade-in slide-in-from-bottom-6 duration-500 fill-mode-both hover:border-gold-500/70"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-midnight-950">
          <ProductImage
            product={product}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              soldOut ? "opacity-45 grayscale" : ""
            }`}
          />

          {/* Holo specular sweep (::after via .card-holo) */}
          <span aria-hidden className="card-holo absolute inset-0 overflow-hidden" />

          {/* Base fade so the tag row stays legible on busy photography */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-midnight-950 to-transparent"
          />

          {/* Hard-edged category tag — square corners against the rounded frame */}
          <span className="absolute left-0 top-4 bg-gold-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-midnight-950">
            {CATEGORY_LABEL[product.category as ShopCategory] ?? product.category}
          </span>

          {product.badge_text ? (
            <span className="absolute right-3 top-3 max-w-[52%] rounded-full bg-pitch-500 px-2.5 py-1 text-center text-[9px] font-black uppercase leading-tight tracking-wider text-midnight-950 shadow-lg md:text-[10px]">
              {product.badge_text}
            </span>
          ) : null}

          {soldOut ? (
            <span className="absolute bottom-3 right-3 border border-white/25 bg-midnight-950/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur">
              Sold Out
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
            {product.name}
          </h3>
          <div className="mt-auto flex items-end justify-between gap-2">
            {/* Price set like a kit number */}
            <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-gold-300">
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 transition-colors group-hover:text-gold-300">
              View
            </span>
          </div>
        </div>
      </Link>
    </MagneticTilt>
  );
}
