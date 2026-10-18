"use client";

/**
 * The inspo board — a personal, free-form Excalidraw canvas for curatorial
 * thinking: pull items off the museum canvas, arrow them together, scribble.
 * Not visitor-facing.
 *
 * Deliberately *not* built on the hand-rolled pan/zoom engine in
 * components/canvas — Excalidraw brings its own rendering model, and arrows,
 * freehand and text for free.
 *
 * Must be rendered through next/dynamic with `ssr: false` (see app/inspo/page)
 * — Excalidraw touches window/document at module scope.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Excalidraw,
  convertToExcalidrawElements,
  CaptureUpdateAction,
  getCommonBounds,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type {
  AppState,
  BinaryFileData,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  FileId,
} from "@excalidraw/excalidraw/element/types";
import { items, getItemBySlug, type VintageItem } from "@/data/items";
import { useInspoStore } from "@/store/inspoStore";
import { buildItemElements, loadItemImage } from "./itemElements";
import { loadBoard, saveBoard } from "./persistence";
import { ItemPicker } from "./ItemPicker";

// Excalidraw fetches its hand-drawn fonts from this base at runtime; the files
// are copied into public/fonts by the predev/prebuild script. Module scope so
// it's set before the library's font loading kicks in.
if (typeof window !== "undefined") {
  (window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH =
    "/";
}

/** Debounce for persisting scene changes. */
const SAVE_DEBOUNCE_MS = 500;
/** Vertical breathing room between an existing layout and a new batch. */
const BATCH_GAP = 96;

/**
 * Where the next batch should start: below everything already on the board, so
 * repeated sends stack up instead of scattering over existing work.
 */
function nextOrigin(elements: readonly ExcalidrawElement[]): [number, number] {
  if (elements.length === 0) return [0, 0];
  const [minX, , , maxY] = getCommonBounds(elements);
  return [minX, maxY + BATCH_GAP];
}

/**
 * Excalidraw commits `initialData` asynchronously, so a queue drain that fires
 * straight after mount can observe an *empty* scene — and since updateScene
 * replaces the element list wholesale, appending to that empty base would wipe
 * the restored board. Wait for the restore to land before touching the scene.
 * Resolves immediately when there was nothing to restore.
 */
function waitForRestore(
  api: ExcalidrawImperativeAPI,
  expected: number,
  timeoutMs = 3000,
): Promise<void> {
  if (expected === 0) return Promise.resolve();
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      if (
        api.getSceneElements().length >= expected ||
        Date.now() - startedAt > timeoutMs
      ) {
        resolve();
      } else {
        setTimeout(tick, 50);
      }
    };
    tick();
  });
}

export default function InspoBoard() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  /** False until any saved board has been committed to the scene — see
   *  waitForRestore. Gates the controls that read and rewrite the scene. */
  const [restored, setRestored] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Read once, on the client only (this component never server-renders).
  const [saved] = useState(loadBoard);

  const initialData = useMemo(
    () => ({
      elements: saved?.elements ?? [],
      appState: {
        // Match the museum's paper cream unless a saved board says otherwise.
        viewBackgroundColor: "#fdfbf6",
        ...(saved?.appState ?? {}),
      },
      files: saved?.files ?? {},
      scrollToContent: false,
    }),
    [saved],
  );

  // --- Persistence ------------------------------------------------------
  const pending = useRef<{
    elements: readonly ExcalidrawElement[];
    appState: AppState;
    files: BinaryFiles;
  } | null>(null);
  const timer = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    saveBoard(p.elements, p.appState, p.files);
  }, []);

  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      pending.current = { elements, appState, files };
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  // Don't lose the last few hundred ms of work on close or on navigating back
  // to the museum.
  useEffect(() => {
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [flush]);

  // --- Placing items ----------------------------------------------------
  const addItems = useCallback(
    async (target: ExcalidrawImperativeAPI, slugs: string[]) => {
      const batch = slugs
        .map(getItemBySlug)
        .filter((i): i is VintageItem => Boolean(i));
      if (batch.length === 0) return;

      const existing = target.getSceneElements();
      const [originX, originY] = nextOrigin(existing);
      const { skeletons, files } = await buildItemElements(
        batch,
        originX,
        originY,
      );

      // Files must be registered before the elements referencing them land.
      if (files.length > 0) target.addFiles(files);
      const added = convertToExcalidrawElements(skeletons);
      target.updateScene({
        elements: [...existing, ...added],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      target.scrollToContent(added, { fitToContent: true, animate: true });
    },
    [],
  );

  // Once the API exists: re-register museum images the saved scene refers to
  // (their bytes were never persisted), then drain anything the museum queued.
  useEffect(() => {
    if (!api) return;
    let cancelled = false;

    void (async () => {
      await waitForRestore(api, saved?.elements.length ?? 0);
      if (cancelled) return;
      setRestored(true);

      const itemFiles = saved?.itemFiles;
      if (itemFiles) {
        const restored = await Promise.all(
          Object.entries(itemFiles).map(async ([fileId, slug]) => {
            const item = getItemBySlug(slug);
            const image = item ? await loadItemImage(item) : null;
            if (!image) return null;
            return {
              id: fileId as FileId,
              dataURL: image.dataURL as BinaryFileData["dataURL"],
              mimeType: image.mimeType,
              created: Date.now(),
            } satisfies BinaryFileData;
          }),
        );
        const usable = restored.filter((f): f is BinaryFileData => f !== null);
        if (!cancelled && usable.length > 0) api.addFiles(usable);
      }

      const queued = useInspoStore.getState().drain();
      if (!cancelled && queued.length > 0) await addItems(api, queued);
    })();

    return () => {
      cancelled = true;
    };
  }, [api, saved, addItems]);

  /** Add a chosen set of items (from the picker) without a confirm — the user
   *  hand-picked them, so scattering onto existing work isn't a risk here. */
  const addSlugs = useCallback(
    (slugs: string[]) => {
      if (!api || !restored) return;
      void addItems(api, slugs);
    },
    [api, restored, addItems],
  );

  const loadAll = useCallback(() => {
    if (!api || !restored) return;
    if (
      api.getSceneElements().length > 0 &&
      !window.confirm(
        `Add all ${items.length} items below what's already on the board?`,
      )
    ) {
      return;
    }
    void addItems(
      api,
      items.map((i) => i.slug),
    );
  }, [api, restored, addItems]);

  return (
    <div className="inspo-shell fixed inset-0">
      <Excalidraw
        excalidrawAPI={setApi}
        initialData={initialData}
        onChange={handleChange}
        name="विरासत · inspo"
      />

      {/* Board chrome. Sits below Excalidraw's own top-right island; wrapper is
          click-through so it never steals canvas drags. */}
      {/* Below `sm` this sits bottom-left, lifted clear of the music widget:
          Excalidraw's mobile layout puts its own toolbar across the top and a
          menu column down the right, and the chrome used to land on both.
          col-reverse so the picker panel opens upward into free space rather
          than downward off the bottom of the screen. */}
      <div className="pointer-events-none absolute bottom-36 left-3 z-30 flex flex-col-reverse items-start gap-2 sm:bottom-auto sm:left-auto sm:right-3 sm:top-16 sm:flex-col sm:items-end">
        <Link
          href="/"
          className="pointer-events-auto flex min-h-11 items-center rounded-full bg-white/95 px-4 text-sm font-medium text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_rgba(0,0,0,.10)] backdrop-blur transition-colors hover:text-ink"
        >
          ← Museum
        </Link>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          disabled={!api || !restored}
          aria-expanded={pickerOpen}
          className="pointer-events-auto flex min-h-11 items-center rounded-full bg-white/95 px-4 text-sm font-medium text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_rgba(0,0,0,.10)] backdrop-blur transition-colors hover:text-ink disabled:opacity-50"
        >
          Add items…
        </button>
        <button
          type="button"
          onClick={loadAll}
          disabled={!api || !restored}
          className="pointer-events-auto flex min-h-11 items-center rounded-full bg-accent/10 px-4 text-sm font-medium text-accent-ink shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_rgba(0,0,0,.10)] backdrop-blur transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          Load all items
        </button>

        {pickerOpen && (
          <ItemPicker onAdd={addSlugs} onClose={() => setPickerOpen(false)} />
        )}
      </div>
    </div>
  );
}
