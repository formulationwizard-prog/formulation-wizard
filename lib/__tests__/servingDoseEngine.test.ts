// ============================================================
// Serving/Dose Engine — property-based verification (Property 5)
// ------------------------------------------------------------
// The bedrock. Sweeps input states and asserts engine INVARIANTS, not anecdotes:
// mass conservation, blank-until-real propagation, factor application, the
// operator proof case, and the reverse-mode (fixed-dose) A/B resolution.
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  type EngineIngredient, type FactorFn, type ServingInputs,
  real, UNSET, isUnset, isReal, valueOf, combine,
  perServingAmount, solveFillForTargetDose, nutraceuticalsAdapter,
} from '../servingDoseEngine';

const CTX = { sectorId: 'nutraceuticals' };
const g = (mg: number) => mg / 1000;

// Operator's Calm & Sleep formula (D3 removed): 700 mg total.
const FORMULA: EngineIngredient[] = [
  { name: 'Magnesium Glycinate', mass: real(g(200)) },
  { name: 'L-Theanine (Suntheanine)', mass: real(g(200)) },
  { name: 'Ashwagandha (KSM-66)', mass: real(g(300)) },
];
const L_THEA = FORMULA[1];
const MAG = FORMULA[0];

// factor: Magnesium glycinate → 0.14 elemental; everything else identity.
const factor: FactorFn = (ing) => (/magnesium/i.test(ing.name) ? real(0.14) : real(1));

const fillInputs = (fillMg: number | null, units = 2): ServingInputs => ({
  perUnitFillG: fillMg === null ? UNSET : real(g(fillMg)),
  unitsPerServing: real(units),
});

describe('Serving/Dose Engine — MaybeValue propagation (blank-until-real by construction)', () => {
  it('combine propagates unset (either operand unset → unset)', () => {
    expect(isUnset(combine(real(2), UNSET, (a, b) => a * b))).toBe(true);
    expect(isUnset(combine(UNSET, real(2), (a, b) => a * b))).toBe(true);
    expect(valueOf(combine(real(2), real(3), (a, b) => a * b))).toBe(6);
  });
});

describe('Serving/Dose Engine — the operator proof case (forward)', () => {
  it('660 mg/cap × 2 → L-Theanine 377 mg', () => {
    const r = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(660), factor, CTX);
    expect(isReal(r.amount)).toBe(true);
    expect(valueOf(r.amount)).toBeCloseTo(377.14, 1); // (200/700) × 1320 mg
    expect(r.provenance.confidence).toBe('calculated');
  });

  it('350 mg/cap × 2 (= formula mass) → L-Theanine 200 mg', () => {
    const r = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(350), factor, CTX);
    expect(valueOf(r.amount)).toBeCloseTo(200, 4);
  });

  it('factor applies: Magnesium 28 mg elemental at fill 350, 52.8 mg at fill 660', () => {
    expect(valueOf(perServingAmount(MAG, FORMULA, nutraceuticalsAdapter, fillInputs(350), factor, CTX).amount)).toBeCloseTo(28, 2);
    expect(valueOf(perServingAmount(MAG, FORMULA, nutraceuticalsAdapter, fillInputs(660), factor, CTX).amount)).toBeCloseTo(52.8, 1);
  });
});

describe('Serving/Dose Engine — blank-until-real across the input-state matrix', () => {
  it('UNSET fill → UNSET per-serving amount (no fabricated default)', () => {
    const r = perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(null), factor, CTX);
    expect(isUnset(r.amount)).toBe(true);
    expect(r.provenance.confidence).toBe('unknown');
  });

  it('UNSET ingredient mass → UNSET amount', () => {
    const ghost: EngineIngredient = { name: 'Unentered', mass: UNSET };
    const r = perServingAmount(ghost, [...FORMULA, ghost], nutraceuticalsAdapter, fillInputs(660), factor, CTX);
    expect(isUnset(r.amount)).toBe(true);
  });

  it('empty formula → formulaMass UNSET → amount UNSET', () => {
    const r = perServingAmount(L_THEA, [], nutraceuticalsAdapter, fillInputs(660), factor, CTX);
    expect(isUnset(r.amount)).toBe(true);
  });
});

describe('Serving/Dose Engine — invariants', () => {
  it('mass conservation: proportions sum to 1 (and per-serving actives without factor sum to serving mass)', () => {
    const id: FactorFn = () => real(1);
    const serving = 1.32; // 660 × 2 / 1000
    const sumActives = FORMULA.reduce((s, ing) =>
      s + (valueOf(perServingAmount(ing, FORMULA, nutraceuticalsAdapter, fillInputs(660), id, CTX).amount) ?? 0), 0);
    expect(sumActives).toBeCloseTo(serving * 1000, 2); // 1320 mg — nothing created or lost
  });

  it('scaling is linear in fill: doubling the fill doubles every dose', () => {
    const lo = valueOf(perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(330), factor, CTX).amount)!;
    const hi = valueOf(perServingAmount(L_THEA, FORMULA, nutraceuticalsAdapter, fillInputs(660), factor, CTX).amount)!;
    expect(hi).toBeCloseTo(lo * 2, 4);
  });
});

describe('Serving/Dose Engine — reverse mode (fixed-dose workflow = the A/B resolution)', () => {
  it('declare L-Theanine 200 mg exactly → engine solves required fill = 350 mg/cap', () => {
    const fillG = solveFillForTargetDose(L_THEA, FORMULA, nutraceuticalsAdapter, real(2), real(g(200)), factor, CTX);
    expect(valueOf(fillG)).toBeCloseTo(0.35, 5); // 350 mg/cap delivers exactly 200 mg
  });

  it('forward and reverse are consistent: the solved fill reproduces the target', () => {
    const fillG = solveFillForTargetDose(L_THEA, FORMULA, nutraceuticalsAdapter, real(2), real(g(200)), factor, CTX);
    const back = perServingAmount(
      L_THEA, FORMULA, nutraceuticalsAdapter,
      { perUnitFillG: fillG, unitsPerServing: real(2) }, factor, CTX,
    );
    expect(valueOf(back.amount)).toBeCloseTo(200, 4);
  });

  it('target unset → solved fill unset (no fabrication in reverse either)', () => {
    expect(isUnset(solveFillForTargetDose(L_THEA, FORMULA, nutraceuticalsAdapter, real(2), UNSET, factor, CTX))).toBe(true);
  });
});
