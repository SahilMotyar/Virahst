"use client";

/**
 * Fixed top navigation: logo mark + wordmark, nav links, and a Support pill.
 * Links to Phase-3/5 routes are present but those pages are stubs for now.
 *
 * Client-side only so it can stand down on /inspo, where Excalidraw owns the
 * top of the screen and a fixed bar would sit over its toolbar.
 *
 * Below `md` the links collapse into a sheet behind a menu button — they used
 * to be `hidden md:flex`, which left phones with no route to the collection
 * at all.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { config } from "@/config";

const LINKS = [
  { label: "Collection", href: "/collection" },
  { label: "Categories", href: "/brands" },
  { label: "Community", href: "/community" },
  { label: "Feed", href: "/feed" },
  { label: "Inspo", href: "/inspo" },
  { label: "About", href: "/about" },
];

/** Last item, drawn as a soft marigold pill so it stands out a little. */
const SUPPORT = { label: "Support", href: "/support" };

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape closes and returns focus to the toggle; outside clicks just close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !toggleRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (pathname?.startsWith("/inspo")) return null;

  return (
    <nav
      aria-label="Main"
      // Compact solid bar in the same colour as the page beneath it (canvas
      // tone on the home page, paper elsewhere), so it reads as part of the
      // page rather than a band across it. Deliberately no backdrop-filter: a
      // blur would be recomputed every frame while the canvas pans underneath.
      className={`fixed inset-x-0 top-0 z-40 ${pathname === "/" ? "bg-canvas" : "bg-bg"}`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-full py-1.5 pr-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-ink font-display text-[13px] text-bg">
            {config.logoGlyph}
          </span>
          <span className="text-base font-semibold tracking-tight text-ink">
            {config.brand}
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 text-[14px] font-medium text-ink-2 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center rounded-full px-3 transition-colors lg:px-3.5 ${
                  active ? "bg-ink text-bg" : "hover:bg-black/[.04] hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href={SUPPORT.href}
            aria-current={pathname === SUPPORT.href ? "page" : undefined}
            className={`ml-1 flex h-9 items-center rounded-full px-4 transition-colors ${
              pathname === SUPPORT.href
                ? "bg-accent-ink text-bg"
                : "bg-accent/10 text-accent-ink hover:bg-accent/20"
            }`}
          >
            {SUPPORT.label}
          </Link>
        </div>

        {/* Mobile menu button + sheet */}
        <div className="md:hidden">
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-black/5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              {open ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>

          {open && (
            <div
              ref={panelRef}
              id="mobile-nav"
              className="absolute right-4 top-[calc(100%-0.25rem)] flex w-52 flex-col gap-0.5 rounded-2xl border border-black/5 bg-bg/97 p-2 shadow-[0_1px_2px_rgba(0,0,0,.05),0_18px_44px_rgba(0,0,0,.16)] backdrop-blur"
            >
              {LINKS.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    // Dismiss on tap: the sheet would otherwise stay open over
                    // the page it just navigated to.
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-xl px-3.5 text-[15px] font-medium transition-colors ${
                      active
                        ? "bg-accent/10 text-accent-ink"
                        : "text-ink hover:bg-black/4"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <Link
                href={SUPPORT.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === SUPPORT.href ? "page" : undefined}
                className="mt-1 flex min-h-11 items-center rounded-xl bg-accent/10 px-3.5 text-[15px] font-medium text-accent-ink transition-colors hover:bg-accent/20"
              >
                {SUPPORT.label}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
