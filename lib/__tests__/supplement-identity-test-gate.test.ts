// ============================================================
// §B3 + §B11 BUCKET 1 — IDENTITY-TEST ATTESTATION GATE
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 (2026-05-17). Pre-flight verification
// suite for lib/identityTest.ts. Tests:
//
//   • evaluateIdentityTestGate — per-§B-item gate composing
//     IdentityTestAttestation[] coverage + structural validation
//     into HardStop | cleared
//   • Cleared cases including the structural-correctness boundary
//     test (gate clears on present-but-substantively-meaningless
//     attestations — PA-review territory, not gate territory)
//   • Coverage hard-stop (missing attestation per dietary ingredient)
//   • Field-level hard-stop (empty supplier name, empty method, etc.)
//   • Timestamp hard-stop (malformed, future, pre-2000 implausibility)
//   • Reason / evidence / source-marker shape
//   • Composition-registry identifier + citation
//
// Boundary discipline: software detects "missing or malformed";
// human PA validates "appropriate and accurate". This suite
// codifies that boundary in executable form — see Section A's
// boundary test for the explicit anti-creep regression check.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  evaluateIdentityTestGate,
  B3_IDENTITY_TEST_ITEM_ID,
  B3_IDENTITY_TEST_CITATION,
} from '../identityTest';
import type { IdentityTestAttestation } from '../../types';
import { isHardStop } from '../hardStop';

// ─── Test fixtures ──────────────────────────────────────────────

const FIXED_NOW = '2026-05-17T12:00:00.000Z';

function makeAttestation(overrides: Partial<IdentityTestAttestation> = {}): IdentityTestAttestation {
  return {
    id: 'att-test-001',
    ingredientName: 'Vitamin C (Ascorbic Acid)',
    supplierName: 'Acme Suppliers, Inc.',
    identityTestMethod: 'HPLC',
    attestedAt: '2026-05-01T10:00:00.000Z',
    attestedBy: 'operator@formulationwizard.com',
    ...overrides,
  };
}

// ============================================================
// Section A — Cleared cases
// ============================================================
describe('evaluateIdentityTestGate — cleared cases', () => {
  it('empty required-ingredient list + empty attestations → cleared', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: [],
      attestations: [],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
    expect(result.source).toBe('supplement-identity-test');
  });

  it('one ingredient + one matching valid attestation → cleared', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C (Ascorbic Acid)'],
      attestations: [makeAttestation()],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
  });

  it('multiple ingredients + matching valid attestations → cleared', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: [
        'Vitamin C (Ascorbic Acid)',
        'Vitamin D3 (Cholecalciferol)',
        'Zinc Bisglycinate',
      ],
      attestations: [
        makeAttestation({ id: 'a1', ingredientName: 'Vitamin C (Ascorbic Acid)' }),
        makeAttestation({ id: 'a2', ingredientName: 'Vitamin D3 (Cholecalciferol)', identityTestMethod: 'HPTLC' }),
        makeAttestation({ id: 'a3', ingredientName: 'Zinc Bisglycinate', identityTestMethod: 'FTIR' }),
      ],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
  });

  it('multiple attestations per ingredient → latest valid satisfies coverage', () => {
    // Two attestations for the same ingredient — both valid; latest by
    // attestedAt wins. This is normal real-world behavior (supplier
    // qualification, supplier change, re-verification cycle).
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C (Ascorbic Acid)'],
      attestations: [
        makeAttestation({ id: 'a1', attestedAt: '2025-01-01T00:00:00.000Z', supplierName: 'Old Supplier' }),
        makeAttestation({ id: 'a2', attestedAt: '2026-05-01T00:00:00.000Z', supplierName: 'New Supplier' }),
      ],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
  });

  it('testPerformedAt earlier than attestedAt → cleared (ordering valid)', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C (Ascorbic Acid)'],
      attestations: [
        makeAttestation({
          testPerformedAt: '2026-04-15T08:00:00.000Z',
          attestedAt: '2026-05-01T10:00:00.000Z',
        }),
      ],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
  });

  it('cleared result carries source supplement-identity-test', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: [],
      attestations: [],
      now: FIXED_NOW,
    });
    if (result.hardStop) throw new Error('expected cleared');
    expect(result.source).toBe('supplement-identity-test');
  });

  // ────────────────────────────────────────────────────────────
  // ANTI-CREEP BOUNDARY TEST
  // ------------------------------------------------------------
  // The gate clears on present-but-substantively-meaningless
  // attestations. This is INTENTIONAL — substance is PA territory,
  // not gate territory. Future drift that adds substance checking
  // (e.g., "supplier name must look real", "method must be valid
  // for ingredient class") would creep beyond the §B3 gate scope.
  // This test codifies the boundary in executable form.
  // ────────────────────────────────────────────────────────────
  it('clears when attestation has structural correctness but no substantive validity (PA-review territory)', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C (Ascorbic Acid)'],
      attestations: [
        makeAttestation({
          // Fictitious-but-well-formed supplier name. Gate cannot judge
          // whether 'Acme Suppliers' is a real entity — that's PA's job.
          supplierName: 'Acme Suppliers',
          // Vacuous-but-non-empty method. Gate cannot judge whether
          // 'we tested it' is a meaningful method — PA's job to validate.
          identityTestMethod: 'we tested it',
          // Valid timestamp, valid attestedBy. All structural fields
          // populated; content is meaningless. Gate clears.
          attestedAt: '2026-05-01T10:00:00.000Z',
          attestedBy: 'operator',
        }),
      ],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section B — Coverage hard-stop
// ============================================================
describe('evaluateIdentityTestGate — coverage hard-stop', () => {
  it('required ingredient with no attestation → hard-stop', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C (Ascorbic Acid)'],
      attestations: [],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it('3 required, 2 attested → hard-stop with 1 evidence item for the missing', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C', 'Vitamin D3', 'Zinc'],
      attestations: [
        makeAttestation({ id: 'a1', ingredientName: 'Vitamin C' }),
        makeAttestation({ id: 'a2', ingredientName: 'Vitamin D3' }),
      ],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].subject).toContain('Zinc');
  });

  it('3 required, 0 attested → hard-stop with 3 evidence items', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C', 'Vitamin D3', 'Zinc'],
      attestations: [],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence).toHaveLength(3);
  });

  it('attestation for non-required ingredient does not satisfy a missing required ingredient', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Different Ingredient' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('subtle rename behavior: ingredient renamed → linkage broken → gate refuses (this is correct behavior)', () => {
    // Operator renames "Vitamin C" to "Vitamin C (Ascorbic Acid)" in the
    // workspace. The existing attestation still points at "Vitamin C".
    // The gate refuses — a rename is a different ingredient identity from
    // the gate's perspective and forces re-attestation. Forward-compat
    // note: Round 12+ UUID migration will eliminate this edge case.
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C (Ascorbic Acid)'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });
});

// ============================================================
// Section C — Field-level hard-stop
// ============================================================
describe('evaluateIdentityTestGate — field-level hard-stop', () => {
  it('empty supplierName → hard-stop', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', supplierName: '' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('whitespace-only supplierName → hard-stop', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', supplierName: '   ' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('single-char supplierName → hard-stop (< 2 chars)', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', supplierName: 'A' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('empty identityTestMethod → hard-stop', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', identityTestMethod: '' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('empty attestedBy → hard-stop', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', attestedBy: '' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });
});

// ============================================================
// Section D — Timestamp hard-stop
// ============================================================
describe('evaluateIdentityTestGate — timestamp hard-stop', () => {
  it('attestedAt is not a valid ISO timestamp → hard-stop', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', attestedAt: 'not-a-timestamp' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('attestedAt 10 minutes in the future (beyond clock-skew grace) → hard-stop', () => {
    // FIXED_NOW = 2026-05-17T12:00:00Z. +10 min = 12:10:00.
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', attestedAt: '2026-05-17T12:10:00.000Z' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('attestedAt 4 minutes in the future → cleared (within 5-min clock-skew grace)', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', attestedAt: '2026-05-17T12:04:00.000Z' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
  });

  it('attestedAt pre-2000 → hard-stop (implausibility floor)', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', attestedAt: '1999-12-31T23:59:59.000Z' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('attestedAt = 2000-01-01T00:00:00Z → cleared (at boundary)', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [makeAttestation({ ingredientName: 'Vitamin C', attestedAt: '2000-01-01T00:00:00.000Z' })],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(false);
  });

  it('malformed testPerformedAt → hard-stop', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [
        makeAttestation({
          ingredientName: 'Vitamin C',
          testPerformedAt: 'not-a-timestamp',
        }),
      ],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });

  it('testPerformedAt after attestedAt → hard-stop (ordering violation)', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [
        makeAttestation({
          ingredientName: 'Vitamin C',
          attestedAt: '2026-05-01T10:00:00.000Z',
          testPerformedAt: '2026-05-10T10:00:00.000Z',
        }),
      ],
      now: FIXED_NOW,
    });
    expect(result.hardStop).toBe(true);
  });
});

// ============================================================
// Section E — Evidence + reason shape
// ============================================================
describe('evaluateIdentityTestGate — evidence + reason shape', () => {
  it('hard-stop carries source supplement-identity-test', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [],
      now: FIXED_NOW,
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.source).toBe('supplement-identity-test');
  });

  it('evidence detail names the ingredient for coverage violations', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [],
      now: FIXED_NOW,
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence[0].detail).toContain('Vitamin C');
  });

  it('evidence citation contains 21 CFR 111.75', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [],
      now: FIXED_NOW,
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence[0].citation).toContain('21 CFR 111.75');
  });

  it('reason summarizes count when multiple violations', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C', 'Vitamin D3', 'Zinc'],
      attestations: [],
      now: FIXED_NOW,
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.reason).toContain('3');
  });

  it('reason for single violation is descriptive', () => {
    const result = evaluateIdentityTestGate({
      requiredIngredientNames: ['Vitamin C'],
      attestations: [],
      now: FIXED_NOW,
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.reason.toLowerCase()).toContain('refuse-to-export');
  });
});

// ============================================================
// Section F — Composition-registry identifier + citation
// ============================================================
describe('§B3 composition-registry identifier', () => {
  it('exports a stable identifier consumed by the Bucket 1 gate', () => {
    expect(B3_IDENTITY_TEST_ITEM_ID).toBe('b3-identity-test-attestation');
  });

  it('citation names 21 CFR 111.75(a)(1)', () => {
    expect(B3_IDENTITY_TEST_CITATION).toContain('21 CFR 111.75(a)(1)');
  });
});
