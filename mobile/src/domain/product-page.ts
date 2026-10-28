/**
 * Reads a product's name, price and photo from a shop's web page (brief §8.2).
 * Shops publish this for Google and social previews in two standard ways:
 * schema.org `Product` JSON-LD, and Open Graph / product meta tags. We try both.
 * Pure: fetching the page happens elsewhere.
 */

export interface ProductDetails {
  title: string | null;
  priceMinor: number | null;
  currency: string | null;
  imageUrl: string | null;
  retailer: string;
  url: string;
}

/**
 * Pulls a shop link out of whatever was pasted or shared, e.g.
 * "Look at this! https://shop.example/lamp?ref=1". Adds https:// when missing.
 */
export function extractUrl(input: string): string | null {
  const text = input.trim();
  const found = text.match(/https?:\/\/[^\s<>"']+/i)?.[0] ?? (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text) ? `https://${text}` : null);
  if (!found) return null;
  try {
    const url = new URL(found.replace(/[).,!?]+$/, ''));
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function retailerFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function parseProductPage(html: string, pageUrl: string): ProductDetails {
  const fromJson = productFromJsonLd(html);
  const meta = (name: string) => metaContent(html, name);

  const title =
    fromJson.title ?? meta('og:title') ?? meta('twitter:title') ?? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '') ?? null;
  const priceMinor =
    fromJson.priceMinor ?? parsePrice(meta('product:price:amount') ?? meta('og:price:amount') ?? meta('twitter:data1'));
  const currency =
    fromJson.currency ?? (meta('product:price:currency') ?? meta('og:price:currency'))?.toUpperCase() ?? null;
  const image = fromJson.imageUrl ?? meta('og:image') ?? meta('og:image:url') ?? meta('twitter:image');

  return {
    title: tidyTitle(title),
    priceMinor,
    currency,
    imageUrl: absolute(image, pageUrl),
    retailer: meta('og:site_name') ?? retailerFromUrl(pageUrl),
    url: pageUrl,
  };
}

/** "12.99", "£1,299.00", 12.99 → minor units. Ranges and nonsense give null. */
export function parsePrice(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;
  // "1.299,00" (European) or "1,299.00" (UK/US): the last separator is the decimal point.
  const lastSep = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
  const hasDecimals = lastSep >= 0 && cleaned.length - lastSep - 1 === 2;
  const whole = (hasDecimals ? cleaned.slice(0, lastSep) : cleaned).replace(/[.,]/g, '');
  const fraction = hasDecimals ? cleaned.slice(lastSep + 1) : '00';
  if (!/^\d+$/.test(whole || '0')) return null;
  return Number(whole || '0') * 100 + Number(fraction);
}

// ---------- JSON-LD ----------

interface JsonLdDetails {
  title: string | null;
  priceMinor: number | null;
  currency: string | null;
  imageUrl: string | null;
}

function productFromJsonLd(html: string): JsonLdDetails {
  const empty: JsonLdDetails = { title: null, priceMinor: null, currency: null, imageUrl: null };
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, body] of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(body.trim());
    } catch {
      continue;
    }
    const product = findProduct(data);
    if (!product) continue;
    const offer = firstOffer(product.offers);
    return {
      title: typeof product.name === 'string' ? decode(product.name) : null,
      priceMinor: parsePrice(offer?.price ?? offer?.lowPrice),
      currency: typeof offer?.priceCurrency === 'string' ? offer.priceCurrency.toUpperCase() : null,
      imageUrl: imageOf(product.image),
    };
  }
  return empty;
}

type Json = Record<string, unknown>;

function findProduct(data: unknown): Json | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProduct(item);
      if (found) return found;
    }
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const obj = data as Json;
  const type = obj['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) return obj;
  if (obj['@graph']) return findProduct(obj['@graph']);
  return null;
}

function firstOffer(offers: unknown): Json | null {
  if (Array.isArray(offers)) return firstOffer(offers[0]);
  if (!offers || typeof offers !== 'object') return null;
  const o = offers as Json;
  // AggregateOffer can nest individual offers.
  if (o.price === undefined && o.lowPrice === undefined && o.offers) return firstOffer(o.offers);
  return o;
}

function imageOf(image: unknown): string | null {
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return imageOf(image[0]);
  if (image && typeof image === 'object' && typeof (image as Json).url === 'string') return (image as Json).url as string;
  return null;
}

// ---------- Meta tags ----------

function metaContent(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = tag.match(/\b(?:property|name|itemprop)=["']([^"']+)["']/i)?.[1];
    if (key && new RegExp(`^${escaped}$`, 'i').test(key)) {
      const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
      if (content) return decode(content);
    }
  }
  return null;
}

// ---------- Text helpers ----------

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', pound: '£', euro: '€' };

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drops the " | Shop Name" or " - Buy online" tails shops add to titles. */
function tidyTitle(title: string | null): string | null {
  if (!title) return null;
  const tidied = title.split(/\s+[|–—]\s+|\s+-\s+(?=[^-]*$)/)[0].trim();
  return (tidied || title).slice(0, 120);
}

function absolute(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    const resolved = new URL(url, base);
    return resolved.protocol === 'https:' || resolved.protocol === 'http:' ? resolved.toString() : null;
  } catch {
    return null;
  }
}
