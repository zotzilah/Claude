#!/usr/bin/env node
/**
 * Synthesises Project Biro's sound effects into assets/sounds/*.wav.
 * Our own sounds, so there are no licences to track. Deterministic: the same
 * script always produces the same files. Run with `npm run sounds`.
 *
 * These are good-enough placeholders; recorded foley can replace them later
 * without any code changes, as long as the file names stay the same.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

// ---------- Building blocks ----------

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * RATE));

/** RBJ biquad filter, applied in place. */
function biquad(samples, type, freq, q) {
  const w = (2 * Math.PI * freq) / RATE;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'lowpass') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  else if (type === 'highpass') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  else [b0, b1, b2] = [alpha, 0, -alpha]; // bandpass
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    samples[i] = y;
  }
  return samples;
}

/** Adds a filtered noise burst with a fast attack and exponential decay. */
function noiseBurst(out, rand, { at, dur, type, freq, q, gain }) {
  const burst = buffer(dur);
  for (let i = 0; i < burst.length; i++) burst[i] = rand() * 2 - 1;
  biquad(burst, type, freq, q);
  const start = Math.floor(at * RATE);
  const attack = 0.006 * RATE;
  for (let i = 0; i < burst.length && start + i < out.length; i++) {
    const env = Math.min(1, i / attack) * Math.exp((-5 * i) / burst.length);
    out[start + i] += burst[i] * env * gain;
  }
}

/** Adds a decaying sine tone. */
function tone(out, { at, freq, dur, gain, shape = 'sine' }) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(dur * RATE);
  for (let i = 0; i < n && start + i < out.length; i++) {
    const phase = (2 * Math.PI * freq * i) / RATE;
    const wave = shape === 'triangle' ? (2 / Math.PI) * Math.asin(Math.sin(phase)) : Math.sin(phase);
    out[start + i] += wave * Math.exp((-6 * i) / n) * Math.min(1, i / (0.002 * RATE)) * gain;
  }
}

function normalise(samples, peak = 0.8) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max > 0) for (let i = 0; i < samples.length; i++) samples[i] *= peak / max;
  // Short fade-out so nothing ends on a click.
  const fade = Math.min(samples.length, Math.floor(0.01 * RATE));
  for (let i = 0; i < fade; i++) samples[samples.length - 1 - i] *= i / fade;
  return samples;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// ---------- The sounds ----------

const sounds = {
  /** A biro scratching round a circle: rapid, slightly varying scratches. */
  scribble() {
    const out = buffer(0.5);
    const rand = rng(11);
    for (let i = 0; i < 9; i++) {
      noiseBurst(out, rand, { at: i * 0.048, dur: 0.07, type: 'bandpass', freq: 2400 + rand() * 1800, q: 1.4, gain: 0.5 + rand() * 0.3 });
    }
    return out;
  },
  /** A quick pen tap for adding a star. */
  tick() {
    const out = buffer(0.07);
    noiseBurst(out, rng(3), { at: 0, dur: 0.05, type: 'bandpass', freq: 3800, q: 3, gain: 1 });
    return out;
  },
  /** A soft rubber rub for removing a circle. */
  rub() {
    const out = buffer(0.32);
    const rand = rng(5);
    for (let i = 0; i < 3; i++) noiseBurst(out, rand, { at: i * 0.08, dur: 0.12, type: 'lowpass', freq: 900, q: 0.8, gain: 0.8 });
    return out;
  },
  /** A glossy catalogue page turning. */
  rustle() {
    const out = buffer(0.45);
    const rand = rng(7);
    noiseBurst(out, rand, { at: 0, dur: 0.32, type: 'highpass', freq: 2600, q: 0.6, gain: 0.8 });
    noiseBurst(out, rand, { at: 0.12, dur: 0.24, type: 'bandpass', freq: 5200, q: 0.8, gain: 0.5 });
    noiseBurst(out, rand, { at: 0.26, dur: 0.15, type: 'lowpass', freq: 1400, q: 0.7, gain: 0.35 });
    return out;
  },
  /** An old till: drawer clunk, bell, receipt-printer chatter, paper tear. */
  till() {
    const out = buffer(2.7);
    const rand = rng(13);
    noiseBurst(out, rand, { at: 0, dur: 0.12, type: 'lowpass', freq: 500, q: 1, gain: 1 });
    tone(out, { at: 0, freq: 90, dur: 0.18, gain: 0.8, shape: 'triangle' });
    noiseBurst(out, rand, { at: 0.18, dur: 0.08, type: 'bandpass', freq: 1500, q: 2, gain: 0.6 });
    [2093, 2637, 3136].forEach((freq, i) => tone(out, { at: 0.32, freq, dur: 1.4 - i * 0.3, gain: 0.35 / (i + 1) }));
    for (let i = 0; i < 22; i++) {
      noiseBurst(out, rand, { at: 0.7 + i * 0.075, dur: 0.035, type: 'bandpass', freq: 1800 + (i % 3) * 400, q: 4, gain: 0.45 });
    }
    noiseBurst(out, rand, { at: 2.45, dur: 0.12, type: 'highpass', freq: 3000, q: 1, gain: 0.6 });
    return out;
  },
};

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
  const file = join(OUT, `${name}.wav`);
  writeFileSync(file, wav(normalise(make())));
  console.log(`wrote ${file}`);
}
