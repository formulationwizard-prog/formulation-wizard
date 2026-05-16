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
// STEP 2 EXTRACTION STATE (this commit)
// ------------------------------------------------------------
// At Step 2 commit, this helper preserves the current F&B math
// REGARDLESS of the mode parameter — the parameter is in the
// signature but the supplement-mode branch is not yet added.
// Step 3 sub-issue 25a adds the supplement-mode branch. The
// extraction here is the prerequisite refactor; behavior is
// unchanged until 25a lands.
//
// The companion vitest suite at
// lib/__tests__/supplementMath.test.ts asserts the TARGET
// behavior — supplement-mode tests fail at this commit (the
// intentional TDD red state per the directive's "tests before
// fix code" rule) and turn green when 25a lands.
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
}

/**
 * Compute the per-serving scaling factor for the active mode.
 *
 * In supplement mode (Step 3 sub-issue 25a target behavior):
 *   returns 1.0 — ingredient amounts are already per-serving.
 *
 * In F&B mode:
 *   returns servingSizeInGrams / totalBatchGrams (zero-guarded).
 *
 * Step 2 commit state: the supplement-mode branch is NOT yet
 * present; this function returns the F&B formula regardless of
 * `mode`. The mode parameter is in the signature to lock the
 * call-site contract for the 25a fix.
 */
export function computePerServingScale(params: PerServingScaleParams): number {
  // STEP 2 EXTRACT — current behavior preserved. Step 3 sub-issue
  // 25a will add `if (params.mode === 'supplements') return 1.0;`
  // before the F&B formula below.
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
