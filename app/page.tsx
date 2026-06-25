import Link from "next/link";
import {
  ArrowRight,
  Newspaper,
  Users,
  ShoppingBag,
  Star,
  Trophy,
} from "lucide-react";

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

export default function Home() {
  // Shared entrance-animation base; pair with a `delay-*` for a staggered reveal.
  const entrance =
    "animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-gray-200 text-slate-900 dark:from-midnight-950 dark:to-slate-900 dark:text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute -right-16 bottom-[-6rem] h-80 w-80 rounded-full bg-gold-500/5 blur-3xl dark:bg-midnight-600/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.12),transparent_60%)]" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <span
            className={`${entrance} mb-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-300`}
          >
            <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500 dark:text-gold-400" />
            The Madridista Community of Bangladesh
          </span>

          <h1
            className={`${entrance} delay-100 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl`}
          >
            Welcome to The Whites{" "}
            <span className="text-gradient-gold">Bangladesh</span>
          </h1>

          <p
            className={`${entrance} delay-200 mt-6 max-w-2xl text-lg text-slate-600 dark:text-zinc-300 sm:text-xl`}
          >
            <span className="font-display text-2xl font-semibold italic text-gold-700 dark:text-gold-300 sm:text-3xl">
              Pasión Blanca, Desde Bangladesh
            </span>
            <span className="mt-3 block">
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
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white/60 px-7 py-3 text-sm font-semibold text-slate-900 backdrop-blur transition-colors hover:border-gold-500/50 hover:text-gold-700 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:text-gold-300 sm:w-auto"
            >
              Explore Latest News
            </Link>
          </div>

          <p
            className={`${entrance} delay-500 mt-12 font-display text-sm font-bold uppercase tracking-[0.4em] text-gold-600 dark:text-gold-400`}
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
    </>
  );
}
