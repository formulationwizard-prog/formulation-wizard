// Master Specs — statistical helper module.
//
// Per docs/architecture/master-specs-data-model-2026-05-27.md (red-lines
// #1 + #3 incorporated). Centralized so PDS / Batch / Filing / Spec
// Analysis all read the same computed values.
//
// Branches on metric.data_type (numeric / categorical / boolean) and,
// for numeric, on metric.bound_direction (two-sided / upper-only /
// lower-only). Phase 1 uses normal approximation for log-normal /
// poisson distributions (per-metric caveat note surfaced in UI).

import type {
  ComputedStats,
  ComputedStatsNumeric,
  ConfidenceTier,
  MasterSpecEntry,
  ObservationLogEntry,
  SpecMetric,
} from '@/types/masterSpecs';

// ─── Tier promotion (shared across data_type variants) ──────────────────

export const DEFAULT_VERIFIED_AT = 5;
export const DEFAULT_WELL_CHARACTERIZED_AT = 30;

/**
 * Tier promotion.
 *
 * `isAuthored` distinguishes a QA-authored Master Specs entry (which has a
 * validated_value + authorized_signer) from a downstream platform fallback:
 *   - ESTIMATED — n=0 AND NOT authored — platform calculation only; only ever
 *     shown by downstream consumers (Batch Sheet / PDS) when NO Master Specs
 *     entry exists to inherit from.
 *   - VALIDATED — n=0 with authored value (QA attested, awaiting batch
 *     observations) OR n in [1, verified_at).
 *   - VERIFIED — n in [verified_at, well_characterized_at).
 *   - WELL-CHARACTERIZED — n ≥ well_characterized_at.
 *
 * recomputeStats() always passes isAuthored=true because it only ever runs on
 * a real MasterSpecEntry (which by definition has an authored validated_value).
 * The bare ESTIMATED state belongs to downstream fallback rendering, not to a
 * stored entry.
 */
export function computeTier(n: number, metric: SpecMetric, isAuthored = false): ConfidenceTier {
  const thresholds = metric.promotion_thresholds ?? {
    verified_at: DEFAULT_VERIFIED_AT,
    well_characterized_at: DEFAULT_WELL_CHARACTERIZED_AT,
  };
  if (n === 0) return isAuthored ? 'validated' : 'estimated';
  if (n < thresholds.verified_at) return 'validated';
  if (n < thresholds.well_characterized_at) return 'verified';
  return 'well-characterized';
}

// ─── Range computation (branches on bound_direction) ────────────────────

interface RangeBounds {
  low: number | null;
  high: number | null;
}

/**
 * Range when n < verified_at threshold: use operator-set validated_tolerance.
 */
export function computeRangeFromTolerance(
  metric: SpecMetric,
  validated_value: number,
  validated_tolerance: number,
): RangeBounds {
  if (metric.bound_direction === 'upper-only') {
    return { low: null, high: validated_value + validated_tolerance };
  }
  if (metric.bound_direction === 'lower-only') {
    return { low: validated_value - validated_tolerance, high: null };
  }
  return {
    low: validated_value - validated_tolerance,
    high: validated_value + validated_tolerance,
  };
}

/**
 * Range when n ≥ verified_at: statistical range from observation σ.
 * Phase 1 uses normal approximation for log-normal / poisson; UI surfaces
 * a caveat note via metric.distribution_type when distribution != 'normal'.
 */
export function computeRangeFromSigma(
  stats: ComputedStatsNumeric,
  metric: SpecMetric,
): RangeBounds {
  if (stats.std_dev === null || stats.mean === null) return { low: null, high: null };
  const halfWidth = stats.safety_factor * stats.std_dev;
  if (metric.bound_direction === 'upper-only') {
    return { low: null, high: stats.mean + halfWidth };
  }
  if (metric.bound_direction === 'lower-only') {
    return { low: stats.mean - halfWidth, high: null };
  }
  return { low: stats.mean - halfWidth, high: stats.mean + halfWidth };
}

// ─── Main entry — recompute stats from observation_log ──────────────────

type EntryForStats = Pick<
  MasterSpecEntry,
  'validated_value' | 'validated_tolerance' | 'target_at_label_claim_pct'
>;

export function recomputeStats(
  observations: ObservationLogEntry[],
  entry: EntryForStats,
  metric: SpecMetric,
): ComputedStats {
  const valid = observations.filter((o) => !o.superseded_by);
  const n = valid.length;
  // isAuthored=true — recomputeStats only runs on real MasterSpecEntry records
  // (always have an authored validated_value), so n=0 → VALIDATED, not ESTIMATED.
  const tier = computeTier(n, metric, true);
  const last_observation_at = n > 0 ? valid[n - 1].observation_date : null;
  const computed_at = new Date().toISOString();

  if (metric.data_type === 'numeric') {
    return recomputeNumeric(valid, entry, metric, n, tier, last_observation_at, computed_at);
  }

  if (metric.data_type === 'categorical') {
    return recomputeCategorical(valid, n, tier, last_observation_at, computed_at);
  }

  // boolean
  return recomputeBoolean(valid, n, tier, last_observation_at, computed_at);
}

function recomputeNumeric(
  valid: ObservationLogEntry[],
  entry: EntryForStats,
  metric: SpecMetric,
  n: number,
  tier: ConfidenceTier,
  last_observation_at: string | null,
  computed_at: string,
): ComputedStatsNumeric {
  const safety_factor = metric.safety_factor_default ?? 2.0;
  const validated_value = entry.validated_value as number;
  const validated_tolerance = entry.validated_tolerance ?? 0;
  const thresholds = metric.promotion_thresholds ?? {
    verified_at: DEFAULT_VERIFIED_AT,
    well_characterized_at: DEFAULT_WELL_CHARACTERIZED_AT,
  };

  if (n === 0) {
    const range = computeRangeFromTolerance(metric, validated_value, validated_tolerance);
    return {
      data_type: 'numeric',
      n: 0,
      tier,
      mean: null,
      std_dev: null,
      min: null,
      max: null,
      current_best: validated_value,
      current_range_low: range.low,
      current_range_high: range.high,
      safety_factor,
      last_observation_at,
      computed_at,
    };
  }

  const values = valid.map((o) => o.value as number);
  const mean = values.reduce((acc, v) => acc + v, 0) / n;
  const std_dev =
    n >= 2
      ? Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1))
      : null;

  const stats: ComputedStatsNumeric = {
    data_type: 'numeric',
    n,
    tier,
    mean,
    std_dev,
    min: Math.min(...values),
    max: Math.max(...values),
    current_best: mean,
    current_range_low: null,
    current_range_high: null,
    safety_factor,
    last_observation_at,
    computed_at,
  };

  // Range computation: small-n uses operator tolerance; verified-n uses σ
  const range =
    n < thresholds.verified_at
      ? computeRangeFromTolerance(metric, validated_value, validated_tolerance)
      : computeRangeFromSigma(stats, metric);

  return { ...stats, current_range_low: range.low, current_range_high: range.high };
}

function recomputeCategorical(
  valid: ObservationLogEntry[],
  n: number,
  tier: ConfidenceTier,
  last_observation_at: string | null,
  computed_at: string,
): ComputedStats {
  const counts: Record<string, number> = {};
  for (const o of valid) {
    const key = String(o.value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  let dominant: string | null = null;
  let dominantCount = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > dominantCount) {
      dominant = k;
      dominantCount = v;
    }
  }
  return {
    data_type: 'categorical',
    n,
    tier,
    counts,
    dominant,
    dominant_pct: n > 0 ? dominantCount / n : null,
    last_observation_at,
    computed_at,
  };
}

function recomputeBoolean(
  valid: ObservationLogEntry[],
  n: number,
  tier: ConfidenceTier,
  last_observation_at: string | null,
  computed_at: string,
): ComputedStats {
  const true_count = valid.filter((o) => o.value === true).length;
  const false_count = n - true_count;
  return {
    data_type: 'boolean',
    n,
    tier,
    true_count,
    false_count,
    pass_pct: n > 0 ? true_count / n : null,
    last_observation_at,
    computed_at,
  };
}

// ─── Convenience — derive label_value from validated_value + overage ────

/**
 * Per red-line #4 — supplements overage interface.
 * validated_value is concentration at time-zero (may be at overage).
 * label_value is what gets printed on the SFP (label claim).
 */
export function labelClaimFromValidated(
  validated_value: number,
  target_at_label_claim_pct: number,
): number {
  if (target_at_label_claim_pct === 0) return validated_value;
  return validated_value / (target_at_label_claim_pct / 100);
}
