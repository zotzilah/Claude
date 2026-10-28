import { describe, expect, it } from '@jest/globals';

import {
  activeClaim,
  CLAIM_HOLD_MS,
  claim,
  formatCountdown,
  giverSummary,
  markBought,
  ownerView,
  pledge,
  pledgedMinor,
  pruneExpired,
  release,
  startGroupGift,
} from '../claims';
import type { Claim } from '../types';

const T0 = 1_000_000;
const H = 60 * 60 * 1000;

function claimed(): Record<string, Claim> {
  const result = claim({}, 'bike', 'Nan', T0);
  if (typeof result === 'string') throw new Error(result);
  return result;
}

describe('claiming', () => {
  it('holds an item for 48 hours', () => {
    const claims = claimed();
    expect(claims.bike).toMatchObject({ giverName: 'Nan', status: 'held', heldUntil: T0 + CLAIM_HOLD_MS });
    expect(activeClaim(claims.bike, T0 + 47 * H)).not.toBeNull();
  });

  it('stops anyone else claiming a held item', () => {
    expect(claim(claimed(), 'bike', 'Dave', T0 + H)).toBe('already-claimed');
  });

  it('expires after 48 hours, freeing the item for someone else', () => {
    const claims = claimed();
    expect(activeClaim(claims.bike, T0 + CLAIM_HOLD_MS)).toBeNull();
    const next = claim(claims, 'bike', 'Dave', T0 + CLAIM_HOLD_MS);
    expect(typeof next === 'object' && next.bike.giverName).toBe('Dave');
  });

  it('only lets the claimer mark it bought, and bought claims never expire', () => {
    const claims = claimed();
    expect(markBought(claims, 'bike', 'Dave', T0 + H)).toBe('not-yours');
    const bought = markBought(claims, 'bike', 'Nan', T0 + H);
    if (typeof bought === 'string') throw new Error(bought);
    expect(bought.bike.status).toBe('bought');
    expect(activeClaim(bought.bike, T0 + 1000 * H)).not.toBeNull();
  });

  it('cannot mark an expired hold as bought', () => {
    expect(markBought(claimed(), 'bike', 'Nan', T0 + CLAIM_HOLD_MS + 1)).toBe('not-claimed');
  });

  it('lets the claimer release it, and nobody else', () => {
    expect(release(claimed(), 'bike', 'Dave', T0)).toBe('not-yours');
    expect(release(claimed(), 'bike', 'Nan', T0)).toEqual({});
  });

  it('prunes only expired holds', () => {
    let claims = claimed();
    const second = claim(claims, 'kite', 'Dave', T0);
    if (typeof second === 'string') throw new Error(second);
    const bought = markBought(second, 'kite', 'Dave', T0);
    if (typeof bought === 'string') throw new Error(bought);
    claims = pruneExpired(bought, T0 + CLAIM_HOLD_MS + 1);
    expect(Object.keys(claims)).toEqual(['kite']);
  });

  it('formats countdowns', () => {
    expect(formatCountdown(CLAIM_HOLD_MS)).toBe('48h 00m');
    expect(formatCountdown(6 * H + 5 * 60 * 1000)).toBe('6h 05m');
    expect(formatCountdown(59 * 1000)).toBe('1m');
  });
});

describe('surprise mode', () => {
  it('never tells the owner who, and hides everything in hide-all', () => {
    const claims = claimed();
    expect(ownerView(claims.bike, 'taken-care-of', T0)).toBe('taken-care-of');
    expect(ownerView(claims.bike, 'hide-all', T0)).toBeNull();
    expect(ownerView(undefined, 'taken-care-of', T0)).toBeNull();
    expect(ownerView(claims.bike, 'taken-care-of', T0 + CLAIM_HOLD_MS)).toBeNull();
  });
});

describe('group gifts', () => {
  it('tracks one pledge per person', () => {
    let gifts = startGroupGift({}, 'bike', 'Dave');
    gifts = pledge(gifts, 'bike', 'Dave', 5000);
    gifts = pledge(gifts, 'bike', 'Sue', 2500);
    gifts = pledge(gifts, 'bike', 'Sue', 3000);
    expect(gifts.bike.pledges).toEqual([
      { giverName: 'Dave', amountMinor: 5000 },
      { giverName: 'Sue', amountMinor: 3000 },
    ]);
    expect(pledgedMinor(gifts.bike)).toBe(8000);
  });

  it('withdraws with a zero pledge and ignores invalid amounts', () => {
    let gifts = pledge(startGroupGift({}, 'bike', 'Dave'), 'bike', 'Sue', 2500);
    expect(pledge(gifts, 'bike', 'Sue', -5)).toBe(gifts);
    expect(pledge(gifts, 'bike', 'Sue', 12.5)).toBe(gifts);
    gifts = pledge(gifts, 'bike', 'Sue', 0);
    expect(gifts.bike.pledges).toEqual([]);
  });

  it('keeps the original organiser if started twice, and ignores pledges to unknown gifts', () => {
    const gifts = startGroupGift({}, 'bike', 'Dave');
    expect(startGroupGift(gifts, 'bike', 'Sue').bike.organiserName).toBe('Dave');
    expect(pledge(gifts, 'kite', 'Sue', 100)).toBe(gifts);
  });
});

describe('giverSummary', () => {
  const wishes = [
    { product: { id: 'bike', priceMinor: 14999 } },
    { product: { id: 'kite', priceMinor: 899 } },
  ];

  it('counts claimed and bought items as covered', () => {
    expect(giverSummary(wishes, claimed(), T0)).toEqual({
      wishCount: 2,
      totalMinor: 15898,
      coveredMinor: 14999,
      remainingMinor: 899,
    });
  });

  it('stops counting a hold once it expires', () => {
    expect(giverSummary(wishes, claimed(), T0 + CLAIM_HOLD_MS).coveredMinor).toBe(0);
  });
});
