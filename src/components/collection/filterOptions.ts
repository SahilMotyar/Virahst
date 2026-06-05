/**
 * Option lists and matching logic for the collection filters — shared between
 * the Filters bar (which renders them) and CollectionBrowser (which applies
 * them) so the two never drift.
 */

import type { DropdownOption } from "@/components/collection/Dropdown";
import type { Category, Medium, VintageItem } from "@/data/items";

const CATEGORY_LABELS: Record<Category, string> = {
  packaging: "Packaging",
  matchbox: "Matchbox",
  "film-poster": "Film poster",
  "print-ad": "Print ad",
  signboard: "Signboard",
  electronics: "Electronics",
  automobile: "Automobile",
  misc: "Misc",
};

const MEDIUM_LABELS: Record<Medium, string> = {
  print: "Print",
  radio: "Radio",
  hoarding: "Hoarding",
  television: "Television",
  cinema: "Cinema",
};

export const categoryOptions: DropdownOption[] = [
  { label: "All", value: "all" },
  ...(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => ({
    label: CATEGORY_LABELS[c],
    value: c,
  })),
];

export const formatOptions: DropdownOption[] = [
  { label: "All", value: "all" },
  ...(Object.keys(MEDIUM_LABELS) as Medium[]).map((m) => ({
    label: MEDIUM_LABELS[m],
    value: m,
  })),
];

export const priceOptions: DropdownOption[] = [
  { label: "All", value: "all" },
  { label: "Under ₹1", value: "under-1" },
  { label: "₹1 – ₹100", value: "1-100" },
  { label: "Over ₹100", value: "100-plus" },
];

export type SortValue = "newest" | "loved" | "az";
export const sortOptions: DropdownOption[] = [
  { label: "Newest", value: "newest" },
  { label: "Most loved", value: "loved" },
  { label: "A – Z", value: "az" },
];

/** Numeric value of a vintage price chip, or null if absent/unparseable. */
export function parsePrice(price?: string): number | null {
  if (!price) return null;
  const n = parseFloat(price.replace(/[₹,\s]/g, ""));
  return Number.isNaN(n) ? null : n;
}

export function priceMatches(bucket: string, item: VintageItem): boolean {
  if (bucket === "all") return true;
  const n = parsePrice(item.priceVintage);
  if (n === null) return false;
  if (bucket === "under-1") return n < 1;
  if (bucket === "1-100") return n >= 1 && n <= 100;
  if (bucket === "100-plus") return n > 100;
  return true;
}
