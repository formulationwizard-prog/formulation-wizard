# Acidified-Foods Classification Thresholds — PA Verification

**Queued:** 2026-06-07 (CC, from the A/M-ratio math verification pass).
**Status:** PENDING PA VERIFICATION.
**Code:** `lib/foodScience.ts` — `estimateSpecs()` (metrics) + `classifyFormulation()` (regulatory class). Math now locked by `lib/__tests__/acetic-moisture-ratio.test.ts`.

## What was verified WITHOUT PA (math only)
The A/M-ratio computation is dimensionally correct and now test-locked: `aceticMoistureRatio = (aceticAcid% / moisture%) × 100` = acetic acid as a % of the water phase, mass-weighted across ingredients, with divide-by-zero guards. **The MATH is sound. The THRESHOLDS below are regulatory determinations and are NOT asserted from training data** (COA/PA doctrine).

## Canonical — high confidence, NOT requesting verification (21 CFR constants, uniform)
These are regulatory constants, not estimates — flagged here only for completeness:
- **pH ≤ 4.6** = acid/acidified boundary (21 CFR 114.3(b)(1)).
- **aw > 0.85** = LACF threshold (21 CFR 113); **aw ≤ 0.85** = shelf-stable-dry.

## NEEDS PA VERIFICATION (interpretive / heuristic — provenance unclear)
1. **A/M ratio ≥ 0.5% "typical acidified threshold"** (code comment, `foodScience.ts:158`). **Where does 0.5% come from?** Is it a CFR/CPG figure, an industry rule-of-thumb, or an internal estimate? If it drives any operator-facing determination, it needs a documented basis or must be relabeled as a non-regulatory heuristic.
2. **≥ 10% low-acid components → "filing REQUIRED"** (`foodScience.ts:174`). Is 10% the correct cutoff for the acidified-foods filing trigger, or is the determination purely pH-based (any low-acid base + acidification → acidified food regardless of %)? Confirm the threshold and its source.
3. **Ingredient pH < 4.0 = "strong acidulant"** heuristic (used to distinguish acidified vs LACF). This is an internal classifier input, not a CFR constant — confirm it's a reasonable screening heuristic.
4. **Equilibrium-pH boundary (the load-bearing caveat).** 21 CFR 114 classification requires **measured equilibrium pH**. The tool computes/estimates pH from ingredient specs — this is a **screening tool, not a determination.** Confirm the workspace surfaces this boundary clearly (predicted pH → "screening only; equilibrium pH must be lab-measured before filing"), per the [[acidified-foods-ph-predictor-roadmap]] honest-uncertainty framing.

## Fields PA needs to return
For thresholds 1–3: confirmed value + authoritative source (CFR/CPG section, FDA guidance, or "industry heuristic — relabel as non-regulatory"). For 4: confirm the screening-not-determination disclaimer is present and sufficient.

## Where this lands once verified
Threshold constants in `lib/foodScience.ts` get a `// Source: <PA-confirmed citation>` comment (matching the catalog provenance discipline), or are relabeled/removed if unsubstantiated. F&B is post-launch (Q4 2026), so this is **not August-blocking** — but it's cheap to resolve and safety-relevant (acidified-foods misclassification is a botulism-risk surface).

Related: [[acidified-foods-ph-predictor-roadmap]], [[feedback_catalog_must_be_coa_spec_sheet_anchored]], [[reference_pa_verification_queue_folder]].
