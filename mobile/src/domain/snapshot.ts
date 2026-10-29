/**
 * The save format for a list on the device. Versioned, and validated on load:
 * a corrupted or unrecognised save gives `null` (start fresh) rather than a crash,
 * and individual bad entries are dropped rather than poisoning the whole list.
 */
import { defaultKidPricesShown, defaultSettings } from './settings';
import type {
  AgeBand,
  Buyers,
  CircleMark,
  Circler,
  Claim,
  GroupGift,
  ListSettings,
  ListState,
  Product,
  SurpriseMode,
  Template,
} from './types';

export const SNAPSHOT_VERSION = 1;

interface SnapshotV1 {
  v: 1;
  list: ListState;
}

export function serialize(list: ListState): string {
  const snapshot: SnapshotV1 = { v: SNAPSHOT_VERSION, list };
  return JSON.stringify(snapshot);
}

export function parseSnapshot(json: string | null): ListState | null {
  if (!json) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isObject(raw) || raw.v !== SNAPSHOT_VERSION || !isObject(raw.list)) return null;
  const list = raw.list;
  if (typeof list.id !== 'string' || !list.id) return null;

  return {
    id: list.id,
    settings: parseSettings(list.settings),
    setupComplete: list.setupComplete === true,
    kidMode: list.kidMode === true,
    marks: entries(list.marks, parseMark),
    customProducts: entries(list.customProducts, parseProduct),
    claims: entries(list.claims, parseClaim),
    groupGifts: entries(list.groupGifts, parseGroupGift),
  };
}

// ---------- Field parsers: return null to drop a bad entry ----------

function parseSettings(raw: unknown): ListSettings {
  const d = defaultSettings();
  if (!isObject(raw)) return d;
  const ageBand = oneOf<AgeBand>(raw.ageBand, ['3-5', '6-8', '9-12']);
  return {
    title: str(raw.title) ?? d.title,
    template: oneOf<Template>(raw.template, ['christmas', 'birthday', 'custom']) ?? d.template,
    circler: oneOf<Circler>(raw.circler, ['child', 'adult']) ?? d.circler,
    circlerName: str(raw.circlerName) ?? d.circlerName,
    ageBand,
    buyers: oneOf<Buyers>(raw.buyers, ['just-me', 'partner', 'family']) ?? d.buyers,
    budgetMinor: minor(raw.budgetMinor) ?? d.budgetMinor,
    currency: str(raw.currency) ?? d.currency,
    runningTotalOn: typeof raw.runningTotalOn === 'boolean' ? raw.runningTotalOn : d.runningTotalOn,
    surpriseMode: oneOf<SurpriseMode>(raw.surpriseMode, ['hide-all', 'taken-care-of']) ?? d.surpriseMode,
    // Lists saved before this setting existed get the age-based default.
    kidPricesShown: typeof raw.kidPricesShown === 'boolean' ? raw.kidPricesShown : defaultKidPricesShown(ageBand),
  };
}

function parseMark(raw: unknown): CircleMark | null {
  if (!isObject(raw) || typeof raw.productId !== 'string') return null;
  if (raw.stars !== 1 && raw.stars !== 2 && raw.stars !== 3) return null;
  return { productId: raw.productId, stars: raw.stars, circledAt: num(raw.circledAt) ?? 0 };
}

function parseProduct(raw: unknown): Product | null {
  if (!isObject(raw)) return null;
  const id = str(raw.id), title = str(raw.title), url = str(raw.url), priceMinor = minor(raw.priceMinor);
  if (!id || !title || !url || priceMinor === null) return null;
  return {
    id,
    catalogueNo: str(raw.catalogueNo) ?? '',
    title,
    categoryKey: str(raw.categoryKey) ?? 'yours',
    priceMinor,
    currency: str(raw.currency) ?? 'GBP',
    retailer: str(raw.retailer) ?? '',
    url,
    emoji: str(raw.emoji) ?? '🎁',
    ...(str(raw.imageUrl) ? { imageUrl: str(raw.imageUrl)! } : {}),
  };
}

function parseClaim(raw: unknown): Claim | null {
  if (!isObject(raw)) return null;
  const productId = str(raw.productId), giverName = str(raw.giverName);
  const status = oneOf<Claim['status']>(raw.status, ['held', 'bought']);
  const claimedAt = num(raw.claimedAt), heldUntil = num(raw.heldUntil);
  if (!productId || !giverName || !status || claimedAt === null || heldUntil === null) return null;
  return { productId, giverName, status, claimedAt, heldUntil };
}

function parseGroupGift(raw: unknown): GroupGift | null {
  if (!isObject(raw)) return null;
  const productId = str(raw.productId), organiserName = str(raw.organiserName);
  if (!productId || !organiserName || !Array.isArray(raw.pledges)) return null;
  const pledges = raw.pledges.flatMap((p) => {
    if (!isObject(p)) return [];
    const giverName = str(p.giverName), amountMinor = minor(p.amountMinor);
    return giverName && amountMinor !== null ? [{ giverName, amountMinor }] : [];
  });
  return { productId, organiserName, pledges };
}

// ---------- Helpers ----------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Money: a non-negative whole number of minor units. */
function minor(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

function entries<T>(raw: unknown, parse: (v: unknown) => T | null): Record<string, T> {
  if (!isObject(raw)) return {};
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(raw)) {
    const parsed = parse(value);
    if (parsed !== null) out[key] = parsed;
  }
  return out;
}
