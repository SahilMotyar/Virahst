/**
 * Translates museum items into Excalidraw element skeletons.
 *
 * Each item becomes a small cluster: a visual (real image when assets exist,
 * otherwise a tinted rectangle mirroring <Placeholder>), a title, and its
 * advertising tagline as a separate text element — the ad copy is the point of
 * the archive, so it needs to be on the board to riff on, not just the picture.
 *
 * Everything here is pure data; the component does the Excalidraw calls.
 */

import type { BinaryFileData } from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import { config } from "@/config";
import type { VintageItem } from "@/data/items";
import { CATEGORY_GLYPH, placeholderPalette } from "@/components/ui/Placeholder";

/** Card footprint on the board. Roughly ITEM_W:ITEM_H (4:5), scaled up — the
 *  board is read at 100% zoom, unlike the canvas which starts zoomed out. */
const CARD_W = 200;
const CARD_H = 250;
/** Gap between cards, and the vertical room reserved for title + copy. */
const GUTTER = 64;
const TEXT_BLOCK_H = 130;

const CELL_W = CARD_W + GUTTER;
const CELL_H = CARD_H + TEXT_BLOCK_H;

/** Ink colour for the caption text — matches the site's --ink-2 token. */
const INK_2 = "#6b6b66";
/** --accent, deep marigold. Used for the tagline so copy reads as the payload. */
const ACCENT = "#d98a2b";

/** Museum-sourced files are tagged so persistence can re-derive them from a
 *  slug instead of storing base64. Pasted/dropped files keep Excalidraw's ids. */
const FILE_ID_PREFIX = "virasat-item:";

export const museumFileId = (slug: string): FileId =>
  `${FILE_ID_PREFIX}${slug}` as FileId;

/** Slug behind a museum file id, or null for files from outside the app. */
export function slugFromFileId(fileId: string): string | null {
  return fileId.startsWith(FILE_ID_PREFIX)
    ? fileId.slice(FILE_ID_PREFIX.length)
    : null;
}

/** Excalidraw text elements don't wrap, so pre-break the copy by hand. */
function wrapText(text: string, maxChars: number): string {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

/**
 * Fetch an item's PNG as a data URL for `addFiles`. Returns null whenever the
 * image can't be used — flag off, missing file, or a 404 that HTML-errored —
 * which is the caller's cue to fall back to a placeholder rectangle, the same
 * strategy CanvasItem uses with its onError handler.
 */
export async function loadItemImage(
  item: VintageItem,
): Promise<{ dataURL: string; mimeType: BinaryFileData["mimeType"] } | null> {
  if (!config.flags.ASSETS_PRESENT || !item.image) return null;
  try {
    const res = await fetch(item.image);
    if (!res.ok) return null;
    const blob = await res.blob();
    // A dev server can answer a missing asset with an HTML error page.
    if (!blob.type.startsWith("image/")) return null;
    const dataURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { dataURL, mimeType: blob.type as BinaryFileData["mimeType"] };
  } catch {
    return null;
  }
}

/** Grid slot for the nth item: columns ≈ √n, so a dump stays roughly square. */
function slotFor(index: number, total: number, originX: number, originY: number) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  return {
    x: originX + (index % cols) * CELL_W,
    y: originY + Math.floor(index / cols) * CELL_H,
  };
}

/**
 * Build the skeletons for one item at its grid slot. `hasImage` decides between
 * a real image element and the placeholder rectangle; the caller has already
 * registered the file when true.
 */
function skeletonsForItem(
  item: VintageItem,
  index: number,
  total: number,
  originX: number,
  originY: number,
  hasImage: boolean,
): ExcalidrawElementSkeleton[] {
  const { x, y } = slotFor(index, total, originX, originY);
  const { tint, ink } = placeholderPalette(item.id);
  // Clicking through to the museum entry keeps the board a working index.
  const link = `/item/${item.slug}`;
  const out: ExcalidrawElementSkeleton[] = [];

  if (hasImage) {
    out.push({
      type: "image",
      fileId: museumFileId(item.slug),
      x,
      y,
      width: CARD_W,
      height: CARD_H,
      link,
    });
    // An image carries no bound text, so the title becomes its own element.
    out.push({
      type: "text",
      x,
      y: y + CARD_H + 10,
      text: `${item.name} · ${item.nameEn}`,
      fontSize: 20,
      strokeColor: ink,
    });
  } else {
    // Placeholder parity: same seeded tint, glyph and English name as the
    // canvas cutout, expressed as a labelled rectangle.
    out.push({
      type: "rectangle",
      x,
      y,
      width: CARD_W,
      height: CARD_H,
      backgroundColor: tint,
      fillStyle: "solid",
      strokeColor: ink,
      strokeWidth: 1,
      link,
      label: {
        text: `${CATEGORY_GLYPH[item.category]}\n${item.name}\n${item.nameEn}`,
        fontSize: 20,
        strokeColor: ink,
      },
    });
  }

  out.push({
    type: "text",
    x,
    y: y + CARD_H + (hasImage ? 44 : 12),
    text: `“${wrapText(item.advertising.tagline, 30)}”`,
    fontSize: 16,
    strokeColor: ACCENT,
  });
  out.push({
    type: "text",
    x,
    y: y + CARD_H + (hasImage ? 44 : 12) + 24 * (1 + item.advertising.tagline.length / 30),
    text: `${item.brandEn} · ${item.era} · ${item.advertising.medium}`,
    fontSize: 12,
    strokeColor: INK_2,
  });

  return out;
}

export interface BuiltItems {
  skeletons: ExcalidrawElementSkeleton[];
  /** Files to register via addFiles before the elements are added. */
  files: BinaryFileData[];
}

/**
 * Build every element for a batch of items laid out on a grid rooted at
 * (originX, originY). Images are fetched in parallel; any that fail quietly
 * become placeholder cards.
 */
export async function buildItemElements(
  batch: VintageItem[],
  originX: number,
  originY: number,
): Promise<BuiltItems> {
  const images = await Promise.all(batch.map(loadItemImage));
  const files: BinaryFileData[] = [];
  const skeletons: ExcalidrawElementSkeleton[] = [];

  batch.forEach((item, i) => {
    const image = images[i];
    if (image) {
      files.push({
        id: museumFileId(item.slug),
        dataURL: image.dataURL as BinaryFileData["dataURL"],
        mimeType: image.mimeType,
        created: Date.now(),
      });
    }
    skeletons.push(
      ...skeletonsForItem(item, i, batch.length, originX, originY, Boolean(image)),
    );
  });

  return { skeletons, files };
}

export { CELL_H as BOARD_CELL_H };
