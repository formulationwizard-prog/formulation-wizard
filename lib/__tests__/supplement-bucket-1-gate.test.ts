// ============================================================
// Round 11 Phase 2 Step 4 — Bucket 1 composition gate vitest
// ------------------------------------------------------------
// Coverage for lib/supplementBucket1Gate.ts evaluateSupplementBucket1Gate.
// Tests the composition pattern that aggregates per-§B-item gate
// outputs (DiseaseClaimFlag[] → §B2 hard-stop; Review.currentState
// → review-state hard-stop; etc.) into a single Bucket 1 result.
//
// Mirrors the F&B-side composition test pattern at
// lib/__tests__/section-3d-bucket-a-gate.test.ts. The Bucket 1
// gate is the supplement-side architectural analogue of Bucket A.
//
// Coverage at Step 4 close:
//   • Empty params → cleared with composedItems registry visible
//   • §B2 composition — disease-claim flags trigger Bucket 1 hard-stop
//   • §B2 caution-only — no Bucket 1 hard-stop (advisory tier filtered)
//   • Source marker on cleared + hard-stop branches
//   • Evidence aggregation when §B2 flags fire
//   • Review.currentState composition (added in the follow-up commit
//     immediately after §B2) — tests for that gate input land in the
//     same file once Review.currentState composes into params
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  evaluateSupplementBucket1Gate,
  type SupplementBucket1GateParams,
} from '../supplementBucket1Gate';
import type { DiseaseClaimFlag } from '../supplementClaims';
import { B2_DISEASE_CLAIM_ITEM_ID } from '../supplementClaims';
import { B4_DISCLAIMER_ITEM_ID } from '../supplementDisclaimer';
import { REVIEW_STATE_GATE_ITEM_ID } from '../reviewState';
import {
  B1_ALLERGEN_ITEM_ID,
  ALLERGEN_REGULATORY_METADATA,
  type AllergenMatch,
} from '../supplementAllergen';
import { B5_NET_QUANTITY_ITEM_ID } from '../netQuantity';
import { isHardStop } from '../hardStop';

// ─── Test fixtures ──────────────────────────────────────────────

function makeFlag(overrides: Partial<DiseaseClaimFlag> = {}): DiseaseClaimFlag {
  return {
    match: '__test__',
    tier: 'disease',
    explanation: 'test explanation',
    ...overrides,
  };
}

// ============================================================
// Section A — Empty / cleared baseline
// ============================================================
describe('evaluateSupplementBucket1Gate — empty / cleared baseline', () => {
  it('no params → cleared', () => {
    const result = evaluateSupplementBucket1Gate();
    expect(result.hardStop).toBe(false);
  });

  it('explicit empty params → cleared', () => {
    const params: SupplementBucket1GateParams = {};
    const result = evaluateSupplementBucket1Gate(params);
    expect(result.hardStop).toBe(false);
  });

  it('cleared result carries the source marker', () => {
    const result = evaluateSupplementBucket1Gate();
    if (result.hardStop) throw new Error('expected cleared');
    expect(result.source).toBe('supplement-bucket-1');
  });

  it('cleared result exposes composedItems registry for audit-trail visibility', () => {
    const result = evaluateSupplementBucket1Gate();
    if (result.hardStop) throw new Error('expected cleared');
    expect(result.composedItems).toContain(B4_DISCLAIMER_ITEM_ID);
    expect(result.composedItems).toContain(B2_DISEASE_CLAIM_ITEM_ID);
    expect(result.composedItems).toContain(B1_ALLERGEN_ITEM_ID);
    expect(result.composedItems).toContain(B5_NET_QUANTITY_ITEM_ID);
    expect(result.composedItems).toContain(REVIEW_STATE_GATE_ITEM_ID);
  });
});

function makeAllergenMatch(overrides: Partial<AllergenMatch> = {}): AllergenMatch {
  const category = overrides.category ?? 'Milk';
  return {
    category,
    matchedKeyword: 'milk',
    requiresSpeciesNaming: false,
    regulatoryTier: ALLERGEN_REGULATORY_METADATA[category].tier,
    ...overrides,
  };
}

// ============================================================
// Section B' — §B1 allergen composition
// ============================================================
describe('evaluateSupplementBucket1Gate — §B1 allergen composition', () => {
  it('empty allergenMatches → cleared', () => {
    const result = evaluateSupplementBucket1Gate({ allergenMatches: [] });
    expect(result.hardStop).toBe(false);
  });

  it('allergen with species named → cleared', () => {
    const matches = [
      makeAllergenMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
    ];
    const result = evaluateSupplementBucket1Gate({ allergenMatches: matches });
    expect(result.hardStop).toBe(false);
  });

  it('non-species-required allergen without species → cleared (Milk does not require species)', () => {
    const matches = [makeAllergenMatch({ category: 'Milk' })];
    const result = evaluateSupplementBucket1Gate({ allergenMatches: matches });
    expect(result.hardStop).toBe(false);
  });

  it('Tree Nuts generic term, species undefined → Bucket 1 hard-stop fires', () => {
    const matches = [
      makeAllergenMatch({
        category: 'Tree Nuts',
        species: undefined,
        requiresSpeciesNaming: true,
        matchedKeyword: 'tree nut',
      }),
    ];
    const result = evaluateSupplementBucket1Gate({ allergenMatches: matches });
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it('§B1 hard-stop carries Bucket 1 source marker', () => {
    const matches = [
      makeAllergenMatch({
        category: 'Fish',
        species: undefined,
        requiresSpeciesNaming: true,
        matchedKeyword: 'fish',
      }),
    ];
    const result = evaluateSupplementBucket1Gate({ allergenMatches: matches });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.source).toBe('supplement-bucket-1');
  });

  it('§B1 hard-stop evidence detail names the offending category', () => {
    const matches = [
      makeAllergenMatch({
        category: 'Shellfish',
        species: undefined,
        requiresSpeciesNaming: true,
        matchedKeyword: 'shellfish',
      }),
    ];
    const result = evaluateSupplementBucket1Gate({ allergenMatches: matches });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence[0].detail).toContain('Shellfish');
  });
});

// ============================================================
// Section B'' — §B5 net quantity composition
// ============================================================
describe('evaluateSupplementBucket1Gate — §B5 net quantity composition', () => {
  it('undefined netQuantityInput → §B5 not evaluated; gate cleared at this composition layer', () => {
    const result = evaluateSupplementBucket1Gate({ netQuantityInput: undefined });
    expect(result.hardStop).toBe(false);
  });

  it('netQuantityInput with valid declaration + matching computed mass → cleared', () => {
    const result = evaluateSupplementBucket1Gate({
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        declaredNetQuantity: {
          primary: { value: 30, unit: 'g' },
        },
      },
    });
    expect(result.hardStop).toBe(false);
  });

  it('netQuantityInput with missing declaration → Bucket 1 hard-stop fires', () => {
    const result = evaluateSupplementBucket1Gate({
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
      },
    });
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it('netQuantityInput with tolerance breach → Bucket 1 hard-stop fires', () => {
    const result = evaluateSupplementBucket1Gate({
      netQuantityInput: {
        form: 'solid',
        totalMassG: 30,
        declaredNetQuantity: {
          primary: { value: 35, unit: 'g' },
        },
      },
    });
    expect(result.hardStop).toBe(true);
  });

  it('§B5 hard-stop carries Bucket 1 source marker', () => {
    const result = evaluateSupplementBucket1Gate({
      netQuantityInput: { form: 'solid', totalMassG: 30 },
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.source).toBe('supplement-bucket-1');
  });

  it('§B5 hard-stop evidence detail names the net-quantity defect', () => {
    const result = evaluateSupplementBucket1Gate({
      netQuantityInput: { form: 'solid', totalMassG: 30 },
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(
      result.evidence.some(e => e.detail.toLowerCase().includes('net quantity')),
    ).toBe(true);
  });
});

// ============================================================
// Section C' — Combined §B2 + §B1 + Review.currentState composition
// ============================================================
describe('evaluateSupplementBucket1Gate — three-item composition', () => {
  it('§B2 disease + §B1 species violation + draft reviewState → all three fire; evidence aggregates', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [makeFlag({ tier: 'disease', match: 'cancer' })],
      allergenMatches: [
        makeAllergenMatch({
          category: 'Tree Nuts',
          species: undefined,
          requiresSpeciesNaming: true,
          matchedKeyword: 'tree nut',
        }),
      ],
      reviewState: 'draft',
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(3);
    const subjects = result.evidence.map(e => e.subject);
    expect(subjects).toContain('cancer');
    expect(subjects.some(s => s.includes('Tree Nuts'))).toBe(true);
    expect(subjects).toContain('PA review state');
  });

  it('all three items clear → cleared', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [],
      allergenMatches: [
        makeAllergenMatch({ category: 'Tree Nuts', species: 'Almonds', requiresSpeciesNaming: true }),
        makeAllergenMatch({ category: 'Milk' }),
      ],
      reviewState: 'approved',
    });
    expect(result.hardStop).toBe(false);
  });

  it('§B1 fires alone (other items clear) → hard-stop with single §B1 evidence', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [],
      allergenMatches: [
        makeAllergenMatch({
          category: 'Fish',
          species: undefined,
          requiresSpeciesNaming: true,
          matchedKeyword: 'fish',
        }),
      ],
      reviewState: 'approved',
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toContain('Fish');
  });

  it('§B2 + §B1 + §B5 + Review.currentState all fire → 4 evidence items aggregated', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [makeFlag({ tier: 'disease', match: 'cancer' })],
      allergenMatches: [
        makeAllergenMatch({
          category: 'Tree Nuts',
          species: undefined,
          requiresSpeciesNaming: true,
          matchedKeyword: 'tree nut',
        }),
      ],
      netQuantityInput: { form: 'solid', totalMassG: 30 },
      reviewState: 'draft',
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(4);
  });
});

// ============================================================
// Section B — §B2 composition
// ============================================================
describe('evaluateSupplementBucket1Gate — §B2 disease-claim composition', () => {
  it('empty diseaseClaimFlags → cleared', () => {
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: [] });
    expect(result.hardStop).toBe(false);
  });

  it('caution-only diseaseClaimFlags → cleared (caution tier is advisory)', () => {
    const flags = [
      makeFlag({ tier: 'caution', match: 'natural' }),
      makeFlag({ tier: 'caution', match: 'detox' }),
    ];
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: flags });
    expect(result.hardStop).toBe(false);
  });

  it('single disease-tier flag → Bucket 1 hard-stop fires', () => {
    const flags = [makeFlag({ tier: 'disease', match: 'cancer' })];
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: flags });
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it('single drug-claim-tier flag → Bucket 1 hard-stop fires', () => {
    const flags = [makeFlag({ tier: 'drug-claim', match: 'treats' })];
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: flags });
    expect(result.hardStop).toBe(true);
  });

  it('Bucket 1 hard-stop carries source supplement-bucket-1 (not per-item source)', () => {
    const flags = [makeFlag({ tier: 'disease', match: 'cancer' })];
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: flags });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.source).toBe('supplement-bucket-1');
  });

  it('Bucket 1 hard-stop aggregates §B2 evidence into the unified evidence array', () => {
    const flags = [
      makeFlag({ tier: 'disease', match: 'cancer' }),
      makeFlag({ tier: 'drug-claim', match: 'cures' }),
    ];
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: flags });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence).toHaveLength(2);
    expect(result.evidence.map(e => e.subject)).toContain('cancer');
    expect(result.evidence.map(e => e.subject)).toContain('cures');
  });

  it('Bucket 1 hard-stop reason summarizes the harm-critical floor violation', () => {
    const flags = [makeFlag({ tier: 'disease', match: 'cancer' })];
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: flags });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.reason.toLowerCase()).toContain('refuse-to-export');
  });

  it('caution flags mixed with disease flag → hard-stop fires; caution absent from evidence', () => {
    const flags = [
      makeFlag({ tier: 'disease', match: 'diabetes' }),
      makeFlag({ tier: 'caution', match: 'miracle' }),
    ];
    const result = evaluateSupplementBucket1Gate({ diseaseClaimFlags: flags });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toBe('diabetes');
  });
});

// ============================================================
// Section C — Review.currentState composition
// ============================================================
describe('evaluateSupplementBucket1Gate — Review.currentState composition', () => {
  it('undefined reviewState → cleared (no state context at composition layer)', () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: undefined });
    expect(result.hardStop).toBe(false);
  });

  it("reviewState 'approved' → cleared (export-eligible)", () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: 'approved' });
    expect(result.hardStop).toBe(false);
  });

  it("reviewState 'version_locked' → cleared (export-eligible)", () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: 'version_locked' });
    expect(result.hardStop).toBe(false);
  });

  it("reviewState 'draft' → Bucket 1 hard-stop fires", () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: 'draft' });
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it("reviewState 'submitted' → Bucket 1 hard-stop fires", () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: 'submitted' });
    expect(result.hardStop).toBe(true);
  });

  it("reviewState 'rejected' → Bucket 1 hard-stop fires", () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: 'rejected' });
    expect(result.hardStop).toBe(true);
  });

  it('review-state hard-stop carries Bucket 1 source marker (not per-item source)', () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: 'draft' });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.source).toBe('supplement-bucket-1');
  });

  it('review-state hard-stop evidence detail names the state and required allowlist', () => {
    const result = evaluateSupplementBucket1Gate({ reviewState: 'submitted' });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].detail).toContain('submitted');
    expect(result.evidence[0].detail).toContain('approved');
    expect(result.evidence[0].detail).toContain('version_locked');
  });
});

// ============================================================
// Section D — Combined §B2 + Review.currentState composition
// ============================================================
describe('evaluateSupplementBucket1Gate — combined composition', () => {
  it('§B2 disease flag + draft reviewState → both fire; evidence aggregates', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [makeFlag({ tier: 'disease', match: 'cancer' })],
      reviewState: 'draft',
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(2);
    expect(result.evidence.map(e => e.subject)).toContain('cancer');
    expect(result.evidence.map(e => e.subject)).toContain('PA review state');
  });

  it('§B2 cleared + approved reviewState → cleared', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [],
      reviewState: 'approved',
    });
    expect(result.hardStop).toBe(false);
  });

  it('§B2 caution-only + version_locked reviewState → cleared', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [makeFlag({ tier: 'caution', match: 'natural' })],
      reviewState: 'version_locked',
    });
    expect(result.hardStop).toBe(false);
  });

  it('§B2 hard-stop + approved reviewState → §B2 fires alone; review-state cleared', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [makeFlag({ tier: 'drug-claim', match: 'treats' })],
      reviewState: 'approved',
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toBe('treats');
  });

  it('§B2 cleared + draft reviewState → review-state fires alone', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [],
      reviewState: 'draft',
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toBe('PA review state');
  });

  it('multi-item hard-stop reason summarizes count', () => {
    const result = evaluateSupplementBucket1Gate({
      diseaseClaimFlags: [
        makeFlag({ tier: 'disease', match: 'cancer' }),
        makeFlag({ tier: 'drug-claim', match: 'treats' }),
      ],
      reviewState: 'rejected',
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence).toHaveLength(3);
    expect(result.reason).toContain('3');
  });
});
