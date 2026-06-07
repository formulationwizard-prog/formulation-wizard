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
import { DV_TABLE, findDVEntry, dvProvenance, buildSupplementFacts } from '../supplementLabeling';
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
    servingsPerContainer: 30, servingSizeLabel: '1 Capsule', caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  });
}

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
