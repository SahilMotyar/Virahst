/**
 * Queue of museum items waiting to be dropped onto the inspo board.
 *
 * "Send to Inspo Board" (on the item detail card) pushes a slug here without
 * navigating; /inspo drains the queue once its Excalidraw API is ready. The
 * queue is persisted so a *hard* navigation to /inspo — or closing the tab and
 * coming back — still delivers what was queued. Board contents themselves live
 * elsewhere (see components/inspo/persistence.ts); this is only the hand-off.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface InspoState {
  /** Slugs queued from the museum, in the order they were sent. */
  queue: string[];
  /** Queue one or more slugs, ignoring ones already waiting. */
  enqueue: (slugs: string[]) => void;
  /** Return everything queued and empty the queue. */
  drain: () => string[];
}

export const useInspoStore = create<InspoState>()(
  persist(
    (set, get) => ({
      queue: [],
      enqueue: (slugs) =>
        set((s) => ({
          queue: [...s.queue, ...slugs.filter((x) => !s.queue.includes(x))],
        })),
      drain: () => {
        const { queue } = get();
        if (queue.length) set({ queue: [] });
        return queue;
      },
    }),
    { name: "virasat:inspo:queue:v1" },
  ),
);
