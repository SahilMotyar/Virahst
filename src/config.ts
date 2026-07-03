/**
 * Central configuration for Virasat.
 * Everything brand-, copy-, or behaviour-tunable lives here so the maintainer
 * can re-skin the museum without touching component code.
 */

export const config = {
  // --- Brand / copy ------------------------------------------------------
  brand: "virasat",
  /** Devanagari hero title shown in the centre of the canvas. */
  heroTitle: "विरासत",
  /** Wide-tracked grey uppercase subtitle under the title. */
  heroSubtitle: "THE INDIAN VINTAGE ARCHIVE",
  tagline: "The everyday things India advertised, collected like art.",
  /** Absolute site URL — used as metadataBase so OG/Twitter URLs resolve. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://virasat.netlify.app",
  /** Logo glyph shown in the rounded-square mark. */
  logoGlyph: "वि",
  /** Credit line in the hero block. */
  handle: "@virasat",

  // --- Music (Phase 4) ---------------------------------------------------
  spotifyPlaylistUri:
    process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URI ??
    "spotify:playlist:0aBAEnrFO9opzfor65TEcu",
  /** Label shown in the MusicBar (no track metadata via the IFrame API). */
  musicLabel: "Ambient · विरासत",

  // --- Feature flags -----------------------------------------------------
  flags: {
    /**
     * true  → tile the grid endlessly by wrapping the item list (repeats).
     * false → every item appears exactly once, centre-out around the hero,
     *         and the camera is clamped to the finite field (see lib/grid.ts).
     */
    INFINITE_WRAP: false,
    /** Master switch for the ambient music bar. */
    MUSIC_ENABLED: true,
    /**
     * Whether real item images exist under /public/items. While false, items
     * render <Placeholder> directly and skip the <img> entirely — avoiding a
     * storm of 404 requests. Flip to true once assets are dropped in.
     */
    ASSETS_PRESENT: false,
  },
} as const;

// --- Canvas geometry & camera --------------------------------------------
// World units are pixels at scale = 1.

/** Horizontal spacing between grid cells. */
export const CELL_W = 230;
/** Vertical spacing between grid cells. */
export const CELL_H = 270;
/** Max deterministic per-item jitter (px). 0 = clean aligned matrix. */
export const JITTER = 0;

/** Rendered footprint of a single canvas item (px, world space). */
export const ITEM_W = 168;
export const ITEM_H = 210;

// MIN_SCALE is kept fairly high so the worst-case mounted-item count (when
// fully zoomed out) stays small enough to pan at 60fps.
export const MIN_SCALE = 0.32;
export const MAX_SCALE = 2.5;
export const INITIAL_SCALE = 0.72;

/** Step applied by the +/- zoom buttons. */
export const ZOOM_STEP = 1.25;

/** Momentum velocity decay per frame after a flick. */
export const MOMENTUM_DECAY = 0.92;

/**
 * Reserved empty rectangle of cells (inclusive) in the centre of the grid.
 * The hero block is rendered here so it pans/zooms with the canvas. Kept snug
 * around the title so the surrounding cards don't feel marooned.
 */
export const HERO_HOLE = {
  minCol: -2,
  maxCol: 2,
  minRow: -1,
  maxRow: 1,
} as const;

/**
 * World-space centre of the hero hole. Item centres sit at (cell + 0.5) * CELL,
 * so the hole's true centre is the mid cell plus half a cell — getting this
 * right is what puts the title in the middle of the empty band.
 */
export const HERO_CENTER = {
  x: ((HERO_HOLE.minCol + HERO_HOLE.maxCol) / 2 + 0.5) * CELL_W,
  y: ((HERO_HOLE.minRow + HERO_HOLE.maxRow) / 2 + 0.5) * CELL_H,
} as const;

/**
 * Finite grid bounds (inclusive, in cells) used when INFINITE_WRAP is false.
 * Sized snugly around HERO_HOLE so every item gets exactly one cell with a
 * couple to spare: 11×7 = 77 cells − 15 hero cells = 62 slots for ~60 items
 * (the two left over stay empty at the far corners). Also the region the
 * camera pan-clamp keeps in view. Widen if the collection outgrows it.
 */
export const GRID_BOUNDS = {
  minCol: -5,
  maxCol: 5,
  minRow: -3,
  maxRow: 3,
} as const;

/** Extra world-space margin (px) of items mounted beyond the viewport edge. */
export const OVERSCAN = 220;
