// ============================================================
// DV table corrections + source-form equivalence (apply-set verification)
// ------------------------------------------------------------
// Locks the 2026-06-07 DV audit corrections (basis specs, Chloride, Sodium
// citation, provenance) and the CFR-canonical source-form conversions.
// Authority: 21 CFR 101.9(c)(8)(iv) footnotes / (c)(9). See
// docs/audits/dv-table-verification-2026-06-07.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { resolveEquivalenceFactor, equivalenceNote } from '../nutrientEquivalence';
import { DV_TABLE, findDVEntry, dvProvenance, buildSupplementFacts, formatSupplementDV } from '../supplementLabeling';
import type { Ingredient } from '../../types';

describe('source-form equivalence factors (Opus item 4 — CFR footnote ratios)', () => {
  it('β-carotene → RAE: ×0.5 (1 RAE = 2 supplemental β-carotene, fn3)', () => {
    expect(resolveEquivalenceFactor('Beta-Carotene', 'RAE')).toBeCloseTo(0.5, 6);
    expect(resolveEquivalenceFactor('beta carotene 10%', 'RAE')).toBeCloseTo(0.5, 6);
  });
  it('tryptophan → NE: ×1/60 (60 tryptophan = 1 NE, fn5)', () => {
    expect(resolveEquivalenceFactor('L-Tryptophan', 'NE')).toBeCloseTo(1 / 60, 6);
  });
  it('folic acid → DFE: ×1.667 (1 DFE = 0.6 folic acid, fn7)', () => {
    expect(resolveEquivalenceFactor('Folic Acid', 'DFE')).toBeCloseTo(1 / 0.6, 6);
  });
  it('all-rac-α-tocopherol → α-tocopherol: ×0.5 (2 all-rac = 1 label, fn4)', () => {
    expect(resolveEquivalenceFactor('all-rac-alpha-tocopheryl acetate', 'alpha-tocopherol')).toBeCloseTo(0.5, 6);
    expect(resolveEquivalenceFactor('dl-alpha-tocopherol', 'alpha-tocopherol')).toBeCloseTo(0.5, 6);
  });
  it('actives already IN the basis default to 1.0 (no double-conversion)', () => {
    expect(resolveEquivalenceFactor('Retinyl Palmitate', 'RAE')).toBe(1);
    expect(resolveEquivalenceFactor('Niacinamide', 'NE')).toBe(1);
    expect(resolveEquivalenceFactor('L-Methylfolate', 'DFE')).toBe(1);
    expect(resolveEquivalenceFactor('d-alpha-tocopherol', 'alpha-tocopherol')).toBe(1);
  });
  it('equivalenceNote returns the rule note or null (provenance)', () => {
    expect(equivalenceNote('Beta-Carotene', 'RAE')).toMatch(/β-carotene/);
    expect(equivalenceNote('Retinol', 'RAE')).toBeNull();
  });
});

describe('DV table corrections (2026-06-07 audit)', () => {
  const find = (n: string) => findDVEntry(n)!;
  it('basis specs present', () => {
    expect(find('folate').basis).toBe('DFE');
    expect(find('vitamin a').basis).toBe('RAE');
    expect(find('niacin').basis).toBe('NE');
    expect(find('vitamin e').basis).toBe('alpha-tocopherol');
  });
  it('Chloride added (2300 mg) and resolves distinctly from Sodium', () => {
    expect(find('chloride').displayName).toBe('Chloride');
    expect(find('chloride').dv).toBe(2300);
    expect(find('sodium chloride').displayName).toBe('Sodium');   // collision avoided
    expect(find('potassium chloride').displayName).toBe('Potassium');
  });
  it('Sodium citation is the (c)(9) DRV; default entries cite (c)(8)(iv)', () => {
    expect(dvProvenance(find('sodium')).citation).toBe('21 CFR 101.9(c)(9)');
    expect(dvProvenance(find('magnesium')).citation).toBe('21 CFR 101.9(c)(8)(iv)');
    expect(dvProvenance(find('magnesium')).verifiedOn).toBe('2026-06-07');
  });
  it('all 27 RDI values still correct (spot regression)', () => {
    expect(find('vitamin d').dv).toBe(20);
    expect(find('magnesium').dv).toBe(420);
    expect(find('potassium').dv).toBe(4700);
    expect(find('choline').dv).toBe(550);
  });
});

const vit = (name: string, qtyMcg: number): Ingredient =>
  ({ name, qty: qtyMcg, unit: 'mcg', foodData: { type: 'industrial', data: { category: 'Vitamins' } } } as unknown as Ingredient);
function facts(ings: Ingredient[]) {
  return buildSupplementFacts({
    ingredients: ings, mode: 'supplements',
    servingSizeInGrams: 0, totalBatchGrams: ings.reduce((s, i) => s + i.qty / 1e6, 0),
    supplementServingMassG: ings.reduce((s, i) => s + i.qty / 1e6, 0), // (legacy field; ignored by F-3 supplement path)
    unitsPerServing: 1, // F-3: 1 unit/serving → per-serving = entered (identity); tests conversion math, not blank-state
    servingsPerContainer: 30, servingSizeLabel: '1 Capsule', caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  });
}

describe('%DV rounding is sector-specific (the 101.36-vs-101.9 conflation fix)', () => {
  it('SUPPLEMENT (default) → nearest whole percent per 101.36(b)(2)(iii)(C)', () => {
    expect(formatSupplementDV(98.9)).toBe('99%');   // Vit C 89/90
    expect(formatSupplementDV(96.2)).toBe('96%');   // Riboflavin 1.25/1.3
    expect(formatSupplementDV(192.3)).toBe('192%'); // aggregated Riboflavin 2.5/1.3
    expect(formatSupplementDV(94.4)).toBe('94%');   // Vit C 85/90 (was wrongly 90%)
    expect(formatSupplementDV(125)).toBe('125%');   // Niacin 20/16 (was wrongly 130%)
    expect(formatSupplementDV(null)).toBe('†');
  });
  it('FOOD (mode=fb) → 101.9 increment rounding preserved (2/5/10)', () => {
    expect(formatSupplementDV(98.9, 'fb')).toBe('100%'); // >50 → nearest 10
    expect(formatSupplementDV(6.7, 'fb')).toBe('6%');    // ≤10 → nearest 2
    expect(formatSupplementDV(33, 'fb')).toBe('35%');    // ≤50 → nearest 5
  });
});

describe('end-to-end conversion through the Supplement Facts panel', () => {
  it('β-carotene 900 mcg → 450 mcg RAE → 50% DV (not 100%)', () => {
    const r = facts([vit('Beta-Carotene', 900)]).vitaminMineralRows.find(x => /Vitamin A/.test(x.displayName))!;
    expect(r.amount).toBeCloseTo(450, 0);
    expect(r.unit).toBe('mcg RAE');
    expect(r.percentDV).toBeCloseTo(50, 0);
  });
  it('folic acid 400 mcg → 667 mcg DFE (167% DV) with folic-acid parenthetical', () => {
    const r = facts([vit('Folic Acid', 400)]).vitaminMineralRows.find(x => /Folate/.test(x.displayName))!;
    expect(r.amount).toBeCloseTo(666.7, 0);
    expect(r.unit).toBe('mcg DFE');
    expect(r.percentDV).toBeCloseTo(166.7, 0);
    expect(r.subDeclaration?.name).toBe('folic acid');
    expect(r.subDeclaration?.unit).toBe('mcg');
    expect(r.subDeclaration?.amount).toBeCloseTo(400, 0);
  });
  it('methylfolate 400 mcg → 400 mcg DFE (no folic-acid parenthetical, 1:1)', () => {
    const r = facts([vit('L-Methylfolate', 400)]).vitaminMineralRows.find(x => /Folate/.test(x.displayName))!;
    expect(r.amount).toBeCloseTo(400, 0);
    expect(r.subDeclaration).toBeUndefined();
  });
});

describe('nutrient aggregation + CFR ordering (101.36(d)(2) / (b)(2)(i)(B)) — the cutover fix', () => {
  const indMg = (name: string, qty: number, unit = 'mg'): Ingredient =>
    ({ name, qty, unit, foodData: { type: 'industrial', data: { category: /calcium|magnesium|zinc|iron/i.test(name) ? 'Minerals' : 'Vitamins' } } } as unknown as Ingredient);
  const u2g = (u: string) => u === 'mcg' ? 1e-6 : u === 'g' ? 1 : 1e-3;
  const factsOf = (ings: Ingredient[]) => buildSupplementFacts({
    ingredients: ings, mode: 'supplements', servingSizeInGrams: 0,
    totalBatchGrams: ings.reduce((s, i) => s + i.qty * u2g(i.unit), 0),
    supplementServingMassG: ings.reduce((s, i) => s + i.qty * u2g(i.unit), 0), // (legacy field; ignored by F-3 supplement path)
    unitsPerServing: 1, // F-3: 1 unit/serving → per-serving = entered (identity)
    servingsPerContainer: 30, servingSizeLabel: '1 Capsule', caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  });

  it('two riboflavin sources → ONE combined Riboflavin row (2.5 mg, 192% unrounded)', () => {
    const rows = factsOf([indMg('Vitamin B2 (Riboflavin USP)', 1.25), indMg('Riboflavin 5-Phosphate', 1.25)])
      .vitaminMineralRows.filter(r => /Riboflavin/i.test(r.displayName));
    expect(rows.length).toBe(1);                 // was 2 (the bug)
    expect(rows[0].amount).toBeCloseTo(2.5, 3);  // summed dietary-ingredient weight
    expect(rows[0].percentDV).toBeCloseTo(192.3, 0);
  });

  it('rows render in CFR declaration order regardless of entry order (vitamin before mineral)', () => {
    const rows = factsOf([indMg('Calcium Carbonate', 500), indMg('Vitamin C (Ascorbic Acid)', 90)]).vitaminMineralRows;
    expect(rows[0].displayName).toMatch(/Vitamin C/);  // entered 2nd, but sorts 1st
    expect(rows[1].displayName).toMatch(/Calcium/);
  });

  it('below-2%-RDI nutrient suppressed from panel + listed in belowThresholdSuppressed (101.36(b)(2)(i))', () => {
    const f = factsOf([indMg('Vitamin C (Ascorbic Acid)', 1)]); // 1/90 = 1.1% DV < 2%
    expect(f.vitaminMineralRows.find(r => /Vitamin C/.test(r.displayName))).toBeUndefined();
    expect(f.belowThresholdSuppressed.some(s => /Vitamin C/.test(s.displayName))).toBe(true);
  });
  it('at/above 2% RDI → declared, not suppressed', () => {
    const f = factsOf([indMg('Vitamin C (Ascorbic Acid)', 90)]);
    expect(f.vitaminMineralRows.find(r => /Vitamin C/.test(r.displayName))).toBeTruthy();
    expect(f.belowThresholdSuppressed.length).toBe(0);
  });
});
