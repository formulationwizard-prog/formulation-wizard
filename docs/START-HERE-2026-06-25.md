# START HERE — re-entry 2026-06-25 (checkpoint)

**Active branch:** `feat/intake-friendly-fixes` (off `integration-aug-mvp`). Nothing pushed; nothing merged to `main`. Clean checkpoint.

## THE IMMEDIATE NEXT WORK — F-3 carve-out convergence (scoped, not yet built)
The resolver foundation is committed (`1599428`, `lib/perServingAmounts.ts` — no-scaling, unit-class-aware, 10 tests, audit-grade docstring + the [caller-contract matrix](architecture/unit-class-caller-contract-2026-06-25.md)). **Unused until the convergence wires it.** Decision package: [dose-convention-decision-package-2026-06-25.md](architecture/dose-convention-decision-package-2026-06-25.md) (`4d1ca14`).

**The convergence edit (in `lib/supplementLabeling.ts` — CARVE-OUT — + `app/workspace/page.tsx`):**
- Thread `unitsPerServing` into `buildSupplementFacts` (param + caller passes `suppUnitsPerServing`).
- Replace the scaling machinery (`supplementLabeling.ts:392–396` — `recipeRatioMode`/`formulaMassMaybe`/`servingMassMaybe`) with `perServingAmounts(ingredients, unitsPerServing)`.
- DV branch (`:464–465`) + non-DV branch (`:482`): `ingInServingG = (ingredientGrams ÷ formulaMass) × servingMass` → `perServingMg` from the resolver. **`× 1000` DROPS** (resolver returns mg, old path returned grams×1000).
- Then the 3 duplicated `perServingMgByName` blocks (`page.tsx` ~6863 / ~7770 / ~8354) → route through `perServingAmounts` (dedupe + de-scale).
- Incomplete-formula flag (Σ per-capsule ≠ capsule fill → "add a filler from the catalog"; operator-direct, non-blocking, WS-B catches at export).

**⚠ TRIPWIRES / verification asks (named so next-session-fresh catches them):**
1. **The `× 1000` unit-bridge is the literal 1000× misbranding-bug surface.** Bench-test **90 mg in → 90 mg out** explicitly (not 90,000, not 0.09).
2. **Verify `formulaMassMaybe` / `servingMassMaybe` aren't read elsewhere** before removing (else you break another consumer).
3. **Test cascade:** `harness-sfp-august-golden.test.ts` + `T1E-00/01` (`supplementMath.test.ts`) **assert the OLD scaled values — they lock the bug.** Rewrite them to the new (no-scaling) values; that's part of this increment.
4. **Behavior change (model-entailed, not new):** blank-until-real now keys on **`unitsPerServing`, not the fill weight** — the panel shows amounts once units + actives are entered; fill becomes the fit target. Walk an operator through "entered actives" → "added excipient to complete" under this, fresh.
5. **F-11 invariant:** SFP path and the `perServingMgByName` path produce **identical mass** for every `mass` ingredient — assert it.

**Co-founder (async, doesn't gate the build):** ratify the §101.36(b)(2)(i) grounding sentence in the decision package.

## QUEUE (after F-3, roughly blast-radius order)
- **count-mass consolidation** — extends `perServingAmounts` with count-awareness (the 2nd consolidation). Plan: `count-aware-mass-consolidation-plan-2026-06-25.md` (`930b3d6`). ~48 `UNIT_TO_GRAMS[...]` sites, 3 classes; route Class-A through `toGrams`; class-aware grep-guard.
- **catalog-provenance render consolidation** — route harm-critical render through `PROVENANCE_BY_NAME` (already feeds the chip, not the allergen statement). Plan: `catalog-provenance-render-consolidation-plan-2026-06-25.md` (`596846b`). **§7 correction: keep "Contains: X" + "catalog default — verify with COA" — never drop the warning** (under-warning is the dangerous direction).
- **F-1 composability L0** (single-vs-blend fork) — memo on `feat/formulation-composability` (`9f86c46`). Per-strain probiotic = the probiotic instance of blend composition.
- **F-10 generalized no-silent-drop** (CFU done; IU/typos still drop).
- **Permissive paste + checklist drawer** — the import-not-interrogation reframe. UX spec: `ux/operator-intake-journey.md` (on `feat/formulation-composability`).
- **Rulebook integration pass** for the doctrine candidates (below).

## SHIP-STOP TRIAGE (integration branch NOT shippable until these close)
- **F-3** (dose mis-scaling, every fill-weight supplement) — model corrected; convergence scoped above. **Highest blast radius.**
- **F-10** — partial (CFU parses + renders; IU/typos still silently drop).
- **F-1** — unbuilt (proprietary-blend free-text bypass; the composability work).

## DOCTRINE CANDIDATES (for the rulebook integration pass — currently chat/commit-resident only)
verify-don't-infer (incl. on architectural rulings); investigate→design→build (three-stage); consolidate-and-guard with **class-distinction not pattern-matching**; front-door-is-import-not-interrogation; friendly-face / honest-engine / byte-faithful-regulated-outputs (tri-layer); audits-end-in-chokepoints-not-checklists; "closed" requires verification at every layer the data flows through; structural-enforcement-over-discipline-forever; duplication-is-its-own-ship-stop; inline-never-overrides-source-of-truth; depth-as-value.

## ALSO COMMITTED THIS RUN (on `feat/intake-friendly-fixes`)
F-2 banner truth-precision (`972e011`); CFU first-class count (`aaf60d1`); per-strain banner honesty fix (`ecaa442`). Tier-3 / WS-B / FVR are on their own branches merged into `integration-aug-mvp`.

---
*Checkpoint reason: the F-3 convergence is the highest-stakes harm-critical carve-out math of the run (the 1000× tripwire). It + its review want fresh judgment. State is clean; pick up at "THE IMMEDIATE NEXT WORK" above.*
