import { describe, expect, it } from '@jest/globals';

import { defaultSettings, finishSettings, parseMoneyInput, setupProblem } from '../settings';

describe('parseMoneyInput', () => {
  it.each([
    ['150', 15000],
    ['£150', 15000],
    ['£ 150', 15000],
    ['150.5', 15050],
    ['150.50', 15050],
    ['1,000', 100000],
    [' 99.99 ', 9999],
    ['0', 0],
  ])('reads %p as %p', (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected);
  });

  it.each(['', 'lots', '-5', '1.999', '12,34', '£', '1e5'])('rejects %p', (input) => {
    expect(parseMoneyInput(input)).toBeNull();
  });
});

describe('setup', () => {
  const draft = { ...defaultSettings(), circlerName: ' Ellie ', ageBand: '6-8' as const };

  it('names the list from the template and tidies the name', () => {
    const done = finishSettings(draft, 2026);
    expect(done.title).toBe("Ellie's Christmas Book 2026");
    expect(done.circlerName).toBe('Ellie');
  });

  it('drops the age band for adult lists', () => {
    expect(finishSettings({ ...draft, circler: 'adult' }, 2026).ageBand).toBeNull();
  });

  it('explains what is missing', () => {
    expect(setupProblem({ ...draft, circlerName: '' })).toBe("Add the child's name");
    expect(setupProblem({ ...draft, ageBand: null })).toBe('Pick an age');
    expect(setupProblem({ ...draft, budgetMinor: 0 })).toBe('Set a budget above zero');
    expect(setupProblem({ ...draft, circler: 'adult', ageBand: null })).toBeNull();
    expect(setupProblem(draft)).toBeNull();
  });
});
