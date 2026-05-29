// ============================================================
// Convention B per-serving scale — locks the live flip in computePerServingScale
// (supplement mode now scales by % of the fill-driven serving mass) and proves the
// live path agrees with the servingComposition engine. Operator-validated 2026-05-29
// (Mg Glycinate 2.3% in a 660mg cap × 2 → 30.36 mg/serving).
// ============================================================

import { describe, it, expect } from 'vitest';
import { computePerServingScale } from '../supplementMath';
import { deriveServingComposition } from '../servingComposition';

describe('computePerServingScale — Convention B (supplements)', () => {
  it('scales by serving mass / batch when a serving is defined', () => {
    // 1.32 g serving (660mg cap × 2), 1.0 g entered formula → scale 1.32
    expect(computePerServingScale({
      mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams: 1.0, supplementServingMassG: 1.32,
    })).toBeCloseTo(1.32, 6);
  });

  it('falls back to identity (1.0) when no serving is defined', () => {
    expect(computePerServingScale({
      mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams: 1.0,
    })).toBe(1.0);
    expect(computePerServingScale({
      mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams: 1.0, supplementServingMassG: 0,
    })).toBe(1.0);
  });

  it('does NOT use the raw servingSizeInGrams field (the 1942mg-bug input)', () => {
    // Even with a misleading servingSizeInGrams, the supplement scale is driven by
    // supplementServingMassG (the reliable fill-derived value), not servingSizeInGrams.
    const scale = computePerServingScale({
      mode: 'supplements', servingSizeInGrams: 2.0 /* the "2 capsules"→2g misread */, totalBatchGrams: 0.515, supplementServingMassG: 1.32,
    });
    expect(scale).toBeCloseTo(1.32 / 0.515, 6); // uses fill mass, not the 2/0.515 = 3.88 artifact
    expect(scale).not.toBeCloseTo(2.0 / 0.515, 4);
  });

  it('F&B is unaffected (still servingSizeInGrams / totalBatch)', () => {
    expect(computePerServingScale({
      mode: 'fb', servingSizeInGrams: 30, totalBatchGrams: 1000,
    })).toBeCloseTo(0.03, 6);
  });
});

describe('live computePerServingScale path agrees with the servingComposition engine', () => {
  // Operator case: Mg Glycinate at 2.3% of a 1.0g formula, 660mg cap × 2 (1.32g serving).
  const pct = 2.3, capsuleFillMg = 660, caps = 2;
  const totalBatchG = 1.0;                       // entered formula sum (g)
  const ingredientAmountG = (pct / 100) * totalBatchG; // 0.023 g (Mg's share)
  const servingMassG = (capsuleFillMg * caps) / 1000;  // 1.32 g

  it('per-serving mg via scale == deriveServingComposition mgPerServing', () => {
    const scale = computePerServingScale({
      mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams: totalBatchG, supplementServingMassG: servingMassG,
    });
    const viaScaleMg = ingredientAmountG * scale * 1000; // the live consumers' formula
    const viaEngine = deriveServingComposition({ pct, capsuleFillMg, capsulesPerServing: caps });
    expect(viaScaleMg).toBeCloseTo(30.36, 2);
    expect(viaEngine.mgPerServing).toBeCloseTo(30.36, 2);
    expect(viaScaleMg).toBeCloseTo(viaEngine.mgPerServing, 6); // the two implementations agree
  });
});
