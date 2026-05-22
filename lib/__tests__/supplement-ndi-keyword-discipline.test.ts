// ============================================================
// Wave 1.5d — NDI_TABLE keyword-match discipline refactor
// ------------------------------------------------------------
// Validates the substring-→-whole-word-boundary matching refactor that
// landed in Wave 1.5d (2026-05-18). Three test surfaces:
//
//   1. Choline-family overgeneralization regression guard — bare
//      'choline' keyword no longer substring-matches into
//      phosphatidylcholine / alpha-gpc / cdp-choline.
//
//   2. Whole-word boundary correctness — keywords still match across
//      their intended targets (compound forms, multi-word phrases,
//      hyphenated identifiers).
//
//   3. Expanded partial-token keywords — 'pyridox' → ['pyridoxine',
//      'pyridoxal', 'pyridoxamine'] etc. still classify the catalog
//      entries that pre-refactor were caught via substring matching.
//
// Authoritative-basis discipline (two-state NDI from the Wave 1.5d
// findings): DOCUMENTED entries appear in NDI_TABLE with one of the
// four documented statuses (grandfathered / notified / gras-food /
// required); UNDOCUMENTED entries are deliberately omitted so the
// verbose unmatched advisory fires. Tests assert both states.
// ============================================================

import { describe, it, expect } from 'vitest';
import { classifyIngredientNDI, analyzeNDI } from '../supplementNDI';

// ──────────────────────────────────────────────────────────────
// Surface 1 — Choline-family overgeneralization regression guard
// ──────────────────────────────────────────────────────────────

describe('NDI choline-family — substring overgeneralization fixed (Wave 1.5d)', () => {
  it('bare "Choline" still matches as grandfathered (standalone whole word)', () => {
    const r = classifyIngredientNDI('Choline');
    expect(r.status).toBe('grandfathered');
    expect(r.match?.displayName).toBe('Choline');
  });

  it('"Choline Bitartrate" matches as grandfathered (whole-word "choline" + tail)', () => {
    const r = classifyIngredientNDI('Choline Bitartrate');
    expect(r.status).toBe('grandfathered');
  });

  it('"Phosphatidylcholine (PC 35%, Soy)" surfaces UNMATCHED (no longer over-classified via choline substring)', () => {
    const r = classifyIngredientNDI('Phosphatidylcholine (PC 35%, Soy)');
    expect(r.status).toBe('unknown');
    expect(r.match).toBeUndefined();
    expect(r.advisory).toContain('Not in the platform');
  });

  it('"Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)" surfaces UNMATCHED', () => {
    const r = classifyIngredientNDI('Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)');
    expect(r.status).toBe('unknown');
  });

  it('"Citicoline / CDP-Choline (Cognizin, Kyowa Hakko)" surfaces UNMATCHED', () => {
    // Whole-word "choline" preceded by "cdp-" — hyphen is \W so \b fires
    // at the 'c' of 'choline', which means substring overgeneralization
    // is fixed via the catalog-name parens-stripping discipline (the
    // entry's stripped name 'CDP-Choline' starts with 'cdp-choline'
    // where 'choline' is not a whole word — the test asserts that even
    // with the parenthetical (Citicoline, Cognizin), none of citicoline
    // / cognizin / cdp-choline matches an NDI_TABLE keyword).
    const r = classifyIngredientNDI('Citicoline / CDP-Choline (Cognizin, Kyowa Hakko)');
    expect(r.status).toBe('unknown');
  });
});

// ──────────────────────────────────────────────────────────────
// Surface 2 — Whole-word boundary correctness
// ──────────────────────────────────────────────────────────────

describe('NDI whole-word boundary — keyword discipline holds across compound names', () => {
  it('"garlic" matches "Garlic Extract (Allicin-Standardized, 1.3% Allicin)"', () => {
    const r = classifyIngredientNDI('Garlic Extract (Allicin-Standardized, 1.3% Allicin)');
    expect(r.status).toBe('gras-food');
    expect(r.match?.displayName).toBe('Garlic');
  });

  it('"folate" matches "Vitamin B9 (Folic Acid USP)" (via "folic acid")', () => {
    const r = classifyIngredientNDI('Vitamin B9 (Folic Acid USP)');
    expect(r.status).toBe('grandfathered');
    expect(r.match?.displayName).toBe('Folate');
  });

  it('"biotin" matches "d-Biotin (Vitamin H, USP)"', () => {
    const r = classifyIngredientNDI('d-Biotin (Vitamin H, USP)');
    expect(r.status).toBe('grandfathered');
  });

  it('"methylfolate" matches "Methylfolate (Metafolin / Calcium L-5-MTHF)" as notified', () => {
    const r = classifyIngredientNDI('Methylfolate (Metafolin / Calcium L-5-MTHF)');
    expect(r.status).toBe('notified');
    expect(r.match?.ndiNumber).toContain('NDI 612');
  });

  it('multi-word "ascorbic acid" matches "Vitamin C (Ascorbic Acid USP, Fine)"', () => {
    const r = classifyIngredientNDI('Vitamin C (Ascorbic Acid USP, Fine)');
    expect(r.status).toBe('grandfathered');
  });

  it('hyphenated "beta-carotene" matches "Natural Beta-Carotene 30% Suspension"', () => {
    const r = classifyIngredientNDI('Natural Beta-Carotene 30% Suspension');
    expect(r.status).toBe('grandfathered');
    expect(r.match?.displayName).toBe('Beta-Carotene');
  });

  it('"tocopherol" whole-word-matches "DL-Alpha-Tocopherol Acetate" (hyphen as boundary)', () => {
    const r = classifyIngredientNDI('Vitamin E (DL-Alpha-Tocopherol Acetate)');
    expect(r.status).toBe('grandfathered');
  });
});

// ──────────────────────────────────────────────────────────────
// Surface 3 — Expanded partial-token keywords still match
// ──────────────────────────────────────────────────────────────

describe('NDI partial-token expansion — pyridox / pantothen / cobalamin / ashwagandh / lactobacill', () => {
  it('"Pyridoxine HCl" classifies (was caught by "pyridox" partial-token pre-refactor)', () => {
    const r = classifyIngredientNDI('Vitamin B6 (Pyridoxine HCl)');
    expect(r.status).toBe('grandfathered');
    expect(r.match?.displayName).toBe('Vitamin B6');
  });

  it('"Pyridoxal-5-Phosphate" classifies via "pyridoxal" (expanded)', () => {
    const r = classifyIngredientNDI('Pyridoxal-5-Phosphate (P5P, Active B6)');
    expect(r.status).toBe('grandfathered');
  });

  it('"Calcium d-Pantothenate" classifies via "pantothenate" (expanded)', () => {
    const r = classifyIngredientNDI('Vitamin B5 (Calcium d-Pantothenate)');
    expect(r.status).toBe('grandfathered');
    expect(r.match?.displayName).toBe('Pantothenic Acid (B5)');
  });

  it('"Pantothenic Acid" classifies via "pantothenic acid" (expanded)', () => {
    const r = classifyIngredientNDI('Pantothenic Acid');
    expect(r.status).toBe('grandfathered');
  });

  it('"Cyanocobalamin" classifies via "cyanocobalamin" (expanded — pre-refactor caught via "cobalamin" substring)', () => {
    const r = classifyIngredientNDI('Vitamin B12 (Cyanocobalamin 1% on Mannitol)');
    expect(r.status).toBe('grandfathered');
    expect(r.match?.displayName).toBe('Vitamin B12');
  });

  it('"Methylcobalamin" classifies (already explicit pre-refactor; still works)', () => {
    const r = classifyIngredientNDI('Methylcobalamin (Vitamin B12 Active)');
    expect(r.status).toBe('grandfathered');
  });

  it('"Adenosylcobalamin (Dibencozide)" classifies via "adenosylcobalamin" (expanded)', () => {
    const r = classifyIngredientNDI('Adenosylcobalamin (Dibencozide)');
    expect(r.status).toBe('grandfathered');
  });

  it('"Hydroxocobalamin" classifies via "hydroxocobalamin" (expanded)', () => {
    const r = classifyIngredientNDI('Hydroxocobalamin (B12, Injectable Grade)');
    expect(r.status).toBe('grandfathered');
  });

  it('"Ashwagandha" classifies (was caught by "ashwagandh" partial-token pre-refactor)', () => {
    const r = classifyIngredientNDI('Ashwagandha Root Extract (KSM-66, 5% Withanolides)');
    expect(r.status).toBe('grandfathered');
  });

  it('"Lactobacillus acidophilus" classifies (was caught by "lactobacill" partial-token pre-refactor)', () => {
    const r = classifyIngredientNDI('Lactobacillus acidophilus NCFM');
    expect(r.status).toBe('notified');
    expect(r.match?.displayName).toBe('Probiotic strains');
  });

  it('"Bifidobacterium lactis" classifies (was caught by "bifido" partial-token pre-refactor)', () => {
    const r = classifyIngredientNDI('Bifidobacterium lactis HN019');
    expect(r.status).toBe('notified');
  });

  it('"Saccharomyces boulardii" classifies (was caught by "saccharo" partial-token pre-refactor)', () => {
    const r = classifyIngredientNDI('Saccharomyces boulardii');
    expect(r.status).toBe('notified');
  });
});

// ──────────────────────────────────────────────────────────────
// Surface 4 — Wave 1.5b/c entries — confirm correct classification
// ──────────────────────────────────────────────────────────────

describe('NDI Wave 1.5b/c entries — classification post-refactor', () => {
  it('Caffeine Anhydrous classifies as grandfathered (Wave 1.5d NDI_TABLE addition)', () => {
    const r = classifyIngredientNDI('Caffeine Anhydrous (USP, Pharmaceutical-Grade)');
    expect(r.status).toBe('grandfathered');
    expect(r.match?.displayName).toBe('Caffeine');
    expect(r.match?.note).toContain('21 CFR 182.1180');
  });

  it('Melatonin surfaces UNMATCHED (UNDOCUMENTED per Wave 1.5d two-state discipline; Round 12 PA-research ticket logged)', () => {
    const r = classifyIngredientNDI('Melatonin (USP, Crystalline)');
    expect(r.status).toBe('unknown');
    expect(r.advisory).toContain('Not in the platform');
  });

  it("St. John's Wort surfaces UNMATCHED (UNDOCUMENTED — ethnobotanical use ≠ FDA-recognizable supplement-market evidence; Round 12 PA-research ticket logged)", () => {
    const r = classifyIngredientNDI("St. John's Wort (Hypericum perforatum, 0.3% Hypericin / 3% Hyperforin)");
    expect(r.status).toBe('unknown');
  });

  it('Lecithin (Soy, Liquid, USP) classifies as gras-food (Wave 1.5d NDI_TABLE addition tied to Lecithin entry upgrade)', () => {
    const r = classifyIngredientNDI('Lecithin (Soy, Liquid, USP)');
    expect(r.status).toBe('gras-food');
    expect(r.match?.displayName).toBe('Lecithin');
  });
});

// ──────────────────────────────────────────────────────────────
// Surface 5 — Aggregate analyzeNDI behavior
// ──────────────────────────────────────────────────────────────

describe('analyzeNDI aggregate — multi-ingredient classification bucketing', () => {
  it('mixed multi-vitamin formulation buckets correctly', () => {
    const summary = analyzeNDI([
      'Vitamin B9 (Folic Acid USP)',       // grandfathered
      'd-Biotin (Vitamin H, USP)',          // grandfathered
      'Caffeine Anhydrous (USP, Pharmaceutical-Grade)', // grandfathered (Wave 1.5d)
      'Melatonin (USP, Crystalline)',       // unknown (UNDOCUMENTED)
      'Phosphatidylcholine (PC 35%, Soy)',  // unknown (overgeneralization fixed)
      'Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)', // unknown
    ]);
    expect(summary.grandfathered).toBe(3);
    expect(summary.unknown).toBe(3);
    expect(summary.required).toBe(0);
    expect(summary.hasRisk).toBe(false);
  });

  it('the prior choline-family overgeneralization is gone (counts assertions)', () => {
    // Pre-refactor: all 3 would have classified grandfathered via 'choline' substring.
    // Post-refactor: all 3 should be unknown.
    const summary = analyzeNDI([
      'Phosphatidylcholine (PC 35%, Soy)',
      'Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)',
      'Citicoline / CDP-Choline (Cognizin, Kyowa Hakko)',
    ]);
    expect(summary.grandfathered).toBe(0);
    expect(summary.unknown).toBe(3);
  });
});
