"use client";

/**
 * The pan/zoom surface. Owns the camera hook (which writes the live transform
 * straight to the layer ref) and renders the virtualized field of CanvasItems
 * plus the hero block inside the same transformed layer.
 *
 * In the finite layout (the default) every tile is mounted once, up front: the
 * whole field is ~130 tiles, which the browser handles easily, and it means a
 * pan or zoom never makes React mount anything mid-gesture — that synchronous
 * work was what made gestures stutter. Only INFINITE_WRAP mode virtualises,
 * re-rendering when the visible cell range changes. Plain panning never
 * re-renders in either mode; it is handled entirely in the camera hook.
 *
 * The layer starts hidden and fades in once the camera has centred the hero
 * (`ready`), so the user never sees the un-centred SSR frame at top-left.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCameraStore } from "@/store/cameraStore";
import { useCanvasCamera } from "@/components/canvas/useCanvasCamera";
import { useVirtualization } from "@/components/canvas/useVirtualization";
import { CanvasItem } from "@/components/canvas/CanvasItem";
import { HeroBlock } from "@/components/canvas/HeroBlock";
import { INITIAL_SCALE, HERO_CENTER, ITEM_W, ITEM_H, GRID_BOUNDS, config } from "@/config";
import type { CellRange } from "@/store/cameraStore";

/** Per-tile stagger (ms) for the first paint, nearest-to-centre first. */
const STAGGER_MS = 20;
const MAX_DELAY_MS = 1600;
/** Infinite mode only: after this, tiles mounting from panning load immediately. */
const WARM_MS = 2600;
/** Stable empty list for the pre-ready render. */
const NO_TILES: ReturnType<typeof useVirtualization> = [];
/** Finite mode mounts the whole field; a constant so the store selector is stable. */
const FULL_RANGE: CellRange = { ...GRID_BOUNDS };
/** The nearest few tiles load at high fetch priority. */
const HIGH_PRIORITY_COUNT = 14;

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const onReady = useCallback(() => setReady(true), []);
  useCanvasCamera(containerRef, layerRef, onReady);

  // Finite mode ignores the live range (the selector returns a constant, so
  // camera range updates never re-render the canvas).
  const range = useCameraStore((s) =>
    config.flags.INFINITE_WRAP ? s.range : FULL_RANGE,
  );
  const field = useVirtualization(range);
  // Tiles render only on the client, once the camera has framed the hero. The
  // layer is invisible until then anyway, so server-rendering ~130 tiles just
  // bloated the HTML (~20KB → 160KB) — and an <img> in server HTML can finish
  // loading before React attaches onLoad, leaving that tile stuck on its
  // placeholder. Mounting with the fade-in avoids both.
  const visible = ready ? field : NO_TILES;

  // First paint: reveal images progressively, nearest the centre first. In
  // infinite mode, tiles keep mounting as you pan, so once the opening burst is
  // over they skip the stagger. (Finite mode never flips this: every tile is
  // already mounted, and flipping it would re-render all of them mid-gesture.)
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (!config.flags.INFINITE_WRAP) return;
    const t = setTimeout(() => setWarm(true), WARM_MS);
    return () => clearTimeout(t);
  }, []);
  const rankByKey = useMemo(() => {
    const dist = (v: { worldX: number; worldY: number }) =>
      Math.hypot(v.worldX + ITEM_W / 2 - HERO_CENTER.x, v.worldY + ITEM_H / 2 - HERO_CENTER.y);
    const sorted = [...visible].sort((a, b) => dist(a) - dist(b));
    return new Map(sorted.map((v, i) => [v.key, i]));
  }, [visible]);

  return (
    <div
      ref={containerRef}
      // translate="no": the canvas re-renders constantly as it pans, so letting
      // a page-translator (Google Translate) rewrite text nodes here makes React
      // reconciliation crash with insertBefore/removeChild errors.
      translate="no"
      // Focusable so the arrow/+/-/Home handlers actually receive keys: without
      // a tab stop of its own, keydown only reached the container when an item
      // already had focus, so the pan shortcuts did nothing from a cold start.
      tabIndex={0}
      // An outline on a viewport-flush element gets clipped, so the focused
      // state is drawn as an inset ring instead (see .canvas-focus-ring).
      className="canvas-focus-ring canvas-no-select absolute inset-0 touch-none overflow-hidden bg-canvas"
      aria-label="Vintage archive canvas. Drag or use arrow keys to pan, scroll or pinch to zoom, Home to recentre. Tab through items and press Enter to open one."
      role="application"
    >
      <div
        ref={layerRef}
        className="absolute left-0 top-0 h-0 w-0 will-change-transform transition-opacity duration-300 ease-out"
        style={{
          transformOrigin: "0 0",
          transform: `translate3d(0px, 0px, 0) scale(${INITIAL_SCALE})`,
          opacity: ready ? 1 : 0,
        }}
      >
        {/* The camera rewrites the layer's inline transform every frame, and
            Chrome then restyles each of the layer's *direct* children. With the
            whole field mounted that was ~130 elements per frame (~3ms at full
            CPU speed, far more on phones). Nesting the tiles one level down in
            this static wrapper keeps that per-frame restyle tiny. */}
        <div className="absolute left-0 top-0 h-0 w-0">
          <HeroBlock />
          {visible.map((v) => (
            <CanvasItem
              key={v.key}
              item={v.item}
              worldX={v.worldX}
              worldY={v.worldY}
              loadDelay={
                warm ? 0 : Math.min((rankByKey.get(v.key) ?? 0) * STAGGER_MS, MAX_DELAY_MS)
              }
              highPriority={(rankByKey.get(v.key) ?? 99) < HIGH_PRIORITY_COUNT}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
