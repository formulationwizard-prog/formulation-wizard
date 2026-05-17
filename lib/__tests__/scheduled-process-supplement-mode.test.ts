// ============================================================
// determineFilingRequirement — supplement-mode branch
// ------------------------------------------------------------
// Round 11 Phase 3 Workstream A.5 [2/N] (2026-05-17). Tests the
// supplement-mode branch of lib/scheduledProcess.ts
// determineFilingRequirement — closes Phase 2 implementation-
// discovery finding #25g ("21 CFR 113 · 21 CFR 114" citations
// surfaced in supplement-mode Determination Engine).
//
// Pre-Round-11-Workstream-A.5 behavior: filing engine had no
// supplement-mode branch; supplements fell through to the
// `insufficient-data` fallback at the bottom of the function
// (line 169-177) returning F&B citations (21 CFR 113, 21 CFR 114).
//
// Post-fix behavior: explicit supplement-mode branch returns
// supplement-aware citations (21 CFR 111, DSHEA, FALCPA, 21 CFR
// 101.36/.93) + supplement-aware reason text. processAuthorityRequired
// stays true so the AdvisoryNotice fires with supplement-mode copy
// (handled at the AdvisoryNotice layer per #25f).
// ============================================================

import { describe, it, expect } from 'vitest';
import { determineFilingRequirement } from '../scheduledProcess';

describe('determineFilingRequirement — supplement-mode branch (#25g closure)', () => {
  it('mode=supplements with empty specs → supplement-specific citations (NOT 21 CFR 113/114)', () => {
    const result = determineFilingRequirement(null, {}, 'supplements');
    expect(result.citations).not.toContain('21 CFR 113');
    expect(result.citations).not.toContain('21 CFR 114');
    expect(result.citations.some(c => c.includes('21 CFR 111'))).toBe(true);
  });

  it('mode=supplements citations name DSHEA + 21 CFR 101 anchors', () => {
    const result = determineFilingRequirement(null, {}, 'supplements');
    expect(result.citations.some(c => c.includes('DSHEA'))).toBe(true);
    expect(result.citations.some(c => c.includes('21 CFR 101'))).toBe(true);
  });

  it('mode=supplements with arbitrary productClassification → still routes to supplement branch (not F&B classification)', () => {
    // Even if specs.productClassification is set to an F&B value (which
    // shouldn't happen in supplement mode but verifies the mode check
    // takes priority over classification routing), supplement-mode
    // branch wins.
    const result = determineFilingRequirement(null, {
      productClassification: 'lacf',
      pH: 6.5,
      aw: 0.95,
    }, 'supplements');
    expect(result.citations).not.toContain('21 CFR 113');
    expect(result.citations).not.toContain('21 CFR 114');
    expect(result.formName).not.toMatch(/2541/);
  });

  it('mode=supplements does NOT trigger Scheduled Process Filing (formName routes to 21 CFR 111 cGMP framework)', () => {
    const result = determineFilingRequirement(null, {}, 'supplements');
    expect(result.required).toBe(false);
    expect(result.formName).toMatch(/21 CFR 111|cGMP/);
  });

  it('mode=supplements reason text references 21 CFR 111 cGMP and DSHEA framework', () => {
    const result = determineFilingRequirement(null, {}, 'supplements');
    expect(result.reason).toContain('21 CFR 111');
    expect(result.reason.toLowerCase()).toContain('cgmp');
  });

  it('mode=supplements keeps processAuthorityRequired: true (AdvisoryNotice fires with mode-aware copy)', () => {
    // The boolean stays true so the DeterminationEngineCard's showAdvisory
    // gate fires; AdvisoryNotice renders supplement-mode copy via the mode
    // prop threaded through from DeterminationEngineCard. This is #25f's
    // closure mechanism — the boolean semantics are preserved across modes,
    // only the user-facing text branches.
    const result = determineFilingRequirement(null, {}, 'supplements');
    expect(result.processAuthorityRequired).toBe(true);
  });

  it('mode=supplements urgency is "recommended" (not "critical" — no Scheduled Process filing applies)', () => {
    const result = determineFilingRequirement(null, {}, 'supplements');
    expect(result.urgency).toBe('recommended');
  });
});

describe('determineFilingRequirement — F&B backward compatibility (no regression)', () => {
  it('mode omitted → F&B logic (unchanged from pre-Round-11)', () => {
    const result = determineFilingRequirement(null, { productClassification: 'lacf', pH: 6.5, aw: 0.95 });
    expect(result.required).toBe(true);
    expect(result.citations).toContain('21 CFR 113');
  });

  it('mode=fb (explicit) → F&B logic (same as omitted)', () => {
    const result = determineFilingRequirement(null, { productClassification: 'lacf', pH: 6.5, aw: 0.95 }, 'fb');
    expect(result.citations).toContain('21 CFR 113');
  });

  it('mode=fb acidified classification → F&B Form 2541e (unchanged)', () => {
    const result = determineFilingRequirement(null, {
      productClassification: 'acidified',
      pH: 4.0,
      lowAcidComponentPct: 30,
    }, 'fb');
    expect(result.formName).toBe('FDA 2541e');
  });
});
