// ============================================================
// §B3 + §B11 BUCKET 1 — IDENTITY-TEST ATTESTATION GATE
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 (2026-05-17). Per-§B-item gate
// evaluator for identity-test attestation per 21 CFR 111.75(a)(1).
// Consumes the §B11 Bucket 1 subset data model declared at
// types/index.ts IdentityTestAttestation; refuses export when
// any required dietary ingredient lacks structurally-valid
// attestation coverage.
//
// File-placement convention: new-from-scratch modules at lib/
// root use no `supplement` prefix (this file, lib/netQuantity.ts).
// Sibling-to-legacy modules use the prefix (lib/supplementAllergen.ts,
// lib/supplementClaims.ts) to signal coexistence with an existing
// detector. Reference this convention when adding new §B modules.
//
// SCOPE — what this module IS
// ------------------------------------------------------------
//   • evaluateIdentityTestGate(input) → IdentityTestGateResult
//     Per-item gate composing attestation coverage + structural
//     validation into HardStop | cleared.
//   • Constants: B3_IDENTITY_TEST_ITEM_ID, B3_IDENTITY_TEST_CITATION.
//   • Input shape: IdentityTestGateInput — caller passes the list
//     of dietary ingredients requiring attestation + the available
//     attestation records (+ optional `now` for deterministic tests).
//
// SCOPE — what this module is NOT (yet)
// ------------------------------------------------------------
//   • Persistence layer — Round 12.
//   • Operator UI for attestation entry — Round 12.
//   • COA file upload + storage — Round 12.
//   • Supplier registry / vendor management — Round 12+.
//   • Method-appropriateness check per ingredient class — Round 12+.
//   • Lot-level tracking + stale-attestation enforcement against
//     lot validity — Round 12+ lot schema.
//   • Method-list enforcement (Round 11 accepts free-text identity
//     test method) — Round 12+.
//
// ============================================================
// === DO NOT WEAKEN THIS GATE. DO NOT CREEP ITS SCOPE. ===
// ============================================================
//
// INTEGRITY MODEL (mirrors types/index.ts IdentityTestAttestation
// JSDoc — do not let this drift):
//
//   The §B3 gate enforces EXISTENCE AND STRUCTURAL CORRECTNESS only:
//     • Every required dietary ingredient has at least one attestation
//     • Required fields are populated and well-formed
//     • Timestamps are structurally plausible (not in the future
//       beyond clock-skew grace, not implausibly old)
//
//   The gate does NOT validate SUBSTANCE:
//     • Whether the supplier is real / appropriate
//     • Whether the supplier provides quality identity testing
//     • Whether the method is appropriate for the ingredient class
//     • Whether COA content matches ingredient specs
//     • Whether the attestation is honest and accurate
//
//   Software detects "missing or malformed"; human PA validates
//   "appropriate and accurate". An attestation with structurally-
//   correct but substantively-meaningless fields (e.g., supplier
//   'Acme Suppliers', method 'we tested it') CLEARS this gate —
//   that's PA-review territory, not gate territory. See the boundary
//   test at lib/__tests__/supplement-identity-test-gate.test.ts
//   Section A for the executable codification of this rule.
//
//   Future readers — including AI assistants — must respect this
//   boundary. Drift toward substance-checking (e.g., "method must be
//   appropriate for ingredient class", "supplier must be on a known
//   list") would expand the gate beyond its intended scope and
//   regress the brand value of platform-detects + PA-validates.
//   Before adding any substance check, surface the change in the
//   PR description for operator approval.
//
//   Anti-creep rule for §B11 keystone composition: if any code
//   change here touches supplier-side surface (registry, audit
//   trail, multi-lot scheduling, file upload pipeline), stop and
//   re-surface scope. Those are Bucket 2 / Round 12+ concerns.
// ============================================================

import type { HardStop, HardStopEvidence } from './hardStop';
import type { IdentityTestAttestation } from '../types';

/** Composition-registry identifier; imported by lib/supplementBucket1Gate.ts. */
export const B3_IDENTITY_TEST_ITEM_ID = 'b3-identity-test-attestation' as const;

/** Shared citation applied to all §B3 hard-stop evidence items. */
export const B3_IDENTITY_TEST_CITATION = '21 CFR 111.75(a)(1)' as const;

/** Clock-skew grace window for future-timestamp validation. */
const CLOCK_SKEW_GRACE_MS = 5 * 60 * 1000;

/**
 * Implausibility floor: attestations with attestedAt before 2000-01-01
 * UTC are rejected. 21 CFR Part 111 cGMP final rule published 2007;
 * pre-2000 attestations are at least process-suspect and most likely
 * fabricated or data-entry errors. Round 12+ may tighten with customer-
 * zero data.
 */
const PRE_2000_FLOOR_MS = Date.parse('2000-01-01T00:00:00.000Z');

export interface IdentityTestGateInput {
  /** Ingredient names that require identity-test attestation under
   *  21 CFR 111.75(a)(1). Caller computes this list — typically all
   *  dietary ingredients in the supplement (not excipients). */
  requiredIngredientNames: readonly string[];
  /** Available attestation records. Multiple per ingredient is allowed
   *  (supplier qualification, supplier change, re-verification cycle);
   *  the gate selects the latest by `attestedAt` for validation. */
  attestations: readonly IdentityTestAttestation[];
  /** Optional ISO timestamp for "now". Used by tests for deterministic
   *  results. Production callers omit; gate uses Date.now(). */
  now?: string;
}

export type IdentityTestGateResult =
  | (HardStop & { source: 'supplement-identity-test' })
  | {
      hardStop: false;
      source: 'supplement-identity-test';
    };

// ─── Internal helpers ──────────────────────────────────────────

function isValidIsoTimestamp(s: string | undefined): boolean {
  if (typeof s !== 'string' || !s.trim()) return false;
  return !Number.isNaN(Date.parse(s));
}

/**
 * Select the latest attestation by `attestedAt`. Ties broken by array
 * position (insertion order). Entries with malformed `attestedAt` sort
 * to the bottom (so a valid latest entry wins over a malformed entry
 * regardless of order).
 *
 * Round 12+: when lot schema lands, "latest" may need lot-aware
 * semantics rather than pure timestamp ordering.
 */
function selectLatestAttestation(
  attestations: readonly IdentityTestAttestation[],
): IdentityTestAttestation {
  return [...attestations].sort((a, b) => {
    const aMs = Date.parse(a.attestedAt);
    const bMs = Date.parse(b.attestedAt);
    const aNaN = Number.isNaN(aMs);
    const bNaN = Number.isNaN(bMs);
    if (aNaN && bNaN) return 0;
    if (aNaN) return 1;
    if (bNaN) return -1;
    return bMs - aMs;
  })[0];
}

function attestationSubject(att: IdentityTestAttestation): string {
  return `attestation ${att.id} (${att.ingredientName})`;
}

function validateAttestation(
  att: IdentityTestAttestation,
  nowMs: number,
): HardStopEvidence[] {
  const violations: HardStopEvidence[] = [];
  const subject = attestationSubject(att);

  // supplierName — non-empty, ≥ 2 chars after trim, not whitespace-only
  const supplier = (att.supplierName ?? '').trim();
  if (supplier.length < 2) {
    violations.push({
      subject,
      detail: `Attestation incomplete: supplier name missing or malformed (must be ≥2 non-whitespace characters).`,
      citation: B3_IDENTITY_TEST_CITATION,
    });
  }

  // identityTestMethod — non-empty after trim
  const method = (att.identityTestMethod ?? '').trim();
  if (method.length === 0) {
    violations.push({
      subject,
      detail: `Attestation incomplete: identity-test method not declared.`,
      citation: B3_IDENTITY_TEST_CITATION,
    });
  }

  // attestedBy — non-empty after trim
  const attestedBy = (att.attestedBy ?? '').trim();
  if (attestedBy.length === 0) {
    violations.push({
      subject,
      detail: `Attestation incomplete: attesting operator not recorded.`,
      citation: B3_IDENTITY_TEST_CITATION,
    });
  }

  // attestedAt — parseable ISO timestamp
  if (!isValidIsoTimestamp(att.attestedAt)) {
    violations.push({
      subject,
      detail: `Attestation timestamp is malformed (not a valid ISO 8601 timestamp).`,
      citation: B3_IDENTITY_TEST_CITATION,
    });
  } else {
    const attestedMs = Date.parse(att.attestedAt);
    // Future-timestamp check (with clock-skew grace)
    if (attestedMs > nowMs + CLOCK_SKEW_GRACE_MS) {
      violations.push({
        subject,
        detail: `Attestation timestamp is in the future (beyond ${CLOCK_SKEW_GRACE_MS / 60000}-minute clock-skew grace window).`,
        citation: B3_IDENTITY_TEST_CITATION,
      });
    }
    // Pre-2000 implausibility floor
    if (attestedMs < PRE_2000_FLOOR_MS) {
      violations.push({
        subject,
        detail: `Attestation timestamp is implausibly old (before 2000-01-01).`,
        citation: B3_IDENTITY_TEST_CITATION,
      });
    }
  }

  // testPerformedAt — optional; if present, must be parseable and ≤ attestedAt
  if (att.testPerformedAt !== undefined) {
    if (!isValidIsoTimestamp(att.testPerformedAt)) {
      violations.push({
        subject,
        detail: `Test-performed timestamp is malformed.`,
        citation: B3_IDENTITY_TEST_CITATION,
      });
    } else if (isValidIsoTimestamp(att.attestedAt)) {
      const testMs = Date.parse(att.testPerformedAt);
      const attestMs = Date.parse(att.attestedAt);
      if (testMs > attestMs) {
        violations.push({
          subject,
          detail: `Test-performed timestamp is after attestation timestamp (ordering violation).`,
          citation: B3_IDENTITY_TEST_CITATION,
        });
      }
    }
  }

  return violations;
}

// ─── Public: §B3 gate evaluator ────────────────────────────────

/**
 * Evaluate the §B3 identity-test attestation gate.
 *
 * Pure function — no side effects. For each required dietary
 * ingredient: select the latest attestation (by `attestedAt`); validate
 * it against the structural rules. Returns hard-stop with one or more
 * evidence items when any required ingredient lacks coverage or any
 * selected attestation is structurally malformed; returns cleared
 * otherwise.
 *
 * INTEGRITY MODEL: enforces existence + structural correctness only.
 * Substance validation (supplier appropriateness, method appropriateness,
 * test-result conformance) is PA-review territory. See module docblock
 * for the full boundary statement.
 */
export function evaluateIdentityTestGate(
  input: IdentityTestGateInput,
): IdentityTestGateResult {
  const nowMs = input.now !== undefined ? Date.parse(input.now) : Date.now();
  const evidence: HardStopEvidence[] = [];

  for (const ingredientName of input.requiredIngredientNames) {
    const matching = input.attestations.filter(
      a => a.ingredientName === ingredientName,
    );
    if (matching.length === 0) {
      evidence.push({
        subject: `ingredient '${ingredientName}'`,
        detail: `Identity-test attestation required per 21 CFR 111.75(a)(1); no attestation on file for ingredient '${ingredientName}'.`,
        citation: B3_IDENTITY_TEST_CITATION,
      });
      continue;
    }
    const latest = selectLatestAttestation(matching);
    evidence.push(...validateAttestation(latest, nowMs));
  }

  if (evidence.length === 0) {
    return { hardStop: false, source: 'supplement-identity-test' };
  }

  return {
    hardStop: true,
    source: 'supplement-identity-test',
    reason: evidence.length === 1
      ? `Refuse-to-export: identity-test attestation issue.`
      : `Refuse-to-export: ${evidence.length} identity-test attestation issues.`,
    evidence,
  };
}
