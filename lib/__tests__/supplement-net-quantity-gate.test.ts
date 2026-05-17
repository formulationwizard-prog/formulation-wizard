// ============================================================
// §B5 — NET QUANTITY UNIT CONVERSION + DUAL-UNIT GENERATOR
// ------------------------------------------------------------
// Round 11 Phase 2 Step 4 (2026-05-17). Pre-flight verification
// suite for lib/netQuantity.ts. Tests:
//
//   • Unit conversion accuracy (mg/g/kg ↔ oz/lb; mL/L ↔ fl oz)
//   • CFR rounding boundaries (21 CFR 101.105)
//   • Dual-unit declaration generation (US primary + metric secondary)
//   • Gate cleared paths (within ±2% tolerance, dual-unit present)
//   • Gate hard-stop paths (missing declaration, tolerance breach,
//     form/dimension mismatch, missing metric secondary)
//   • Boundary tolerance discipline (±2.00% cleared; ±2.01% hard-stop)
//   • Invalid-input defensive behavior (zero, negative, NaN, undefined)
//   • Conflict scenarios (both dims provided; form/dim mismatch)
//   • Composition into Bucket 1 gate
//   • Composition-registry identifier
//
// Float precision discipline:
//   • toBeCloseTo for pre-CFR-rounding intermediates (drift at 1e-13)
//   • Exact toBe for post-CFR-rounded values (clean numbers)
//   • Strict > in gate threshold logic — float drift CANNOT cross 2%
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  computeNetQuantityDeclaration,
  evaluateNetQuantityGate,
  B5_NET_QUANTITY_ITEM_ID,
  B5_NET_QUANTITY_CITATION,
  type NetQuantityInput,
} from '../netQuantity';
import { isHardStop } from '../hardStop';

// ============================================================
// Section A — Unit conversion accuracy (toBeCloseTo intermediates)
// ============================================================
describe('computeNetQuantityDeclaration — unit conversion accuracy', () => {
  it('1 oz of mass → ~28.35 g (toBeCloseTo intermediate)', () => {
    // 1 oz = 28.349523125 g exactly
    const decl = computeNetQuantityDeclaration({
      form: 'solid',
      totalMassG: 28.349523125,
    });
    expect(decl).toBeDefined();
    if (!decl) return;
    expect(decl.primary.unit).toBe('oz');
    expect(decl.primary.value).toBeCloseTo(1, 2);
    expect(decl.metric.unit).toBe('g');
    expect(decl.metric.value).toBe(28); // post-CFR-rounding integer
  });

  it('1 lb of mass → ~16 oz / ~454 g', () => {
    // 1 lb = 453.59237 g exactly
    const decl = computeNetQuantityDeclaration({
      form: 'solid',
      totalMassG: 453.59237,
    });
    if (!decl) throw new Error('expected declaration');
    expect(decl.primary.unit).toBe('lb');
    expect(decl.primary.value).toBeCloseTo(1, 2);
    expect(decl.metric.unit).toBe('g');
    expect(decl.metric.value).toBe(454); // CFR-rounded
  });

  it('30 g of mass → ~1.06 oz / 30 g', () => {
    const decl = computeNetQuantityDeclaration({
      form: 'solid',
      totalMassG: 30,
    });
    if (!decl) throw new Error('expected declaration');
    expect(decl.primary.unit).toBe('oz');
    expect(decl.primary.value).toBeCloseTo(1.06, 2);
    expect(decl.metric.unit).toBe('g');
    expect(decl.metric.value).toBe(30);
  });

  it('1 g of mass → ~0.04 oz / 1 g (boundary)', () => {
    const decl = computeNetQuantityDeclaration({
      form: 'solid',
      totalMassG: 1,
    });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.value).toBe(1);
    expect(decl.metric.unit).toBe('g');
  });

  it('500 mg of mass → mg primary metric (sub-1g)', () => {
    const decl = computeNetQuantityDeclaration({
      form: 'solid',
      totalMassG: 0.5,
    });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.unit).toBe('mg');
    expect(decl.metric.value).toBe(500);
  });

  it('1000 g of mass → kg metric (≥1000g boundary)', () => {
    const decl = computeNetQuantityDeclaration({
      form: 'solid',
      totalMassG: 1000,
    });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.unit).toBe('kg');
    expect(decl.metric.value).toBe(1);
  });

  it('1 fl oz of volume → ~29.57 mL (toBeCloseTo intermediate)', () => {
    const decl = computeNetQuantityDeclaration({
      form: 'liquid',
      totalVolumeMl: 29.5735295625,
    });
    if (!decl) throw new Error('expected declaration');
    expect(decl.primary.unit).toBe('fl oz');
    expect(decl.primary.value).toBeCloseTo(1, 2);
    expect(decl.metric.unit).toBe('mL');
    expect(decl.metric.value).toBe(30); // CFR-rounded integer mL
  });

  it('1 L of volume → ~33.8 fl oz / 1 L', () => {
    const decl = computeNetQuantityDeclaration({
      form: 'liquid',
      totalVolumeMl: 1000,
    });
    if (!decl) throw new Error('expected declaration');
    expect(decl.primary.unit).toBe('fl oz');
    expect(decl.primary.value).toBeCloseTo(33.81, 2);
    expect(decl.metric.unit).toBe('L');
    expect(decl.metric.value).toBe(1);
  });
});

// ============================================================
// Section B — CFR rounding boundary cases
// ============================================================
describe('computeNetQuantityDeclaration — CFR rounding boundaries', () => {
  it('999 g declared in g (just below kg switchover)', () => {
    const decl = computeNetQuantityDeclaration({ form: 'solid', totalMassG: 999 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.unit).toBe('g');
    expect(decl.metric.value).toBe(999);
  });

  it('1000 g declared in kg (boundary)', () => {
    const decl = computeNetQuantityDeclaration({ form: 'solid', totalMassG: 1000 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.unit).toBe('kg');
  });

  it('0.999 g declared in mg (just below g switchover)', () => {
    const decl = computeNetQuantityDeclaration({ form: 'solid', totalMassG: 0.999 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.unit).toBe('mg');
  });

  it('15.9 oz expressed in oz (just below 1 lb switchover)', () => {
    // 15.9 oz × 28.349523125 g/oz ≈ 450.76 g
    const decl = computeNetQuantityDeclaration({ form: 'solid', totalMassG: 450.76 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.primary.unit).toBe('oz');
  });

  it('16 oz expressed in lb (boundary)', () => {
    // 16 oz = 1 lb = 453.59237 g
    const decl = computeNetQuantityDeclaration({ form: 'solid', totalMassG: 453.59237 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.primary.unit).toBe('lb');
  });

  it('999 mL expressed in mL (just below L switchover)', () => {
    const decl = computeNetQuantityDeclaration({ form: 'liquid', totalVolumeMl: 999 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.unit).toBe('mL');
  });

  it('1000 mL expressed in L (boundary)', () => {
    const decl = computeNetQuantityDeclaration({ form: 'liquid', totalVolumeMl: 1000 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.metric.unit).toBe('L');
  });
});

// ============================================================
// Section C — Label-text formatting
// ============================================================
describe('computeNetQuantityDeclaration — label-text format', () => {
  it('solid label uses "Net Wt" prefix', () => {
    const decl = computeNetQuantityDeclaration({ form: 'solid', totalMassG: 30 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.labelText).toContain('Net Wt');
  });

  it('liquid label uses "Net Vol" prefix', () => {
    const decl = computeNetQuantityDeclaration({ form: 'liquid', totalVolumeMl: 30 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.labelText).toContain('Net Vol');
  });

  it('label text includes both primary and metric in standard parens form', () => {
    const decl = computeNetQuantityDeclaration({ form: 'solid', totalMassG: 30 });
    if (!decl) throw new Error('expected declaration');
    expect(decl.labelText).toMatch(/oz \(30 g\)/);
  });
});

// ============================================================
// Section D — Gate cleared cases
// ============================================================
describe('evaluateNetQuantityGate — cleared cases', () => {
  it('declared 30 g matching computed 30 g, with metric secondary → cleared', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 1.06, unit: 'oz' },
        metric: { value: 30, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(false);
  });

  it('declared 28 g matching computed 28.35 g (within 2% tolerance) → cleared', () => {
    // 0.35/28 ≈ 1.25% — within 2%
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 28.349523125,
      declaredNetQuantity: {
        primary: { value: 1, unit: 'oz' },
        metric: { value: 28, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(false);
  });

  it('metric-primary declaration without explicit metric secondary → cleared (primary IS metric)', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(false);
  });

  it('cleared result carries source supplement-net-quantity', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    });
    if (result.hardStop) throw new Error('expected cleared');
    expect(result.source).toBe('supplement-net-quantity');
  });
});

// ============================================================
// Section E — Gate hard-stop cases
// ============================================================
describe('evaluateNetQuantityGate — hard-stop cases', () => {
  it('no declared net quantity → hard-stop (mandatory per 21 CFR 101.105(a))', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
    });
    expect(result.hardStop).toBe(true);
    expect(isHardStop(result)).toBe(true);
  });

  it('US-customary primary without metric secondary → hard-stop (dual-unit required)', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 1.06, unit: 'oz' },
      },
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence.some(e => e.detail.toLowerCase().includes('dual'))).toBe(true);
  });

  it('declared mass exceeds 2% tolerance → hard-stop', () => {
    // declared 35 g vs computed 30 g = 16.7% drift
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 35, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence.some(e => e.detail.toLowerCase().includes('tolerance'))).toBe(true);
  });

  it('hard-stop evidence carries 21 CFR 101.105 citation', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.evidence[0].citation).toContain('21 CFR 101.105');
  });

  it('hard-stop reason summarizes refusal', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
    });
    if (!result.hardStop) throw new Error('expected hard-stop');
    expect(result.reason.toLowerCase()).toContain('refuse-to-export');
  });
});

// ============================================================
// Section F — Boundary tolerance discipline (strict > at ±2%)
// ============================================================
describe('evaluateNetQuantityGate — ±2% boundary discipline', () => {
  it('declared at exactly 102.0% of computed → cleared (strict > at 2%)', () => {
    // declared 30.6 vs computed 30 = exactly 2.0% drift
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 30.6, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(false);
  });

  it('declared at 102.01% of computed → hard-stop (just over 2%)', () => {
    // declared 30.603 vs computed 30 = 2.01% drift
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 30.603, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(true);
  });

  it('declared at exactly 98.0% of computed → cleared (strict > at 2%)', () => {
    // declared 29.4 vs computed 30 = 2.0% short
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 29.4, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(false);
  });

  it('declared at 97.99% of computed → hard-stop (just under -2%)', () => {
    // declared 29.397 vs computed 30 = 2.01% short
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 29.397, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(true);
  });

  it('cross-unit tolerance: declared 1 oz (28.35 g) vs computed 28.5 g → cleared (within 2%)', () => {
    // 28.35 vs 28.5 = 0.526% drift
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 28.5,
      declaredNetQuantity: {
        primary: { value: 1, unit: 'oz' },
        metric: { value: 28, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section G — Invalid input defensive handling
// ============================================================
describe('evaluateNetQuantityGate — invalid input', () => {
  it('zero mass (form solid) → hard-stop', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 0,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(true);
  });

  it('negative mass → hard-stop', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: -10,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(true);
  });

  it('NaN mass → hard-stop', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: NaN,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(true);
  });

  it('form=solid with no mass and no declaration → hard-stop', () => {
    const result = evaluateNetQuantityGate({ form: 'solid' });
    expect(result.hardStop).toBe(true);
  });

  it('computeNetQuantityDeclaration with no mass for solid form → undefined', () => {
    expect(computeNetQuantityDeclaration({ form: 'solid' })).toBeUndefined();
  });

  it('computeNetQuantityDeclaration with negative mass → undefined', () => {
    expect(computeNetQuantityDeclaration({ form: 'solid', totalMassG: -10 })).toBeUndefined();
  });

  it('computeNetQuantityDeclaration with NaN mass → undefined', () => {
    expect(computeNetQuantityDeclaration({ form: 'solid', totalMassG: NaN })).toBeUndefined();
  });
});

// ============================================================
// Section H — Conflict scenarios (form/dimension mismatch)
// ============================================================
describe('evaluateNetQuantityGate — conflict scenarios', () => {
  it('form=solid but only volume provided → hard-stop with form/dimension mismatch', () => {
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalVolumeMl: 30,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(true);
    if (!result.hardStop) return;
    expect(result.evidence.some(e => e.detail.toLowerCase().includes('mismatch'))).toBe(true);
  });

  it('form=liquid but only mass provided → hard-stop with form/dimension mismatch', () => {
    const result = evaluateNetQuantityGate({
      form: 'liquid',
      totalMassG: 30,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'mL' },
      },
    });
    expect(result.hardStop).toBe(true);
  });

  it('form=solid with both mass and volume → mass wins; declaration cross-validates against mass', () => {
    // mass 30 matches declaration 30 g → cleared. Volume present but ignored.
    const result = evaluateNetQuantityGate({
      form: 'solid',
      totalMassG: 30,
      totalVolumeMl: 999, // intentionally divergent — should be ignored
      declaredNetQuantity: {
        primary: { value: 30, unit: 'g' },
      },
    });
    expect(result.hardStop).toBe(false);
  });

  it('form=liquid with both mass and volume → volume wins; declaration cross-validates against volume', () => {
    const result = evaluateNetQuantityGate({
      form: 'liquid',
      totalVolumeMl: 30,
      totalMassG: 999,
      declaredNetQuantity: {
        primary: { value: 30, unit: 'mL' },
      },
    });
    expect(result.hardStop).toBe(false);
  });
});

// ============================================================
// Section I — Composition-registry identifier + citation
// ============================================================
describe('§B5 composition-registry identifier', () => {
  it('exports a stable identifier consumed by the Bucket 1 gate', () => {
    expect(B5_NET_QUANTITY_ITEM_ID).toBe('b5-net-quantity-declaration');
  });

  it('citation names 21 CFR 101.105', () => {
    expect(B5_NET_QUANTITY_CITATION).toContain('21 CFR 101.105');
  });
});
