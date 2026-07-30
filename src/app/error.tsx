"use client";

/**
 * Route-segment error boundary. Without this file, ANY client-side exception
 * (e.g. a transient React reconciliation error from a browser extension or page
 * translator mutating the DOM) bubbles to Next.js's built-in global-error
 * screen — the bare "Reload to try again, or go back." page.
 *
 * Such reconciliation errors are transient: re-rendering the segment fresh
 * almost always succeeds. So we auto-call reset() a couple of times for a
 * seamless recovery, then fall back to a styled manual prompt if it keeps
 * failing (which would mean a real, deterministic bug rather than a DOM-mutation
 * race — auto-retrying that forever would loop).
 */

import { useEffect } from "react";
import { config } from "@/config";

// Module-level so the count survives the boundary remounting after each reset().
let autoRecoverAttempts = 0;
const MAX_AUTO_RECOVER = 2;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the cause; a silently-swallowed boundary makes the real bug
    // (the one that survives the retries below) very hard to find.
    console.error("[virasat] route error boundary:", error);
    if (autoRecoverAttempts < MAX_AUTO_RECOVER) {
      autoRecoverAttempts += 1;
      reset();
    }
  }, [reset, error]);

  // Reset the counter once the user explicitly retries, so a later, unrelated
  // error gets its own fresh round of auto-recovery.
  const onRetry = () => {
    autoRecoverAttempts = 0;
    reset();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink font-display text-2xl text-bg">
        {config.logoGlyph}
      </span>
      <h1 className="mt-6 font-display text-4xl text-ink">Something slipped</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">
        The page hit a hiccup while loading. Trying again usually sorts it out.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-bg transition-colors hover:bg-black"
        >
          Try again
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate hard navigation: a soft nav keeps the corrupted client tree that landed us here, so a full document load is the actual escape hatch. */}
        <a
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
        >
          Back to the canvas
        </a>
      </div>
    </main>
  );
}
