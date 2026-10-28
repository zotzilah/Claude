#!/usr/bin/env node
/**
 * Draws Project Biro's app icon and splash art as SVG and renders every size the
 * stores need into assets/images/. Run with `npm run icons`.
 *
 * The mark: a bold red "B" in the catalogue's display face (Archivo Black), with a
 * wobbly blue biro circle drawn round it, on price-sticker yellow.
 *
 * Rendering uses Playwright's Chromium, which isn't a project dependency (it's only
 * needed when the artwork changes). Install it once with `npx playwright install chromium`.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'images');

const C = { red: '#d8141c', redDeep: '#a80d14', yellow: '#ffd200', biro: '#1d3fc4', white: '#ffffff' };

const fontData = readFileSync(
  join(ROOT, 'node_modules/@expo-google-fonts/archivo-black/400Regular/ArchivoBlack_400Regular.ttf'),
).toString('base64');

// ---------- The biro circle (same approach as src/domain/wobbly-circle.ts) ----------

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A hand-drawn ring centred in a 1024 box. Seed 7 was picked by eye: a nice overshoot top-left. */
function biroRing(rx, ry, seed = 7) {
  const rand = rng(seed);
  const start = -2.3 + (rand() - 0.5) * 0.4;
  const span = Math.PI * 2 + 0.55;
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const a = start + u * span;
    const k = 0.975 + 0.025 * Math.sin(2 * a + p1) + 0.015 * Math.sin(3 * a + p2) + 0.05 * (u - 0.5);
    pts.push(`${i ? 'L' : 'M'}${(512 + Math.cos(a) * rx * k).toFixed(1)} ${(512 + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return pts.join('');
}

const STARBURST = [
  [0.5, 0], [0.61, 0.12], [0.77, 0.06], [0.8, 0.22], [0.96, 0.26], [0.89, 0.41], [1, 0.54],
  [0.87, 0.64], [0.92, 0.81], [0.75, 0.82], [0.66, 0.98], [0.52, 0.88], [0.37, 1], [0.3, 0.84],
  [0.12, 0.88], [0.14, 0.71], [0, 0.61], [0.11, 0.48], [0.03, 0.33], [0.19, 0.27], [0.21, 0.1], [0.37, 0.13],
].map(([x, y]) => `${(112 + x * 800).toFixed(0)},${(112 + y * 800).toFixed(0)}`).join(' ');

/**
 * @param {object} o
 * @param {string|null} o.bg       background fill, or null for transparent
 * @param {number} o.scale         size of the mark within the 1024 box (1 = full)
 * @param {boolean} [o.mono]       single white silhouette (Android themed icons)
 * @param {boolean} [o.sticker]    put the mark on a yellow starburst (splash)
 */
function svg({ bg, scale, mono = false, sticker = false }) {
  const letter = mono ? C.white : C.red;
  const ring = mono ? C.white : C.biro;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs><style>@font-face{font-family:AB;src:url(data:font/ttf;base64,${fontData})}</style></defs>
  ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
    ${sticker ? `<polygon points="${STARBURST}" fill="${C.yellow}" transform="rotate(-8 512 512)"/>` : ''}
    <text x="512" y="520" font-family="AB" font-size="600" fill="${letter}" text-anchor="middle" dominant-baseline="central">B</text>
    <path d="${biroRing(360, 372)}" fill="none" stroke="${ring}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const assets = [
  // iOS and the default icon: full-bleed yellow (the OS rounds the corners).
  { file: 'icon.png', size: 1024, art: svg({ bg: C.yellow, scale: 0.86 }) },
  // Android adaptive icon: the launcher crops to the middle ~66%, so the mark stays small.
  { file: 'android-icon-background.png', size: 1024, art: svg({ bg: C.yellow, scale: 0 }) },
  { file: 'android-icon-foreground.png', size: 1024, art: svg({ bg: null, scale: 0.62 }) },
  { file: 'android-icon-monochrome.png', size: 1024, art: svg({ bg: null, scale: 0.62, mono: true }) },
  // Splash: the price-sticker version, shown on catalogue red.
  { file: 'splash-icon.png', size: 1024, art: svg({ bg: null, scale: 1, sticker: true }) },
  { file: 'favicon.png', size: 48, art: svg({ bg: C.yellow, scale: 0.92 }) },
];

const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, art } of assets) {
  await page.setViewportSize({ width: size, height: size });
  const sized = art.replace('width="1024" height="1024"', `width="${size}" height="${size}"`);
  await page.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('svg').screenshot({ path: join(OUT, file), omitBackground: true });
  console.log(`wrote ${file} (${size}×${size})`);
}
await browser.close();
