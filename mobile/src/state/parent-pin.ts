/**
 * Stores the parent's Kid Mode PIN and wrong-guess cool-down.
 *
 * On phones the PIN lives in the secure keychain/keystore, salted and hashed, so it
 * never sits on the device in plain text. (Four digits can't resist a determined
 * attacker with the phone unlocked; this keeps a curious child out, which is the job.)
 * The web build has no secure store, so it falls back to browser storage. That's
 * fine, because the web build is only for development and the Giver link.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { NO_ATTEMPTS, registerFailure, type AttemptState } from '@/domain/pin';

const PIN_KEY = 'biro.pinHash';
const SALT_KEY = 'biro.pinSalt';
const ATTEMPTS_KEY = 'biro.pinAttempts';

const secure = Platform.OS !== 'web';

async function read(key: string): Promise<string | null> {
  return secure ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
}

async function write(key: string, value: string): Promise<void> {
  if (secure) await SecureStore.setItemAsync(key, value);
  else await AsyncStorage.setItem(key, value);
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

async function hash(pin: string, salt: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function hasPin(): Promise<boolean> {
  return (await read(PIN_KEY)) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const salt = toHex(getRandomBytes(16));
  await write(SALT_KEY, salt);
  await write(PIN_KEY, await hash(pin, salt));
  await saveAttempts(NO_ATTEMPTS);
}

/** Checks a guess and records the outcome for the cool-down. */
export async function checkPin(pin: string, now: number): Promise<{ ok: boolean; attempts: AttemptState }> {
  const [stored, salt] = await Promise.all([read(PIN_KEY), read(SALT_KEY)]);
  const ok = stored !== null && salt !== null && (await hash(pin, salt)) === stored;
  const attempts = ok ? NO_ATTEMPTS : registerFailure(await loadAttempts(), now);
  await saveAttempts(attempts);
  return { ok, attempts };
}

export async function loadAttempts(): Promise<AttemptState> {
  try {
    const raw = JSON.parse((await AsyncStorage.getItem(ATTEMPTS_KEY)) ?? 'null');
    if (raw && Number.isInteger(raw.failures) && Number.isFinite(raw.lockedUntil)) return raw;
  } catch {
    // Unreadable: treat as no failures rather than locking a parent out.
  }
  return NO_ATTEMPTS;
}

async function saveAttempts(attempts: AttemptState): Promise<void> {
  await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

// ---------- Face ID / fingerprint ----------

/** Expo Go on iPhone can't use Face ID (Expo's docs: it needs a development build). */
const faceIdBlocked = Platform.OS === 'ios' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function canUseBiometrics(): Promise<boolean> {
  if (!secure || faceIdBlocked) return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/**
 * Face ID or fingerprint. `allowPhonePasscode` is for "Forgot PIN?": the phone's own
 * passcode is a fair recovery route, but not the everyday one, as kids often know it.
 */
export async function authenticateParent(allowPhonePasscode = false): Promise<'ok' | 'cancelled' | 'failed'> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Leave Kid Mode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: !allowPhonePasscode,
    });
    if (result.success) return 'ok';
    return result.error === 'user_cancel' || result.error === 'system_cancel' || result.error === 'app_cancel'
      ? 'cancelled'
      : 'failed';
  } catch {
    return 'failed';
  }
}
