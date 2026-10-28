import { describe, expect, it } from '@jest/globals';

import { renderOrderSlipEmail, type OrderSlipInput } from '../order-slip-email';
import { defaultSettings } from '../settings';
import type { Product } from '../types';

const product = (over: Partial<Product>): Product => ({
  id: 'p',
  catalogueNo: '482/1190',
  title: 'Light-Up Scooter',
  categoryKey: 'outdoor',
  priceMinor: 3999,
  currency: 'GBP',
  retailer: 'BigBox',
  url: 'https://bigbox.example/scooter',
  emoji: '🛴',
  ...over,
});

const input = (over: Partial<OrderSlipInput> = {}): OrderSlipInput => ({
  settings: { ...defaultSettings(), circlerName: 'Ellie', title: "Ellie's Christmas Book 2026" },
  wishes: [
    { product: product({}), stars: 3 },
    { product: product({ id: 'k', catalogueNo: '', title: 'Kite', priceMinor: 899, url: 'https://kites.example/k' }), stars: 1 },
  ],
  queueNumber: 47,
  sentAt: new Date(Date.UTC(2026, 10, 28, 18, 4)),
  listUrl: 'https://biro.example/l/abc',
  ...over,
});

describe('renderOrderSlipEmail', () => {
  it('writes a friendly subject and inbox preview', () => {
    const email = renderOrderSlipEmail(input());
    expect(email.subject).toBe('Ellie has sent their Christmas list! (2 items)');
    expect(email.preheader).toBe('2 items circled, £48.98 in total. Your number is 47.');
  });

  it('lists every wish with catalogue number, stars, price and shop link', () => {
    const { html, text } = renderOrderSlipEmail(input());
    expect(html).toContain('482/1190');
    expect(html).toContain('★★★');
    expect(html).toContain('href="https://bigbox.example/scooter"');
    expect(html).toContain('£48.98');
    expect(html).toContain('>47<');
    expect(text).toContain('482/1190  Light-Up Scooter ***');
    expect(text).toContain('YOURS     Kite *');
    expect(text).toMatch(/2 ITEMS\s+£48\.98/);
    expect(text).toContain('See the list: https://biro.example/l/abc');
  });

  it('escapes anything a shop or parent typed, so it cannot break the email', () => {
    const nasty = product({ title: '<script>alert("x")</script> & Co', url: 'https://x.example/"onmouseover="bad', retailer: "O'Brien's" });
    const { html } = renderOrderSlipEmail(input({ wishes: [{ product: nasty, stars: 2 }], settings: { ...defaultSettings(), circlerName: '<b>Al</b>' } }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Co');
    expect(html).not.toContain('"onmouseover="');
    expect(html).toContain('O&#39;Brien&#39;s');
    expect(html).not.toContain('<b>Al</b>');
  });

  it('copes with an empty list and a single item', () => {
    expect(renderOrderSlipEmail(input({ wishes: [] })).html).toContain('Nothing circled this time!');
    expect(renderOrderSlipEmail(input({ wishes: [input().wishes[0]] })).subject).toContain('(1 item)');
  });

  it('uses only email-safe markup: no style blocks, scripts or web fonts', () => {
    const { html } = renderOrderSlipEmail(input());
    expect(html).not.toMatch(/<style|<script|@font-face|<link/i);
  });
});
