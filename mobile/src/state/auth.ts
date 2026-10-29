/**
 * Parent accounts: an email address and a 6-digit code each time, no password.
 * Works only once the backend is set up (see `remote.ts`); until then every
 * call answers `not-set-up` and the app carries on without accounts.
 */
import { useEffect, useState } from 'react';

import { normaliseEmail, signInError, type SignInError } from '@/domain/sign-in';

import { remote } from './remote';

export type AuthResult = { ok: true } | { ok: false; error: SignInError };

export interface Parent {
  email: string;
}

/** True when the app has a backend to sign in to. */
export function accountsAvailable(): boolean {
  return remote() !== null;
}

/** Emails a sign-in code. New email addresses get an account automatically. */
export async function sendCode(email: string): Promise<AuthResult> {
  const db = remote();
  if (!db) return { ok: false, error: 'not-set-up' };
  try {
    const { error } = await db.auth.signInWithOtp({ email: normaliseEmail(email), options: { shouldCreateUser: true } });
    return error ? { ok: false, error: signInError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, error: signInError(e as Error) };
  }
}

export async function verifyCode(email: string, code: string): Promise<AuthResult> {
  const db = remote();
  if (!db) return { ok: false, error: 'not-set-up' };
  try {
    const { error } = await db.auth.verifyOtp({ email: normaliseEmail(email), token: code, type: 'email' });
    return error ? { ok: false, error: signInError(error) } : { ok: true };
  } catch (e) {
    return { ok: false, error: signInError(e as Error) };
  }
}

export async function signOut(): Promise<void> {
  await remote()?.auth.signOut();
}

/**
 * Deletes the account and every list it owns, on the server (see the
 * `delete_my_account` database function), then signs out on this phone.
 */
export async function deleteAccount(): Promise<AuthResult> {
  const db = remote();
  if (!db) return { ok: false, error: 'not-set-up' };
  const { error } = await db.rpc('delete_my_account');
  if (error) return { ok: false, error: signInError(error) };
  await db.auth.signOut();
  return { ok: true };
}

/** The signed-in parent, or null. Givers' anonymous sessions don't count. */
export function useParent(): Parent | null {
  const [parent, setParent] = useState<Parent | null>(null);
  useEffect(() => {
    const db = remote();
    if (!db) return;
    const read = (user: { email?: string; is_anonymous?: boolean } | null | undefined) =>
      setParent(user?.email && !user.is_anonymous ? { email: user.email } : null);
    db.auth.getUser().then(({ data }) => read(data.user));
    const { data } = db.auth.onAuthStateChange((_event, session) => read(session?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  return parent;
}
