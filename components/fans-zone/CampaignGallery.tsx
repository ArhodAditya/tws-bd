"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  X,
} from "lucide-react";

// The photo gallery of one campaign, in three parts that share one position:
//
//   GalleryBanner   — the carousel at the top of the panel (arrows, swipe)
//   GalleryThumbs   — the strip of thumbnails beneath the headline
//   GalleryLightbox — the full-screen viewer a photo opens into
//
// The panel owns the position and hands it to all three, so stepping in any
// one of them moves the others.

/** Which photo is showing, and which way the last move went (-1, 0 or 1). */
export interface PhotoPosition {
  index: number;
  direction: number;
}

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black";

// A swipe counts once it has gone this far, or is travelling this fast.
const SWIPE_DISTANCE_PX = 50;
const SWIPE_VELOCITY = 400;

function swipeStep(info: PanInfo): -1 | 0 | 1 {
  if (info.offset.x < -SWIPE_DISTANCE_PX || info.velocity.x < -SWIPE_VELOCITY) return 1;
  if (info.offset.x > SWIPE_DISTANCE_PX || info.velocity.x > SWIPE_VELOCITY) return -1;
  return 0;
}

// The photos are both swipeable and tappable, and framer-motion reports a tap
// whenever a press ends on the element it began on — the end of a swipe
// included. So a tap is checked here: a press that ends where it started.
const TAP_SLOP_PX = 8;

interface PagePoint {
  x: number;
  y: number;
}

const endedWhereItBegan = (from: PagePoint | null, to: PagePoint) =>
  from !== null && Math.hypot(to.x - from.x, to.y - from.y) <= TAP_SLOP_PX;

// Photos slide in from the side they were asked for; with reduced motion they
// cross-fade in place.
const slide = {
  enter: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};
const fade = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};
const SLIDE_TRANSITION = { duration: 0.34, ease: [0.22, 1, 0.36, 1] } as const;

// --- Photos that won't load -------------------------------------------------
// A photo whose file has gone (deleted from the image host, a mistyped URL)
// is dropped from the gallery for the rest of the visit: no empty slide, no
// blank thumbnail, and a count that matches what can actually be seen. The
// list is kept outside React so every part of the gallery, and every campaign
// opened later, agrees on it.

let missingPhotos: ReadonlySet<string> = new Set();
const NONE_MISSING: ReadonlySet<string> = new Set();
const missingListeners = new Set<() => void>();

function reportMissing(src: string) {
  if (missingPhotos.has(src)) return;
  missingPhotos = new Set(missingPhotos).add(src);
  for (const notify of missingListeners) notify();
}

function subscribeToMissing(notify: () => void) {
  missingListeners.add(notify);
  return () => {
    missingListeners.delete(notify);
  };
}

/** A campaign's photos, minus any that have failed to load. */
export function useLoadablePhotos(all: readonly string[]): readonly string[] {
  const missing = useSyncExternalStore(
    subscribeToMissing,
    () => missingPhotos,
    () => NONE_MISSING
  );
  return useMemo(() => all.filter((src) => !missing.has(src)), [all, missing]);
}

// One photo. It fades in once it has loaded, so a slow image is never a
// half-painted one; whatever is behind it — the plate, the dark stage — shows
// until then.
function Photo({
  src,
  alt,
  sizes,
  fit,
}: {
  src: string;
  alt: string;
  sizes: string;
  fit: "cover" | "contain";
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => reportMissing(src)}
      className={`select-none transition-opacity duration-500 ${
        fit === "cover" ? "object-cover saturate-[0.92]" : "object-contain"
      } ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}

// --- Banner -----------------------------------------------------------------

export function GalleryBanner({
  images,
  position,
  describe,
  sizes,
  plate,
  onStep,
  onOpen,
}: {
  images: readonly string[];
  position: PhotoPosition;
  /** Alt text for the photo at an index. */
  describe: (index: number) => string;
  sizes: string;
  /** What stands behind the photo, and in for it when there is none. */
  plate: ReactNode;
  onStep: (delta: -1 | 1) => void;
  onOpen: () => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const pressedAt = useRef<PagePoint | null>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const many = images.length > 1;
  const src = images[position.index];

  return (
    <div className="absolute inset-0">
      {/* The mask dissolves the picture into the glass below, so there is no
          seam between the photo and the translucent panel. */}
      <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_48%,transparent)]">
        {plate}
        <AnimatePresence initial={false} custom={position.direction}>
          {src ? (
            <motion.div
              key={src}
              custom={position.direction}
              variants={reduceMotion ? fade : slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SLIDE_TRANSITION}
              drag={many ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const step = swipeStep(info);
                if (step !== 0) onStep(step);
              }}
              onPointerDown={(event) => {
                pressedAt.current = { x: event.pageX, y: event.pageY };
              }}
              // A tap opens the viewer; a swipe changes the photo instead.
              onTap={(_, info) => {
                if (!endedWhereItBegan(pressedAt.current, info.point)) return;
                // The viewer hands focus back to whatever had it. This slide
                // may be gone by then; the button will still be there.
                expandRef.current?.focus({ preventScroll: true });
                onOpen();
              }}
              // framer-motion would otherwise make anything tappable a tab
              // stop. The full-screen button is the keyboard's way in.
              tabIndex={-1}
              className="absolute inset-0 cursor-zoom-in outline-none"
            >
              <Photo
                src={src}
                alt={describe(position.index)}
                sizes={sizes}
                fit="cover"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(8,10,16,0.55),transparent_60%)]"
        />
      </div>

      {src ? (
        <>
          {many ? (
            <>
              <RoundButton
                label="Previous photo"
                onClick={() => onStep(-1)}
                className="absolute left-3 top-[42%] -translate-y-1/2"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
              </RoundButton>
              <RoundButton
                label="Next photo"
                onClick={() => onStep(1)}
                className="absolute right-3 top-[42%] -translate-y-1/2"
              >
                <ChevronRight aria-hidden className="h-4 w-4" />
              </RoundButton>
            </>
          ) : null}

          {/* Top right, beside the shell's close button (which sits in the
              corner itself): clear of the arrows at every banner height. */}
          <div className="absolute right-[3.875rem] top-4 flex items-center gap-2">
            {many ? (
              <span className="rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] tabular-nums tracking-[0.16em] text-zinc-100 backdrop-blur-md">
                <span className="sr-only">Photo </span>
                {position.index + 1}
                <span aria-hidden className="px-1 text-white/40">
                  /
                </span>
                <span className="sr-only"> of </span>
                {images.length}
              </span>
            ) : null}
            <RoundButton
              ref={expandRef}
              label="View this photo full screen"
              onClick={onOpen}
            >
              <Maximize2 aria-hidden className="h-3.5 w-3.5" />
            </RoundButton>
          </div>
        </>
      ) : null}
    </div>
  );
}

function RoundButton({
  ref,
  label,
  onClick,
  className = "",
  large = false,
  children,
}: {
  ref?: Ref<HTMLButtonElement>;
  label: string;
  onClick: () => void;
  className?: string;
  large?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full border border-white/15 bg-black/50 text-zinc-100 backdrop-blur-md transition-colors hover:border-[#D4AF37]/70 hover:text-[#F1DD96] ${
        large ? "h-12 w-12" : "h-9 w-9"
      } ${FOCUS_RING} ${className}`}
    >
      {children}
    </button>
  );
}

// --- Thumbnails -------------------------------------------------------------

export function GalleryThumbs({
  images,
  index,
  onSelect,
  className = "",
  size = "small",
}: {
  images: readonly string[];
  index: number;
  onSelect: (index: number) => void;
  className?: string;
  size?: "small" | "large";
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);

  // Keep the current thumbnail in view. Scrolls the strip itself, never the
  // panel or page around it.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const current = scroller?.children[index];
    if (!scroller || !(current instanceof HTMLElement)) return;
    const target =
      current.offsetLeft - (scroller.clientWidth - current.offsetWidth) / 2;
    scroller.scrollTo({ left: target, behavior: "smooth" });
  }, [index]);

  const box = size === "large" ? "h-14 w-20" : "h-12 w-[4.25rem]";

  return (
    <ul
      ref={scrollerRef}
      aria-label="Photos"
      className={`no-scrollbar relative flex gap-2 overflow-x-auto overscroll-x-contain p-1 ${className}`}
    >
      {images.map((src, i) => {
        const current = i === index;
        return (
          <li key={src} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Photo ${i + 1} of ${images.length}`}
              aria-current={current ? "true" : undefined}
              className={`relative block overflow-hidden rounded-lg bg-white/5 transition ${box} ${FOCUS_RING} ${
                current
                  ? "ring-2 ring-[#D4AF37]"
                  : "opacity-60 ring-1 ring-white/15 hover:opacity-100"
              }`}
            >
              <Photo src={src} alt="" sizes="96px" fit="cover" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// --- Lightbox ---------------------------------------------------------------

const FOCUSABLE =
  'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// Whether a point in the viewport lands on the picture itself. The <img> box
// fills the whole stage; the picture is letterboxed inside it.
function isOnPicture(picture: HTMLImageElement, x: number, y: number): boolean {
  const { naturalWidth, naturalHeight } = picture;
  if (naturalWidth === 0 || naturalHeight === 0) return false;
  const box = picture.getBoundingClientRect();
  const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const left = box.left + (box.width - width) / 2;
  const top = box.top + (box.height - height) / 2;
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

interface LightboxProps {
  images: readonly string[];
  position: PhotoPosition;
  /** Names the viewer, e.g. "1998 · La Séptima · Amsterdam". */
  caption: string;
  describe: (index: number) => string;
  onStep: (delta: -1 | 1) => void;
  onSelect: (index: number) => void;
  onClose: () => void;
}

/**
 * Full-screen viewer. Portals to <body> so it sits above the panel, the bottom
 * sheet and the site chrome alike.
 */
export function GalleryLightbox({
  open,
  ...props
}: LightboxProps & { open: boolean }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? <LightboxDialog key="lightbox" {...props} /> : null}
    </AnimatePresence>,
    document.body
  );
}

function LightboxDialog({
  images,
  position,
  caption,
  describe,
  onStep,
  onSelect,
  onClose,
}: LightboxProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pressedAt = useRef<PagePoint | null>(null);
  const many = images.length > 1;
  const src = images[position.index];

  // Effect Events: the listener below is attached once, yet always calls the
  // latest handlers.
  const close = useEffectEvent(onClose);
  const step = useEffectEvent((delta: -1 | 1) => {
    if (many) onStep(delta);
  });

  // While open: own the keyboard, lock the page, and give focus back after.
  // The listener is on the capture phase and stops the event there, because
  // the viewer opens on top of other things that listen for the same keys —
  // the bottom sheet's focus trap, the sidebar's Escape — and they must not
  // also act on them.
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "ArrowRight") {
        event.stopPropagation();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.stopPropagation();
        step(-1);
      } else if (event.key === "Tab") {
        event.stopPropagation();
        const root = rootRef.current;
        if (!root) return;
        const focusable = Array.from(
          root.querySelectorAll<HTMLElement>(FOCUSABLE)
        );
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const current = document.activeElement;
        const outside = !(current instanceof Node) || !root.contains(current);
        if (event.shiftKey && (current === first || outside)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (current === last || outside)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photos: ${caption}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[90] flex flex-col bg-black/95 text-zinc-100 backdrop-blur-sm"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300">
          {caption}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {many ? (
            <span className="font-mono text-[11px] tabular-nums tracking-[0.16em] text-zinc-400">
              <span className="sr-only">Photo </span>
              {position.index + 1}
              <span aria-hidden className="px-1 text-white/30">
                /
              </span>
              <span className="sr-only"> of </span>
              {images.length}
            </span>
          ) : null}
          {src ? (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the original photo in a new tab"
              title="Open the original photo in a new tab"
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-zinc-200 transition-colors hover:border-[#D4AF37]/70 hover:text-[#F1DD96] ${FOCUS_RING}`}
            >
              <ExternalLink aria-hidden className="h-4 w-4" />
            </a>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close photos"
            title="Close"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-zinc-200 transition-colors hover:border-[#D4AF37]/70 hover:text-white ${FOCUS_RING}`}
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={position.direction}>
          {src ? (
            <motion.div
              key={src}
              custom={position.direction}
              variants={reduceMotion ? fade : slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SLIDE_TRANSITION}
              drag={many ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const move = swipeStep(info);
                if (move !== 0) onStep(move);
              }}
              onPointerDown={(event) => {
                pressedAt.current = { x: event.pageX, y: event.pageY };
              }}
              // A tap beside the photo — on the dark surround — closes.
              onTap={(event, info) => {
                if (!endedWhereItBegan(pressedAt.current, info.point)) return;
                const picture =
                  event.target instanceof Element
                    ? event.target.closest("[data-slide]")?.querySelector("img")
                    : null;
                // info.point is measured from the page, the picture's box
                // from the viewport.
                const x = info.point.x - window.scrollX;
                const y = info.point.y - window.scrollY;
                if (!picture || !isOnPicture(picture, x, y)) onClose();
              }}
              // Not a tab stop (see the banner); Escape and × close.
              tabIndex={-1}
              data-slide
              className="absolute inset-0 p-3 outline-none sm:px-20 sm:py-4"
            >
              <div className="relative h-full w-full">
                <Photo
                  src={src}
                  alt={describe(position.index)}
                  sizes="100vw"
                  fit="contain"
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {many ? (
          <>
            <RoundButton
              large
              label="Previous photo"
              onClick={() => onStep(-1)}
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 sm:flex"
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </RoundButton>
            <RoundButton
              large
              label="Next photo"
              onClick={() => onStep(1)}
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 sm:flex"
            >
              <ChevronRight aria-hidden className="h-5 w-5" />
            </RoundButton>
          </>
        ) : null}
      </div>

      {many ? (
        <footer className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <GalleryThumbs
            images={images}
            index={position.index}
            onSelect={onSelect}
            size="large"
            className="mx-auto w-fit max-w-full"
          />
        </footer>
      ) : null}
    </motion.div>
  );
}
