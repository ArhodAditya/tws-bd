"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Wraps content in a scroll-triggered fade/slide-up reveal. Uses an
// IntersectionObserver so the animation fires once as the section scrolls into
// view; the actual motion is CSS (.reveal / .is-visible in globals.css) and is
// disabled under prefers-reduced-motion.
//
// Robustness: content must NEVER be stuck hidden. If IntersectionObserver is
// unsupported, or the observer never reports back at all (some embedded/headless
// engines), we reveal anyway. A <noscript> override in the page handles JS-off.
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(t);
    }

    // The observer always schedules an initial callback once it's working, even
    // for off-screen elements (reporting isIntersecting: false). We use that to
    // tell "observer is broken" apart from "element is simply below the fold".
    let gotCallback = false;
    const observer = new IntersectionObserver(
      (entries) => {
        gotCallback = true;
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);

    // Safety net: if no callback ever arrives, the observer isn't functioning —
    // reveal so the content is always readable. (No-op in real browsers, where
    // the initial callback always fires and scroll-triggering stays intact.)
    const guard = window.setTimeout(() => {
      if (!gotCallback) {
        setVisible(true);
        observer.disconnect();
      }
    }, 900);

    return () => {
      observer.disconnect();
      window.clearTimeout(guard);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
