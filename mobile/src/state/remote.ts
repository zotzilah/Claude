/**
 * The Supabase connection (issue #13). Dormant until the project's URL and anon key are set
 * in mobile/.env (see .env.example): until then `remote()` returns null and the app runs
 * entirely on the device, exactly as before.
 *
 * Security lives in the database (supabase/migrations), not here: this file only translates.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { yourFinds } from '@/data/catalogue';
import {
  claimsFromRows,
  groupGiftsFromRows,
  marksFromRows,
  ownerRows,
  productsFromRows,
  serverError,
  type ClaimRow,
  type CustomProductRow,
  type GiverRow,
  type GroupGiftRow,
  type ListRow,
  type MarkRow,
  type PledgeRow,
  type ServerError,
} from '@/domain/remote-rows';
import type { ListState } from '@/domain/types';

/**
 * Biro's Supabase project. The publishable key is designed to be public (it's in every
 * copy of the app); the database's row-level security does the protecting.
 * `mobile/.env` can point a build at a different project.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vrakfvlzsqdxjvxrmkvg.supabase.co';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_v9_HGeT1rhr1LBr5R880tw_NZqaUzFn';

/** Where the web version of the app lives, for share links that open without an app. */
export const WEB_APP_URL = 'https://zotzilah.github.io/Claude/app';

let client: SupabaseClient | null = null;

/** The shared client, or null when the backend isn't configured. */
export function remote(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  client ??= createClient(url, anonKey, {
    auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: ServerError | 'unknown' | 'offline' };

const fail = (message?: string): { ok: false; error: ServerError | 'unknown' } => ({ ok: false, error: serverError(message) });

/**
 * Nobody needs an account to start: givers and parents get an anonymous session the
 * first time. A parent can attach an email later (Settings → Account) to keep the list
 * if they change phones.
 */
export async function ensureSignedIn(db: SupabaseClient | null = remote()): Promise<boolean> {
  if (!db) return false;
  const { data } = await db.auth.getSession();
  if (data.session) return true;
  const { error } = await db.auth.signInAnonymously();
  return !error;
}

// ---------- Owner side ----------

/**
 * Uploads the owner's list: settings, circles and found products, removing circles that
 * were rubbed out. Claims and pledges are never sent from here (surprise mode).
 */
export async function pushOwnerList(list: ListState): Promise<Result<void>> {
  const db = remote();
  if (!db) return { ok: false, error: 'offline' };
  const rows = ownerRows(list);
  const { error: listError } = await db.from('lists').upsert(rows.list);
  if (listError) return fail(listError.message);
  if (rows.marks.length) {
    const { error } = await db.from('circle_marks').upsert(rows.marks, { onConflict: 'list_id,product_id' });
    if (error) return fail(error.message);
  }
  const kept = rows.marks.map((m) => `"${m.product_id.replace(/"/g, '')}"`).join(',');
  const removal = db.from('circle_marks').delete().eq('list_id', list.id);
  const { error: deleteError } = rows.marks.length ? await removal.not('product_id', 'in', `(${kept})`) : await removal;
  if (deleteError) return fail(deleteError.message);
  if (rows.products.length) {
    const { error } = await db.from('custom_products').upsert(rows.products, { onConflict: 'list_id,id' });
    if (error) return fail(error.message);
  }
  return { ok: true, value: undefined };
}

/** Surprise mode: which wishes are "taken care of" (never who). */
export async function fetchCovered(listId: string): Promise<Result<Set<string>>> {
  const db = remote();
  if (!db) return { ok: false, error: 'offline' };
  const { data, error } = await db.rpc('covered_products', { p_list: listId });
  if (error) return fail(error.message);
  return { ok: true, value: new Set((data as string[] | null) ?? []) };
}

export async function fetchShareToken(listId: string): Promise<Result<string>> {
  const db = remote();
  if (!db) return { ok: false, error: 'offline' };
  const { data, error } = await db.from('lists').select('share_token').eq('id', listId).single();
  if (error) return fail(error.message);
  return { ok: true, value: (data as { share_token: string }).share_token };
}

// ---------- Giver side ----------

export async function joinList(shareToken: string, displayName: string): Promise<Result<string>> {
  const db = remote();
  if (!db) return { ok: false, error: 'offline' };
  if (!(await ensureSignedIn(db))) return { ok: false, error: 'not-signed-in' };
  const { data, error } = await db.rpc('join_list', { p_share_token: shareToken, p_display_name: displayName });
  if (error) return fail(error.message);
  return { ok: true, value: data as string };
}

/** Everything a Giver sees, shaped like the app's own list so the same screens work. */
export async function fetchGiverView(listId: string): Promise<Result<Pick<ListState, 'settings' | 'marks' | 'customProducts' | 'claims' | 'groupGifts'>>> {
  const db = remote();
  if (!db) return { ok: false, error: 'offline' };
  const [list, marks, products, givers, claims, gifts, pledges] = await Promise.all([
    db.from('lists').select('id,title,settings').eq('id', listId).single(),
    db.from('circle_marks').select('*').eq('list_id', listId),
    db.from('custom_products').select('*').eq('list_id', listId),
    db.from('givers').select('list_id,user_id,display_name').eq('list_id', listId),
    db.from('claims').select('*').eq('list_id', listId),
    db.from('group_gifts').select('list_id,product_id,organiser_id').eq('list_id', listId),
    db.from('pledges').select('list_id,product_id,giver_id,amount_minor').eq('list_id', listId),
  ]);
  const firstError = [list, marks, products, givers, claims, gifts, pledges].find((r) => r.error)?.error;
  if (firstError) return fail(firstError.message);
  const giverRows = givers.data as GiverRow[];
  return {
    ok: true,
    value: {
      settings: (list.data as ListRow).settings,
      marks: marksFromRows(marks.data as MarkRow[]),
      customProducts: productsFromRows(products.data as CustomProductRow[], yourFinds.key),
      claims: claimsFromRows(claims.data as ClaimRow[], giverRows),
      groupGifts: groupGiftsFromRows(gifts.data as GroupGiftRow[], pledges.data as PledgeRow[], giverRows),
    },
  };
}

async function call(fn: string, args: Record<string, unknown>): Promise<Result<void>> {
  const db = remote();
  if (!db) return { ok: false, error: 'offline' };
  const { error } = await db.rpc(fn, args);
  return error ? fail(error.message) : { ok: true, value: undefined };
}

export const claimItem = (listId: string, productId: string) => call('claim_item', { p_list: listId, p_product: productId });
export const markBought = (listId: string, productId: string) => call('mark_bought', { p_list: listId, p_product: productId });
export const releaseClaim = (listId: string, productId: string) => call('release_claim', { p_list: listId, p_product: productId });
export const startGroupGift = (listId: string, productId: string) =>
  call('start_group_gift', { p_list: listId, p_product: productId });
export const pledge = (listId: string, productId: string, amountMinor: number) =>
  call('pledge', { p_list: listId, p_product: productId, p_amount_minor: amountMinor });

let watchers = 0;

/**
 * Calls `onChange` whenever circles, claims or pledges on the list change (live updates).
 * Each call gets its own channel: the parent's catalogue and the family page can both
 * watch the same list on one phone, and Supabase won't add listeners to a channel that's
 * already subscribed.
 */
export function watchList(listId: string, onChange: () => void): () => void {
  const db = remote();
  if (!db) return () => undefined;
  watchers += 1;
  const channel = db.channel(`list-${listId}-${watchers}`);
  for (const table of ['circle_marks', 'custom_products', 'claims', 'group_gifts', 'pledges']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `list_id=eq.${listId}` }, onChange);
  }
  channel.subscribe();
  return () => {
    db.removeChannel(channel);
  };
}
