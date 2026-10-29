/**
 * Each occasion has its own look, fixed by the list's occasion (not a setting).
 *
 * Colours are roles, not hues: `red` is the main colour (headers, big buttons),
 * `blue` the second (running total, catalogue numbers), `yellow` the highlight
 * (price stickers, page tabs), `biro` the circling pen. Each theme fills the roles
 * with its own colours, so screens ask for `colors.red` and get pine green at Christmas.
 */
import type { Template } from '@/domain/types';

import { colors as classicColors, fonts as classicFonts } from './tokens';

export type Palette = { [K in keyof typeof classicColors]: string };
export type Fonts = { [K in keyof typeof classicFonts]: string };

/** What a screen's styles are made from. */
export interface ThemeParts {
  colors: Palette;
  fonts: Fonts;
}

export interface Theme {
  key: 'classic' | 'christmas';
  colors: Palette;
  fonts: Fonts;
  /** Festive extras, all switched off under Reduce Motion. */
  decor: {
    /** Snow falling over the catalogue and Kid Mode. */
    snow: boolean;
    /** Fairy lights along the bottom of the catalogue header. */
    lights: boolean;
    /** Santa and his sleigh crossing the screen every minute or two. */
    santa: boolean;
    /** Kid Mode's background: a flat colour, or a night sky with snow on the ground. */
    kidBackdrop: 'flat' | 'night';
  };
}

export const classic: Theme = {
  key: 'classic',
  colors: classicColors,
  fonts: classicFonts,
  decor: { snow: false, lights: false, santa: false, kidBackdrop: 'flat' },
};

export const christmas: Theme = {
  key: 'christmas',
  colors: {
    ...classicColors,
    red: '#0f4d32',
    redDeep: '#08331f',
    blue: '#b3121b',
    blueDeep: '#7f0d13',
    yellow: '#f2c94c',
    yellowDeep: '#b8901f',
    paper2: '#fbf7ef',
    ink: '#1b1a17',
    inkSoft: '#57524a',
    rule: '#e3dccb',
    biro: '#c81d25',
    slip: '#fffaf0',
  },
  fonts: classicFonts,
  decor: { snow: true, lights: true, santa: true, kidBackdrop: 'night' },
};

export function themeFor(template: Template): Theme {
  return template === 'christmas' ? christmas : classic;
}
