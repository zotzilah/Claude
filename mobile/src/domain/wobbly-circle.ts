/**
 * Procedural "biro circle" paths. Each circle overshoots its start and never quite
 * closes, like a real hand-drawn one. The same seed always draws the same circle,
 * so a child's circle looks identical every time the list is opened
 * (stored as `circle_seed` in the data model).
 */

/** Small, fast seeded PRNG (mulberry32). Returns values in [0, 1). */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit FNV-1a hash, used to derive a circle seed from a product id. */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export interface WobblyCircle {
  /** SVG path data. */
  d: string;
  /** Points along the stroke, in drawing order. */
  points: [number, number][];
}

/** Draws a wobbly circle that fits a `width` × `height` box. */
export function wobblyCircle(width: number, height: number, seed: number, steps = 90): WobblyCircle {
  const rand = seededRandom(seed);
  const cx = width / 2 + (rand() - 0.5) * 6;
  const cy = height / 2 + (rand() - 0.5) * 6;
  const rx = width * 0.5;
  const ry = height * 0.49;
  // Start up and to the left, the way a right-handed child usually starts a circle.
  const start = -2.3 + (rand() - 0.5) * 0.6;
  const overshoot = 0.35 + rand() * 0.45;
  const span = Math.PI * 2 + overshoot;
  const phase1 = rand() * Math.PI * 2;
  const phase2 = rand() * Math.PI * 2;
  // A slight spiral, so the two ends of the stroke don't line up.
  const drift = 0.03 + rand() * 0.04;

  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = start + u * span;
    const k = 0.97 + 0.03 * Math.sin(2 * a + phase1) + 0.018 * Math.sin(3 * a + phase2) + drift * (u - 0.5);
    points.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  return { d, points };
}
