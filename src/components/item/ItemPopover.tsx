"use client";

/**
 * Fixed floating card (bottom-right) that previews whichever canvas item the
 * pointer is hovering — the ciggies-style popover (brief §5.2). Display-only;
 * tapping the item opens the full detail modal. Hidden on touch (no hover).
 *
 * Intentionally plain (no AnimatePresence): an exit animation here can hold a
 * DOM node while a route transition reconciles, which crashes React with
 * insertBefore/removeChild errors. A simple conditional render avoids that.
 */

import { useUIStore } from "@/store/uiStore";
import { getItemBySlug } from "@/data/items";

export function ItemPopover() {
  const hoveredSlug = useUIStore((s) => s.hoveredSlug);
  const item = hoveredSlug ? getItemBySlug(hoveredSlug) : undefined;
  if (!item) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 right-5 z-30 hidden w-64 rounded-[18px] bg-white/95 p-4 shadow-[0_1px_2px_rgba(0,0,0,.05),0_12px_32px_rgba(0,0,0,.12)] backdrop-blur sm:block">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent">
          {item.region}
        </span>
        <span className="rounded-full bg-black/4 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-ink-2">
          {item.era}
        </span>
      </div>

      <p className="mt-2.5 font-display text-lg leading-tight text-ink">
        {item.name}
      </p>
      <p className="text-xs text-ink-2">{item.nameEn}</p>

      <p className="mt-1.5 text-xs text-ink-2">{item.brandEn}</p>

      <div className="mt-3 flex items-center gap-3 text-xs text-ink-2">
        {item.priceVintage && (
          <span className="font-medium text-accent">{item.priceVintage}</span>
        )}
        <span>★ {item.favorites}</span>
        <span>✦ {item.comments}</span>
      </div>
    </div>
  );
}
