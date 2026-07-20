/**
 * Renders when an item image is missing/empty (most are, for now). Produces a
 * soft paper rectangle with a seeded tint, a faint category glyph, and the
 * item's English name in small caps — so the canvas reads as a varied field of
 * "products" even with zero real assets.
 */

import type { Category } from "@/data/items";
import { hashStringToInt } from "@/lib/seededRandom";

/** Category shorthand glyph. Also used by the inspo board's fallback cards. */
export const CATEGORY_GLYPH: Record<Category, string> = {
  packaging: "▣",
  matchbox: "✦",
  "film-poster": "▤",
  "print-ad": "❝",
  signboard: "▥",
  electronics: "◉",
  automobile: "◍",
  misc: "✲",
};

/** hsl → #rrggbb. Excalidraw stores element colours as hex, so the inspo
 *  board's placeholder cards need the same palette in that form. */
function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * v)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * Seeded warm palette for an item's placeholder, keyed by id so each cutout
 * reads slightly different but never changes between renders. Shared with the
 * inspo board so its fallback cards match the canvas ones.
 */
export function placeholderPalette(id: string): { tint: string; ink: string } {
  const hue = 28 + (hashStringToInt(id) % 40); // kept in a warm band
  return { tint: hslToHex(hue, 38, 92), ink: hslToHex(hue, 30, 42) };
}

interface PlaceholderProps {
  id: string;
  nameEn: string;
  category: Category;
}

export function Placeholder({ id, nameEn, category }: PlaceholderProps) {
  const { tint, ink } = placeholderPalette(id);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[14px] px-3 text-center"
      style={{ background: tint, color: ink }}
    >
      <span aria-hidden className="text-3xl opacity-50">
        {CATEGORY_GLYPH[category]}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-80">
        {nameEn}
      </span>
    </div>
  );
}
