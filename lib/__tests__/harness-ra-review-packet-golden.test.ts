// ============================================================
// HARNESS — RA-review packet (#18). Spec §5.
// ------------------------------------------------------------
// Composes the verified surfaces into the reviewer bundle. Uses the REAL surface
// functions (end-to-end), then asserts the roll-up: clean → ready-for-review;
// disease claim / banned → has-hard-stops; NDI-required → attention + sign-off.
// See docs/audits/ra-review-packet-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { buildRAReviewPacket, type RAReviewPacketInput } from '../raReviewPacket';
import { analyzeNDI } from '../supplementNDI';
import { checkSupplementSafety } from '../supplementSafetyLimits';
import { detectAllergensDetailed, evaluateAllergenGate } from '../supplementAllergen';
import { analyzeDraftClaim, evaluateDiseaseClaimGate } from '../supplementClaims';
import { assessProducibility } from '../servingModel';
import { determineFilingRequirement } from '../scheduledProcess';
import type { Ingredient } from '../../types';

const ing = (name: string): Ingredient =>
  ({ name, qty: 0, unit: 'mg', foodData: { type: 'industrial', data: {} } } as unknown as Ingredient);

// Clean Calm & Sleep-like input — all surfaces computed via the real functions.
function cleanInput(): RAReviewPacketInput {
  const names = ['Magnesium Glycinate', 'L-Theanine (Suntheanine)', 'Ashwagandha (KSM-66)'];
  const ings = names.map(ing);
  const pm = new Map(names.map(n => [n, 50])); // 50 mg each — within UL
  return {
    formulaName: 'Calm & Sleep', productClass: 'Dietary Supplement',
    safetyFindings: checkSupplementSafety(ings, pm, 'general'),
    ndiSummary: analyzeNDI(names),
    allergenMatches: [],
    allergenGate: evaluateAllergenGate({ allergenMatches: [] }),
    diseaseClaimGate: evaluateDiseaseClaimGate(analyzeDraftClaim('supports relaxation and restful sleep')),
    overageSummary: { bottleneck: null, worstLossPct: 0, rows: [] },
    producibility: assessProducibility({ form: 'capsule', totalMassG: 0.7, totalUnits: 2, capacityMg: 680 }),
    determination: determineFilingRequirement(null, {}, 'supplements'),
  };
}

describe('HARNESS · #18 RA-review packet — composition + verdict roll-up', () => {
  it('clean formula → ready-for-review, 0 hard-stops, 7 sections', () => {
    const p = buildRAReviewPacket(cleanInput());
    expect(p.overallState).toBe('ready-for-review');
    expect(p.hardStopCount).toBe(0);
    expect(p.sections).toHaveLength(7);
  });

  it('every section carries an authority; packet carries the not-legal-advice disclaimer', () => {
    const p = buildRAReviewPacket(cleanInput());
    expect(p.sections.every(s => s.authority.length > 0)).toBe(true);
    expect(p.sections.every(s => Array.isArray(s.citations))).toBe(true);
    expect(p.disclaimer).toMatch(/not legal or definitive regulatory advice/i);
  });

  it('disease-claim language → claims hard-stop → has-hard-stops', () => {
    const input = { ...cleanInput(), diseaseClaimGate: evaluateDiseaseClaimGate(analyzeDraftClaim('treats cancer and cures diabetes')) };
    const p = buildRAReviewPacket(input);
    expect(p.overallState).toBe('has-hard-stops');
    expect(p.sections.find(s => s.id === 'claims')!.verdict).toBe('hard-stop');
    expect(p.hardStopCount).toBeGreaterThanOrEqual(1);
  });

  it('NDI required (NMN) → ndi section = attention + needs reviewer sign-off', () => {
    const sec = buildRAReviewPacket({ ...cleanInput(), ndiSummary: analyzeNDI(['NMN']) }).sections.find(s => s.id === 'ndi')!;
    expect(sec.verdict).toBe('attention');
    expect(sec.needsReviewerSignoff).toBe(true);
  });

  it('allergen present, species-named (no violation) → advisory with Contains statement', () => {
    const matches = detectAllergensDetailed('almond extract, milk powder');
    const sec = buildRAReviewPacket({ ...cleanInput(), allergenMatches: matches, allergenGate: evaluateAllergenGate({ allergenMatches: matches }) })
      .sections.find(s => s.id === 'allergen')!;
    expect(sec.verdict).toBe('advisory');
    expect(sec.summary).toMatch(/Contains:/);
  });

  it('determination section always requests reviewer sign-off (PA gate)', () => {
    expect(buildRAReviewPacket(cleanInput()).sections.find(s => s.id === 'determination')!.needsReviewerSignoff).toBe(true);
  });

  // Unit C — unverified catalog-default allergen declarations surface to the reviewer.
  it('unverified allergen declarations → named in the allergen section + needs reviewer sign-off', () => {
    const sec = buildRAReviewPacket({ ...cleanInput(), unverifiedAllergenDeclarations: ['Lactobacillus acidophilus NCFM'] })
      .sections.find(s => s.id === 'allergen')!;
    expect(sec.summary).toMatch(/pending supplier COA verification: Lactobacillus acidophilus NCFM/);
    expect(sec.needsReviewerSignoff).toBe(true); // unverified → reviewer must confirm
  });

  it('no unverified declarations → no unverified note, no sign-off (clean allergen section)', () => {
    const sec = buildRAReviewPacket(cleanInput()).sections.find(s => s.id === 'allergen')!;
    expect(sec.summary).not.toMatch(/pending supplier COA verification:/);
    expect(sec.needsReviewerSignoff).toBe(false);
  });
});
