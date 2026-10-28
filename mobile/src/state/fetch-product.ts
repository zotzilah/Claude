/**
 * Fetches a shop page and reads the product from it.
 *
 * Works from the phone apps. Browsers block reading other sites' pages (CORS), so
 * the web build will do this through the backend later; until then, and whenever a
 * shop blocks us, people fill in the details by hand.
 */
import { parseProductPage, retailerFromUrl, type ProductDetails } from '@/domain/product-page';

export type FetchResult = { ok: true; details: ProductDetails } | { ok: false; reason: 'timeout' | 'blocked' | 'not-found' };

const TIMEOUT_MS = 10_000;
/** Product data lives in the page head; no need to download huge pages. */
const MAX_CHARS = 1_500_000;

export async function fetchProduct(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    if (response.status === 404 || response.status === 410) return { ok: false, reason: 'not-found' };
    if (!response.ok) return { ok: false, reason: 'blocked' };
    const html = (await response.text()).slice(0, MAX_CHARS);
    return { ok: true, details: parseProductPage(html, response.url || url) };
  } catch (e) {
    return { ok: false, reason: (e as Error).name === 'AbortError' ? 'timeout' : 'blocked' };
  } finally {
    clearTimeout(timer);
  }
}

/** What we know from the link alone, for filling in by hand. */
export function detailsFromUrl(url: string): ProductDetails {
  return { title: null, priceMinor: null, currency: null, imageUrl: null, retailer: retailerFromUrl(url), url };
}
