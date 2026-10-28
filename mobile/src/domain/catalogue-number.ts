import type { CatalogueNumber } from './types';

const PATTERN = /^(\d{3})\/(\d{4})$/;
/** Three digits, an optional separator (with optional spaces around it), four digits. */
const LOOSE = /^(\d{3})\s*[/.-]?\s*(\d{4})$/;

/** Builds a catalogue number from a category family code and a sequence number. */
export function formatCatalogueNumber(familyCode: number, sequence: number): CatalogueNumber {
  if (!Number.isInteger(familyCode) || familyCode < 100 || familyCode > 999) {
    throw new RangeError(`Family code must be 100–999, got ${familyCode}`);
  }
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 9999) {
    throw new RangeError(`Sequence must be 0–9999, got ${sequence}`);
  }
  return `${familyCode}/${String(sequence).padStart(4, '0')}`;
}

/**
 * Reads a catalogue number the way people actually type or say it:
 * "482/1190", "482 1190", "4821190", "482 / 1190" and "482-1190" all work.
 * Returns null when the input isn't a catalogue number.
 */
export function parseCatalogueNumber(input: string): CatalogueNumber | null {
  const match = LOOSE.exec(input.trim());
  return match ? `${match[1]}/${match[2]}` : null;
}

export function isCatalogueNumber(value: string): value is CatalogueNumber {
  return PATTERN.test(value);
}

export function familyCodeOf(no: CatalogueNumber): number {
  const match = PATTERN.exec(no);
  if (!match) throw new Error(`Not a catalogue number: ${no}`);
  return Number(match[1]);
}
