// ============================================================
// coerceUnitToAllowed — LB #3 unit-dropdown silent-downgrade fix (Option C).
// ------------------------------------------------------------
// Bulk paste can resolve an ingredient in a unit the active mode's dropdown
// doesn't offer (e.g., "0.5 lb" in supplements mode = mcg/mg/g/kg/ml/L only).
// Pre-fix the controlled <select> silently showed the first option (mcg) while
// state held 'lb' — a harm-critical mismatch. Option C: auto-convert to a
// supported unit (mass→g, volume→ml) AND return a note for a visible badge.
// ============================================================

import { describe, it, expect } from 'vitest';
import { coerceUnitToAllowed } from '../utils';

const SUPP_UNITS = ['mcg', 'mg', 'g', 'kg', 'ml', 'L'];
// F&B mode offers the wider imperial set.
const FB_UNITS = ['mcg', 'mg', 'g', 'kg', 'oz', 'lb', 'ml', 'L', 'fl oz', 'tsp', 'tbsp', 'cup'];

describe('coerceUnitToAllowed — already-allowed units pass through', () => {
  it('g in supplements → unchanged, no note', () => {
    expect(coerceUnitToAllowed(5, 'g', SUPP_UNITS)).toEqual({ qty: 5, unit: 'g', note: null });
  });
  it('mg in supplements → unchanged, no note', () => {
    expect(coerceUnitToAllowed(500, 'mg', SUPP_UNITS)).toEqual({ qty: 500, unit: 'mg', note: null });
  });
  it('ml in supplements → unchanged, no note', () => {
    expect(coerceUnitToAllowed(30, 'ml', SUPP_UNITS)).toEqual({ qty: 30, unit: 'ml', note: null });
  });
  it('lb in F&B (allowed) → unchanged, no note', () => {
    expect(coerceUnitToAllowed(0.5, 'lb', FB_UNITS)).toEqual({ qty: 0.5, unit: 'lb', note: null });
  });
});

describe('coerceUnitToAllowed — mass units convert to grams', () => {
  it('0.5 lb in supplements → 226.796 g + note (the canonical bug case)', () => {
    const r = coerceUnitToAllowed(0.5, 'lb', SUPP_UNITS);
    expect(r.unit).toBe('g');
    expect(r.qty).toBeCloseTo(226.796, 3);
    expect(r.note).toBe('Converted from 0.5 lb');
  });
  it('1 oz in supplements → 28.3495 g + note', () => {
    const r = coerceUnitToAllowed(1, 'oz', SUPP_UNITS);
    expect(r.unit).toBe('g');
    expect(r.qty).toBeCloseTo(28.3495, 4);
    expect(r.note).toBe('Converted from 1 oz');
  });
});

describe('coerceUnitToAllowed — volume units convert to ml (density-independent)', () => {
  it('1 fl oz in supplements → 29.5735 ml + note', () => {
    const r = coerceUnitToAllowed(1, 'fl oz', SUPP_UNITS);
    expect(r.unit).toBe('ml');
    expect(r.qty).toBeCloseTo(29.5735, 4);
    expect(r.note).toBe('Converted from 1 fl oz');
  });
  it('1 tbsp in supplements → 14.7868 ml + note', () => {
    const r = coerceUnitToAllowed(1, 'tbsp', SUPP_UNITS);
    expect(r.unit).toBe('ml');
    expect(r.qty).toBeCloseTo(14.7868, 4);
  });
  it('1 cup in supplements → 236.588 ml + note', () => {
    const r = coerceUnitToAllowed(1, 'cup', SUPP_UNITS);
    expect(r.unit).toBe('ml');
    expect(r.qty).toBeCloseTo(236.588, 3);
  });
  it('1 tsp in supplements → 4.92892 ml + note', () => {
    const r = coerceUnitToAllowed(1, 'tsp', SUPP_UNITS);
    expect(r.unit).toBe('ml');
    expect(r.qty).toBeCloseTo(4.92892, 4);
  });
});

describe('coerceUnitToAllowed — fail-open on unconvertible input', () => {
  it('unknown unit → unchanged, no note (never silently wrong)', () => {
    expect(coerceUnitToAllowed(3, 'widgets', SUPP_UNITS)).toEqual({ qty: 3, unit: 'widgets', note: null });
  });
  it('mass unit but g not in allowed set → unchanged, no note', () => {
    // Contrived: a mode that allows only ml/L (no g). Mass lb can't target g → leave as-is.
    expect(coerceUnitToAllowed(0.5, 'lb', ['ml', 'L'])).toEqual({ qty: 0.5, unit: 'lb', note: null });
  });
});
