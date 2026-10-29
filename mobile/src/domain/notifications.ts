/**
 * Who hears about what, and when (brief §9). Pure rules: the server runs these
 * when something happens and hands the results to the push and email senders.
 *
 * Three promises are kept here, so the senders can't break them:
 *   1. Surprise mode: with it on, the list owner never learns who claimed what.
 *   2. Nobody is told about their own action.
 *   3. The child is never sent anything (children don't have accounts).
 */
import { REMINDERS_MS } from './claims';
import type { Claim, SurpriseMode } from './types';

export type NotifyEvent =
  | { kind: 'list-sent'; childName: string; itemCount: number }
  | { kind: 'claimed'; productTitle: string; by: string }
  | { kind: 'bought'; productTitle: string; by: string }
  | { kind: 'released'; productTitle: string; by: string }
  | { kind: 'pledged'; productTitle: string; by: string; amount: string; organiser: string }
  | { kind: 'claim-expiring'; productTitle: string; giver: string; hoursLeft: number }
  | { kind: 'list-finalised'; listTitle: string };

export type Channel = 'push' | 'email';

/** Everyone on a list, as the notifier sees them. */
export interface Audience {
  ownerName: string;
  surpriseMode: SurpriseMode;
  /** Givers who've joined, and how to reach each (web-link givers have no app, so email only). */
  givers: { name: string; channels: Channel[] }[];
}

export interface Delivery {
  to: { role: 'owner' } | { role: 'giver'; name: string };
  channels: Channel[];
  /** For 'claimed' and 'bought' under "taken care of" surprise mode: say what, never who. */
  anonymous?: boolean;
}

/** Works out who should be told about an event. */
export function deliveriesFor(event: NotifyEvent, audience: Audience): Delivery[] {
  const givers = (except?: string) =>
    audience.givers
      .filter((g) => g.name !== except && g.channels.length > 0)
      .map((g): Delivery => ({ to: { role: 'giver', name: g.name }, channels: g.channels }));
  const owner = (channels: Channel[], anonymous = false): Delivery[] =>
    [{ to: { role: 'owner' }, channels, ...(anonymous ? { anonymous } : {}) }];

  switch (event.kind) {
    case 'list-sent':
      // The order slip: a push and the emailed receipt (brief §7.4).
      return owner(['push', 'email']);
    case 'claimed':
    case 'bought': {
      const forOwner =
        audience.surpriseMode === 'off'
          ? owner(['push'])
          : audience.surpriseMode === 'taken-care-of' && event.kind === 'bought'
            ? owner(['push'], true)
            : [];
      // Other givers hear about it too, so nobody buys the same thing.
      return [...forOwner, ...givers(event.by)];
    }
    case 'released':
      // Back on the list: worth telling the other givers, not worth bothering the owner.
      return givers(event.by);
    case 'pledged':
      // Only the organiser needs to know; they're collecting the money.
      return event.organiser === event.by
        ? []
        : audience.givers
            .filter((g) => g.name === event.organiser && g.channels.length > 0)
            .map((g) => ({ to: { role: 'giver' as const, name: g.name }, channels: g.channels }));
    case 'claim-expiring':
      return audience.givers
        .filter((g) => g.name === event.giver && g.channels.length > 0)
        .map((g) => ({ to: { role: 'giver' as const, name: g.name }, channels: g.channels }));
    case 'list-finalised':
      return [...owner(['email']), ...givers()];
  }
}

/**
 * When to remind a giver that their hold is running out: 24 hours and 6 hours
 * before it ends, skipping any that have already passed. Bought claims need none.
 */
export function reminderTimes(claim: Claim, now: number): number[] {
  if (claim.status !== 'held') return [];
  return REMINDERS_MS.map((before) => claim.heldUntil - before).filter((at) => at > now);
}

/**
 * Pushes are held back overnight (21:00 to 08:00 on the recipient's clock), so a
 * claim at midnight doesn't buzz Nan awake. Emails aren't delayed.
 * `localHour` is the recipient's current hour, 0–23.
 */
export function quietHoursDelayMs(localHour: number, localMinute = 0): number {
  const minutes = localHour * 60 + localMinute;
  const start = 21 * 60;
  const end = 8 * 60;
  if (minutes >= end && minutes < start) return 0;
  const untilEnd = minutes >= start ? 24 * 60 - minutes + end : end - minutes;
  return untilEnd * 60 * 1000;
}

// ---------- WhatsApp ----------

/**
 * A link that opens WhatsApp with the message ready to send. Works on phones
 * and computers without any WhatsApp Business account (brief §9, v1).
 */
export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// ---------- Wording ----------

interface NotifyStrings {
  listSent: (child: string, n: number) => Message;
  claimed: (title: string, by: string) => Message;
  bought: (title: string, by: string) => Message;
  takenCareOf: (title: string) => Message;
  released: (title: string, by: string) => Message;
  pledged: (title: string, by: string, amount: string) => Message;
  expiring: (title: string, hours: number) => Message;
  finalised: (listTitle: string) => Message;
}

export interface Message {
  title: string;
  body: string;
}

/** The words for one delivery, in the recipient's language (`strings.notify`). */
export function messageFor(event: NotifyEvent, delivery: Delivery, words: NotifyStrings): Message {
  switch (event.kind) {
    case 'list-sent':
      return words.listSent(event.childName, event.itemCount);
    case 'claimed':
    case 'bought':
      if (delivery.anonymous) return words.takenCareOf(event.productTitle);
      return event.kind === 'claimed' ? words.claimed(event.productTitle, event.by) : words.bought(event.productTitle, event.by);
    case 'released':
      return words.released(event.productTitle, event.by);
    case 'pledged':
      return words.pledged(event.productTitle, event.by, event.amount);
    case 'claim-expiring':
      return words.expiring(event.productTitle, event.hoursLeft);
    case 'list-finalised':
      return words.finalised(event.listTitle);
  }
}
