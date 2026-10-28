import { describe, expect, it } from '@jest/globals';

import { FREE_TRIES, isEasyPin, isValidPin, lockedForMs, NO_ATTEMPTS, registerFailure, type AttemptState } from '../pin';

describe('PIN format', () => {
  it('needs exactly four digits', () => {
    expect(isValidPin('2580')).toBe(true);
    expect(isValidPin('258')).toBe(false);
    expect(isValidPin('25800')).toBe(false);
    expect(isValidPin('25a0')).toBe(false);
  });

  it.each(['0000', '7777', '1234', '4321', '6789'])('flags %p as easy to guess', (pin) => {
    expect(isEasyPin(pin)).toBe(true);
  });

  it.each(['2580', '1357', '9024', '1123'])('accepts %p as not obvious', (pin) => {
    expect(isEasyPin(pin)).toBe(false);
  });
});

describe('cool-down after wrong guesses', () => {
  const fail = (times: number, now = 0) => {
    let s: AttemptState = NO_ATTEMPTS;
    for (let i = 0; i < times; i++) s = registerFailure(s, now);
    return s;
  };

  it('allows a few honest mistakes', () => {
    expect(lockedForMs(fail(FREE_TRIES - 1), 0)).toBe(0);
  });

  it('locks for 30 seconds, then doubles each time', () => {
    expect(lockedForMs(fail(FREE_TRIES), 0)).toBe(30_000);
    expect(lockedForMs(fail(FREE_TRIES + 1), 0)).toBe(60_000);
    expect(lockedForMs(fail(FREE_TRIES + 2), 0)).toBe(120_000);
  });

  it('never locks for more than 5 minutes', () => {
    expect(lockedForMs(fail(FREE_TRIES + 20), 0)).toBe(300_000);
  });

  it('counts down as time passes', () => {
    const s = fail(FREE_TRIES, 1000);
    expect(lockedForMs(s, 21_000)).toBe(10_000);
    expect(lockedForMs(s, 40_000)).toBe(0);
  });
});
