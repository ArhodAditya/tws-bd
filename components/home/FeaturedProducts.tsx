import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { ScrollReveal } from "@/components/motion/primitives";
import type { Product } from "@/lib/shop";

// Homepage "Featured" showcase — the curated edit an admin flags via the
// "Feature on Homepage" toggle (products.is_featured). Sits directly under the
// hero so it's the first gear a visitor meets. Renders nothing when nothing is
// featured (or before the is_featured column exists), keeping the page clean.
export default function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-midnight-950 to-midnight-950 py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-gold-400">
                <Sparkles className="h-4 w-4" />
                Featured
              </span>
              <h2 className="display-lg mt-2 font-display uppercase text-white">
                Handpicked
              </h2>
              <p className="mt-2 max-w-md text-sm text-zinc-400 sm:text-base">
                A curated edit of the gear we&rsquo;re championing right now.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden h-12 shrink-0 items-center gap-2 rounded-full border border-gold-500/40 px-6 text-xs font-black uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold-500/15 sm:inline-flex"
            >
              Shop all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Swipeable shelf on mobile, grid from md. Each card fades + slides up
            as it scrolls into view, staggered across the row. */}
        <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
          {products.slice(0, 8).map((product, i) => (
            <ScrollReveal
              key={product.id}
              delay={Math.min(i, 6) * 0.08}
              y={32}
              className="flex min-w-0 shrink-0 md:w-full md:shrink"
            >
              <ProductCard product={product} index={i} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
