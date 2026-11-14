"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, X } from "lucide-react";
import {
  campaignImages,
  describeScoreNote,
  parseScore,
  splitRoute,
  type CampaignSource,
  type UclCampaignSummary,
} from "@/lib/ucl-campaigns";
import CampaignHistory from "./CampaignHistory";
import {
  GalleryBanner,
  GalleryLightbox,
  GalleryThumbs,
  useLoadablePhotos,
  type PhotoPosition,
} from "./CampaignGallery";

// The deep dive on one campaign: its photo gallery, the headline facts, the
// road to the final, and the long-form history. Rendered inside the glass
// sidebar on desktop and the bottom sheet on smaller screens — the two shells
// differ, the content doesn't. Each shell supplies the scrolling container,
// the close button and the stepper (exported below) so those stay put while
// this scrolls.

const ROMAN_NUMERALS: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

// Kings are numbered in Roman numerals; so are these.
function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) return String(value);
  let rest = value;
  let numeral = "";
  for (const [amount, glyph] of ROMAN_NUMERALS) {
    while (rest >= amount) {
      numeral += glyph;
      rest -= amount;
    }
  }
  return numeral;
}

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e16]";

export interface CampaignPanelProps {
  campaign: UclCampaignSummary;
  /** 1-based place in the roll of honour (La Décima is 10). */
  number: number;
  total: number;
  /** Other campaigns won in the same city. */
  siblings: readonly UclCampaignSummary[];
  /** id for the heading, so the surrounding shell can label itself with it. */
  headingId: string;
  variant: "sidebar" | "sheet";
  source: CampaignSource;
  onSelect: (campaign: UclCampaignSummary) => void;
}

export default function CampaignPanel(props: CampaignPanelProps) {
  const { campaign, onSelect } = props;
  const reduceMotion = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);

  // Jumping to a sibling removes the very button that was pressed (it names
  // the campaign now on show), so park focus on the panel instead of letting
  // it drop back to <body>.
  const selectSibling = (sibling: UclCampaignSummary) => {
    onSelect(sibling);
    rootRef.current?.focus();
  };

  return (
    <div ref={rootRef} tabIndex={-1} className="relative outline-none">
      <AnimatePresence mode="wait" initial={false}>
        {/* Keyed by campaign: the body below is a fresh instance each time, so
            its gallery starts again at the cover photo. */}
        <motion.div
          key={campaign.id}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <PanelBody {...props} onSelectSibling={selectSibling} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PanelBody({
  campaign,
  number,
  total,
  siblings,
  headingId,
  variant,
  source,
  onSelectSibling,
}: CampaignPanelProps & {
  onSelectSibling: (campaign: UclCampaignSummary) => void;
}) {
  const isSheet = variant === "sheet";
  const score = parseScore(campaign.score);
  const numeral = toRoman(number);
  const rounds = splitRoute(campaign.route);
  const gutter = isSheet ? "px-6 sm:px-8" : "px-7";

  // --- Gallery --------------------------------------------------------------
  // One position, shared by the banner, the thumbnails and the full-screen
  // viewer, so stepping in any of them moves all three.
  const uploaded = useMemo(() => campaignImages(campaign), [campaign]);
  const images = useLoadablePhotos(uploaded);
  const [place, setPosition] = useState<PhotoPosition>({
    index: 0,
    direction: 0,
  });
  // The list gets shorter if a photo turns out not to load.
  const position: PhotoPosition = {
    index: Math.min(place.index, Math.max(0, images.length - 1)),
    direction: place.direction,
  };
  const [viewerOpen, setViewerOpen] = useState(false);

  const stepPhoto = (delta: -1 | 1) =>
    setPosition({
      index: (position.index + delta + images.length) % images.length,
      direction: delta,
    });
  const showPhoto = (index: number) => {
    if (index === position.index) return;
    setPosition({ index, direction: index > position.index ? 1 : -1 });
  };

  const scene = `Real Madrid at the ${campaign.year} final in ${campaign.city}`;
  const describePhoto = (index: number) =>
    images.length > 1
      ? `Photo ${index + 1} of ${images.length}: ${scene}`
      : scene;

  return (
    <>
      {/* Hero: the photo carousel, or the numeral plate until photos exist. */}
      <div className={`relative ${isSheet ? "h-52 sm:h-64" : "h-60"}`}>
        <GalleryBanner
          images={images}
          position={position}
          describe={describePhoto}
          sizes={isSheet ? "(min-width: 36rem) 36rem, 100vw" : "28rem"}
          plate={
            <Plate
              numeral={numeral}
              sizeClass={isSheet ? "text-[9rem] sm:text-[11rem]" : "text-[9.5rem]"}
            />
          }
          onStep={stepPhoto}
          onOpen={() => setViewerOpen(true)}
        />
        <p className="pointer-events-none absolute left-7 top-6 font-mono text-[10px] uppercase tracking-[0.34em] text-[#F1DD96] [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
          <span aria-hidden>
            {numeral}
            <span className="px-1.5 text-white/35">/</span>
            {toRoman(total)}
          </span>
          <span className="sr-only">
            Title {number} of {total}
          </span>
        </p>
      </div>

      {/* flow-root, so the headline's negative margin lifts the headline alone
          and this box still starts where the photo ends. */}
      <div className={`relative flow-root ${gutter}`}>
        {/* The year rides up over the photo, but must not swallow the taps
            and swipes meant for it. */}
        <h3 id={headingId} className="pointer-events-none -mt-[4.25rem]">
          {/* pr gives the italic's overhang room inside the gradient clip. */}
          <span
            className={`text-gradient-gold inline-block pr-[0.14em] font-regal italic leading-[0.88] ${
              isSheet ? "text-[5rem] sm:text-[6rem]" : "text-[5.75rem]"
            }`}
          >
            {campaign.year}
          </span>{" "}
          <span className="pointer-events-auto mt-2.5 block font-regal text-[2rem] italic leading-[1.08] text-white">
            {campaign.title}
          </span>
        </h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <p className="inline-flex items-center gap-1.5 font-regal text-[1.4rem] italic leading-none text-[#F1DD96]">
            <MapPin aria-hidden className="h-4 w-4 shrink-0 text-[#D4AF37]" />
            {campaign.city}
          </p>
          {siblings.length > 0 ? (
            <p className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-400">
              <span aria-hidden className="text-white/25">
                ·
              </span>
              <span>also</span>
              {siblings.map((sibling) => (
                <button
                  key={sibling.id}
                  type="button"
                  onClick={() => onSelectSibling(sibling)}
                  aria-label={`Also won in ${campaign.city}: ${sibling.year}, ${sibling.title}`}
                  className={`rounded-full border border-white/15 px-2.5 py-1.5 tabular-nums tracking-[0.12em] text-zinc-200 transition-colors hover:border-[#D4AF37]/70 hover:text-[#F1DD96] ${FOCUS_RING}`}
                >
                  {sibling.year}
                </button>
              ))}
            </p>
          ) : null}
        </div>

        {images.length > 1 ? (
          <GalleryThumbs
            images={images}
            index={position.index}
            onSelect={showPhoto}
            className="-mx-1 mt-5"
          />
        ) : null}

        {/* The final */}
        <section className="mt-7">
          <SectionLabel>The final</SectionLabel>
          {score ? (
            <>
              <dl className="mt-3 space-y-1">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-base font-semibold text-white">
                    Real Madrid
                  </dt>
                  <dd className="font-display text-[1.75rem] font-extrabold leading-none tabular-nums text-white">
                    {score.madrid}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-base text-zinc-400">{campaign.opponent}</dt>
                  <dd className="font-display text-[1.75rem] font-bold leading-none tabular-nums text-zinc-500">
                    {score.opponent}
                  </dd>
                </div>
              </dl>
              {score.note ? (
                <p className="mt-2.5 text-sm text-[#F1DD96]">
                  {describeScoreNote(score.note)}
                </p>
              ) : null}
            </>
          ) : (
            // Scores are free text in the CMS — print an unusual one as written.
            <p className="mt-3 text-base text-zinc-200">
              Real Madrid {campaign.score} {campaign.opponent}
            </p>
          )}
        </section>

        {campaign.heroes ? (
          <section className="mt-7">
            <SectionLabel>Heroes</SectionLabel>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-zinc-200">
              {campaign.heroes}
            </p>
          </section>
        ) : null}

        {rounds.length > 0 ? (
          <section className="mt-7">
            <SectionLabel>Road to the final</SectionLabel>
            <ol className="mt-4 space-y-3.5 border-l border-white/10 pl-5">
              {rounds.map((round, index) => (
                <RouteStep key={`${index}-${round}`} text={round} />
              ))}
              <RouteStep
                final
                text={`Final: ${campaign.opponent}, ${
                  score
                    ? `${score.madrid}–${score.opponent}${
                        score.note
                          ? ` (${describeScoreNote(score.note).toLowerCase()})`
                          : ""
                      }`
                    : campaign.score
                }`}
              />
            </ol>
          </section>
        ) : null}

        {/* The long read */}
        <section className="mt-8 border-t border-white/[0.08] pb-2 pt-7">
          <SectionLabel>The story</SectionLabel>
          <div className="mt-4">
            <CampaignHistory campaign={campaign} source={source} />
          </div>
        </section>
      </div>

      <GalleryLightbox
        open={viewerOpen && images.length > 0}
        images={images}
        position={position}
        caption={`${campaign.year} · ${campaign.title} · ${campaign.city}`}
        describe={describePhoto}
        onStep={stepPhoto}
        onSelect={showPhoto}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

// --- Shell controls ---------------------------------------------------------

/** The shells' close control — above the scrolling content, so it stays put. */
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={`absolute right-3.5 top-3.5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-zinc-200 backdrop-blur-md transition-colors hover:border-[#D4AF37]/70 hover:text-white ${FOCUS_RING}`}
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
  );
}

/**
 * Previous / next campaign. Lives in the shell's footer, outside the content
 * that swaps, so the buttons keep keyboard focus from one campaign to the next.
 */
export function CampaignStepper({
  previous,
  next,
  onSelect,
  className = "",
}: {
  previous: UclCampaignSummary | null;
  next: UclCampaignSummary | null;
  onSelect: (campaign: UclCampaignSummary) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between border-t border-white/[0.08] bg-black/25 ${className}`}
    >
      <StepButton direction="previous" target={previous} onSelect={onSelect} />
      <StepButton direction="next" target={next} onSelect={onSelect} />
    </div>
  );
}

function StepButton({
  direction,
  target,
  onSelect,
}: {
  direction: "previous" | "next";
  target: UclCampaignSummary | null;
  onSelect: (campaign: UclCampaignSummary) => void;
}) {
  // Keeps the other button anchored to its side at either end of the timeline.
  if (!target) return <span aria-hidden className="h-11" />;

  const isNext = direction === "next";
  return (
    <button
      type="button"
      onClick={() => onSelect(target)}
      aria-label={`${isNext ? "Next" : "Previous"} title: ${target.year}, ${target.title}`}
      className={`group/step inline-flex h-11 items-center gap-2 rounded-full px-3.5 font-mono text-[11px] tabular-nums tracking-[0.16em] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-[#F1DD96] ${FOCUS_RING}`}
    >
      {isNext ? null : (
        <ArrowLeft
          aria-hidden
          className="h-3.5 w-3.5 transition-transform group-hover/step:-translate-x-0.5"
        />
      )}
      {target.year}
      {isNext ? (
        <ArrowRight
          aria-hidden
          className="h-3.5 w-3.5 transition-transform group-hover/step:translate-x-0.5"
        />
      ) : null}
    </button>
  );
}

// --- Pieces -----------------------------------------------------------------

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-[#D4AF37]">
      {children}
    </h4>
  );
}

// One round on the road to the final. `route` lines read "Round: detail"; the
// round is set apart when that shape is there, and the line is shown whole
// when it isn't.
function RouteStep({ text, final = false }: { text: string; final?: boolean }) {
  const colon = text.indexOf(":");
  const round = colon > 0 ? text.slice(0, colon).trim() : null;
  const detail = colon > 0 ? text.slice(colon + 1).trim() : text;

  return (
    <li className="relative text-[14.5px] leading-snug">
      <span
        aria-hidden
        className={`absolute -left-[calc(1.25rem+3.5px)] top-[0.5em] h-1.5 w-1.5 rounded-full ${
          final
            ? "bg-[#FFF4CC] shadow-[0_0_10px_2px_rgba(212,175,55,0.8)]"
            : "bg-[#D4AF37]/70"
        }`}
      />
      {round ? (
        <span
          className={`block font-mono text-[10px] uppercase tracking-[0.22em] ${
            final ? "text-[#F1DD96]" : "text-zinc-500"
          }`}
        >
          {round}
        </span>
      ) : null}
      <span className={`mt-1 block ${final ? "font-semibold text-white" : "text-zinc-200"}`}>
        {detail}
      </span>
    </li>
  );
}

// What stands behind the photos, and in for them until some are uploaded: a
// floodlit plate engraved with the title's regnal numeral.
function Plate({
  numeral,
  sizeClass,
}: {
  numeral: string;
  sizeClass: string;
}) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#0a0d15]">
      <div className="absolute inset-0 bg-[radial-gradient(95%_130%_at_8%_-20%,rgba(212,175,55,0.36),transparent_60%),radial-gradient(75%_95%_at_105%_115%,rgba(44,63,143,0.55),transparent_64%)]" />
      {/* right-16 keeps the last stroke clear of the shell's close button. */}
      <span
        className={`absolute right-16 top-[44%] -translate-y-1/2 select-none whitespace-nowrap font-regal italic leading-none text-[#D4AF37]/[0.07] [-webkit-text-stroke:1px_rgba(212,175,55,0.45)] ${sizeClass}`}
      >
        {numeral}
      </span>
    </div>
  );
}
