import { describe, expect, it } from '@jest/globals';

import {
  amountsFor,
  currencyForRegion,
  currencySymbol,
  formatMoney,
  formatMoneyShort,
  minorDigits,
  moneyInputText,
  moneyParts,
  parseMoneyInput,
  toMinor,
} from '../money';
import { parsePrice } from '../product-page';
import { otherCurrencyCount, runningTotalMinor } from '../wishlist';

/** Intl uses non-breaking spaces ("39,99 €"); compare them as plain spaces. */
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('minor units', () => {
  it('knows how many decimals each currency has', () => {
    expect(minorDigits('GBP')).toBe(2);
    expect(minorDigits('JPY')).toBe(0);
    expect(minorDigits('KWD')).toBe(3);
    expect(toMinor(12.99, 'GBP')).toBe(1299);
    expect(toMinor(1200, 'JPY')).toBe(1200);
  });
});

describe('formatMoney', () => {
  it('writes money the local way', () => {
    expect(formatMoney(123450, 'GBP', 'en-GB')).toBe('£1,234.50');
    expect(plain(formatMoney(123450, 'EUR', 'de-DE'))).toBe('1.234,50 €');
    expect(formatMoney(1200, 'JPY', 'ja-JP')).toBe('￥1,200');
    expect(formatMoney(1999, 'USD', 'en-US')).toBe('$19.99');
  });

  it('drops .00 only on round amounts', () => {
    expect(formatMoneyShort(2500, 'GBP', 'en-GB')).toBe('£25');
    expect(formatMoneyShort(1250, 'GBP', 'en-GB')).toBe('£12.50');
    expect(plain(formatMoneyShort(2500, 'EUR', 'fr-FR'))).toBe('25 €');
  });

  it('splits prices for the sticker', () => {
    expect(moneyParts(3999, 'GBP', 'en-GB')).toEqual({ main: '£39', fraction: '.99', after: '' });
    const de = moneyParts(3999, 'EUR', 'de-DE');
    expect({ ...de, after: plain(de.after) }).toEqual({ main: '39', fraction: ',99', after: ' €' });
    expect(moneyParts(1200, 'JPY', 'ja-JP')).toEqual({ main: '￥1,200', fraction: '', after: '' });
  });

  it('finds the symbol', () => {
    expect(currencySymbol('GBP', 'en-GB')).toBe('£');
    expect(currencySymbol('EUR', 'de-DE')).toBe('€');
  });
});

describe('parseMoneyInput', () => {
  it.each([
    ['150', 'GBP', 'en-GB', 15000],
    ['£1,000.50', 'GBP', 'en-GB', 100050],
    ['150 €', 'EUR', 'de-DE', 15000],
    ['150,50', 'EUR', 'de-DE', 15050],
    ['1.000,50', 'EUR', 'de-DE', 100050],
    ['1 000,50', 'EUR', 'fr-FR', 100050],
    ['US$20', 'USD', 'en-US', 2000],
    ['3000', 'JPY', 'ja-JP', 3000],
  ])('reads %p in %s (%s)', (text, currency, locale, expected) => {
    expect(parseMoneyInput(text, currency, locale)).toBe(expected);
  });

  it.each([
    ['150.50', 'EUR', 'de-DE'],
    ['12.5', 'JPY', 'ja-JP'],
    ['-5', 'GBP', 'en-GB'],
  ])('rejects %p in %s (%s)', (text, currency, locale) => {
    expect(parseMoneyInput(text, currency, locale)).toBeNull();
  });

  it('round-trips through the input text', () => {
    expect(moneyInputText(15000, 'GBP', 'en-GB')).toBe('150');
    expect(moneyInputText(2499, 'GBP', 'en-GB')).toBe('24.99');
    expect(moneyInputText(2499, 'EUR', 'de-DE')).toBe('24,99');
    expect(parseMoneyInput(moneyInputText(2405, 'EUR', 'de-DE'), 'EUR', 'de-DE')).toBe(2405);
  });
});

describe('regions and sensible amounts', () => {
  it('picks a local currency', () => {
    expect(currencyForRegion('GB')).toBe('GBP');
    expect(currencyForRegion('ie')).toBe('EUR');
    expect(currencyForRegion('US')).toBe('USD');
    expect(currencyForRegion(null)).toBe('USD');
  });

  it('uses round local numbers', () => {
    expect(amountsFor('GBP')).toEqual({ budgetMinor: 15000, groupGiftMinor: 10000, pledgesMinor: [1000, 2500, 5000] });
    expect(amountsFor('JPY').budgetMinor).toBe(30000);
    expect(amountsFor('XYZ').budgetMinor).toBe(20000);
  });
});

describe('shop prices in other currencies', () => {
  it('reads prices by the currency\'s own decimals', () => {
    expect(parsePrice('1,299', 'GBP')).toBe(129900);
    expect(parsePrice('12.9', 'GBP')).toBe(1290);
    expect(parsePrice('1.299,00', 'EUR')).toBe(129900);
    expect(parsePrice('¥3,980', 'JPY')).toBe(3980);
    expect(parsePrice(3980, 'JPY')).toBe(3980);
    expect(parsePrice('12.345', 'KWD')).toBe(12345);
  });

  it('leaves other currencies out of the running total', () => {
    const products = {
      a: { id: 'a', priceMinor: 1000, currency: 'GBP' },
      b: { id: 'b', priceMinor: 5000, currency: 'USD' },
    } as never;
    const marks = { a: { productId: 'a', stars: 1, circledAt: 0 }, b: { productId: 'b', stars: 1, circledAt: 0 } } as never;
    expect(runningTotalMinor(marks, products, 'GBP')).toBe(1000);
    expect(otherCurrencyCount(marks, products, 'GBP')).toBe(1);
  });
});
