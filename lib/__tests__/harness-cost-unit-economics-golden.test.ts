// ============================================================
// HARNESS — cost / unit economics (#9). Spec §5.
// ------------------------------------------------------------
// The critical assertion: under Convention B the per-serving COST tracks the same
// recipe-ratio scale as the SFP doses — when the panel shows 377 mg at a 660 mg fill,
// the cost reflects that 377 mg, not the 200 mg recipe. Plus blank-until-real (no
// vendor pricing → 0, the render-blank signal). See docs/audits/cost-unit-economics-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { computeUnitEconomics } from '../unitEconomics';

const base = {
  costModel: 'per-serving' as const, totalCost: 1.0, totalWeightKg: 0.0007, totalBatchGrams: 0.7,
  servingSizeInGrams: 0, packageSizeInGrams: 0, unitsPerServing: 2, servingsPerContainer: 30,
  packagingCostPerUnit: 0.5,
};

describe('HARNESS · #9 cost — per-serving tracks the recipe-ratio (consistent with the SFP)', () => {
  it('scale 1.0 (serving = formula, 350 fill) → per-serving = recipe cost ($1.00)', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 1.0 }).perServing).toBeCloseTo(1.0, 3);
  });
  it('scale 1.8857 (660 fill) → per-serving scales with the dose ($1.886, not the recipe $1.00)', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 1320 / 700 }).perServing).toBeCloseTo(1.886, 2);
  });
  it('per-unit = per-serving ÷ units/serving ($1.00 / 2 = $0.50)', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 1.0 }).perUnit).toBeCloseTo(0.5, 3);
  });
  it('per-package = per-serving × servings + packaging ($1.00×30 + $0.50 = $30.50)', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 1.0 }).perPackage).toBeCloseTo(30.5, 2);
  });
  it('blank-until-real: no vendor pricing (totalCost 0) → 0 (the render-blank signal, NOT a fabricated $)', () => {
    const r = computeUnitEconomics({ ...base, totalCost: 0, totalWeightKg: 0, perServingScale: 1.0 });
    expect(r.perServing).toBe(0);
    expect(r.perKg).toBe(0);
  });
});

describe('HARNESS · #9 cost — F&B batch-fraction (sector boundary)', () => {
  it('F&B uses mass-fraction (perKg × serving fraction), not per-serving scale; no per-unit', () => {
    const r = computeUnitEconomics({
      costModel: 'batch-fraction', totalCost: 10, totalWeightKg: 1, totalBatchGrams: 1000,
      servingSizeInGrams: 100, packageSizeInGrams: 500, unitsPerServing: 0, servingsPerContainer: 0,
      packagingCostPerUnit: 0,
    });
    expect(r.perKg).toBeCloseTo(10, 2);                       // $10/kg
    expect(r.perServing).toBeCloseTo(1.0, 2);                 // $10/kg × 0.1 kg serving
    expect(r.perUnit).toBeNull();                             // no discrete unit in F&B
  });
});
