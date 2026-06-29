// ============================================================
// Bulk-paste parser — F-10 no-silent-drop / honest-engine
// ------------------------------------------------------------
// A pasted ingredient line must NEVER vanish. Pre-fix, two modes
// could silently lose a line:
//   Mode 1 (silent DROP): an unrecognized unit produced no qty match
//     → `if (rawQty <= 0) continue` dropped the line. "Vitamin D3
//     5000 IU" disappeared on paste — a false all-clear (the worst
//     failure for a compliance tool: a gap the engine never showed).
//   Mode 2 (silent MISPARSE): an unrecognized unit field defaulted to
//     grams → "5000 IU" silently became "5000 g" (a 1000×+ error).
//
// Post-fix: every recognized ingredient line emits a ParsedRow.
//   - IU is RECOGNIZED but non-mass (FDA 2016 panel, 21 CFR 101.36,
//     retired IU → mcg/mg) → parseIssue 'unit-needs-conversion',
//     accepted=false, with the exact vitamin-D conversion offered.
//   - A line with no parseable amount → parseIssue 'no-quantity'.
//   - An amount + a typo'd unit → parseIssue 'unrecognized-unit'.
// All surface with accepted=false; none are dropped or grams-coerced.
// ============================================================

import { describe, it, expect } from 'vitest';
import { parsePastedFormula } from '../parseFormula';
import { VITAMIN_D_IU_TO_MCG } from '../utils';

const EMPTY_DB: never[] = [];

describe('F-10 — IU is recognized, never dropped or grams-misparsed', () => {
  it('"Vitamin D3 5000 IU" survives parsing (the original silent-drop case)', () => {
    const rows = parsePastedFormula('Vitamin D3 5000 IU', EMPTY_DB);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.parsedName).toMatch(/vitamin d3/i);
    // NEVER grams-coerced (the Mode-2 misparse would make this 5000 g).
    expect(r.parsedUnit).toBe('IU');
    expect(r.parsedQty).toBe(5000);
  });

  it('IU rows are flagged needs-conversion and held back (accepted=false)', () => {
    const r = parsePastedFormula('Vitamin D3 5000 IU', EMPTY_DB)[0];
    expect(r.parseIssue).toBe('unit-needs-conversion');
    expect(r.accepted).toBe(false);
  });

  it('offers the exact FDA vitamin-D IU→mcg conversion (1 IU = 0.025 mcg)', () => {
    const r = parsePastedFormula('Vitamin D3 5000 IU', EMPTY_DB)[0];
    expect(VITAMIN_D_IU_TO_MCG).toBe(0.025);
    expect(r.suggestedConversion).toBeDefined();
    expect(r.suggestedConversion!.toUnit).toBe('mcg');
    expect(r.suggestedConversion!.toQty).toBe(125); // 5000 × 0.025
    expect(r.suggestedConversion!.note).toMatch(/0\.025 mcg/);
  });

  it('recognizes IU in separate columns ("Name | Qty | IU")', () => {
    const r = parsePastedFormula('Vitamin D3 | 5000 | IU', EMPTY_DB)[0];
    expect(r.parsedUnit).toBe('IU');
    expect(r.parsedQty).toBe(5000);
    expect(r.parseIssue).toBe('unit-needs-conversion');
  });

  it('recognizes the "i.u." and "International Units" spellings', () => {
    expect(parsePastedFormula('Vitamin D3 | 5000 | i.u.', EMPTY_DB)[0].parsedUnit).toBe('IU');
    expect(parsePastedFormula('Vitamin D3 2000 International Units', EMPTY_DB)[0].parsedUnit).toBe('IU');
  });

  it('a form-dependent IU vitamin (A/E) surfaces needs-conversion WITHOUT a blind factor', () => {
    // Vitamins A and E are form-dependent — no single IU→mcg factor. We must NOT
    // fabricate one; surface the gap and defer the form-aware conversion (fast-follow).
    const r = parsePastedFormula('Vitamin A 3000 IU', EMPTY_DB)[0];
    expect(r.parsedUnit).toBe('IU');
    expect(r.parseIssue).toBe('unit-needs-conversion');
    expect(r.suggestedConversion).toBeUndefined();
    expect(r.accepted).toBe(false);
  });
});

describe('F-10 — lines with no amount surface instead of dropping', () => {
  it('"Ashwagandha Extract" (no quantity) → flagged no-quantity row, not dropped', () => {
    const rows = parsePastedFormula('Ashwagandha Extract', EMPTY_DB);
    expect(rows).toHaveLength(1);
    expect(rows[0].parseIssue).toBe('no-quantity');
    expect(rows[0].parsedQty).toBe(0);
    expect(rows[0].accepted).toBe(false);
  });

  it('obvious prose (>10-word directions line) is still skipped, not surfaced as an ingredient', () => {
    const rows = parsePastedFormula(
      'Take two capsules daily with food or as directed by your healthcare professional',
      EMPTY_DB,
    );
    expect(rows).toHaveLength(0);
  });
});

describe('F-10 — a typo\'d unit surfaces instead of grams-coercing', () => {
  it('"Vitamin C | 500 | mgg" → flagged unrecognized-unit, not 500 g', () => {
    const rows = parsePastedFormula('Vitamin C | 500 | mgg', EMPTY_DB);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.parseIssue).toBe('unrecognized-unit');
    expect(r.rawUnitToken).toBe('mgg');
    expect(r.accepted).toBe(false);
  });

  it('a genuine 2-column no-unit paste ("Name | 500") keeps the grams default (no false flag)', () => {
    const r = parsePastedFormula('Maltodextrin | 500', EMPTY_DB)[0];
    expect(r.parseIssue).toBeUndefined();
    expect(r.parsedUnit).toBe('g');
    expect(r.parsedQty).toBe(500);
  });
});

describe('F-10 — the guard: every recognized ingredient line yields exactly one row', () => {
  it('a mixed paste (normal + IU + no-qty + typo) drops nothing', () => {
    const text = `Vitamin C 500 mg
Vitamin D3 5000 IU
Ashwagandha Extract
Zinc | 15 | mgg`;
    const rows = parsePastedFormula(text, EMPTY_DB);
    expect(rows).toHaveLength(4);

    const byIssue = (issue: string | undefined) => rows.filter(r => r.parseIssue === issue);
    expect(byIssue(undefined)).toHaveLength(1);            // Vitamin C — clean, importable
    expect(byIssue('unit-needs-conversion')).toHaveLength(1); // Vitamin D3 — IU
    expect(byIssue('no-quantity')).toHaveLength(1);        // Ashwagandha
    expect(byIssue('unrecognized-unit')).toHaveLength(1);  // Zinc — typo

    // None of the three flagged rows are auto-accepted (accepted is gated on a real
    // catalog match too, which EMPTY_DB never produces — but the flag itself blocks it).
    expect(rows.filter(r => r.parseIssue && r.accepted)).toHaveLength(0);
  });

  it('structural noise (dividers/headers) is still correctly skipped', () => {
    const text = `Ingredient | Qty | Unit
---|---|---
Vitamin C 500 mg`;
    const rows = parsePastedFormula(text, EMPTY_DB);
    expect(rows).toHaveLength(1);
    expect(rows[0].parseIssue).toBeUndefined();
  });
});

describe('F-10 — regression: clean lines are unaffected', () => {
  it('"Vitamin C 500 mg" still parses clean + accepted (no parseIssue)', () => {
    const r = parsePastedFormula('Vitamin C 500 mg', EMPTY_DB)[0];
    expect(r.parsedUnit).toBe('mg');
    expect(r.parsedQty).toBe(500);
    expect(r.parseIssue).toBeUndefined();
  });
});
