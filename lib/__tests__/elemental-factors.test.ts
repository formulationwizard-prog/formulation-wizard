// ============================================================
// Elemental-factor single-source-of-truth — locks the form-specific mineral
// fractions shared by the Supplement Facts label (%DV) and the UL safety check.
// Regression guard for the 2026-05-28 bug where the label used 0.14 for Mg
// glycinate while the UL check used a blended 0.25 — a same-compound
// contradiction that also mis-fired the harm-critical UL gate.
// ============================================================

import { describe, it, expect } from 'vitest';
import { resolveElementalFactor } from '../elementalFactors';

describe('resolveElementalFactor — form-specific mineral fractions', () => {
  it('magnesium glycinate → 0.14 (the bug case — NOT the old blended 0.25)', () => {
    expect(resolveElementalFactor('Magnesium Glycinate (Generic Chelate, Commodity Sourcing)')).toBeCloseTo(0.14, 4);
  });
  it('magnesium oxide → 0.60 (longest-match wins over generic magnesium)', () => {
    expect(resolveElementalFactor('Magnesium Oxide USP')).toBeCloseTo(0.60, 4);
  });
  it('magnesium citrate → 0.16', () => {
    expect(resolveElementalFactor('Magnesium Citrate')).toBeCloseTo(0.16, 4);
  });
  it('generic magnesium → 0.16 fallback', () => {
    expect(resolveElementalFactor('Magnesium (unspecified form)')).toBeCloseTo(0.16, 4);
  });
  it('calcium carbonate → 0.40', () => {
    expect(resolveElementalFactor('Calcium Carbonate USP')).toBeCloseTo(0.40, 4);
  });
  it('calcium citrate → 0.21', () => {
    expect(resolveElementalFactor('Calcium Citrate')).toBeCloseTo(0.21, 4);
  });
  it('ferrous sulfate → 0.30', () => {
    expect(resolveElementalFactor('Ferrous Sulfate')).toBeCloseTo(0.30, 4);
  });
  it('iron bisglycinate → 0.20', () => {
    expect(resolveElementalFactor('Iron Bisglycinate (Ferrochel)')).toBeCloseTo(0.20, 4);
  });
  it('zinc gluconate → 0.14', () => {
    expect(resolveElementalFactor('Zinc Gluconate (USP)')).toBeCloseTo(0.14, 4);
  });
  it('zinc picolinate → 0.20', () => {
    expect(resolveElementalFactor('Zinc Picolinate (USP)')).toBeCloseTo(0.20, 4);
  });
  it('non-mineral → undefined (caller falls back to 1.0 = full mass active)', () => {
    expect(resolveElementalFactor('L-Theanine (Suntheanine, Pharma)')).toBeUndefined();
    expect(resolveElementalFactor('Ashwagandha (KSM-66)')).toBeUndefined();
  });
});
