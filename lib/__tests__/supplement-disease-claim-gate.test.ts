// ============================================================
// §B2 — DISEASE-CLAIM HARD-STOP GATE (Round 11 Phase 2 Step 4)
// ------------------------------------------------------------
// Pre-flight verification suite for evaluateDiseaseClaimGate() at
// lib/supplementClaims.ts. Tests the per-§B-item gate evaluator
// that composes DiseaseClaimFlag[] into a HardStop | cleared
// result. Mirrors the F&B-side per-item gate pattern at
// lib/__tests__/section-3d-bucket-a-gate.test.ts.
//
// Coverage:
//   • Cleared cases — empty flags, caution-only flags, source marker
//   • Hard-stop cases — disease tier, drug-claim tier, mixed tiers,
//     source marker, CFR citation in evidence, reason string
//   • Caution-tier filtering — caution flags do not trigger refusal
//     and do not appear in evidence (advisory bar, not DSHEA §201(g)(1)(C))
//   • End-to-end with analyzeDraftClaim — clean text, empty text,
//     disease+drug-claim text, caution-only text
//   • Composition-registry identifier export
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  analyzeDraftClaim,
  evaluateDiseaseClaimGate,
  B2_DISEASE_CLAIM_ITEM_ID,
  type DiseaseClaimFlag,
} from '../supplementClaims';
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
// Section A — Cleared (no hard-stop) cases
// ============================================================
describe('evaluateDiseaseClaimGate — cleared cases', () => {
  it('empty flags array → cleared', () => {
    const result = evaluateDiseaseClaimGate([]);
    expect(result.hardStop).toBe(false);
    expect(result.source).toBe('supplement-disease-claim');
  });

  it('caution-tier flags alone → cleared (caution is FTC bar, not DSHEA hard-stop)', () => {
    const flags = [
      makeFlag({ tier: 'caution', match: 'natural', explanation: 'FTC puffery scrutiny.' }),
      makeFlag({ tier: 'caution', match: 'detox', explanation: 'not FDA-recognized.' }),
      makeFlag({ tier: 'caution', match: 'immune booster', explanation: 'implies disease prevention.' }),
    ];
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(false);
    expect(result.source).toBe('supplement-disease-claim');
  });

  it('cleared result carries the source marker', () => {
    const result = evaluateDiseaseClaimGate([]);
    if (result.hardStop) throw new Error('expected cleared result');
    expect(result.source).toBe('supplement-disease-claim');
  });
});

// ============================================================
// Section B — Hard-stop cases
// ============================================================
describe('evaluateDiseaseClaimGate — hard-stop cases', () => {
  it('single disease-tier flag → hard-stop fires', () => {
    const flags = [
      makeFlag({ tier: 'disease', match: 'cancer', explanation: 'Cancer claims are drug claims.' }),
    ];
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it('single drug-claim-tier flag → hard-stop fires', () => {
    const flags = [
      makeFlag({ tier: 'drug-claim', match: 'treats', explanation: '"Treats" is a drug claim.' }),
    ];
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(true);
  });

  it('mixed disease + drug-claim → hard-stop fires with multiple evidence items', () => {
    const flags = [
      makeFlag({ tier: 'disease', match: 'cancer', explanation: 'Cancer claims are drug claims.' }),
      makeFlag({ tier: 'drug-claim', match: 'cures', explanation: '"Cures" is a drug claim.' }),
    ];
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(2);
  });

  it('disease + caution → hard-stop fires; caution flag is filtered from evidence', () => {
    const flags = [
      makeFlag({ tier: 'disease', match: 'diabetes', explanation: 'Diabetes claims are drug claims.' }),
      makeFlag({ tier: 'caution', match: 'natural', explanation: 'FTC puffery.' }),
    ];
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toBe('diabetes');
  });

  it('hard-stop result carries the source marker', () => {
    const flags = [makeFlag({ tier: 'disease', match: 'cancer' })];
    const result = evaluateDiseaseClaimGate(flags);
    if (!result.hardStop) throw new Error('expected hard-stop result');
    expect(result.source).toBe('supplement-disease-claim');
  });

  it('hard-stop evidence carries CFR citation per harm-critical-floor inventory', () => {
    const flags = [makeFlag({ tier: 'disease', match: 'cancer', explanation: 'Cancer claims are drug claims.' })];
    const result = evaluateDiseaseClaimGate(flags);
    if (!result.hardStop) throw new Error('expected hard-stop result');
    expect(result.evidence[0].citation).toContain('21 CFR 101.93(g)');
  });

  it('hard-stop evidence subject names the offending pattern match', () => {
    const flags = [makeFlag({ tier: 'disease', match: 'cancer', explanation: 'Cancer claims are drug claims.' })];
    const result = evaluateDiseaseClaimGate(flags);
    if (!result.hardStop) throw new Error('expected hard-stop result');
    expect(result.evidence[0].subject).toBe('cancer');
  });

  it('hard-stop evidence detail includes tier marker for audit-trail visibility', () => {
    const flags = [makeFlag({ tier: 'drug-claim', match: 'treats', explanation: '"Treats" is a drug claim.' })];
    const result = evaluateDiseaseClaimGate(flags);
    if (!result.hardStop) throw new Error('expected hard-stop result');
    expect(result.evidence[0].detail.toLowerCase()).toContain('drug-claim');
  });

  it('hard-stop reason for a single flag names the offending pattern', () => {
    const flags = [makeFlag({ tier: 'disease', match: 'cancer' })];
    const result = evaluateDiseaseClaimGate(flags);
    if (!result.hardStop) throw new Error('expected hard-stop result');
    expect(result.reason).toContain('cancer');
  });

  it('hard-stop reason for multiple flags surfaces the count', () => {
    const flags = [
      makeFlag({ tier: 'disease', match: 'cancer' }),
      makeFlag({ tier: 'disease', match: 'diabetes' }),
      makeFlag({ tier: 'drug-claim', match: 'treats' }),
    ];
    const result = evaluateDiseaseClaimGate(flags);
    if (!result.hardStop) throw new Error('expected hard-stop result');
    expect(result.reason).toContain('3');
  });
});

// ============================================================
// Section C — End-to-end with analyzeDraftClaim
// ============================================================
describe('evaluateDiseaseClaimGate — end-to-end with analyzeDraftClaim', () => {
  it('empty claim text → analyzeDraftClaim returns empty → gate clears', () => {
    const flags = analyzeDraftClaim('');
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(false);
  });

  it('whitespace-only claim text → analyzeDraftClaim returns empty → gate clears', () => {
    const flags = analyzeDraftClaim('   \n\t  ');
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(false);
  });

  it('clean structure/function claim → gate clears (no patterns matched)', () => {
    const flags = analyzeDraftClaim('Supports healthy immune function');
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(false);
  });

  it('"Helps manage stress" → gate clears (no patterns matched)', () => {
    const flags = analyzeDraftClaim('Helps manage stress as part of a healthy lifestyle');
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(false);
  });

  it('"Treats diabetes" → analyzeDraftClaim returns disease + drug-claim → gate hard-stops', () => {
    const flags = analyzeDraftClaim('Treats diabetes');
    expect(flags.length).toBeGreaterThanOrEqual(2);
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(true);
  });

  it('"Cures cancer" → gate hard-stops on disease + drug-claim tier matches', () => {
    const flags = analyzeDraftClaim('Cures cancer');
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(true);
  });

  it('"Lowers cholesterol" → gate hard-stops on drug-claim biomarker-lowering pattern', () => {
    const flags = analyzeDraftClaim('Lowers cholesterol');
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(true);
  });

  it('"all-natural blend" → caution tier only → gate clears (caution does not block export)', () => {
    const flags = analyzeDraftClaim('Our all-natural blend');
    // 'natural' is a caution-tier pattern; gate should not trigger hard-stop
    expect(flags.some(f => f.tier === 'caution')).toBe(true);
    expect(flags.some(f => f.tier === 'disease' || f.tier === 'drug-claim')).toBe(false);
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(false);
  });

  it('"FDA-approved miracle detox" → caution-only flags → gate clears', () => {
    const flags = analyzeDraftClaim('FDA-approved miracle detox');
    expect(flags.every(f => f.tier === 'caution')).toBe(true);
    const result = evaluateDiseaseClaimGate(flags);
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section D — Composition-registry identifier
// ============================================================
describe('§B2 composition-registry identifier', () => {
  it('exports a stable identifier consumed by the Bucket 1 gate', () => {
    // Identifier value is referenced by lib/supplementBucket1Gate.ts
    // COMPOSED_ITEMS registry. Renaming it requires updating the gate.
    expect(B2_DISEASE_CLAIM_ITEM_ID).toBe('b2-disease-claim-hard-stop');
  });
});
