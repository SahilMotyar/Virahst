/**
 * Intercepted item route (soft navigation from the canvas). Renders the shared
 * ItemDetail inside a modal over the landing page. A hard load of the same URL
 * falls through to app/item/[slug]/page.tsx (the full page) instead.
 */

import { notFound } from "next/navigation";
import { getItemBySlug } from "@/data/items";
import { ItemDetail } from "@/components/item/ItemDetail";
import { ItemDetailModal } from "@/components/item/ItemDetailModal";

export default async function InterceptedItemModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) notFound();

  return (
    <ItemDetailModal>
      <ItemDetail item={item} />
    </ItemDetailModal>
  );
}
