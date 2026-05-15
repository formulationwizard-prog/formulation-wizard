# Round 10 — Chemical-Limit Correctness Foundation

Drafted 2026-05-14, superseding the prior "AF Harm-Critical Documentation Infrastructure" draft of the same date. The original directive scoped documentation infrastructure on top of the existing chemical-limit and pH-math layers. Pre-flight investigation surfaced two correctness issues (Concern 1: harm-critical FDA safety limits ship without enforcement; Concern 2: pH math in `lib/foodScience.ts:1090-1094` is structurally flawed for single-acid systems) plus six new findings (N1–N6) about prior-art that the original directive missed.

The operator's lock: build documentation infrastructure on a corrected math/science foundation with hard-stop enforcement across Bucket A, not on top of known-wrong layers. Round 10 narrows to the foundation. Round 11 (then-current code state) drafts the documentation-infrastructure scope that the original Round 10 captured.

This is a denser round than the original directive scoped. The August 2026 Nutraceuticals MVP target stands; downstream timeline implications surface honestly. Brand vision requires completeness over partial-on-time — shipping false-completeness on chemical safety is the disqualifying option for a workspace customer-zero will use to file with Process Authorities.

---

## Required Reading

Before scoping or implementing, read:

- `docs/rounds/round-9-directive.md` (prior round, defer-permission discipline, confidence taxonomy)
- `docs/brand/brand-book-part-1.md` (operator audience, brand vision, false-completeness as disqualifier)
- `docs/brand/brand-book-part-2.md` (voice and tone discipline)
- `docs/design/filing-readiness.md` (pathway-aware distance metric, confidence weights)
- `lib/foodScience.ts` (full file — pH math at lines 1090-1094, self-documenting comment at 197-207, `classifyFormulation()` provenance gate at 865, `REGULATORY_DISCLAIMER` constant at 32-33)
- `lib/regulatoryLimits.ts` (full file — 18-entry table at 42-200, `findLimit` substring-match function, `checkCompliance` denominator computation)

The AF spoke verification audit (`docs/audits/acidified-foods-spoke-verification-2026-05-12.md`) and the catalog audits remain in the repository but are **not required reading for Round 10**. The verification-discipline section below explains why.

If any required document is missing, halt and report before proceeding.

---

## Verification Discipline (N6 — methodological, inherited by future rounds)

Audit documents in `docs/audits/` are snapshots from the date of creation, not current state of the code. The AF spoke verification audit explicitly self-disclaims as "not a fresh codebase verification run." Each round's required-reading list may reference audits whose findings have shifted as code evolved.

**Treat audit documents as pointers to investigate, not as authoritative current state.** When in doubt, verify against current code first. Cite audits for context and history; cite code for current behavior.

This principle inherits to every future round. Audit-driven directives carry the same skepticism toward the audit document. A round that fails to verify audit claims against current code is operating on stale ground.

---

## Goal

Land the chemical-limit and pH-math correctness foundation that Round 11's PA-review state machinery and documentation artifacts will build on. Three intertwined concerns resolve together because they share the same architectural seams (confidence taxonomy threading, hard-stop pattern, schema additions, product-class plumbing):

1. **Concern 2** — Single-acid Henderson-Hasselbalch in place of the structurally flawed pH math
2. **Concern 1** — Full chemical-safety correctness: enforcement gate on existing 18 substances, all sweep-surfaced data-layer corrections, per-context limit and prohibition application, new regulated-substance entries
3. **Path A product-class plumbing** — `productClass` field on the formulation data model, threaded to `checkCompliance`, supporting contextual enforcement that Concern 1's Tier 2 corrections require

The round's deliverable in one sentence: a workspace where chemical-safety enforcement is correct, complete, and confidence-aware, with the data-model plumbing that makes per-context rules first-class.

---

## Foundational Architecture

### Hard-stop pattern (architectural model, not net-new construction)

N1 surfaced that hard-stop infrastructure is partially shipped. `classifyFormulation()` at `lib/foodScience.ts:865` carries a working "DO NOT WEAKEN THIS GATE" provenance gate that refuses-to-classify when verified mass coverage is below 80% or any single unverified ingredient exceeds 10%. Supplement-side `summarizeFindings()` already returns a `hardStop: boolean` semantic. Round 10's Bucket A enforcement gate **extends** this pattern as refuse-to-export — the natural extension of refuse-to-classify.

Implement the Bucket A gate by mirroring the provenance gate's structure: same load-bearing comment discipline, same explicit refusal-state return shape, same "do not weaken" stewardship.

### Confidence taxonomy propagation (per 2026-05-07 honest-estimate reframe)

The May 7 honest-estimate-engine articulation lives at `types/index.ts:5-20`; `lib/copy/strings.ts:25-91` operationalizes it across customer-facing determination outputs. Round 10's new computed values integrate the taxonomy from inception per this framing.

Every new computed value in Round 10 integrates the confidence taxonomy from inception, not retrofit:

- **Concern 2 pH math** — MEASURED `pKa` → CALCULATED pH; ESTIMATED `pKa` → ESTIMATED pH at best. The output confidence is bounded by the lowest-confidence input.
- **ComplianceFinding** gains an `inputConfidence` field separate from the cap-side confidence. Regulatory caps themselves are MEASURED (regulatory citation = exact); input mass values carry their own confidence (declared mass MEASURED; inferred fat content of upstream ingredients ESTIMATED or INFERRED).

Existing computed values not touched in Round 10 are out of scope for this pass; surface-as-finding if implementation reveals threading gaps.

### Gate input-confidence threshold (Decision #9)

The Bucket A enforcement gate fires conditional on input confidence:

- **MEASURED or CALCULATED inputs + over-cap → hard-stop.** Refuse-to-export. Visible in UI as Bucket A enforcement, mirroring `classifyFormulation`'s refuse-to-classify pattern.
- **ESTIMATED or INFERRED inputs + apparent-over-cap → PA-reviewable finding** with confidence attribution. No hard-stop; surfaces as Bucket B treatment requiring PA judgment.
- **Missing inputs → insufficient-data pattern** per existing `classifyFormulation` behavior.

UI surfaces both cap-side confidence and input-side confidence on every finding panel. Customer-zero must be able to see whether a near-cap finding is "definitely over" or "over according to estimates."

### Product-class plumbing (Path A — explicit declaration, Decision #8)

Composition inference for regulatory enforcement is too brittle for harm-critical use. Mock-meat formulations, gluten-free baked goods, marinades that aren't cures — too many edge cases where the engine could silently apply the wrong gate. **Path A:** `productClass` is a user-set field on the formulation data model.

**Required at formulation creation.** No default-uncategorized state. A formulation cannot exist without a `productClass`. The creation flow blocks until `productClass` is selected. This mirrors the explicit-assertion principle: gate decisions are on explicit user assertion, not inference or default. A default-uncategorized state would reintroduce the silent-wrong-gate failure mode that Path A exists to prevent.

**Single `productClass` per formulation in v1.** Multi-class formulations (e.g., a beverage-with-cured-meat-component, a meal kit spanning baked-good and cured-meat artifacts) are deferred to Round 11+ pending design pass on multi-class data-model and findings-panel implications. Surface as finding if implementation reveals v1 formulations that genuinely span categories.

**Change-event behavior:**

- `productClass` is mutable mid-formulation; change triggers compliance re-evaluation against the new context
- When the formulation has **no active findings**, the change applies silently. The findings panel updates per the new context with no modal interaction
- When the formulation has **active findings**, the change requires explicit confirm-dialog. The dialog names the affected findings ("This change will invalidate the following findings and re-evaluate against [new class]") and the user must confirm before the change applies. Cancel reverts the selection
- `productClass` is part of any cache key used for compliance findings
- UI subscribes to `productClass` changes so the findings panel reflects current context

Composition-inference may return later as a suggestion/pre-fill ("based on your formulation, this looks like cured meat — confirm?") but the gate decision is on explicit user assertion, not inference.

---

## In Scope for Round 10

### 1. Hard-stop infrastructure extension (foundation — implement first)

Refuse-to-export pattern as architectural sibling of `classifyFormulation`'s refuse-to-classify. Mirror the provenance gate's structure including the "DO NOT WEAKEN THIS GATE" stewardship comment.

This is load-bearing under Round 11's PA-review state machinery. Round 11's field-level authority gate composes from this primitive.

### 2. Concern 2 — Single-acid Henderson-Hasselbalch

**Location:** `lib/foodScience.ts:1090-1094`. Self-documenting comment at `lines 197-207` describes the original flaw direction (over-reports pH, miscategorizing acid-food into acidified-food pathway). Bench test on 2026-05-14 of the canonical single-acid case (1% citric acid + water) showed the flaw is structural across the dilute single-acid range, not bounded to <0.5% acidulant: engine reports pH 4.20 ± 0.20 CALCULATED vs reference value ~2.20 — a 2-pH-unit error (100x in [H+]). Tier A is the structural replacement of the math, not a fine-tuning of the existing approximation.

**Schema additions on `IngredientSpec`:**

- `pKa1?: number` — first dissociation constant
- `acidMolarMass?: number` — for the eight standalone acids
- `bufferingBehavior?: 'known-buffering'` — flags ingredients whose matrix composition exceeds single-acid H-H reach. Optional, additive. Absence means "not flagged as buffering." Future extensions may add `'mild-buffering'` or `'amphoteric'`; v1 needs only the binary signal.

**Detection logic (Rules A and B).** Naive application of single-acid H-H to multi-acid or buffered systems would produce CALCULATED-marked output with structurally wrong values — the same failure mode as the current flaw, in a different direction. Tier A must KNOW when to apply H-H and when to honestly fall back to ESTIMATED. Two-rule sequence gates eligibility:

- **Rule A — Acid Count Check (gates H-H eligibility on acid composition).** Count ingredients with `pKa1` metadata > 0 in the formulation:
  - Exactly 1 → proceed to Rule B
  - 0 → output `insufficient-data` (no acid detected)
  - ≥ 2 → output ESTIMATED with wide bounds (multi-acid exceeds single-acid H-H reach)

- **Rule B — Buffering-Ingredient Check (gates H-H eligibility on matrix composition).** Check if any ingredient is flagged `bufferingBehavior: 'known-buffering'`:
  - If yes → output ESTIMATED (buffering exceeds H-H reach)
  - If no → apply H-H math; output CALCULATED with MEASURED `pKa` propagation per the locked taxonomy

**Confidence taxonomy table (Concern 2 outputs):**

| Inputs | Rule outcome | Output |
|---|---|---|
| MEASURED `pKa` + 1 acid + no known-buffering ingredient | H-H applies | CALCULATED pH (target) |
| MEASURED `pKa` + 1 acid + known-buffering ingredient | Rule B fallback | ESTIMATED pH |
| MEASURED `pKa` + ≥ 2 acids | Rule A fallback | ESTIMATED pH |
| ESTIMATED `pKa` (catalog estimate, not USP/FCC cited) | input confidence bounds output | ESTIMATED pH |
| No `pKa` data on any acid | Rule A — 0 case | `insufficient-data` (existing pattern) |

Output pH confidence is bounded by `pKa1` confidence on the input AND by which rule branch was taken.

**Catalog work for v1 — known-buffering ingredient categories.** During Section 2 implementation, tag the following ingredient categories with `bufferingBehavior: 'known-buffering'`:

- Tomato products (paste, sauce, concentrate, puree)
- Dairy products (milk, cream, yogurt, cheese, casein, whey)
- Meat products (any meat ingredient with significant protein content)
- Eggs and egg derivatives
- Gelatin
- Protein isolates (whey, soy, pea, hemp, casein concentrate)

Operator + PA can extend the list if additional categories surface during implementation. Surface as finding (see Finding #10) rather than expanding the binary signal to multi-tier unilaterally.

**Out of scope:** Tier B (multi-acid buffer equilibrium) and Tier C (multi-acid with ionic-strength corrections). Tier B is Round 11+ candidate pending validation data; Tier C is research-grade and not on the current roadmap. Multi-tier buffering classification (`'mild-buffering'`, `'amphoteric'`) is also Tier B+ scope; v1 stops at the binary `'known-buffering'` signal.

### 3. Concern 1 — Full chemical-safety correctness

#### 3a. Schema additions on `RegulatoryLimit` interface (`lib/regulatoryLimits.ts`)

All optional, additive to existing shape:

- `denominatorBasis?: 'total' | 'fat-and-oil' | 'meat' | 'baked-good'` — explicit denominator; defaults to total formulation mass when absent
- `appliesToCategories?: string[]` — productClass keys where this limit is active
- `prohibitedInCategories?: string[]` — productClass keys where the substance is prohibited (any use is a violation)
- `contextualLimits?: Array<{ context: string, maxPpm?: number, maxPercent?: number }>` — per-subtype overrides on the base limit (sodium nitrite subtypes)
- `combinedBudgetGroup?: string` — entries with the same group key share a single budget (binders dairy + soy)
- `declarationTriggerPpm?: number` — separate gate for label-declaration requirement (sulfites 10 ppm)

#### 3b.1. Context-independent data-layer corrections

These corrections do not depend on Path A productClass plumbing. Implementable before Path A lands.

**1 combined-budget fix:** Binders (dairy) and Binders (soy) share `combinedBudgetGroup: 'meat-binder'` per 9 CFR 319.140. `checkCompliance` aggregates entries in the same group against the 3.5% cap.

**1 declaration-trigger gate:** Sulfites — `declarationTriggerPpm: 10` per 21 CFR 101.100. Fires as a separate finding distinct from the 100 ppm cap, surfacing the labeling requirement at the lower threshold.

**1 substring-match precision improvement:** `'sulfite'` — apply trailing-space pattern discipline (`'sulfite '`) matching the existing `'bha '` / `'bht '` pattern, reducing false-positive risk on "sulfite-free" or similar substring collisions.

#### 3b.2. productClass-dependent data-layer corrections

These corrections compose on Path A productClass plumbing (and the per-ingredient categorization metadata that lands alongside it). Implementable after Path A lands.

**9 denominator-basis fixes** (BHA/BHT pattern siblings):

- BHA, BHT → `denominatorBasis: 'fat-and-oil'` (caps apply across formulations containing fat/oil; `appliesToCategories` left unrestricted)
- Prague Powder #1, Prague Powder #2, Morton Tender Quick → `denominatorBasis: 'meat'`, `appliesToCategories: ['cured-meat']`
- Phosphates (meat), Erythorbate / Ascorbate (in cures), Binders (dairy), Binders (soy) → `denominatorBasis: 'meat'`, `appliesToCategories: ['cured-meat']`

`checkCompliance` computes meat-basis percentage from the formulation's meat ingredients (identified via per-ingredient categorization metadata). Fat-and-oil basis computes from fat-content metadata on ingredients. productClass determines via `appliesToCategories` whether meat-basis limits are enforced at all.

**1 false-positive precision fix (active misfire in shipped code):** Ascorbic acid / vitamin C currently matches the cured-meat 547 ppm cap via substring on `'ascorbic acid'` and `'vitamin c'`. Beverages and fortified foods are flagged against a cap that doesn't apply (21 CFR 182.3013 GRAS governs non-meat use at much higher allowable levels). Fix: scope the existing entry to cured-meat productClass via `appliesToCategories: ['cured-meat']`. Confirm no other entry inadvertently captures vitamin C use outside cured meat.

**1 substring-match precision improvement:** `'sodium phosphate'` — scope to cured-meat productClass (`appliesToCategories: ['cured-meat']`) so buffer-salt use in beverages is not falsely capped at 0.5%.

**3 per-context limit applications:**

- Sodium nitrite — `contextualLimits` for: most cured/comminuted meats 156 ppm (base), pumped bacon 120 ppm, immersion-cured bacon 200 ppm, dry-cured bacon 250 ppm
- Sodium propionate, Calcium propionate — `appliesToCategories: ['baked-good']` so the 0.32% cap doesn't apply outside baked goods

**2 per-context prohibitions:**

- Sodium nitrate, Potassium nitrate — `prohibitedInCategories: ['bacon']`. Prohibited in bacon since 1974. Any use in a bacon formulation is a violation, not a near-cap.
- Sulfites — `prohibitedInCategories: ['fresh-produce']`. Prohibited per 21 CFR 182.3862. Any use on fresh produce is a violation.

#### 3c. New regulated-substance entries (operator + PA enumeration)

Net-new additions to `REGULATORY_LIMITS`:

- LAE — 21 CFR 184.1118
- Natamycin
- Sodium diacetate
- Nisin
- Common e-numbers as operator + PA enumeration produces them during implementation

PA review on the citations and caps before commit. New entries get full schema treatment (denominatorBasis, appliesToCategories, contextualLimits as appropriate) from inception, not as retrofit.

#### 3d. Bucket A enforcement gate (refuse-to-export)

Implements the hard-stop pattern from Section 1 over `ComplianceFinding[]`. Gate logic per Decision #9:

```
For each finding in checkCompliance output:
  If finding.violated AND finding.inputConfidence in (MEASURED, CALCULATED):
    → hard-stop. Refuse-to-export. Surface as Bucket A enforcement violation.
  If finding.violated AND finding.inputConfidence in (ESTIMATED, INFERRED):
    → PA-reviewable finding. Surface with confidence attribution. No hard-stop.
  If finding inputs missing:
    → insufficient-data per existing pattern.
```

Mirrors `classifyFormulation`'s gate structure. Same "DO NOT WEAKEN THIS GATE" stewardship comment. Same explicit refusal-state return shape.

### 4. `REGULATORY_DISCLAIMER` modification tracking (N3)

Constant at `lib/foodScience.ts:32-33` is locked-text precedent for the Bucket A "disclaimer verbatim text" item. Add:

- Commit-author trail for changes to the constant
- Change-control on the constant (test that asserts the locked text matches a frozen snapshot; any change requires explicit operator approval in the PR description)

Small addition, completes the Bucket A item explicitly without inventing a new mechanism.

### 5. Test coverage (~25-30% of total Tier 1+2 implementation footprint, budgeted explicitly)

Test fixtures required:

- **Mixed-mass for denominator validation** — formulations with non-meat mass (brine, marinade, filler) so the meat-basis fix is exercised against real ratios
- **Fat-containing for fat-and-oil basis** — BHA/BHT validation against formulations with declared fat content
- **Per-category for context routing** — bacon (nitrite subtypes), fresh produce (sulfite prohibition), baked goods (propionate scope), beverages (vitamin C precision)
- **Co-occurrence for combined-budget** — binders dairy + soy at and over the 3.5% combined cap
- **Acid-food edge case for Henderson-Hasselbalch** — ≤0.5% acidulant formulations exercising the current under-reporting case; verify CALCULATED pH lower than current ESTIMATED pH on the same inputs
- **Confidence-propagation tests** — MEASURED pKa → CALCULATED pH; ESTIMATED pKa → ESTIMATED pH; missing pKa → insufficient-data
- **Hard-stop gate boundary tests** — input-confidence at MEASURED, CALCULATED, ESTIMATED, INFERRED, missing; verify gate fires only on MEASURED/CALCULATED + over-cap, PA-review on ESTIMATED/INFERRED + over-cap
- **Canonical regression fixtures for Tier A** (verified by bench test 2026-05-14):

  Positive cases (Rules A/B clear; apply H-H, output CALCULATED):
  - 1% citric acid (anhydrous) + 99% water → pH 2.20 ± 0.05, CALCULATED with MEASURED `pKa1` = 3.13
  - 0.5% citric acid + 99.5% water → pH 2.36 ± 0.05, CALCULATED
  - 0.1% citric acid + 99.9% water → pH 2.71 ± 0.10, CALCULATED (approximation widens at very dilute)
  - 1% acetic acid (glacial) + 99% water → pH 2.77 ± 0.05, CALCULATED with MEASURED `pKa` = 4.76

  Negative cases (Rules A/B decline H-H; output ESTIMATED):
  - 1% citric + 1% acetic + 98% water → ESTIMATED, NOT CALCULATED (Rule A multi-acid fallback)
  - Ketchup test formulation (vinegar + tomato paste + sugar + water + spices) → ESTIMATED, NOT CALCULATED (Rule B known-buffering fallback; tomato paste flagged)

  **Acceptance criterion for Tier A:** all six fixtures land correctly — positive cases produce CALCULATED pH within bounds; negative cases produce ESTIMATED (NOT CALCULATED). Pre-fix engine reports pH 4.20 ± 0.20 on the 1% citric case (documented 2026-05-14 bench test); pre-fix has no detection logic so negative cases would emit CALCULATED with structurally wrong values (e.g., naive H-H on ketchup computes ~2.87 from acetic alone vs commercial 3.7-4.0). The negative cases verify Tier A correctly DECLINES to compute CALCULATED — this is what prevents trading one structural flaw for another. Section 2 is not complete until both positive AND negative cases pass.

If implementation surfaces test scenarios beyond this list, add them; do not skip them. The test budget is real work, not afterthought.

---

## Out of Scope (Round 11)

The original Round 10 documentation-infrastructure scope moves here, augmented by the Round 10 foundation it builds on:

- PA-review state machinery (field-level authority architecture, per-field locking, version history)
- Packaging Data Sheet (artifact, fields, PA-establishes authority on Fill Temp / Inversion Time / Hold Time)
- Pre-production checklist (per-product template, harm-critical authority)
- Five Round 9 harm-critical UNKNOWN items wired through the architecture (Scheduled Process, Container integrity, FCE registration, SID submission, PA sign-off docs)
- Verified HACCP upload surface (B4 — Filing Readiness floor unlocks once wired)
- Round 9 leftovers: regulatory-classification panel naming, pathway-revert detection, Acid Food (21 CFR 114.3(b)(1)) reduced-requirement set, Surface 1 discoverability variant
- Acid Food reduced-requirement decision (C1 — depends on Concern 2 Tier A landing in Round 10 first)
- Pre-flight on Audit Items 1, 3, 6 (original Round 10 pre-flight; now Round 11 pre-flight)

The seven Round 11 scope decisions deferred per the Round 10/11 split (PDS method scope, CIT field structure, AF reduced-requirement set, HACCP keep-in-budget, confidence taxonomy mapping for PA-established fields, Surface 1 discoverability variant, Finding 1 removal from directive) lock when the Round 11 directive drafts against then-current code state.

## Out of Scope (Round 12+)

- Concern 2 Tier B (multi-acid buffer equilibrium) — pending validation data
- Concern 2 Tier C (multi-acid with ionic-strength corrections) — not on roadmap
- Base Sheet vs Batch Sheet differentiation
- Editable batch sheet units
- Phase 2 spec verification (Iron Bisglycinate Fe%, L. acidophilus NCFM CFU, Calcium Carbonate Limestone Commodity)
- Licensing verification (L. paracasei F19 Probi standalone B2B)
- Spec system multi-product-class expansion (tablet/capsule/softgel hardness, friability, disintegration, peroxide value, CFU metrics)
- Nutraceuticals workspace work (separate verification round)
- Spoke copy revisions (deferred until Round 11 ships and capability inventory runs)

---

## Verification Path

**Path 2** (local dev visual review before commit). Schema additions on `RegulatoryLimit` + new `inputConfidence` on `ComplianceFinding` + new `productClass` data-model field + new Bucket A gate behavior compose to a high-blast-radius UI change requiring visual.

Verification gates:

1. `npx tsc --noEmit` clean
2. `next build` clean
3. Test suite green including all new fixtures listed in Section 5
4. Local dev visual review of:
   - `productClass` selector at formulation creation + change-event re-evaluation
   - Compliance findings panel with both `inputConfidence` and cap-side confidence visible
   - Hard-stop gate on Vitamin C scenario (beverage formulation — formerly false-positive — now passes without cured-meat cap firing)
   - Per-category enforcement: cured-meat formulation with bacon productClass shows nitrite subtype routing; fresh-produce formulation with sulfite shows prohibition; baked-good formulation with propionate shows in-scope cap
   - pH math: ≤0.5% acidulant formulation shows CALCULATED pH lower than the current ESTIMATED reading, with confidence attribution
   - Combined-budget: NFDM + soy isolate formulation showing aggregate enforcement
   - Declaration trigger: sulfite 15 ppm formulation surfaces labeling-required finding distinct from over-cap
5. Hard-stop gate boundary check: MEASURED + over-cap refuses-to-export; ESTIMATED + over-cap surfaces as PA-reviewable; both visible in UI
6. `REGULATORY_DISCLAIMER` change-control test: snapshot assertion passes on current text; deliberate test-only change shows the assertion failure mode

**Hold push pending operator spot-check after Vercel rebuild.**

---

## Commit and Branching

Branch: `feat/round-10-chemical-limit-correctness`. Do not push to main. Stay on the feature branch. Open a PR draft when ready; do not merge without operator review.

Audit-trail commit message format per Rounds 8 and 9: what was built, what tuning happened, what was deferred (with Round-11-or-later attribution), any findings surfaced during implementation.

---

## Findings to Surface (defer-permission discipline per Round 9)

If any of the following surface during implementation, defer rather than expand silently. Surface as Round 10.5+ ticket with the architectural question stated.

1. **Tier 2 per-context limits revealing more product subtypes** than the enumerated four (cured-meat, bacon, baked-good, fresh-produce). E.g., if dairy or fermented-foods categories require additional sulfite or nitrate handling not captured by the current enumeration.

2. **New regulated-substance enumeration producing edge cases** beyond LAE / natamycin / sodium diacetate / nisin / common e-numbers. Operator + PA review converges on the list; surface if the PA flags additional substances as Round 10 candidates rather than expanding scope unilaterally.

3. **Multi-class formulations.** V1 ships single productClass per formulation. If implementation surfaces formulations that genuinely span multiple regulatory categories (a beverage-with-cured-meat-component, a meal-kit containing both baked-good and cured-meat artifacts), surface as Round 11+ finding rather than expanding the data model unilaterally. The required-to-set + confirm-on-change-with-active-findings spec from the Path A section is the locked v1 surface; do not extend it.

4. **Confidence-threading gaps on existing computed values** not flagged in pre-flight. Round 10 threads confidence through new computed values only. If existing values (aw computation, classification heuristics, Filing Readiness inputs) show threading gaps that compose with the new threshold, surface as Round 11 finding rather than expanding Round 10.

5. **Cached-compliance invalidation revealing more memoization sites** than the obvious findings-panel + sticky-status-bar. Sweep the codebase for compliance-finding consumers as part of implementation; if more than five distinct sites need productClass-aware invalidation, flag for design pass before committing.

6. **Schema additions blast-radius surfacing downstream consumers** requiring migration. The new fields on `RegulatoryLimit` and `ComplianceFinding` are optional/additive, so consumers should continue working. If any consumer does strict-shape validation (e.g., zod schema, runtime assertion) that rejects additional fields, flag for design pass.

7. **Substring-match precision fixes revealing more collisions** than the three enumerated (vitamin C, sodium phosphate, sulfite). Round 10 corrects the three known issues; sweep the rest of the `namePatterns` arrays during implementation. If additional collisions surface, decide per-collision whether to fix in Round 10 (small) or defer (large).

8. **Concern 2 schema additions blast-radius on `IngredientSpec`.** New `pKa1?` and `acidMolarMass?` are optional, but if any consumer enumerates `IngredientSpec` keys (Object.keys, exhaustive switch), flag before committing.

9. **aw math at high solute loads.** Bench test on ketchup (40% tomato paste, 22% sugar) showed engine aw 0.880 vs commercial 0.94–0.96 — solute-effect over-weighting. aw math is correct for low-solute cases (verified on 1% citric + water at 0.990). Different concern from pH math; surface as Round 11+ finding for separate investigation. Round 10 implementation does not address aw math.

10. **Rules A/B detection-logic edge cases.** Section 2's two-rule detection logic gates H-H eligibility on acid count (Rule A) and known-buffering ingredient presence (Rule B). If implementation surfaces edge cases not handled by the spec — ingredient borderline between buffering and non-buffering, multi-tiered buffering behavior, formulations where Rule A counts an ingredient as "an acid" but its `pKa` is far from food-relevant pH range, ambiguous ingredients where Rule B fires but the matrix isn't actually buffering for this acid — surface as finding before expanding scope. The two-rule logic with binary `bufferingBehavior` is the locked v1 detection logic; multi-tier classification (`'mild-buffering'`, `'amphoteric'`) and acid-pKa-relevance gating are Tier B / Round 11+ scope.

11. **Complex-matrix acid sources need explicit acid-mass fraction.** Tier A's `computeSingleAcidPH` derives acid moles via `mass × (1 − moisture/100) / acidMolarMass`. This works for pure crystalline acids, simple dilute acid solutions (lactic 88%, phosphoric 85%), crystalline monohydrates (citric mono), and simple dilute vinegars where moisture + aceticAcid ≈ 100. It breaks for **complex-matrix acid sources** where significant non-water solutes coexist with the acid: balsamic vinegar (29% sugars), vinegar powders (~50% maltodextrin carrier), smoke flavor (phenolics + carbonyls), juices with natural acids. v1 leaves these entries untagged with `pKa1` so they fall into Rule A `not-applicable` and the legacy log-space math runs unchanged. Round 11+ may add an `acidMassFraction?: number` field on `IngredientSpec` for explicit override, enabling chemistry-sound H-H for complex matrices. Catalog work would re-tag balsamic, vinegar powders, smoke flavor, and natural-acid juices once the schema lands. Surface as finding if implementation reveals more complex-matrix cases beyond the four enumerated.

---

## Honest framing on Round 10's deliverable

"Round 10 ships" does **not** mean Filing Readiness moves. The Filing Readiness hard-floor logic from Round 9 requires the five harm-critical UNKNOWN items to move to at least INFERRED, which happens only when Round 11's documentation infrastructure ships. Round 10 is a rigor-and-correctness round: the chemical-safety enforcement is correct, the pH math direction-corrects, hard-stop infrastructure extends, but the headline Filing Readiness percentage stays in the floored range for most formulations.

Communicate this internally and to customer-zero. Round 10 unlocks Round 11; Round 11 moves the metric.

---

## Begin

Read required documents first. Implementation order:

1. **Section 1 (hard-stop infrastructure extension)** — establish the architectural primitive Round 11 will compose from
2. **Section 2 (Concern 2 Henderson-Hasselbalch with Rules A/B detection logic)** — math foundation + detection logic + known-buffering catalog tagging. Confidence taxonomy threading exercises the pattern Section 3d will reuse. Section is complete only when both positive AND negative regression fixtures pass — negative cases verify Tier A correctly DECLINES to compute CALCULATED when conditions don't favor H-H
3. **Section 3a + 3b.1 (schema additions + context-independent corrections)** — combined-budget, declaration-trigger, sulfite trailing-space. Land before Path A
4. **Path A product-class plumbing** — `productClass` data-model field (required at creation, confirm-on-change-with-active-findings, single-class v1) + per-ingredient categorization metadata + `checkCompliance` threading + cache-key discipline. Foundation for Section 3b.2
5. **Section 3b.2 (productClass-dependent corrections)** — denominator-basis fixes, Vitamin C / ascorbic acid precision, sodium phosphate scope, per-context limits, per-context prohibitions
6. **Section 3c new entries** — LAE, natamycin, sodium diacetate, nisin, e-numbers. Full schema treatment from inception
7. **Section 3d Bucket A enforcement gate** — composes on Sections 1, 3a, 3b.1, 3b.2, 3c. Includes ComplianceFinding `inputConfidence` field. Hard-stop pattern mirrors `classifyFormulation`'s gate
8. **Section 4 (REGULATORY_DISCLAIMER tracking)** — small, lands anywhere in the sequence
9. **Section 5 (test fixtures)** — interleave with implementation, not after; each fixture validates the section that produced it

Use defer-permission discipline if architectural questions exceed Round 10 scope. Surface findings explicitly per Round 9's pattern. Do not silently expand or contract scope.
