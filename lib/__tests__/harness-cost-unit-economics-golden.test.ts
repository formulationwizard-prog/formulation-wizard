// ============================================================
// HARNESS — cost / unit economics (#9). Spec §5.
// ------------------------------------------------------------
// The critical assertion (F-3, 2026-06-28): the per-serving COST uses the same basis
// as the F-3 SFP — per-capsule cost × unitsPerServing, NO fill-scaling. totalCost is the
// PER-CAPSULE material cost; the caller passes perServingScale = units. RETIRED: the
// Convention-B fill-scale (servingMass/formulaMass) that inflated cost by the same factor
// F-3 retired at the SFP. Plus blank-until-real (no vendor pricing → 0, the render-blank
// signal). See docs/audits/cost-unit-economics-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { computeUnitEconomics } from '../unitEconomics';

const base = {
  costModel: 'per-serving' as const, totalCost: 1.0, totalWeightKg: 0.0007, totalBatchGrams: 0.7,
  servingSizeInGrams: 0, packageSizeInGrams: 0, unitsPerServing: 2, servingsPerContainer: 30,
  packagingCostPerUnit: 0.5,
};

describe('HARNESS · #9 cost — per-serving = per-capsule cost × units (F-3, consistent with the SFP)', () => {
  // totalCost $1.00 = per-capsule material cost; units = 2 → per-serving = $2.00.
  it('scale = units (2) → per-serving = per-capsule cost × 2 ($2.00)', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 2 }).perServing).toBeCloseTo(2.0, 3);
  });
  it('does NOT fill-scale — at units=2 it is $2.00, never the retired fill-scaled $1.886', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 2 }).perServing).not.toBeCloseTo(1.886, 2);
  });
  it('per-unit = per-serving ÷ units = the per-capsule cost ($2.00 / 2 = $1.00)', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 2 }).perUnit).toBeCloseTo(1.0, 3);
  });
  it('per-package = per-serving × servings + packaging ($2.00×30 + $0.50 = $60.50)', () => {
    expect(computeUnitEconomics({ ...base, perServingScale: 2 }).perPackage).toBeCloseTo(60.5, 2);
  });
  it('blank-until-real: no vendor pricing (totalCost 0) → 0 (the render-blank signal, NOT a fabricated $)', () => {
    const r = computeUnitEconomics({ ...base, totalCost: 0, totalWeightKg: 0, perServingScale: 2 });
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
