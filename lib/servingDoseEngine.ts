// ============================================================
// SERVING / DOSE ENGINE — the single source of truth (2026-06-07)
// ------------------------------------------------------------
// Operator-locked, Opus-refined. The sector-INVARIANT truth for turning a
// formula (a recipe of ingredient masses) into per-serving delivered amounts:
//
//     per-serving value = (ingredient ÷ formula mass) × serving mass × factor
//
// SCOPE: serving/dose ONLY. pH, water activity, stability/overage, cure, and
// microbial-safety are SIBLING engines built on this same 5-property pattern;
// they compose with this one, they are not folded into it.
//
// THE FIVE PROPERTIES (each anticipates where the tool is going):
//   1. Sector-invariant equation. A sector is a thin ADAPTER (how formula mass
//      and serving mass are derived) + a display panel — never new math. Nutra
//      now; F&B / baked goods / pet food / unnamed-future inherit by adapter.
//   2. Blank-until-real BY CONSTRUCTION. MaybeValue<T> = unset | real |
//      below_threshold. "No input → no fabricated output" is a type, not a
//      per-field patch. below_threshold renders "below detection/blend limit",
//      never a fabricated 0 — the near-zero-active guard made structural.
//   3. Provenance + confidence per value. Computation provenance (how THIS
//      derived value was produced) is distinct from and composes with ingredient
//      provenance (where the catalog entry came from — PROVENANCE_BY_NAME).
//   4. Gates ride ON the engine. UL/safety/label consume DerivedValue, so they
//      scale with the delivered dose by construction and can't drift. Multi-
//      jurisdiction = limit-table config. The fixed-dose vs recipe-ratio
//      workflows are forward vs REVERSE evaluation of ONE model (see solveFill).
//   5. Single source of truth, verified across the sector × input-state matrix
//      (property tests: mass conservation, % sums, blank propagation, factor
//      application, provenance preservation).
//
// MIGRATION: built alongside existing code. Display surfaces cut over behind
// parity tests (old computePerServingScale output === new engine on Convention-B
// math), surface-by-surface, then the old paths are deleted. No long coexistence.
// ============================================================

// ─── Property 2: blank-until-real as a TYPE ─────────────────────────────────
export type MaybeValue<T> =
  | { readonly state: 'unset' }
  | { readonly state: 'real'; readonly value: T }
  | { readonly state: 'below_threshold'; readonly value: T; readonly threshold: T };

export const UNSET: MaybeValue<never> = { state: 'unset' };
export const real = <T>(value: T): MaybeValue<T> => ({ state: 'real', value });
export const belowThreshold = <T>(value: T, threshold: T): MaybeValue<T> =>
  ({ state: 'below_threshold', value, threshold });

export const isReal = <T>(m: MaybeValue<T>): m is { state: 'real'; value: T } => m.state === 'real';
export const isUnset = <T>(m: MaybeValue<T>): m is { state: 'unset' } => m.state === 'unset';
/** The numeric value when present (real OR below_threshold), else undefined.
 *  below_threshold carries a real number — it is below significance, not absent. */
export const valueOf = <T>(m: MaybeValue<T>): T | undefined =>
  m.state === 'unset' ? undefined : m.value;

/** Lift a binary numeric op so unset propagates (blank-until-real by construction):
 *  if EITHER operand is unset, the result is unset. below_threshold contributes its
 *  underlying value to the computation (it is a small real number, not absent). */
export function combine(
  a: MaybeValue<number>,
  b: MaybeValue<number>,
  op: (x: number, y: number) => number,
): MaybeValue<number> {
  if (a.state === 'unset' || b.state === 'unset') return UNSET;
  return real(op(a.value, b.value));
}

// ─── Property 3: computation provenance (distinct from ingredient provenance) ─
export type Confidence = 'verified' | 'calculated' | 'estimated' | 'unknown';

export interface ComputationProvenance {
  /** Plain-English derivation, e.g. "fill × units × (ingredient ÷ formula) × elemental". */
  readonly derivation: string;
  /** Honest confidence of the DERIVED value (a rollup of verified inputs is 'calculated'). */
  readonly confidence: Confidence;
  /** Which inputs fed it — backs the "traces to operator input" credibility claim. */
  readonly inputs: readonly string[];
}

export interface DerivedValue {
  readonly amount: MaybeValue<number>;
  readonly unit: string;
  readonly provenance: ComputationProvenance;
}

// ─── Engine inputs ──────────────────────────────────────────────────────────
export interface EngineIngredient {
  readonly name: string;
  /** Entered recipe mass in grams (the proportion numerator). Unset until entered. */
  readonly mass: MaybeValue<number>;
  /** Opaque per-ingredient data the factor fn / provenance may read (catalog row, etc.). */
  readonly data?: unknown;
}

/** Sector-specific raw serving inputs (count form: fill + units; mass form: serving g). */
export interface ServingInputs {
  readonly perUnitFillG?: MaybeValue<number>;
  readonly unitsPerServing?: MaybeValue<number>;
  readonly servingSizeG?: MaybeValue<number>;
}

export interface SectorContext {
  readonly sectorId: string;
  readonly audience?: string;
}

// ─── Property 1: factor is a FUNCTION, not a scalar ─────────────────────────
/** elemental conversion × unit conversion × potency × bioavailability, per sector. */
export type FactorFn = (ingredient: EngineIngredient, ctx: SectorContext) => MaybeValue<number>;

/** Identity factor (mass IS the active form) — the default when no conversion applies. */
export const IDENTITY_FACTOR: FactorFn = () => real(1);

// ─── Property 1: the sector adapter contract (names BOTH relationships) ──────
export interface SectorAdapter {
  readonly id: string;
  /** Nutra: sum of entered masses. F&B: batch total. Unset if not yet derivable. */
  formulaMass(formula: readonly EngineIngredient[]): MaybeValue<number>;
  /** Nutra: per-unit fill × units. F&B: stated serving size. Unset until the
   *  operator provides the driving inputs (blank-until-real at the boundary). */
  servingMass(inputs: ServingInputs): MaybeValue<number>;
}

// ─── The sector-INVARIANT core equation ─────────────────────────────────────
/**
 * per-serving amount = (ingredient mass ÷ formula mass) × serving mass × factor.
 * Unset propagates: if any input is unset, the result is unset (never fabricated).
 */
export function perServingAmount(
  ingredient: EngineIngredient,
  formula: readonly EngineIngredient[],
  adapter: SectorAdapter,
  inputs: ServingInputs,
  factor: FactorFn,
  ctx: SectorContext,
  unit = 'mg',
): DerivedValue {
  const formulaMass = adapter.formulaMass(formula);
  const servingMass = adapter.servingMass(inputs);
  const f = factor(ingredient, ctx);

  // proportion = ingredient ÷ formula
  const proportion = combine(ingredient.mass, formulaMass, (i, total) => (total > 0 ? i / total : NaN));
  const proportionalMass = combine(proportion, servingMass, (p, s) => p * s); // grams in the serving
  const activeG = combine(proportionalMass, f, (m, fac) => m * fac);
  // grams → display unit (mg default; the unit-conversion factor belongs in `factor`
  // for non-mg actives, so here we only do the g→mg base conversion).
  const amount = combine(activeG, real(unit === 'g' ? 1 : 1000), (g, k) => g * k);

  const confidence: Confidence = isUnset(amount)
    ? 'unknown'
    : isReal(formulaMass) && isReal(servingMass) ? 'calculated' : 'estimated';

  return {
    amount,
    unit,
    provenance: {
      derivation: 'serving mass × (ingredient ÷ formula) × factor',
      confidence,
      inputs: ['ingredient.mass', 'formula', 'serving inputs', 'factor'],
    },
  };
}

// ─── Property 4: reverse mode — fixed-dose workflow on the SAME model ────────
/**
 * Solve the per-unit fill weight (grams) required to DELIVER a target per-serving
 * active amount of one ingredient. This is the "fixed-dose" operator workflow —
 * forward evaluation run backwards. ONE math model, two workflows; the
 * Convention-A-vs-B fork does not recur at the engine level.
 *
 *   target = (ingredient ÷ formula) × (fill × units) × factor
 *   ⇒ fill = target / [ (ingredient ÷ formula) × units × factor ]
 */
export function solveFillForTargetDose(
  ingredient: EngineIngredient,
  formula: readonly EngineIngredient[],
  adapter: SectorAdapter,
  unitsPerServing: MaybeValue<number>,
  targetActiveG: MaybeValue<number>,
  factor: FactorFn,
  ctx: SectorContext,
): MaybeValue<number> {
  const formulaMass = adapter.formulaMass(formula);
  const proportion = combine(ingredient.mass, formulaMass, (i, total) => (total > 0 ? i / total : NaN));
  const f = factor(ingredient, ctx);
  const denom = combine(combine(proportion, unitsPerServing, (p, u) => p * u), f, (pu, fac) => pu * fac);
  return combine(targetActiveG, denom, (t, d) => (d > 0 ? t / d : NaN));
}

// ─── The Nutraceuticals adapter (the first sector — implemented + verified) ──
/** Nutra: formula = sum of entered ingredient masses; serving = per-unit fill × units.
 *  Both unset-propagating, so an unset fill yields an unset serving mass → unset
 *  per-serving amounts (blank-until-real), never the capsule-capacity default that
 *  caused the 2026-06-07 inflation. */
export const nutraceuticalsAdapter: SectorAdapter = {
  id: 'nutraceuticals',
  formulaMass(formula) {
    let sum = 0;
    let any = false;
    for (const ing of formula) {
      if (ing.mass.state === 'unset') continue;
      sum += ing.mass.value;
      any = true;
    }
    return any ? real(sum) : UNSET;
  },
  servingMass(inputs) {
    // Count form (capsule/tablet/softgel): fill × units. Both must be real.
    return combine(inputs.perUnitFillG ?? UNSET, inputs.unitsPerServing ?? UNSET, (fill, units) => fill * units);
  },
};
