/**
 * Heading block for the content pages (About, Support, Credits): a Devanagari
 * line in the display face above the English title, plus an optional subtitle.
 */

export function PageHeader({
  devanagari,
  title,
  subtitle,
  className = "",
}: {
  devanagari: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      <p lang="hi" className="font-display text-2xl text-accent-ink sm:text-3xl">
        {devanagari}
      </p>
      <h1 className="mt-1 font-display text-4xl leading-tight text-ink sm:text-5xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-prose text-base leading-relaxed text-ink-2">
          {subtitle}
        </p>
      )}
    </header>
  );
}
