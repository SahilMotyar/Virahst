/**
 * Renders when an item image is missing/empty (most are, for now). Produces a
 * soft paper rectangle with a seeded tint, a faint category glyph, and the
 * item's English name in small caps — so the canvas reads as a varied field of
 * "products" even with zero real assets.
 */

import type { Category } from "@/data/items";
import { hashStringToInt } from "@/lib/seededRandom";

const CATEGORY_GLYPH: Record<Category, string> = {
  packaging: "▣",
  matchbox: "✦",
  "film-poster": "▤",
  "print-ad": "❝",
  signboard: "▥",
  electronics: "◉",
  automobile: "◍",
  misc: "✲",
};

interface PlaceholderProps {
  id: string;
  nameEn: string;
  category: Category;
}

export function Placeholder({ id, nameEn, category }: PlaceholderProps) {
  // Seeded warm hue so each cutout reads slightly different.
  const hue = hashStringToInt(id) % 40; // 0–39, kept in a warm band
  const tint = `hsl(${28 + hue}, 38%, 92%)`;
  const ink = `hsl(${28 + hue}, 30%, 42%)`;

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
