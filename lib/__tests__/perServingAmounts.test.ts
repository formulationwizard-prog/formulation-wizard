// perServingAmounts — the per-serving resolver contract (F-3).
// These assertions ARE the docstring invariants + the unit-class-caller-contract
// matrix's resolver row. They lock: no fill-scaling (entered = per-capsule),
// the three unit-classes, and the load-bearing null≠0 distinction.
import { describe, it, expect } from 'vitest';
import { perServingAmounts } from '../perServingAmounts';

const one = (name: string, qty: number, unit: string, units: number) =>
  perServingAmounts([{ name, qty, unit }], units).get(name)!;

describe('perServingAmounts — no scaling; entered = per-capsule × units', () => {
  it('90 mg, units 2 → 180 mg / mass (NOT fill-scaled)', () => {
    expect(one('Vit C', 90, 'mg', 2)).toEqual({ mg: 180, unitClass: 'mass', unit: 'mg' });
  });
  it('0.09 g, units 1 → 90 mg / mass (unit conversion)', () => {
    const r = one('Vit C', 0.09, 'g', 1);
    expect(r.unitClass).toBe('mass');
    expect(r.mg).toBeCloseTo(90, 6);
  });
  it('16.74 mg (the 18.6%-of-90mg case), units 1 → 16.74 mg / mass — % is a VIEW, not a multiplier', () => {
    const r = one('Vit C', 16.74, 'mg', 1);
    expect(r.unitClass).toBe('mass');
    expect(r.mg).toBeCloseTo(16.74, 6);
  });
  it('does NOT apply potency — carrier-loaded "10 mg" returns physical 10 mg (caller applies potency)', () => {
    expect(one('B12 1%', 10, 'mg', 1)).toEqual({ mg: 10, unitClass: 'mass', unit: 'mg' });
  });
});

describe('perServingAmounts — the three unit-classes (null ≠ 0)', () => {
  it('COUNT (CFU) → mg 0 (real: a count adds no mass) + unitClass count', () => {
    expect(one('Probiotic', 5, 'Billion CFU', 1)).toEqual({ mg: 0, unitClass: 'count', unit: 'Billion CFU' });
  });
  it('UNSUPPORTED (IU) → mg NULL (mass UNKNOWN, never fabricated) + unitClass unsupported', () => {
    expect(one('Vit A', 5000, 'IU', 1)).toEqual({ mg: null, unitClass: 'unsupported', unit: 'IU' });
  });
  it('UNSUPPORTED (typo unit) → mg NULL, never the grams-trap', () => {
    const r = one('Vit C', 90, 'mgg', 1);
    expect(r.mg).toBeNull();        // NOT 90 (the `|| 1` trap would have given 90,000 mg)
    expect(r.unitClass).toBe('unsupported');
  });
  it('the null≠0 rule holds: count carries 0, unsupported carries null — distinct', () => {
    const count = one('P', 5, 'CFU', 1);
    const unsup = one('Q', 5, 'IU', 1);
    expect(count.mg).toBe(0);       // summable
    expect(unsup.mg).toBeNull();    // must be EXCLUDED, never summed as 0
  });
});

describe('perServingAmounts — multi-ingredient + the F-11 single-source guarantee', () => {
  it('classifies a mixed formula per-ingredient', () => {
    const m = perServingAmounts([
      { name: 'Vit C', qty: 90, unit: 'mg' },
      { name: 'Probiotic', qty: 5, unit: 'Billion CFU' },
      { name: 'Vit A', qty: 5000, unit: 'IU' },
    ], 2);
    expect(m.get('Vit C')).toEqual({ mg: 180, unitClass: 'mass', unit: 'mg' });
    expect(m.get('Probiotic')).toEqual({ mg: 0, unitClass: 'count', unit: 'Billion CFU' });
    expect(m.get('Vit A')).toEqual({ mg: null, unitClass: 'unsupported', unit: 'IU' });
  });
  it('F-11 foundation: one resolver → any two call sites passing the same inputs get identical results', () => {
    const ings = [{ name: 'Mag', qty: 200, unit: 'mg' }, { name: 'Theanine', qty: 100, unit: 'mg' }];
    const sfpPath = perServingAmounts(ings, 2);
    const safetyPath = perServingAmounts(ings, 2);
    expect([...sfpPath.entries()]).toEqual([...safetyPath.entries()]); // no path divergence by construction
  });
});
