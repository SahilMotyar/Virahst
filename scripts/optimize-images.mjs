#!/usr/bin/env node
/**
 * Builds the WebP files the site serves from each item's master image in
 * public/items/. Two kinds of master are supported:
 *
 *   <slug>.png   (from `npm run fetch:items`) → thumb/<slug>.webp (400px)
 *                                              + <slug>.webp (1000px, detail view)
 *   <slug>.webp  (added by hand, no .png)     → thumb/<slug>.webp (400px) only;
 *                                              the .webp itself is the detail image
 *
 *   npm run thumbs            # only missing/outdated files
 *   npm run thumbs -- --force
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
/** Hand-added WebP masters wider than this are flagged (see CONTRIBUTING.md). */
const MAX_MASTER_WIDTH = 1600;
await mkdir(thumbDir, { recursive: true });

const mtime = async (p) => (await stat(p).catch(() => null))?.mtimeMs ?? 0;
const files = await readdir(dir);
const pngSlugs = new Set(files.filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)));
const webpSlugs = files.filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5));

const jobs = [
  ...[...pngSlugs].map((slug) => ({ src: `${slug}.png`, slug, outputs: ["thumb", "full"] })),
  ...webpSlugs
    .filter((slug) => !pngSlugs.has(slug))
    .map((slug) => ({ src: `${slug}.webp`, slug, outputs: ["thumb"] })),
];

const targets = {
  thumb: (slug) => [path.join(thumbDir, `${slug}.webp`), 400, 78],
  full: (slug) => [path.join(dir, `${slug}.webp`), 1000, 82],
};

let n = 0;
for (const { src, slug, outputs } of jobs) {
  const srcPath = path.join(dir, src);
  const srcTime = await mtime(srcPath);
  if (src.endsWith(".webp")) {
    const { width } = await sharp(srcPath).metadata();
    if (width > MAX_MASTER_WIDTH) {
      console.warn(`! ${src} is ${width}px wide — please keep images ≤ ${MAX_MASTER_WIDTH}px.`);
    }
  }
  for (const key of outputs) {
    const [out, width, quality] = targets[key](slug);
    if (!force && (await mtime(out)) > srcTime) continue;
    await sharp(srcPath).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(out);
    n++;
  }
}
console.log(`Wrote ${n} WebP files.`);
