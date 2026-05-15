// ============================================================
// Section 3b.1 — Context-independent regulatory-limit corrections
// ------------------------------------------------------------
// Verifies the three corrections that don't depend on Path A
// productClass plumbing:
//   1. Sulfite trailing-space substring precision — bare 'sulfite'
//      replaced with 'sulfite ' to avoid false positives on
//      "sulfite-free", "no sulfites added" etc.
//   2. Sulfite declaration-trigger gate at 10 ppm (21 CFR 101.100)
//      independent of the 100 ppm cap (21 CFR 182.3862)
//   3. Combined-budget aggregation for Binders (dairy) + Binders
//      (soy) sharing 3.5% per 9 CFR 319.140 — individual entries
//      under cap can still violate combined
// ============================================================

import { describe, it, expect } from 'vitest';
import { findLimit, checkCompliance } from '../regulatoryLimits';

describe('Section 3b.1 — substring precision (sulfite trailing-space pattern)', () => {

  it('matches "Sodium Metabisulfite" (specific salt pattern unchanged)', () => {
    const limit = findLimit('Sodium Metabisulfite');
    expect(limit).not.toBeNull();
    expect(limit?.shortName).toBe('Sulfites');
  });

  it('matches "Sodium Bisulfite" (specific salt pattern unchanged)', () => {
    const limit = findLimit('Sodium Bisulfite');
    expect(limit?.shortName).toBe('Sulfites');
  });

  it('matches "Potassium Metabisulfite" (specific salt pattern unchanged)', () => {
    const limit = findLimit('Potassium Metabisulfite');
    expect(limit?.shortName).toBe('Sulfites');
  });

  it('matches "Sulfite Solution (Wine Preservative)" (trailing-space pattern catches positive use)', () => {
    const limit = findLimit('Sulfite Solution (Wine Preservative)');
    expect(limit?.shortName).toBe('Sulfites');
  });

  it('does NOT match "Sulfite-Free Beverage Base" (substring collision avoided)', () => {
    // Pre-fix: bare 'sulfite' pattern would match this; trailing-space
    // pattern doesn't (hyphen, not space, follows "sulfite").
    const limit = findLimit('Sulfite-Free Beverage Base');
    expect(limit).toBeNull();
  });

  it('does NOT match "Apple Juice (No Sulfites Added)" via the trailing-space pattern alone', () => {
    // Note: the bare 'sulfite ' pattern doesn't catch the plural "sulfites".
    // This is consistent with the BHA/BHT pattern discipline — defensive
    // narrowness with the catch-all, specific salts caught by their own
    // dedicated patterns. False-negative on negation phrasing accepted
    // as the lesser harm vs. false-positive on negation phrasing.
    const limit = findLimit('Apple Juice (No Sulfites Added)');
    expect(limit).toBeNull();
  });
});

describe('Section 3b.1 — declaration-trigger gate (sulfites 10 ppm per 21 CFR 101.100)', () => {

  it('5 ppm sulfite (under both trigger and cap) → main finding compliant, NO declaration finding', () => {
    // 0.0005 g sulfite + 99.9995 g water in 100g formulation:
    //   ppm = (0.0005 / 100) × 1,000,000 = 5 ppm
    const findings = checkCompliance([
      { name: 'Sodium Metabisulfite', qty: 0.0005, unit: 'g' },
      { name: 'Water', qty: 99.9995, unit: 'g' },
    ]);
    const sulfiteFindings = findings.filter(f => f.limit.shortName === 'Sulfites');
    expect(sulfiteFindings.length).toBe(1);
    expect(sulfiteFindings[0].violated).toBe(false);
    expect(sulfiteFindings[0].declarationTriggered).toBeUndefined();
  });

  it('15 ppm sulfite (over trigger, under cap) → main finding compliant + declaration finding fires', () => {
    // 0.0015 g sulfite + 99.9985 g water = 15 ppm
    const findings = checkCompliance([
      { name: 'Sodium Metabisulfite', qty: 0.0015, unit: 'g' },
      { name: 'Water', qty: 99.9985, unit: 'g' },
    ]);
    const sulfiteFindings = findings.filter(f => f.limit.shortName === 'Sulfites');
    expect(sulfiteFindings.length).toBe(2);
    const main = sulfiteFindings.find(f => !f.declarationTriggered);
    const declaration = sulfiteFindings.find(f => f.declarationTriggered === true);
    expect(main).toBeDefined();
    expect(main?.violated).toBe(false); // under 100 ppm cap
    expect(declaration).toBeDefined();
    expect(declaration?.violated).toBe(false); // declaration-required, not a violation
    // utilization on declaration finding is computed against the 10 ppm trigger
    expect(declaration?.utilization).toBeCloseTo(150, 0); // 15/10 × 100 = 150%
  });

  it('120 ppm sulfite (over cap, also over trigger) → main finding violated + declaration finding fires', () => {
    // 0.012 g sulfite + 99.988 g water = 120 ppm
    const findings = checkCompliance([
      { name: 'Sodium Metabisulfite', qty: 0.012, unit: 'g' },
      { name: 'Water', qty: 99.988, unit: 'g' },
    ]);
    const sulfiteFindings = findings.filter(f => f.limit.shortName === 'Sulfites');
    expect(sulfiteFindings.length).toBe(2);
    const main = sulfiteFindings.find(f => !f.declarationTriggered);
    const declaration = sulfiteFindings.find(f => f.declarationTriggered === true);
    expect(main?.violated).toBe(true); // over 100 ppm cap
    expect(declaration?.violated).toBe(false); // declaration finding tracks labeling, not cap
    expect(declaration?.declarationTriggered).toBe(true);
  });

  it('exactly 10 ppm sulfite (boundary) → declaration finding fires', () => {
    // Boundary check: ≥ 10 ppm triggers per directive spec
    const findings = checkCompliance([
      { name: 'Sodium Metabisulfite', qty: 0.001, unit: 'g' },
      { name: 'Water', qty: 99.999, unit: 'g' },
    ]);
    const declaration = findings.find(
      f => f.limit.shortName === 'Sulfites' && f.declarationTriggered === true
    );
    expect(declaration).toBeDefined();
  });
});

describe('Section 3b.1 — combined-budget aggregation (meat-binder per 9 CFR 319.140)', () => {

  it('2% NFDM alone (single member, under 3.5% cap) → individual finding compliant, NO combined finding', () => {
    const findings = checkCompliance([
      { name: 'Non-Fat Dry Milk', qty: 2, unit: 'g' },
      { name: 'Water', qty: 98, unit: 'g' },
    ]);
    const nfdmFinding = findings.find(f => f.limit.shortName === 'Binders (dairy)');
    expect(nfdmFinding?.violated).toBe(false);
    const combined = findings.find(f => f.combinedBudget !== undefined);
    expect(combined).toBeUndefined();
  });

  it('1% NFDM + 1% Soy Protein Isolate (combined 2%, under cap) → both individuals compliant, combined finding compliant', () => {
    const findings = checkCompliance([
      { name: 'Non-Fat Dry Milk', qty: 1, unit: 'g' },
      { name: 'Soy Protein Isolate', qty: 1, unit: 'g' },
      { name: 'Water', qty: 98, unit: 'g' },
    ]);
    const dairy = findings.find(
      f => f.limit.shortName === 'Binders (dairy)' && !f.combinedBudget
    );
    const soy = findings.find(
      f => f.limit.shortName === 'Binders (soy)' && !f.combinedBudget
    );
    const combined = findings.find(f => f.combinedBudget !== undefined);
    expect(dairy?.violated).toBe(false);
    expect(soy?.violated).toBe(false);
    expect(combined).toBeDefined();
    expect(combined?.violated).toBe(false); // 2% combined ≤ 3.5%
    expect(combined?.combinedBudget?.group).toBe('meat-binder');
    expect(combined?.combinedBudget?.memberIngredientNames).toEqual(['Non-Fat Dry Milk', 'Soy Protein Isolate']);
  });

  it('2% NFDM + 2% Soy Protein Isolate (combined 4%, over 3.5%) → both individuals COMPLIANT, combined finding VIOLATED', () => {
    // The load-bearing case for Section 3b.1 — individual entries under
    // their per-entry cap (2% < 3.5%) but combined total (4% > 3.5%)
    // exceeds the shared budget. Pre-fix engine would clear this as
    // compliant; post-fix surfaces the combined-budget violation.
    const findings = checkCompliance([
      { name: 'Non-Fat Dry Milk', qty: 2, unit: 'g' },
      { name: 'Soy Protein Isolate', qty: 2, unit: 'g' },
      { name: 'Water', qty: 96, unit: 'g' },
    ]);
    const dairy = findings.find(
      f => f.limit.shortName === 'Binders (dairy)' && !f.combinedBudget
    );
    const soy = findings.find(
      f => f.limit.shortName === 'Binders (soy)' && !f.combinedBudget
    );
    const combined = findings.find(f => f.combinedBudget !== undefined);
    // Individuals under per-entry cap
    expect(dairy?.violated).toBe(false);
    expect(soy?.violated).toBe(false);
    // Combined VIOLATES the shared budget
    expect(combined?.violated).toBe(true);
    expect(combined?.currentPercent).toBeCloseTo(4, 2);
    expect(combined?.utilization).toBeCloseTo(114.29, 1); // 4 / 3.5 × 100
    expect(combined?.ingredientName).toContain('Binders');
  });

  it('combined-budget finding uses distinct shortNames (no duplicates if multiple members share a limit entry)', () => {
    // NFDM and Sodium Caseinate both resolve to Binders (dairy). Should
    // de-duplicate in the synthesized ingredientName.
    const findings = checkCompliance([
      { name: 'Non-Fat Dry Milk', qty: 1.5, unit: 'g' },
      { name: 'Sodium Caseinate', qty: 1.5, unit: 'g' },
      { name: 'Soy Protein Isolate', qty: 1.5, unit: 'g' },
      { name: 'Water', qty: 95.5, unit: 'g' },
    ]);
    const combined = findings.find(f => f.combinedBudget !== undefined);
    expect(combined).toBeDefined();
    // 4.5% combined > 3.5% cap
    expect(combined?.violated).toBe(true);
    expect(combined?.ingredientName).toBe('Combined: Binders (dairy) + Binders (soy)');
    // Three member ingredients all listed
    expect(combined?.combinedBudget?.memberIngredientNames.length).toBe(3);
  });
});
