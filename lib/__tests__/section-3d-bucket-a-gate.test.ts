// ============================================================
// Section 3d — Bucket A enforcement gate
// ------------------------------------------------------------
// Round 10 Section 3d (2026-05-15). Tests the gate's three-way
// partition (hard-stop / PA-reviewable / non-fire) and its
// composition with the rest of Round 10's enforcement universe.
//
// Test groups:
//   • Gate branches — hard-stop vs PA-reviewable vs cleared
//   • Composition with productClass-routed findings (3b.2)
//   • Composition with combined-budget findings (3b.1)
//   • Composition with prohibition findings (3b.2)
//   • Edge cases — empty findings, all compliant, mixed confidence
// ============================================================

import { describe, it, expect } from 'vitest';
import { checkCompliance, type ComplianceFinding } from '../regulatoryLimits';
import { evaluateBucketA } from '../bucketAGate';
import { isHardStop } from '../hardStop';

// Helper — build a synthetic ComplianceFinding with specified inputConfidence
// and violated state. Avoids dependence on catalog data for pure gate-logic
// tests; composition tests below use real findings via checkCompliance.
function makeFinding(overrides: Partial<ComplianceFinding>): ComplianceFinding {
  return {
    ingredientName: '__test__',
    ingredientGrams: 1,
    currentPercent: 0,
    currentPpm: 0,
    limit: {
      namePatterns: ['__test__'],
      authority: 'FDA',
      citation: '__test_citation__',
      shortName: 'Test Limit',
      summary: 'Test',
    },
    utilization: 0,
    violated: false,
    inputConfidence: 'measured',
    ...overrides,
  };
}

describe('evaluateBucketA — gate branches (synthetic findings)', () => {

  it('empty findings → cleared, no hard-stop, no PA-reviewable', () => {
    const result = evaluateBucketA([]);
    expect(result.hardStop).toBe(false);
    if (result.hardStop) return;
    expect(result.paReviewableFindings).toEqual([]);
  });

  it('all-compliant findings → cleared regardless of inputConfidence', () => {
    const findings = [
      makeFinding({ violated: false, inputConfidence: 'measured' }),
      makeFinding({ violated: false, inputConfidence: 'estimated' }),
      makeFinding({ violated: false, inputConfidence: 'inferred' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(false);
    if (result.hardStop) return;
    expect(result.paReviewableFindings).toEqual([]);
  });

  it('MEASURED + violated → hard-stop fires', () => {
    const findings = [
      makeFinding({ violated: true, inputConfidence: 'measured' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
    if (!result.hardStop) return;
    expect(result.source).toBe('bucket-a-compliance');
    expect(result.evidence.length).toBe(1);
    expect(result.reason).toContain('Refuse-to-export');
  });

  it('CALCULATED + violated → hard-stop fires (same tier as MEASURED)', () => {
    const findings = [
      makeFinding({ violated: true, inputConfidence: 'calculated' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(true);
  });

  it('ESTIMATED + violated → PA-reviewable, NO hard-stop', () => {
    const findings = [
      makeFinding({ violated: true, inputConfidence: 'estimated' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(false);
    if (result.hardStop) return;
    expect(result.paReviewableFindings.length).toBe(1);
  });

  it('INFERRED + violated → PA-reviewable, NO hard-stop (same tier as ESTIMATED)', () => {
    const findings = [
      makeFinding({ violated: true, inputConfidence: 'inferred' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(false);
    if (result.hardStop) return;
    expect(result.paReviewableFindings.length).toBe(1);
  });

  it('UNKNOWN + violated → neither branch fires (insufficient-data)', () => {
    const findings = [
      makeFinding({ violated: true, inputConfidence: 'unknown' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(false);
    if (result.hardStop) return;
    expect(result.paReviewableFindings).toEqual([]);
  });

  it('mixed confidence: hard-stop wins, paReviewable lists ESTIMATED-violated for full disclosure', () => {
    const findings = [
      makeFinding({ violated: true, inputConfidence: 'measured', ingredientName: 'A' }),
      makeFinding({ violated: true, inputConfidence: 'estimated', ingredientName: 'B' }),
      makeFinding({ violated: false, inputConfidence: 'measured', ingredientName: 'C' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence.length).toBe(1);
    expect(result.evidence[0].subject).toBe('A');
    expect(result.paReviewableFindings.length).toBe(1);
    expect(result.paReviewableFindings[0].ingredientName).toBe('B');
  });

  it('multiple hard-stop findings → reason notes count, evidence enumerates all', () => {
    const findings = [
      makeFinding({ violated: true, inputConfidence: 'measured', ingredientName: 'A' }),
      makeFinding({ violated: true, inputConfidence: 'calculated', ingredientName: 'B' }),
      makeFinding({ violated: true, inputConfidence: 'measured', ingredientName: 'C' }),
    ];
    const result = evaluateBucketA(findings);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence.length).toBe(3);
    expect(result.reason).toContain('3 chemical-safety violations');
  });
});

describe('evaluateBucketA — composition with live findings', () => {

  it('sulfite 120 ppm in beverage (universal cap, MEASURED inputs) → hard-stop', () => {
    // Sulfite cap is universal (no appliesToCategories restriction). Water
    // and metabisulfite are both MEASURED (verified entries / known commodity),
    // and the finding's denominatorBasis is 'total' → MEASURED inputConfidence.
    // 120 ppm > 100 ppm cap, MEASURED + violated → hard-stop.
    const findings = checkCompliance(
      [
        { name: 'Sodium Metabisulfite', qty: 0.012, unit: 'g' },
        { name: 'Water', qty: 99.988, unit: 'g' },
      ],
      'beverage',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(true);
    if (!gate.hardStop) return;
    expect(gate.evidence.some(e => e.subject.toLowerCase().includes('sulfite') || e.subject.toLowerCase().includes('metabisulfite'))).toBe(true);
  });

  it('BHA 0.05% fat-basis (ai-estimate oil → ESTIMATED inputConfidence) → PA-reviewable, NOT hard-stop', () => {
    // BHA uses fat-and-oil denominator basis. Soybean Oil is tagged
    // fatContentPct=100 but its spec source is 'ai-estimate' → ESTIMATED
    // confidence on the denominator → ESTIMATED on the finding. 0.05% of
    // fat-mass > 0.02% cap, but ESTIMATED + violated → PA-reviewable.
    const findings = checkCompliance(
      [
        { name: 'BHA (Antioxidant)', qty: 0.025, unit: 'g' },
        { name: 'Soybean Oil (RBD)', qty: 49.975, unit: 'g' },
        { name: 'Water', qty: 50, unit: 'g' },
      ],
      'general',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(false);
    if (gate.hardStop) return;
    expect(gate.paReviewableFindings.some(f => f.limit.shortName === 'BHA')).toBe(true);
  });

  it('Combined-budget violation on Generic Lean Meat (ESTIMATED meat basis) → PA-reviewable', () => {
    // 2% NFDM + 2% Soy Isolate over Generic Lean Meat (ai-estimate, ESTIMATED).
    // Combined inputConfidence is worst-across-members → ESTIMATED →
    // PA-reviewable (NOT hard-stop) despite 4.17% combined > 3.5% cap.
    const findings = checkCompliance(
      [
        { name: 'Non-Fat Dry Milk', qty: 2, unit: 'g' },
        { name: 'Soy Protein Isolate', qty: 2, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 96, unit: 'g' },
      ],
      'cured-meat',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(false);
    if (gate.hardStop) return;
    const combined = gate.paReviewableFindings.find(f => f.combinedBudget !== undefined);
    expect(combined).toBeDefined();
    expect(combined?.violated).toBe(true);
  });

  it('Nitrate-in-bacon prohibition (MEASURED inputs, prohibitedUse) → hard-stop', () => {
    // Nitrate in bacon is a categorical violation (FSIS 1974). The trace
    // amount + bacon productClass triggers prohibitedUse:true. Mass is
    // MEASURED (user-entered) + denominator is 'total' (prohibition fires
    // independent of denominator basis) → MEASURED inputConfidence →
    // hard-stop fires.
    const findings = checkCompliance(
      [
        { name: 'Sodium Nitrate', qty: 0.001, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 99.999, unit: 'g' },
      ],
      'bacon',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(true);
    if (!gate.hardStop) return;
    expect(gate.evidence.some(e =>
      e.subject.toLowerCase().includes('nitrate') &&
      e.detail.toLowerCase().includes('prohibited')
    )).toBe(true);
  });

  it('Sulfite on fresh produce (MEASURED inputs, prohibitedUse) → hard-stop', () => {
    // 21 CFR 182.3862 prohibits sulfites on fresh produce. Mass MEASURED,
    // total-basis denominator → MEASURED inputConfidence → hard-stop.
    const findings = checkCompliance(
      [
        { name: 'Sodium Metabisulfite', qty: 0.001, unit: 'g' },
        { name: 'Water', qty: 99.999, unit: 'g' },
      ],
      'fresh-produce',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(true);
  });

  it('Vitamin C in beverage (precision fix — limit doesn\'t fire) → cleared, no PA-reviewable', () => {
    // Pre-Section-3b.2: vitamin C substring would match cured-meat cap,
    // emit MEASURED + violated → hard-stop. Post-fix: appliesToCategories
    // gate prevents the finding from firing for beverage productClass.
    // Gate sees no violated findings → cleared.
    const findings = checkCompliance(
      [
        { name: 'Ascorbic Acid (Vitamin C, Food Grade)', qty: 0.1, unit: 'g' },
        { name: 'Water', qty: 99.9, unit: 'g' },
      ],
      'beverage',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(false);
    if (gate.hardStop) return;
    expect(gate.paReviewableFindings).toEqual([]);
  });

  it('Sodium benzoate over 0.1% cap in any productClass (MEASURED, universal cap) → hard-stop', () => {
    const findings = checkCompliance(
      [
        { name: 'Sodium Benzoate', qty: 0.2, unit: 'g' },
        { name: 'Water', qty: 99.8, unit: 'g' },
      ],
      'beverage',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(true);
  });

  it('Declaration-trigger finding alone (sulfite 15 ppm, not violated) → cleared', () => {
    // Sulfite at 15 ppm fires the declaration-trigger (≥10 ppm) but doesn't
    // violate the 100 ppm cap. The declaration finding has violated:false,
    // so the gate doesn't act on it. Gate is cleared.
    const findings = checkCompliance(
      [
        { name: 'Sodium Metabisulfite', qty: 0.0015, unit: 'g' },
        { name: 'Water', qty: 99.9985, unit: 'g' },
      ],
      'beverage',
    );
    const gate = evaluateBucketA(findings);
    expect(gate.hardStop).toBe(false);
    if (gate.hardStop) return;
    expect(gate.paReviewableFindings).toEqual([]);
  });
});
