// ============================================================
// Bulk-paste parser — unit preservation (Phase 2 finding #11 fix)
// ------------------------------------------------------------
// Round 11 Phase 3 (2026-05-17). Tests the mg/mcg unit-preservation
// fix at lib/parseFormula.ts. Pre-fix: mg was coerced to g in the
// UNIT_ALIASES table ("mg: 'g', // treat mg as g, will be small"),
// and mcg had no alias entry at all. Result: supplement formulator
// pasting "Vitamin C 500 mg" got "Vitamin C 500 g" in the workspace
// (1000× quantity error). Phase 2 implementation-discovery finding
// #11.
//
// Post-fix: mg → 'mg', mcg → 'mcg', with full alias variants
// (milligram(s), microgram(s), ug, μg).
// ============================================================

import { describe, it, expect } from 'vitest';
import { parsePastedFormula } from '../parseFormula';

// Use empty DB — we only care about unit parsing here, not match
// tier or ingredient resolution.
const EMPTY_DB: never[] = [];

describe('parsePastedFormula — mg unit preservation (finding #11 closure)', () => {
  it('"Vitamin C 500 mg" → parsedUnit "mg" (NOT "g")', () => {
    const rows = parsePastedFormula('Vitamin C 500 mg', EMPTY_DB);
    expect(rows).toHaveLength(1);
    expect(rows[0].parsedQty).toBe(500);
    expect(rows[0].parsedUnit).toBe('mg');
  });

  it('"Iron Bisglycinate 18 mg" → preserves mg', () => {
    const rows = parsePastedFormula('Iron Bisglycinate 18 mg', EMPTY_DB);
    expect(rows[0].parsedUnit).toBe('mg');
    expect(rows[0].parsedQty).toBe(18);
  });

  it('"500 mg Vitamin C" (reversed order) → preserves mg', () => {
    const rows = parsePastedFormula('500 mg Vitamin C', EMPTY_DB);
    expect(rows[0].parsedUnit).toBe('mg');
    expect(rows[0].parsedQty).toBe(500);
  });

  it('"milligram" / "milligrams" aliases → "mg"', () => {
    expect(parsePastedFormula('Test 100 milligrams', EMPTY_DB)[0].parsedUnit).toBe('mg');
    expect(parsePastedFormula('Test 100 milligram', EMPTY_DB)[0].parsedUnit).toBe('mg');
  });
});

describe('parsePastedFormula — mcg unit support (finding #11 closure)', () => {
  it('"Vitamin D3 25 mcg" → parsedUnit "mcg"', () => {
    const rows = parsePastedFormula('Vitamin D3 25 mcg', EMPTY_DB);
    expect(rows).toHaveLength(1);
    expect(rows[0].parsedQty).toBe(25);
    expect(rows[0].parsedUnit).toBe('mcg');
  });

  it('"Vitamin B12 1000 mcg" → preserves mcg', () => {
    const rows = parsePastedFormula('Vitamin B12 1000 mcg', EMPTY_DB);
    expect(rows[0].parsedUnit).toBe('mcg');
    expect(rows[0].parsedQty).toBe(1000);
  });

  it('"microgram" / "micrograms" aliases → "mcg"', () => {
    expect(parsePastedFormula('Test 50 micrograms', EMPTY_DB)[0].parsedUnit).toBe('mcg');
    expect(parsePastedFormula('Test 50 microgram', EMPTY_DB)[0].parsedUnit).toBe('mcg');
  });

  it('"ug" alias → "mcg"', () => {
    expect(parsePastedFormula('Test 50 ug', EMPTY_DB)[0].parsedUnit).toBe('mcg');
  });

  it('"μg" (Unicode micro sign) alias → "mcg"', () => {
    expect(parsePastedFormula('Test 50 μg', EMPTY_DB)[0].parsedUnit).toBe('mcg');
  });

  it('mcg and mg are distinct (regex does not ambiguously match)', () => {
    // Regression check: ensure "500 mcg" does NOT match as "500 mg" or
    // some hybrid. mcg and mg must capture as distinct units.
    expect(parsePastedFormula('Vitamin D3 25 mcg', EMPTY_DB)[0].parsedUnit).toBe('mcg');
    expect(parsePastedFormula('Vitamin C 500 mg', EMPTY_DB)[0].parsedUnit).toBe('mg');
  });
});

describe('parsePastedFormula — g/kg/oz/lb preservation (regression baseline)', () => {
  // These were already working pre-fix; assert they continue to work
  // after the alias-table edits.
  it('"Whey Protein 25 g" → "g"', () => {
    expect(parsePastedFormula('Whey Protein 25 g', EMPTY_DB)[0].parsedUnit).toBe('g');
  });

  it('"Vitamin C 1 kg" → "kg"', () => {
    expect(parsePastedFormula('Vitamin C 1 kg', EMPTY_DB)[0].parsedUnit).toBe('kg');
  });

  it('"Almond Butter 16 oz" → "oz"', () => {
    expect(parsePastedFormula('Almond Butter 16 oz', EMPTY_DB)[0].parsedUnit).toBe('oz');
  });

  it('"Sugar 1 lb" → "lb"', () => {
    expect(parsePastedFormula('Sugar 1 lb', EMPTY_DB)[0].parsedUnit).toBe('lb');
  });
});

describe('parsePastedFormula — multi-line supplement formulation', () => {
  it('parses a typical supplement bulk-paste preserving all mg/mcg units', () => {
    const text = `Vitamin C 500 mg
Vitamin D3 25 mcg
Zinc Bisglycinate 15 mg
Magnesium Glycinate 200 mg
Biotin 100 mcg`;
    const rows = parsePastedFormula(text, EMPTY_DB);
    expect(rows).toHaveLength(5);
    expect(rows[0].parsedUnit).toBe('mg');   // Vitamin C
    expect(rows[1].parsedUnit).toBe('mcg');  // Vitamin D3
    expect(rows[2].parsedUnit).toBe('mg');   // Zinc
    expect(rows[3].parsedUnit).toBe('mg');   // Magnesium
    expect(rows[4].parsedUnit).toBe('mcg');  // Biotin
  });
});
