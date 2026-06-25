"use client";

import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";
import { MAX_RATING, clampRating, formatHandle, type Testimonial } from "@/lib/testimonials";

// A single premium review card for the public "Voices of the Madridistas" wall.
//
// Entrance: the tw-animate-css `animate-in fade-in slide-in-from-bottom-8
// duration-700` classes are added only once the card scrolls into view (via an
// IntersectionObserver), with a per-card stagger delay. Crucially, the card is
// fully visible WITHOUT the animation classes — so if JS is off, the observer
// is unsupported, or it never fires (headless engines), the content still
// shows. `prefers-reduced-motion` is honoured globally in globals.css.
export default function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") return;

    let gotCallback = false;
    const observer = new IntersectionObserver(
      (entries) => {
        gotCallback = true;
        if (entries.some((entry) => entry.isIntersecting)) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);

    // If the observer never reports back, leave the card in its resting
    // (visible) state — never animate-and-hide on a broken observer.
    const guard = window.setTimeout(() => {
      if (!gotCallback) observer.disconnect();
    }, 900);

    return () => {
      observer.disconnect();
      window.clearTimeout(guard);
    };
  }, []);

  const stars = clampRating(testimonial.rating);
  const handle = formatHandle(testimonial.handle);

  return (
    <article
      ref={ref}
      style={animate ? { animationDelay: `${index * 90}ms` } : undefined}
      className={`flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-slate-900/40 ${
        animate
          ? "animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-700"
          : ""
      }`}
    >
      {/* Gold quote mark + star rating */}
      <div className="flex items-center justify-between">
        <Quote className="h-7 w-7 text-gold-500" strokeWidth={1.5} />
        <div className="flex items-center gap-0.5" aria-label={`${stars} out of ${MAX_RATING} stars`}>
          {Array.from({ length: MAX_RATING }, (_, i) => (
            <Star
              key={i}
              aria-hidden
              className={`h-4 w-4 ${
                i < stars
                  ? "fill-gold-500 text-gold-500"
                  : "fill-transparent text-gray-300 dark:text-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Review body */}
      <p className="mt-4 flex-1 leading-relaxed text-slate-600 dark:text-gray-300">
        {testimonial.content}
      </p>

      {/* Author */}
      <div className="mt-6 border-t border-gray-100 pt-4 dark:border-white/10">
        <p className="font-semibold text-slate-900 dark:text-white">
          {testimonial.user_name}
        </p>
        {handle ? (
          <p className="mt-0.5 text-sm text-gold-600 dark:text-gold-400">
            {handle}
          </p>
        ) : null}
      </div>
    </article>
  );
}
