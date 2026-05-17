// ============================================================
// §B5 — NET QUANTITY DECLARATION (21 CFR 101.105)
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 (2026-05-17). Dual-unit (US customary +
// metric) net quantity declaration generator + per-§B-item gate
// evaluator. Mirrors the §B1/§B2 boundary pattern: caller passes
// pre-computed inputs (totalMassG / totalVolumeMl from the workspace
// cascade, plus operator-declared net quantity); gate composes
// the refusal verdict.
//
// SCOPE — what this module IS
// ------------------------------------------------------------
//   • computeNetQuantityDeclaration(input) → NetQuantityDeclaration
//     Canonical dual-unit declaration: US primary + metric secondary
//     with CFR-shaped rounding per 21 CFR 101.105.
//   • evaluateNetQuantityGate(input) → NetQuantityGateResult
//     Per-item gate refusing on:
//       (a) form/dimension mismatch
//       (b) missing operator-declared net quantity (CFR 101.105(a))
//       (c) US-customary primary without metric secondary (dual-unit)
//       (d) declared net quantity outside ±2% of computed (CFR 101.105(q))
//   • Constants: B5_NET_QUANTITY_ITEM_ID, B5_NET_QUANTITY_CITATION,
//     conversion factors.
//
// SCOPE — what this module is NOT (yet)
// ------------------------------------------------------------
//   • Pint and gallon support — deferred Round 12+ (supplement
//     scope rarely declares net quantity in those ranges; bulk-
//     product territory). Logged at docs/architecture/harm-critical-
//     floor.md §B5.
//   • Asymmetric under-fill vs over-fill tolerance — Round 11 uses
//     symmetric ±2%. Round 12+ refinement: under-fill is more
//     consumer-protection-sensitive than over-fill (CFR 101.105(q)
//     treats short-fill more seriously); asymmetric tolerances can
//     be introduced when customer-zero data accumulates.
//   • Tolerance calibration against FDA enforcement-discretion data
//     — Round 12+ refinement.
//   • Operator-selectable rounding precision — Round 11 uses
//     conventional precision (integer mg/g/mL; 2-decimal oz/lb/
//     fl oz/kg/L). Round 12+: operator chooses precision per label
//     design.
//   • Internal primary-vs-metric-secondary consistency check
//     ("1 oz (50 g)" mismatch). Round 11 only cross-validates
//     against computed mass/volume; internal consistency deferred.
//   • Packaging-spec schema field for explicit declared net quantity
//     that overrides computed mass — Round 12+ (lands with PDS
//     pipeline integration).
//
// Float precision discipline:
//   • Tolerance check uses TOLERANCE + EPSILON (1e-9 absorbs IEEE
//     754 drift so exact-percent boundaries fire by intent, not
//     by float artifact).
//   • Strict > comparison: drift > TOLERANCE + EPSILON.
//
// ============================================================
// === DO NOT WEAKEN THIS GATE ===
// ============================================================
//
// 21 CFR 101.105 makes net quantity declaration mandatory on every
// supplement label. Missing declaration → 21 USC 343(e) misbranding.
// Wrong unit conversion or off-by-one rounding produces consumer
// short-fill (consumer-protection violation) or over-claim (FTC
// territory). Adding bypasses, loosening tolerance beyond CFR
// 101.105(q)'s "reasonable variations incident to GMP", demoting
// dual-unit requirement to advisory — all are regulatory-safety
// regressions. Read this docblock end-to-end before changing
// TOLERANCE, EPSILON, the rounding helpers, or the gate refusal
// conditions.
// ============================================================

import type { HardStop, HardStopEvidence } from './hardStop';

/** Composition-registry identifier; imported by lib/supplementBucket1Gate.ts. */
export const B5_NET_QUANTITY_ITEM_ID = 'b5-net-quantity-declaration' as const;

/** Shared citation applied to all §B5 hard-stop evidence items. */
export const B5_NET_QUANTITY_CITATION = '21 CFR 101.105' as const;

// ─── Exact CFR-published conversion factors ──────────────────
// These values are exact per the international avoirdupois pound
// (1959) and the US fluid ounce definition. Do not round.
const OZ_TO_G = 28.349523125;
const LB_TO_G = 453.59237;
const FL_OZ_TO_ML = 29.5735295625;

/** ±2% symmetric tolerance per CFR 101.105(q) "reasonable variations
 *  incident to GMP". Asymmetric (different under-fill / over-fill
 *  tolerances) deferred to Round 12+. */
const TOLERANCE = 0.02;

/** IEEE 754 absorption margin so exact-boundary values (e.g., 30.6 g
 *  declared vs 30 g computed = exactly 2.0%) fire by intent rather
 *  than by float drift. 1e-9 is 0.0000001% — well below any
 *  meaningful measurement precision. */
const EPSILON = 1e-9;

export type SolidUnit = 'mg' | 'g' | 'kg' | 'oz' | 'lb';
export type LiquidUnit = 'mL' | 'L' | 'fl oz';
export type SolidMetricUnit = 'mg' | 'g' | 'kg';
export type LiquidMetricUnit = 'mL' | 'L';
type AnyUnit = SolidUnit | LiquidUnit;

export interface NetQuantityInput {
  /** Computed total mass of the finished product per container, in grams.
   *  Caller derives from workspace cascade (serving size × servings per
   *  container × ingredient mass). Used for cross-validation against
   *  declared net quantity. */
  totalMassG?: number;
  /** Computed total volume of the finished product per container, in mL. */
  totalVolumeMl?: number;
  /** Product form discriminator. Required and explicit (not inferred) —
   *  products that have both mass and volume (e.g., oil-filled gel caps)
   *  need a deliberate operator decision on which dimension drives the
   *  label. */
  form: 'solid' | 'liquid';
  /** Operator-declared net quantity on the label. When provided, gate
   *  cross-validates against computed mass/volume. When omitted, gate
   *  refuses (declaration is mandatory per 21 CFR 101.105(a)). */
  declaredNetQuantity?: {
    /** Primary unit shown on the label (typically US customary on US
     *  labels per CFR convention). */
    primary: { value: number; unit: AnyUnit };
    /** Metric secondary unit in parentheses on the label. Required when
     *  primary is US customary (dual-unit requirement); omittable when
     *  primary is already metric. */
    metric?: { value: number; unit: SolidMetricUnit | LiquidMetricUnit };
  };
}

export interface NetQuantityDeclaration {
  primary: { value: number; unit: string; formatted: string };
  metric: { value: number; unit: string; formatted: string };
  /** Label-ready text including "Net Wt" or "Net Vol" prefix. */
  labelText: string;
}

// ─── Internal helpers ─────────────────────────────────────────

function isValidPositive(n: number | undefined): n is number {
  return n !== undefined && Number.isFinite(n) && n > 0;
}

function isMetricUnit(unit: AnyUnit): boolean {
  return unit === 'mg' || unit === 'g' || unit === 'kg' || unit === 'mL' || unit === 'L';
}

function isSolidUnit(unit: AnyUnit): boolean {
  return unit === 'mg' || unit === 'g' || unit === 'kg' || unit === 'oz' || unit === 'lb';
}

function isLiquidUnit(unit: AnyUnit): boolean {
  return unit === 'mL' || unit === 'L' || unit === 'fl oz';
}

function toGrams(value: number, unit: SolidUnit): number {
  switch (unit) {
    case 'mg': return value / 1000;
    case 'g': return value;
    case 'kg': return value * 1000;
    case 'oz': return value * OZ_TO_G;
    case 'lb': return value * LB_TO_G;
  }
}

function toMl(value: number, unit: LiquidUnit): number {
  switch (unit) {
    case 'mL': return value;
    case 'L': return value * 1000;
    case 'fl oz': return value * FL_OZ_TO_ML;
  }
}

function gramsTo(g: number, unit: SolidUnit): number {
  switch (unit) {
    case 'mg': return g * 1000;
    case 'g': return g;
    case 'kg': return g / 1000;
    case 'oz': return g / OZ_TO_G;
    case 'lb': return g / LB_TO_G;
  }
}

function mlTo(ml: number, unit: LiquidUnit): number {
  switch (unit) {
    case 'mL': return ml;
    case 'L': return ml / 1000;
    case 'fl oz': return ml / FL_OZ_TO_ML;
  }
}

/** Select metric mass unit per CFR 101.105(c): mg <1g, g <1000g, kg ≥1000g. */
function selectMetricMassUnit(g: number): SolidMetricUnit {
  if (g < 1) return 'mg';
  if (g < 1000) return 'g';
  return 'kg';
}

/** Select metric volume unit per CFR 101.105(c): mL <1000mL, L ≥1000mL. */
function selectMetricVolumeUnit(ml: number): LiquidMetricUnit {
  return ml < 1000 ? 'mL' : 'L';
}

/** Select US customary solid unit per CFR 101.105(b): oz <1lb, lb ≥1lb. */
function selectUSSolidUnit(g: number): 'oz' | 'lb' {
  return g < LB_TO_G ? 'oz' : 'lb';
}

/** CFR-shape rounding precision per unit:
 *   • mg / g / mL — integer (sub-decimal rarely on consumer labels)
 *   • kg / L      — 2 decimals
 *   • oz / lb     — 2 decimals
 *   • fl oz       — 2 decimals
 *
 * Round 12+: operator-selectable rounding precision.
 */
function cfrRound(value: number, unit: AnyUnit): number {
  if (unit === 'mg' || unit === 'g' || unit === 'mL') {
    return Math.round(value);
  }
  // 2-decimal precision
  return Math.round(value * 100) / 100;
}

function formatValue(value: number, unit: AnyUnit): string {
  return `${value} ${unit}`;
}

// ─── Public: dual-unit declaration generator ─────────────────

/**
 * Compute the canonical dual-unit net quantity declaration for a
 * finished product. Returns undefined when input lacks the dimension
 * expected for the form (gate callers handle missing-dimension as a
 * refusal condition).
 *
 * Pure function — no side effects. CFR-shaped rounding applied to
 * both primary and metric values.
 */
export function computeNetQuantityDeclaration(
  input: NetQuantityInput,
): NetQuantityDeclaration | undefined {
  if (input.form === 'solid') {
    if (!isValidPositive(input.totalMassG)) return undefined;
    const g = input.totalMassG;

    const metricUnit = selectMetricMassUnit(g);
    const metricValueRaw = gramsTo(g, metricUnit);
    const metricValue = cfrRound(metricValueRaw, metricUnit);

    const usUnit = selectUSSolidUnit(g);
    const usValueRaw = gramsTo(g, usUnit);
    const usValue = cfrRound(usValueRaw, usUnit);

    return {
      primary: { value: usValue, unit: usUnit, formatted: formatValue(usValue, usUnit) },
      metric: { value: metricValue, unit: metricUnit, formatted: formatValue(metricValue, metricUnit) },
      labelText: `Net Wt ${formatValue(usValue, usUnit)} (${formatValue(metricValue, metricUnit)})`,
    };
  }

  // liquid
  if (!isValidPositive(input.totalVolumeMl)) return undefined;
  const ml = input.totalVolumeMl;

  const metricUnit = selectMetricVolumeUnit(ml);
  const metricValueRaw = mlTo(ml, metricUnit);
  const metricValue = cfrRound(metricValueRaw, metricUnit);

  const usValueRaw = mlTo(ml, 'fl oz');
  const usValue = cfrRound(usValueRaw, 'fl oz');

  return {
    primary: { value: usValue, unit: 'fl oz', formatted: formatValue(usValue, 'fl oz') },
    metric: { value: metricValue, unit: metricUnit, formatted: formatValue(metricValue, metricUnit) },
    labelText: `Net Vol ${formatValue(usValue, 'fl oz')} (${formatValue(metricValue, metricUnit)})`,
  };
}

// ─── Public: §B5 gate evaluator ──────────────────────────────

export type NetQuantityGateResult =
  | (HardStop & { source: 'supplement-net-quantity' })
  | {
      hardStop: false;
      source: 'supplement-net-quantity';
    };

/**
 * Evaluate the §B5 net quantity gate. Refuses on:
 *   (a) form/dimension mismatch — form expects one dimension but
 *       only the opposite was provided
 *   (b) missing operator declaration — 21 CFR 101.105(a) mandate
 *   (c) US customary primary without metric secondary — dual-unit
 *       requirement per 21 CFR 101.105(b)
 *   (d) declared net quantity outside ±2% of computed — tolerance
 *       breach per 21 CFR 101.105(q)
 *   (e) computed dimension missing when declaration present and no
 *       opposite-dimension fallback signal
 *
 * Pure function — no side effects.
 */
export function evaluateNetQuantityGate(
  input: NetQuantityInput,
): NetQuantityGateResult {
  const violations: HardStopEvidence[] = [];

  const computedDimValid = input.form === 'solid'
    ? isValidPositive(input.totalMassG)
    : isValidPositive(input.totalVolumeMl);
  const oppositeDimValid = input.form === 'solid'
    ? isValidPositive(input.totalVolumeMl)
    : isValidPositive(input.totalMassG);
  const dimLabel = input.form === 'solid' ? 'totalMassG' : 'totalVolumeMl';

  // (a) Form/dimension mismatch — opposite dim present, expected absent.
  if (!computedDimValid && oppositeDimValid) {
    violations.push({
      subject: 'form/dimension mismatch',
      detail: `form/dimension mismatch: form='${input.form}' expects ${dimLabel} but the opposite dimension was provided instead.`,
      citation: B5_NET_QUANTITY_CITATION,
    });
  }

  // (b) Missing declaration.
  if (input.declaredNetQuantity === undefined) {
    violations.push({
      subject: 'net quantity declaration',
      detail: `Net quantity declaration is missing. 21 CFR 101.105(a) requires net quantity on every supplement label.`,
      citation: B5_NET_QUANTITY_CITATION,
    });
  } else {
    const primary = input.declaredNetQuantity.primary;
    const metricSecondaryProvided = input.declaredNetQuantity.metric !== undefined;

    // (c) Dual-unit: US customary primary requires metric secondary.
    if (!isMetricUnit(primary.unit) && !metricSecondaryProvided) {
      violations.push({
        subject: 'dual-unit declaration',
        detail: `Declared primary unit (${primary.unit}) is US customary; 21 CFR 101.105(b) requires metric secondary for dual-unit declaration.`,
        citation: B5_NET_QUANTITY_CITATION,
      });
    }

    // (d) Cross-validation tolerance check (requires valid computed dim).
    if (computedDimValid) {
      const expectedUnitCheck = input.form === 'solid' ? isSolidUnit : isLiquidUnit;
      if (!expectedUnitCheck(primary.unit)) {
        violations.push({
          subject: 'unit/form mismatch',
          detail: `Declared primary unit '${primary.unit}' does not match form='${input.form}'.`,
          citation: B5_NET_QUANTITY_CITATION,
        });
      } else {
        const declaredInBase = input.form === 'solid'
          ? toGrams(primary.value, primary.unit as SolidUnit)
          : toMl(primary.value, primary.unit as LiquidUnit);
        const computedBase = input.form === 'solid'
          ? input.totalMassG!
          : input.totalVolumeMl!;
        const drift = Math.abs(declaredInBase - computedBase) / computedBase;
        // Strict > with EPSILON absorbs IEEE 754 drift so exact-2%
        // boundary values fire by intent, not by float artifact.
        if (drift > TOLERANCE + EPSILON) {
          violations.push({
            subject: 'tolerance breach',
            detail: `Declared net quantity (${primary.value} ${primary.unit} ≈ ${declaredInBase.toFixed(4)} ${input.form === 'solid' ? 'g' : 'mL'}) deviates ${(drift * 100).toFixed(2)}% from computed ${input.form === 'solid' ? 'mass' : 'volume'} (${computedBase} ${input.form === 'solid' ? 'g' : 'mL'}); exceeds ±${TOLERANCE * 100}% tolerance per 21 CFR 101.105(q).`,
            citation: B5_NET_QUANTITY_CITATION,
          });
        }
      }
    } else if (!oppositeDimValid) {
      // (e) Declaration present but no computed dim at all — can't cross-validate.
      violations.push({
        subject: 'computed dimension missing',
        detail: `form='${input.form}' but ${dimLabel} is missing or invalid; cannot cross-validate declared net quantity.`,
        citation: B5_NET_QUANTITY_CITATION,
      });
    }
    // If computedDim invalid AND oppositeDim valid: form/dim mismatch already added; don't double-report.
  }

  if (violations.length === 0) {
    return { hardStop: false, source: 'supplement-net-quantity' };
  }

  return {
    hardStop: true,
    source: 'supplement-net-quantity',
    reason: violations.length === 1
      ? `Refuse-to-export: net quantity ${violations[0].subject}.`
      : `Refuse-to-export: ${violations.length} net quantity violations.`,
    evidence: violations,
  };
}
