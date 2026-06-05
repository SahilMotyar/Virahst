/**
 * Shared item detail content, rendered by BOTH the standalone /item/[slug] page
 * (hard navigation / share / refresh) and the intercepted modal (soft nav over
 * the canvas). Presentational and server-compatible — no client hooks.
 */

import type { VintageItem } from "@/data/items";
import { Placeholder } from "@/components/ui/Placeholder";
import { AdvertisingBlock } from "@/components/item/AdvertisingBlock";
import { config } from "@/config";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
      {children}
    </span>
  );
}

export function ItemDetail({ item }: { item: VintageItem }) {
  const showImage = config.flags.ASSETS_PRESENT && Boolean(item.image);

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Image / placeholder */}
      <div className="aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_rgba(0,0,0,.06)]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- assets mostly absent in Phase 1/2; placeholder is the fallback.
          <img
            src={item.image}
            alt={item.nameEn}
            className="h-full w-full object-contain p-6"
          />
        ) : (
          <Placeholder id={item.id} nameEn={item.nameEn} category={item.category} />
        )}
      </div>

      {/* Metadata + advertising */}
      <div className="flex flex-col">
        <div className="flex flex-wrap gap-2">
          <Chip>{item.category.replace("-", " ")}</Chip>
          <Chip>{item.era}</Chip>
          <Chip>{item.region}</Chip>
        </div>

        <h1 className="mt-5 font-display text-4xl leading-tight text-ink sm:text-5xl">
          {item.name}
        </h1>
        <p className="mt-1 text-base text-ink-2">{item.nameEn}</p>

        <p className="mt-4 text-sm text-ink-2">
          <span className="font-display text-lg text-ink">{item.brand}</span>
          <span className="mx-2 opacity-30">·</span>
          {item.brandEn}
        </p>

        <div className="mt-5 flex items-center gap-4 text-sm text-ink-2">
          {item.priceVintage && (
            <span className="font-medium text-accent">{item.priceVintage}</span>
          )}
          <span aria-label={`${item.favorites} favourites`}>
            ★ {item.favorites}
          </span>
          <span aria-label={`${item.comments} comments`}>
            ✦ {item.comments}
          </span>
        </div>

        <div className="mt-7">
          <AdvertisingBlock advertising={item.advertising} />
        </div>
      </div>
    </article>
  );
}
