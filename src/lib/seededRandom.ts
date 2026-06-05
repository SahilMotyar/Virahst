/**
 * Deterministic pseudo-random helpers. Used so the canvas layout (jitter,
 * item-to-cell assignment) is stable across renders and SSR/client, avoiding
 * hydration mismatches and visual "jumping".
 */

/** FNV-1a style string hash → unsigned 32-bit int. */
export function hashStringToInt(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — returns a function yielding floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic signed jitter in [-range, range] keyed by an arbitrary string. */
export function seededJitter(key: string, range: number): number {
  const rand = mulberry32(hashStringToInt(key));
  return (rand() * 2 - 1) * range;
}
