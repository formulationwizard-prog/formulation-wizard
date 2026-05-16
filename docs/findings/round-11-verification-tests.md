# Round 11 Pre-Flight Verification Tests

**Round:** 11
**Phase:** 1, Step 2
**Generated:** 2026-05-15
**Status:** Living document — pass/fail outcomes populated as test runs land

---

## Purpose

Captures the pre-flight verification cases that gate the Round 11 Finding #25 mode-gate package (sub-issues 25a, 25b, 25c) and the downstream cascade (25d cost, 25e spec coverage, 25f UL gate). Per the directive's "tests before fix code" rule, this document and its companion vitest suite at [lib/__tests__/supplementMath.test.ts](../../lib/__tests__/supplementMath.test.ts) are committed BEFORE any line-792 fix code lands.

**Test architecture (per Round 11 Phase 1 directive guidance):**
- **Automated unit tests** live in `lib/__tests__/supplementMath.test.ts` (vitest). They cover math-model cases on the extracted helper at [lib/supplementMath.ts](../../lib/supplementMath.ts) (`computePerServingScale`, `computePerServingMass`).
- **Markdown verification matrix** (this document) captures all cases — including the ones that don't fit unit-test structure (regulatory panel rendering, HACCP framework selection, F→N mode switch UI, integration scenarios, F&B regression at the running-app level).
- The two layers complement, not substitute. Vitest is the regression bar; the matrix is the audit-trail artifact for human review.

**TDD discipline note:** Supplement-mode test cases below are written against the *target* (correct) behavior. At the Step 2 commit, the extracted helper preserves current F&B math regardless of mode — so the supplement-mode vitest cases fail. Sub-issue 25a's commit adds the supplement-mode branch to the helper, and they turn green. This is an intentional red state for the Step 2 → 25a window; documented in the test file header.

---

## Architectural finding surfaced during Step 2 read-through

The F&B-formula `scale = totalBatchGrams > 0 ? servingSizeInGrams / totalBatchGrams : 0` pattern is replicated **identically in 5 places**, not just at the audit memo's load-bearing line 792:

| # | Location | Inside supplement-mode block? | Used for |
|---|----------|-------------------------------|----------|
| 1 | [page.tsx:700](../../app/workspace/page.tsx#L700) | Yes | `pmByName` → finding aggregator for supplement UL safety |
| 2 | [page.tsx:792](../../app/workspace/page.tsx#L792) | No (mode-agnostic) | `perServing()` callable for FDA / Supplement Facts panel rendering |
| 3 | [page.tsx:2749](../../app/workspace/page.tsx#L2749) | Yes | `pmByName` → supplement status strip pills (safety summary) |
| 4 | [page.tsx:4575](../../app/workspace/page.tsx#L4575) | Yes | `perServingMgByName` → main dosage safety card UL check |
| 5 | [page.tsx:5449](../../app/workspace/page.tsx#L5449) | Yes | `perServingMgByName` → claims card + `buildSupplementFacts` reuse |

Four of the five sites are inside `if (mode === 'supplements')` blocks but still apply the F&B formula — the bug is sharper than the audit memo framed. The Step 2 helper extraction swaps all 5 sites to call the same helper, so the Step 3 sub-issue 25a fix to the helper internals corrects all 5 sites simultaneously. This expands the literal scope of "25a" beyond line 792 but matches the directive's spirit (minimal mode-gate fix at the canonical math location) — the canonical math is now the helper, replicated at 5 consumer sites.

---

## Section 1 — Helper math-model tests (sub-issue 25a; automated under vitest)

These cases are automated in [lib/__tests__/supplementMath.test.ts](../../lib/__tests__/supplementMath.test.ts).

### 1A — Single-ingredient supplement-mode cases

| ID | Setup | Expected `displayMass` | Expected `displayUnit` | Notes |
|----|-------|------------------------|------------------------|-------|
| T1A-01 | Vitamin C 500 mg, 2 capsules/serving | 500 | mg | Smoke-test failure case 2026-05-15 |
| T1A-02 | Vitamin C 1000 mg, 1 capsule/serving | 1000 | mg | Mid-dose case |
| T1A-03 | Vitamin C 1900 mg, 1 capsule/serving | 1900 | mg | Under-UL boundary (UL = 2000 mg); 25f UL gate cascade case |
| T1A-04 | Vitamin C 2500 mg, 1 capsule/serving | 2500 | mg | Over-UL hard-stop case; 25f UL gate cascade case |
| T1A-05 | Vitamin D3 25 mcg, 2 capsules/serving | 25 | mcg | Smoke-test failure case |
| T1A-06 | Zinc 15 mg, 2 capsules/serving | 15 | mg | Smoke-test failure case |
| T1A-07 | Biotin 30 mcg, 1 capsule/serving | 30 | mcg | Low-dose edge case (mcg-range) |
| T1A-08 | Magnesium 400 mg, 4 capsules/serving | 400 | mg | High-dose / multi-capsule edge case |

### 1B — Multi-ingredient supplement-mode case (Immune Support Stack)

| ID | Setup | Expected output |
|----|-------|-----------------|
| T1B-01 | Vit C 500 mg + Vit D3 25 mcg + Zinc 15 mg, 2 capsules/serving | All three render at entered values (500 mg, 25 mcg, 15 mg) |

### 1C — Helper-primitive scale tests

| ID | Setup | Expected `computePerServingScale` | Notes |
|----|-------|-----------------------------------|-------|
| T1C-01 | mode='supplements', any serving, any batch | 1.0 | Supplement mode is identity scale |
| T1C-02 | mode='fb', serving=30g, batch=1000g | 0.03 | F&B regression — current correct behavior |
| T1C-03 | mode='fb', serving=15g, batch=300g | 0.05 | F&B regression — small batch |
| T1C-04 | mode='fb', serving=0g, batch=100g | 0 | Div-by-zero / zero-serving guard |
| T1C-05 | mode='fb', serving=30g, batch=0g | 0 | Div-by-zero / zero-batch guard |

### 1D — Unit-change edge cases (interacting with Finding #27)

These verify that the helper preserves the display unit and does NOT convert it. (Finding #27 unit-change handling is a separate fix that will preserve underlying mass and update display value via a different code path.)

| ID | Setup | Expected `displayMass` | Expected `displayUnit` |
|----|-------|------------------------|------------------------|
| T1D-01 | 500 mg, supplement mode | 500 | mg |
| T1D-02 | 0.5 g, supplement mode | 0.5 | g |
| T1D-03 | 500000 mcg, supplement mode | 500000 | mcg |
| T1D-04 | 2.5 g, supplement mode | 2.5 | g |

---

## Section 2 — Sub-issue 25b: Regulatory panel render mode-gate (markdown verification; manual — operator UI exercise)

These are UI/integration cases not fitting unit-test structure. Exercised against the running app after the 25b fix lands. **CC cannot drive a browser; operator drives these per Phase 2 hybrid verification plan.**

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T2-01 | Pure Nutraceuticals workspace (mode='supplements', any formulation) | Filing Readiness widget renders zero F&B panels (no 21 CFR 113/114 acidified-foods, no Acid Food classification, no LACF logic, no low-acid components threshold) | (operator) |
| T2-02 | F&B workspace → switch to Nutraceuticals | Regulatory panels clear from view immediately | (operator) |
| T2-03 | Nutraceuticals workspace, ingredients populated | DSHEA determination renders correctly (replacement for F&B Acid/Acidified determination) | (operator) |
| T2-04 | Nutraceuticals workspace | Low-acid component percentage NOT computed nor rendered | (operator) |

---

## Section 3 — Sub-issue 25c: HACCP framework selection mode-gate (markdown verification; manual — operator UI exercise)

**CC cannot drive a browser; operator drives these per Phase 2 hybrid verification plan.** Note: The supplement-mode early-return in `suggestHaccpCategory` and the new `supplement-cgmp-21-cfr-111` HACCP_CATEGORIES entry are present in code (commit `a9cd60e`); these tests verify the rendering surface picks them up correctly.

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T3-01 | Nutraceuticals workspace, dry capsule formulation | HACCP suggestion does NOT render F&B framework (no "Shelf-Stable Dry (Low-Moisture)" suggestion) | (operator) |
| T3-02 | Nutraceuticals workspace | 21 CFR 111 cGMP framework loaded (5 CCPs: Identity Testing per Dietary Ingredient Lot, MMR, BPR, Finished-Product Specs, Complaint + SAER) | (operator) |
| T3-03 | Nutraceuticals workspace | Food-domain hazards absent (no Salmonella, no E. coli flour, no Cronobacter, no mycotoxins listed) | (operator) |
| T3-04 | F&B workspace | F&B HACCP framework still loads correctly (regression check) | (operator) |

---

## Section 4 — Sub-issue 25d: Cost calculation cascade (markdown verification; manual — operator UI exercise)

The cost cascade is downstream of the math model fix at 25a. Cost-per-serving derivation at [page.tsx:575](../../app/workspace/page.tsx#L575) is `totalCost / totalWeightKg * (servingSizeInGrams / 1000)` — independent of the `scale` variable that 25a fixed. Cascade verification is about confirming the displayed cost-per-serving renders correctly in supplement mode + no spurious "Serving > batch" warnings.

**CC defers to operator: the cost formula is too simple to add value via vitest without re-asserting the formula tautologically. Operator UI exercise is the right verification surface.**

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T4-01 | 3-ingredient priced supplement formulation (Vit C 500mg @ $0.02/g + Vit D3 25mcg @ $0.50/g + Zinc 15mg @ $0.01/g, 2 caps/serving) | Cost-per-serving displayed value matches manual calc | (operator) |
| T4-02 | Same formulation | No "Serving > batch — check unit" warnings (the spurious unit-mismatch warning the audit memo flagged) | (operator) |
| T4-03 | Mode switch F→N→F | Cost calculation does not corrupt across mode switches | (operator) |

---

## Section 5 — Sub-issue 25e: Spec coverage cascade (CC vitest — calculation; operator UI — display)

CC vitest at [lib/__tests__/section-5-spec-coverage-cascade.test.ts](../../lib/__tests__/section-5-spec-coverage-cascade.test.ts) verifies the calculation. Operator UI exercise verifies the display surface in supplement-mode workspace.

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T5-01 | 3-ingredient formulation, all 3 with supplier specs | Spec coverage calculation = 100% (1.0) | ✅ CC vitest |
| T5-02 | 3-ingredient formulation, 2 with specs / 1 without (equal mass) | Spec coverage calculation ≈ 67% (2/3) | ✅ CC vitest |
| T5-03 | 3-ingredient formulation, none with specs | Spec coverage calculation = 0% | ✅ CC vitest |
| T5-04 | Supplement formulation with all specs (post 25a fix), running app | Spec coverage display does NOT show spurious 0% (the pre-fix bug where coverage floored due to broken math model) | (operator) |
| T5-supp-1 | Coverage is mass-weighted, not count-weighted (80g spec'd + 20g unspec'd → 80%) | Calculation produces correct weighted result | ✅ CC vitest |
| T5-supp-2 | Zero-mass formulation (empty ingredient list) | Coverage = 0; no division-by-zero error | ✅ CC vitest |

---

## Section 6 — Sub-issue 25f: UL gate cascade (CC vitest — gate behavior; operator UI — popover affordances)

CC vitest at [lib/__tests__/section-6-ul-gate-cascade.test.ts](../../lib/__tests__/section-6-ul-gate-cascade.test.ts) exercises the gate end-to-end via the same `perServingMgByName` construction as [page.tsx:4576-4584](../../app/workspace/page.tsx#L4576-L4584). Operator UI exercise covers popover/badge rendering of the findings.

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T6-01 | Vitamin C 1900 mg, 1 capsule/serving (passed via helper) | UL caution tier fires (95% of 2000 mg UL); SafetyTier='caution' | ✅ CC vitest |
| T6-02 | Vitamin C 2500 mg, 1 capsule/serving (passed via helper) | UL warning tier fires (125% of UL); SafetyTier='warning'; summarizeFindings.hardStop=true | ✅ CC vitest |
| T6-03 | Vitamin C 500 mg, 2 caps/serving (passed via helper) | No UL fire (25% of UL); SafetyTier='ok'; summarizeFindings.hardStop=false | ✅ CC vitest |
| T6-04 | Multi-ingredient Immune Support Stack (Vit C 500mg + Vit D3 25mcg + Zinc 15mg, 2 caps) | Each ingredient evaluated against its own UL: Vit C 25%, Vit D3 25%, Zinc 7.5% (elementalFactor 0.20 applied); all 'ok' | ✅ CC vitest |
| T6-05 | Smoke-test repro regression seal (Immune Support Stack, batch=0.515, serving=2) | perServingMgByName carries entered values via helper (not pre-fix F&B-percentage interpreted ~3.88x) | ✅ CC vitest |
| T6-supp-1 | Audience modifier (Caffeine 250mg, pregnancy audience) | effectiveUL = 200mg (factor 0.5 applied); SafetyTier='warning' (125% of effective UL) | ✅ CC vitest |
| T6-ui-1 | Running-app exercise: ingredient at over-UL dose | Safety card surfaces correct color/badge tier; popover describes the limit + hazard | (operator) |
| T6-ui-2 | Running-app: dose changes update UL fire in real time | Reactive update on qty change | (operator) |

---

## Section 7 — Finding #26: Serving Size input UX (operator UI exercise — Phase 2 Step 2 work item)

These tests run against the running app after Finding #26 input UX fix lands in Phase 2 Step 2. **CC cannot drive a browser; operator drives these per Phase 2 hybrid verification plan.**

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T7-01 | Serving Size = 30, click arrow up | Increments to 31 (no wrap-around to 1) | (operator after fix) |
| T7-02 | Serving Size at configured max (e.g., 100), click arrow up | Stops at max; no wrap-around | (operator after fix) |
| T7-03 | Type "1.5" into Serving Size input | Value accepted (no rejection / no rounding to integer) | (operator after fix) |
| T7-04 | Type "2.5" into Serving Size input | Value accepted | (operator after fix) |
| T7-05 | Type "0.5" into Serving Size input | Value accepted per design decision (warn or accept — lock in at implementation) | (operator after fix) |

---

## Section 8 — Finding #27: Unit-change mass preservation (markdown verification; manual)

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T8-01 | Ingredient at 500 mg, change unit dropdown to "g" | Display = 0.5 g; underlying mass unchanged | (pending) |
| T8-02 | Ingredient at 500 mg, change unit dropdown to "mcg" | Display = 500000 mcg; underlying mass unchanged | (pending) |
| T8-03 | Ingredient at 2.5 g, change unit dropdown to "mg" | Display = 2500 mg; underlying mass unchanged | (pending) |
| T8-04 | Run cost / UL gate / spec coverage on same ingredient across each unit display | Identical values returned regardless of display unit | (pending) |

---

## Section 9 — F&B Round 10 regression (markdown verification; manual via running app)

These are the explicit non-regression cases per the directive. F&B mode must continue to function correctly post-Round-11.

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T9-01 | 1% citric in beverage matrix, F&B mode, productClass='beverage' | pH = 2.23 CALCULATED (still passes per Round 10 Test 1) | (pending) |
| T9-02 | Sodium benzoate at 100% mass, F&B mode, productClass='general' | Red Bucket A refuse-to-export fires (still passes per Round 10 Test 2) | (pending) |
| T9-03 | F&B workspace, sample formulation, change `productClass` | Findings re-evaluate per per-class rule scoping | (pending) |
| T9-04 | F&B workspace, view Filing Readiness widget | Pathway-aware widget continues to render (mode-gate at 25b only suppresses for supplement mode) | (pending) |

---

## Section 10 — 5 harm-critical items wiring (Step 4 parallel work)

Per the harm-critical floor inventory at [docs/architecture/harm-critical-floor.md](../architecture/harm-critical-floor.md). Each of the 5 items needs blocking-condition verification and pass-condition verification. Cases populated as Step 4 wiring lands.

| ID | Item | Blocking verification | Pass verification | Pass/Fail |
|----|------|----------------------|--------------------|-----------|
| T10-01 | §B1 Allergen detection | Formulation with "natural flavor" (unknown source) → output blocked with explicit message | Formulation with all allergen-mapped ingredients → `Contains:` statement generated correctly | (pending) |
| T10-02 | §B2 Disease-claim hard stop | Draft claim "treats arthritis" → blocked, non-overridable, suggestion offered | Draft claim "supports joint health" → permitted with auto-applied disclaimer | (pending) |
| T10-03 | §B3 Identity-test attestation | Dietary ingredient without identity-test record → MMR/BPR draft-only, export refused | All dietary ingredients with lot-linked customer-or-contracted-lab identity tests → export proceeds | (pending) |
| T10-04 | §B4 Disclaimer verbatim | Disclaimer constant edited away from CFR text → frozen-snapshot test fails | Disclaimer constant matches CFR singular/plural exactly → test passes; claim count determines singular vs. plural selection | (pending) |
| T10-05 | §B5 Net quantity unit conversion | Wrong unit conversion (e.g., g vs mg confusion in tool output) → cross-validation fails | Correct dual-unit declaration generated per CFR rounding rules; net contents = serving × servings cross-validation passes | (pending) |

---

## Section 11 — PDS generation (Step 4 / Track C; pending PDS pipeline)

Cases populated after PDS pipeline is implemented in Phase 3.

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T11-01 | Generate PDS for sample formulation | All required PDS content sections present (Supplement Facts with confidence labels, ingredient list, allergen statement, 21 CFR 111 cGMP attestation, manufacturer info, version hash, PA signature block) | (pending) |
| T11-02 | Generate PDS twice with same input formulation | Byte-identical output (reproducibility audit requirement) | (pending) |
| T11-03 | Attempt PDS export from formulation in `draft` state | Refused | (pending) |
| T11-04 | Attempt PDS export from formulation in `approved` or `version_locked` state | Succeeds | (pending) |

---

## Section 12 — PA-review state machinery (Step 4 / Track C; pending implementation)

Cases populated after PA-review state machinery is implemented.

| ID | Setup | Expected behavior | Pass/Fail |
|----|-------|-------------------|-----------|
| T12-01 | Happy path: formulation traverses `draft → submitted → approved → version_locked` | Each transition logs timestamp + actor + optional comment; PDS export succeeds at `approved` or `version_locked` | (pending) |
| T12-02 | Rejection path: `draft → submitted → rejected → draft → resubmit` | Each transition logged; rejection comment captured | (pending) |
| T12-03 | Edit attempt on `approved` formulation without explicit return to `draft` | Blocked | (pending) |
| T12-04 | Explicit return to `draft` from `approved` | Transition logged with timestamp + actor + reason; formulation re-editable | (pending) |

---

## Pass criteria (per directive)

- **Hard pass:** Actual displayed value matches expected exactly (within rounding tolerance for unit conversions)
- **Cascade pass:** Dependent values (UL gate, cost, spec coverage) verify clean post-correction
- **Regression pass:** Round 10 functionality remains intact (Section 9)
- **Pre-deploy gate:** Full suite passes before merge to main
- **Post-deploy gate:** Production smoke test passes before declaring Round 11 ship

---

## Pass/fail outcome population schedule

| Section | Population trigger |
|---------|--------------------|
| Section 1 (helper math-model) | Step 2 commit → red on supplement cases; Step 3 25a commit → green |
| Sections 2-3 (regulatory panel, HACCP) | Step 3 25b, 25c commits respectively |
| Sections 4-6 (cascade: cost, spec coverage, UL gate) | Phase 2 cascade verification |
| Sections 7-8 (Finding #26, #27) | Phase 2 input UX fixes |
| Section 9 (F&B regression) | Phase 4 pre-deploy + Phase 5 post-deploy smoke |
| Section 10 (harm-critical) | Step 4 parallel wiring as each item lands |
| Sections 11-12 (PDS, PA-review state) | Phase 3 Track C build |
