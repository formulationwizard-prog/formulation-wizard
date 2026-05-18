// ============================================================
// Supplement safety — keyword boundary matching (Round 11 Phase 3
// post-A.5 follow-up; 2026-05-17)
// ------------------------------------------------------------
// Surfaced during operator-side Formula 4 safety sweep: pasting
// "Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)" triggered the
// Fish Oil / EPA-DHA interaction warning. Root cause: the safety
// checker used `name.includes(keyword)` substring matching with
// short keywords like "dha", and "ashwagan**dha**" contains "dha".
//
// Fix: keyword must START at a word boundary (string start or a
// non-alphanumeric char). Mid-word starts no longer match. End of
// keyword is unanchored — preserves legitimate prefix matches like
// "pyridox" → "pyridoxal-5-phosphate" and "ferrous" → "ferrous
// bisglycinate".
//
// Scope of audit at fix time — short keywords vulnerable to the
// prior substring bug:
//   • "dha"   → matched "ashwagan*dha*", "*Vid*a"  (Fish Oil)
//   • "epa"   → matched "j*epa*zote", "pr*epa*ration" (Fish Oil)
//   • "rue"   → matched "t*rue*", "*rue*llia"     (Rue, pregnancy)
//   • "kava"  → matched "*kava*da" (false-positive theoretical)
//   • "iron"  → no realistic false-positive
//   • "boron" → matched "borax"? no — borax → "borax", "boron" not
//   • "zinc"  → no realistic false-positive (no chemistry word
//                with "zinc" mid-string)
//
// These tests lock in the boundary semantics so a future "go back
// to substring matching" regression is caught.
// ============================================================

import { describe, it, expect } from 'vitest';
import { checkSupplementSafety } from '../supplementSafetyLimits';
import type { Ingredient } from '../../types';

function ing(name: string): Ingredient {
  return {
    name,
    qty: 100,
    unit: 'mg',
    costPerKg: 0,
    subIngredients: [],
    allergens: [],
    supplier: '',
    foodData: null,
  };
}

function mgMap(name: string, mg: number): Map<string, number> {
  return new Map([[name, mg]]);
}

describe('keyword boundary — Fish Oil / EPA-DHA interaction (Formula 4 repro)', () => {
  it('Ashwagandha does NOT match Fish Oil/EPA-DHA via "dha" substring', () => {
    const name = 'Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 100));
    const fishOilFinding = findings.find(f => f.limitName === 'Fish Oil / EPA-DHA');
    expect(fishOilFinding).toBeUndefined();
  });

  it('Vida (hypothetical) does NOT match via "dha" substring', () => {
    const name = 'Vida Extract';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 100));
    const fishOilFinding = findings.find(f => f.limitName === 'Fish Oil / EPA-DHA');
    expect(fishOilFinding).toBeUndefined();
  });

  it('"EPA + DHA Concentrate" DOES match Fish Oil/EPA-DHA (legitimate match)', () => {
    const name = 'EPA + DHA Concentrate 60%';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 100));
    const fishOilFinding = findings.find(f => f.limitName === 'Fish Oil / EPA-DHA');
    expect(fishOilFinding).toBeDefined();
  });

  it('"Krill Oil 500mg" DOES match (krill oil keyword)', () => {
    const name = 'Krill Oil 500mg NKO';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 100));
    const fishOilFinding = findings.find(f => f.limitName === 'Fish Oil / EPA-DHA');
    expect(fishOilFinding).toBeDefined();
  });
});

describe('keyword boundary — prefix matches still work (regression guard)', () => {
  it('"Pyridoxal-5-Phosphate" matches Vitamin B6 via "pyridox" prefix', () => {
    const name = 'Pyridoxal-5-Phosphate';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 50));
    const b6 = findings.find(f => f.limitName === 'Vitamin B6 (pyridoxine)');
    expect(b6).toBeDefined();
  });

  it('"Pyridoxine HCl" matches Vitamin B6 via "pyridox" prefix', () => {
    const name = 'Pyridoxine HCl';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 50));
    const b6 = findings.find(f => f.limitName === 'Vitamin B6 (pyridoxine)');
    expect(b6).toBeDefined();
  });

  it('"Ferrous Bisglycinate" matches Iron via "ferrous" prefix', () => {
    const name = 'Ferrous Bisglycinate';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 50));
    const iron = findings.find(f => f.limitName === 'Iron');
    expect(iron).toBeDefined();
  });

  it('"Vitamin A Palmitate" matches Vitamin A via "vitamin a" multi-word', () => {
    const name = 'Vitamin A Palmitate';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 5));
    const a = findings.find(f => f.limitName === 'Vitamin A (retinol)');
    expect(a).toBeDefined();
  });

  it('"Magnesium Glycinate" matches Magnesium (supplemental) via prefix', () => {
    const name = 'Magnesium Glycinate';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 200));
    const mg = findings.find(f => f.limitName === 'Magnesium (supplemental)');
    expect(mg).toBeDefined();
  });
});

describe('keyword boundary — banned-ingredient short-keyword traps', () => {
  it('"Pseudoephedrine" does NOT match Ephedra ban (mid-word "ephedr" prefix differs from "ephedra")', () => {
    const name = 'Pseudoephedrine HCl';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 50));
    const ephedra = findings.find(f => f.limitName === 'Ephedra / Ma Huang');
    expect(ephedra).toBeUndefined();
  });

  it('"Ephedra sinica" DOES match Ephedra ban', () => {
    const name = 'Ephedra sinica';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 50));
    const ephedra = findings.find(f => f.limitName === 'Ephedra / Ma Huang');
    expect(ephedra).toBeDefined();
  });

  it('"Ma Huang Extract" DOES match Ephedra ban (multi-word keyword)', () => {
    const name = 'Ma Huang Extract';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 50));
    const ephedra = findings.find(f => f.limitName === 'Ephedra / Ma Huang');
    expect(ephedra).toBeDefined();
  });
});

describe('keyword boundary — pregnancy contraindication short keywords', () => {
  it('"True Wild Rosemary" does NOT match pregnancy "rue" contraindication via "t*rue*"', () => {
    const name = 'True Wild Rosemary';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 100), 'pregnancy');
    const rue = findings.find(f => f.limitName === 'Rue — pregnancy contraindication');
    expect(rue).toBeUndefined();
  });

  it('"Rue Herb Extract" DOES match pregnancy "rue" contraindication', () => {
    const name = 'Rue Herb Extract';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 100), 'pregnancy');
    const rue = findings.find(f => f.limitName === 'Rue — pregnancy contraindication');
    expect(rue).toBeDefined();
  });

  it('"Ashwagandha" DOES match pregnancy contraindication (legitimate match)', () => {
    const name = 'Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 600), 'pregnancy');
    const ashwa = findings.find(f => f.limitName === 'Ashwagandha — pregnancy contraindication');
    expect(ashwa).toBeDefined();
  });
});

describe('keyword boundary — interaction-herb prefix collisions', () => {
  it('"Garlic Extract" matches Garlic (concentrated) interaction', () => {
    const name = 'Garlic Extract (Allicin Standardized)';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 500));
    const garlic = findings.find(f => f.limitName === 'Garlic (concentrated)');
    expect(garlic).toBeDefined();
  });

  it('"Ginkgo Biloba" matches Ginkgo Biloba interaction', () => {
    const name = 'Ginkgo Biloba (EGb 761, Schwabe, 24/6 Standardized)';
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 120));
    const ginkgo = findings.find(f => f.limitName === 'Ginkgo Biloba');
    expect(ginkgo).toBeDefined();
  });

  it('"St. John\'s Wort" matches via punctuated keyword', () => {
    const name = "St. John's Wort 300mg";
    const findings = checkSupplementSafety([ing(name)], mgMap(name, 300));
    const sjw = findings.find(f => f.limitName === "St. John's Wort");
    expect(sjw).toBeDefined();
  });
});
