import { describe, expect, it } from '@jest/globals';

import { enGB } from '../../i18n/en-GB';
import { CLAIM_HOLD_MS } from '../claims';
import { deliveriesFor, messageFor, quietHoursDelayMs, reminderTimes, whatsAppShareUrl, type Audience } from '../notifications';
import type { SurpriseMode } from '../types';

const audience = (surpriseMode: SurpriseMode): Audience => ({
  ownerName: 'Sam',
  surpriseMode,
  givers: [
    { name: 'Nan', channels: ['email'] },
    { name: 'Dave', channels: ['push'] },
    { name: 'Quiet Kim', channels: [] },
  ],
});
const who = (ds: ReturnType<typeof deliveriesFor>) => ds.map((d) => (d.to.role === 'owner' ? 'owner' : d.to.name));

describe('who hears about a claim', () => {
  const claimed = { kind: 'claimed', productTitle: 'bike', by: 'Nan' } as const;
  const bought = { kind: 'bought', productTitle: 'bike', by: 'Nan' } as const;

  it('tells the owner by name when surprise mode is off', () => {
    expect(who(deliveriesFor(claimed, audience('off')))).toEqual(['owner', 'Dave']);
  });

  it('only says "taken care of" to the owner, and only once it is bought', () => {
    expect(who(deliveriesFor(claimed, audience('taken-care-of')))).toEqual(['Dave']);
    const ds = deliveriesFor(bought, audience('taken-care-of'));
    expect(ds[0]).toEqual({ to: { role: 'owner' }, channels: ['push'], anonymous: true });
    expect(messageFor(bought, ds[0], enGB.notify).title).not.toContain('Nan');
  });

  it('tells the owner nothing when everything is hidden', () => {
    expect(who(deliveriesFor(bought, audience('hide-all')))).toEqual(['Dave']);
  });

  it('never tells people about their own action, or people with no way to hear', () => {
    const ds = deliveriesFor({ kind: 'claimed', productTitle: 'bike', by: 'Dave' }, audience('off'));
    expect(who(ds)).toEqual(['owner', 'Nan']);
    expect(ds[1].channels).toEqual(['email']);
  });
});

describe('other events', () => {
  it('sends the order slip by push and email', () => {
    expect(deliveriesFor({ kind: 'list-sent', childName: 'Ellie', itemCount: 5 }, audience('off'))).toEqual([
      { to: { role: 'owner' }, channels: ['push', 'email'] },
    ]);
  });

  it('only tells the organiser about pledges', () => {
    expect(who(deliveriesFor({ kind: 'pledged', productTitle: 'bike', by: 'Dave', amount: '£25', organiser: 'Nan' }, audience('off')))).toEqual(['Nan']);
    expect(deliveriesFor({ kind: 'pledged', productTitle: 'bike', by: 'Nan', amount: '£25', organiser: 'Nan' }, audience('off'))).toEqual([]);
  });

  it('reminds only the giver holding the item', () => {
    expect(who(deliveriesFor({ kind: 'claim-expiring', productTitle: 'bike', giver: 'Dave', hoursLeft: 6 }, audience('off')))).toEqual(['Dave']);
  });

  it('writes friendly messages', () => {
    const ev = { kind: 'claim-expiring', productTitle: 'bike', giver: 'Dave', hoursLeft: 6 } as const;
    expect(messageFor(ev, deliveriesFor(ev, audience('off'))[0], enGB.notify).title).toBe('6 hours left on the bike');
    expect(enGB.notify.listSent('Ellie', 1).body).toContain('1 thing circled');
  });
});

describe('timing', () => {
  it('schedules reminders 24h and 6h before a hold runs out', () => {
    const claim = { productId: 'p', giverName: 'Nan', status: 'held' as const, claimedAt: 0, heldUntil: CLAIM_HOLD_MS };
    const h = 60 * 60 * 1000;
    expect(reminderTimes(claim, 0)).toEqual([24 * h, 42 * h]);
    expect(reminderTimes(claim, 30 * h)).toEqual([42 * h]);
    expect(reminderTimes({ ...claim, status: 'bought' }, 0)).toEqual([]);
  });

  it('holds pushes overnight', () => {
    const min = 60 * 1000;
    expect(quietHoursDelayMs(12)).toBe(0);
    expect(quietHoursDelayMs(20, 59)).toBe(0);
    expect(quietHoursDelayMs(21)).toBe(11 * 60 * min);
    expect(quietHoursDelayMs(23, 30)).toBe(8.5 * 60 * min);
    expect(quietHoursDelayMs(7, 45)).toBe(15 * min);
  });
});

describe('WhatsApp', () => {
  it('builds a ready-to-send link', () => {
    expect(whatsAppShareUrl("Ellie's list: https://biro.example/l/abc")).toBe(
      'https://wa.me/?text=Ellie\'s%20list%3A%20https%3A%2F%2Fbiro.example%2Fl%2Fabc',
    );
  });
});
