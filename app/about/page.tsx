import type { Metadata } from "next";
import { Crown, MessagesSquare, Quote, Sparkles } from "lucide-react";
import Reveal from "@/components/Reveal";
import TestimonialCard from "@/components/TestimonialCard";
import { createClient } from "@/utils/supabase/server";
import type { Testimonial } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "About — The Whites Bangladesh",
  description:
    "The royal legacy of Real Madrid and the resilient story of The Whites Bangladesh — from The Whites Stories to the biggest Madrid fanpage in the country. ¡Hala Madrid!",
};

// Real Madrid honours, for the hero stat strip.
const LEGACY_STATS: { value: string; label: string }[] = [
  { value: "1902", label: "Founded in Madrid" },
  { value: "15", label: "Champions League titles" },
  { value: "36", label: "La Liga titles" },
];

// Our origin story as a timeline. The body copy is the EXACT narrative,
// distributed verbatim across milestones — no words changed.
const TIMELINE: { date: string; body: string }[] = [
  {
    date: "May 2021",
    body: "Started in May 2021 as 'The Whites Stories', we were a hub for match analysis, videos, and memes.",
  },
  {
    date: "June 2022",
    body: "By June 2022, we lost our page at 35K followers.",
  },
  {
    date: "Dec 8, 2022",
    body: "On Dec 8, 2022, we restarted. We grew rapidly, hitting 80K followers before losing the page again. Though we recovered it, the reach was gone. So, we started fresh.",
  },
  {
    date: "The Peak",
    body: "That third run was our absolute peak—hitting 250K followers and becoming the biggest Madrid fanpage in Bangladesh. We even launched our successful jersey business during this stint.",
  },
  {
    date: "2026",
    body: "Sadly, due to complications in 2026, we lost that page too. But as Cristiano's boys, we don't give up.",
  },
  {
    date: "Today",
    body: "We are back and growing again under our new name: The Whites Bangladesh.",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();

  // Fan testimonials power the "Voices of the Madridistas" wall, newest first.
  // If the table is missing this errors and `data` is null — the section then
  // renders a graceful empty state rather than crashing the page.
  const { data } = await supabase
    .from("site_testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  const testimonials: Testimonial[] = data ?? [];

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-midnight-950 dark:text-white">
      {/* Without JS the IntersectionObserver never runs, so force every reveal
          visible — content must never depend on the animation. */}
      <noscript>
        <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/* ===== Hero: The Royal Legacy ===== */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-gray-200 dark:from-midnight-900 dark:via-midnight-950 dark:to-midnight-950" />
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(212,175,55,0.14),transparent_60%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-gold-700 dark:text-gold-300">
              <Crown className="h-3.5 w-3.5" />
              Est. 1902 · Madrid, Spain
            </span>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              The Royal Club,
              <br />
              <span className="text-gradient-gold">The Royal Legacy</span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-zinc-300">
              Real Madrid is more than a football club — it is the most decorated
              institution in the history of the game. From the Santiago Bernabéu
              to the four corners of the world, the white shirt stands for
              ambition, elegance, and an unrelenting will to win. This is the
              legacy we carry, proudly, from Bangladesh.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4">
              {LEGACY_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gray-200 bg-white px-3 py-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
                >
                  <dt className="font-display text-3xl font-extrabold text-gold-700 dark:text-gold-300 sm:text-4xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ===== Our Story: TWS Resilience Timeline ===== */}
      <section className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-300">
            <Sparkles className="h-3.5 w-3.5" />
            Our Story
          </span>
          <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Built on <span className="text-gradient-gold">Resilience</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-zinc-300">
            Four pages. Three comebacks. One unbreakable community. This is how
            The Whites Bangladesh came to be.
          </p>
        </Reveal>

        {/* Timeline */}
        <div className="relative mt-14 pl-8 sm:pl-10">
          {/* Vertical spine */}
          <div
            aria-hidden
            className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-gold-500/60 via-gold-500/25 to-transparent sm:left-[9px]"
          />
          <ol className="space-y-10">
            {TIMELINE.map((item, index) => (
              <li key={item.date} className="relative">
                {/* Node dot */}
                <span
                  aria-hidden
                  className="absolute -left-8 top-1.5 flex h-4 w-4 items-center justify-center sm:-left-10"
                >
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-gold-400 bg-midnight-950 shadow-[0_0_12px_-2px_rgba(212,175,55,0.9)]" />
                </span>
                <Reveal delay={index * 90}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                    {item.date}
                  </p>
                  <p className="mt-2 text-lg leading-relaxed text-slate-700 dark:text-zinc-200">
                    {item.body}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        {/* Closing statement — the resilience creed (exact closing line) */}
        <Reveal delay={120}>
          <figure className="relative mt-16 overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-slate-100 to-gray-200 p-8 text-center shadow-2xl dark:from-midnight-900 dark:to-midnight-950 sm:p-12">
            <Quote
              aria-hidden
              className="mx-auto h-8 w-8 text-gold-500/60"
              strokeWidth={1.5}
            />
            <blockquote className="mt-4 font-display text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">
              One thing is sure: never write{" "}
              <span className="text-gradient-gold">Madrid</span> off, and never
              write <span className="text-gradient-gold">us</span> off.
            </blockquote>
            <figcaption className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-zinc-500">
              ¡Hala Madrid!
            </figcaption>
          </figure>
        </Reveal>
      </section>

      {/* ===== Voices of the Madridistas: fan testimonials ===== */}
      <section className="relative overflow-hidden border-t border-gray-200 bg-slate-100 dark:border-white/5 dark:bg-midnight-900/40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-gold-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <Reveal className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-300">
              <MessagesSquare className="h-3.5 w-3.5" />
              Fan Voices
            </span>
            <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              <span className="text-gradient-gold">
                Voices of the Madridistas
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-zinc-300">
              The real heartbeat of The Whites Bangladesh.
            </p>
          </Reveal>

          {testimonials.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <Reveal className="mt-12 text-center">
              <p className="text-slate-500 dark:text-zinc-400">
                The first voices are on their way. ¡Hala Madrid!
              </p>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
}
