#!/usr/bin/env node
/**
 * Virasat asset fetcher
 * ---------------------
 * Downloads every archive image listed in data/virasat-sources.json from
 * Wikimedia Commons and saves it as public/items/<slug>.png
 *
 * Usage (from the project root):
 *   node scripts/fetch-assets.mjs            # download missing images
 *   node scripts/fetch-assets.mjs --force    # re-download everything
 *   node scripts/fetch-assets.mjs --width=1600
 *
 * Needs Node 18+ (built-in fetch). If `sharp` is installed (Next.js usually
 * installs it), images are converted to real PNG and resized. Without sharp the
 * original bytes are saved under the .png name, which browsers still display.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = path.join(root, "data", "virasat-sources.json");
const outDir = path.join(root, "public", "items");

const args = process.argv.slice(2);
const force = args.includes("--force");
const widthArg = args.find((a) => a.startsWith("--width="));
const WIDTH = widthArg ? Number(widthArg.split("=")[1]) : 1200;
const UA =
  "VirasatAssetFetcher/1.0 (personal non-commercial museum site; Node.js fetch)";

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn(
    "! sharp not found - saving original bytes with a .png name.\n" +
      "  For true PNGs run `npm i -D sharp` and then `node scripts/fetch-assets.mjs --force`.\n"
  );
}

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
      const type = res.headers.get("content-type") || "";
      if (!type.startsWith("image/")) throw Object.assign(new Error(`not an image (${type})`), { fatal: true });
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (err.fatal || i === tries) throw err;
      await sleep(6000 * i);
    }
  }
}

const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
await mkdir(outDir, { recursive: true });

let ok = 0, skipped = 0;
const failed = [];

for (const [i, item] of sources.entries()) {
  const target = path.join(outDir, `${item.slug}.png`);
  const label = `[${String(i + 1).padStart(2)}/${sources.length}] ${item.slug}`;
  if (!force && (await exists(target))) {
    skipped++;
    continue;
  }
  // Special:FilePath redirects to a resized copy (or the original if smaller).
  const url =
    "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(item.commonsFile.replace(/^File:/, "")) +
    `?width=${WIDTH}`;
  try {
    let buf = await download(url);
    if (sharp) {
      buf = await sharp(buf)
        .resize({ width: WIDTH, height: WIDTH, fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
    }
    await writeFile(target, buf);
    ok++;
    console.log(`✓ ${label}  (${Math.round(buf.length / 1024)} KB)`);
  } catch (err) {
    failed.push(item.slug);
    console.log(`✗ ${label}  ${err.message}`);
  }
  await sleep(2500); // be polite to Wikimedia
}

console.log(`\nDone: ${ok} downloaded, ${skipped} already present, ${failed.length} failed.`);
if (failed.length) {
  console.log("Failed slugs (re-run the script to retry):", failed.join(", "));
  process.exitCode = 1;
} else {
  console.log("Now set config.flags.ASSETS_PRESENT = true in src/config.ts");
}
