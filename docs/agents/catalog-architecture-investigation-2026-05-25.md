# Catalog Architecture Investigation — Scoping Memo

**Author:** CC, 2026-05-25 (parallel to Packet memo + Design system memo as the third strategic-session agenda input)
**Purpose:** Verify + extend Opus's 10-layer catalog architecture inventory; map each layer against current code state; surface redundancies, inefficiencies, assumptions, workflow gaps, integration gaps; classify gaps by launch criticality; surface routing questions for the strategic session.
**Audience:** Operator + Opus + co-founder strategic session. Companion to [`docs/agents/product-packet-architecture-2026-05-25.md`](product-packet-architecture-2026-05-25.md) (Q1–Q9) + [`docs/agents/design-system-2026-05-25.md`](design-system-2026-05-25.md) (Q-DS-1/2).
**Status:** Scoping memo — input pack, not directive. Strategic session decides. No code shipped from this investigation.

---

## Ground-state verification (run BEFORE investigation per `[[verify-ground-state-at-start-of-autonomous-session]]`)

- **Recent commits touching catalog/resolver surfaces:** `c93b78d` (BS/BS shorthand rename in scoping memos), `bdb8b3f` (Design system scoping memo), `dbadfa9` (Packet memo Q9 reshape + dignity-moat framing), `1231513` (Packet memo initial landing), `11472af` (FALCPA exemption Phase 2 catalog enrichment), `9214abf` (Added Sugars + FALCPA species notation catalog enrichment), `a20028c` (Provenance schema groundwork — types-only). Most-recent parser commit: `0b77512` (Wave 1.5e synonym-layer harm-critical fix) — no `c58c02a` head-token-length-diff guard located in main; the scope reference is either stale or refers to an earlier resolver hardening pass.
- **Prior catalog architecture artifacts:** `docs/audits/duplicate-sku-sweep.md` (~25 confirmed duplicate pairs + 5 cross-category splits, 2026-05-20), `docs/audits/catalog-inventory-2026-05-07.md`, `docs/audits/catalog-gap-analysis-2026-05-07.md`, `docs/audits/rulebook-vs-types-drift.md`. The **delta audit referenced in scope (`docs/audits/duplicate-sku-sweep-delta-2026-05-25.md`) does not exist on this branch** — surfaced to operator as a discrepancy; investigation proceeds against May 20 baseline plus most-recent commit log.
- **Memory artifacts checked for SUPERSEDED markers:** none of the prerequisite reads (scope-of-work, catalog-must-be-COA, supplements-two-wave, regulatory-classification-vs-supplier-data, verify-ground-state) carry SUPERSEDED markers. `project_supplements_two_wave_ingestion` carries an 18-day-old system-reminder caution about line-number drift; cross-checked against current `supplements.ts` — entry counts match (~401 entries), value-tier + premium-tier seam still present.
- **Prerequisite-work in codebase:** Provenance schema present (`types/index.ts` lines 1618–1738; 9-variant discriminated union + `Sourced<T>`); CatalogSnapshotRef present (`types/index.ts` lines 1220–1245) but only `legacy-pre-schema-lock` variant constructable; PA review state machine present (`lib/reviewState.ts` 358 lines + types at `types/index.ts` lines 336–419) but no workspace UI invokes; Identity-test attestation schema present (`types/index.ts` lines 473–517); FALCPA species + Mollusks category + export gate present (`lib/supplementAllergen.ts` + commit `b654f49`); `IndustrialIngredient.falcpaExemptionStatus` field present (`types/index.ts` lines 952–992) with 3-state taxonomy. Branch `investigation/catalog-architecture-2026-05-25` could not be created via tool harness (`git checkout -b` / `git switch -c` calls were denied); commit lands on current worktree branch — surfaced to operator for re-routing the branch + PR.

---

## TL;DR

The Opus 10-layer inventory is **substantially correct as a discovery framework.** Verification surfaced two sub-layer separations (1a/1b matcher vs disambiguator inside Layer 1; 5a/5b dosing-discipline vs operational-discipline inside Layer 5) and one candidate Layer 11 (**Mode + Product-Class routing surface**) that deserves first-class status because it drives which ingredient DB the catalog is even consulting + which regulatory rules apply to matches that come back.

The most consequential structural gap surfaced by this investigation is **the catalog has no scalable browse / search / discovery surface today.** Bulk-paste is the only entry path; an operator who doesn't already know the canonical name for "the form of magnesium that's right for a sleep formula" has nowhere to go. Layer 9 is effectively absent in the codebase. This compounds with Layer 5 (functional context scattered in `notes`, not structured) — there is no way today to ask "show me magnesium forms suitable for sleep" because (a) the answer is in prose, and (b) there's no UI surface that would render the answer.

The strongest-developed layer is **Layer 10 Data Quality + Validation** — the validator + audit discipline (catalog-entry-validator subagent + §38a unscoped-grep + §III.15 + harm-critical floor + duplicate-SKU sweep + identity-test gate) is unusual rigor relative to anything in the public food-software space. This is durable infrastructure that compounds; protecting it through Round 12+ is more important than re-litigating layer boundaries.

Two **schema-versioning UX gaps** surface as launch-blocking but missed by the existing roadmap: (a) the operator UX for catalog drift after Base Sheet pinning lands ("v3 pinned, v4 available, here's the diff" surface — schema exists, UX doesn't), and (b) the **operator override vs platform change request** seam (does an operator who finds a wrong value patch their Packet or file a catalog change request? — schema implications either way). Both belong in the strategic session.

**Total routing questions surfaced for the session: 11** (Opus's 7 + 4 new — Q8 Catalog Layer 9 sequencing; Q9 Mode + Product-Class routing first-class status; Q10 Layer 4 platform-side suppliers vs operator-side packet seam; Q11 Layer 5 functional-context structuring).

---

## §1 — Layer enumeration verification

Walked Opus's 10 layers against the codebase. For each: kept the layer when it's a clean conceptual cut; called out sub-layers that deserve first-class status when conflated; surfaced one candidate Layer 11.

### Layer 1 — Identity & Recognition

**Verdict:** Correctly named, but **conflates two sub-layers** that have different load-bearing concerns:
- **Layer 1a — Matcher** (deterministic resolution from a paste string to a catalog entry). Lives in `lib/parseFormula.ts` — `normalizeIngredientName`, `findBySynonym`, `findBestMatchWithTier`, the 4-tier confidence ladder. Mechanical; well-tested.
- **Layer 1b — Disambiguator** (when matcher would silently lock onto one entry but harm-critical siblings exist, escalate to Tier 3). Lives in `findHarmCriticalSiblings` + `harmCriticalDisambiguationReason` (`lib/parseFormula.ts:405-439`). Composes with `lib/supplementHarmCritical.ts`. Different concern: 1a is "what does this string resolve to?"; 1b is "did we just silently substitute across a harm boundary?"

The conflation is benign at code level (both live in `parseFormula.ts`) but matters strategically: synonym strategy (where do synonyms come from?) is a 1a concern; disambiguation discipline (when does the workspace force operator confirmation?) is a 1b concern. They route differently in the strategic session — synonyms route to co-founder + operator paste-pattern data; disambiguation routes to the harm-critical-floor doctrine.

The Opus framing's "Tier 1/2/3 matching" already implies this split; calling it out lets the strategic session route the two halves cleanly.

### Layer 2 — Spec & Composition

**Verdict:** Correctly identified. F3 Tier 1 agentic ingestion is correctly named as the load-bearing missing bridge per `[[catalog-must-be-coa-spec-sheet-anchored]]` MVP foundation step 5. **Per-product-class spec system** is the sub-layer to keep in mind (per `[[spec-system-multi-product-class]]` memory) — tablet/capsule/softgel-class specs differ from beverage-class specs differ from acidified-food-class specs. Today's spec metric set is F&B-shaped; supplement-class metrics (hardness, friability, disintegration, peroxide value, CFU) deserve first-class typing alongside pH / Brix / a_w / moisture. Not a sub-layer rename — but a parallel concern that the F3 Tier 1 brief should accommodate up front rather than retrofit later.

### Layer 3 — Regulatory Classification

**Verdict:** Correctly identified. Already split into the right sub-concerns by `[[regulatory-classification-vs-supplier-data]]` doctrine — uniform regulatory classifications (FDA Added Sugars, FALCPA species, AllergenCategory, USDA FDC IDs, 21 CFR product class definitions) vs supplier-variable data (refining grade, residual protein, microbial counts). The CC-autonomous vs foundation-dependent split is a clean cut; preserving it.

Specific Layer 3 maturity (per current commit log):
- ✓ Added Sugars schema + per-entry population (`9214abf`)
- ✓ FALCPA species naming + Mollusks category + export gate (`b654f49`)
- ✓ FALCPA §203(b)(2) refined-oil exemption 3-state taxonomy (`e9d19bf` + `11472af`)
- ✓ Product Class routing per 21 CFR (Round 10 Path A)
- ◐ NDI status — schema exists (`RegulatoryStatus.NDI-notified` + `NDI-required-not-notified`), keyword-discipline test exists (`supplement-ndi-keyword-discipline.test.ts`), per-entry population partial
- ◐ DSHEA classification — surfaces in Determination Engine card but coverage uneven
- ✗ GRAS / approved food additive enforcement at gate-level — schema exists, gate per product class not consistently wired
- ✗ Disease claim blocks at field level — `lib/supplementClaims.ts` handles claim text; ingredient-level disease-claim-block fields not consistently wired
- ✓ Identity-test schema + gate (`lib/identityTest.ts` + `IdentityTestAttestation`)
- ✓ Tier-A pharma vs Tier-B commodity distinction — present via PENDING TIER VERIFICATION suffix discipline + `[[project_supplements_two_wave_ingestion]]` value/premium seam

### Layer 4 — Vendor / Commercial

**Verdict:** Correctly identified, **and the split Opus calls out (platform-side suppliers vs operator-side relationships per memory #22) is the load-bearing strategic-session decision.** Today's `IndustrialIngredient.suppliers: string[]` is platform-side (catalog records who can theoretically supply); `lib/data/suppliers.ts` carries `SupplierInfo` with structured tier/MOQ/lead-time per supplier name. Operator-side relationships (account #, payment terms, contract reference, internal SKU, operator-supplied pricing) live in the Packet per Packet memo §2.7.D — schema does not yet exist.

The integration point between catalog Layer 4 and Packet Layer 4 is **Q10 in §9 below** — schema-level decision about how a catalog ingredient maps to an operator's vendor relationship at formulation time.

### Layer 5 — Functional / Use-Context

**Verdict:** Correctly identified as scattered in notes / not structured. Worth splitting into:
- **Layer 5a — Dosing discipline** (typical inclusion rates, UL ceilings, dose substantiation per `[[feedback_dosage_substantiation_rule]]`). Partially structured via `usageRange?: UsageRange` on `IndustrialIngredient` + `lib/supplementSafetyLimits.ts` UL tables. Schema exists; per-entry population uneven.
- **Layer 5b — Operational discipline** (heat-sensitive, light-sensitive, hygroscopic, matrix compatibility, processing notes). Partially structured via `matrixCompatibility?: MatrixCompatibility[]` (8 enum values: acid-stable / heat-stable / fat-soluble / etc.); the rest lives in the `notes` field as prose.

The strategic question (Q11 in §9) is whether Layer 5 should be made fully structured before Layer 9 browse/search lands — because without structured functional context, the browse-by-functional-role surface ("show me magnesium forms for sleep") has nothing to filter on.

### Layer 6 — Cost / Economics

**Verdict:** Correctly identified. The split — platform-side ingredient cost vs operator-side relationship pricing — is correctly framed by Opus. Today's `costPerKg` is platform-side scaffolded values per the `costSource: 'verified-quote' | 'industry-typical' | 'category-default'` taxonomy in `IndustrialIngredient` (lines 891+ of `types/index.ts`); `costValidUntil` handles staleness. Operator-supplied cost overrides land in the Packet per memory #22. The computation graph (cost-per-serving, cost-per-package, formula-total) belongs to the platform and is partially wired — Cost Tool tab renders unit costs but values don't persist per-product.

### Layer 7 — Workflow Integration

**Verdict:** Correctly identified — the catalog → downstream propagation IS the spine of the platform's value proposition. The 9-surface enumeration (NFP / SFP / Allergen / FALCPA / Filing Readiness / pH / Spec coverage / Harm-critical / Cost-per-serving / Per-ingredient citations) maps cleanly to existing code modules (`lib/supplementLabeling.ts`, `lib/supplementMath.ts`, `lib/supplementAllergen.ts`, `lib/filingReadiness.ts`, `lib/foodScience.ts`, `lib/trackedSpecs.ts`, `lib/supplementHarmCritical.ts`, etc.). The integration is most mature here in the codebase. The gap surfaced by Packet memo §2.4 is that **renders are not snapshotted per Base Sheet version** — they re-derive on demand. World-class allergen roadmap #4 is the first instance of version-locked snapshotting; the pattern needs extension to NFP / SFP / framework determinations.

### Layer 8 — Versioning & Provenance

**Verdict:** Correctly identified. Schema-only commit `a20028c` landed the Provenance discriminated union; CatalogSnapshotRef has the version-pin variant designed but only legacy-pre-schema-lock constructable today (per Packet memo §1.5 + `types/index.ts:1220-1245`). The two missing UX surfaces Opus calls out — (a) catalog v3 → v4 diff workflow when an operator's pinned Base Sheet is touched by a catalog update, and (b) per-field provenance display (world-class allergen roadmap #2 is first instance) — are both unimplemented. The schema is correct; the UX is the gap.

### Layer 9 — Search & Discovery

**Verdict:** Correctly identified as the absent layer. **Most consequential structural gap in this investigation.** Today's only catalog entry path is bulk-paste (`parsePastedFormula`). Browse by category exists in the Ingredient DB tab (filtered list per `MODES[modeId].categories`); no search across names + synonyms + notes + suppliers; no find-alternatives surface; no find-similar; no filter-by-attribute (allergen-free, organic, certified, vegan, kosher, halal, etc., despite all fields existing). For an operator deciding among multiple forms — the central workflow of a serious formulator — this layer is what they need and what does not exist.

The integration cost between Layer 9 and existing layers is meaningful but tractable — every required field already exists on `IndustrialIngredient` (allergens / sustainabilityCerts / organicAvailable / regulatoryStatus / functionalRole / matrixCompatibility / etc.); what's missing is a filter / search / discovery UI surface. The decision Q8 in §9 — does Layer 9 ship at August Nutraceuticals MVP or wait until Q4 — is a substantial strategic question because the alternative is operator memory + spreadsheets to track "which magnesium form for which formulation."

### Layer 10 — Data Quality & Validation

**Verdict:** Correctly identified as the strongest-developed layer. Catalog-entry-validator subagent (`.claude/agents/catalog-entry-validator.md` per `[[reference_catalog_entry_validator_v1]]`), §38a unscoped-grep discipline (per `[[feedback_38a_unscoped_grep]]`), §III.15 + M4 + M24 validator gates, pre-commit gate hook (per commit `7fa3e5e`), FALCPA species + harm-critical floor + identity-test + Bucket 1 gate, duplicate-SKU sweep audit baseline. Worth protecting as durable infrastructure through Round 12+.

The validator gap discipline (`[[feedback_validator_gap_1_self_check]]` — May 23 Magtein bug surfaced that Gap #1 mechanical check has its own gap) is mature ground for the strategic session to confirm continuance.

### Candidate Layer 11 — Mode + Product-Class Routing

**Verdict:** Surface candidate for first-class status. Today the catalog is **partitioned by mode** at `lib/modes.ts` — `MODES.fb.ingredientDB = INDUSTRIAL_DB`; `MODES.supplements.ingredientDB = SUPPLEMENT_INGREDIENTS`; etc. The Product Class enum (`'acidified-food' | 'supplement' | 'beverage' | 'cured-meat' | 'bacon' | 'baked-good' | 'fresh-produce' | 'general'`) is orthogonal to mode (a supplement can be Tablet or Liquid or Powder; an F&B can be acidified-food or beverage). Mode + Product Class together determine: (a) which catalog the bulk-paste resolver consults, (b) which regulatory framework determinations fire, (c) which spec metrics apply (acidified-food cares about equilibrium pH; supplement cares about CFU), (d) which label format renders.

Today this routing is **implicit in code** — split across `lib/modes.ts` + `types/index.ts ProductClass` + per-engine product-class branches. Not bad code; just not first-class as an architectural layer. Calling it out:
- Surfaces Q9 (mode toggle / Novice tier per Packet memo) more cleanly — the mode toggle is partly a routing decision and partly a UX progressive-disclosure decision
- Surfaces the cross-mode catalog discovery question (when an operator paste contains BOTH supplement-catalog AND F&B-catalog ingredients — e.g., a functional beverage containing Vitamin D — which catalog wins? Today: mode determines which db `parsePastedFormula` sees)
- Surfaces the per-product-class spec system gap (memory `[[project_spec_system_multi_product_class]]`) more clearly

Recommendation: **promote to first-class Layer 11** in the strategic-session inventory. Doesn't require code refactor — the routing already lives in the right places — but the architectural framing helps with the mode toggle decision (Q9) and the cross-mode discovery question.

### Sub-layer call-outs that don't need full promotion

- **Synonym layer** within Layer 1a — strategically important (Q2 in §9), but stays inside Layer 1.
- **Allergen species taxonomy** within Layer 3 — already mature (FALCPA + Mollusks), well-tested. Inside Layer 3.
- **Confidence + range taxonomy** (`[[feedback_confidence_taxonomy_foundational]]` + `[[feedback_three_class_value_taxonomy]]`) — cross-cutting concern; touches Layers 2 + 5 + 6 + 7 + 8. Stays cross-cutting in the design-system memo's primitive vocabulary rather than its own catalog layer.

---

## §2 — Implementation state map

Per-layer code location + test coverage + validator coverage + downstream consumers + maturity classification.

**Maturity legend:** ✓ shipped • ◐ partial • ◯ scaffold (schema-only) • ✗ missing

### Layer 1a — Matcher

| Element | Status | Location |
|---|---|---|
| `normalizeIngredientName` | ✓ | `lib/parseFormula.ts:332-340` |
| `findBySynonym` | ✓ | `lib/parseFormula.ts:348-360` |
| `findBestMatchWithTier` (4-tier ladder) | ✓ | `lib/parseFormula.ts:478-673` |
| Per-entry `synonyms?: string[]` | ✓ schema / ◐ population | `types/index.ts:844` + `lib/data/supplements.ts` (Wave 1.5b backfill ~partial) |
| Legacy module-level `SYNONYMS` map | ✓ | `lib/parseFormula.ts:292-304` (F&B-era fallback) |
| Stripped-name collision detection | ✓ | `lib/parseFormula.ts:569-605` (Wave 1.5d) |
| Head-token + tail-token scoring | ✓ | `lib/parseFormula.ts:619-672` |
| Density-aware volume → mass | ✓ | `lib/parseFormula.ts:140-254` (~73 INGREDIENT_DENSITIES entries + 32 keyword regexes) |
| Test coverage | ✓ | `synonym-matching.test.ts`, `wave-1-5a/b/c/d/e-*.test.ts`, `keyword-match.test.ts`, `parse-formula-unit-preservation.test.ts` |

**Consumer:** `app/workspace/page.tsx:3705` (bulk-paste import button) — single entry point.

### Layer 1b — Disambiguator

| Element | Status | Location |
|---|---|---|
| `findHarmCriticalSiblings` | ✓ | `lib/parseFormula.ts:405-424` |
| `harmCriticalDisambiguationReason` | ✓ | `lib/parseFormula.ts:433-439` |
| `harmCriticalDifferenceExists` predicate | ✓ | `lib/supplementHarmCritical.ts` |
| Tier 3 escalation surface | ✓ | `findBestMatchWithTier` synonym branch (lines 500-511) + sub-ingredient branch (523-536) + single stripped-name branch (584-593) |
| UI surface (amber Confirm match) | ✓ | `app/workspace/page.tsx` post-paste dialog |
| Test coverage | ✓ | `wave-1-5e-synonym-layer-collision.test.ts` |

### Layer 2 — Spec & Composition

| Element | Status | Location |
|---|---|---|
| `Nutrition` interface (per 21 CFR 101.9) | ✓ | `types/index.ts:55-89` |
| Per-100g nutrition on `IndustrialIngredient` | ◐ partial | `IndustrialIngredient.nutrition: Partial<Nutrition>` — 74% of supplement entries had empty `{}` per Phase 1 NFP diagnosis |
| Density (per ingredient) | ◐ | `lib/parseFormula.ts:143-200` — flat lookup, not catalog-field |
| pH / Brix / a_w / moisture | ◐ | `lib/foodScience.ts` (F&B-shaped) — RANGE_TABLE + spec metric definitions |
| Refining grade (`falcpaExemptionStatus`) | ✓ schema / ◐ population | `types/index.ts:952-992` (3-state) |
| Heavy metals + solvent residuals + microbial baselines | ✗ | No schema; lives in supplier spec sheets (off-platform) |
| Per-product-class spec metrics (hardness/friability/CFU) | ✗ | F&B-shaped today; memory `[[project_spec_system_multi_product_class]]` queued |
| F3 Tier 1 agentic ingestion | ✗ | Engineering brief at `docs/agents/f3-tier-1-supplier-spec-scraping-engineering-brief-2026-05-23.md`; not yet built |
| Test coverage | ✓ (foodScience + serving model) | `serving-model.test.ts`, `supplement-b12-dv-resolution.test.ts` |

**Consumer:** `lib/supplementLabeling.ts` (DV resolution + SFP build), `lib/supplementMath.ts` (per-ingredient mass + UL math), `lib/foodScience.ts` (pH / aw / Brix / moisture calculations), `lib/filingReadiness.ts` (spec coverage %).

### Layer 3 — Regulatory Classification

| Element | Status | Location |
|---|---|---|
| `RegulatoryStatus` union (9 variants) | ✓ schema / ◐ population | `types/index.ts:713-722` |
| `IndustrialIngredient.regulatoryStatus?` | ✓ schema / ◐ population | `types/index.ts:929` |
| `AllergenCategory` (FALCPA Big-9 + Mollusks + Mustard) | ✓ | `lib/supplementAllergen.ts:64-75` |
| FALCPA species-naming detector | ✓ | `lib/supplementAllergen.ts` |
| FALCPA §203(b)(2) refined-oil exemption | ✓ | `IndustrialIngredient.falcpaExemptionStatus` + `e9d19bf` + `11472af` |
| Added Sugars (per 21 CFR 101.9(c)(6)(iii)) | ✓ | `Nutrition.addedSugars` + `fe925de` + `9214abf` |
| NDI status (Pre-1994 ODI / NDI-notified / required-not-notified) | ◐ | Schema exists; per-entry population partial; `lib/supplementNDI.ts` |
| GRAS / food-additive / color-additive | ◐ | Schema exists; per-entry population partial |
| DSHEA classification | ◐ | Surfaces in Determination Engine card; per-entry routing varies |
| Disease claim blocks at field level | ◐ | `lib/supplementClaims.ts` handles claim text; per-ingredient disease-claim-block fields not consistently populated |
| Identity-test attestation (21 CFR 111.75(a)(1)) | ✓ schema / ◯ persistence | `types/index.ts:473-517` + `lib/identityTest.ts` + Bucket 1 gate |
| Pharmacopeial reference (USP/FCC/EP/JP/AHP/WHO) | ✓ schema / ◐ population | `types/index.ts:737` + `IndustrialIngredient.pharmacopeialReference?` |
| `CoaTemplateType` (11 variants) | ✓ schema / ◐ population | `types/index.ts:759-770` |
| Drug interactions | ✓ schema / ◐ population | `types/index.ts:783-797` + `DrugInteraction` |
| Product Class routing (Round 10 Path A) | ✓ | `types/index.ts:166-203` + `lib/regulatoryLimits.ts` |
| Test coverage | ✓ | `supplement-allergen-gate.test.ts`, `supplement-disease-claim-gate.test.ts`, `supplement-identity-test-gate.test.ts`, `supplement-ndi-keyword-discipline.test.ts`, `path-a-product-class.test.ts`, many more |

**Consumer:** `lib/supplementBucket1Gate.ts` (Bucket 1 export gate composes 5-6 sub-gates), `lib/supplementAllergen.ts` (FALCPA export gate), `lib/identityTest.ts` (§B3 gate), `lib/supplementClaims.ts`, `lib/supplementDisclaimer.ts`, Filing tab.

### Layer 4 — Vendor / Commercial

| Element | Status | Location |
|---|---|---|
| `IndustrialIngredient.suppliers: string[]` (platform-side) | ✓ | `types/index.ts:814` |
| `SupplierInfo` structured profile (tier / MOQ / lead-time / certs) | ✓ schema / ◐ population | `types/index.ts:1103-1116` + `lib/data/suppliers.ts` |
| `SupplierQualification` documents + expiration tracking | ✓ schema | `types/index.ts:1063-1095` |
| `SupplierTier` (commodity/specialty/premium/craft) | ✓ | `types/index.ts:1034` |
| `LeadTimeBucket` + `MoqTier` | ✓ | `types/index.ts:1039-1056` |
| Operator-side vendor relationships (account #, MOQ, payment terms, contract ref, internal SKU) | ✗ | Per Packet memo §2.7.D — schema does not exist |
| Per-batch lot capture | ◯ | `BatchSheet.ingredientLots` schema exists; UI not wired |
| Workbook-vendor seed list | ✓ memory / ✗ code | `[[workbook-vendors-as-platform-resource]]` lists Greenwood/Sethness/Cargill/etc.; not yet in catalog |
| `[[matt-fjc-vendor-spec-custodian]]` | ◯ | Memory + queued outreach; no schema reflection yet |
| Test coverage | ◐ | `supplier-qualifications` partial |

**Consumer:** Sourcing tab in workspace, `lib/supplierQualifications.ts`. Cost rollups via Layer 6.

### Layer 5 — Functional / Use-Context

| Element | Status | Location |
|---|---|---|
| `FunctionalRole` (42 enum values) | ✓ schema / ◐ population | `types/index.ts:597-638` |
| `IndustrialIngredient.functionalRole?: FunctionalRole[]` | ✓ schema / ◐ population | `types/index.ts:906` |
| `Bioactive` + `isMarkerCompound` | ✓ schema / ◐ population | `types/index.ts:645-666` |
| `MatrixCompatibility` (8 enum values) | ✓ schema / ◐ population | `types/index.ts:674-683` |
| `UsageRange` (typicalPct / minPct / maxPct) | ✓ schema / ◐ population | `types/index.ts:691-695` |
| UL ceilings per ingredient | ✓ | `lib/supplementSafetyLimits.ts` |
| Processing notes (heat-sensitive / light-sensitive / hygroscopic) | ✗ structured / ✓ in prose | Lives in `notes` field |
| Storage conditions | ✗ structured / ✓ in prose | Lives in `notes` field |
| Form factor (powder / liquid / capsule / granular) | ✗ structured | Implied by product_type at formulation level; not on ingredient |
| Test coverage | ✓ (UL) | `supplement-stacks.test.ts`, `section-6-ul-gate-cascade.test.ts` |

**Consumer:** Nutraceuticals workspace "surface by intended benefit" filter intent (Layer 9 not wired), Stack compatibility checking, Drug interaction surfacing.

### Layer 6 — Cost / Economics

| Element | Status | Location |
|---|---|---|
| `IndustrialIngredient.costPerKg` | ✓ | `types/index.ts:817` |
| `costSource` (verified-quote / industry-typical / category-default) | ✓ schema / ◐ population | `types/index.ts:891` |
| `costValidUntil` (staleness) | ✓ | `types/index.ts:898` |
| Cost rollup (per-kg / per-serving / per-package / formula-total) | ✓ compute / ◐ persist | Cost Tool tab renders live; values don't persist per-product |
| Operator-supplied cost overrides | ✗ | Per memory #22 + Packet memo §2.9 — Packet schema not built |
| Yield factors (extracts, blends) | ◐ | `potencyFactor` + `elementalFactor` carries the math at boundary |
| Loss factors in processing | ✗ | No schema |
| Test coverage | ◐ | Limited |

**Consumer:** Cost Tool tab, Unit Economics tiles in Build view, future Packet cost-tracking surface.

### Layer 7 — Workflow Integration (9 downstream surfaces)

| Surface | Status | Location |
|---|---|---|
| Nutrition Facts Panel | ✓ render / ◐ data | `lib/supplementLabeling.ts` (DV) + workspace NFP component |
| Supplement Facts Panel | ✓ render / ◐ data | `lib/supplementLabeling.ts` + `buildSupplementFacts` |
| Allergen statement / FALCPA | ✓ | `lib/supplementAllergen.ts` + Format B default (`23aa693`) |
| Filing Readiness % | ✓ | `lib/filingReadiness.ts` |
| pH / acidified-food determinations | ✓ | `lib/foodScience.ts` + Filing tab |
| Spec coverage % | ✓ | `lib/trackedSpecs.ts` |
| Harm-critical floor checks | ✓ | `lib/supplementHarmCritical.ts` + `lib/identityTest.ts` |
| Cost-per-serving / cost-per-package | ✓ live / ◐ persist | Cost Tool tab |
| Per-ingredient regulatory citations | ✓ | Spec Sheet button (modal) per workspace |
| Per-version snapshot of any of the above | ✗ | Re-derived on demand; world-class allergen #4 is the first version-locked snapshot work item |
| Test coverage | ✓ | Wide — Section 2-6 gate tests, `filingReadiness`, `supplementMath`, `serving-model`, `fda-rounding`, etc. |

### Layer 8 — Versioning & Provenance

| Element | Status | Location |
|---|---|---|
| `Provenance` discriminated union (9 variants) | ✓ schema | `types/index.ts:1618-1738` (commit `a20028c`) |
| `Sourced<T>` wrapper | ✓ schema | `types/index.ts:1748-1751` |
| `IndustrialIngredient.provenance?: Record<string, Provenance>` | ✓ schema / ✗ population | `types/index.ts:1024` |
| `CatalogSnapshotRef` (legacy + version-pin) | ✓ schema / ◐ runtime (legacy only constructable today) | `types/index.ts:1220-1245` |
| Catalog version monotonic increment | ✗ | No lib/data/* version tags yet |
| Per-version generated-artifact snapshot | ✗ | World-class allergen #4 is first instance |
| v3 → v4 catalog drift UX | ✗ | Schema supports it; no UX |
| Provenance display in UI | ✗ | World-class allergen #2 = first integration site |
| Test coverage | ◐ | Schema-shape tests only |

### Layer 9 — Search & Discovery

| Element | Status | Location |
|---|---|---|
| Bulk-paste (sole entry path) | ✓ | `lib/parseFormula.ts` + `app/workspace/page.tsx:3705` |
| Browse by category | ◐ | Ingredient DB tab — flat list per `MODES[modeId].categories` |
| Search by name | ✗ | No deliberate search surface |
| Search across synonyms | ✗ | Bulk-paste only |
| Search across notes / suppliers | ✗ | No |
| Filter by attribute (allergen-free / organic / kosher / halal / vegan / non-GMO) | ✗ surface / ✓ data | Every field exists on `IndustrialIngredient`; no filter UI |
| Find-alternatives ("substitute for X") | ✗ | Not designed |
| Find-similar | ✗ | Not designed |
| Filter by functional role / matrix compatibility / regulatory status | ✗ surface / ✓ data | Same — data exists, no surface |
| Test coverage | ✗ | Surface not built |

**This is the most consequential structural gap. Strategic-session Q8 (Layer 9 sequencing) is high-leverage.**

### Layer 10 — Data Quality & Validation

| Element | Status | Location |
|---|---|---|
| Catalog Entry Validator subagent (v1) | ✓ | `.claude/agents/catalog-entry-validator.md` + memory `[[reference_catalog_entry_validator_v1]]` |
| §38a unscoped-grep discipline | ✓ | Catalog Authoring Rulebook + `[[feedback_38a_unscoped_grep]]` |
| Pre-commit gate hook | ✓ | `.claude/hooks/pre-commit-gate.sh` + commit `7fa3e5e` |
| Required-field discipline (M4) | ✓ | Validator + Rulebook |
| Cross-field consistency (M24 subIngredients ↔ allergens) | ✓ | Validator |
| Harm-critical floor (UNDOCUMENTED defaults) | ✓ | `[[harm-critical-floor]]` + `lib/supplementHarmCritical.ts` |
| Duplicate detection (May 20 sweep) | ✓ | `docs/audits/duplicate-sku-sweep.md` |
| FALCPA species gate | ✓ | `lib/supplementAllergen.ts` |
| Identity-test gate | ✓ | `lib/identityTest.ts` |
| Bucket 1 export gate (5-6 sub-gates composed) | ✓ | `lib/supplementBucket1Gate.ts` |
| Spec-vs-types prerequisite check | ✓ doctrine | `[[feedback_spec_vs_type_system_prerequisite]]` |
| Validator self-check (Gap #1) | ◐ | `[[feedback_validator_gap_1_self_check]]` — Magtein bug surfaced |
| Test coverage | ✓ wide | 30+ test files across `lib/__tests__/` |

**Strongest-developed layer.** Worth protecting through Round 12+ work.

### Layer 11 (proposed) — Mode + Product-Class Routing

| Element | Status | Location |
|---|---|---|
| `MODES` registry (6 modes, 2 active) | ✓ | `lib/modes.ts:91-197` |
| Per-mode `ingredientDB` | ✓ | `lib/modes.ts` (INDUSTRIAL_DB / SUPPLEMENT_INGREDIENTS / etc.) |
| Per-mode `productTypes` + `processTemplates` + `packagingDB` + `categories` + `labelMode` | ✓ | `lib/modes.ts` per-mode entry |
| `ProductClass` enum (8 values) | ✓ | `types/index.ts:166-174` |
| Per-product-class regulatory limits | ✓ | `lib/regulatoryLimits.ts` |
| Mode toggle (Novice / Pro) | ✗ scaffold / ◐ partial | `lib/copy/` + `lib/hooks/useTier.ts` infrastructure present; mode toggle not wired |
| Cross-mode catalog discovery (when paste contains both supplement + F&B) | ✗ | Routes to current mode's db only |
| Per-product-class spec metric set | ✗ | F&B-shaped; memory `[[project_spec_system_multi_product_class]]` queued |
| Test coverage | ◐ | `workspace-mode.test.ts`, product-class tests |

---

## §3 — Redundancy audit

Where the same information lives in multiple places, intentionally or by accident.

### Allergens — three representations

1. **`IndustrialIngredient.allergens: string[]`** (catalog field) — declared allergens per ingredient
2. **`IndustrialIngredient.subIngredients: string[]`** — composition, which the FALCPA detector scans for species-level matches (`lib/supplementAllergen.ts`)
3. **`detectAllergensDetailed()`** output (`lib/supplementAllergen.ts`) — derives FALCPA categories + species at workspace time

Plus the `lib/utils.ts` `detectAllergens()` legacy detector (`string[]`-returning) used as a safety-net populator of `Ingredient.allergens` per formulation per the docblock at `lib/supplementAllergen.ts:35-41`.

**Verdict:** Intentional. The three representations serve different consumers (catalog declarations, FALCPA species detection, safety-net population). Not redundant in the harmful sense; ensure the M24 validator gate keeps `subIngredients` ↔ `allergens` consistency enforced. **Risk surface:** when `allergens` is populated but `subIngredients` doesn't contain a matching species token, detection silently misses — depending on operator-supplied composition data is fine but the relationship should be tested explicitly. (Memory `[[feedback_sku_name_matches_field_data.md]]` covers a sibling risk.)

### Supplier data — split intentional, integration absent

1. **`IndustrialIngredient.suppliers: string[]`** (platform-side, by name)
2. **`SupplierInfo` records in `lib/data/suppliers.ts`** (platform-side structured profile)
3. **Operator-side vendor relationships in Packet** (per Packet memo §2.7.D — ✗ schema)

**Verdict:** Per memory #22 doctrine, the split between platform-side (who could theoretically supply) and operator-side (who the operator actually buys from with what terms) is intentional. The integration point (how a catalog ingredient links to an operator's vendor record at formulation time) is **Q10 — load-bearing strategic-session decision.**

### Cost data — minor staleness duplication

1. **`IndustrialIngredient.costPerKg`** + **`costSource`** + **`costValidUntil`**
2. **Operator-supplied cost overrides** (per memory #22, in Packet — ✗ schema)
3. **Per-batch lot cost** (`BatchSheet.ingredientLots` ◯ schema)

**Verdict:** Intentional. Stale platform value defaults; operator overrides + per-batch lot capture. No collapse needed. Note that today `costSource: 'industry-typical'` is the population default per the type docblock — the vast majority of catalog values are scaffolded; this is honest at the type level but the operator UX needs to surface it via the confidence taxonomy primitive (design system memo §3.2 + Q-DS-2).

### Provenance — three different mechanisms

1. **`IndustrialIngredient.provenance?: Record<string, Provenance>`** — per-field provenance (per-allergen, per-nutrient, per-status)
2. **`CatalogSnapshotRef`** (legacy / version-pin) — entry-level version-pin per Base Sheet
3. **Per-version snapshot of generated artifacts** (per Packet memo §2.4 — ✗ all unimplemented)

**Verdict:** Three distinct levels of granularity (field / entry / artifact). Not redundant; complementary. Implementation maturity differs (1 = schema-only-ready-to-populate; 2 = version-pin-not-yet-constructable; 3 = not designed). Each lands at a different point on the roadmap.

### Identity — five layers

1. **`IndustrialIngredient.name`** — canonical entry name (e.g., `'Magnesium Glycinate (Albion TRAACS, USP)'`)
2. **`IndustrialIngredient.synonyms?: string[]`** — per-entry alternates (e.g., `['magnesium glycinate', 'mag glycinate', 'TRAACS Mg']`)
3. **`IndustrialIngredient.subIngredients: string[]`** — composition tokens (e.g., `['Magnesium', 'Glycine']`)
4. **Stripped-name normalization** — `stripCatalogTrailingParens()` strips `(form, supplier, std)`, producing `'Magnesium Glycinate'`
5. **`normalizeIngredientName()`** — lowercase + strip parens + strip punctuation + collapse whitespace

**Verdict:** Five layers because each catches a different paste-pattern. The stripped-name layer is what enables Wave 1.5d collision detection (multiple branded forms share a stripped name → Tier 3 disambiguation); the normalization layer is what makes per-entry synonyms forgiving across casing/punctuation variants. Not redundant — necessary stack for honest matching at paste time. Routing question: where do new synonyms come from (Q2 in §9)?

### Validation rules — overlapping responsibilities (intentional)

| Rule | Source | Enforces | Composes into |
|---|---|---|---|
| M4 (required fields per Rulebook §VI.29) | Catalog Authoring Rulebook + Validator subagent | Schema completeness | Pre-commit hook |
| M24 (cross-field consistency) | Validator subagent | subIngredients ↔ allergens + species discipline | Pre-commit hook |
| §III.15 (display name rule) | Rulebook §III.15 | Common Name (Form, Supplier, Standardization) discipline | Validator |
| §38a unscoped-grep | Rulebook §38a + memory `[[feedback_38a_unscoped_grep]]` | Pre-commit duplicate-prevention | Validator self-check |
| FALCPA species gate | `lib/supplementAllergen.ts` (`evaluateAllergenGate`) | Species-naming at export time | Bucket 1 gate |
| Harm-critical floor | `[[harm-critical-floor]]` + `lib/supplementHarmCritical.ts` | UNDOCUMENTED defaults discipline | Multi-gate composition |
| Identity test gate (§B3) | `lib/identityTest.ts` | Per-ingredient attestation existence + structural correctness | Bucket 1 gate |
| Bucket 1 export gate | `lib/supplementBucket1Gate.ts` | 5-6 sub-gates composed (allergen + claim + identity + net-quantity + review-state + disclaimer) | Export gate |

**Verdict:** Layered composition, not redundancy. Each rule has a specific failure mode it prevents; gates compose at the export boundary. Worth keeping the layered model — collapsing would lose enforceability granularity.

### Catalog fetch / transform / compute paths — single canonical path

Every consumer reads from `MODES[modeId].ingredientDB` (`lib/modes.ts`) — no per-consumer copy. Resolver does not maintain a separate index. `app/workspace/page.tsx:97/185` injects the per-mode db into `parsePastedFormula` via the `db` argument.

**Verdict:** Clean. No redundant fetch paths. **But:** linear-scan over `db` is the predominant access pattern (see §4 inefficiency audit).

---

## §4 — Inefficiency audit

### Bulk-paste pipeline — passes over the catalog per resolved line

`findBestMatchWithTier()` performs **multiple linear scans** per line in worst case:

1. Exact catalog-name match — full scan (`db.find(...)`)
2. Per-entry synonym match — full scan + per-entry inner loop over synonyms array (`findBySynonym`)
3. Sub-ingredient single-match — full scan with inner check
4. Legacy module-level `SYNONYMS` map — O(1) hash lookup (efficient)
5. Stripped-name match collection — full `db.filter(...)` scan
6. Whole-word prefix match — full scan + sort
7. Token-overlap candidates — full scan + sort

**Quantification:** A single paste line at ~392 catalog entries triggers 5-6 full scans + 1-2 inner-scan-per-entry passes. For each Tier 1/2 confident match, `findHarmCriticalSiblings` adds another full `db.filter(...)` pass. For a typical 12-line operator paste: ~12 × ~7 scans × ~392 entries = ~33,000 string comparisons + normalize calls per paste, plus normalize calls re-execute per comparison (no memoization of normalized synonym strings).

**Implication at scale:** At 392 entries this is ~10-50ms per paste — fine. At 10x (3920 entries) it's 100-500ms — noticeable. At 100x (39200) it's 1-5 seconds — unusable. **Inefficiency, not a launch-blocker today.** Scaling intervention is a precomputed index keyed on normalized synonyms + stripped names + tokens — straightforward, ~few-hundred-line refactor when needed.

### Resolver redundant work within a paste

`parsePastedFormula` calls `findBestMatchWithTier(name, db)` per line. The `db` argument is the same per call; the per-entry normalization of `synonyms`, `subIngredients`, `name` happens on every call within one paste. **Inefficiency:** repeated normalization of the same db entries across paste lines (e.g., a 12-line paste re-normalizes the same 392 entries' synonyms 12 times). Solution: pre-normalize the db once per paste session.

### Downstream graph — recompute pattern

`app/workspace/page.tsx` derives NFP / SFP / allergen statement / framework determinations / cost rollups / filing readiness / spec coverage live from in-memory state on every render. No memoization across renders other than React's render diffing. Per Packet memo §2.4 — **renders are not snapshotted per Base Sheet version.** For Packet implementation, this means moving from "recompute every render" to "compute once per version-lock + cache the snapshot."

**Inefficiency vs design choice:** The current pattern is "honest live recomputation" which is the right shape for a live authoring surface. Inefficiency only emerges when (a) the catalog grows materially, (b) renders happen during scroll or input keypress, or (c) Packet snapshots become canonical. None of these are launch-blockers today.

### Catalog snapshot strategy — pin variant vs full snapshot

`CatalogSnapshotRef` is a discriminated union of two strategies: `legacy-pre-schema-lock` (no snapshot — runtime catalog re-resolves) and `version-pin` (monotonic catalog version number). Only legacy is constructable today.

**Strategic question:** Eventually the platform may need `full-snapshot` (complete data immutability for regulated saves — PA-approved Base Sheet must be reproducible byte-for-byte). The `[[runtime-reframe-hybrid-architecture]]` memory explores this (pure-runtime weaker than hybrid). The two-variant design supports adding `full-snapshot` later; today's choice is `version-pin`. **Not redundant; sequenced.**

### Search / lookup scaling

Linear scan; ~392 entries × N lookups per paste. Will scale to 10x with noticeable lag at paste time but not break. Will scale to 100x only with the indexed-lookup refactor. **Not a launch-blocker.**

### Dead code / never-called paths

- `lib/supabase.ts` (stale stub) coexists with `lib/supabase/{client,server,middleware}.ts` (real `@supabase/ssr` clients). Packet memo §1.10 calls out the cleanup ticket. **Real dead code — minor.**
- `MODES.baking` / `MODES.catering` / `MODES.feeds` / `MODES.sausage` are fully defined but excluded from `MODE_ORDER` (`lib/modes.ts:200`). Intentional per the comment ("Re-enable any mode by adding its ModeId back to this array"). **Not dead; parked.**
- `productTypes` (full list) vs `dropdownProductTypes` (narrowed) in F&B mode — intentional UX surface filter, not redundancy.
- `SavedFormulation.attestations?: IdentityTestAttestation[]` — schema-only with JSDoc noting "persistence layer wires in Round 12." **Not dead; forward-compatible.**

---

## §5 — Assumption surfacing

Implicit beliefs in the implementation that may not hold at scale or under expanded use.

| Implicit assumption | Where it lives | Where it could break |
|---|---|---|
| Catalog is the only source of ingredient data for a formulation | `parsePastedFormula` uses `db` as sole match source; `Ingredient.foodData` discriminator includes 'industrial' \| 'usda' but not 'operator-override' | Operator overrides catalog values in their Packet (per memory #22) — schema currently has no operator-override `kind` |
| One canonical name per entry | `IndustrialIngredient.name` is single string | Internationalization (EU labeling needs French / German / Spanish names); brand variants ("Albion TRAACS" vs "Albion TRAACS®") |
| One category per entry | `IndustrialIngredient.category: string` (single) | Cross-category cases — CDP-Choline lives in Fatty Acids today but is functionally a Vitamin-family compound; Glucosamine could be Joints OR Specialty; mushroom families per duplicate-sku-sweep §2A surfaced as cross-category-split work item |
| All entries scale linearly (linear-scan resolver) | `parseFormula.ts` full-scan idioms | At ~3920 entries (10x), paste latency noticeable; at ~39200 (100x), unusable without indexed lookup |
| Synonyms are unique across the catalog | `findBySynonym` returns FIRST match by db iteration order (`lib/parseFormula.ts:351-358` — "expect the catalog to maintain unique normalized synonyms (otherwise the result is deterministic but arbitrary). Tests should catch synonym collisions.") | Per-entry synonym additions may introduce silent collisions; tests catch known cases but lack a global enforcement |
| Stripped-name normalization is unambiguous | `stripCatalogTrailingParens` strips trailing parens; Wave 1.5d detects multiple matches | Names that don't follow `Common Name (Form, Supplier, Standardization)` pattern bypass the stripping logic; entries that carry multiple parens in different positions complicate this |
| `mode` determines which `db` the resolver consults | `MODES[modeId].ingredientDB` | Cross-mode formulations (e.g., functional beverage with Vitamin D — F&B mode but supplement-catalog ingredient required) cannot resolve today |
| `productClass` is operator-supplied at creation | `SavedFormulation.productClass?` (optional in type for migration) | UI enforces required-at-creation but type marks optional — drift surface |
| Catalog version drift is operator-invisible | `CatalogSnapshotRef.legacy-pre-schema-lock` is the only constructable variant today | When catalog v3 → v4 happens, no UX exists to surface the diff to operators whose Packet is pinned to v3 |
| Generated label renders re-derive correctly forever from snapshotted inputs | NFP / SFP / allergen statement re-derive on every render from `SavedFormulation.ingredients` | Regulatory rule changes (e.g., new FDA Big-9 expansion, FALCPA addition) change the function — re-derivation produces DIFFERENT output for the same inputs. Packet memo §2.4 + world-class allergen #4 covers this |
| Empty `allergens`, `drugInteractions`, `regulatoryStatus` defaults to "not yet investigated" | Harm-critical floor doctrine + UI must surface UNDOCUMENTED | Per `[[feedback_harm_critical_fields_default_undocumented]]` — discipline is correct; risk surface is UI must consistently render UNDOCUMENTED (not "no concerns") |
| Platform-side `costPerKg` is meaningful default until operator overrides | `costSource: 'industry-typical'` default | Catalog renders prices as if VERIFIED until operator pays attention — confidence taxonomy primitive (design memo §3.2) must consistently surface the 'industry-typical' stance |
| `IndustrialIngredient.suppliers[]` represents all suppliers an operator might use | `MODES[modeId].ingredientDB` per-entry suppliers array | Operator brings novel supplier not in the platform list — schema must accept operator-side supplier creation in the Packet |
| Catalog discovery happens via bulk-paste | `parsePastedFormula` is the only entry path | Operator doesn't know what to paste (Q8 — Layer 9 sequencing) |
| All entries within a category are commercially substitutable for each other | Implicit in category-as-filter UX | Tier-A pharma vs Tier-B commodity distinction (per `[[project_supplements_two_wave_ingestion]]`) makes within-category substitution non-trivial — the supplements two-wave seam means the operator can't naively swap Vitamin C entries without knowing they're swapping tier |
| FALCPA exemption status is binary | Earlier `falcpaExemptionStatus` design | Reframed correctly to 3-state taxonomy 2026-05-25 per `[[falcpa-highly-refined-oil-exemption]]` |

---

## §6 — Operator workflow coverage

For each canonical operator workflow, can the catalog support it today?

| Workflow | Supportable today? | Gap |
|---|---|---|
| **Discovery:** "I need a magnesium for sleep — what's available?" | ✗ | Layer 9 (browse/filter) absent. Today the operator must know the canonical name (e.g., "Magnesium Glycinate") to paste. |
| **Comparison:** "Compare these two glucosamine forms side-by-side" | ✗ | No comparison surface. The Saved tab compares formulations (up to 3) but doesn't compare catalog entries. |
| **Filter:** "What's the cheapest option that still meets USP?" | ◐ | Data exists (`pharmacopeialReference` + `costPerKg` + `costSource`); no filter surface. |
| **Vendor view:** "Show me everything I source from Supplier X" | ◐ | Data exists in `IndustrialIngredient.suppliers[]` + `lib/data/suppliers.ts`; Sourcing tab partially does this filter; operator-side vendor relationships not yet schema'd. |
| **Simulation:** "If I switch from A to B, what changes in my NFP/SFP/allergen statement/cost?" | ✗ | The "swap and re-derive" workflow exists implicitly (operator deletes A, adds B, observes recomputation) but no "diff preview" surface. |
| **Substitution:** "What's a substitute for this ingredient?" | ✗ | No find-similar / find-alternatives surface. Operator must rely on external knowledge. |
| **Allergen-aware filter:** "Show only ingredients that don't trigger FALCPA disclosure" | ◐ | Data exists in `allergens` field + `falcpaExemptionStatus`; no filter surface. |
| **Certification-aware filter:** "Show only kosher / halal / organic / vegan / non-GMO" | ◐ | Data exists (`sustainabilityCerts[]` + `organicAvailable`); no filter surface. |
| **Bulk-paste resolution:** "I have a 12-line formula text — resolve it" | ✓ | Mature (Tier 1-4 ladder + harm-critical disambiguation). |
| **Per-ingredient detail:** "Show me the full spec / monograph / supplier list for this entry" | ✓ | Spec Sheet button surfaces modal with catalog data. |
| **Cost rollup:** "What does this formulation cost per serving / per package?" | ✓ live / ◐ persist | Cost Tool tab renders; doesn't persist per-product. |
| **Regulatory check:** "Is this formulation DSHEA-compliant / safe?" | ✓ | Determination Engine + Bucket 1 gate + Filing Readiness. |
| **Catalog editing:** "I found a wrong value — can I fix it?" | ✗ | Catalog is read-only to operator. No override UI. No change-request workflow. (See cross-cutting concern in §7.) |
| **Find by functional role:** "Show me ingredients that support cognitive function" | ◐ | `functionalRole[]` schema exists (42 enum values); no filter UI. |
| **Find by matrix compatibility:** "Show me ingredients stable in acid beverages" | ◐ | `matrixCompatibility[]` schema (8 enums); no filter UI. |

**Aggregate verdict:** The catalog data is rich (most fields exist on `IndustrialIngredient` today). The catalog SURFACES are absent — Layer 9 unbuilt, comparison/simulation/substitution surfaces unbuilt. **The data is there; the discovery UX is not.**

---

## §7 — Cross-cutting integration audit

For each catalog ↔ surface integration point: complete (✓), partial (◐), absent (✗).

| Integration | Status | Notes |
|---|---|---|
| **Catalog ↔ Base Sheet pin (CatalogSnapshotRef)** | ◐ | Schema in place; only legacy-pre-schema-lock variant constructable. Version-pin variant requires catalog version-tag infrastructure that doesn't exist yet. |
| **Catalog ↔ Batch Sheet lot reference** | ◯ schema | `BatchSheet.ingredientLots` schema exists (`types/index.ts:1384-1455`); UI not wired; no zero-state `useState<BatchSheet[]>` in `app/workspace/page.tsx`. |
| **Catalog ↔ COA library** | ✗ | Per `[[coa-library-strategic-decision]]` — Model A/B/C choice pending. No upload/storage/linkage today. |
| **Catalog ↔ Filing Readiness %** | ✓ | `lib/filingReadiness.ts` consumes catalog data + spec coverage. |
| **Catalog ↔ Allergen-free claims gate** | ◐ | FALCPA detector + Format B render in place; allergen-free claims gate (world-class allergen #3) not yet wired. |
| **Catalog ↔ PA-review packet** | ◐ | State machine in `lib/reviewState.ts` + Bucket 1 export gate references PA approval. UI to create/manage Reviews not wired. PA-review packet curation (Packet memo §2.7.J(d)) not built. |
| **Catalog ↔ Cost / Sourcing** | ✓ catalog / ◐ persist | Catalog supplies `costPerKg` + suppliers list; Cost Tool tab renders live; per-product persistence depends on save backend (launch-blocker #4). |
| **Catalog ↔ Packet operator-input artifacts** | ✗ | Packet memo §2.7 — entire operator-input layer not yet schema'd. |
| **Catalog ↔ F3 Tier 1 ingestion pipeline** | ✗ | Engineering brief exists (`docs/agents/f3-tier-1-supplier-spec-scraping-engineering-brief-2026-05-23.md`); not yet built. Promoted to launch-critical per `[[catalog-must-be-coa-spec-sheet-anchored]]` MVP foundation step 5. |
| **Catalog ↔ NFP / SFP / allergen statement generation** | ✓ live / ✗ snapshotted | Live render works; per-version snapshot not yet built (world-class allergen #4 first). |
| **Catalog ↔ Save backend (Supabase)** | ✗ | `lib/supabase/` clients exist; OAuth callback only consumer; `savedFormulations` is in-memory only. Launch-blocker #4. |
| **Catalog ↔ Identity-test attestation** | ✓ schema + gate / ◯ UI | Schema + gate via `lib/identityTest.ts`; per-ingredient attestation UI deferred Round 12+. |
| **Catalog ↔ Mode + Product-Class routing** | ✓ | `lib/modes.ts` partitions catalogs per mode; `ProductClass` routes per-product-class regulatory rules. Implicit; per Layer 11 surfacing, could be promoted to first-class. |
| **Catalog ↔ Drift / catalog change UX** | ✗ | Operator sees no signal when catalog v3 → v4 happens beneath a pinned Base Sheet. |
| **Catalog ↔ Operator-side override** | ✗ | Schema implicitly assumes catalog is canonical; no operator-override discriminator on `IngredientSourceData`. |
| **Catalog ↔ Spec sheet attachment** | ✗ | Per `[[catalog-must-be-coa-spec-sheet-anchored]]` MVP foundation step 1 — not yet built. |

**Aggregate verdict:** Compute + gate + render integrations are mature. Persistence + lifecycle + drift + override integrations are absent. The launch-blocker #4 save backend unlocks ~half of these; the other half are scoped in the Packet memo + world-class allergen roadmap + COA library decision.

---

## §8 — Launch-critical gap classification

Gaps surfaced in §1–§7, classified by criticality.

### Launch-critical for August Nutraceuticals P1

These must close before the August MVP can ship to a paying customer.

1. **L8a — Catalog version-pin variant constructable** (currently only legacy variant exists) — required so per-Base-Sheet snapshot has substance, not name-only
2. **L8b — Provenance population per entry** (schema landed `a20028c`; values empty) — required so workspace renders provenance per `[[catalog-must-be-coa-spec-sheet-anchored]]` doctrine
3. **L2a — F3 Tier 1 agentic ingestion sequenced for pre-launch** (PROMOTED 2026-05-25 per `[[catalog-must-be-coa-spec-sheet-anchored]]` MVP foundation step 5) — doctrine doesn't scale without it
4. **L2b — Spec sheet attachment UI** (per MVP foundation step 1) — operator must be able to attach supplier spec sheets to catalog entries
5. **L7a — Catalog audit pass flagging UNDOCUMENTED on unsourced harm-critical fields** (per MVP foundation step 4) — so the workspace surfaces what's known vs guessed
6. **L7b — Per-version snapshot of generated regulatory deliverables** (NFP / SFP / allergen statement / framework determinations) — world-class allergen #4 first
7. **L3a — Catalog cleanup of remaining duplicate-SKU pairs** (per May 20 baseline ~25 confirmed pairs) — pre-launch hygiene
8. **L3b — Cross-category split cleanup** (mushroom families + choline family per duplicate-sku-sweep §2A) — requires operator + Opus call per §III.18
9. **L10a — Validator coverage of Provenance + Sourced<T> per-field** — extend M4/M24 to include provenance discipline
10. **L4a — Save backend (launch-blocker #4)** — catalog itself doesn't need it but every other launch-critical depends on it

### Launch-critical for Q4 F&B P2 (universal foundation; affects both)

These are universal foundation work — needed for both Nutraceuticals August and F&B Q4. Some are P1 launch-blockers because the schema must accept both verticals from day one.

11. **U1 — Operator-side vendor relationship schema** (per Packet memo §2.7.D + memory #22 + Q10) — schema must accept structured vendor records for both verticals
12. **U2 — Operator-side catalog override schema** (cross-cutting concern; see Q6 routing in §9) — schema decision must land before save backend ships
13. **U3 — Per-product-class spec metric set** (memory `[[project_spec_system_multi_product_class]]`) — supplement-class metrics (hardness/friability/CFU/etc.) deserve first-class typing now, not retrofit
14. **U4 — Mode + Product-Class as first-class Layer 11** (per §1 candidate) — structural framing for mode toggle + cross-mode discovery
15. **U5 — Confidence + range taxonomy populated per renderable value** (per `[[feedback_confidence_taxonomy_foundational]]`) — design-system primitive Q-DS-2; cross-cutting

### Universal foundation work

16. **F1 — Operator-side override discriminator on `IngredientSourceData`** — adds `'operator-override'` variant per §5 assumption
17. **F2 — `subIngredients` ↔ `allergens` consistency test** as a separate gate (not just M24 validator at authoring) — runtime safety net
18. **F3 — Provenance pill primitive in design system** (Q-DS-2 + design memo §3.2) — UI primitive must land before per-entry provenance rolls out
19. **F4 — Browse / search / filter surface infrastructure** (Layer 9) — sequencing decision Q8

### Post-launch optimization

20. **P1 — Indexed-lookup refactor for catalog resolver** (when catalog grows to 10x or 100x current 392 entries) — not a launch-blocker today
21. **P2 — Pre-normalize db once per paste session** — minor perf win; deferrable
22. **P3 — Full-snapshot CatalogSnapshotRef variant** (vs version-pin) for byte-for-byte immutability of regulated saves — V2 work
23. **P4 — Internationalization (per-locale entry names)** — deferred
24. **P5 — Cross-mode catalog discovery surface** — deferred
25. **P6 — Find-similar / find-alternatives engines** (Layer 9 advanced features) — deferred to post-Layer-9 v1
26. **P7 — Dead code cleanup (`lib/supabase.ts` stale stub)** — minor

---

## §9 — Routing questions for strategic session

Opus identified 7 questions; CC adds 4 more (Q8–Q11) that surface from §1–§8.

### Q1 — F3 Tier 1 ingestion sequencing — when does it land relative to save backend?

**Opus framing:** F3 Tier 1 PROMOTED to launch-critical per `[[catalog-must-be-coa-spec-sheet-anchored]]` MVP foundation step 5.

**Options:**
- **(A) Save backend FIRST → spec sheet attachment UI → F3 Tier 1** (sequence in MVP foundation). Operator can manually attach spec sheets before agentic ingestion lands; F3 Tier 1 backfills the agentic path post-manual-MVP.
- **(B) F3 Tier 1 + save backend in PARALLEL** — engineering brief is mature; ingestion pipeline ships alongside Supabase storage; both land at the same MVP cutover. Higher engineering ambition; reduces manual-attachment burden.
- **(C) F3 Tier 1 BEFORE save backend** (use F3 to populate spec sheet attachments into a local store before persistence wires up). Optimizes for catalog completeness over UI capability.

**CC perspective:** Option (A). Save backend is launch-blocker #4 (foundational); spec sheet attachment UI is layer 2 (depends on save); F3 Tier 1 ingestion can land in parallel with manual attachment UI as a back-fill, then become the primary path post-MVP.

**Strategic input needed:** Engineering bandwidth + co-founder vision on agentic-from-day-one vs manual-then-agentic.

### Q2 — Synonym strategy — source + discipline for adding/reviewing

**Opus framing:** Synonyms should come from operator paste-pattern data (empirical) + co-founder domain expertise — **NOT LLM defaults** per memory #21 doctrine.

**Options:**
- **(A) Operator paste-pattern data instrumented from day one** — every paste that lands at Tier 3/4 logs the operator's chosen disambiguation; aggregated paste data becomes the synonym backlog.
- **(B) Co-founder domain curation** — co-founder pre-populates synonyms during catalog growth.
- **(C) Hybrid — paste-pattern data instruments the QUESTIONS; co-founder picks the ANSWERS** — operator data informs which entries need synonym work; co-founder makes the call per entry.

**CC perspective:** Option (C). Each source is honest at what it's good for — paste-pattern data is rich + empirical but doesn't have judgment; co-founder has judgment but limited scaling. Hybrid combines them. Today's Wave 1.5b backfill was CC-LLM-typed which violates memory #21 doctrine. **Strategic decision needed:** locks the synonym pipeline going forward.

**Strategic input needed:** Co-founder's bandwidth + operator's tolerance for paste-pattern instrumentation (consent / logging).

### Q3 — Catalog versioning UX — "v3 pinned, v4 available" surface

**Opus framing:** Schema supports version-pin; UX for catalog drift after pinning lands does not exist.

**Options:**
- **(A) Passive surface (no banner)** — operator Base Sheet stays pinned to v3 silently; operator must manually check for catalog updates.
- **(B) Diff banner per Base Sheet** — when an operator opens a Base Sheet pinned to v3 and catalog is at v4, banner surfaces "v4 available — review diff to upgrade."
- **(C) Diff banner + auto-upgrade option for non-substantive changes** — auto-apply patch-level catalog updates (notes / additional synonyms); operator-approve minor + major.
- **(D) Full audit log of catalog mutations + per-ingredient version pinning** (per `[[runtime-reframe-hybrid-architecture]]` full pinning option) — heavyweight; V2+ work.

**CC perspective:** Option (B) at MVP. Operator-visible drift signal without auto-apply complexity. Option (C) post-MVP refinement.

**Strategic input needed:** Co-founder + Opus view on how aggressive the drift signal should be — quiet or insistent?

### Q4 — Vendor integration schema — catalog Layer 4 platform-side ↔ Packet Layer 4 operator-side

**Opus framing:** Catalog records who could theoretically supply; Packet records operator's actual vendor relationship. Integration point at formulation time is the load-bearing question.

**Options:**
- **(A) FK from Packet's operator-side vendor record → catalog supplier name** (string-keyed reference) — minimal schema; operator can attach a `VendorRelationship` to any catalog supplier-name string.
- **(B) Catalog suppliers become structured entities operator inherits** — each supplier in `IndustrialIngredient.suppliers[]` becomes a `SupplierInfo` reference; operator's `VendorRelationship` is a per-operator extension of `SupplierInfo`.
- **(C) Operator brings whole vendor record** (not constrained to catalog suppliers) — operator can record a vendor not in the platform list; that vendor optionally maps back to a catalog supplier-name via fuzzy match or operator-pick.

**CC perspective:** Option (C). Operator authority over vendor relationships per memory #22 — operators may use vendors the platform doesn't know about. Soft mapping to catalog supplier-name is a convenience, not a constraint. **Schema implication:** `VendorRelationship.mapsToCatalogSupplier?: string` (optional FK).

**Strategic input needed:** Co-founder view on operator independence (Option C) vs platform-curated vendor universe (Option B).

### Q5 — Browse/search/filter surface — August Nutraceuticals or Q4?

**Opus framing:** Layer 9 is absent. Decision: ship at August MVP or defer Q4.

**Options:**
- **(A) Ship at August MVP** — minimum filter surface (allergen-free + organic + cert + functional-role + matrix-compat); replaces current Ingredient DB tab. Adds ~1-2 weeks CC.
- **(B) Defer to Q4** — Nutraceuticals operators paste-import; F&B operators get Layer 9 when F&B re-entry begins.
- **(C) Ship a TINY browse/filter at August (allergen-free + organic only) + iterate** — minimum viable filter UI; expand post-launch.

**CC perspective:** Option (A) or (C). Layer 9 absence is the most consequential UX gap surfaced in this investigation. Even minimum filter UI is high-leverage. Option (C) is the safer landing if August timeline is constrained.

**Strategic input needed:** Co-founder + operator view on whether the operator-facing pitch can stand without Layer 9 ("paste your formula" only) or needs Layer 9 from day one ("browse + paste").

### Q6 — Catalog editing UX — operator override or platform change request?

**Opus framing:** When an operator finds a wrong catalog value, what's the path?

**Options:**
- **(A) Operator-side Packet override only** — catalog entry unchanged; operator's formulation uses corrected value with `provenance: 'operator-estimate'`. Platform catalog is read-only to operators.
- **(B) Platform-side change request only** — operator files a change request; platform reviews; if accepted, catalog gets updated (v3→v4) with diff signal to all pinned Base Sheets.
- **(C) Both — operator overrides AND can optionally file change request** — operator's immediate need (override) is met; platform-side improvement (change request) is captured.

**CC perspective:** Option (C). Operator-override path lets operators ship without blocking on platform review; change-request path lets platform improve catalog over time. Schema implication: `Ingredient.foodData.kind: 'operator-override'` variant + `OperatorCatalogChangeRequest` record per Packet.

**Strategic input needed:** Co-founder + operator pricing-tier implications (is change-request feature a free-tier vs paid-tier differentiator?).

### Q7 — Catalog growth model — who adds entries, how, with what validation?

**Opus framing:** ~392 entries today; serious operators will need 10x+. Where do new entries come from?

**Options:**
- **(A) Operator upload + co-founder review pipeline** — operators submit entries; co-founder reviews + accepts into catalog; validator gate at acceptance.
- **(B) F3 Tier 1 ingestion only** — catalog grows via agentic scraping of supplier sites + co-founder review of ingest output.
- **(C) Hybrid — F3 Tier 1 for breadth (Tier-B commodity), operator submission + co-founder review for depth (Tier-A pharma + branded forms)** — different sources for different tiers.
- **(D) Multi-tenant catalog (operator-private + platform-public)** — operators build their own private catalog; platform catalog is the shared public layer.

**CC perspective:** Option (C). Honest split — agentic scraping is good at breadth (the long-tail commodity entries); operator + co-founder curation is good at depth (the branded forms operators want). Option (D) is V2+ work — premature optimization at MVP.

**Strategic input needed:** Co-founder bandwidth + commercial model (does multi-tenant private catalog become a pricing-tier differentiator?).

### Q8 (new) — Layer 9 sequencing relative to Layer 5 structuring

**Framing:** Layer 9 (browse/search) requires Layer 5 (functional context) to be structured. Today Layer 5 is partial-structured (`functionalRole`, `matrixCompatibility` schemas exist) and partial-prose (processing notes, storage conditions, form factor lives in `notes`). Browse-by-functional-role needs population; browse-by-processing-notes needs structuring first.

**Options:**
- **(A) Ship Layer 9 with structured fields only** (functional-role + matrix-compat + allergen + cert) — accept gaps for prose-only fields.
- **(B) Structure Layer 5 fully before Layer 9 ships** — adds ~1 week structuring work; Layer 9 ships when both ready.
- **(C) Defer Layer 9 to Q4** — same as Q5(B).

**CC perspective:** Option (A). Layer 9 with the structured fields already present has high signal; processing/storage notes can stay in `notes` until operator demand surfaces structured filter need.

**Strategic input needed:** Locked by Q5 decision.

### Q9 (new) — Mode + Product-Class as first-class Layer 11

**Framing:** Today mode + product-class routing is implicit in code (`lib/modes.ts` + `ProductClass` enum). Architecturally promoting to first-class Layer 11 informs the mode toggle decision (Q9 in Packet memo) + cross-mode discovery question.

**Options:**
- **(A) Keep implicit; tactical refactors as needed.**
- **(B) Promote to first-class layer in code + docs; refactor `MODES` registry to consume from `lib/data/*` with explicit product-class metadata.**
- **(C) Promote in docs only; refactor when Layer 9 lands.**

**CC perspective:** Option (C). Architectural framing in docs (this memo + Packet memo Q9 mode toggle discussion); refactor only when Layer 9 forces a cross-mode catalog discovery question.

**Strategic input needed:** Opus view on whether catalog architecture should reflect product-class explicitly (vs being a mode-level concern).

### Q10 (new) — Layer 4 platform-side suppliers ↔ Packet Layer 4 operator-side schema seam

**Framing:** Q4 above covers the integration point at formulation time. Q10 covers the schema seam: do platform-side suppliers (in `lib/data/suppliers.ts`) become `SupplierInfo` records that operator's `VendorRelationship` extends? Or are they separate-and-mapped?

**Options:**
- **(A) Platform `SupplierInfo` records become the canonical supplier entities; operator's `VendorRelationship` extends with account #, MOQ, contract ref.**
- **(B) Platform suppliers stay as string-array references; operator's `VendorRelationship` is fully independent with optional FK back to a catalog supplier name.**
- **(C) Two-tier — platform-curated `SupplierInfo` for major suppliers (~50 names) + operator-supplied free-form vendor records.**

**CC perspective:** Option (C). Mirrors the Tier-A pharma vs Tier-B commodity split; platform-curated for the names the platform tracks; operator-supplied for the long tail.

**Strategic input needed:** Schema decision must land before save backend ships (per U1 in §8).

### Q11 (new) — Layer 5 functional-context structuring sequence

**Framing:** Layer 5 split (5a dosing / 5b operational) is partial-structured today. Strategic question: do operational fields (heat-sensitive / light-sensitive / hygroscopic / storage conditions / form factor) get structured pre-launch or wait?

**Options:**
- **(A) Structure all operational fields pre-launch** — adds ~3-5 days work; unlocks Layer 9 filter for these dimensions.
- **(B) Structure on-demand as operator workflows surface need** — keep in prose `notes` for now.
- **(C) Structure a minimal subset** (heat-sensitive boolean + light-sensitive boolean + form factor enum) — partial structuring; defer the rest.

**CC perspective:** Option (C). The boolean + enum subset is high-leverage for label / processing decisions; the full operational schema can wait until operator demand quantifies value.

**Strategic input needed:** Locked by Q8 decision (Layer 9 sequencing).

---

## §10 — Recommended sequencing

Respects: (a) August Nutraceuticals deadline, (b) MVP foundation step-order locked at `[[catalog-must-be-coa-spec-sheet-anchored]]`, (c) Packet memo routing dependencies, (d) operator bandwidth.

**Pre-routing (CC-autonomous work that can proceed without strategic session):**

- Catalog enrichment continued — addedSugars + FALCPA species notation + FALCPA exemption (per memory `[[regulatory-classification-vs-supplier-data]]` CC-autonomous discipline)
- Duplicate-SKU cleanup based on May 20 baseline — survivor selection per evidence rules (mechanical work; no per-entry judgment beyond rules)
- Validator coverage extension — Provenance + Sourced<T> per-field validator gate (extends M4/M24)
- `lib/supabase.ts` stale stub cleanup
- Notes-prose audit (memory `[[project_notes_prose_audit_owed]]` — borderline-marketing token sweep)
- §II.9a R2/R3 sweep (memory `[[project_ii_9a_r2_r3_sweep_owed]]`)

**Phase 1 — post-routing-session (~Weeks 1-2 of strategic-session-clear):**

1. Schema work locked per Q1 + Q4 + Q6 + Q10 routing — `IngredientSourceData` operator-override variant, `VendorRelationship` schema, `OperatorCatalogChangeRequest` schema
2. Save backend (launch-blocker #4) per Packet memo §4.3 — Supabase + RLS
3. Catalog version-tag infrastructure — monotonic increment + version-pin variant constructable

**Phase 2 — Spec sheet ingestion foundation (~Weeks 2-4):**

4. Spec sheet attachment UI per MVP foundation step 1
5. Provenance population per catalog audit pass (MVP foundation step 4)
6. F3 Tier 1 agentic ingestion pipeline per Q1 routing (parallel or sequential with above)

**Phase 3 — Render + version-locking (~Weeks 4-5):**

7. Per-version snapshot of generated regulatory deliverables — world-class allergen #4 first, then NFP / SFP / framework determinations per Packet memo §4.4
8. CatalogSnapshotRef drift UX per Q3 routing
9. Provenance pill primitive landing per Q-DS-2 routing + design memo §3.2

**Phase 4 — Layer 9 if sequenced for August (~Weeks 5-6, IF Q5(A) or Q5(C) routes):**

10. Minimum browse / search / filter surface (allergen-free + organic + cert + functional-role + matrix-compat) per Q5 + Q8 routing
11. Layer 5b operational structuring per Q11 (minimal subset)

**Phase 5 — operator-input + Packet UI (Weeks 6+):**

12. OperatorProfile schema + minimum capture UI per Packet memo §4.4b
13. PA correspondence schema + upload per Packet memo §3 launch-critical #9
14. Packet library UI replacing Saved tab per Packet memo §4.5
15. Structured packaging schema per Packet memo §3 launch-critical #10

**Constraint check:** Phase 1 work is gated by routing-session clearance. Phase 2-5 layered. No work in Phase 1-5 requires Packet memo Q1–Q9 to be NOT-routed; everything respects the dependency.

---

## Bugs noted (do not fix; surface only)

(Investigative pass uncovered no new bugs beyond what's already in memory + audit artifacts.)

- **Stale memory line numbers in `[[project_supplements_two_wave_ingestion]]`** — system-reminder caution at file read; not a code bug but worth refresh.
- **`lib/supabase.ts` stale "not installed" comment** — packages ARE installed; comment misleading. Packet memo §1.10 flags cleanup ticket.
- **`AssumeAtCreation:productClass` drift surface** — type marks optional for migration; UI enforces required-at-creation. Not a bug; documented in `types/index.ts:283`. If UI enforcement ever lapses, surface migrates to bug.
- **Delta audit referenced in scope (`docs/audits/duplicate-sku-sweep-delta-2026-05-25.md`) doesn't exist on this branch.** Surfaced as a discrepancy; this investigation proceeded against May 20 baseline + recent commits.
- **`investigation/catalog-architecture-2026-05-25` branch creation blocked by tool harness.** Memo lands on current worktree branch; operator can route the branch + PR creation manually.

---

## Cross-References

**Companion strategic-session memos:**
- `docs/agents/product-packet-architecture-2026-05-25.md` — Packet architecture (Q1–Q9 routing)
- `docs/agents/design-system-2026-05-25.md` — 5-category encoding (Q-DS-1, Q-DS-2 routing)

**Foundational doctrine memory:**
- `[[catalog-must-be-coa-spec-sheet-anchored]]` — provenance + MVP foundation 5-step
- `[[regulatory-classification-vs-supplier-data]]` — uniform vs variable data split
- `[[harm-critical-floor]]` — UNDOCUMENTED defaults
- `[[honest-estimate-reframe]]` — confidence taxonomy
- `[[three-class-value-taxonomy]]` — rendering primitives
- `[[joy-of-mastery-brand-philosophy]]` — voice + aesthetic stance
- `[[platform-scope-vs-facility-food-safety-plan]]` — scope discipline

**Catalog architecture memory:**
- `[[project_supplements_two_wave_ingestion]]` — Tier-A pharma / Tier-B commodity seam
- `[[project_choline_gap_critical]]` — cross-category split case
- `[[project_prebiotic_misfile]]` — category-taxonomy work
- `[[project_spec_system_multi_product_class]]` — per-product-class spec metrics
- `[[project_catalog_duplicate_sku_audit_ticket]]` — May 20 sweep ticket (SUPERSEDED by `docs/audits/duplicate-sku-sweep.md`)

**Engineering brief:**
- `docs/agents/f3-tier-1-supplier-spec-scraping-engineering-brief-2026-05-23.md` — Layer 2 agentic ingestion plan

**Audit baselines:**
- `docs/audits/duplicate-sku-sweep.md` — May 20 baseline (~25 confirmed pairs + 5 cross-category splits)
- `docs/audits/rulebook-vs-types-drift.md` — Q-Sh resolutions
- `docs/audits/catalog-inventory-2026-05-07.md` + `docs/audits/catalog-gap-analysis-2026-05-07.md`

**Rulebook + Validator:**
- `docs/architecture/catalog-authoring-rulebook.md` — governance for catalog changes
- `.claude/agents/catalog-entry-validator.md` — v1 subagent
- `[[feedback_38a_unscoped_grep]]`, `[[feedback_validator_gap_1_self_check]]`, `[[feedback_spec_vs_type_system_prerequisite]]` — validator discipline

**Commits referenced:**
- `a20028c` — Provenance schema groundwork
- `99fee80` — Base Sheet schema lock
- `b00c23d` — Batch Sheet schema extension
- `b654f49` — FALCPA species naming + Mollusks + export gate
- `e9d19bf` + `11472af` — FALCPA §203(b)(2) exemption Phase 1+2
- `fe925de` + `9214abf` — Added Sugars schema + per-entry population
- `7fa3e5e` — Pre-commit gate hook
- `0b77512` — Wave 1.5e synonym-layer harm-critical fix
- `c93b78d` — BS/BS shorthand rename across scoping memos (most recent commit at time of writing)
