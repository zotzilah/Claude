import { amountsFor } from './money';
import type { AgeBand, Buyers, ListSettings, Template } from './types';

/** The occasions offered in setup. Their names live in the strings (`templates.label`). */
export const templates: { key: Template; icon: string }[] = [
  { key: 'christmas', icon: '🎄' },
  { key: 'birthday', icon: '🎂' },
  { key: 'custom', icon: '🎁' },
];

/** Builds a list title, e.g. "Ellie's Christmas Book 2026". Comes from the app's strings. */
export type TitleFor = (template: Template, name: string, year: number) => string;

/** "Ellie" → "Ellie's", "James" → "James'". Empty names fall back to "My". */
export function possessive(name: string): string {
  const n = name.trim();
  if (!n) return 'My';
  return /s$/i.test(n) ? `${n}'` : `${n}'s`;
}

/** A fresh list. The budget is a round number in the family's own currency. */
export function defaultSettings(currency = 'GBP'): ListSettings {
  return {
    title: 'My Christmas Book',
    template: 'christmas',
    circler: 'child',
    circlerName: '',
    ageBand: null,
    buyers: 'family',
    budgetMinor: amountsFor(currency).budgetMinor,
    currency,
    runningTotalOn: true,
    // Surprise is opt-in: by default the parent sees who's buying what.
    surpriseMode: 'off',
    kidPricesShown: false,
  };
}

/** Prices stay out of sight for under-8s unless a parent turns them on (brief §4.3). */
export function defaultKidPricesShown(ageBand: AgeBand | null): boolean {
  return ageBand === '9-12';
}

/** Group gifts are offered for items at or above this price (e.g. £100, $100, ¥15,000). */
export function groupGiftThresholdMinor(currency: string): number {
  return amountsFor(currency).groupGiftMinor;
}

export interface Features {
  /** Givers can claim items. Pointless when only one person is buying. */
  claiming: boolean;
  groupGifts: boolean;
  /** Givers need a share link at all. */
  giverLink: boolean;
}

/** Brief §4.2: the interface adapts to who's buying. */
export function featuresFor(buyers: Buyers): Features {
  const shared = buyers !== 'just-me';
  return { claiming: shared, groupGifts: buyers === 'family', giverLink: shared };
}

/** Turns setup answers into list settings, filling in the title from the template. */
export function finishSettings(draft: ListSettings, year: number, titleFor: TitleFor): ListSettings {
  const name = draft.circlerName.trim();
  return {
    ...draft,
    circlerName: name,
    ageBand: draft.circler === 'child' ? draft.ageBand : null,
    title: titleFor(draft.template, name, year),
  };
}

/** What's stopping setup from finishing. The words for each live in `setup.problems`. */
export type SetupProblem = 'child-name' | 'list-name' | 'age' | 'budget';

/** Why setup can't finish yet, or null when it can. */
export function setupProblem(draft: ListSettings): SetupProblem | null {
  if (!draft.circlerName.trim()) return draft.circler === 'child' ? 'child-name' : 'list-name';
  if (draft.circler === 'child' && !draft.ageBand) return 'age';
  if (draft.budgetMinor <= 0) return 'budget';
  return null;
}
