// ============================================================
// HARNESS — determination engine (#15) + cGMP program (#10). Spec §5.
// ------------------------------------------------------------
// The classification engine routes a product to its regulatory framework. For a
// dietary supplement that is 21 CFR 111 cGMP (NO Scheduled Process filing) — F&B
// acidified/LACF logic (21 CFR 113/114) must NOT apply. This is the "sector is
// structural" boundary at the determination layer. See docs/audits/determination-cgmp-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { determineFilingRequirement } from '../scheduledProcess';

describe('HARNESS · #15/#10 determination + cGMP — supplement → 21 CFR 111', () => {
  const supp = determineFilingRequirement(null, {}, 'supplements');

  it('supplement → NO Scheduled Process filing required', () => {
    expect(supp.required).toBe(false);
    expect(supp.formName).toBe('None — 21 CFR 111 cGMP framework');
  });
  it('supplement → 21 CFR 111 / 101.36 / 101.93 citations (the cGMP framework)', () => {
    expect(supp.citations.some(c => /21 CFR 111/.test(c))).toBe(true);
    expect(supp.citations.some(c => /101\.36/.test(c))).toBe(true);
    expect(supp.citations.some(c => /101\.93/.test(c))).toBe(true);
  });
  it('supplement citations do NOT contain F&B 113/114 (acidified/LACF suppressed)', () => {
    expect(supp.citations.some(c => /\b113\b|\b114\b/.test(c))).toBe(false);
  });
  it('SECTOR BOUNDARY: supplement short-circuits to 111 even when F&B-shaped specs are passed', () => {
    const r = determineFilingRequirement(null, { pH: 4.0, productClassification: 'acidified' }, 'supplements');
    expect(r.required).toBe(false);
    expect(r.formName).toBe('None — 21 CFR 111 cGMP framework'); // NOT FDA 2541e
  });
});

describe('HARNESS · #15 determination — F&B path unaffected (the other side of the boundary)', () => {
  it('F&B acidified → Scheduled Process filing required (21 CFR 114)', () => {
    const r = determineFilingRequirement(null, { pH: 4.0, productClassification: 'acidified' }, 'fb');
    expect(r.required).toBe(true);
    expect(r.citations.some(c => /114/.test(c))).toBe(true);
  });
});
