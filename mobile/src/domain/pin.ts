/**
 * Parent PIN rules for leaving Kid Mode (brief §6). Pure: storage and hashing
 * live in src/state/parent-pin.ts.
 */

export const PIN_LENGTH = 4;

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

/** PINs a child is likely to guess. We warn, but let the parent choose. */
export function isEasyPin(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true; // 0000, 1111…
  const digits = pin.split('').map(Number);
  const steps = digits.slice(1).map((d, i) => d - digits[i]);
  return steps.every((s) => s === 1) || steps.every((s) => s === -1); // 1234, 4321…
}

export interface AttemptState {
  failures: number;
  lockedUntil: number;
}

export const NO_ATTEMPTS: AttemptState = { failures: 0, lockedUntil: 0 };

/** Wrong guesses allowed before the first cool-down. */
export const FREE_TRIES = 5;
const BASE_LOCK_MS = 30 * 1000;
const MAX_LOCK_MS = 5 * 60 * 1000;

/** After the free tries, each wrong guess locks for 30s, then 60s, 120s… up to 5 minutes. */
export function registerFailure(state: AttemptState, now: number): AttemptState {
  const failures = state.failures + 1;
  if (failures < FREE_TRIES) return { failures, lockedUntil: 0 };
  const lockMs = Math.min(MAX_LOCK_MS, BASE_LOCK_MS * 2 ** (failures - FREE_TRIES));
  return { failures, lockedUntil: now + lockMs };
}

export function lockedForMs(state: AttemptState, now: number): number {
  return Math.max(0, state.lockedUntil - now);
}
