"use client";

/**
 * The pan/zoom surface. Owns the camera hook (which writes the live transform
 * straight to the layer ref) and renders the virtualized field of CanvasItems
 * plus the hero block inside the same transformed layer.
 *
 * Canvas re-renders only when the visible cell range changes (items mount /
 * unmount) — never on plain panning, which is handled entirely in the hook.
 *
 * The layer starts hidden and fades in once the camera has centred the hero
 * (`ready`), so the user never sees the un-centred SSR frame at top-left.
 */

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCameraStore } from "@/store/cameraStore";
import { useCanvasCamera } from "@/components/canvas/useCanvasCamera";
import { useVirtualization } from "@/components/canvas/useVirtualization";
import { CanvasItem } from "@/components/canvas/CanvasItem";
import { HeroBlock } from "@/components/canvas/HeroBlock";
import { INITIAL_SCALE } from "@/config";

export function Canvas() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const onReady = useCallback(() => setReady(true), []);
  const onTapItem = useCallback(
    (slug: string) => router.push(`/item/${slug}`),
    [router],
  );
  useCanvasCamera(containerRef, layerRef, onReady, onTapItem);

  const range = useCameraStore((s) => s.range);
  const visible = useVirtualization(range);

  return (
    <div
      ref={containerRef}
      className="canvas-no-select absolute inset-0 touch-none overflow-hidden bg-canvas"
      aria-label="Vintage archive canvas. Drag to pan, scroll or pinch to zoom."
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
        <HeroBlock />
        {visible.map((v) => (
          <CanvasItem
            key={v.key}
            item={v.item}
            worldX={v.worldX}
            worldY={v.worldY}
          />
        ))}
      </div>
    </div>
  );
}
