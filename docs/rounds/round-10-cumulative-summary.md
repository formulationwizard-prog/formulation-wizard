# Round 10 — Cumulative Diff Summary

**Branch:** `feat/round-10-chemical-limit-correctness`
**Commits:** 18 ahead of `main`
**Test coverage:** 96/96 pass across 6 test files
**Verification status:** `tsc --noEmit` clean; visual review partial (Tests 1, 3, 4 substantially pass; Test 2 partial pending Finding #15 catalog gap)

This document summarizes every commit in the round, organized by section landing. Reference material for Opus final read and PR-description drafting.

---

## Commit-by-commit landing

| # | Hash | Section | Summary |
|---|---|---|---|
| 1 | 37773dd | Directive lock | Scope locked + canonical honest-estimate paragraph extension (types/index.ts:5-32) |
| 2 | 62f49ab | Section 1 | Hard-stop architectural primitive (lib/hardStop.ts) |
| 3 | 523fe44 | Directive amend | Section 2 Rules A/B detection logic + negative fixtures spec |
| 4 | 00e6e21 | Section 2 | Single-acid Henderson-Hasselbalch with Rules A/B + bench-test fixtures |
| 5 | cc82d2b | Section 2 follow-up | Untag vinegars; cap not-applicable at ESTIMATED |
| 6 | 577dcae | Section 3a + 3b.1 | RegulatoryLimit schema + context-independent corrections |
| 7 | 40d967c | Path A-1 | productClass plumbing (types + checkCompliance threading) |
| 8 | db6cafc | Section 3b.2 | productClass-dependent data-layer corrections + bug fixes |
| 9 | 2cd37c1 | Path A-2 | productClass UI integration (workspace selector + enforcement) |
| 10 | a58b2fe | Section 3c queue | PA-verification queue folder + Finding #13 |
| 11 | 02fb80a | Section 3d | Bucket A enforcement gate (refuse-to-export) |
| 12 | 1004308 | Section 4 | REGULATORY_DISCLAIMER change-control snapshot |
| 13 | 584b571 | Polish (Finding #18) | ProductClass selector mode-aware filtering |
| 14 | d4f727c | Polish (Finding #14) | pH ±0.20 CI width investigation memo |
| 15 | 27e741a | Polish (Finding #16) | Ascorbic acid Tier A tagging draft memo |
| 16 | e4d3df4 | Polish (Finding #15) | Sulfite preservative PA-verification queue entry |
| 17 | 732025c | Polish (Finding #19) | Brand voice audit memo |
| 18 | a70c561 | Polish | Visual review findings doc |

---

## Section-by-section landing

### Directive (commits 37773dd + 523fe44)

- `docs/rounds/round-10-directive.md` — locked scope across 9 sections + 13 findings to surface
- `types/index.ts:5-32` — canonical honest-estimate paragraph extended with chemistry-inherently-hard premise (the 25% the original paragraph implied but didn't state)

### Section 1 — Hard-stop architectural primitive (commit 62f49ab)

- **New file:** `lib/hardStop.ts`
- **Exports:** `HardStop` interface, `HardStopEvidence` interface, `isHardStop` type guard
- **Stewardship:** "DO NOT WEAKEN ANY HARD-STOP GATE" docblock with explicit historical citation to 2026-04-30 audit incidents
- **Tests:** none (utility primitive; consumers test usage)

### Section 2 — Single-acid Henderson-Hasselbalch (commits 00e6e21 + cc82d2b)

- **Schema additions on `IngredientSpec`:**
  - `pKa1?: number` — first dissociation constant
  - `acidMolarMass?: number` — for the eight standalone acids
  - `bufferingBehavior?: 'known-buffering'` — gates Rule B fallback
- **Rules A and B detection logic** in `computeSingleAcidPH` at lib/foodScience.ts
- **Catalog work:** tagged 9 standalone acids (citric anhydrous, citric monohydrate, malic, tartaric, fumaric, lactic 88%, phosphoric 85%, acetic glacial, ascorbic) with pKa1 + acidMolarMass; vinegars untagged in v1 per Finding #11
- **Bench-test acceptance:** all 4 positive fixtures (1% citric → 2.20, 0.5% citric → 2.36, 0.1% citric → 2.71, 1% acetic → 2.77 all CALCULATED within ±0.05) + all 3 negative fixtures (multi-acid Rule A fallback, ketchup Rule B fallback, 10% white vinegar Rule A not-applicable) pass
- **Confidence taxonomy:** MEASURED pKa + 1 acid + no buffering → CALCULATED; other paths → ESTIMATED cap
- **Tests:** lib/__tests__/section-2-tier-a.test.ts (16 fixtures across positive/negative/not-applicable + integration through estimateSpecs)

### Section 3a — RegulatoryLimit schema additions (commit 577dcae)

- **Schema additions on `RegulatoryLimit`:**
  - `denominatorBasis?: 'total' | 'fat-and-oil' | 'meat' | 'baked-good'`
  - `appliesToCategories?: string[]`
  - `prohibitedInCategories?: string[]`
  - `contextualLimits?: Array<{ context, maxPpm?, maxPercent? }>`
  - `combinedBudgetGroup?: string`
  - `declarationTriggerPpm?: number`
- **Schema additions on `ComplianceFinding`:**
  - `combinedBudget?: { group; memberIngredientNames[] }`
  - `declarationTriggered?: boolean`

### Section 3b.1 — Context-independent corrections (commit 577dcae)

- **1 combined-budget fix:** Binders (dairy) + Binders (soy) share `combinedBudgetGroup: 'meat-binder'` (9 CFR 319.140)
- **1 declaration-trigger gate:** Sulfites — `declarationTriggerPpm: 10` (21 CFR 101.100); fires separate finding distinct from 100 ppm cap
- **1 substring-match precision:** `'sulfite'` → trailing-space pattern `'sulfite '`
- **Implementation in `checkCompliance`:** declaration-trigger findings + combined-budget aggregation logic
- **Tests:** lib/__tests__/section-3b1-regulatory-limits.test.ts (15 fixtures)

### Path A-1 — productClass plumbing data layer (commit 40d967c)

- **New type:** `ProductClass` (8-value enum: acidified-food, supplement, beverage, cured-meat, bacon, baked-good, fresh-produce, general)
- **Runtime:** `PRODUCT_CLASSES` tuple, `PRODUCT_CLASS_LABEL` map
- **Schema additions on `SavedFormulation` + `FormulationVersion`:** `productClass?: ProductClass`
- **Schema additions on `IngredientSpec`:** `isMeat?: boolean`, `fatContentPct?: number`
- **Schema additions on `ComplianceFinding`:** `prohibitedUse?: boolean`
- **checkCompliance signature:** now accepts optional `productClass` parameter; routes via per-context rules when set
- **Exported routing helpers:** `limitAppliesForProductClass`, `effectiveLimitForProductClass`, `isProhibitedInProductClass`
- **Tests:** lib/__tests__/path-a-product-class.test.ts (23 fixtures — helper-level + backwards-compat + type-contract)

### Section 3b.2 — productClass-dependent corrections (commit db6cafc)

- **15 regulatory entries tagged** with Path A routing fields:
  - 9 denominator-basis fixes (BHA/BHT → fat-and-oil; Prague Powder #1/#2 + Morton Tender Quick + Phosphates(meat) + Erythorbate/Ascorbate + Binders(dairy)/(soy) → meat)
  - 1 vitamin C false-positive precision fix (`appliesToCategories: ['cured-meat', 'bacon']`)
  - 1 sodium phosphate scope precision (same)
  - 3 per-context limit applications (sodium nitrite bacon override 120 ppm strictest default; propionate baked-good scope)
  - 2 per-context prohibitions (nitrate-in-bacon; sulfites-on-fresh-produce)
- **8 catalog entries tagged** with categorization metadata: 1 new Generic Lean Meat fixture + 7 fat-content (oils 100, butter 82-84, cream 36)
- **Design call:** bacon = cured-meat + bacon-specifics (entries tagged `['cured-meat', 'bacon']` so bacon inherits cured-meat regs; bacon-specific overrides layer on top)
- **Bugs found and fixed during testing:**
  - Combined-budget aggregation routed total-mass instead of `limit.denominatorBasis` — fixed
  - Prohibition routing gated behind appliesToCategories — fixed (now independent)
- **Tests:** lib/__tests__/section-3b2-product-class-routing.test.ts (22 fixtures across all four routing sub-systems)

### Path A-2 — productClass UI integration (commit 2cd37c1)

- **State:** `productClass: ProductClass | ''` (empty-string unset state)
- **checkCompliance call** updated to pass `productClass || undefined`
- **handleProductClassChange handler** with confirm-dialog discipline:
  - Initial selection (unset → set): silent apply
  - Set → different set with active findings: confirm dialog naming up to 5 affected findings; cancel reverts
- **saveFormulation save-block** when productClass empty (alert with mode-appropriate message)
- **Save/load round-trip:** `productClass` field on `SavedFormulation` + `FormulationVersion` snapshots
- **UI selector** at formulation creation: required-state styling (red border/background/asterisk), mode-aware hint text
- **Reset flow:** `setProductClassState('')` added to 4 "clear current" sites (command palette / home button / Quick Action / mode switch)

### Section 3c — DEFERRED (commit a58b2fe)

- **Status:** PA-verification queue. Round 10 ships without these entries.
- **New folder:** `docs/pa-verification/` with README documenting workflow
- **Inaugural queue files (5):** LAE, natamycin, sodium diacetate, nisin, common e-numbers
- **Finding #13** added to directive — explicit deferral framing
- **Memory note:** `reference_pa_verification_queue_folder.md` so future sessions inherit the discipline

### Section 3d — Bucket A enforcement gate (commit 02fb80a)

- **New file:** `lib/bucketAGate.ts`
- **Exports:** `evaluateBucketA` function, `BucketAGateResult` discriminated union (HardStop & {paReviewableFindings} | {hardStop: false, paReviewableFindings})
- **Schema addition on `ComplianceFinding`:** `inputConfidence: Confidence` (required field)
- **inputConfidence computation in checkCompliance:**
  - Per-entry findings: routed by `limit.denominatorBasis` (total → MEASURED; meat → worst across isMeat-tagged spec confidences; fat-and-oil → worst across fatContentPct-tagged spec confidences)
  - Declaration-trigger findings: inherit from parent
  - Combined-budget findings: worst across members
- **Gate semantics** (Decision #9):
  - MEASURED/CALCULATED + violated → hard-stop (refuse-to-export)
  - ESTIMATED/INFERRED + violated → PA-reviewable (no hard-stop)
  - UNKNOWN → insufficient-data, gate doesn't act
- **UI banner** above compliance panel: red hard-stop, amber PA-reviewable, no banner when cleared
- **Stewardship:** "DO NOT WEAKEN THIS GATE" docblock with explicit pre-Round-10-shipped-no-enforcement historical citation
- **Tests:** lib/__tests__/section-3d-bucket-a-gate.test.ts (17 fixtures — synthetic gate-branch tests + live-finding composition tests)

### Section 4 — REGULATORY_DISCLAIMER change-control (commit 1004308)

- **Enhanced docblock** above the constant: PA consultation + operator PR-description approval + ARCHITECTURE.md update if policy-shifting
- **Snapshot test** at lib/__tests__/section-4-regulatory-disclaimer.test.ts:
  - Frozen-string equality (load-bearing)
  - Non-empty sanity
  - Anchor preservation ("process authority" + "fda")
- **Behavior:** any change to the constant fails CI until snapshot is also updated, forcing change-control discipline to surface in code review

### Polish session (commits 584b571 through a70c561)

- **Finding #18 (584b571):** ProductClass selector mode-aware filter. `productClassesForMode(mode)` helper in lib/modes.ts. Supplements mode shows only 'Dietary Supplement'; F&B-style modes show 7 non-supplement options. Mode-aware hint text.
- **Finding #14 memo (d4f727c):** pH ±0.20 CI width investigation. Conclusion: intended Tier A display CI from RANGE_TABLE; no code change.
- **Finding #16 memo (27e741a):** Ascorbic acid Tier A tagging draft proposal. Promotes entry from 'ai-estimate' to 'verified' with 21 CFR 182.3013 + FCC 12th ed. + CRC Handbook citations. NOT activated autonomously — operator decision pending.
- **Finding #15 queue entry (e4d3df4):** Sulfite preservative catalog gap. Fields PA needs to verify across 4 sulfite forms (sodium meta / potassium meta / sodium bi / SO₂).
- **Finding #19 memo (732025c):** Brand voice audit on 7 Round 10 UI surfaces. Proposes operator-vocabulary revisions matching the supplement-side hard-stop gold standard. NOT committed as code change — operator decides scope.
- **Visual review findings doc (a70c561):** Section A (6 findings requiring future work) + Section B (8 verified-clean behaviors).

---

## Schema additions inventory

### `types/index.ts`

- `ProductClass` type (8-value enum)
- `PRODUCT_CLASSES` readonly tuple
- `PRODUCT_CLASS_LABEL` Record<ProductClass, string> map
- `Confidence` type (existing) — extended canonical paragraph with chemistry-inherently-hard premise

### `IngredientSpec` (lib/foodScience.ts)

- `pKa1?: number` — Section 2 Tier A
- `acidMolarMass?: number` — Section 2 Tier A
- `bufferingBehavior?: 'known-buffering'` — Section 2 Rule B
- `isMeat?: boolean` — Path A-1 / Section 3b.2 meat denominator
- `fatContentPct?: number` — Path A-1 / Section 3b.2 fat-and-oil denominator

### `RegulatoryLimit` (lib/regulatoryLimits.ts)

- `denominatorBasis?: 'total' | 'fat-and-oil' | 'meat' | 'baked-good'`
- `appliesToCategories?: ProductClass[]`
- `prohibitedInCategories?: ProductClass[]`
- `contextualLimits?: Array<{ context: ProductClass; maxPpm?; maxPercent? }>`
- `combinedBudgetGroup?: string`
- `declarationTriggerPpm?: number`

### `ComplianceFinding` (lib/regulatoryLimits.ts)

- `inputConfidence: Confidence` — Section 3d (required)
- `combinedBudget?: { group; memberIngredientNames[] }` — Section 3a (optional)
- `declarationTriggered?: boolean` — Section 3a (optional)
- `prohibitedUse?: boolean` — Path A-1 (optional)

### `SavedFormulation` + `FormulationVersion`

- `productClass?: ProductClass` — Path A-2 (optional in type for migration; UI enforces required at save)

---

## New files added

- `lib/hardStop.ts` — Section 1 architectural primitive
- `lib/bucketAGate.ts` — Section 3d enforcement gate
- `lib/__tests__/section-2-tier-a.test.ts` — H-H math + Rules A/B fixtures
- `lib/__tests__/section-3b1-regulatory-limits.test.ts` — Section 3b.1 corrections
- `lib/__tests__/section-3b2-product-class-routing.test.ts` — Section 3b.2 routing
- `lib/__tests__/path-a-product-class.test.ts` — Path A routing helpers
- `lib/__tests__/section-3d-bucket-a-gate.test.ts` — Bucket A gate fixtures
- `lib/__tests__/section-4-regulatory-disclaimer.test.ts` — REGULATORY_DISCLAIMER snapshot
- `docs/pa-verification/` (folder) — PA-verification queue with 6 inaugural files
- `docs/findings/finding-14-investigation.md` — pH CI width memo
- `docs/findings/finding-16-ascorbic-acid-tagging.md` — ascorbic acid tagging draft
- `docs/findings/finding-19-brand-voice-audit.md` — brand voice audit
- `docs/findings/round-10-visual-review.md` — findings inventory
- `docs/rounds/round-10-cumulative-summary.md` — this document

---

## Findings inventory (all rounds)

### Round 10 directive findings (#1–#13)

Captured in `docs/rounds/round-10-directive.md` "Findings to Surface" section. Defer-permission discipline; each finding documents the architectural question and Round assignment.

### Round 10 visual review findings (#14–#19)

Captured in `docs/findings/round-10-visual-review.md`. Summary:

- #14 pH CI width — LOW, no code change
- #15 sulfite catalog gap — COSMETIC, PA-gated
- #16 ascorbic acid tagging — LOW, operator decision
- #17 formulation-feasibility detection — Round 12+ scope
- #18 productClass mode-aware filter — FIXED (commit 584b571)
- #19 brand voice audit — MODERATE, operator decision

---

## Test verification

| Test file | Fixtures | Status |
|---|---|---|
| section-2-tier-a.test.ts | 16 | pass |
| section-3b1-regulatory-limits.test.ts | 15 | pass |
| section-3b2-product-class-routing.test.ts | 22 | pass |
| path-a-product-class.test.ts | 23 | pass |
| section-3d-bucket-a-gate.test.ts | 17 | pass |
| section-4-regulatory-disclaimer.test.ts | 3 | pass |
| **Total** | **96** | **96/96 pass** |

`npx tsc --noEmit` clean. `next build` not yet verified for this branch (operator runs before merge per directive verification path gate 2).

---

## Deferrals

### Round 10 follow-up

- **Section 3c entries** (LAE, natamycin, sodium diacetate, nisin, e-numbers) — gated on PA verification per docs/pa-verification/ queue. Land via follow-up commit once PA returns verified values.
- **Section 3c sulfite catalog gap** (Finding #15) — gated on PA verification.

### Operator decisions queued

- Finding #16 (ascorbic acid promotion) — single small commit if approved
- Finding #19 (brand voice audit) — ship-all / defer-all / selective adoption

### Round 12+

- Concern 2 Tier B (multi-acid buffer equilibrium)
- Concern 2 Tier C (multi-acid with ionic-strength corrections)
- Finding #17 (formulation-feasibility detection layer)
- Base Sheet vs Batch Sheet differentiation
- Spec system multi-product-class expansion (tablet/capsule/softgel hardness/friability/disintegration/peroxide value/CFU)
- Nutraceuticals workspace work (separate verification round)
- Spoke copy revisions (deferred until Round 11 ships)

---

## Round 11 priority sequence (revised per visual review session)

Round 11's directive should open with this sequenced priority chain,
executed in order. Rationale: Finding #22 architectural principle
(co-sequence enforcement with catalog) drives the ordering — no new
enforcement before catalog backing is verified.

1. **Finding #23: Regulatory table audit (FIRST priority).** Comprehensive
   review of 18 regulatory entries. Classify each as operational /
   forward-prepared / orphan. Action per entry: keep / annotate / remove.

2. **Findings #15 + #21: Catalog tagging pass.** Add sulfite preservatives
   (sodium metabisulfite, potassium metabisulfite, SO2, sodium bisulfite —
   per PA-verification queue) and synthetic antioxidants (BHA, BHT, TBHQ,
   propyl gallate). Activates regulatory enforcement surviving the #23 audit.

3. **Finding #16: Ascorbic acid Tier A promotion.** Confidence promotion
   from unverified to verified per CC's draft memo with 21 CFR 182.3013 +
   FCC + CRC citations. Batches with other Tier A acid promotions if any
   surface during #23 audit.

4. **Finding #24: Custom ingredient handling workflow.** Schema + UI +
   PA export updates. Completes the ingredient-transparency architecture
   as the operator-facing layer over the catalog/enforcement work in
   #15/#21/#23.

5. **Finding #20: Sulfite carryover schema (parallel work).** IngredientSpec
   additions for so2ContentPpm + sulfiteCarrierClass. Composes with #15
   catalog tagging. Can land in parallel with #23.

Plus existing Round 11 scope (PA-review state machinery, PDS, Pre-production
checklist, 5 harm-critical UNKNOWN items wired, HACCP upload, R9 leftovers).

---

## Honest framing on Round 10's deliverable

**"Round 10 ships" does NOT mean Filing Readiness moves.** The Filing Readiness hard-floor logic from Round 9 requires the five harm-critical UNKNOWN items to move to at least INFERRED, which happens only when Round 11's documentation infrastructure ships. Round 10 is a rigor-and-correctness round: chemical-safety enforcement is correct, pH math direction-corrects, hard-stop infrastructure extends, but the headline Filing Readiness percentage stays in the floored range for most formulations.

**Round 10 unlocks Round 11. Round 11 moves the metric.**
