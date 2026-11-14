"use client";

import {
  Component,
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
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
  groupCampaignsByCity,
  parseScore,
  siteKey,
  type CampaignSite,
  type CampaignSource,
  type UclCampaignSummary,
} from "@/lib/ucl-campaigns";
import { MQ_LG, useMediaQuery } from "./hooks";
import TimelineRail from "./TimelineRail";
import CampaignPanel, { CampaignStepper, CloseButton } from "./CampaignPanel";
import CampaignSheet from "./CampaignSheet";

// "Reyes de Europa" — every European Cup Real Madrid have won, on a globe.
//
// The campaigns come from the `ucl_campaigns` table (edited at
// /admin/ucl-history) and arrive as props from the Fans Zone page; only the
// long-form history of the campaign being read is fetched here, on demand.
//
// Two pieces of state drive everything. `journey` is where the visitor is and
// where they just were — the flight path runs between the two. `panelOpen` is
// whether the deep dive for the current stop is showing: a glass sidebar from
// `lg` up, a bottom sheet below that.
//
// The stage is always dark, in both themes, like the site's other cinematic
// surfaces.

// Ibarra Real Nova revives the type cut in Madrid for Joaquín Ibarra, printer
// to the Spanish crown — a royal Madrid face for a royal Madrid club. Italic
// only: it is used for the titles, the years and the history's headings.
const regal = Ibarra_Real_Nova({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-ibarra",
  display: "swap",
});

// Client-only: see the note at the top of CampaignGlobe.tsx.
const CampaignGlobe = dynamic(() => import("./CampaignGlobe"), {
  ssr: false,
  loading: () => null,
});

// If the globe can't run (no WebGL, a dropped chunk), the stage simply stays
// dark: the timeline, the panel and the sheet don't depend on it.
class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface Journey {
  currentId: string | null;
  previousId: string | null;
}

// One line for screen readers each time the selection changes.
function announce(campaign: UclCampaignSummary): string {
  const score = parseScore(campaign.score);
  const result = score
    ? `Real Madrid ${score.madrid}, ${campaign.opponent} ${score.opponent}${
        score.note ? `, ${describeScoreNote(score.note).toLowerCase()}` : ""
      }`
    : `Real Madrid ${campaign.score} ${campaign.opponent}`;
  return `${campaign.year}, ${campaign.city}. ${campaign.title}. ${result}.`;
}

export default function ReyesDeEuropa({
  campaigns,
  source,
}: {
  campaigns: readonly UclCampaignSummary[];
  /** "fallback" when the table couldn't be read and the built-in copy is shown. */
  source: CampaignSource;
}) {
  // Ids, not objects: the campaigns are props and can be refreshed under us.
  const [journey, setJourney] = useState<Journey>({
    currentId: null,
    previousId: null,
  });
  const [panelOpen, setPanelOpen] = useState(false);
  // Linked hover between the globe and the timeline.
  const [highlightedSite, setHighlightedSite] = useState<string | null>(null);

  const isDesktop = useMediaQuery(MQ_LG);
  const reduceMotion = useReducedMotion() ?? false;

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sidebarSlotRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  // How much of the stage's right-hand side the story column covers, in px.
  const [panelInset, setPanelInset] = useState(0);
  // Set when the sidebar is opened from a control that the sidebar then covers.
  const focusSidebarOnOpen = useRef(false);

  const headingId = useId();
  const detailHeadingId = useId();

  const titles = useMemo(
    () => [...campaigns].sort((a, b) => a.year - b.year),
    [campaigns]
  );
  const sites = useMemo(() => groupCampaignsByCity(titles), [titles]);

  const find = (id: string | null) =>
    id === null ? null : (titles.find((campaign) => campaign.id === id) ?? null);
  const currentLocation = find(journey.currentId);
  const previousLocation = find(journey.previousId);
  const activeCampaign = panelOpen ? currentLocation : null;

  // Travel to a campaign and open its panel. Revisiting the current stop only
  // reopens the panel — it is not a new leg of the journey.
  const visit = useCallback((next: UclCampaignSummary) => {
    setJourney((journeySoFar) =>
      journeySoFar.currentId === next.id
        ? journeySoFar
        : { currentId: next.id, previousId: journeySoFar.currentId }
    );
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  // A beacon stands for a city, and a city can hold several titles. The first
  // click opens the oldest; clicking the same city again steps to its next.
  const selectSite = (site: CampaignSite) => {
    const here =
      activeCampaign && siteKey(activeCampaign.city) === site.key
        ? site.campaigns.findIndex((c) => c.id === activeCampaign.id)
        : -1;
    visit(site.campaigns[(here + 1) % site.campaigns.length]);
  };

  const sidebarOpen = isDesktop && activeCampaign !== null;
  const sheetOpen = !isDesktop && activeCampaign !== null;
  const activeId = activeCampaign?.id ?? null;
  const activeYear = activeCampaign?.year;

  // Desktop sidebar. If the keyboard was inside it when it closes, send focus
  // back to that campaign's year on the timeline rather than to <body>.
  const closeSidebar = () => {
    const sidebar = sidebarRef.current;
    const focusWasInside =
      sidebar !== null && sidebar.contains(document.activeElement);
    setPanelOpen(false);
    if (focusWasInside && activeYear !== undefined) {
      sectionRef.current
        ?.querySelector<HTMLButtonElement>(`[data-year="${activeYear}"]`)
        ?.focus();
    }
  };

  // Escape closes the sidebar. An Effect Event, so the listener always sees
  // the latest campaign without being re-attached every time it changes.
  const closeOnEscape = useEffectEvent(closeSidebar);
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOnEscape();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  // The intro's button is hidden behind the sidebar it opens, so take the
  // keyboard along with it.
  useEffect(() => {
    if (sidebarOpen && focusSidebarOnOpen.current) {
      focusSidebarOnOpen.current = false;
      sidebarRef.current?.focus({ preventScroll: true });
    }
  }, [sidebarOpen]);

  // A new campaign starts at its photo, not wherever the last one was left.
  useEffect(() => {
    sidebarScrollRef.current?.scrollTo({ top: 0 });
  }, [activeId]);

  // Measure the sidebar's footprint from an invisible stand-in that shares its
  // classes, so the figure is right at every breakpoint and font size without
  // the sidebar having to be open. The globe is centred in what remains.
  useEffect(() => {
    const stage = stageRef.current;
    const slot = sidebarSlotRef.current;
    if (!stage || !slot) return;

    const measure = () =>
      setPanelInset(
        // offsetParent is null while the slot is display: none (below `lg`).
        slot.offsetParent === null ? 0 : stage.clientWidth - slot.offsetLeft
      );
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  if (titles.length === 0) return null;

  const firstTitle = titles[0];
  const lastTitle = titles[titles.length - 1];

  const startFromTheBeginning = () => {
    focusSidebarOnOpen.current = isDesktop;
    visit(firstTitle);
  };

  const activeIndex = activeCampaign ? titles.indexOf(activeCampaign) : -1;
  const previousTitle = activeIndex > 0 ? titles[activeIndex - 1] : null;
  const nextTitle =
    activeIndex >= 0 && activeIndex < titles.length - 1
      ? titles[activeIndex + 1]
      : null;

  const panel = activeCampaign ? (
    <CampaignPanel
      campaign={activeCampaign}
      number={activeIndex + 1}
      total={titles.length}
      siblings={titles.filter(
        (campaign) =>
          campaign.id !== activeCampaign.id &&
          siteKey(campaign.city) === siteKey(activeCampaign.city)
      )}
      headingId={detailHeadingId}
      variant={isDesktop ? "sidebar" : "sheet"}
      source={source}
      onSelect={visit}
    />
  ) : null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={`${regal.variable} relative`}
    >
      <div
        ref={stageRef}
        data-active={sidebarOpen}
        className="group/stage relative isolate overflow-hidden rounded-[28px] bg-[#06080d] text-zinc-100 shadow-[0_40px_90px_-50px_rgba(6,11,34,0.75)] ring-1 ring-white/[0.08] lg:h-[680px] xl:h-[720px]"
      >
        {/* Stand-in for the sidebar — same box, never visible. See the
            measuring effect above; keep these classes in step with it. */}
        <div
          ref={sidebarSlotRef}
          aria-hidden
          className="pointer-events-none invisible absolute bottom-[5.75rem] right-5 top-5 hidden w-[25rem] lg:block xl:w-[28rem]"
        />
        {/* Atmosphere: a low gold glow behind the globe. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_62%,rgba(212,175,55,0.09),transparent_70%)] lg:bg-[radial-gradient(42%_60%_at_33%_50%,rgba(212,175,55,0.1),transparent_72%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 z-30 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"
        />

        {/* Intro. In flow above the globe on small screens; from `lg` it holds
            the story column on the right until a campaign's sidebar takes its
            place. */}
        <div
          inert={sidebarOpen}
          className="relative z-20 px-6 pt-8 sm:px-8 sm:pt-10 lg:absolute lg:right-8 lg:top-[calc(50%-2.5rem)] lg:w-[20.5rem] lg:-translate-y-1/2 lg:p-0 lg:transition-opacity lg:duration-300 lg:group-data-[active=true]/stage:opacity-0 xl:right-10 xl:w-[22rem]"
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-[#D4AF37]">
            Kings of Europe
            <span aria-hidden className="px-2 text-white/30">
              ·
            </span>
            {firstTitle.year}–{lastTitle.year}
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
            {titles.length} European Cups, lifted in {sites.length} cities —
            from {firstTitle.city} in {firstTitle.year} to {lastTitle.city} in{" "}
            {lastTitle.year}. Choose a city on the globe or a year on the
            timeline to read the story of that campaign.
          </p>
          <button
            type="button"
            onClick={startFromTheBeginning}
            className="group/cta mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 text-sm font-semibold text-midnight-950 shadow-[0_0_26px_-8px_rgba(212,175,55,0.95)] outline-none transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-[#F6ECC4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06080d] motion-reduce:hover:scale-100"
          >
            Start in {firstTitle.city}, {firstTitle.year}
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5"
            />
          </button>
        </div>

        {/* The globe. */}
        <div className="relative mt-2 aspect-square w-full sm:aspect-[16/11] lg:absolute lg:inset-0 lg:mt-0 lg:aspect-auto">
          <GlobeBoundary>
            <CampaignGlobe
              sites={sites}
              activeCampaign={activeCampaign}
              previousLocation={previousLocation}
              currentLocation={currentLocation}
              highlightedSite={highlightedSite}
              panelInset={panelInset}
              paused={sheetOpen}
              onSelectSite={selectSite}
              onHighlightSite={setHighlightedSite}
            />
          </GlobeBoundary>
        </div>

        {/* Scrims over the globe: a clean floor for the timeline, and on
            desktop a quiet right-hand side for the story column. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#06080d] via-[#06080d]/80 to-transparent lg:h-44" />
          <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-[linear-gradient(to_left,#06080d_0%,rgba(6,8,13,0.82)_38%,transparent_100%)] lg:block" />
        </div>

        <TimelineRail
          titles={titles}
          activeYear={activeCampaign?.year ?? null}
          highlightedSite={highlightedSite}
          onSelect={visit}
          onHighlightSite={setHighlightedSite}
          className="relative z-20 lg:absolute lg:inset-x-0 lg:bottom-0"
        />

        {/* Without JavaScript there is no globe — the roll of honour still reads. */}
        <noscript>
          <ol className="relative z-20 grid gap-x-8 gap-y-1.5 px-6 pb-8 text-sm text-zinc-300 sm:grid-cols-2 sm:px-8 lg:absolute lg:left-10 lg:top-10 lg:w-[34rem] lg:p-0">
            {titles.map((campaign) => (
              <li key={campaign.id}>
                <span className="font-mono text-[#D4AF37]">{campaign.year}</span>{" "}
                {campaign.city} — {campaign.opponent}, {campaign.score}
              </li>
            ))}
          </ol>
        </noscript>

        {/* Desktop: the glass sidebar. */}
        <AnimatePresence>
          {sidebarOpen ? (
            <motion.aside
              key="campaign-sidebar"
              ref={sidebarRef}
              tabIndex={-1}
              aria-labelledby={detailHeadingId}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 72 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x: reduceMotion ? 0 : 40,
                transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-[5.75rem] right-5 top-5 z-30 w-[25rem] outline-none xl:w-[28rem]"
            >
              <div className="glass-panel edge-gold relative flex h-full flex-col overflow-hidden rounded-[26px] shadow-[0_34px_80px_-28px_rgba(0,0,0,0.9)]">
                <CloseButton onClick={closeSidebar} />
                <div
                  ref={sidebarScrollRef}
                  className="scroll-gold min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6"
                >
                  {panel}
                </div>
                <CampaignStepper
                  previous={previousTitle}
                  next={nextTitle}
                  onSelect={visit}
                  className="px-3 py-1.5"
                />
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Below `lg`: the same panel in a bottom sheet. */}
      <CampaignSheet
        open={sheetOpen}
        onClose={closePanel}
        labelledBy={detailHeadingId}
        contentKey={activeId}
        className={regal.variable}
        footer={
          <CampaignStepper
            previous={previousTitle}
            next={nextTitle}
            onSelect={visit}
            className="px-3 py-1.5 sm:px-5"
          />
        }
      >
        {panel}
      </CampaignSheet>

      <p role="status" className="sr-only">
        {activeCampaign ? announce(activeCampaign) : ""}
      </p>
    </section>
  );
}
