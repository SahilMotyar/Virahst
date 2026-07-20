"use client";

/**
 * Fixed top navigation: logo mark + wordmark, nav links, and the inspo link.
 * Links to Phase-3/5 routes are present but those pages are stubs for now.
 *
 * Client-side only so it can stand down on /inspo, where Excalidraw owns the
 * top of the screen and a fixed bar would sit over its toolbar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { config } from "@/config";

const LINKS = [
  { label: "Collection", href: "/collection" },
  { label: "Categories", href: "/brands" },
  { label: "Community", href: "/community" },
  { label: "Feed", href: "/feed" },
];

export function TopNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/inspo")) return null;

  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-3.5 sm:px-7">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-sm text-bg">
          {config.logoGlyph}
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-ink">
          {config.brand}
        </span>
      </Link>

      <div className="hidden items-center gap-7 text-sm font-medium text-ink-2 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="transition-colors hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Personal ideation board — occupies what was the centring spacer. */}
      <Link
        href="/inspo"
        title="Personal inspo board"
        className="w-20 text-right text-sm font-medium text-ink-2 transition-colors hover:text-accent"
      >
        Inspo
      </Link>
    </nav>
  );
}
