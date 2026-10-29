/**
 * Money for a global app (brief: "global from day one").
 *
 * Amounts are stored as integers in the currency's minor unit: pence for GBP,
 * cents for USD, but whole yen for JPY (no minor unit) and fils for KWD (1/1000).
 * Formatting follows the reader's locale, so 1234.5 EUR shows as "€1,234.50" in
 * Dublin and "1.234,50 €" in Berlin.
 */

const digitsCache = new Map<string, number>();

/** How many decimal places the currency uses: 2 for GBP, 0 for JPY, 3 for KWD. */
export function minorDigits(currency: string): number {
  const code = currency.toUpperCase();
  const cached = digitsCache.get(code);
  if (cached !== undefined) return cached;
  let digits = 2;
  try {
    digits = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  } catch {
    // Unknown code: assume the common case.
  }
  digitsCache.set(code, digits);
  return digits;
}

function scale(currency: string): number {
  return 10 ** minorDigits(currency);
}

/** 12.99 GBP → 1299; 1200 JPY → 1200. */
export function toMinor(major: number, currency: string): number {
  return Math.round(major * scale(currency));
}

export function toMajor(minor: number, currency: string): number {
  return minor / scale(currency);
}

function formatter(locale: string, currency: string, whole: boolean): Intl.NumberFormat {
  const options: Intl.NumberFormatOptions = { style: 'currency', currency };
  if (whole) {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat('en-GB', options);
  }
}

/** "£39.99", "39,99 €", "￥1,200". */
export function formatMoney(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return formatter(locale, currency, false).format(toMajor(minor, currency));
}

/** Drops ".00" from round amounts, for buttons like "£25". Keeps "£12.50". */
export function formatMoneyShort(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  const round = minor % scale(currency) === 0;
  return formatter(locale, currency, round).format(toMajor(minor, currency));
}

export interface MoneyParts {
  /** Symbol and whole units, e.g. "£39" or "39" (when the symbol comes after). */
  main: string;
  /** Decimal point and fraction, e.g. ".99" or ",99". Empty for JPY. */
  fraction: string;
  /** Anything after the number, e.g. " €". */
  after: string;
}

/** Splits a price for the big-and-small price sticker: "£39" + ".99". */
export function moneyParts(minor: number, currency = 'GBP', locale = 'en-GB'): MoneyParts {
  const f = formatter(locale, currency, false);
  const value = toMajor(minor, currency);
  if (typeof f.formatToParts !== 'function') return { main: f.format(value), fraction: '', after: '' };
  const parts = f.formatToParts(value);
  let main = '';
  let fraction = '';
  let after = '';
  let seenNumber = false;
  for (const part of parts) {
    if (part.type === 'decimal' || part.type === 'fraction') {
      fraction += part.value;
    } else if (part.type === 'integer' || part.type === 'group' || part.type === 'minusSign') {
      seenNumber = true;
      main += part.value;
    } else if (seenNumber) {
      after += part.value;
    } else {
      main += part.value;
    }
  }
  return { main, fraction, after };
}

/** "£", "€", "$", "￥": what to show beside a money input box. */
export function currencySymbol(currency: string, locale = 'en-GB'): string {
  const f = formatter(locale, currency, true);
  if (typeof f.formatToParts !== 'function') return currency;
  return f.formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
}

/** The decimal separator people type in this locale: "." in the UK, "," in Germany. */
export function decimalSeparator(locale: string): '.' | ',' {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts?.(1.5);
    return parts?.find((p) => p.type === 'decimal')?.value === ',' ? ',' : '.';
  } catch {
    return '.';
  }
}

/**
 * Reads an amount the way people type it: "150", "£150", "150.50", "1,000",
 * "150 €", and in comma-decimal locales "150,50" or "1.000,50".
 * Returns minor units, or null if it isn't a sensible amount.
 */
export function parseMoneyInput(text: string, currency = 'GBP', locale = 'en-GB'): number | null {
  if (/[-+−]/.test(text)) return null;
  const digits = minorDigits(currency);
  const dec = decimalSeparator(locale);
  const group = dec === '.' ? ',' : '.';
  // Strip a currency symbol or code at either end, e.g. "£", "US$", "EUR", "€".
  const cleaned = text
    .trim()
    .replace(/^[^\d\s]{1,4}\s*/u, '')
    .replace(/\s*[^\d\s]{1,4}$/u, '')
    // Thousands separators (and the spaces French and Swiss writers use) between groups of three.
    .replace(new RegExp(`[${group === '.' ? '\\.' : ','}\\s\\u00a0\\u202f'](?=\\d{3}(?!\\d))`, 'g'), '');
  const fraction = digits > 0 ? `(?:\\${dec}(\\d{1,${digits}}))?` : '';
  const match = new RegExp(`^(\\d{1,9})${fraction}$`).exec(cleaned);
  if (!match) return null;
  const [, whole, part = ''] = match;
  return Number(whole) * 10 ** digits + Number(part.padEnd(digits, '0') || '0');
}

/**
 * Turns a stored amount back into what the person would type, for pre-filling
 * an input: 1299 GBP → "12.99", 15000 GBP → "150", 1299 EUR in de-DE → "12,99".
 */
export function moneyInputText(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  const digits = minorDigits(currency);
  const whole = Math.floor(minor / 10 ** digits);
  const part = minor % 10 ** digits;
  if (part === 0) return String(whole);
  return `${whole}${decimalSeparator(locale)}${String(part).padStart(digits, '0')}`;
}

// ---------- regions ----------

const EURO = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');

const REGION_CURRENCY: Record<string, string> = {
  GB: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IE: 'EUR',
  CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', HK: 'HKD', SG: 'SGD', IN: 'INR', AE: 'AED', SA: 'SAR',
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', BR: 'BRL', MX: 'MXN', IL: 'ILS', TR: 'TRY',
  ...Object.fromEntries(EURO.map((r) => [r, 'EUR'])),
};

/** The currency a family in this country would expect. Unknown countries get USD. */
export function currencyForRegion(region: string | null | undefined): string {
  return (region && REGION_CURRENCY[region.toUpperCase()]) || 'USD';
}

/** Currencies offered in setup, most likely first. Always includes the list's current one. */
export function currencyChoices(current: string): string[] {
  const common = ['GBP', 'EUR', 'USD', 'CAD', 'AUD', 'NZD'];
  return common.includes(current) ? common : [current, ...common];
}

// ---------- sensible amounts per currency ----------

interface Amounts {
  /** Default budget for a new list. */
  budget: number;
  /** Items at or above this price can become a group gift. */
  groupGift: number;
  /** The quick pledge buttons for a group gift. */
  pledges: [number, number, number];
}

/** In major units, picked so they feel like round, everyday numbers locally. */
const AMOUNTS: Record<string, Amounts> = {
  GBP: { budget: 150, groupGift: 100, pledges: [10, 25, 50] },
  EUR: { budget: 150, groupGift: 100, pledges: [10, 25, 50] },
  USD: { budget: 200, groupGift: 100, pledges: [10, 25, 50] },
  CAD: { budget: 200, groupGift: 150, pledges: [10, 25, 50] },
  AUD: { budget: 250, groupGift: 150, pledges: [10, 25, 50] },
  NZD: { budget: 250, groupGift: 150, pledges: [10, 25, 50] },
  CHF: { budget: 150, groupGift: 100, pledges: [10, 25, 50] },
  SEK: { budget: 2000, groupGift: 1000, pledges: [100, 250, 500] },
  NOK: { budget: 2000, groupGift: 1000, pledges: [100, 250, 500] },
  DKK: { budget: 1500, groupGift: 750, pledges: [100, 200, 400] },
  PLN: { budget: 800, groupGift: 500, pledges: [50, 100, 200] },
  JPY: { budget: 30000, groupGift: 15000, pledges: [1000, 3000, 5000] },
  INR: { budget: 10000, groupGift: 5000, pledges: [500, 1000, 2000] },
};

/** Sensible defaults for any currency. Unlisted ones fall back to the USD numbers. */
export function amountsFor(currency: string): { budgetMinor: number; groupGiftMinor: number; pledgesMinor: number[] } {
  const a = AMOUNTS[currency.toUpperCase()] ?? AMOUNTS.USD;
  return {
    budgetMinor: toMinor(a.budget, currency),
    groupGiftMinor: toMinor(a.groupGift, currency),
    pledgesMinor: a.pledges.map((p) => toMinor(p, currency)),
  };
}
