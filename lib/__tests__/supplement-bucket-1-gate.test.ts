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
