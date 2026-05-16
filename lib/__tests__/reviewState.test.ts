// ============================================================
// Round 11 Phase 2 Step 3 — PA-review state machinery vitest
// ------------------------------------------------------------
// Coverage for lib/reviewState.ts validateTransition() and
// appendTransition(). Mirrors the transition table at
// docs/architecture/pa-review-state-machinery-proposal.md and
// the directive's "all transition table cells + required-comment
// enforcement + auto-transitions + append-only enforcement" scope.
// ============================================================

import { describe, it, expect } from 'vitest';
import type { Review } from '../../types';
import {
  validateTransition,
  appendTransition,
} from '../reviewState';

// ─── Test fixtures ──────────────────────────────────────────────

const FIXED_TIMESTAMP_1 = '2026-05-15T10:00:00.000Z';
const FIXED_TIMESTAMP_2 = '2026-05-15T11:00:00.000Z';
const FIXED_TIMESTAMP_3 = '2026-05-15T12:00:00.000Z';

/** Build a Review in the supplied initial state for test scenarios. */
function makeReview(state: Review['currentState'], formulationVersion = '1.0.0'): Review {
  return {
    id: 'review-test-001',
    formulationId: 'formulation-test-001',
    formulationVersion,
    currentState: state,
    transitions: [
      {
        timestamp: FIXED_TIMESTAMP_1,
        actor: 'system',
        actorRole: 'system',
        fromState: 'draft',
        toState: state,
        formulationVersion,
      },
    ],
    createdAt: FIXED_TIMESTAMP_1,
    lastTransitionAt: FIXED_TIMESTAMP_1,
    reason: 'test fixture',
  };
}

// ============================================================
// Section A — validateTransition: allowed transitions (happy paths)
// ============================================================
describe('validateTransition — allowed transitions', () => {
  it('draft → submitted (operator) — happy path entry', () => {
    expect(validateTransition('draft', 'submitted', 'operator')).toEqual({ valid: true });
  });

  it('submitted → approved (pa) — happy path approval', () => {
    expect(validateTransition('submitted', 'approved', 'pa')).toEqual({ valid: true });
  });

  it('submitted → rejected (pa) with comment — rejection path', () => {
    expect(validateTransition('submitted', 'rejected', 'pa', 'Insufficient identity-test records.')).toEqual({ valid: true });
  });

  it('rejected → draft (operator) — return-to-draft after rejection', () => {
    expect(validateTransition('rejected', 'draft', 'operator')).toEqual({ valid: true });
  });

  it('rejected → draft (system) — auto-transition on first edit after rejection', () => {
    expect(validateTransition('rejected', 'draft', 'system')).toEqual({ valid: true });
  });

  it('approved → version_locked (pa) — explicit final lock', () => {
    expect(validateTransition('approved', 'version_locked', 'pa')).toEqual({ valid: true });
  });

  it('approved → version_locked (system) — auto-lock on PDS export', () => {
    expect(validateTransition('approved', 'version_locked', 'system')).toEqual({ valid: true });
  });

  it('approved → draft (operator) with comment — invalidate approval', () => {
    expect(validateTransition('approved', 'draft', 'operator', 'Re-edit per buyer request CR-2026-09')).toEqual({ valid: true });
  });
});

// ============================================================
// Section B — validateTransition: disallowed transitions
// ============================================================
describe('validateTransition — disallowed transitions', () => {
  it('draft → approved fails (cannot skip submitted)', () => {
    const result = validateTransition('draft', 'approved', 'pa');
    expect(result.valid).toBe(false);
    expect(result.error).toContain("'draft' → 'approved'");
  });

  it('draft → version_locked fails (cannot skip submitted + approved)', () => {
    expect(validateTransition('draft', 'version_locked', 'system').valid).toBe(false);
  });

  it('submitted → version_locked fails (cannot skip approved)', () => {
    expect(validateTransition('submitted', 'version_locked', 'system').valid).toBe(false);
  });

  it('submitted → draft fails (operator cannot retract submission directly)', () => {
    // This is a deliberate v1 constraint — if the operator wants to retract,
    // PA must reject first OR Round 12+ adds a 'cancelled' terminal state.
    expect(validateTransition('submitted', 'draft', 'operator').valid).toBe(false);
  });

  it('rejected → submitted fails (cannot re-submit without going through draft first)', () => {
    expect(validateTransition('rejected', 'submitted', 'operator').valid).toBe(false);
  });

  it('rejected → approved fails (PA cannot bypass operator revision)', () => {
    expect(validateTransition('rejected', 'approved', 'pa').valid).toBe(false);
  });

  it('approved → submitted fails (cannot re-submit an already-approved review)', () => {
    expect(validateTransition('approved', 'submitted', 'operator').valid).toBe(false);
  });

  it('approved → rejected fails (PA must reject DURING submitted state, not after approving)', () => {
    expect(validateTransition('approved', 'rejected', 'pa').valid).toBe(false);
  });
});

// ============================================================
// Section C — validateTransition: terminal state
// ============================================================
describe('validateTransition — version_locked is terminal', () => {
  it('version_locked → draft fails (terminal)', () => {
    const result = validateTransition('version_locked', 'draft', 'operator');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('terminal state');
  });

  it('version_locked → submitted fails (terminal)', () => {
    expect(validateTransition('version_locked', 'submitted', 'operator').valid).toBe(false);
  });

  it('version_locked → approved fails (terminal)', () => {
    expect(validateTransition('version_locked', 'approved', 'pa').valid).toBe(false);
  });

  it('version_locked → rejected fails (terminal)', () => {
    expect(validateTransition('version_locked', 'rejected', 'pa').valid).toBe(false);
  });

  it('version_locked → version_locked fails (terminal — no self-loop)', () => {
    expect(validateTransition('version_locked', 'version_locked', 'system').valid).toBe(false);
  });
});

// ============================================================
// Section D — validateTransition: actor role enforcement
// ============================================================
describe('validateTransition — actor role enforcement', () => {
  it('operator cannot approve (submitted → approved is PA-only)', () => {
    const result = validateTransition('submitted', 'approved', 'operator');
    expect(result.valid).toBe(false);
    expect(result.error).toContain("'operator'");
    expect(result.error).toContain('Allowed: pa');
  });

  it('operator cannot reject (submitted → rejected is PA-only)', () => {
    expect(validateTransition('submitted', 'rejected', 'operator', 'reason').valid).toBe(false);
  });

  it('pa cannot submit (draft → submitted is operator-only)', () => {
    expect(validateTransition('draft', 'submitted', 'pa').valid).toBe(false);
  });

  it('pa cannot return-from-rejected (rejected → draft is operator/system only)', () => {
    expect(validateTransition('rejected', 'draft', 'pa').valid).toBe(false);
  });

  it('pa cannot invalidate own approval (approved → draft is operator-only)', () => {
    expect(validateTransition('approved', 'draft', 'pa', 'comment').valid).toBe(false);
  });

  it('system cannot submit (draft → submitted requires explicit operator action)', () => {
    expect(validateTransition('draft', 'submitted', 'system').valid).toBe(false);
  });

  it('system cannot approve (approval requires PA judgment)', () => {
    expect(validateTransition('submitted', 'approved', 'system').valid).toBe(false);
  });

  it('system cannot reject (rejection requires PA judgment)', () => {
    expect(validateTransition('submitted', 'rejected', 'system', 'reason').valid).toBe(false);
  });
});

// ============================================================
// Section E — validateTransition: required-comment enforcement
// ============================================================
describe('validateTransition — required-comment enforcement', () => {
  it('submitted → rejected without comment fails', () => {
    const result = validateTransition('submitted', 'rejected', 'pa');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('requires a non-empty comment');
  });

  it('submitted → rejected with empty string comment fails', () => {
    expect(validateTransition('submitted', 'rejected', 'pa', '').valid).toBe(false);
  });

  it('submitted → rejected with whitespace-only comment fails', () => {
    expect(validateTransition('submitted', 'rejected', 'pa', '   ').valid).toBe(false);
  });

  it('submitted → rejected with non-empty comment succeeds', () => {
    expect(validateTransition('submitted', 'rejected', 'pa', 'See identity-test gap on lot 2026-05-12-001.').valid).toBe(true);
  });

  it('approved → draft without comment fails (invalidation requires reason)', () => {
    expect(validateTransition('approved', 'draft', 'operator').valid).toBe(false);
  });

  it('approved → draft with empty comment fails', () => {
    expect(validateTransition('approved', 'draft', 'operator', '').valid).toBe(false);
  });

  it('approved → draft with non-empty comment succeeds', () => {
    expect(validateTransition('approved', 'draft', 'operator', 'Re-edit per buyer change request CR-2026-09').valid).toBe(true);
  });

  it('non-comment-required transitions accept undefined comment', () => {
    expect(validateTransition('draft', 'submitted', 'operator').valid).toBe(true);
    expect(validateTransition('submitted', 'approved', 'pa').valid).toBe(true);
    expect(validateTransition('approved', 'version_locked', 'pa').valid).toBe(true);
  });
});

// ============================================================
// Section F — appendTransition: happy path lifecycle
// ============================================================
describe('appendTransition — happy path lifecycle', () => {
  it('draft → submitted → approved → version_locked traversal', () => {
    let review = makeReview('draft', '1.0.0');

    // draft → submitted
    let result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice@operator.example',
      actorRole: 'operator',
      formulationVersion: '1.0.0',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;
    expect(review.currentState).toBe('submitted');
    expect(review.transitions).toHaveLength(2);
    expect(review.transitions[1].fromState).toBe('draft');
    expect(review.transitions[1].toState).toBe('submitted');
    expect(review.lastTransitionAt).toBe(FIXED_TIMESTAMP_2);

    // submitted → approved
    result = appendTransition(review, {
      toState: 'approved',
      actor: 'pa-bob@processauthority.example',
      actorRole: 'pa',
      formulationVersion: '1.0.0',
      timestamp: FIXED_TIMESTAMP_3,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;
    expect(review.currentState).toBe('approved');
    expect(review.transitions).toHaveLength(3);

    // approved → version_locked
    result = appendTransition(review, {
      toState: 'version_locked',
      actor: 'system',
      actorRole: 'system',
      timestamp: '2026-05-15T13:00:00.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;
    expect(review.currentState).toBe('version_locked');
    expect(review.transitions).toHaveLength(4);
  });
});

// ============================================================
// Section G — appendTransition: rejection path
// ============================================================
describe('appendTransition — rejection path', () => {
  it('draft → submitted → rejected → draft → submitted → approved', () => {
    let review = makeReview('draft', '1.0.0');

    // submit
    let result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
      formulationVersion: '1.0.0',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;

    // PA rejects with comment
    result = appendTransition(review, {
      toState: 'rejected',
      actor: 'pa-bob',
      actorRole: 'pa',
      comment: 'Identity-test record missing for lot 001.',
      timestamp: FIXED_TIMESTAMP_3,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;
    expect(review.currentState).toBe('rejected');
    expect(review.transitions[2].comment).toBe('Identity-test record missing for lot 001.');

    // Operator returns to draft
    result = appendTransition(review, {
      toState: 'draft',
      actor: 'alice',
      actorRole: 'operator',
      timestamp: '2026-05-15T13:00:00.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;
    expect(review.currentState).toBe('draft');

    // Resubmit (with new version after edits)
    result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
      formulationVersion: '1.0.1',
      timestamp: '2026-05-15T14:00:00.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;
    expect(review.formulationVersion).toBe('1.0.1');

    // Approve the new version
    result = appendTransition(review, {
      toState: 'approved',
      actor: 'pa-bob',
      actorRole: 'pa',
      formulationVersion: '1.0.1',
      timestamp: '2026-05-15T15:00:00.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    review = result.review;
    expect(review.currentState).toBe('approved');
    expect(review.formulationVersion).toBe('1.0.1');
    expect(review.transitions).toHaveLength(6); // initial + submit + reject + draft + submit + approve
  });
});

// ============================================================
// Section H — appendTransition: approval-invalidation path
// ============================================================
describe('appendTransition — approval-invalidation path', () => {
  it('approved → draft requires comment (invalidates approval)', () => {
    const review = makeReview('approved', '1.0.0');

    // No comment → fails
    let result = appendTransition(review, {
      toState: 'draft',
      actor: 'alice',
      actorRole: 'operator',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(false);

    // With comment → succeeds
    result = appendTransition(review, {
      toState: 'draft',
      actor: 'alice',
      actorRole: 'operator',
      comment: 'Re-edit per buyer change request CR-2026-09',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.currentState).toBe('draft');
    expect(result.review.transitions[1].comment).toBe('Re-edit per buyer change request CR-2026-09');
  });
});

// ============================================================
// Section I — appendTransition: append-only enforcement
// ============================================================
describe('appendTransition — append-only enforcement (input not mutated)', () => {
  it('input Review object is not mutated; transitions[] is a new array', () => {
    const original = makeReview('draft', '1.0.0');
    const originalTransitionsRef = original.transitions;
    const originalCurrentState = original.currentState;
    const originalLastTransitionAt = original.lastTransitionAt;

    const result = appendTransition(original, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Original Review is unchanged
    expect(original.currentState).toBe(originalCurrentState);
    expect(original.lastTransitionAt).toBe(originalLastTransitionAt);
    expect(original.transitions).toBe(originalTransitionsRef);
    expect(original.transitions).toHaveLength(1);

    // Returned Review is new instance with new transitions[] array
    expect(result.review).not.toBe(original);
    expect(result.review.transitions).not.toBe(originalTransitionsRef);
    expect(result.review.transitions).toHaveLength(2);

    // Existing transitions preserved verbatim in the new array
    expect(result.review.transitions[0]).toBe(originalTransitionsRef[0]);
  });

  it('failed appendTransition returns error and does not mutate input', () => {
    const original = makeReview('draft', '1.0.0');
    const originalTransitionsRef = original.transitions;

    const result = appendTransition(original, {
      toState: 'approved', // disallowed from draft
      actor: 'pa-bob',
      actorRole: 'pa',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("'draft' → 'approved'");

    // Input unchanged
    expect(original.transitions).toBe(originalTransitionsRef);
    expect(original.transitions).toHaveLength(1);
    expect(original.currentState).toBe('draft');
  });
});

// ============================================================
// Section J — appendTransition: formulationVersion update semantics
// ============================================================
describe('appendTransition — formulationVersion update semantics', () => {
  it('submitted transition updates Review.formulationVersion when input provides one', () => {
    const review = makeReview('draft', '1.0.0');
    const result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
      formulationVersion: '1.0.1', // operator submits a newer version after edits
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.formulationVersion).toBe('1.0.1');
    expect(result.review.transitions[1].formulationVersion).toBe('1.0.1');
  });

  it('approved transition updates Review.formulationVersion when input provides one', () => {
    const review = makeReview('submitted', '1.0.0');
    const result = appendTransition(review, {
      toState: 'approved',
      actor: 'pa-bob',
      actorRole: 'pa',
      formulationVersion: '1.0.0',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.formulationVersion).toBe('1.0.0');
  });

  it('rejected transition does NOT update Review.formulationVersion', () => {
    const review = makeReview('submitted', '1.0.0');
    const result = appendTransition(review, {
      toState: 'rejected',
      actor: 'pa-bob',
      actorRole: 'pa',
      comment: 'Spec gap',
      formulationVersion: '99.99.99', // even if provided, should NOT update Review.formulationVersion
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.formulationVersion).toBe('1.0.0'); // unchanged
    // But the transition itself records the version-at-transition
    expect(result.review.transitions[1].formulationVersion).toBe('99.99.99');
  });

  it('version_locked transition does NOT update Review.formulationVersion', () => {
    const review = makeReview('approved', '1.0.0');
    const result = appendTransition(review, {
      toState: 'version_locked',
      actor: 'system',
      actorRole: 'system',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.formulationVersion).toBe('1.0.0'); // unchanged
  });

  it('submitted transition without input formulationVersion preserves existing Review value', () => {
    const review = makeReview('draft', '1.0.0');
    const result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
      timestamp: FIXED_TIMESTAMP_2,
      // no formulationVersion in input
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.formulationVersion).toBe('1.0.0'); // preserved
    expect(result.review.transitions[1].formulationVersion).toBeUndefined();
  });
});

// ============================================================
// Section K — appendTransition: timestamp + denormalized field updates
// ============================================================
describe('appendTransition — timestamp and denormalized fields', () => {
  it('lastTransitionAt updates to the new transition timestamp', () => {
    const review = makeReview('draft', '1.0.0');
    expect(review.lastTransitionAt).toBe(FIXED_TIMESTAMP_1);

    const result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.lastTransitionAt).toBe(FIXED_TIMESTAMP_2);
  });

  it('createdAt is preserved across transitions', () => {
    const review = makeReview('draft', '1.0.0');
    const originalCreatedAt = review.createdAt;

    const result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
      timestamp: FIXED_TIMESTAMP_2,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.createdAt).toBe(originalCreatedAt);
  });

  it('omitting timestamp uses current time (sanity check — non-empty ISO string)', () => {
    const review = makeReview('draft', '1.0.0');
    const beforeMs = Date.now();
    const result = appendTransition(review, {
      toState: 'submitted',
      actor: 'alice',
      actorRole: 'operator',
    });
    const afterMs = Date.now();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tsMs = Date.parse(result.review.lastTransitionAt);
    expect(tsMs).toBeGreaterThanOrEqual(beforeMs);
    expect(tsMs).toBeLessThanOrEqual(afterMs);
  });
});

// ============================================================
// Section L — appendTransition: error propagation from validator
// ============================================================
describe('appendTransition — error propagation', () => {
  it('disallowed transition returns validator error verbatim', () => {
    const review = makeReview('draft', '1.0.0');
    const result = appendTransition(review, {
      toState: 'version_locked',
      actor: 'system',
      actorRole: 'system',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("'draft' → 'version_locked'");
  });

  it('terminal-state attempt returns terminal error', () => {
    const review = makeReview('version_locked', '1.0.0');
    const result = appendTransition(review, {
      toState: 'draft',
      actor: 'operator',
      actorRole: 'operator',
      comment: 'try',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('terminal state');
  });

  it('missing comment on submitted → rejected returns comment-required error', () => {
    const review = makeReview('submitted', '1.0.0');
    const result = appendTransition(review, {
      toState: 'rejected',
      actor: 'pa-bob',
      actorRole: 'pa',
      // no comment
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('requires a non-empty comment');
  });
});
