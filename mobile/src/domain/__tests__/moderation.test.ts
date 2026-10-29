import { describe, expect, it } from '@jest/globals';

import { createList } from '../list-reducer';
import { canonicalUrl, checkProduct, findDuplicate, type Candidate } from '../moderation';
import { parseSnapshot, serialize } from '../snapshot';

const item = (over: Partial<Candidate> = {}): Candidate => ({
  url: 'https://www.argos.co.uk/product/123',
  title: 'Dino Dig Excavation Kit',
  priceMinor: 1299,
  currency: 'GBP',
  imageUrl: 'https://example.com/dino.jpg',
  ...over,
});

describe('checkProduct', () => {
  it('lets ordinary toys through with no flags', () => {
    expect(checkProduct(item(), true)).toEqual({ ok: true, flags: [] });
  });

  it.each([
    ['https://www.pornhub.com/x', 'adult-site'],
    ['https://shop.lovehoney.co.uk/p/1', 'adult-site'],
    ['https://anything.xxx/p', 'adult-site'],
    ['https://www.bet365.com/offer', 'adult-site'],
    ['https://www.google.com/search?q=lego', 'not-a-shop'],
    ['https://bit.ly/3abc', 'not-a-shop'],
    ['https://www.instagram.com/p/abc', 'not-a-shop'],
    ['not a link', 'not-a-shop'],
  ])('refuses %s', (url, reason) => {
    expect(checkProduct(item({ url }), false)).toEqual({ ok: false, reason });
  });

  it('refuses rude names, including disguised ones, without tripping on innocent words', () => {
    expect(checkProduct(item({ title: 'F*ck it mug' }), false)).toEqual({ ok: false, reason: 'bad-words' });
    expect(checkProduct(item({ title: 'SH1T happens tee' }), false)).toEqual({ ok: false, reason: 'bad-words' });
    expect(checkProduct(item({ title: 'Scunthorpe United scarf' }), true).ok).toBe(true);
    expect(checkProduct(item({ title: 'Cockatoo soft toy' }), true).ok).toBe(true);
    expect(checkProduct(item({ title: 'Assassin bow kit' }), true).ok).toBe(true);
  });

  it('refuses impossible prices', () => {
    expect(checkProduct(item({ priceMinor: 0 }), false)).toEqual({ ok: false, reason: 'silly-price' });
    expect(checkProduct(item({ priceMinor: 100_000_00 }), false)).toEqual({ ok: false, reason: 'silly-price' });
    expect(checkProduct(item({ priceMinor: 150_000, currency: 'JPY' }), false)).toEqual({ ok: true, flags: [] });
    expect(checkProduct(item({ priceMinor: 150_000 }), false)).toEqual({ ok: true, flags: ['pricey'] });
  });

  it('flags grown-up items only on a child\'s list', () => {
    const wine = item({ title: 'Red wine gift set' });
    expect(checkProduct(wine, true)).toEqual({ ok: true, flags: ['grown-up-item'] });
    expect(checkProduct(wine, false)).toEqual({ ok: true, flags: [] });
    expect(checkProduct(item({ title: 'Vape starter kit' }), true)).toEqual({ ok: true, flags: ['grown-up-item'] });
    expect(checkProduct(item({ title: 'Ginger biscuit kit' }), true)).toEqual({ ok: true, flags: [] });
  });

  it('flags things a person should glance at', () => {
    expect(checkProduct(item({ url: 'https://tiny-toy-shop.example/p/1', priceMinor: 120_000, imageUrl: null }), false)).toEqual({
      ok: true,
      flags: ['unknown-shop', 'pricey', 'no-photo'],
    });
  });
});

describe('duplicates', () => {
  it('sees through tracking codes, www, fragments and trailing slashes', () => {
    expect(canonicalUrl('https://www.argos.co.uk/product/123/?utm_source=x&fbclid=y#reviews')).toBe(
      'https://argos.co.uk/product/123',
    );
    expect(canonicalUrl('https://shop.example/p?size=m&colour=red&gclid=1')).toBe('https://shop.example/p?colour=red&size=m');
  });

  it('shrinks Amazon links to the product code', () => {
    expect(canonicalUrl('https://www.amazon.co.uk/Some-Long-Name/dp/b0abc12345/ref=sr_1_3?keywords=lego')).toBe(
      'https://amazon.co.uk/dp/B0ABC12345',
    );
  });

  it('finds a product already on the list', () => {
    const products = [
      { id: 'a', url: 'https://argos.co.uk/product/123' },
      { id: 'b', url: '' },
    ];
    expect(findDuplicate('https://www.argos.co.uk/product/123?utm_medium=share', products)?.id).toBe('a');
    expect(findDuplicate('https://argos.co.uk/product/999', products)).toBeNull();
  });
});

describe('saving review flags', () => {
  it('keeps known flags and drops junk when a list is reloaded', () => {
    const list = createList('l1');
    list.customProducts.x = {
      id: 'x', catalogueNo: '', title: 'Lamp', categoryKey: 'yours', priceMinor: 1999, currency: 'GBP',
      retailer: 'Lamp Co', url: 'https://lamp.example/p', emoji: '🎁', reviewFlags: ['unknown-shop', 'no-photo'],
    };
    const json = serialize(list).replace('"no-photo"', '"no-photo","hacked"');
    expect(parseSnapshot(json)?.customProducts.x.reviewFlags).toEqual(['unknown-shop', 'no-photo']);
  });
});
