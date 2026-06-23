// CFU as a first-class COUNT amount (2026-06-23). Probiotics declare by
// colony-forming units, not weight. These lock the three guarantees that make
// a probiotic function correctly end-to-end:
//   1. PARSE — "10 Billion CFU" is read as a count, the line is NOT dropped.
//   2. MASS  — a count contributes ZERO weight (the `|| 1` grams-trap is closed).
//   3. PANEL — the count renders as a no-%DV row, exactly as entered.
import { describe, it, expect } from 'vitest';
import { parsePastedFormula } from '../parseFormula';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import { isCountUnit, toGrams } from '../utils';
import { buildSupplementFacts } from '../supplementLabeling';
import type { Ingredient } from '../../types';

const PROBIOTIC_PASTE =
  'Probiotic Blend 10 Billion CFU\n' +
  'Lactobacillus acidophilus 5 Billion CFU\n' +
  'Inulin (Prebiotic Fiber) 2000 mg';

describe('CFU — parse: counts are read, lines are not dropped (F-10)', () => {
  const rows = parsePastedFormula(PROBIOTIC_PASTE, SUPPLEMENT_INGREDIENTS);

  it('all 3 lines survive — the two CFU strains are no longer silently dropped', () => {
    expect(rows.length).toBe(3); // regression guard: was 1 before CFU support
  });

  it('CFU lines parse as counts, with a CFU unit — never converted to grams', () => {
    const cfuRows = rows.filter(r => /cfu/i.test(r.parsedUnit));
    expect(cfuRows.length).toBe(2);
    for (const r of cfuRows) {
      expect(r.parsedQty).toBeGreaterThan(0);   // amount preserved (10, 5)
      expect(/cfu/i.test(r.parsedUnit)).toBe(true);
      expect(r.parsedUnit).not.toBe('g');        // the grams-trap is NOT sprung
    }
  });

  it('the mg prebiotic still parses as a weight', () => {
    const mgRow = rows.find(r => r.parsedUnit === 'mg');
    expect(mgRow?.parsedQty).toBe(2000);
  });
});

describe('CFU — mass: a count is never a weight (grams-trap closed)', () => {
  it('isCountUnit flags CFU units, not weights', () => {
    expect(isCountUnit('Billion CFU')).toBe(true);
    expect(isCountUnit('CFU')).toBe(true);
    expect(isCountUnit('mg')).toBe(false);
    expect(isCountUnit('g')).toBe(false);
  });

  it('toGrams returns 0 for a count — "10 Billion CFU" is NOT 10 grams', () => {
    expect(toGrams(10, 'Billion CFU')).toBe(0);
    expect(toGrams(5, 'CFU')).toBe(0);
    expect(toGrams(2000, 'mg')).toBe(2); // weights still convert normally
  });
});

describe('CFU — panel: renders as a no-%DV count row', () => {
  const probiotic: Ingredient = {
    name: 'Lactobacillus acidophilus', qty: 5, unit: 'Billion CFU',
    foodData: null, subIngredients: [], allergens: [], costPerKg: 0, supplier: '',
  };
  const facts = buildSupplementFacts({
    ingredients: [probiotic], mode: 'supplements',
    servingSizeInGrams: 0, totalBatchGrams: 0,
    servingsPerContainer: 30, servingSizeLabel: '1 Capsule', caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  });

  it('the CFU active appears on the panel with its count + unit, no %DV', () => {
    const row = facts.otherActivesRows.find(r => /acidophilus/i.test(r.sourceName));
    expect(row).toBeTruthy();
    expect(row!.amount).toBe(5);                 // exactly as entered — never scaled
    expect(/cfu/i.test(row!.unit)).toBe(true);
    expect(row!.percentDV).toBeNull();           // probiotics have no Daily Value
  });
});
