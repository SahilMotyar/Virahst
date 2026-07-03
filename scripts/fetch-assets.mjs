/**
 * Downloads CANDIDATE images for every item from openly-licensed sources —
 * Wikimedia Commons and Openverse (CC-licensed aggregator) — together with
 * license + attribution metadata, into data/asset-candidates/<slug>/ for
 * manual curation. Nothing lands in /public automatically: image quality and
 * relevance vary too much for that.
 *
 *   npm run fetch:assets                      # every item not yet fetched/curated
 *   npm run fetch:assets -- --only parle-g    # specific slugs (comma-separated)
 *   npm run fetch:assets -- --limit 5         # first N items only
 *   npm run fetch:assets -- --per-source 4    # candidates per source (default 3)
 *   npm run fetch:assets -- --force           # refetch folders that already exist
 *
 * Curation flow: eyeball each folder, pick a winner, save it (cropped/cleaned)
 * as public/items/<slug>.png, then flip config.flags.ASSETS_PRESENT. Keep the
 * folder's manifest.json — it is the attribution/license record for the pick.
 * Items whose public/items/<slug>.png already exists are skipped.
 *
 * ⚠️ Licensing: both sources report a license per image (PD / CC-BY / …).
 * Check it before publishing — brand packaging can carry trademark rights even
 * when a photo of it is freely licensed.
 *
 * Requires Node ≥ 22.6 (uses --experimental-strip-types to import items.ts).
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = join(root, "data", "asset-candidates");
const PUBLIC_ITEMS = join(root, "public", "items");

const USER_AGENT =
  "virasat-asset-fetcher/1.0 (personal archive project; motyarsahil1234@gmail.com)";
/** Hard cap on a single downloaded file. */
const MAX_BYTES = 12 * 1024 * 1024;
/** Politeness pauses (ms). */
const PAUSE_BETWEEN_ITEMS = 700;
const PAUSE_BETWEEN_DOWNLOADS = 250;

// --- CLI args --------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const ONLY = opt("only", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const LIMIT = Number(opt("limit", "0")) || 0;
const PER_SOURCE = Number(opt("per-source", "3")) || 3;
const FORCE = flag("force");

// --- helpers ----------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripHtml = (s) => (s ?? "").replace(/<[^>]*>/g, "").trim();

async function fetchWithTimeout(url, { timeoutMs = 20000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": USER_AGENT, ...headers },
    });
  } finally {
    clearTimeout(t);
  }
}

async function fetchJSON(url) {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/** Download an image URL → { buf, ext } or null (non-image / too big). */
async function downloadImage(url) {
  const res = await fetchWithTimeout(url, { timeoutMs: 30000 });
  if (!res.ok) return null;
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = EXT_BY_TYPE[type];
  if (!ext) return null;
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return null;
  return { buf, ext };
}

// --- sources ------------------------------------------------------------------

/**
 * Wikimedia Commons file search. iiurlwidth gives a ≤1200px thumb URL, which
 * keeps downloads sane even when the original is a 60MP scan.
 */
async function searchCommons(query, n) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${n}` +
    "&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1200";
  const data = await fetchJSON(url);
  const pages = Object.values(data?.query?.pages ?? {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.thumburl) return null;
      // Commons renders PDF/DjVu (scanned books, newspapers) as JPG thumbs;
      // those match on OCR text and are almost never the product shot we want.
      if (!(info.mime ?? "").startsWith("image/")) return null;
      const meta = info.extmetadata ?? {};
      return {
        source: "wikimedia-commons",
        title: p.title,
        downloadUrl: info.thumburl,
        originalUrl: info.url,
        pageUrl: info.descriptionurl ?? null,
        license: stripHtml(meta.LicenseShortName?.value) || "unknown",
        creator: stripHtml(meta.Artist?.value) || null,
      };
    })
    .filter(Boolean)
    .slice(0, n);
}

/**
 * Openverse — CC-licensed image aggregator (Flickr, museums, …). Anonymous
 * access is rate-limited; on 429 we stop querying it for the rest of the run.
 */
let openverseDisabled = false;
async function searchOpenverse(query, n) {
  if (openverseDisabled) return [];
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${n}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
  if (res.status === 429) {
    openverseDisabled = true;
    console.warn("  ⚠ Openverse rate limit hit — continuing with Commons only.");
    return [];
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} for Openverse`);
  const data = await res.json();
  return (data.results ?? []).slice(0, n).map((r) => ({
    source: "openverse",
    title: r.title ?? null,
    downloadUrl: r.url,
    fallbackUrl: r.thumbnail ?? null,
    originalUrl: r.url,
    pageUrl: r.foreign_landing_url ?? null,
    license: `${r.license ?? "unknown"}${r.license_version ? ` ${r.license_version}` : ""}`,
    creator: r.creator ?? null,
  }));
}

// --- query construction ---------------------------------------------------
const CATEGORY_HINT = {
  packaging: "India vintage",
  matchbox: "matchbox label India",
  "film-poster": "film poster India",
  "print-ad": "advertisement India",
  signboard: "sign India",
  electronics: "India vintage",
  automobile: "India",
  misc: "India vintage",
};

function buildQuery(item) {
  // Dedupe words across nameEn + brandEn (brand often repeats in the name).
  const seen = new Set();
  const words = `${item.nameEn} ${item.brandEn}`
    .split(/\s+/)
    .filter((w) => {
      const k = w.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  return `${words.join(" ")} ${CATEGORY_HINT[item.category] ?? "India vintage"}`;
}

// --- main -------------------------------------------------------------------
const { items } = await import(pathToFileURL(join(root, "src", "data", "items.ts")).href).catch(
  (err) => {
    console.error(
      "Could not import src/data/items.ts — run via `npm run fetch:assets`\n" +
        "(needs node --experimental-strip-types).\n",
      err.message,
    );
    process.exit(1);
  },
);

let queue = items;
if (ONLY.length) queue = queue.filter((i) => ONLY.includes(i.slug));
if (LIMIT > 0) queue = queue.slice(0, LIMIT);

console.log(`Fetching candidates for ${queue.length} item(s) → ${OUT_ROOT}\n`);
const summary = { fetched: 0, skipped: 0, empty: [] };

for (const item of queue) {
  const dir = join(OUT_ROOT, item.slug);

  if (existsSync(join(PUBLIC_ITEMS, `${item.slug}.png`))) {
    console.log(`⏭  ${item.slug} — already curated (public/items/${item.slug}.png)`);
    summary.skipped++;
    continue;
  }
  if (!FORCE && existsSync(join(dir, "manifest.json"))) {
    console.log(`⏭  ${item.slug} — candidates already fetched (--force to redo)`);
    summary.skipped++;
    continue;
  }

  const query = buildQuery(item);
  console.log(`▶ ${item.slug} — "${query}"`);

  const results = [];
  for (const [name, search] of [
    ["commons", searchCommons],
    ["openverse", searchOpenverse],
  ]) {
    try {
      let found = await search(query, PER_SOURCE);
      if (!found.length) {
        // One retry with the bare name — hint words can over-constrain.
        found = await search(item.nameEn, PER_SOURCE);
      }
      results.push(...found);
    } catch (err) {
      console.warn(`  ⚠ ${name} query failed: ${err.message}`);
    }
  }

  await mkdir(dir, { recursive: true });
  const candidates = [];
  const counters = {};
  for (const r of results) {
    try {
      let img = await downloadImage(r.downloadUrl);
      if (!img && r.fallbackUrl) img = await downloadImage(r.fallbackUrl);
      if (!img) continue;
      const nth = (counters[r.source] = (counters[r.source] ?? 0) + 1);
      const file = `${r.source}-${nth}.${img.ext}`;
      await writeFile(join(dir, file), img.buf);
      candidates.push({
        file,
        source: r.source,
        title: r.title,
        pageUrl: r.pageUrl,
        license: r.license,
        creator: r.creator,
        originalUrl: r.originalUrl,
      });
      await sleep(PAUSE_BETWEEN_DOWNLOADS);
    } catch (err) {
      console.warn(`  ⚠ download failed (${r.source}): ${err.message}`);
    }
  }

  await writeFile(
    join(dir, "manifest.json"),
    JSON.stringify(
      { slug: item.slug, nameEn: item.nameEn, query, fetchedAt: new Date().toISOString(), candidates },
      null,
      2,
    ),
  );

  console.log(`  ✓ ${candidates.length} candidate(s) saved`);
  summary.fetched++;
  if (!candidates.length) summary.empty.push(item.slug);
  await sleep(PAUSE_BETWEEN_ITEMS);
}

console.log(
  `\nDone. ${summary.fetched} fetched, ${summary.skipped} skipped.` +
    (summary.empty.length
      ? `\nNo candidates found for: ${summary.empty.join(", ")}\n(These need a manual hunt — try archive.org or different search terms.)`
      : ""),
);
