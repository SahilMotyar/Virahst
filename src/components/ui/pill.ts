/**
 * Shared class strings for the rounded-full pill buttons used on the content
 * pages, matching the hero buttons (ink primary, white secondary with the
 * same soft shadow) plus a soft marigold variant. Every pill is ≥44px tall.
 */

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors";

export const pill = {
  primary: `${base} bg-ink text-bg hover:bg-black`,
  secondary: `${base} bg-white text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.05)] hover:text-ink`,
  soft: `${base} bg-accent/10 text-accent-ink hover:bg-accent/20`,
};

/** Inline text link: accent ink with a permanent (not colour-only) underline. */
export const textLink =
  "text-accent-ink underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent-ink";
