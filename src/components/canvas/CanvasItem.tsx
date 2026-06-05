"use client";

/**
 * A single floating cutout on the canvas: no card chrome, just the image (or a
 * <Placeholder> when the file is absent) with a subtle drop shadow, plus a tiny
 * caption revealed on hover. Positioned by world coordinates; the parent layer
 * applies pan/zoom. Memoised so panning within a cell range never re-renders it.
 */

import { memo, useState } from "react";
import { ITEM_W, ITEM_H, config } from "@/config";
import type { VintageItem } from "@/data/items";
import { Placeholder } from "@/components/ui/Placeholder";
import { useUIStore } from "@/store/uiStore";

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
    <div
      className="group absolute flex flex-col items-center select-none"
      style={{
        left: worldX,
        top: worldY,
        width: ITEM_W,
        contentVisibility: "auto",
      }}
      onMouseEnter={() => setHovered(item.slug)}
      onMouseLeave={() => setHovered(null)}
    >
      <div
        className="relative w-full overflow-hidden rounded-[14px] transition-transform duration-200 ease-out group-hover:scale-[1.04]"
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
            alt={item.nameEn}
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

      {/* Caption: only the Devanagari name, revealed on hover. */}
      <span className="pointer-events-none mt-2 max-w-full truncate font-display text-sm text-ink opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {item.name}
      </span>
    </div>
  );
}

export const CanvasItem = memo(CanvasItemImpl);
