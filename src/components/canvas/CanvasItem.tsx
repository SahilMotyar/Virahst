"use client";

/**
 * A single floating cutout on the canvas: no card chrome, just the image (or a
 * <Placeholder> when the file is absent) with a subtle drop shadow, plus a tiny
 * caption revealed on hover. Positioned by world coordinates; the parent layer
 * applies pan/zoom. Memoised so panning within a cell range never re-renders it.
 */

import { memo, useState } from "react";
import { ITEM_W, ITEM_H } from "@/config";
import type { VintageItem } from "@/data/items";
import { Placeholder } from "@/components/ui/Placeholder";

interface CanvasItemProps {
  item: VintageItem;
  worldX: number;
  worldY: number;
}

function CanvasItemImpl({ item, worldX, worldY }: CanvasItemProps) {
  // Most images are absent → start by attempting load, fall back on error.
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = item.image && !errored;

  return (
    <div
      className="group absolute flex flex-col items-center select-none"
      style={{
        left: worldX,
        top: worldY,
        width: ITEM_W,
        contentVisibility: "auto",
      }}
    >
      <div
        className="relative w-full"
        style={{
          height: ITEM_H,
          filter: "drop-shadow(0 6px 14px rgba(26,18,8,0.10))",
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
