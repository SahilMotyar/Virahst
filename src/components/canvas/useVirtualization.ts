"use client";

/**
 * Builds the list of mounted cells for a given visible cell range (computed by
 * useCanvasCamera). Memoised on the range, so it only recomputes when items
 * actually need to mount or unmount — never on plain panning (brief §4.4).
 */

import { useMemo } from "react";
import { cellToWorld, isRenderableCell, itemIndexForCell } from "@/lib/grid";
import { items, type VintageItem } from "@/data/items";
import type { CellRange } from "@/store/cameraStore";

export interface VirtualItem {
  key: string;
  worldX: number;
  worldY: number;
  item: VintageItem;
}

export function useVirtualization(range: CellRange): VirtualItem[] {
  const { minCol, maxCol, minRow, maxRow } = range;

  return useMemo(() => {
    const out: VirtualItem[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!isRenderableCell(col, row)) continue;
        const world = cellToWorld(col, row);
        out.push({
          key: `${col}:${row}`,
          worldX: world.x,
          worldY: world.y,
          item: items[itemIndexForCell(col, row, items.length)],
        });
      }
    }
    return out;
  }, [minCol, maxCol, minRow, maxRow]);
}
