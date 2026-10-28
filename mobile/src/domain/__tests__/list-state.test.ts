import { describe, expect, it } from '@jest/globals';

import { createList, listReducer, type ListAction } from '../list-reducer';
import { featuresFor, possessive, templates } from '../settings';
import { parseSnapshot, serialize } from '../snapshot';
import type { ListState, Product } from '../types';

const run = (actions: ListAction[], start: ListState = createList('list-1')) => actions.reduce(listReducer, start);

const pasted: Product = {
  id: 'custom-1',
  catalogueNo: '',
  title: 'Glitter Unicorn Lamp',
  categoryKey: 'yours',
  priceMinor: 2499,
  currency: 'GBP',
  retailer: 'example.com',
  url: 'https://example.com/lamp',
  emoji: '🎁',
};

describe('settings helpers', () => {
  it('makes possessive names', () => {
    expect(possessive('Ellie')).toBe("Ellie's");
    expect(possessive('James ')).toBe("James'");
    expect(possessive('')).toBe('My');
  });

  it('titles lists from templates', () => {
    expect(templates[0].title('Ellie', 2026)).toBe("Ellie's Christmas Book 2026");
  });

  it('adapts features to who is buying', () => {
    expect(featuresFor('just-me')).toEqual({ claiming: false, groupGifts: false, giverLink: false });
    expect(featuresFor('partner')).toEqual({ claiming: true, groupGifts: false, giverLink: true });
    expect(featuresFor('family')).toEqual({ claiming: true, groupGifts: true, giverLink: true });
  });
});

describe('listReducer', () => {
  it('only allows Kid Mode when a child is circling', () => {
    expect(run([{ type: 'setKidMode', on: true }]).kidMode).toBe(true);
    const adults = run([{ type: 'updateSettings', patch: { circler: 'adult' } }, { type: 'setKidMode', on: true }]);
    expect(adults.kidMode).toBe(false);
  });

  it('leaves state untouched when a claim breaks the rules', () => {
    const claimed = run([{ type: 'claim', productId: 'p1', giverName: 'Nan', now: 0 }]);
    const again = listReducer(claimed, { type: 'claim', productId: 'p1', giverName: 'Dave', now: 1 });
    expect(again).toBe(claimed);
  });

  it('trims giver names so "Nan " and "Nan" are the same person', () => {
    const state = run([
      { type: 'claim', productId: 'p1', giverName: 'Nan ', now: 0 },
      { type: 'markBought', productId: 'p1', giverName: 'Nan', now: 1 },
    ]);
    expect(state.claims.p1.status).toBe('bought');
  });

  it('circles a pasted product straight away, without un-circling it if added again', () => {
    const once = run([{ type: 'addCustomProduct', product: pasted, now: 5 }]);
    expect(once.marks['custom-1'].stars).toBe(1);
    const twice = listReducer(once, { type: 'addCustomProduct', product: pasted, now: 6 });
    expect(twice.marks['custom-1'].stars).toBe(1);
  });

  it('completes setup with the chosen settings', () => {
    const settings = { ...createList('x').settings, circlerName: 'Ellie', budgetMinor: 20000 };
    const state = run([{ type: 'completeSetup', settings }]);
    expect(state.setupComplete).toBe(true);
    expect(state.settings.budgetMinor).toBe(20000);
  });
});

describe('snapshot', () => {
  const full = run([
    { type: 'completeSetup', settings: { ...createList('x').settings, circlerName: 'Ellie', ageBand: '6-8' } },
    { type: 'tap', productId: 'p2', now: 1 },
    { type: 'tap', productId: 'p2', now: 2 },
    { type: 'addCustomProduct', product: pasted, now: 3 },
    { type: 'claim', productId: 'p2', giverName: 'Nan', now: 4 },
    { type: 'startGroupGift', productId: 'p13', organiserName: 'Dave' },
    { type: 'pledge', productId: 'p13', giverName: 'Sue', amountMinor: 2500 },
    { type: 'setKidMode', on: true },
  ]);

  it('round-trips a full list exactly', () => {
    expect(parseSnapshot(serialize(full))).toEqual(full);
  });

  it('starts fresh on missing, corrupt or unknown saves', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot('{not json')).toBeNull();
    expect(parseSnapshot('[]')).toBeNull();
    expect(parseSnapshot(JSON.stringify({ v: 99, list: full }))).toBeNull();
    expect(parseSnapshot(JSON.stringify({ v: 1, list: { ...full, id: '' } }))).toBeNull();
  });

  it('drops bad entries but keeps the good ones', () => {
    const raw = JSON.parse(serialize(full));
    raw.list.marks.bogus = { productId: 'bogus', stars: 7 };
    raw.list.claims.broken = { productId: 'x' };
    raw.list.customProducts.cheap = { ...pasted, id: 'cheap', priceMinor: -1 };
    raw.list.groupGifts.p13.pledges.push({ giverName: 'Bob', amountMinor: 'lots' });
    const parsed = parseSnapshot(JSON.stringify(raw))!;
    expect(parsed.marks.bogus).toBeUndefined();
    expect(parsed.marks.p2.stars).toBe(2);
    expect(parsed.claims.broken).toBeUndefined();
    expect(parsed.customProducts.cheap).toBeUndefined();
    expect(parsed.groupGifts.p13.pledges).toEqual([{ giverName: 'Sue', amountMinor: 2500 }]);
  });

  it('falls back to defaults for invalid settings', () => {
    const raw = JSON.parse(serialize(full));
    raw.list.settings.buyers = 'everyone';
    raw.list.settings.budgetMinor = 99.5;
    const parsed = parseSnapshot(JSON.stringify(raw))!;
    expect(parsed.settings.buyers).toBe('family');
    expect(parsed.settings.budgetMinor).toBe(15000);
    expect(parsed.settings.circlerName).toBe('Ellie');
  });
});
