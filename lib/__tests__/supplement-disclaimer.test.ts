// ============================================================
// §B4 — SUPPLEMENT_DISCLAIMER change-control snapshot
// ------------------------------------------------------------
// Round 11 Phase 1 Step 4 (2026-05-15). Asserts the locked
// constants at lib/supplementDisclaimer.ts match frozen snapshots
// of the 21 CFR 101.93(c)(1) and (c)(2) verbatim text. Any change
// to the constants fails this test until the snapshot is updated
// in the same commit per the change-control process documented in
// lib/supplementDisclaimer.ts.
//
// Mirrors the F&B-side architectural model at
// lib/__tests__/section-4-regulatory-disclaimer.test.ts (Round 10
// Section 4 / Finding N3). Same docblock discipline, same locked-
// constant pattern, same change-control gate.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  SUPPLEMENT_DISCLAIMER_SINGULAR,
  SUPPLEMENT_DISCLAIMER_PLURAL,
  selectSupplementDisclaimer,
  B4_DISCLAIMER_ITEM_ID,
} from '../supplementDisclaimer';

describe('§B4 — SUPPLEMENT_DISCLAIMER change-control snapshot', () => {

  // ============================================================
  // FROZEN SNAPSHOTS — DO NOT UPDATE WITHOUT THE PROCESS BELOW
  // ============================================================
  //
  // These snapshots are the authoritative locked text per CFR. If
  // a test fails, the constant was modified. Two valid responses:
  //
  //   (a) Revert the constant change. The previous wording is the
  //       legal safety net — review commit history for prior author
  //       + rationale before deciding the change is intentional.
  //
  //   (b) If the change is intentional and process-approved, update
  //       the snapshot to match in the SAME commit, AND ensure the
  //       PR description names:
  //         - The FDA-recognized Process Authority who reviewed the
  //           new wording (or the CFR amendment justifying it)
  //         - The operator approving the change
  //         - The rationale (what policy shift or CFR change the
  //           new wording reflects)
  //       Also update docs/architecture/harm-critical-floor.md §B4
  //       and docs/regulatory/phase-1-companion-compliance-spec.md
  //       §B4 if the change reflects a policy shift, not just a
  //       typographic correction.
  //
  // Updating the snapshot WITHOUT the PR-description trail is a
  // Bucket 1 discipline violation. Reviewers should reject the PR
  // until the trail is present.
  // ============================================================

  // 21 CFR 101.93(c)(1) — single statement form
  const FROZEN_SINGULAR =
    'This statement has not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.';

  // 21 CFR 101.93(c)(2) — plural form for multiple statements
  const FROZEN_PLURAL =
    'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.';

  it('SUPPLEMENT_DISCLAIMER_SINGULAR matches the frozen CFR 101.93(c)(1) snapshot', () => {
    expect(SUPPLEMENT_DISCLAIMER_SINGULAR).toBe(FROZEN_SINGULAR);
  });

  it('SUPPLEMENT_DISCLAIMER_PLURAL matches the frozen CFR 101.93(c)(2) snapshot', () => {
    expect(SUPPLEMENT_DISCLAIMER_PLURAL).toBe(FROZEN_PLURAL);
  });

  it('Singular and plural forms agree in subject and verb (sanity)', () => {
    // Singular: "This statement has not been evaluated..."
    expect(SUPPLEMENT_DISCLAIMER_SINGULAR.startsWith('This statement has')).toBe(true);
    // Plural: "These statements have not been evaluated..."
    expect(SUPPLEMENT_DISCLAIMER_PLURAL.startsWith('These statements have')).toBe(true);
    // Past "has"/"have", the rest of the disclaimer text is identical
    // (subject-verb agreement is the only difference per CFR).
    const singularRest = SUPPLEMENT_DISCLAIMER_SINGULAR.slice('This statement has'.length);
    const pluralRest = SUPPLEMENT_DISCLAIMER_PLURAL.slice('These statements have'.length);
    expect(singularRest).toBe(pluralRest);
  });

  it('SUPPLEMENT_DISCLAIMER_SINGULAR preserves the legally-required FDA anchor', () => {
    // The "Food and Drug Administration" reference is the legal
    // safety net's anchor — removing it would convert the label to
    // misbranded. Should require explicit operator approval AND
    // removing this assertion — both fail this test until the
    // change-control process is followed.
    expect(SUPPLEMENT_DISCLAIMER_SINGULAR).toContain('Food and Drug Administration');
    expect(SUPPLEMENT_DISCLAIMER_SINGULAR).toContain('diagnose, treat, cure, or prevent any disease');
  });

  it('SUPPLEMENT_DISCLAIMER_PLURAL preserves the legally-required FDA anchor', () => {
    expect(SUPPLEMENT_DISCLAIMER_PLURAL).toContain('Food and Drug Administration');
    expect(SUPPLEMENT_DISCLAIMER_PLURAL).toContain('diagnose, treat, cure, or prevent any disease');
  });
});

describe('selectSupplementDisclaimer — claim-count routing', () => {
  it('returns empty string when claim count is 0 (no claim → no disclaimer)', () => {
    expect(selectSupplementDisclaimer(0)).toBe('');
  });

  it('returns empty string when claim count is negative (defensive)', () => {
    expect(selectSupplementDisclaimer(-1)).toBe('');
  });

  it('returns SINGULAR form when claim count is exactly 1', () => {
    expect(selectSupplementDisclaimer(1)).toBe(SUPPLEMENT_DISCLAIMER_SINGULAR);
  });

  it('returns PLURAL form when claim count is 2', () => {
    expect(selectSupplementDisclaimer(2)).toBe(SUPPLEMENT_DISCLAIMER_PLURAL);
  });

  it('returns PLURAL form when claim count is higher (e.g., 5)', () => {
    expect(selectSupplementDisclaimer(5)).toBe(SUPPLEMENT_DISCLAIMER_PLURAL);
  });

  it('returns PLURAL form for large claim counts (e.g., 100)', () => {
    expect(selectSupplementDisclaimer(100)).toBe(SUPPLEMENT_DISCLAIMER_PLURAL);
  });
});

describe('§B4 composition-registry identifier', () => {
  it('exports a stable identifier consumed by the Bucket 1 gate', () => {
    // Identifier value is referenced by lib/supplementBucket1Gate.ts
    // COMPOSED_ITEMS registry. Renaming it requires updating the gate.
    expect(B4_DISCLAIMER_ITEM_ID).toBe('b4-disclaimer-verbatim');
  });
});
