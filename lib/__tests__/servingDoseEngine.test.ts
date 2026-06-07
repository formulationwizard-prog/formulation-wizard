// ============================================================
// Serving/Dose Engine — property-based verification (Property 5, M1.5)
// ------------------------------------------------------------
// Sweeps the input-state matrix and asserts engine INVARIANTS. Covers the M1.5
// additions: composition rule (unset-absorb + ÷0→unset), below_threshold
// producer, structured provenance, engineVersion, factor composition.
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  type EngineIngredient, type FactorFn,
  real, UNSET, isUnset, isReal, isBelowThreshold, valueOf, combine, classifyThreshold,
  composeFactor, nutraFactor, perServingAmount, solveFillForTargetDose,
  nutraceuticalsAdapter, ENGINE_VERSION,
} from '../servingDoseEngine';

const CTX = { sectorId: 'nutraceuticals' };
const g = (mg: number) => mg / 1000;

const FORMULA: EngineIngredient[] = [
  { name: 'Magnesium Glycinate', mass: real(g(200)) },
  { name: 'L-Theanine (Suntheanine)', mass: real(g(200)) },
  { name: 'Ashwagandha (KSM-66)', mass: real(g(300)) },
];
const L_THEA = FORMULA[1];
const MAG = FORMULA[0];

// factor fn: Magnesium → elemental 0.14 + g→mg; others → identity + g→mg.
const factor: FactorFn = (ing) =>
  /magnesium/i.test(ing.name) ? nutraFactor({ elemental: 0.14, unit: 'mg' }) : nutraFactor({ unit: 'mg' });

const fillInputs = (fillMg: number | null, units = 2) => ({
  perUnitFillG: fillMg === null ? UNSET : real(g(fillMg)),
  unitsPerServing: real(units),
});

describe('composition rule (the one math)', () => {
  it('unset absorbs', () => {
    expect(isUnset(combine(real(2), UNSET, (a, b) => a * b))).toBe(true);
    expect(isUnset(combine(UNSET, real(2), (a, b) => a + b))).toBe(true);
  });
  it('non-finite result → unset (÷0 / ∞ never leak as real NaN)', () => {
    expect(isUnset(combine(real(5), real(0), (a, b) => a / b))).toBe(true); // 5/0 = ∞ → unset
    expect(isUnset(combine(real(0), real(0), (a, b) => a / b))).toBe(true); // 0/0 = NaN → unset
  });
  it('real ⊕ real → real(value)', () => {
    expect(valueOf(combine(real(2), real(3), (a, b) => a * b))).toBe(6);
  });
  it('below_threshold contributes its value (not propagated as state)', () => {
    const r = combine(classifyThreshold(real(0.3), 1), real(10), (a, b) => a * b);
    expect(valueOf(r)).toBeCloseTo(3); // 0.3 (below_threshold) × 10 → 3, now real
    expect(isReal(r)).toBe(true);
  });
});

describe('below_threshold producer (classifyThreshold)', () => {
  it('value below threshold → below_threshold (carries value + threshold)', () => {
    const m = classifyThreshold(real(0.4), 1);
    expect(isBelowThreshold(m)).toBe(true);
    expect(valueOf(m)).toBe(0.4);
  });
  it('value at/above threshold → real', () => {
    expect(isReal(classifyThreshold(real(1.5), 1))).toBe(true);
  });
  it('unset passes through', () => expect(isUnset(classifyThreshold(UNSET, 1))).toBe(true));
});

describe('factor composition (queryable components)', () => {
  it('composeFactor multiplies component values into the scalar', () => {
    const f = nutraFactor({ elemental: 0.14, unit: 'mg' });
    expect(valueOf(f.scalar)).toBeCloseTo(140); // 0.14 × 1000
    expect(f.components.map(c => c.type)).toEqual(['elemental', 'unit_conversion']);
    expect(f.components.find(c => c.type === 'elemental')!.value).toBe(0.14);
  });
  it('mcg unit conversion = 1e6', () => {
    expect(valueOf(nutraFactor({ unit: 'mcg' }).scalar)).toBe(1_000_000);
  });
});

describe('forward proof case + structured provenance + engineVersion', () => {
  it('660 mg/cap × 2 → L-Theanine 377 mg', () => {
    const r = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(660), factor, CTX);
    expect(valueOf(r.amount)).toBeCloseTo(377.14, 1);
    expect(r.provenance.confidence).toBe('calculated');
    expect(r.provenance.engineVersion).toBe(ENGINE_VERSION);
    // structured operands are queryable, not a string
    expect(valueOf(r.provenance.operands.proportion)).toBeCloseTo(0.2857, 4);
    expect(valueOf(r.provenance.operands.servingMassG)).toBeCloseTo(1.32, 4);
    expect(valueOf(r.provenance.operands.formulaMassG)).toBeCloseTo(0.7, 4);
    expect(r.provenance.operands.factor.components.some(c => c.type === 'unit_conversion')).toBe(true);
  });
  it('350 mg/cap × 2 → L-Theanine 200 mg; Magnesium 28 mg elemental', () => {
    expect(valueOf(perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(350), factor, CTX).amount)).toBeCloseTo(200, 4);
    expect(valueOf(perServingAmount(MAG, FORMULA, nutraceuticalsAdapter, fillInputs(350), factor, CTX).amount)).toBeCloseTo(28, 2);
  });
});

describe('blank-until-real + boundary across the input-state matrix', () => {
  it('UNSET fill → UNSET amount, confidence unknown', () => {
    const r = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(null), factor, CTX);
    expect(isUnset(r.amount)).toBe(true);
    expect(r.provenance.confidence).toBe('unknown');
  });
  it('UNSET ingredient mass → UNSET amount', () => {
    const ghost: EngineIngredient = { name: 'Unentered', mass: UNSET };
    expect(isUnset(perServingAmount(ghost, [...FORMULA, ghost], nutraceuticalsAdapter, fillInputs(660), factor, CTX).amount)).toBe(true);
  });
  it('empty formula → UNSET (no fabrication)', () => {
    expect(isUnset(perServingAmount(L_THEA, [], nutraceuticalsAdapter, fillInputs(660), factor, CTX).amount)).toBe(true);
  });
  it('BOUNDARY: zero-mass formula → ÷0 → UNSET, never real(NaN) (the M1 leak, fixed)', () => {
    const zero: EngineIngredient[] = [{ name: 'Z', mass: real(0) }];
    const r = perServingAmount(zero[0], zero, nutraceuticalsAdapter, fillInputs(660), factor, CTX);
    expect(isUnset(r.amount)).toBe(true);
    expect(Number.isNaN(valueOf(r.amount) as number)).toBe(false);
  });
  it('PARTIAL formula (some unset) → formulaMass = sum of entered; entered ingredient still resolves', () => {
    const partial: EngineIngredient[] = [{ name: 'A', mass: real(g(100)) }, { name: 'B', mass: UNSET }];
    const r = perServingAmount(partial[0], partial, nutraceuticalsAdapter, fillInputs(200), factor, CTX);
    // formulaMass = 0.1 g (only entered); proportion 1.0; serving 0.4 g → 400 mg
    expect(valueOf(r.amount)).toBeCloseTo(400, 2);
  });
  it('OVERFILL is just a larger serving mass (engine scales; capacity is the gate/adapter\'s job)', () => {
    const r = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(2000), factor, CTX);
    expect(valueOf(r.amount)!).toBeGreaterThan(377); // engine doesn't clamp; the fit gate does
  });
  it('below_threshold: tiny fill makes L-Theanine sub-significant → below_threshold, not fake 0', () => {
    const ctx = { ...CTX, significanceThreshold: 1 }; // 1 mg
    const r = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(1), factor, ctx); // 1mg×2 serving
    expect(isBelowThreshold(r.amount)).toBe(true);
    expect(valueOf(r.amount)).toBeCloseTo(0.571, 2); // 0.2857 × 0.002 g × 1000
  });
});

describe('invariants', () => {
  it('mass conservation: actives (identity factor) sum to serving mass', () => {
    const id: FactorFn = () => nutraFactor({ unit: 'mg' });
    const sum = FORMULA.reduce((s, ing) =>
      s + (valueOf(perServingAmount(ing, FORMULA, nutraceuticalsAdapter, fillInputs(660), id, CTX).amount) ?? 0), 0);
    expect(sum).toBeCloseTo(1320, 2); // 660 × 2 mg — nothing created/lost
  });
  it('linear in fill: doubling fill doubles dose', () => {
    const lo = valueOf(perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(330), factor, CTX).amount)!;
    const hi = valueOf(perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(660), factor, CTX).amount)!;
    expect(hi).toBeCloseTo(lo * 2, 4);
  });
});

describe('reverse mode (fixed-dose = the A/B resolution)', () => {
  it('declare L-Theanine 200 mg → engine solves fill 350 mg/cap', () => {
    const fillG = solveFillForTargetDose(L_THEA, FORMULA, nutraceuticalsAdapter, real(2), real(200), factor, CTX);
    expect(valueOf(fillG)).toBeCloseTo(0.35, 5);
  });
  it('forward∘reverse round-trips to the target', () => {
    const fillG = solveFillForTargetDose(L_THEA, FORMULA, nutraceuticalsAdapter, real(2), real(200), factor, CTX);
    const back = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, { perUnitFillG: fillG, unitsPerServing: real(2) }, factor, CTX);
    expect(valueOf(back.amount)).toBeCloseTo(200, 4);
  });
  it('target unset → fill unset (no fabrication in reverse)', () => {
    expect(isUnset(solveFillForTargetDose(L_THEA, FORMULA, nutraceuticalsAdapter, real(2), UNSET, factor, CTX))).toBe(true);
  });
});
