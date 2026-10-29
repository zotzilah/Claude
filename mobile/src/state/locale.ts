/**
 * The phone's language and country, read once at start-up.
 * Decides the app's words (`strings`), how money is written, and the
 * currency a new list starts with.
 */
import { getLocales } from 'expo-localization';

import { currencyForRegion } from '@/domain/money';
import { stringsFor } from '@/i18n';

const primary = getLocales()[0];

export const deviceLocale = {
  /** e.g. "en-GB", "de-DE". Used for number and money formatting. */
  tag: primary?.languageTag ?? 'en-GB',
  region: primary?.regionCode ?? null,
  /** The currency a new list starts with. Can be changed in setup. */
  currency: primary?.currencyCode ?? currencyForRegion(primary?.regionCode),
};

export const strings = stringsFor(deviceLocale.tag);

/** The app's words in the phone's language. A hook so screens can later react to language changes. */
export function useStrings() {
  return strings;
}
