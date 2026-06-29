// Safety-completeness gate — the sibling export gate (analysis-completeness
// preconditions, distinct from the Companion-Spec §B labeling floor). First
// precondition: units-per-serving on count-based forms, scoped to per-serving
// doc types (SFP / FVR). Mfg/ingredient docs are out of scope (F-3, Unit 2b).
import { describe, it, expect } from 'vitest';
import { evaluateSafetyCompletenessGate, type ExportDocType } from '../safetyCompletenessGate';
import { isHardStop } from '../hardStop';

describe('safety-completeness gate — units-per-serving precondition (F-3)', () => {
  it('SFP label + capsule + units unset (0) → hard-stop (refuse-to-export)', () => {
    const r = evaluateSafetyCompletenessGate({ docType: 'sfp-label', deliveryForm: 'capsule', unitsPerServing: 0 });
    expect(isHardStop(r)).toBe(true);
    if (isHardStop(r)) {
      expect(r.evidence).toHaveLength(1);
      expect(r.evidence[0].subject).toBe('Units per serving');
      expect(r.evidence[0].citation).toBeUndefined(); // platform-completeness — no CFR cite
    }
  });

  it('FVR packet + capsule + units unset → hard-stop', () => {
    expect(isHardStop(evaluateSafetyCompletenessGate({ docType: 'fvr-packet', deliveryForm: 'capsule', unitsPerServing: 0 }))).toBe(true);
  });

  it('per-serving doc + units set (≥1) → cleared', () => {
    expect(evaluateSafetyCompletenessGate({ docType: 'sfp-label', deliveryForm: 'capsule', unitsPerServing: 2 }).hardStop).toBe(false);
    expect(evaluateSafetyCompletenessGate({ docType: 'fvr-packet', deliveryForm: 'capsule', unitsPerServing: 1 }).hardStop).toBe(false);
  });

  it('DOC-TYPE SCOPE: mfg/ingredient docs are out of scope — units-unset does NOT block them', () => {
    // The precondition is irrelevant to docs that don't render per-serving values.
    // Firing here would degrade the chokepoint signal + make the refusal copy dishonest.
    for (const docType of ['pds', 'raw-material-spec', 'batch-sheet'] as const) {
      expect(evaluateSafetyCompletenessGate({ docType, deliveryForm: 'capsule', unitsPerServing: 0 }).hardStop,
        `${docType} must NOT block on units-unset`).toBe(false);
    }
  });

  it('mass form (powder) + per-serving doc + units unset → cleared (units N/A; serving is mass)', () => {
    expect(evaluateSafetyCompletenessGate({ docType: 'sfp-label', deliveryForm: 'powder', unitsPerServing: 0 }).hardStop).toBe(false);
  });

  it('volume form (liquid) + per-serving doc + units unset → cleared (serving is volume)', () => {
    expect(evaluateSafetyCompletenessGate({ docType: 'sfp-label', deliveryForm: 'liquid', unitsPerServing: 0 }).hardStop).toBe(false);
  });

  it('EVERY count-based form requires units on a per-serving doc (no form slips)', () => {
    for (const form of ['capsule', 'tablet', 'softgel', 'gummy', 'lozenge', 'chewable'] as const) {
      expect(isHardStop(evaluateSafetyCompletenessGate({ docType: 'sfp-label', deliveryForm: form, unitsPerServing: 0 })),
        `${form} with units unset must hard-stop on an SFP export`).toBe(true);
    }
  });

  it('NO-CFR-CONFABULATION: platform-completeness refusal copy never fabricates a regulatory citation (units-unset is platform-defined, not a CFR floor)', () => {
    const r = evaluateSafetyCompletenessGate({ docType: 'sfp-label', deliveryForm: 'capsule', unitsPerServing: 0 });
    if (isHardStop(r)) {
      expect(r.evidence[0].detail).toMatch(/per-serving safety \(UL\) analysis/);
      expect(r.evidence[0].detail).not.toMatch(/21 CFR|§\d/); // platform-completeness, not a regulation
    }
  });
});
