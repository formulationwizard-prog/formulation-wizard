// ============================================================
// Section 4 — REGULATORY_DISCLAIMER change-control snapshot
// ------------------------------------------------------------
// Round 10 Section 4 / Finding N3 (2026-05-15). Asserts the locked-
// text constant at lib/foodScience.ts matches a frozen snapshot. Any
// change to the constant fails this test until the snapshot is
// updated in the same commit per the change-control process.
//
// See lib/foodScience.ts REGULATORY_DISCLAIMER docblock for the full
// process. Summary: PA consultation + explicit operator approval in
// PR description + ARCHITECTURE.md update if policy-shifting. Git
// captures commit author; PR description carries operator approval
// with rationale.
// ============================================================

import { describe, it, expect } from 'vitest';
import { REGULATORY_DISCLAIMER } from '../foodScience';

describe('Section 4 — REGULATORY_DISCLAIMER change-control snapshot', () => {

  // ============================================================
  // FROZEN SNAPSHOT — DO NOT UPDATE WITHOUT THE PROCESS BELOW
  // ============================================================
  //
  // This snapshot is the authoritative locked text. If this test fails,
  // the constant was modified. Two valid responses:
  //
  //   (a) Revert the constant change. The previous wording is the legal
  //       safety net — review commit history for prior author + rationale
  //       before deciding the change is intentional.
  //
  //   (b) If the change is intentional and process-approved, update this
  //       snapshot to match in the SAME commit, AND ensure the PR
  //       description names:
  //         - The FDA-recognized Process Authority who reviewed the new
  //           wording
  //         - The operator approving the change
  //         - The rationale (what policy shift the new wording reflects)
  //       Also update ARCHITECTURE.md if the change reflects a policy
  //       shift, not just typographic correction.
  //
  // Updating the snapshot WITHOUT the PR-description trail is a Bucket A
  // discipline violation. Reviewers should reject the PR until the trail
  // is present.
  // ============================================================
  const FROZEN_REGULATORY_DISCLAIMER =
    'This information is for general educational purposes and does not constitute a legal or definitive safety process. Always consult an FDA-recognized Process Authority to verify your specific formula.';

  it('REGULATORY_DISCLAIMER matches the frozen snapshot (Bucket A locked text)', () => {
    expect(REGULATORY_DISCLAIMER).toBe(FROZEN_REGULATORY_DISCLAIMER);
  });

  it('REGULATORY_DISCLAIMER is a non-empty string (sanity)', () => {
    expect(typeof REGULATORY_DISCLAIMER).toBe('string');
    expect(REGULATORY_DISCLAIMER.length).toBeGreaterThan(0);
  });

  it('REGULATORY_DISCLAIMER preserves the FDA-recognized Process Authority anchor', () => {
    // Even if PA approves a rewording, the "FDA-recognized Process
    // Authority" reference is the legal safety net's anchor and the
    // operationalization of the May 7 honest-estimate reframe. Removing
    // it would require explicit operator approval AND removing this
    // assertion — both fail this test until the change-control process
    // is followed.
    expect(REGULATORY_DISCLAIMER.toLowerCase()).toContain('process authority');
    expect(REGULATORY_DISCLAIMER.toLowerCase()).toContain('fda');
  });
});
