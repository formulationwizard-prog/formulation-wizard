// ============================================================
// HARNESS — stability / overage surface. REGULATION: 21 CFR 101.36(f) → 101.9(g)
// (label claim accurate through shelf life) + USP <1150>. Spec §5.
// ------------------------------------------------------------
// Overage math: formulate-at = claim / (1 - loss); loss = baseAnnual × years × Π(modifiers).
// Degradation constants are honest ESTIMATES (real stability data overrides). This harness
// locks the math + the condition modifiers + the bottleneck verdict (two-derivation).
// See docs/audits/stability-overage-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { computeOverages, type StabilityConditions } from '../supplementStability';
import type { Ingredient } from '../../types';

const ing = (name: string, category: string): Ingredient =>
  ({ name, qty: 0, unit: 'mg', foodData: { type: 'industrial', data: { category } } } as unknown as Ingredient);

const COND: StabilityConditions = {
  shelfLifeMonths: 24, storage: 'ambient',
  amberPackaging: false, desiccant: false, nitrogenFlush: false, tocopherolAntioxidant: false,
};
const vitC = (cond: StabilityConditions = COND) =>
  computeOverages([ing('Vitamin C', 'Vitamins')], new Map([['Vitamin C', 100]]), cond).rows[0];

describe('HARNESS · #7 stability/overage — math + verdict (101.36(f)/101.9(g))', () => {
  it('Vitamin C 100 mg, 24 mo ambient → 20% loss → formulate-at 125 mg → 25% overage', () => {
    const r = vitC();
    expect(r.lossPct).toBeCloseTo(20, 1);          // 10%/yr × 2 yr × 1.0
    expect(r.requiredFormulateAtMg).toBeCloseTo(125, 0); // 100 / (1 - 0.20)
    expect(r.overagePct).toBeCloseTo(25, 0);
  });

  it('refrigeration halves loss (×0.5 modifier) → 10% loss', () => {
    expect(vitC({ ...COND, storage: 'refrigerated' }).lossPct).toBeCloseTo(10, 1);
  });

  it('amber + nitrogen stack on a light+oxidation-sensitive active (×0.7 × ×0.6)', () => {
    const base = vitC().lossPct;
    const protectedLoss = vitC({ ...COND, amberPackaging: true, nitrogenFlush: true }).lossPct;
    expect(protectedLoss).toBeLessThan(base);
    expect(protectedLoss).toBeCloseTo(20 * 0.7 * 0.6, 1); // 8.4%
  });

  it('TWO-DERIVATION: formulate-at = claim/(1-loss) (hand 125 == programmatic == code)', () => {
    const hand = 125, programmatic = 100 / (1 - 0.20);
    expect(programmatic).toBeCloseTo(hand, 0);
    expect(vitC().requiredFormulateAtMg).toBeCloseTo(programmatic, 0);
  });

  it('bottleneck verdict: probiotic (40%/yr) dominates Vitamin C in a mixed formula', () => {
    const s = computeOverages(
      [ing('Vitamin C', 'Vitamins'), ing('Lactobacillus acidophilus', 'Probiotics')],
      new Map([['Vitamin C', 100], ['Lactobacillus acidophilus', 100]]),
      { ...COND, shelfLifeMonths: 12 },
    );
    expect(s.bottleneck!.category).toBe('probiotic');
    expect(s.worstLossPct).toBeCloseTo(40, 0);
  });
});
