# Cost / Unit Economics (#9) — Registry + Audit

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; artifact #9).
**Nature:** operator-input economics (no regulatory authority; no fabricated functional/cost tags). The audit's job is *consistency* (does cost track the now-live recipe-ratio?) + *honest-estimate* (blank-until-real).

---

## Critical consistency check — cost tracks the recipe-ratio ✅
The real risk: we flipped `SUPPLEMENT_CONVENTION_B_ENABLED` to **true** (engine cutover). If cost still used a 1.0 scale, the panel would show 377 mg at a 660 mg fill while the cost reflected the 200 mg recipe — a silent inconsistency.
- **Verified clear.** The caller (`page.tsx`) passes `perServingScale = computePerServingScale(...)` — the **same** factor the SFP doses and UL/dosage checks use. So per-serving cost = totalCost × (servingMass/formulaMass). When the SFP shows 377 mg, the cost reflects 377 mg. Harnessed: scale 1.0 → $1.00; scale 1.886 → $1.886.

## ⚠️ Finding (documentation drift — the wiring class — corrected this commit)
The `unitEconomics.ts` **module docblock** still described **Convention A** ("per-serving model under CONVENTION A… perServingScale is 1.0… stays 1.0 until that gate flips"). The gate flipped 2026-06-07. The CODE was correct (uses `perServingScale`); only the docblock was stale — a future reader would conclude cost doesn't scale. Rewritten to describe the live Convention-B behavior. (Same drift class as #7's CFR citation — code right, prose stale.)

## Math confirmed sound
- `perKg = totalCost / totalWeightKg`; `perServing = totalCost × perServingScale`; `perUnit = perServing / units`; `perPackage = perServing × servings + packaging`. ✅
- **Two models, sector-clean:** supplements `per-serving` (scale-aware); F&B `batch-fraction` (mass-fraction of batch, no per-unit). The per-serving model also retires the bogus "serving > batch" warning F&B's fraction model tripped on multi-capsule servings.

## Blank-until-real
No vendor pricing → `totalCost 0` → `perServing 0` / `perKg 0` — the **render-blank signal** (the UI shows "—", not a fabricated "$0.00 = free"). Per [[cost-blank-until-real]]: cost renders blank until real supplier pricing is entered; the 4-layer cost architecture (vendor / COA / operator-estimate / canonical) sources the real values. The math returns 0 honestly; the render owns the blank (screenshot-sampleable).

## Harness (spec §5)
`harness-cost-unit-economics-golden.test.ts` (6): recipe-ratio tracking (1.0 / 1.886), per-unit, per-package, blank-until-real signal, F&B batch-fraction + no-per-unit (sector boundary).
