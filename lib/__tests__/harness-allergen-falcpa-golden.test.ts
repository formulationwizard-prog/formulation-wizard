// ============================================================
// HARNESS — allergen surface (FALCPA / FASTER). Spec §5: gate-verdict coverage.
// ------------------------------------------------------------
// The detection module is species-aware + cited + gated (audit-confirmed). This
// harness locks: (1) the refined-oil exemption per-ingredient OVERRIDE — the
// B6-analog, 21 U.S.C. 321(qq)(2)(A); (2) the species-naming gate signal; and
// (3) the KNOWN substring false-positives as R12 word-boundary fix targets (todo).
// See docs/audits/falcpa-allergen-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { isFalcpaRefinedOilExempt, detectAllergensDetailed } from '../supplementAllergen';

describe('HARNESS · allergen — refined-oil exemption override (21 U.S.C. 321(qq)(2)(A))', () => {
  // Per-ingredient override on the generic detector. Only 'exempt' skips; the rest declare.
  it("'exempt' (RBD soybean oil, <1 ppm protein) → exempt, skips declaration", () => {
    expect(isFalcpaRefinedOilExempt('exempt')).toBe(true);
  });
  it("'operator-decision' (e.g. coconut oil RBD) → conservatively DECLARES", () => {
    expect(isFalcpaRefinedOilExempt('operator-decision')).toBe(false);
  });
  it("'not-exempt' (cold-pressed / virgin, protein-bearing) → DECLARES", () => {
    expect(isFalcpaRefinedOilExempt('not-exempt')).toBe(false);
  });
  it('undefined (refining grade not yet flagged) → DECLARES (safe default)', () => {
    expect(isFalcpaRefinedOilExempt(undefined)).toBe(false);
  });
});

describe('HARNESS · allergen — species-naming detection (FALCPA, confirmed sound)', () => {
  it('almond → Tree Nuts (Almonds), species named → no gate violation', () => {
    const m = detectAllergensDetailed('Almond extract').find(x => x.category === 'Tree Nuts')!;
    expect(m.species).toBe('Almonds');
    expect(m.requiresSpeciesNaming).toBe(true);
  });
  it('generic "tree nuts" with no species → species undefined (gate refusal trigger)', () => {
    const m = detectAllergensDetailed('contains tree nuts').find(x => x.category === 'Tree Nuts')!;
    expect(m.species).toBeUndefined();
    expect(m.requiresSpeciesNaming).toBe(true);
  });
  it('shrimp → Crustacean Shellfish (Shrimp); clam → Mollusks (not Shellfish)', () => {
    expect(detectAllergensDetailed('shrimp powder').find(x => x.category === 'Shellfish')!.species).toBe('Shrimp');
    expect(detectAllergensDetailed('clam extract').find(x => x.category === 'Mollusks')!.species).toBe('Clams');
  });
});

// KNOWN R12 fix-targets — substring false-positives (OVER-declaration; documented in
// supplementAllergen.ts). Word-boundary detection is the fix. todo = the R12 gate.
describe('HARNESS · allergen — substring false-positives (R12 word-boundary fix targets)', () => {
  it.todo('"almond flour" should NOT detect Wheat (flour substring)');
  it.todo('"cream of tartar" should NOT detect Milk (cream substring)');
  it.todo('"eggplant" should NOT detect Eggs (egg substring)');
});
