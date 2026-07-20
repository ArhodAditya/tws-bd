"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Shared motion vocabulary for the site. Two rules hold everywhere:
//
// 1. Nothing is ever gated on JS. Every wrapper carries `data-motion`, and the
//    root layout ships a <noscript> override that forces those elements to
//    their resting state — so a JS-off render shows all content immediately.
// 2. Reduced motion always degrades to a plain crossfade (or nothing), never
//    to a broken layout.

// The house spring: bouncy enough to feel alive, damped enough to settle fast.
export const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;
export const SOFT_SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 34,
} as const;

// --- rAF escape hatch ------------------------------------------------------
// framer-motion's frameloop runs on requestAnimationFrame, which is suspended
// wherever a page isn't actually painting: background tabs, some in-app social
// browsers, and headless / prerender renderers. There, an element with an
// `initial` offset sits at that offset forever — i.e. the page ships invisible.
//
// framer-motion only reads `initial` at mount, so it can't be un-set after the
// fact. Instead we flip a class on <html> and let a `!important` rule force
// every [data-motion] element to its resting state — the same mechanism as the
// <noscript> override in the root layout. setTimeout still fires in these
// environments, which is what lets us detect the dead frameloop at all.
//
// Healthy browsers fire rAF on the next frame and never bail, so this costs
// nothing in the normal case.
export const MOTION_BAIL_CLASS = "motion-bail";

export function useMotionEscapeHatch(ms = 1200): boolean {
  const [bail, setBail] = useState(false);

  useEffect(() => {
    let alive = true;
    let framed = false;
    const raf = requestAnimationFrame(() => {
      framed = true;
    });
    const timer = window.setTimeout(() => {
      if (!alive || framed) return;
      document.documentElement.classList.add(MOTION_BAIL_CLASS);
      setBail(true);
    }, ms);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [ms]);

  return bail;
}

// --- Masked line reveal ----------------------------------------------------
// Editorial "type slides up out of a hard mask" effect used on hero headlines.
// The mask is an overflow-hidden block; the inner span travels from fully below
// the mask to its resting position, so the letters appear to be wiped in.
export function MaskLine({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const bail = useMotionEscapeHatch();

  if (reduceMotion) {
    return (
      <motion.span
        data-motion
        initial={bail ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: delay * 0.6 }}
        className={`block ${className ?? ""}`}
      >
        {children}
      </motion.span>
    );
  }

  return (
    // pb/-mb pair gives descenders (g, y, j) room so the mask never clips them.
    <span className={`block overflow-hidden pb-[0.14em] -mb-[0.14em] ${className ?? ""}`}>
      <motion.span
        data-motion
        initial={bail ? false : { y: "110%" }}
        animate={{ y: 0 }}
        transition={{ ...SOFT_SPRING, delay }}
        className="block will-change-transform"
      >
        {children}
      </motion.span>
    </span>
  );
}

// --- Scroll-triggered reveal ----------------------------------------------
// Fires once as the element enters the viewport. `amount` stays low so tall
// sections don't wait until they're half-scrolled to animate.
export function ScrollReveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const bail = useMotionEscapeHatch();

  return (
    <motion.div
      data-motion
      initial={
        bail ? false : reduceMotion ? { opacity: 0 } : { opacity: 0, y }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
      transition={{ ...SOFT_SPRING, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Parallax --------------------------------------------------------------
// Scroll-linked depth. `distance` is the total travel in px across the whole
// time the section is on screen; negative values move against the scroll.
// Transform-only, so it never triggers layout.
export function Parallax({
  children,
  distance = 80,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const bail = useMotionEscapeHatch();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Smooth the raw scroll value so the layer glides instead of tracking the
  // wheel step-for-step.
  const eased = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const y = useTransform(eased, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        data-motion
        style={reduceMotion || bail ? undefined : { y }}
        className="h-full w-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Returns a scroll progress value for a section — used for bespoke effects
// (scale, opacity, blur) that don't fit the Parallax wrapper.
export function useSectionProgress<T extends HTMLElement>(
  ref: React.RefObject<T | null>
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return scrollYProgress;
}

// --- Magnetic tilt ---------------------------------------------------------
// Card springs toward the cursor with a subtle 3D tilt. Mouse-only: on touch
// the handlers no-op so horizontal swiping through a carousel stays native.
export function MagneticTilt({
  children,
  className,
  strength = 7,
  lift = -8,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  lift?: number;
}) {
  const reduceMotion = useReducedMotion();
  const rx = useSpring(0, { stiffness: 260, damping: 18, mass: 0.6 });
  const ry = useSpring(0, { stiffness: 260, damping: 18, mass: 0.6 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * strength * 2);
    ry.set(px * strength * 2);
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      data-motion
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={reduceMotion ? undefined : { scale: 1.03, y: lift }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
