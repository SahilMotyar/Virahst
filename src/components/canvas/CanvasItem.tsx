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

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ITEM_W, ITEM_H } from "@/config";
import { hasImage, thumbSrc, type VintageItem } from "@/data/items";
import { Placeholder } from "@/components/ui/Placeholder";
import { useUIStore } from "@/store/uiStore";
import { useCameraStore } from "@/store/cameraStore";

interface CanvasItemProps {
  item: VintageItem;
  worldX: number;
  worldY: number;
  /** ms to wait before requesting the image (first-paint stagger). */
  loadDelay?: number;
  /** Nearest-to-centre tiles ask the browser to fetch these first. */
  highPriority?: boolean;
}

function CanvasItemImpl({
  item,
  worldX,
  worldY,
  loadDelay = 0,
  highPriority = false,
}: CanvasItemProps) {
  // Items without a picture (see data/image-manifest.json) skip the <img>
  // entirely and render the placeholder; a failed load falls back to it too.
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [armed, setArmed] = useState(loadDelay <= 0);
  useEffect(() => {
    if (armed) return;
    const t = setTimeout(() => setArmed(true), loadDelay);
    return () => clearTimeout(t);
  }, [armed, loadDelay]);
  const setHovered = useUIStore((s) => s.setHovered);
  const router = useRouter();
  const href = `/item/${item.slug}`;
  // Viewport prefetching is off (see the Link below), so warm the item page
  // once someone shows intent: hovering it, or tabbing to it.
  const prefetch = () => router.prefetch(href);
  const showImage = hasImage(item) && !errored;
  // Until the stagger fires (or the file lands) show the soft placeholder tile.
  const showPlaceholder = !showImage || !armed || !loaded;

  return (
    <Link
      href={href}
      // No viewport prefetch: on a canvas, panning sweeps dozens of links
      // through the viewport, and each would fetch + parse its page mid-gesture.
      prefetch={false}
      // Clear the hover preview before navigating so nothing is mid-unmount
      // during the route transition.
      onClick={() => setHovered(null)}
      onFocus={(e) => {
        setHovered(item.slug);
        prefetch();
        // Bring an off-screen item into view when Tab reaches it — but only
        // for keyboard focus. On a mouse click, focus lands at mousedown, and
        // panning here would slide the item out from under the cursor before
        // mouseup, so the click would resolve against the container and the
        // item would never open.
        if (!e.currentTarget.matches(":focus-visible")) return;
        useCameraStore
          .getState()
          .controls?.panToWorld(worldX + ITEM_W / 2, worldY + ITEM_H / 2);
      }}
      onBlur={() => setHovered(null)}
      onMouseEnter={() => {
        setHovered(item.slug);
        prefetch();
      }}
      onMouseLeave={() => setHovered(null)}
      className="group absolute flex flex-col items-center rounded-[14px] select-none"
      style={{
        left: worldX,
        top: worldY,
        width: ITEM_W,
        // No content-visibility: auto here. With the whole field mounted, it
        // made the browser re-check every tile's visibility on each pan/zoom
        // frame (measured: ~2x worse frame times on slower CPUs).
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
        {showPlaceholder && (
          <Placeholder
            id={item.id}
            nameEn={item.nameEn}
            category={item.category}
          />
        )}
        {showImage && armed && (
          // eslint-disable-next-line @next/next/no-img-element -- raw <img> with onError → <Placeholder> fallback is the intended strategy; next/image errors on missing files.
          <img
            src={thumbSrc(item)}
            alt=""
            width={ITEM_W}
            height={ITEM_H}
            decoding="async"
            fetchPriority={highPriority ? "high" : "low"}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
            style={{ opacity: loaded ? 1 : 0 }}
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
