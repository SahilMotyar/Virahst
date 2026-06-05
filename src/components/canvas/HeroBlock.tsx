"use client";

/**
 * The hero title block. Rendered INSIDE the canvas layer at the reserved hole's
 * world centre, so it pans and zooms with the grid — exactly like ciggies, where
 * the title is part of the canvas, not a fixed overlay (brief §4.6).
 */

import { config, HERO_CENTER } from "@/config";
import { brandCount, productCount } from "@/data/items";

export function HeroBlock() {
  return (
    <div
      className="absolute flex flex-col items-center text-center"
      style={{
        left: HERO_CENTER.x,
        top: HERO_CENTER.y,
        transform: "translate(-50%, -50%)",
        width: 560,
      }}
    >
      <h1 className="font-display text-[88px] leading-[0.95] font-semibold tracking-tight text-ink">
        {config.heroTitle}
      </h1>
      <p className="mt-4 text-xs uppercase text-ink-2" style={{ letterSpacing: "0.35em" }}>
        {config.heroSubtitle}
      </p>

      <p className="mt-6 max-w-[34ch] text-[15px] leading-relaxed text-ink-2">
        {config.tagline}
      </p>

      <p className="mt-5 text-[13px] font-medium text-ink-2">
        <span className="text-accent">{brandCount}</span> categories
        <span className="mx-2 opacity-40">·</span>
        <span className="text-accent">{productCount}</span> products
      </p>

      <div className="mt-7 flex flex-col items-center gap-3">
        <a
          href="/collection"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-medium text-bg transition-colors hover:bg-black"
        >
          Browse collection
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-xs font-medium text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors hover:text-ink"
          >
            How it works
          </button>
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-xs font-medium text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors hover:text-ink"
          >
            Why this exists
          </button>
        </div>
      </div>

      <p className="mt-6 text-[11px] text-ink-2 opacity-60">
        by {config.handle}
      </p>
    </div>
  );
}
