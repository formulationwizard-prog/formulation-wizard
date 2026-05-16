# PA-Review State Machinery — Schema Proposal

**Round:** 11
**Phase:** 1, Step 4 (parallel work)
**Status:** Proposal — schema design only; implementation lands in a follow-up commit per Round 11 directive scoping
**Generated:** 2026-05-15

---

## Purpose

Propose the schema and state-machine for PA-review workflow per the Round 11 directive's Track C scope. The directive specifies a 4-state model with rejection path, single-reviewer for Round 11 v1, and multi-reviewer evolution in Round 12+. This document is the design artifact reviewed before implementation.

The PA-review entity is **orthogonal** to two existing concepts in the codebase:

- **Lifecycle status** ([`SavedFormulation.status`](../../types/index.ts) — `'draft' | 'in-pilot' | 'launched' | 'on-hold'`) — describes the post-launch state of a finished product.
- **Version snapshots** ([`FormulationVersion`](../../types/index.ts)) — immutable point-in-time captures of formulation state with semver + timestamp + author + reasonForChange.

Neither is a regulatory-review workflow state. PA-review is a third concept tracking the journey of a specific formulation version through Process Authority review and approval.

---

## Schema — types to add to `types/index.ts`

```typescript
/**
 * PA-review workflow state. Distinct from SavedFormulation.status (lifecycle)
 * and FormulationVersion (immutable snapshot). A formulation accumulates
 * reviews across its lifecycle (initial, post-amendment, annual
 * recertification).
 */
export type ReviewState =
  | 'draft'           // operator editing
  | 'submitted'       // handed to PA for review
  | 'approved'        // PA signed off; formulation review-locked
  | 'rejected'        // PA rejected; returns to draft for revision
  | 'version_locked'; // final immutable snapshot; PDS export proceeds

/**
 * Append-only log entry capturing a single state transition. Every
 * transition is logged — never overwritten — to preserve the full audit
 * trail of a review's journey. The transition log is the SINGLE source
 * of truth for actor identity at every state change.
 */
export interface ReviewTransition {
  /** ISO timestamp of the transition. */
  timestamp: string;
  /** Identifier of the actor who triggered the transition. User name for
   *  operator/PA; 'system' for auto-transitions. */
  actor: string;
  /** Role of the actor. */
  actorRole: 'operator' | 'pa' | 'system';
  /** State transitioned FROM. */
  fromState: ReviewState;
  /** State transitioned TO. */
  toState: ReviewState;
  /** Optional free-text comment. REQUIRED on rejection (submitted → rejected)
   *  and on invalidation (approved → draft) — see transition-validity rules. */
  comment?: string;
  /** Optional FormulationVersion the Review was bound to at the moment this
   *  transition fired. Captured on transitions that change which version is
   *  under review (typically `submitted` and `approved`). Provides per-
   *  transition audit-trail granularity beyond the Review's top-level
   *  `formulationVersion` field, which only reflects the most recent
   *  submit/approve target. Omitted when version association is not
   *  meaningful for the transition. */
  formulationVersion?: string;
}

/**
 * PA review entity. Separate-concept entity from SavedFormulation per
 * Round 11 directive ("Separate review entity, not state-on-formulation.
 * A formulation can have multiple reviews over its lifecycle.").
 *
 * Storage placement: Reviews live inside SavedFormulation as a
 * `reviews?: Review[]` array (co-located in the storage record but
 * conceptually separate, matching the existing `versions?: FormulationVersion[]`
 * pattern). Future Supabase migration splits into a dedicated `reviews`
 * table referencing `formulations.id`.
 *
 * REVISION (Phase 2 directive 2026-05-15): Two tweaks vs the original
 * Phase 1 proposal:
 *   • Dropped `reviewerId` and `reviewerName` at Review-level. The
 *     transition log is the single source of truth for actor identity —
 *     each transition entry carries `actor` + `actorRole`. Round 11 v1's
 *     single-reviewer model means the reviewer is whoever performed the
 *     submitted→approved transition (queryable via transitions.find()).
 *     Round 12+ multi-reviewer model can re-introduce a Review-level
 *     reviewer field if/when scoping demands.
 *   • Documented `formulationVersion` semantics explicitly: it tracks
 *     the most-recently-submitted-or-approved FormulationVersion and
 *     updates on each `submitted` and `approved` transition. This avoids
 *     the ambiguity of "what version is this Review for" when a
 *     formulation goes through multiple submit/reject/edit cycles.
 */
export interface Review {
  /** Stable UUID for this review. Distinct from formulationId. */
  id: string;
  /** References SavedFormulation.id. */
  formulationId: string;
  /** References the FormulationVersion.version this Review is currently
   *  bound to. Updated on each `submitted` and `approved` transition to
   *  track the most recently submitted or approved snapshot. Initial
   *  value is the FormulationVersion present when the Review was created
   *  in `draft` state.
   *
   *  Why updated on submit/approve: a Review can pass through multiple
   *  draft→submitted→rejected→draft cycles before final approval, and
   *  the formulation may be edited between cycles (creating new
   *  FormulationVersions). The Review's `formulationVersion` field
   *  always names the version the PA is currently reviewing or has
   *  most recently approved — never a stale earlier version. */
  formulationVersion: string;
  /** Current state. Denormalized for convenience — `transitions[N-1].toState`
   *  is the authoritative source of truth. */
  currentState: ReviewState;
  /** Ordered transition log. Append-only. `transitions[0]` is the creation
   *  entry. The transition log is the SINGLE SOURCE OF TRUTH for actor
   *  identity (no separate reviewerId/reviewerName fields on Review). */
  transitions: ReviewTransition[];
  /** ISO timestamp when the review was created (== transitions[0].timestamp). */
  createdAt: string;
  /** ISO timestamp of the most recent transition. */
  lastTransitionAt: string;
  /** Free-text reason for the review (e.g., "Initial release",
   *  "Post-amendment per CR-2026-09", "Annual recertification"). */
  reason?: string;
}
```

### Addition to `SavedFormulation`

```typescript
export interface SavedFormulation {
  // ... existing fields unchanged ...

  /**
   * PA review history. Append-only across the formulation's lifecycle —
   * a formulation accumulates reviews (initial, post-amendment, annual
   * recertification). Reviews bind to specific FormulationVersion
   * snapshots; multiple reviews can coexist against different versions.
   * The "active" review (currentState in 'draft' | 'submitted') is
   * typically the most recent entry; PDS export consults all reviews
   * to determine if the current formulationVersion has an approved or
   * version_locked review.
   */
  reviews?: Review[];
}
```

---

## State machine

```
        ┌─────┐
        │draft│ ◄────────────────────────────────────┐
        └──┬──┘                                      │
           │ (operator submits)                      │
           ▼                                         │
       ┌─────────┐                                   │
       │submitted│                                   │
       └──┬──┬───┘                                   │
          │  │  (PA rejects; comment required)       │
          │  └──────────────────────────────────────►├──┐
          │                                          │  │
          │  (PA approves)                           │  │
          ▼                                          │  │
      ┌────────┐                                     │  ▼
      │approved│                                     │  ┌─────────┐
      └──┬──┬──┘                                     │  │rejected │
         │  │                                        │  └────┬────┘
         │  │ (operator edits; comment required)     │       │
         │  └────────────────────────────────────────┘       │
         │                                                   │
         │ (PA signs final OR system auto-locks   ┌──────────┘
         │  on PDS export from approved)          │ (operator edit OR
         ▼                                        │  system auto-transition
   ┌────────────────┐                             │  on first edit)
   │ version_locked │                             │
   └────────────────┘                             ▼
        TERMINAL                              (back to draft)
        (no transitions out)
```

### Allowed transitions

| From | To | Allowed actor role | Comment required? | Notes |
|------|----|--------------------|--------------------|-------|
| `draft` | `submitted` | operator | no | hand off to PA |
| `submitted` | `approved` | pa | optional but encouraged | |
| `submitted` | `rejected` | pa | **yes — required** | PA must explain rejection |
| `rejected` | `draft` | operator or system | no | system auto-transitions on first edit after rejection |
| `approved` | `version_locked` | pa or system | optional | system auto-locks on first PDS export from approved |
| `approved` | `draft` | operator | **yes — required** | invalidates approval; explicit "return to draft for editing" |
| `version_locked` | — | — | — | TERMINAL state; no transitions out |

### Edit-after-approval design choice (locked)

**Decision:** Same Review transitions back to draft (option A).

Rationale: matches the directive's literal wording ("Formulation is immutable after approved (cannot be edited without explicit return to draft, which logs the transition)"). The transition is logged as `approved → draft` with required operator comment. Approval state is lost on the Review object; the formulation re-enters the editable state. Subsequent re-submission produces additional transitions on the same Review.

Alternative considered (option B — existing Review marked superseded; new Review starts fresh): deferred to Round 12+ if audit-trail granularity issues emerge at scale with multi-review-per-formulation patterns.

---

## Transition validator

Pure function — validates whether a proposed transition is allowed and whether required comment is present. Returns either the resulting Review (on success) or a structured rejection (on invalid transition).

```typescript
export type TransitionResult =
  | { ok: true; review: Review }
  | { ok: false; reason: string };

export function applyReviewTransition(
  review: Review,
  toState: ReviewState,
  actor: string,
  actorRole: 'operator' | 'pa' | 'system',
  comment?: string,
): TransitionResult;
```

Validation rules enforced:
- `fromState === review.currentState` (no skipping intermediate states or transitioning from stale state)
- Transition is in the allowed-transitions table (no `draft → approved`, no transitions out of `version_locked`, etc.)
- Actor role matches the allowed role for that transition
- Comment present when required by transition (submitted → rejected; approved → draft)
- Actor identity (`actor` + `actorRole`) provided on every transition (single source of truth — no separate Review-level reviewer field)

On success: appends a new `ReviewTransition` to `transitions[]`, updates `currentState` and `lastTransitionAt`, returns the updated Review.

On failure: returns structured rejection with reason string suitable for surfacing to the operator.

### Append-only enforcement

The transition log is append-only:
- `transitions` array can only grow
- Existing transition entries cannot be modified or removed
- Validator does not mutate the input `review` — it returns a new Review object (immutability discipline)
- UI / persistence layer is responsible for refusing to save Review objects whose `transitions[]` is a prefix-different from the persisted record

---

## Integration points

### PDS export gate

PDS export refuses unless the current formulation's most-recent review against the current version is in `approved` or `version_locked`. Pseudocode:

```typescript
function canExportPDS(
  formulation: SavedFormulation,
): { allowed: true } | { allowed: false; reason: string } {
  const reviews = formulation.reviews ?? [];
  const currentVersionReviews = reviews.filter(
    r => r.formulationVersion === formulation.currentVersion,
  );
  if (currentVersionReviews.length === 0) {
    return { allowed: false, reason: 'No PA review exists for the current formulation version.' };
  }
  const mostRecent = currentVersionReviews
    .sort((a, b) => b.lastTransitionAt.localeCompare(a.lastTransitionAt))[0];
  if (mostRecent.currentState === 'approved' || mostRecent.currentState === 'version_locked') {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Review state is '${mostRecent.currentState}'; PDS export requires 'approved' or 'version_locked'.`,
  };
}
```

### Supplement Bucket 1 composition gate

[`lib/supplementBucket1Gate.ts`](../../lib/supplementBucket1Gate.ts) composes review-not-approved as one of its evaluator inputs. Review state becomes part of the harm-critical floor that the gate enforces.

### Formulation edit handlers

Edit handlers in `app/workspace/page.tsx` (ingredient add/remove/update, serving size change, package change, etc.) check the most-recent review state. When `currentState ∈ {'approved', 'version_locked'}`:
- For `approved`: prompt operator to confirm "Return to draft for editing — current approval will be invalidated. Reason for edit:" and create the transition on confirmation.
- For `version_locked`: hard block — edits not permitted on version-locked formulations. Operator must create a new FormulationVersion (which starts the review cycle fresh for the new version).

### Version-locking mechanics

`version_locked` is set in two ways:
- **Explicit** — PA action (separate from initial approval): "lock this version as the final release."
- **Implicit** — system auto-transitions from `approved` to `version_locked` on the first PDS export against that formulation version.

Once version-locked, no transitions out. The Review and the bound FormulationVersion form an immutable pair. Subsequent edits require a new FormulationVersion (and a new Review cycle).

---

## Round 11 scope vs. deferrals

### In Round 11 v1

- ✓ Schema types in `types/index.ts` (`ReviewState`, `ReviewTransition`, `Review`)
- ✓ `reviews?: Review[]` added to `SavedFormulation`
- ✓ Pure transition validator (`applyReviewTransition`)
- ✓ Append-only transition log enforcement (validator + UI/persistence discipline)
- ✓ Single-reviewer model per directive
- ✓ Integration with Bucket 1 composition gate
- ✓ Integration with PDS export gate (when PDS pipeline lands in Phase 3)
- ✓ Integration with formulation edit handlers

### Deferred to Round 12+

- ✗ Multi-reviewer signoff (separate `approvals: Approval[]` array per Review, etc.)
- ✗ 6-state model with distinct `in_review` between `submitted` and `approved`
- ✗ Reviewer assignment / routing UI
- ✗ Reviewer comment threads with replies
- ✗ Email / notification integration on state transitions
- ✗ Review templates / required-fields scaffolding
- ✗ Audit-export of full review history as PDF artifact (separate from PDS)

---

## Implementation order

When implementation begins (separate commit per the Round 11 directive's scoping):

1. **Types** — add `ReviewState`, `ReviewTransition`, `Review` to `types/index.ts`; add `reviews?: Review[]` to `SavedFormulation`. TypeScript compiles cleanly with no behavior change (types-only additions).

2. **Validator + tests** — create `lib/reviewState.ts` with `applyReviewTransition()` + `canTransition()` helpers. Vitest suite at `lib/__tests__/reviewState.test.ts` covering all allowed transitions, all disallowed transitions, all comment-required cases, and the append-only enforcement.

3. **Bucket 1 gate integration** — extend `evaluateSupplementBucket1Gate()` to consume review state from the params; add review-not-approved as a refusal evidence type.

4. **PDS export gate** — `canExportPDS()` helper landing alongside the PDS pipeline in Phase 3 Track C work.

5. **Formulation edit handlers** — wire the approved/version_locked checks into ingredient/serving-size/package change handlers in `app/workspace/page.tsx`.

Each step lands as a separate commit per the Round 11 push-per-step pattern.

---

## Open questions / future considerations

- **Concurrency** — what happens if two operators edit the same formulation simultaneously while a Review exists? Round 11 v1 punts via single-user assumption (matches current localStorage architecture). Round 12+ Supabase migration needs to handle concurrent-edit conflict resolution.
- **Review cancellation** — operator-initiated rejection of own review (cancel a submitted review before PA acts). Out of scope for Round 11 v1; can extend with a `cancelled` terminal state in Round 12+ if needed.
- **Reviewer reassignment** — a PA gets sick mid-review; another PA takes over. Out of scope for Round 11 v1 single-reviewer model.
- **Bulk approvals** — approve multiple formulations in one transaction. Out of scope; per-formulation approvals only.
