import { describe, expect, it } from '@jest/globals';

import { enGB } from '../../i18n/en-GB';
import { stringsFor } from '../../i18n';

describe('stringsFor', () => {
  it('uses British English by default', () => {
    expect(stringsFor('en-GB').common.sendToParents).toBe('Send to Mum & Dad');
    expect(stringsFor('fr-FR').common.sendToParents).toBe('Send to Mum & Dad');
  });

  it('swaps in American words without losing the rest', () => {
    const us = stringsFor('en-US');
    expect(us.common.sendToParents).toBe('Send to Mom & Dad');
    expect(us.add.failure.timeout).toContain('store');
    // Untouched keys inside an overridden section still come from en-GB.
    expect(us.add.failure['not-found']).toBe(enGB.add.failure['not-found']);
    expect(us.giver.listTitle("Ellie's Christmas Book 2026")).toBe("Ellie's Christmas List 2026");
  });

  it('accepts underscores and odd casing', () => {
    expect(stringsFor('en_us').common.sendToParents).toBe('Send to Mom & Dad');
  });

  it('fills in names and counts', () => {
    expect(enGB.search.found(1)).toBe('1 thing found');
    expect(enGB.search.found(3)).toBe('3 things found');
    expect(enGB.add.foundMissing(true, true)).toBe('Found it, but add the name and price.');
    expect(enGB.templates.title('birthday', 'James', 2027)).toBe("James' Birthday Book 2027");
  });
});
