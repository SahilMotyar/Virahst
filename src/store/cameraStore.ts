/**
 * Camera-derived state that React needs.
 *
 * The *live* transform during a drag/flick is owned by useCanvasCamera and
 * written straight to the DOM via a ref — React never renders per frame. This
 * store holds only two things React actually cares about:
 *   • `range`  — the visible cell range; changes only when items must mount or
 *                unmount, so Canvas re-renders rarely (not on every pan frame).
 *   • `scale`  — for the zoom-percentage readout (committed on a throttle).
 * It also exposes imperative zoom controls for the fixed ZoomControls overlay.
 */

import { create } from "zustand";
import { INITIAL_SCALE } from "@/config";

export interface CameraControls {
  /** Zoom by a multiplicative factor, anchored at the viewport centre. */
  zoomByCenter: (factor: number) => void;
  /**
   * Centre the viewport on a world-space point. Used when keyboard focus
   * lands on an item that is currently off-screen — WCAG 2.4.11 wants the
   * focused element actually visible, and on a pannable canvas that means
   * moving the camera to it.
   */
  panToWorld: (x: number, y: number) => void;
}

export interface CellRange {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
}

/** Empty range (min > max) so nothing mounts until the hook measures + sets it. */
const EMPTY_RANGE: CellRange = { minCol: 0, maxCol: -1, minRow: 0, maxRow: -1 };

interface CameraState {
  scale: number;
  range: CellRange;
  controls: CameraControls | null;
  setScale: (scale: number) => void;
  setRange: (range: CellRange) => void;
  registerControls: (controls: CameraControls | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  scale: INITIAL_SCALE,
  range: EMPTY_RANGE,
  controls: null,
  setScale: (scale) => set({ scale }),
  setRange: (range) => set({ range }),
  registerControls: (controls) => set({ controls }),
}));
