#!/usr/bin/env node
/**
 * Writes src/data/image-manifest.json: the sorted slugs that have a canvas
 * thumbnail (public/items/thumb/<slug>.webp). The site uses it to know which
 * items really have a picture — those are laid out around the centre of the
 * canvas and get an <img>; everything else renders a placeholder, without a
 * request that would only 404.
 *
 * Runs automatically before `dev` and `build`, and at the end of `npm run thumbs`.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const thumbDir = path.join(root, "public", "items", "thumb");
const out = path.join(root, "src", "data", "image-manifest.json");

const slugs = (await readdir(thumbDir).catch(() => []))
  .filter((f) => f.endsWith(".webp"))
  .map((f) => f.slice(0, -5))
  .sort();
const json = JSON.stringify(slugs, null, 2) + "\n";

// Only touch the file when it changes, so dev doesn't hot-reload for nothing.
if ((await readFile(out, "utf8").catch(() => "")) !== json) {
  await writeFile(out, json);
  console.log(`image-manifest: ${slugs.length} items with pictures`);
}
