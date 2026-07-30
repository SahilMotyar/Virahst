"use client";

/**
 * "Send to Inspo Board" on the item detail card. Queues the item for the
 * personal board at /inspo and confirms in place — deliberately without
 * navigating, so you can keep browsing the archive and collect a handful of
 * items before switching over.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInspoStore } from "@/store/inspoStore";

/** How long the confirmation stays up before reverting to the idle label. */
const CONFIRM_MS = 2600;

export function SendToInspoButton({ slug }: { slug: string }) {
  const enqueue = useInspoStore((s) => s.enqueue);
  const [sent, setSent] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  function send() {
    enqueue([slug]);
    setSent(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSent(false), CONFIRM_MS);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={send}
        aria-live="polite"
        className="rounded-full bg-accent/10 px-4 py-2 text-[13px] font-medium text-accent-ink transition-colors hover:bg-accent/20"
      >
        {sent ? "Added to inspo board ✓" : "Send to Inspo Board"}
      </button>
      {sent && (
        <Link
          href="/inspo"
          className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
        >
          Open board →
        </Link>
      )}
    </div>
  );
}
