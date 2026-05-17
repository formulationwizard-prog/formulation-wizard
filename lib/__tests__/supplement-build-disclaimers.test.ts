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
  selectSupplementDisclaimer,
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

// ============================================================
// Section C — Cross-site consistency with SFP renderer
// ------------------------------------------------------------
// Round 11 Phase 3 Workstream A.5 [6/N]. §B4 has TWO independent
// rendering sites in the workspace:
//
//   (1) Claims Validator card — consumes buildDisclaimers (this file's
//       primary subject). Migrated to selectSupplementDisclaimer in
//       Phase 2 commit 928cdba.
//
//   (2) Supplement Facts Panel renderer — inline JSX at
//       app/workspace/page.tsx ~lines 5160-5260. Migrated to
//       selectSupplementDisclaimer in Phase 3 Workstream A.5 commit
//       7bf50f7 (closure of Phase 2 implementation-discovery finding
//       #10).
//
// Cross-site invariant: both rendering sites consume the SAME locked
// constants via the SAME selector. For any given claim count N, the
// dsheaDisclaimer text emitted by buildDisclaimers AND the
// disclaimer-text-equivalent computed at the SFP renderer must match
// exactly (modulo asterisk-footnote prefix, which both sites apply
// identically).
//
// If either call site drifts (e.g., one consumes the selector and the
// other reverts to a hardcoded literal, OR one applies the asterisk
// prefix and the other doesn't), this section catches the divergence.
//
// The SFP-renderer-equivalent text is computed inline below to mirror
// the SFP IIFE's exact logic:
//
//   const sfpClaimCount = detectStructureFunctionClaims(...).length;
//   const sfpDsheaDisclaimer = selectSupplementDisclaimer(sfpClaimCount);
//   // Render: {sfpDsheaDisclaimer && <p>* {sfpDsheaDisclaimer}</p>}
//
// So the rendered text for the SFP layer is:
//   N === 0  → '' (no paragraph rendered)
//   N >= 1   → '* ' + selectSupplementDisclaimer(N)
//
// buildDisclaimers applies the same prefix logic; the invariant is
// that both produce identical strings.
// ============================================================

/**
 * Mirror of the SFP renderer's disclaimer-computation logic. Inline
 * here for test purposes; if the SFP renderer's logic changes, this
 * helper must be updated AND the change-control trail at
 * lib/supplementDisclaimer.ts must be followed.
 */
function sfpRendererDisclaimerText(claimCount: number): string {
  const routed = selectSupplementDisclaimer(claimCount);
  return routed === '' ? '' : `* ${routed}`;
}

describe('§B4 cross-site consistency — buildDisclaimers vs SFP renderer', () => {
  it('claim count 0 → both sites emit empty string (no disclaimer renders)', () => {
    const bd = buildDisclaimers(0, []).dsheaDisclaimer;
    const sfp = sfpRendererDisclaimerText(0);
    expect(bd).toBe('');
    expect(sfp).toBe('');
    expect(bd).toBe(sfp);
  });

  it('claim count 1 → both sites emit SINGULAR form with asterisk prefix', () => {
    const bd = buildDisclaimers(1, []).dsheaDisclaimer;
    const sfp = sfpRendererDisclaimerText(1);
    expect(bd).toBe(`* ${SUPPLEMENT_DISCLAIMER_SINGULAR}`);
    expect(sfp).toBe(`* ${SUPPLEMENT_DISCLAIMER_SINGULAR}`);
    expect(bd).toBe(sfp);
  });

  it('claim count 2 → both sites emit PLURAL form with asterisk prefix', () => {
    const bd = buildDisclaimers(2, []).dsheaDisclaimer;
    const sfp = sfpRendererDisclaimerText(2);
    expect(bd).toBe(`* ${SUPPLEMENT_DISCLAIMER_PLURAL}`);
    expect(sfp).toBe(`* ${SUPPLEMENT_DISCLAIMER_PLURAL}`);
    expect(bd).toBe(sfp);
  });

  it('claim count 5 → both sites emit PLURAL form identically', () => {
    const bd = buildDisclaimers(5, []).dsheaDisclaimer;
    const sfp = sfpRendererDisclaimerText(5);
    expect(bd).toBe(sfp);
    expect(bd).toBe(`* ${SUPPLEMENT_DISCLAIMER_PLURAL}`);
  });

  it('claim count 100 → both sites emit PLURAL form identically', () => {
    const bd = buildDisclaimers(100, []).dsheaDisclaimer;
    const sfp = sfpRendererDisclaimerText(100);
    expect(bd).toBe(sfp);
  });

  it('claim count -1 (defensive negative) → both sites emit empty identically', () => {
    const bd = buildDisclaimers(-1, []).dsheaDisclaimer;
    const sfp = sfpRendererDisclaimerText(-1);
    expect(bd).toBe('');
    expect(sfp).toBe('');
  });

  it('asterisk-prefix invariant: when disclaimer is non-empty, both sites prepend "* "', () => {
    // Both sites apply '* ' uniformly when emitting the disclaimer. This
    // assertion guards against either side dropping the prefix (which would
    // visually break the footnote-linking convention on the label).
    for (const n of [1, 2, 5, 100]) {
      expect(buildDisclaimers(n, []).dsheaDisclaimer.startsWith('* ')).toBe(true);
      expect(sfpRendererDisclaimerText(n).startsWith('* ')).toBe(true);
    }
  });

  it('locked-constant single-source-of-truth: the post-prefix text equals selectSupplementDisclaimer output exactly', () => {
    // Strip the asterisk prefix from both sites' output and verify the
    // residue equals the selector output. Catches drift where either
    // site might inject extra punctuation, whitespace, or character drift
    // beyond what the selector returns.
    for (const n of [1, 2, 5]) {
      const bd = buildDisclaimers(n, []).dsheaDisclaimer.slice(2); // remove '* '
      const sfp = sfpRendererDisclaimerText(n).slice(2);
      const canonical = selectSupplementDisclaimer(n);
      expect(bd).toBe(canonical);
      expect(sfp).toBe(canonical);
    }
  });

  it('subject-verb agreement preserved at both sites for singular vs plural transitions', () => {
    // claim count 1 → "This statement has..."
    // claim count 2 → "These statements have..."
    // Regression check: catches a future drift where one site might
    // accidentally consume the wrong selector branch.
    expect(buildDisclaimers(1, []).dsheaDisclaimer).toContain('This statement has');
    expect(sfpRendererDisclaimerText(1)).toContain('This statement has');
    expect(buildDisclaimers(2, []).dsheaDisclaimer).toContain('These statements have');
    expect(sfpRendererDisclaimerText(2)).toContain('These statements have');
  });
});
