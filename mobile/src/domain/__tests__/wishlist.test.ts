import { describe, expect, it } from '@jest/globals';

import type { CircleMark, Product } from '../types';
import { budgetStatus, formatMoney, nextStars, runningTotalMinor, sortedWishes, tapProduct } from '../wishlist';

const product = (id: string, priceMinor: number): Product => ({
  id,
  catalogueNo: '214/0001',
  title: id,
  categoryKey: 'bricks',
  priceMinor,
  currency: 'GBP',
  retailer: 'Shop',
  url: 'https://example.com',
  emoji: '🎁',
});

const products = {
  bike: product('bike', 14999),
  kite: product('kite', 899),
  dino: product('dino', 1299),
};

describe('nextStars', () => {
  it('cycles circle → ★★ → ★★★ → rubbed out', () => {
    expect(nextStars(null)).toBe(1);
    expect(nextStars(1)).toBe(2);
    expect(nextStars(2)).toBe(3);
    expect(nextStars(3)).toBeNull();
  });
});

describe('tapProduct', () => {
  it('circles, stars up, then removes without mutating the input', () => {
    const empty: Record<string, CircleMark> = {};
    const one = tapProduct(empty, 'kite', 100);
    expect(empty).toEqual({});
    expect(one.kite).toEqual({ productId: 'kite', stars: 1, circledAt: 100 });

    const two = tapProduct(one, 'kite', 200);
    expect(two.kite.stars).toBe(2);
    expect(two.kite.circledAt).toBe(100);

    const gone = tapProduct(tapProduct(two, 'kite', 300), 'kite', 400);
    expect(gone.kite).toBeUndefined();
  });
});

describe('totals', () => {
  const marks = tapProduct(tapProduct({}, 'bike', 1), 'kite', 2);

  it('adds circled prices in minor units', () => {
    expect(runningTotalMinor(marks, products)).toBe(15898);
  });

  it('ignores marks for products that no longer exist', () => {
    expect(runningTotalMinor(tapProduct(marks, 'deleted', 3), products)).toBe(15898);
  });

  it('reports budget status', () => {
    const under = budgetStatus(10000, 15000);
    expect(under).toMatchObject({ over: false, remainingMinor: 5000 });
    expect(under.progress).toBeCloseTo(2 / 3);

    const over = budgetStatus(15898, 15000);
    expect(over).toMatchObject({ over: true, progress: 1, remainingMinor: -898 });
  });

  it('formats money', () => {
    expect(formatMoney(14999)).toBe('£149.99');
  });
});

describe('sortedWishes', () => {
  it('puts the most-wanted first, then the priciest', () => {
    let marks = tapProduct({}, 'kite', 1);
    marks = tapProduct(marks, 'bike', 2);
    marks = tapProduct(tapProduct(tapProduct(marks, 'dino', 3), 'dino', 4), 'dino', 5);
    expect(sortedWishes(marks, products).map((w) => w.product.id)).toEqual(['dino', 'bike', 'kite']);
  });
});
