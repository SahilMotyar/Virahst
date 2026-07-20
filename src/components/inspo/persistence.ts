/**
 * localStorage persistence for the inspo board.
 *
 * Museum images are *not* stored as base64. They're already served from
 * /items/<slug>.png, so we keep a fileId → slug map and re-fetch on load —
 * which keeps the saved payload small enough that a board full of items stays
 * far from localStorage's ~5–10MB ceiling. Images pasted or dragged in from
 * outside the app have no slug to re-derive from, so those are stored inline.
 *
 * If the inline files ever do become the constraint, IndexedDB is the upgrade
 * path (Excalidraw's own app uses it); not worth the complexity yet.
 */

import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { slugFromFileId } from "./itemElements";

const KEY = "virasat:inspo:board:v1";

export interface SavedBoard {
  version: 1;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  /** fileId → item slug, for images we can re-fetch instead of storing. */
  itemFiles: Record<string, string>;
  /** Files with no museum origin (pasted/dropped), stored as-is. */
  files: BinaryFiles;
}

/**
 * Only the appState worth restoring. A whitelist rather than the whole object:
 * appState carries non-serialisable and per-session junk (collaborators Map,
 * viewport size, open dialogs, current selection) that either breaks
 * JSON.stringify or restores in a confusing state.
 */
function pickAppState(appState: AppState): Partial<AppState> {
  return {
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    zoom: appState.zoom,
    viewBackgroundColor: appState.viewBackgroundColor,
    gridModeEnabled: appState.gridModeEnabled,
    currentItemStrokeColor: appState.currentItemStrokeColor,
    currentItemBackgroundColor: appState.currentItemBackgroundColor,
    currentItemFontFamily: appState.currentItemFontFamily,
    currentItemStrokeWidth: appState.currentItemStrokeWidth,
  };
}

export function saveBoard(
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
): void {
  // Deleted elements are kept in the scene for undo; there's no reason to
  // carry that tombstone history across reloads.
  const live = elements.filter((el) => !el.isDeleted);

  // Drop files no live element references, so deleting an image actually
  // reclaims its bytes instead of leaving them in storage forever.
  const referenced = new Set<string>(
    live.flatMap((el) => (el.type === "image" && el.fileId ? [el.fileId] : [])),
  );

  const itemFiles: Record<string, string> = {};
  const inlineFiles: BinaryFiles = {};
  for (const [fileId, file] of Object.entries(files)) {
    if (!referenced.has(fileId)) continue;
    const slug = slugFromFileId(fileId);
    if (slug) itemFiles[fileId] = slug;
    else inlineFiles[fileId] = file;
  }

  const payload: SavedBoard = {
    version: 1,
    elements: live,
    appState: pickAppState(appState),
    itemFiles,
    files: inlineFiles,
  };

  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (err) {
    // Almost certainly QuotaExceededError from inline (pasted) images. Warn
    // rather than throw: losing the save is better than breaking the board.
    console.warn("[inspo] could not save board — storage full?", err);
  }
}

export function loadBoard(): SavedBoard | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedBoard;
    if (parsed?.version !== 1 || !Array.isArray(parsed.elements)) return null;
    return parsed;
  } catch (err) {
    console.warn("[inspo] could not read saved board", err);
    return null;
  }
}
