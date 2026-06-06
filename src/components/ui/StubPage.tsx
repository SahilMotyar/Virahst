/**
 * Shared "coming soon" scaffold for the not-yet-built sections (brief §5.1).
 * Same quiet, gallery-clean treatment with the Devanagari glyph mark.
 */

import Link from "next/link";
import { config } from "@/config";

export function StubPage({ title, blurb }: { title: string; blurb: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink font-display text-2xl text-bg">
        {config.logoGlyph}
      </span>
      <h1 className="mt-6 font-display text-4xl text-ink">{title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">{blurb}</p>
      <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
        Coming soon
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-black"
      >
        Back to the canvas
      </Link>
    </main>
  );
}
