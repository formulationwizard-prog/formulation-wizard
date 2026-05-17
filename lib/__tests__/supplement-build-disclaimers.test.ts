// ============================================================
// §B4 — buildDisclaimers claim-count routing
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 follow-up (2026-05-17). Pre-flight
// verification suite for the §B4 follow-up migration: buildDisclaimers
// at lib/supplementClaims.ts now consumes selectSupplementDisclaimer
// at lib/supplementDisclaimer.ts to route between SINGULAR and PLURAL
// CFR forms per 21 CFR 101.93(c)(1) and (c)(2).
//
// Pre-migration bug being fixed: buildDisclaimers always emitted PLURAL
// regardless of claim count, including for labels with exactly one
// structure/function claim (CFR 101.93(c)(1) singular form required).
//
// This suite verifies the post-migration claim-count routing AND
// confirms the asterisk-prefix footnote convention is preserved in
// the returned dsheaDisclaimer string. The asterisk is presentational
// (footnote-linking on the label) and is NOT part of the CFR-verbatim
// text held in SUPPLEMENT_DISCLAIMER_SINGULAR / _PLURAL.
// ============================================================

import { describe, it, expect } from 'vitest';
import { buildDisclaimers } from '../supplementClaims';
import {
  SUPPLEMENT_DISCLAIMER_SINGULAR,
  SUPPLEMENT_DISCLAIMER_PLURAL,
} from '../supplementDisclaimer';

// ============================================================
// Section A — Claim-count routing (CFR 101.93(c)(1)/(c)(2))
// ============================================================
describe('buildDisclaimers — claim-count routing', () => {
  it('claimCount 0 → empty dsheaDisclaimer (no claim → no disclaimer required)', () => {
    const result = buildDisclaimers(0, []);
    expect(result.dsheaDisclaimer).toBe('');
  });

  it('claimCount 1 → SINGULAR form with asterisk-footnote prefix', () => {
    const result = buildDisclaimers(1, []);
    expect(result.dsheaDisclaimer).toBe(`* ${SUPPLEMENT_DISCLAIMER_SINGULAR}`);
  });

  it('claimCount 2 → PLURAL form with asterisk-footnote prefix', () => {
    const result = buildDisclaimers(2, []);
    expect(result.dsheaDisclaimer).toBe(`* ${SUPPLEMENT_DISCLAIMER_PLURAL}`);
  });

  it('claimCount 5 → PLURAL form', () => {
    const result = buildDisclaimers(5, []);
    expect(result.dsheaDisclaimer).toBe(`* ${SUPPLEMENT_DISCLAIMER_PLURAL}`);
  });

  it('claimCount 100 → PLURAL form', () => {
    const result = buildDisclaimers(100, []);
    expect(result.dsheaDisclaimer).toBe(`* ${SUPPLEMENT_DISCLAIMER_PLURAL}`);
  });

  it('negative claimCount → empty (defensive routing through selector)', () => {
    const result = buildDisclaimers(-1, []);
    expect(result.dsheaDisclaimer).toBe('');
  });

  it('claimCount 1 disclaimer contains "This statement has" (singular subject)', () => {
    const result = buildDisclaimers(1, []);
    expect(result.dsheaDisclaimer).toContain('This statement has');
    expect(result.dsheaDisclaimer).not.toContain('These statements have');
  });

  it('claimCount 2 disclaimer contains "These statements have" (plural subject)', () => {
    const result = buildDisclaimers(2, []);
    expect(result.dsheaDisclaimer).toContain('These statements have');
    expect(result.dsheaDisclaimer).not.toContain('This statement has');
  });

  it('disclaimer preserves the FDA anchor across forms', () => {
    expect(buildDisclaimers(1, []).dsheaDisclaimer).toContain('Food and Drug Administration');
    expect(buildDisclaimers(2, []).dsheaDisclaimer).toContain('Food and Drug Administration');
  });
});

// ============================================================
// Section B — additionalWarnings unaffected by claim-count change
// ============================================================
describe('buildDisclaimers — additionalWarnings preserved across migration', () => {
  it('iron-containing ingredient triggers FDA iron warning regardless of claim count', () => {
    const withClaim = buildDisclaimers(1, ['Iron Bisglycinate']);
    const noClaim = buildDisclaimers(0, ['Iron Bisglycinate']);
    expect(withClaim.additionalWarnings.some(w => w.includes('iron-containing'))).toBe(true);
    expect(noClaim.additionalWarnings.some(w => w.includes('iron-containing'))).toBe(true);
  });

  it('caffeine ingredient triggers caffeine warning', () => {
    const result = buildDisclaimers(1, ['Caffeine Anhydrous']);
    expect(result.additionalWarnings.some(w => w.includes('Contains caffeine'))).toBe(true);
  });

  it('clean ingredient list produces no additional warnings', () => {
    const result = buildDisclaimers(1, ['Vitamin C']);
    expect(result.additionalWarnings).toEqual([]);
  });
});
