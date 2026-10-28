import { describe, expect, it } from '@jest/globals';

import { hashSeed, seededRandom, wobblyCircle } from '../wobbly-circle';

describe('wobblyCircle', () => {
  it('draws the same circle for the same seed', () => {
    expect(wobblyCircle(160, 220, 42).d).toBe(wobblyCircle(160, 220, 42).d);
  });

  it('draws different circles for different seeds', () => {
    expect(wobblyCircle(160, 220, 1).d).not.toBe(wobblyCircle(160, 220, 2).d);
  });

  it('never quite closes: the start and end of the stroke are apart', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { points } = wobblyCircle(160, 220, seed);
      const [x0, y0] = points[0];
      const [x1, y1] = points[points.length - 1];
      expect(Math.hypot(x1 - x0, y1 - y0)).toBeGreaterThan(5);
    }
  });

  it('measures a stroke a bit longer than one lap of the ellipse', () => {
    // Ramanujan's approximation of an ellipse's perimeter.
    const a = 80, b = 220 * 0.49;
    const lap = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    for (let seed = 0; seed < 20; seed++) {
      const { length } = wobblyCircle(160, 220, seed);
      expect(length).toBeGreaterThan(lap * 0.95);
      expect(length).toBeLessThan(lap * 1.25);
    }
  });

  it('stays roughly within its box', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const [x, y] of wobblyCircle(160, 220, seed).points) {
        expect(x).toBeGreaterThan(-12);
        expect(x).toBeLessThan(172);
        expect(y).toBeGreaterThan(-12);
        expect(y).toBeLessThan(232);
      }
    }
  });
});

describe('seeds', () => {
  it('hashes product ids stably', () => {
    expect(hashSeed('p14')).toBe(hashSeed('p14'));
    expect(hashSeed('p14')).not.toBe(hashSeed('p13'));
  });

  it('produces numbers in [0, 1)', () => {
    const rand = seededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const n = rand();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
