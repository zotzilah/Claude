// Copies the checked beta catalogue (docs/research/beta-catalogue-2026.json) into the
// app as src/data/beta-catalogue.json, keeping only what the app needs.
// Run after updating the research file:  npm run catalogue
import { readFileSync, writeFileSync } from 'node:fs';

const source = JSON.parse(readFileSync(new URL('../../docs/research/beta-catalogue-2026.json', import.meta.url), 'utf8'));

const products = source.products
  .filter((p) => p.url && Number.isInteger(p.priceMinor) && p.priceMinor > 0)
  .map((p) => ({
    catalogueNo: p.catalogueNo,
    title: p.title,
    page: p.page,
    priceMinor: p.priceMinor,
    currency: p.currency,
    retailer: p.retailer,
    url: p.url,
    emoji: p.emoji ?? '🎁',
    // Only from sources that permit it (affiliate feeds); never copied from shop pages.
    imageUrl: p.imageUrl ?? null,
    ages: p.ages ?? null,
  }));

const out = { asOf: source.asOf, pages: source.pages, products };
writeFileSync(new URL('../src/data/beta-catalogue.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`${products.length} products on ${source.pages.length} pages, checked ${source.asOf}`);
