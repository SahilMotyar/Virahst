#!/usr/bin/env node
/**
 * Builds web-sized WebP derivatives of every public/items/<slug>.png:
 *   public/items/thumb/<slug>.webp  — 400px wide, for the canvas + collection cards
 *   public/items/<slug>.webp        — 1000px wide, for the item detail view
 * The PNGs stay as the full-resolution masters (and as the Inspo board source).
 *
 *   npm run optimize:images           # only missing/outdated derivatives
 *   npm run optimize:images -- --force
 *
 * Uses `sharp`, which Next.js already installs.
 */
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "items");
const thumbDir = path.join(dir, "thumb");
const force = process.argv.includes("--force");
await mkdir(thumbDir, { recursive: true });

const mtime = async (p) => (await stat(p).catch(() => null))?.mtimeMs ?? 0;
let n = 0;
for (const f of (await readdir(dir)).filter((f) => f.endsWith(".png"))) {
  const src = path.join(dir, f);
  const slug = f.slice(0, -4);
  const srcTime = await mtime(src);
  for (const [out, width, quality] of [
    [path.join(thumbDir, `${slug}.webp`), 400, 78],
    [path.join(dir, `${slug}.webp`), 1000, 82],
  ]) {
    if (!force && (await mtime(out)) > srcTime) continue;
    await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(out);
    n++;
  }
}
console.log(`Wrote ${n} WebP files.`);
