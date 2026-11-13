"use client";

import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { useHydrated } from "./hooks";
import { CloseButton } from "./TitleDetail";

// Bottom-sheet shell for the title detail on phones and tablets — the mobile
// counterpart of the floating desktop card. A real modal: it portals to <body>
// (so no transformed ancestor can re-anchor `position: fixed`), dims and locks
// the page behind it, traps focus, and closes on the X, a tap outside, Escape,
// or a downward flick of the handle.

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface TitleSheetProps {
  open: boolean;
  onClose: () => void;
  /** id of the heading inside `children` that names the dialog. */
  labelledBy: string;
  /** Extra classes for the portal root — it sits outside the section, so
      anything inherited (the display font variable) has to be passed in. */
  className?: string;
  children: ReactNode;
}

export default function TitleSheet({
  open,
  onClose,
  labelledBy,
  className = "",
  children,
}: TitleSheetProps) {
  const hydrated = useHydrated();
  const reduceMotion = useReducedMotion() ?? false;
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Read through an Effect Event so the effect below depends on `open` alone:
  // a new `onClose` identity must never re-run it (that would bounce focus).
  const requestClose = useEffectEvent(onClose);

  // While open: lock page scroll, keep Tab inside the sheet, close on Escape,
  // and hand focus back to whatever opened it afterwards.
  useEffect(() => {
    if (!open) return;

    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    sheetRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const outside = !(current instanceof Node) || !sheet.contains(current);

      if (event.shiftKey && (current === first || current === sheet || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      // Only if the opener is still on the page (a map tap has none).
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  // Portals need `document`; rendering nothing until hydration keeps the
  // server and first client render identical.
  if (!hydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div key="title-sheet" className={`fixed inset-0 z-[60] ${className}`}>
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 touch-none bg-black/65 backdrop-blur-[3px]"
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            // Dragged only by the handle, so scrolling the story never turns
            // into a dismiss gesture.
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.15 } }
                : { y: "100%", transition: { duration: 0.26, ease: [0.4, 0, 1, 1] } }
            }
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 300, damping: 25 }
            }
            // The ::after skirt hangs below the screen edge so the spring's
            // slight overshoot never opens a gap under the sheet.
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl outline-none after:absolute after:inset-x-0 after:top-full after:h-24 after:bg-[#0b0e16]"
          >
            <div className="glass-panel edge-gold relative flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[28px] shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.9)]">
              {/* Grab handle — the drag surface. */}
              <div
                aria-hidden
                onPointerDown={(event) => dragControls.start(event)}
                className="absolute inset-x-16 top-0 z-30 flex h-8 cursor-grab touch-none justify-center pt-2.5 active:cursor-grabbing"
              >
                <span className="h-1 w-10 rounded-full bg-white/35" />
              </div>

              <CloseButton onClick={onClose} />

              <div className="overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
