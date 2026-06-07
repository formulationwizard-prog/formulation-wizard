// ============================================================
// Near-zero / blend-floor active guard
// ------------------------------------------------------------
// Two failure modes, both surfaced as workspace advisories OUTSIDE the regulated
// 21 CFR 101.36 panel:
//
//  1. label-rounds-to-zero — a non-zero entry whose LABEL amount rounds to 0
//     (carrier-loaded SKU entered as an active dose, or a unit/elemental
//     mismatch). Original guard, 2026-06-05.
//
//  2. below-blend-threshold — the PHYSICAL ingredient mass per serving is below
//     BLEND_FLOOR_MG, so the dose cannot be uniformly blended by direct addition
//     regardless of how the label reads. Added 2026-06-06 as the STRUCTURAL net:
//     it fires even when potencyFactor was never set on the catalog entry — the
//     exact gap that let a lichen-D3 "25 mcg" entry render an unblendable
//     0.025 mg of material (operator-surfaced via the Claims Validator review).
// ============================================================
import { describe, it, expect } from 'vitest';
import { buildSupplementFacts, formatNearZeroWarning, formatSupplementAmount, BLEND_FLOOR_MG } from '../supplementLabeling';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';
import { resolveElementalFactor } from '../elementalFactors';
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

describe('near-zero / blend-floor active guard', () => {
  it('flags a carrier-loaded D3 SKU entered as direct mcg (label rounds to 0 AND below blend floor)', () => {
    const carrier = ind('Vitamin D3 Cholecalciferol (100,000 IU/g on MCC)', 8, 'mcg', { potencyFactor: 0.0025 });
    const f = buildSupplementFacts(params([carrier]));
    // the label row genuinely rounds to 0 ...
    const row = f.vitaminMineralRows.find(r => /Vitamin D/.test(r.displayName))!;
    expect(formatSupplementAmount(row.amount, row.unit)).toBe('0');
    // ... and exactly one advisory is raised (blend-floor takes priority — it carries the fix)
    expect(f.nearZeroActiveWarnings).toHaveLength(1);
    expect(f.nearZeroActiveWarnings[0]).toMatchObject({
      displayName: 'Vitamin D', reason: 'below-blend-threshold',
      enteredAmount: 8, enteredUnit: 'mcg', labelUnit: 'mcg', potencyFactor: 0.0025,
    });
  });

  it('flags a carrier SKU entered as direct mcg even when potencyFactor was NEVER set (the structural net)', () => {
    // This is the operator-surfaced lichen-D3 case BEFORE the catalog carried a
    // potencyFactor: entered as an active dose, no carrier factor in data. The
    // label looks fine (8 mcg, identity) — only the physical mass betrays it.
    const untagged = ind('Vitamin D3 Vegan (Lichen-Sourced)', 8, 'mcg');
    const f = buildSupplementFacts(params([untagged]));
    const row = f.vitaminMineralRows.find(r => /Vitamin D/.test(r.displayName))!;
    expect(formatSupplementAmount(row.amount, row.unit)).toBe('8'); // label still reads 8 (no factor)
    expect(f.nearZeroActiveWarnings).toHaveLength(1);                // ...but the blend-floor net catches it
    expect(f.nearZeroActiveWarnings[0]).toMatchObject({
      displayName: 'Vitamin D', reason: 'below-blend-threshold', potencyFactor: 1, physicalMassMg: 0.008,
    });
  });

  it('flags a pure micro-active that needs a premix (neat B12 at 2.4 mcg)', () => {
    const f = buildSupplementFacts(params([ind('Cyanocobalamin (B12, USP — Pure Powder, No Carrier)', 2.4, 'mcg')]));
    expect(f.nearZeroActiveWarnings).toHaveLength(1);
    expect(f.nearZeroActiveWarnings[0].reason).toBe('below-blend-threshold');
  });

  it('does NOT flag a normal vitamin (Vitamin C 22 mg — well above the blend floor)', () => {
    const f = buildSupplementFacts(params([ind('Vitamin C (Ascorbic Acid USP, Fine)', 22, 'mg')]));
    expect(f.nearZeroActiveWarnings).toHaveLength(0);
  });

  it('does NOT flag a correctly-entered carrier product (10 mg of product is blendable)', () => {
    // When the operator follows the guidance and enters PRODUCT mass, the
    // physical mass is fine — no false positive — and the label is correct.
    const f = buildSupplementFacts(params([ind('Vitamin D3 Cholecalciferol (100,000 IU/g on MCC)', 10, 'mg', { potencyFactor: 0.0025 })]));
    expect(f.nearZeroActiveWarnings).toHaveLength(0);
    const row = f.vitaminMineralRows.find(r => /Vitamin D/.test(r.displayName))!;
    // 10 mg product × 0.0025 = 0.025 mg active = 25 mcg → a real, on-label dose
    expect(formatSupplementAmount(row.amount, row.unit)).toBe('25');
  });

  it('flags only the offending active in a mixed formula', () => {
    const f = buildSupplementFacts(params([
      ind('Vitamin C (Ascorbic Acid USP, Fine)', 22, 'mg'),
      ind('Vitamin D3 Cholecalciferol (100,000 IU/g on MCC)', 8, 'mcg', { potencyFactor: 0.0025 }),
      ind('Zinc Picolinate (USP)', 15, 'mg', { category: 'Minerals' }),
    ]));
    expect(f.nearZeroActiveWarnings.map(w => w.displayName)).toEqual(['Vitamin D']);
  });

  it('message: blend-floor + carrier-loaded → enter product mass', () => {
    const msg = formatNearZeroWarning({ ingredientName: 'Vitamin D3 Vegan (Lichen-Sourced)', displayName: 'Vitamin D', reason: 'below-blend-threshold', enteredAmount: 25, enteredUnit: 'mcg', labelUnit: 'mcg', potencyFactor: 0.0025, physicalMassMg: 0.025 });
    expect(msg).toMatch(/below the ~1 mg/);
    expect(msg).toMatch(/carrier-loaded/);
    expect(msg).toMatch(/product mass/);
  });

  it('message: blend-floor + pure active → use a carrier/triturated form or premix', () => {
    const msg = formatNearZeroWarning({ ingredientName: 'X', displayName: 'Vitamin B12', reason: 'below-blend-threshold', enteredAmount: 2.4, enteredUnit: 'mcg', labelUnit: 'mcg', potencyFactor: 1, physicalMassMg: 0.0024 });
    expect(msg).toMatch(/below the ~1 mg/);
    expect(msg).toMatch(/triturated|geometric dilution|USP <905>/);
    expect(msg).not.toMatch(/carrier-loaded —/); // it's not a carrier SKU
  });

  it('message: label-rounds-to-zero + non-carrier → unit/amount check', () => {
    const msg = formatNearZeroWarning({ ingredientName: 'X', displayName: 'Vitamin D', reason: 'label-rounds-to-zero', enteredAmount: 0.0001, enteredUnit: 'mcg', labelUnit: 'mcg', potencyFactor: 1, physicalMassMg: 5 });
    expect(msg).toMatch(/rounds to 0/);
    expect(msg).toMatch(/Verify the entered amount and unit/);
  });
});

describe('catalog carrier-loading backfill (2026-06-06)', () => {
  const byName = (n: string) => SUPPLEMENT_INGREDIENTS.find(i => i.name === n);

  it.each([
    ['Retinyl Palmitate (Liquid, 1M IU/g, USP)', 0.30],
    ['Beta-Carotene 10% (Blakeslea Fermentation)', 0.10],
    ['Vitamin D3 Cholecalciferol (Vegan, Lichen)', 0.0025],
    ['Vitamin D3 Vegan (Lichen-Sourced)', 0.0025],
    ['Vitamin K1 (Phytonadione, 5%)', 0.05],
    ['Vitamin K2 MK-7 (NattoPharma, 2%)', 0.02],
    ['Mixed Carotenoids (Palm, 30%)', 0.30],
    ['Vitamin E (d-Mixed Tocopherols, 70%)', 0.70],
    ['Bamboo Silica Extract (Sabinsa BambooSil, 70% Silica)', 0.70],
  ])('%s carries potencyFactor %d', (name, pf) => {
    const entry = byName(name);
    expect(entry, `${name} should exist in the catalog`).toBeTruthy();
    expect(entry!.potencyFactor).toBe(pf);
  });

  // IU/g loadings are UNAMBIGUOUSLY carrier-loaded (never elemental, never purity)
  // → they must always carry a potencyFactor. Zero false positives.
  it('every Vitamin/Mineral SKU with an IU/g loading in its name carries a potencyFactor', () => {
    const offenders = SUPPLEMENT_INGREDIENTS
      .filter(i => (i.category === 'Vitamins' || i.category === 'Minerals'))
      .filter(i => /\d[\d,]*\s*IU\/g/i.test(i.name))
      .filter(i => i.potencyFactor === undefined)
      .map(i => i.name);
    expect(offenders).toEqual([]);
  });

  // Standardization "%" forms also need a potencyFactor — EXCEPT (a) mineral
  // salts/chelates whose "%" is elemental content (handled by elementalFactor,
  // adding potencyFactor would double-count) and (b) near-pure assay forms where
  // the "%" is purity, not dilution (identity; contract-flip not worth it).
  it('every standardized "%" Vitamin/Mineral SKU carries a potencyFactor (excluding elemental salts + pure-assay forms)', () => {
    const PURE_ASSAY_ALLOWLIST = new Set([
      'Folic Acid (Synthetic, 97%)', // 97% = assay purity of a pure compound; blend-floor guard covers manufacturability
    ]);
    const offenders = SUPPLEMENT_INGREDIENTS
      .filter(i => (i.category === 'Vitamins' || i.category === 'Minerals'))
      .filter(i => /\b\d{1,3}%/.test(i.name))
      .filter(i => resolveElementalFactor(i.name) === undefined) // not an elemental mineral salt
      .filter(i => !PURE_ASSAY_ALLOWLIST.has(i.name))
      .filter(i => i.potencyFactor === undefined)
      .map(i => i.name);
    expect(offenders).toEqual([]);
  });

  it('the operator formula: lichen D3 entered as an active dose is flagged, not silently mislabeled', () => {
    // Mirrors the live "Calm & Sleep Support" formula that surfaced this.
    const lichen = byName('Vitamin D3 Vegan (Lichen-Sourced)')!;
    const f = buildSupplementFacts(params([
      ind('L-Theanine (Suntheanine, Pharma)', 200, 'mg', { category: 'Amino Acids' }),
      ind('Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)', 300, 'mg', { category: 'Herbal Extracts' }),
      ind('Vitamin D3 Vegan (Lichen-Sourced)', 25, 'mcg', { potencyFactor: lichen.potencyFactor }),
    ]));
    const d3 = f.nearZeroActiveWarnings.find(w => w.displayName === 'Vitamin D');
    expect(d3, 'lichen D3 at 25 mcg active must raise an advisory').toBeTruthy();
    expect(d3!.reason).toBe('below-blend-threshold');
    expect(formatNearZeroWarning(d3!)).toMatch(/product mass/);
  });

  it('BLEND_FLOOR_MG is the documented 1 mg uniform-blend floor', () => {
    expect(BLEND_FLOOR_MG).toBe(1);
  });
});
