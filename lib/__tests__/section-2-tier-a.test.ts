// ============================================================
// Section 2 — Tier A regression fixtures (Round 10)
// ------------------------------------------------------------
// Verifies the four positive + two negative canonical fixtures
// from docs/rounds/round-10-directive.md Section 5. Acceptance
// criterion: Section 2 is not complete until ALL six fixtures
// pass — positive cases produce CALCULATED pH within bounds;
// negative cases produce ESTIMATED (NOT CALCULATED) via Rules
// A/B fallback.
//
// Pre-fix (2026-05-14 bench test) the engine reported pH 4.20 ±
// 0.20 on the 1% citric case — a 2-pH-unit error (100x in [H+]).
// These tests guard against regression of that flaw direction
// AND against the inverse failure mode (naive H-H on multi-acid
// or buffered systems producing confidently-wrong CALCULATED).
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  computeSingleAcidPH,
  estimateSpecs,
  type SpecInputIngredient,
} from '../foodScience';

describe('Section 2 — Tier A single-acid Henderson-Hasselbalch', () => {

  // ─── Positive cases (Rules A and B clear; output CALCULATED) ───
  describe('positive cases — Rules A/B clear, output CALCULATED', () => {

    it('1% citric anhydrous + 99% water → pH 2.20 ± 0.05, CALCULATED', () => {
      const ingredients: SpecInputIngredient[] = [
        { name: 'Citric Acid (Anhydrous)', qty: 1, unit: 'g' },
        { name: 'Water', qty: 99, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('applied');
      if (result.kind !== 'applied') return;
      expect(result.confidence).toBe('calculated');
      expect(result.pH).toBeGreaterThanOrEqual(2.15);
      expect(result.pH).toBeLessThanOrEqual(2.25);
      expect(result.acidName).toBe('Citric Acid (Anhydrous)');
    });

    it('0.5% citric + 99.5% water → pH 2.36 ± 0.05, CALCULATED', () => {
      const ingredients: SpecInputIngredient[] = [
        { name: 'Citric Acid (Anhydrous)', qty: 0.5, unit: 'g' },
        { name: 'Water', qty: 99.5, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('applied');
      if (result.kind !== 'applied') return;
      expect(result.confidence).toBe('calculated');
      expect(result.pH).toBeGreaterThanOrEqual(2.31);
      expect(result.pH).toBeLessThanOrEqual(2.41);
    });

    it('0.1% citric + 99.9% water → pH 2.71 ± 0.10, CALCULATED (approximation widens at very dilute)', () => {
      const ingredients: SpecInputIngredient[] = [
        { name: 'Citric Acid (Anhydrous)', qty: 0.1, unit: 'g' },
        { name: 'Water', qty: 99.9, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('applied');
      if (result.kind !== 'applied') return;
      expect(result.confidence).toBe('calculated');
      expect(result.pH).toBeGreaterThanOrEqual(2.61);
      expect(result.pH).toBeLessThanOrEqual(2.81);
    });

    it('1% acetic glacial + 99% water → pH 2.77 ± 0.05, CALCULATED', () => {
      const ingredients: SpecInputIngredient[] = [
        { name: 'Acetic Acid (Glacial Food Grade)', qty: 1, unit: 'g' },
        { name: 'Water', qty: 99, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('applied');
      if (result.kind !== 'applied') return;
      expect(result.confidence).toBe('calculated');
      expect(result.pH).toBeGreaterThanOrEqual(2.72);
      expect(result.pH).toBeLessThanOrEqual(2.82);
      expect(result.acidName).toBe('Acetic Acid (Glacial Food Grade)');
    });
  });

  // ─── Negative cases (Rules A/B decline; legacy pH, ESTIMATED cap) ───
  describe('negative cases — Rules A/B decline H-H, output ESTIMATED', () => {

    it('1% citric + 1% acetic + 98% water → Rule A multi-acid fallback', () => {
      const ingredients: SpecInputIngredient[] = [
        { name: 'Citric Acid (Anhydrous)', qty: 1, unit: 'g' },
        { name: 'Acetic Acid (Glacial Food Grade)', qty: 1, unit: 'g' },
        { name: 'Water', qty: 98, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('fallback');
      if (result.kind !== 'fallback') return;
      expect(result.reason).toBe('multi-acid');
    });

    it('ketchup formulation (vinegar + tomato paste + sugar + water + salt) → Rule B known-buffering fallback', () => {
      // Commercial-realistic ketchup composition:
      //   30% tomato paste, 10% distilled white vinegar, 22% sugar,
      //   35% water, 3% salt. Tomato paste flagged known-buffering.
      const ingredients: SpecInputIngredient[] = [
        { name: 'Tomato Paste (28-30 Brix)', qty: 30, unit: 'g' },
        { name: 'Distilled White Vinegar (100 Grain / 10%)', qty: 10, unit: 'g' },
        { name: 'Granulated Sugar (Sucrose)', qty: 22, unit: 'g' },
        { name: 'Water', qty: 35, unit: 'g' },
        { name: 'Salt', qty: 3, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('fallback');
      if (result.kind !== 'fallback') return;
      expect(result.reason).toBe('known-buffering');
    });
  });

  // ─── not-applicable cases (no pKa-tagged acid, Tier A doesn't fire) ───
  describe('not-applicable cases — no pKa-tagged acid, Tier A defers to legacy math', () => {

    it('water only → not-applicable (no acid)', () => {
      const ingredients: SpecInputIngredient[] = [
        { name: 'Water', qty: 100, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('not-applicable');
    });

    it('GDL + water → not-applicable (GDL intentionally untagged; hydrolysis kinetics violate H-H static equilibrium)', () => {
      const ingredients: SpecInputIngredient[] = [
        { name: 'Gluconic Acid (Glucono-Delta-Lactone, GDL)', qty: 1, unit: 'g' },
        { name: 'Water', qty: 99, unit: 'g' },
      ];
      const result = computeSingleAcidPH(ingredients, 100);
      expect(result.kind).toBe('not-applicable');
    });

    it('empty formulation → not-applicable', () => {
      const result = computeSingleAcidPH([], 0);
      expect(result.kind).toBe('not-applicable');
    });
  });
});

// ─── Integration through estimateSpecs ───
// Verifies the Tier A override threads correctly through the
// FormulationSpecs return shape — pH value AND confidence both
// reflect the Tier A outcome.
describe('Section 2 — Tier A integration via estimateSpecs', () => {

  it('1% citric anhydrous + 99% water → specs.pH within 2.15-2.25, confidence.pH = calculated', () => {
    const ingredients: SpecInputIngredient[] = [
      { name: 'Citric Acid (Anhydrous)', qty: 1, unit: 'g' },
      { name: 'Water', qty: 99, unit: 'g' },
    ];
    const specs = estimateSpecs(ingredients);
    expect(specs.pH).toBeGreaterThanOrEqual(2.15);
    expect(specs.pH).toBeLessThanOrEqual(2.25);
    expect(specs.confidence.pH).toBe('calculated');
  });

  it('1% acetic glacial + 99% water → specs.pH within 2.72-2.82, confidence.pH = calculated', () => {
    const ingredients: SpecInputIngredient[] = [
      { name: 'Acetic Acid (Glacial Food Grade)', qty: 1, unit: 'g' },
      { name: 'Water', qty: 99, unit: 'g' },
    ];
    const specs = estimateSpecs(ingredients);
    expect(specs.pH).toBeGreaterThanOrEqual(2.72);
    expect(specs.pH).toBeLessThanOrEqual(2.82);
    expect(specs.confidence.pH).toBe('calculated');
  });

  it('1% citric + 1% acetic + 98% water → confidence.pH = estimated (Rule A cap)', () => {
    const ingredients: SpecInputIngredient[] = [
      { name: 'Citric Acid (Anhydrous)', qty: 1, unit: 'g' },
      { name: 'Acetic Acid (Glacial Food Grade)', qty: 1, unit: 'g' },
      { name: 'Water', qty: 98, unit: 'g' },
    ];
    const specs = estimateSpecs(ingredients);
    expect(specs.confidence.pH).toBe('estimated');
  });

  it('ketchup → confidence.pH = estimated (Rule B cap)', () => {
    const ingredients: SpecInputIngredient[] = [
      { name: 'Tomato Paste (28-30 Brix)', qty: 30, unit: 'g' },
      { name: 'Distilled White Vinegar (100 Grain / 10%)', qty: 10, unit: 'g' },
      { name: 'Granulated Sugar (Sucrose)', qty: 22, unit: 'g' },
      { name: 'Water', qty: 35, unit: 'g' },
      { name: 'Salt', qty: 3, unit: 'g' },
    ];
    const specs = estimateSpecs(ingredients);
    expect(specs.confidence.pH).toBe('estimated');
  });

  it('pre-fix regression guard — 1% citric should NOT report pH 4.20 (the documented bench-test failure)', () => {
    // Round 10 Section 2 acceptance criterion: pre-fix engine reports
    // pH 4.20 ± 0.20 on 1% citric + water (documented 2026-05-14 bench
    // test). Tier A H-H replacement must NOT produce this value.
    const ingredients: SpecInputIngredient[] = [
      { name: 'Citric Acid (Anhydrous)', qty: 1, unit: 'g' },
      { name: 'Water', qty: 99, unit: 'g' },
    ];
    const specs = estimateSpecs(ingredients);
    expect(specs.pH).toBeLessThan(3.0); // pre-fix would be ~4.20
  });
});
