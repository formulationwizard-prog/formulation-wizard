// formatWeightPercent — per-ingredient % display precision (2026-06-02).
// Operator directive: the formula % must show at least 0.01% resolution, and
// micrograms-dosed actives must never collapse to "0.00%".

import { describe, it, expect } from 'vitest';
import { formatWeightPercent } from '../utils';

describe('formatWeightPercent', () => {
  it('shows 2 decimals for normal-range values', () => {
    expect(formatWeightPercent(28.571)).toBe('28.57');
    expect(formatWeightPercent(0.5)).toBe('0.50');
    expect(formatWeightPercent(100)).toBe('100.00');
    expect(formatWeightPercent(0.01)).toBe('0.01');
  });

  it('adds precision for sub-0.01% (mcg) values so they never render as 0.00', () => {
    // 25 mcg in a ~1360 mg serving ≈ 0.0018% — must stay visible.
    expect(formatWeightPercent(0.0018)).toBe('0.0018');
    expect(Number(formatWeightPercent(0.0018))).toBeGreaterThan(0);
    expect(Number(formatWeightPercent(0.005))).toBeGreaterThan(0);
    expect(Number(formatWeightPercent(0.000005))).toBeGreaterThan(0);
  });

  it('returns "0" for a true zero or non-finite input', () => {
    expect(formatWeightPercent(0)).toBe('0');
    expect(formatWeightPercent(-1)).toBe('0');
    expect(formatWeightPercent(NaN)).toBe('0');
    expect(formatWeightPercent(Infinity)).toBe('0');
  });
});
