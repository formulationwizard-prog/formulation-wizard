# F-3 Dose / Composition Math — Decision Package (CORRECTED 2026-06-25)

**Status:** model CONFIRMED by operator (2026-06-25); the real bug re-scoped to "stop scaling"; build pending Wizard/co-founder sign-off on the carve-out. **Highest-blast-radius open ship-stop.**

> **Correction trail (own it):** draft 1 said "default to Convention A" — wrong; recipe-ratio was operator-confirmed 2026-06-07. Draft 2 said "treat the unfilled gap as *implicit* excipient" — also wrong. **The excipient is an explicit ingredient the operator enters into the formula.** There is no implicit gap and nothing for the engine to invent. The model is settled; this is a "the engine scales when it must not" bug.

---

## 1. The confirmed model (operator, 2026-06-25)
The base sheet is the **complete formula — every ingredient, including the excipient/filler — each entered with a real amount:**
1. The **sum of all entered amounts = the per-capsule mass.** The operator builds the formula *to* the capsule (adds excipient until it's full).
2. **An entered amount IS its per-capsule amount.** Vitamin C entered at 90 mg → **90 mg per capsule.**
3. **% is a derived view** (amount ÷ formula total), useful for scaling batches / verification — **not a scaler.**
4. **Per-serving = per-capsule × capsules-per-serving** (2-capsule serving → ×2).
5. That per-serving value **propagates to every downstream artifact** — SFP, Master Specs, Batch Sheet, FVR. One source of truth.
6. **Every ingredient — actives AND excipients — is a database entry.** The operator builds the complete formula *from the catalog*; each ingredient carries its real mass, allergens, and provenance. The catalog already holds ~40 excipients (fillers, lubricants, glidants, disintegrants, capsule shells, coatings, carriers), so a complete formula is buildable today — and the composition roll-up (allergens, etc.) includes excipient-derived data (e.g., Lactose Monohydrate → Milk).

**Worked example:** a 90 mg capsule whose formula has Vitamin C at 18.6% → operator entered Vit C at **16.74 mg** (which *is* 18.6% of 90 mg). Serving = 2 capsules → **33.48 mg per serving** on the SFP + Master Specs.

## 2. The real bug — the engine scales when it must not
Engine computes per-serving = (ingredient ÷ `totalBatchGrams`) × **fill weight** ([supplementLabeling.ts:464](../../lib/supplementLabeling.ts#L464)) — treating the **fill weight as a separate scaler.** When the entered formula total ≠ the fill weight, it **rescales the entered amounts.**

§A walkthrough: operator entered **actives only** (421.6 mg — the excipient **not yet entered**) and a 660 mg fill. The engine scaled 421.6 → 660, so Vit C **90 → 141 mg.** That scaling is the bug. The operator's entered 90 mg *is* the per-capsule amount; the missing 238 mg is **the excipient the operator hasn't entered yet** — a thing they *add as a formula ingredient*, not a thing the engine scales the actives to cover.

## 3. The fix — no scaling; formula total = per-capsule mass; flag incompleteness
- **The per-capsule mass = the formula total (sum of all entered ingredients, excipient included).** Entered amounts ARE the per-capsule amounts. **The engine does not scale.**
- **If the entered formula total ≠ the stated capsule fill → flag it as incomplete** ("formula sums to 421.6 mg; capsule is 660 mg — **add a filler from the catalog** (e.g., Microcrystalline Cellulose) to complete the formula, or set the capsule to 421.6 mg"). The filler is a **real database ingredient the operator adds**, carrying its own mass + allergens. **Never silently scale the actives.**
- **Per-serving = per-capsule × capsules-per-serving** → propagates to SFP / Master Specs / Batch / FVR.
- The "fill weight" field is **a target the formula must sum to**, not an independent multiplier.

## 4. The question for Wizard + co-founder (narrowed)
1. **Is "fill weight" a separate input at all, or just the formula total?** Cleanest: per-capsule mass = the sum of entered ingredients (excipient included); the capsule-size field becomes a *fit target* that the formula must match (mismatch → flag), never a scaler.
2. **On mismatch (entered total ≠ capsule fill): flag-incomplete (recommended) — never scale.** Confirm.
3. **101.36(b)(2)(i) grounding (the sentence the co-founder ratifies or sharpens):** *"Under the complete-formula model, the SFP declared amount per serving = operator-entered per-capsule amount × capsules-per-serving, with no engine-side scaling — so by construction the declared amount equals the actual amount in a serving, satisfying 21 CFR 101.36(b)(2)(i)."* No derivation, no inference: the label declares what's physically there.

## 5. Build, once signed off (carve-out — `supplementMath.ts` / `supplementLabeling.ts`)
- **Remove the fill-weight scaling.** Per-capsule amount = the entered amount; per-capsule mass = the formula total. The capsule-size field drives the **fit/producibility check + a "formula incomplete" flag**, not the dose math.
- **Reconcile the locked tests:** `T1E-00`/`T1E-01` assert the *scaling* (e.g., "scale 4.035×") — they lock the bug. Replace with "entered amount = per-capsule; serving = ×caps; mismatch flags."
- **F-11 two-path:** both render paths (`servingDoseEngine` vs. `perServing×scale`) must stop scaling — fix both.
- **Cost (`unitEconomics`)** + the **2026-06-08 cost-audit** were reconciled to the scaling math — re-reconcile.
- **Bench-test invariant (the acceptance check — same paste, same fill; result depends only on whether the filler is entered):**
  1. **Actives only** (421.6 mg, 660 mg capsule, no filler): SFP renders entered values **unchanged** (Vit C 90 mg, not 141) + UI flags *"Formula incomplete — 238 mg unaccounted; add a filler from the catalog (MCC, rice flour…)."*
  2. **Actives + MCC 238 mg** (totals 660 mg): SFP renders unchanged values, formula total = fill, **no incomplete flag**, capsule fit confirmed by construction.
  3. **Formula already summing to 660 mg** (excipient included from the start): clean render, no flag.
  - 2-capsule serving → per-serving doubles on SFP + Master Specs in all three.

## 6. Status
Model confirmed (excipient is part of the formula; entered = per-capsule; no scaling). A-vs-B retired; "implicit gap" retired. Pending: Wizard/co-founder sign-off on §4 (fill-weight-as-target + flag-don't-scale + 101.36), then CC builds §5 on the carve-out. Highest blast radius — every count-form supplement depends on this math being faithful.
