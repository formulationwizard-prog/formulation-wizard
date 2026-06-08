// ============================================================
// HARNESS — claims surface (21 CFR 101.93 / DSHEA). Spec §5: gate-verdict coverage.
// ------------------------------------------------------------
// The claims module is word-boundary-matched, cited, gated (audit-confirmed). This
// harness locks the GATE VERDICT by tier (the per-rule override: disease/drug-claim →
// hard-stop, caution → advisory), the disclaimer singular/plural router (101.93(c)),
// and the presence of the per-claim override notes. See docs/audits/cfr-101-93-claims-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { analyzeDraftClaim, evaluateDiseaseClaimGate, detectStructureFunctionClaims } from '../supplementClaims';
import { selectSupplementDisclaimer } from '../supplementDisclaimer';

const gate = (text: string) => evaluateDiseaseClaimGate(analyzeDraftClaim(text));

describe('HARNESS · #4 claims — disease-claim gate verdict by tier (101.93(g) / FDCA §201(g)(1)(C))', () => {
  it('disease tier ("treats cancer") → hard-stop', () => {
    expect(gate('this treats cancer').hardStop).toBe(true);
  });
  it('drug-claim tier ("prevents…") → hard-stop', () => {
    expect(gate('prevents the flu').hardStop).toBe(true);
  });
  it('caution tier ("immune booster") → NOT hard-stop (FTC puffery bar ≠ DSHEA hard-stop bar)', () => {
    const flags = analyzeDraftClaim('the ultimate immune booster');
    expect(flags.some(f => f.tier === 'caution')).toBe(true);
    expect(evaluateDiseaseClaimGate(flags).hardStop).toBe(false);
  });
  it('compliant structure/function ("supports immune function") → gate clear', () => {
    expect(gate('supports immune function').hardStop).toBe(false);
  });
});

describe('HARNESS · #4 claims — DSHEA disclaimer router (101.93(c)(1)/(c)(2))', () => {
  it('1 claim → singular (c)(1) "This statement…"', () => {
    expect(selectSupplementDisclaimer(1)).toMatch(/^This statement has not been evaluated/);
  });
  it('2+ claims → plural (c)(2) "These statements…"', () => {
    expect(selectSupplementDisclaimer(2)).toMatch(/^These statements have not been evaluated/);
  });
  it('0 claims → no disclaimer (no structure/function claim made)', () => {
    expect(selectSupplementDisclaimer(0)).toBe('');
  });
});

describe('HARNESS · #4 claims — per-claim override notes (the B6-analog: per-ingredient restriction)', () => {
  it('Ashwagandha entry carries the "do not claim reduces cortisol" restriction', () => {
    const a = detectStructureFunctionClaims(['Ashwagandha (KSM-66)']).find(c => /Ashwagandha/.test(c.ingredient))!;
    expect(a.note).toMatch(/cortisol/i);
  });
  it('Omega-3 entry restricts heart-disease-prevention language', () => {
    const o = detectStructureFunctionClaims(['Fish Oil (EPA/DHA)']).find(c => /Omega-3/.test(c.ingredient))!;
    expect(o.note).toMatch(/heart disease|cardiovascular/i);
  });
});
