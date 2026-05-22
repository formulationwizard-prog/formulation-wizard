// ============================================================
// Wave 1.5b — synonym backfill on 8 pre-existing catalog entries
// ------------------------------------------------------------
// Each entry gets:
//   • One per-synonym bulk-paste resolution test (asserts the
//     synonym lands the right entry at Tier 1).
//   • Real-world variant tests for typical operator paste shapes.
//
// Plus a CATALOG-WIDE collision detection test that asserts no
// two entries share the same normalized synonym (rulebook §II.8a
// collision discipline).
//
// Entries covered (8):
//   1. Vitamin B5 (Calcium d-Pantothenate)
//   2. Vitamin B9 (Folic Acid USP)
//   3. Methylfolate (Metafolin / Calcium L-5-MTHF)
//   4. Methylfolate (Quatrefolic / Glucosamine L-5-MTHF)
//   5. Melatonin (USP, Crystalline)
//   6. Phosphatidylcholine (PC 35%, Soy)
//   7. Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)
//   8. CDP-Choline (Citicoline, Cognizin)
//
// Disambiguation discipline tests (operator must specify branded
// form for Metafolin vs Quatrefolic; PC does not claim "lecithin"):
//   • Bare "Methylfolate" does NOT silently resolve to either
//     Metafolin or Quatrefolic at Tier 1.
//   • Bare "Lecithin" does NOT resolve to Phosphatidylcholine at
//     Tier 1.
// ============================================================

import { describe, it, expect } from 'vitest';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import {
  findBestMatchWithTier,
  findBySynonym,
  normalizeIngredientName,
  parsePastedFormula,
} from '../parseFormula';

// ──────────────────────────────────────────────────────────────
// Entry 1: Vitamin B5 (Calcium d-Pantothenate)
// Synonyms: ['pantothenic acid', 'vitamin b5', 'b5', 'calcium pantothenate']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b — Vitamin B5 synonym resolution', () => {
  const expectedName = 'd-Calcium Pantothenate (USP, Tier-A, PENDING TIER VERIFICATION)';

  it('"Pantothenic Acid" resolves to B5 at Tier 1', () => {
    const r = findBestMatchWithTier('Pantothenic Acid', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Vitamin B5" resolves to B5 at Tier 1', () => {
    const r = findBestMatchWithTier('Vitamin B5', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"B5" resolves to B5 at Tier 1', () => {
    const r = findBestMatchWithTier('B5', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('bulk-paste "Pantothenic Acid 5 mg" resolves', () => {
    const rows = parsePastedFormula('Pantothenic Acid 5 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 2: Vitamin B9 (Folic Acid USP)
// Synonyms: ['folate', 'folic acid', 'vitamin b9', 'b9']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b — Vitamin B9 (Folic Acid USP) synonym resolution', () => {
  const expectedName = 'Vitamin B9 (Folic Acid USP)';

  it('"Folate" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Folate', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Folic Acid" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Folic Acid', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Folic Acid (synthetic)" resolves (parens stripped)', () => {
    const r = findBestMatchWithTier('Folic Acid (synthetic)', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"folic-acid" resolves (dash to space)', () => {
    const r = findBestMatchWithTier('folic-acid', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"B9" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('B9', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('bulk-paste "Folate 400 mcg" resolves (the test-surfaced gap)', () => {
    const rows = parsePastedFormula('Folate 400 mcg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].parsedQty).toBe(400);
    expect(rows[0].parsedUnit).toBe('mcg');
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 3: Methylfolate (Metafolin / Calcium L-5-MTHF)
// Synonyms: ['metafolin', 'calcium l-5-mthf', 'levomefolate calcium']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b — Metafolin synonym resolution (branded-form discipline)', () => {
  const expectedName = 'Methylfolate (Metafolin / Calcium L-5-MTHF)';

  it('"Metafolin" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Metafolin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Calcium L-5-MTHF" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Calcium L-5-MTHF', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Levomefolate Calcium" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Levomefolate Calcium', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 4: Methylfolate (Quatrefolic / Glucosamine L-5-MTHF)
// Synonyms: ['quatrefolic', 'glucosamine l-5-mthf', '(6s)-5-methyltetrahydrofolic acid']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b — Quatrefolic synonym resolution (branded-form discipline)', () => {
  const expectedName = 'Methylfolate (Quatrefolic / Glucosamine L-5-MTHF)';

  it('"Quatrefolic" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Quatrefolic', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Glucosamine L-5-MTHF" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Glucosamine L-5-MTHF', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────
// Disambiguation discipline — bare "Methylfolate" should NOT
// resolve to either branded form at Tier 1
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b — Methylfolate disambiguation discipline', () => {
  it('bare "Methylfolate" does NOT resolve via synonym (Tier 1) — operator must specify Metafolin or Quatrefolic', () => {
    const synonymHit = findBySynonym('Methylfolate', SUPPLEMENT_INGREDIENTS);
    expect(synonymHit).toBeNull();
  });

  it('bare "5-MTHF" does NOT resolve via synonym (Tier 1)', () => {
    const synonymHit = findBySynonym('5-MTHF', SUPPLEMENT_INGREDIENTS);
    expect(synonymHit).toBeNull();
  });

  it('bare "Methylfolate" resolves at Tier 3 with ambiguity prompt enumerating both branded forms (Wave 1.5d collision-detection fix)', () => {
    // Pre-Wave-1.5d: bare "Methylfolate" silently resolved to whichever
    // branded form appeared first in catalog iteration order (Metafolin),
    // because the Tier 2 stripped-name loop returned first-match-wins.
    // Surfaced via operator browser verification 2026-05-18; bench-test
    // code trace of findBestMatchWithTier predicted the silent
    // substitution before browser confirmed.
    //
    // Wave 1.5d fix: collect all stripped-name matches; if >1, return
    // Tier 3 with reason enumerating candidates. Workspace UI surfaces
    // the existing amber "⚠ Confirm match" prompt with the candidate
    // list — operator picks the right branded form rather than silent
    // substitution.
    const r = findBestMatchWithTier('Methylfolate', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(3);
    expect(r.reason).toContain('multiple branded forms');
    expect(r.reason).toContain('Metafolin');
    expect(r.reason).toContain('Quatrefolic');
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 5: Melatonin (USP, Crystalline)
// Synonyms: ['melatonin', 'n-acetyl-5-methoxytryptamine']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b — Melatonin synonym resolution (single-canonical-name edge case)', () => {
  const expectedName = 'Melatonin (USP, Crystalline)';

  it('"Melatonin" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Melatonin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"N-Acetyl-5-Methoxytryptamine" (IUPAC) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('N-Acetyl-5-Methoxytryptamine', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('bulk-paste "Melatonin 3 mg" resolves', () => {
    const rows = parsePastedFormula('Melatonin 3 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].parsedQty).toBe(3);
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 6: Phosphatidylcholine (PC 35%, Soy)
// Synonyms (Wave 1.5e refinement): ['phosphatidylcholine 35%', 'pc 35%',
// 'soy phosphatidylcholine'] — qualified-form only. Bare 'phosphatidylcholine'
// / 'pc' / 'phosphatidyl choline' deliberately NOT claimed because the
// catalog has harm-critical sibling variants (PC 30% Sunflower allergen-free
// vs PC 35% Soy with Soybeans allergen). Bare paste routes through the
// Wave 1.5e cross-entry semantic check → Tier 3 disambiguation. See
// wave-1-5e-synonym-layer-collision.test.ts for the escalation tests.
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b → 1.5e — Phosphatidylcholine qualified-form synonym resolution', () => {
  const expectedName = 'Phosphatidylcholine (PC 35%, Soy)';

  it('"Phosphatidylcholine 35%" (concentration-qualified) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Phosphatidylcholine 35%', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"PC 35%" (concentration-qualified short form) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('PC 35%', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Soy Phosphatidylcholine" (source-qualified) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Soy Phosphatidylcholine', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });
});

describe('Wave 1.5b — Phosphatidylcholine scope discipline (no lecithin claim)', () => {
  it('bare "Lecithin" does NOT resolve to PC via synonym (Tier 1) — reserved for future dedicated lecithin entry', () => {
    const synonymHit = findBySynonym('Lecithin', SUPPLEMENT_INGREDIENTS);
    // No catalog entry currently claims "lecithin" as a synonym.
    // If a Lecithin entry is added later it should claim this synonym; until
    // then, paste should be a miss rather than a silent substitution.
    expect(synonymHit?.name).not.toBe('Phosphatidylcholine (PC 35%, Soy)');
  });

  it('"Soy Lecithin" does NOT resolve to PC via synonym (Tier 1)', () => {
    const synonymHit = findBySynonym('Soy Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(synonymHit?.name).not.toBe('Phosphatidylcholine (PC 35%, Soy)');
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 7: Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)
// Synonyms (Wave 1.5e refinement): ['alpha-gpc soy', 'soy alpha-gpc']
// — qualified source-explicit forms only. Bare 'alpha-gpc' / 'l-alpha-gpc'
// / 'glycerophosphocholine' deliberately NOT claimed because the catalog
// has Alpha-GPC 50% (AlphaSize, Synthetic) as a harm-critical sibling
// (allergen-free vs this entry's Soybeans allergen). Bare paste routes
// through the Wave 1.5e cross-entry semantic check → Tier 3
// disambiguation. See wave-1-5e-synonym-layer-collision.test.ts for the
// escalation regression tests.
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b → 1.5e — Alpha-GPC qualified-form synonym resolution', () => {
  const expectedName = 'Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)';

  it('"Alpha-GPC Soy" (source-qualified) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Alpha-GPC Soy', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Soy Alpha-GPC" (alternate source-qualified form) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Soy Alpha-GPC', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────
// Entry 8: CDP-Choline (Citicoline, Cognizin)
// Synonyms: ['cdp-choline', 'citicoline', 'cognizin', 'cytidine diphosphate choline']
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5b — CDP-Choline synonym resolution', () => {
  const expectedName = 'Citicoline / CDP-Choline (Cognizin, Kyowa Hakko)';

  it('"CDP-Choline" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('CDP-Choline', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Citicoline" resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Citicoline', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Cognizin" (branded variant) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Cognizin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Cytidine Diphosphate Choline" (technical variant) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Cytidine Diphosphate Choline', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────
// CATALOG-WIDE COLLISION DETECTION
// ------------------------------------------------------------
// Rulebook §II.8a collision discipline: no two entries may share
// the same normalized synonym. This test runs across the entire
// catalog (not just the 8 backfilled entries) so future synonym
// additions can't collide silently.
// ──────────────────────────────────────────────────────────────

describe('Catalog-wide synonym collision detection (§II.8a)', () => {
  it('no two catalog entries share the same normalized synonym', () => {
    const synonymOwners = new Map<string, string[]>();
    for (const entry of SUPPLEMENT_INGREDIENTS) {
      if (!entry.synonyms || entry.synonyms.length === 0) continue;
      for (const syn of entry.synonyms) {
        const normalized = normalizeIngredientName(syn);
        if (!normalized) continue;
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
      // Compose a readable failure message for diagnosis
      const msg = collisions.map(c => `  ${c.synonym}: ${c.owners.join(' ⊕ ')}`).join('\n');
      throw new Error(`Synonym collisions detected:\n${msg}`);
    }
    expect(collisions).toEqual([]);
  });

  it('every entry with synonyms has ≥ 2 names per §IX.40 item 16', () => {
    const violations: string[] = [];
    for (const entry of SUPPLEMENT_INGREDIENTS) {
      if (!entry.synonyms) continue; // pre-Wave-1.5 entries without synonyms are allowed
      if (entry.synonyms.length < 2) {
        violations.push(`${entry.name} (only ${entry.synonyms.length} synonym)`);
      }
    }
    if (violations.length > 0) {
      throw new Error(`Entries with < 2 synonyms (§IX.40 item 16 violation):\n${violations.join('\n')}`);
    }
    expect(violations).toEqual([]);
  });

  it('every backfilled entry from Wave 1.5b has synonyms populated', () => {
    const wave15bEntries = [
      'd-Calcium Pantothenate (USP, Tier-A, PENDING TIER VERIFICATION)',
      'Vitamin B9 (Folic Acid USP)',
      'Methylfolate (Metafolin / Calcium L-5-MTHF)',
      'Methylfolate (Quatrefolic / Glucosamine L-5-MTHF)',
      'Melatonin (USP, Crystalline)',
      'Phosphatidylcholine (PC 35%, Soy)',
      'Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)',
      'Citicoline / CDP-Choline (Cognizin, Kyowa Hakko)',
    ];
    const missing: string[] = [];
    for (const name of wave15bEntries) {
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
