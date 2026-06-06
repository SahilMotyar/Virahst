"use client";

/**
 * Generic controlled modal dialog (backdrop, centered card, close button).
 * Closes on Escape, backdrop click, or the ✕. Locks body scroll while open and
 * animates with motion, honouring prefers-reduced-motion. Used by the hero info
 * modals.
 */

import { useEffect, useSyncExternalStore } from "react";
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
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
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-md rounded-[22px] bg-bg p-7 shadow-[0_1px_2px_rgba(0,0,0,.05),0_24px_70px_rgba(0,0,0,.25)] sm:p-8"
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
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-black/4 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {eyebrow && (
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-2 font-display text-2xl text-ink">{title}</h2>
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
