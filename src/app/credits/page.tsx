/**
 * /credits — attribution for every archive image that has a `source`. Several
 * images are CC BY / CC BY-SA, whose licences require a visible credit, so
 * this page is a licensing requirement, not decoration.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/config";
import { items, type Category, type ItemSource, type VintageItem } from "@/data/items";
import { PageHeader } from "@/components/ui/PageHeader";
import { textLink } from "@/components/ui/pill";

export const metadata: Metadata = {
  title: `Image credits — ${config.brand}`,
  description:
    "Credits and licences for the pictures on Virasat, most of them from Wikimedia Commons.",
};

/** Group headings, in display order. */
const GROUPS: Record<Category, string> = {
  "print-ad": "Print ads",
  "film-poster": "Film posters",
  matchbox: "Matchboxes",
  signboard: "Signboards",
  packaging: "Packaging",
  electronics: "Electronics",
  automobile: "Automobiles",
  misc: "Miscellaneous",
};

export default function CreditsPage() {
  const credited = items.filter(
    (i): i is VintageItem & { source: ItemSource } => Boolean(i.source),
  );
  const groups = (Object.keys(GROUPS) as Category[])
    .map((category) => ({
      category,
      items: credited.filter((i) => i.category === category),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <main
      translate="no"
      className="mx-auto min-h-screen max-w-3xl px-5 pb-40 pt-24 sm:px-8"
    >
      <PageHeader
        devanagari="आभार"
        title="Image credits"
        subtitle="Most pictures on Virasat come from Wikimedia Commons and are public domain or openly licensed. Thank you to everyone who made them."
      />

      <div className="mt-12 space-y-10">
        {groups.map((g) => (
          <section key={g.category} aria-labelledby={`credits-${g.category}`}>
            <h2
              id={`credits-${g.category}`}
              className="font-display text-2xl leading-tight text-ink"
            >
              {GROUPS[g.category]}
              <span className="ml-2 text-base text-ink-2">{g.items.length}</span>
            </h2>
            <ul className="mt-4 rounded-[18px] bg-white px-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              {g.items.map((item) => {
                const s = item.source;
                return (
                  <li
                    key={item.slug}
                    className="border-b border-black/5 py-3.5 last:border-0"
                  >
                    <Link
                      href={`/item/${item.slug}`}
                      className="font-medium text-ink underline-offset-2 hover:text-accent-ink hover:underline"
                    >
                      {item.nameEn}
                    </Link>
                    <p className="mt-0.5 break-words text-sm leading-relaxed text-ink-2">
                      {s.author}
                      <span className="mx-1.5 opacity-40">·</span>
                      <a
                        href={s.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={textLink}
                      >
                        {s.license}
                      </a>
                      <span className="mx-1.5 opacity-40">·</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={textLink}
                      >
                        source<span className="sr-only"> for {item.nameEn}</span>
                      </a>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
