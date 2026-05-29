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
  it('cost per serving = summed ingredient cost (rows are one serving)', () => {
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
