/**
 * Product search (brief §5.3). Forgiving by design: kids and tired parents type
 * "dinosaur" for "Dino", "lego" for bricks, and "scoter" for scooter.
 * A catalogue number in any common form jumps straight to that product.
 */
import { parseCatalogueNumber } from './catalogue-number';
import type { Category, Product } from './types';

/** Words that carry no meaning in a search ("I want the dino one"). */
const STOP_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'i', 'want', 'one', 'some', 'please', 'for', 'of', 'with', 'my']);

/** Everyday words mapped to what the catalogue calls things. */
const SYNONYMS: Record<string, string[]> = {
  lego: ['brick', 'build'],
  dinosaur: ['dino'],
  bicycle: ['bike'],
  cycle: ['bike'],
  game: ['console', 'board'],
  craft: ['art'],
  colouring: ['crayon', 'sketch'],
  coloring: ['crayon', 'sketch'],
  drawing: ['sketch', 'crayon', 'paint'],
  photo: ['camera'],
  music: ['headphone'],
  baking: ['bake'],
  outside: ['outdoor'],
};

export interface SearchResult {
  product: Product;
  score: number;
}

export type SearchOutcome =
  | { kind: 'empty' }
  | { kind: 'catalogue-number'; catalogueNo: string; product: Product | null }
  | { kind: 'results'; results: SearchResult[] };

export function search(query: string, products: Product[], categories: Category[]): SearchOutcome {
  const catalogueNo = parseCatalogueNumber(query);
  if (catalogueNo) {
    return { kind: 'catalogue-number', catalogueNo, product: products.find((p) => p.catalogueNo === catalogueNo) ?? null };
  }

  const terms = tokenize(query).filter((t) => !STOP_WORDS.has(t));
  if (!terms.length) return { kind: 'empty' };

  const categoryWords = new Map(categories.map((c) => [c.key, tokenize(`${c.title} ${c.kidLabel}`)]));
  const results: SearchResult[] = [];
  for (const product of products) {
    const words = [...tokenize(product.title), ...tokenize(product.retailer), ...(categoryWords.get(product.categoryKey) ?? [])];
    let score = 0;
    let matchedAll = true;
    for (const term of terms) {
      const best = Math.max(...expand(term).map((t) => bestMatch(t, words)));
      if (best === 0) {
        matchedAll = false;
        break;
      }
      score += best;
    }
    if (matchedAll) results.push({ product, score });
  }
  results.sort((a, b) => b.score - a.score || a.product.title.localeCompare(b.product.title));
  return { kind: 'results', results };
}

/** Lowercase words without accents or punctuation, singularised. */
export function tokenize(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singular);
}

function singular(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('es') && /(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function expand(term: string): string[] {
  return [term, ...(SYNONYMS[term] ?? [])];
}

/** 3 = exact word, 2 = one starts the other ("dino"/"dinosaur"), 1 = one typo, 0 = no match. */
function bestMatch(term: string, words: string[]): number {
  let best = 0;
  for (const word of words) {
    if (word === term) return 3;
    const shorter = term.length < word.length ? term : word;
    const longer = shorter === term ? word : term;
    if (shorter.length >= 3 && longer.startsWith(shorter)) best = Math.max(best, 2);
    else if (term.length >= 5 && withinOneEdit(term, word)) best = Math.max(best, 1);
  }
  return best;
}

/** True when two words differ by at most one insertion, deletion or substitution. */
export function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}
