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
- **Current implementation status:** **Partially wired.** Substring-matching detector exists and populates the per-ingredient `allergens[]` array, but:
  - Substring-only matching; no curated synonym list (e.g., "almond meal" may not resolve to "tree nuts (almonds)" with species-specific naming)
  - No tree-nut species-naming enforcement
  - No hard block on ambiguous ingredients (natural flavor, brand-name blends)
  - No `Contains:` statement generation tied to verification gate
  - No refuse-to-export composition — detector output renders as advisory UI, not as a gate
- **Round 11 wiring scope:** Curate synonym list per §B1; add ambiguous-ingredient hard flag; build `Contains:` statement generator with specific-vs-generic enforcement; compose into supplement-side export gate (see Cross-Cutting Gap below).

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
- **Current implementation status:** **Partially wired.** Pattern library is comprehensive (13 disease-name patterns + 9 drug-claim verbs + 6 caution patterns); `analyzeDraftClaim()` returns structured `DiseaseClaimFlag[]`. Gaps:
  - No hard-stop at export gate — flags render in UI as advisory, customer can proceed past them
  - No product-name + claim cross-screening
  - No non-overridable refusal pattern (per Companion Spec: customer cannot override; only PA can with documented justification)
  - No claim substantiation evidence linkage
  - 30-day FDA notification document generation: not implemented
- **Round 11 wiring scope:** Add product-name + claim cross-screen; compose `disease`/`drug-claim` tier matches into supplement-side export gate as refuse-to-export; add operator dual-confirmation requirement for any override attempt.

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
- **Current implementation status:** **Partially wired.** Singular form exists as inline string literal in `buildDisclaimers()`. Gaps:
  - Not a locked constant — string is buried inside a function body, no immutable export, vulnerable to silent typo on edit
  - No frozen-snapshot test (F&B-side `section-4-regulatory-disclaimer.test.ts` is the architectural model — supplement equivalent does not exist)
  - Plural form (`SUPPLEMENT_DISCLAIMER_PLURAL`) not implemented; current code emits singular form regardless of claim count
  - Display-rule validation (type size, bold, adjacency, per-panel coverage) does not exist — but PDS pipeline doesn't exist yet either; display validation lands with PDS Track C work
- **Round 11 wiring scope:** Extract singular + plural forms as locked constants `SUPPLEMENT_DISCLAIMER_SINGULAR` / `SUPPLEMENT_DISCLAIMER_PLURAL` at top of `lib/supplementClaims.ts` (or new `lib/supplementDisclaimer.ts`); add frozen-snapshot test mirroring `section-4-regulatory-disclaimer.test.ts`; add claim-count selector logic; compose into PDS export gate (when PDS pipeline ships in Track C).

---

### 5. Net Quantity Declaration Unit Conversion (§B5)

- **Name:** Net quantity dual-unit declaration — bulletproof US + metric conversion with CFR rounding rules.
- **Code location:**
  - Dedicated function: **does not exist.** No `lib/netQuantity.ts`, no `computeNetQuantityDeclaration()`, no dual-unit generator.
  - Available primitives: [`UNIT_TO_GRAMS` — lib/utils.ts](../../lib/utils.ts) (mass unit conversions); [`toGrams()` — lib/utils.ts:123](../../lib/utils.ts#L123) (single-direction conversion).
- **Blocking condition (target):** Wrong unit conversion (oz vs fl oz; g vs mg); off-by-one rounding under CFR rules (weight ≤1 lb in oz, >1 lb in lb+oz; metric in g for <1000g and kg for ≥1000g); net contents inconsistent with `serving size × servings per container`; floating-point drift past the rounding boundary.
- **Pass condition (target):** Dual-unit declaration generated correctly against the regulatorily-preferred unit; rounding applied per CFR; net contents = serving size × servings per container cross-validated.
- **Regulatory citation:** 21 CFR 101.105.
- **Current implementation status:** **Unwired.** No net-quantity declaration logic exists. PDS panel does not currently render net contents. Math primitives are available but not composed.
- **Round 11 wiring scope:** Create `lib/netQuantity.ts` with `computeNetQuantityDeclaration({ count, weightG, servingSize, servingsPerContainer }) → { primary, metric, rounded }`; add CFR rounding logic; add cross-validation against serving math; compose into PDS export gate and supplement-side export gate (when PDS pipeline ships in Track C).

---

## Adjacent context

### §B11 — Customer-COA upload + identity-test linkage (cross-cutting Bucket 1+2)

Not one of the 5, but tightly entangled with §B3 (identity-test) and §B1 (allergen-disclosure preservation). Per Companion Spec §B11: "the architectural keystone" of the MVP. The Bucket 1 portion (identity-test linkage enforcement, allergen disclosure preservation from COA into formulation, heavy-metal / contaminant data preservation) is the implementation surface that makes §B3 functional. Step 4 wiring for §B3 will need to scope at least the COA-upload + identity-test-linkage subset of §B11.

Reference: [docs/regulatory/phase-1-companion-compliance-spec.md §B11](../regulatory/phase-1-companion-compliance-spec.md).

### Cross-cutting gap: supplement-side export gate composition

The F&B-side architectural model — [`evaluateBucketA()` — lib/bucketAGate.ts:112](../../lib/bucketAGate.ts#L112) composing `ComplianceFinding[]` into a hard-stop result that drives refuse-to-export — has **no supplement-side equivalent**. The supplement side has:

- [`summarizeFindings()` — lib/supplementSafetyLimits.ts:802](../../lib/supplementSafetyLimits.ts#L802) returns `hardStop: boolean` from UL/banned-ingredient counts, but this boolean is **not wired to any refuse-to-export action** today.
- Per-feature outputs exist (allergen detector, disease-claim flags, disclaimer builder, UL safety findings) but they are **not composed** into a single Bucket 1 gate.

**Round 11 needs:** a new `lib/supplementBucket1Gate.ts` (or equivalent) that composes the 5 harm-critical floor items + UL/banned + B11 keystone enforcement into a single `evaluateSupplementBucket1Gate()` returning `HardStop | cleared` per the [`lib/hardStop.ts`](../../lib/hardStop.ts) primitive. This is the composition surface that PDS export and PA-review packet generation gate on.

This composition is itself part of the Step 4 wiring work. Without it, wiring the individual 5 items has nowhere to compose into.

---

## Status summary

| # | Item | Companion Spec § | Status | Round 11 wiring scope |
|---|------|------------------|--------|------------------------|
| 1 | Allergen detection | §B1 | Partially wired (detector exists, no gate) | Curate synonyms; species-naming; `Contains:` generator; export-gate composition |
| 2 | Disease-claim hard stop | §B2 | Partially wired (detector exists, no hard-stop) | Product-name cross-screen; non-overridable refusal; export-gate composition |
| 3 | Identity-test attestation | §B3 | Unwired (template text only) | Schema; upload flow; MMR/BPR draft-only gate; export-gate composition; §B11 keystone subset |
| 4 | Disclaimer verbatim | §B4 | Partially wired (inline literal, no constant, no test) | Locked constants singular/plural; frozen-snapshot test; claim-count selector; PDS display validation |
| 5 | Net quantity unit conversion | §B5 | Unwired | `lib/netQuantity.ts`; CFR rounding; cross-validation; PDS + export-gate composition |
| Cross | Supplement-side export gate | (architectural) | Unwired | `lib/supplementBucket1Gate.ts` composing all 5 + UL/banned + B11 keystone |

The status distribution — 2 partially wired, 2 unwired, 1 partially wired (B4) — implies wiring work for Step 4 is **substantial but bounded**. Each item is well-specified per the Companion Spec; the architectural patterns (locked-constant + frozen-snapshot test, hard-stop primitive + gate composition) are already established on the F&B side and ready to mirror.

The Round 11 Phase 1 Step 4 parallel work stream starts from this inventory.
