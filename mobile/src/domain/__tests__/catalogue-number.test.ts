import { describe, expect, it } from '@jest/globals';

import {
  familyCodeOf,
  formatCatalogueNumber,
  isCatalogueNumber,
  parseCatalogueNumber,
} from '../catalogue-number';

describe('formatCatalogueNumber', () => {
  it('pads the sequence to four digits', () => {
    expect(formatCatalogueNumber(482, 1190)).toBe('482/1190');
    expect(formatCatalogueNumber(214, 31)).toBe('214/0031');
  });

  it('rejects out-of-range parts', () => {
    expect(() => formatCatalogueNumber(99, 1)).toThrow(RangeError);
    expect(() => formatCatalogueNumber(482, 10000)).toThrow(RangeError);
    expect(() => formatCatalogueNumber(482, 1.5)).toThrow(RangeError);
  });
});

describe('parseCatalogueNumber', () => {
  it.each(['482/1190', '482 1190', '4821190', '482-1190', ' 482/1190 ', '482.1190', '482 / 1190'])(
    'reads %p as 482/1190',
    (input) => {
      expect(parseCatalogueNumber(input)).toBe('482/1190');
    },
  );

  it.each(['', 'bike', '482/119', '48/21190', '482/11900'])('rejects %p', (input) => {
    expect(parseCatalogueNumber(input)).toBeNull();
  });
});

describe('isCatalogueNumber / familyCodeOf', () => {
  it('validates the canonical format only', () => {
    expect(isCatalogueNumber('482/1190')).toBe(true);
    expect(isCatalogueNumber('4821190')).toBe(false);
  });

  it('extracts the family code', () => {
    expect(familyCodeOf('527/0301')).toBe(527);
    expect(() => familyCodeOf('nope')).toThrow();
  });
});
