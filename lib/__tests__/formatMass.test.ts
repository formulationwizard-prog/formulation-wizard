// ============================================================
// formatMassDisplay — adaptive-precision mass display
// ------------------------------------------------------------
// Locks in Bug #10 fix (2026-05-17): trace formulations
// (< 1 mg per cap) display in mcg instead of rounding to "0 mg".
// ============================================================

import { describe, it, expect } from 'vitest';
import { formatMassDisplay } from '../formatMass';

describe('formatMassDisplay — zero / invalid', () => {
  it('0 returns "0 mg"', () => {
    expect(formatMassDisplay(0)).toBe('0 mg');
  });

  it('negative returns "0 mg"', () => {
    expect(formatMassDisplay(-5)).toBe('0 mg');
  });

  it('NaN returns "0 mg"', () => {
    expect(formatMassDisplay(NaN)).toBe('0 mg');
  });

  it('Infinity returns "0 mg"', () => {
    expect(formatMassDisplay(Infinity)).toBe('0 mg');
  });
});

describe('formatMassDisplay — sub-mg switches to mcg', () => {
  it('0.375 mg → "375 mcg" (Test 2a scenario)', () => {
    expect(formatMassDisplay(0.375)).toBe('375 mcg');
  });

  it('0.025 mg → "25 mcg" (Vit D3 25 mcg in single cap)', () => {
    expect(formatMassDisplay(0.025)).toBe('25 mcg');
  });

  it('0.001 mg → "1 mcg" (1 mcg total)', () => {
    expect(formatMassDisplay(0.001)).toBe('1 mcg');
  });

  it('0.999 mg → "999 mcg" (boundary below 1 mg)', () => {
    expect(formatMassDisplay(0.999)).toBe('999 mcg');
  });
});

describe('formatMassDisplay — 1 to 100 mg uses 1 decimal', () => {
  it('1 mg → "1.0 mg"', () => {
    expect(formatMassDisplay(1)).toBe('1.0 mg');
  });

  it('1.7 mg → "1.7 mg" (B6 typical DV dose)', () => {
    expect(formatMassDisplay(1.7)).toBe('1.7 mg');
  });

  it('63.5 mg → "63.5 mg"', () => {
    expect(formatMassDisplay(63.5)).toBe('63.5 mg');
  });

  it('99.94 mg → "99.9 mg" (rounds down)', () => {
    expect(formatMassDisplay(99.94)).toBe('99.9 mg');
  });
});

describe('formatMassDisplay — ≥ 100 mg uses 0 decimals', () => {
  it('100 mg → "100 mg"', () => {
    expect(formatMassDisplay(100)).toBe('100 mg');
  });

  it('224 mg → "224 mg" (Test 1 per-cap scenario)', () => {
    expect(formatMassDisplay(224)).toBe('224 mg');
  });

  it('1220 mg → "1220 mg" (Test 3 per-cap with 1g Fish Oil)', () => {
    expect(formatMassDisplay(1220)).toBe('1220 mg');
  });

  it('1500 mg → "1500 mg" (Test 2c per-cap)', () => {
    expect(formatMassDisplay(1500)).toBe('1500 mg');
  });
});

describe('formatMassDisplay — boundary precision', () => {
  it('0.95 mg → "950 mcg" (close to 1 mg boundary)', () => {
    expect(formatMassDisplay(0.95)).toBe('950 mcg');
  });

  it('99.95 mg → "100.0 mg" (the toFixed(1) would round to "100.0")', () => {
    // 99.95 toFixed(1) = "100.0" — still in the 1-decimal branch
    expect(formatMassDisplay(99.95)).toBe('100.0 mg');
  });
});
