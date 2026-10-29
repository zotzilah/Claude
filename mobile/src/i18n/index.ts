/**
 * Picks the app's words for a language tag like "en-GB" or "en-US".
 *
 * To add a language: copy `en-GB.ts` to e.g. `fr.ts`, translate every value,
 * and add it to `FULL` below. For a regional variant of a language that's
 * already here, add a small overrides file like `en-US.ts` to `VARIANTS`.
 * Unknown languages get British English.
 */
import { enGB, type Strings } from './en-GB';
import { enUS } from './en-US';

type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type StringOverrides = DeepPartial<Strings>;
export type { Strings };

/** Complete translations, by language. */
const FULL: Record<string, Strings> = { en: enGB };

/** Regional tweaks on top of a full translation, by language-REGION. */
const VARIANTS: Record<string, StringOverrides> = { 'en-US': enUS, 'en-PH': enUS };

function merge<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (!over) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(over as Record<string, unknown>)) {
    const current = out[key];
    out[key] =
      value && typeof value === 'object' && !Array.isArray(value) && current && typeof current === 'object'
        ? merge(current, value as DeepPartial<typeof current>)
        : value;
  }
  return out as T;
}

/** "en-US" → American English; "de-DE" → British English until German exists. */
export function stringsFor(languageTag: string): Strings {
  const [language = 'en', region = ''] = languageTag.replace('_', '-').split('-');
  const base = FULL[language.toLowerCase()] ?? enGB;
  return merge<Strings>(base, VARIANTS[`${language.toLowerCase()}-${region.toUpperCase()}`]);
}
