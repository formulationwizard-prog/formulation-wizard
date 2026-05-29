// ============================================================
// Fill-driven serving composition — the "Convention B" math contract.
// ------------------------------------------------------------
// The formula is a RECIPE: each ingredient is a PERCENTAGE of the capsule fill
// (all ingredients sum to 100%). The operator-editable CAPSULE FILL WEIGHT is
// the single dial that turns those percentages into real milligrams:
//
//   mg per capsule  = pct% × capsuleFillMg
//   mg per serving  = mg per capsule × capsulesPerServing
//   active per serving (minerals / standardized extracts)
//                   = mg per serving × assayFraction   (from the COA)
//
// Downstream consumers:
//   • Dosage Check / %UL and Label %DV use the ACTIVE (elemental) mass.
//   • Cost uses the COMPOUND mass (you buy the whole salt/chelate, not just the
//     elemental fraction) — mixing these up is a bug.
//
// Why this model: percentages always fit the capsule by definition, so you can
// never "over-fill," and changing the fill weight rescales every ingredient
// consistently. Operator-validated 2026-05-28 (Mg Glycinate 2.3% in a 660 mg
// cap × 2 = 30.36 mg/serving; 3.56% in a 950 mg cap × 2 = 67.64 mg/serving).
//
// NOTE: this is the pure math engine only. Flipping the live workspace contract
// from weight-driven (Convention A) onto this, plus saved-formula migration,
// is a separate GATED step — do not wire this in without operator green-light.
// ============================================================

export interface ServingCompositionInput {
  /** Ingredient's share of the capsule fill, as a percent (e.g. 2.3 for 2.3%). */
  pct: number;
  /** Operator-set fill weight of a single capsule, in mg. The driving variable. */
  capsuleFillMg: number;
  /** Capsules (or units) per serving. */
  capsulesPerServing: number;
  /**
   * Elemental/active mass fraction from the COA (e.g. 0.14 elemental Mg,
   * 0.05 withanolides). Omit for ingredients whose full mass is the active
   * (most aminos, whole-herb powders) — treated as 1.0.
   */
  assayFraction?: number;
  /** Purchase cost of the COMPOUND, $/kg. */
  costPerKg?: number;
}

export interface ServingCompositionResult {
  /** Compound mass per capsule, mg. */
  mgPerCapsule: number;
  /** Compound mass per serving, mg. */
  mgPerServing: number;
  /** Active/elemental mass per serving, mg — feeds Dosage Check + %DV. */
  activeMgPerServing: number;
  /** Ingredient cost per serving, $ — uses COMPOUND mass, not active. */
  costPerServing: number;
}

const MG_PER_KG = 1_000_000;

/** Derive one ingredient's per-capsule / per-serving amounts from its % of fill. */
export function deriveServingComposition(i: ServingCompositionInput): ServingCompositionResult {
  const mgPerCapsule = (i.pct / 100) * i.capsuleFillMg;
  const mgPerServing = mgPerCapsule * i.capsulesPerServing;
  const activeMgPerServing = mgPerServing * (i.assayFraction ?? 1);
  const costPerServing = (mgPerServing / MG_PER_KG) * (i.costPerKg ?? 0);
  return { mgPerCapsule, mgPerServing, activeMgPerServing, costPerServing };
}
