/**
 * Parent sign-in with a one-time code sent by email (no passwords to forget).
 * Pure rules for the sign-in screen; the Supabase calls live in `state/auth.ts`.
 */

/** Tidies an email address the way people type it: spaces, capitals. */
export function normaliseEmail(text: string): string {
  return text.trim().toLowerCase();
}

/** Good enough to catch typos before we send anything. The email itself is the real check. */
export function isEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normaliseEmail(text));
}

/** Supabase sends 6 digits by default; projects can raise it to 10. */
export function cleanCode(text: string): string {
  return text.replace(/\D/g, '').slice(0, 10);
}

export function isCode(text: string): boolean {
  return /^\d{6,10}$/.test(cleanCode(text));
}

/** Supabase allows one code per address per minute. */
export const RESEND_AFTER_MS = 60 * 1000;

export function resendWaitMs(sentAt: number | null, now: number): number {
  if (sentAt === null) return 0;
  return Math.max(0, sentAt + RESEND_AFTER_MS - now);
}

export type SignInError = 'rate-limited' | 'wrong-code' | 'offline' | 'not-set-up' | 'unknown';

/** Turns an auth error into something the screen can explain. */
export function signInError(error: { status?: number; code?: string; message?: string } | null | undefined): SignInError {
  if (!error) return 'unknown';
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();
  if (error.status === 429 || code.includes('rate_limit') || message.includes('rate limit') || message.includes('security purposes')) {
    return 'rate-limited';
  }
  if (code === 'otp_expired' || message.includes('expired') || message.includes('invalid') || message.includes('token')) {
    return 'wrong-code';
  }
  if (message.includes('network') || message.includes('fetch')) return 'offline';
  return 'unknown';
}
