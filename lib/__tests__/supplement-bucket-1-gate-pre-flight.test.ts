// ============================================================
// Round 11 Phase 2 Step 5 — Bucket 1 composition gate pre-flight verification
// ------------------------------------------------------------
// Pre-flight verification (2026-05-17) of the supplement Bucket 1
// composition gate against canonical operator-workflow formulation
// states. Validates that the full gate (composed of §B1 + §B2 + §B3 +
// §B5 + Review.currentState; §B4 registry-only) coheres at the
// integration boundary, not just at the per-item layer.
//
// Distinct from the per-item composition tests at
// lib/__tests__/supplement-bucket-1-gate.test.ts (Phase 2 Step 4
// deliverable) — those exercise individual items and pattern-establishment
// scenarios. This file (Phase 2 Step 5 deliverable) tests:
//
//   • Section A — Canonical happy-path formulations clear the gate
//   • Section B — Single-item refusal scenarios with isolation
//     (each item fires alone; every other item clean; confirms
//      evidence sourcing is accurate per item, not bleeding across)
//   • Section C — Multi-item refusal cascades for realistic operator-
//     mid-workflow formulations (partial completion produces
//     multi-source evidence aggregation)
//   • Section D — Edge cases at the gate-clears-vs-refuses boundary
//     at the composition layer (re-confirms per-item threshold
//     logic holds when composed)
//   • Section E — composedItems registry integrity for audit-trail
//     visibility in the cleared state
//
// Terminology: this is pre-flight verification (software-level
// verification of computed values). Distinct from bench tests
// reserved for physical food-science laboratory work — file/test
// names retain the bench-test internal convention per the
// established memory file, but conversational/directive language
// uses pre-flight verification.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  evaluateSupplementBucket1Gate,
  type SupplementBucket1GateParams,
} from '../supplementBucket1Gate';
import {
  B2_DISEASE_CLAIM_ITEM_ID,
  analyzeDraftClaim,
  type DiseaseClaimFlag,
} from '../supplementClaims';
import {
  B1_ALLERGEN_ITEM_ID,
  ALLERGEN_REGULATORY_METADATA,
  detectAllergensDetailed,
  type AllergenMatch,
} from '../supplementAllergen';
import { B5_NET_QUANTITY_ITEM_ID } from '../netQuantity';
import { B3_IDENTITY_TEST_ITEM_ID } from '../identityTest';
import { B4_DISCLAIMER_ITEM_ID } from '../supplementDisclaimer';
import { REVIEW_STATE_GATE_ITEM_ID } from '../reviewState';
import type { IdentityTestAttestation } from '../../types';
import { isHardStop } from '../hardStop';

// ─── Canonical workflow fixtures ────────────────────────────────

const FIXED_NOW = '2026-05-17T12:00:00.000Z';

/**
 * Canonical happy-path formulation: Vitamin C + Vitamin D3 supplement.
 * Common starter SKU shape — two dietary ingredients, no allergens,
 * no claims, 30g net mass, fully attested, approved review state.
 */
function canonicalHappyPath(): SupplementBucket1GateParams {
  const attestations: IdentityTestAttestation[] = [
    {
      id: 'att-vit-c',
      ingredientName: 'Vitamin C (Ascorbic Acid)',
      supplierName: 'DSM Nutritional Products',
      identityTestMethod: 'HPLC',
      attestedAt: '2026-05-01T10:00:00.000Z',
      attestedBy: 'operator@formulationwizard.com',
    },
    {
      id: 'att-vit-d3',
      ingredientName: 'Vitamin D3 (Cholecalciferol)',
      supplierName: 'DSM Nutritional Products',
      identityTestMethod: 'HPLC',
      attestedAt: '2026-05-01T10:00:00.000Z',
      attestedBy: 'operator@formulationwizard.com',
    },
  ];

  return {
    diseaseClaimFlags: [],
    allergenMatches: [],
    netQuantityInput: {
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    },
    identityTestInput: {
      requiredIngredientNames: ['Vitamin C (Ascorbic Acid)', 'Vitamin D3 (Cholecalciferol)'],
      attestations,
      now: FIXED_NOW,
    },
    reviewState: 'approved',
  };
}

/**
 * Canonical happy-path with allergens properly disclosed: whey-protein
 * supplement with species-named ingredients, structure/function claim,
 * dual-unit declaration, attested, version-locked.
 */
function canonicalHappyPathWithAllergens(): SupplementBucket1GateParams {
  return {
    // "Supports muscle recovery" is a structure/function claim phrasing
    // that does NOT trip disease-claim patterns. Verified via detector.
    diseaseClaimFlags: analyzeDraftClaim('Supports muscle recovery and growth'),
    allergenMatches: [
      // Whey is Milk (no species naming required for Milk category).
      {
        category: 'Milk',
        matchedKeyword: 'whey',
        requiresSpeciesNaming: false,
        regulatoryTier: ALLERGEN_REGULATORY_METADATA['Milk'].tier,
      },
    ],
    netQuantityInput: {
      form: 'solid',
      totalMassG: 907,
      declaredNetQuantity: {
        primary: { value: 32, unit: 'oz' },
        metric: { value: 907, unit: 'g' },
      },
    },
    identityTestInput: {
      requiredIngredientNames: ['Whey Protein Isolate'],
      attestations: [
        {
          id: 'att-whey',
          ingredientName: 'Whey Protein Isolate',
          supplierName: 'Glanbia Nutritionals',
          identityTestMethod: 'FTIR',
          attestedAt: '2026-05-10T09:00:00.000Z',
          attestedBy: 'operator@formulationwizard.com',
        },
      ],
      now: FIXED_NOW,
    },
    reviewState: 'version_locked',
  };
}

// ============================================================
// Section A — Canonical happy-path formulations
// ============================================================
describe('Bucket 1 gate pre-flight — Section A: canonical happy-path', () => {
  it('Vitamin C + D supplement (no allergens, no claims, attested, approved) → cleared, zero evidence', () => {
    const result = evaluateSupplementBucket1Gate(canonicalHappyPath());
    expect(result.hardStop).toBe(false);
    if (result.hardStop) return;
    expect(result.source).toBe('supplement-bucket-1');
  });

  it('Whey-protein supplement (Milk allergen properly disclosed, compliant claim, dual-unit, version-locked) → cleared', () => {
    const result = evaluateSupplementBucket1Gate(canonicalHappyPathWithAllergens());
    expect(result.hardStop).toBe(false);
  });

  it('Tree-nut supplement with species-named Almonds → cleared (species-naming satisfied)', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      allergenMatches: detectAllergensDetailed('Almond protein powder'),
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section B — Single-item refusal scenarios (isolation)
// Each test: target item fires; every other item is clean.
// Confirms evidence sourcing is accurate per item, not bleeding across.
// ============================================================
describe('Bucket 1 gate pre-flight — Section B: single-item refusal in isolation', () => {
  it('§B2 alone (disease claim present; all other items clean) → all evidence sources from §B2', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      diseaseClaimFlags: analyzeDraftClaim('Cures cancer'),
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence.length).toBeGreaterThanOrEqual(1);
    // All evidence should be from §B2 — match phrase subjects only.
    // analyzeDraftClaim preserves input case in `match`, so compare case-insensitively.
    const allFromB2 = result.evidence.every(e => {
      const s = e.subject.toLowerCase();
      return s === 'cancer' || s === 'cures';
    });
    expect(allFromB2).toBe(true);
  });

  it('§B1 alone (Fish generic term without species; all other items clean) → 1 evidence item from §B1', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      allergenMatches: detectAllergensDetailed('Fish oil concentrate'),
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject.toLowerCase()).toContain('fish');
  });

  it('§B3 alone (missing attestation for required ingredient; all other items clean) → 1 evidence item from §B3', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      identityTestInput: {
        requiredIngredientNames: ['Vitamin C (Ascorbic Acid)'],
        attestations: [],
        now: FIXED_NOW,
      },
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toContain('Vitamin C');
  });

  it('§B5 alone (declared net quantity exceeds ±2% tolerance; all other items clean) → 1 evidence item from §B5', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        declaredNetQuantity: {
          primary: { value: 35, unit: 'g' }, // 16.7% drift
        },
      },
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject.toLowerCase()).toContain('tolerance');
  });

  it('Review.currentState alone (draft state; all other items clean) → 1 evidence item from review state', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      reviewState: 'draft',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toBe('PA review state');
  });

  it('Review.currentState alone (rejected state) → 1 evidence item from review state', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      reviewState: 'rejected',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toBe('PA review state');
  });

  it('Review.currentState alone (submitted state) → 1 evidence item from review state', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      reviewState: 'submitted',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toBe('PA review state');
  });
});

// ============================================================
// Section C — Multi-item refusal cascades (realistic operator workflows)
// ============================================================
describe('Bucket 1 gate pre-flight — Section C: multi-item cascades', () => {
  it('early-draft formulation (draft state + missing declaration + missing attestation) → 3 sources fire', () => {
    // Operator just started: review in draft, no net quantity entered,
    // no attestations on file. Classic mid-workflow state.
    const params: SupplementBucket1GateParams = {
      diseaseClaimFlags: [],
      allergenMatches: [],
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        // declaredNetQuantity intentionally missing
      },
      identityTestInput: {
        requiredIngredientNames: ['Vitamin C'],
        attestations: [],
        now: FIXED_NOW,
      },
      reviewState: 'draft',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(3);
    // Verify each source contributed exactly one entry
    const subjects = result.evidence.map(e => e.subject);
    expect(subjects.some(s => s.toLowerCase().includes('net quantity'))).toBe(true);
    expect(subjects.some(s => s.includes('Vitamin C'))).toBe(true);
    expect(subjects).toContain('PA review state');
  });

  it('operator drafted disease claim in early-draft (cancer claim + draft state) → 2 sources fire', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      diseaseClaimFlags: analyzeDraftClaim('Cures cancer'),
      reviewState: 'draft',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    // 2 disease-tier flags (cancer + cures) + 1 review-state entry = 3 evidence
    expect(result.evidence.length).toBe(3);
    const subjects = result.evidence.map(e => e.subject);
    expect(subjects).toContain('PA review state');
    expect(subjects.some(s => s === 'cancer' || s === 'cures')).toBe(true);
  });

  it('label-incomplete formulation (missing dual-unit + generic fish + draft state) → 3 sources fire', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      allergenMatches: detectAllergensDetailed('Fish oil concentrate'),
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        declaredNetQuantity: {
          primary: { value: 1.06, unit: 'oz' }, // US customary primary, no metric secondary
        },
      },
      reviewState: 'draft',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(3);
    const subjects = result.evidence.map(e => e.subject);
    expect(subjects.some(s => s.toLowerCase().includes('fish'))).toBe(true);
    expect(subjects.some(s => s.toLowerCase().includes('dual'))).toBe(true);
    expect(subjects).toContain('PA review state');
  });

  it('customer-zero style submission (real partial-completion workflow) → 4 sources fire', () => {
    // Realistic: operator typed a borderline claim, has tree-nut blend
    // without species named, declared net quantity but exceeded tolerance,
    // submitted for review (not yet approved).
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      diseaseClaimFlags: analyzeDraftClaim('Helps prevent heart disease'),
      allergenMatches: detectAllergensDetailed('Tree nut blend'),
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        declaredNetQuantity: {
          primary: { value: 32, unit: 'g' }, // 6.7% drift, exceeds 2%
        },
      },
      reviewState: 'submitted',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    // §B2 (heart disease + prevents) + §B1 (tree nut generic) + §B5 (tolerance) + Review (submitted)
    expect(result.evidence.length).toBeGreaterThanOrEqual(4);
    const subjects = result.evidence.map(e => e.subject);
    expect(subjects.some(s => s.toLowerCase().includes('tree nuts'))).toBe(true);
    expect(subjects.some(s => s.toLowerCase().includes('tolerance'))).toBe(true);
    expect(subjects).toContain('PA review state');
  });

  it('cascade hard-stop carries unified Bucket 1 source marker (not per-item source)', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      diseaseClaimFlags: analyzeDraftClaim('Cures cancer'),
      reviewState: 'draft',
    };
    const result = evaluateSupplementBucket1Gate(params);
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.source).toBe('supplement-bucket-1');
  });
});

// ============================================================
// Section D — Edge cases at the gate-clears-vs-refuses boundary
// Per-item threshold logic re-confirmed at composition layer
// ============================================================
describe('Bucket 1 gate pre-flight — Section D: composition-layer boundary cases', () => {
  it('net quantity at exactly 102.0% drift (boundary) → cleared at composition', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        declaredNetQuantity: {
          primary: { value: 30.6, unit: 'g' }, // exactly 2.0% drift
        },
      },
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('net quantity at 102.01% drift (just over boundary) → composition hard-stop fires', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        declaredNetQuantity: {
          primary: { value: 30.603, unit: 'g' }, // 2.01% drift
        },
      },
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(true);
  });

  it('attestation 4 minutes in the future (within 5-min clock-skew grace) → cleared at composition', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      identityTestInput: {
        requiredIngredientNames: ['Vitamin C'],
        attestations: [
          {
            id: 'att-c',
            ingredientName: 'Vitamin C',
            supplierName: 'DSM Nutritional Products',
            identityTestMethod: 'HPLC',
            attestedAt: '2026-05-17T12:04:00.000Z', // +4 min from FIXED_NOW
            attestedBy: 'operator',
          },
        ],
        now: FIXED_NOW,
      },
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('attestation at 2000-01-01 (pre-2000 floor boundary) → cleared at composition', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      identityTestInput: {
        requiredIngredientNames: ['Vitamin C'],
        attestations: [
          {
            id: 'att-c',
            ingredientName: 'Vitamin C',
            supplierName: 'Long-Standing Commodity Supplier',
            identityTestMethod: 'organoleptic',
            attestedAt: '2000-01-01T00:00:00.000Z', // at floor boundary
            attestedBy: 'operator',
          },
        ],
        now: FIXED_NOW,
      },
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('caution-tier flag alone ("all natural") → cleared at composition (caution is advisory, not hard-stop)', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      diseaseClaimFlags: analyzeDraftClaim('All natural ingredients'),
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('Mustard (international-additional tier) detected → cleared at composition (advisory tier)', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      allergenMatches: detectAllergensDetailed('Mustard powder'),
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('Review undefined (no review context) + everything else clean → cleared at composition', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      reviewState: undefined,
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('netQuantityInput undefined + identityTestInput undefined + everything else clean → cleared (no context to evaluate)', () => {
    // Caller hasn't yet provided net-quantity or attestation context
    // (e.g., very-early-draft formulation). Conditionally-invoked items
    // don't fire when their input is absent.
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [],
      allergenMatches: [],
      reviewState: 'approved',
    });
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section E — composedItems registry integrity
// ============================================================
describe('Bucket 1 gate pre-flight — Section E: composedItems registry integrity', () => {
  it('cleared result enumerates all 6 expected items for audit-trail visibility', () => {
    const result = evaluateSupplementBucket1Gate(canonicalHappyPath());
    if (result.hardStop) throw new Error('expected cleared');
    expect(result.composedItems).toContain(B1_ALLERGEN_ITEM_ID);
    expect(result.composedItems).toContain(B2_DISEASE_CLAIM_ITEM_ID);
    expect(result.composedItems).toContain(B3_IDENTITY_TEST_ITEM_ID);
    expect(result.composedItems).toContain(B4_DISCLAIMER_ITEM_ID);
    expect(result.composedItems).toContain(B5_NET_QUANTITY_ITEM_ID);
    expect(result.composedItems).toContain(REVIEW_STATE_GATE_ITEM_ID);
  });

  it('composedItems has exactly 6 entries (no unexpected items, no missing items)', () => {
    const result = evaluateSupplementBucket1Gate(canonicalHappyPath());
    if (result.hardStop) throw new Error('expected cleared');
    expect(result.composedItems).toHaveLength(6);
  });
});

// ============================================================
// Section F — Detector → gate end-to-end (realistic input shapes)
// ============================================================
describe('Bucket 1 gate pre-flight — Section F: detector → gate end-to-end', () => {
  it('clean structure/function claim text → analyzeDraftClaim returns clean → gate clears', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      diseaseClaimFlags: analyzeDraftClaim('Supports immune function as part of a healthy lifestyle'),
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('clean ingredient list (no allergens) → detectAllergensDetailed returns empty → gate clears', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      allergenMatches: detectAllergensDetailed('Vitamin C ascorbic acid'),
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('"peanut butter" through detector → Peanuts match (no false-positive Milk) → gate clears', () => {
    // Regression: Phase 2 Step 4 §B1 dropped 'butter' from Milk keywords.
    // End-to-end confirmation that the fix holds at the composition layer.
    const matches: AllergenMatch[] = detectAllergensDetailed('Peanut butter blend');
    const categories = matches.map(m => m.category);
    expect(categories).toContain('Peanuts');
    expect(categories).not.toContain('Milk');

    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      allergenMatches: matches,
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('full happy-path → cleared and hardStop discriminator narrows correctly via isHardStop', () => {
    const result = evaluateSupplementBucket1Gate(canonicalHappyPath());
    expect(isHardStop(result)).toBe(false);
    expect(result.hardStop).toBe(false);
  });

  it('full multi-item refusal → isHardStop narrows correctly', () => {
    const params: SupplementBucket1GateParams = {
      ...canonicalHappyPath(),
      diseaseClaimFlags: analyzeDraftClaim('Cures cancer'),
      reviewState: 'draft',
    };
    const result = evaluateSupplementBucket1Gate(params);
    expect(isHardStop(result)).toBe(true);
  });
});

// Silence unused-import warning when DiseaseClaimFlag isn't directly referenced
export type _Unused = DiseaseClaimFlag;
