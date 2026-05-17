# Harm-Critical Floor — Inventory

**Round:** 11
**Phase:** 1, Step 1
**Generated:** 2026-05-15
**Canonical source:** [docs/regulatory/phase-1-companion-compliance-spec.md §B1–B5](../regulatory/phase-1-companion-compliance-spec.md) (Bucket 1 — "must be 100%")

---

## Purpose

Enumerate the 5 harm-critical items that constitute the supplement-side safety floor. Each item must be wired into a refuse-to-export gate before Round 11 ship. The items are the bounded set where a tool error could slip past a busy PA reviewer and cause consumer harm or unrecoverable regulatory violation — the bar is **100%** correctness on these, not "high-quality with surfaced uncertainty."

The Round 11 directive's best-guess candidate slate maps **5/5** to the canonical Companion Spec §B1–B5 list. This inventory is the implementation status snapshot that Step 4 wiring work consumes.

---

## Inventory

### 1. Allergen Detection (§B1)

- **Name:** Allergen detection — Big-9 allergen disclosure completeness for Supplement Facts panel and `Contains:` statement.
- **Code location:**
  - Detector: [`detectAllergens()` — lib/utils.ts:87](../../lib/utils.ts#L87)
  - Master list: [`ALLERGENS_LIST` — lib/utils.ts:67-80](../../lib/utils.ts#L67-L80) (Milk, Eggs, Fish, Crustacean Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame, Mustard)
  - Call sites: [page.tsx:532, :559, :800](../../app/workspace/page.tsx#L559) — populates `Ingredient.allergens[]` as a UI safety-net
- **Blocking condition (target):** Any dietary ingredient or "Other Ingredient" without a verified allergen-source mapping; ambiguous ingredients ("natural flavor", "lecithin" without source, brand-name protein blends without breakdown); tree-nut declarations not naming specific species (almond / walnut / pecan, not "tree nuts"); operator override of a flagged allergen out of the `Contains:` statement without dual-confirmation.
- **Pass condition (target):** Every ingredient mapped to a citation-backed allergen profile; `Contains:` statement matches the flagged set exactly; tree nuts named by species; brand-name ingredients carry supplier allergen disclosure on file.
- **Regulatory citation:** FALCPA + FASTER Act; 21 CFR 101.36 Supplement Facts panel rules.
- **Current implementation status:** **Wired (Round 11 Phase 2 Step 4).** Legacy `detectAllergens()` at [lib/utils.ts](../../lib/utils.ts) is unchanged (string[] shape, page.tsx safety-net usage preserved). New module [lib/supplementAllergen.ts](../../lib/supplementAllergen.ts) adds:
  - `AllergenMatch` structured type (category + species + matchedKeyword + requiresSpeciesNaming flag)
  - `detectAllergensDetailed(text)` — species-aware detector with generic-term detection for species-required categories (Tree Nuts, Fish, Shellfish)
  - `generateContainsStatement(matches)` — FDA-format `Contains:` line per 21 CFR 101.36(b)(1)(i)(B) (Oxford comma, species names for Tree Nuts/Fish/Shellfish, category names otherwise)
  - `evaluateAllergenGate(input)` — per-item gate refusing when a species-required category is detected via generic term without species name
  - `B1_ALLERGEN_ITEM_ID` registered in `evaluateSupplementBucket1Gate` `COMPOSED_ITEMS`
  - Shared CFR citation `21 CFR 101.36(b)(1)(i)(B); FALCPA + FASTER Act` on hard-stop evidence
  - Targeted false-positive fix: `'butter'` dropped from Milk keywords in the new module (prevents "peanut butter", "almond butter", "cocoa butter" from falsely matching Milk; legacy `detectAllergens` retains the keyword to avoid disturbing existing callers)
  - Tests at [supplement-allergen-gate.test.ts](../../lib/__tests__/supplement-allergen-gate.test.ts) (49 cases: detection across all Big-9 categories + Mustard, species mapping, generic-term detection, FDA-format Contains statement, gate composition, end-to-end) and Bucket 1 composition tests at [supplement-bucket-1-gate.test.ts](../../lib/__tests__/supplement-bucket-1-gate.test.ts)
- **Round 11 wiring scope:** ✓ Species-naming enforcement for Tree Nuts/Fish/Shellfish. ✓ `Contains:` statement generator per FDA labeling rules. ✓ Composition into Bucket 1 gate.
- **Round 12+ deferrals (tracked):**
  - **§B1 enhancement — ambiguous-ingredient hard flag.** Hard block on "natural flavor", "lecithin" (without source), brand-name protein blends without breakdown. Deferred from Phase 2 Step 4 per scope discipline; pattern detection expansion is separate from composition pattern establishment.
  - **§B1 enhancement — supplier allergen disclosure registry.** Track supplier-side allergen disclosure on file per ingredient; gate on missing disclosure. Data-layer concern, not detector concern.
  - **§B1 enhancement — operator dual-confirmation override flow.** UI work; out of gate-logic scope.
  - **§B1 enhancement — word-boundary or compound-aware keyword detection.** Substring matching produces other false-positives beyond `'butter'`: `'flour'` matches "almond flour" / "coconut flour" / "rice flour" as Wheat; `'cream'` matches "cream of tartar" as Milk; `'egg'` matches "eggplant" as Eggs; `'malt'` matches barley-derived malt as Wheat. Word-boundary or phrase-aware detection is the long-term fix.
  - **§B1 enhancement — operator-supplied Contains: text validation.** Validate that an operator-provided rendered `Contains:` statement matches the detected allergen set with species naming. Deferred to PDS rendering pipeline boundary (Track C Phase 3).
  - **§B1 enhancement — jurisdiction selector.** Round 12+: customer-scope selector that elevates `international-additional` tier (currently Mustard; placeholder for future Lupin/etc. additions) to hard-stop refusal when target market includes Canada / EU / AUS-NZ. Round 11 treats international-additional tier as advisory only.

  - **Mustard tier separation (RESOLVED — Round 11 Phase 2 Step 4 follow-up).** `ALLERGEN_REGULATORY_METADATA` now classifies categories by tier: nine FALCPA + FASTER Big-9 categories at `falcpa-faster-big-9` tier (hard-stop) and Mustard at `international-additional` tier (advisory). Citations: FALCPA (21 U.S.C. §343(w)) + FASTER Act for Big-9; Health Canada Priority Allergens + EU Regulation 1169/2011 Annex II + FSANZ Standard 1.2.3 for Mustard. `evaluateAllergenGate` filters refusal-bearing matches to Big-9 tier; international-additional matches surface in detection output for advisory UI but do NOT contribute to gate refusal.

---

### 2. Disease-Claim Hard Stop (§B2)

- **Name:** Disease-claim language hard-stop — prevents customer-drafted claims from converting the product to an unapproved drug under §201(g)(1)(C).
- **Code location:**
  - Detector: [`analyzeDraftClaim()` — lib/supplementClaims.ts:433](../../lib/supplementClaims.ts#L433)
  - Pattern library: [`DISEASE_PATTERNS` — lib/supplementClaims.ts:398-431](../../lib/supplementClaims.ts#L398-L431) (3 tiers: `disease`, `drug-claim`, `caution`)
  - Call sites: [page.tsx:2764, :5485](../../app/workspace/page.tsx#L2764) — informational badge/flag count in claims card
- **Blocking condition (target):** Any draft claim text matching a `disease` or `drug-claim` tier pattern; product-name + claim combinations implying disease (e.g., "ColdAway" + "supports immune health"); cross-claim disease implications.
- **Pass condition (target):** Claim text passes the pattern screen at both isolated-claim and product-name-context layers; substantiation evidence present; auto-applied FDA structure-function disclaimer attached.
- **Regulatory citation:** 21 CFR 101.93(g); DSHEA §6.
- **Current implementation status:** **Wired (Round 11 Phase 2 Step 4).** Pattern library + `analyzeDraftClaim()` detector unchanged. New per-item gate `evaluateDiseaseClaimGate()` at [lib/supplementClaims.ts](../../lib/supplementClaims.ts) composes pre-computed `DiseaseClaimFlag[]` into `HardStop | cleared`. `disease` and `drug-claim` tier matches drive refuse-to-export; `caution` tier remains advisory (FTC puffery bar is distinct from DSHEA §201(g)(1)(C) hard-stop bar). Composed into [`evaluateSupplementBucket1Gate`](../../lib/supplementBucket1Gate.ts) via `B2_DISEASE_CLAIM_ITEM_ID`. Shared CFR citation `21 CFR 101.93(g); FDCA §201(g)(1)(C)` attached to all hard-stop evidence. Tests at [supplement-disease-claim-gate.test.ts](../../lib/__tests__/supplement-disease-claim-gate.test.ts) (23 cases: cleared, hard-stop, end-to-end with `analyzeDraftClaim`, registry identifier) and [supplement-bucket-1-gate.test.ts](../../lib/__tests__/supplement-bucket-1-gate.test.ts) (Bucket 1 composition tests). Remaining gaps:
  - Product-name + claim cross-screening: deferred to Round 12+
  - Per-pattern CFR citation array on `DISEASE_PATTERNS`: deferred to Round 12+ catalog citation enrichment pass
  - Non-overridable refusal pattern (per Companion Spec: customer cannot override; only PA can with documented justification): pending UI integration
  - Claim substantiation evidence linkage: pending
  - 30-day FDA notification document generation: pending
- **Round 11 wiring scope:** ✓ `evaluateDiseaseClaimGate()` composes `disease` + `drug-claim` matches into hard-stop. ✓ `B2_DISEASE_CLAIM_ITEM_ID` registered in Bucket 1 gate `COMPOSED_ITEMS`. ✓ End-to-end tests with `analyzeDraftClaim`. ✓ Caution-tier filtering verified.
- **Round 12+ deferrals (tracked):**
  - **§B2 enhancement — product-name × claim cross-screening.** Expand `analyzeDraftClaim` to accept a `productName` arg and add implication patterns detecting product-name disease implication (e.g., "ColdAway" + "supports immune health" → disease implication). Deferred from Phase 2 Step 4 per scope discipline: pattern detection expansion is separate workstream from composition pattern establishment.
  - **§B2 enhancement — per-pattern CFR citation array on `DISEASE_PATTERNS`.** Replace shared `B2_DISEASE_CLAIM_CITATION` with per-pattern `citation` field on each entry of `DISEASE_PATTERNS`. Surface granular citation in each hard-stop evidence item. Aligns with Finding #16 (ascorbic acid Tier A promotion) and the broader catalog citation enrichment workstream — same shape: regulatory mapping per catalog entry as a focused workstream.

---

### 3. Identity-Test Enforcement (§B3)

- **Name:** Identity-test attestation per dietary ingredient — gate on cGMP records and finished-product specs until each dietary ingredient has lot-linked identity test record on file.
- **Code location:**
  - Data model: **does not exist.** No `identityTestRecord`, `identityTested`, or equivalent field on [`Ingredient`](../../types/index.ts) or [`IndustrialIngredient`](../../types/index.ts). No lot-tracking schema.
  - Process-template TEXT (operator instructions, not enforcement): [lib/data/supplements.ts:509, :527, :538, :548, :575](../../lib/data/supplements.ts#L509) — references "Perform IDENTITY TESTING per 21 CFR 111.75" inside cGMP template strings.
- **Blocking condition (target):** Any dietary ingredient without a customer-or-contracted-lab identity test record on file, lot-linked, date-stamped within lot validity, with test type appropriate to ingredient class (FTIR/HPLC/HPTLC for botanicals, organoleptic for water/commodities, DNA barcoding for hard-to-ID botanicals).
- **Pass condition (target):** Every dietary ingredient: supplier COA on file + customer/contracted lab identity test on file + appropriate test type + lot-linked + date-within-validity.
- **Regulatory citation:** 21 CFR 111.75(a)(1).
- **Current implementation status:** **Unwired.** Operator-facing template text references the requirement, but no schema, no upload flow, no record linkage, no enforcement. cGMP records (MMR, BPR) do not currently mark "draft-only pending identity testing."
- **Round 11 wiring scope:** Add `identityTestRecord` field to per-ingredient schema (lot id, test type, test date, test result file ref, lab attribution); add upload flow; gate MMR/BPR finalization on identity-test completeness; compose into supplement-side export gate.
- **Adjacency:** Tightly coupled with §B11 (Customer-COA upload + identity-test linkage — "the architectural keystone" per Companion Spec). §B11 is cross-cutting Bucket 1+2 and is the implementation surface for the identity-test record-keeping. Out of Round 11's strict 5-item slate but architecturally entangled — Step 4 wiring will need to scope at least the Bucket 1 portion of §B11 (identity-test linkage + allergen-disclosure preservation) to make §B3 functional.

---

### 4. Mandatory Disclaimer Verbatim Text (§B4)

- **Name:** DSHEA disclaimer verbatim text — locked-constant pattern preventing typo / punctuation drift / display-rule violations.
- **Code location:**
  - Current implementation: inline string literal inside [`buildDisclaimers()` — lib/supplementClaims.ts:494](../../lib/supplementClaims.ts#L494)
  - F&B architectural precedent to mirror: [`REGULATORY_DISCLAIMER` — lib/foodScience.ts:61](../../lib/foodScience.ts#L61) (immutable export) + [section-4-regulatory-disclaimer.test.ts](../../lib/__tests__/section-4-regulatory-disclaimer.test.ts) (frozen-snapshot test with change-control docblock)
- **Blocking condition (target):** Disclaimer text byte-divergence from 21 CFR 101.93(c) verbatim; type size < 1/16 inch; not bold; not adjacent to claim AND not asterisk-linked to footnote on same panel; single-statement form used when multiple claims present; disclaimer missing on any panel where a claim appears.
- **Pass condition (target):** Disclaimer text exactly matches CFR singular (one claim) or plural (multiple claims) form; rendered ≥1/16 inch bold; adjacent or asterisk-linked; on every panel with a claim.
- **Regulatory citation:** 21 CFR 101.93(c)(1) (singular), 21 CFR 101.93(c)(2) (plural).
- **Current implementation status:** **Partially wired.** Constants + frozen-snapshot test landed in Round 11 Phase 1 Step 4 at [`lib/supplementDisclaimer.ts`](../../lib/supplementDisclaimer.ts) + [`lib/__tests__/supplement-disclaimer.test.ts`](../../lib/__tests__/supplement-disclaimer.test.ts). Gate registration in place at [`lib/supplementBucket1Gate.ts`](../../lib/supplementBucket1Gate.ts) `COMPOSED_ITEMS`. Remaining gaps:
  - Existing call site at [`lib/supplementClaims.ts:466 buildDisclaimers()`](../../lib/supplementClaims.ts#L466) still emits inline string (PLURAL form regardless of claim count — bug per §B4 which requires singular when exactly one claim present). Migration to consume `selectSupplementDisclaimer()` is a follow-up.
  - Gate-level refusal check (rendered disclaimer text byte-matches selected form when claims present) pending — requires rendered-disclaimer-string available at the export-gate boundary
  - Display-rule validation (type size, bold, adjacency, per-panel coverage) does not exist — but PDS pipeline doesn't exist yet either; display validation lands with PDS Track C work
- **Round 11 wiring scope:** ✓ Locked constants `SUPPLEMENT_DISCLAIMER_SINGULAR` / `SUPPLEMENT_DISCLAIMER_PLURAL` at `lib/supplementDisclaimer.ts`. ✓ Frozen-snapshot test mirroring `section-4-regulatory-disclaimer.test.ts`. ✓ Claim-count selector `selectSupplementDisclaimer()`. ✓ Gate composition-registry entry. Pending: migrate `buildDisclaimers()` to consume the selector; wire gate-level refusal check at PDS export boundary.

---

### 5. Net Quantity Declaration Unit Conversion (§B5)

- **Name:** Net quantity dual-unit declaration — bulletproof US + metric conversion with CFR rounding rules.
- **Code location:**
  - Dedicated function: **does not exist.** No `lib/netQuantity.ts`, no `computeNetQuantityDeclaration()`, no dual-unit generator.
  - Available primitives: [`UNIT_TO_GRAMS` — lib/utils.ts](../../lib/utils.ts) (mass unit conversions); [`toGrams()` — lib/utils.ts:123](../../lib/utils.ts#L123) (single-direction conversion).
- **Blocking condition (target):** Wrong unit conversion (oz vs fl oz; g vs mg); off-by-one rounding under CFR rules (weight ≤1 lb in oz, >1 lb in lb+oz; metric in g for <1000g and kg for ≥1000g); net contents inconsistent with `serving size × servings per container`; floating-point drift past the rounding boundary.
- **Pass condition (target):** Dual-unit declaration generated correctly against the regulatorily-preferred unit; rounding applied per CFR; net contents = serving size × servings per container cross-validated.
- **Regulatory citation:** 21 CFR 101.105.
- **Current implementation status:** **Wired (Round 11 Phase 2 Step 4).** New module [lib/netQuantity.ts](../../lib/netQuantity.ts):
  - `NetQuantityInput` type — caller passes `totalMassG`/`totalVolumeMl` from workspace cascade + explicit `form: 'solid' | 'liquid'` discriminator + optional operator-declared net quantity
  - `computeNetQuantityDeclaration(input)` — canonical dual-unit declaration with CFR-shaped rounding per 21 CFR 101.105 (mg/g/kg + oz/lb for solid; mL/L + fl oz for liquid)
  - `evaluateNetQuantityGate(input)` — per-item gate refusing on (a) form/dimension mismatch, (b) missing operator declaration per 21 CFR 101.105(a), (c) US customary primary without metric secondary (dual-unit), (d) declared net quantity outside ±2% of computed mass/volume per 21 CFR 101.105(q)
  - `B5_NET_QUANTITY_ITEM_ID` registered in `evaluateSupplementBucket1Gate` `COMPOSED_ITEMS`
  - Shared citation `21 CFR 101.105` on hard-stop evidence
  - Float precision discipline: strict `>` with `EPSILON = 1e-9` absorbs IEEE 754 drift so exact ±2% boundary values fire by intent, not by float artifact
  - Tests at [supplement-net-quantity-gate.test.ts](../../lib/__tests__/supplement-net-quantity-gate.test.ts) (45 cases): unit conversion accuracy (toBeCloseTo intermediates, exact toBe rounded), CFR rounding boundaries, label-text format, cleared paths, hard-stop paths, ±2% boundary discipline (102.0% cleared / 102.01% hard-stop / 98.0% cleared / 97.99% hard-stop), invalid-input defense (zero, negative, NaN, undefined), conflict scenarios (form/dim mismatch, both dims provided)
  - Bucket 1 composition tests extended in [supplement-bucket-1-gate.test.ts](../../lib/__tests__/supplement-bucket-1-gate.test.ts) with §B5 composition coverage + four-item composition test (§B2 + §B1 + §B5 + Review.currentState all fire → 4 evidence items)
- **Round 11 wiring scope:** ✓ `computeNetQuantityDeclaration` dual-unit generator with CFR rounding. ✓ `evaluateNetQuantityGate` per-item gate with ±2% symmetric tolerance. ✓ Composition into Bucket 1 gate.
- **Round 12+ deferrals (tracked):**
  - **§B5 enhancement — pint and gallon support.** Supplement labels rarely declare net quantity in those ranges; deferred until customer scenario surfaces them.
  - **§B5 enhancement — asymmetric under-fill vs over-fill tolerance.** CFR 101.105(q) treats short-fill (declared > actual = consumer detriment) more seriously than over-fill (declared < actual = conservative claim). Round 11 uses symmetric ±2%; Round 12+ can introduce asymmetric tolerances when customer-zero data suggests benefit.
  - **§B5 enhancement — tolerance calibration against FDA enforcement-discretion data.** Recalibrate ±2% against real-world enforcement-discretion observations and customer-zero feedback.
  - **§B5 enhancement — operator-selectable rounding precision.** Round 11 uses conventional precision (integer mg/g/mL; 2-decimal oz/lb/fl oz/kg/L). Round 12+: operator chooses precision per label design.
  - **§B5 enhancement — internal primary-vs-metric-secondary consistency check.** Catch operator-typed mismatches like "1 oz (50 g)" (1 oz ≠ 50 g). Round 11 only cross-validates against computed mass/volume; internal consistency deferred.
  - **§B5 enhancement — explicit packaging-spec field for declared net quantity.** Schema field for operator-supplied manufacturer-spec net quantity that overrides computed mass; useful when manufacturer data differs slightly from computed total. Lands with PDS pipeline integration.

---

## Adjacent context

### §B11 — Customer-COA upload + identity-test linkage (cross-cutting Bucket 1+2)

Not one of the 5, but tightly entangled with §B3 (identity-test) and §B1 (allergen-disclosure preservation). Per Companion Spec §B11: "the architectural keystone" of the MVP. The Bucket 1 portion (identity-test linkage enforcement, allergen disclosure preservation from COA into formulation, heavy-metal / contaminant data preservation) is the implementation surface that makes §B3 functional. Step 4 wiring for §B3 will need to scope at least the COA-upload + identity-test-linkage subset of §B11.

Reference: [docs/regulatory/phase-1-companion-compliance-spec.md §B11](../regulatory/phase-1-companion-compliance-spec.md).

### Cross-cutting: supplement-side export gate composition

The F&B-side architectural model — [`evaluateBucketA()` — lib/bucketAGate.ts:112](../../lib/bucketAGate.ts#L112) composing `ComplianceFinding[]` into a hard-stop result that drives refuse-to-export — now has a supplement-side equivalent at [`evaluateSupplementBucket1Gate()` — lib/supplementBucket1Gate.ts](../../lib/supplementBucket1Gate.ts) (Round 11 Phase 1+2 Step 4). The gate composes per-§B-item evaluators and the PA-review state gate into a single `HardStop | cleared` result driving refuse-to-export.

Composition pattern: each item exposes a per-item gate evaluator (`evaluateXxxGate(input) → HardStop | cleared`) plus a stable item identifier. The Bucket 1 gate aggregates evidence from firing items into a unified `HardStop` with `source: 'supplement-bucket-1'`. Pre-computed inputs (caller runs detectors upstream and passes flag arrays into params) mirror the F&B `ComplianceFinding[]` boundary discipline — gate testable in isolation, detector testable in isolation.

Composed items as of Round 11 Phase 2 Step 4:
- ✓ §B4 disclaimer identifier registered (gate-level refusal check pending PDS rendered-text boundary)
- ✓ §B2 disease-claim hard-stop (`evaluateDiseaseClaimGate`)
- ✓ §B1 allergen species-naming (`evaluateAllergenGate` — refuse on Tree Nuts/Fish/Shellfish generic term without species)
- ✓ §B5 net quantity declaration (`evaluateNetQuantityGate` — refuse on missing declaration, missing dual-unit, or ±2% tolerance breach)
- ✓ Review.currentState (`evaluateReviewStateGate` — refuse outside `approved`/`version_locked`)
- Pending: §B3 identity-test, §B11 keystone subset

### PA-review state integration

`Review.currentState` from the PA-review state machinery composes into the Bucket 1 gate via [`evaluateReviewStateGate()` — lib/reviewState.ts](../../lib/reviewState.ts). Refuse-to-export when state ∈ {`draft`, `submitted`, `rejected`}; cleared when state ∈ {`approved`, `version_locked`}; undefined state clears at composition layer (downstream wiring at PDS export gate handles the explicit "no Review exists" check separately per the proposal doc).

Reference: [docs/architecture/pa-review-state-machinery-proposal.md](pa-review-state-machinery-proposal.md).

---

## Status summary

| # | Item | Companion Spec § | Status | Round 11 wiring scope |
|---|------|------------------|--------|------------------------|
| 1 | Allergen detection | §B1 | **Wired (Phase 2 Step 4)** | ✓ Species-aware `detectAllergensDetailed` + `generateContainsStatement` + gate composition; ambiguous-ingredient hard flag + supplier disclosure deferred Round 12+ |
| 2 | Disease-claim hard stop | §B2 | **Wired (Phase 2 Step 4)** | ✓ Gate composition; product-name cross-screen + per-pattern citation deferred Round 12+ |
| 3 | Identity-test attestation | §B3 | Unwired (template text only) | Schema; upload flow; MMR/BPR draft-only gate; export-gate composition; §B11 keystone subset |
| 4 | Disclaimer verbatim | §B4 | Partially wired (constants + frozen-snapshot test landed; gate-level refusal pending PDS boundary) | ✓ Constants singular/plural + frozen-snapshot test + claim-count selector + composition-registry ID; PDS display validation pending |
| 5 | Net quantity unit conversion | §B5 | **Wired (Phase 2 Step 4)** | ✓ `lib/netQuantity.ts` dual-unit generator + CFR rounding + ±2% cross-validation + gate composition; pint/gallon, asymmetric tolerance, operator-selectable precision deferred Round 12+ |
| — | PA-review state | (machinery) | **Wired (Phase 2 Step 4)** | ✓ `evaluateReviewStateGate` refuses outside `approved`/`version_locked`; composed into Bucket 1 gate |
| Cross | Supplement-side export gate | (architectural) | **Wired (Phase 1+2 Step 4)** | ✓ `lib/supplementBucket1Gate.ts` composition surface; §B2 + Review.currentState composed; §B1/§B3/§B5/§B11 pending |

The status distribution — 2 partially wired, 2 unwired, 1 partially wired (B4) — implies wiring work for Step 4 is **substantial but bounded**. Each item is well-specified per the Companion Spec; the architectural patterns (locked-constant + frozen-snapshot test, hard-stop primitive + gate composition) are already established on the F&B side and ready to mirror.

The Round 11 Phase 1 Step 4 parallel work stream starts from this inventory.
