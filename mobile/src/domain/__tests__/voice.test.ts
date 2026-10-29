import { describe, expect, it } from '@jest/globals';

import { bestGuess, cleanSpokenQuery } from '../voice';

describe('cleanSpokenQuery', () => {
  it.each([
    ['DINOSAURS!', 'dinosaurs'],
    ['Can I have a dinosaur please!', 'dinosaur'],
    ['I want a bike for Christmas', 'bike'],
    ['i really really want um lego', 'lego'],
    ['Dear Santa, I would like a unicorn lamp. Thank you!', 'unicorn lamp'],
    ['some slime', 'slime'],
    ['please', ''],
    ['A Frozen dress', 'frozen dress'],
  ])('%p → %p', (spoken, expected) => {
    expect(cleanSpokenQuery(spoken)).toBe(expected);
  });
});

describe('bestGuess', () => {
  const counts: Record<string, number> = { dinosaur: 3, 'dino sore': 0, 'dine o saw': 0 };
  const resultsFor = (q: string) => counts[q] ?? 0;

  it('picks the guess that finds something', () => {
    expect(bestGuess(['dino sore', 'dinosaur'], resultsFor)).toBe('dinosaur');
  });

  it("keeps the recogniser's favourite when nothing is found", () => {
    expect(bestGuess(['dine o saw', 'dino sore'], resultsFor)).toBe('dine o saw');
  });

  it('ignores empty guesses', () => {
    expect(bestGuess(['please', ''], resultsFor)).toBe('');
  });
});
