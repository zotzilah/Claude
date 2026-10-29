/**
 * Each occasion has its own look, fixed by the list's occasion (not a setting).
 *
 * Colours are roles, not hues: `red` is the main colour (headers, big buttons),
 * `blue` the second (running total, catalogue numbers), `yellow` the highlight
 * (price stickers, page tabs), `biro` the circling pen. Each theme fills the roles
 * with its own colours, so screens ask for `colors.red` and get pine green at Christmas.
 */
import { isGrownUpOccasion } from '@/domain/settings';
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
  key: 'classic' | 'christmas' | 'elegant';
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
  /** The shape of things, beyond colour. */
  style: {
    /** A bold coloured header, or a light one with a centred serif title. */
    header: 'bold' | 'light';
    /** Chunky buttons with a hard shadow, or slim pills. */
    buttons: 'chunky' | 'pill';
    /** Catalogue tiles with price stickers and biro circles, or calm rows with a heart. */
    products: 'tiles' | 'rows';
  };
}

export const classic: Theme = {
  key: 'classic',
  colors: classicColors,
  fonts: classicFonts,
  decor: { snow: false, lights: false, santa: false, kidBackdrop: 'flat' },
  style: { header: 'bold', buttons: 'chunky', products: 'tiles' },
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
  style: { header: 'bold', buttons: 'chunky', products: 'tiles' },
};

/** Weddings and anniversaries: ivory, charcoal and soft gold; a serif for names, a clean sans for the rest. */
export const elegant: Theme = {
  key: 'elegant',
  colors: {
    ...classicColors,
    red: '#2a2826',
    redDeep: '#141312',
    blue: '#2a2826',
    blueDeep: '#141312',
    yellow: '#efe4cf',
    yellowDeep: '#c9b48c',
    paper: '#ffffff',
    paper2: '#faf7f1',
    ink: '#2a2826',
    inkSoft: '#5e5a54',
    rule: '#e9e2d6',
    biro: '#b08d57',
    good: '#4f6b52',
    slip: '#faf7f1',
  },
  fonts: {
    display: 'CormorantGaramond_600SemiBold',
    body: 'Jost_400Regular',
    bodySemi: 'Jost_500Medium',
    bodyBold: 'Jost_600SemiBold',
    hand: 'CormorantGaramond_500Medium_Italic',
    till: classicFonts.till,
    tillBold: classicFonts.tillBold,
  },
  decor: { snow: false, lights: false, santa: false, kidBackdrop: 'flat' },
  style: { header: 'light', buttons: 'pill', products: 'rows' },
};

export function themeFor(template: Template): Theme {
  if (template === 'christmas') return christmas;
  return isGrownUpOccasion(template) ? elegant : classic;
}
