/**
 * Standalone item detail page — the shareable URL (brief §5.1). Rendered on hard
 * navigation, refresh, or when the link is opened directly. The same content
 * also appears as an intercepted modal over the canvas on soft navigation
 * (see app/@modal/(.)item/[slug]/page.tsx).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { items, getItemBySlug } from "@/data/items";
import { ItemDetail } from "@/components/item/ItemDetail";
import { config } from "@/config";

export function generateStaticParams() {
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) return { title: config.brand };

  const title = `${item.nameEn} — ${config.brand}`;
  const description = `“${item.advertising.tagline}” — ${item.brandEn}, ${item.era}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-40 pt-24 sm:px-8">
      <Link
        href="/"
        className="mb-6 -ml-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to the archive
      </Link>
      <ItemDetail item={item} />

      <p className="mt-16 border-t border-black/5 pt-6 text-center">
        <Link
          href="/support"
          className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent/10"
        >
          Like Virasat? Help it grow →
        </Link>
      </p>
    </main>
  );
}
