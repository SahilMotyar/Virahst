"use client";

/**
 * The collection control bar: a search box, three filter dropdowns
 * (Category / Format / Price), and a sort dropdown — all controlled by
 * CollectionBrowser.
 */

import { Dropdown } from "@/components/collection/Dropdown";
import {
  categoryOptions,
  formatOptions,
  priceOptions,
  sortOptions,
  type SortValue,
} from "@/components/collection/filterOptions";

export interface FilterState {
  query: string;
  category: string;
  format: string;
  price: string;
  sort: SortValue;
}

interface FiltersProps {
  state: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}

export function Filters({ state, onChange }: FiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {/* text-base (16px) is deliberate: iOS zooms the whole page in when a
            focused input's text is smaller than that. */}
        <input
          type="search"
          value={state.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Search products…"
          aria-label="Search products"
          autoComplete="off"
          className="min-h-11 w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-base text-ink transition-colors placeholder:text-ink-2 focus:border-accent-ink/50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Dropdown
          label="Category"
          value={state.category}
          options={categoryOptions}
          onChange={(v) => onChange({ category: v })}
        />
        <Dropdown
          label="Format"
          value={state.format}
          options={formatOptions}
          onChange={(v) => onChange({ format: v })}
        />
        <Dropdown
          label="Price"
          value={state.price}
          options={priceOptions}
          onChange={(v) => onChange({ price: v })}
        />
        <div className="ml-auto">
          <Dropdown
            label="Sort"
            value={state.sort}
            options={sortOptions}
            onChange={(v) => onChange({ sort: v as SortValue })}
          />
        </div>
      </div>
    </div>
  );
}
