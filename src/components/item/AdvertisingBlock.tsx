/**
 * The differentiator (brief §5.2). Renders an item's original advertising as a
 * museum placard: the tagline large and quoted, the medium/years as a caption,
 * and the body copy as the descriptive paragraph beneath.
 */

import type { Advertising, Medium } from "@/data/items";

const MEDIUM_LABEL: Record<Medium, string> = {
  print: "Print",
  radio: "Radio",
  hoarding: "Hoarding",
  television: "Television",
  cinema: "Cinema",
};

export function AdvertisingBlock({ advertising }: { advertising: Advertising }) {
  return (
    <section
      aria-label="Original advertising"
      className="rounded-[18px] border border-black/5 bg-bg p-6 sm:p-8"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
        The advertising
      </p>

      <blockquote className="mt-4 font-display text-2xl leading-snug text-ink sm:text-[28px]">
        <span className="text-accent/50">“</span>
        {advertising.tagline}
        <span className="text-accent/50">”</span>
      </blockquote>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-2">
        <span>{MEDIUM_LABEL[advertising.medium]}</span>
        <span aria-hidden className="opacity-30">
          ·
        </span>
        <span>{advertising.years}</span>
      </div>

      <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-2">
        {advertising.body}
      </p>

      <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-ink-2/60">
        Placeholder copy — original wording added later with sourcing.
      </p>
    </section>
  );
}
