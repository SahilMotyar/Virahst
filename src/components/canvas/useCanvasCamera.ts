"use client";

/**
 * Hand-rolled pan/zoom/momentum camera for the infinite canvas.
 *
 * Performance model (brief §4.7): the live transform lives in a mutable ref and
 * is written directly to the layer's style every frame — React never re-renders
 * on pointermove. The store is touched only when it matters:
 *   • the visible cell range changes (→ items mount/unmount), or
 *   • the zoom scale changes (→ throttled readout update).
 * Panning within the same cell range triggers zero React renders.
 *
 * Pointer Events cover mouse + touch (incl. two-finger pinch); wheel handles
 * trackpad pan and ctrl/⌘ zoom.
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
  OVERSCAN,
} from "@/config";
import { useCameraStore, type CellRange } from "@/store/cameraStore";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Min velocity (px/frame) below which momentum stops. */
const MIN_VELOCITY = 0.05;
/** How often (ms) to push the scale readout into the store. */
const SCALE_INTERVAL = 60;

interface Cam {
  x: number;
  y: number;
  scale: number;
}

export function useCanvasCamera(
  containerRef: RefObject<HTMLDivElement | null>,
  layerRef: RefObject<HTMLDivElement | null>,
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

    // --- live transform application ------------------------------------
    const apply = () => {
      const { x, y, scale } = cam.current;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    };

    // --- sync visible cell range (only on change → rare re-render) ------
    let lastRange: CellRange = { minCol: 0, maxCol: -1, minRow: 0, maxRow: -1 };
    const syncRange = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      const { x, y, scale } = cam.current;
      const leftWorld = (0 - x) / scale - OVERSCAN;
      const topWorld = (0 - y) / scale - OVERSCAN;
      const rightWorld = (w - x) / scale + OVERSCAN;
      const bottomWorld = (h - y) / scale + OVERSCAN;
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

    // --- initial framing: centre the hero hole -------------------------
    if (!initialised.current) {
      const rect = container.getBoundingClientRect();
      const scale = INITIAL_SCALE;
      cam.current = {
        scale,
        x: rect.width / 2 - HERO_CENTER.x * scale,
        y: rect.height / 2 - HERO_CENTER.y * scale,
      };
      initialised.current = true;
    }
    apply();
    syncRange();
    syncScale(true);

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
      apply();
      syncRange();
      if (Math.hypot(velocity.x, velocity.y) > MIN_VELOCITY) {
        momentumRAF = requestAnimationFrame(momentumStep);
      } else {
        momentumRAF = 0;
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
      apply();
      syncRange();
      syncScale();
    };

    // --- pointer (pan + pinch) -----------------------------------------
    const pointers = new Map<number, { x: number; y: number }>();
    let dragging = false;
    let last = { x: 0, y: 0, t: 0 };
    let pinchDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      stopMomentum();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      container.setPointerCapture(e.pointerId);
      if (pointers.size === 1) {
        dragging = true;
        last = { x: e.clientX, y: e.clientY, t: performance.now() };
        velocity.x = 0;
        velocity.y = 0;
        container.style.cursor = "grabbing";
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
      apply();
      syncRange();
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
          // Flick → momentum (skipped under reduced-motion).
          if (
            !reducedMotion &&
            Math.hypot(velocity.x, velocity.y) > MIN_VELOCITY
          ) {
            stopMomentum();
            momentumRAF = requestAnimationFrame(momentumStep);
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
      const rect = container.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom on macOS arrives as ctrl+wheel.
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
      } else {
        cam.current.x -= e.deltaX;
        cam.current.y -= e.deltaY;
        apply();
        syncRange();
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
        const rect = container.getBoundingClientRect();
        zoomAt(rect.width / 2, rect.height / 2, factor);
        syncScale(true);
      },
    });

    // --- re-frame / re-measure on resize -------------------------------
    const onResize = () => {
      apply();
      syncRange();
    };
    window.addEventListener("resize", onResize);

    return () => {
      stopMomentum();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", endPointer);
      container.removeEventListener("pointercancel", endPointer);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      registerControls(null);
    };
  }, [containerRef, layerRef, setScale, setRange, registerControls]);
}
