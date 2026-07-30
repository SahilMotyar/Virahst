"use client";

/**
 * The hero title block. Rendered INSIDE the canvas layer at the reserved hole's
 * world centre, so it pans and zooms with the grid — exactly like ciggies, where
 * the title is part of the canvas, not a fixed overlay (brief §4.6).
 */

import Link from "next/link";
import { useState } from "react";
import { config, HERO_CENTER } from "@/config";
import { brandCount, productCount } from "@/data/items";
import { Modal } from "@/components/ui/Modal";

type InfoModal = "how" | "why" | null;

export function HeroBlock() {
  const [info, setInfo] = useState<InfoModal>(null);

  return (
    <>
    <div
      // Narrower in world units on phones: at 560 the block is wider than a
      // 360px viewport once the camera's initial scale is applied, so the
      // title used to be clipped on both edges. The camera also fits its
      // starting scale to this width — see useCanvasCamera.
      className="absolute flex w-[440px] flex-col items-center text-center sm:w-[560px]"
      style={{
        left: HERO_CENTER.x,
        top: HERO_CENTER.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <h1 className="font-hero text-[84px] leading-[1.05] tracking-tight text-ink sm:text-[96px]">
        {config.heroTitle}
      </h1>
      <p className="mt-4 text-[13px] uppercase text-ink-2 sm:text-xs" style={{ letterSpacing: "0.35em" }}>
        {config.heroSubtitle}
      </p>

      <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-ink-2 sm:text-[15px]">
        {config.tagline}
      </p>

      <p className="mt-5 text-sm font-medium text-ink-2 sm:text-[13px]">
        <span className="text-accent-ink">{brandCount}</span> categories
        <span className="mx-2 opacity-40">·</span>
        <span className="text-accent-ink">{productCount}</span> products
      </p>

      <div className="mt-7 flex flex-col items-center gap-3">
        <Link
          href="/collection"
          className="inline-flex min-h-13 items-center gap-2 rounded-full bg-ink px-7 text-[15px] font-medium text-bg transition-colors hover:bg-black sm:min-h-12 sm:text-sm"
        >
          Browse collection
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setInfo("how")}
            className="min-h-12 rounded-full bg-white px-5 text-[13px] font-medium text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors hover:text-ink sm:min-h-11 sm:text-xs"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => setInfo("why")}
            className="min-h-12 rounded-full bg-white px-5 text-[13px] font-medium text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors hover:text-ink sm:min-h-11 sm:text-xs"
          >
            Why this exists
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink-2 opacity-60 sm:text-[11px]">
        by {config.handle}
      </p>
    </div>

      <Modal
        open={info === "how"}
        onClose={() => setInfo(null)}
        eyebrow="How it works"
        title="A canvas, not a catalogue"
      >
        <p>
          Drag to roam the canvas, scroll or pinch to zoom, and let the field of
          old packaging drift past like a market stall at dusk. Tap any object to
          open its card — each one carries the original advertising it once ran:
          the tagline, the medium, the era.
        </p>
        <p className="mt-3">
          Prefer a tidy list? The{" "}
          <Link href="/collection" className="text-accent underline-offset-2 hover:underline">
            collection
          </Link>{" "}
          view lets you search, filter and sort the same archive.
        </p>
      </Modal>

      <Modal
        open={info === "why"}
        onClose={() => setInfo(null)}
        eyebrow="Why this exists"
        title="The everyday, treated like art"
      >
        <p>
          The packaging, posters and jingles India grew up with were designed to
          be thrown away — yet they shaped how a country remembers itself.
          {" "}
          {config.brand} collects that everyday design and hangs it in a quiet,
          pannable gallery, with the advertising history kept as the label.
        </p>
        <p className="mt-3 text-xs text-ink-2/70">
          Images and ad copy here are placeholders — real, properly-sourced
          archival material gets added over time.
        </p>
      </Modal>
    </>
  );
}
