// ============================================================
// Unit-economics cost math — locks the capsule (per-serving) vs F&B
// (batch-fraction) cost formulas + $/kg↔$/lb conversion with hand-computed
// canonical cases. Operator requirement 2026-05-28: "as long as the math is
// perfect on serving size and conversions."
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  computeUnitEconomics,
  costPerLbToPerKg,
  costPerKgToPerLb,
  type UnitEconomicsInput,
} from '../unitEconomics';

// Capsule supplement "Cap A": rows sum to one serving's doses (cost $0.060),
// 2 capsules/serving, 30 servings/bottle, $0.40 packaging. The physical serving
// (700mg/cap × 2 = 1.4g) deliberately exceeds the dose-sum batch (0.7g) — the
// case that wrongly tripped the warning triangle pre-fix.
const capA: UnitEconomicsInput = {
  costModel: 'per-serving',
  totalCost: 0.06,
  totalWeightKg: 0.0007,
  totalBatchGrams: 0.7,
  servingSizeInGrams: 1.4,
  packageSizeInGrams: 42, // 1.4g × 30
  unitsPerServing: 2,
  servingsPerContainer: 30,
  packagingCostPerUnit: 0.40,
};

describe('computeUnitEconomics — capsule supplement (per-serving model)', () => {
  const r = computeUnitEconomics(capA);
  it('cost per capsule = serving cost / units per serving', () => {
    expect(r.perUnit).toBeCloseTo(0.030, 6);
  });
  it('cost per serving = summed ingredient cost at identity scale (pre-Convention-B default)', () => {
    expect(r.perServing).toBeCloseTo(0.060, 6);
  });
  it('ingredient cost per bottle = per serving × servings per container', () => {
    expect(r.ingredientCostPerPackage).toBeCloseTo(1.80, 6);
  });
  it('cost per bottle includes packaging', () => {
    expect(r.perPackage).toBeCloseTo(2.20, 6);
  });
  it('NEVER flags serving/package > batch for capsules (the pre-fix bug)', () => {
    expect(r.servingExceedsBatch).toBe(false);
    expect(r.packageExceedsBatch).toBe(false);
  });
});

describe('computeUnitEconomics — Convention B per-serving scaling', () => {
  // Entered recipe (batch) material cost $0.10; the serving fills to 1.5× the
  // batch mass (e.g. 2 × 750mg caps = 1500mg vs a 1000mg recipe). The per-serving
  // cost must scale to the actual fill, not stay at the entered-recipe cost —
  // matching the SFP/dosage which scale by the same factor. Without this, cost
  // per serving was understated by the fill factor (the bug operator caught
  // 2026-05-29 on "sleepy time": $0.268 shown vs ~$0.364 true at 1.36× fill).
  const scaled: UnitEconomicsInput = { ...capA, totalCost: 0.10, perServingScale: 1.5 };
  const r = computeUnitEconomics(scaled);
  it('per serving = batch cost × per-serving scale', () => {
    expect(r.perServing).toBeCloseTo(0.15, 6); // 0.10 × 1.5
  });
  it('per capsule = scaled serving cost / units per serving', () => {
    expect(r.perUnit).toBeCloseTo(0.075, 6); // 0.15 / 2
  });
  it('per bottle scales too (scaled per-serving × servings + packaging)', () => {
    expect(r.ingredientCostPerPackage).toBeCloseTo(4.5, 6); // 0.15 × 30
    expect(r.perPackage).toBeCloseTo(4.9, 6); // + $0.40 packaging
  });
  it('falls back to identity (Convention A) when no scale is supplied', () => {
    const id = computeUnitEconomics({ ...scaled, perServingScale: undefined });
    expect(id.perServing).toBeCloseTo(0.10, 6);
  });
});

describe('computeUnitEconomics — per-serving with no discrete unit (powder)', () => {
  it('perUnit is null when unitsPerServing is 0', () => {
    const r = computeUnitEconomics({ ...capA, unitsPerServing: 0 });
    expect(r.perUnit).toBeNull();
    expect(r.perServing).toBeCloseTo(0.060, 6);
  });
});

// F&B "B": 1.000 kg batch costing $4.00, 30g serving, 250g package, $0.50 pkg.
const fbB: UnitEconomicsInput = {
  costModel: 'batch-fraction',
  totalCost: 4.0,
  totalWeightKg: 1.0,
  totalBatchGrams: 1000,
  servingSizeInGrams: 30,
  packageSizeInGrams: 250,
  unitsPerServing: 0,
  servingsPerContainer: 0,
  packagingCostPerUnit: 0.50,
};

describe('computeUnitEconomics — F&B (batch-fraction model)', () => {
  const r = computeUnitEconomics(fbB);
  it('per kg = total cost / batch kg', () => {
    expect(r.perKg).toBeCloseTo(4.0, 6);
  });
  it('per serving = perKg × serving fraction', () => {
    expect(r.perServing).toBeCloseTo(0.120, 6);
  });
  it('ingredient cost per package = totalCost × package/batch fraction', () => {
    expect(r.ingredientCostPerPackage).toBeCloseTo(1.0, 6);
  });
  it('cost per package includes packaging', () => {
    expect(r.perPackage).toBeCloseTo(1.50, 6);
  });
  it('no discrete per-unit cost for F&B', () => {
    expect(r.perUnit).toBeNull();
  });
  it('normal batch does not flag a mismatch', () => {
    expect(r.servingExceedsBatch).toBe(false);
    expect(r.packageExceedsBatch).toBe(false);
  });
});

describe('computeUnitEconomics — F&B batch guard still catches real unit typos', () => {
  it('serving 30g on a 5g batch flags servingExceedsBatch', () => {
    const r = computeUnitEconomics({ ...fbB, totalWeightKg: 0.005, totalBatchGrams: 5 });
    expect(r.servingExceedsBatch).toBe(true);
  });
});

describe('cost unit conversion — $/lb ↔ $/kg', () => {
  it('$1.814/lb stores as ≈ $4.00/kg', () => {
    expect(costPerLbToPerKg(1.814)).toBeCloseTo(4.0, 2);
  });
  it('$4.00/kg displays as ≈ $1.814/lb', () => {
    expect(costPerKgToPerLb(4.0)).toBeCloseTo(1.814, 3);
  });
  it('round-trips losslessly', () => {
    expect(costPerKgToPerLb(costPerLbToPerKg(7.25))).toBeCloseTo(7.25, 9);
  });
});
