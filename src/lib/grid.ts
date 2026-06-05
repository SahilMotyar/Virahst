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
import { hashStringToInt, seededJitter } from "@/lib/seededRandom";

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

/** True when a cell should render an item (in bounds when finite, not hero). */
export function isRenderableCell(col: number, row: number): boolean {
  if (isHeroCell(col, row)) return false;
  if (!config.flags.INFINITE_WRAP) {
    if (
      col < GRID_BOUNDS.minCol ||
      col > GRID_BOUNDS.maxCol ||
      row < GRID_BOUNDS.minRow ||
      row > GRID_BOUNDS.maxRow
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Deterministic item index for a cell. Hashing (col,row) spreads the list so
 * the wrapped field repeats without an obvious period — see brief §4.5.
 */
export function itemIndexForCell(col: number, row: number, len: number): number {
  if (len <= 0) return 0;
  // Offset negatives into a positive domain before hashing.
  const key = `${col + 100000}:${row + 100000}`;
  return hashStringToInt(key) % len;
}
