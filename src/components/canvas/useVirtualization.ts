"use client";

/**
 * Computes which grid cells are mounted for the current camera + viewport.
 *
 * Only cells whose world rect intersects the viewport (plus OVERSCAN margin) are
 * returned, so the DOM stays small regardless of total item count (brief §4.4).
 * The visible set is memoised on the integer cell range, so panning within the
 * same range doesn't churn the array even as the store commits new x/y/scale.
 */

import { useMemo } from "react";
import { CELL_W, CELL_H, OVERSCAN } from "@/config";
import { cellToWorld, isRenderableCell, itemIndexForCell } from "@/lib/grid";
import { items, type VintageItem } from "@/data/items";

export interface VirtualItem {
  key: string;
  col: number;
  row: number;
  worldX: number;
  worldY: number;
  item: VintageItem;
}

interface Viewport {
  width: number;
  height: number;
}

export function useVirtualization(
  cam: { x: number; y: number; scale: number },
  viewport: Viewport,
): VirtualItem[] {
  const { x, y, scale } = cam;
  const { width, height } = viewport;

  // World-space bounds of the visible region (+ overscan).
  const leftWorld = (0 - x) / scale - OVERSCAN;
  const topWorld = (0 - y) / scale - OVERSCAN;
  const rightWorld = (width - x) / scale + OVERSCAN;
  const bottomWorld = (height - y) / scale + OVERSCAN;

  // Convert to an inclusive integer cell range.
  const minCol = Math.floor(leftWorld / CELL_W);
  const maxCol = Math.ceil(rightWorld / CELL_W);
  const minRow = Math.floor(topWorld / CELL_H);
  const maxRow = Math.ceil(bottomWorld / CELL_H);

  return useMemo(() => {
    if (width === 0 || height === 0) return [];
    const out: VirtualItem[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!isRenderableCell(col, row)) continue;
        const world = cellToWorld(col, row);
        out.push({
          key: `${col}:${row}`,
          col,
          row,
          worldX: world.x,
          worldY: world.y,
          item: items[itemIndexForCell(col, row, items.length)],
        });
      }
    }
    return out;
    // Recompute only when the integer cell range (or viewport) changes.
  }, [minCol, maxCol, minRow, maxRow, width, height]);
}
