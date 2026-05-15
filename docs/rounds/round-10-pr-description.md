## Summary

Round 10 lands the **chemical-limit correctness foundation** that Round 11's PA-review state machinery and documentation artifacts will build on. Three intertwined concerns resolved together:

1. **Concern 2** — Single-acid Henderson-Hasselbalch in place of structurally flawed pH math (pre-fix: 2-pH-unit error on 1% citric + water; post-fix: chemistry-sound CALCULATED output via Tier A with Rules A/B detection)
2. **Concern 1** — Full chemical-safety correctness: enforcement gate on existing 18 substances, all sweep-surfaced data-layer corrections, per-context limit and prohibition application
3. **Path A productClass plumbing** — explicit per-formulation regulatory-context selector; user-set at creation; threaded through `checkCompliance` for per-context routing

The round's deliverable: a workspace where chemical-safety enforcement is correct, complete, and confidence-aware, with the data-model plumbing that makes per-context rules first-class.

---

## What was built

**Section 1 — Hard-stop architectural primitive** ([lib/hardStop.ts](../../lib/hardStop.ts))
Refuse-to-act pattern with "DO NOT WEAKEN" stewardship. `HardStop` interface + `isHardStop` type guard. Foundation for Section 3d Bucket A gate and Round 11 PA-review state machinery.

**Section 2 — Single-acid Henderson-Hasselbalch with Rules A/B detection** ([lib/foodScience.ts](../../lib/foodScience.ts))
- Schema additions on `IngredientSpec`: `pKa1`, `acidMolarMass`, `bufferingBehavior`
- Rules A and B gate H-H eligibility:
  - Rule A (Acid Count Check): exactly 1 pKa-tagged acid → proceed; 0 → not-applicable; ≥2 → multi-acid fallback
  - Rule B (Buffering-Ingredient Check): any `bufferingBehavior: 'known-buffering'` → fallback ESTIMATED
- Catalog tagging: 9 standalone acids with pKa1 + acidMolarMass; vinegars untagged in v1 (Finding #11 — pending Round 11+ `acidMassFraction` schema)
- Bench-test acceptance verified: 1% citric → 2.20 ± 0.05 CALCULATED; 0.5% → 2.36; 0.1% → 2.71; 1% acetic → 2.77

**Section 3a — RegulatoryLimit schema additions** ([lib/regulatoryLimits.ts](../../lib/regulatoryLimits.ts))
6 optional fields: `denominatorBasis`, `appliesToCategories`, `prohibitedInCategories`, `contextualLimits`, `combinedBudgetGroup`, `declarationTriggerPpm`. Plus `ComplianceFinding.inputConfidence` (required) + `combinedBudget?` + `declarationTriggered?` + `prohibitedUse?`.

**Section 3b.1 — Context-independent corrections**
- Combined-budget aggregation: Binders (dairy) + Binders (soy) share 3.5% per 9 CFR 319.140
- Declaration-trigger gate: Sulfites 10 ppm per 21 CFR 101.100, separate from 100 ppm cap
- Substring-match precision: `'sulfite'` → trailing-space pattern

**Path A — productClass plumbing** ([types/index.ts](../../types/index.ts), [app/workspace/page.tsx](../../app/workspace/page.tsx))
- `ProductClass` enum (8 values: acidified-food, supplement, beverage, cured-meat, bacon, baked-good, fresh-produce, general) + `PRODUCT_CLASSES` tuple + `PRODUCT_CLASS_LABEL` map
- `productClass` field on `SavedFormulation` + `FormulationVersion` (optional in type; UI enforces required)
- `checkCompliance(ingredients, productClass?)` — signature change; routing helpers exported (`limitAppliesForProductClass`, `effectiveLimitForProductClass`, `isProhibitedInProductClass`)
- UI selector at formulation creation: required-state styling, mode-aware hint text, save-block when unset
- Change-event confirm-dialog with affected-findings listing when active findings exist

**Section 3b.2 — productClass-dependent corrections**
15 regulatory entries tagged with Path A routing:
- 9 denominator-basis fixes (BHA/BHT fat-and-oil; Prague Powder/Morton Tender Quick/Phosphates(meat)/Erythorbate/Binders meat)
- 1 false-positive precision fix (vitamin C `appliesToCategories: ['cured-meat', 'bacon']`)
- 1 sodium phosphate scope precision
- 3 per-context limit applications (sodium nitrite bacon contextual cap; propionate baked-good scope)
- 2 per-context prohibitions (nitrate-in-bacon FSIS 1974; sulfites-on-fresh-produce FDA 1986)
8 catalog entries tagged: 1 new `Generic Lean Meat (Test Fixture)` + 7 fat-content (oils 100, butter 82-84, cream 36).

**Section 3c — DEFERRED** (PA-verification queue)
LAE, natamycin, sodium diacetate, nisin, e-numbers queued in [docs/pa-verification/](../pa-verification/) pending PA-verified citations + caps. Round 10 ships without these; follow-up commit once PA returns values.

**Section 3d — Bucket A enforcement gate** ([lib/bucketAGate.ts](../../lib/bucketAGate.ts))
`evaluateBucketA(findings)` returns discriminated union: `HardStop & { paReviewableFindings }` or `{ hardStop: false, paReviewableFindings }`. Two-tier semantics per Decision #9:
- MEASURED/CALCULATED inputs + violated → hard-stop (refuse-to-export)
- ESTIMATED/INFERRED inputs + violated → PA-reviewable (no hard-stop)
- UNKNOWN inputs → insufficient-data
UI banner above compliance panel surfaces classification. Actual export-blocking is Round 11+ scope (composes with PA-review state machinery).

**Section 4 — REGULATORY_DISCLAIMER change-control snapshot**
Snapshot test + enhanced docblock with PA-consultation-plus-operator-approval discipline. Any change to the constant fails CI until snapshot updated in same commit.

---

## What tuning happened

**Concern 2 magnitude rescale.** Pre-flight investigation framed Concern 2 as "<0.5% acidulant border-line miscategorization" based on a self-documenting code comment. Bench test on 2026-05-14 revealed the flaw is structural across the dilute single-acid range with 2-pH-unit error magnitude (engine 4.20 vs reference 2.20). Tier A rescoped from "fine-tuning" to "structural replacement of the math."

**Section 3b.2 bugs caught by live-catalog testing.**
- **Combined-budget denominator routing** — aggregation was using total-mass instead of `limit.denominatorBasis`. Per-entry findings showed meat-basis percentages but combined showed total-basis (inconsistent). Fix: combined check routes through the same denominator-basis switch.
- **Prohibition routing gated behind appliesToCategories** — nitrate-in-bacon prohibition wouldn't fire because nitrate's cap is scoped to cured-meat (not bacon). Fix: prohibition check runs independently; finding fires when EITHER cap applies OR prohibition does.

Both surfaced through testing against the live 18-entry table, not synthetic limits. Validates the data-layer-first sequencing.

**Vinegar untag follow-up (Section 2 follow-up).** Initial Section 2 commit tagged 3 distilled-white-vinegar entries with `pKa1`/`acidMolarMass`. Opus review surfaced that vinegar is a categorized ingredient with verified pH metadata, and tagging it as pKa-acid risks over-counting [H+] in vinegar-only formulations. Untag + cap not-applicable at ESTIMATED (commit cc82d2b).

---

## What was deferred

**Round 10 follow-up (gated on PA):**
- Section 3c entries: LAE, natamycin, sodium diacetate, nisin, e-numbers — queued in `docs/pa-verification/`
- Sulfite preservative catalog gap (Finding #15) — queued in `docs/pa-verification/`

**Operator decisions queued (single small commit if approved):**
- Finding #16: ascorbic acid Tier A tagging promotion
- Finding #19: brand voice audit revisions

**Round 11 (originally-scoped Round 10 documentation infrastructure):**
- PA-review state machinery (field-level authority architecture, per-field locking, version history)
- Packaging Data Sheet
- Pre-production checklist
- Five Round 9 harm-critical UNKNOWN items wired through architecture
- Verified HACCP upload surface
- Round 9 leftovers (regulatory-classification panel naming, pathway-revert detection, Acid Food reduced-requirement set, Surface 1 discoverability variant)
- Pre-flight on Audit Items 1, 3, 6

Round 11 directive should open with the revised priority sequence captured in [round-10-cumulative-summary.md](round-10-cumulative-summary.md#round-11-priority-sequence-revised-per-visual-review-session): #23 regulatory table audit (FIRST) → #15+#21 catalog tagging pass → #16 ascorbic acid Tier A promotion → #24 custom ingredient workflow → #20 sulfite carryover schema (parallel). Sequencing rationale: Finding #22's architectural principle (no enforcement before catalog backing is verified) drives the ordering.

**Round 12+:**
- Concern 2 Tier B (multi-acid buffer equilibrium) — pending validation data
- Concern 2 Tier C (multi-acid with ionic-strength corrections) — not on roadmap
- Finding #17: formulation-feasibility detection layer
- Base Sheet vs Batch Sheet differentiation
- Spec system multi-product-class expansion
- Nutraceuticals workspace work (separate verification round)
- Spoke copy revisions (deferred until Round 11 ships)

---

## Findings surfaced

**Round 10 directive findings (#1–#13)** — captured in [round-10-directive.md "Findings to Surface"](round-10-directive.md). Each documents the architectural question and Round assignment per defer-permission discipline.

**Round 10 visual review findings (#14–#24)** — captured in [docs/findings/round-10-visual-review.md](../findings/round-10-visual-review.md):
- #14 pH ±0.20 CI width — LOW, no code change (intended Tier A display CI; [investigation memo](../findings/finding-14-investigation.md))
- #15 sulfite catalog gap — COSMETIC, PA-gated
- #16 ascorbic acid Tier A tagging — LOW, operator decision ([tagging draft](../findings/finding-16-ascorbic-acid-tagging.md))
- #17 formulation-feasibility detection — Round 12+ scope
- #18 productClass mode-aware filter — **FIXED in polish session** (commit 584b571)
- #19 brand voice audit — MODERATE, operator decision ([audit memo](../findings/finding-19-brand-voice-audit.md))
- #20 sulfite carryover schema (`so2ContentPpm` + `sulfiteCarrierClass` on IngredientSpec) — Round 11+ parallel work alongside #15 catalog tagging
- #21 synthetic antioxidant catalog tagging (BHA / BHT / TBHQ / propyl gallate) — Round 11+ alongside #15
- #22 co-sequencing principle (enforcement + catalog must land together) — architectural principle informing Round 11+ scoping; no enforcement entries without catalog backing
- #23 regulatory table audit for launch-vertical scope — Round 11 **FIRST** priority; classify each of 18 entries as operational / forward-prepared / orphan with action per entry
- #24 custom ingredient handling workflow (schema + UI + PA-export) — Round 11, sequenced after #23 + catalog tagging pass

---

## Verification path completed

| Gate | Status | Notes |
|---|---|---|
| `npx tsc --noEmit` | ✅ clean | |
| `next build` | ⏳ not yet run | operator runs before merge per directive |
| Test suite green | ✅ 96/96 pass | 6 test files |
| Local dev visual review | 🟡 partial | Tests 1/3/4 substantially pass; Test 2 partial pending Finding #15 |
| Hard-stop gate boundary | ✅ verified | via test fixtures + Bucket A banner |
| REGULATORY_DISCLAIMER snapshot | ✅ active in CI | three assertions |

---

## Pre-merge polish

Visual review surfaced Findings #14–#24. Polish session landed:
- **Finding #18 fix** (commit 584b571) — ProductClass selector mode-aware filtering
- **Finding #14 investigation** (commit d4f727c) — memo concluding no code change needed
- **Finding #16 draft** (commit 27e741a) — ascorbic acid tagging proposal (operator decision)
- **Finding #15 queue entry** (commit e4d3df4) — sulfite preservative gap
- **Finding #19 audit** (commit 732025c) — brand voice memo (operator decision)
- **Findings doc** (commit a70c561) — comprehensive inventory + Section B verified-clean
- **Cumulative summary** (commit 7c59cb4) — section-by-section landing reference
- **PR description draft** (commit 305fefd) — this body, drafted for operator + Opus review
- **Architectural findings + Round 11 priority sequence** (commit c5ad4d6) — Findings #22 / #23 / #24 to Section A; B.9–B.12 verified-clean entries to Section B; Round 11 priority sequence promoted to its own H2 section in the cumulative summary
- **PR description stats refresh + preamble strip** (this commit) — preamble removed; findings inventory extended to #14–#24; polish-commit list current

---

## Honest framing

**"Round 10 ships" does NOT mean Filing Readiness moves.**

The Filing Readiness hard-floor logic from Round 9 requires the five harm-critical UNKNOWN items to move to at least INFERRED, which happens only when Round 11's documentation infrastructure ships. Round 10 is a rigor-and-correctness round: chemical-safety enforcement is correct, pH math direction-corrects, hard-stop infrastructure extends — but the headline Filing Readiness percentage stays in the floored range for most formulations.

**Round 10 unlocks Round 11. Round 11 moves the metric.**

---

## Test plan for reviewers

After merge, before deploy validation:

1. **Acidified Foods flow:** Create F&B formulation, productClass='acidified-food', 1% citric + 99% water → pH ≈ 2.20 CALCULATED; classification routes to "Acid Food"
2. **Bucket A red banner:** Beverage productClass with sulfite over 100 ppm → red Refuse-to-Export banner with citation refs
3. **Bucket B amber banner:** General productClass with 0.025g BHA + 50g oil → amber PA-Review banner (fat-and-oil basis ESTIMATED catalog)
4. **Vitamin C precision:** Beverage productClass with 0.1g vitamin C → no cured-meat false-positive
5. **Nutraceuticals integration:** Switch to Supplements mode → productClass selector shows only 'Dietary Supplement' option; supplement safety stack still fires UL hard-stops correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
