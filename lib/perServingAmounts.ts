import { toGrams, isCountUnit, UNIT_TO_GRAMS } from './utils';

/** Unit classification for a resolved per-serving amount. */
export type UnitClass = 'mass' | 'count' | 'unsupported';

export interface PerServingAmount {
  /** Per-serving PHYSICAL mass in mg.
   *  - MASS unit: the computed mass.
   *  - COUNT unit (CFU): 0 — a count genuinely adds no mass (safe to sum).
   *  - UNSUPPORTED unit (IU/typo): null — mass is UNKNOWN, never fabricated.
   *    Mass engines must EXCLUDE/flag null (do NOT treat as 0). */
  mg: number | null;
  /** 'mass' = mg computed · 'count' = CFU (0 mass; count value rendered
   *  separately by callers / the count-mass consolidation) · 'unsupported' =
   *  IU/typo/unrecognized (mass NOT computed; caller surfaces recovery). */
  unitClass: UnitClass;
  /** Original entered unit — preserved so callers can render the count value
   *  or a recovery affordance for non-mass classes. */
  unit: string;
}

/**
 * Per-serving amount resolver — the single source of truth for turning an
 * entered ingredient amount into its per-serving contribution.
 *
 * MODEL (operator-confirmed 2026-06-07, ratified 2026-06-25):
 *   The base sheet is the COMPLETE formula composition, built from catalog
 *   ingredients — actives AND excipients — each entered with a real amount.
 *   The sum of entered amounts IS the per-capsule mass (the operator adds
 *   filler from the catalog until the formula fills the capsule). An entered
 *   amount IS its per-capsule amount. The "fill weight" is a TARGET the
 *   formula must sum to, never a scaler.
 *
 * MATH:
 *   per-capsule(ingredient) = entered amount, unit-converted to mg
 *   per-serving(ingredient) = per-capsule(ingredient) × unitsPerServing
 *
 *   NO fill-scaling. NO derived percentages. The operator's entry IS the
 *   per-capsule value, by definition. (This retires the bug where the engine
 *   divided by the actives-total and multiplied by the fill — inflating
 *   90 mg → 141 mg when the formula didn't yet sum to the capsule fill.)
 *
 * FACTOR BOUNDARY (OUT of scope here — applied by callers):
 *   Returns the PHYSICAL ingredient mass per serving. Potency (carrier-loaded
 *   SKUs), elemental factor (salt → element), and DV equivalence
 *   (β-carotene→RAE, folic acid→DFE, …) are CONVERSIONS, not scaling — correct
 *   and unchanged, applied by each caller on top of this physical mass (the
 *   SFP applies potency × elemental × equiv; the safety/stability path applies
 *   potency). Keeping them out makes this the one place the no-scaling
 *   contract lives.
 *
 * AMBIGUITY / UNIT-CLASS HANDLING (this function CLASSIFIES + computes mass for
 * the MASS class only — it never fabricates a mass it cannot compute, and the
 * `|| 1` grams-trap is structurally excluded here):
 *   - MASS (mg/mcg/g/kg/ml…): mg = toGrams(entered) × 1000 × units; 'mass'.
 *   - COUNT (CFU/AFU): mg = 0 (adds no mass), 'count'. Mass-based callers
 *     (UL, stability, cost, specs) sum the 0 safely; render-callers show the
 *     COUNT value (looked up separately). The count-mass consolidation (next)
 *     carries the count value through this return — F-3 establishes the
 *     discriminator + the 0-mass; it does NOT carry the count value.
 *   - UNSUPPORTED (IU, typos, anything not in the mass table): mg = NULL (mass
 *     UNKNOWN — never fabricated as grams), 'unsupported', original unit kept.
 *     Callers surface recovery (F-10 no-silent-drop): IU → "enter in mcg/mg";
 *     typo → "couldn't read the unit". This function does NOT do vitamin-
 *     specific IU→mcg conversion (separate follow-on) — it refuses to guess.
 *   - CARRIER-LOADED (potency < 1): returns the PHYSICAL entered mass (per the
 *     factor boundary). Operator enters "10 mg Vit B12 1%/mannitol" → mg = 10 ×
 *     units; the SFP applies potency 0.01 → renders 0.1 mg / %DV; the safety
 *     engine applies the same potency for UL. Potency is caller-applied.
 *
 * CALLER CONTRACT (what each engine does per unitClass — the seam):
 *   See docs/architecture/unit-class-caller-contract-2026-06-25.md (also the
 *   bench-test matrix). Two load-bearing rules: `null` is EXCLUDED, never
 *   summed as 0 (the silent-drop class); a `count`'s 0 mass IS summed but
 *   never RENDERED as "0 mg of X" — dose-display routes on unitClass 'count'.
 *
 * INVARIANTS (these ARE the bench-test set):
 *   - 90 mg, units = 2  → { mg: 180, unitClass: 'mass' }.
 *   - 0.09 g, units = 1 → { mg: 90,  unitClass: 'mass' }  (unit conversion).
 *   - 16.74 mg (= 18.6% of a 90 mg capsule), units = 1 → { mg: 16.74, 'mass' }
 *     (entry IS per-capsule; % is a derived VIEW elsewhere, never a multiplier).
 *   - "5 Billion CFU"  → { mg: 0,    unitClass: 'count',       unit: 'Billion CFU' }.
 *   - "5000 IU"        → { mg: null, unitClass: 'unsupported', unit: 'IU' }.
 *   - "90 mgg" (typo)  → { mg: null, unitClass: 'unsupported', unit: 'mgg' }.
 *   - carrier-loaded "10 mg" → { mg: 10×units, 'mass' } (caller applies potency).
 *   - sum(per-capsule mass, units=1) SHOULD equal the operator-stated capsule
 *     fill; a mismatch is the CALLER's "formula incomplete" flag — this
 *     function TRUSTS the entered composition and never auto-fills or scales.
 *
 * PRECONDITION: unitsPerServing ≥ 1. Unset (blank-until-real) is the caller's
 *   concern — it renders "—" rather than calling with 0.
 *
 * 21 CFR 101.36(b)(2)(i) GROUNDING:
 *   Declared amount per serving = entered-per-capsule × unitsPerServing, with
 *   no engine-side scaling — so the declared amount equals the ACTUAL amount
 *   in a serving, by construction. No derivation, no inference: the label
 *   declares what the operator physically put in.
 *
 * @param ingredients     formula ingredients (name + entered qty + unit)
 * @param unitsPerServing capsules (or units) per serving; ≥ 1
 * @returns per-ingredient PerServingAmount, keyed by name
 */
export function perServingAmounts(
  ingredients: { name: string; qty: number; unit: string }[],
  unitsPerServing: number,
): Map<string, PerServingAmount> {
  const out = new Map<string, PerServingAmount>();
  for (const ing of ingredients) {
    // COUNT (CFU/AFU): genuinely zero mass; the count value is rendered
    // separately by callers (the count-mass consolidation extends this).
    if (isCountUnit(ing.unit)) {
      out.set(ing.name, { mg: 0, unitClass: 'count', unit: ing.unit });
      continue;
    }
    // UNSUPPORTED (IU, typo, anything not a known mass/volume unit): mass is
    // UNKNOWN — never fabricated via the `|| 1` grams trap. Checked BEFORE
    // toGrams so the trap cannot fire here.
    if (UNIT_TO_GRAMS[ing.unit] === undefined) {
      out.set(ing.name, { mg: null, unitClass: 'unsupported', unit: ing.unit });
      continue;
    }
    // MASS: per-capsule physical mass × units/serving. NO fill-scaling, NO
    // potency/elemental (caller-applied per the factor boundary).
    const perCapsuleMg = toGrams(ing.qty, ing.unit) * 1000;
    out.set(ing.name, { mg: perCapsuleMg * unitsPerServing, unitClass: 'mass', unit: ing.unit });
  }
  return out;
}
