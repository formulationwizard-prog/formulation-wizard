# §0 Acceptance Sweep — Pre-Pilot Gate (GREEN 2026-06-08)

**The spec §0 criterion, made into a standing gate.** "Wizard runs the full matrix — every formula × every input state × every surface — and finds ZERO rookie bugs before any pilot user does." `lib/__tests__/sweep-section-0-acceptance.test.ts` is that matrix at the harness level.

## Matrix
**7 diverse golden formulas** (chosen to hit the bug-prone corners):
Calm & Sleep (amino/herbal + elemental Mg) · Daily Multi (conversions + DV) · Mineral-heavy (elemental factors, UL-near) · Carrier-loaded D3 (potencyFactor + blend-floor + below-threshold) · Multi-source riboflavin (aggregation) · Allergen-bearing (Fish Oil) · NDI-required (NMN).

**× 4 input states:** blank fill · 350 mg/cap · 660 mg/cap · overfill 2000 mg/cap.

**× every surface, at once:** SFP, Safety/UL, NDI, Allergen, Claims, Stability, Producibility, Determination, Cost, RA-packet.

## Invariants asserted (the rookie-bug CLASS, not one bug)
1. **No NaN / ±Infinity** in any rendered legal-label value (amount, %DV) — the #1 rookie class.
2. **Blank-until-real holds:** unset fill → every dose "—" (null), never a fabricated number; set fill → finite doses.
3. **No surface throws** on any formula × state (no crash reaches a pilot user).
4. **Magnitude sanity:** every amount ≥ 0 and < 1e7 — no 4× / 1000× unit blowups.
5. **Cross-surface consistency:** cost is finite + non-negative across every state; the RA-packet aggregates to 7 sections + a valid roll-up.

## Result: 112 / 112 GREEN
The rookie-bug class that defined this build — NaN labels, fabricated defaults (servings-30, units-2), 4× inflation, crashes on edge input — is **absent across the entire matrix.** The verification is no longer the operator pasting one formula; it's this gate, standing, run on every change.

## Honest scope (the gate cuts both ways)
This verifies the **data / logic** level — the surface functions and their cross-consistency. It does NOT verify:
- The **render** (pixels) — that's the operator's bench-test sample on the running app (spec §6).
- Full **persona click-paths** as user journeys (Marcus zero→label, Dr. Carter sign-off flow).
- Every conceivable input (more units mcg/g, volume forms, deeper multi-source) — the rookie-bug class is **OPEN** (spec §7); new formulas / states / invariants are added here as they surface.

So: §0 is GREEN at the level a harness can hold. The remaining §0 piece is the operator's render + persona bench pass before live pilot exposure — but the *class of bug that used to require the operator to be the harness* is now caught here first.
