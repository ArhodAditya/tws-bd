"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  MaskLine,
  Parallax,
  SPRING,
  useMotionEscapeHatch,
} from "@/components/motion/primitives";

// Matchday meta strip — real facts, not a decorative eyebrow. Reads like the
// masthead line of a football programme.
const META = ["Est. 2021", "Chattogram, BD", "15× Champions of Europe"];

export default function HomeHero() {
  const reduceMotion = useReducedMotion();
  // Above-the-fold copy must never depend on a live frameloop. See
  // useMotionEscapeHatch for why.
  const bail = useMotionEscapeHatch();

  return (
    <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden bg-midnight-950 text-white">
      {/* Parallax photographic backdrop. Scaled past the frame so the drift
          never exposes an edge. */}
      <Parallax distance={60} className="absolute inset-0 -z-20">
        <div className="relative h-[125%] w-full -translate-y-[8%]">
          <Image
            src="/hero-bg.png"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%]"
          />
        </div>
      </Parallax>

      {/* Readability wash: heavy at the base where the type sits, clearing
          toward the top so the photograph still reads. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-midnight-950 via-midnight-950/85 to-midnight-950/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_120%,rgba(220,174,43,0.22),transparent_62%)]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8">
        {/* Meta strip */}
        <motion.ul
          data-motion
          initial={bail ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300 sm:text-xs"
        >
          {META.map((item, i) => (
            <li key={item} className="flex items-center gap-3">
              {i > 0 ? (
                <span aria-hidden className="h-3 w-px bg-gold-500/40" />
              ) : null}
              {item}
            </li>
          ))}
        </motion.ul>

        {/* The headline. Two masked lines: solid, then outlined — the
            sports-magazine cover move. */}
        <h1 className="display-xl font-display max-w-[15ch]">
          <MaskLine delay={0.06}>Pasión</MaskLine>
          <MaskLine delay={0.16}>
            <span className="text-stroke">Blanca</span>
          </MaskLine>
        </h1>

        <motion.p
          data-motion
          initial={
            bail ? false : reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.34 }}
          className="mt-6 max-w-lg text-base leading-relaxed text-zinc-200 sm:text-lg"
        >
          Desde Bangladesh. Your home for Los Blancos news, the community, and
          the kit that says which side you&rsquo;re on.
        </motion.p>

        {/* CTAs — h-14 targets, comfortably past the h-12 floor. */}
        <motion.div
          data-motion
          initial={
            bail ? false : reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.44 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            transition={SPRING}
          >
            <Link
              href="/shop"
              className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-gold-500 px-8 text-sm font-extrabold uppercase tracking-wide text-midnight-950 shadow-[0_10px_40px_-10px_rgba(220,174,43,0.9)] sm:w-auto"
            >
              Shop the Drop
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            transition={SPRING}
          >
            <Link
              href="/news"
              className="group flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-md sm:w-auto"
            >
              Latest News
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Hazard rule pinned to the base — hard matchday edge into the next
          section. */}
      <div aria-hidden className="stripe-gold absolute inset-x-0 bottom-0 h-1.5 opacity-70" />
    </section>
  );
}
