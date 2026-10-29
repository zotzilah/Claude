/**
 * Automatic checks on products people add from a link (brief §8.3, step 2).
 *
 * Two outcomes:
 *  - **refused**: the item can't go on the list at all, with a reason the screen explains
 *  - **flags**: it goes on this family's list, but is held back from the shared
 *    catalogue until a person has looked at it (the human-review half, v1.1)
 *
 * These lists are deliberately short starting points. The server keeps the full,
 * regularly updated versions; the app's copy catches the obvious cases offline.
 */
import { amountsFor } from './money';

export type RefusalReason = 'adult-site' | 'not-a-shop' | 'bad-words' | 'silly-price';
export const REVIEW_FLAGS = ['grown-up-item', 'unknown-shop', 'pricey', 'no-photo'] as const;
export type ReviewFlag = (typeof REVIEW_FLAGS)[number];

export type CheckResult = { ok: true; flags: ReviewFlag[] } | { ok: false; reason: RefusalReason };

export interface Candidate {
  url: string;
  title: string;
  priceMinor: number;
  currency: string;
  imageUrl?: string | null;
}

/** Sites that are never suitable for a family list. Matches the domain and its subdomains. */
const BLOCKED_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xhamster.com', 'onlyfans.com', 'chaturbate.com', 'adultempire.com',
  'lovehoney.co.uk', 'lovehoney.com', 'annsummers.com', 'adameve.com',
  'bet365.com', 'williamhill.com', 'paddypower.com', 'betfair.com', 'skybet.com', 'draftkings.com', 'fanduel.com',
  'pokerstars.com', 'stake.com',
];
const BLOCKED_TLDS = ['xxx', 'adult', 'porn', 'sex', 'casino', 'bet', 'poker'];

/** Links that point at a feed, a search or a shortener rather than a product page. */
const NOT_SHOPS = [
  'google.com', 'google.co.uk', 'bing.com', 'duckduckgo.com', 'facebook.com', 'instagram.com', 'tiktok.com',
  'youtube.com', 'youtu.be', 'x.com', 'twitter.com', 'pinterest.com', 'reddit.com', 'whatsapp.com',
  'bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly',
];

/** Shops we already know about. Anything else is fine, but gets a second look. */
const KNOWN_SHOPS = [
  'argos.co.uk', 'amazon.co.uk', 'amazon.com', 'amazon.de', 'amazon.fr', 'johnlewis.com', 'smythstoys.com',
  'thetoyshop.com', 'hamleys.com', 'lego.com', 'bigjigstoys.co.uk', 'boots.com', 'next.co.uk', 'marksandspencer.com',
  'very.co.uk', 'currys.co.uk', 'waterstones.com', 'hobbycraft.co.uk', 'target.com', 'walmart.com', 'ebay.co.uk',
  'ebay.com', 'etsy.com', 'decathlon.co.uk', 'halfords.com', 'game.co.uk', 'nintendo.com', 'playstation.com',
];

/**
 * Words that can't appear on any Biro list. Matched as whole words, so
 * "Scunthorpe" and "cockatoo" are fine.
 */
const BAD_WORDS = [
  'fuck', 'fucking', 'fucker', 'shit', 'shitty', 'cunt', 'twat', 'wank', 'wanker', 'bollocks', 'bastard',
  'bitch', 'slut', 'whore', 'porn', 'porno', 'dildo', 'fetish', 'bdsm', 'nazi',
];

/** Fine on a grown-up's list, but worth a second look on a child's. */
const GROWN_UP_WORDS = [
  'vape', 'vapes', 'e-cigarette', 'cigarette', 'cigarettes', 'cigar', 'tobacco', 'beer', 'lager', 'wine', 'vodka',
  'whisky', 'whiskey', 'rum', 'prosecco', 'champagne', 'gin', 'lingerie', 'condom', 'condoms', 'lube', 'knife',
  'knives', 'machete', 'crossbow', 'airsoft', 'bb gun', 'gambling', 'cbd',
];

/**
 * Price limits scale with each currency's typical budget (£150, $200, ¥30,000…),
 * so "too dear" means the same thing in London and Tokyo.
 * Above 500 budgets is a typo; above 7 budgets a parent probably wants to know.
 */
const MAX_PRICE_BUDGETS = 500;
const PRICEY_BUDGETS = 7;

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function matchesDomain(host: string, domains: string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Undoes the usual dodges: "f*ck", "sh1t", "p0rn", spaced-out letters. */
function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/(\w)[*]+(\w)/g, '$1u$2');
}

function containsWord(text: string, words: string[]): boolean {
  const clean = normaliseText(text);
  return words.some((w) => new RegExp(`(^|[^a-z])${w.replace(/[-\s]/g, '[-\\s]?')}([^a-z]|$)`).test(clean));
}

/** Checks just the link, before we fetch anything from it. */
export function checkLink(url: string): 'adult-site' | 'not-a-shop' | null {
  const host = hostOf(url);
  if (!host) return 'not-a-shop';
  const tld = host.split('.').pop() ?? '';
  if (matchesDomain(host, BLOCKED_DOMAINS) || BLOCKED_TLDS.includes(tld)) return 'adult-site';
  if (matchesDomain(host, NOT_SHOPS)) return 'not-a-shop';
  return null;
}

/** Runs every check. `kidList` is true when a child is doing the circling. */
export function checkProduct(item: Candidate, kidList: boolean): CheckResult {
  const linkProblem = checkLink(item.url);
  if (linkProblem) return { ok: false, reason: linkProblem };
  const host = hostOf(item.url) ?? '';
  if (containsWord(item.title, BAD_WORDS)) return { ok: false, reason: 'bad-words' };
  const budget = amountsFor(item.currency).budgetMinor;
  if (!(item.priceMinor > 0) || item.priceMinor > budget * MAX_PRICE_BUDGETS) return { ok: false, reason: 'silly-price' };

  const flags: ReviewFlag[] = [];
  if (kidList && containsWord(`${item.title} ${host}`, GROWN_UP_WORDS)) flags.push('grown-up-item');
  if (!matchesDomain(host, KNOWN_SHOPS)) flags.push('unknown-shop');
  if (item.priceMinor > budget * PRICEY_BUDGETS) flags.push('pricey');
  if (!item.imageUrl) flags.push('no-photo');
  return { ok: true, flags };
}

// ---------- duplicates ----------

/** Tracking bits shops and adverts add to links. They don't change the product. */
const TRACKING_PARAMS = /^(utm_\w+|gclid|fbclid|mc_\w+|ref|ref_|tag|cmpid|source|affid|clickid|_ga)$/i;

/**
 * The same product page, however it was copied: no "www", tracking codes,
 * "#reviews" or trailing slash. Amazon links shrink to their product code.
 */
export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const amazon = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i.exec(u.pathname);
    if (host.startsWith('amazon.') && amazon) return `https://${host}/dp/${amazon[1].toUpperCase()}`;
    const params = [...u.searchParams.entries()]
      .filter(([k]) => !TRACKING_PARAMS.test(k))
      .sort(([a], [b]) => a.localeCompare(b));
    const query = params.length ? `?${new URLSearchParams(params).toString()}` : '';
    return `https://${host}${u.pathname.replace(/\/+$/, '') || '/'}${query}`;
  } catch {
    return url.trim();
  }
}

/** Finds a product already on the list with the same page, if there is one. */
export function findDuplicate<T extends { id: string; url: string }>(url: string, products: T[]): T | null {
  const target = canonicalUrl(url);
  return products.find((p) => p.url && canonicalUrl(p.url) === target) ?? null;
}
