# Round 11 Directive

**Round:** 11
**Scoped:** 2026-05-15
**Launch anchor:** August 2026 — first paying Nutraceuticals customers
**Status:** Ready for CC implementation

---

## Launch Profile

**Option A — Nutraceuticals-only August launch.** F&B vertical hidden or beta-flagged at launch; F&B soft-launches in Q4 2026 with absorbed Nutraceuticals customer feedback.

Reasoning: P1 is Nutraceuticals per locked priority. F&B is in earlier maturity (catalog gaps, regulatory table audit not yet performed, multiple findings logged). Trying to ship both verticals at launch dilutes focus on the highest-priority vertical and compresses Round 12 below customer-zero readiness threshold. Single-vertical launch positions cleaner for early customer acquisition and Series A storytelling, and carves out the segment where Trustwell's competitive coverage is weakest.

---

## In-Scope Summary

**Track A — Nutraceuticals workspace correctness (launch-blocker):**
- Finding #25 minimal mode-gate fix (all six sub-issues 25a-f)
- Finding #26 Serving Size input UX
- Finding #27 Unit-change mass preservation

**Track C — Launch-critical workflow and export:**
- 5 harm-critical UNKNOWN items wired (CC enumerates at directive execution)
- PDS generation (single Dietary Supplement template, audit-reproducible PDF)
- PA-review state machinery (4-state model + rejection path)

**Track B — Entirely deferred.** F&B catalog and regulatory work picks up in Q4 2026 prep cycle.

---

## Track A — Implementation Details

### Finding #25 — Supplement workspace correctness pass

**Architectural decision:** Minimal mode-gate fix at the four known code points. Chassis is correct per audit memo (`docs/findings/nutraceuticals-workspace-audit-2026-05-15.md`); only the input-layer math and selected downstream render points need mode-gating.

**Code points to fix:**

- **25a — Line 792 (`app/workspace/page.tsx`):** Mode-gate `scale = servingSizeInGrams / totalBatchGrams`. In supplement mode, ingredient amounts are interpreted as per-serving doses, not recipe percentages of formulation mass.
- **25b — Line 1667 (`app/workspace/page.tsx`, Filing Readiness widget):** Mode-gate F&B regulatory panel rendering. Supplement mode renders zero F&B panels (no 21 CFR 113/114 acidified-foods, no Acid Food classification, no LACF logic, no low-acid components threshold).
- **25c — Line 769 (`app/workspace/page.tsx`, HACCP template selection):** Mode-gate framework selection. Supplement mode loads 21 CFR 111 cGMP framework. No food-domain hazards (Salmonella, E. coli flour, Cronobacter, mycotoxins) present in supplement HACCP rendering.
- **25d — Cost calculation cascade:** Re-derives correctly from corrected mass per 25a. Verify on multi-ingredient priced formulation.
- **25e — Spec coverage denominator:** Reports correct percentage with supplier-spec'd ingredients counted properly. No 0% reports when specs are present.
- **25f — UL gate cascade:** Fires warning under UL on corrected mass, hard-stop over UL on corrected mass. Gate operates on the displayed value post-fix, not on pre-fix F&B-percentage interpreted value.

**Phase 1 GO/NO-GO escalation rule:** If mode-gate implementation reveals cascading issues that resist contained fixes — meaning the audit memo overstated chassis correctness — escalate to deeper supplement workspace rebuild. Track C scope contracts to harm-critical items only; PDS and PA-review state machinery defer to Round 12. Decision point: end of Phase 1.

### Finding #26 — Serving Size input UX

- Arrow controls increment beyond 30 without wrap-around
- Decimal entries accepted (1.5, 2.5, 0.5, etc.)
- Maximum cap enforced (configurable, default likely 100)
- Sub-1 entry handling per design decision (warning or accept — lock in at implementation)

No architectural decision required. Polish bug, contained fix surface.

### Finding #27 — Unit-change mass preservation

- Unit change preserves underlying mass quantity, updates display value
- Verified across g↔mg, mg↔mcg, g↔mcg transitions
- Canonical storage in single internal unit (gram or kilogram); display layer renders in user-selected unit
- Downstream calculations (cost, UL gate, spec coverage) produce identical values regardless of display unit

No architectural decision required. Bug fix to standard expected behavior.

---

## Track C — Implementation Details

### 5 harm-critical UNKNOWN items wired

**CC task at directive execution start:** Enumerate the 5 items from existing codebase (`lib/supplementSafetyLimits.ts`, `lib/hardStop.ts`, `types/index.ts`, `lib/bucketAGate.ts`). Best-guess candidates pending confirmation: allergen master list completeness, disease-claim block enforcement, identity-test attestation per ingredient, disclaimer verbatim text verification, net quantity unit conversion.

**Deliverable per item:**
- Name, code location, blocking condition, pass condition, regulatory citation if applicable — captured in `docs/architecture/harm-critical-floor.md`
- Each item integrated into safety-floor enforcement at export gate
- Each item's blocking behavior verified — unsatisfied state refuses export
- Each item's pass behavior verified — satisfied state allows progression

### PDS generation

**Architectural decision:** Templated PDF generation using the `pdf` skill. Single template per product class; Round 11 ships Dietary Supplement template only. Additional templates evolve as future verticals open up.

**Required PDS content:**
- Supplement Facts panel with confidence-labeled values
- Ingredient list with confidence taxonomy (measured / calculated / estimated / inferred / unknown)
- Allergen statement
- 21 CFR 111 cGMP attestation block
- Manufacturer information
- Formulation version hash stamp
- PA signature / approval block

**Requirements:**
- Server-side generation, on-demand
- **Reproducibility (non-negotiable):** Same input formulation produces byte-identical PDF on subsequent generations. Audit requirement.
- **State gating:** PDS export refused unless formulation is in `approved` or `version_locked` state.

### PA-review state machinery (4-state)

**Architectural decision:** Separate review entity (not state-on-formulation). A formulation can have multiple reviews over its lifecycle (initial, post-amendment, annual recertification). Separate entity supports this without forcing formulation schema to carry review history.

**States:**
- `draft` — operator is editing the formulation
- `submitted` — formulation handed to PA for review
- `approved` — PA has signed off; formulation is review-locked
- `version_locked` — final immutable snapshot; PDS export proceeds

**Rejection path:**
- `submitted` → `rejected` → `draft` — PA rejection returns formulation to drafting for operator revision and resubmission

**Behaviors:**
- Every state transition logs timestamp, actor, optional comment
- Formulation is immutable after `approved` (cannot be edited without explicit return to `draft`, which logs the transition)
- PDS export only fires from `approved` or `version_locked` states
- Single-reviewer signoff in Round 11; multi-reviewer evolution in Round 12+

---

## Out of Scope — Explicit Deferrals

**Track C deferrals:**
- Pre-production checklist UI → Round 12 (customer-zero learnings shape it)
- Multi-reviewer signoff on PA-review state machine → Round 12+ (when scale demands)
- 6-state PA review with distinct `in_review` → Round 12+
- PDS multi-template support → Q4 F&B and beyond
- HACCP upload → Q4 F&B (supplements use 21 CFR 111 cGMP, not HACCP)
- R9 leftovers → CC inventory at directive execution; launch-floor items stay in Round 11, others defer

**Track B — entire track defers to Q4 F&B prep / Round 12+:**
- Findings #15, #16, #19, #20, #21, #23, #24
- Findings #28, #29, #30, #31, #32 (logged during 2026-05-15 session)
- Vendor portfolio expansion (Kalsec, OFI, Greenwood and Associates, Sweet Harvest, United Sugar Producers, Van Drunen Farms, Ingredion, Baumer Foods)

**Strategic roadmap items (separate from Round 11/12):**
- PA-Led HACCP Builder → Round 14-16 / Q4 2026 or Q1 2027 earliest
- Finding #17 — Formulation-feasibility detection layer → Round 14+

---

## Phase Sequence

Pacing is AI-augmented, not traditional-team-calendar. Each phase closes when its exit criteria are met; the August anchor bounds the calendar, but per-phase pacing is bounded by correctness.

### Phase 1 — Foundation and parallel kickoff

**Closes when:**
- CC has enumerated the 5 harm-critical UNKNOWN items and committed the inventory to `docs/architecture/harm-critical-floor.md`
- Pre-flight verification test cases for Finding #25 written before any fix code
- Finding #25 mode-gate implementation underway (sub-issues 25a, 25b, 25c land together as the mode-gate package)
- PA-review state machinery schema and entity definition begun (parallel work stream)
- 5 harm-critical items wiring begun (parallel work stream)
- **Phase 1 GO/NO-GO decision rendered:** minimal-fix viability confirmed, or escalation to deeper rebuild triggered (Track C scope contracts accordingly)

### Phase 2 — Track A completion and cascade verification

**Closes when:**
- Finding #25 sub-issues 25d (cost), 25e (spec coverage), 25f (UL gate) verified clean against pre-flight verification suite
- Findings #26 and #27 input UX fixes shipped
- All Track A pre-flight verification tests passing
- PA-review state machinery implementation continues in parallel
- 5 harm-critical items wiring completes

### Phase 3 — Track A QA and Track C export build

**Closes when:**
- Full Finding #25 pre-flight verification suite passes (single-ingredient, multi-ingredient, edge cases, cascades, F&B regression)
- PDS generation implemented (depends on Phase 2 Track A verification)
- PA-review state machinery completes and integration tests begin
- 5 harm-critical items integration tests begin

### Phase 4 — Integration and pre-deploy

**Closes when:**
- Full integration tests pass across Track A and Track C
- PA-review state correctly gates PDS export (export refused outside `approved` / `version_locked`)
- 5 harm-critical items correctly enforce safety floor at export gate
- Pre-deploy smoke test on production-equivalent build verified
- F&B mode regression confirmed — Round 10 functionality intact

### Phase 5 — Deploy and customer-zero kickoff

**Closes when:**
- Round 11 PR opened, reviewed, merged to main
- Production deploy clean
- Post-deploy production smoke test passes (full Round 11 deliverable walked on production)
- `docs/rounds/round-11-cumulative-summary.md` committed
- `docs/findings/round-11-verification-results.md` captures pre-flight verification outcomes per test
- Customer-zero documentation prep work begins, transitioning into launch readiness phase

---

## Pre-flight Verification Plan

Software-level verification of computed values. Distinct from physical bench tests (which are reserved for food-science laboratory work — acidified foods, pH probes, microbial challenge studies). Captured in `docs/findings/round-11-verification-tests.md` as implemented.

### Finding #25 verification cases

**Single-ingredient math model:**
- Vitamin C 500 mg, 2 capsules/serving → Expected display: 500 mg (the case that failed in 2026-05-15 smoke test)
- Vitamin C 1000 mg, 1 capsule/serving → Expected: 1000 mg
- Vitamin C 1900 mg, 1 capsule/serving → Expected: 1900 mg displayed, UL warning fired (under 2000 mg UL)
- Vitamin C 2500 mg, 1 capsule/serving → Expected: 2500 mg displayed, UL hard-stop fired (over 2000 mg UL)
- Vitamin D3 25 mcg, 2 capsules/serving → Expected: 25 mcg displayed (failed in smoke test)
- Zinc 15 mg, 2 capsules/serving → Expected: 15 mg displayed (failed in smoke test)
- Biotin 30 mcg, 1 capsule/serving → Expected: 30 mcg displayed (low-dose case)
- Magnesium 400 mg, 4 capsules/serving → Expected: 400 mg displayed (high-dose case)

**Multi-ingredient (Immune Support Stack from 2026-05-15 smoke test):**
- Vitamin C 500 mg + Vitamin D3 25 mcg + Zinc 15 mg, 2 capsules/serving → All three display entered values

**Edge cases:**
- Boundary serving sizes (1, 30, decimal values)
- Unit-change scenarios interacting with Finding #27 fix
- Very-low dose (biotin µg-range) and very-high dose (magnesium g-range)

**Regulatory panel rendering (sub-issue 25b):**
- Pure Nutraceuticals workspace → No F&B panels rendered
- F&B → Nutraceuticals mode switch → Regulatory panels clear
- DSHEA determination renders correctly

**HACCP framework selection (sub-issue 25c):**
- Supplement mode → 21 CFR 111 cGMP framework loaded
- Food-domain hazards absent (no Salmonella, E. coli flour, Cronobacter, mycotoxins)

**Cost calculation cascade (sub-issue 25d):**
- 3-ingredient priced formulation cost-per-serving matches manual verification

**Spec coverage cascade (sub-issue 25e):**
- All spec'd → 100%; 2/3 spec'd → 67%; no specs → 0%

**UL gate cascade (sub-issue 25f):**
- Verified on corrected mass values (warning, hard-stop boundaries)

### Finding #26 verification cases

- Arrow up from 30 → 31 (no wrap)
- Arrow up at configured max → stops at max
- Decimal entries (1.5, 2.5, 0.5) → accepted
- Sub-1 entry handling per design decision

### Finding #27 verification cases

- 500 mg → dropdown to g → display 0.5 g, underlying mass unchanged
- 500 mg → dropdown to mcg → display 500000 mcg, underlying mass unchanged
- 2.5 g → dropdown to mg → display 2500 mg
- Cost, UL gate, spec coverage produce identical values across display unit selections

### 5 harm-critical items verification cases

Once CC enumerates: for each item, verify blocking behavior on unsatisfied state and pass behavior on satisfied state.

### PDS generation verification cases

- Generate PDS for sample formulation → All required fields present
- Reproducibility test: generate twice with same input → byte-identical output
- State gating: try PDS export from `draft` → refused; from `approved` → succeeds

### PA-review state machinery verification cases

- Happy path: `draft → submitted → approved → version_locked`
- Rejection path: `draft → submitted → rejected → draft → resubmit`
- Immutability: edit attempt on `approved` formulation → blocked
- State transition logging: every transition logs timestamp + actor + optional comment

### F&B regression verification

- Round 10 Test 1: 1% citric in beverage matrix → pH 2.23 CALCULATED (still passes)
- Round 10 Test 2: Sodium benzoate at 100% mass General productClass → red Bucket A refuse-to-export (still passes)

### Pass criteria

- **Hard pass:** Actual displayed value matches expected exactly (within rounding tolerance for unit conversions)
- **Cascade pass:** Dependent values (UL gate, cost, spec coverage) verify clean post-correction
- **Regression pass:** Round 10 functionality remains intact
- **Pre-deploy gate:** Full suite passes before merge to main
- **Post-deploy gate:** Production smoke test passes before declaring Round 11 ship

---

## Exit Criteria

A first paying Nutraceuticals customer in August can demonstrably:

1. Build a supplement formulation with correctly displayed Supplement Facts values
2. See harm-critical safety enforcement (UL caps, allergens, etc.) firing on correct values
3. Get cost and spec coverage analysis on the correct math model
4. Walk through the PA-review workflow (draft → submit → approved → version-locked)
5. Receive an audit-ready PDS PDF reproducible byte-for-byte
6. Hand the PDS to their manufacturer with the responsibility boundary documented

If any of those is not demonstrable end-to-end on production, Round 11 is not done.

---

## Decision Gates and Escalation Rules

| Gate | When | Decision |
|------|------|----------|
| Phase 1 GO/NO-GO | End of Phase 1 | Continue minimal-fix path, or escalate to deeper supplement workspace rebuild (Track C contracts) |
| Cascade verification | End of Phase 2 | All Finding #25 sub-issues clean, or extend fix-loop (Track C scope contracts if loop exceeds buffer) |
| Integration readiness | End of Phase 4 | Full deliverable verified, or extend to Phase 5 buffer |
| Pre-deploy | Before merge to main | Full pre-flight verification suite passes, or hold ship |
| Post-deploy | After production deploy | Production smoke test passes, or roll back |

---

## Round 11 Completion Definition

Round 11 is complete when:

1. All Track A in-scope findings (#25, #26, #27) verified clean on production
2. All Track C in-scope items (5 harm-critical wired, PDS generation, PA-review state machinery) verified clean on production
3. Production smoke test passes on full Round 11 deliverable
4. F&B Round 10 functionality intact (regression verified)
5. All Round 11 findings updated in tracking docs (closed, verified clean, escalated, or carried forward)
6. `docs/rounds/round-11-directive.md` (this document) archived
7. `docs/rounds/round-11-cumulative-summary.md` written and committed
8. `docs/findings/round-11-verification-results.md` captures verification outcomes
9. Round 12 directive scoping picks up in fresh session with Round 11 outcomes as input

---

## Notes for CC

- Maintain bench-test pre-flight discipline per `feedback_bench_test_computed_values_pre_flight.md` memory file (the internal name stays; conversational language uses "pre-flight verification")
- Defer-permission discipline applies — surface decisions, do not assume
- Tool-first discipline — prefer Write tool over heredoc for multi-line content (Windows Git Bash environment)
- Session tracking — log any frustrations, problems, or new findings immediately to the running session backlog
- Outstanding rename / branding-update task — actively tracked, surface if relevant context emerges

---

*Round 11 directive locked. Implementation begins in fresh CC session.*
