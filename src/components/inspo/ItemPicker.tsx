"use client";

/**
 * Overlay for choosing *which* museum items to drop onto the board — the
 * targeted counterpart to "Load all items". Lives outside Excalidraw's own UI
 * (a floating panel), searchable and multi-select, so a session can pull in
 * just the handful of items a given train of thought needs.
 */

import { useMemo, useState } from "react";
import { items, type VintageItem } from "@/data/items";

/** Fields a search query is matched against, lower-cased once per item. */
function haystack(item: VintageItem): string {
  return [
    item.name,
    item.nameEn,
    item.brand,
    item.brandEn,
    item.category,
    item.era,
    item.region,
  ]
    .join(" ")
    .toLowerCase();
}

const INDEX = items.map((item) => ({ item, hay: haystack(item) }));

export function ItemPicker({
  onAdd,
  onClose,
}: {
  /** Called with the chosen slugs when the user confirms. */
  onAdd: (slugs: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return INDEX.filter((e) => e.hay.includes(q)).map((e) => e.item);
  }, [query]);

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  /** Select-all acts on the current filter, so a search narrows what it adds. */
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((i) => selected.has(i.slug));
  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((i) => next.delete(i.slug));
      else filtered.forEach((i) => next.add(i.slug));
      return next;
    });

  const confirm = () => {
    if (selected.size === 0) return;
    // Preserve data-file order rather than click order, so the resulting grid
    // matches "Load all" for the same items.
    onAdd(items.filter((i) => selected.has(i.slug)).map((i) => i.slug));
    onClose();
  };

  return (
    <div className="pointer-events-auto flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-[18px] border border-black/5 bg-bg/97 shadow-[0_1px_2px_rgba(0,0,0,.05),0_16px_40px_rgba(0,0,0,.16)] backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
        <span className="text-sm font-semibold text-ink">Add from museum</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close item picker"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-lg leading-none text-ink-2 transition-colors hover:bg-black/4 hover:text-ink"
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          autoFocus
          className="min-h-11 w-full rounded-full border border-black/10 bg-white/70 px-3.5 text-base text-ink placeholder:text-ink-2 focus:border-accent-ink/50"
        />
      </div>

      {/* Select-all / count row */}
      <div className="flex items-center justify-between px-4 py-2 text-[12px] text-ink-2">
        <button
          type="button"
          onClick={toggleAllFiltered}
          disabled={filtered.length === 0}
          className="min-h-11 font-medium text-accent-ink transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {allFilteredSelected ? "Clear these" : `Select all ${filtered.length}`}
        </button>
        <span>{selected.size} selected</span>
      </div>

      {/* List */}
      <ul className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
        {filtered.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-ink-2">
            No items match “{query}”.
          </li>
        ) : (
          filtered.map((item) => {
            const on = selected.has(item.slug);
            return (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => toggle(item.slug)}
                  aria-pressed={on}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    on ? "bg-accent/10" : "hover:bg-black/4"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border text-[10px] leading-none ${
                      on
                        ? "border-accent-ink bg-accent-ink text-bg"
                        : "border-black/35 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] text-ink">
                      {item.name}
                    </span>
                    <span className="block truncate text-[11px] text-ink-2">
                      {item.nameEn} · {item.category.replace("-", " ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-black/5 px-3 py-3">
        <button
          type="button"
          onClick={() => setSelected(new Set())}
          disabled={selected.size === 0}
          className="min-h-11 rounded-full px-3 text-sm font-medium text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={selected.size === 0}
          className="ml-auto min-h-11 rounded-full bg-accent-ink px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Add {selected.size || ""} {selected.size === 1 ? "item" : "items"}
        </button>
      </div>
    </div>
  );
}
