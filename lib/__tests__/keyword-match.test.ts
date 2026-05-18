// ============================================================
// keywordMatch — shared word-boundary keyword matcher
// ------------------------------------------------------------
// Locks in the two-class boundary semantics established
// 2026-05-17 (Round 11 Phase 3 post-A.5 follow-up):
//
//   Class A — short keyword inside longer chemical name
//     (e.g., "dha" → "ashwagandha"). Word-start boundary
//     prevents these.
//
//   Class B — numeric suffix collision
//     (e.g., "vitamin b1" → "vitamin b12"). Word-END
//     boundary required for digit-suffixed keywords
//     prevents these.
//
// Also asserts that legitimate prefix matches (pyridox →
// pyridoxal-5-phosphate, ferrous → ferrous bisglycinate)
// continue to work — these are why we can't just universally
// require both boundaries.
// ============================================================

import { describe, it, expect } from 'vitest';
import { keywordMatch } from '../keywordMatch';

describe('keywordMatch — Class A: short-keyword false-positive prevention', () => {
  it('"dha" does NOT match "ashwagandha"', () => {
    expect(keywordMatch('ashwagandha (ksm-66, ixoreal, 5% withanolides)', 'dha')).toBe(false);
  });

  it('"dha" DOES match "epa + dha concentrate"', () => {
    expect(keywordMatch('epa + dha concentrate 60%', 'dha')).toBe(true);
  });

  it('"epa" does NOT match "preparation"', () => {
    expect(keywordMatch('preparation h ointment', 'epa')).toBe(false);
  });

  it('"epa" DOES match "epa fish oil"', () => {
    expect(keywordMatch('epa fish oil triglyceride', 'epa')).toBe(true);
  });

  it('"rue" does NOT match "true blue extract"', () => {
    expect(keywordMatch('true blue extract', 'rue')).toBe(false);
  });

  it('"rue" DOES match "rue herb extract"', () => {
    expect(keywordMatch('rue herb extract', 'rue')).toBe(true);
  });
});

describe('keywordMatch — Class B: numeric suffix collision prevention', () => {
  it('"vitamin b1" does NOT match "vitamin b12 (cyanocobalamin 1% on mannitol)"', () => {
    expect(keywordMatch('vitamin b12 (cyanocobalamin 1% on mannitol)', 'vitamin b1')).toBe(false);
  });

  it('"vitamin b1" DOES match "vitamin b1 (thiamine hcl)"', () => {
    expect(keywordMatch('vitamin b1 (thiamine hcl)', 'vitamin b1')).toBe(true);
  });

  it('"b-1" does NOT match "b-12"', () => {
    expect(keywordMatch('vitamin b-12 cobalamin', 'b-1')).toBe(false);
  });

  it('"b-1" DOES match "vit b-1, thiamine"', () => {
    expect(keywordMatch('vit b-1, thiamine', 'b-1')).toBe(true);
  });

  it('"vitamin d3" does NOT match "vitamin d30" (hypothetical future-form)', () => {
    expect(keywordMatch('vitamin d30 super', 'vitamin d3')).toBe(false);
  });

  it('"vitamin d3" DOES match "vitamin d3 cholecalciferol"', () => {
    expect(keywordMatch('vitamin d3 cholecalciferol (lichen)', 'vitamin d3')).toBe(true);
  });
});

describe('keywordMatch — legitimate prefix matches preserved', () => {
  it('"pyridox" matches "pyridoxal-5-phosphate"', () => {
    expect(keywordMatch('pyridoxal-5-phosphate (p5p)', 'pyridox')).toBe(true);
  });

  it('"pyridox" matches "pyridoxine hcl"', () => {
    expect(keywordMatch('pyridoxine hcl (vitamin b6)', 'pyridox')).toBe(true);
  });

  it('"ferrous" matches "ferrous bisglycinate"', () => {
    expect(keywordMatch('ferrous bisglycinate chelate (ferrochel, albion)', 'ferrous')).toBe(true);
  });

  it('"magnesium" matches "magnesium glycinate"', () => {
    expect(keywordMatch('magnesium glycinate (chelated, albion traacs)', 'magnesium')).toBe(true);
  });

  it('"vitamin a" matches "vitamin a palmitate (500,000 iu/g)"', () => {
    expect(keywordMatch('vitamin a palmitate (500,000 iu/g)', 'vitamin a')).toBe(true);
  });

  it('"calcium" matches "calcium citrate (usp)"', () => {
    expect(keywordMatch('calcium citrate (usp)', 'calcium')).toBe(true);
  });
});

describe('keywordMatch — hyphenated and multi-word keywords', () => {
  it('"5-htp" matches "l-5-htp"', () => {
    expect(keywordMatch('l-5-htp (griffonia seed extract, 99%)', '5-htp')).toBe(true);
  });

  it('"5-htp" matches "5-htp" at start', () => {
    expect(keywordMatch('5-htp (griffonia)', '5-htp')).toBe(true);
  });

  it('"ma huang" multi-word matches "ma huang extract"', () => {
    expect(keywordMatch('ma huang extract', 'ma huang')).toBe(true);
  });

  it("\"st. john's wort\" punctuated matches case-insensitively", () => {
    expect(keywordMatch("st. john's wort 300mg", "st. john's wort")).toBe(true);
  });

  it('"alpha-gpc" matches "alpha-gpc 50% choline"', () => {
    expect(keywordMatch('alpha-gpc 50% l-alpha-glycerylphosphorylcholine', 'alpha-gpc')).toBe(true);
  });

  it('"mk-7" matches "vitamin k2 mk-7"', () => {
    expect(keywordMatch('vitamin k2 mk-7 (menaq7)', 'mk-7')).toBe(true);
  });
});

describe('keywordMatch — edge cases', () => {
  it('empty keyword returns false', () => {
    expect(keywordMatch('any haystack', '')).toBe(false);
  });

  it('regex special characters in keyword are escaped', () => {
    // Period is regex-special; must match literally
    expect(keywordMatch('st. john\'s wort', 'st.')).toBe(true);
    expect(keywordMatch('stx john\'s wort', 'st.')).toBe(false);
  });

  it('case-insensitive matching', () => {
    expect(keywordMatch('VITAMIN B12 ACTIVE FORM', 'vitamin b12')).toBe(true);
    expect(keywordMatch('vitamin b12 active form', 'VITAMIN B12')).toBe(true);
  });

  it('keyword at end of string matches when not digit-suffixed', () => {
    // "pyridox" is letter-suffixed → no end anchor → matches at any position
    expect(keywordMatch('something pyridox', 'pyridox')).toBe(true);
  });

  it('digit-suffixed keyword at end of string still matches', () => {
    expect(keywordMatch('formulation with b1', 'b1')).toBe(true);
  });
});
