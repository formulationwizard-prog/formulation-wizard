# Determination Engine (#15) + cGMP Program (#10) — Registry + Audit

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; artifacts #15 + #10, combined — for supplements they are one verdict: → 21 CFR 111).

---

## Audit result — determination CONFIRMED sound (8th surface; prior fix in place)
`lib/scheduledProcess.ts` `determineFilingRequirement(haccpCategoryId, specs, mode)`:
- **Supplement-mode branch** (explicit, ahead of all F&B logic) → `required: false`, `formName: 'None — 21 CFR 111 cGMP framework'`, citations: **21 CFR 111** (cGMP), **101.36** (SFP), **101.93** (claims/disclaimer), **§403(r)(6)** (30-day notification). Reason enumerates the real review areas (111.75(a)(1) identity testing, 101.93 substantiation, 101.36 accuracy, FALCPA/FASTER allergen).
- **F&B Scheduled Process logic (21 CFR 113/114, acidified/LACF, Forms 2541x) is suppressed** for supplements — supplements have no equivalent FDA filing. The prior fix (pre-fix: supplements fell through to 113/114 citations) is in place and now harness-locked.

## The sector boundary — "sector is structural" at the determination layer
The strongest assertion: a supplement short-circuits to 111 **even when F&B-shaped specs (pH, `acidified` classification) are passed** — it never reaches the acidified/LACF branches. The other side holds too: F&B `acidified` → Scheduled Process filing (21 CFR 114, Form 2541e). This is the determination-layer expression of [[sector_is_structural]] — the same doctrine as the #2 ingredient-statement and SFP/NFP rounding splits.

## Citation precision (note)
`§403(r)(6)` is the FD&C Act section (codified **21 U.S.C. 343(r)(6)**) for the 30-day structure/function-claim notification; "DSHEA" is the amending act, common shorthand. Accurate; codified cite noted for the registry.

## Harness (spec §5)
`harness-determination-cgmp-golden.test.ts` (5): supplement → required:false + 111 framework + 111/101.36/101.93 citations + NO 113/114; the sector boundary (acidified specs in supplement mode still → 111); F&B acidified → filing required (114).

## Honest framing
`processAuthorityRequired: true` stays for supplements — the advisory ("confirm with a qualified regulatory reviewer before commercial production") fires, and the reason ends with the educational-not-legal-advice disclaimer. Correct posture: the engine determines + advises; a qualified reviewer signs off.
