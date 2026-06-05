/**
 * Camera state for the infinite canvas.
 *
 * The *live* transform during a drag/flick is owned by useCanvasCamera and
 * written straight to the DOM via a ref (no React render per frame). This store
 * holds the throttled, "committed" camera that drives virtualization recompute
 * and the zoom-percentage readout. It also exposes imperative zoom controls so
 * the fixed ZoomControls overlay (not a child of Canvas) can drive the camera.
 */

import { create } from "zustand";
import { INITIAL_SCALE } from "@/config";

export interface CameraControls {
  /** Zoom by a multiplicative factor, anchored at the viewport centre. */
  zoomByCenter: (factor: number) => void;
}

interface CameraState {
  x: number;
  y: number;
  scale: number;
  /** Set by useCanvasCamera once mounted; null before the canvas exists. */
  controls: CameraControls | null;
  setCamera: (cam: { x: number; y: number; scale: number }) => void;
  registerControls: (controls: CameraControls | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  x: 0,
  y: 0,
  scale: INITIAL_SCALE,
  controls: null,
  setCamera: (cam) => set(cam),
  registerControls: (controls) => set({ controls }),
}));
