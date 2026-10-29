import { describe, expect, it } from '@jest/globals';

import { createList, listReducer } from '../list-reducer';
import {
  claimsFromRows,
  groupGiftsFromRows,
  marksFromRows,
  ownerRows,
  productsFromRows,
  serverError,
  SERVER_ERROR_TEXT,
  type ClaimRow,
  type GiverRow,
} from '../remote-rows';
import type { Product } from '../types';

const lamp: Product = {
  id: 'custom-1',
  catalogueNo: '',
  title: 'Glitter Unicorn Lamp',
  categoryKey: 'yours',
  priceMinor: 2499,
  currency: 'GBP',
  retailer: 'Sparkle Toys',
  url: 'https://toys.example/lamp',
  emoji: '🎁',
  imageUrl: 'https://toys.example/lamp.jpg',
};

const list = [
  { type: 'tap', productId: 'p2', now: Date.UTC(2026, 10, 1) },
  { type: 'tap', productId: 'p2', now: Date.UTC(2026, 10, 1) },
  { type: 'addCustomProduct', product: lamp, now: Date.UTC(2026, 10, 2) },
].reduce(listReducer as never, createList('list-1')) as ReturnType<typeof createList>;

const givers: GiverRow[] = [
  { list_id: 'list-1', user_id: 'u-nan', display_name: 'Nan' },
  { list_id: 'list-1', user_id: 'u-dave', display_name: 'Dave' },
];

describe('owner rows', () => {
  it('round-trips circles and found products through database rows', () => {
    const rows = ownerRows(list);
    expect(rows.list).toEqual({ id: 'list-1', title: list.settings.title, settings: list.settings });
    expect(rows.marks).toContainEqual({ list_id: 'list-1', product_id: 'p2', stars: 2, circled_at: '2026-11-01T00:00:00.000Z' });
    expect(marksFromRows(rows.marks)).toEqual(list.marks);
    expect(productsFromRows(rows.products, 'yours')).toEqual(list.customProducts);
  });

  it('stores a missing photo as null and leaves it off on the way back', () => {
    const plain = { ...lamp, imageUrl: undefined };
    const rows = ownerRows({ ...list, customProducts: { [plain.id]: plain } });
    expect(rows.products[0].image_url).toBeNull();
    expect('imageUrl' in productsFromRows(rows.products, 'yours')[plain.id]).toBe(false);
  });
});

describe('giver rows', () => {
  it('turns giver ids back into names', () => {
    const rows: ClaimRow[] = [
      { list_id: 'list-1', product_id: 'p2', giver_id: 'u-nan', status: 'held', claimed_at: '2026-11-01T10:00:00Z', held_until: '2026-11-03T10:00:00Z' },
      { list_id: 'list-1', product_id: 'p4', giver_id: 'u-gone', status: 'bought', claimed_at: '2026-11-01T10:00:00Z', held_until: '2026-11-03T10:00:00Z' },
    ];
    const claims = claimsFromRows(rows, givers);
    expect(claims.p2).toEqual({
      productId: 'p2',
      giverName: 'Nan',
      status: 'held',
      claimedAt: Date.UTC(2026, 10, 1, 10),
      heldUntil: Date.UTC(2026, 10, 3, 10),
    });
    expect(claims.p4.giverName).toBe('Someone');
  });

  it('groups pledges under their gift', () => {
    const gifts = groupGiftsFromRows(
      [{ list_id: 'list-1', product_id: 'p13', organiser_id: 'u-dave' }],
      [
        { list_id: 'list-1', product_id: 'p13', giver_id: 'u-dave', amount_minor: 5000 },
        { list_id: 'list-1', product_id: 'p13', giver_id: 'u-nan', amount_minor: 2500 },
        { list_id: 'list-1', product_id: 'p99', giver_id: 'u-nan', amount_minor: 100 },
      ],
      givers,
    );
    expect(gifts.p13).toEqual({
      productId: 'p13',
      organiserName: 'Dave',
      pledges: [
        { giverName: 'Dave', amountMinor: 5000 },
        { giverName: 'Nan', amountMinor: 2500 },
      ],
    });
  });
});

describe('server errors', () => {
  it('recognises our codes and nothing else', () => {
    expect(serverError('already-claimed')).toBe('already-claimed');
    expect(serverError(' name-taken ')).toBe('name-taken');
    expect(serverError('duplicate key value violates unique constraint')).toBe('unknown');
    expect(serverError(undefined)).toBe('unknown');
  });

  it('has friendly words for every code', () => {
    for (const text of Object.values(SERVER_ERROR_TEXT)) expect(text.length).toBeGreaterThan(10);
  });
});
