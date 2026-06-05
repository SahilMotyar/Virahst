/**
 * Small UI store for transient canvas interaction state.
 * Currently: which item the pointer is hovering, so the fixed ItemPopover (a
 * ciggies-style floating card) can show its details without prop-drilling.
 */

import { create } from "zustand";

interface UIState {
  /** Slug of the item under the cursor on the canvas, or null. */
  hoveredSlug: string | null;
  setHovered: (slug: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  hoveredSlug: null,
  setHovered: (slug) => set({ hoveredSlug: slug }),
}));
