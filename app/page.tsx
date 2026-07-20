import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { MOCK_ARTICLES, type ArticleWithAuthor } from "@/lib/articles";
import { type Product } from "@/lib/shop";
import { NewsCard } from "@/components/NewsCard";
import HomeHero from "@/components/home/HomeHero";
import ProductCard from "@/components/shop/ProductCard";
import { ScrollReveal } from "@/components/motion/primitives";

// Editorial index rows — deliberately not another icon-card grid. Each row is
// a full-width link with an oversized index number and a rule.
const SECTIONS = [
  {
    href: "/news",
    title: "Newsroom",
    blurb: "Match reports, transfers, and tactical breakdowns.",
  },
  {
    href: "/fans-zone",
    title: "Fans Zone",
    blurb: "Watch parties, predictions, and the community table.",
  },
  {
    href: "/shop",
    title: "The Store",
    blurb: "Kits, hoodies, turf trainers — worn with intent.",
  },
];

const HONOURS = [
  { value: "15", label: "Champions League" },
  { value: "36", label: "La Liga" },
  { value: "∞", label: "Madridista passion" },
];

export default async function Home() {
  const supabase = await createClient();

  // Latest news + the newest active drop, fetched in parallel. Both fall back
  // gracefully so the page never renders half-empty.
  const [newsRes, productRes] = await Promise.all([
    supabase
      .from("articles")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const latestNews: ArticleWithAuthor[] =
    newsRes.data && newsRes.data.length > 0
      ? (newsRes.data as ArticleWithAuthor[])
      : MOCK_ARTICLES.slice(0, 3);
  const drop: Product[] = productRes.data ?? [];

  return (
    <>
      <HomeHero />

      {/* ===== THE DROP — real merch, swipeable on mobile ==================== */}
      {drop.length > 0 ? (
        <section className="relative overflow-hidden bg-midnight-950 py-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="display-lg font-display uppercase text-white">
                    The Drop
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-zinc-400 sm:text-base">
                    This season&rsquo;s kit, in hand and ready to ship from
                    Chattogram.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="hidden h-12 shrink-0 items-center gap-2 rounded-full border border-gold-500/40 px-6 text-xs font-black uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold-500/15 sm:inline-flex"
                >
                  All gear
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Swipeable shelf on mobile, grid from md. */}
            {/* 2-up at tablet, 4-up from lg — 4 columns at 768px squeezes the
                trading-card proportion too narrow to read. */}
            <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
              {drop.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            <Link
              href="/shop"
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full border border-gold-500/40 text-xs font-black uppercase tracking-[0.14em] text-gold-300 sm:hidden"
            >
              Shop all gear
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* ===== Editorial index ============================================== */}
      <section className="border-y border-white/10 bg-midnight-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul>
            {SECTIONS.map((section, i) => (
              <li key={section.href}>
                <ScrollReveal delay={i * 0.06}>
                  <Link
                    href={section.href}
                    className="group flex items-center gap-5 border-b border-white/10 py-7 last:border-b-0 sm:gap-8 sm:py-9"
                  >
                    <span
                      aria-hidden
                      className="font-display text-2xl font-extrabold tabular-nums text-gold-500/40 transition-colors group-hover:text-gold-400 sm:text-3xl"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-2xl font-extrabold uppercase leading-none tracking-tight text-white transition-transform duration-300 group-hover:translate-x-1 sm:text-4xl">
                        {section.title}
                      </span>
                      <span className="mt-1.5 block text-sm text-zinc-400">
                        {section.blurb}
                      </span>
                    </span>
                    <ArrowUpRight className="h-6 w-6 shrink-0 text-zinc-500 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-gold-300 sm:h-8 sm:w-8" />
                  </Link>
                </ScrollReveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Honours ====================================================== */}
      <section className="relative overflow-hidden bg-midnight-950 py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_130%,rgba(220,174,43,0.16),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="text-center font-display text-xs font-black uppercase tracking-[0.3em] text-gold-400">
              The most decorated club in history
            </p>
          </ScrollReveal>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {HONOURS.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="font-display text-4xl font-extrabold leading-none tracking-tight text-gold-300 sm:text-6xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 sm:text-xs">
                    {stat.label}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Latest news ================================================== */}
      <section className="bg-gradient-to-b from-midnight-950 to-black py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-end justify-between gap-4">
              <h2 className="display-lg font-display uppercase text-white">
                Latest
              </h2>
              <Link
                href="/news"
                className="inline-flex h-12 shrink-0 items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-gold-300"
              >
                All news
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {latestNews.map((article, i) => (
              <ScrollReveal
                key={article.id ?? article.slug}
                delay={i * 0.07}
                className="w-[84vw] max-w-sm shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink"
              >
                <NewsCard article={article} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
