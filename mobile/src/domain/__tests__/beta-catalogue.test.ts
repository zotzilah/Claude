import { describe, expect, it } from '@jest/globals';

import { categories, products } from '../../data/catalogue';
import { parseCatalogueNumber } from '../catalogue-number';
import { checkProduct } from '../moderation';

describe('the real beta catalogue', () => {
  it('has products on every page', () => {
    for (const page of categories) {
      expect(products.filter((p) => p.categoryKey === page.key).length).toBeGreaterThan(0);
    }
  });

  it('gives every product a unique catalogue number from its own page', () => {
    const family = Object.fromEntries(categories.map((c) => [c.key, c.familyCode]));
    const numbers = new Set<string>();
    for (const p of products) {
      expect(parseCatalogueNumber(p.catalogueNo)).toBe(p.catalogueNo);
      expect(p.catalogueNo.startsWith(String(family[p.categoryKey]).padStart(3, '0'))).toBe(true);
      expect(numbers.has(p.catalogueNo)).toBe(false);
      numbers.add(p.catalogueNo);
    }
  });

  it('links every product to a real shop over https, with a sensible price', () => {
    for (const p of products) {
      expect(p.url).toMatch(/^https:\/\/www\.(argos\.co\.uk|thetoyshop\.com|hamleys\.com|johnlewis\.com|smythstoys\.com|bigjigstoys\.co\.uk)\//);
      expect(Number.isInteger(p.priceMinor)).toBe(true);
      expect(p.priceMinor).toBeGreaterThan(0);
      expect(p.currency).toBe('GBP');
    }
  });

  it("passes the same checks as products families add, on a child's list", () => {
    for (const p of products) {
      const result = checkProduct({ url: p.url, title: p.title, priceMinor: p.priceMinor, currency: p.currency, imageUrl: 'x' }, true);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.flags).not.toContain('grown-up-item');
    }
  });
});
