"use client";

/**
 * The browse view (brief §5.1, Phase 3). Holds the search / filter / sort state,
 * derives the visible list from the same `items` the canvas uses, and renders
 * the responsive card grid. All filtering is client-side over the static data.
 */

import { useMemo, useState } from "react";
import { items } from "@/data/items";
import { ItemCard } from "@/components/collection/ItemCard";
import { Filters, type FilterState } from "@/components/collection/Filters";
import { priceMatches } from "@/components/collection/filterOptions";

const INITIAL: FilterState = {
  query: "",
  category: "all",
  format: "all",
  price: "all",
  sort: "newest",
};

export function CollectionBrowser() {
  const [state, setState] = useState<FilterState>(INITIAL);
  const onChange = (patch: Partial<FilterState>) =>
    setState((s) => ({ ...s, ...patch }));

  const filtered = useMemo(() => {
    const q = state.query.trim().toLowerCase();
    // Tag each item with its original index so "newest" = last-added-first.
    const result = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (state.category !== "all" && item.category !== state.category)
          return false;
        if (state.format !== "all" && item.advertising.medium !== state.format)
          return false;
        if (!priceMatches(state.price, item)) return false;
        if (q) {
          const hay = `${item.name} ${item.nameEn} ${item.brand} ${item.brandEn} ${item.category} ${item.region}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    result.sort((a, b) => {
      if (state.sort === "loved") return b.item.favorites - a.item.favorites;
      if (state.sort === "az") return a.item.nameEn.localeCompare(b.item.nameEn);
      return b.index - a.index; // newest
    });

    return result.map((r) => r.item);
  }, [state]);

  return (
    <div className="flex flex-col gap-7">
      <Filters state={state} onChange={onChange} />

      <p className="text-sm text-ink-2">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
          <span aria-hidden className="font-display text-4xl text-ink-2/50">
            वि
          </span>
          <p className="text-sm text-ink-2">
            Nothing in the archive matches that.
          </p>
          <button
            type="button"
            onClick={() => setState(INITIAL)}
            className="mt-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-bg transition-colors hover:bg-black"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
