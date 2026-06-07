// ============================================================
// A/M-ratio (acetic acid / moisture) bench-test — 21 CFR 114 acidified foods
// ------------------------------------------------------------
// Verification (2026-06-07): the A/M-ratio math was confirmed dimensionally
// correct by reading (foodScience.ts:1395, `(aceticAcid / moisture) * 100` =
// acetic acid as a % of the water phase) but had NO dedicated test asserting the
// value against hand-computed canonical cases — "true-by-reading, not true-by-
// test," the exact pattern that let the SFP 4× bug ship. This locks the math.
//
// SCOPE: this verifies the MATH (weighted rollup + dimensional correctness +
// divide-by-zero guards). It does NOT bless the regulatory THRESHOLDS (the
// >=0.5% acidified cutoff, the acid/acidified/lacf classification boundaries) —
// those are regulatory determinations filed to the PA queue, not asserted from
// training data (COA/PA doctrine).
// ============================================================
import { describe, it, expect } from 'vitest';
import { estimateSpecs } from '../foodScience';

type SI = { name: string; qty: number; unit: string; category?: string };
const ing = (name: string, qty: number): SI => ({ name, qty, unit: 'g' });

describe('A/M-ratio math — weighted rollup + dimensional correctness', () => {
  it('single ingredient: 100 g of 5% vinegar → A/M = (5 / 95) × 100 = 5.26%', () => {
    const r = estimateSpecs([ing('Distilled White Vinegar (50 Grain / 5%)', 100)]);
    expect(r.aceticAcid).toBeCloseTo(5.0, 3);   // spec: 5% acetic
    expect(r.moisture).toBeCloseTo(95, 3);      // spec: 95% moisture
    expect(r.aceticMoistureRatio).toBeCloseTo(5.263, 2); // (5/95)*100
  });

  it('mass-weighted blend: 40 g 5%-vinegar + 60 g pumpkin purée → A/M = 2.17%', () => {
    // acetic = (40×5 + 60×0)/100 = 2.0% ; moisture = (40×95 + 60×90)/100 = 92%
    const r = estimateSpecs([
      ing('Distilled White Vinegar (50 Grain / 5%)', 40),
      ing('Pumpkin Puree (Aseptic)', 60),
    ]);
    expect(r.aceticAcid).toBeCloseTo(2.0, 3);
    expect(r.moisture).toBeCloseTo(92, 3);
    expect(r.aceticMoistureRatio).toBeCloseTo(2.174, 2); // (2/92)*100
  });

  it('higher-acid blend scales the ratio proportionally: 50 g 10%-vinegar + 50 g pumpkin', () => {
    // acetic = (50×10 + 50×0)/100 = 5.0% ; moisture = (50×90 + 50×90)/100 = 90%
    const r = estimateSpecs([
      ing('Distilled White Vinegar (100 Grain / 10%)', 50),
      ing('Pumpkin Puree (Aseptic)', 50),
    ]);
    expect(r.aceticAcid).toBeCloseTo(5.0, 3);
    expect(r.moisture).toBeCloseTo(90, 3);
    expect(r.aceticMoistureRatio).toBeCloseTo(5.556, 2); // (5/90)*100
  });

  it('divide-by-zero guard: empty formula → 0, never NaN/Infinity', () => {
    const r = estimateSpecs([]);
    expect(r.aceticMoistureRatio).toBe(0);
    expect(Number.isFinite(r.aceticMoistureRatio)).toBe(true);
  });

  it('no-acetic formula → A/M = 0 (pumpkin purée alone)', () => {
    const r = estimateSpecs([ing('Pumpkin Puree (Aseptic)', 100)]);
    expect(r.aceticAcid).toBeCloseTo(0, 6);
    expect(r.aceticMoistureRatio).toBe(0);
  });
});

describe('A/M-ratio input-data provenance — vinegar specs are FDA-CPG-verified', () => {
  it('5% vinegar acetic acid surfaces as a trustworthy tier, not an AI estimate', () => {
    const r = estimateSpecs([ing('Distilled White Vinegar (50 Grain / 5%)', 100)]);
    // The math can be correct while inputs vary in confidence. The FDA-CPG-cited
    // vinegar must NOT degrade to 'estimated'/'unknown'. NOTE: the rollup labels a
    // single verified-source ingredient as 'calculated' (the honest label for a
    // mass-weighted aggregate) rather than passing 'verified' through — flagged for
    // the confidence-taxonomy review in the broader Nutraceuticals sweep; out of
    // A/M-math scope. Here we assert the defensible invariant: a trustworthy tier.
    expect(['verified', 'calculated']).toContain(r.confidence.aceticAcid);
  });
});
