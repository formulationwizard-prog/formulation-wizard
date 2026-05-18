// ============================================================
// Supplement stacks data layer — schema integrity + helper tests
// ------------------------------------------------------------
// Lock in the §VII.34 named-stacks contract:
//   • All 20 initial stacks present and well-formed
//   • findStacksContaining returns the right stacks per ingredient
//   • detectStacksFromFormulation surfaces matches above threshold
//     and ranks by coverage descending
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  SUPPLEMENT_STACKS,
  findStacksContaining,
  detectStacksFromFormulation,
  type Stack,
} from '../data/stacks';

describe('SUPPLEMENT_STACKS — schema integrity', () => {
  it('has exactly 20 initial stacks (rulebook §VII.34)', () => {
    expect(SUPPLEMENT_STACKS.length).toBe(20);
  });

  it('every stack has a unique id', () => {
    const ids = SUPPLEMENT_STACKS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every stack id follows STACK.<UPPER_SNAKE> convention', () => {
    for (const stack of SUPPLEMENT_STACKS) {
      expect(stack.id).toMatch(/^STACK\.[A-Z][A-Z0-9_]*$/);
    }
  });

  it('every stack has at least 3 mustHave members', () => {
    for (const stack of SUPPLEMENT_STACKS) {
      expect(stack.mustHave.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every stack has at least 1 citation', () => {
    for (const stack of SUPPLEMENT_STACKS) {
      expect(stack.citations.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every stack has lastReviewedDate as ISO date', () => {
    for (const stack of SUPPLEMENT_STACKS) {
      expect(stack.lastReviewedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('all mustHave/commonCompanion/optional members have valid dose ranges', () => {
    for (const stack of SUPPLEMENT_STACKS) {
      const allMembers = [...stack.mustHave, ...stack.commonCompanion, ...stack.optional];
      for (const m of allMembers) {
        expect(m.typicalDoseRange.min).toBeLessThanOrEqual(m.typicalDoseRange.max);
        expect(m.typicalDoseRange.min).toBeGreaterThanOrEqual(0);
        expect(['mg', 'mcg', 'g', 'IU', 'CFU']).toContain(m.typicalDoseRange.unit);
      }
    }
  });

  it('foundational stacks are MULTIVITAMIN_CORE and PRENATAL_CORE', () => {
    const foundational = SUPPLEMENT_STACKS.filter(s => s.category === 'foundational');
    const ids = foundational.map(s => s.id);
    expect(ids).toContain('STACK.MULTIVITAMIN_CORE');
    expect(ids).toContain('STACK.PRENATAL_CORE');
  });

  it('all required named stacks per rulebook §VII.34 are present', () => {
    const requiredIds = [
      'STACK.MULTIVITAMIN_CORE',
      'STACK.PRENATAL_CORE',
      'STACK.SLEEP',
      'STACK.FOCUS',
      'STACK.PRE_WORKOUT',
      'STACK.RECOVERY_BCAA',
      'STACK.WOMENS_HORMONAL',
      'STACK.MENS_PROSTATE',
      'STACK.JOINT',
      'STACK.IMMUNE',
      'STACK.GUT',
      'STACK.LONGEVITY',
      'STACK.METABOLIC',
      'STACK.LIVER_DETOX',
      'STACK.STRESS_ADAPTOGEN',
      'STACK.HEART_CV',
      'STACK.BONE',
      'STACK.SKIN_HAIR_NAILS',
      'STACK.EYE_HEALTH',
      'STACK.MOOD',
    ];
    const presentIds = new Set(SUPPLEMENT_STACKS.map(s => s.id));
    for (const id of requiredIds) {
      expect(presentIds.has(id)).toBe(true);
    }
  });
});

describe('SUPPLEMENT_STACKS — content integrity', () => {
  it('MULTIVITAMIN_CORE has all 13 essential vitamins in mustHave', () => {
    const mv = SUPPLEMENT_STACKS.find(s => s.id === 'STACK.MULTIVITAMIN_CORE');
    expect(mv).toBeDefined();
    const mvMembers = mv!.mustHave.map(m => m.ingredientName);
    const expectedVitamins = [
      'Vitamin A', 'Vitamin C', 'Vitamin D3', 'Vitamin E', 'Vitamin K',
      'Thiamine', 'Riboflavin', 'Niacin', 'Vitamin B6',
      'Folate', 'Vitamin B12', 'Biotin', 'Pantothenic Acid',
    ];
    for (const v of expectedVitamins) {
      expect(mvMembers).toContain(v);
    }
  });

  it('PRENATAL_CORE includes Folate at higher dose than MV core', () => {
    const prenatal = SUPPLEMENT_STACKS.find(s => s.id === 'STACK.PRENATAL_CORE');
    const folate = prenatal?.mustHave.find(m => m.ingredientName === 'Folate');
    expect(folate).toBeDefined();
    expect(folate?.typicalDoseRange.min).toBeGreaterThanOrEqual(600);
  });

  it('PRE_WORKOUT requires Caffeine + Beta-Alanine + Creatine + Citrulline', () => {
    const preWorkout = SUPPLEMENT_STACKS.find(s => s.id === 'STACK.PRE_WORKOUT');
    const names = preWorkout!.mustHave.map(m => m.ingredientName);
    expect(names).toContain('Caffeine');
    expect(names).toContain('Beta-Alanine');
    expect(names).toContain('Creatine Monohydrate');
    expect(names).toContain('L-Citrulline Malate');
  });

  it('SLEEP includes Melatonin + Magnesium Glycinate + L-Theanine', () => {
    const sleep = SUPPLEMENT_STACKS.find(s => s.id === 'STACK.SLEEP');
    const names = sleep!.mustHave.map(m => m.ingredientName);
    expect(names).toContain('Melatonin');
    expect(names).toContain('Magnesium Glycinate');
    expect(names).toContain('L-Theanine');
  });

  it('MOOD stack contains drug-interaction warning context (5-HTP + SJW)', () => {
    const mood = SUPPLEMENT_STACKS.find(s => s.id === 'STACK.MOOD');
    expect(mood).toBeDefined();
    const allMembers = [...mood!.mustHave, ...mood!.commonCompanion];
    const has5HTP = allMembers.some(m => m.ingredientName === '5-HTP');
    const hasSJW = allMembers.some(m => m.ingredientName === "St. John's Wort");
    expect(has5HTP).toBe(true);
    expect(hasSJW).toBe(true);
    // versionNotes should flag the drug-interaction risk
    expect(mood!.versionNotes).toContain('serotonin');
  });
});

describe('findStacksContaining', () => {
  it('returns stacks containing the ingredient at any tier', () => {
    const stacks = findStacksContaining('Melatonin');
    const ids = stacks.map(s => s.id);
    expect(ids).toContain('STACK.SLEEP');
  });

  it('returns multiple stacks for cross-cutting ingredients', () => {
    const stacks = findStacksContaining('Magnesium');
    expect(stacks.length).toBeGreaterThan(1);
    const ids = stacks.map(s => s.id);
    expect(ids).toContain('STACK.SLEEP');
    // Multivitamin core has "Magnesium" too
    expect(ids).toContain('STACK.MULTIVITAMIN_CORE');
  });

  it('returns empty array for unknown ingredient', () => {
    const stacks = findStacksContaining('Totally Made Up Ingredient XYZ123');
    expect(stacks).toEqual([]);
  });

  it('case-insensitive match', () => {
    const stacks = findStacksContaining('melatonin');
    expect(stacks.length).toBeGreaterThan(0);
  });
});

describe('detectStacksFromFormulation', () => {
  it('detects MULTIVITAMIN_CORE when ≥ 70% of mustHave is present', () => {
    // Daily Reset MV v2 from Test 1 — 19 of 22 mustHave (Folate/Biotin/B5 missing pre-Wave-1.5)
    const formulation = [
      'Vitamin A Palmitate', 'Vitamin C', 'Vitamin D3 Vegan', 'Vitamin E', 'Vitamin K2',
      'Thiamine HCl', 'Vitamin B2 Riboflavin', 'Niacin', 'Vitamin B6 Pyridoxine HCl',
      'Vitamin B12 Cyanocobalamin', 'Calcium Citrate', 'Iron Bisglycinate',
      'Magnesium Glycinate', 'Zinc Bisglycinate', 'Selenium L-Selenomethionine',
      'Copper Gluconate', 'Manganese Bisglycinate', 'Chromium Picolinate', 'Molybdenum Glycinate',
    ];
    const matches = detectStacksFromFormulation(formulation, 0.7);
    const mvMatch = matches.find(m => m.stack.id === 'STACK.MULTIVITAMIN_CORE');
    expect(mvMatch).toBeDefined();
    expect(mvMatch!.coveragePct).toBeGreaterThanOrEqual(0.7);
  });

  it('lists missing mustHave members for partial matches', () => {
    const formulation = [
      'Vitamin A', 'Vitamin C', 'Vitamin D3', 'Vitamin E', 'Vitamin K',
      'Thiamine', 'Riboflavin', 'Niacin', 'Vitamin B6',
      'Vitamin B12', 'Calcium', 'Magnesium', 'Zinc',
      'Selenium', 'Copper', 'Manganese', 'Chromium', 'Molybdenum', 'Iodine',
    ];
    const matches = detectStacksFromFormulation(formulation, 0.7);
    const mvMatch = matches.find(m => m.stack.id === 'STACK.MULTIVITAMIN_CORE');
    expect(mvMatch).toBeDefined();
    // Should flag Folate, Biotin, Pantothenic Acid as missing
    const missingNames = mvMatch!.missing.map(m => m.ingredientName);
    expect(missingNames).toContain('Folate');
    expect(missingNames).toContain('Biotin');
    expect(missingNames).toContain('Pantothenic Acid');
  });

  it('returns matches sorted by coverage descending', () => {
    const formulation = [
      'Melatonin', 'Magnesium Glycinate', 'L-Theanine',
    ];
    const matches = detectStacksFromFormulation(formulation, 0.3);
    // SLEEP should be the top match (3/3 of mustHave)
    expect(matches[0]?.stack.id).toBe('STACK.SLEEP');
    expect(matches[0]?.coveragePct).toBe(1.0);
  });

  it('returns empty array when no stack meets threshold', () => {
    const formulation = ['Some Random Single Ingredient'];
    const matches = detectStacksFromFormulation(formulation, 0.7);
    expect(matches).toEqual([]);
  });

  it('default threshold is 0.7', () => {
    // Sleep stack has 3 mustHave; 2 present = 66.7% < 70% threshold
    const formulation = ['Melatonin', 'Magnesium Glycinate'];
    const matches = detectStacksFromFormulation(formulation);
    expect(matches.find(m => m.stack.id === 'STACK.SLEEP')).toBeUndefined();
  });
});
