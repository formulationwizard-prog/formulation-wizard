// ============================================================
// M2 parity — SFP amounts surface migrating to the serving/dose engine
// ------------------------------------------------------------
// The parity-test taxonomy (Opus-ratified):
//   • Class A (math-correctness): engine === existing Convention-B math. MUST hold.
//   • Class B (fabrication-removal): engine INTENTIONALLY differs from current
//     behavior, each annotated with the doctrine it satisfies.
//   • Class C (new-coherence): values that didn't exist before (provenance,
//     below_threshold) — assert presence + shape, no parity baseline.
// This file gates the SFP-amounts cutover. Class-A break = bug; Class-B "break" = the fix.
// ============================================================
import { describe, it, expect } from 'vitest';
import { computePerServingScale } from '../supplementMath';
import {
  perServingAmount, nutraceuticalsAdapter, valueOf, isUnset, isReal, ENGINE_VERSION,
} from '../servingDoseEngine';
import { toEngineIngredients, toCountServingInputs, makeNutraFactor } from '../servingDoseBridge';
import type { Ingredient } from '../../types';

const CTX = { sectorId: 'nutraceuticals' };

// Workspace rows (operator's Calm & Sleep, D3 removed): 700 mg.
const ind = (name: string, qtyMg: number, data: Record<string, unknown> = {}): Ingredient =>
  ({ name, qty: qtyMg, unit: 'mg', foodData: { type: 'industrial', data: { category: 'Supplements', ...data } } } as unknown as Ingredient);
const WS: Ingredient[] = [
  ind('Magnesium Glycinate', 200),          // resolveElementalFactor → 0.14
  ind('L-Theanine (Suntheanine)', 200),     // no elemental, no potency
  ind('Ashwagandha (KSM-66)', 300),
];
const TOTAL_G = 0.7;

// The EXISTING Convention-B math (the parity baseline the engine must reproduce):
//   amount_mg = ingredientGrams × scale × elemental × potency × 1000
function oldBAmountMg(ingMg: number, servingMassG: number, elemental = 1, potency = 1): number {
  const scale = computePerServingScale({ mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams: TOTAL_G, supplementServingMassG: servingMassG });
  return (ingMg / 1000) * scale * elemental * potency * 1000;
}

function engineAmount(name: string, fillMg: number) {
  const ings = toEngineIngredients(WS);
  const target = ings.find(i => i.name === name)!;
  return perServingAmount(target, ings, nutraceuticalsAdapter, toCountServingInputs(fillMg, 2), makeNutraFactor('mg'), CTX);
}

describe('Class A — math-correctness: engine reproduces existing Convention-B math (parity MUST hold)', () => {
  it('L-Theanine @ 660 mg/cap: engine === old B math (377 mg)', () => {
    const old = oldBAmountMg(200, 1.32);                 // 377.14
    const eng = valueOf(engineAmount('L-Theanine (Suntheanine)', 660).amount)!;
    expect(eng).toBeCloseTo(old, 6);
    expect(eng).toBeCloseTo(377.14, 1);
  });
  it('Magnesium @ 660 mg/cap: engine === old B math incl. elemental 0.14 (52.8 mg)', () => {
    const old = oldBAmountMg(200, 1.32, 0.14);           // 52.8
    const eng = valueOf(engineAmount('Magnesium Glycinate', 660).amount)!;
    expect(eng).toBeCloseTo(old, 6);
    expect(eng).toBeCloseTo(52.8, 1);
  });
  it('parity holds across fills (350 → identity-equivalent 200 mg / 28 mg)', () => {
    expect(valueOf(engineAmount('L-Theanine (Suntheanine)', 350).amount)).toBeCloseTo(oldBAmountMg(200, 0.7), 6);
    expect(valueOf(engineAmount('Magnesium Glycinate', 350).amount)).toBeCloseTo(oldBAmountMg(200, 0.7, 0.14), 6);
  });
});

describe('Class B — fabrication-removal: engine intentionally differs (annotated)', () => {
  it('UNSET fill: engine → unset; OLD identity-fallback → entered 200 mg. BREAK IS THE FIX.', () => {
    // Doctrine: under recipe-ratio, a per-serving DOSE requires a serving mass.
    // Old computePerServingScale fell back to identity (scale 1.0) when no serving
    // mass was given, rendering the raw recipe number (200 mg) AS IF it were the
    // per-serving dose. The engine returns unset until the operator defines fill —
    // no fabricated dose. blank-until-real by construction.
    const oldIdentity = oldBAmountMg(200, 0); // computePerServingScale → 1.0 → 200
    expect(oldIdentity).toBeCloseTo(200, 6);
    const eng = engineAmount('L-Theanine (Suntheanine)', 0); // fill unset
    expect(isUnset(eng.amount)).toBe(true);
    expect(eng.provenance.confidence).toBe('unknown');
  });
});

describe('Class C — new-coherence: provenance the old scalar never carried', () => {
  it('engine result carries structured operands + engineVersion (copilot/SFP-popup ready)', () => {
    const r = engineAmount('L-Theanine (Suntheanine)', 660);
    expect(isReal(r.amount)).toBe(true);
    expect(r.provenance.engineVersion).toBe(ENGINE_VERSION);
    expect(valueOf(r.provenance.operands.proportion)).toBeCloseTo(0.2857, 4);
    expect(valueOf(r.provenance.operands.servingMassG)).toBeCloseTo(1.32, 4);
    expect(r.provenance.operands.factor.components.some(c => c.type === 'unit_conversion')).toBe(true);
  });
});
