import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Newspaper,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import {
  formatArticleDate,
  getExcerpt,
  MOCK_ARTICLES,
  type ArticleWithAuthor,
} from "@/lib/articles";
import { CategoryBadge } from "@/components/NewsCard";

const features = [
  {
    href: "/news",
    icon: Newspaper,
    title: "Latest News",
    description:
      "Match reports, transfer rumours, and Los Blancos headlines — curated for Bangladeshi Madridistas.",
  },
  {
    href: "/fans-zone",
    icon: Users,
    title: "Fans Zone",
    description:
      "Connect with fellow supporters, join watch parties, and live every Hala Madrid moment together.",
  },
  {
    href: "/shop",
    icon: ShoppingBag,
    title: "Official Shop",
    description:
      "Kits, scarves, and exclusive merch to wear your white pride with honour.",
  },
];

const stats = [
  { value: "15", label: "Champions League Titles" },
  { value: "36", label: "La Liga Titles" },
  { value: "∞", label: "Madridista Passion" },
];

// Static stagger delays for the feature cards (literal class names so Tailwind
// emits them).
const FEATURE_DELAYS = ["delay-100", "delay-200", "delay-300"] as const;

export default async function Home() {
  // Shared entrance-animation base; pair with a `delay-*` for a staggered reveal.
  const entrance =
    "animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both";

  // The two most recent articles for the homepage "Latest News" teaser. Falls
  // back to sample content (same as the /news page) so the section never looks
  // empty before the `articles` table has rows.
  const supabase = await createClient();
  const { data: newsData } = await supabase
    .from("articles")
    .select("*, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(2);
  const latestNews: ArticleWithAuthor[] =
    newsData && newsData.length > 0
      ? (newsData as ArticleWithAuthor[])
      : MOCK_ARTICLES.slice(0, 2);

  return (
    <>
      {/* First-sight Shop CTA — the very first thing below the Navbar, above the
          fold. A bold, glowing banner that drops in from the top and drives
          straight to the storefront with a pulsing button. */}
      <section className="animate-in fade-in slide-in-from-top-5 duration-1000 fill-mode-both relative overflow-hidden border-b border-gold-500/20 bg-gradient-to-r from-midnight-950 via-midnight-900 to-midnight-950 text-white">
        {/* Glowing gradient wash + slow-pulsing gold/rose blooms */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-40%,rgba(212,175,55,0.25),transparent_60%)]" />
          <div className="animate-glow absolute left-[15%] top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-gold-500/30 blur-3xl" />
          <div className="animate-glow absolute right-[15%] top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-rose-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-6 text-center sm:flex-row sm:justify-between sm:gap-6 sm:py-7 sm:text-left lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30 sm:flex">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div>
              {/* Prominent store label so the banner reads as the shop at a glance */}
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold-200">
                  <ShoppingCart className="h-3 w-3" />
                  TWS Store
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-400">
                  New Season Drop
                </span>
              </div>
              <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                New Season, New Drip.{" "}
                <span className="text-gradient-gold">Cop the Latest Gear.</span>
              </h2>
            </div>
          </div>

          {/* Massive, pulsing CTA — a glowing halo pulses behind the button so
              the label stays crisp while the button visibly throbs for attention. */}
          <div className="relative shrink-0">
            <span
              aria-hidden
              className="animate-pulse absolute inset-0 -z-10 rounded-full bg-gold-400/60 blur-xl"
            />
            <Link
              href="/shop"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 px-9 py-4 text-base font-extrabold text-midnight-950 shadow-[0_0_45px_-8px_rgba(212,175,55,0.95)] ring-1 ring-gold-200/60 transition-transform duration-300 hover:scale-105 sm:px-10 sm:py-5 sm:text-lg"
            >
              <ShoppingBag className="h-6 w-6" />
              Shop the Drop
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hero — image-backed, cinematic dark aesthetic. /hero-bg.png sits under
          a heavy zinc-950 gradient overlay so the white copy stays fully
          readable no matter what the photo looks like. */}
      <section className="relative overflow-hidden bg-zinc-950 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat text-white">
        {/* Heavy dark overlay for the premium, readable cinematic fade */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950"
        />
        {/* Ambient gold glow layered over the overlay, keeping the brand accent */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.14),transparent_60%)]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <span
            className={`${entrance} mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300`}
          >
            <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
            Uniting Bangladeshi Madridistas
          </span>

          <h1
            className={`${entrance} delay-100 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl`}
          >
            Welcome to The Whites{" "}
            <span className="text-gradient-gold">Bangladesh</span>
          </h1>

          <p
            className={`${entrance} delay-200 mt-6 max-w-2xl text-lg text-zinc-200 sm:text-xl`}
          >
            <span className="font-display text-2xl font-semibold italic text-gold-300 sm:text-3xl">
              Pasión Blanca, Desde Bangladesh
            </span>
            <span className="mt-3 block text-zinc-300">
              Your home for Los Blancos news, community, and culture.
            </span>
          </p>

          <div
            className={`${entrance} delay-300 mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row`}
          >
            <Link
              href="/fans-zone"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-7 py-3 text-sm font-semibold text-midnight-950 shadow-[0_0_30px_-8px_rgba(212,175,55,0.8)] transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Join the Fans Zone
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/news"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-gold-500/50 hover:text-gold-300 sm:w-auto"
            >
              Explore Latest News
            </Link>
          </div>

          <p
            className={`${entrance} delay-500 mt-12 font-display text-sm font-bold uppercase tracking-[0.4em] text-gold-400`}
          >
            ¡Hala Madrid!
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 dark:bg-midnight-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className={`${entrance} mx-auto max-w-2xl text-center`}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600 dark:text-gold-400">
              Explore the Hub
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Everything a Madridista Needs
            </h2>
            <p className="mt-4 text-slate-600 dark:text-gray-300">
              One home for the white faithful — news, community, and merch, all
              in one place.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Link
                key={feature.href}
                href={feature.href}
                className={`${entrance} ${FEATURE_DELAYS[index]} group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/40`}
              >
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-gold-300 to-gold-600 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-midnight-950 text-gold-400 transition-colors group-hover:bg-gold-500 group-hover:text-midnight-950 dark:bg-midnight-800">
                  <feature.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                  {feature.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 transition-colors group-hover:text-gold-600 dark:text-white dark:group-hover:text-gold-400">
                  Explore
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-gray-200 text-slate-900 dark:from-midnight-950 dark:to-midnight-950 dark:text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.15),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-center gap-3 text-gold-600 dark:text-gold-400">
            <Trophy className="h-6 w-6" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.3em]">
              The Most Decorated Club in History
            </span>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`${entrance} ${FEATURE_DELAYS[index]} text-center`}
              >
                <div className="text-gradient-gold font-display text-5xl font-extrabold sm:text-6xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News — the two most recent articles in a premium dark grid,
          replacing the old bottom Shop CTA (that push now lives at the very top
          of the page). */}
      <section className="relative overflow-hidden bg-midnight-950 text-white">
        {/* Cinematic gold glow + midnight depth */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-[-4rem] right-1/4 h-72 w-72 translate-x-1/2 rounded-full bg-midnight-600/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(212,175,55,0.12),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className={`${entrance} mx-auto max-w-2xl text-center`}>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
              <Newspaper className="h-3.5 w-3.5" />
              From the Newsroom
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Latest <span className="text-gradient-gold">News</span>
            </h2>
            <p className="mt-4 text-zinc-300">
              Match reports, transfers, and tactical breakdowns — straight off
              the Bernabéu beat.
            </p>
          </div>

          {/* Two-up article row — centered flex so a lone article (until a
              second is published) still reads as intentional rather than
              stranded in a half-empty grid column. */}
          <div className="mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-6">
            {latestNews.map((article, index) => {
              const excerpt = getExcerpt(article.content);
              return (
                <Link
                  key={article.id ?? article.slug}
                  href={`/news/${article.slug}`}
                  className={`${entrance} ${
                    index === 0 ? "delay-100" : "delay-200"
                  } group flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-midnight-900/60 shadow-xl backdrop-blur transition-all hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-[0_18px_50px_-20px_rgba(212,175,55,0.45)] sm:w-[calc(50%_-_0.75rem)]`}
                >
                  {/* Cover image (or on-brand fallback) with a category pill */}
                  <div
                    className="relative h-48 overflow-hidden bg-gradient-to-br from-midnight-700 via-midnight-900 to-midnight-950 sm:h-56"
                    style={
                      article.image_url
                        ? {
                            backgroundImage: `linear-gradient(to top, rgba(5,8,20,0.85), rgba(5,8,20,0.15)), url("${article.image_url}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    {!article.image_url ? (
                      <Newspaper
                        aria-hidden
                        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/10"
                      />
                    ) : null}
                    <div className="absolute left-4 top-4">
                      <CategoryBadge category={article.category} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatArticleDate(article.created_at)}
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-display text-xl font-bold leading-snug text-white transition-colors group-hover:text-gold-300">
                      {article.title}
                    </h3>
                    {excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-300">
                        {excerpt}
                      </p>
                    ) : null}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-400 transition-colors group-hover:text-gold-300">
                      Read More
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All News — prominent gold CTA to the full newsroom */}
          <div className="mt-12 flex justify-center">
            <Link
              href="/news"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-8 py-3.5 text-sm font-semibold text-midnight-950 shadow-[0_0_30px_-8px_rgba(212,175,55,0.85)] ring-1 ring-gold-200/50 transition-transform hover:scale-[1.03]"
            >
              <Newspaper className="h-4 w-4" />
              View All News
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
