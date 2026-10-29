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

/**
 * Sum of circled product prices, in minor units of the list's currency.
 * Items priced in another currency (a link from an overseas shop) can't be
 * added up honestly, so they're left out and counted in `otherCurrencyCount`.
 */
export function runningTotalMinor(
  marks: Record<string, CircleMark>,
  products: Record<string, Product>,
  currency = 'GBP',
): number {
  return Object.keys(marks).reduce((sum, id) => {
    const p = products[id];
    return p && p.currency === currency ? sum + p.priceMinor : sum;
  }, 0);
}

/** How many circled items are priced in a different currency from the list. */
export function otherCurrencyCount(
  marks: Record<string, CircleMark>,
  products: Record<string, Product>,
  currency: string,
): number {
  return Object.keys(marks).filter((id) => products[id] && products[id].currency !== currency).length;
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

export { formatMoney } from './money';
