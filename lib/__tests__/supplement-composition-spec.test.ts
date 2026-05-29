// ============================================================
// Wizard-generated supplement composition spec — locks the Convention B math
// the spec presents, and that it agrees with the live computePerServingScale
// path (same % × fill × units). Operator worked cases: Mg Glycinate 2.3% in a
// 660 mg cap × 2 → 30.36 mg/serving; 3.56% in a 950 mg cap × 2 → 67.64 mg.
// ============================================================

import { describe, it, expect } from 'vitest';
import { buildSupplementCompositionSpec } from '../supplementCompositionSpec';
import { computePerServingScale } from '../supplementMath';

describe('buildSupplementCompositionSpec — Convention B composition', () => {
  it("produces the operator's Mg Glycinate worked case (2.3% in 660mg cap × 2 = 30.36 mg/serving)", () => {
    // 1.0 g formula; Mg Glycinate is 2.3% (0.023 g).
    const spec = buildSupplementCompositionSpec({
      productId: 'SUP-26-0001',
      productName: 'Calm Stack',
      deliveryForm: 'capsule',
      unitsPerServing: 2,
      perUnitFillMg: 660,
      totalBatchGrams: 1.0,
      ingredients: [{ name: 'Magnesium Glycinate', grams: 0.023 }],
    })!;
    expect(spec).not.toBeNull();
    const mg = spec.rows[0];
    expect(mg.pct).toBeCloseTo(2.3, 6);
    expect(mg.mgPerUnit).toBeCloseTo(15.18, 2);
    expect(mg.mgPerServing).toBeCloseTo(30.36, 2);
    // Magnesium glycinate elemental factor (0.14) flows from resolveElementalFactor —
    // the same source the label %DV + UL gate use, so it cannot diverge.
    expect(mg.elementalFactor).toBeCloseTo(0.14, 6);
    expect(mg.activeMgPerServing).toBeCloseTo(30.36 * 0.14, 2); // ~4.25 mg elemental
    expect(mg.hasElementalDistinction).toBe(true);
    expect(spec.serving.servingMassMg).toBe(1320);
    expect(spec.convention).toBe('B');
    expect(spec.confidence).toBe('estimated');
  });

  it('produces the second worked case (3.56% in 950mg cap × 2 = 67.64 mg/serving)', () => {
    const spec = buildSupplementCompositionSpec({
      productId: 'SUP-26-0002',
      productName: 'Test',
      deliveryForm: 'capsule',
      unitsPerServing: 2,
      perUnitFillMg: 950,
      totalBatchGrams: 1.0,
      ingredients: [{ name: 'Some Active', grams: 0.0356 }],
    })!;
    expect(spec.rows[0].mgPerUnit).toBeCloseTo(33.82, 2);
    expect(spec.rows[0].mgPerServing).toBeCloseTo(67.64, 2);
    // No elemental factor match → whole mass is active (factor 1.0).
    expect(spec.rows[0].elementalFactor).toBe(1);
    expect(spec.rows[0].hasElementalDistinction).toBe(false);
  });

  it('agrees with the live computePerServingScale path (no divergence from the SFP)', () => {
    const pct = 38.5, fillMg = 680, caps = 2, totalBatchG = 1.0;
    const grams = (pct / 100) * totalBatchG; // L-Theanine's share
    const spec = buildSupplementCompositionSpec({
      productId: 'P', productName: 'P', deliveryForm: 'capsule',
      unitsPerServing: caps, perUnitFillMg: fillMg, totalBatchGrams: totalBatchG,
      ingredients: [{ name: 'L-Theanine', grams }],
    })!;
    // Live consumers' formula: ingredientGrams × scale × 1000.
    const scale = computePerServingScale({
      mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams: totalBatchG,
      supplementServingMassG: (fillMg * caps) / 1000,
    });
    const viaScaleMg = grams * scale * 1000;
    expect(spec.rows[0].mgPerServing).toBeCloseTo(viaScaleMg, 6);
    expect(spec.rows[0].mgPerServing).toBeCloseTo(523.6, 1); // 38.5% × 1360
  });

  it('sums per-serving compound mg to the full serving mass (% fill the capsule exactly)', () => {
    const spec = buildSupplementCompositionSpec({
      productId: 'P', productName: 'P', deliveryForm: 'capsule',
      unitsPerServing: 2, perUnitFillMg: 680, totalBatchGrams: 1.0,
      ingredients: [
        { name: 'Magnesium Glycinate', grams: 0.023 },
        { name: 'L-Theanine', grams: 0.385 },
        { name: 'Ashwagandha', grams: 0.592 },
      ],
    })!;
    expect(spec.rows).toHaveLength(3);
    expect(spec.totalMgPerServing).toBeCloseTo(spec.serving.servingMassMg, 4); // 1360 mg
  });

  it('handles powder/liquid scoop (unitsPerServing 1, fill = serving mass)', () => {
    const spec = buildSupplementCompositionSpec({
      productId: 'P', productName: 'P', deliveryForm: 'powder',
      unitsPerServing: 1, perUnitFillMg: 5000 /* 5 g scoop */, totalBatchGrams: 1.0,
      ingredients: [{ name: 'Creatine Monohydrate', grams: 1.0 }],
    })!;
    expect(spec.rows[0].pct).toBeCloseTo(100, 6);
    expect(spec.rows[0].mgPerServing).toBeCloseTo(5000, 2);
    expect(spec.rows[0].mgPerUnit).toBeCloseTo(5000, 2); // mgPerUnit == mgPerServing for a single scoop
  });

  it('returns null when no serving is defined or the formula is empty', () => {
    const base = {
      productId: 'P', productName: 'P', deliveryForm: 'capsule',
      unitsPerServing: 2, perUnitFillMg: 660, totalBatchGrams: 1.0,
      ingredients: [{ name: 'X', grams: 0.5 }],
    };
    expect(buildSupplementCompositionSpec({ ...base, perUnitFillMg: 0 })).toBeNull();
    expect(buildSupplementCompositionSpec({ ...base, unitsPerServing: 0 })).toBeNull();
    expect(buildSupplementCompositionSpec({ ...base, totalBatchGrams: 0 })).toBeNull();
    expect(buildSupplementCompositionSpec({ ...base, ingredients: [] })).toBeNull();
  });
});
