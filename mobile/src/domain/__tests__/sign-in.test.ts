import { describe, expect, it } from '@jest/globals';

import { cleanCode, isCode, isEmail, normaliseEmail, resendWaitMs, signInError } from '../sign-in';

describe('parent sign-in', () => {
  it('tidies and checks email addresses', () => {
    expect(normaliseEmail('  Sam@Example.COM ')).toBe('sam@example.com');
    expect(isEmail('sam@example.com')).toBe(true);
    expect(isEmail('sam@example')).toBe(false);
    expect(isEmail('sam example.com')).toBe(false);
    expect(isEmail('')).toBe(false);
  });

  it('reads codes typed with spaces or pasted with text around them', () => {
    expect(cleanCode('123 456')).toBe('123456');
    expect(cleanCode('Your code: 123456')).toBe('123456');
    expect(isCode('123 456')).toBe(true);
    expect(isCode('12345')).toBe(false);
  });

  it('waits a minute before sending another code', () => {
    expect(resendWaitMs(null, 5000)).toBe(0);
    expect(resendWaitMs(0, 15_000)).toBe(45_000);
    expect(resendWaitMs(0, 90_000)).toBe(0);
  });

  it('explains auth errors', () => {
    expect(signInError({ status: 429, message: 'Too many requests' })).toBe('rate-limited');
    expect(signInError({ message: 'For security purposes, you can only request this after 42 seconds.' })).toBe('rate-limited');
    expect(signInError({ code: 'otp_expired', message: 'Token has expired or is invalid' })).toBe('wrong-code');
    expect(signInError({ message: 'TypeError: Network request failed' })).toBe('offline');
    expect(signInError({ message: 'Database error' })).toBe('unknown');
    expect(signInError(null)).toBe('unknown');
  });
});
