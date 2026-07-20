/**
 * The inspo board route — a personal ideation surface, not part of the museum
 * proper. Excalidraw is browser-only (it touches window at module scope), so
 * the board is pulled in through a client wrapper with `ssr: false`; this page
 * is a Client Component because `ssr: false` isn't allowed from a Server one.
 */

"use client";

import dynamic from "next/dynamic";

const InspoBoard = dynamic(() => import("@/components/inspo/InspoBoard"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-canvas text-sm text-ink-2">
      Loading board…
    </div>
  ),
});

export default function InspoPage() {
  return <InspoBoard />;
}
