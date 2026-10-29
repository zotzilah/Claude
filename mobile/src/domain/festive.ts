/**
 * The Christmas theme's moving parts, as plain rules: when Santa visits and where
 * the snowflakes fall. Kept apart from the drawing so they can be tested.
 */

/** Santa visits every one to two minutes, at random, so it stays a treat. */
export const SANTA_GAP_MS = { min: 60_000, max: 120_000 };
/** His first visit comes sooner, so people actually see him. */
export const SANTA_FIRST_MS = { min: 8_000, max: 20_000 };

/** How long until Santa's next visit. */
export function nextVisitIn(first: boolean, random: () => number = Math.random): number {
  const { min, max } = first ? SANTA_FIRST_MS : SANTA_GAP_MS;
  return Math.round(min + random() * (max - min));
}

export interface Flake {
  x: number;
  size: number;
  opacity: number;
  durationMs: number;
  /** Where in its fall the flake starts, so the screen isn't empty for the first few seconds. */
  head: number;
  drift: number;
}

/** The same flakes every time, so snow doesn't jump around when a screen redraws. */
export function makeFlakes(count: number, seed = 7): Flake[] {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, () => ({
    x: rnd(),
    size: 2.5 + rnd() * 4.5,
    opacity: 0.55 + rnd() * 0.45,
    durationMs: 7000 + rnd() * 9000,
    head: rnd(),
    drift: 8 + rnd() * 22,
  }));
}
