"use client";

/**
 * Fixed zoom pill: −  |  +  with a live percentage readout. Buttons zoom toward
 * the viewport centre via the imperative controls registered by useCanvasCamera.
 * The readout reads the throttled scale from the store.
 *
 * Sits bottom-right on desktop. On phones it lifts above the MusicBar, which is
 * wide enough at that width to sit directly underneath it otherwise.
 */

import { useCameraStore } from "@/store/cameraStore";
import { ZOOM_STEP, config } from "@/config";

export function ZoomControls() {
  const scale = useCameraStore((s) => s.scale);
  const controls = useCameraStore((s) => s.controls);
  const percent = Math.round(scale * 100);

  return (
    <div
      className={`fixed right-4 z-30 flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_rgba(0,0,0,.08)] backdrop-blur sm:right-5 sm:bottom-5 ${
        // Clear the music widget on narrow screens, where it spans most of the
        // viewport width; without music it can sit at the bottom as usual.
        config.flags.MUSIC_ENABLED ? "bottom-36" : "bottom-4"
      }`}
    >
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => controls?.zoomByCenter(1 / ZOOM_STEP)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink-2 transition-colors hover:bg-bg hover:text-ink"
      >
        −
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="w-12 text-center text-xs font-medium tabular-nums text-ink-2"
      >
        <span className="sr-only">Zoom </span>
        {percent}%
      </span>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => controls?.zoomByCenter(ZOOM_STEP)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink-2 transition-colors hover:bg-bg hover:text-ink"
      >
        +
      </button>
    </div>
  );
}
