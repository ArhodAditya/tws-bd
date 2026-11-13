"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, X } from "lucide-react";
import {
  describeScoreNote,
  parseScore,
  type UclTitle,
} from "@/lib/ucl-history";

// The story of one final: photo, year, scoreline and the paragraph that goes
// with it. Rendered inside the floating card on desktop and inside the bottom
// sheet on smaller screens — the two shells differ, the content doesn't.

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

export interface TitleDetailProps {
  title: UclTitle;
  /** 1-based place in the roll of honour (La Décima is 10). */
  number: number;
  total: number;
  /** Other titles won in the same city. */
  siblings: readonly UclTitle[];
  previous: UclTitle | null;
  next: UclTitle | null;
  /** id for the heading, so the surrounding shell can label itself with it. */
  headingId: string;
  variant: "card" | "sheet";
  onSelect: (title: UclTitle) => void;
}

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e16]";

/**
 * The shells' close control. It sits in the shell, above the scrolling
 * content, so it stays put however far the story is scrolled.
 */
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

export default function TitleDetail({
  title,
  number,
  total,
  siblings,
  previous,
  next,
  headingId,
  variant,
  onSelect,
}: TitleDetailProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const isSheet = variant === "sheet";
  const score = parseScore(title.score);
  const numeral = toRoman(number);

  // Jumping to a sibling title removes the very button that was pressed (it
  // names the title now on show), so park focus on the panel instead of
  // letting it drop back to <body>.
  const selectSibling = (sibling: UclTitle) => {
    onSelect(sibling);
    rootRef.current?.focus();
  };

  return (
    <div ref={rootRef} tabIndex={-1} className="relative outline-none">
      {/* The step buttons live outside the keyed block below, so they keep
          keyboard focus while the content swaps underneath them. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={title.year}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Photo. The mask dissolves it into the glass below, so there is no
              seam between the picture and the translucent panel. */}
          <div
            className={`relative ${
              isSheet ? "h-44 sm:h-56" : "h-[8.5rem] xl:h-[10.25rem]"
            }`}
          >
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_44%,transparent)]">
              <Plate
                numeral={numeral}
                sizeClass={
                  isSheet
                    ? "text-[8.25rem] sm:text-[10.5rem]"
                    : "text-[6rem] xl:text-[7.5rem]"
                }
              />
              <TitlePhoto
                src={title.imageSrc}
                alt={`Real Madrid at the ${title.year} final in ${title.city}`}
                sizes={isSheet ? "(min-width: 36rem) 36rem, 100vw" : "24rem"}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,10,16,0.6),transparent_58%)]"
              />
            </div>
            <p className="absolute left-6 top-5 font-mono text-[10px] uppercase tracking-[0.34em] text-[#F1DD96]">
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

          <div className={`relative -mt-[3.75rem] ${isSheet ? "px-6 sm:px-8" : "px-6"}`}>
            <h3 id={headingId}>
              {/* pr gives the italic's overhang room inside the gradient clip. */}
              <span
                className={`text-gradient-gold inline-block pr-[0.14em] font-regal italic leading-[0.88] ${
                  isSheet
                    ? "text-[5rem] sm:text-[6rem]"
                    : "text-[4.5rem] xl:text-[5.25rem]"
                }`}
              >
                {title.year}
              </span>{" "}
              <span className="mt-2.5 block font-regal text-[1.75rem] italic leading-[1.1] text-white">
                {title.title}
              </span>
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-zinc-400">
              <MapPin className="h-3 w-3 text-[#D4AF37]" aria-hidden />
              <span>{title.city}</span>
              {siblings.length > 0 ? (
                <>
                  <span aria-hidden className="text-white/25">
                    ·
                  </span>
                  <span>also</span>
                  {siblings.map((sibling) => (
                    <button
                      key={sibling.year}
                      type="button"
                      onClick={() => selectSibling(sibling)}
                      aria-label={`Also won in ${title.city}: ${sibling.year}, ${sibling.title}`}
                      className={`-my-1.5 rounded-full border border-white/15 px-2.5 py-1.5 tabular-nums tracking-[0.12em] text-zinc-200 transition-colors hover:border-[#D4AF37]/70 hover:text-[#F1DD96] ${FOCUS_RING}`}
                    >
                      {sibling.year}
                    </button>
                  ))}
                </>
              ) : null}
            </div>

            {score ? (
              <>
                <dl className="mt-5 space-y-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[15px] font-semibold text-white">
                      Real Madrid
                    </dt>
                    <dd className="font-display text-[1.6rem] font-extrabold leading-none tabular-nums text-white">
                      {score.madrid}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[15px] text-zinc-400">{title.opponent}</dt>
                    <dd className="font-display text-[1.6rem] font-bold leading-none tabular-nums text-zinc-500">
                      {score.opponent}
                    </dd>
                  </div>
                </dl>
                {score.note ? (
                  <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-[#D4AF37]">
                    {describeScoreNote(score.note)}
                  </p>
                ) : null}
              </>
            ) : (
              // Unrecognised score format — print it as written.
              <p className="mt-5 text-[15px] text-zinc-200">
                Real Madrid {title.score} {title.opponent}
              </p>
            )}

            <p className="mt-4 border-t border-white/[0.08] pt-4 text-[14.5px] leading-[1.62] text-zinc-300">
              {title.story}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div
        className={`flex items-center justify-between ${
          isSheet ? "mt-4 px-3 sm:px-5" : "mt-2 px-3 xl:mt-4"
        }`}
      >
        <StepButton direction="previous" target={previous} onSelect={onSelect} />
        <StepButton direction="next" target={next} onSelect={onSelect} />
      </div>
    </div>
  );
}

// --- Step buttons -----------------------------------------------------------

function StepButton({
  direction,
  target,
  onSelect,
}: {
  direction: "previous" | "next";
  target: UclTitle | null;
  onSelect: (title: UclTitle) => void;
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

// --- Photo ------------------------------------------------------------------

// Photos that failed to load this session. Remembered so reopening a title
// doesn't re-request a file that isn't there.
const missingPhotos = new Set<string>();

// The photo cross-fades in over the plate once it has loaded, and simply never
// appears if it can't — so a missing or slow image is never a broken one.
function TitlePhoto({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "missing">(() =>
    missingPhotos.has(src) ? "missing" : "loading"
  );

  if (status === "missing") return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      onLoad={() => setStatus("loaded")}
      onError={() => {
        missingPhotos.add(src);
        setStatus("missing");
      }}
      className={`object-cover saturate-[0.85] transition-opacity duration-700 ${
        status === "loaded" ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

// What stands behind the photo, and in for it: a floodlit plate engraved with
// the title's regnal numeral.
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
        className={`absolute right-16 top-[46%] -translate-y-1/2 select-none whitespace-nowrap font-regal italic leading-none text-[#D4AF37]/[0.07] [-webkit-text-stroke:1px_rgba(212,175,55,0.45)] ${sizeClass}`}
      >
        {numeral}
      </span>
    </div>
  );
}
