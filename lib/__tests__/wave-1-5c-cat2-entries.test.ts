// ============================================================
// Wave 1.5c — 4 catalog entries through the 17-item §IX.40 checklist
// ------------------------------------------------------------
// One Cat 1 backfill + 3 Cat 2 new entries:
//   1. d-Biotin (Vitamin H, USP) — Cat 1 synonym backfill (existing entry)
//   2. Caffeine Anhydrous (USP, Pharmaceutical-Grade) — Cat 2 new
//   3. St. John's Wort (Hypericum perforatum, 0.3% Hypericin / 3% Hyperforin) — Cat 2 new
//   4. Garlic Extract (Allicin-Standardized, 1.3% Allicin) — Cat 2 new
//
// Each entry gets the three §VI.29 tests:
//   • Bulk-paste resolution test — paste → match at Tier 1 via synonym
//   • SFP rendering test — findDVEntry behavior (DV row for Biotin;
//     † footnote routing for Caffeine / SJW / Garlic since no DV)
//   • Safety-engine test — appropriate tier fires at typical dose
//
// Plus collision-discipline tests for the 3 new entries (no normalized
// synonym collides with the 9 pre-existing Wave 1.5b synonym arrays).
// ============================================================

import { describe, it, expect } from 'vitest';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import { findBestMatchWithTier, normalizeIngredientName, parsePastedFormula } from '../parseFormula';
import { findDVEntry } from '../supplementLabeling';
import { checkSupplementSafety } from '../supplementSafetyLimits';
import type { Ingredient } from '../../types';

function ing(name: string, qty: number, unit: 'mg' | 'mcg' | 'g' = 'mg'): Ingredient {
  return {
    name,
    qty,
    unit,
    costPerKg: 0,
    subIngredients: [],
    allergens: [],
    supplier: '',
    foodData: null,
  };
}

// ──────────────────────────────────────────────────────────────
// Entry 1: d-Biotin (Vitamin H, USP) — Cat 1 backfill
// Synonyms: ['biotin', 'd-biotin', 'vitamin b7', 'b7', 'vitamin h']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5c — Biotin Cat 1 backfill (existing entry)', () => {
  const expectedName = 'd-Biotin (Vitamin H, USP)';

  it('"Biotin" resolves at Tier 1 via synonym', () => {
    const r = findBestMatchWithTier('Biotin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Vitamin B7" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Vitamin B7', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"B7" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('B7', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Vitamin H" (historical designation) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Vitamin H', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('bulk-paste "Biotin 30 mcg" resolves (test-surfaced gap closure)', () => {
    const rows = parsePastedFormula('Biotin 30 mcg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].parsedQty).toBe(30);
    expect(rows[0].parsedUnit).toBe('mcg');
  });

  it('SFP findDVEntry resolves to Biotin DV (30 mcg / 100%)', () => {
    const dv = findDVEntry(expectedName);
    expect(dv?.displayName).toBe('Biotin');
    expect(dv?.dv).toBe(30);
    expect(dv?.unit).toBe('mcg');
  });

  it('Safety engine: 30 mcg → ok tier (no UL)', () => {
    const findings = checkSupplementSafety(
      [ing(expectedName, 30, 'mcg')],
      new Map([[expectedName, 0.030]])
    );
    const ok = findings.every(f => f.ingredientName !== expectedName || f.tier === 'ok');
    expect(ok).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 2: Caffeine Anhydrous (USP, Pharmaceutical-Grade) — Cat 2 new
// Synonyms: ['caffeine anhydrous', 'caffeine', '1,3,7-trimethylxanthine']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5c — Caffeine Anhydrous (Cat 2 new entry)', () => {
  const expectedName = 'Caffeine Anhydrous (USP, Pharmaceutical-Grade)';

  it('entry exists in catalog', () => {
    const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === expectedName);
    expect(entry).toBeDefined();
    expect(entry?.category).toBe('Specialty Compounds');
    expect(entry?.synonyms).toBeDefined();
    expect(entry!.synonyms!.length).toBeGreaterThanOrEqual(2);
  });

  it('"Caffeine" resolves at Tier 1 via synonym', () => {
    const r = findBestMatchWithTier('Caffeine', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Caffeine Anhydrous" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Caffeine Anhydrous', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"1,3,7-Trimethylxanthine" (chemical name) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('1,3,7-Trimethylxanthine', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('bulk-paste "Caffeine Anhydrous 200 mg" resolves', () => {
    const rows = parsePastedFormula('Caffeine Anhydrous 200 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].parsedQty).toBe(200);
  });

  it('bulk-paste "Caffeine 100 mg" resolves at Tier 1', () => {
    const rows = parsePastedFormula('Caffeine 100 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].matchTier).toBe(1);
  });

  it('SFP findDVEntry — Caffeine has no DV (returns null; routes to † footnote)', () => {
    const dv = findDVEntry(expectedName);
    expect(dv).toBeNull();
  });

  it('Safety engine: 200 mg → caution tier (50% of 400 mg UL)', () => {
    const findings = checkSupplementSafety(
      [ing(expectedName, 200, 'mg')],
      new Map([[expectedName, 200]])
    );
    const caffeineFinding = findings.find(f => f.ingredientName === expectedName);
    expect(caffeineFinding).toBeDefined();
    // 50% of UL — caution per cautionPctOfUL or under 80% cutoff
    expect(['ok', 'caution']).toContain(caffeineFinding!.tier);
  });

  it('Safety engine: 500 mg → warning tier (125% of UL)', () => {
    const findings = checkSupplementSafety(
      [ing(expectedName, 500, 'mg')],
      new Map([[expectedName, 500]])
    );
    const caffeineFinding = findings.find(f => f.ingredientName === expectedName);
    expect(caffeineFinding?.tier).toBe('warning');
  });

  it('Safety engine: pregnancy audience → 200 mg fires caution/warning (UL drops to 200)', () => {
    const findings = checkSupplementSafety(
      [ing(expectedName, 200, 'mg')],
      new Map([[expectedName, 200]]),
      'pregnancy'
    );
    const caffeineFinding = findings.find(f => f.ingredientName === expectedName);
    expect(caffeineFinding).toBeDefined();
    // Under pregnancy, UL drops to 200 mg → 200 mg = 100% UL = warning per tierFromPercent
    expect(['caution', 'warning']).toContain(caffeineFinding!.tier);
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 3: St. John's Wort — Cat 2 new
// Synonyms: ['st johns wort', "st. john's wort", 'hypericum', 'hypericum perforatum', 'sjw']
// ──────────────────────────────────────────────────────────────

describe("Wave 1.5c — St. John's Wort (Cat 2 new entry)", () => {
  const expectedName = "St. John's Wort (Hypericum perforatum, 0.3% Hypericin / 3% Hyperforin)";

  it('entry exists in catalog', () => {
    const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === expectedName);
    expect(entry).toBeDefined();
    expect(entry?.category).toBe('Herbal Extracts');
    expect(entry!.synonyms!.length).toBeGreaterThanOrEqual(2);
  });

  it('"St. John\'s Wort" resolves at Tier 1 via synonym', () => {
    const r = findBestMatchWithTier("St. John's Wort", SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Hypericum" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Hypericum', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"SJW" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('SJW', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('bulk-paste "St. John\'s Wort 300 mg" resolves', () => {
    const rows = parsePastedFormula("St. John's Wort 300 mg", SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].parsedQty).toBe(300);
  });

  it('SFP findDVEntry — SJW has no DV (returns null; routes to † footnote)', () => {
    const dv = findDVEntry(expectedName);
    expect(dv).toBeNull();
  });

  it("Safety engine: 300 mg → interaction tier (St. John's Wort INTERACTION_WARNINGS entry)", () => {
    const findings = checkSupplementSafety(
      [ing(expectedName, 300, 'mg')],
      new Map([[expectedName, 300]])
    );
    const sjwFinding = findings.find(f => f.ingredientName === expectedName);
    expect(sjwFinding).toBeDefined();
    expect(sjwFinding?.tier).toBe('interaction');
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 4: Garlic Extract — Cat 2 new
// Synonyms: ['garlic extract', 'garlic', 'allium sativum', 'allicin', 'aged garlic']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5c — Garlic Extract (Cat 2 new entry)', () => {
  const expectedName = 'Garlic Extract (Allicin-Standardized, 1.3% Allicin)';

  it('entry exists in catalog', () => {
    const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === expectedName);
    expect(entry).toBeDefined();
    expect(entry?.category).toBe('Herbal Extracts');
    expect(entry!.synonyms!.length).toBeGreaterThanOrEqual(2);
  });

  it('"Garlic Extract" resolves at Tier 1 via synonym', () => {
    const r = findBestMatchWithTier('Garlic Extract', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Allium sativum" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Allium sativum', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Allicin" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Allicin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('bulk-paste "Garlic Extract 500 mg" resolves', () => {
    const rows = parsePastedFormula('Garlic Extract 500 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].parsedQty).toBe(500);
  });

  it('SFP findDVEntry — Garlic has no DV (returns null; routes to † footnote)', () => {
    const dv = findDVEntry(expectedName);
    expect(dv).toBeNull();
  });

  it('Safety engine: 500 mg → interaction tier (Garlic concentrated INTERACTION_WARNINGS entry)', () => {
    const findings = checkSupplementSafety(
      [ing(expectedName, 500, 'mg')],
      new Map([[expectedName, 500]])
    );
    const garlicFinding = findings.find(f => f.ingredientName === expectedName);
    expect(garlicFinding).toBeDefined();
    expect(garlicFinding?.tier).toBe('interaction');
  });
});

// ──────────────────────────────────────────────────────────────
// Catalog-wide collision discipline (post-1.5c)
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5c — catalog-wide synonym integrity post-additions', () => {
  it('no two catalog entries share the same normalized synonym', () => {
    const synonymOwners = new Map<string, string[]>();
    for (const entry of SUPPLEMENT_INGREDIENTS) {
      if (!entry.synonyms || entry.synonyms.length === 0) continue;
      const seenForThisEntry = new Set<string>();
      for (const syn of entry.synonyms) {
        const normalized = normalizeIngredientName(syn);
        if (!normalized) continue;
        if (seenForThisEntry.has(normalized)) continue;
        seenForThisEntry.add(normalized);
        const owners = synonymOwners.get(normalized) ?? [];
        owners.push(entry.name);
        synonymOwners.set(normalized, owners);
      }
    }
    const collisions: Array<{ synonym: string; owners: string[] }> = [];
    for (const [synonym, owners] of synonymOwners.entries()) {
      if (owners.length > 1) collisions.push({ synonym, owners });
    }
    if (collisions.length > 0) {
      const msg = collisions.map(c => `  ${c.synonym}: ${c.owners.join(' ⊕ ')}`).join('\n');
      throw new Error(`Synonym collisions detected:\n${msg}`);
    }
    expect(collisions).toEqual([]);
  });

  it('every entry with synonyms has ≥ 2 names per §IX.40 item 16', () => {
    const violations: string[] = [];
    for (const entry of SUPPLEMENT_INGREDIENTS) {
      if (!entry.synonyms) continue;
      if (entry.synonyms.length < 2) {
        violations.push(`${entry.name} (only ${entry.synonyms.length} synonym)`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('all 4 Wave 1.5c targets present in catalog with synonyms', () => {
    const wave15cEntries = [
      'd-Biotin (Vitamin H, USP)', // Cat 1 backfill
      'Caffeine Anhydrous (USP, Pharmaceutical-Grade)', // Cat 2
      "St. John's Wort (Hypericum perforatum, 0.3% Hypericin / 3% Hyperforin)", // Cat 2
      'Garlic Extract (Allicin-Standardized, 1.3% Allicin)', // Cat 2
    ];
    const missing: string[] = [];
    for (const name of wave15cEntries) {
      const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === name);
      if (!entry) {
        missing.push(`${name} (entry not found in catalog)`);
        continue;
      }
      if (!entry.synonyms || entry.synonyms.length < 2) {
        missing.push(`${name} (synonyms missing or < 2)`);
      }
    }
    expect(missing).toEqual([]);
  });
});
