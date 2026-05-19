// ============================================================
// Wave 1.5e — synonym-layer cross-entry semantic-equivalence check
// ------------------------------------------------------------
// Wave 1.5d's Tier 2 stripped-name collision detection caught one
// failure mode (multiple entries share the same stripped name). The
// 2026-05-18 post-Wave-1.5d browser re-verification surfaced a deeper
// failure mode at the Tier 1 synonym layer:
//
//   • ONE entry claims a bare-technical-name synonym (e.g.,
//     'phosphatidylcholine' on PC 35% Soy via Wave 1.5b)
//   • OTHER catalog entries are sibling variants of the same substance
//     (PC 30% Soy, PC 30% Sunflower) but don't claim the bare synonym
//   • Tier 1 synonym match preempts the Tier 2 collision-detection
//     layer; the matched entry silently wins by authoring choice
//   • If sibling variants have materially different harm profiles
//     (allergens, regulatory status), the silent win crosses the
//     harm-critical floor (rulebook §I.7 Bucket 1)
//
// Wave 1.5e architectural fix:
//   1. Cross-entry semantic-equivalence check after Tier 1 synonym AND
//      Tier 2 stripped-name single-match. If sibling variants with
//      harm-critical differentials exist, escalate to Tier 3.
//   2. Retroactive synonym-claim cleanup on PC 35% Soy + Lecithin (Soy)
//      removing bare-technical-name synonyms (keeping qualified forms).
//   3. Rulebook §II.8a refinement codifying the preventive authoring
//      discipline (qualified-only synonyms when harm-critical siblings
//      exist).
//
// Test surfaces:
//   A. PC bare-name paste routes to Tier 3 with PC 30% Sunflower
//      surfaced as harm-critical sibling
//   B. Lecithin bare-name paste routes to Tier 3 with Sunflower Lecithin
//      surfaced as harm-critical sibling
//   C. Qualified-form paste (Soy Lecithin, PC 35%) → Tier 1 unchanged
//      (regression guard — explicit operator intent suppresses escalation)
//   D. Tier 1 synonym without harm-critical siblings → Tier 1 unchanged
//      (regression guard — escalation fires only when warranted)
//   E. Forward-variant simulation — synthetic catalog with PS Sunflower
//      added verifies the cross-entry check fires when new variants land
//   F. Frozen-snapshot disambiguation prompt text (stable UX contract)
// ============================================================

import { describe, it, expect } from 'vitest';
import type { IndustrialIngredient } from '../../types';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import { findBestMatchWithTier, parsePastedFormula } from '../parseFormula';
import {
  allergenProfileDiffers,
  identityTestRequirementDiffers,
  regulatoryStatusDiffers,
  harmCriticalDifferenceExists,
} from '../supplementHarmCritical';

// ──────────────────────────────────────────────────────────────
// Surface A — Phosphatidylcholine bare paste → Tier 3 escalation
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — Phosphatidylcholine bare paste routes to Tier 3 disambiguation', () => {
  it('bare "Phosphatidylcholine" returns Tier 3', () => {
    const r = findBestMatchWithTier('Phosphatidylcholine', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(3);
  });

  it('Tier 3 reason text surfaces PC 30% Sunflower (allergen-free harm-critical sibling)', () => {
    const r = findBestMatchWithTier('Phosphatidylcholine', SUPPLEMENT_INGREDIENTS);
    expect(r.reason).toContain('Sunflower');
    expect(r.reason).toContain('multiple variants with different harm profiles');
  });

  it('Tier 3 reason text mentions allergen / regulatory differential explicitly', () => {
    const r = findBestMatchWithTier('Phosphatidylcholine', SUPPLEMENT_INGREDIENTS);
    expect(r.reason).toContain('allergen');
  });

  it('matched item is the synonym-claimed entry (PC 35% Soy) as "did you mean" primary', () => {
    const r = findBestMatchWithTier('Phosphatidylcholine', SUPPLEMENT_INGREDIENTS);
    // Per Wave 1.5e: synonym match still returns the synonym-claimed entry
    // as the primary suggestion; cross-entry siblings appear in the reason
    // text. Operator can confirm or pick alternative from the disambiguation
    // prompt.
    // After Wave 1.5e cleanup PC 35% Soy no longer claims bare synonyms; the
    // bare paste routes through Tier 2 stripped-name single-match (PC 35% Soy
    // strips to "Phosphatidylcholine"; PC 30% variants strip differently).
    // Then cross-entry semantic check finds PC 30% Sunflower as harm-critical
    // sibling.
    expect(r.item?.name).toBe('Phosphatidylcholine (PC 35%, Soy)');
  });

  it('bulk-paste "Phosphatidylcholine 100 mg" routes to Tier 3 and is NOT auto-accepted', () => {
    const rows = parsePastedFormula('Phosphatidylcholine 100 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchTier).toBe(3);
    expect(rows[0].accepted).toBe(false); // Tier 3 requires operator confirmation
  });
});

// ──────────────────────────────────────────────────────────────
// Surface A.5 — Alpha-GPC bare paste → Tier 3 escalation
// (third Bucket 1 case discovered during Wave 1.5e implementation)
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — Alpha-GPC bare paste routes to Tier 3 disambiguation', () => {
  // Alpha-GPC (L-Alpha-Glycerylphosphorylcholine) — soy-lecithin-derived,
  // allergens: ['Soybeans']
  // Alpha-GPC 50% (AlphaSize, Synthetic) — synthetic from glycerophosphate
  // + choline, allergens: []
  // Same allergen-profile differential as PC and Lecithin. Bare "Alpha-GPC"
  // paste must surface BOTH for operator confirmation.

  it('bare "Alpha-GPC" (dash variant) returns Tier 3', () => {
    const r = findBestMatchWithTier('Alpha-GPC', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(3);
  });

  it('bare "Alpha GPC" (space variant) returns Tier 3 (normalization symmetry)', () => {
    // Wave 1.5e cross-entry check uses normalizeIngredientName on both
    // query and target — dash-vs-space variants resolve to the same
    // normalized form, both catch the harm-critical sibling.
    const r = findBestMatchWithTier('Alpha GPC', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(3);
  });

  it('Tier 3 reason text surfaces AlphaSize Synthetic (allergen-free harm-critical sibling)', () => {
    const r = findBestMatchWithTier('Alpha-GPC', SUPPLEMENT_INGREDIENTS);
    expect(r.reason).toContain('AlphaSize');
  });

  it('bulk-paste "Alpha-GPC 300 mg" routes to Tier 3 and is NOT auto-accepted', () => {
    const rows = parsePastedFormula('Alpha-GPC 300 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchTier).toBe(3);
    expect(rows[0].accepted).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// Surface B — Lecithin bare paste → Tier 3 escalation
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — Lecithin bare paste routes to Tier 3 disambiguation', () => {
  it('bare "Lecithin" returns Tier 3', () => {
    const r = findBestMatchWithTier('Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(3);
  });

  it('Tier 3 reason text surfaces Sunflower Lecithin (allergen-free harm-critical sibling)', () => {
    const r = findBestMatchWithTier('Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.reason).toContain('Sunflower Lecithin');
  });

  it('matched item is Lecithin (Soy, Liquid, USP) as primary', () => {
    const r = findBestMatchWithTier('Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.item?.name).toBe('Lecithin (Soy, Liquid, USP)');
  });

  it('bulk-paste "Lecithin 100 mg" routes to Tier 3 and is NOT auto-accepted', () => {
    const rows = parsePastedFormula('Lecithin 100 mg', SUPPLEMENT_INGREDIENTS);
    expect(rows[0].matchTier).toBe(3);
    expect(rows[0].accepted).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// Surface C — Qualified-form paste → Tier 1 unchanged
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — qualified-form paste preserves Tier 1 (explicit operator intent)', () => {
  it('"Soy Lecithin" resolves at Tier 1 (source-explicit, no harm-critical sibling)', () => {
    const r = findBestMatchWithTier('Soy Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('Lecithin (Soy, Liquid, USP)');
  });

  it('"Phosphatidylcholine 35%" resolves at Tier 1 (concentration-explicit)', () => {
    const r = findBestMatchWithTier('Phosphatidylcholine 35%', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('Phosphatidylcholine (PC 35%, Soy)');
  });

  it('"PC 35%" resolves at Tier 1 (concentration-qualified short form)', () => {
    const r = findBestMatchWithTier('PC 35%', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('Phosphatidylcholine (PC 35%, Soy)');
  });
});

// ──────────────────────────────────────────────────────────────
// Surface D — Synonym match without harm-critical siblings → Tier 1
//             unchanged (regression guard)
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — synonym match without harm-critical siblings preserves Tier 1', () => {
  it('"Folate" Tier 1 unchanged (no harm-critical siblings; Folic Acid Synthetic has same allergen profile)', () => {
    // Vitamin B9 (Folic Acid USP) claims 'folate' synonym. Folic Acid
    // (Synthetic, 97%) is a sibling but has same allergens=[] and same
    // regulatory profile. NOT harm-critical sibling → no escalation.
    const r = findBestMatchWithTier('Folate', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('Vitamin B9 (Folic Acid USP)');
  });

  it('"Biotin" Tier 1 unchanged (single-entry case, no siblings)', () => {
    const r = findBestMatchWithTier('Biotin', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('d-Biotin (Vitamin H, USP)');
  });

  it('"Garlic" Tier 1 unchanged (single-entry, no siblings)', () => {
    const r = findBestMatchWithTier('Garlic', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('Garlic Extract (Allicin-Standardized, 1.3% Allicin)');
  });

  it('"Metafolin" Tier 1 unchanged (brand-specific, sibling Quatrefolic NOT harm-critical-different on allergens / regulatoryStatus)', () => {
    const r = findBestMatchWithTier('Metafolin', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('Methylfolate (Metafolin / Calcium L-5-MTHF)');
  });
});

// ──────────────────────────────────────────────────────────────
// Surface E — Forward-variant simulation (synthetic catalog)
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — forward-variant simulation: cross-entry check fires when new variants land', () => {
  // Simulate the Phosphatidylserine family: existing PS 50% Soy entry +
  // hypothetical PS 50% Sunflower variant added in a future wave. If PS
  // 50% Soy claims a bare-name synonym, the cross-entry check should fire
  // automatically when the Sunflower variant lands — no code change
  // required. This regression guard documents the forward-compatibility
  // intent of the Wave 1.5e architecture.
  const psSoy: IndustrialIngredient = {
    name: 'Phosphatidylserine (PS 50%, Soy)',
    category: 'Fatty Acids',
    suppliers: ['Chemi Nutra (SerinAid)'],
    subIngredients: ['Phosphatidylserine', 'Soy Lecithin'],
    allergens: ['Soybeans'],
    costPerKg: 220,
    nutrition: {},
    notes: 'Synthetic test fixture — PS Soy variant.',
    synonyms: ['phosphatidylserine', 'ps 50%', 'soy ps'],
    regulatoryStatus: 'GRAS',
  };
  const psSunflower: IndustrialIngredient = {
    name: 'Phosphatidylserine (PS 50%, Sunflower)',
    category: 'Fatty Acids',
    suppliers: ['Lipoid'],
    subIngredients: ['Phosphatidylserine', 'Sunflower Lecithin'],
    allergens: [],
    costPerKg: 280,
    nutrition: {},
    notes: 'Synthetic test fixture — PS Sunflower variant (forward-compat).',
    regulatoryStatus: 'GRAS',
  };

  it('with only PS Soy in catalog → "Phosphatidylserine" resolves at Tier 1 (no sibling exists)', () => {
    const r = findBestMatchWithTier('Phosphatidylserine', [psSoy]);
    expect(r.tier).toBe(1);
    expect(r.item?.name).toBe('Phosphatidylserine (PS 50%, Soy)');
  });

  it('once PS Sunflower lands → "Phosphatidylserine" routes to Tier 3 automatically (no code change)', () => {
    const r = findBestMatchWithTier('Phosphatidylserine', [psSoy, psSunflower]);
    expect(r.tier).toBe(3);
    expect(r.reason).toContain('Sunflower');
  });

  it('forward-compat regression guard: bare-name synonym claim becomes a Tier 3 escalation when sibling with harm-critical differential lands', () => {
    // The Wave 1.5e architecture means future catalog authoring that adds
    // a sibling variant to an existing bare-name-synonym-claiming entry
    // automatically surfaces operator-side as Tier 3 disambiguation —
    // the bug class is closed at the parser layer, not just at the
    // authoring-time §II.8a discipline layer. This test documents that
    // forward compatibility.
    const rPre = findBestMatchWithTier('Phosphatidylserine', [psSoy]);
    const rPost = findBestMatchWithTier('Phosphatidylserine', [psSoy, psSunflower]);
    expect(rPre.tier).toBe(1);
    expect(rPost.tier).toBe(3);
  });
});

// ──────────────────────────────────────────────────────────────
// Surface F — Frozen-snapshot disambiguation prompt text
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — disambiguation prompt text stable contract', () => {
  it('PC bare-name disambiguation prompt enumerates candidates in stable format', () => {
    const r = findBestMatchWithTier('Phosphatidylcholine', SUPPLEMENT_INGREDIENTS);
    // Format contract per Wave 1.5e harmCriticalDisambiguationReason():
    // "multiple variants with different harm profiles (allergen / regulatory) — confirm: <name1> or <name2> [or <name3> ...]"
    expect(r.reason).toMatch(
      /^multiple variants with different harm profiles \(allergen \/ regulatory\) — confirm: /,
    );
    expect(r.reason).toContain(' or ');
  });

  it('Lecithin bare-name disambiguation prompt follows same stable format', () => {
    const r = findBestMatchWithTier('Lecithin', SUPPLEMENT_INGREDIENTS);
    expect(r.reason).toMatch(
      /^multiple variants with different harm profiles \(allergen \/ regulatory\) — confirm: /,
    );
  });
});

// ──────────────────────────────────────────────────────────────
// Surface G — Predicate function unit tests (supplementHarmCritical)
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5e — allergenProfileDiffers predicate', () => {
  const base = (allergens: string[]): IndustrialIngredient => ({
    name: 'Test', category: 'X', suppliers: [], subIngredients: [],
    allergens, costPerKg: 0, nutrition: {}, notes: '',
  });

  it('different allergen sets differ', () => {
    expect(allergenProfileDiffers(base(['Soybeans']), base([]))).toBe(true);
    expect(allergenProfileDiffers(base(['Fish']), base(['Shellfish']))).toBe(true);
  });

  it('same allergen sets do NOT differ', () => {
    expect(allergenProfileDiffers(base([]), base([]))).toBe(false);
    expect(allergenProfileDiffers(base(['Soybeans']), base(['Soybeans']))).toBe(false);
  });

  it('order-insensitive set comparison', () => {
    expect(allergenProfileDiffers(
      base(['Soybeans', 'Fish']),
      base(['Fish', 'Soybeans']),
    )).toBe(false);
  });

  it('case-insensitive set comparison', () => {
    expect(allergenProfileDiffers(
      base(['Soybeans']),
      base(['soybeans']),
    )).toBe(false);
  });
});

describe('Wave 1.5e — regulatoryStatusDiffers predicate (two-state discipline)', () => {
  const base = (status?: IndustrialIngredient['regulatoryStatus']): IndustrialIngredient => ({
    name: 'Test', category: 'X', suppliers: [], subIngredients: [],
    allergens: [], costPerKg: 0, nutrition: {}, notes: '',
    ...(status !== undefined ? { regulatoryStatus: status } : {}),
  });

  it('different explicit values differ', () => {
    expect(regulatoryStatusDiffers(base('GRAS'), base('NDI-notified'))).toBe(true);
  });

  it('same explicit values do NOT differ', () => {
    expect(regulatoryStatusDiffers(base('GRAS'), base('GRAS'))).toBe(false);
  });

  it('explicit vs undefined does NOT fire (data-completeness gap, not regulatory differential)', () => {
    expect(regulatoryStatusDiffers(base('GRAS'), base())).toBe(false);
    expect(regulatoryStatusDiffers(base(), base('GRAS'))).toBe(false);
  });

  it('both undefined does NOT fire', () => {
    expect(regulatoryStatusDiffers(base(), base())).toBe(false);
  });
});

describe('Wave 1.5e — identityTestRequirementDiffers predicate (forward-compat hook)', () => {
  const base: IndustrialIngredient = {
    name: 'Test', category: 'X', suppliers: [], subIngredients: [],
    allergens: [], costPerKg: 0, nutrition: {}, notes: '',
  };

  it('returns false (no catalog data yet — wired for Wave 2+ schema extension)', () => {
    expect(identityTestRequirementDiffers(base, base)).toBe(false);
  });
});

describe('Wave 1.5e — harmCriticalDifferenceExists composed predicate', () => {
  const make = (overrides: Partial<IndustrialIngredient>): IndustrialIngredient => ({
    name: 'Test', category: 'X', suppliers: [], subIngredients: [],
    allergens: [], costPerKg: 0, nutrition: {}, notes: '',
    ...overrides,
  });

  it('fires when allergens differ', () => {
    expect(harmCriticalDifferenceExists(
      make({ allergens: ['Soybeans'] }),
      make({ allergens: [] }),
    )).toBe(true);
  });

  it('fires when regulatoryStatus differs (both explicit)', () => {
    expect(harmCriticalDifferenceExists(
      make({ regulatoryStatus: 'GRAS' }),
      make({ regulatoryStatus: 'NDI-notified' }),
    )).toBe(true);
  });

  it('does NOT fire when entries are harm-critically equivalent', () => {
    expect(harmCriticalDifferenceExists(
      make({ allergens: ['Soybeans'], regulatoryStatus: 'GRAS' }),
      make({ allergens: ['Soybeans'], regulatoryStatus: 'GRAS' }),
    )).toBe(false);
  });

  it('does NOT fire on data-completeness gap (explicit vs undefined regulatoryStatus)', () => {
    expect(harmCriticalDifferenceExists(
      make({ regulatoryStatus: 'GRAS' }),
      make({}),
    )).toBe(false);
  });

  it('PC 35% Soy vs PC 30% Sunflower fires (allergen differential — Wave 1.5e worked example)', () => {
    const pc35Soy = SUPPLEMENT_INGREDIENTS.find(e => e.name === 'Phosphatidylcholine (PC 35%, Soy)');
    const pc30Sunflower = SUPPLEMENT_INGREDIENTS.find(
      e => e.name === 'Phosphatidylcholine 30% (Sunflower Lecithin-Derived, Allergen-Free)',
    );
    expect(pc35Soy).toBeDefined();
    expect(pc30Sunflower).toBeDefined();
    expect(harmCriticalDifferenceExists(pc35Soy!, pc30Sunflower!)).toBe(true);
  });

  it('PC 35% Soy vs PC 30% Soy does NOT fire (allergen-equivalent — Bucket 2 only)', () => {
    const pc35Soy = SUPPLEMENT_INGREDIENTS.find(e => e.name === 'Phosphatidylcholine (PC 35%, Soy)');
    const pc30Soy = SUPPLEMENT_INGREDIENTS.find(e => e.name === 'Phosphatidylcholine 30% (Soy Lecithin-Derived)');
    expect(pc35Soy).toBeDefined();
    expect(pc30Soy).toBeDefined();
    expect(harmCriticalDifferenceExists(pc35Soy!, pc30Soy!)).toBe(false);
  });
});
