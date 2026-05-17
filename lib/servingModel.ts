// ============================================================
// SERVING MODEL — delivery-form-aware Serving & Package Size helpers
// ------------------------------------------------------------
// Round 11 Phase 3 Workstream A.5 [5a/N] (2026-05-17). Pure helpers
// backing the delivery-form-aware Serving & Package Size restructure
// per the #25l structural fix design plan. Foundation layer — no UI
// changes in this commit. Workspace integration lands in 5b–5d.
//
// The structural fix eliminates the input-redundancy class of bugs
// that produced "1 mcg / 60 g / 60,000,000 servings" on the
// 2026-05-17 UI verification audit. Three input categories per
// delivery form:
//
//   COUNT-BASED  (Capsule/Tablet/Softgel/Gummy/Lozenge/Chewable)
//     Operator inputs:  unitsPerServing, servingsPerContainer (or
//                       totalUnits, bidirectional)
//     Per-unit weight:  see perUnitWeightSemantics() — capsule/softgel
//                       are capacity-derived; tablet/gummy/lozenge/
//                       chewable are operator-input target weights
//     Derived display:  servingSize (mass), packageSize (mass)
//
//   MASS-BASED   (Powder)
//     Operator inputs:  servingSize (mass-unit), packageSize (mass-unit)
//     Constraints:      unit dropdowns limited to mass units
//     Derived display:  servingsPerContainer
//
//   VOLUME-BASED (Liquid)
//     Operator inputs:  servingSize (volume-unit), packageSize (volume-unit)
//     Constraints:      unit dropdowns limited to volume units
//     Derived display:  servingsPerContainer
//
// PERSPECTIVE: this module is the engine; the workspace UI consumes
// it. All functions are pure and deterministic. Tests at
// lib/__tests__/serving-model.test.ts.
//
// FORWARD-COMPAT: Round 12 persistence catches the state additions
// (lastEditedCountField / totalUnitsOverride / perUnitWeightMg) via
// the existing localStorage-persist pattern — no schema migration
// surface beyond defensive hydration.
// ============================================================

/**
 * Delivery form discriminator. Matches the local type in
 * app/workspace/page.tsx (which will import from this module
 * post-5b). Kept as a literal union so categorization helpers
 * branch exhaustively at compile time.
 */
export type SupplementDeliveryForm =
  | 'capsule'
  | 'tablet'
  | 'softgel'
  | 'gummy'
  | 'powder'
  | 'liquid'
  | 'lozenge'
  | 'chewable';

/** Standard pharmaceutical capsule sizes (USP / industry convention). */
export type CapsuleSize = '000' | '00' | '0' | '1' | '2' | '3' | '4' | '5';

/**
 * Input category per the design plan §2 matrix.
 *
 *   'count'  — operator thinks in unit count (capsules, tablets, etc.)
 *   'mass'   — operator thinks in mass (powders)
 *   'volume' — operator thinks in volume (liquids)
 *
 * Drives input-field visibility, dropdown unit constraints, and which
 * fields are derived vs operator-supplied.
 */
export type DeliveryFormCategory = 'count' | 'mass' | 'volume';

/**
 * Per-unit weight semantics within the count category (SP3 refinement).
 *
 *   'capacity-derived' — capsule shell capacity bounds the per-unit
 *                        weight; fill weight derives from formulation
 *                        mass / total units. Applies to capsule + softgel.
 *
 *   'operator-input'   — operator-specified target per-unit weight
 *                        (die-set, mold capacity, dosing/consumer
 *                        experience constraints). Applies to tablet,
 *                        gummy, lozenge, chewable.
 *
 *   'n/a'              — non-count delivery form (powder, liquid). No
 *                        per-unit weight concept.
 */
export type PerUnitWeightSemantic = 'capacity-derived' | 'operator-input' | 'n/a';

/**
 * Categorize a delivery form into one of three input models.
 * Pure; exhaustive over SupplementDeliveryForm.
 */
export function categorizeDeliveryForm(form: SupplementDeliveryForm): DeliveryFormCategory {
  switch (form) {
    case 'capsule':
    case 'tablet':
    case 'softgel':
    case 'gummy':
    case 'lozenge':
    case 'chewable':
      return 'count';
    case 'powder':
      return 'mass';
    case 'liquid':
      return 'volume';
  }
}

/**
 * Per-unit weight semantic for a delivery form (SP3 refinement). Within
 * the count category, capsule/softgel are capacity-derived; tablet/
 * gummy/lozenge/chewable are operator-input target weights. Non-count
 * forms return 'n/a'.
 */
export function perUnitWeightSemantics(form: SupplementDeliveryForm): PerUnitWeightSemantic {
  switch (form) {
    case 'capsule':
    case 'softgel':
      return 'capacity-derived';
    case 'tablet':
    case 'gummy':
    case 'lozenge':
    case 'chewable':
      return 'operator-input';
    case 'powder':
    case 'liquid':
      return 'n/a';
  }
}

/**
 * Standard pharmaceutical capsule capacities (mg, dense-powder fill).
 * USP / industry convention; volumetric capacities. Actual fill
 * weight depends on ingredient density; Round 12+ may add density-
 * aware adjustments if customer-zero data surfaces the need.
 *
 * Source: standard capsule manufacturer specifications (Capsugel /
 * ACG / Lonza published reference data).
 */
const CAPSULE_CAPACITY_MG: Record<CapsuleSize, number> = {
  '000': 1000,
  '00': 800,
  '0': 680,
  '1': 480,
  '2': 360,
  '3': 270,
  '4': 210,
  '5': 130,
};

/** Capsule capacity in milligrams for a given USP/industry size. */
export function capsuleCapacityMg(size: CapsuleSize): number {
  return CAPSULE_CAPACITY_MG[size];
}

// ─── Derivation helpers (count category) ───────────────────────

/**
 * Fill weight per unit, in milligrams.
 *
 *   fillWeightMg = (totalMassG × 1000) / totalUnits
 *
 * Returns 0 when totalUnits is 0 (avoids divide-by-zero; caller
 * surfaces empty-state UI). Returns 0 when totalMassG is 0
 * (empty formulation; valid state during early formulation work).
 */
export function computeFillWeightPerUnit(totalMassG: number, totalUnits: number): number {
  if (!Number.isFinite(totalMassG) || !Number.isFinite(totalUnits)) return 0;
  if (totalMassG <= 0 || totalUnits <= 0) return 0;
  return (totalMassG * 1000) / totalUnits;
}

/**
 * Utilization ratio: how much of the capsule capacity is filled.
 *
 *   utilization = fillWeightMg / capacityMg
 *
 * 0.0 = empty; 1.0 = at capacity; >1.0 = over-fill (physically
 * impossible as specified). Returns 0 when capacityMg is 0 or
 * negative (defensive; caller should not pass invalid capacity).
 */
export function computeUtilization(fillWeightMg: number, capacityMg: number): number {
  if (!Number.isFinite(fillWeightMg) || !Number.isFinite(capacityMg)) return 0;
  if (capacityMg <= 0) return 0;
  if (fillWeightMg <= 0) return 0;
  return fillWeightMg / capacityMg;
}

/**
 * Utilization color band per the SP9 thresholds.
 *
 *   'grey'        — 0% utilization (empty formulation; not yet evaluable)
 *   'amber-low'   — <50%: "Consider smaller capsule size for cost optimization"
 *   'green'       — 50-90%: normal range
 *   'amber-high'  — 90-100%: "Approaching over-fill — may not pack reliably"
 *   'red'         — >100%: "Impossible as specified — reduce ingredient mass
 *                  or increase capsule size"
 *
 * Strict inequality at boundaries (50.0% = green; 90.0% = green;
 * 100.0% = amber-high). 100.001% = red.
 */
export type UtilizationBand = 'grey' | 'amber-low' | 'green' | 'amber-high' | 'red';

export function utilizationBand(utilization: number): UtilizationBand {
  if (!Number.isFinite(utilization) || utilization <= 0) return 'grey';
  if (utilization < 0.5) return 'amber-low';
  if (utilization <= 0.9) return 'green';
  if (utilization <= 1.0) return 'amber-high';
  return 'red';
}

/**
 * Derive servingsPerContainer from totalUnits and unitsPerServing.
 *
 *   servings = totalUnits / unitsPerServing
 *
 * Returns 0 when unitsPerServing is 0 (defensive).
 */
export function deriveServings(totalUnits: number, unitsPerServing: number): number {
  if (!Number.isFinite(totalUnits) || !Number.isFinite(unitsPerServing)) return 0;
  if (unitsPerServing <= 0) return 0;
  return totalUnits / unitsPerServing;
}

/**
 * Derive totalUnits from servingsPerContainer and unitsPerServing.
 *
 *   totalUnits = servings × unitsPerServing
 */
export function deriveTotalUnits(servings: number, unitsPerServing: number): number {
  if (!Number.isFinite(servings) || !Number.isFinite(unitsPerServing)) return 0;
  if (servings <= 0 || unitsPerServing <= 0) return 0;
  return servings * unitsPerServing;
}

// ─── Unit dropdown constraints per delivery form ───────────────

/**
 * Allowed serving size units per delivery form.
 *
 *   Count-based      — no unit dropdown (mass is derived display)
 *   Powder (mass)    — ['mg', 'g']
 *   Liquid (volume)  — ['mL', 'fl oz', 'tsp', 'tbsp']
 *
 * Count-based forms return an empty array; caller should hide the
 * dropdown rather than render an empty list.
 */
export function allowedServingUnits(form: SupplementDeliveryForm): readonly string[] {
  const category = categorizeDeliveryForm(form);
  if (category === 'count') return [];
  if (category === 'mass') return ['mg', 'g'];
  // volume
  return ['mL', 'fl oz', 'tsp', 'tbsp'];
}

/**
 * Allowed package size units per delivery form.
 *
 *   Count-based      — no unit dropdown (mass is derived display)
 *   Powder (mass)    — ['g', 'kg', 'oz', 'lb']
 *   Liquid (volume)  — ['mL', 'L', 'fl oz']
 */
export function allowedPackageUnits(form: SupplementDeliveryForm): readonly string[] {
  const category = categorizeDeliveryForm(form);
  if (category === 'count') return [];
  if (category === 'mass') return ['g', 'kg', 'oz', 'lb'];
  // volume
  return ['mL', 'L', 'fl oz'];
}

// ─── Producibility assessment (SP11 — 7th status card) ─────────

/**
 * Producibility state — the 7th workspace status card (SP11 closure).
 * Distinct from Safety semantics ("safe to consume") because over-fill
 * is a manufacturing concern, not a consumer-safety concern.
 *
 *   'unknown'       — formulation empty or pre-evaluation state
 *   'producible'    — fits within capsule capacity; normal range
 *   'low-fill'      — fits but utilization < 50% (cost-optimization
 *                     hint; producibility itself is fine)
 *   'over-fill'     — utilization > 100%; physically impossible as
 *                     specified
 *   'approaching'   — 90-100% utilization; producible but at-edge
 *
 * For non-count delivery forms, producibility is always 'producible'
 * (mass/volume forms have no capacity constraint at this layer).
 */
export type ProducibilityState =
  | 'unknown'
  | 'producible'
  | 'low-fill'
  | 'over-fill'
  | 'approaching';

export interface ProducibilityAssessment {
  state: ProducibilityState;
  /** Plain-English reason; rendered in the status card body. */
  reason: string;
}

export interface ProducibilityInput {
  form: SupplementDeliveryForm;
  totalMassG: number;
  totalUnits: number;
  /** Capsule capacity in mg; only used for capsule/softgel. Caller
   *  passes 0 or any value for non-capacity-derived forms; helper
   *  ignores it for non-capacity-derived forms. */
  capacityMg: number;
}

/**
 * Assess producibility from the count-based input model. Pure
 * function. Returns 'unknown' when input doesn't yet support
 * evaluation (no ingredients, no unit count).
 *
 * Round 11 v1 scope: capacity utilization only. Round 12+ may add
 * density-aware adjustments, mold-fill semantics for gummies,
 * tablet-press tonnage constraints, etc.
 */
export function assessProducibility(input: ProducibilityInput): ProducibilityAssessment {
  const category = categorizeDeliveryForm(input.form);

  // Non-count forms: no capacity constraint at this layer
  if (category !== 'count') {
    return {
      state: 'producible',
      reason: `Mass-based or volume-based delivery form (${input.form}) — no capsule/tablet capacity constraint applies.`,
    };
  }

  // Empty state
  if (!Number.isFinite(input.totalMassG) || input.totalMassG <= 0 ||
      !Number.isFinite(input.totalUnits) || input.totalUnits <= 0) {
    return {
      state: 'unknown',
      reason: 'Add ingredients and confirm unit count to evaluate producibility.',
    };
  }

  // Capacity-derived forms (capsule/softgel): check capsule capacity
  const semantics = perUnitWeightSemantics(input.form);
  if (semantics === 'capacity-derived') {
    if (!Number.isFinite(input.capacityMg) || input.capacityMg <= 0) {
      return {
        state: 'unknown',
        reason: 'Capsule capacity not yet specified.',
      };
    }
    const fillWeightMg = computeFillWeightPerUnit(input.totalMassG, input.totalUnits);
    const utilization = computeUtilization(fillWeightMg, input.capacityMg);
    const band = utilizationBand(utilization);
    switch (band) {
      case 'red':
        return {
          state: 'over-fill',
          reason: `Fill weight ${fillWeightMg.toFixed(0)} mg exceeds capsule capacity ${input.capacityMg} mg (${(utilization * 100).toFixed(0)}% utilization). Reduce ingredient mass or select a larger capsule size.`,
        };
      case 'amber-high':
        return {
          state: 'approaching',
          reason: `Fill weight ${fillWeightMg.toFixed(0)} mg is ${(utilization * 100).toFixed(0)}% of capsule capacity — approaching over-fill. May not pack reliably.`,
        };
      case 'amber-low':
        return {
          state: 'low-fill',
          reason: `Fill weight ${fillWeightMg.toFixed(0)} mg is only ${(utilization * 100).toFixed(0)}% of capsule capacity. Consider a smaller capsule for cost optimization.`,
        };
      case 'green':
        return {
          state: 'producible',
          reason: `Fill weight ${fillWeightMg.toFixed(0)} mg at ${(utilization * 100).toFixed(0)}% of capsule capacity — normal range.`,
        };
      case 'grey':
        return {
          state: 'unknown',
          reason: 'Capsule fill not yet computable.',
        };
    }
  }

  // Operator-input weight forms (tablet/gummy/lozenge/chewable):
  // no capsule capacity constraint; producibility checked against
  // operator-supplied target per-unit weight when available. Round 11
  // v1 trusts operator-supplied target; Round 12+ may add tablet-press
  // tonnage / mold-fill validations.
  return {
    state: 'producible',
    reason: `${input.form.charAt(0).toUpperCase() + input.form.slice(1)} with operator-specified per-unit target weight — producibility assumed within manufacturing tolerance.`,
  };
}

// ─── Bidirectional Servings/Total Units state model (SP6) ──────

/**
 * Discriminator for which of (servingsPerContainer, totalUnits) was
 * edited last by the operator. Drives last-edited-wins recomputation
 * when unitsPerServing changes.
 */
export type LastEditedCountField = 'servings' | 'totalUnits' | null;

/**
 * Reconcile servingsPerContainer / totalUnits / unitsPerServing under
 * the last-edited-wins rule. Pure function.
 *
 * Behavior:
 *   - When `lastEdited === 'servings'`: servingsPerContainer is
 *     canonical; totalUnits is derived as servings × unitsPerServing
 *   - When `lastEdited === 'totalUnits'`: totalUnits is canonical;
 *     servingsPerContainer is derived as totalUnits / unitsPerServing
 *   - When `lastEdited === null` (initial state): caller chooses the
 *     default — typically servingsPerContainer canonical (operator
 *     mental model defaults to "30-day supply" framing for new
 *     formulations)
 *
 * Caller persists `lastEditedCountField` in workspace state alongside
 * the explicit servings/totalUnits values.
 */
export interface CountInputState {
  servings: number;
  totalUnits: number;
  unitsPerServing: number;
  lastEdited: LastEditedCountField;
}

export function reconcileCountInputs(state: CountInputState): { servings: number; totalUnits: number } {
  const { servings, totalUnits, unitsPerServing, lastEdited } = state;
  if (lastEdited === 'totalUnits') {
    return {
      servings: deriveServings(totalUnits, unitsPerServing),
      totalUnits,
    };
  }
  // Default: servings canonical (covers both 'servings' and null cases)
  return {
    servings,
    totalUnits: deriveTotalUnits(servings, unitsPerServing),
  };
}
