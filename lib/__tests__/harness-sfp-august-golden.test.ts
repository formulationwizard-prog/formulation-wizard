// ============================================================
// HARNESS — August SFP golden matrix (the verifier from the world-class spec)
// ------------------------------------------------------------
// docs/spec/world-class-build-spec-2026-06-07.md §5/§10. Golden formulas ×
// input states, asserting the SFP surface across the August target. Each golden
// fact carries TWO independent derivations: a HAND-DERIVED literal (regulator-style,
// written here) AND, where shown, a PROGRAMMATIC re-derivation — pass requires the
// two to match AND the code output to match them (a harness that only checks code
// against itself is a silent-failure surface — the morning's `[]` false-all-clear).
//
// Conversions / aggregation / threshold / rounding goldens live in
// dv-equivalence-and-corrections.test.ts; this file owns the RECIPE-RATIO ×
// input-state matrix. Living — extends as new shapes/surfaces are covered (§7).
// ============================================================
import { describe, it, expect } from 'vitest';
import { buildSupplementFacts } from '../supplementLabeling';
import { UNIT_TO_GRAMS } from '../utils';
import type { Ingredient } from '../../types';

const ing = (name: string, qtyMg: number, cat: string, potency?: number): Ingredient =>
  ({ name, qty: qtyMg, unit: 'mg', foodData: { type: 'industrial', data: { category: cat, ...(potency != null ? { potencyFactor: potency } : {}) } } } as unknown as Ingredient);

function sfp(ings: Ingredient[], perCapMg: number, units: number) {
  const totalBatchGrams = ings.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 0), 0);
  const supplementServingMassG = perCapMg > 0 && units > 0 ? (perCapMg * units) / 1000 : 0;
  return buildSupplementFacts({
    ingredients: ings, mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams, supplementServingMassG,
    servingsPerContainer: 0, servingSizeLabel: units > 0 ? `${units} Capsules` : '—', caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  });
}
const find = (f: ReturnType<typeof sfp>, re: RegExp) =>
  f.vitaminMineralRows.find(r => re.test(r.displayName)) ?? f.otherActivesRows.find(r => re.test(r.displayName));

// Calm & Sleep — the recipe-ratio reference (700 mg; L-Theanine 200/700 = 28.571%).
const CALM: Ingredient[] = [
  ing('Magnesium Glycinate', 200, 'Minerals'),          // elemental 0.14
  ing('L-Theanine (Suntheanine)', 200, 'Amino Acids'),  // factor 1
  ing('Ashwagandha (KSM-66)', 300, 'Herbal Extracts'),  // factor 1
];

describe('HARNESS · GOLDEN A — Calm & Sleep recipe-ratio × input states', () => {
  it('fill 350 mg/cap × 2 (serving = formula): identity-equivalent doses', () => {
    const f = sfp(CALM, 350, 2);
    // hand-derived: serving 700 mg = formula → scale 1.0
    expect(find(f, /Theanine/)!.amount).toBeCloseTo(200, 1);
    const mag = find(f, /Magnesium/)!;
    expect(mag.amount).toBeCloseTo(28, 1);          // 200 × 0.14
    expect(mag.percentDV).toBeCloseTo(6.667, 2);    // 28/420 (raw; renders 7%)
    expect(find(f, /Ashwagandha/)!.amount).toBeCloseTo(300, 1);
  });

  it('fill 660 mg/cap × 2: capsule weight DRIVES the dose', () => {
    const f = sfp(CALM, 660, 2);
    // hand-derived: serving 1320 mg → scale 1320/700 = 1.88571
    expect(find(f, /Theanine/)!.amount).toBeCloseTo(377.1, 1);
    expect(find(f, /Magnesium/)!.amount).toBeCloseTo(52.8, 1);
    expect(find(f, /Ashwagandha/)!.amount).toBeCloseTo(565.7, 1);
  });

  it('TWO-DERIVATION: hand-derived literal == programmatic == code (L-Theanine @ 660)', () => {
    const handDerived = 377.1;                       // regulator-style, written by me
    const programmatic = (200 / 700) * 1320;         // independent recompute = 377.14
    expect(programmatic).toBeCloseTo(handDerived, 1); // harness verified against itself
    expect(find(sfp(CALM, 660, 2), /Theanine/)!.amount).toBeCloseTo(programmatic, 1); // code matches both
  });

  it('OVERFILL (2000 mg/cap): engine scales (does not clamp); fit is the gate, not the dose', () => {
    const r = find(sfp(CALM, 2000, 2), /Theanine/)!;
    const mg = r.amount! * (r.unit === 'g' ? 1000 : 1); // displays as g at ≥1000 mg
    expect(mg).toBeGreaterThan(377); // 200/700 × 4000 = 1142.8 mg
  });

  // ENGINE-WIRE LANDED (§8 step 2): blank fill → "—" (amount null), not entered amounts.
  it('blank fill → L-Theanine amount null ("—"), not entered 200', () => {
    expect(find(sfp(CALM, 0, 2), /Theanine/)!.amount).toBeNull();
  });
  it('blank fill → Magnesium amount null ("—")', () => {
    expect(find(sfp(CALM, 0, 2), /Magnesium/)!.amount).toBeNull();
  });
});

// ── #2 ingredient statement — 21 CFR 101.36(d) source-declaration choice ──────
// Either/or, never both: sources in the SFP parens (default) OR in a separate ingredient
// statement (§101.4(g)) — but not duplicated. Data-level here (SFP parens on/off); the
// render gates (full-statement box / Other-Ingredients line) are page.tsx + screenshot-sampled.
describe('HARNESS · #2 source-declaration — 101.36(d) (no double declaration of dietary actives)', () => {
  const MIN = [ing('Magnesium Glycinate', 200, 'Minerals')];
  const decl = (omitSourceParens: boolean) =>
    buildSupplementFacts({
      ingredients: MIN, mode: 'supplements', servingSizeInGrams: 0,
      totalBatchGrams: 0.2, supplementServingMassG: 0.2, servingsPerContainer: 0,
      servingSizeLabel: '1 Capsule', caloriesPerServing: 0, omitSourceParens,
      macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
    }).vitaminMineralRows.find(r => /Magnesium/.test(r.displayName))!;

  it('mode 1 — sources in SFP (default): Magnesium row carries the "(as …Glycinate)" source parens', () => {
    expect(decl(false).displayName).toMatch(/\(as .*Glycinate/i);
  });
  it('mode 2 — sources in ingredient statement: SFP row DROPS the parens (sources declared once, in the statement)', () => {
    const dn = decl(true).displayName;
    expect(dn).toBe('Magnesium');
    expect(dn).not.toMatch(/\(as/i);
  });
});
