# Virasat Project Details

Last updated: 2026-07-03

## Project Summary

`virasat` is a Next.js 16 App Router application that presents an "infinite canvas museum" of vintage Indian consumer culture. The experience centers on a pannable and zoomable gallery of floating product cutouts, posters, signboards, and ads. Users can:

- Land on a fullscreen canvas at `/`
- Pan and zoom through a virtualized field of items
- Hover items to see a compact metadata popover
- Open any item at `/item/[slug]` for a full detail page
- Browse the same archive in a conventional grid at `/collection`
- Use an ambient Spotify-powered music widget while exploring

The current content is intentionally placeholder-heavy:

- Item images are mostly absent
- `Placeholder` components stand in for missing assets
- Advertising copy is original filler text, not historical source material

The app is clearly structured for later archival replacement with real images and properly sourced copy.

## Tech Stack

- Next.js `16.2.0`
- React `19.2.4`
- TypeScript with `strict` mode
- Tailwind CSS `v4`
- Zustand for lightweight global state
- `motion` for modal animation
- Spotify IFrame API for ambient playback

## Framework Notes

This repo explicitly warns that it is using a newer Next.js variant with changed conventions. Relevant docs under `node_modules/next/dist/docs/` confirm the app is following the App Router model:

- `src/app/` contains routes
- `layout.tsx`, `page.tsx`, `error.tsx`, `global-error.tsx`, and `not-found.tsx` are used as special files
- Dynamic route params in Next 16 are promise-based, and this repo already uses that pattern in `/item/[slug]`

## What The App Does

### Primary Experience

The homepage is not a normal landing page. It is a fixed, fullscreen canvas with:

- A hand-rolled camera system
- Direct DOM transform updates instead of React re-renders on drag
- Momentum after flick gestures
- Pinch and wheel zooming
- Cell-based virtualization so only visible items mount
- A hero block rendered inside the same transformed layer as the items

### Secondary Experience

The `/collection` route exposes the same dataset in a searchable and filterable card grid. This route is the most conventional browse surface in the app.

### Supporting Experience

The project also includes stub pages for:

- `/brands`
- `/community`
- `/feed`

These exist mainly as navigable placeholders for future product phases.

## Content Model

The archive data lives in [src/data/items.ts](/E:/virasat/virasat/src/data/items.ts:1).

### Data Shape

Each `VintageItem` includes:

- `id`
- `slug`
- Devanagari and English item names
- Devanagari and English brand names
- `category`
- `era`
- `region`
- optional `priceVintage`
- `image`
- `favorites`
- `comments`
- `advertising`

The nested `advertising` object includes:

- `tagline`
- `medium`
- `years`
- `body`

### Current Dataset

- 60 archive items
- Mixed categories such as packaging, matchbox, film poster, print ad, signboard, electronics, automobile, and misc
- Helper exports:
  - `brandCount`
  - `productCount`
  - `getItemBySlug(slug)`

## Architecture Overview

### 1. Routing Layer

Routes live under `src/app/`:

- `/` -> canvas homepage
- `/collection` -> grid browser
- `/item/[slug]` -> standalone detail page
- `/brands` -> stub
- `/community` -> stub
- `/feed` -> stub

Special app files:

- [src/app/layout.tsx](/E:/virasat/virasat/src/app/layout.tsx:1)
  - Root layout
  - Loads fonts
  - Defines metadata
  - Renders `TopNav` and `MusicBar`
  - Adds anti-translation protections to reduce hydration crashes caused by DOM-mutating translators/extensions
- [src/app/error.tsx](/E:/virasat/virasat/src/app/error.tsx:1)
  - Client error boundary
  - Auto-retries transient errors up to two times
- [src/app/global-error.tsx](/E:/virasat/virasat/src/app/global-error.tsx:1)
  - Root-level fallback document for layout-level failure
- [src/app/not-found.tsx](/E:/virasat/virasat/src/app/not-found.tsx:1)
  - 404 page

### 2. Configuration Layer

[src/config.ts](/E:/virasat/virasat/src/config.ts:1) is the project's central behavior and branding hub. It defines:

- brand identity
- hero copy
- site URL
- logo glyph
- handle
- Spotify playlist URI
- feature flags
- canvas dimensions
- zoom limits
- hero-hole geometry
- overscan
- grid bounds

Key feature flags:

- `INFINITE_WRAP`
- `MUSIC_ENABLED`
- `ASSETS_PRESENT`

### 3. Canvas System

The canvas implementation is the most custom part of the project.

Core files:

- [src/components/canvas/Canvas.tsx](/E:/virasat/virasat/src/components/canvas/Canvas.tsx:1)
  - Main viewport
  - Wires together camera hook, visible items, and hero block
- [src/components/canvas/useCanvasCamera.ts](/E:/virasat/virasat/src/components/canvas/useCanvasCamera.ts:1)
  - Directly manages pan, zoom, momentum, pointer events, wheel behavior, resize handling, and tap hit-testing
- [src/components/canvas/useVirtualization.ts](/E:/virasat/virasat/src/components/canvas/useVirtualization.ts:1)
  - Builds the list of mounted cells for the visible range
- [src/components/canvas/CanvasItem.tsx](/E:/virasat/virasat/src/components/canvas/CanvasItem.tsx:1)
  - Renders a single floating archive card on the canvas
- [src/components/canvas/HeroBlock.tsx](/E:/virasat/virasat/src/components/canvas/HeroBlock.tsx:1)
  - Renders the centered hero title and info modals inside the canvas layer
- [src/components/canvas/ZoomControls.tsx](/E:/virasat/virasat/src/components/canvas/ZoomControls.tsx:1)
  - Fixed zoom overlay connected to imperative camera controls

Supporting math/helpers:

- [src/lib/grid.ts](/E:/virasat/virasat/src/lib/grid.ts:1)
  - cell-to-world mapping
  - hero-hole exclusion
  - finite-vs-infinite bounds logic
  - deterministic cell-to-item assignment
- [src/lib/seededRandom.ts](/E:/virasat/virasat/src/lib/seededRandom.ts:1)
  - stable hash and seeded jitter helpers

Performance strategy:

- React does not re-render on every drag frame
- camera transform is written directly to the layer DOM node
- visible range changes are pushed into Zustand only when needed
- mounted items are computed from a coarse cell range
- hover state is shared globally to avoid prop drilling

### 4. Collection Browser

The standard browsing interface is built from:

- [src/components/collection/CollectionBrowser.tsx](/E:/virasat/virasat/src/components/collection/CollectionBrowser.tsx:1)
- [src/components/collection/Filters.tsx](/E:/virasat/virasat/src/components/collection/Filters.tsx:1)
- [src/components/collection/Dropdown.tsx](/E:/virasat/virasat/src/components/collection/Dropdown.tsx:1)
- [src/components/collection/ItemCard.tsx](/E:/virasat/virasat/src/components/collection/ItemCard.tsx:1)
- [src/components/collection/filterOptions.ts](/E:/virasat/virasat/src/components/collection/filterOptions.ts:1)

Supported controls:

- text search
- category filter
- advertising medium filter
- price bucket filter
- sort by newest, most loved, or A-Z

All filtering is local and client-side over the static item array.

### 5. Item Detail System

Item details are composed from:

- [src/app/item/[slug]/page.tsx](/E:/virasat/virasat/src/app/item/[slug]/page.tsx:1)
- [src/components/item/ItemDetail.tsx](/E:/virasat/virasat/src/components/item/ItemDetail.tsx:1)
- [src/components/item/AdvertisingBlock.tsx](/E:/virasat/virasat/src/components/item/AdvertisingBlock.tsx:1)
- [src/components/item/ItemPopover.tsx](/E:/virasat/virasat/src/components/item/ItemPopover.tsx:1)

Notable details:

- `generateStaticParams()` prebuilds pages for all slugs
- `generateMetadata()` derives item-specific metadata
- `notFound()` is used for missing slugs
- the advertising block is the main differentiator, treating ad copy like a museum placard

### 6. Music System

Ambient music is handled by:

- [src/components/music/MusicBar.tsx](/E:/virasat/virasat/src/components/music/MusicBar.tsx:1)
- [src/store/musicStore.ts](/E:/virasat/virasat/src/store/musicStore.ts:1)
- [src/data/playlistTracks.ts](/E:/virasat/virasat/src/data/playlistTracks.ts:1)
- [scripts/gen-playlist.mjs](/E:/virasat/virasat/scripts/gen-playlist.mjs:1)
- [data/playlist.csv](/E:/virasat/virasat/data/playlist.csv:1)

How it works:

- The runtime app uses Spotify's IFrame API, not the full Web Playback SDK
- A hidden 1px embed controller drives a custom UI widget
- Track metadata is matched by duration against a baked snapshot in `playlistTracks.ts`
- Next/previous is implemented by loading URIs from the snapshot
- Album art is optionally hydrated during snapshot generation using server-only Spotify credentials

This is a clever compromise:

- no runtime auth
- no Premium requirement
- no runtime playlist API dependency
- still supports custom UI and track metadata display

## State Management

The app uses Zustand with three small stores:

- [src/store/cameraStore.ts](/E:/virasat/virasat/src/store/cameraStore.ts:1)
  - visible cell range
  - current scale
  - imperative zoom controls
- [src/store/musicStore.ts](/E:/virasat/virasat/src/store/musicStore.ts:1)
  - playback readiness
  - paused state
  - position and duration
  - session-start state
  - matched track info
  - imperative music controls
- [src/store/uiStore.ts](/E:/virasat/virasat/src/store/uiStore.ts:1)
  - currently hovered item slug

## Styling and Visual Language

Global styling lives in [src/app/globals.css](/E:/virasat/virasat/src/app/globals.css:1).

Design decisions:

- warm paper-toned palette
- cream canvas background
- marigold accent
- indigo secondary accent
- custom font variables mapped through Tailwind v4 `@theme inline`
- reduced-motion handling

Fonts in the layout:

- `Inter` for general UI
- `Mukta` for Devanagari display use
- `Modak` for the hero wordmark

## Environment and Configuration

The tracked environment template is [`.env.example`](/E:/virasat/virasat/.env.example:1).

Supported variables:

- `NEXT_PUBLIC_SPOTIFY_PLAYLIST_URI`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` is also consumed by `src/config.ts`, even though it is not listed in `.env.example`

Local env files are gitignored via `.gitignore`. A local `.env.local` exists in the workspace, but its values should be treated as private and are not reproduced here.

## Build and Tooling

### Scripts

From [package.json](/E:/virasat/virasat/package.json:1):

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run gen:playlist`

### TypeScript

[tsconfig.json](/E:/virasat/virasat/tsconfig.json:1):

- `strict: true`
- `moduleResolution: bundler`
- `jsx: react-jsx`
- path alias `@/* -> ./src/*`
- includes generated Next route/type files from `.next`

### ESLint

[eslint.config.mjs](/E:/virasat/virasat/eslint.config.mjs:1):

- uses `eslint-config-next/core-web-vitals`
- uses `eslint-config-next/typescript`
- preserves standard Next ignores with explicit `globalIgnores`

### PostCSS / Tailwind

[postcss.config.mjs](/E:/virasat/virasat/postcss.config.mjs:1) configures `@tailwindcss/postcss`.

### Next Config

[next.config.ts](/E:/virasat/virasat/next.config.ts:1) is currently minimal and exports an empty `NextConfig`.

## Static Assets

### Public Folder

`public/` currently contains:

- `file.svg`
- `globe.svg`
- `next.svg`
- `vercel.svg`
- `window.svg`

These look like starter assets and are not central to the current Virasat experience.

### App Icon

- [src/app/icon.svg](/E:/virasat/virasat/src/app/icon.svg:1) exists as the app icon asset

### Real Content Asset Strategy

Real item images are expected to be placed later at:

- `public/items/<slug>.png`

The codebase is already prepared for that via `config.flags.ASSETS_PRESENT`.

## Important Implementation Choices

### Translation/Extension Defense

Several comments and behaviors in the app are specifically aimed at preventing hydration/reconciliation failures caused by:

- browser extensions
- Google Translate
- DOM-mutating translators

Defensive measures include:

- `translate="no"` on major containers
- metadata hint `google: notranslate`
- `suppressHydrationWarning` on `<html>`
- automatic retry behavior in `error.tsx`

This is one of the more distinctive engineering choices in the project.

### Placeholder-First Content Strategy

The project is intentionally designed to work without real assets:

- item cards can render without image requests
- canvas items avoid 404 storms when assets are missing
- ad copy can be replaced later without refactoring UI

### Performance-First Canvas Strategy

The canvas implementation avoids a common React pitfall: tying pointer movement to state updates. Instead it:

- stores live camera values in refs
- writes CSS transforms imperatively
- updates React-visible state only when range or zoom display changes

## Notable Observations and Small Quirks

- The nav item labeled "Categories" points to `/brands`, and that route currently renders a stub page titled "Categories".
- `brandCount` is computed from distinct `brandEn` values, but the hero text labels that number as "categories".
- `README.md` still describes the app accurately at a high level, but the new document here is broader and more implementation-specific.
- `CLAUDE.md` only contains `@AGENTS.md`, acting as a pointer rather than separate project documentation.
- `next-env.d.ts` includes a generated import from `./.next/dev/types/routes.d.ts`, so it should remain generated rather than hand-edited.

## File Inventory

This section covers the project-owned files visible in the repo, grouped by purpose.

### Root Files

- [AGENTS.md](/E:/virasat/virasat/AGENTS.md:1): local agent instruction note about reading Next 16 docs before editing
- [CLAUDE.md](/E:/virasat/virasat/CLAUDE.md:1): points to `AGENTS.md`
- [README.md](/E:/virasat/virasat/README.md:1): high-level project introduction and usage notes
- [.env.example](/E:/virasat/virasat/.env.example:1): environment variable template
- [.gitignore](/E:/virasat/virasat/.gitignore:1): ignored files and directories
- [package.json](/E:/virasat/virasat/package.json:1): scripts and dependencies
- [package-lock.json](/E:/virasat/virasat/package-lock.json:1): npm lockfile
- [tsconfig.json](/E:/virasat/virasat/tsconfig.json:1): TypeScript config
- [next.config.ts](/E:/virasat/virasat/next.config.ts:1): Next config
- [eslint.config.mjs](/E:/virasat/virasat/eslint.config.mjs:1): lint config
- [postcss.config.mjs](/E:/virasat/virasat/postcss.config.mjs:1): PostCSS config
- [next-env.d.ts](/E:/virasat/virasat/next-env.d.ts:1): generated Next types entrypoint
- [VIRASAT_PROJECT_DETAILS.md](/E:/virasat/virasat/VIRASAT_PROJECT_DETAILS.md:1): this comprehensive project document

### Source: App Routes

- [src/app/layout.tsx](/E:/virasat/virasat/src/app/layout.tsx:1)
- [src/app/page.tsx](/E:/virasat/virasat/src/app/page.tsx:1)
- [src/app/error.tsx](/E:/virasat/virasat/src/app/error.tsx:1)
- [src/app/global-error.tsx](/E:/virasat/virasat/src/app/global-error.tsx:1)
- [src/app/not-found.tsx](/E:/virasat/virasat/src/app/not-found.tsx:1)
- [src/app/globals.css](/E:/virasat/virasat/src/app/globals.css:1)
- [src/app/icon.svg](/E:/virasat/virasat/src/app/icon.svg:1)
- [src/app/brands/page.tsx](/E:/virasat/virasat/src/app/brands/page.tsx:1)
- [src/app/collection/page.tsx](/E:/virasat/virasat/src/app/collection/page.tsx:1)
- [src/app/community/page.tsx](/E:/virasat/virasat/src/app/community/page.tsx:1)
- [src/app/feed/page.tsx](/E:/virasat/virasat/src/app/feed/page.tsx:1)
- [src/app/item/[slug]/page.tsx](/E:/virasat/virasat/src/app/item/[slug]/page.tsx:1)

### Source: Components

- [src/components/nav/TopNav.tsx](/E:/virasat/virasat/src/components/nav/TopNav.tsx:1)
- [src/components/music/MusicBar.tsx](/E:/virasat/virasat/src/components/music/MusicBar.tsx:1)
- [src/components/canvas/Canvas.tsx](/E:/virasat/virasat/src/components/canvas/Canvas.tsx:1)
- [src/components/canvas/CanvasItem.tsx](/E:/virasat/virasat/src/components/canvas/CanvasItem.tsx:1)
- [src/components/canvas/HeroBlock.tsx](/E:/virasat/virasat/src/components/canvas/HeroBlock.tsx:1)
- [src/components/canvas/ZoomControls.tsx](/E:/virasat/virasat/src/components/canvas/ZoomControls.tsx:1)
- [src/components/canvas/useCanvasCamera.ts](/E:/virasat/virasat/src/components/canvas/useCanvasCamera.ts:1)
- [src/components/canvas/useVirtualization.ts](/E:/virasat/virasat/src/components/canvas/useVirtualization.ts:1)
- [src/components/collection/CollectionBrowser.tsx](/E:/virasat/virasat/src/components/collection/CollectionBrowser.tsx:1)
- [src/components/collection/Dropdown.tsx](/E:/virasat/virasat/src/components/collection/Dropdown.tsx:1)
- [src/components/collection/Filters.tsx](/E:/virasat/virasat/src/components/collection/Filters.tsx:1)
- [src/components/collection/ItemCard.tsx](/E:/virasat/virasat/src/components/collection/ItemCard.tsx:1)
- [src/components/collection/filterOptions.ts](/E:/virasat/virasat/src/components/collection/filterOptions.ts:1)
- [src/components/item/AdvertisingBlock.tsx](/E:/virasat/virasat/src/components/item/AdvertisingBlock.tsx:1)
- [src/components/item/ItemDetail.tsx](/E:/virasat/virasat/src/components/item/ItemDetail.tsx:1)
- [src/components/item/ItemPopover.tsx](/E:/virasat/virasat/src/components/item/ItemPopover.tsx:1)
- [src/components/ui/Modal.tsx](/E:/virasat/virasat/src/components/ui/Modal.tsx:1)
- [src/components/ui/Placeholder.tsx](/E:/virasat/virasat/src/components/ui/Placeholder.tsx:1)
- [src/components/ui/StubPage.tsx](/E:/virasat/virasat/src/components/ui/StubPage.tsx:1)

### Source: Data, Stores, and Lib

- [src/config.ts](/E:/virasat/virasat/src/config.ts:1)
- [src/data/items.ts](/E:/virasat/virasat/src/data/items.ts:1)
- [src/data/playlistTracks.ts](/E:/virasat/virasat/src/data/playlistTracks.ts:1)
- [src/store/cameraStore.ts](/E:/virasat/virasat/src/store/cameraStore.ts:1)
- [src/store/musicStore.ts](/E:/virasat/virasat/src/store/musicStore.ts:1)
- [src/store/uiStore.ts](/E:/virasat/virasat/src/store/uiStore.ts:1)
- [src/lib/grid.ts](/E:/virasat/virasat/src/lib/grid.ts:1)
- [src/lib/seededRandom.ts](/E:/virasat/virasat/src/lib/seededRandom.ts:1)

### Source: Scripts and Data Inputs

- [scripts/gen-playlist.mjs](/E:/virasat/virasat/scripts/gen-playlist.mjs:1)
- [data/playlist.csv](/E:/virasat/virasat/data/playlist.csv:1)

### Static Assets

- [public/file.svg](/E:/virasat/virasat/public/file.svg:1)
- [public/globe.svg](/E:/virasat/virasat/public/globe.svg:1)
- [public/next.svg](/E:/virasat/virasat/public/next.svg:1)
- [public/vercel.svg](/E:/virasat/virasat/public/vercel.svg:1)
- [public/window.svg](/E:/virasat/virasat/public/window.svg:1)

## Generated, Installed, or Runtime Directories

These exist in the folder but are not project-authored source:

- `.git/`: Git metadata
- `node_modules/`: installed third-party dependencies
- `.next/`: Next.js build/dev output
- `tsconfig.tsbuildinfo`: TypeScript incremental build cache

They matter operationally, but they are not the main place to understand the app's intent.

## Best Entry Points For Future Work

If someone is new to the project, the fastest high-signal files to read first are:

1. [README.md](/E:/virasat/virasat/README.md:1)
2. [src/config.ts](/E:/virasat/virasat/src/config.ts:1)
3. [src/app/page.tsx](/E:/virasat/virasat/src/app/page.tsx:1)
4. [src/components/canvas/useCanvasCamera.ts](/E:/virasat/virasat/src/components/canvas/useCanvasCamera.ts:1)
5. [src/data/items.ts](/E:/virasat/virasat/src/data/items.ts:1)
6. [src/components/music/MusicBar.tsx](/E:/virasat/virasat/src/components/music/MusicBar.tsx:1)
7. [src/components/collection/CollectionBrowser.tsx](/E:/virasat/virasat/src/components/collection/CollectionBrowser.tsx:1)

## Bottom Line

`virasat` is already more than a scaffold. It has:

- a clear product thesis
- a polished visual direction
- a performant custom canvas implementation
- a reusable data model
- a practical placeholder strategy
- a surprisingly thoughtful no-auth music integration

What is still missing is mostly content maturity and expansion of the non-canvas sections, not a core architectural foundation.
