// ============================================================
// Round 11 Phase 3 Workstream A.5 [5a/N] — serving model helpers
// ------------------------------------------------------------
// Tests the pure helpers backing the #25l structural fix. Foundation
// layer — no UI integration yet (workspace integration lands in 5b–5d).
//
// Coverage sections:
//   A — Delivery form classification (8 forms → 3 categories)
//   B — Per-unit weight semantics (SP3 split: capacity-derived vs
//       operator-input vs n/a)
//   C — Capsule capacity table (8 USP sizes)
//   D — Fill weight per unit derivation
//   E — Utilization computation
//   F — Utilization color bands (SP9 thresholds)
//   G — Servings ↔ totalUnits derivation (forward + reverse)
//   H — Unit dropdown constraints (SP7 per-form lists)
//   I — Producibility assessment (SP11 — 7th status card semantics)
//   J — Bidirectional reconcile (SP6 — last-edited-wins)
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  type SupplementDeliveryForm,
  type CapsuleSize,
  type ProducibilityInput,
  type CountInputState,
  categorizeDeliveryForm,
  perUnitWeightSemantics,
  capsuleCapacityMg,
  computeFillWeightPerUnit,
  computeUtilization,
  utilizationBand,
  deriveServings,
  deriveTotalUnits,
  allowedServingUnits,
  allowedPackageUnits,
  assessProducibility,
  reconcileCountInputs,
} from '../servingModel';

// ============================================================
// Section A — Delivery form classification
// ============================================================
describe('categorizeDeliveryForm', () => {
  it('capsule → count', () => { expect(categorizeDeliveryForm('capsule')).toBe('count'); });
  it('tablet → count', () => { expect(categorizeDeliveryForm('tablet')).toBe('count'); });
  it('softgel → count', () => { expect(categorizeDeliveryForm('softgel')).toBe('count'); });
  it('gummy → count', () => { expect(categorizeDeliveryForm('gummy')).toBe('count'); });
  it('lozenge → count', () => { expect(categorizeDeliveryForm('lozenge')).toBe('count'); });
  it('chewable → count', () => { expect(categorizeDeliveryForm('chewable')).toBe('count'); });
  it('powder → mass', () => { expect(categorizeDeliveryForm('powder')).toBe('mass'); });
  it('liquid → volume', () => { expect(categorizeDeliveryForm('liquid')).toBe('volume'); });
});

// ============================================================
// Section B — Per-unit weight semantics (SP3 split)
// ============================================================
describe('perUnitWeightSemantics (SP3 refinement)', () => {
  it('capsule → capacity-derived (capsule shell bounds fill weight)', () => {
    expect(perUnitWeightSemantics('capsule')).toBe('capacity-derived');
  });
  it('softgel → capacity-derived (softgel shell bounds fill weight)', () => {
    expect(perUnitWeightSemantics('softgel')).toBe('capacity-derived');
  });
  it('tablet → operator-input (die-set target weight)', () => {
    expect(perUnitWeightSemantics('tablet')).toBe('operator-input');
  });
  it('gummy → operator-input (mold-cavity target weight — gummy formulators think in target weight)', () => {
    expect(perUnitWeightSemantics('gummy')).toBe('operator-input');
  });
  it('lozenge → operator-input', () => {
    expect(perUnitWeightSemantics('lozenge')).toBe('operator-input');
  });
  it('chewable → operator-input', () => {
    expect(perUnitWeightSemantics('chewable')).toBe('operator-input');
  });
  it('powder → n/a (no per-unit concept for mass-based forms)', () => {
    expect(perUnitWeightSemantics('powder')).toBe('n/a');
  });
  it('liquid → n/a (no per-unit concept for volume-based forms)', () => {
    expect(perUnitWeightSemantics('liquid')).toBe('n/a');
  });
});

// ============================================================
// Section C — Capsule capacity table
// ============================================================
describe('capsuleCapacityMg', () => {
  it('size #000 → 1000 mg', () => { expect(capsuleCapacityMg('000')).toBe(1000); });
  it('size #00 → 800 mg', () => { expect(capsuleCapacityMg('00')).toBe(800); });
  it('size #0 → 680 mg (matches existing workspace display)', () => {
    expect(capsuleCapacityMg('0')).toBe(680);
  });
  it('size #1 → 480 mg', () => { expect(capsuleCapacityMg('1')).toBe(480); });
  it('size #2 → 360 mg', () => { expect(capsuleCapacityMg('2')).toBe(360); });
  it('size #3 → 270 mg', () => { expect(capsuleCapacityMg('3')).toBe(270); });
  it('size #4 → 210 mg', () => { expect(capsuleCapacityMg('4')).toBe(210); });
  it('size #5 → 130 mg', () => { expect(capsuleCapacityMg('5')).toBe(130); });

  it('capacities decrease monotonically from #000 to #5', () => {
    const sizes: CapsuleSize[] = ['000', '00', '0', '1', '2', '3', '4', '5'];
    const capacities = sizes.map(capsuleCapacityMg);
    for (let i = 0; i < capacities.length - 1; i++) {
      expect(capacities[i]).toBeGreaterThan(capacities[i + 1]);
    }
  });
});

// ============================================================
// Section D — Fill weight per unit derivation
// ============================================================
describe('computeFillWeightPerUnit', () => {
  it('30 g formulation / 60 capsules → 500 mg/capsule', () => {
    expect(computeFillWeightPerUnit(30, 60)).toBe(500);
  });

  it('20.4 g formulation / 30 capsules → 680 mg/capsule (full #0 capacity)', () => {
    expect(computeFillWeightPerUnit(20.4, 30)).toBeCloseTo(680, 6);
  });

  it('zero mass → 0 (defensive; empty formulation state)', () => {
    expect(computeFillWeightPerUnit(0, 60)).toBe(0);
  });

  it('zero totalUnits → 0 (defensive; no divide-by-zero)', () => {
    expect(computeFillWeightPerUnit(30, 0)).toBe(0);
  });

  it('negative mass → 0', () => {
    expect(computeFillWeightPerUnit(-10, 60)).toBe(0);
  });

  it('NaN mass → 0', () => {
    expect(computeFillWeightPerUnit(NaN, 60)).toBe(0);
  });

  it('NaN totalUnits → 0', () => {
    expect(computeFillWeightPerUnit(30, NaN)).toBe(0);
  });
});

// ============================================================
// Section E — Utilization computation
// ============================================================
describe('computeUtilization', () => {
  it('500 mg / 680 mg → ~0.735', () => {
    expect(computeUtilization(500, 680)).toBeCloseTo(0.7353, 4);
  });

  it('680 mg / 680 mg → 1.0 (at capacity)', () => {
    expect(computeUtilization(680, 680)).toBeCloseTo(1.0, 6);
  });

  it('800 mg / 680 mg → ~1.176 (over-fill case)', () => {
    expect(computeUtilization(800, 680)).toBeCloseTo(1.1765, 4);
  });

  it('zero fill → 0 (empty formulation)', () => {
    expect(computeUtilization(0, 680)).toBe(0);
  });

  it('zero capacity → 0 (defensive)', () => {
    expect(computeUtilization(500, 0)).toBe(0);
  });

  it('NaN inputs → 0', () => {
    expect(computeUtilization(NaN, 680)).toBe(0);
    expect(computeUtilization(500, NaN)).toBe(0);
  });
});

// ============================================================
// Section F — Utilization color bands (SP9)
// ============================================================
describe('utilizationBand', () => {
  it('0% → grey (empty formulation)', () => {
    expect(utilizationBand(0)).toBe('grey');
  });

  it('30% → amber-low (cost-optimization advisory)', () => {
    expect(utilizationBand(0.30)).toBe('amber-low');
  });

  it('49.9% → amber-low (just below boundary)', () => {
    expect(utilizationBand(0.499)).toBe('amber-low');
  });

  it('50% exactly → green (boundary inclusive on the green side)', () => {
    expect(utilizationBand(0.50)).toBe('green');
  });

  it('75% → green (normal range)', () => {
    expect(utilizationBand(0.75)).toBe('green');
  });

  it('90% exactly → green (boundary inclusive)', () => {
    expect(utilizationBand(0.90)).toBe('green');
  });

  it('90.1% → amber-high (approaching over-fill)', () => {
    expect(utilizationBand(0.901)).toBe('amber-high');
  });

  it('100% exactly → amber-high (at capacity, not yet over)', () => {
    expect(utilizationBand(1.0)).toBe('amber-high');
  });

  it('100.1% → red (over-fill)', () => {
    expect(utilizationBand(1.001)).toBe('red');
  });

  it('150% → red', () => {
    expect(utilizationBand(1.5)).toBe('red');
  });

  it('NaN → grey (defensive)', () => {
    expect(utilizationBand(NaN)).toBe('grey');
  });

  it('negative → grey (defensive)', () => {
    expect(utilizationBand(-0.5)).toBe('grey');
  });
});

// ============================================================
// Section G — Servings ↔ totalUnits derivation
// ============================================================
describe('deriveServings / deriveTotalUnits', () => {
  it('60 units / 2 per serving → 30 servings', () => {
    expect(deriveServings(60, 2)).toBe(30);
  });

  it('30 servings × 2 per serving → 60 units', () => {
    expect(deriveTotalUnits(30, 2)).toBe(60);
  });

  it('round-trip: 100 units / 4 per serving → 25 servings → back to 100 units', () => {
    const servings = deriveServings(100, 4);
    expect(servings).toBe(25);
    expect(deriveTotalUnits(servings, 4)).toBe(100);
  });

  it('deriveServings with zero unitsPerServing → 0 (defensive)', () => {
    expect(deriveServings(60, 0)).toBe(0);
  });

  it('deriveTotalUnits with zero servings → 0', () => {
    expect(deriveTotalUnits(0, 2)).toBe(0);
  });

  it('NaN inputs → 0', () => {
    expect(deriveServings(NaN, 2)).toBe(0);
    expect(deriveTotalUnits(30, NaN)).toBe(0);
  });
});

// ============================================================
// Section H — Unit dropdown constraints (SP7)
// ============================================================
describe('allowedServingUnits', () => {
  it('count-based forms → empty array (no unit dropdown for mass-derived display)', () => {
    expect(allowedServingUnits('capsule')).toEqual([]);
    expect(allowedServingUnits('tablet')).toEqual([]);
    expect(allowedServingUnits('softgel')).toEqual([]);
    expect(allowedServingUnits('gummy')).toEqual([]);
    expect(allowedServingUnits('lozenge')).toEqual([]);
    expect(allowedServingUnits('chewable')).toEqual([]);
  });

  it('powder → ["mg", "g"] only (no mcg; eliminates the 60M-servings vector)', () => {
    expect(allowedServingUnits('powder')).toEqual(['mg', 'g']);
  });

  it('liquid → ["mL", "fl oz", "tsp", "tbsp"]', () => {
    expect(allowedServingUnits('liquid')).toEqual(['mL', 'fl oz', 'tsp', 'tbsp']);
  });

  it('no F&B units (cup, kg) appear in any supplement serving-size list', () => {
    const allSupplementForms: SupplementDeliveryForm[] = ['capsule','tablet','softgel','gummy','powder','liquid','lozenge','chewable'];
    for (const form of allSupplementForms) {
      expect(allowedServingUnits(form)).not.toContain('cup');
      expect(allowedServingUnits(form)).not.toContain('kg'); // kg is package-only, not serving
    }
  });

  it('mcg is NOT allowed as a serving unit for any supplement form (closes the #25l input vector)', () => {
    const allSupplementForms: SupplementDeliveryForm[] = ['capsule','tablet','softgel','gummy','powder','liquid','lozenge','chewable'];
    for (const form of allSupplementForms) {
      expect(allowedServingUnits(form)).not.toContain('mcg');
    }
  });
});

describe('allowedPackageUnits', () => {
  it('count-based forms → empty array', () => {
    expect(allowedPackageUnits('capsule')).toEqual([]);
    expect(allowedPackageUnits('softgel')).toEqual([]);
  });

  it('powder → ["g", "kg", "oz", "lb"]', () => {
    expect(allowedPackageUnits('powder')).toEqual(['g', 'kg', 'oz', 'lb']);
  });

  it('liquid → ["mL", "L", "fl oz"]', () => {
    expect(allowedPackageUnits('liquid')).toEqual(['mL', 'L', 'fl oz']);
  });

  it('no cross-category leakage (powder excludes mL/L/fl oz; liquid excludes g/kg/oz/lb)', () => {
    expect(allowedPackageUnits('powder')).not.toContain('mL');
    expect(allowedPackageUnits('powder')).not.toContain('L');
    expect(allowedPackageUnits('powder')).not.toContain('fl oz');
    expect(allowedPackageUnits('liquid')).not.toContain('g');
    expect(allowedPackageUnits('liquid')).not.toContain('kg');
    expect(allowedPackageUnits('liquid')).not.toContain('oz');
    expect(allowedPackageUnits('liquid')).not.toContain('lb');
  });
});

// ============================================================
// Section I — Producibility assessment (SP11 — 7th status card)
// ============================================================
describe('assessProducibility (SP11 — Producibility status card)', () => {
  function input(overrides: Partial<ProducibilityInput> = {}): ProducibilityInput {
    return {
      form: 'capsule',
      totalMassG: 30,
      totalUnits: 60,
      capacityMg: 680,
      ...overrides,
    };
  }

  it('non-count form (powder) → producible (no capacity constraint at this layer)', () => {
    const result = assessProducibility(input({ form: 'powder' }));
    expect(result.state).toBe('producible');
  });

  it('non-count form (liquid) → producible', () => {
    const result = assessProducibility(input({ form: 'liquid' }));
    expect(result.state).toBe('producible');
  });

  it('empty formulation (0g mass) → unknown', () => {
    const result = assessProducibility(input({ totalMassG: 0 }));
    expect(result.state).toBe('unknown');
  });

  it('empty unit count (0 capsules) → unknown', () => {
    const result = assessProducibility(input({ totalUnits: 0 }));
    expect(result.state).toBe('unknown');
  });

  it('capsule: 30g / 60 caps / 680mg capacity = ~73.5% utilization → producible (green band)', () => {
    const result = assessProducibility(input());
    expect(result.state).toBe('producible');
  });

  it('capsule: 15g / 60 caps / 680mg = ~36.8% utilization → low-fill', () => {
    const result = assessProducibility(input({ totalMassG: 15 }));
    expect(result.state).toBe('low-fill');
    expect(result.reason.toLowerCase()).toContain('smaller capsule');
  });

  it('capsule: 50g / 60 caps / 680mg = ~122% utilization → over-fill', () => {
    const result = assessProducibility(input({ totalMassG: 50 }));
    expect(result.state).toBe('over-fill');
    expect(result.reason.toLowerCase()).toContain('exceeds');
  });

  it('capsule: 39g / 60 caps / 680mg = ~95.6% utilization → approaching over-fill', () => {
    const result = assessProducibility(input({ totalMassG: 39 }));
    expect(result.state).toBe('approaching');
  });

  it('tablet (operator-input weight form) → producible (Round 11 v1 trusts operator target weight)', () => {
    const result = assessProducibility(input({ form: 'tablet' }));
    expect(result.state).toBe('producible');
  });

  it('gummy (operator-input weight form) → producible', () => {
    const result = assessProducibility(input({ form: 'gummy' }));
    expect(result.state).toBe('producible');
  });

  it('softgel (capacity-derived): 50g / 60 caps / 680mg → over-fill (same as capsule)', () => {
    const result = assessProducibility(input({ form: 'softgel', totalMassG: 50 }));
    expect(result.state).toBe('over-fill');
  });

  it('capsule with missing capacity → unknown (defensive)', () => {
    const result = assessProducibility(input({ capacityMg: 0 }));
    expect(result.state).toBe('unknown');
  });

  it('60M-servings vector regression: pathologically high totalUnits → would force fillWeight near zero → low-fill detection', () => {
    // Simulates the 1mcg-style absurd input AFTER the structural fix
    // prevents it at the input layer. Defensive coverage.
    const result = assessProducibility(input({ totalUnits: 60_000_000 }));
    expect(result.state).toBe('low-fill');
  });
});

// ============================================================
// Section J — Bidirectional reconcile (SP6 — last-edited-wins)
// ============================================================
describe('reconcileCountInputs (SP6 last-edited-wins)', () => {
  function state(overrides: Partial<CountInputState> = {}): CountInputState {
    return {
      servings: 30,
      totalUnits: 60,
      unitsPerServing: 2,
      lastEdited: null,
      ...overrides,
    };
  }

  it('lastEdited=null + canonical defaults → servings-canonical (operator default mental model)', () => {
    const result = reconcileCountInputs(state());
    expect(result.servings).toBe(30);
    expect(result.totalUnits).toBe(60);
  });

  it('lastEdited=servings + servings=30 + unitsPerServing=2 → totalUnits derives to 60', () => {
    const result = reconcileCountInputs(state({ lastEdited: 'servings', servings: 30, unitsPerServing: 2 }));
    expect(result.servings).toBe(30);
    expect(result.totalUnits).toBe(60);
  });

  it('lastEdited=servings + unitsPerServing changes from 2 to 3 → totalUnits recomputes from canonical servings', () => {
    // Servings stays canonical at 30; totalUnits becomes 30×3 = 90
    const result = reconcileCountInputs(state({ lastEdited: 'servings', servings: 30, unitsPerServing: 3 }));
    expect(result.servings).toBe(30);
    expect(result.totalUnits).toBe(90);
  });

  it('lastEdited=totalUnits + totalUnits=100 + unitsPerServing=2 → servings derives to 50', () => {
    const result = reconcileCountInputs(state({ lastEdited: 'totalUnits', totalUnits: 100, unitsPerServing: 2 }));
    expect(result.totalUnits).toBe(100);
    expect(result.servings).toBe(50);
  });

  it('lastEdited=totalUnits + unitsPerServing changes from 2 to 4 → servings recomputes from canonical totalUnits', () => {
    // TotalUnits stays canonical at 100; servings becomes 100/4 = 25
    const result = reconcileCountInputs(state({ lastEdited: 'totalUnits', totalUnits: 100, unitsPerServing: 4 }));
    expect(result.totalUnits).toBe(100);
    expect(result.servings).toBe(25);
  });

  it('lastEdited=servings + unitsPerServing=0 → totalUnits derives to 0 (defensive)', () => {
    const result = reconcileCountInputs(state({ lastEdited: 'servings', servings: 30, unitsPerServing: 0 }));
    expect(result.totalUnits).toBe(0);
  });

  it('round-trip: edit servings → reconcile → edit totalUnits → reconcile → state converges', () => {
    // Start: servings canonical 30, unitsPerServing 2 → totalUnits 60
    const s1 = reconcileCountInputs(state({ lastEdited: 'servings', servings: 30, unitsPerServing: 2 }));
    expect(s1).toEqual({ servings: 30, totalUnits: 60 });
    // Operator edits totalUnits to 120 → lastEdited flips → servings derives
    const s2 = reconcileCountInputs(state({ lastEdited: 'totalUnits', totalUnits: 120, unitsPerServing: 2 }));
    expect(s2).toEqual({ servings: 60, totalUnits: 120 });
  });
});
