// ============================================================
// detectAllergens — word-boundary regex regression tests
// ------------------------------------------------------------
// Surfaced 2026-05-23 via operator workspace test:
//   Glucosamine HCl (allergens: ['Crustacean Shellfish']) caused
//   Allergen Statement to render as "Contains: Crustacean Shellfish,
//   Fish, Shellfish" — substring match on 'fish' inside 'shellfish'
//   produced false-positive Fish allergen (FDA labeling compliance
//   violation: over-declared allergen).
//
// Fix: word-boundary-START regex `\b${keyword}\w*\b`.
//   • PREVENTS substring-anywhere matches (fish in shellfish)
//   • PRESERVES stem-keyword design (anchov → anchovies; soy → soybean)
//
// Note: full FALCPA-compliant species-naming output (e.g., "Fish (Anchovy)"
// instead of just "Fish") is a separate launch-blocker task — requires
// wiring up lib/supplementAllergen.ts detectAllergensDetailed() at the
// UI layer. These tests cover the legacy detector's bug-fix only.
// ============================================================

import { describe, it, expect } from 'vitest';
import { detectAllergens } from '../utils';

describe('detectAllergens — word-boundary regression (2026-05-23 substring bug)', () => {
  it('"Crustacean Shellfish" matches Shellfish but NOT Fish (the original bug)', () => {
    const result = detectAllergens('Crustacean Shellfish');
    expect(result).toContain('Shellfish');
    expect(result).not.toContain('Fish');
  });

  it('"Shellfish-Derived" matches Shellfish but NOT Fish', () => {
    const result = detectAllergens('Glucosamine HCl (USP, Shellfish-Derived)');
    expect(result).toContain('Shellfish');
    expect(result).not.toContain('Fish');
  });

  it('"Shellfish allergen warning" in notes matches Shellfish but NOT Fish', () => {
    const result = detectAllergens('Joint health. 1500 mg typical. Shellfish allergen warning.');
    expect(result).toContain('Shellfish');
    expect(result).not.toContain('Fish');
  });
});

describe('detectAllergens — correct detection still works (no regressions)', () => {
  it('"Anchovies" matches Fish (anchov keyword)', () => {
    expect(detectAllergens('Anchovies')).toContain('Fish');
  });

  it('"Tuna" matches Fish', () => {
    expect(detectAllergens('Tuna')).toContain('Fish');
  });

  it('"Almonds" matches Tree Nuts (almond keyword with plural)', () => {
    expect(detectAllergens('Almonds')).toContain('Tree Nuts');
  });

  it('"Walnuts" matches Tree Nuts (walnut keyword with plural)', () => {
    expect(detectAllergens('Walnuts')).toContain('Tree Nuts');
  });

  it('"Peanut Butter" matches Peanuts (compound word — both halves are separate words)', () => {
    expect(detectAllergens('Peanut Butter')).toContain('Peanuts');
  });

  it('"Whole Eggs" matches Eggs (egg keyword with plural s)', () => {
    expect(detectAllergens('Whole Eggs')).toContain('Eggs');
  });

  it('"Soybean Oil" matches Soybeans (soy keyword)', () => {
    expect(detectAllergens('Soybean Oil')).toContain('Soybeans');
  });

  it('"Milk Powder" matches Milk', () => {
    expect(detectAllergens('Milk Powder')).toContain('Milk');
  });

  it('"Sesame Seeds" matches Sesame', () => {
    expect(detectAllergens('Sesame Seeds')).toContain('Sesame');
  });

  it('"Wheat Flour" matches Wheat', () => {
    expect(detectAllergens('Wheat Flour')).toContain('Wheat');
  });
});

describe('detectAllergens — multi-allergen text', () => {
  it('"Worcestershire (Distilled Vinegar, Anchovies, Garlic)" matches Fish', () => {
    expect(detectAllergens('Worcestershire (Distilled Vinegar, Anchovies, Garlic)')).toContain('Fish');
  });

  it('Caesar dressing text matches multiple allergens', () => {
    const result = detectAllergens('Olive Oil, Pasteurized Egg Yolks, Lemon Juice, Anchovies, Parmesan Cheese, Dijon Mustard');
    expect(result).toContain('Fish');     // anchov
    expect(result).toContain('Eggs');     // egg
    expect(result).toContain('Milk');     // cheese
    expect(result).toContain('Mustard');  // mustard
  });
});

describe('detectAllergens — empty / no allergens', () => {
  it('empty string returns empty array', () => {
    expect(detectAllergens('')).toEqual([]);
  });

  it('text with no allergen keywords returns empty array', () => {
    expect(detectAllergens('Tomatoes, Onions, Bell Peppers, Cilantro')).toEqual([]);
  });
});
