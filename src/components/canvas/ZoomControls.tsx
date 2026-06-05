"use client";

/**
 * Fixed bottom-left zoom pill: −  |  +  with a live percentage readout. Buttons
 * zoom toward the viewport centre via the imperative controls registered by
 * useCanvasCamera. The readout reads the throttled scale from the store.
 */

import { useCameraStore } from "@/store/cameraStore";
import { ZOOM_STEP, config } from "@/config";

export function ZoomControls() {
  const scale = useCameraStore((s) => s.scale);
  const controls = useCameraStore((s) => s.controls);
  const percent = Math.round(scale * 100);

  return (
    <div
      className={`fixed left-5 z-30 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_rgba(0,0,0,.06)] backdrop-blur ${
        config.flags.MUSIC_ENABLED ? "bottom-24" : "bottom-5"
      }`}
    >
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => controls?.zoomByCenter(1 / ZOOM_STEP)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-2 transition-colors hover:bg-bg hover:text-ink"
      >
        −
      </button>
      <span className="w-12 text-center text-xs font-medium tabular-nums text-ink-2">
        {percent}%
      </span>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => controls?.zoomByCenter(ZOOM_STEP)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-2 transition-colors hover:bg-bg hover:text-ink"
      >
        +
      </button>
    </div>
  );
}
