"use client";

/**
 * The pan/zoom surface. Owns the camera hook (which writes the live transform
 * straight to the layer ref) and renders the virtualized field of CanvasItems
 * plus the hero block inside the same transformed layer.
 */

import { useEffect, useRef, useState } from "react";
import { useCameraStore } from "@/store/cameraStore";
import { useCanvasCamera } from "@/components/canvas/useCanvasCamera";
import { useVirtualization } from "@/components/canvas/useVirtualization";
import { CanvasItem } from "@/components/canvas/CanvasItem";
import { HeroBlock } from "@/components/canvas/HeroBlock";
import { INITIAL_SCALE } from "@/config";

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useCanvasCamera(containerRef, layerRef);

  // Track container size for virtualization bounds.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setViewport({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Committed (throttled) camera drives which cells are mounted.
  const x = useCameraStore((s) => s.x);
  const y = useCameraStore((s) => s.y);
  const scale = useCameraStore((s) => s.scale);
  const visible = useVirtualization({ x, y, scale }, viewport);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden bg-canvas"
      aria-label="Vintage archive canvas. Drag to pan, scroll or pinch to zoom."
      role="application"
    >
      <div
        ref={layerRef}
        className="absolute left-0 top-0 h-0 w-0 will-change-transform"
        style={{
          transformOrigin: "0 0",
          transform: `translate3d(0px, 0px, 0) scale(${INITIAL_SCALE})`,
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
