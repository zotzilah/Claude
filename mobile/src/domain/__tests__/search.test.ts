import { describe, expect, it } from '@jest/globals';

import { categories, products } from '@/data/sample-catalogue';

import { search, tokenize, withinOneEdit } from '../search';

const titles = (query: string) => {
  const outcome = search(query, products, categories);
  return outcome.kind === 'results' ? outcome.results.map((r) => r.product.title) : outcome;
};

describe('search', () => {
  it('jumps straight to a catalogue number however it is typed', () => {
    for (const q of ['482/1190', '482 1190', '4821190']) {
      const outcome = search(q, products, categories);
      expect(outcome).toMatchObject({ kind: 'catalogue-number', catalogueNo: '482/1190' });
      expect(outcome.kind === 'catalogue-number' && outcome.product?.title).toBe('Light-Up Scooter');
    }
  });

  it('says so when a catalogue number does not exist', () => {
    expect(search('999/9999', products, categories)).toEqual({ kind: 'catalogue-number', catalogueNo: '999/9999', product: null });
  });

  it('finds "Dino" things when a child says "dinosaurs"', () => {
    const found = titles('dinosaurs');
    expect(found).toEqual(expect.arrayContaining(['Dino Dig Excavation Kit', 'Dino Paddling Pool', 'Dinosaur Roar Torch']));
  });

  it('understands everyday words like "lego"', () => {
    expect(titles('lego')).toContain('Space Station Brick Set, 780 pcs');
  });

  it('forgives a typo', () => {
    expect(titles('scoter')).toContain('Light-Up Scooter');
  });

  it('ignores filler words and needs every real word to match', () => {
    expect(titles('I want the dino one')).toEqual(titles('dino'));
    expect(titles('dino bike')).toEqual([]);
  });

  it('matches category words, so "art" finds the craft page', () => {
    expect(titles('art')).toEqual(expect.arrayContaining(['Big Paint Set & Easel', 'Craft Treasure Box']));
  });

  it('ranks exact words above partial ones', () => {
    expect((titles('bike') as string[])[0]).toBe('16" Kids Bike, Blue');
  });

  it('returns empty for blank or filler-only searches', () => {
    expect(search('   ', products, categories)).toEqual({ kind: 'empty' });
    expect(search('the', products, categories)).toEqual({ kind: 'empty' });
  });
});

describe('helpers', () => {
  it('tokenises and singularises', () => {
    expect(tokenize('Dinosaurs & Puppies, Boxes!')).toEqual(['dinosaur', 'puppy', 'box']);
    expect(tokenize('Glass Café')).toEqual(['glass', 'cafe']);
  });

  it('spots single edits only', () => {
    expect(withinOneEdit('scooter', 'scoter')).toBe(true);
    expect(withinOneEdit('scooter', 'scooters')).toBe(true);
    expect(withinOneEdit('scooter', 'skooter')).toBe(true);
    expect(withinOneEdit('scooter', 'skootr')).toBe(false);
  });
});
