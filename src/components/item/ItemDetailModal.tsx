"use client";

/**
 * Client wrapper that presents the item detail as a modal over the canvas.
 * Used only by the intercepted route (soft navigation). Closes on backdrop
 * click, Escape, or the close button — all via router.back() so the URL and
 * history stay correct. motion handles the enter transition (brief §3); exits
 * are instant since the route unmounts. Honours prefers-reduced-motion.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

export function ItemDetailModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const reduce = useReducedMotion();

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [router]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-10 backdrop-blur-sm sm:py-16"
      onClick={() => router.back()}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="relative w-full max-w-4xl rounded-[22px] bg-bg p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_24px_70px_rgba(0,0,0,.25)] sm:p-9"
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? false : { opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.back()}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.06)] transition-colors hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
