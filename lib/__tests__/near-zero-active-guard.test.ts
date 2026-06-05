// ============================================================
// Near-zero-active guard (2026-06-05)
// ------------------------------------------------------------
// Surfaced during live verification of the SFP scale fix: a carrier-loaded
// SKU (e.g. "Vitamin D3 100,000 IU/g on MCC", potencyFactor ≈ 0.0025) entered
// as a direct-mcg amount renders 0 mcg on the Supplement Facts panel — a silent
// 21 CFR 101.36 mislabeling trap. buildSupplementFacts now flags any active
// whose LABEL amount rounds to 0 despite a non-zero entry. The flag is surfaced
// as a workspace advisory OUTSIDE the regulated panel.
// ============================================================
import { describe, it, expect } from 'vitest';
import { buildSupplementFacts, formatNearZeroWarning, formatSupplementAmount } from '../supplementLabeling';
import { UNIT_TO_GRAMS } from '../utils';
import type { Ingredient } from '../../types';

function ind(name: string, qty: number, unit: string, data: Record<string, unknown> = {}): Ingredient {
  return { name, qty, unit, foodData: { type: 'industrial', data: { category: 'Vitamins', ...data } } } as unknown as Ingredient;
}
function params(ingredients: Ingredient[]) {
  const totalBatchGrams = ingredients.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 0), 0);
  return {
    ingredients, mode: 'supplements' as const,
    servingSizeInGrams: 1, totalBatchGrams,            // supplementServingMassG omitted → identity scale (Convention A)
    servingsPerContainer: 30, servingSizeLabel: '2 Capsules',
    caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  };
}

describe('near-zero-active guard', () => {
  it('flags a carrier-loaded D3 SKU entered as direct mcg (the silent-zero trap)', () => {
    const carrier = ind('Vitamin D3 Cholecalciferol (100,000 IU/g on MCC)', 8, 'mcg', { potencyFactor: 0.0025 });
    const f = buildSupplementFacts(params([carrier]));
    // the label row genuinely rounds to 0 ...
    const row = f.vitaminMineralRows.find(r => /Vitamin D/.test(r.displayName))!;
    expect(formatSupplementAmount(row.amount, row.unit)).toBe('0');
    // ... and the guard catches it
    expect(f.nearZeroActiveWarnings).toHaveLength(1);
    expect(f.nearZeroActiveWarnings[0]).toMatchObject({ displayName: 'Vitamin D', enteredAmount: 8, enteredUnit: 'mcg', labelUnit: 'mcg', potencyFactor: 0.0025 });
  });

  it('does NOT flag a direct-mcg D3 SKU (no potencyFactor → shows 8 mcg)', () => {
    const direct = ind('Vitamin D3 Vegan (Lichen-Sourced)', 8, 'mcg');
    const f = buildSupplementFacts(params([direct]));
    const row = f.vitaminMineralRows.find(r => /Vitamin D/.test(r.displayName))!;
    expect(formatSupplementAmount(row.amount, row.unit)).toBe('8');
    expect(f.nearZeroActiveWarnings).toHaveLength(0);
  });

  it('does NOT flag a normal vitamin (Vitamin C 22 mg)', () => {
    const f = buildSupplementFacts(params([ind('Vitamin C (Ascorbic Acid USP, Fine)', 22, 'mg')]));
    expect(f.nearZeroActiveWarnings).toHaveLength(0);
  });

  it('flags only the offending active in a mixed formula', () => {
    const f = buildSupplementFacts(params([
      ind('Vitamin C (Ascorbic Acid USP, Fine)', 22, 'mg'),
      ind('Vitamin D3 Cholecalciferol (100,000 IU/g on MCC)', 8, 'mcg', { potencyFactor: 0.0025 }),
      ind('Zinc Picolinate (USP)', 15, 'mg', { category: 'Minerals' }),
    ]));
    expect(f.nearZeroActiveWarnings.map(w => w.displayName)).toEqual(['Vitamin D']);
  });

  it('message: carrier-loaded gets plain-language product-mass guidance', () => {
    const msg = formatNearZeroWarning({ ingredientName: 'Vitamin D3 Cholecalciferol (100,000 IU/g on MCC)', displayName: 'Vitamin D', enteredAmount: 8, enteredUnit: 'mcg', labelUnit: 'mcg', potencyFactor: 0.0025 });
    expect(msg).toMatch(/Vitamin D rounds to 0 mcg/);
    expect(msg).toMatch(/carrier-loaded/);
    expect(msg).toMatch(/product mass/);
  });

  it('message: non-carrier mismatch gets a unit/amount check', () => {
    const msg = formatNearZeroWarning({ ingredientName: 'X', displayName: 'Vitamin D', enteredAmount: 0.0001, enteredUnit: 'mcg', labelUnit: 'mcg', potencyFactor: 1 });
    expect(msg).toMatch(/Verify the entered amount and unit/);
  });
});
