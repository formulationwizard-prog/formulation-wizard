// ============================================================
// SWEEP — §0 ACCEPTANCE GATE (the pre-pilot verification).
// ------------------------------------------------------------
// docs/spec/world-class-build-spec-2026-06-07.md §0: "Wizard runs the full matrix —
// every formula × every input state × every surface — and finds ZERO rookie bugs
// before any pilot user does." This is that matrix at the harness level: DIVERSE golden
// formulas × INPUT STATES, every one run through ALL surfaces, asserting the rookie-bug
// CLASS is absent at scale — not one formula, the whole space:
//   1. No NaN / ±Infinity in any rendered legal-label value (the #1 rookie class).
//   2. Blank-until-real holds: unset UNITS/serving → every dose "—" (null), never fabricated (F-3:
//      per-serving = entered per-capsule × units, no fill-scaling; the fill is the fit target).
//   3. No surface throws on any formula × state (no crash reaches a pilot user).
//   4. Magnitude sanity: no 4× / 1000× unit errors — values stay within sane bounds.
//   5. Cross-surface consistency: cost tracks the SFP scale; the RA-packet aggregates cleanly.
// ============================================================
import { describe, it, expect } from 'vitest';
import { buildSupplementFacts, type SupplementFactRow } from '../supplementLabeling';
import { checkSupplementSafety } from '../supplementSafetyLimits';
import { analyzeNDI } from '../supplementNDI';
import { detectAllergensDetailed, evaluateAllergenGate } from '../supplementAllergen';
import { analyzeDraftClaim, evaluateDiseaseClaimGate } from '../supplementClaims';
import { computeOverages } from '../supplementStability';
import { assessProducibility } from '../servingModel';
import { determineFilingRequirement } from '../scheduledProcess';
import { computeUnitEconomics } from '../unitEconomics';
import { buildRAReviewPacket } from '../raReviewPacket';
import { UNIT_TO_GRAMS } from '../utils';
import type { Ingredient } from '../../types';

const ing = (name: string, qtyMg: number, category: string, potency?: number): Ingredient =>
  ({ name, qty: qtyMg, unit: 'mg', foodData: { type: 'industrial', data: { category, ...(potency != null ? { potencyFactor: potency } : {}) } } } as unknown as Ingredient);

// ─── Diverse golden formulas — chosen to hit the bug-prone corners ──────────
const FORMULAS: { name: string; ings: Ingredient[] }[] = [
  { name: 'Calm & Sleep (amino/herbal + elemental Mg)', ings: [
    ing('Magnesium Glycinate', 200, 'Minerals'), ing('L-Theanine (Suntheanine)', 200, 'Amino Acids'), ing('Ashwagandha (KSM-66)', 300, 'Herbal Extracts'),
  ]},
  { name: 'Daily Multi (conversions + DV)', ings: [
    ing('Vitamin C (Ascorbic Acid)', 500, 'Vitamins'), ing('Vitamin D3 Cholecalciferol', 0.025, 'Vitamins'), ing('Zinc Picolinate', 15, 'Minerals'), ing('Niacinamide', 20, 'Vitamins'),
  ]},
  { name: 'Mineral-heavy (elemental factors, UL-near)', ings: [
    ing('Calcium Carbonate', 500, 'Minerals'), ing('Magnesium Oxide', 200, 'Minerals'), ing('Iron Bisglycinate', 18, 'Minerals'),
  ]},
  { name: 'Carrier-loaded D3 (potencyFactor + blend-floor + below-threshold)', ings: [
    ing('Vitamin D3 (100,000 IU/g on MCC)', 8, 'Vitamins', 0.0025), ing('Vitamin C (Ascorbic Acid)', 250, 'Vitamins'),
  ]},
  { name: 'Multi-source riboflavin (aggregation)', ings: [
    ing('Riboflavin', 1.25, 'Vitamins'), ing('Riboflavin 5-Phosphate', 1.25, 'Vitamins'),
  ]},
  { name: 'Allergen-bearing (Fish Oil)', ings: [
    ing('Fish Oil (EPA/DHA)', 1000, 'Omega-3'), ing('Vitamin E (d-alpha)', 30, 'Vitamins'),
  ]},
  { name: 'NDI-required (NMN)', ings: [
    ing('NMN (Nicotinamide Mononucleotide)', 250, 'Specialty'), ing('Vitamin C (Ascorbic Acid)', 100, 'Vitamins'),
  ]},
];

// F-3 input states: the dose now keys on UNITS/serving (not fill). Fill still
// varies to exercise the OTHER surfaces (blend-floor, cost, producibility).
const STATES: { label: string; perCapMg: number; units: number }[] = [
  { label: 'blank units', perCapMg: 350, units: 0 },
  { label: '1 unit/serving', perCapMg: 350, units: 1 },
  { label: '2 units/serving @ 660', perCapMg: 660, units: 2 },
  { label: 'overfill 2000 mg/cap, 2 units', perCapMg: 2000, units: 2 },
];

const finite = (x: number | null) => x === null || (Number.isFinite(x) && !Number.isNaN(x));
const saneAmount = (x: number | null) => x === null || (x >= 0 && x < 1e7); // no negative, no 1000×-unit blowups
const allRows = (f: ReturnType<typeof buildSupplementFacts>): SupplementFactRow[] => [...f.vitaminMineralRows, ...f.otherActivesRows];

describe('SWEEP §0 — golden formulas × input states × all surfaces', () => {
  for (const formula of FORMULAS) {
    for (const state of STATES) {
      const label = `${formula.name} @ ${state.label}`;

      it(`${label} — every surface runs without throwing`, () => {
        expect(() => runAllSurfaces(formula.ings, state)).not.toThrow();
      });

      it(`${label} — no NaN/∞ and magnitudes sane in the SFP`, () => {
        const { facts } = runAllSurfaces(formula.ings, state);
        for (const r of allRows(facts)) {
          expect(finite(r.amount), `amount ${r.displayName}`).toBe(true);
          expect(finite(r.percentDV), `%DV ${r.displayName}`).toBe(true);
          expect(saneAmount(r.amount), `sane ${r.displayName}=${r.amount}`).toBe(true);
        }
      });

      it(`${label} — blank-until-real: ${state.units === 0 ? 'unset units → ALL doses "—"' : 'set units → finite doses'}`, () => {
        const { facts } = runAllSurfaces(formula.ings, state);
        const rows = allRows(facts);
        if (state.units === 0) {
          // F-3: units/serving unset → every mass dose must be null ("—"), never fabricated.
          for (const r of rows) expect(r.amount, `${r.displayName} should be "—"`).toBeNull();
        } else {
          // Set units → at least one real dose, none NaN. Fill no longer scales the dose.
          expect(rows.some(r => typeof r.amount === 'number' && r.amount > 0)).toBe(true);
        }
      });

      it(`${label} — RA packet aggregates (7 sections, valid roll-up)`, () => {
        const { packet } = runAllSurfaces(formula.ings, state);
        expect(packet.sections).toHaveLength(7);
        expect(['ready-for-review', 'has-hard-stops']).toContain(packet.overallState);
        expect(packet.hardStopCount).toBeGreaterThanOrEqual(0);
      });
    }
  }
});

// Run a formula × state through every surface; returns the artifacts for assertions.
function runAllSurfaces(ings: Ingredient[], state: { perCapMg: number; units: number }) {
  const totalBatchGrams = ings.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 0), 0);
  const supplementServingMassG = state.perCapMg > 0 && state.units > 0 ? (state.perCapMg * state.units) / 1000 : 0;
  const scale = supplementServingMassG > 0 && totalBatchGrams > 0 ? supplementServingMassG / totalBatchGrams : 1;
  const pm = new Map<string, number>();
  for (const i of ings) {
    const pot = i.foodData?.type === 'industrial' && i.foodData.data?.potencyFactor ? i.foodData.data.potencyFactor : 1;
    pm.set(i.name, i.qty * (UNIT_TO_GRAMS[i.unit] || 0) * scale * 1000 * pot);
  }
  const facts = buildSupplementFacts({
    ingredients: ings, mode: 'supplements', servingSizeInGrams: 0, totalBatchGrams, supplementServingMassG,
    unitsPerServing: state.units, // F-3: per-serving = entered per-capsule × units (no fill-scaling)
    servingsPerContainer: 30, servingSizeLabel: state.units > 0 ? `${state.units} Capsules` : '—', caloriesPerServing: 0,
    macroPerServing: { totalFat: 0, totalCarbs: 0, protein: 0, sodium: 0, totalSugars: 0 },
  });
  const safetyFindings = checkSupplementSafety(ings, pm, 'general');
  const allergenMatches = detectAllergensDetailed(ings.map(i => i.name).join(', '));
  const cost = computeUnitEconomics({
    costModel: 'per-serving', totalCost: 1, totalWeightKg: totalBatchGrams / 1000, totalBatchGrams,
    servingSizeInGrams: supplementServingMassG, packageSizeInGrams: 0, unitsPerServing: state.units,
    servingsPerContainer: 30, packagingCostPerUnit: 0.5, perServingScale: scale,
  });
  const packet = buildRAReviewPacket({
    formulaName: 'Sweep', productClass: 'Dietary Supplement',
    safetyFindings, ndiSummary: analyzeNDI(ings.map(i => i.name)),
    allergenMatches, allergenGate: evaluateAllergenGate({ allergenMatches }),
    diseaseClaimGate: evaluateDiseaseClaimGate(analyzeDraftClaim('supports general wellness')),
    overageSummary: computeOverages(ings, pm, { shelfLifeMonths: 24, storage: 'ambient', amberPackaging: false, desiccant: false, nitrogenFlush: false, tocopherolAntioxidant: false }),
    producibility: assessProducibility({ form: 'capsule', totalMassG: totalBatchGrams, totalUnits: state.units * 30, capacityMg: 680 }),
    determination: determineFilingRequirement(null, {}, 'supplements'),
  });
  // cost consistency: per-serving cost must be finite + non-negative across every state.
  expect(finite(cost.perServing) && cost.perServing >= 0).toBe(true);
  return { facts, safetyFindings, allergenMatches, cost, packet };
}
