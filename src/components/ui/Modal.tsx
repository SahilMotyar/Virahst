"use client";

/**
 * Generic controlled modal dialog (backdrop, centered card, close button).
 * Closes on Escape, backdrop click, or the ✕. Locks body scroll while open and
 * animates with motion, honouring prefers-reduced-motion. Used by the hero info
 * modals.
 */

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Small uppercase eyebrow above the title. */
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
}

// Hydration-safe client-mount detection (false on server, true on client) —
// avoids running createPortal during SSR without a setState-in-effect.
const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function Modal({ open, onClose, eyebrow, title, children }: ModalProps) {
  const reduce = useReducedMotion();
  // Portal to body so the modal escapes any transformed ancestor (the canvas
  // layer uses `transform`, which would otherwise trap `position: fixed`).
  const mounted = useMounted();
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    // Remember who opened the dialog so focus can go back there on close —
    // without this, closing drops the caret at the top of the document.
    const opener = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        cardRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Trap Tab inside the dialog: a modal the keyboard can wander out of
      // still lets you operate the page it's covering.
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !cardRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the dialog itself rather than its close button, so the title is
    // what gets announced.
    const raf = requestAnimationFrame(() => cardRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
          onClick={onClose}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : "Dialog"}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-[22px] bg-bg p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_24px_70px_rgba(0,0,0,.25)] focus:outline-none sm:p-8"
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-black/4 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {eyebrow && (
              <p className="pr-10 text-[11px] font-medium uppercase tracking-[0.28em] text-accent-ink">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 id={titleId} className="mt-2 pr-10 font-display text-2xl text-ink">
                {title}
              </h2>
            )}
            <div className="mt-4 text-sm leading-relaxed text-ink-2">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
