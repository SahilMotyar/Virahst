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
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Optional, **only used by `npm run gen:playlist`** to fetch album art when regenerating the playlist snapshot. Not read at runtime. |

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

## Inspo board

`/inspo` is a private, free-form **Excalidraw** canvas for curatorial thinking —
pulling items off the museum canvas, drawing arrows between them, jotting notes
("these belong in the same era"). It's a maintainer tool, not a visitor feature,
and it's deliberately *not* built on the hand-rolled canvas engine: Excalidraw
brings arrows, freehand, shapes and text for free.

Getting items onto it:

- **Send to Inspo Board** on any item detail card queues that item without
  navigating away (the queue survives a reload — see `store/inspoStore.ts`).
- **Load all items** on the board itself dumps the whole collection onto a grid,
  asking first if the board isn't already empty. New batches always land *below*
  existing work rather than over it.

Each item lands as its image (when `ASSETS_PRESENT` and the PNG resolves) or a
tinted placeholder rectangle mirroring `<Placeholder>`, plus its advertising
tagline as a separate text element — the copy is the point, so it's there to
riff on. Cards link back to `/item/<slug>`.

The board saves to `localStorage` on every change (debounced 500ms). Museum
images are stored as a `fileId → slug` map and re-fetched on load rather than
persisted as base64, which keeps the payload small — a full 59-item board is
~150KB against a ~5–10MB ceiling. Images pasted or dragged in from outside the
app have no slug to re-derive from, so those are stored inline. IndexedDB is the
upgrade path if that ever becomes the constraint.

Excalidraw serves its own fonts, so `npm run copy:excalidraw-fonts` copies them
from `node_modules` into `public/fonts` (gitignored — it's a build artefact).
`predev`/`prebuild` run it automatically.

## Music

The `MusicBar` uses the **Spotify IFrame API** (no Premium/OAuth needed): a 1px-hidden
embed drives a custom bottom-left widget built from `playback_update` events. Autoplay is
browser-blocked, so it starts paused and remembers your start choice in `localStorage`.
Skip buttons nudge ±15s (the IFrame API can't change tracks).

For real **artist / title / artwork** the widget matches the currently-playing song by its
**duration** against a **static snapshot** of the playlist in
[`src/data/playlistTracks.ts`](src/data/playlistTracks.ts). This needs no runtime API,
credentials, or login — and Spotify's lockdown (Client-Credentials tokens can no longer read
playlist tracks) doesn't matter because the data is baked in.

To (re)generate the snapshot:

1. Export the playlist as CSV via [exportify.net](https://exportify.net) → save as `data/playlist.csv`.
2. `npm run gen:playlist` — reads the CSV (name/artist/duration) and hydrates album art once
   via Spotify's `/tracks/{id}` endpoint, writing `src/data/playlistTracks.ts`.

Art hydration uses `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` from `.env.local` **at
generation time only** (single-track endpoint — the batch one is 403'd). Without them the
snapshot still works, just with `image: null`. The widget covers every track in the snapshot.

Real next/previous-track skipping would need the **Web Playback SDK + OAuth (PKCE)** (visitor
login + Premium) — the documented upgrade path. The IFrame API only supports play/pause/seek.

## Tech

Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Zustand · `motion`.
The canvas pan/zoom/momentum is hand-rolled (`requestAnimationFrame` + CSS transforms,
virtualized) — see [`src/components/canvas/`](src/components/canvas/).
