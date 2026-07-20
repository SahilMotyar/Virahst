/**
 * Copies Excalidraw's self-hosted fonts into public/fonts.
 *
 * Excalidraw loads its hand-drawn faces at runtime from
 * `window.EXCALIDRAW_ASSET_PATH + "fonts/..."` (set to "/" in InspoBoard), so
 * the files have to be served by us — the package does not ship them to the
 * browser on its own. Runs from `predev`/`prebuild`; public/fonts is
 * gitignored because it is a build artefact of node_modules.
 *
 * Node (not `cp -r`) because npm scripts run under cmd.exe on Windows.
 */

import { cp, mkdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/@excalidraw/excalidraw/dist/prod/fonts");
const dest = resolve(root, "public/fonts");

try {
  await access(src);
} catch {
  // Dependency not installed yet (e.g. a bare checkout). Not fatal: the board
  // still renders, just with fallback system fonts.
  console.warn("[excalidraw-fonts] %s not found — skipping copy.", src);
  process.exit(0);
}

await mkdir(dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log("[excalidraw-fonts] copied fonts → public/fonts");
