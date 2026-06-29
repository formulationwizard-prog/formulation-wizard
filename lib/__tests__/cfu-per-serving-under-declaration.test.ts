// ============================================================
// CFU per-serving under-declaration regression (#1, 2026-06-29)
// ------------------------------------------------------------
// The count branch in buildSupplementFacts emitted `amount: ing.qty` —
// the entered PER-CAPSULE count — never × unitsPerServing. A probiotic
// at 5 Bn CFU/cap in a 2-capsule serving therefore DECLARED 5 Bn when
// the serving actually delivers 10 Bn: under-declaration = misbranding
// under 21 CFR 101.36(b)(2)(i) (declared amount must equal the actual
// per-serving amount). Same shape as the F-3 dose-misbranding bug, in
// the count unit class.
//
// Fix: per-serving count = entered-per-capsule × unitsPerServing — the
// SAME per-serving multiplication the mass branch applies (psa.mg =
// per-capsule mg × units). Same model, different unit class (CFU vs mg).
//
// These invariants mirror the F-3 1000× mass tripwires for the count
// branch, so the symmetry is durable: a future contributor who breaks
// the × units sees exactly which misbranding case it guarded.
// ============================================================

import { describe, it, expect } from 'vitest';
import { buildSupplementFacts } from '../supplementLabeling';
import type { Ingredient } from '../../types';

const STRAIN = 'Lactobacillus acidophilus NCFM';

// Build the SFP for a single probiotic strain and return its declared count.
function declaredCount(qty: number, unit: string, unitsPerServing?: number): number | null {
  const probiotic: Ingredient = {
    name: STRAIN, qty, unit,
    foodData: null, subIngredients: [], allergens: [], costPerKg: 0, supplier: '',
  };
  const facts = buildSupplementFacts({
    ingredients: [probiotic],
    mode: 'supplements',
    servingSizeInGrams: 0,
    totalBatchGrams: 0,
    servingsPerContainer: 30,
    servingSizeLabel: unitsPerServing ? `${unitsPerServing} Capsules` : '1 Capsule',
    caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
    ...(unitsPerServing !== undefined ? { unitsPerServing } : {}),
  });
  const row = facts.otherActivesRows.find(r => /acidophilus/i.test(r.sourceName));
  return row ? row.amount : null;
}

describe('CFU per-serving under-declaration regression (#1)', () => {
  it('1-cap serving: per-capsule IS the per-serving count (5 Bn → 5 Bn)', () => {
    expect(declaredCount(5, 'Billion CFU', 1)).toBe(5);
  });

  it('2-cap serving declares 10 Bn, not 5 Bn (the under-declaration the fix guards)', () => {
    expect(declaredCount(5, 'Billion CFU', 2)).toBe(10);
  });

  it('3-cap serving declares 15 Bn, not 5 Bn', () => {
    expect(declaredCount(5, 'Billion CFU', 3)).toBe(15);
  });

  it('raw CFU magnitude scales the same way: 5,000,000,000 × 2 = 10,000,000,000', () => {
    expect(declaredCount(5_000_000_000, 'CFU', 1)).toBe(5_000_000_000);
    expect(declaredCount(5_000_000_000, 'CFU', 2)).toBe(10_000_000_000);
    expect(declaredCount(5_000_000_000, 'CFU', 3)).toBe(15_000_000_000);
  });

  it('unset unitsPerServing defaults to 1× — preserves the single-capsule contract', () => {
    // buildSupplementFacts called WITHOUT unitsPerServing (the existing-caller path).
    // The fix must not regress this to null/"—"; per-capsule = per-serving at 1 cap.
    expect(declaredCount(5, 'Billion CFU')).toBe(5);
  });
});
