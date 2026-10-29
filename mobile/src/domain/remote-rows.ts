/**
 * Translates between the app's list (ListState) and the database rows in
 * supabase/migrations. Pure, so the mapping is tested without a server.
 * Money stays in minor units; times are ISO strings in the database.
 */
import type { ClaimError } from './claims';
import type { CircleMark, Claim, GroupGift, ListSettings, ListState, Product, Stars } from './types';

export interface ListRow {
  id: string;
  title: string;
  settings: ListSettings;
}

export interface MarkRow {
  list_id: string;
  product_id: string;
  stars: Stars;
  circled_at: string;
}

export interface CustomProductRow {
  list_id: string;
  id: string;
  title: string;
  price_minor: number;
  currency: string;
  retailer: string;
  url: string;
  image_url: string | null;
}

export interface GiverRow {
  list_id: string;
  user_id: string;
  display_name: string;
}

export interface ClaimRow {
  list_id: string;
  product_id: string;
  giver_id: string;
  status: 'held' | 'bought';
  claimed_at: string;
  held_until: string;
}

export interface GroupGiftRow {
  list_id: string;
  product_id: string;
  organiser_id: string;
}

export interface PledgeRow {
  list_id: string;
  product_id: string;
  giver_id: string;
  amount_minor: number;
}

const iso = (ms: number) => new Date(ms).toISOString();
const ms = (value: string) => Date.parse(value);

/** What the owner's phone uploads: the list, its circles and its found products. */
export function ownerRows(list: ListState): { list: ListRow; marks: MarkRow[]; products: CustomProductRow[] } {
  return {
    list: { id: list.id, title: list.settings.title, settings: list.settings },
    marks: Object.values(list.marks).map((m) => ({
      list_id: list.id,
      product_id: m.productId,
      stars: m.stars,
      circled_at: iso(m.circledAt),
    })),
    products: Object.values(list.customProducts).map((p) => ({
      list_id: list.id,
      id: p.id,
      title: p.title,
      price_minor: p.priceMinor,
      currency: p.currency,
      retailer: p.retailer,
      url: p.url,
      image_url: p.imageUrl ?? null,
    })),
  };
}

/** A list as its owner downloads it, e.g. on a new phone. Claims arrive separately (surprise mode). */
export function ownerListFromRows(list: ListRow, marks: MarkRow[], products: CustomProductRow[], findsKey: string): ListState {
  return {
    id: list.id,
    settings: list.settings,
    setupComplete: true,
    kidMode: false,
    marks: marksFromRows(marks),
    customProducts: productsFromRows(products, findsKey),
    claims: {},
    groupGifts: {},
  };
}

export function marksFromRows(rows: MarkRow[]): Record<string, CircleMark> {
  return Object.fromEntries(
    rows.map((r) => [r.product_id, { productId: r.product_id, stars: r.stars, circledAt: ms(r.circled_at) }]),
  );
}

export function productsFromRows(rows: CustomProductRow[], categoryKey: string): Record<string, Product> {
  return Object.fromEntries(
    rows.map((r) => [
      r.id,
      {
        id: r.id,
        catalogueNo: '',
        title: r.title,
        categoryKey,
        priceMinor: r.price_minor,
        currency: r.currency,
        retailer: r.retailer,
        url: r.url,
        emoji: '🎁',
        ...(r.image_url ? { imageUrl: r.image_url } : {}),
      },
    ]),
  );
}

/** The database stores giver ids; the app shows names. Unknown givers show as "Someone". */
function nameLookup(givers: GiverRow[]): (id: string) => string {
  const names = new Map(givers.map((g) => [g.user_id, g.display_name]));
  return (id) => names.get(id) ?? 'Someone';
}

export function claimsFromRows(rows: ClaimRow[], givers: GiverRow[]): Record<string, Claim> {
  const name = nameLookup(givers);
  return Object.fromEntries(
    rows.map((r) => [
      r.product_id,
      {
        productId: r.product_id,
        giverName: name(r.giver_id),
        status: r.status,
        claimedAt: ms(r.claimed_at),
        heldUntil: ms(r.held_until),
      },
    ]),
  );
}

export function groupGiftsFromRows(gifts: GroupGiftRow[], pledges: PledgeRow[], givers: GiverRow[]): Record<string, GroupGift> {
  const name = nameLookup(givers);
  return Object.fromEntries(
    gifts.map((g) => [
      g.product_id,
      {
        productId: g.product_id,
        organiserName: name(g.organiser_id),
        pledges: pledges
          .filter((p) => p.product_id === g.product_id)
          .map((p) => ({ giverName: name(p.giver_id), amountMinor: p.amount_minor })),
      },
    ]),
  );
}

/** Error codes the database functions raise, beyond the shared claim rules. */
export type ServerError =
  | ClaimError
  | 'not-signed-in'
  | 'list-not-found'
  | 'owner-cannot-give'
  | 'name-taken'
  | 'not-a-giver'
  | 'not-on-list'
  | 'no-group-gift'
  | 'bad-amount'
  | 'not-your-list'
  | 'bad-backup-code';

const SERVER_ERRORS: readonly ServerError[] = [
  'already-claimed', 'not-yours', 'not-claimed', 'not-signed-in', 'list-not-found', 'owner-cannot-give',
  'name-taken', 'not-a-giver', 'not-on-list', 'no-group-gift', 'bad-amount',
  'not-your-list', 'bad-backup-code',
];

/** Reads our error code out of a database error message; anything else is 'unknown'. */
export function serverError(message: string | undefined): ServerError | 'unknown' {
  const code = (message ?? '').trim();
  return (SERVER_ERRORS as readonly string[]).includes(code) ? (code as ServerError) : 'unknown';
}

/** Friendly words for each error, for Givers on the web link. */
export const SERVER_ERROR_TEXT: Record<ServerError | 'unknown', string> = {
  'already-claimed': 'Someone else has just claimed that one.',
  'not-yours': "That claim belongs to someone else.",
  'not-claimed': 'That claim has run out. You can claim it again.',
  'not-signed-in': 'Please open the link again.',
  'list-not-found': "We couldn't find that list. Check the link with whoever sent it.",
  'owner-cannot-give': "It's your own list! Surprise mode keeps the buying side hidden from you.",
  'name-taken': 'Someone on this list already uses that name. Try adding an initial.',
  'not-a-giver': 'Please add your name first.',
  'not-on-list': "That isn't on the list any more.",
  'no-group-gift': "That isn't a group gift yet.",
  'bad-amount': 'That amount needs to be a positive number.',
  'not-your-list': 'Only the person who made this list can change that.',
  'bad-backup-code': "That code didn't work. Check it against what you wrote down. Only the newest code works.",
  unknown: 'Something went wrong. Please try again.',
};
