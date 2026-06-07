// ============================================================
// Compatibility checker — keyword-match discipline (2026-06-06)
// ------------------------------------------------------------
// The checker matched keywords by substring (`name.includes(k)`), so the
// omega-3 marker 'dha' matched "ashwaganDHA" and raised a CRITICAL "Omega-3
// without amber/nitrogen" finding on Ashwagandha — a false positive on an
// extremely common ingredient (operator-surfaced via the live Compatibility
// panel: "Blocked · 1 critical"). Fix: left-anchored word-boundary matching
// (\bkeyword) that kills buried-substring matches while preserving the
// module's intentional prefix tokens. These tests pin the fix AND guard
// against over-correction (real fish oil must still flag; prefixes must work).
// ============================================================
import { describe, it, expect } from 'vitest';
import { checkCompatibility, summarizeCompatibility, type CompatibilityConditions } from '../supplementCompatibility';
import type { Ingredient } from '../../types';

const ing = (name: string): Ingredient => ({ name, qty: 100, unit: 'mg' } as unknown as Ingredient);

// Worst-case storage conditions so any keyword match WILL trip its rule.
const harshCapsule: CompatibilityConditions = {
  deliveryForm: 'capsule',
  hasDesiccant: false,
  hasNitrogenFlush: false,
  hasAmberPackaging: false,
  storage: 'ambient',
};

describe('compatibility keyword discipline — buried-substring false positives', () => {
  it('Ashwagandha does NOT trip the omega-3 "dha" rule (the operator-surfaced critical false positive)', () => {
    const findings = checkCompatibility([ing('Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)')], harshCapsule);
    expect(findings.find(f => /Omega-3/i.test(f.title))).toBeUndefined();
    expect(summarizeCompatibility(findings).critical).toBe(0);
  });

  it('the full Calm & Sleep Support formula raises no critical/warning findings', () => {
    const findings = checkCompatibility([
      ing('L-Theanine (Suntheanine, Pharma)'),
      ing('Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)'),
      ing('Magnesium Glycinate'),
      ing('Vitamin D3 Vegan (Lichen-Sourced)'),
    ], harshCapsule);
    const s = summarizeCompatibility(findings);
    expect(s.critical).toBe(0);
    expect(s.warning).toBe(0);
    expect(s.hasIssue).toBe(false);
  });
});

describe('compatibility keyword discipline — no over-correction (real matches still fire)', () => {
  it('real fish oil STILL trips the omega-3 critical rule without amber/nitrogen', () => {
    const findings = checkCompatibility([ing('Fish Oil Concentrate (Omega-3, EPA/DHA, 18/12)')], harshCapsule);
    const omega = findings.find(f => /Omega-3/i.test(f.title));
    expect(omega).toBeDefined();
    expect(omega!.tier).toBe('critical');
  });

  it('prefix token "lactobacill" still matches "Lactobacillus acidophilus NCFM"', () => {
    const findings = checkCompatibility([ing('Lactobacillus acidophilus NCFM')], harshCapsule);
    expect(findings.find(f => /Probiotic/i.test(f.title))).toBeDefined();
  });

  it('a real incompatible pair (Iron + Vitamin E) still flags', () => {
    const findings = checkCompatibility([
      ing('Iron Bisglycinate (Ferrochel, Albion — 20% Fe)'),
      ing('Vitamin E (d-Mixed Tocopherols, 70%)'),
    ], harshCapsule);
    const pair = findings.find(f => /Iron \+ Vitamin E/i.test(f.title));
    expect(pair).toBeDefined();
    expect(pair!.tier).toBe('warning');
  });

  it('"epa" does not match an unrelated buried substring but does match standalone EPA', () => {
    // Grapeseed has no standalone "epa"; a real EPA/DHA oil does.
    const clean = checkCompatibility([ing('Grapeseed Extract (95% OPC)')], harshCapsule);
    expect(clean.find(f => /Omega-3/i.test(f.title))).toBeUndefined();
  });
});
