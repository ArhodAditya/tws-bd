"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { siteKey, type UclCampaignSummary } from "@/lib/ucl-campaigns";

// The titles as a timeline. This is the accessible way into the globe: every
// campaign is a real button here, including the ones whose beacons share a
// city and so can't be told apart by clicking the globe.
//
// Spacing is information. The gap before each year grows with the wait that
// preceded it (logarithmically, or 1966 → 1998 would swallow the rail), and a
// wait longer than two seasons is drawn dashed — so the five-in-a-row of the
// fifties and the 32-year drought read at a glance, without a single label.

/** Relative width of the stretch of rail leading up to a title. */
function waitWeight(yearsSincePrevious: number): number {
  return 1 + Math.log2(Math.max(1, yearsSincePrevious));
}

interface TimelineRailProps {
  /** The campaigns, oldest first. */
  titles: readonly UclCampaignSummary[];
  activeYear: number | null;
  /** Site (city key) being pointed at on the globe — its years light up here. */
  highlightedSite: string | null;
  onSelect: (campaign: UclCampaignSummary) => void;
  onHighlightSite: (key: string | null) => void;
  className?: string;
}

export default function TimelineRail({
  titles,
  activeYear,
  highlightedSite,
  onSelect,
  onHighlightSite,
  className = "",
}: TimelineRailProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const indicatorId = `rde-rail-${useId()}`;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Roving tabindex: the rail is a single tab stop and the arrow keys move
  // within it, so keyboard users aren't made to tab through fifteen years.
  const [rovingIndex, setRovingIndex] = useState(0);
  const activeIndex = titles.findIndex((title) => title.year === activeYear);
  const tabStop = activeIndex >= 0 ? activeIndex : rovingIndex;

  // Keep the active year in view on narrow screens. Scrolls the rail itself,
  // never the page (scrollIntoView would also move the document vertically).
  useEffect(() => {
    if (activeIndex < 0) return;
    const scroller = scrollerRef.current;
    const button = buttonRefs.current[activeIndex];
    if (!scroller || !button) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return;

    const scrollerBox = scroller.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const offset =
      buttonBox.left -
      scrollerBox.left -
      (scrollerBox.width - buttonBox.width) / 2;
    scroller.scrollBy({
      left: offset,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeIndex, reduceMotion]);

  const focusYear = (index: number) => {
    const clamped = Math.max(0, Math.min(titles.length - 1, index));
    setRovingIndex(clamped);
    buttonRefs.current[clamped]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    const current = buttonRefs.current.findIndex(
      (button) => button === document.activeElement
    );
    if (current < 0) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        focusYear(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        focusYear(current - 1);
        break;
      case "Home":
        focusYear(0);
        break;
      case "End":
        focusYear(titles.length - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <nav aria-label="Titles by year" className={className}>
      <motion.div
        ref={scrollerRef}
        // Lets the gliding indicator account for horizontal scroll.
        layoutScroll
        className="no-scrollbar overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)] lg:overflow-visible lg:[mask-image:none]"
      >
        <ol
          onKeyDown={handleKeyDown}
          className="flex w-max items-start px-6 pb-5 pt-4 sm:px-8 lg:w-full lg:px-10 lg:pb-6"
        >
          {titles.map((title, index) => {
            const wait = index === 0 ? 0 : title.year - titles[index - 1].year;
            const weight = index === 0 ? 0 : waitWeight(wait);
            const isActive = index === activeIndex;
            const site = siteKey(title.city);
            const isLinked = !isActive && highlightedSite === site;
            // The rail runs unbroken through every year: each button draws
            // the stretch that passes behind it, stopping at the first and
            // last ticks so the line doesn't overshoot either end.
            const axis =
              index === 0
                ? "before:left-1/2 before:right-0"
                : index === titles.length - 1
                  ? "before:left-0 before:right-1/2"
                  : "before:inset-x-0";

            return (
              <li
                key={title.year}
                // Phones scroll, so each stretch gets a fixed width; from `lg`
                // the same weights share out whatever room the rail has.
                className={
                  index === 0
                    ? "flex shrink-0 items-start"
                    : "flex w-[var(--stretch)] shrink-0 items-start lg:w-auto lg:shrink lg:grow-[var(--weight)] lg:basis-[52px]"
                }
                style={
                  {
                    "--weight": weight,
                    "--stretch": `${Math.round(44 + weight * 9)}px`,
                  } as CSSProperties
                }
              >
                {index > 0 ? (
                  <span
                    aria-hidden
                    className={`mt-[5px] h-px min-w-2 flex-1 ${
                      wait > 2
                        ? "bg-[repeating-linear-gradient(to_right,rgba(255,255,255,0.3)_0_3px,transparent_3px_8px)]"
                        : "bg-white/20"
                    }`}
                  />
                ) : null}

                <button
                  ref={(node) => {
                    buttonRefs.current[index] = node;
                  }}
                  type="button"
                  // Lets the section hand focus back to a given year.
                  data-year={title.year}
                  tabIndex={index === tabStop ? 0 : -1}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`${title.year}: ${title.title}, ${title.city}`}
                  onClick={() => {
                    setRovingIndex(index);
                    onSelect(title);
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                      onHighlightSite(site);
                    }
                  }}
                  onPointerLeave={() => onHighlightSite(null)}
                  onFocus={() => {
                    setRovingIndex(index);
                    onHighlightSite(site);
                  }}
                  onBlur={() => onHighlightSite(null)}
                  className={`group/year relative flex h-11 w-[46px] shrink-0 flex-col items-center rounded-lg outline-none before:absolute before:top-[5px] before:h-px before:bg-white/20 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06080d] ${axis}`}
                >
                  {/* Tick on the rail. */}
                  <span
                    aria-hidden
                    className={`mt-[5px] w-px transition-all duration-300 ${
                      isActive
                        ? "h-3 bg-[#D4AF37]"
                        : isLinked
                          ? "h-2.5 bg-[#D4AF37]/80"
                          : "h-2 bg-white/30 group-hover/year:h-2.5 group-hover/year:bg-white/70"
                    }`}
                  />
                  {isActive ? (
                    reduceMotion ? (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-[2px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-[#D4AF37] shadow-[0_0_12px_2px_rgba(212,175,55,0.65)]"
                      />
                    ) : (
                      <motion.span
                        aria-hidden
                        layoutId={indicatorId}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 28,
                        }}
                        className="absolute left-1/2 top-[2px] -ml-[3.5px] h-[7px] w-[7px] rounded-full bg-[#D4AF37] shadow-[0_0_12px_2px_rgba(212,175,55,0.65)]"
                      />
                    )
                  ) : null}
                  <span
                    className={`mt-2 font-mono text-[11px] tabular-nums tracking-[0.08em] transition-colors duration-300 ${
                      isActive
                        ? "text-[#F1DD96]"
                        : isLinked
                          ? "text-zinc-100"
                          : "text-zinc-500 group-hover/year:text-zinc-100"
                    }`}
                  >
                    {title.year}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </motion.div>
    </nav>
  );
}
