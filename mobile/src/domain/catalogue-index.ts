/**
 * The A–Z index at the back of the catalogue: every product and every page,
 * alphabetically, with its catalogue number or page number, just like the real thing.
 */
import type { Category, Product } from './types';

export interface IndexEntry {
  label: string;
  /** Page number (the category's family code) for pages, catalogue number for products. */
  ref: string;
  /** Which catalogue page to open, by position. */
  pageIndex: number;
  kind: 'page' | 'product';
  productId?: string;
}

export interface IndexSection {
  /** "A"–"Z", or "#" for entries starting with a number. */
  letter: string;
  entries: IndexEntry[];
}

const sortKey = (label: string) =>
  label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/^[^a-z0-9]+/i, '')
    .toLowerCase();

export function buildCatalogueIndex(pages: Category[], productsFor: (categoryKey: string) => Product[]): IndexSection[] {
  const entries: IndexEntry[] = [];
  pages.forEach((page, pageIndex) => {
    entries.push({ label: page.title, ref: `PAGE ${page.familyCode}`, pageIndex, kind: 'page' });
    for (const product of productsFor(page.key)) {
      entries.push({
        label: product.title,
        ref: product.catalogueNo || 'YOURS',
        pageIndex,
        kind: 'product',
        productId: product.id,
      });
    }
  });

  entries.sort((a, b) => sortKey(a.label).localeCompare(sortKey(b.label)) || a.ref.localeCompare(b.ref));

  const sections: IndexSection[] = [];
  for (const entry of entries) {
    const first = sortKey(entry.label).charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : '#';
    const current = sections.at(-1);
    if (current?.letter === letter) current.entries.push(entry);
    else sections.push({ letter, entries: [entry] });
  }
  // Numbers go at the front, as in a printed index.
  return sections.sort((a, b) => (a.letter === '#' ? -1 : b.letter === '#' ? 1 : a.letter.localeCompare(b.letter)));
}
