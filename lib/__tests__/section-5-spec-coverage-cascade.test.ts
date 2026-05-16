// ============================================================
// Round 11 Phase 2 Step 1 — Section 5 spec coverage cascade verification
// ------------------------------------------------------------
// Verifies that estimateSpecs() at lib/foodScience.ts computes
// `coverage` correctly as massWithSpec / totalMass. The pre-Round-11
// spec-coverage rendering symptom (audit memo: "Spec coverage reports
// 0%") was a downstream effect of the upstream math-model bug
// propagating wrong inputs into the spec-coverage component. Once
// 25a fixed the upstream, the calculation itself was always sound —
// this test seals the calculation.
//
// Coverage maps to docs/findings/round-11-verification-tests.md
// Section 5 (T5-01, T5-02, T5-03).
//
// CC computational verification — operator UI exercise of the
// spec-coverage display surface in supplement-mode workspace is
// separate (matrix Section 5 pass/fail tracking covers running-app
// UI behavior in supplement mode).
//
// NOTE: The directive frames T5 cases as supplement-mode formulations,
// but the spec-coverage CALCULATION is mode-agnostic. This test uses
// F&B-catalog ingredient names (vinegars, acetic acid) that have
// guaranteed INGREDIENT_SPECS entries so spec-presence is deterministic.
// The supplement-mode-specific UI display of coverage falls under
// operator UI verification.
// ============================================================

import { describe, it, expect } from 'vitest';
import { estimateSpecs, type SpecInputIngredient } from '../foodScience';

/** Build a SpecInputIngredient with a name that won't resolve in
 *  INGREDIENT_SPECS or CATEGORY_SPECS or inferCategoryFromName fallback —
 *  guarantees the empty-spec branch is taken (no specs contributed). */
function unspeccedIngredient(name: string, qty: number, unit: string): SpecInputIngredient {
  return {
    name,
    qty,
    unit,
    category: 'TestCategoryNoMatch__',
  };
}

/** Build a SpecInputIngredient with a name that resolves in INGREDIENT_SPECS. */
function speccedIngredient(name: string, qty: number, unit: string): SpecInputIngredient {
  return {
    name,
    qty,
    unit,
  };
}

describe('Section 5 — Spec coverage cascade (T5-01 through T5-03)', () => {

  it('T5-01: All ingredients spec\'d → 100% coverage reported', () => {
    // Three vinegars + acetic acid all have explicit INGREDIENT_SPECS
    // entries with pH / aceticAcid / brix / moisture / aw set.
    const ingredients: SpecInputIngredient[] = [
      speccedIngredient('Distilled White Vinegar (50 Grain / 5%)', 100, 'g'),
      speccedIngredient('Acetic Acid (Glacial Food Grade)', 50, 'g'),
      speccedIngredient('Apple Cider Vinegar (5%)', 75, 'g'),
    ];
    const result = estimateSpecs(ingredients);
    expect(result.totalWeightG).toBe(225);
    expect(result.coverage).toBeCloseTo(1.0, 6);
  });

  it('T5-02: 2/3 spec\'d → 67% coverage (proportional to spec\'d mass)', () => {
    // Two vinegars + one ingredient with no spec match. Equal-mass case
    // gives 2/3 = ~0.667 coverage.
    const ingredients: SpecInputIngredient[] = [
      speccedIngredient('Distilled White Vinegar (50 Grain / 5%)', 100, 'g'),
      speccedIngredient('Apple Cider Vinegar (5%)', 100, 'g'),
      unspeccedIngredient('UnknownTestIngredientXYZ123', 100, 'g'),
    ];
    const result = estimateSpecs(ingredients);
    expect(result.totalWeightG).toBe(300);
    expect(result.coverage).toBeCloseTo(2 / 3, 6);
  });

  it('T5-03: No specs present → 0% coverage', () => {
    const ingredients: SpecInputIngredient[] = [
      unspeccedIngredient('UnknownXYZAlpha', 100, 'g'),
      unspeccedIngredient('UnknownXYZBeta', 100, 'g'),
      unspeccedIngredient('UnknownXYZGamma', 100, 'g'),
    ];
    const result = estimateSpecs(ingredients);
    expect(result.totalWeightG).toBe(300);
    expect(result.coverage).toBe(0);
  });

  it('T5-04 (supplemental): coverage is mass-weighted, not count-weighted', () => {
    // 80g spec'd + 20g unspec'd → 80% coverage, not 50% (count-weighted).
    const ingredients: SpecInputIngredient[] = [
      speccedIngredient('Distilled White Vinegar (50 Grain / 5%)', 80, 'g'),
      unspeccedIngredient('UnknownTestXYZ', 20, 'g'),
    ];
    const result = estimateSpecs(ingredients);
    expect(result.totalWeightG).toBe(100);
    expect(result.coverage).toBeCloseTo(0.80, 6);
  });

  it('T5-05 (supplemental): zero-mass formulation → coverage = 0 (no div-by-zero)', () => {
    const ingredients: SpecInputIngredient[] = [];
    const result = estimateSpecs(ingredients);
    expect(result.totalWeightG).toBe(0);
    expect(result.coverage).toBe(0);
  });
});
