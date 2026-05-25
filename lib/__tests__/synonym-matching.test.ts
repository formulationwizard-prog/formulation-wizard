// ============================================================
// Per-entry synonym matching + parser-side normalization
// ------------------------------------------------------------
// Wave 1.5a architectural commit (2026-05-17). Tests cover:
//
//   1. normalizeIngredientName — lowercase, strip parens / punctuation /
//      dashes, collapse whitespace. Option 1 from rulebook §II.8a.
//
//   2. findBySynonym — per-entry synonym lookup. Returns the entry
//      whose `synonyms[]` array contains a normalized match to the
//      normalized query. Deterministic db-order iteration.
//
//   3. findBestMatchWithTier — synonym matches resolve at Tier 1
//      (catalog authors' high-confidence claim about natural names),
//      not Tier 2.
//
//   4. Real-world variant scenarios — operator paste of "Folate
//      400 mcg" / "folic acid 400mcg" / "FOLIC ACID 400 MCG" all
//      resolve to the same entry. Same for "5-HTP" / "5 htp" / "L-5-HTP".
// ============================================================

import { describe, it, expect } from 'vitest';
import type { IndustrialIngredient } from '../../types';
import {
  normalizeIngredientName,
  findBySynonym,
  findBestMatchWithTier,
  parsePastedFormula,
} from '../parseFormula';

// ──────────────────────────────────────────────────────────────
// Test fixtures
// ──────────────────────────────────────────────────────────────

const folateEntry: IndustrialIngredient = {
  name: 'Vitamin B9 (Folic Acid USP)',
  category: 'Vitamins',
  suppliers: ['DSM Nutritional Products'],
  subIngredients: ['Folic Acid'],
  allergens: [],
  costPerKg: 220,
  nutrition: {},
  notes: 'Test fixture',
  synonyms: ['folate', 'folic acid', 'vitamin b9', 'b9'],
};

const fivehtpEntry: IndustrialIngredient = {
  name: '5-HTP (Griffonia Seed Extract, 99%)',
  category: 'Amino Acids',
  suppliers: ['Sabinsa'],
  subIngredients: ['Griffonia simplicifolia Seed Extract'],
  allergens: [],
  costPerKg: 180,
  nutrition: {},
  notes: 'Test fixture',
  synonyms: ['5-htp', '5 htp', 'l-5-htp', 'l-5-hydroxytryptophan', 'griffonia'],
};

const melatoninEntry: IndustrialIngredient = {
  name: 'Melatonin (USP, Crystalline)',
  category: 'Specialty Compounds',
  suppliers: ['Zhejiang Lianhua Biotech'],
  subIngredients: ['Melatonin'],
  allergens: [],
  costPerKg: 380,
  nutrition: {},
  notes: 'Test fixture',
  synonyms: ['melatonin', 'n-acetyl-5-methoxytryptamine'],
};

const noSynonymsEntry: IndustrialIngredient = {
  name: 'Some Ingredient Without Synonyms',
  category: 'Specialty Compounds',
  suppliers: [],
  subIngredients: [],
  allergens: [],
  costPerKg: 0,
  nutrition: {},
  notes: '',
  // no `synonyms` field
};

const testDb: IndustrialIngredient[] = [folateEntry, fivehtpEntry, melatoninEntry, noSynonymsEntry];

// ──────────────────────────────────────────────────────────────

describe('normalizeIngredientName — case normalization', () => {
  it('lowercases input', () => {
    expect(normalizeIngredientName('FOLATE')).toBe('folate');
    expect(normalizeIngredientName('Folic Acid')).toBe('folic acid');
    expect(normalizeIngredientName('Folate')).toBe('folate');
  });
});

describe('normalizeIngredientName — parenthetical stripping', () => {
  it('strips a single parenthetical', () => {
    expect(normalizeIngredientName('Folic Acid (synthetic)')).toBe('folic acid');
  });

  it('strips multiple parentheticals', () => {
    expect(normalizeIngredientName('Vitamin C (Ascorbic Acid) (USP)')).toBe('vitamin c');
  });

  it('strips USP / NF / FCC qualifiers in parens', () => {
    expect(normalizeIngredientName('Calcium Citrate (USP)')).toBe('calcium citrate');
  });

  it('handles parenthetical at end of string', () => {
    expect(normalizeIngredientName('Folate (USP)')).toBe('folate');
  });

  it('preserves text before parens', () => {
    expect(normalizeIngredientName('Magnesium Glycinate (Albion TRAACS)')).toBe('magnesium glycinate');
  });
});

describe('normalizeIngredientName — dash/slash handling', () => {
  it('maps dashes to spaces', () => {
    expect(normalizeIngredientName('5-HTP')).toBe('5 htp');
    expect(normalizeIngredientName('L-Theanine')).toBe('l theanine');
    expect(normalizeIngredientName('B-12')).toBe('b 12');
  });

  it('maps slashes to spaces', () => {
    expect(normalizeIngredientName('Vit A/C/E')).toBe('vit a c e');
  });

  it('collapses multiple resulting spaces', () => {
    expect(normalizeIngredientName('5--HTP')).toBe('5 htp');
  });
});

describe('normalizeIngredientName — punctuation stripping', () => {
  it('strips commas', () => {
    expect(normalizeIngredientName('Folic Acid, synthetic')).toBe('folic acid synthetic');
  });

  it('strips periods, colons, semicolons', () => {
    expect(normalizeIngredientName('Dr. Smith\'s; Vitamin: B9.')).toBe('dr smiths vitamin b9');
  });
});

describe('normalizeIngredientName — whitespace handling', () => {
  it('collapses multiple spaces', () => {
    expect(normalizeIngredientName('Folic   Acid')).toBe('folic acid');
  });

  it('trims leading/trailing whitespace', () => {
    expect(normalizeIngredientName('  Folate  ')).toBe('folate');
  });

  it('handles tabs and newlines as whitespace', () => {
    expect(normalizeIngredientName('Folic\tAcid\nUSP')).toBe('folic acid usp');
  });
});

describe('normalizeIngredientName — edge cases', () => {
  it('empty string returns empty string', () => {
    expect(normalizeIngredientName('')).toBe('');
  });

  it('whitespace-only returns empty string', () => {
    expect(normalizeIngredientName('   ')).toBe('');
  });

  it('parens-only returns empty string', () => {
    expect(normalizeIngredientName('(synthetic)')).toBe('');
  });

  it('punctuation-only returns empty string', () => {
    expect(normalizeIngredientName('---')).toBe('');
  });
});

describe('normalizeIngredientName — Wave 1.5 target ingredients (real variants)', () => {
  it('Folate variants all normalize the same', () => {
    const target = normalizeIngredientName('folate');
    expect(normalizeIngredientName('Folate')).toBe(target);
    expect(normalizeIngredientName('FOLATE')).toBe(target);
    expect(normalizeIngredientName('  folate  ')).toBe(target);
  });

  it('Folic Acid variants all normalize the same', () => {
    const target = normalizeIngredientName('folic acid');
    expect(normalizeIngredientName('Folic Acid')).toBe(target);
    expect(normalizeIngredientName('FOLIC ACID')).toBe(target);
    expect(normalizeIngredientName('folic-acid')).toBe(target);
    expect(normalizeIngredientName('Folic Acid (synthetic)')).toBe(target);
    expect(normalizeIngredientName('Folic Acid, USP')).toBe('folic acid usp');
  });

  it('5-HTP variants normalize to "5 htp"', () => {
    const target = '5 htp';
    expect(normalizeIngredientName('5-HTP')).toBe(target);
    expect(normalizeIngredientName('5 HTP')).toBe(target);
    expect(normalizeIngredientName('5-htp')).toBe(target);
  });
});

// ──────────────────────────────────────────────────────────────

describe('findBySynonym — exact synonym hit', () => {
  it('finds Folate entry for "folate"', () => {
    const result = findBySynonym('folate', testDb);
    expect(result?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('finds Folate entry for "Folate" (case-different)', () => {
    const result = findBySynonym('Folate', testDb);
    expect(result?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('finds Folate entry for "folic acid"', () => {
    const result = findBySynonym('folic acid', testDb);
    expect(result?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('finds Folate entry for "vitamin b9"', () => {
    const result = findBySynonym('vitamin b9', testDb);
    expect(result?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });
});

describe('findBySynonym — normalization on operator input', () => {
  it('finds Folate for "Folic Acid (synthetic)" (parens stripped)', () => {
    const result = findBySynonym('Folic Acid (synthetic)', testDb);
    expect(result?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('finds Folate for "Folic-Acid" (dash mapped)', () => {
    const result = findBySynonym('Folic-Acid', testDb);
    expect(result?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('finds Folate for "FOLATE" (case)', () => {
    const result = findBySynonym('FOLATE', testDb);
    expect(result?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('finds 5-HTP for "5 htp" (space variant)', () => {
    const result = findBySynonym('5 htp', testDb);
    expect(result?.name).toBe('5-HTP (Griffonia Seed Extract, 99%)');
  });

  it('finds 5-HTP for "5-HTP" (storage variant)', () => {
    const result = findBySynonym('5-HTP', testDb);
    expect(result?.name).toBe('5-HTP (Griffonia Seed Extract, 99%)');
  });

  it('finds 5-HTP for "L-5-HTP" (longer variant)', () => {
    const result = findBySynonym('L-5-HTP', testDb);
    expect(result?.name).toBe('5-HTP (Griffonia Seed Extract, 99%)');
  });
});

describe('findBySynonym — miss cases', () => {
  it('returns null for unrelated name', () => {
    const result = findBySynonym('Definitely Not An Ingredient XYZ123', testDb);
    expect(result).toBeNull();
  });

  it('returns null for empty input', () => {
    const result = findBySynonym('', testDb);
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    const result = findBySynonym('   ', testDb);
    expect(result).toBeNull();
  });

  it('returns null when entry has no synonyms field', () => {
    const partialDb: IndustrialIngredient[] = [noSynonymsEntry];
    const result = findBySynonym('Some Ingredient', partialDb);
    expect(result).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────

describe('findBestMatchWithTier — synonym matches resolve at Tier 1', () => {
  it('"Folate" resolves at Tier 1 via synonyms', () => {
    const result = findBestMatchWithTier('Folate', testDb);
    expect(result.item?.name).toBe('Vitamin B9 (Folic Acid USP)');
    expect(result.tier).toBe(1);
  });

  it('"Folic Acid" resolves at Tier 1 via synonyms', () => {
    const result = findBestMatchWithTier('Folic Acid', testDb);
    expect(result.item?.name).toBe('Vitamin B9 (Folic Acid USP)');
    expect(result.tier).toBe(1);
  });

  it('"5-HTP" resolves at Tier 1 via synonyms', () => {
    const result = findBestMatchWithTier('5-HTP', testDb);
    expect(result.item?.name).toBe('5-HTP (Griffonia Seed Extract, 99%)');
    expect(result.tier).toBe(1);
  });

  it('exact catalog-name match still wins (Tier 1) without going through synonym path', () => {
    const result = findBestMatchWithTier('Vitamin B9 (Folic Acid USP)', testDb);
    expect(result.item?.name).toBe('Vitamin B9 (Folic Acid USP)');
    expect(result.tier).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────

describe('parsePastedFormula — bulk-paste resolution via synonyms (end-to-end)', () => {
  it('"Folate 400 mcg" resolves to Folate entry', () => {
    const rows = parsePastedFormula('Folate 400 mcg', testDb);
    expect(rows[0].matchedItem?.name).toBe('Vitamin B9 (Folic Acid USP)');
    expect(rows[0].parsedQty).toBe(400);
    expect(rows[0].parsedUnit).toBe('mcg');
  });

  it('"folic acid 400 mcg" (lowercase) resolves', () => {
    const rows = parsePastedFormula('folic acid 400 mcg', testDb);
    expect(rows[0].matchedItem?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('"FOLIC ACID 400 MCG" (all-caps) resolves', () => {
    const rows = parsePastedFormula('FOLIC ACID 400 MCG', testDb);
    expect(rows[0].matchedItem?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('"Folic Acid (synthetic) 400 mcg" resolves (parens stripped)', () => {
    const rows = parsePastedFormula('Folic Acid (synthetic) 400 mcg', testDb);
    expect(rows[0].matchedItem?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('"folic-acid 400mcg" (hyphenated, no space) resolves', () => {
    const rows = parsePastedFormula('folic-acid 400mcg', testDb);
    expect(rows[0].matchedItem?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('"Vitamin B9 400 mcg" resolves', () => {
    const rows = parsePastedFormula('Vitamin B9 400 mcg', testDb);
    expect(rows[0].matchedItem?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('"B9 400 mcg" resolves via short-form synonym', () => {
    const rows = parsePastedFormula('B9 400 mcg', testDb);
    expect(rows[0].matchedItem?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('"Melatonin 3 mg" resolves to Melatonin entry', () => {
    const rows = parsePastedFormula('Melatonin 3 mg', testDb);
    expect(rows[0].matchedItem?.name).toBe('Melatonin (USP, Crystalline)');
  });

  it('"5-HTP 100 mg" resolves to 5-HTP entry', () => {
    const rows = parsePastedFormula('5-HTP 100 mg', testDb);
    expect(rows[0].matchedItem?.name).toBe('5-HTP (Griffonia Seed Extract, 99%)');
  });

  it('"L-5-HTP 100 mg" resolves to 5-HTP entry (longer-form synonym)', () => {
    const rows = parsePastedFormula('L-5-HTP 100 mg', testDb);
    expect(rows[0].matchedItem?.name).toBe('5-HTP (Griffonia Seed Extract, 99%)');
  });
});

// ──────────────────────────────────────────────────────────────
// findBestMatchWithTier — head-token length-difference guard
// ------------------------------------------------------------
// Regression test for the 2026-05-25 Tridiv catalog-completeness
// external-trial finding: operator pasted "Anchovies (Paste)"
// (queryHead "anchovies", 9 chars), matcher iterated to
// "Ancho Chile Powder" (itemHead "ancho", 5 chars), the
// bidirectional `startsWith` check returned true because
// `"anchovies".startsWith("ancho")`, and the matcher confidently
// suggested chili pepper as a Tier-3 substitution for a fish
// ingredient — a clear semantic-category mismatch.
//
// Fix: headTokensMatch helper requires length difference ≤ 2
// when using `startsWith` fuzzy match. Keeps legitimate
// singular/plural and spelling variations (almond↔almonds 1,
// anchovy↔anchovies 2, tomato↔tomatoes 2) while rejecting the
// short-prefix-of-different-word bug shape (ancho vs anchovies 4).
// ──────────────────────────────────────────────────────────────

const anchoChileEntry: IndustrialIngredient = {
  name: 'Ancho Chile Powder',
  category: 'Spices',
  suppliers: ['McCormick Industrial'],
  subIngredients: ['Ancho Chile'],
  allergens: [],
  costPerKg: 14,
  nutrition: {},
  notes: 'Test fixture for head-token length-diff regression guard.',
};

const anchoviesPasteEntry: IndustrialIngredient = {
  name: 'Anchovies (Paste)',
  category: 'Condiment Ingredients',
  suppliers: ['Cento', 'Roland Foods'],
  subIngredients: ['Anchovies', 'Olive Oil', 'Salt'],
  allergens: ['Fish'],
  costPerKg: 26,
  nutrition: {},
  notes: 'Test fixture for head-token length-diff regression guard.',
};

describe('findBestMatchWithTier — head-token length-difference guard (Anchovies/Ancho regression)', () => {
  it('"Anchovies (Paste)" does NOT match "Ancho Chile Powder" via short-prefix similarity', () => {
    // Pre-fix: bidirectional startsWith returned true for "anchovies"
    // starting with "ancho", elevating Ancho Chile Powder to Tier 3.
    // Post-fix: length diff of 4 (9 - 5) exceeds the ≤2 threshold,
    // headMatch returns false, no candidates have head/tail overlap
    // sufficient for Tier 1/2/3 → result is Tier 4 (no confident match).
    const dbWithOnlyAncho: IndustrialIngredient[] = [anchoChileEntry];
    const result = findBestMatchWithTier('Anchovies (Paste)', dbWithOnlyAncho);
    expect(result.item).toBeNull();
    expect(result.tier).toBe(4);
  });

  it('"Anchovies (Paste)" matches "Anchovies (Paste)" exactly at Tier 1 when present', () => {
    const dbWithBoth: IndustrialIngredient[] = [anchoChileEntry, anchoviesPasteEntry];
    const result = findBestMatchWithTier('Anchovies (Paste)', dbWithBoth);
    expect(result.item?.name).toBe('Anchovies (Paste)');
    expect(result.tier).toBe(1);
  });

  it('"Anchovies" (no paste qualifier) matches "Anchovies (Paste)" via stripped-name match', () => {
    const dbWithBoth: IndustrialIngredient[] = [anchoChileEntry, anchoviesPasteEntry];
    const result = findBestMatchWithTier('Anchovies', dbWithBoth);
    expect(result.item?.name).toBe('Anchovies (Paste)');
    // Stripped-name match elevates to Tier 1; head-token guard never
    // fires because exact stripped match takes precedence.
  });

  it('legitimate plural→singular still works (length diff 1: "almonds" ↔ "almond")', () => {
    const almondMealEntry: IndustrialIngredient = {
      name: 'Almond Meal',
      category: 'Bakery',
      suppliers: ['Blue Diamond'],
      subIngredients: ['Almonds'],
      allergens: ['Tree Nuts'],
      costPerKg: 18,
      nutrition: {},
      notes: 'Test fixture for legitimate length-1 variation.',
    };
    const result = findBestMatchWithTier('Almonds', [almondMealEntry]);
    // queryHead "almonds" (7), itemHead "almond" (6), diff 1 → headMatch true
    // No tail tokens in query → single-token head match against multi-token catalog name
    // → Tier 3 (head matches but supporting tokens differ)
    expect(result.item?.name).toBe('Almond Meal');
    expect(result.tier).toBe(3);
  });

  it('legitimate spelling variant still works (length diff 2: "anchovy" ↔ "anchovies")', () => {
    const result = findBestMatchWithTier('Anchovy', [anchoviesPasteEntry]);
    // queryHead "anchovy" (7), itemHead "anchovies" (9), diff 2 → headMatch true
    // (passes the ≤2 threshold; spelling-variant case)
    expect(result.item?.name).toBe('Anchovies (Paste)');
    expect(result.tier).toBeLessThanOrEqual(3);
  });
});
