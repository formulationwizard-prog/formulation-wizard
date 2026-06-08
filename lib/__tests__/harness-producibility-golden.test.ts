// ============================================================
// HARNESS — producibility surface (capsule fit / blend). Spec §5.
// ------------------------------------------------------------
// Manufacturability screening, NOT consumer safety. Capacity table is max-volumetric
// (densest-fill ~1 g/mL) — the fit check is OPTIMISTIC for low-density powders; density-aware
// adjustment is R12 (honest-estimate screening tool). This harness locks the verdict state
// machine + the band boundaries + the capacity values. See docs/audits/producibility-2026-06-08.md.
// ============================================================
import { describe, it, expect } from 'vitest';
import { assessProducibility, capsuleCapacityMg, utilizationBand } from '../servingModel';

describe('HARNESS · #8 producibility — capsule-fit verdict', () => {
  const cap = (totalMassG: number, totalUnits: number) =>
    assessProducibility({ form: 'capsule', totalMassG, totalUnits, capacityMg: 680 }).state; // size 0

  it('600 mg in size-0 (680 mg) → producible (88%)', () => {
    expect(cap(0.6, 1)).toBe('producible');
  });
  it('800 mg in size-0 → over-fill (>100% — physically impossible)', () => {
    expect(cap(0.8, 1)).toBe('over-fill');
  });
  it('650 mg in size-0 → approaching (96% — may not pack reliably)', () => {
    expect(cap(0.65, 1)).toBe('approaching');
  });
  it('200 mg in size-0 → low-fill (29% — cost-optimization hint)', () => {
    expect(cap(0.2, 1)).toBe('low-fill');
  });
  it('empty formulation → unknown', () => {
    expect(cap(0, 0)).toBe('unknown');
  });
  it('mass form (powder) → producible (no capacity constraint at this layer)', () => {
    expect(assessProducibility({ form: 'powder', totalMassG: 100, totalUnits: 0, capacityMg: 0 }).state).toBe('producible');
  });
});

describe('HARNESS · #8 producibility — band boundaries (50 / 90 / 100%)', () => {
  it('exactly 50% → green (lower boundary)', () => expect(utilizationBand(0.5)).toBe('green'));
  it('exactly 90% → green; 90.1% → amber-high', () => {
    expect(utilizationBand(0.9)).toBe('green');
    expect(utilizationBand(0.901)).toBe('amber-high');
  });
  it('exactly 100% → amber-high; 100.1% → red (over-fill)', () => {
    expect(utilizationBand(1.0)).toBe('amber-high');
    expect(utilizationBand(1.001)).toBe('red');
  });
});

describe('HARNESS · #8 producibility — capsule capacities (max-volumetric basis, documented)', () => {
  it('size 0 = 680 mg, 00 = 950 mg, 000 = 1370 mg', () => {
    expect(capsuleCapacityMg('0')).toBe(680);
    expect(capsuleCapacityMg('00')).toBe(950);
    expect(capsuleCapacityMg('000')).toBe(1370);
  });
});
