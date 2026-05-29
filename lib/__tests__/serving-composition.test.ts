// ============================================================
// Fill-driven serving composition ("Convention B") — locks the math the
// operator validated by hand 2026-05-28. The capsule fill weight is the dial;
// percentages are fixed composition; everything derives from % × fill × caps.
// ============================================================

import { describe, it, expect } from 'vitest';
import { deriveServingComposition } from '../servingComposition';

describe('deriveServingComposition — operator-validated worked cases', () => {
  it('Mg Glycinate 2.3% in a 660 mg cap, 2 caps → 30.36 mg/serving compound', () => {
    const r = deriveServingComposition({ pct: 2.3, capsuleFillMg: 660, capsulesPerServing: 2, assayFraction: 0.14, costPerKg: 14 });
    expect(r.mgPerCapsule).toBeCloseTo(15.18, 2);
    expect(r.mgPerServing).toBeCloseTo(30.36, 2);
  });

  it('3.56% in a 950 mg cap, 2 caps → 67.64 mg/serving compound', () => {
    const r = deriveServingComposition({ pct: 3.56, capsuleFillMg: 950, capsulesPerServing: 2 });
    expect(r.mgPerCapsule).toBeCloseTo(33.82, 2);
    expect(r.mgPerServing).toBeCloseTo(67.64, 2);
  });
});

describe('deriveServingComposition — elemental/active split', () => {
  it('elemental Mg = compound × assay (30.36 × 0.14 = 4.25 mg → 1.2% of 350 UL = safe)', () => {
    const r = deriveServingComposition({ pct: 2.3, capsuleFillMg: 660, capsulesPerServing: 2, assayFraction: 0.14, costPerKg: 14 });
    expect(r.activeMgPerServing).toBeCloseTo(4.2504, 4);
    expect((r.activeMgPerServing / 350) * 100).toBeCloseTo(1.214, 2); // % of UL — safe
  });

  it('67.64 mg Mg Glycinate → 9.47 mg elemental → 2.7% of UL', () => {
    const r = deriveServingComposition({ pct: 3.56, capsuleFillMg: 950, capsulesPerServing: 2, assayFraction: 0.14 });
    expect(r.activeMgPerServing).toBeCloseTo(9.4696, 4);
    expect((r.activeMgPerServing / 350) * 100).toBeCloseTo(2.706, 2);
  });

  it('no assayFraction (amino / whole-herb) → full compound mass is active', () => {
    const r = deriveServingComposition({ pct: 38.5, capsuleFillMg: 660, capsulesPerServing: 2 });
    expect(r.mgPerServing).toBeCloseTo(508.2, 2);
    expect(r.activeMgPerServing).toBeCloseTo(508.2, 2); // assay defaults to 1.0
  });
});

describe('deriveServingComposition — cost uses COMPOUND mass, not elemental', () => {
  it('Mg Glycinate cost is on 30.36 mg compound (≈$0.000425), NOT the 4.25 mg elemental', () => {
    const r = deriveServingComposition({ pct: 2.3, capsuleFillMg: 660, capsulesPerServing: 2, assayFraction: 0.14, costPerKg: 14 });
    expect(r.costPerServing).toBeCloseTo(0.00042504, 8);
    // guard: if it had wrongly used elemental mass the cost would be ~7x smaller
    expect(r.costPerServing).not.toBeCloseTo((4.2504 / 1_000_000) * 14, 8);
  });
});

describe('deriveServingComposition — fill weight is the dial', () => {
  it('same 2.3% rescales with the fill weight (660 → 30.36, 950 → 43.70)', () => {
    const small = deriveServingComposition({ pct: 2.3, capsuleFillMg: 660, capsulesPerServing: 2 });
    const big = deriveServingComposition({ pct: 2.3, capsuleFillMg: 950, capsulesPerServing: 2 });
    expect(small.mgPerServing).toBeCloseTo(30.36, 2);
    expect(big.mgPerServing).toBeCloseTo(43.70, 2);
  });
});
