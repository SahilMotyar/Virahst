/**
 * Cell ⇄ world helpers and the deterministic mapping from grid cells to items.
 * A "cell" is an integer (col, row); its world position is the cell origin plus
 * a small seeded jitter so the field reads as scattered, not mechanical.
 */

import {
  CELL_W,
  CELL_H,
  ITEM_W,
  ITEM_H,
  JITTER,
  HERO_HOLE,
  GRID_BOUNDS,
  config,
} from "@/config";
import { hashStringToInt, seededJitter, mulberry32 } from "@/lib/seededRandom";
import { items } from "@/data/items";

export interface WorldPos {
  x: number;
  y: number;
}

// Offsets that centre an item's footprint inside its cell, so every column and
// row lines up as a clean matrix regardless of jitter.
const OFFSET_X = (CELL_W - ITEM_W) / 2;
const OFFSET_Y = (CELL_H - ITEM_H) / 2;

/** World position (top-left of the item's footprint) for a grid cell. */
export function cellToWorld(col: number, row: number): WorldPos {
  return {
    x: col * CELL_W + OFFSET_X + (JITTER ? seededJitter(`${col}:${row}:x`, JITTER) : 0),
    y: row * CELL_H + OFFSET_Y + (JITTER ? seededJitter(`${col}:${row}:y`, JITTER) : 0),
  };
}

/** True when a cell falls inside the reserved hero rectangle (no item there). */
export function isHeroCell(col: number, row: number): boolean {
  return (
    col >= HERO_HOLE.minCol &&
    col <= HERO_HOLE.maxCol &&
    row >= HERO_HOLE.minRow &&
    row <= HERO_HOLE.maxRow
  );
}

/**
 * Finite mode: every item gets exactly one cell — no repeats. Cells inside
 * GRID_BOUNDS (hero hole excluded) are ranked by distance from the hero
 * centre so the gallery fills outward from the title; items are assigned in
 * a seeded-shuffled order so the data file's ordering doesn't cluster brands.
 * Everything is deterministic, so SSR and client always agree. If there are
 * more items than cells, the surplus items simply don't render (widen
 * GRID_BOUNDS in config to fit them).
 */
const finiteCellToIndex: Map<string, number> = (() => {
  const map = new Map<string, number>();
  if (config.flags.INFINITE_WRAP) return map;

  const cells: { col: number; row: number }[] = [];
  for (let row = GRID_BOUNDS.minRow; row <= GRID_BOUNDS.maxRow; row++) {
    for (let col = GRID_BOUNDS.minCol; col <= GRID_BOUNDS.maxCol; col++) {
      if (!isHeroCell(col, row)) cells.push({ col, row });
    }
  }
  const cx = (HERO_HOLE.minCol + HERO_HOLE.maxCol) / 2;
  const cy = (HERO_HOLE.minRow + HERO_HOLE.maxRow) / 2;
  cells.sort((a, b) => {
    const da = Math.hypot((a.col - cx) * CELL_W, (a.row - cy) * CELL_H);
    const db = Math.hypot((b.col - cx) * CELL_W, (b.row - cy) * CELL_H);
    return da - db || a.row - b.row || a.col - b.col;
  });

  const perm = items.map((_, i) => i);
  const rand = mulberry32(hashStringToInt("virasat:layout:v1"));
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }

  const n = Math.min(items.length, cells.length);
  for (let k = 0; k < n; k++) {
    map.set(`${cells[k].col}:${cells[k].row}`, perm[k]);
  }
  return map;
})();

/** True when a cell should render an item (has an assignment when finite). */
export function isRenderableCell(col: number, row: number): boolean {
  if (isHeroCell(col, row)) return false;
  if (!config.flags.INFINITE_WRAP) {
    return finiteCellToIndex.has(`${col}:${row}`);
  }
  return true;
}

/**
 * Deterministic item index for a cell. Finite mode reads the one-to-one
 * assignment; wrap mode hashes (col,row) so the endless field repeats
 * without an obvious period — see brief §4.5.
 */
export function itemIndexForCell(col: number, row: number, len: number): number {
  if (len <= 0) return 0;
  if (!config.flags.INFINITE_WRAP) {
    return finiteCellToIndex.get(`${col}:${row}`) ?? 0;
  }
  // Offset negatives into a positive domain before hashing.
  const key = `${col + 100000}:${row + 100000}`;
  return hashStringToInt(key) % len;
}
