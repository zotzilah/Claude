/**
 * Giver rules (brief §7): 48-hour claim holds, honour-system purchases,
 * surprise mode and group-gift pledges. All pure; `now` is always passed in.
 */
import type { Claim, GroupGift, SurpriseMode } from './types';

export const CLAIM_HOLD_MS = 48 * 60 * 60 * 1000;

/** A claim that has run out is treated as if it never existed. */
export function activeClaim(claim: Claim | undefined, now: number): Claim | null {
  if (!claim) return null;
  if (claim.status === 'held' && now >= claim.heldUntil) return null;
  return claim;
}

export type ClaimError = 'already-claimed' | 'not-yours' | 'not-claimed';

export function claim(
  claims: Record<string, Claim>,
  productId: string,
  giverName: string,
  now: number,
): Record<string, Claim> | ClaimError {
  if (activeClaim(claims[productId], now)) return 'already-claimed';
  return {
    ...claims,
    [productId]: { productId, giverName, status: 'held', claimedAt: now, heldUntil: now + CLAIM_HOLD_MS },
  };
}

export function markBought(
  claims: Record<string, Claim>,
  productId: string,
  giverName: string,
  now: number,
): Record<string, Claim> | ClaimError {
  const current = activeClaim(claims[productId], now);
  if (!current) return 'not-claimed';
  if (current.giverName !== giverName) return 'not-yours';
  return { ...claims, [productId]: { ...current, status: 'bought' } };
}

export function release(
  claims: Record<string, Claim>,
  productId: string,
  giverName: string,
  now: number,
): Record<string, Claim> | ClaimError {
  const current = activeClaim(claims[productId], now);
  if (!current) return 'not-claimed';
  if (current.giverName !== giverName) return 'not-yours';
  const next = { ...claims };
  delete next[productId];
  return next;
}

/** Drops expired holds, e.g. before saving. */
export function pruneExpired(claims: Record<string, Claim>, now: number): Record<string, Claim> {
  return Object.fromEntries(Object.entries(claims).filter(([, c]) => activeClaim(c, now)));
}

export function msLeft(claim: Claim, now: number): number {
  return Math.max(0, claim.heldUntil - now);
}

/** "47h 59m" style countdown. */
export function formatCountdown(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** Reminder points before a hold expires (brief §7.2). */
export const REMINDERS_MS = [24 * 60 * 60 * 1000, 6 * 60 * 60 * 1000];

export type ListSideView =
  | { kind: 'covered' }
  | { kind: 'claimed' | 'bought'; by: string };

/**
 * What the list side sees for a wish (brief §7.3, made optional by the founder):
 * with surprise off the owner sees who has it; with "taken care of" only that it's covered;
 * with "hide everything" nothing. Kid Mode never learns who, whatever the setting.
 */
export function listSideView(claim: Claim | undefined, mode: SurpriseMode, now: number, kidMode: boolean): ListSideView | null {
  const active = activeClaim(claim, now);
  if (!active || mode === 'hide-all') return null;
  if (kidMode) return mode === 'taken-care-of' ? { kind: 'covered' } : null;
  if (mode === 'taken-care-of') return { kind: 'covered' };
  return { kind: active.status === 'bought' ? 'bought' : 'claimed', by: active.giverName };
}

// ---------- Group gifts ----------

export function startGroupGift(
  gifts: Record<string, GroupGift>,
  productId: string,
  organiserName: string,
): Record<string, GroupGift> {
  if (gifts[productId]) return gifts;
  return { ...gifts, [productId]: { productId, organiserName, pledges: [] } };
}

/** One pledge per person: pledging again replaces the old amount; 0 withdraws. */
export function pledge(
  gifts: Record<string, GroupGift>,
  productId: string,
  giverName: string,
  amountMinor: number,
): Record<string, GroupGift> {
  const gift = gifts[productId];
  if (!gift || !Number.isInteger(amountMinor) || amountMinor < 0) return gifts;
  const others = gift.pledges.filter((p) => p.giverName !== giverName);
  const pledges = amountMinor > 0 ? [...others, { giverName, amountMinor }] : others;
  return { ...gifts, [productId]: { ...gift, pledges } };
}

export function pledgedMinor(gift: GroupGift): number {
  return gift.pledges.reduce((sum, p) => sum + p.amountMinor, 0);
}

export interface GiverSummary {
  wishCount: number;
  totalMinor: number;
  /** Claimed or bought items. */
  coveredMinor: number;
  remainingMinor: number;
}

/** The numbers at the top of the Giver page. Expired holds don't count as covered. */
export function giverSummary(
  wishes: { product: { id: string; priceMinor: number; currency?: string } }[],
  claims: Record<string, Claim>,
  now: number,
  /** Only items in this currency are added up (overseas finds can't be). */
  currency?: string,
): GiverSummary {
  const priced = currency ? wishes.filter((w) => (w.product.currency ?? currency) === currency) : wishes;
  const totalMinor = priced.reduce((sum, w) => sum + w.product.priceMinor, 0);
  const coveredMinor = priced
    .filter((w) => activeClaim(claims[w.product.id], now))
    .reduce((sum, w) => sum + w.product.priceMinor, 0);
  return { wishCount: wishes.length, totalMinor, coveredMinor, remainingMinor: totalMinor - coveredMinor };
}
