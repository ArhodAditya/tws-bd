"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { SPRING } from "@/components/motion/primitives";
import {
  CATEGORY_FILTERS,
  type CategoryFilter,
  type Product,
} from "@/lib/shop";

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
      {/* Sticky category bar — stays pinned just under the navbar as the grid
          scrolls. The rail still scrolls horizontally on mobile rather than
          wrapping into a tall stack that pushes the shelf below the fold. */}
      <div className="sticky top-16 z-30 -mx-4 mb-4 border-b border-white/5 bg-midnight-950/70 px-4 py-3 backdrop-blur-md sm:top-20 sm:mx-0 sm:rounded-2xl sm:border sm:border-white/10 sm:px-3">
      <div className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto sm:flex-wrap">
        {CATEGORY_FILTERS.map((tab) => {
          const active = filter === tab.value;
          return (
            <motion.button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              whileTap={{ scale: 0.93 }}
              transition={SPRING}
              aria-pressed={active}
              className={`relative flex h-12 shrink-0 snap-start items-center gap-2 rounded-full px-5 text-sm font-bold uppercase tracking-wide ${
                active
                  ? "text-midnight-950"
                  : "border border-white/15 bg-midnight-900/50 text-zinc-300 backdrop-blur-md hover:border-gold-500/40 hover:text-gold-300"
              }`}
            >
              {/* Shared layout pill slides between tabs on the house spring */}
              {active ? (
                <motion.span
                  layoutId="shop-filter-pill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-full bg-gold-500"
                />
              ) : null}
              <span className="relative">{tab.label}</span>
              <span
                className={`relative rounded-full px-1.5 text-xs font-black tabular-nums ${
                  active ? "bg-midnight-950/20" : "bg-white/10 text-zinc-400"
                }`}
              >
                {counts[tab.value] ?? 0}
              </span>
            </motion.button>
          );
        })}
      </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-midnight-900/40 px-6 py-16 text-center backdrop-blur-md">
          <ShoppingBag className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-4 text-zinc-400">
            The shelves are being stocked — premium gear lands here soon.
          </p>
        </div>
      ) : (
        /* Mobile: swipeable snap shelf. md+: grid. */
        <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                // New items stagger in with a subtle upward spring; the old set
                // scales down and fades out. Stagger delay is capped so a large
                // grid doesn't trail on for too long, and exit stays snappy.
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: SPRING }}
                transition={{ ...SPRING, delay: Math.min(index, 7) * 0.04 }}
                // min-w-0 lets the grid/flex track actually constrain the card
                // instead of being widened by its image's intrinsic size.
                className="flex min-w-0 shrink-0 md:w-full md:shrink"
              >
                <ProductCard product={product} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
