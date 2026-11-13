"use client";

import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { Ibarra_Real_Nova } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  describeScoreNote,
  parseScore,
  uclHistory,
  uclSites,
  type TitleSite,
  type UclTitle,
} from "@/lib/ucl-history";
import { MQ_LG, useMediaQuery } from "./hooks";
import TimelineRail from "./TimelineRail";
import TitleDetail, { CloseButton } from "./TitleDetail";
import TitleSheet from "./TitleSheet";

// "Reyes de Europa" — every European Cup Real Madrid have won, on the map
// where it happened.
//
// One piece of state drives everything: `activeLocation`. Markers and the
// timeline set it; the detail view reads it. How that detail is shown depends
// on the screen: a glass card floating over the map's quiet eastern side from
// `lg` up, a bottom sheet below that — never a floating tooltip on touch.
//
// The stage is always dark, in both themes, like the site's other cinematic
// surfaces.

// Ibarra Real Nova revives the type cut in Madrid for Joaquín Ibarra, printer
// to the Spanish crown — a royal Madrid face for a royal Madrid club. Italic
// only: it is used for the title and the years, nothing else.
const regal = Ibarra_Real_Nova({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-ibarra",
  display: "swap",
});

// Client-only: see the note at the top of EuropeMap.tsx.
const EuropeMap = dynamic(() => import("./EuropeMap"), {
  ssr: false,
  loading: () => null,
});

// If the map can't load (a dropped chunk, an old browser), the stage simply
// stays dark: the timeline, the card and the sheet don't depend on it.
class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const FIRST_TITLE = uclHistory[0];
const LAST_TITLE = uclHistory[uclHistory.length - 1];

// One line for screen readers each time the selection changes.
function announce(title: UclTitle): string {
  const score = parseScore(title.score);
  const result = score
    ? `Real Madrid ${score.madrid}, ${title.opponent} ${score.opponent}${
        score.note ? `, ${describeScoreNote(score.note).toLowerCase()}` : ""
      }`
    : `Real Madrid ${title.score} ${title.opponent}`;
  return `${title.year}, ${title.city}. ${title.title}. ${result}.`;
}

export default function ReyesDeEuropa() {
  const [activeLocation, setActiveLocation] = useState<UclTitle | null>(null);
  // Linked hover between the map and the timeline.
  const [highlightedCity, setHighlightedCity] = useState<string | null>(null);

  const isDesktop = useMediaQuery(MQ_LG);
  const reduceMotion = useReducedMotion() ?? false;

  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  // Set when the card is opened from a control that the card then covers.
  const focusCardOnOpen = useRef(false);

  const headingId = useId();
  const detailHeadingId = useId();

  const select = useCallback((title: UclTitle) => setActiveLocation(title), []);
  const close = useCallback(() => setActiveLocation(null), []);

  // A marker stands for a city, and a city can hold several titles. The first
  // click opens the oldest; clicking the same city again steps to its next.
  const selectSite = useCallback((site: TitleSite) => {
    setActiveLocation((current) => {
      if (current && current.city === site.city) {
        const index = site.titles.indexOf(current);
        return site.titles[(index + 1) % site.titles.length];
      }
      return site.titles[0];
    });
  }, []);

  const cardOpen = isDesktop && activeLocation !== null;
  const sheetOpen = !isDesktop && activeLocation !== null;

  // Desktop card: Escape closes it. If the keyboard was inside the card, send
  // focus back to that title's year on the timeline rather than to <body>.
  const closeCard = useCallback(() => {
    const card = cardRef.current;
    const focusWasInside =
      card !== null && card.contains(document.activeElement);
    const year = activeLocation?.year;
    setActiveLocation(null);
    if (focusWasInside && year !== undefined) {
      sectionRef.current
        ?.querySelector<HTMLButtonElement>(`[data-year="${year}"]`)
        ?.focus();
    }
  }, [activeLocation]);

  useEffect(() => {
    if (!cardOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCard();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cardOpen, closeCard]);

  // The intro's button is hidden behind the card it opens, so take the
  // keyboard along with it.
  useEffect(() => {
    if (cardOpen && focusCardOnOpen.current) {
      focusCardOnOpen.current = false;
      cardRef.current?.focus({ preventScroll: true });
    }
  }, [cardOpen]);

  const startFromTheBeginning = () => {
    focusCardOnOpen.current = isDesktop;
    select(FIRST_TITLE);
  };

  const activeIndex = activeLocation ? uclHistory.indexOf(activeLocation) : -1;
  const detail = activeLocation ? (
    <TitleDetail
      title={activeLocation}
      number={activeIndex + 1}
      total={uclHistory.length}
      siblings={uclHistory.filter(
        (title) => title.city === activeLocation.city && title !== activeLocation
      )}
      previous={uclHistory[activeIndex - 1] ?? null}
      next={uclHistory[activeIndex + 1] ?? null}
      headingId={detailHeadingId}
      variant={isDesktop ? "card" : "sheet"}
      onSelect={select}
    />
  ) : null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={`${regal.variable} relative`}
    >
      <div
        data-active={cardOpen}
        className="group/stage relative isolate overflow-hidden rounded-[28px] bg-[#06080d] text-zinc-100 shadow-[0_40px_90px_-50px_rgba(6,11,34,0.75)] ring-1 ring-white/[0.08] lg:h-[620px] xl:h-[660px]"
      >
        {/* Atmosphere: a low gold glow under the continent's western half,
            where all but one of the finals were played. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_42%_at_42%_68%,rgba(212,175,55,0.08),transparent_70%)] lg:bg-[radial-gradient(38%_52%_at_22%_56%,rgba(212,175,55,0.09),transparent_72%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 z-30 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"
        />

        {/* Intro. In flow above the map on small screens; from `lg` it holds
            the story column on the right until a title's card takes its place. */}
        <div
          inert={cardOpen}
          className="relative z-20 px-6 pt-8 sm:px-8 sm:pt-10 lg:absolute lg:right-8 lg:top-[calc(50%-2.5rem)] lg:w-[20.5rem] lg:-translate-y-1/2 lg:p-0 lg:transition-opacity lg:duration-300 lg:group-data-[active=true]/stage:opacity-0 xl:right-10 xl:w-[22rem]"
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-[#D4AF37]">
            Kings of Europe
            <span aria-hidden className="px-2 text-white/30">
              ·
            </span>
            {FIRST_TITLE.year}–{LAST_TITLE.year}
          </p>
          <h2
            id={headingId}
            className="mt-4 font-regal text-[3.4rem] italic leading-[0.9] sm:text-7xl lg:text-[5rem]"
          >
            {/* pr gives the italic's overhang room inside the gradient clip. */}
            <span className="text-gradient-gold inline-block pr-[0.12em]">
              Reyes de <br className="hidden lg:block" />
              Europa
            </span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-300">
            {uclHistory.length} European Cups, lifted in {uclSites.length}{" "}
            cities — from {FIRST_TITLE.city} in {FIRST_TITLE.year} to{" "}
            {LAST_TITLE.city} in {LAST_TITLE.year}. Choose a city on the map or
            a year on the timeline to relive that night.
          </p>
          <button
            type="button"
            onClick={startFromTheBeginning}
            className="group/cta mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 text-sm font-semibold text-midnight-950 shadow-[0_0_26px_-8px_rgba(212,175,55,0.95)] outline-none transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-[#F6ECC4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06080d] motion-reduce:hover:scale-100"
          >
            Start in {FIRST_TITLE.city}, {FIRST_TITLE.year}
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5"
            />
          </button>
        </div>

        {/* The map. Its box matches the active preset's viewBox (EuropeMap). */}
        <div className="relative mt-1 aspect-[400/430] sm:aspect-[800/520] lg:absolute lg:inset-0 lg:mt-0 lg:aspect-auto">
          <MapBoundary>
            <EuropeMap
              titles={uclHistory}
              sites={uclSites}
              activeLocation={activeLocation}
              highlightedCity={highlightedCity}
              paused={sheetOpen}
              onSelectSite={selectSite}
              onHighlightCity={setHighlightedCity}
              onDismiss={close}
            />
          </MapBoundary>
        </div>

        <TimelineRail
          titles={uclHistory}
          activeYear={activeLocation?.year ?? null}
          highlightedCity={highlightedCity}
          onSelect={select}
          onHighlightCity={setHighlightedCity}
          className="relative z-20 lg:absolute lg:inset-x-0 lg:bottom-0"
        />

        {/* Without JavaScript there is no map — the roll of honour still reads. */}
        <noscript>
          <ol className="relative z-20 grid gap-x-8 gap-y-1.5 px-6 pb-8 text-sm text-zinc-300 sm:grid-cols-2 sm:px-8 lg:absolute lg:left-10 lg:top-10 lg:w-[34rem] lg:p-0">
            {uclHistory.map((title) => (
              <li key={title.year}>
                <span className="font-mono text-[#D4AF37]">{title.year}</span>{" "}
                {title.city} — {title.opponent}, {title.score}
              </li>
            ))}
          </ol>
        </noscript>

        {/* Desktop: the floating card. */}
        <AnimatePresence>
          {cardOpen ? (
            <motion.aside
              key="title-card"
              ref={cardRef}
              tabIndex={-1}
              aria-labelledby={detailHeadingId}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 64 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x: reduceMotion ? 0 : 36,
                transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              // The column only centres the card; clicks beside it still reach
              // the map underneath.
              className="pointer-events-none absolute bottom-[5.75rem] right-7 top-7 z-30 flex w-[21.5rem] items-center outline-none xl:w-[24rem]"
            >
              <div className="glass-panel edge-gold pointer-events-auto relative flex max-h-full w-full flex-col overflow-hidden rounded-[26px] shadow-[0_34px_80px_-28px_rgba(0,0,0,0.9)]">
                <CloseButton onClick={closeCard} />
                <div className="overflow-y-auto overscroll-contain pb-3">
                  {detail}
                </div>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Below `lg`: the same detail in a bottom sheet. */}
      <TitleSheet
        open={sheetOpen}
        onClose={close}
        labelledBy={detailHeadingId}
        className={regal.variable}
      >
        {detail}
      </TitleSheet>

      <p role="status" className="sr-only">
        {activeLocation ? announce(activeLocation) : ""}
      </p>
    </section>
  );
}
