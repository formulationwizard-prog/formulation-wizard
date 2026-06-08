# Producibility (#8) — Capsule Fit / Blend-Floor Registry + Audit

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; artifact #8).
**Nature:** manufacturability screening, NOT consumer safety or a CFR-mandated rule (distinct from Safety). USP <905> (uniformity of dosage units) / <2040> (disintegration) are the lab-test context; the fit check is capacity-utilization screening.

---

## Audit result — fit logic CONFIRMED sound
`lib/servingModel.ts`:
- **Math:** `fill = totalMass×1000/units`; `utilization = fill/capacity`; bands at 50/90/100% (strict boundaries: 50%→green, 90%→green, 100%→amber-high, >100%→red). Verdict state machine (unknown / low-fill / producible / approaching / over-fill) maps cleanly.
- **Single source of truth** — `CAPSULE_CAPACITY_MG` feeds both the dropdown and `capsuleCapacityMg()`.
- **Blend-floor guard** — `BLEND_FLOOR_MG` net in `supplementLabeling.ts` catches unblendable trace mass (the carrier-loaded-potencyFactor companion).

## ⚠️ Density-basis (known limitation — honest-estimate framing strengthened this commit)
The capacity table is **max-volumetric** — densest powder fill (~1 g/mL, 100% packing). For real lower-density blends, the **mg** capacity is lower (typical 50–90% of max), so the fit check is **OPTIMISTIC**: it can read "producible" for a fill that a low-density powder won't actually pack.
- This is **documented** in code and **R12-deferred** (density-aware adjustment, gated on customer-zero data) — the honest-estimate / screening-tool posture (same family as the pH-predictor "honest-uncertainty-as-moat").
- **Honest-engine fix this commit:** the per-capsule helper text now discloses the basis explicitly — *"Max {N} mg (#size capacity, at dense ~1 g/mL powder). Lower-density blends fill less — verify the real fit against your blend's bulk density."* (was: "Lower if your formula doesn't pack to full" — too soft). The operator now sees the assumption, not just the optimistic number.

## Harness (spec §5)
`harness-producibility-golden.test.ts` (10): verdict state machine (producible / over-fill / approaching / low-fill / unknown / mass-form); band boundaries (50/90/100%); capacity values (0=680, 00=950, 000=1370, max-volumetric).

## Not blocking
Density-aware capacity is R12 (manufacturability accuracy, not regulatory). The optimism is now honestly disclosed; the operator verifies against real blend density. No carve-out — manufacturability estimate, not a regulatory interpretation.
