// ============================================================
// Path A — productClass routing helpers + checkCompliance threading
// ------------------------------------------------------------
// Round 10 Path A-1 (2026-05-15). Tests cover:
//   1. Pure helpers (limitAppliesForProductClass, effectiveLimit-
//      ForProductClass, isProhibitedInProductClass) — exhaustive
//      cases against synthetic RegulatoryLimit objects.
//   2. checkCompliance signature backwards-compat — calls with
//      productClass=undefined preserve pre-Path-A behavior.
//   3. ProductClass type / PRODUCT_CLASSES constant — enumeration
//      stability check (8 values locked for v1).
//
// Routing tests against the LIVE catalog land in Section 3b.2 when
// data tags (appliesToCategories, prohibitedInCategories,
// contextualLimits, denominatorBasis) attach to the 18-entry table.
// Path A-1 verifies the routing MACHINERY is correct against
// synthetic limits; 3b.2 verifies it routes the real entries
// correctly.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  checkCompliance,
  limitAppliesForProductClass,
  effectiveLimitForProductClass,
  isProhibitedInProductClass,
  type RegulatoryLimit,
} from '../regulatoryLimits';
import { PRODUCT_CLASSES, type ProductClass } from '../../types';

// Synthetic limit factory — base limit with overridable fields.
function makeLimit(overrides: Partial<RegulatoryLimit> = {}): RegulatoryLimit {
  return {
    namePatterns: ['__test__'],
    authority: 'FDA',
    citation: '__test_citation__',
    shortName: 'Test Limit',
    summary: 'Test',
    ...overrides,
  };
}

describe('ProductClass enumeration (Path A — locked v1)', () => {

  it('PRODUCT_CLASSES tuple has the 8 locked v1 values in display order', () => {
    expect(PRODUCT_CLASSES).toEqual([
      'acidified-food',
      'supplement',
      'beverage',
      'cured-meat',
      'bacon',
      'baked-good',
      'fresh-produce',
      'general',
    ]);
  });

  it('PRODUCT_CLASSES has exactly 8 entries (v1 enumeration size)', () => {
    expect(PRODUCT_CLASSES.length).toBe(8);
  });
});

describe('limitAppliesForProductClass — appliesToCategories routing', () => {

  it('returns true when limit has no appliesToCategories (applies universally)', () => {
    const limit = makeLimit();
    expect(limitAppliesForProductClass(limit, 'bacon')).toBe(true);
    expect(limitAppliesForProductClass(limit, 'general')).toBe(true);
    expect(limitAppliesForProductClass(limit, undefined)).toBe(true);
  });

  it('returns true when limit has empty appliesToCategories array (treated as unrestricted)', () => {
    const limit = makeLimit({ appliesToCategories: [] });
    expect(limitAppliesForProductClass(limit, 'bacon')).toBe(true);
    expect(limitAppliesForProductClass(limit, undefined)).toBe(true);
  });

  it('returns false when limit has appliesToCategories but productClass is undefined', () => {
    // productClass-scoped limits require an explicit productClass; an
    // undefined productClass cannot route to them.
    const limit = makeLimit({ appliesToCategories: ['cured-meat'] });
    expect(limitAppliesForProductClass(limit, undefined)).toBe(false);
  });

  it('returns true when productClass is in appliesToCategories list', () => {
    const limit = makeLimit({ appliesToCategories: ['cured-meat', 'bacon'] });
    expect(limitAppliesForProductClass(limit, 'cured-meat')).toBe(true);
    expect(limitAppliesForProductClass(limit, 'bacon')).toBe(true);
  });

  it('returns false when productClass is NOT in appliesToCategories list', () => {
    const limit = makeLimit({ appliesToCategories: ['cured-meat'] });
    expect(limitAppliesForProductClass(limit, 'beverage')).toBe(false);
    expect(limitAppliesForProductClass(limit, 'general')).toBe(false);
  });
});

describe('effectiveLimitForProductClass — contextualLimits override', () => {

  it('returns base maxPercent/maxPpm when no contextualLimits set', () => {
    const limit = makeLimit({ maxPercent: 0.1, maxPpm: 1000 });
    const eff = effectiveLimitForProductClass(limit, 'bacon');
    expect(eff.maxPercent).toBe(0.1);
    expect(eff.maxPpm).toBe(1000);
  });

  it('returns base when productClass is undefined (no override possible)', () => {
    const limit = makeLimit({
      maxPpm: 156,
      contextualLimits: [{ context: 'bacon', maxPpm: 250 }],
    });
    const eff = effectiveLimitForProductClass(limit, undefined);
    expect(eff.maxPpm).toBe(156);
  });

  it('returns override when productClass matches a contextualLimits entry', () => {
    // Mirrors sodium nitrite's bacon-subtype routing (Section 3b.2 case).
    const limit = makeLimit({
      maxPpm: 156, // base for "most cured/comminuted meats"
      contextualLimits: [
        { context: 'bacon', maxPpm: 250 }, // dry-cured bacon
      ],
    });
    const eff = effectiveLimitForProductClass(limit, 'bacon');
    expect(eff.maxPpm).toBe(250);
  });

  it('returns base when productClass does NOT match any contextualLimits entry', () => {
    const limit = makeLimit({
      maxPpm: 156,
      contextualLimits: [{ context: 'bacon', maxPpm: 250 }],
    });
    const eff = effectiveLimitForProductClass(limit, 'cured-meat');
    expect(eff.maxPpm).toBe(156);
  });

  it('only overrides the field that the contextualLimit specifies (maxPpm only does not touch maxPercent)', () => {
    const limit = makeLimit({
      maxPercent: 0.1,
      maxPpm: 1000,
      contextualLimits: [{ context: 'beverage', maxPpm: 500 }], // only maxPpm
    });
    const eff = effectiveLimitForProductClass(limit, 'beverage');
    expect(eff.maxPercent).toBe(0.1); // unchanged
    expect(eff.maxPpm).toBe(500); // overridden
  });
});

describe('isProhibitedInProductClass — prohibition check', () => {

  it('returns false when limit has no prohibitedInCategories', () => {
    const limit = makeLimit();
    expect(isProhibitedInProductClass(limit, 'bacon')).toBe(false);
    expect(isProhibitedInProductClass(limit, undefined)).toBe(false);
  });

  it('returns false when productClass is undefined (cannot trigger categorical prohibition)', () => {
    const limit = makeLimit({ prohibitedInCategories: ['bacon'] });
    expect(isProhibitedInProductClass(limit, undefined)).toBe(false);
  });

  it('returns true when productClass is in prohibitedInCategories', () => {
    // Mirrors Section 3b.2 nitrate-in-bacon prohibition.
    const limit = makeLimit({ prohibitedInCategories: ['bacon'] });
    expect(isProhibitedInProductClass(limit, 'bacon')).toBe(true);
  });

  it('returns false when productClass is NOT in prohibitedInCategories', () => {
    const limit = makeLimit({ prohibitedInCategories: ['bacon'] });
    expect(isProhibitedInProductClass(limit, 'cured-meat')).toBe(false);
    expect(isProhibitedInProductClass(limit, 'general')).toBe(false);
  });

  it('handles multiple prohibited categories', () => {
    const limit = makeLimit({ prohibitedInCategories: ['bacon', 'fresh-produce'] });
    expect(isProhibitedInProductClass(limit, 'bacon')).toBe(true);
    expect(isProhibitedInProductClass(limit, 'fresh-produce')).toBe(true);
    expect(isProhibitedInProductClass(limit, 'baked-good')).toBe(false);
  });
});

describe('checkCompliance — backwards compatibility (productClass omitted)', () => {

  it('called without productClass arg preserves Section 3b.1 sulfite declaration-trigger behavior', () => {
    // 15 ppm sulfite, no productClass — pre-Path-A consumer pattern.
    const findings = checkCompliance([
      { name: 'Sodium Metabisulfite', qty: 0.0015, unit: 'g' },
      { name: 'Water', qty: 99.9985, unit: 'g' },
    ]);
    const declaration = findings.find(
      f => f.limit.shortName === 'Sulfites' && f.declarationTriggered === true
    );
    expect(declaration).toBeDefined();
  });

  it('called with productClass=undefined: cured-meat-scoped limits DO NOT fire (Section 3b.2 appliesToCategories gate)', () => {
    // Path A semantic: productClass-scoped limits require explicit
    // productClass. After Section 3b.2 tags binders with appliesToCategories:
    // ['cured-meat', 'bacon'], a call without productClass produces no
    // binder findings — neither individual nor combined. This is the
    // failure mode Path A was designed to prevent (false-positive binder
    // enforcement on non-meat formulations like ice cream).
    const findings = checkCompliance(
      [
        { name: 'Non-Fat Dry Milk', qty: 2, unit: 'g' },
        { name: 'Soy Protein Isolate', qty: 2, unit: 'g' },
        { name: 'Water', qty: 96, unit: 'g' },
      ],
      undefined,
    );
    const combined = findings.find(f => f.combinedBudget !== undefined);
    const binderFinding = findings.find(
      f => f.limit.shortName === 'Binders (dairy)' || f.limit.shortName === 'Binders (soy)'
    );
    expect(combined).toBeUndefined();
    expect(binderFinding).toBeUndefined();
  });

  it('called with productClass for an entry without appliesToCategories: limit fires normally', () => {
    // Sulfite entry has no appliesToCategories tag in v1; passing
    // productClass='supplement' shouldn't suppress it.
    const findings = checkCompliance(
      [
        { name: 'Sodium Metabisulfite', qty: 0.012, unit: 'g' },
        { name: 'Water', qty: 99.988, unit: 'g' },
      ],
      'supplement',
    );
    const sulfite = findings.find(f => f.limit.shortName === 'Sulfites' && !f.declarationTriggered);
    expect(sulfite).toBeDefined();
    expect(sulfite?.violated).toBe(true); // 120 ppm > 100 ppm
  });

  it('called with productClass for an entry without denominatorBasis: uses total-mass (default)', () => {
    // 0.05% sodium benzoate — under the 0.1% cap regardless of productClass.
    const findings = checkCompliance(
      [
        { name: 'Sodium Benzoate', qty: 0.05, unit: 'g' },
        { name: 'Water', qty: 99.95, unit: 'g' },
      ],
      'beverage',
    );
    const benzoate = findings.find(f => f.limit.shortName === 'Sodium Benzoate');
    expect(benzoate).toBeDefined();
    expect(benzoate?.currentPercent).toBeCloseTo(0.05, 4);
    expect(benzoate?.violated).toBe(false);
  });
});

describe('checkCompliance — type contract', () => {

  it('signature accepts all PRODUCT_CLASSES values without type errors', () => {
    // Compile-time test: this only verifies type compatibility. Each call
    // returns a valid ComplianceFinding[].
    for (const pc of PRODUCT_CLASSES) {
      const findings = checkCompliance(
        [{ name: 'Water', qty: 100, unit: 'g' }],
        pc satisfies ProductClass,
      );
      expect(Array.isArray(findings)).toBe(true);
    }
  });

  it('signature still accepts the legacy zero-arg-productClass call', () => {
    // Backwards-compat: existing call sites that don't pass productClass
    // still compile and return findings.
    const findings = checkCompliance([{ name: 'Water', qty: 100, unit: 'g' }]);
    expect(Array.isArray(findings)).toBe(true);
  });
});
