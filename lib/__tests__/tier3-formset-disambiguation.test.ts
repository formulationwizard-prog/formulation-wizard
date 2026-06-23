// Tier-3 force-pick disambiguation — C1 form-set engine (2026-06-22).
// Locks the bench-test invariants from the D3 green-light: a declared ambiguous
// BARE term force-picks; a specific form resolves directly; the collision-driven
// Tier-3 path stays distinct (regression). Scope:
// docs/architecture/tier3-disambiguation-engine-scope-2026-06-22.md.
import { describe, it, expect } from 'vitest';
import { findBestMatchWithTier } from '../parseFormula';
import { SUPPLEMENT_INGREDIENTS } from '../data/supplements';

const find = (n: string) => findBestMatchWithTier(n, SUPPLEMENT_INGREDIENTS);

describe('Tier-3 force-pick disambiguation (C1 form-sets)', () => {
  it('bare "Selenium" force-picks: tier 3, formSet present, no default, item null', () => {
    const r = find('Selenium');
    expect(r.tier).toBe(3);
    expect(r.formSet).toBeTruthy();
    expect(r.formSet?.default).toBeNull();
    expect(r.formSet?.forms.length).toBeGreaterThanOrEqual(4);
    expect(r.item).toBeNull();
  });

  it('"L-Selenomethionine" (specific form) does NOT force-pick', () => {
    expect(find('L-Selenomethionine').formSet).toBeUndefined();
  });

  it('"Selenium-enriched yeast" does NOT force-pick — exact-match on normalized key, not substring', () => {
    expect(find('Selenium-enriched yeast').formSet).toBeUndefined();
  });

  it('"Selenium 200mcg L-Selenomethionine USP" (dose + form) does NOT force-pick', () => {
    expect(find('Selenium 200mcg L-Selenomethionine USP').formSet).toBeUndefined();
  });

  it('bare "DHA" force-picks 4 sources, correct allergen markers, fish species sub-pick', () => {
    const fs = find('DHA').formSet!;
    expect(fs.forms.map(f => f.id)).toEqual(['o3-algal', 'o3-fish', 'o3-krill', 'o3-calamari']);
    expect(fs.forms.find(f => f.id === 'o3-algal')!.markers.some(mk => /allergen-free/.test(mk.generic))).toBe(true);
    const fish = fs.forms.find(f => f.id === 'o3-fish')!;
    expect(fish.markers.some(mk => mk.kind === 'allergen' && /Fish/.test(mk.generic))).toBe(true);
    expect(fish.subPick?.options).toContain('Anchovy');
    expect(fs.forms.find(f => f.id === 'o3-krill')!.markers.some(mk => /Crustacean/.test(mk.generic))).toBe(true);
    expect(fs.forms.find(f => f.id === 'o3-calamari')!.markers.some(mk => /Mollusk/.test(mk.generic))).toBe(true);
  });

  it('"EPA" and "Omega-3" alias to the same omega-3 force-pick', () => {
    expect(find('EPA').formSet?.term).toBe('dha');
    expect(find('Omega-3').formSet?.term).toBe('dha');
  });

  it('bare "Iodine" force-picks; kelp carries the triple-marker (COA + As + therapeutic-window)', () => {
    const kelp = find('Iodine').formSet?.forms.find(f => f.id === 'i-kelp')!;
    const kinds = kelp.markers.map(mk => mk.kind);
    expect(kinds).toContain('coaRequired');
    expect(kinds).toContain('infoFlag');         // arsenic vector
    expect(kinds).toContain('therapeuticWindow');
  });

  it('"Multi-Strain" / "Probiotic Blend" route to structuredCapture, NOT a form chooser', () => {
    for (const t of ['Multi-Strain', 'Probiotic Blend']) {
      const r = find(t);
      expect(r.tier).toBe(3);
      expect(r.formSet?.structuredCapture).toBe(true);
      expect(r.formSet?.forms.length).toBe(0);
    }
  });

  it('Tier-3 demand forms force-pick (D ×3 / E ×5 / B6 ×2)', () => {
    expect(find('Vitamin D').formSet?.forms.length).toBe(3);
    expect(find('Vitamin E').formSet?.forms.length).toBe(5);
    expect(find('Vitamin B6').formSet?.forms.length).toBe(2);
  });

  it('REGRESSION: collision-driven Tier-3 stays distinct — bare "Phosphatidylcholine" is tier 3 with NO formSet', () => {
    const r = find('Phosphatidylcholine');
    expect(r.tier).toBe(3);
    expect(r.formSet).toBeUndefined();
  });

  it('FORCE-PICK INVARIANT: no registered form-set has a silent default', () => {
    for (const t of ['Selenium', 'Iodine', 'DHA', 'Vitamin D', 'Vitamin C', 'Vitamin E', 'Vitamin B6', 'Ashwagandha']) {
      expect(find(t).formSet?.default).toBeNull();
    }
  });
});
