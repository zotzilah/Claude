import type { CircleMark, Product, Stars } from './types';

/**
 * One tap on a product: uncircled → ★ → ★★ → ★★★ → rubbed out.
 * Returns the next star count, or null when the circle is removed.
 */
export function nextStars(current: Stars | null): Stars | null {
  if (current === null) return 1;
  if (current === 3) return null;
  return (current + 1) as Stars;
}

/** Applies a tap to a set of marks without mutating it. */
export function tapProduct(
  marks: Record<string, CircleMark>,
  productId: string,
  now: number,
): Record<string, CircleMark> {
  const existing = marks[productId];
  const stars = nextStars(existing ? existing.stars : null);
  const next = { ...marks };
  if (stars === null) {
    delete next[productId];
  } else {
    next[productId] = { productId, stars, circledAt: existing ? existing.circledAt : now };
  }
  return next;
}

/** Sum of circled product prices, in minor units. */
export function runningTotalMinor(
  marks: Record<string, CircleMark>,
  products: Record<string, Product>,
): number {
  return Object.keys(marks).reduce((sum, id) => sum + (products[id]?.priceMinor ?? 0), 0);
}

export interface BudgetStatus {
  totalMinor: number;
  budgetMinor: number;
  /** 0–1, capped at 1 for drawing the progress bar. */
  progress: number;
  over: boolean;
  /** Positive when under budget, negative when over. */
  remainingMinor: number;
}

export function budgetStatus(totalMinor: number, budgetMinor: number): BudgetStatus {
  const progress = budgetMinor > 0 ? Math.min(1, totalMinor / budgetMinor) : 1;
  return {
    totalMinor,
    budgetMinor,
    progress,
    over: totalMinor > budgetMinor,
    remainingMinor: budgetMinor - totalMinor,
  };
}

/** Circled items, most wanted first, then most expensive first. */
export function sortedWishes(
  marks: Record<string, CircleMark>,
  products: Record<string, Product>,
): { product: Product; stars: Stars }[] {
  return Object.values(marks)
    .filter((m) => products[m.productId])
    .map((m) => ({ product: products[m.productId], stars: m.stars }))
    .sort((a, b) => b.stars - a.stars || b.product.priceMinor - a.product.priceMinor);
}

export function formatMoney(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100);
}
