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
import type { DeliveryFormCategory } from './servingModel';

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

// ============================================================
// CONVENTION GATE — the enforcing code change for the locked
// "Convention A holds for August" architectural ruling.
// ------------------------------------------------------------
// THE BUG THIS RETIRES (SFP-inflation, surfaced 2026-06-05)
// ------------------------------------------------------------
// computePerServingScale already returns identity (1.0) in
// supplements mode WHEN CALLED WITHOUT supplementServingMassG —
// and the unit suite (supplementMath.test.ts T1C-01a/b) asserts
// exactly that. But the workspace ALWAYS derived a non-zero
// supplementServingMassG for count forms, from the capsule's full
// shell capacity:
//
//   size-0 capsule (680 mg) × 2 units/serving = 1.36 g serving mass
//   formula actives sum to 0.337 g
//   scale = 1.36 / 0.337 = 4.035×   ← Convention B fires
//
// Every Supplement Facts amount was multiplied by ~4× on top of the
// (correct) elemental factor — misbranding-grade overstatement
// (e.g. Zinc 3 mg delivered, label read 12 mg / 110% DV; Selenium
// ~22 mcg delivered, label read 89 mcg / 160% DV against a tight UL).
//
// The unit tests never caught it because they exercised the function
// in isolation, with the input the WORKSPACE never actually sends.
// The contract lived in the function; the violation lived at the
// integration boundary upstream of it. This helper IS that boundary,
// made pure and testable — see supplementMath.test.ts Section 1E.
//
// THE RULING (Opus architecture session, 2026-05-26/27)
// ------------------------------------------------------------
// Convention A (identity — each entered ingredient row IS a per-
// serving dose; the panel shows entered amounts × elemental factor)
// holds for the August 2026 launch. Convention B (the formula is a
// percentage recipe; a real fill weight dials % → mg) is DEFERRED to
// the post-launch PDS / density-aware architecture work.
//
// DOCTRINE (banked 2026-06-05): an architectural ruling ships with
// the code change that enforces it, OR an explicit deferral that
// asserts what's in code is acceptable until enforcement lands.
// "Locked in principle, not enforced in code" is the failure mode
// this constant retires. Flip the flag ONLY together with the
// Convention-B fill-weight work — flipping it alone restores the 4×
// inflation above.
// ============================================================

/** Master gate for Convention B per-serving scaling. TRUE since 2026-06-07
 *  (operator-confirmed recipe-ratio + M2-1 engine-wire). Per-serving dose =
 *  ingredient % of formula × fill-driven serving mass. SAFE because per-unit FILL
 *  weight is blank-until-real (6f1e200): unset fill → serving mass 0 → the engine
 *  yields UNSET ("—"), never the capsule-capacity default that caused the AM revert.
 *  The SFP consumes the serving/dose engine (servingDoseEngine.ts), so unset
 *  propagates to "—" by construction. */
export const SUPPLEMENT_CONVENTION_B_ENABLED = true;

export interface SupplementServingMassParams {
  /** Active vertical / mode. Non-supplement modes always return 0. */
  mode: ModeId;
  /** Input model for the chosen delivery form (count / mass / volume). */
  deliveryCategory: DeliveryFormCategory;
  /** Count forms: operator's per-unit fill weight in mg (capsule capacity
   *  for capsule/softgel, die/mold target for tablet/gummy/etc.). */
  perUnitWeightMg?: number;
  /** Count forms: units per serving (e.g. 2 capsules). */
  unitsPerServing?: number;
  /** Mass/volume forms: the entered scoop/volume serving in grams. */
  servingSizeInGrams?: number;
}

/**
 * Derive the Convention-B per-serving fill mass (grams) that the workspace
 * feeds to computePerServingScale as `supplementServingMassG`.
 *
 * While SUPPLEMENT_CONVENTION_B_ENABLED is false (August launch), this returns
 * 0 for every supplement form — so the scale falls back to identity (Convention
 * A) regardless of capsule size / fill weight. This is the single enforcement
 * point for the "Convention A holds for August" ruling: the capsule shell
 * capacity feeds the fit / utilization diagnostic ONLY, never the dose scaler.
 *
 * When Convention B is enabled (post-launch), count forms derive the mass from
 * perUnitWeightMg × unitsPerServing and mass/volume forms use the entered
 * serving size.
 */
export function deriveSupplementServingMassG(p: SupplementServingMassParams): number {
  if (p.mode !== 'supplements') return 0;
  if (!SUPPLEMENT_CONVENTION_B_ENABLED) return 0; // August: Convention A (identity) holds
  if (p.deliveryCategory === 'count') {
    return p.perUnitWeightMg && p.perUnitWeightMg > 0 && p.unitsPerServing && p.unitsPerServing > 0
      ? (p.perUnitWeightMg * p.unitsPerServing) / 1000
      : 0;
  }
  return p.servingSizeInGrams ?? 0;
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
