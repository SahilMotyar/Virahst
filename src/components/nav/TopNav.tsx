/**
 * Fixed top navigation: logo mark + wordmark, nav links, and a Sign In pill.
 * Links to Phase-3/5 routes are present but those pages are stubs for now.
 */

import Link from "next/link";
import { config } from "@/config";
import { SignInButton } from "@/components/auth/SignInButton";

const LINKS = [
  { label: "Collection", href: "/collection" },
  { label: "Categories", href: "/brands" },
  { label: "Community", href: "/community" },
  { label: "Feed", href: "/feed" },
];

export function TopNav() {
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

      <SignInButton />
    </nav>
  );
}
