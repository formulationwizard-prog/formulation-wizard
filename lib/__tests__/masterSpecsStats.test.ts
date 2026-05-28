// ============================================================
// masterSpecsStats — statistical helper module unit tests.
// ------------------------------------------------------------
// Phase 1 acceptance criterion: ≥12 unit test cases covering
// numeric / categorical / boolean variants + bound_direction
// (two-sided / upper-only / lower-only) + overage interpretation
// + tier promotion thresholds (default + per-metric overrides).
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  computeTier,
  computeRangeFromTolerance,
  recomputeStats,
  labelClaimFromValidated,
  DEFAULT_VERIFIED_AT,
  DEFAULT_WELL_CHARACTERIZED_AT,
} from '../masterSpecsStats';
import type {
  ComputedStatsBoolean,
  ComputedStatsCategorical,
  ComputedStatsNumeric,
  MasterSpecEntry,
  ObservationLogEntry,
  SpecMetric,
} from '@/types/masterSpecs';

// ─── Test fixtures ─────────────────────────────────────────

const pHMetric: SpecMetric = {
  id: 'metric-ph',
  name: 'pH (acidified)',
  unit: 'pH',
  data_type: 'numeric',
  source: 'predefined',
  distribution_type: 'normal',
  bound_direction: 'lower-only',
  safety_factor_default: 2.0,
};

const colorMetric: SpecMetric = {
  id: 'metric-color',
  name: 'L* (CIELAB)',
  unit: 'L*',
  data_type: 'numeric',
  source: 'predefined',
  distribution_type: 'normal',
  bound_direction: 'two-sided',
  safety_factor_default: 2.0,
};

const heavyMetalMetric: SpecMetric = {
  id: 'metric-pb',
  name: 'Lead (Pb)',
  unit: 'ppm',
  data_type: 'numeric',
  source: 'predefined',
  distribution_type: 'log-normal',
  bound_direction: 'upper-only',
  safety_factor_default: 3.0,
  promotion_thresholds: { verified_at: 10, well_characterized_at: 30 },
};

const visualDefectMetric: SpecMetric = {
  id: 'metric-vd',
  name: 'Visual defect class',
  unit: 'class',
  data_type: 'categorical',
  source: 'predefined',
  distribution_type: 'normal',
  bound_direction: 'two-sided',
};

const sealIntegrityMetric: SpecMetric = {
  id: 'metric-si',
  name: 'Seal integrity pass',
  unit: 'pass/fail',
  data_type: 'boolean',
  source: 'predefined',
  distribution_type: 'binomial',
  bound_direction: 'two-sided',
};

const baseEntry: Pick<MasterSpecEntry, 'validated_value' | 'validated_tolerance' | 'target_at_label_claim_pct'> = {
  validated_value: 3.85,
  validated_tolerance: 0.15,
  target_at_label_claim_pct: 100,
};

function obs(value: number | string | boolean, dateOffset = 0): ObservationLogEntry {
  const d = new Date();
  d.setDate(d.getDate() - dateOffset);
  return {
    id: `obs-${value}-${dateOffset}`,
    batch_id: `BATCH-${dateOffset}`,
    observation_date: d.toISOString(),
    value,
    method_used: 'AOAC 981.12',
    signer: 'lab-tech-1',
    signer_role: 'lab-tech',
    created_at: d.toISOString(),
    created_by: 'lab-tech-1',
  };
}

// ─── 1. Tier promotion — default thresholds ────────────────

describe('computeTier — default thresholds', () => {
  it('n=0 → estimated', () => {
    expect(computeTier(0, colorMetric)).toBe('estimated');
  });

  it('n=1 → validated', () => {
    expect(computeTier(1, colorMetric)).toBe('validated');
  });

  it('n=4 → validated (below default verified_at=5)', () => {
    expect(computeTier(4, colorMetric)).toBe('validated');
  });

  it('n=5 → verified (at default verified_at threshold)', () => {
    expect(computeTier(5, colorMetric)).toBe('verified');
  });

  it('n=29 → verified (below default well_characterized_at=30)', () => {
    expect(computeTier(29, colorMetric)).toBe('verified');
  });

  it('n=30 → well-characterized (at default well_characterized_at)', () => {
    expect(computeTier(30, colorMetric)).toBe('well-characterized');
  });

  it('n=100 → well-characterized', () => {
    expect(computeTier(100, colorMetric)).toBe('well-characterized');
  });
});

// ─── 2. Tier promotion — per-metric thresholds (heavy metals n=10) ─

describe('computeTier — per-metric override (heavy metals n=10)', () => {
  it('n=9 → validated (below heavy metals verified_at=10)', () => {
    expect(computeTier(9, heavyMetalMetric)).toBe('validated');
  });

  it('n=10 → verified (at heavy metals verified_at threshold)', () => {
    expect(computeTier(10, heavyMetalMetric)).toBe('verified');
  });
});

// ─── 3. Range computation — bound_direction variants ───────

describe('computeRangeFromTolerance — bound_direction variants', () => {
  it('two-sided returns symmetric ± range', () => {
    expect(computeRangeFromTolerance(colorMetric, 50, 5)).toEqual({ low: 45, high: 55 });
  });

  it('upper-only returns { low: null, high: value+tolerance }', () => {
    expect(computeRangeFromTolerance(heavyMetalMetric, 0.5, 0.1)).toEqual({ low: null, high: 0.6 });
  });

  it('lower-only returns { low: value-tolerance, high: null }', () => {
    const range = computeRangeFromTolerance(pHMetric, 4.6, 0.6);
    expect(range.low).toBeCloseTo(4.0, 5);
    expect(range.high).toBeNull();
  });
});

// ─── 4. Numeric stats — empty observations (n=0) ───────────

describe('recomputeStats — numeric, n=0', () => {
  it('returns ESTIMATED tier + validated_value as best estimate', () => {
    const stats = recomputeStats([], baseEntry, pHMetric) as ComputedStatsNumeric;
    expect(stats.data_type).toBe('numeric');
    expect(stats.n).toBe(0);
    expect(stats.tier).toBe('estimated');
    expect(stats.mean).toBeNull();
    expect(stats.std_dev).toBeNull();
    expect(stats.current_best).toBe(3.85);
    // pH is lower-only → low set, high null
    expect(stats.current_range_low).toBe(3.7);
    expect(stats.current_range_high).toBeNull();
  });
});

// ─── 5. Numeric stats — small sample (n=1) ─────────────────

describe('recomputeStats — numeric, n=1', () => {
  it('returns VALIDATED tier + mean=observation + std_dev null (n<2)', () => {
    const stats = recomputeStats([obs(3.84)], baseEntry, pHMetric) as ComputedStatsNumeric;
    expect(stats.n).toBe(1);
    expect(stats.tier).toBe('validated');
    expect(stats.mean).toBe(3.84);
    expect(stats.std_dev).toBeNull();
    expect(stats.current_best).toBe(3.84);
    // Small n → range centered on validated_value (3.85), not on observed mean — we don't yet trust the small-n mean as the center
    expect(stats.current_range_low).toBeCloseTo(3.85 - 0.15, 5);
    expect(stats.current_range_high).toBeNull(); // pH is lower-only
  });
});

// ─── 6. Numeric stats — n=2 (std_dev computable, still <verified_at) ─

describe('recomputeStats — numeric, n=2', () => {
  it('computes std_dev (n-1 denominator) but stays VALIDATED tier', () => {
    const stats = recomputeStats(
      [obs(3.84), obs(3.86, 1)],
      baseEntry,
      pHMetric,
    ) as ComputedStatsNumeric;
    expect(stats.n).toBe(2);
    expect(stats.tier).toBe('validated');
    expect(stats.mean).toBeCloseTo(3.85, 5);
    // σ = sqrt(((3.84-3.85)² + (3.86-3.85)²) / (2-1)) = sqrt(0.0002 / 1) ≈ 0.01414
    expect(stats.std_dev).toBeCloseTo(0.01414, 4);
    // n<5 → uses validated_tolerance for range (centered on validated_value 3.85)
    expect(stats.current_range_low).toBeCloseTo(3.85 - 0.15, 5);
  });
});

// ─── 7. Numeric stats — n=5 (tier promotes, range uses σ) ──

describe('recomputeStats — numeric, n=5 (VERIFIED + σ-based range)', () => {
  it('tier promotes to VERIFIED and range switches to σ-based', () => {
    const observations = [obs(3.84), obs(3.86, 1), obs(3.85, 2), obs(3.83, 3), obs(3.87, 4)];
    const stats = recomputeStats(observations, baseEntry, pHMetric) as ComputedStatsNumeric;
    expect(stats.n).toBe(5);
    expect(stats.tier).toBe('verified');
    expect(stats.mean).toBeCloseTo(3.85, 2);
    // Range now σ-based, lower-only (pH metric)
    // σ ≈ 0.01581; halfWidth = 2.0 × σ ≈ 0.0316
    expect(stats.current_range_low).toBeCloseTo(3.85 - 0.0316, 3);
    expect(stats.current_range_high).toBeNull(); // lower-only
  });
});

// ─── 8. Numeric stats — n=30 (WELL-CHARACTERIZED) ──────────

describe('recomputeStats — numeric, n=30 (WELL-CHARACTERIZED)', () => {
  it('tier promotes to well-characterized at n=30', () => {
    const observations = Array.from({ length: 30 }, (_, i) =>
      obs(3.85 + (i % 2 === 0 ? 0.01 : -0.01), i),
    );
    const stats = recomputeStats(observations, baseEntry, pHMetric) as ComputedStatsNumeric;
    expect(stats.n).toBe(30);
    expect(stats.tier).toBe('well-characterized');
  });
});

// ─── 9. Numeric stats — superseded observations excluded ───

describe('recomputeStats — superseded observations excluded', () => {
  it('does NOT count observations with superseded_by set', () => {
    const observations: ObservationLogEntry[] = [
      { ...obs(3.84), superseded_by: 'replaced', superseded_reason: 'lab calibration issue' },
      obs(3.85, 1),
      obs(3.86, 2),
    ];
    const stats = recomputeStats(observations, baseEntry, pHMetric) as ComputedStatsNumeric;
    expect(stats.n).toBe(2); // not 3
    expect(stats.mean).toBeCloseTo(3.855, 3);
  });
});

// ─── 10. Numeric stats — two-sided bound (color L*) ────────

describe('recomputeStats — two-sided bound (color L*)', () => {
  it('returns both low and high range bounds for two-sided metric', () => {
    const observations = [obs(28), obs(29, 1), obs(28.5, 2), obs(28.2, 3), obs(28.8, 4)];
    const colorEntry = { validated_value: 28, validated_tolerance: 2, target_at_label_claim_pct: 100 };
    const stats = recomputeStats(observations, colorEntry, colorMetric) as ComputedStatsNumeric;
    expect(stats.tier).toBe('verified');
    expect(stats.current_range_low).not.toBeNull();
    expect(stats.current_range_high).not.toBeNull();
    expect(stats.current_range_low).toBeLessThan(stats.mean!);
    expect(stats.current_range_high).toBeGreaterThan(stats.mean!);
  });
});

// ─── 11. Numeric stats — upper-only bound (heavy metals) ───

describe('recomputeStats — upper-only bound (heavy metals)', () => {
  it('returns only high bound for upper-only metric', () => {
    const observations = Array.from({ length: 10 }, (_, i) => obs(0.4 + i * 0.005, i));
    const hmEntry = { validated_value: 0.5, validated_tolerance: 0.1, target_at_label_claim_pct: 100 };
    const stats = recomputeStats(observations, hmEntry, heavyMetalMetric) as ComputedStatsNumeric;
    expect(stats.n).toBe(10);
    expect(stats.tier).toBe('verified'); // heavy metals threshold = 10
    expect(stats.current_range_low).toBeNull();
    expect(stats.current_range_high).not.toBeNull();
    expect(stats.current_range_high!).toBeGreaterThan(stats.mean!);
  });
});

// ─── 12. Categorical stats — counts + dominant + dominant_pct ─

describe('recomputeStats — categorical', () => {
  it('counts categories + identifies dominant + computes dominant_pct', () => {
    const observations = [
      obs('pass'), obs('pass', 1), obs('pass', 2),
      obs('minor-defect', 3), obs('minor-defect', 4),
      obs('major-defect', 5),
    ];
    const catEntry = { validated_value: 'pass', validated_tolerance: null, target_at_label_claim_pct: 100 };
    const stats = recomputeStats(observations, catEntry, visualDefectMetric) as ComputedStatsCategorical;
    expect(stats.data_type).toBe('categorical');
    expect(stats.n).toBe(6);
    expect(stats.counts).toEqual({ pass: 3, 'minor-defect': 2, 'major-defect': 1 });
    expect(stats.dominant).toBe('pass');
    expect(stats.dominant_pct).toBeCloseTo(0.5, 5);
    expect(stats.tier).toBe('verified'); // n=6 → ≥5 default verified_at
  });
});

// ─── 13. Boolean stats — pass_pct ───────────────────────────

describe('recomputeStats — boolean', () => {
  it('computes true_count / false_count / pass_pct', () => {
    const observations = [
      obs(true), obs(true, 1), obs(true, 2), obs(true, 3), obs(true, 4),
      obs(false, 5),
    ];
    const boolEntry = { validated_value: true, validated_tolerance: null, target_at_label_claim_pct: 100 };
    const stats = recomputeStats(observations, boolEntry, sealIntegrityMetric) as ComputedStatsBoolean;
    expect(stats.data_type).toBe('boolean');
    expect(stats.n).toBe(6);
    expect(stats.true_count).toBe(5);
    expect(stats.false_count).toBe(1);
    expect(stats.pass_pct).toBeCloseTo(5 / 6, 5);
    expect(stats.tier).toBe('verified');
  });
});

// ─── 14. Overage / label-claim interface ───────────────────

describe('labelClaimFromValidated — overage interpretation', () => {
  it('100% overage → label_value === validated_value', () => {
    expect(labelClaimFromValidated(60, 100)).toBeCloseTo(60, 5);
  });

  it('110% overage (Vit C 6-mo stability) → label_value = validated / 1.10', () => {
    expect(labelClaimFromValidated(66, 110)).toBeCloseTo(60, 5);
  });

  it('120% overage → label_value = validated / 1.20', () => {
    expect(labelClaimFromValidated(72, 120)).toBeCloseTo(60, 5);
  });
});

// ─── 15. Default constants exported correctly ──────────────

describe('default tier thresholds exported', () => {
  it('DEFAULT_VERIFIED_AT === 5', () => {
    expect(DEFAULT_VERIFIED_AT).toBe(5);
  });

  it('DEFAULT_WELL_CHARACTERIZED_AT === 30', () => {
    expect(DEFAULT_WELL_CHARACTERIZED_AT).toBe(30);
  });
});
