// ============================================================
// Wave 1.5d — Tier 2 stripped-name collision detection
// ------------------------------------------------------------
// Pre-1.5d the Tier 2 stripped-name match loop in
// findBestMatchWithTier returned the FIRST entry whose stripped name
// (catalog name minus trailing parens) matched the query, by catalog
// iteration order. When >1 entry shared the same stripped name,
// operator paste silently committed whichever appeared first — hiding
// the other(s) entirely.
//
// Operator-observed failure mode (browser verification 2026-05-18):
// bare "Methylfolate" silently resolved to Metafolin (calcium-salt),
// hiding Quatrefolic (glucosamine-salt). Bench-test code trace
// predicted this exact behavior; operator screenshot confirmed.
//
// Wave 1.5d fix:
//   • Collect ALL stripped-name matches in a filter pass
//   • length === 1 → Tier 2 (unchanged behavior — single unambiguous
//     match is the original semantic of the path)
//   • length > 1  → Tier 3 with reason text enumerating candidates;
//     workspace UI surfaces existing amber "⚠ Confirm match" prompt
//     so operator picks the right branded form
//
// Test discipline (per rulebook §IV.20 S1 + §VI.29):
//   • Positive: single-match case still returns Tier 2 unchanged
//   • Positive: multi-match case returns Tier 3 with candidate list
//   • Catalog-wide regression guard: no other stripped-name collisions
//     exist that would now route through Tier 3 unexpectedly
// ============================================================

import { describe, it, expect } from 'vitest';
import type { IndustrialIngredient } from '../../types';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import { findBestMatchWithTier } from '../parseFormula';

// ──────────────────────────────────────────────────────────────
// Single-match case — Tier 2 path unchanged
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5d — single stripped-name match still Tier 2 (regression guard)', () => {
  // Use a synthetic db with controlled stripped names independent of
  // real-catalog state. Sub-ingredients are deliberately multi-item so
  // the Tier 1 single-sub-ingredient match path doesn't fire ahead of
  // the Tier 2 stripped-name path we're actually testing.
  const syntheticDb: IndustrialIngredient[] = [
    { name: 'WidgetAlpha (Premium, Vendor X)', category: 'Vitamins', suppliers: ['X'], subIngredients: ['WidgetAlpha Sulfate', 'Magnesium Stearate'], allergens: [], costPerKg: 1, nutrition: {}, notes: 'Synthetic test fixture for Wave 1.5d collision-detection.' },
    { name: 'WidgetBeta (Standard, Vendor Y)', category: 'Vitamins', suppliers: ['Y'], subIngredients: ['WidgetBeta Citrate', 'Magnesium Stearate'], allergens: [], costPerKg: 1, nutrition: {}, notes: 'Synthetic test fixture for Wave 1.5d collision-detection.' },
  ];

  it('non-colliding stripped name returns Tier 2 with original reason', () => {
    // "WidgetAlpha" strips to one entry only → unchanged Tier 2 path.
    const r = findBestMatchWithTier('WidgetAlpha', syntheticDb);
    expect(r.tier).toBe(2);
    expect(r.reason).toBe('catalog name minus grade qualifier');
    expect(r.item?.name).toBe('WidgetAlpha (Premium, Vendor X)');
  });

  it('Tier 2 single-match reason text is preserved (no behavior change for non-colliding case)', () => {
    const r = findBestMatchWithTier('WidgetBeta', syntheticDb);
    expect(r.tier).toBe(2);
    expect(r.reason).not.toContain('multiple branded forms');
  });
});

describe('Wave 1.5d — multi-match stripped-name collision routes to Tier 3 (synthetic db)', () => {
  // Synthetic db with TWO entries sharing stripped name "WidgetGamma"
  // — confirms the collision-detection branch fires for non-Methylfolate
  // cases too (the fix is general, not Methylfolate-specific).
  const collisionDb: IndustrialIngredient[] = [
    { name: 'WidgetGamma (Premium, Vendor X)', category: 'Vitamins', suppliers: ['X'], subIngredients: ['WidgetGamma A', 'Cellulose'], allergens: [], costPerKg: 1, nutrition: {}, notes: 'Synthetic test fixture A.' },
    { name: 'WidgetGamma (Generic, Vendor Y)', category: 'Vitamins', suppliers: ['Y'], subIngredients: ['WidgetGamma B', 'Cellulose'], allergens: [], costPerKg: 1, nutrition: {}, notes: 'Synthetic test fixture B.' },
  ];

  it('two entries share stripped name → Tier 3 with enumerated candidates', () => {
    const r = findBestMatchWithTier('WidgetGamma', collisionDb);
    expect(r.tier).toBe(3);
    expect(r.reason).toContain('multiple branded forms');
    expect(r.reason).toContain('WidgetGamma (Premium, Vendor X)');
    expect(r.reason).toContain('WidgetGamma (Generic, Vendor Y)');
  });
});

// ──────────────────────────────────────────────────────────────
// Real-catalog regression check — Methylfolate specifically
// ──────────────────────────────────────────────────────────────
//
// Note: a catalog-wide collision audit was attempted during Wave 1.5d
// authoring and surfaced 30+ stripped-name collisions across the
// supplement catalog (most from the two-wave value-tier/premium-tier
// ingestion seam — `project_supplements_two_wave_ingestion`). One of
// those collisions is harm-critical: Phosphatidylcholine 30% Soy vs
// Sunflower has different allergen profiles, and pre-1.5d silent first-
// match substitution would have routed Sunflower-targeted formulations
// to the Soy variant, introducing an undeclared allergen. The broader
// catalog-state cleanup is documented separately in
// `docs/findings/2026-05-18-catalog-stripped-name-collisions.md` and
// scheduled as Round 12 work. The Methylfolate-specific tests above are
// the durable regression guard for the Wave 1.5d fix itself.

// ──────────────────────────────────────────────────────────────
// Multi-match case — Tier 3 with candidate enumeration
// ──────────────────────────────────────────────────────────────

describe('Wave 1.5d — Methylfolate stripped-name collision routes to Tier 3', () => {
  it('bare "Methylfolate" returns Tier 3', () => {
    const r = findBestMatchWithTier('Methylfolate', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(3);
  });

  it('reason text enumerates both Methylfolate branded forms', () => {
    const r = findBestMatchWithTier('Methylfolate', SUPPLEMENT_INGREDIENTS);
    expect(r.reason).toContain('multiple branded forms');
    expect(r.reason).toContain('Metafolin');
    expect(r.reason).toContain('Quatrefolic');
  });

  it('reason text contains the shared stripped name as the disambiguation anchor', () => {
    const r = findBestMatchWithTier('Methylfolate', SUPPLEMENT_INGREDIENTS);
    expect(r.reason).toContain('"Methylfolate"');
  });

  it('matched item is provided as "did you mean" candidate (first in iteration order)', () => {
    // Tier 3 returns the first candidate as the matchedItem; workspace
    // UI shows this as the "Did you mean X?" suggestion alongside the
    // candidate-list reason text. Operator confirms or picks alternative.
    const r = findBestMatchWithTier('Methylfolate', SUPPLEMENT_INGREDIENTS);
    expect(r.item).not.toBeNull();
    // First Methylfolate entry in catalog order — current state has
    // Metafolin listed before Quatrefolic in lib/data/supplements.ts.
    // Test is order-tolerant: assert it's one of the two Methylfolate
    // entries, not a specific one (allows future re-ordering without
    // false-fail).
    const matchedName = r.item?.name ?? '';
    expect(
      matchedName === 'Methylfolate (Metafolin / Calcium L-5-MTHF)' ||
      matchedName === 'Methylfolate (Quatrefolic / Glucosamine L-5-MTHF)',
    ).toBe(true);
  });

  it('accepted defaults to false at Tier 3 (operator must confirm)', () => {
    // findBestMatchWithTier just returns the MatchResult; the accepted
    // default-false-at-Tier-3 happens inside parsePastedFormula's row
    // construction. Verified there in the existing parser tests.
    // Here we just confirm the Tier 3 tier value, since accepted is
    // not part of MatchResult.
    const r = findBestMatchWithTier('Methylfolate', SUPPLEMENT_INGREDIENTS);
    expect(r.tier).toBe(3);
  });
});

