// ============================================================
// Round 11 Phase 2 Step 1 — Section 6 UL gate cascade verification
// ------------------------------------------------------------
// Verifies that the supplement-side UL safety gate at
// lib/supplementSafetyLimits.ts consumes corrected per-serving mass
// values from the centralized helper at lib/supplementMath.ts and
// fires at the right tiers per the directive's matrix Section 6.
//
// The pre-Round-11 bug was that the perServingMgByName map at
// app/workspace/page.tsx:4576-4584 used the F&B-percentage scale,
// producing wrong inputs into checkSupplementSafety. Round 11
// sub-issue 25a fixed the upstream `scale` via the helper, so this
// cascade re-verifies that the gate now fires on corrected values.
//
// Coverage maps to docs/findings/round-11-verification-tests.md
// Section 6 (T6-01 through T6-05).
//
// CC computational verification — operator UI exercise of UL gate
// rendering / popover affordances is separate (matrix Section 6
// pass/fail tracking covers running-app behavior).
// ============================================================

import { describe, it, expect } from 'vitest';
import type { Ingredient } from '../../types';
import { checkSupplementSafety, summarizeFindings, type Audience } from '../supplementSafetyLimits';
import { computePerServingScale } from '../supplementMath';
import { UNIT_TO_GRAMS } from '../utils';

/**
 * Mirror of the page.tsx:4576-4584 perServingMgByName construction.
 * Built via the centralized helper from Round 11 sub-issue 25a so this
 * test exercises the same code path as the workspace UI does at runtime.
 */
function buildPerServingMgByName(
  ingredients: Ingredient[],
  servingSizeInGrams: number,
  totalBatchGrams: number,
): Map<string, number> {
  const scale = computePerServingScale({
    mode: 'supplements',
    servingSizeInGrams,
    totalBatchGrams,
  });
  const map = new Map<string, number>();
  for (const ing of ingredients) {
    const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
    // potencyFactor not relevant for these test inputs (no carrier-loaded
    // SKUs); production page.tsx uses ing.foodData.data.potencyFactor when
    // present — defaults to 1.0.
    const potency = 1;
    map.set(ing.name, g * scale * 1000 * potency);
  }
  return map;
}

/**
 * Minimal Ingredient builder for tests. Production formulations carry
 * richer foodData / supplier metadata; the safety check only consults
 * name + the perServingMgByName map.
 */
function ing(name: string, qty: number, unit: string): Ingredient {
  return {
    name,
    qty,
    unit,
    foodData: null,
    subIngredients: [],
    allergens: [],
    costPerKg: 0,
    supplier: '',
  };
}

const SUPP_BATCH_GRAMS = 0.515;     // smoke-test Immune Support Stack rollup
const SUPP_SERVING_GRAMS = 2;       // "2 capsules" treated as 2g denominator

describe('Section 6 — UL gate cascade (T6-01 through T6-05)', () => {

  it('T6-01: Vitamin C 1900 mg @ 1 cap/serving → caution tier (≥80% of 2000 mg UL)', () => {
    const ingredients = [ing('Vitamin C', 1900, 'mg')];
    const map = buildPerServingMgByName(ingredients, 1, 1.9);
    const findings = checkSupplementSafety(ingredients, map);
    const vitCFinding = findings.find(f => f.limitName === 'Vitamin C');
    expect(vitCFinding).toBeDefined();
    // toBeCloseTo for unit-conversion roundtrips (mg→g→mg can drift at 1e-13)
    expect(vitCFinding!.amountPerServing).toBeCloseTo(1900, 6);
    expect(vitCFinding!.effectiveUL).toBe(2000);
    // 1900/2000 = 95% → caution tier (80% ≤ pct < 100%)
    expect(vitCFinding!.percentOfUL).toBeCloseTo(95, 1);
    expect(vitCFinding!.tier).toBe('caution');
  });

  it('T6-02: Vitamin C 2500 mg @ 1 cap/serving → warning tier (>100% of 2000 mg UL)', () => {
    const ingredients = [ing('Vitamin C', 2500, 'mg')];
    const map = buildPerServingMgByName(ingredients, 1, 2.5);
    const findings = checkSupplementSafety(ingredients, map);
    const vitCFinding = findings.find(f => f.limitName === 'Vitamin C');
    expect(vitCFinding).toBeDefined();
    expect(vitCFinding!.amountPerServing).toBeCloseTo(2500, 6);
    // 2500/2000 = 125% → warning tier (100% < pct ≤ 150%)
    expect(vitCFinding!.percentOfUL).toBeCloseTo(125, 1);
    expect(vitCFinding!.tier).toBe('warning');
    // Hard-stop assertion via summary (banned + critical + warning > 0)
    const summary = summarizeFindings(findings);
    expect(summary.hardStop).toBe(true);
  });

  it('T6-03: Vitamin C 500 mg @ 2 caps/serving → ok tier (well under UL)', () => {
    const ingredients = [ing('Vitamin C', 500, 'mg')];
    const map = buildPerServingMgByName(ingredients, SUPP_SERVING_GRAMS, SUPP_BATCH_GRAMS);
    const findings = checkSupplementSafety(ingredients, map);
    const vitCFinding = findings.find(f => f.limitName === 'Vitamin C');
    expect(vitCFinding).toBeDefined();
    expect(vitCFinding!.amountPerServing).toBeCloseTo(500, 6);
    expect(vitCFinding!.percentOfUL).toBeCloseTo(25, 6);
    expect(vitCFinding!.tier).toBe('ok');
    expect(summarizeFindings(findings).hardStop).toBe(false);
  });

  it('T6-04: Multi-ingredient Immune Support Stack — each ingredient evaluated against own UL', () => {
    const ingredients = [
      ing('Vitamin C', 500, 'mg'),
      ing('Vitamin D3', 25, 'mcg'),
      ing('Zinc', 15, 'mg'),
    ];
    const map = buildPerServingMgByName(ingredients, SUPP_SERVING_GRAMS, SUPP_BATCH_GRAMS);
    const findings = checkSupplementSafety(ingredients, map);

    const vitC = findings.find(f => f.limitName === 'Vitamin C');
    const vitD = findings.find(f => f.limitName === 'Vitamin D');
    const zinc = findings.find(f => f.limitName === 'Zinc');

    expect(vitC).toBeDefined();
    expect(vitC!.amountPerServing).toBeCloseTo(500, 6);
    expect(vitC!.tier).toBe('ok');

    expect(vitD).toBeDefined();
    // Vit D3 25 mcg, no elementalFactor → 25 mcg active. UL = 100 mcg → 25%.
    expect(vitD!.amountPerServing).toBeCloseTo(25, 6);
    expect(vitD!.unit).toBe('mcg');
    expect(vitD!.tier).toBe('ok');

    expect(zinc).toBeDefined();
    // Zinc has elementalFactor 0.20 (picolinate / gluconate average).
    // 15 mg ingredient mass × 0.20 = 3 mg elemental zinc. UL = 40 mg → 7.5%.
    expect(zinc!.amountPerServing).toBeCloseTo(3, 6);
    expect(zinc!.tier).toBe('ok');

    // No ingredient should produce a hard-stop tier in this safe stack.
    expect(summarizeFindings(findings).hardStop).toBe(false);
  });

  it('T6-05: Gate consumes corrected per-serving mass via helper (smoke-test repro regression seal)', () => {
    // The exact 2026-05-15 smoke-test scenario: Immune Support Stack with
    // serving=2, batch=0.515 ratio that produced ~3.88x F&B scaling artifact
    // pre-fix. With the helper (mode='supplements', identity scale), the
    // perServingMgByName map carries the entered values directly.
    const ingredients = [
      ing('Vitamin C', 500, 'mg'),
      ing('Vitamin D3', 25, 'mcg'),
      ing('Zinc', 15, 'mg'),
    ];
    const map = buildPerServingMgByName(ingredients, SUPP_SERVING_GRAMS, SUPP_BATCH_GRAMS);

    // Vit C 500 mg → 0.5g × scale(1.0) × 1000 × potency(1.0) = 500 mg
    expect(map.get('Vitamin C')).toBeCloseTo(500, 6);
    // Vit D3 25 mcg → 0.000025g × scale(1.0) × 1000 × potency(1.0) = 0.025 mg
    expect(map.get('Vitamin D3')).toBeCloseTo(0.025, 6);
    // Zinc 15 mg → 0.015g × scale(1.0) × 1000 × potency(1.0) = 15 mg
    expect(map.get('Zinc')).toBeCloseTo(15, 6);

    // If the helper had still applied the F&B formula here (pre-25a state),
    // map.get('Vitamin C') would be ~1942 mg (= 500 × 2/0.515) and the UL
    // gate would fire incorrectly. This test seals the fix.
  });

  it('T6-05b: Audience modifier still routes correctly (pregnancy tightens caffeine UL by 0.5)', () => {
    // Sanity check that audience-specific UL adjustments still apply
    // after the helper-centric refactor. Caffeine is a clean test case —
    // adult UL = 400 mg, pregnancy factor = 0.5 → effective UL = 200 mg.
    const ingredients = [ing('Caffeine', 250, 'mg')];
    const map = buildPerServingMgByName(ingredients, 1, 0.25);

    const generalFindings = checkSupplementSafety(ingredients, map, 'general' as Audience);
    const pregFindings = checkSupplementSafety(ingredients, map, 'pregnancy' as Audience);

    const generalCaff = generalFindings.find(f => f.limitName === 'Caffeine');
    const pregCaff = pregFindings.find(f => f.limitName === 'Caffeine');

    expect(generalCaff!.effectiveUL).toBe(400);
    expect(generalCaff!.tier).toBe('ok'); // 250/400 = 62.5%
    expect(pregCaff!.effectiveUL).toBe(200);
    expect(pregCaff!.tier).toBe('warning'); // 250/200 = 125% > 100%
  });
});
