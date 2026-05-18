// ============================================================
// SFP DV lookup — B12 catalog entry resolves correctly
// ------------------------------------------------------------
// Lock in the fix for Bug #8 (2026-05-17): the DV table's Thiamin
// keyword `"vitamin b1"` was substring-matching `"vitamin b12 ..."`
// via String.prototype.includes(), so the B12 catalog entry's row
// in the SFP rendered as "Thiamin (as Cyanocobalamin 1% on
// Mannitol) 0 mg <1%" instead of "Vitamin B12 2.4 mcg".
//
// Now that findDVEntry uses keywordMatch (word-boundary semantics),
// "vitamin b1" no longer matches "vitamin b12" and B12 finds its
// own DV row.
// ============================================================

import { describe, it, expect } from 'vitest';
import { findDVEntry } from '../supplementLabeling';

describe('findDVEntry — B12 catalog name resolves to B12 entry (not Thiamin)', () => {
  it('"Vitamin B12 (Cyanocobalamin 1% on Mannitol)" resolves to Vitamin B12 DV entry', () => {
    const dv = findDVEntry('Vitamin B12 (Cyanocobalamin 1% on Mannitol)');
    expect(dv).toBeDefined();
    expect(dv?.displayName).toBe('Vitamin B12');
    expect(dv?.dv).toBe(2.4);
    expect(dv?.unit).toBe('mcg');
  });

  it('"Methylcobalamin (Vitamin B12 Active)" resolves to Vitamin B12 DV entry', () => {
    const dv = findDVEntry('Methylcobalamin (Vitamin B12 Active)');
    expect(dv?.displayName).toBe('Vitamin B12');
  });

  it('"Vitamin B1 (Thiamine HCl)" still resolves to Thiamin DV entry', () => {
    const dv = findDVEntry('Vitamin B1 (Thiamine HCl)');
    expect(dv?.displayName).toBe('Thiamin');
    expect(dv?.dv).toBe(1.2);
  });

  it('"Thiamine HCl (B1, USP)" resolves to Thiamin DV entry', () => {
    const dv = findDVEntry('Thiamine HCl (B1, USP)');
    expect(dv?.displayName).toBe('Thiamin');
  });

  it('"Vitamin B6 (Pyridoxine HCl)" resolves to Vitamin B6 DV entry', () => {
    const dv = findDVEntry('Vitamin B6 (Pyridoxine HCl)');
    expect(dv?.displayName).toBe('Vitamin B6');
    expect(dv?.dv).toBe(1.7);
  });

  it('"Vitamin B6 P-5-P (Pyridoxal-5-Phosphate)" still resolves to Vitamin B6', () => {
    const dv = findDVEntry('Vitamin B6 P-5-P (Pyridoxal-5-Phosphate)');
    expect(dv?.displayName).toBe('Vitamin B6');
  });

  it('"Vitamin B2 (Riboflavin USP)" resolves to Riboflavin (no collision with B12 / B6)', () => {
    const dv = findDVEntry('Vitamin B2 (Riboflavin USP)');
    expect(dv?.displayName).toBe('Riboflavin');
  });

  it('"Vitamin B9 (Folic Acid USP)" resolves to Folate', () => {
    const dv = findDVEntry('Vitamin B9 (Folic Acid USP)');
    expect(dv?.displayName).toBe('Folate');
  });

  it('Unknown ingredient returns null', () => {
    const dv = findDVEntry('Totally Made Up Compound XYZ');
    expect(dv).toBeNull();
  });
});

describe('findDVEntry — non-B-vitamin sanity checks (no regressions)', () => {
  it('"Calcium Citrate (USP)" resolves to Calcium', () => {
    const dv = findDVEntry('Calcium Citrate (USP)');
    expect(dv?.displayName).toBe('Calcium');
  });

  it('"Iron Bisglycinate (Ferrochel)" resolves to Iron', () => {
    const dv = findDVEntry('Iron Bisglycinate (Ferrochel, Albion — 20% Fe)');
    expect(dv?.displayName).toBe('Iron');
  });

  it('"Magnesium Glycinate" resolves to Magnesium', () => {
    const dv = findDVEntry('Magnesium Glycinate (Chelated, Albion TRAACS)');
    expect(dv?.displayName).toBe('Magnesium');
  });

  it('"Vitamin K2 MK-7" resolves to Vitamin K', () => {
    const dv = findDVEntry('Vitamin K2 MK-7 (Natto, 0.2% on MCC)');
    expect(dv?.displayName).toBe('Vitamin K');
  });

  it('"Vitamin D3 Vegan (Lichen-Sourced)" resolves to Vitamin D', () => {
    const dv = findDVEntry('Vitamin D3 Vegan (Lichen-Sourced)');
    // The DV table groups all D forms under "Vitamin D" displayName
    expect(dv?.displayName).toMatch(/Vitamin D/);
  });
});
