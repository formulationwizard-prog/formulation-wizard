// ============================================================
// SERVING / DOSE ENGINE — the single source of truth (2026-06-07, M1.5)
// ------------------------------------------------------------
// Operator-locked, Opus-refined bedrock. Sector-INVARIANT truth for turning a
// formula (recipe of ingredient masses) into per-serving delivered amounts:
//
//     per-serving = (ingredient ÷ formula mass) × serving mass × factor
//
// SCOPE: serving/dose ONLY. pH, water activity, stability/overage, cure, and
// microbial safety are SIBLING engines on the same 5-property pattern; they
// compose with this one, they are not folded in.
//
// FIVE PROPERTIES: (1) sector-invariant equation, sectors are adapters;
// (2) blank-until-real BY CONSTRUCTION (MaybeValue); (3) computation provenance
// per value; (4) gates ride on the engine + reverse mode (fixed-dose); (5) one
// source of truth, property-verified across the input × sector matrix.
//
// MaybeValue COMPOSITION RULE (the one math — Addition 1, M1.5):
//   • unset ⊕ anything            → unset                       (blank propagates)
//   • (real|below_threshold) ⊕ … → real(op(values)), UNLESS the result is
//                                   non-finite (÷0, ∞) → unset  (never real(NaN))
//   • below_threshold is NOT arithmetically propagated. It is a BOUNDARY
//     CLASSIFICATION (classifyThreshold) against a named threshold, because two
//     sub-threshold values can SUM above threshold — state-propagation would lie
//     on additive ops. below_threshold carries a real number, so it contributes
//     its value to any op; significance is re-decided at the boundary.
//
// MIGRATION: built alongside existing code; surfaces cut over behind parity tests
// (Class A math-correctness === ; Class B fabrication-removal intentionally
// breaks w/ rationale; Class C new-coherence presence+shape), then old deleted.
// ============================================================

/** Bump when engine math/contracts change — stamped into every DerivedValue so
 *  stored values (saved formulas, BPR, audit trail) record which engine produced
 *  them (re-verification, copilot citation accuracy, forensics). Addition 2, M1.5. */
export const ENGINE_VERSION = '1.5.0';

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
export const isBelowThreshold = <T>(m: MaybeValue<T>): m is { state: 'below_threshold'; value: T; threshold: T } =>
  m.state === 'below_threshold';
/** Underlying number when present (real OR below_threshold — both carry a value). */
export const valueOf = <T>(m: MaybeValue<T>): T | undefined =>
  m.state === 'unset' ? undefined : m.value;

/** The one composition math: unset absorbs; non-finite results → unset (no
 *  fabricated NaN/∞ — fixes the M1 div-by-zero leak); below_threshold contributes
 *  its carried value. Result is real or unset; significance is a boundary step. */
export function combine(
  a: MaybeValue<number>,
  b: MaybeValue<number>,
  op: (x: number, y: number) => number,
): MaybeValue<number> {
  if (a.state === 'unset' || b.state === 'unset') return UNSET;
  const v = op(a.value, b.value);
  return Number.isFinite(v) ? real(v) : UNSET;
}

/** Boundary classification → below_threshold when a real value is below a named
 *  significance/detection threshold ("below detection limit", never a fake 0).
 *  The near-zero-active guard, made structural. unset passes through. */
export function classifyThreshold(m: MaybeValue<number>, threshold: number): MaybeValue<number> {
  if (m.state === 'unset') return UNSET;
  return m.value < threshold ? belowThreshold(m.value, threshold) : real(m.value);
}

// ─── Property 1: factor as a composed function (Opus shape, M1.5) ────────────
export type FactorComponentType =
  | 'elemental'                 // mineral salt/chelate → elemental mass fraction
  | 'potency'                   // carrier-loaded active fraction
  | 'unit_conversion'           // g → display unit (mg/mcg/IU)
  | 'nutrient_content_per_gram' // F&B: nutrient mass per gram of ingredient
  | 'bioavailability_reserved'; // reserved — future bioavailability adjustment

export interface FactorComponent {
  readonly type: FactorComponentType;
  readonly value: number;
  readonly source: string; // where this component came from (CFR, COA, catalog, etc.)
}

export interface Factor {
  /** Product of all component values (unset if any component is non-finite). */
  readonly scalar: MaybeValue<number>;
  /** Queryable components — SFP popup + copilot citation read these, not just the scalar. */
  readonly components: readonly FactorComponent[];
}

/** Compose a Factor from components (scalar = product of component values).
 *  Empty components → real(1) (identity: mass IS the active form, no conversion). */
export function composeFactor(components: FactorComponent[]): Factor {
  const product = components.reduce((acc, c) => acc * c.value, 1);
  return { scalar: Number.isFinite(product) ? real(product) : UNSET, components };
}

export type FactorFn = (ingredient: EngineIngredient, ctx: SectorContext) => Factor;

// ─── Property 3: computation provenance — STRUCTURED, not stringly ───────────
export type Confidence = 'verified' | 'calculated' | 'estimated' | 'unknown';

export interface ComputationProvenance {
  readonly engineVersion: string;
  readonly confidence: Confidence;
  /** Queryable operands — the SFP popup and copilot read these as data. */
  readonly operands: {
    readonly formulaMassG: MaybeValue<number>;
    readonly proportion: MaybeValue<number>;
    readonly servingMassG: MaybeValue<number>;
    readonly factor: Factor;
  };
  readonly inputs: readonly string[];
}

export interface DerivedValue {
  readonly amount: MaybeValue<number>;
  readonly unit: string;
  readonly provenance: ComputationProvenance;
}

/** Human-readable derivation rendered FROM the structured operands (display only —
 *  the operands are the source of truth, not this string). */
export function describeDerivation(p: ComputationProvenance): string {
  const n = (m: MaybeValue<number>) => (m.state === 'unset' ? '—' : String(Number(m.value.toPrecision(4))));
  return `proportion ${n(p.operands.proportion)} × serving ${n(p.operands.servingMassG)} g × factor ${n(p.operands.factor.scalar)}`;
}

// ─── Engine inputs ──────────────────────────────────────────────────────────
export interface EngineIngredient {
  readonly name: string;
  /** Entered recipe mass in grams (proportion numerator). Unset until entered. */
  readonly mass: MaybeValue<number>;
  readonly data?: unknown;
}
export interface ServingInputs {
  readonly perUnitFillG?: MaybeValue<number>;
  readonly unitsPerServing?: MaybeValue<number>;
  readonly servingSizeG?: MaybeValue<number>;
}
export interface SectorContext {
  readonly sectorId: string;
  readonly audience?: string;
  /** Significance threshold (display unit) below which an amount is below_threshold. */
  readonly significanceThreshold?: number;
}

// ─── Property 1: sector adapter contract (names BOTH relationships) ──────────
export interface SectorAdapter {
  readonly id: string;
  formulaMass(formula: readonly EngineIngredient[]): MaybeValue<number>;
  servingMass(inputs: ServingInputs): MaybeValue<number>;
}

// ─── The sector-INVARIANT core equation ─────────────────────────────────────
export function perServingAmount(
  ingredient: EngineIngredient,
  formula: readonly EngineIngredient[],
  adapter: SectorAdapter,
  inputs: ServingInputs,
  factorFn: FactorFn,
  ctx: SectorContext,
  unit = 'mg',
): DerivedValue {
  const formulaMassG = adapter.formulaMass(formula);
  const servingMassG = adapter.servingMass(inputs);
  const factor = factorFn(ingredient, ctx);

  const proportion = combine(ingredient.mass, formulaMassG, (i, total) => i / total); // ÷0 → unset
  const proportionalMassG = combine(proportion, servingMassG, (p, s) => p * s);
  // factor carries the g→unit conversion (unit_conversion component), so this is
  // ingredient-grams × factor.scalar = active amount in the display unit.
  let amount = combine(proportionalMassG, factor.scalar, (m, f) => m * f);
  if (ctx.significanceThreshold !== undefined) amount = classifyThreshold(amount, ctx.significanceThreshold);

  const confidence: Confidence = isUnset(amount)
    ? 'unknown'
    : isReal(formulaMassG) && isReal(servingMassG) ? 'calculated' : 'estimated';

  return {
    amount,
    unit,
    provenance: {
      engineVersion: ENGINE_VERSION,
      confidence,
      operands: { formulaMassG, proportion, servingMassG, factor },
      inputs: ['ingredient.mass', 'formula', 'serving inputs', 'factor'],
    },
  };
}

// ─── Property 4: reverse mode — fixed-dose workflow on the SAME model ────────
/** Solve per-unit fill (g) to DELIVER a target per-serving active amount (in the
 *  factor's output unit). Forward run backwards — one model, two workflows.
 *    fill = target / [ (ingredient ÷ formula) × units × factor.scalar ] */
export function solveFillForTargetDose(
  ingredient: EngineIngredient,
  formula: readonly EngineIngredient[],
  adapter: SectorAdapter,
  unitsPerServing: MaybeValue<number>,
  targetActive: MaybeValue<number>,
  factorFn: FactorFn,
  ctx: SectorContext,
): MaybeValue<number> {
  const formulaMassG = adapter.formulaMass(formula);
  const proportion = combine(ingredient.mass, formulaMassG, (i, total) => i / total);
  const factor = factorFn(ingredient, ctx);
  const denom = combine(combine(proportion, unitsPerServing, (p, u) => p * u), factor.scalar, (pu, f) => pu * f);
  return combine(targetActive, denom, (t, d) => t / d); // ÷0 → unset
}

// ─── Nutraceuticals adapter + factor (first sector — implemented + verified) ──
export const nutraceuticalsAdapter: SectorAdapter = {
  id: 'nutraceuticals',
  formulaMass(formula) {
    let sum = 0, any = false;
    for (const ing of formula) {
      if (ing.mass.state === 'unset') continue;
      sum += ing.mass.value; any = true;
    }
    return any ? real(sum) : UNSET;
  },
  servingMass(inputs) {
    return combine(inputs.perUnitFillG ?? UNSET, inputs.unitsPerServing ?? UNSET, (fill, units) => fill * units);
  },
};

/** Build a Nutra factor from elemental + potency fractions (default 1) plus the
 *  g→display-unit conversion. Components are queryable. */
export function nutraFactor(opts: {
  elemental?: number; elementalSource?: string;
  potency?: number; potencySource?: string;
  unit?: 'mg' | 'mcg' | 'g';
}): Factor {
  const components: FactorComponent[] = [];
  if (opts.elemental !== undefined) components.push({ type: 'elemental', value: opts.elemental, source: opts.elementalSource ?? 'elementalFactors.ts' });
  if (opts.potency !== undefined) components.push({ type: 'potency', value: opts.potency, source: opts.potencySource ?? 'catalog potencyFactor' });
  const perGram = opts.unit === 'g' ? 1 : opts.unit === 'mcg' ? 1_000_000 : 1000;
  components.push({ type: 'unit_conversion', value: perGram, source: `g→${opts.unit ?? 'mg'}` });
  return composeFactor(components);
}
