# विरासत · virasat

An infinite-canvas museum of vintage Indian consumer culture — old packaging, matchbox
labels, film posters, print ads, signboards. Visitors land on a pannable, zoomable canvas
of floating product cutouts; clicking any item opens a detail card showing the item **and
its original advertising copy**. The advertising history is the content.

> All images and ad copy are **placeholders**. The `<Placeholder>` component renders for
> missing images; advertising copy is original, evocative placeholder text — not real
> historical slogans. Real assets/copy get swapped in later with proper sourcing.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — a default playlist is built in
npm run dev
```

Open the printed `http://localhost:<port>`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URI` | Playlist for the ambient `MusicBar`, as `spotify:playlist:<id>`. Falls back to a default in `src/config.ts`. |

## Configuration

Everything brand-, copy-, and behaviour-tunable lives in [`src/config.ts`](src/config.ts):
brand name and hero copy, canvas geometry (cell size, zoom limits, momentum), the hero
handle, the Spotify playlist, and feature flags:

- `INFINITE_WRAP` — tile the grid endlessly by wrapping the item list.
- `MUSIC_ENABLED` — show/hide the ambient music bar.
- `ASSETS_PRESENT` — when `false`, items render placeholders and skip image requests.
  Flip to `true` once real assets are dropped in.

## Adding real assets

Drop transparent PNGs into `public/items/` named `<slug>.png` (slugs are in
[`src/data/items.ts`](src/data/items.ts)), then set `flags.ASSETS_PRESENT = true` in
`src/config.ts`. Missing files still fall back to placeholders.

## Music

The `MusicBar` uses the **Spotify IFrame API** (no Premium/OAuth needed): a 1px-hidden
embed drives a custom bar built from `playback_update` events. Autoplay is browser-blocked,
so it starts paused and remembers your start choice in `localStorage`. The IFrame API does
not expose track title/artist — richer "what's playing" would need the **Web Playback SDK +
OAuth (PKCE)**, the intended upgrade path (not built).

## Tech

Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Zustand · `motion`.
The canvas pan/zoom/momentum is hand-rolled (`requestAnimationFrame` + CSS transforms,
virtualized) — see [`src/components/canvas/`](src/components/canvas/).
