import type { Buyers, ListSettings, Template } from './types';

export interface TemplateInfo {
  key: Template;
  label: string;
  icon: string;
  /** Builds a default list title from the Circler's name, e.g. "Ellie's Christmas Book 2026". */
  title: (name: string, year: number) => string;
}

export const templates: TemplateInfo[] = [
  { key: 'christmas', label: 'Christmas', icon: '🎄', title: (n, y) => `${possessive(n)} Christmas Book ${y}` },
  { key: 'birthday', label: 'Birthday', icon: '🎂', title: (n, y) => `${possessive(n)} Birthday Book ${y}` },
  { key: 'custom', label: 'Something else', icon: '🎁', title: (n) => `${possessive(n)} Wish Book` },
];

/** "Ellie" → "Ellie's", "James" → "James'". Empty names fall back to "My". */
export function possessive(name: string): string {
  const n = name.trim();
  if (!n) return 'My';
  return /s$/i.test(n) ? `${n}'` : `${n}'s`;
}

export function defaultSettings(): ListSettings {
  return {
    title: 'My Christmas Book',
    template: 'christmas',
    circler: 'child',
    circlerName: '',
    ageBand: null,
    buyers: 'family',
    budgetMinor: 15000,
    currency: 'GBP',
    runningTotalOn: true,
    surpriseMode: 'taken-care-of',
  };
}

/** Group gifts are suggested for items at or above this price (minor units). */
export const GROUP_GIFT_THRESHOLD_MINOR = 10000;

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
