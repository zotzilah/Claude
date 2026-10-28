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

/**
 * Reads a budget the way people type it: "150", "£150", "150.50", "1,000".
 * Returns minor units, or null if it isn't a sensible amount.
 */
export function parseMoneyInput(text: string): number | null {
  const cleaned = text.trim().replace(/^[£$€]\s*/, '').replace(/,(?=\d{3}\b)/g, '');
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Turns setup answers into list settings, filling in the title from the template. */
export function finishSettings(draft: ListSettings, year: number): ListSettings {
  const name = draft.circlerName.trim();
  const template = templates.find((t) => t.key === draft.template) ?? templates[0];
  return {
    ...draft,
    circlerName: name,
    ageBand: draft.circler === 'child' ? draft.ageBand : null,
    title: template.title(name, year),
  };
}

/** Why setup can't finish yet, or null when it can. */
export function setupProblem(draft: ListSettings): string | null {
  if (!draft.circlerName.trim()) return draft.circler === 'child' ? "Add the child's name" : 'Add a name for the list';
  if (draft.circler === 'child' && !draft.ageBand) return 'Pick an age';
  if (draft.budgetMinor <= 0) return 'Set a budget above zero';
  return null;
}
