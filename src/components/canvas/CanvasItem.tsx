"use client";

/**
 * A single floating cutout on the canvas: no card chrome, just the image (or a
 * <Placeholder> when the file is absent) with a subtle drop shadow, plus a
 * caption. Positioned by world coordinates; the parent layer applies pan/zoom.
 * Memoised so panning within a cell range never re-renders it.
 *
 * It is a real <Link>, not a hit-tested rectangle: that's what makes the
 * canvas keyboard-navigable, lets items be opened in a new tab, and gives
 * assistive tech something to announce. Focusing one pans the camera to it,
 * so keyboard focus is never left off-screen (WCAG 2.4.11).
 */

import { memo, useState } from "react";
import Link from "next/link";
import { ITEM_W, ITEM_H, config } from "@/config";
import type { VintageItem } from "@/data/items";
import { Placeholder } from "@/components/ui/Placeholder";
import { useUIStore } from "@/store/uiStore";
import { useCameraStore } from "@/store/cameraStore";

interface CanvasItemProps {
  item: VintageItem;
  worldX: number;
  worldY: number;
}

function CanvasItemImpl({ item, worldX, worldY }: CanvasItemProps) {
  // While ASSETS_PRESENT is false, skip <img> entirely (no 404s) and render the
  // placeholder directly. With assets present, attempt load and fall back on error.
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const setHovered = useUIStore((s) => s.setHovered);
  const showImage = config.flags.ASSETS_PRESENT && Boolean(item.image) && !errored;

  return (
    <Link
      href={`/item/${item.slug}`}
      // Clear the hover preview before navigating so nothing is mid-unmount
      // during the route transition.
      onClick={() => setHovered(null)}
      onFocus={() => {
        setHovered(item.slug);
        // Bring an off-screen item into view when Tab reaches it.
        useCameraStore
          .getState()
          .controls?.panToWorld(worldX + ITEM_W / 2, worldY + ITEM_H / 2);
      }}
      onBlur={() => setHovered(null)}
      onMouseEnter={() => setHovered(item.slug)}
      onMouseLeave={() => setHovered(null)}
      className="group absolute flex flex-col items-center rounded-[14px] select-none"
      style={{
        left: worldX,
        top: worldY,
        width: ITEM_W,
        contentVisibility: "auto",
      }}
    >
      <div
        className="relative w-full overflow-hidden rounded-[14px] transition-transform duration-200 ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
        style={{
          height: ITEM_H,
          // box-shadow (vs filter: drop-shadow) is far cheaper to composite
          // across the hundreds of items mounted when zoomed out.
          boxShadow: "0 1px 2px rgba(26,18,8,.05), 0 6px 16px rgba(26,18,8,.07)",
        }}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- assets are mostly absent during Phase 1; a raw <img> with an onError → <Placeholder> fallback is the intended strategy. next/image errors on missing files.
          <img
            src={item.image}
            alt=""
            width={ITEM_W}
            height={ITEM_H}
            loading="lazy"
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className="h-full w-full object-contain transition-opacity duration-300"
            style={{ opacity: loaded ? 1 : 0 }}
          />
        ) : (
          <Placeholder
            id={item.id}
            nameEn={item.nameEn}
            category={item.category}
          />
        )}
      </div>

      {/* Caption. Revealed on hover/focus for pointer users, but permanently
          visible on touch devices — a hover-only label is simply invisible on
          a phone, which left every item on the canvas unnamed. */}
      <span className="canvas-caption pointer-events-none mt-2 max-w-full truncate font-display text-sm text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        {item.name}
      </span>
      {/* The accessible name: Devanagari alone reads poorly out of context. */}
      <span className="sr-only">
        {item.nameEn} — {item.brandEn}, {item.era}
      </span>
    </Link>
  );
}

export const CanvasItem = memo(CanvasItemImpl);
