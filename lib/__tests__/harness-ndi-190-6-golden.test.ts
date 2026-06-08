// ============================================================
// HARNESS — NDI surface (DSHEA §8 / 21 U.S.C. 350b / 21 CFR 190.6). Spec §5.
// ------------------------------------------------------------
// 5-state classification (grandfathered / notified / gras-food / required / unknown),
// word-boundary matched (Wave 1.5d choline-overgeneralization fix). This harness locks
// the verdict per state + the per-ingredient OVERRIDES: choline standalone-token (compound
// forms don't inherit the parent's grandfathered status) and Vitamin-D source-independence
// (lichen D3 inherits ODI — source ≠ chemical alteration). See docs/audits/ndi-190-6-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { classifyIngredientNDI, analyzeNDI } from '../supplementNDI';

const status = (name: string) => classifyIngredientNDI(name).status;

describe('HARNESS · #6 NDI — classification verdict (DSHEA §8 / 21 CFR 190.6)', () => {
  it('grandfathered ODI (Vitamin C) → grandfathered', () => {
    expect(status('Vitamin C (Ascorbic Acid)')).toBe('grandfathered');
  });
  it('notified NDI (L-Theanine Suntheanine) → notified', () => {
    expect(status('L-Theanine (Suntheanine)')).toBe('notified');
  });
  it('GRAS food article (Ginger Root) → gras-food', () => {
    expect(status('Ginger Root Powder')).toBe('gras-food');
  });
  it('required / HIGH-RISK (NMN — excluded per DSHEA §201(ff)(3)(B)) → required + hasRisk', () => {
    expect(status('NMN (Nicotinamide Mononucleotide)')).toBe('required');
    expect(analyzeNDI(['NMN']).hasRisk).toBe(true);
  });
  it('unknown (not in table) → unknown, safe-default "verify independently" advisory', () => {
    const f = classifyIngredientNDI('Exotic-Novel-Compound-XYZ');
    expect(f.status).toBe('unknown');
    expect(f.advisory).toMatch(/verify compliance status independently/i);
  });
});

describe('HARNESS · #6 NDI — per-ingredient overrides (the B6-analog)', () => {
  // choline standalone-token: parent grandfathered; compound forms do NOT inherit it
  it('Choline Bitartrate → grandfathered (parent ODI)', () => {
    expect(status('Choline Bitartrate')).toBe('grandfathered');
  });
  it('Phosphatidylcholine → unknown (compound form does NOT inherit grandfathered — standalone-token)', () => {
    expect(status('Phosphatidylcholine')).toBe('unknown');
  });
  // Vitamin-D source-independence: a different SOURCE is not a chemical alteration
  it('Vitamin D3 Vegan (Lichen-Sourced) → grandfathered (source-independent ODI)', () => {
    expect(status('Vitamin D3 Vegan (Lichen-Sourced)')).toBe('grandfathered');
  });
});
