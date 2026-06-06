"use client";

/**
 * Community chat — stub only (brief §5.2 / Phase 5). A collapsible right-side
 * panel with a message-list shell and a "Sign in to chat" footer. No realtime
 * backend; the launcher toggles a local open state.
 */

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const SAMPLE = [
  { who: "Asha", text: "Found a Gold Spot crate label at a raddi shop today 🍊" },
  { who: "Devang", text: "The Murphy baby print ads are unreal. Anyone have scans?" },
  { who: "Meera", text: "Dating this Bata signboard to the late 70s I think." },
];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-bg shadow-[0_8px_24px_rgba(0,0,0,.18)] transition-colors hover:bg-black"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8 8.38 8.38 0 0 1 8.5-8.5 8.5 8.5 0 0 1 8.5 8.5Z" />
        </svg>
        {open ? "Close" : "Community"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            className="fixed bottom-20 right-5 z-30 flex h-[60vh] max-h-[520px] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[22px] border border-black/5 bg-bg shadow-[0_1px_2px_rgba(0,0,0,.05),0_24px_60px_rgba(0,0,0,.18)]"
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <header className="border-b border-black/5 px-5 py-3.5">
              <h2 className="font-display text-lg text-ink">Community chat</h2>
              <p className="text-[11px] text-ink-2">A preview — not live yet</p>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {SAMPLE.map((m, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
                    {m.who}
                  </span>
                  <p className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-ink shadow-[0_1px_2px_rgba(0,0,0,.04)]">
                    {m.text}
                  </p>
                </div>
              ))}
            </div>

            <footer className="border-t border-black/5 bg-white/60 p-3">
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm text-ink-2">
                Sign in to chat
                <span className="ml-auto text-ink-2/50" aria-hidden>
                  ↵
                </span>
              </div>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
