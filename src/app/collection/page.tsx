/**
 * /collection — the conventional, scrollable browse view of the same archive
 * shown on the canvas (brief §5.1). Search + filters + sort live in the client
 * CollectionBrowser; this page provides the heading and metadata.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CollectionBrowser } from "@/components/collection/CollectionBrowser";
import { config } from "@/config";
import { productCount } from "@/data/items";

export const metadata: Metadata = {
  title: `Collection — ${config.brand}`,
  description: `Browse all ${productCount} objects in the archive — search, filter and sort the everyday things India advertised.`,
};

export default function CollectionPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-24 sm:px-8">
      <header className="mb-9">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">Collection</h1>
        <p className="mt-2 max-w-prose text-sm text-ink-2">
          {config.tagline} Browse the full archive below, or return to the{" "}
          <Link href="/" className="text-accent underline-offset-2 hover:underline">
            canvas
          </Link>
          .
        </p>
      </header>

      <CollectionBrowser />
    </main>
  );
}
