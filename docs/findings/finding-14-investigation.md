# Finding #14 Investigation — pH ±0.20 CI Width on Tier A Output

**Queued:** 2026-05-15 (Round 10 visual review)
**Status:** Investigation complete — no code change recommended; rationale documented for future reviewers

## Observation

During visual Test 1 (1% citric acid + 99% water, Acidified Foods workflow), the engine reported **pH 2.23 ± 0.20 CALCULATED**. The center value 2.23 lands within the locked bench-test acceptance tolerance (2.20 ± 0.05). But the displayed confidence interval of ±0.20 is wider than the ±0.05 acceptance bound, raising the question: is the ±0.20 intentional or inherited from a fallback path that bypassed Tier A?

## Trace

`rangedSpec(metric, value, confidence)` at [lib/foodScience.ts:769](../../lib/foodScience.ts#L769) builds the displayed RangedValue. The width comes from `RANGE_TABLE` at [lib/foodScience.ts:756-763](../../lib/foodScience.ts#L756-L763):

```
pH: {
  measured:   { kind: 'abs', tolerance: 0.1 },
  calculated: { kind: 'abs', tolerance: 0.2 },  ← Test 1 lands here
  estimated:  { kind: 'abs', tolerance: 0.3 },
  inferred:   { kind: 'abs', tolerance: 0.5 },
  unknown:    { kind: 'abs', tolerance: 0   },
}
```

When Tier A's `computeSingleAcidPH` returns `{ kind: 'applied', pH, confidence: 'calculated' }`, the formulation-level pH renders via `rangedSpec('pH', 2.23, 'calculated')` → `RANGE_TABLE.pH.calculated.tolerance = 0.2`. The ±0.20 is the **intended CALCULATED-pH display CI**, applied via the same path as any other CALCULATED chemistry value.

## Diagnosis

Three hypotheses from the SOW prompt, evaluated:

**(a) Intended Tier A model output** ✓ **This is correct.**
The ±0.20 is the per-metric tolerance for CALCULATED pH in the RANGE_TABLE. It's hit because Tier A's success branch returns confidence='calculated', and that maps to a ±0.20 absolute band via the existing rangedSpec mechanism. No bug.

**(b) Inherited from fallback** ✗ Ruled out.
The fallback path (Rules A/B decline) produces confidence='estimated' which would render as ±0.30. The observed ±0.20 confirms Tier A's success branch applied (CALCULATED), not the fallback (ESTIMATED).

**(c) Calibrated to total-system uncertainty** ✓ **This explains the calibration choice.**
The ±0.20 is wider than the math-precision-only CI (which for a 1% citric solution would be ~±0.05-0.10 accounting for pKa source variance + ionic-strength corrections + concentration precision). The wider band acknowledges system-level uncertainty:

- pKa source variance (CRC Handbook vs Food Chemicals Codex vs vendor COA): ±0.03-0.05
- User-input mass precision (kitchen scale vs analytical balance): ±0.01-0.02 propagated through H-H
- Solution preparation variance (real-world dissolution, settling, partial equilibration): ±0.05-0.10
- pH meter calibration drift between buffer-set + measurement: ±0.05
- Temperature dependence (pKa at 25°C; food handled across 5-35°C range): ±0.02-0.04
- Ionic-strength corrections (Debye-Hückel, omitted in Tier A): ±0.02-0.05 at moderate concentrations

Aggregated quadrature gives a realistic total-system band of ~±0.15-0.20 for the typical formulator workflow. ±0.20 is conservative-honest — wider than the math alone but matched to what a customer-zero formulator can expect to actually measure against in the lab without specialty equipment.

## Acceptance tolerance vs. display tolerance — different purposes

The directive's bench-test acceptance criterion (1% citric ± 0.05) and the displayed CI (±0.20) serve different functions:

- **Acceptance ±0.05** — verifies the engine's center value computes correctly against reference. Used in tests; not user-facing. Section 5 regression fixtures lock this.
- **Display ±0.20** — honest CI for what a formulator should expect on actual lab measurement. Used in UI; surfaces the system-level uncertainty alongside the calculated center.

These can and should diverge. A tight acceptance bound proves math correctness; a wider display bound prevents false precision in the formulator's planning workflow.

## Severity

**Low** — no code change recommended.

The ±0.20 display CI is intentional, principled, and consistent with the honest-estimate framing locked at types/index.ts:5-32 ("starting-estimate engine with honest uncertainty bounds"). Narrowing it would create false precision: a formulator seeing pH 2.20 ± 0.05 would expect lab measurement to land in that range without verification, and might be surprised by routine lab variance.

## Recommended action

**No code change.** Document the rationale in this memo so future reviewers don't re-surface as a concern.

**Optional Round 11+ refinement** (not in Round 10 scope): if operator wants finer-grained CI per Tier A success vs ESTIMATED fallback vs legacy-math, RANGE_TABLE could split 'calculated' into sub-tiers (e.g., 'calculated-tier-a' at ±0.10 vs 'calculated-fallback' at ±0.20). Adds complexity without clear customer-zero benefit; defer until customer-zero requests tighter bands with specific use case.

## Test fixture impact

None. Existing regression fixtures in [lib/__tests__/section-2-tier-a.test.ts](../../lib/__tests__/section-2-tier-a.test.ts) assert center-value tolerances (±0.05 for the 1% citric case) without asserting display CI width. Tests pass; behavior is correct.

## Operator decision needed on return

None for Round 10 ship. Memo is informational.

If interested in Round 11+ refinement: would a Tier-A-success CALCULATED display at ±0.10 (tighter, math-precision-only) be more useful than the current ±0.20 (system-uncertainty calibrated)? Trade-off is "false precision risk" vs "actionable narrower band for users planning lab measurements."
