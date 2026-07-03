"use client";

/**
 * Hand-rolled pan/zoom/momentum camera for the infinite canvas.
 *
 * Performance model (brief §4.7):
 *   • The live transform lives in a mutable ref and is written directly to the
 *     layer's style — React never re-renders on pointermove.
 *   • Pan/zoom updates are coalesced into a single requestAnimationFrame, so
 *     multiple input events per frame produce at most one transform write.
 *   • Viewport dimensions are cached (read only on init/resize) so we never read
 *     layout right after writing it — that read-after-write forces a synchronous
 *     reflow every frame and is the classic source of pan jank.
 *   • The store is touched only when the visible cell range changes (→ mount /
 *     unmount) or the zoom scale changes (→ throttled readout). Panning within a
 *     range triggers zero React renders.
 *
 * Pointer Events cover mouse + touch (incl. two-finger pinch); wheel handles
 * trackpad pan and ctrl/⌘ zoom. `onReady` fires once the camera is centred, so
 * Canvas can fade the field in instead of flashing an un-centred SSR frame.
 */

import { useEffect, useRef, type RefObject } from "react";
import {
  MIN_SCALE,
  MAX_SCALE,
  INITIAL_SCALE,
  MOMENTUM_DECAY,
  HERO_CENTER,
  CELL_W,
  CELL_H,
  ITEM_W,
  ITEM_H,
  OVERSCAN,
  GRID_BOUNDS,
  config,
} from "@/config";
import { useCameraStore, type CellRange } from "@/store/cameraStore";
import { cellToWorld, isRenderableCell, itemIndexForCell } from "@/lib/grid";
import { items } from "@/data/items";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Min velocity (px/frame) below which momentum stops. */
const MIN_VELOCITY = 0.05;
/** How often (ms) to push the scale readout into the store. */
const SCALE_INTERVAL = 60;
/** Pointer travel (px) under which a press counts as a tap, not a drag. */
const TAP_SLOP = 6;
/** Max press duration (ms) for a tap. */
const TAP_TIME = 500;

/** World-space extents of the finite item field (used for pan clamping). */
const FIELD = {
  x0: GRID_BOUNDS.minCol * CELL_W,
  x1: (GRID_BOUNDS.maxCol + 1) * CELL_W,
  y0: GRID_BOUNDS.minRow * CELL_H,
  y1: (GRID_BOUNDS.maxRow + 1) * CELL_H,
};
/** Min screen px of the field that must stay visible on each axis. */
const EDGE_MARGIN = 160;

interface Cam {
  x: number;
  y: number;
  scale: number;
}

export function useCanvasCamera(
  containerRef: RefObject<HTMLDivElement | null>,
  layerRef: RefObject<HTMLDivElement | null>,
  onReady?: () => void,
  onTapItem?: (slug: string) => void,
) {
  // Live truth — never triggers a React render.
  const cam = useRef<Cam>({ x: 0, y: 0, scale: INITIAL_SCALE });
  const initialised = useRef(false);

  const setScale = useCameraStore((s) => s.setScale);
  const setRange = useCameraStore((s) => s.setRange);
  const registerControls = useCameraStore((s) => s.registerControls);

  useEffect(() => {
    const container = containerRef.current;
    const layer = layerRef.current;
    if (!container || !layer) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Cached viewport dimensions — never read during a pan (avoids reflow).
    let viewW = container.clientWidth || window.innerWidth;
    let viewH = container.clientHeight || window.innerHeight;

    // --- pan clamp (finite field only) ----------------------------------
    // Keeps at least EDGE_MARGIN px of the field on screen per axis; when the
    // field is smaller than the viewport at the current scale, centres it.
    const clampCam = () => {
      if (config.flags.INFINITE_WRAP) return;
      const { scale } = cam.current;
      const loX = EDGE_MARGIN - FIELD.x1 * scale;
      const hiX = viewW - EDGE_MARGIN - FIELD.x0 * scale;
      const loY = EDGE_MARGIN - FIELD.y1 * scale;
      const hiY = viewH - EDGE_MARGIN - FIELD.y0 * scale;
      cam.current.x = loX > hiX ? (loX + hiX) / 2 : clamp(cam.current.x, loX, hiX);
      cam.current.y = loY > hiY ? (loY + hiY) / 2 : clamp(cam.current.y, loY, hiY);
    };

    // --- live transform application ------------------------------------
    const apply = () => {
      clampCam();
      const { x, y, scale } = cam.current;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    // --- hover suspension during pan -------------------------------------
    // While dragging (and during a momentum glide) the canvas slides under a
    // stationary cursor, which would otherwise fire mouseenter/mouseleave on
    // every item that passes by — hover-state churn, popover mounts and CSS
    // hover transitions mid-pan are a big part of pan jank. Disabling pointer
    // events on the layer suspends all of that; the container (which owns the
    // pan listeners) is unaffected, and hover resumes on the next mouse move
    // after the canvas settles.
    const setLayerInteractive = (on: boolean) => {
      layer.style.pointerEvents = on ? "" : "none";
    };

    // --- sync visible cell range (only on change → rare re-render) ------
    let lastRange: CellRange = { minCol: 0, maxCol: -1, minRow: 0, maxRow: -1 };
    const syncRange = () => {
      if (viewW === 0 || viewH === 0) return;
      const { x, y, scale } = cam.current;
      const leftWorld = (0 - x) / scale - OVERSCAN;
      const topWorld = (0 - y) / scale - OVERSCAN;
      const rightWorld = (viewW - x) / scale + OVERSCAN;
      const bottomWorld = (viewH - y) / scale + OVERSCAN;
      const next: CellRange = {
        minCol: Math.floor(leftWorld / CELL_W),
        maxCol: Math.ceil(rightWorld / CELL_W),
        minRow: Math.floor(topWorld / CELL_H),
        maxRow: Math.ceil(bottomWorld / CELL_H),
      };
      if (
        next.minCol !== lastRange.minCol ||
        next.maxCol !== lastRange.maxCol ||
        next.minRow !== lastRange.minRow ||
        next.maxRow !== lastRange.maxRow
      ) {
        lastRange = next;
        setRange(next);
      }
    };

    // --- sync scale readout (throttled) --------------------------------
    let lastScaleCommit = 0;
    let lastScaleValue = -1;
    const syncScale = (force = false) => {
      const now = performance.now();
      if (!force && now - lastScaleCommit < SCALE_INTERVAL) return;
      if (cam.current.scale === lastScaleValue) return;
      lastScaleCommit = now;
      lastScaleValue = cam.current.scale;
      setScale(cam.current.scale);
    };

    // --- coalesce input → at most one transform write per frame --------
    let framePending = false;
    const scheduleFrame = () => {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(() => {
        framePending = false;
        apply();
        syncRange();
      });
    };

    // --- initial framing: centre the hero hole -------------------------
    if (!initialised.current) {
      const scale = INITIAL_SCALE;
      cam.current = {
        scale,
        x: viewW / 2 - HERO_CENTER.x * scale,
        y: viewH / 2 - HERO_CENTER.y * scale,
      };
      initialised.current = true;
    }
    apply();
    syncRange();
    syncScale(true);
    onReady?.();

    // --- momentum loop -------------------------------------------------
    const velocity = { x: 0, y: 0 };
    let momentumRAF = 0;
    const stopMomentum = () => {
      if (momentumRAF) {
        cancelAnimationFrame(momentumRAF);
        momentumRAF = 0;
      }
    };
    const momentumStep = () => {
      velocity.x *= MOMENTUM_DECAY;
      velocity.y *= MOMENTUM_DECAY;
      cam.current.x += velocity.x;
      cam.current.y += velocity.y;
      const freeX = cam.current.x;
      const freeY = cam.current.y;
      apply();
      // apply() clamps; if an axis got pinned to the field edge, stop
      // pushing along it so the glide doesn't grind against the boundary.
      if (cam.current.x !== freeX) velocity.x = 0;
      if (cam.current.y !== freeY) velocity.y = 0;
      syncRange();
      if (Math.hypot(velocity.x, velocity.y) > MIN_VELOCITY) {
        momentumRAF = requestAnimationFrame(momentumStep);
      } else {
        momentumRAF = 0;
        setLayerInteractive(true);
      }
    };

    // --- zoom anchored at a screen point -------------------------------
    const zoomAt = (cx: number, cy: number, factor: number) => {
      const { x, y, scale } = cam.current;
      const newScale = clamp(scale * factor, MIN_SCALE, MAX_SCALE);
      if (newScale === scale) return;
      const worldX = (cx - x) / scale;
      const worldY = (cy - y) / scale;
      cam.current = {
        scale: newScale,
        x: cx - worldX * newScale,
        y: cy - worldY * newScale,
      };
      scheduleFrame();
      syncScale();
    };

    // --- tap hit-test: world point → cell → item slug ------------------
    const tapItemAt = (clientX: number, clientY: number) => {
      if (!onTapItem) return;
      const rect = container.getBoundingClientRect();
      const { x, y, scale } = cam.current;
      const worldX = (clientX - rect.left - x) / scale;
      const worldY = (clientY - rect.top - y) / scale;
      const col = Math.floor(worldX / CELL_W);
      const row = Math.floor(worldY / CELL_H);
      if (!isRenderableCell(col, row)) return;
      const { x: ix, y: iy } = cellToWorld(col, row);
      if (
        worldX >= ix &&
        worldX <= ix + ITEM_W &&
        worldY >= iy &&
        worldY <= iy + ITEM_H
      ) {
        onTapItem(items[itemIndexForCell(col, row, items.length)].slug);
      }
    };

    // --- pointer (pan + pinch) -----------------------------------------
    const pointers = new Map<number, { x: number; y: number }>();
    let dragging = false;
    let last = { x: 0, y: 0, t: 0 };
    let pinchDist = 0;
    // Tap tracking (to tell a click from a drag).
    let tapStart = { x: 0, y: 0, t: 0 };
    let movedFar = false;

    const onPointerDown = (e: PointerEvent) => {
      stopMomentum();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      container.setPointerCapture(e.pointerId);
      if (pointers.size === 1) {
        dragging = true;
        last = { x: e.clientX, y: e.clientY, t: performance.now() };
        tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
        movedFar = false;
        velocity.x = 0;
        velocity.y = 0;
        container.style.cursor = "grabbing";
        setLayerInteractive(false);
      } else if (pointers.size === 2) {
        dragging = false;
        const pts = [...pointers.values()];
        pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        // Pinch zoom anchored at the midpoint between the two fingers.
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchDist > 0) {
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const rect = container.getBoundingClientRect();
          zoomAt(midX - rect.left, midY - rect.top, dist / pinchDist);
        }
        pinchDist = dist;
        return;
      }

      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      const dt = Math.max(1, now - last.t);
      cam.current.x += dx;
      cam.current.y += dy;
      // Velocity in px/frame (~16ms), used for the flick.
      velocity.x = (dx / dt) * 16;
      velocity.y = (dy / dt) * 16;
      last = { x: e.clientX, y: e.clientY, t: now };
      if (
        !movedFar &&
        Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) > TAP_SLOP
      ) {
        movedFar = true;
      }
      scheduleFrame();
    };

    const endPointer = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (container.hasPointerCapture(e.pointerId)) {
        container.releasePointerCapture(e.pointerId);
      }
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0) {
        if (dragging) {
          dragging = false;
          container.style.cursor = "grab";
          const isTap =
            !movedFar && performance.now() - tapStart.t < TAP_TIME;
          if (isTap) {
            // A click/tap on an item opens its detail; no momentum.
            setLayerInteractive(true);
            tapItemAt(e.clientX, e.clientY);
          } else if (
            !reducedMotion &&
            Math.hypot(velocity.x, velocity.y) > MIN_VELOCITY
          ) {
            // Flick → momentum (skipped under reduced-motion). The layer
            // stays non-interactive until the glide settles (momentumStep
            // restores it).
            stopMomentum();
            momentumRAF = requestAnimationFrame(momentumStep);
          } else {
            setLayerInteractive(true);
          }
        }
      } else if (pointers.size === 1) {
        // Dropped from pinch back to single-finger pan.
        const [p] = [...pointers.values()];
        last = { x: p.x, y: p.y, t: performance.now() };
        dragging = true;
      }
    };

    // --- wheel: trackpad pan, ctrl/⌘ = zoom ----------------------------
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopMomentum();
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom on macOS arrives as ctrl+wheel.
        const rect = container.getBoundingClientRect();
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
      } else {
        cam.current.x -= e.deltaX;
        cam.current.y -= e.deltaY;
        scheduleFrame();
      }
    };

    container.style.cursor = "grab";
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", endPointer);
    container.addEventListener("pointercancel", endPointer);
    container.addEventListener("wheel", onWheel, { passive: false });

    // --- imperative controls for the fixed ZoomControls overlay --------
    registerControls({
      zoomByCenter: (factor: number) => {
        stopMomentum();
        zoomAt(viewW / 2, viewH / 2, factor);
        syncScale(true);
      },
    });

    // --- re-measure + re-frame on resize -------------------------------
    const onResize = () => {
      viewW = container.clientWidth;
      viewH = container.clientHeight;
      apply();
      syncRange();
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopMomentum();
      layer.style.pointerEvents = "";
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", endPointer);
      container.removeEventListener("pointercancel", endPointer);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      registerControls(null);
    };
  }, [
    containerRef,
    layerRef,
    setScale,
    setRange,
    registerControls,
    onReady,
    onTapItem,
  ]);
}
