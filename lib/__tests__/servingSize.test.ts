// ============================================================
// Round 11 Phase 2 Step 2 — pre-flight verification for Finding #26
// ------------------------------------------------------------
// Tests for the Serving Size input validation helper at
// lib/servingSize.ts. Written against the TARGET helper signature
// per the directive's "tests before fix code" rule.
//
// At pre-flight commit (this commit): lib/servingSize.ts does NOT
// yet exist. Test file imports fail; the suite is intentionally
// red per TDD discipline. The fix commit lands lib/servingSize.ts
// and the page.tsx call-site swap; suite turns green.
//
// Coverage maps to docs/findings/round-11-verification-tests.md
// Section 7 (T7-01 through T7-05 + supplemental cases here).
// ============================================================

import { describe, it, expect } from 'vitest';
import { validateServingSizeInput } from '../servingSize';

describe('validateServingSizeInput — decimal entry acceptance (T7-03, T7-04, T7-05)', () => {
  it('T7-03: "1.5" → 1.5 (accepts decimals)', () => {
    expect(validateServingSizeInput('1.5')).toBe(1.5);
  });

  it('T7-04: "2.5" → 2.5 (accepts decimals)', () => {
    expect(validateServingSizeInput('2.5')).toBe(2.5);
  });

  it('T7-05: "0.5" → 0.5 (accepts sub-1 entries above min)', () => {
    expect(validateServingSizeInput('0.5')).toBe(0.5);
  });

  it('integer entries pass through unchanged', () => {
    expect(validateServingSizeInput('30')).toBe(30);
    expect(validateServingSizeInput('1')).toBe(1);
    expect(validateServingSizeInput('100')).toBe(100);
  });

  it('multi-decimal entries pass through (e.g., "12.345")', () => {
    expect(validateServingSizeInput('12.345')).toBe(12.345);
  });
});

describe('validateServingSizeInput — min clamp (default 0.1)', () => {
  it('"0" → 0.1 (clamped to default min)', () => {
    expect(validateServingSizeInput('0')).toBe(0.1);
  });

  it('"-5" → 0.1 (clamped; negative not allowed)', () => {
    expect(validateServingSizeInput('-5')).toBe(0.1);
  });

  it('"0.05" → 0.1 (clamped; below min)', () => {
    expect(validateServingSizeInput('0.05')).toBe(0.1);
  });

  it('exactly at default min: "0.1" → 0.1 (boundary inclusive)', () => {
    expect(validateServingSizeInput('0.1')).toBe(0.1);
  });
});

describe('validateServingSizeInput — max clamp (T7-02; default 100)', () => {
  it('T7-02: "150" → 100 (clamped to default max)', () => {
    expect(validateServingSizeInput('150')).toBe(100);
  });

  it('exactly at default max: "100" → 100 (boundary inclusive)', () => {
    expect(validateServingSizeInput('100')).toBe(100);
  });

  it('"99.9" → 99.9 (just under max)', () => {
    expect(validateServingSizeInput('99.9')).toBe(99.9);
  });

  it('"1000" → 100 (clamped well above max)', () => {
    expect(validateServingSizeInput('1000')).toBe(100);
  });
});

describe('validateServingSizeInput — T7-01 increment-beyond-30 behavior (no wrap)', () => {
  // The matrix's "30 → 1 wrap" framing is about the input control's
  // behavior under arrow-button increment. The helper returns the
  // user-typed value clamped to [min, max]; arrow-button behavior is
  // governed by the input element's `step` + `max` attributes (set
  // declaratively by the JSX in the fix commit). The helper test here
  // just confirms 31 passes through cleanly when the user types it.
  it('"31" → 31 (no wrap to 1; 31 is between min 0.1 and max 100)', () => {
    expect(validateServingSizeInput('31')).toBe(31);
  });

  it('"50" → 50 (well within range)', () => {
    expect(validateServingSizeInput('50')).toBe(50);
  });
});

describe('validateServingSizeInput — fallback for unparseable input', () => {
  it('"" (empty string) → 30 (default fallback)', () => {
    expect(validateServingSizeInput('')).toBe(30);
  });

  it('"abc" → 30 (NaN fallback)', () => {
    expect(validateServingSizeInput('abc')).toBe(30);
  });

  it('"   " (whitespace) → 30 (whitespace-only is unparseable)', () => {
    expect(validateServingSizeInput('   ')).toBe(30);
  });
});

describe('validateServingSizeInput — configurable bounds via options', () => {
  it('custom max via options: "150" with max=200 → 150', () => {
    expect(validateServingSizeInput('150', { max: 200 })).toBe(150);
  });

  it('custom min via options: "0.05" with min=0.01 → 0.05', () => {
    expect(validateServingSizeInput('0.05', { min: 0.01 })).toBe(0.05);
  });

  it('custom fallback via options: "" with fallback=10 → 10', () => {
    expect(validateServingSizeInput('', { fallback: 10 })).toBe(10);
  });

  it('all three options together respected', () => {
    expect(validateServingSizeInput('5000', { min: 0.5, max: 500, fallback: 50 })).toBe(500);
    expect(validateServingSizeInput('0.001', { min: 0.5, max: 500, fallback: 50 })).toBe(0.5);
    expect(validateServingSizeInput('', { min: 0.5, max: 500, fallback: 50 })).toBe(50);
  });
});

describe('validateServingSizeInput — defensive edge cases', () => {
  it('numeric input passed as string with leading + sign: "+5" → 5', () => {
    expect(validateServingSizeInput('+5')).toBe(5);
  });

  it('scientific notation: "1e2" → 100 (parseFloat accepts)', () => {
    expect(validateServingSizeInput('1e2')).toBe(100);
  });

  it('parseable prefix with garbage tail: "30abc" → 30 (parseFloat takes leading number)', () => {
    expect(validateServingSizeInput('30abc')).toBe(30);
  });

  it('Infinity → clamped to max', () => {
    expect(validateServingSizeInput('Infinity')).toBe(100);
  });
});
