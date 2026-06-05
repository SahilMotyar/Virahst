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
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Optional, **server-only**. Enables real artist/title/artwork in the widget (see Music). Without them the widget still works with a placeholder label. |

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
embed drives a custom bottom-left widget built from `playback_update` events. Autoplay is
browser-blocked, so it starts paused and remembers your start choice in `localStorage`.
Skip buttons nudge ±15s (the IFrame API can't change tracks).

The IFrame API doesn't expose track metadata, and Spotify's Client-Credentials token can no
longer read playlist tracks (late-2024 lockdown — both `/playlists/{id}` and `/tracks` omit
or 403 the track list). So for real **artist / title / artwork** the app reads the track
list the **embed page bootstraps** for its own iframe (title/artist/duration, no login),
hydrates album art per-track via `/tracks/{id}` (the only track endpoint still open to app
tokens — the batch `/tracks?ids=` is 403'd), and the widget matches the currently-playing
song by its **duration**. `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` enable the artwork.

Caveats: this relies on the embed's undocumented JSON and only covers the tracks the embed
preloads (~the first several) — other songs fall back to the placeholder label. Full,
guaranteed metadata + real next/previous-track skipping would need the **Web Playback SDK +
OAuth (PKCE)** (visitor login + Premium) — the documented upgrade path.

## Tech

Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Zustand · `motion`.
The canvas pan/zoom/momentum is hand-rolled (`requestAnimationFrame` + CSS transforms,
virtualized) — see [`src/components/canvas/`](src/components/canvas/).
