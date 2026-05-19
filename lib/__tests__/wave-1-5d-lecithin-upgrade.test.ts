// ============================================================
// Wave 1.5d — Lecithin (Soy, Liquid, USP) entry upgrade
// ------------------------------------------------------------
// The §38a grep-gap finding (2026-05-18 operator verification) surfaced
// that the 1.5b commit's "reserved for future dedicated lecithin entry"
// note was incorrect — Lecithin (Soy, Liquid, USP) already exists in
// the Excipients category. Pre-1.5d the entry was F&B-era shape:
// missing synonyms, regulatoryStatus, pharmacopeialReference,
// coaTemplateType. Operator paste of "Soy Lecithin" resolved via
// implicit Tier 1 single-sub-ingredient match (subIngredients matches
// query name exactly), not explicit Tier 1 synonym match.
//
// Wave 1.5d upgrade made the resolution explicit:
//   • synonyms: ['soy lecithin', 'lecithin']
//   • regulatoryStatus: 'GRAS' (21 CFR 184.1400)
//   • pharmacopeialReference: 'USP-NF'
//   • coaTemplateType: 'extract'
//
// Plus added 'lecithin' keyword to NDI_TABLE as gras-food (covered by
// supplement-ndi-keyword-discipline.test.ts).
// ============================================================

import { describe, it, expect } from 'vitest';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import { findBestMatchWithTier, findBySynonym, parsePastedFormula } from '../parseFormula';

const expectedName = 'Lecithin (Soy, Liquid, USP)';

describe('Wave 1.5d → 1.5e — Lecithin entry qualified-form synonym resolution', () => {
  // Wave 1.5e refinement: 'lecithin' (bare technical name) NO LONGER claimed
  // on Soy Lecithin entry because the catalog has a Sunflower Lecithin
  // sibling with different allergen profile. Bare 'lecithin' paste routes
  // through the cross-entry semantic check → Tier 3 disambiguation (covered
  // in wave-1-5e-synonym-layer-collision.test.ts). Qualified-form synonyms
  // 'soy lecithin' and 'soybean lecithin' are retained for operators who
  // explicitly specify the soy source — no ambiguity, Tier 1 unchanged.

  it('"Soy Lecithin" (source-qualified) resolves at Tier 1 via synonym', () => {
    const r = findBestMatchWithTier('Soy Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('"Soybean Lecithin" (alternate source-qualified spelling) resolves at Tier 1', () => {
    const r = findBestMatchWithTier('Soybean Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe(expectedName);
    expect(r.tier).toBe(1);
  });

  it('findBySynonym("Soy Lecithin") returns the Lecithin entry directly', () => {
    const r = findBySynonym('Soy Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r?.name).toBe(expectedName);
  });

  it('bulk-paste "Soy Lecithin 100 mg" resolves cleanly at Tier 1 (no harm-critical sibling for qualified form)', () => {
    // "Soy Lecithin" is source-explicit — operator chose soy. Sunflower
    // Lecithin's stripped name does NOT contain "soy lecithin" as a whole-
    // word substring, so the cross-entry semantic check finds no sibling
    // and Tier 1 stands.
    const rows = parsePastedFormula('Soy Lecithin 100 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchedItem?.name).toBe(expectedName);
    expect(rows[0].parsedQty).toBe(100);
    expect(rows[0].parsedUnit).toBe('mg');
    expect(rows[0].matchTier).toBe(1);
  });

  it('PC 35% entry still does NOT claim "soy lecithin" — disambiguation discipline holds', () => {
    // Pre-1.5b: PC entry deliberately did not claim 'lecithin'/'soy lecithin'
    // synonyms because PC is the isolated phospholipid (PC fraction of the
    // lecithin parent material), not the whole lecithin. Post-1.5e that
    // disambiguation discipline is unchanged — "Soy Lecithin" lands on the
    // parent Lecithin entry, NOT on the PC fraction.
    const r = findBestMatchWithTier('Soy Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).not.toBe('Phosphatidylcholine (PC 35%, Soy)');
  });
});

describe('Wave 1.5d — Lecithin entry harm-critical field upgrade', () => {
  it('regulatoryStatus is GRAS (21 CFR 184.1400 authoritative basis)', () => {
    const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === expectedName);
    expect(entry?.regulatoryStatus).toBe('GRAS');
  });

  it('pharmacopeialReference is USP-NF', () => {
    const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === expectedName);
    expect(entry?.pharmacopeialReference).toBe('USP-NF');
  });

  it('coaTemplateType is extract (lecithin is a fractionated phospholipid mix, not an isolate)', () => {
    const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === expectedName);
    expect(entry?.coaTemplateType).toBe('extract');
  });

  it('allergens still includes Soybeans (no regression on harm-critical field)', () => {
    const entry = SUPPLEMENT_INGREDIENTS.find(e => e.name === expectedName);
    expect(entry?.allergens).toContain('Soybeans');
  });
});
