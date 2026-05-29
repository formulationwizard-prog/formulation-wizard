// ============================================================
// SUPPLEMENT PER-SERVING MATH HELPER
// ------------------------------------------------------------
// Round 11 Phase 1 Step 2 (2026-05-15). Extracts the per-serving
// scaling factor that drives Supplement Facts panel rendering, UL
// safety gate input, cost-per-serving derivation, and spec coverage
// computation. Mode-gates the scaling logic so supplement-mode
// formulations (per-serving doses entered directly) do not get
// double-scaled by the F&B-native "serving as fraction of batch"
// math.
//
// THE BUG THIS FIXES (Finding #25, smoke-test 2026-05-15)
// ------------------------------------------------------------
// Pre-Round-11 code at app/workspace/page.tsx:792 (and four
// replicated sites at lines 700, 2749, 4575, 5449) computed
//
//   scale = totalBatchGrams > 0
//     ? servingSizeInGrams / totalBatchGrams
//     : 0
//
// unconditionally. This is the F&B-native math model: in F&B,
// ingredient nutrition values are rolled up to batch totals, and
// per-serving is the (servingSize / batchTotal) fraction.
//
// In supplements mode, ingredient amounts are entered AS per-
// serving doses (e.g., "Vitamin C 500 mg" = 500 mg PER serving,
// not 500 mg in the batch). Applying the F&B scale then multiplies
// each ingredient by an additional ~servingSize/batchTotal factor,
// producing wrong values on the Supplement Facts panel and feeding
// wrong inputs into the UL safety gate, cost cascade, and spec
// coverage cascade.
//
// SMOKE-TEST EXAMPLE (the case that failed in production):
//   Ingredients: Vit C 500 mg + Vit D3 25 mcg + Zinc 15 mg
//   Total batch (rolled-up): ~0.515 g
//   Serving size field: "2 capsules" (read as 2 g by F&B math)
//   F&B scale: 2 / 0.515 ≈ 3.88
//   Vit C displayed: 500 × 3.88 ≈ 1942 mg (WRONG)
//   Correct supplement-mode display: 500 mg
//
// MODE-GATE DISCIPLINE
// ------------------------------------------------------------
// In supplement mode: scale = 1.0 (identity). Display value =
// entered value. Mirrors the audit-memo framing at
// docs/findings/nutraceuticals-workspace-audit-2026-05-15.md.
//
// In F&B mode: scale = servingSizeInGrams / totalBatchGrams (with
// div-by-zero guards). This is the existing correct behavior.
//
// Mode parameter threads through the helper so the gate lives in
// the function, not at the call site. Call sites become simple
// helper invocations; the mode-branching is centralized here.
//
// STATE — Step 3 sub-issue 25a (this commit)
// ------------------------------------------------------------
// Supplement-mode branch landed. computePerServingScale returns
// 1.0 (identity) when mode === 'supplements'; F&B math
// (servingSizeInGrams / totalBatchGrams) when mode is anything
// else. The fix lives entirely in this helper — the 5 call sites
// in app/workspace/page.tsx that compose this helper were swapped
// to the helper at Step 2 with the mode parameter threaded
// through, so 25a here fixes all 5 sites simultaneously without
// touching app/workspace/page.tsx.
//
// The companion vitest suite at
// lib/__tests__/supplementMath.test.ts asserts the target
// behavior. The 15 supplement-mode cases that were intentionally
// red at Step 2 turn green at this commit. F&B-mode regression
// cases continue to pass. Finding #27 (unit-change mass
// preservation) resolves as a clean co-benefit since the helper
// passes ingredientUnit through unchanged and supplement-mode
// scale = 1.0 means displayMass = ingredientAmount regardless of
// unit choice.
//
// DO NOT WEAKEN THE MODE-GATE
// ------------------------------------------------------------
// Removing the supplement-mode branch — or making it conditional
// on something other than `mode === 'supplements'` — restores the
// F&B-scaling-artifact bug that shipped to production on
// 2026-05-15. Per the audit memo at
// docs/findings/nutraceuticals-workspace-audit-2026-05-15.md, the
// bug produced ~3.88x scaling on the smoke-test Immune Support
// Stack (Vit C 500mg displayed as 1942mg). The vitest suite locks
// in the correct behavior — change the helper without updating
// the suite and the suite fails.
// ============================================================
import type { ModeId } from './modes';

interface PerServingScaleParams {
  /** Active vertical / mode. Drives mode-gate branching. */
  mode: ModeId;
  /**
   * Serving size converted to grams (or interpreted as grams for
   * count-based supplement servings like "2 capsules" — the UI
   * conversion layer handles unit semantics; this helper takes a
   * numeric value).
   */
  servingSizeInGrams: number;
  /** Rolled-up batch mass in grams across all ingredients. */
  totalBatchGrams: number;
  /**
   * CONVENTION B (supplements only): the RELIABLE per-serving fill mass in
   * grams, computed UPSTREAM from the operator's capsule fill weight × units
   * per serving (count forms) or the entered scoop/volume (powder/liquid).
   *
   * When provided and > 0, supplement per-serving math scales each ingredient
   * by its % of this mass (the formula is a recipe of percentages; the fill
   * weight is the dial that turns % into real mg). When absent or 0, supplement
   * mode falls back to identity (Convention A) — no serving defined yet, which
   * matches the "spec generated when saved WITH a serving" rule.
   *
   * Deliberately NOT derived from servingSizeInGrams: that field only syncs
   * when the operator has entered count inputs, and reading a raw "2 capsules"
   * field as grams is exactly what produced the Vit C 500mg→1942mg bug. This
   * param is the operator's true driver, so the scale is safe by construction.
   */
  supplementServingMassG?: number;
}

/**
 * Compute the per-serving scaling factor for the active mode.
 *
 * In supplement mode:
 *   CONVENTION B — when supplementServingMassG > 0, returns
 *   supplementServingMassG / totalBatchGrams, so displayMass =
 *   ingredientAmount × scale = (ingredient's % of formula) × serving mass.
 *   When no serving is defined (supplementServingMassG absent/0), returns 1.0
 *   (Convention A identity — the entered amounts stand until a serving is set).
 *
 * In any other mode (F&B and friends):
 *   returns servingSizeInGrams / totalBatchGrams with a zero-guard.
 *   Ingredient nutrition values are rolled up to batch totals; the
 *   per-serving fraction recovers the per-serving contribution.
 */
export function computePerServingScale(params: PerServingScaleParams): number {
  if (params.mode === 'supplements') {
    if (params.supplementServingMassG && params.supplementServingMassG > 0 && params.totalBatchGrams > 0) {
      return params.supplementServingMassG / params.totalBatchGrams;
    }
    return 1.0;
  }
  return params.totalBatchGrams > 0
    ? params.servingSizeInGrams / params.totalBatchGrams
    : 0;
}

interface PerServingMassParams extends PerServingScaleParams {
  /** Ingredient amount in its native unit (mg, mcg, g, IU, etc.). */
  ingredientAmount: number;
  /** Unit string for the ingredient amount; passed through to display unit. */
  ingredientUnit: string;
}

/**
 * Compute the per-serving displayed mass for a single ingredient.
 *
 * Composes computePerServingScale; displayMass = ingredientAmount × scale.
 * In supplement mode (target behavior): displayMass = ingredientAmount
 * (identity scale). In F&B mode: displayMass = ingredientAmount × scale.
 *
 * displayUnit is passed through unchanged; this helper does not perform
 * unit conversion. Finding #27 (unit-change mass preservation) is handled
 * separately in the UI input handler layer.
 */
export function computePerServingMass(params: PerServingMassParams): {
  displayMass: number;
  displayUnit: string;
} {
  const scale = computePerServingScale(params);
  return {
    displayMass: params.ingredientAmount * scale,
    displayUnit: params.ingredientUnit,
  };
}
