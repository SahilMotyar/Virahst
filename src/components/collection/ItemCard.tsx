/**
 * Card used in the collection grid: image (or placeholder), Devanagari + English
 * name, and brand. Links to the shareable item detail route.
 */

import Link from "next/link";
import { hasImage, thumbSrc, type VintageItem } from "@/data/items";
import { Placeholder } from "@/components/ui/Placeholder";

export function ItemCard({ item }: { item: VintageItem }) {
  const showImage = hasImage(item);

  return (
    <Link
      href={`/item/${item.slug}`}
      className="group flex flex-col rounded-[18px] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-shadow duration-200 hover:shadow-[0_1px_2px_rgba(0,0,0,.05),0_12px_28px_rgba(0,0,0,.10)]"
    >
      <div className="aspect-[4/5] w-full overflow-hidden rounded-[12px]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- assets mostly absent; placeholder is the fallback.
          <img
            src={thumbSrc(item)}
            alt={item.nameEn}
            decoding="async"
            loading="lazy"
            className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <Placeholder id={item.id} nameEn={item.nameEn} category={item.category} />
        )}
      </div>

      <div className="px-1 pb-1 pt-3">
        <h3 className="truncate font-display text-base leading-tight text-ink">
          {item.name}
        </h3>
        <p className="truncate text-xs text-ink-2">{item.nameEn}</p>
        <p className="mt-1.5 truncate text-xs text-ink-2">{item.brandEn}</p>
      </div>
    </Link>
  );
}
