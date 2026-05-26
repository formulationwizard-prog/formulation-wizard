// ============================================================
// PA-REVIEW STATE MACHINERY
// ------------------------------------------------------------
// Round 11 Phase 2 Step 3 (2026-05-15). Pure helpers for the PA-
// review state machine spec'd at types/index.ts (Review,
// ReviewState, ReviewTransition) and documented at
// docs/architecture/pa-review-state-machinery-proposal.md.
//
// Two exports:
//
//   • validateTransition(fromState, toState, actorRole, comment)
//     → { valid: boolean, error?: string }
//     Pure validator. No side effects. No Review object required.
//     Caller checks the result before mutating state.
//
//   • appendTransition(review, input) → { ok: true, review } | { ok: false, error }
//     Composes validateTransition + append-only log enforcement.
//     Returns a NEW Review object on success (input never mutated).
//     Updates currentState, lastTransitionAt, and (on submit/approve
//     transitions) formulationVersion atomically.
//
// SCAFFOLD ↔ INTEGRATION DISCIPLINE
// ------------------------------------------------------------
// This commit lands the state machinery as a standalone module —
// types + validator + transition log. Integration with the
// supplement Bucket 1 composition gate at lib/supplementBucket1Gate.ts
// (consumes Review.currentState as a refusal-state input) is a
// follow-up commit per the Phase 2 directive's surface point.
//
// Integration with formulation edit handlers in app/workspace/page.tsx
// (block edits when currentState ∈ {'approved', 'version_locked'}) is
// also a follow-up.
//
// PDS export gate consumption (`canExportPDS()` helper landing
// alongside the PDS pipeline in Phase 3 Track C) is downstream of
// this module and consumes Review.currentState via the same pattern.
// ============================================================
//
// === DO NOT WEAKEN THIS STATE MACHINE ===
// ============================================================
//
// The state machine exists to prevent silent shipment of
// unapproved formulations to customer-zero's production via PDS
// export. Per the Companion Spec, PA review is the legal
// authority that converts engine estimates into verified specs.
// Bypassing the state machine — adding direct state assignments,
// skipping the validator, or weakening allowed-transition rules —
// is a regulatory-safety regression regardless of intent.
//
// Changes to the allowed-transitions table or required-comment
// rules require:
//   - Read this docblock end-to-end
//   - Read the proposal doc at
//     docs/architecture/pa-review-state-machinery-proposal.md
//   - Surface the change explicitly in the PR description for
//     operator approval
// ============================================================

import type { HardStop, HardStopEvidence } from './hardStop';
import type { Review, ReviewState, ReviewTransition } from '../types';

/**
 * Allowed transitions table. Keys are fromState; values list each
 * allowed toState with its allowed actor roles and comment-required
 * flag. Empty arrays mark terminal states (currently only
 * `version_locked`).
 *
 * Mirrors the proposal doc's transition table at
 * docs/architecture/pa-review-state-machinery-proposal.md.
 */
const ALLOWED_TRANSITIONS: Record<ReviewState, ReadonlyArray<{
  toState: ReviewState;
  allowedRoles: ReadonlyArray<'operator' | 'pa' | 'system'>;
  commentRequired: boolean;
}>> = {
  draft: [
    { toState: 'submitted', allowedRoles: ['operator'],            commentRequired: false },
  ],
  submitted: [
    { toState: 'approved',  allowedRoles: ['pa'],                  commentRequired: false },
    { toState: 'rejected',  allowedRoles: ['pa'],                  commentRequired: true  },
  ],
  approved: [
    { toState: 'version_locked', allowedRoles: ['pa', 'system'],   commentRequired: false },
    { toState: 'draft',     allowedRoles: ['operator'],            commentRequired: true  },
  ],
  rejected: [
    { toState: 'draft',     allowedRoles: ['operator', 'system'],  commentRequired: false },
  ],
  version_locked: [
    // TERMINAL — no transitions out. The Review and the bound
    // FormulationVersion form an immutable pair. Subsequent edits
    // require a new FormulationVersion (and a new Review cycle).
  ],
};

/** Result of validateTransition() — discriminated by `valid`. */
export interface ValidateTransitionResult {
  valid: boolean;
  /** Human-readable reason populated when valid === false. */
  error?: string;
}

/**
 * Pure validator: is the proposed transition allowed?
 *
 * Checks four rules in order:
 *   1. fromState has at least one allowed outbound transition (not terminal)
 *   2. toState is in the allowed-transitions list for fromState
 *   3. actorRole is permitted for this specific transition
 *   4. comment is present (non-empty after trim) when transition requires it
 *
 * No side effects. No Review object required. Caller is responsible
 * for verifying that `fromState === review.currentState` before
 * passing to this function (or use appendTransition which composes
 * both checks).
 */
export function validateTransition(
  fromState: ReviewState,
  toState: ReviewState,
  actorRole: 'operator' | 'pa' | 'system',
  comment?: string,
): ValidateTransitionResult {
  const allowed = ALLOWED_TRANSITIONS[fromState];
  if (!allowed || allowed.length === 0) {
    return {
      valid: false,
      error: `'${fromState}' is a terminal state; no transitions allowed.`,
    };
  }
  const transition = allowed.find(t => t.toState === toState);
  if (!transition) {
    return {
      valid: false,
      error: `Transition '${fromState}' → '${toState}' is not allowed.`,
    };
  }
  if (!transition.allowedRoles.includes(actorRole)) {
    return {
      valid: false,
      error: `Actor role '${actorRole}' is not allowed for '${fromState}' → '${toState}'. Allowed: ${transition.allowedRoles.join(', ')}.`,
    };
  }
  if (transition.commentRequired && (!comment || comment.trim() === '')) {
    return {
      valid: false,
      error: `Transition '${fromState}' → '${toState}' requires a non-empty comment.`,
    };
  }
  return { valid: true };
}

/** Input to appendTransition — describes the transition to append. */
export interface AppendTransitionInput {
  /** Target state. */
  toState: ReviewState;
  /** Identifier of the actor (user name; 'system' for auto-transitions). */
  actor: string;
  /** Role of the actor. */
  actorRole: 'operator' | 'pa' | 'system';
  /** Optional comment. REQUIRED on transitions where validateTransition
   *  enforces commentRequired (submitted → rejected; approved → draft). */
  comment?: string;
  /** Optional FormulationVersion under review at this transition. Updates
   *  Review.formulationVersion on `submitted` and `approved` toStates. */
  formulationVersion?: string;
  /** Override the timestamp (defaults to new Date().toISOString()).
   *  Useful for tests with deterministic time and for replaying
   *  transitions from a backing store. */
  timestamp?: string;
}

/** Result of appendTransition() — discriminated by `ok`. */
export type AppendTransitionResult =
  | { ok: true;  review: Review }
  | { ok: false; error: string };

/**
 * Compose validateTransition + append-only log enforcement.
 *
 * On success: returns a NEW Review object with the new transition
 * appended, currentState updated, lastTransitionAt updated, and (on
 * submit/approve transitions) formulationVersion updated. The input
 * Review object is never mutated.
 *
 * On failure: returns the validator's error string verbatim.
 *
 * Append-only discipline: existing transitions[] entries are
 * preserved verbatim in the output Review. Callers should never
 * splice / pop / mutate transitions[] directly — always go through
 * appendTransition.
 */
export function appendTransition(
  review: Review,
  input: AppendTransitionInput,
): AppendTransitionResult {
  const validation = validateTransition(
    review.currentState,
    input.toState,
    input.actorRole,
    input.comment,
  );
  if (!validation.valid) {
    return { ok: false, error: validation.error! };
  }

  const timestamp = input.timestamp ?? new Date().toISOString();
  const newTransition: ReviewTransition = {
    timestamp,
    actor: input.actor,
    actorRole: input.actorRole,
    fromState: review.currentState,
    toState: input.toState,
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
    ...(input.formulationVersion !== undefined
      ? { formulationVersion: input.formulationVersion }
      : {}),
  };

  // Update Review.formulationVersion on submitted and approved transitions
  // per the Phase 2 directive's JSDoc semantics. Falls back to existing
  // value when input does not provide one (caller may rely on the Review's
  // pre-existing version assignment).
  const shouldUpdateVersion =
    input.toState === 'submitted' || input.toState === 'approved';
  const newFormulationVersion =
    shouldUpdateVersion && input.formulationVersion !== undefined
      ? input.formulationVersion
      : review.formulationVersion;

  // Build the new Review immutably. Spread last so denormalized fields
  // overwrite any same-keyed fields from `review`.
  const newReview: Review = {
    ...review,
    formulationVersion: newFormulationVersion,
    currentState: input.toState,
    transitions: [...review.transitions, newTransition],
    lastTransitionAt: timestamp,
  };

  return { ok: true, review: newReview };
}

// ============================================================
// REVIEW.CURRENTSTATE → BUCKET 1 GATE COMPOSITION
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 (2026-05-17). Per-item gate evaluator
// that composes a Review.currentState value into a HardStop |
// cleared result for the supplement Bucket 1 composition gate at
// lib/supplementBucket1Gate.ts. Mirrors the F&B-side per-item gate
// pattern (evaluateBucketA at lib/bucketAGate.ts; evaluateDiseaseClaimGate
// at lib/supplementClaims.ts).
//
// Refusal logic: states OTHER than `approved` and `version_locked`
// trigger refuse-to-export. The gate is the supplement-side analogue
// of the proposal doc's `canExportPDS()` helper — but operates on
// state alone, not Review-object lookup. The caller composing the
// export pipeline (Phase 3 Track C) is responsible for the
// "is there a review at all?" check before passing review state
// into this gate; the gate's narrow job is to refuse when the
// state isn't one of the two export-eligible states.
//
// Undefined state is treated as cleared at the composition layer
// (matches the empty-input semantics of other Bucket 1 items: no
// data passed → no contribution to the hard-stop). Downstream
// wiring at the PDS export gate handles the explicit "no Review
// exists" check separately.
//
// ============================================================
// === DO NOT WEAKEN THIS GATE ===
// ============================================================
//
// This gate exists to prevent PDS export from formulations that
// have not received PA approval. Per the Round 11 directive:
// "PDS export only fires from approved or version_locked states."
// Adding bypasses, promoting draft/submitted/rejected to cleared,
// or relaxing the state allowlist are regulatory-safety regressions
// regardless of intent. Read the proposal doc at
// docs/architecture/pa-review-state-machinery-proposal.md before
// changing this gate's allowlist.
// ============================================================

/**
 * Composition-registry identifier for the PA-review state gate.
 * Imported by lib/supplementBucket1Gate.ts to register this gate
 * as a composed item. Stable string — do not rename without
 * updating the gate's COMPOSED_ITEMS registry.
 */
export const REVIEW_STATE_GATE_ITEM_ID = 'review-state-pa-approval' as const;

/**
 * States that allow export. All other states block.
 * Matches the directive's "PDS export only fires from approved or
 * version_locked states" requirement.
 */
const EXPORT_ELIGIBLE_STATES: ReadonlySet<ReviewState> = new Set<ReviewState>([
  'approved',
  'version_locked',
]);

/**
 * Result of evaluating the Review.currentState gate.
 *
 *   • `hardStop: true`  — review state is one of {draft, submitted,
 *                          rejected}. Caller composes into Bucket 1
 *                          gate's refusal evidence.
 *   • `hardStop: false` — review state is approved, version_locked,
 *                          or undefined (no state context provided).
 */
export type ReviewStateGateResult =
  | (HardStop & { source: 'review-state' })
  | {
      hardStop: false;
      source: 'review-state';
    };

/**
 * Evaluate the Review.currentState gate for export eligibility.
 *
 * Pure function — no side effects. Same state input always produces
 * the same gate output.
 *
 *   • undefined           → cleared (no state context; composition-
 *                            layer omission; downstream wiring handles
 *                            "no review exists" check separately)
 *   • 'approved'          → cleared
 *   • 'version_locked'    → cleared
 *   • 'draft'             → hard-stop
 *   • 'submitted'         → hard-stop
 *   • 'rejected'          → hard-stop
 */
export function evaluateReviewStateGate(
  state: ReviewState | undefined,
): ReviewStateGateResult {
  if (state === undefined) {
    return { hardStop: false, source: 'review-state' };
  }

  if (EXPORT_ELIGIBLE_STATES.has(state)) {
    return { hardStop: false, source: 'review-state' };
  }

  const evidence: HardStopEvidence[] = [
    {
      subject: 'PA review state',
      detail: `Review state is '${state}'; export requires 'approved' or 'version_locked'.`,
      citation: 'docs/architecture/pa-review-state-machinery-proposal.md',
    },
  ];

  return {
    hardStop: true,
    source: 'review-state',
    reason: `Refuse-to-export: PA review state is '${state}'. Export requires 'approved' or 'version_locked'.`,
    evidence,
  };
}

/**
 * Resolve the current Review state from a SavedFormulation's reviews
 * array. Used at export-gate wire-up sites to feed
 * `evaluateReviewStateGate`.
 *
 * Behavior:
 *   • Undefined / missing reviews array → undefined (no Review exists
 *     for this formulation; gate clears per its undefined-state semantic)
 *   • Empty reviews array → undefined (same as missing)
 *   • Non-empty reviews array → currentState of the most-recent Review
 *
 * "Most-recent" defined as the last element of the array. Reviews are
 * append-only per [[pa-review-state-machinery-proposal]]; each Review
 * tracks its own state-machine transitions internally. The aggregate
 * currentState that drives export-eligibility is the latest Review's
 * currentState.
 *
 * NOTE on multi-version semantics: a SavedFormulation can have multiple
 * FormulationVersions; each version could theoretically have its own
 * Review. At Pillar 3 ReviewStateGate wire-up (2026-05-26), the
 * aggregate-most-recent semantics are sufficient for refuse-to-export
 * behavior. Per-version Review resolution lands when the Packet UI
 * wires version-aware export contexts (strategic-session Packet Q1
 * routing gates that work).
 *
 * Pure function — no side effects.
 *
 * @param reviews  SavedFormulation.reviews array (or undefined if the
 *                 formulation has never been reviewed).
 * @returns        ReviewState of the most-recent Review, or undefined
 *                 if no Review exists. Pass directly to
 *                 evaluateReviewStateGate.
 */
export function getCurrentReviewState(
  reviews: readonly Review[] | undefined,
): ReviewState | undefined {
  if (!reviews || reviews.length === 0) return undefined;
  return reviews[reviews.length - 1].currentState;
}
