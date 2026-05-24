// ============================================================
// FDA Nutrition Facts rounding — 21 CFR 101.9(c) + 101.9(d)(7)(ii)
// ------------------------------------------------------------
// Source: operator's "Nutritional Calculator" rounding-rules sheet
// (2026-05-24) cross-referenced against 21 CFR 101.9. Locks the
// fix for fdaRoundPercentDV split into Macros (nearest 1%) vs
// Micros (2/5/10 graduated) per 101.9(d)(7)(ii).
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  fdaRoundCalories,
  fdaRoundFat,
  fdaRoundCholesterol,
  fdaRoundSodium,
  fdaRoundGrams,
  fdaRoundVitaminD,
  fdaRoundIron,
  fdaRoundCalcium,
  fdaRoundPotassium,
  fdaRoundPercentDVMacros,
  fdaRoundPercentDVMicros,
} from '../utils';

describe('fdaRoundCalories — <5=0, by 5 up to 50, by 10 above 50', () => {
  it('returns "0" below 5', () => {
    expect(fdaRoundCalories(0)).toBe('0');
    expect(fdaRoundCalories(4.9)).toBe('0');
  });
  it('rounds by 5 from 5 up to 50', () => {
    expect(fdaRoundCalories(5)).toBe('5');
    expect(fdaRoundCalories(7)).toBe('5');
    expect(fdaRoundCalories(8)).toBe('10');
    expect(fdaRoundCalories(49)).toBe('50');
  });
  it('rounds by 10 above 50', () => {
    expect(fdaRoundCalories(76.36)).toBe('80'); // operator example
    expect(fdaRoundCalories(224.59)).toBe('220');
  });
});

describe('fdaRoundFat — <0.5=0, by 0.5 under 5, by 1 above 5', () => {
  it('returns "0" below 0.5g', () => {
    expect(fdaRoundFat(0)).toBe('0');
    expect(fdaRoundFat(0.49)).toBe('0');
  });
  it('rounds by 0.5 from 0.5 up to 5', () => {
    expect(fdaRoundFat(0.5)).toBe('0.5');
    expect(fdaRoundFat(4.33)).toBe('4.5'); // operator example
    expect(fdaRoundFat(4.74)).toBe('4.5');
  });
  it('rounds by 1g at or above 5g', () => {
    expect(fdaRoundFat(5)).toBe('5');
    expect(fdaRoundFat(12.74)).toBe('13');
  });
});

describe('fdaRoundCholesterol — <2=0, 2-5="less than 5", by 5 above 5', () => {
  it('returns "0" below 2mg', () => {
    expect(fdaRoundCholesterol(0)).toBe('0');
    expect(fdaRoundCholesterol(1.9)).toBe('0');
  });
  it('returns "less than 5" from 2 to <5', () => {
    expect(fdaRoundCholesterol(2)).toBe('less than 5');
    expect(fdaRoundCholesterol(4.9)).toBe('less than 5');
  });
  it('rounds by 5 from 5 up', () => {
    expect(fdaRoundCholesterol(5)).toBe('5');
    expect(fdaRoundCholesterol(15.87)).toBe('15'); // operator example
  });
});

describe('fdaRoundSodium — <5=0, by 5 up to 140, by 10 above 140', () => {
  it('returns "0" below 5mg', () => {
    expect(fdaRoundSodium(0)).toBe('0');
    expect(fdaRoundSodium(4.9)).toBe('0');
  });
  it('rounds by 5 from 5 up to 140', () => {
    expect(fdaRoundSodium(5)).toBe('5');
    expect(fdaRoundSodium(54.62)).toBe('55'); // operator example
    expect(fdaRoundSodium(140)).toBe('140');
  });
  it('rounds by 10 above 140', () => {
    expect(fdaRoundSodium(145)).toBe('150');
    expect(fdaRoundSodium(160.64)).toBe('160');
  });
});

describe('fdaRoundGrams — Carbs / Sugars / Fiber / Protein / Added Sugar', () => {
  it('returns "0" below 0.5g', () => {
    expect(fdaRoundGrams(0)).toBe('0');
    expect(fdaRoundGrams(0.49)).toBe('0');
  });
  it('returns "less than 1" from 0.5 to <1g', () => {
    expect(fdaRoundGrams(0.5)).toBe('less than 1');
    expect(fdaRoundGrams(0.68)).toBe('less than 1'); // operator example: fiber 0.68g
  });
  it('rounds by 1g from 1g up', () => {
    expect(fdaRoundGrams(1)).toBe('1');
    expect(fdaRoundGrams(9.27)).toBe('9'); // operator example: carbs
    expect(fdaRoundGrams(23.12)).toBe('23');
  });
});

describe('fdaRoundPercentDVMacros — nearest 1% per FDA 21 CFR 101.9(d)(7)(ii)', () => {
  it('rounds to nearest whole percent', () => {
    expect(fdaRoundPercentDVMacros(0)).toBe('0');
    expect(fdaRoundPercentDVMacros(0.4)).toBe('0');
    expect(fdaRoundPercentDVMacros(0.5)).toBe('1'); // boundary
    expect(fdaRoundPercentDVMacros(2.37)).toBe('2'); // operator example: sodium %DV
    expect(fdaRoundPercentDVMacros(3.37)).toBe('3'); // operator example: carb %DV
    expect(fdaRoundPercentDVMacros(5.55)).toBe('6'); // operator example: fat %DV
    expect(fdaRoundPercentDVMacros(13.49)).toBe('13'); // operator example: sat fat %DV
    expect(fdaRoundPercentDVMacros(14.54)).toBe('15'); // operator example: added sugar %DV
  });
  it('does NOT apply the <2% Do-Not-Declare gate (macros always declared)', () => {
    expect(fdaRoundPercentDVMacros(1.5)).toBe('2');
    expect(fdaRoundPercentDVMacros(0.9)).toBe('1');
  });
  it('clamps negative inputs to 0', () => {
    expect(fdaRoundPercentDVMacros(-1)).toBe('0');
  });
});

describe('fdaRoundPercentDVMicros — Vit D / Calcium / Iron / Potassium graduated 2/5/10', () => {
  it('returns "0" below 2%', () => {
    expect(fdaRoundPercentDVMicros(0)).toBe('0');
    expect(fdaRoundPercentDVMicros(0.9)).toBe('0'); // operator example: Vit D
    expect(fdaRoundPercentDVMicros(1.02)).toBe('0'); // operator example: calcium
    expect(fdaRoundPercentDVMicros(1.23)).toBe('0'); // operator example: iron
    expect(fdaRoundPercentDVMicros(1.99)).toBe('0');
  });
  it('rounds by 2 from 2% up to 10%', () => {
    expect(fdaRoundPercentDVMicros(2)).toBe('2');
    expect(fdaRoundPercentDVMicros(3)).toBe('4');
    expect(fdaRoundPercentDVMicros(10)).toBe('10');
  });
  it('rounds by 5 from 10% up to 50%', () => {
    expect(fdaRoundPercentDVMicros(12)).toBe('10');
    expect(fdaRoundPercentDVMicros(33)).toBe('35');
    expect(fdaRoundPercentDVMicros(50)).toBe('50');
  });
  it('rounds by 10 above 50%', () => {
    expect(fdaRoundPercentDVMicros(55)).toBe('60');
    expect(fdaRoundPercentDVMicros(94)).toBe('90');
  });
});

describe('fdaRoundVitaminD — nearest 0.1 mcg per 21 CFR 101.9(c)(8)(iv) [low-RDI bucket]', () => {
  it('returns "0" at or below zero', () => {
    expect(fdaRoundVitaminD(0)).toBe('0');
    expect(fdaRoundVitaminD(-1)).toBe('0');
  });
  it('rounds to nearest 0.1 mcg across all magnitudes', () => {
    expect(fdaRoundVitaminD(0.18)).toBe('0.2');
    expect(fdaRoundVitaminD(0.5)).toBe('0.5');
    expect(fdaRoundVitaminD(2.43)).toBe('2.4');
    expect(fdaRoundVitaminD(2.45)).toBe('2.5');
    expect(fdaRoundVitaminD(10)).toBe('10.0');
    expect(fdaRoundVitaminD(12.5)).toBe('12.5');
    expect(fdaRoundVitaminD(12.54)).toBe('12.5');
    expect(fdaRoundVitaminD(20.0)).toBe('20.0');
  });
});

describe('fdaRoundIron — nearest 0.1 mg per 21 CFR 101.9(c)(8)(iv) [low-RDI bucket]', () => {
  it('returns "0" at or below zero', () => {
    expect(fdaRoundIron(0)).toBe('0');
    expect(fdaRoundIron(-0.5)).toBe('0');
  });
  it('rounds to nearest 0.1 mg across all magnitudes', () => {
    expect(fdaRoundIron(0.09)).toBe('0.1');
    expect(fdaRoundIron(0.22)).toBe('0.2');
    expect(fdaRoundIron(0.65)).toBe('0.7');
    expect(fdaRoundIron(1)).toBe('1.0');
    expect(fdaRoundIron(1.15)).toBe('1.2');
    expect(fdaRoundIron(10)).toBe('10.0');
    expect(fdaRoundIron(18.42)).toBe('18.4');
    expect(fdaRoundIron(18.48)).toBe('18.5');
  });
});

describe('fdaRoundCalcium — nearest 10 mg per 21 CFR 101.9(c)(8)(iv) [high-RDI bucket]', () => {
  it('returns "0" at or below zero', () => {
    expect(fdaRoundCalcium(0)).toBe('0');
    expect(fdaRoundCalcium(-5)).toBe('0');
  });
  it('rounds to nearest 10 mg across all magnitudes', () => {
    expect(fdaRoundCalcium(4)).toBe('0');
    expect(fdaRoundCalcium(5)).toBe('10'); // halfway rounds up
    expect(fdaRoundCalcium(13.27)).toBe('10'); // operator example: 1.02% DV — below 2% threshold, render layer should handle separately
    expect(fdaRoundCalcium(75)).toBe('80');
    expect(fdaRoundCalcium(130)).toBe('130');
    expect(fdaRoundCalcium(265)).toBe('270');
    expect(fdaRoundCalcium(1300)).toBe('1300');
  });
});

describe('fdaRoundPotassium — nearest 10 mg per 21 CFR 101.9(c)(8)(iv) [high-RDI bucket]', () => {
  it('returns "0" at or below zero', () => {
    expect(fdaRoundPotassium(0)).toBe('0');
  });
  it('rounds to nearest 10 mg across all magnitudes', () => {
    expect(fdaRoundPotassium(4)).toBe('0');
    expect(fdaRoundPotassium(46.09)).toBe('50'); // operator example
    expect(fdaRoundPotassium(135.55)).toBe('140');
    expect(fdaRoundPotassium(235)).toBe('240'); // operator's "235 example" rounds to 240 per FDA
    expect(fdaRoundPotassium(485)).toBe('490');
    expect(fdaRoundPotassium(4700)).toBe('4700');
  });
});
