// ============================================================
// Section 3b.2 — productClass-dependent data-layer corrections
// ------------------------------------------------------------
// Tests against the LIVE 18-entry regulatory table after
// Section 3b.2 tagging (denominatorBasis, appliesToCategories,
// prohibitedInCategories, contextualLimits). Companion to the
// Path A-1 helper unit tests in path-a-product-class.test.ts —
// those verify the routing machinery; these verify the data
// tags route real entries correctly.
//
// Test groups (Section 3b.2 directive sub-items):
//   • Denominator basis — BHA/BHT fat+oil, Prague meat-basis
//   • Per-context scoping — propionate baked-good, vitamin C
//     and phosphates cured-meat (precision fixes)
//   • Per-context limits — sodium nitrite bacon override (120 ppm)
//   • Per-context prohibitions — nitrate-in-bacon, sulfites-on-
//     fresh-produce (categorical violations)
// ============================================================

import { describe, it, expect } from 'vitest';
import { checkCompliance } from '../regulatoryLimits';

describe('Section 3b.2 — Denominator basis: fat-and-oil for BHA/BHT', () => {

  it('BHA at 0.025g in 50% oil + 50% water (50g fat) → 0.05% fat-basis > 0.02% cap, violated', () => {
    // Pre-fix engine: 0.025g / 100g total = 0.025% < 0.02% × 2 = 0.04% (still
    // appears under cap at total-mass basis). Post-3b.2: 0.025g / 50g fat =
    // 0.05% > 0.02% cap — flagged correctly.
    const findings = checkCompliance([
      { name: 'BHA (Antioxidant)', qty: 0.025, unit: 'g' },
      { name: 'Soybean Oil (RBD)', qty: 49.975, unit: 'g' },
      { name: 'Water', qty: 50, unit: 'g' },
    ]);
    const bha = findings.find(f => f.limit.shortName === 'BHA');
    expect(bha).toBeDefined();
    expect(bha?.violated).toBe(true);
    expect(bha?.currentPercent).toBeCloseTo(0.05, 3);
  });

  it('BHA at 0.005g in 50% oil + 50% water → 0.01% fat-basis ≤ 0.02% cap, compliant', () => {
    const findings = checkCompliance([
      { name: 'BHA (Antioxidant)', qty: 0.005, unit: 'g' },
      { name: 'Soybean Oil (RBD)', qty: 49.995, unit: 'g' },
      { name: 'Water', qty: 50, unit: 'g' },
    ]);
    const bha = findings.find(f => f.limit.shortName === 'BHA');
    expect(bha?.violated).toBe(false);
  });

  it('BHA with NO fat in formulation → divide-by-zero guard, no BHA finding emitted', () => {
    // When the fat-and-oil denominator is zero, the per-entry check skips
    // (limit doesn't meaningfully apply on a fat-free formulation).
    const findings = checkCompliance([
      { name: 'BHA (Antioxidant)', qty: 0.005, unit: 'g' },
      { name: 'Water', qty: 99.995, unit: 'g' },
    ]);
    const bha = findings.find(f => f.limit.shortName === 'BHA');
    expect(bha).toBeUndefined();
  });

  it('BHT same pattern: 0.025% of fat-mass triggers violation', () => {
    const findings = checkCompliance([
      { name: 'BHT (Antioxidant)', qty: 0.025, unit: 'g' },
      { name: 'Canola Oil (Industrial Grade)', qty: 49.975, unit: 'g' },
      { name: 'Water', qty: 50, unit: 'g' },
    ]);
    const bht = findings.find(f => f.limit.shortName === 'BHT');
    expect(bht?.violated).toBe(true);
  });
});

describe('Section 3b.2 — Denominator basis: meat for cured-meat regs', () => {

  it('Prague Powder #1 at 0.5g + 80g meat + 19.5g water + productClass=cured-meat → 0.5/80 = 0.625% meat-basis > 0.25% cap, violated', () => {
    // The load-bearing meat-basis test. Pre-fix engine: 0.5g / 100g = 0.5% <
    // 1% (passes meat-cure cap test against total mass — also misleading
    // because Prague Powder cap is actually 0.25% of meat). Post-3b.2: 0.5g /
    // 80g meat = 0.625% > 0.25% cap, flagged correctly.
    const findings = checkCompliance(
      [
        { name: 'Prague Powder #1', qty: 0.5, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 80, unit: 'g' },
        { name: 'Water', qty: 19.5, unit: 'g' },
      ],
      'cured-meat',
    );
    const prague = findings.find(f => f.limit.shortName === 'Prague Powder #1');
    expect(prague?.violated).toBe(true);
    expect(prague?.currentPercent).toBeCloseTo(0.625, 2);
  });

  it('Prague Powder #1 same amount but NO productClass → does NOT fire (appliesToCategories gate)', () => {
    const findings = checkCompliance([
      { name: 'Prague Powder #1', qty: 0.5, unit: 'g' },
      { name: 'Generic Lean Meat (Test Fixture)', qty: 80, unit: 'g' },
      { name: 'Water', qty: 19.5, unit: 'g' },
    ]);
    const prague = findings.find(f => f.limit.shortName === 'Prague Powder #1');
    expect(prague).toBeUndefined();
  });

  it('Prague Powder #1 also applies to bacon productClass (cured-meat regulatory scope inherited)', () => {
    const findings = checkCompliance(
      [
        { name: 'Prague Powder #1', qty: 0.5, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 80, unit: 'g' },
        { name: 'Water', qty: 19.5, unit: 'g' },
      ],
      'bacon',
    );
    const prague = findings.find(f => f.limit.shortName === 'Prague Powder #1');
    expect(prague?.violated).toBe(true);
  });
});

describe('Section 3b.2 — Per-context scoping (precision fixes for active misfires)', () => {

  it('Vitamin C at 1000 ppm in beverage → does NOT fire (cured-meat 547 ppm cap scoped away)', () => {
    // Active misfire pre-Section-3b.2: vitamin C substring would match the
    // cured-meat 547 ppm cap on any beverage with vitamin C fortification.
    // Post-fix: appliesToCategories: ['cured-meat', 'bacon'] gates the limit.
    const findings = checkCompliance(
      [
        { name: 'Ascorbic Acid (Vitamin C, Food Grade)', qty: 0.1, unit: 'g' }, // 1000 ppm
        { name: 'Water', qty: 99.9, unit: 'g' },
      ],
      'beverage',
    );
    const vitC = findings.find(f => f.limit.shortName === 'Ascorbic Acid (in cures)');
    expect(vitC).toBeUndefined();
  });

  it('Vitamin C at 600 ppm in cured-meat (mass-relative to meat) → cap fires correctly when applicable', () => {
    // In a cured-meat formulation with meat present, vitamin C as cure
    // accelerator IS capped at 547 ppm of meat mass. 0.06g / 99.9g meat =
    // 600 ppm > 547 ppm cap, flagged.
    const findings = checkCompliance(
      [
        { name: 'Ascorbic Acid (Vitamin C, Food Grade)', qty: 0.06, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 99.94, unit: 'g' },
      ],
      'cured-meat',
    );
    const vitC = findings.find(f => f.limit.shortName === 'Ascorbic Acid (in cures)');
    expect(vitC).toBeDefined();
    expect(vitC?.violated).toBe(true);
  });

  it('Sodium phosphate in beverage as buffer salt → does NOT fire (cured-meat 0.5% cap scoped away)', () => {
    // Pre-3b.2: 'sodium phosphate' substring would trigger the FSIS 0.5%
    // meat cap on any beverage using sodium phosphate as a buffer salt.
    // Post-fix: scoped to cured-meat productClass via appliesToCategories.
    const findings = checkCompliance(
      [
        { name: 'Sodium Phosphate (Buffer)', qty: 0.3, unit: 'g' },
        { name: 'Water', qty: 99.7, unit: 'g' },
      ],
      'beverage',
    );
    const phosphate = findings.find(f => f.limit.shortName === 'Phosphates (meat)');
    expect(phosphate).toBeUndefined();
  });

  it('Sodium propionate in beverage → does NOT fire (baked-good scope)', () => {
    const findings = checkCompliance(
      [
        { name: 'Sodium Propionate', qty: 0.5, unit: 'g' },
        { name: 'Water', qty: 99.5, unit: 'g' },
      ],
      'beverage',
    );
    const propionate = findings.find(f => f.limit.shortName === 'Sodium Propionate');
    expect(propionate).toBeUndefined();
  });

  it('Sodium propionate in baked-good at 0.5% → fires the 0.32% cap', () => {
    const findings = checkCompliance(
      [
        { name: 'Sodium Propionate', qty: 0.5, unit: 'g' },
        { name: 'Water', qty: 99.5, unit: 'g' },
      ],
      'baked-good',
    );
    const propionate = findings.find(f => f.limit.shortName === 'Sodium Propionate');
    expect(propionate).toBeDefined();
    expect(propionate?.violated).toBe(true);
    expect(propionate?.currentPercent).toBeCloseTo(0.5, 3);
  });
});

describe('Section 3b.2 — Per-context limits (contextualLimits override)', () => {

  it('Sodium nitrite at 140 ppm in cured-meat → under 156 ppm base cap, compliant', () => {
    const findings = checkCompliance(
      [
        { name: 'Sodium Nitrite', qty: 0.014, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 99.986, unit: 'g' },
      ],
      'cured-meat',
    );
    const nitrite = findings.find(f => f.limit.shortName === 'Sodium Nitrite');
    expect(nitrite?.violated).toBe(false);
  });

  it('Sodium nitrite at 140 ppm in bacon → over 120 ppm contextual cap, VIOLATED (would pass at cured-meat)', () => {
    // contextualLimit override: bacon productClass uses 120 ppm (strictest
    // pumped-bacon cap as conservative v1 default per Finding #12). Same
    // formulation passes as cured-meat (156 ppm cap) but fails as bacon.
    const findings = checkCompliance(
      [
        { name: 'Sodium Nitrite', qty: 0.014, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 99.986, unit: 'g' },
      ],
      'bacon',
    );
    const nitrite = findings.find(f => f.limit.shortName === 'Sodium Nitrite');
    expect(nitrite?.violated).toBe(true);
  });

  it('Sodium nitrite in non-meat productClass → does NOT fire (appliesToCategories gate)', () => {
    const findings = checkCompliance(
      [
        { name: 'Sodium Nitrite', qty: 0.05, unit: 'g' },
        { name: 'Water', qty: 99.95, unit: 'g' },
      ],
      'beverage',
    );
    const nitrite = findings.find(f => f.limit.shortName === 'Sodium Nitrite');
    expect(nitrite).toBeUndefined();
  });
});

describe('Section 3b.2 — Per-context prohibitions (categorical violations)', () => {

  it('Sodium nitrate in cured-meat at 1000 ppm → under 1718 ppm cap, compliant', () => {
    const findings = checkCompliance(
      [
        { name: 'Sodium Nitrate', qty: 0.1, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 99.9, unit: 'g' },
      ],
      'cured-meat',
    );
    const nitrate = findings.find(f => f.limit.shortName === 'Sodium / Potassium Nitrate');
    expect(nitrate?.violated).toBe(false);
    expect(nitrate?.prohibitedUse).toBeUndefined();
  });

  it('Sodium nitrate in bacon at ANY amount → categorical prohibition (FSIS 1974)', () => {
    // Trace amount of nitrate in bacon — prohibited regardless of quantity.
    const findings = checkCompliance(
      [
        { name: 'Sodium Nitrate', qty: 0.001, unit: 'g' }, // 10 ppm
        { name: 'Generic Lean Meat (Test Fixture)', qty: 99.999, unit: 'g' },
      ],
      'bacon',
    );
    const nitrate = findings.find(f => f.limit.shortName === 'Sodium / Potassium Nitrate');
    expect(nitrate?.violated).toBe(true);
    expect(nitrate?.prohibitedUse).toBe(true);
    expect(nitrate?.utilization).toBe(Number.POSITIVE_INFINITY);
  });

  it('Potassium nitrate also prohibited in bacon (shares the entry)', () => {
    const findings = checkCompliance(
      [
        { name: 'Potassium Nitrate', qty: 0.001, unit: 'g' },
        { name: 'Generic Lean Meat (Test Fixture)', qty: 99.999, unit: 'g' },
      ],
      'bacon',
    );
    const nitrate = findings.find(f => f.limit.shortName === 'Sodium / Potassium Nitrate');
    expect(nitrate?.prohibitedUse).toBe(true);
  });

  it('Sulfites on fresh produce → categorical prohibition (21 CFR 182.3862 FDA 1986)', () => {
    // Sodium metabisulfite at any non-zero amount in fresh-produce productClass.
    const findings = checkCompliance(
      [
        { name: 'Sodium Metabisulfite', qty: 0.001, unit: 'g' }, // 10 ppm
        { name: 'Water', qty: 99.999, unit: 'g' },
      ],
      'fresh-produce',
    );
    const sulfite = findings.find(
      f => f.limit.shortName === 'Sulfites' && !f.declarationTriggered
    );
    expect(sulfite?.violated).toBe(true);
    expect(sulfite?.prohibitedUse).toBe(true);
  });

  it('Sulfites in beverage → normal cap check (no prohibition)', () => {
    const findings = checkCompliance(
      [
        { name: 'Sodium Metabisulfite', qty: 0.005, unit: 'g' }, // 50 ppm
        { name: 'Water', qty: 99.995, unit: 'g' },
      ],
      'beverage',
    );
    const sulfite = findings.find(
      f => f.limit.shortName === 'Sulfites' && !f.declarationTriggered
    );
    expect(sulfite?.violated).toBe(false);
    expect(sulfite?.prohibitedUse).toBeUndefined();
  });
});

describe('Section 3b.2 — Universal limits unaffected by productClass', () => {

  it('Sodium benzoate cap fires regardless of productClass (no appliesToCategories restriction)', () => {
    for (const pc of ['acidified-food', 'beverage', 'general'] as const) {
      const findings = checkCompliance(
        [
          { name: 'Sodium Benzoate', qty: 0.2, unit: 'g' }, // 0.2% > 0.1% cap
          { name: 'Water', qty: 99.8, unit: 'g' },
        ],
        pc,
      );
      const benzoate = findings.find(f => f.limit.shortName === 'Sodium Benzoate');
      expect(benzoate?.violated, `productClass=${pc}`).toBe(true);
    }
  });

  it('Potassium sorbate same — universal cap applies in all productClasses', () => {
    const findings = checkCompliance(
      [
        { name: 'Potassium Sorbate', qty: 0.15, unit: 'g' },
        { name: 'Water', qty: 99.85, unit: 'g' },
      ],
      'fresh-produce',
    );
    const sorbate = findings.find(f => f.limit.shortName === 'Potassium Sorbate');
    expect(sorbate?.violated).toBe(true);
  });
});
