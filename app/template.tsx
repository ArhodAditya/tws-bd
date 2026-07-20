"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMotionEscapeHatch } from "@/components/motion/primitives";

// Spring-based page transition: templates remount on navigation, so every
// route change replays this gentle rise-and-settle.
//
// This wrapper contains the entire page, so it must never be able to strand
// the content invisible — hence the rAF escape hatch. Where the frameloop is
// suspended (background tab, in-app browser, prerender renderer), `initial` is
// dropped and the page renders at rest.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const bail = useMotionEscapeHatch();

  return (
    <motion.div
      data-motion
      initial={
        bail ? false : reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
