// ============================================================
// Round 11 Phase 1 Step 2 — pre-flight verification for Finding #25
// ------------------------------------------------------------
// Tests for the extracted per-serving math helper at lib/supplementMath.ts.
// Written against the TARGET (correct) helper behavior, NOT current
// (Step 2) behavior. Per the directive's "tests before fix code" rule
// and the user-confirmed TDD discipline:
//
//   At Step 2 commit (this commit):
//     • F&B-mode tests: PASS (F&B math unchanged by extraction)
//     • Supplement-mode tests: FAIL (helper still applies F&B math
//       to supplement mode — the bug). This is the INTENTIONAL red
//       state per directive's pre-flight-before-fix-code discipline.
//
//   At Step 3 sub-issue 25a commit:
//     • Helper internals add the supplement-mode branch
//       (returns scale = 1.0)
//     • All tests turn green
//
// DO NOT modify these tests to match current (Step 2) behavior. They
// are the contract that 25a satisfies.
//
// Coverage mapped to the markdown verification matrix at
// docs/findings/round-11-verification-tests.md Section 1 (test IDs
// T1A-01 through T1D-04). Sections 2-12 of the matrix are
// integration / UI / cascade cases exercised manually or via end-
// to-end runs, not in this unit-test suite.
// ============================================================

import { describe, it, expect } from 'vitest';
import { computePerServingScale, computePerServingMass } from '../supplementMath';

// ============================================================
// Section 1A — Single-ingredient supplement-mode cases
// ------------------------------------------------------------
// The smoke-test repro setup: a 3-ingredient Immune Support Stack
// rolling up to ~0.515g total batch with a "2 capsules" serving
// size interpreted as 2g by the F&B math, yielding the canonical
// ~3.88x scaling artifact and the wrong 1942mg Vit C display.
//
// Supplement-mode tests pass servingSizeInGrams + totalBatchGrams
// that would produce the buggy ~3.88x F&B scale, then assert the
// CORRECT supplement-mode behavior (identity scale, displayMass =
// ingredientAmount). These tests fail at Step 2 commit (current
// helper still applies the F&B scale) and pass at 25a.
// ============================================================
describe('Section 1A — Single-ingredient supplement-mode cases', () => {
  const SUPP_BATCH_GRAMS = 0.515;          // Vit C 0.5g + Vit D3 25µg + Zinc 15mg ≈ 0.515g
  const SUPP_SERVING_GRAMS = 2;            // "2 capsules" treated as 2g by F&B math (the bug shape)

  it('T1A-01: Vitamin C 500mg @ 2 caps/serving → displays 500 mg', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 500,
      ingredientUnit: 'mg',
      servingSizeInGrams: SUPP_SERVING_GRAMS,
      totalBatchGrams: SUPP_BATCH_GRAMS,
    });
    expect(result.displayMass).toBe(500);
    expect(result.displayUnit).toBe('mg');
  });

  it('T1A-02: Vitamin C 1000mg @ 1 cap/serving → displays 1000 mg', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 1000,
      ingredientUnit: 'mg',
      servingSizeInGrams: 1,
      totalBatchGrams: 0.5,
    });
    expect(result.displayMass).toBe(1000);
    expect(result.displayUnit).toBe('mg');
  });

  it('T1A-03: Vitamin C 1900mg @ 1 cap → displays 1900 mg (under 2000mg UL)', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 1900,
      ingredientUnit: 'mg',
      servingSizeInGrams: 1,
      totalBatchGrams: 1.9,
    });
    expect(result.displayMass).toBe(1900);
    expect(result.displayUnit).toBe('mg');
  });

  it('T1A-04: Vitamin C 2500mg @ 1 cap → displays 2500 mg (over 2000mg UL)', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 2500,
      ingredientUnit: 'mg',
      servingSizeInGrams: 1,
      totalBatchGrams: 2.5,
    });
    expect(result.displayMass).toBe(2500);
    expect(result.displayUnit).toBe('mg');
  });

  it('T1A-05: Vitamin D3 25 mcg @ 2 caps/serving → displays 25 mcg', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 25,
      ingredientUnit: 'mcg',
      servingSizeInGrams: SUPP_SERVING_GRAMS,
      totalBatchGrams: SUPP_BATCH_GRAMS,
    });
    expect(result.displayMass).toBe(25);
    expect(result.displayUnit).toBe('mcg');
  });

  it('T1A-06: Zinc 15 mg @ 2 caps/serving → displays 15 mg', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 15,
      ingredientUnit: 'mg',
      servingSizeInGrams: SUPP_SERVING_GRAMS,
      totalBatchGrams: SUPP_BATCH_GRAMS,
    });
    expect(result.displayMass).toBe(15);
    expect(result.displayUnit).toBe('mg');
  });

  it('T1A-07: Biotin 30 mcg @ 1 cap/serving → displays 30 mcg (low-dose edge)', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 30,
      ingredientUnit: 'mcg',
      servingSizeInGrams: 1,
      totalBatchGrams: 0.5,
    });
    expect(result.displayMass).toBe(30);
    expect(result.displayUnit).toBe('mcg');
  });

  it('T1A-08: Magnesium 400 mg @ 4 caps/serving → displays 400 mg (high-dose edge)', () => {
    const result = computePerServingMass({
      mode: 'supplements',
      ingredientAmount: 400,
      ingredientUnit: 'mg',
      servingSizeInGrams: 4,
      totalBatchGrams: 1.6,
    });
    expect(result.displayMass).toBe(400);
    expect(result.displayUnit).toBe('mg');
  });
});

// ============================================================
// Section 1B — Multi-ingredient supplement-mode case
// ------------------------------------------------------------
// The exact Immune Support Stack repro from the 2026-05-15 smoke
// test: Vit C 500mg + Vit D3 25mcg + Zinc 15mg @ 2 caps/serving.
// Each ingredient should display its entered value, not the
// F&B-scaled value.
// ============================================================
describe('Section 1B — Multi-ingredient Immune Support Stack (smoke-test repro)', () => {
  const SUPP_BATCH_GRAMS = 0.515;
  const SUPP_SERVING_GRAMS = 2;
  const SUPP_CONTEXT = {
    mode: 'supplements' as const,
    servingSizeInGrams: SUPP_SERVING_GRAMS,
    totalBatchGrams: SUPP_BATCH_GRAMS,
  };

  it('T1B-01: all three ingredients render at entered values', () => {
    const vitC = computePerServingMass({
      ...SUPP_CONTEXT,
      ingredientAmount: 500,
      ingredientUnit: 'mg',
    });
    const vitD3 = computePerServingMass({
      ...SUPP_CONTEXT,
      ingredientAmount: 25,
      ingredientUnit: 'mcg',
    });
    const zinc = computePerServingMass({
      ...SUPP_CONTEXT,
      ingredientAmount: 15,
      ingredientUnit: 'mg',
    });

    expect(vitC.displayMass).toBe(500);
    expect(vitC.displayUnit).toBe('mg');
    expect(vitD3.displayMass).toBe(25);
    expect(vitD3.displayUnit).toBe('mcg');
    expect(zinc.displayMass).toBe(15);
    expect(zinc.displayUnit).toBe('mg');
  });
});

// ============================================================
// Section 1C — Helper-primitive scale tests
// ------------------------------------------------------------
// Direct assertions on computePerServingScale. Locks in the
// mode-branching contract that 25a will satisfy.
// ============================================================
describe('Section 1C — computePerServingScale primitive', () => {
  it('T1C-01a: supplement mode returns identity scale (1.0) — smoke-test serving/batch', () => {
    const scale = computePerServingScale({
      mode: 'supplements',
      servingSizeInGrams: 2,
      totalBatchGrams: 0.515,
    });
    expect(scale).toBe(1.0);
  });

  it('T1C-01b: supplement mode returns identity scale (1.0) — alternative values', () => {
    const scale = computePerServingScale({
      mode: 'supplements',
      servingSizeInGrams: 30,
      totalBatchGrams: 1000,
    });
    expect(scale).toBe(1.0);
  });

  it('T1C-02: F&B mode returns servingSize/batch (regression — current correct behavior)', () => {
    const scale = computePerServingScale({
      mode: 'fb',
      servingSizeInGrams: 30,
      totalBatchGrams: 1000,
    });
    expect(scale).toBeCloseTo(0.03, 10);
  });

  it('T1C-03: F&B mode small batch (regression)', () => {
    const scale = computePerServingScale({
      mode: 'fb',
      servingSizeInGrams: 15,
      totalBatchGrams: 300,
    });
    expect(scale).toBeCloseTo(0.05, 10);
  });

  it('T1C-04: F&B mode zero-serving guard returns 0', () => {
    const scale = computePerServingScale({
      mode: 'fb',
      servingSizeInGrams: 0,
      totalBatchGrams: 100,
    });
    expect(scale).toBe(0);
  });

  it('T1C-05: F&B mode zero-batch guard returns 0 (no div-by-zero)', () => {
    const scale = computePerServingScale({
      mode: 'fb',
      servingSizeInGrams: 30,
      totalBatchGrams: 0,
    });
    expect(scale).toBe(0);
  });
});

// ============================================================
// Section 1D — Unit-change edge cases (Finding #27 interaction)
// ------------------------------------------------------------
// Helper does NOT perform unit conversion — it passes the
// ingredient's unit through unchanged. Finding #27 (unit-change
// mass preservation) is handled in the UI input handler layer,
// not here.
// ============================================================
describe('Section 1D — Unit-change preservation (helper passes unit through)', () => {
  // Non-identity F&B scale setup ensures these tests fail at Step 2 (helper
  // still applies F&B math, scale=4.0 here) and pass at 25a (scale=1.0).
  // The setup represents a small-batch supplement where the F&B scaling
  // artifact would magnify ingredient amounts ~4x — clearly wrong vs. the
  // entered values being per-serving doses.
  const CONTEXT = {
    mode: 'supplements' as const,
    servingSizeInGrams: 2,
    totalBatchGrams: 0.5,
  };

  it('T1D-01: 500 mg → display 500 mg (unit preserved)', () => {
    const result = computePerServingMass({
      ...CONTEXT,
      ingredientAmount: 500,
      ingredientUnit: 'mg',
    });
    expect(result.displayMass).toBe(500);
    expect(result.displayUnit).toBe('mg');
  });

  it('T1D-02: 0.5 g → display 0.5 g (unit preserved)', () => {
    const result = computePerServingMass({
      ...CONTEXT,
      ingredientAmount: 0.5,
      ingredientUnit: 'g',
    });
    expect(result.displayMass).toBe(0.5);
    expect(result.displayUnit).toBe('g');
  });

  it('T1D-03: 500000 mcg → display 500000 mcg (unit preserved)', () => {
    const result = computePerServingMass({
      ...CONTEXT,
      ingredientAmount: 500000,
      ingredientUnit: 'mcg',
    });
    expect(result.displayMass).toBe(500000);
    expect(result.displayUnit).toBe('mcg');
  });

  it('T1D-04: 2.5 g → display 2.5 g (unit preserved)', () => {
    const result = computePerServingMass({
      ...CONTEXT,
      ingredientAmount: 2.5,
      ingredientUnit: 'g',
    });
    expect(result.displayMass).toBe(2.5);
    expect(result.displayUnit).toBe('g');
  });
});
