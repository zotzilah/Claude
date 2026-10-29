import { describe, expect, it } from '@jest/globals';

import { categories, productsIn, yourFinds } from '@/data/sample-catalogue';

import { buildCatalogueIndex } from '../catalogue-index';
import type { Product } from '../types';

describe('buildCatalogueIndex', () => {
  const index = buildCatalogueIndex(categories, productsIn);
  const all = index.flatMap((s) => s.entries);

  it('lists every product and every page once', () => {
    expect(all.filter((e) => e.kind === 'product')).toHaveLength(24);
    expect(all.filter((e) => e.kind === 'page').map((e) => e.ref)).toEqual(
      expect.arrayContaining(['PAGE 214', 'PAGE 318', 'PAGE 482', 'PAGE 527']),
    );
  });

  it('groups alphabetically, numbers first, ignoring "The" and punctuation', () => {
    expect(index[0].letter).toBe('#');
    expect(index[0].entries[0].label).toBe('16" Kids Bike, Blue');
    const letters = index.map((s) => s.letter).filter((l) => l !== '#');
    expect(letters).toEqual([...letters].sort());
    for (const section of index.slice(1)) {
      for (const entry of section.entries) {
        expect(entry.label.replace(/^the\s+/i, '').charAt(0).toUpperCase()).toBe(section.letter);
      }
    }
  });

  it('points each entry at the right page', () => {
    const scooter = all.find((e) => e.label === 'Light-Up Scooter');
    expect(scooter).toMatchObject({ ref: '482/1190', pageIndex: 2, kind: 'product', productId: 'p14' });
  });

  it('includes found products, labelled YOURS', () => {
    const lamp: Product = {
      id: 'custom-1', catalogueNo: '', title: 'The Glitter Lamp', categoryKey: 'yours', priceMinor: 100,
      currency: 'GBP', retailer: '', url: 'https://x.example', emoji: '🎁',
    };
    const withFinds = buildCatalogueIndex([...categories, yourFinds], (key) => (key === 'yours' ? [lamp] : productsIn(key)));
    const g = withFinds.find((s) => s.letter === 'G')!;
    expect(g.entries.find((e) => e.productId === 'custom-1')).toMatchObject({ ref: 'YOURS', pageIndex: 4 });
  });
});
