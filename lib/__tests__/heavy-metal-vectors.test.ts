// Heavy-metal vector classifier tests (Rulebook §I.5a). Covers verified
// pattern matches, the bench-tested false-positive fix (marine collagen → NOT
// Hg), and override precedence. First-pass per-class metal sets are refined
// with Nate; these lock the structural behavior + the known FP.
import { describe, it, expect } from 'vitest';
import { classifyHeavyMetalVectors, assessHeavyMetalVectors } from '../heavyMetalVectors';
import type { IndustrialIngredient } from '../../types';

const mk = (over: Partial<IndustrialIngredient>): IndustrialIngredient => ({
  name: '', category: '', suppliers: [], subIngredients: [], allergens: [],
  costPerKg: 0, nutrition: {}, notes: '', ...over,
});

describe('heavy-metal vector classifier (§I.5a)', () => {
  it('flags rice-derived as As', () => {
    expect(classifyHeavyMetalVectors(mk({ name: 'Rice Flour (Fine, Excipient Grade)', category: 'Excipients', subIngredients: ['Rice Flour'] }))).toContain('As');
  });

  it('flags broad categories (Botanicals) for Pb/As/Cd', () => {
    const m = classifyHeavyMetalVectors(mk({ name: 'Garlic Extract', category: 'Botanicals' }));
    expect(m).toEqual(expect.arrayContaining(['Pb', 'As', 'Cd']));
  });

  it('flags all minerals (source-rock contamination)', () => {
    expect(classifyHeavyMetalVectors(mk({ name: 'Calcium Carbonate (USP, Limestone)', category: 'Minerals' })).length).toBeGreaterThan(0);
  });

  it('flags fish oil as Hg', () => {
    expect(classifyHeavyMetalVectors(mk({ name: 'Fish Oil 18/12 (EPA/DHA, Triglyceride)', category: 'Omega-3s', subIngredients: ['Refined Fish Oil'] }))).toContain('Hg');
  });

  it('flags kelp as an arsenic vector', () => {
    expect(classifyHeavyMetalVectors(mk({ name: 'Kelp (Ascophyllum nodosum, Iodine Source)', category: 'Minerals', subIngredients: ['Kelp'] }))).toContain('As');
  });

  // Bench-test 2026-06-17 false-positive fix:
  it('does NOT flag marine collagen as Hg (connective tissue is low-Hg)', () => {
    const m = classifyHeavyMetalVectors(mk({ name: 'Marine Collagen Peptides Type I (Fish, Hydrolyzed)', category: 'Specialty Compounds', subIngredients: ['Marine Collagen Peptides'] }));
    expect(m).not.toContain('Hg');
  });

  it('does NOT flag a synthetic vitamin with no vector signal', () => {
    expect(classifyHeavyMetalVectors(mk({ name: 'Pyridoxine HCl (USP, Tier-B)', category: 'Vitamins', subIngredients: ['Pyridoxine Hydrochloride'] }))).toEqual([]);
  });

  describe('override precedence (assessHeavyMetalVectors)', () => {
    it('verified-clean → [] with a distinct positive basis', () => {
      const a = assessHeavyMetalVectors(mk({ name: 'Garlic Extract', category: 'Botanicals', heavyMetalsVectorOverride: 'verified-clean' }));
      expect(a.metals).toEqual([]);
      expect(a.basis).toBe('override-verified-clean');
    });

    it('explicit array overrides the classifier', () => {
      const a = assessHeavyMetalVectors(mk({ name: 'Garlic Extract', category: 'Botanicals', heavyMetalsVectorOverride: ['Pb'] }));
      expect(a.metals).toEqual(['Pb']);
      expect(a.basis).toBe('override');
    });

    it('no override → classifier basis when flagged', () => {
      const a = assessHeavyMetalVectors(mk({ name: 'Garlic Extract', category: 'Botanicals' }));
      expect(a.basis).toBe('classifier');
      expect(a.metals.length).toBeGreaterThan(0);
    });

    it('no override + no signal → basis none', () => {
      const a = assessHeavyMetalVectors(mk({ name: 'L-Theanine (Suntheanine)', category: 'Amino Acids', subIngredients: ['L-Theanine'] }));
      expect(a.metals).toEqual([]);
      expect(a.basis).toBe('none');
    });
  });
});
