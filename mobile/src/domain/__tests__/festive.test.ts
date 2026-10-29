import { describe, expect, it } from '@jest/globals';

import { formatBackupCode } from '../backup-code';
import { makeFlakes, nextVisitIn, SANTA_FIRST_MS, SANTA_GAP_MS } from '../festive';

describe('Santa', () => {
  it('first visits within 8 to 20 seconds', () => {
    expect(nextVisitIn(true, () => 0)).toBe(SANTA_FIRST_MS.min);
    expect(nextVisitIn(true, () => 0.999999)).toBeLessThanOrEqual(SANTA_FIRST_MS.max);
  });

  it('then comes back every one to two minutes', () => {
    expect(SANTA_GAP_MS).toEqual({ min: 60_000, max: 120_000 });
    expect(nextVisitIn(false, () => 0.5)).toBe(90_000);
  });
});

describe('snow', () => {
  it('falls the same way every time, so it never jumps when a screen redraws', () => {
    expect(makeFlakes(10, 3)).toEqual(makeFlakes(10, 3));
  });

  it('keeps flakes small and on the screen', () => {
    for (const f of makeFlakes(50)) {
      expect(f.x).toBeGreaterThanOrEqual(0);
      expect(f.x).toBeLessThan(1);
      expect(f.size).toBeLessThanOrEqual(7);
    }
  });
});

describe('backup codes', () => {
  it('are shown the same way however they were typed', () => {
    expect(formatBackupCode('k7pm qx4r-9dwn h3tb')).toBe('K7PM-QX4R-9DWN-H3TB');
    expect(formatBackupCode('K7PMQX4R9DWNH3TB')).toBe('K7PM-QX4R-9DWN-H3TB');
  });
});
