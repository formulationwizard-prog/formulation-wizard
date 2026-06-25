# F-3 Dose-Convention — Decision Package (for co-founder ratification)

**Date:** 2026-06-25 · **Status:** HELD — needs one human ruling, then CC builds. **Highest-blast-radius open ship-stop.**
**The one decision:** *Which dose convention is 21 CFR 101.36 truth for the August launch — and is the 2026-06-07 flip to Convention B ratified, or should Convention A be restored?* This is a regulatory-grounding call only the co-founder can make. Everything else is scoped + ready.

---

## 1. Why this is #1 (blast radius)
Every **count-form supplement (capsule/tablet/softgel) with an operator-entered fill weight** gets its Supplement Facts amounts **mis-scaled** → a misbranded label by default. Observed live (§A walkthrough):
- Vitamin C entered **90 mg** → panel showed **141 mg / 157% DV**
- Creatine entered **5000 mg** → panel showed **213 mg**

This dwarfs the other open ship-stops (count-mass = probiotics only; catalog over-assertion = per-entry). It affects *every* supplement once a fill weight is set.

## 2. The mechanism (verified in code)
`computePerServingScale` returns `supplementServingMassG / totalBatchGrams` for supplements. When a fill weight is present, the SFP treats entered amounts as a **recipe scaled to the fill**: per-serving = (ingredient ÷ formula total) × fill mass. With 421.6 mg of actives filled to a 660 mg capsule, scale = 660/421.6 = **1.566×** → 90 mg renders as 141 mg.

## 3. What the trace settled (so we rule on facts, not guesses)
- **No defaulting bug.** `suppPerUnitWeightMg` is operator-entered (the capsule-size→fill prefill useEffect was *removed* on purpose, [page.tsx:447-449](../../app/workspace/page.tsx#L447)). The 660 was typed, not auto-filled. So this is a **pure model-intent mismatch**, not a stray default.
- **Convention B is *deliberate*, not an accidental regression.** `SUPPLEMENT_CONVENTION_B_ENABLED = true` was flipped 2026-06-07 ("operator-confirmed recipe-ratio + M2-1 engine-wire"), **cost-reconciled** 2026-06-08, and **test-locked** (`T1E-00` asserts the flag is `true`; `T1E-01` asserts a set fill → 4.035× scaling). The `servingDoseEngine` (M1.5) is built around it.
- **But it contradicts the still-present governing doctrine.** [supplementMath.ts:176-190](../../lib/supplementMath.ts#L176): *"Convention A holds for the August launch… flip the flag ONLY together with the Convention-B fill-weight work — flipping it alone restores the inflation."* The flag was flipped; the "blank-until-real fill" safety it relied on **fails the moment an operator enters a real fill weight** (which §A proved).

**So the on-disk state is genuinely contradictory:** the flag/test/cost say B; the doctrine comment says A-for-August. Two sessions made opposite choices. That's *why* it needs a human ruling, not a CC fix.

## 4. The two conventions (what each means to the operator)
| | Convention A (identity) | Convention B (recipe-ratio) |
|---|---|---|
| "Vitamin C **90 mg**" means | 90 mg **per serving** (absolute dose) | 90 mg **of a recipe**, scaled to the fill weight |
| Panel shows (660 mg fill, 421 mg actives) | **90 mg** | **141 mg** |
| Matches the operator who *pastes a formula*? | **Yes** — they mean the dose | Only if they intend a % recipe |
| 101.36 declared-amount = actual per-serving amount? | **Yes** | Only if the operator built it as a recipe |

## 5. CC's recommended ruling (not the decision — the recommendation)
**Default Convention A. Decouple fill weight from dose interpretation. Make Convention B an explicit per-formula opt-in.**
- An operator pasting "Vitamin C 90 mg" means 90 mg per serving — the 101.36 declared amount must *be* the per-serving amount. A is correct for the dominant workflow.
- **Fill weight is a packaging/fit fact** — it should drive the producibility/over-fill check (it already does), **never silently flip dose interpretation.** That decoupling is the actual fix; A-vs-B then becomes an explicit operator choice, not a side-effect of entering a fill weight.
- The engine already supports both (`recipeRatioMode`); B stays available as an opt-in for operators who genuinely think in percentages.

## 6. The question for the co-founder (the ruling)
> For a 21 CFR 101.36 Supplement Facts panel: when an operator enters "Vitamin C 90 mg," does the declared amount mean **90 mg per serving (A)**, or **a recipe proportion scaled to fill (B)** — and therefore, is the 2026-06-07 flip to B ratified for August, or is Convention A restored as the default?

CC's read: A is 101.36-correct as the default; B is a niche recipe-scaling workflow that should be explicit, not the silent default. But the regulatory grounding is the co-founder's call.

## 7. Build, once ruled (scoped + ready)
If **A restored as default** (recommended):
- `SUPPLEMENT_CONVENTION_B_ENABLED → false` *(or better: A default + explicit per-formula B opt-in)*. **Carve-out file (`supplementMath.ts`) — co-founder/Wizard approval per the ruling.**
- **Update the locked tests** `T1E-00` / `T1E-01` (they currently *assert B* — they ratify the thing being reverted; must change to lock A).
- `recipeRatioMode` (supplementLabeling) + `unitEconomics` cost path revert to identity; **reconcile/supersede the 2026-06-08 cost-audit doc** (it assumed B).
- **F-11 two-path trace:** the SFP has *two* render paths (`servingDoseEngine` vs. `perServing×scale`). Both must render A — flipping the flag fixes one path; the other must be confirmed, not assumed.
- Bench-test: 90 mg Vit C renders **90 mg / 100% DV**; fill weight changes only the fit check, not the dose.

If **B ratified**: then the §A "misbranding" is re-framed as intended-recipe-behavior, and the fix is instead a **UX honesty** one (make clear the operator is in recipe-ratio mode + that fill is scaling their doses) — a different, smaller build. *(CC's view: this is the less likely correct answer, but it's the co-founder's to rule.)*

## 8. Status
**Human-gated.** This package is the unblocked work; the build follows the ruling. While F-3 is held, the parallel-buildable ship-stops are **F-1 (composability L0 — blend bypass)** and **F-10 generalized (no-silent-drop)** — neither needs this ruling. count-mass + catalog-provenance are lower blast-radius and drop behind these.

*Recommended: this package goes to the co-founder; on the ruling, CC builds §7. Nothing on the carve-out until then.*
