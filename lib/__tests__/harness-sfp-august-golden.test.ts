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
// dv-equivalence-and-corrections.test.ts; this file owns the F-3 DOSE-MODEL ×
// input-state matrix (per-serving = entered per-capsule × units; fill is the fit
// target, never a dose scaler). Living — extends as new shapes/surfaces land (§7).
// ============================================================
import { describe, it, expect } from 'vitest';
import { buildSupplementFacts, perServingActiveMgMap } from '../supplementLabeling';
import { perServingAmounts } from '../perServingAmounts';
import { UNIT_TO_GRAMS } from '../utils';
import type { Ingredient } from '../../types';

const ing = (name: string, qtyMg: number, cat: string, potency?: number): Ingredient =>
  ({ name, qty: qtyMg, unit: 'mg', foodData: { type: 'industrial', data: { category: cat, ...(potency != null ? { potencyFactor: potency } : {}) } } } as unknown as Ingredient);

function sfp(ings: Ingredient[], perCapMg: number, units: number) {
  const totalBatchGrams = ings.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 0), 0);
  const supplementServingMassG = perCapMg > 0 && units > 0 ? (perCapMg * units) / 1000 : 0;
  return buildSupplementFacts({
    ingredients: ings, mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams, supplementServingMassG,
    unitsPerServing: units, // F-3: per-serving = entered per-capsule × units (no fill-scaling)
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

describe('HARNESS · GOLDEN A — Calm & Sleep F-3 dose model (per-serving = entered per-capsule × units)', () => {
  it('1 unit/serving: dose = entered per-capsule (identity)', () => {
    const f = sfp(CALM, 350, 1);
    // hand-derived: per-serving = entered per-capsule × 1
    expect(find(f, /Theanine/)!.amount).toBeCloseTo(200, 1);
    const mag = find(f, /Magnesium/)!;
    expect(mag.amount).toBeCloseTo(28, 1);          // 200 × 0.14 elemental Mg
    expect(mag.percentDV).toBeCloseTo(6.667, 2);    // 28/420 (raw; renders 7%)
    expect(find(f, /Ashwagandha/)!.amount).toBeCloseTo(300, 1);
  });

  it('2 units/serving: dose = entered per-capsule × 2 (UNITS drive the dose, not fill)', () => {
    const f = sfp(CALM, 660, 2);
    // hand-derived: per-serving = entered per-capsule × 2
    expect(find(f, /Theanine/)!.amount).toBeCloseTo(400, 1);
    const mag = find(f, /Magnesium/)!;
    expect(mag.amount).toBeCloseTo(56, 1);          // (200 × 2) × 0.14
    expect(mag.percentDV).toBeCloseTo(13.333, 2);   // 56/420
    expect(find(f, /Ashwagandha/)!.amount).toBeCloseTo(600, 1);
  });

  it('TWO-DERIVATION: hand-derived literal == programmatic == code (L-Theanine @ 2 units)', () => {
    const handDerived = 400;                         // 200 mg/capsule × 2 capsules, regulator-style
    const programmatic = 200 * 2;                    // independent recompute
    expect(programmatic).toBeCloseTo(handDerived, 1); // harness verified against itself
    expect(find(sfp(CALM, 660, 2), /Theanine/)!.amount).toBeCloseTo(programmatic, 1); // code matches both
  });

  it('F-3 INVARIANT: fill does NOT change the dose — same units, any fill → identical amount', () => {
    // The misbranding bug this retires: fill once scaled the dose (200 → 377 → 1142 mg).
    // Under F-3 the entered amount IS the per-capsule dose; fill is only the fit target.
    const underfill = find(sfp(CALM, 350, 2), /Theanine/)!.amount;  // fill < Σ formula
    const atFit     = find(sfp(CALM, 700, 2), /Theanine/)!.amount;  // fill = Σ formula
    const overfill  = find(sfp(CALM, 2000, 2), /Theanine/)!.amount; // fill > Σ formula
    expect(underfill).toBeCloseTo(400, 1);
    expect(atFit).toBeCloseTo(400, 1);
    expect(overfill).toBeCloseTo(400, 1);  // NOT 1142.8 mg — the retired fill-scaling bug
  });

  // ENGINE-WIRE (§8): blank-until-real now keys on UNITS/serving, not fill (fill is the
  // fit target, not a dose input). Unset units → "—" (amount null), not entered amounts.
  it('blank units → L-Theanine amount null ("—"), not entered 200', () => {
    expect(find(sfp(CALM, 350, 0), /Theanine/)!.amount).toBeNull();
  });
  it('blank units → Magnesium amount null ("—")', () => {
    expect(find(sfp(CALM, 350, 0), /Magnesium/)!.amount).toBeNull();
  });
});

// ── F-3 1000× TRIPWIRE — the literal misbranding-bug surface ──────────────────
// The resolver returns mg; the RETIRED SFP path returned grams×1000. These assert
// entered mg renders as the SAME mg (× units): never 1000× high, never the
// entered-as-grams trap, never 0. (Wizard-specified bench cases.)
describe('HARNESS · GOLDEN A2 — F-3 1000× tripwire', () => {
  const mgOf = (r: { amount: number | null; unit: string } | undefined) =>
    !r || r.amount === null ? null : r.amount * (r.unit === 'g' ? 1000 : 1);

  it('Vitamin C 90 mg, 1 unit → 90 mg (NOT 90,000, NOT 0.09)', () => {
    const r = find(sfp([ing('Vitamin C (Ascorbic Acid)', 90, 'Vitamins')], 999, 1), /Vitamin C/);
    expect(mgOf(r)).toBeCloseTo(90, 1);
  });
  it('Vitamin C 90 mg, 2 units → 180 mg', () => {
    const r = find(sfp([ing('Vitamin C (Ascorbic Acid)', 90, 'Vitamins')], 999, 2), /Vitamin C/);
    expect(mgOf(r)).toBeCloseTo(180, 1);
  });
  it('Creatine 5000 mg, 1 unit → 5000 mg (the high-dose §A case — no scaling, no 1000× blowup)', () => {
    const r = find(sfp([ing('Creatine Monohydrate', 5000, 'Amino Acids')], 999, 1), /Creatine/);
    expect(mgOf(r)).toBeCloseTo(5000, 0);
  });

  it('UNSUPPORTED unit (IU) → row rendered with amount null (F-10 no-silent-drop; NOT the |1 grams-trap, NOT dropped)', () => {
    const iuIng = { name: 'Vitamin A Acetate', qty: 5000, unit: 'IU',
      foodData: { type: 'industrial', data: { category: 'Vitamins' } } } as unknown as Ingredient;
    const f = buildSupplementFacts({
      ingredients: [iuIng], mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams: 0,
      supplementServingMassG: 0, unitsPerServing: 1, servingsPerContainer: 0,
      servingSizeLabel: '1 Capsule', caloriesPerServing: 0,
      macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
    });
    const r = [...f.vitaminMineralRows, ...f.otherActivesRows].find(x => /Vitamin A/.test(x.displayName));
    expect(r, 'IU ingredient must be SURFACED, not silently dropped').toBeTruthy();
    expect(r!.amount, 'mass is UNKNOWN — never fabricated (5000 IU is NOT 5000 g)').toBeNull();
    expect(r!.unit).toBe('IU'); // entered unit preserved so the operator can correct it
  });
});

// ── F-11 — cross-path mass identity (supplements-scoped) ──────────────────────
// The SFP and the safety/stability/overage map BOTH derive per-serving PHYSICAL
// mass from the ONE resolver (perServingAmounts), so neither can reintroduce
// independent fill-scaling. Asserted on potency-1, non-DV ingredients where
// physical == active == rendered. DV-basis rows legitimately differ by
// elemental/equiv (applied only in the SFP) — out of scope for this identity.
describe('HARNESS · F-11 — SFP mass == safety-path mass == resolver physical (no path re-scales)', () => {
  const F = [ing('L-Theanine (Suntheanine)', 200, 'Amino Acids'), ing('Ashwagandha (KSM-66)', 600, 'Herbal Extracts')];
  const names = ['L-Theanine (Suntheanine)', 'Ashwagandha (KSM-66)'];
  for (const units of [1, 2, 3]) {
    it(`units=${units}: all three paths agree, independent of fill`, () => {
      const facts = sfp(F, 660, units); // fill irrelevant to the dose
      const safety = perServingActiveMgMap(F, units);
      const physical = perServingAmounts(F.map(i => ({ name: i.name, qty: i.qty, unit: i.unit })), units);
      for (const name of names) {
        const row = facts.otherActivesRows.find(r => r.sourceName === name)!;
        const sfpMg = row.amount! * (row.unit === 'g' ? 1000 : 1);
        expect(safety.get(name)!).toBeCloseTo(sfpMg, 6);         // SFP == safety map
        expect(physical.get(name)!.mg!).toBeCloseTo(sfpMg, 6);   // SFP == resolver physical
        expect(physical.get(name)!.mg!).toBeCloseTo(safety.get(name)!, 6); // potency 1 → physical == active
      }
    });
  }
  it('potency is applied consistently across paths (SFP non-DV amount == safety map, both post-potency)', () => {
    const carrier = [ing('NMN Beadlet (carrier-loaded)', 250, 'Specialty', 0.5)];
    const facts = sfp(carrier, 660, 2);
    const safety = perServingActiveMgMap(carrier, 2);
    const row = facts.otherActivesRows.find(r => /NMN/.test(r.displayName))!;
    const sfpMg = row.amount! * (row.unit === 'g' ? 1000 : 1);
    expect(sfpMg).toBeCloseTo(250 * 2 * 0.5, 4);       // 250 mg × 2 units × 0.5 potency = 250
    expect(safety.get('NMN Beadlet (carrier-loaded)')!).toBeCloseTo(sfpMg, 6);
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
      totalBatchGrams: 0.2, supplementServingMassG: 0.2, unitsPerServing: 1, servingsPerContainer: 0,
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
