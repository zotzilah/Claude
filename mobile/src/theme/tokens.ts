/**
 * Project Biro design tokens: the loud, primary year-2000 catalogue look.
 * Mirrors the palette and type roles in prototype/catalogue-mockup.html.
 */

export const colors = {
  red: '#d8141c',
  redDeep: '#a80d14',
  blue: '#0b3c9c',
  blueDeep: '#072a6e',
  yellow: '#ffd200',
  yellowDeep: '#c9a400',
  paper: '#ffffff',
  paper2: '#f3f5fa',
  ink: '#15161a',
  inkSoft: '#4a4f5c',
  rule: '#d9deea',
  biro: '#1d3fc4',
  good: '#11804a',
  slip: '#fbfaf4',
} as const;

/** Font family names, as registered with useFonts in the root layout. */
export const fonts = {
  /** Headings, prices, catalogue numbers. */
  display: 'ArchivoBlack_400Regular',
  /** Dense product text. */
  body: 'ArchivoNarrow_400Regular',
  bodySemi: 'ArchivoNarrow_600SemiBold',
  bodyBold: 'ArchivoNarrow_700Bold',
  /** Biro scribbles: stars and margin notes. */
  hand: 'GochiHand_400Regular',
  /** Till receipts and order slips. */
  till: 'CourierPrime_400Regular',
  tillBold: 'CourierPrime_700Bold',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 10,
  lg: 16,
  pill: 999,
} as const;
