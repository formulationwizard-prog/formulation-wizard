# Current-State Capability Inventory — 2026-05-25

Read-only inventory snapshot. Answers "what does the codebase actually do TODAY?" for the strategic session input pack. Not forward-looking — wishes, plans, and "will support X" framings live in the scoping memos and roadmap docs, NOT here.

**Posture:** every claim cites file:line. Where a capability is absent, the search that confirmed absence is named.

---

## Ground-state check findings (2026-05-25 verification pass)

Per `[[verify-ground-state-at-start-of-autonomous-session]]`, four checks ran before authoring:

1. **Branch state.** Worktree branch is `worktree-agent-ac09b12878ccea882`; target branch `inventory/current-capability-2026-05-25` does not exist; no prior `*capability*` doc in `docs/agents/`.
2. **Input-pack references.** Task prompt names two input docs that do NOT exist on disk: `docs/agents/catalog-architecture-investigation-2026-05-25.md` and `docs/agents/strategic-session-orientation-2026-05-25.md`. Both `Glob` searches return zero matches. §6 below substitutes a code-direct catalog layer summary in place of "summarize from the missing investigation memo."
3. **CFR Watcher.** Initial assumption (informed by `Glob` of `scripts/**/*.ts` and `*.js`) was that the watcher was absent. Re-search with `Grep` for the keyword surfaced `scripts/cfr-watch/*.mjs` — the watcher IS present (.mjs extension only). Recorded under §7.
4. **Dirty file state.** `.claude/settings.local.json` has uncommitted CRLF whitespace; left untouched (outside scope).

---

## §1 — Workspaces enumerated

Source: `lib/modes.ts:91-200`.

| Mode ID | Display name | Active in switcher? | LabelMode | Catalog file | Status |
|---|---|---|---|---|---|
| `fb` | Food and Beverage | YES (`MODE_ORDER`, modes.ts:200) | `'fda'` | `lib/data/ingredients.ts` (654 entries) | shipped |
| `supplements` | Nutraceuticals | YES (`MODE_ORDER`, modes.ts:200) | `'supplement-facts'` | `lib/data/supplements.ts` (402 entries) | shipped |
| `baking` | Baking & Pastry | NO — defined but not in `MODE_ORDER` | `'bakers'` | `lib/data/baking.ts` | deferred (data layer intact, off the switcher) |
| `catering` | Catering / Foodservice | NO | `'catering'` | `lib/data/catering.ts` | deferred |
| `feeds` | Animal Feeds | NO | `'aafco'` | `lib/data/feeds.ts` | deferred |
| `sausage` | Sausage & Charcuterie | NO | `'usda-fsis'` | `lib/data/sausage.ts` | deferred |

Switcher comment at `lib/modes.ts:199` documents the discipline: deferred modes' full data layer is preserved (ingredient libraries, process templates, HACCP categories, regulatory limits, packaging). Re-enabling a deferred mode is one-line: add its `ModeId` back to `MODE_ORDER`. No mode requires unimplemented infrastructure to re-activate.

The `productClassesForMode()` helper (modes.ts:221) gates compliance routing: supplements mode returns `['supplement']` only; all other modes return the seven F&B-class enumeration (acidified-food / beverage / cured-meat / bacon / baked-good / fresh-produce / general).

---

## §2 — Major UI surfaces

Source: `app/workspace/page.tsx` (~10,500 lines, tab list at lines 1739-1749).

| Tab | activeTab value | Render block | Implementation maturity |
|---|---|---|---|
| Home / Dashboard | `'home'` | page.tsx:2381+ | shipped — formula stats, recent formulas, status counts, command-palette entry surface |
| Build Base Sheet | `'build'` | page.tsx:3320+ | shipped — primary workspace, bulk-paste, recalc, capsule mode, FALCPA exemption, SFP/NFP preview |
| Cost Tool | `'cost'` | page.tsx:8460+ | shipped — full per-ingredient cost rollup, freight model, COGS, margin math, per-unit allocation |
| Sourcing | `'sourcing'` | page.tsx:8952+ | shipped — Suppliers-by-ingredient view + Qualifications tracker subview (localStorage persistence at `lib/supplierQualifications.ts:91-104`) |
| Batch Sheet | `'batch'` | page.tsx:9410+ | **partial** — render-only print-to-PDF; PREVIEW banner at page.tsx:9420; no capture persistence; `BatchSheet` type landed (types/index.ts:1384-1455) but no UI consumer (Grep for `BatchSheet` in workspace returns only `batchSheetTemplate` string field) |
| Filing | `'filing'` | page.tsx:9805+ | shipped — filing-requirement determination + print-to-PDF |
| Process Authorities | `'authorities'` | page.tsx:10082+ | shipped — directory + filters (state / type / search) backed by `lib/data/processAuthorities.ts` |
| Services | `'services'` | page.tsx:10205+ | shipped — intake forms with mailto handoff (4 service cards: bench / reformulation / scale-up / co-packer) |
| Saved Formulas | `'saved'` | page.tsx:2843+ | **partial** — UI shipped (cards + compare-selection + diff); **persistence broken** (see §9) |
| Ingredient Library | `'database'` | page.tsx:2793+ | shipped — search + category filter + add-to-build |

A command-palette (Ctrl+K) navigates all of the above plus jumps to ingredients/suppliers (page.tsx:1736-1820).

---

## §3 — Regulatory engines

Each engine is a `lib/*.ts` module with the citation in its docblock. "Wired" = consumed by `app/workspace/page.tsx`; "advisory" = referenced but no refusal-bearing gate fires in the UI.

| Engine | Module | Citation | UI wire-up |
|---|---|---|---|
| FALCPA species-naming detector | `lib/supplementAllergen.ts:314 detectAllergensDetailed`, `:585 generateContainsStatement` | 21 CFR 101.36(b)(1)(i)(B); FALCPA + FASTER Act (allergen.ts:201) | **Wired** — page.tsx:768 detector call; page.tsx:1294 `evaluateAllergenGate` call |
| FALCPA gate (§B1) | `lib/supplementAllergen.ts:636 evaluateAllergenGate`; const `B1_ALLERGEN_ITEM_ID = 'b1-allergen-species-naming'` | 21 U.S.C. §343(w); FASTER Act | **Wired** — page.tsx:1294 |
| FALCPA highly-refined-oil exemption | `types/index.ts:992 falcpaExemptionStatus` field (`'exempt' / 'operator-decision' / 'not-exempt'`); recalc skip at page.tsx:756-758 | FALCPA §203(b)(2); FDA Q&A on highly-refined oils | **Wired catalog-side** for "exempt" auto-strip; "operator-decision" stays declared-by-default with no per-formulation override UI yet (page.tsx:752 comment "until UI surfaces the choice") |
| FDA rounding (NFP) | `lib/utils.ts:165-249` (fdaRoundCalories / Fat / Cholesterol / Sodium / Grams / Calcium / Potassium / VitaminD / Iron / PercentDV*) | 21 CFR 101.9 rounding rules | **Wired** — consumed in NFP/SFP rendering |
| Added Sugars classification | `types/index.ts:65-83 addedSugars` field; population doctrine at `lib/data/ingredients.ts:16-25` | 21 CFR 101.9(c)(6)(iii) (mandatory NFP sub-line) | **Wired catalog-side** for refined sweeteners (sucrose=100, HFCS=77, maple=60, etc.); render-side per 21 CFR 101.9 declaration unverified by this inventory; doctrine treats pre-population field as 0 |
| NDI compliance classifier | `lib/supplementNDI.ts:131 NDI_TABLE`, `:298 classifyIngredientNDI`, `:354 analyzeNDI` | 21 CFR 190 / DSHEA §413 | **Wired** — page.tsx:1122 `analyzeNDI` call |
| DSHEA / structure-function claims | `lib/supplementClaims.ts:96 STRUCTURE_FUNCTION_LIBRARY`, `:368 detectStructureFunctionClaims`, `:633 buildDisclaimers` | 21 CFR 101.93 (S/F claim regulation); DSHEA §6 | **Wired** — page.tsx:5845, 6462 |
| Disease-claim gate (§B2) | `lib/supplementClaims.ts:436 analyzeDraftClaim`, `:569 evaluateDiseaseClaimGate`; `B2_DISEASE_CLAIM_ITEM_ID` | 21 CFR 101.93(g) hard-stop | **Advisory only** — `analyzeDraftClaim` is consumed at page.tsx:3345, 6463 (flag count, dim badge); `evaluateDiseaseClaimGate` (the gate-shaped function) is NOT called in workspace (Grep returns zero matches in `app/`) |
| Harm-critical floor doctrine | `lib/supplementHarmCritical.ts` (4 exports: allergenProfileDiffers / identityTestRequirementDiffers / regulatoryStatusDiffers / harmCriticalDifferenceExists) | platform doctrine `[[harm-critical-floor]]` | **Wired at catalog-synth boundary** via parseFormula match-confidence path; UI render layer treats empty allergens etc. as UNDOCUMENTED per page.tsx:1294 gate |
| Bucket 1 composition gate (§B11) | `lib/supplementBucket1Gate.ts:283 evaluateSupplementBucket1Gate` | 21 CFR 111 Subpart H | **Not wired in UI** (Grep returns zero `evaluateSupplementBucket1Gate` in `app/`) |
| Identity-test gate (§B3) | `lib/identityTest.ts:263 evaluateIdentityTestGate`; `B3_IDENTITY_TEST_CITATION = '21 CFR 111.75(a)(1)'` | 21 CFR 111.75(a)(1) | **Not wired in UI** — schema for `IdentityTestAttestation` landed (types/index.ts:473-517) but `SavedFormulation.attestations` array is unconsumed (no `attestations` ref in workspace per Grep) |
| Claim-block enforcement (NCC) | `lib/nutritionClaims.ts:267 validateClaim`, `:525 suggestAvailableClaims`; DAILY_VALUES at :38 | 21 CFR 101.13 (nutrient content claims) | **Wired** — page.tsx:6300 |
| Disclaimer (§B4) | `lib/supplementDisclaimer.ts:84-91 SINGULAR + PLURAL constants`, `:106 selectSupplementDisclaimer`; `B4_DISCLAIMER_ITEM_ID` | 21 CFR 101.93(b) "These statements have not been evaluated..." | **Wired** at page.tsx via `buildDisclaimers` |
| Scheduled-process filing | `lib/scheduledProcess.ts:72 determineFilingRequirement`; FormName enum :26-37 (FCE / SID / 2541 / 2541a / 2541d / 2541e / None) | 21 CFR 113 (LACF) / 114 (Acidified) | **Wired** — page.tsx:1163 `determineFilingRequirement` + Filing tab render |
| F&B compliance engine | `lib/regulatoryLimits.ts:119 REGULATORY_LIMITS` (preservative caps, sulfite prohibition, etc.); `:592 checkCompliance`; `:371 ComplianceFinding` | 21 CFR 184, 172, 173, 9 CFR 424.21 (cured-meat nitrite/nitrate) | **Wired** for F&B mode; supplements mode bypasses per `productClassesForMode` (modes.ts:221) |
| Safety limits (UL / banned / interactions) | `lib/supplementSafetyLimits.ts:99 SUPPLEMENT_SAFETY_LIMITS` (UL entries), `:363 BANNED_OR_RESTRICTED`, `:499 INTERACTION_WARNINGS`, `:684 checkSupplementSafety` | IOM/NAM ULs; FDA Final Rule on DMAA + ephedra; clinical interaction literature | **Wired** — page.tsx:1087 `checkSupplementSafety` |
| Filing readiness scorer | `lib/filingReadiness.ts:220 computeFilingReadiness`; per-requirement state machine :30-74 | 21 CFR 114 (v1 fully specified); others placeholder | **Wired** — page.tsx:2150 `computeFilingReadiness` |
| Ingredient statement | `lib/ingredientStatement.ts:156 buildIngredientStatement` | 21 CFR 101.4(a) descending order of predominance | **Wired** — page.tsx:843 |
| PA-review state machine | `lib/reviewState.ts:118 validateTransition`, `:193 appendTransition`, `:332 evaluateReviewStateGate` | platform discipline; `[[pa-review-state-machinery-proposal]]` | **Not wired in UI** — Review[] storage location on `SavedFormulation.reviews` (types/index.ts:297) is declared but never written by `saveFormulation` (page.tsx:1410-1527); workspace contains no review-submission button or PA-approval state UI |

---

## §4 — Computational outputs

What the tool GENERATES from a populated formula today.

| Output | Generator | Citation drive | Catalog data consumed |
|---|---|---|---|
| Supplement Facts panel (SFP) | `lib/supplementLabeling.ts:243 buildSupplementFacts`; DV_TABLE :60 | 21 CFR 101.36; DV per Table 1 | `name`, `qty`, `unit`, `potencyFactor`, `elementalFactor`, sub-ingredient classification |
| Nutrition Facts panel (NFP) | Inline render in page.tsx using `fdaRound*` from `lib/utils.ts` | 21 CFR 101.9 | `nutrition.*` fields per IndustrialIngredient |
| Allergen "Contains:" statement (Format B umbrella+species) | `lib/supplementAllergen.ts:585 generateContainsStatement`; Format-B default flipped 2026-05-25 commit 23aa693 | 21 CFR 101.36(b)(1)(i)(B); FALCPA + FASTER Act | `allergens[]`, `subIngredients[]`, `falcpaExemptionStatus` (page.tsx:756) |
| Ingredient statement (descending weight + sub-ingredient unfolding) | `lib/ingredientStatement.ts:156 buildIngredientStatement` | 21 CFR 101.4(a) | `name`, `qty`, `subIngredients[]` |
| Filing Readiness % | `lib/filingReadiness.ts:220 computeFilingReadiness` | 21 CFR 114 (AF fully specified); LACF / acid-food / shelf-stable-dry / supplement / FSIS placeholder | `FormulationSpecs` (foodScience.ts), filing requirement from scheduledProcess.ts |
| Cost-per-serving / per-package / margin | Inline rollup at page.tsx:8476-8504 | not regulatory | `costPerKg`, `costSource`, `costValidUntil`, packaging.costPerUnit |
| Filing determination | `lib/scheduledProcess.ts:72 determineFilingRequirement` | 21 CFR 113.83 / 114.83 — emits FCE / SID / 2541 / 2541a / 2541d / 2541e / None | Specs (pH, aw, brix), product class, HACCP category |
| Spec coverage / tracked-spec analysis | `lib/trackedSpecs.ts:175 getTrackedSpecDefaults` (pH/aw/brix/moisture/aceticAcid/bostwick/brookfield); F&B-shaped per-product-type sets A/B/C/D/E | per-CFR pathway requirements | `productType` |
| Harm-critical floor check | `lib/supplementHarmCritical.ts:116 harmCriticalDifferenceExists` (allergens / identity-test / regulatoryStatus) | platform doctrine | `allergens[]`, `regulatoryStatus`, identity-test attestations |
| FALCPA exemption determination | catalog-resolved at `IndustrialIngredient.falcpaExemptionStatus` (types/index.ts:992) | FALCPA §203(b)(2) | refining grade documented in catalog entry |
| Disclaimer (FDA evaluation footnote) | `lib/supplementDisclaimer.ts:84-91 SUPPLEMENT_DISCLAIMER_SINGULAR/_PLURAL`; selection :106 | 21 CFR 101.93(b) | claim count via detectStructureFunctionClaims |
| NCC validator | `lib/nutritionClaims.ts:267 validateClaim`; thresholds at DAILY_VALUES :38 + CONTENT_CLAIM_THRESHOLDS in supplementClaims.ts:44 | 21 CFR 101.13 + 101.54 | `nutrition.*` + per-serving math |
| NDI summary | `lib/supplementNDI.ts:354 analyzeNDI` | 21 CFR 190 (NDI notification doctrine) | NDI_TABLE keyword/boundary matching against ingredient names |
| Structure/function claim detection | `lib/supplementClaims.ts:368 detectStructureFunctionClaims`; STRUCTURE_FUNCTION_LIBRARY :96 | 21 CFR 101.93 | ingredient names against curated S/F library |
| Part number / SKU | `lib/partNumber.ts generatePartNumber` (called at page.tsx:1503) | not regulatory; cGMP traceability convenience | mode, save sequence per year |

---

## §5 — Operator workflows supported end-to-end

The advisor / external-developer-trial canonical workflow: **paste formula → identify ingredients → generate NFP/SFP/allergen/regulatory → review filing readiness → export**.

| Segment | Status | Where it lives |
|---|---|---|
| Bulk-paste raw text → parsed ingredient rows | shipped | `lib/parseFormula.ts:717 parsePastedFormula` |
| Multi-format paste (TSV / pipe / markdown table / plain text) | shipped | parseFormula.ts:1-14 docblock |
| Volume → mass conversion via density | shipped | parseFormula.ts:245 lookupDensity + VOLUME_TO_ML :93 |
| Tier-1/2/3/4 match-confidence classification | shipped | parseFormula.ts:478 findBestMatchWithTier; Tier 3 triggers user-confirmation |
| Bulk-paste UI surface | shipped | page.tsx — accessible via Build tab + command palette |
| Synonym resolution | shipped | parseFormula.ts:348 findBySynonym; backfill per Wave 1.5b doctrine |
| Per-ingredient catalog details (NFP/SFP/allergens/regulatory) | shipped | recalculation pipeline page.tsx:744-829 |
| Ingredient Library (search / category / add-to-build) | shipped | Database tab page.tsx:2793+ |
| Recalculate (rollup nutrition + allergen aggregation + FALCPA-exempt stripping) | shipped | page.tsx:744-829 |
| NFP render | shipped | page.tsx inline (FDA-rounded values per `fdaRound*`) |
| SFP render | shipped | page.tsx:5847+ buildSupplementFacts call |
| Allergen `Contains:` render (Format B umbrella+species) | shipped | page.tsx via `generateContainsStatement` |
| Regulatory determination (pH / aw / process method / filing form) | shipped | page.tsx:9805+ Filing tab + determineFilingRequirement |
| Filing readiness % | shipped | page.tsx:2150 computeFilingReadiness |
| Safety findings (UL / banned / interaction) | shipped | page.tsx:1087 checkSupplementSafety |
| NDI scan | shipped | page.tsx:1122 analyzeNDI |
| S/F claim detection | shipped | page.tsx:5845 detectStructureFunctionClaims |
| Disease-claim flag | advisory-only | page.tsx:3345 analyzeDraftClaim — flag count only; no refusal-bearing gate UI |
| Part number assignment | shipped | page.tsx:1503 generatePartNumber |
| Save formulation | **blocked-on persistence** | page.tsx:1410 saveFormulation writes to React state only; lost on reload (see §9) |
| Version snapshot (semantic versioning + reason-for-change prompt) | shipped at write path | page.tsx:1431-1481; persists only as long as state survives |
| Saved-formula Compare / Diff | shipped | page.tsx:3037+ diff selection, :3210+ multi-compare |
| Cost rollup → margin → COGS | shipped | Cost tab page.tsx:8460-8950 |
| Supplier sourcing + filtering | shipped | Sourcing tab page.tsx:8952+ |
| Supplier qualification tracker | shipped | supplierQualifications.ts:91-104 localStorage |
| Process Authority directory + filters | shipped | Authorities tab page.tsx:10082+ |
| Services intake / mailto | shipped | Services tab page.tsx:10205+ |
| Batch Sheet render → print-to-PDF | shipped | Batch tab page.tsx:9410+ — PREVIEW banner; no structured capture |
| Filing draft → print-to-PDF | shipped | Filing tab page.tsx:9805+ |
| Spec sheet / PDS export | **deferred** | no export pipeline ships in current code (Grep for `canExportPDS` returns zero) |
| Label export (PDF / artwork-ready) | partial — print-to-PDF the SFP/NFP block | no dedicated label-artwork export |
| PA-review state transition | **scaffold-only** | reviewState.ts module exists + tested; UI surface does not call appendTransition |
| Identity-test attestation capture | **scaffold-only** | schema present; no UI |

**Cross-reference to external-developer-trial:** the canonical "paste → identify → review → print" loop works end-to-end and produces FDA-rounded NFP/SFP + Format-B allergen statement + filing determination. The save persistence failure is the load-bearing user-visible bug (lost saves across reload).

---

## §6 — Catalog state

NOTE: The task asks to reference `docs/agents/catalog-architecture-investigation-2026-05-25.md` for the 10-layer architecture summary. **That file does not exist on disk** (Glob `docs/agents/*catalog-arch*` → zero matches). The 10-layer reference is unrunnable as stated. Below is a code-direct summary of catalog state, organized by IndustrialIngredient field clusters from `types/index.ts:811-1025`.

| Field cluster | Type-system landing | Catalog population |
|---|---|---|
| Core identity (`name`, `category`, `suppliers`, `subIngredients`, `allergens`, `costPerKg`, `nutrition`, `notes`) | types/index.ts:812-819 | populated across both catalogs |
| `synonyms?` (Wave 1.5a+) | types/index.ts:844 | partially populated; pre-Wave-1.5 entries lack synonyms per backfill commit history |
| Sustainability (`organicAvailable`, `gmoRisk`, `sustainabilityCerts`, `carbonKgCo2ePerKg`, `waterLitersPerKg`, `originCountry`) | types/index.ts:847-862 | sparse — most entries unset |
| `potencyFactor` (active-mass back-compute) | types/index.ts:863-878 | populated on carrier-loaded supplement SKUs (Vit D3 100k IU/g = 0.0025; B12 1%=0.01; etc.) per supplements.ts:19+ |
| Cost provenance (`costSource`, `costValidUntil`) | types/index.ts:880-898 | scarce — most catalog entries default to 'industry-typical' (= ESTIMATED per confidence taxonomy) |
| Functional / nutraceutical (`functionalRole`, `bioactives`, `matrixCompatibility`, `usageRange`, `regulatoryStatus`, `pharmacopeialReference`, `coaTemplateType`, `drugInteractions`) | types/index.ts:900-949 | partially populated on supplements.ts; F&B entries sparse |
| `falcpaExemptionStatus` (Layer 11 per doctrine) | types/index.ts:952-992 | populated on key oil SKUs in ingredients.ts (Soybean Oil RBD=exempt; Coconut Oil RBD=operator-decision; Soy Lecithin=not-exempt; Sesame Oil=operator-decision; etc.) |
| `provenance?: Record<string, Provenance>` (Provenance discriminated union with 9 kinds: supplier-spec / coa / usda-fdc / label-declaration / operator-estimate / computed-from-formula / sibling-inference / internal-source / unknown) | types/index.ts:1024 + Provenance type defined at types/index.ts:1618-1738 | **schema-only** — comment at types/index.ts:1020-1023 explicitly "schema-only field at foundation commit; populated as catalog audit pass + spec sheet attachment UI + F3 Tier 1 agentic ingestion land" |
| `Sourced<T>` wrapper | types/index.ts:1748-1751 | schema-only |

**Catalog sizing:** supplements.ts = 402 entries (`^\s*\{\s*name:` count); ingredients.ts = 654 entries; stacks.ts = 321 brace-leading lines. Six deferred-mode catalogs (baking / catering / feeds / sausage / packaging / processAuthorities) ship populated.

**Catalog tests:** 38 test files under `lib/__tests__/`, including 12+ supplement-specific suites (allergen gate / B12 DV resolution / Bucket 1 gate / disclaimer / disease claim gate / identity test gate / NDI keyword discipline / net-quantity / safety / stacks / Tier-A / Wave-1.5b synonyms / Wave-1.5c Cat 2 / Wave-1.5d lecithin / Wave-1.5e synonym layer collision).

---

## §7 — Validator gates + CFR Watcher

**Catalog Entry Validator** — `.claude/agents/catalog-entry-validator.md` (Claude subagent). Pattern-count `M[0-9]+ |Gap #[0-9]+|H[0-9]+ |J[0-9]+` = 88 hits across the file. Rule-cluster summary from §V (validator file):

- Mechanical checks M1–M24 (citation format, confidenceLevel enum, fdaRound usage on rendered values, regulatoryStatus.US shape, lastReviewedDate + reviewedBy pair, functional-tag evidenceNote, allergensInvestigated/Found flag pair, identity-test enforcement for Probiotics, §III.15 sibling-catalog-mass discipline, etc.)
- Hybrid checks H1–H12 (mechanical sub-check + judgment-escalation trigger)
- Judgment-call checks J1–J9
- Coverage-gap routing-question triggers Gap 1–8

§III.15 (sibling-catalog-mass-discipline rule) + FALCPA species-naming gate + harm-critical floor + duplicate-detection are surfaced via M-rule + Gap# triggers. Validator is invoked manually via `Agent(subagent_type="catalog-entry-validator", ...)` per the pre-commit hook reminder at `.claude/hooks/pre-commit-gate.sh:36-52`.

**Pre-commit hook** — `.claude/hooks/pre-commit-gate.sh` (per Rulebook §VI.29):
- Catalog commits (lib/data/supplements.ts | stacks.ts | supplementLabeling.ts | supplementSafetyLimits.ts | modes.ts) → prints validator reminder to stderr (cannot shell-invoke a Claude subagent)
- Code commits (lib/ | app/ | components/ | types/) → runs `npm test`; exits 2 (blocks commit) on failure
- Docs-only commits → pass through

**CFR Watcher** — `scripts/cfr-watch/cfr-watch.mjs` + `fetchers/ecfr.mjs` + `fetchers/govinfo.mjs` + `differ.mjs` + `reporter.mjs`. Watch list at `cfr-watch-list.json` (5 entries as of 2026-05-25):

| Citation | shortName | Priority | Codebase reference |
|---|---|---|---|
| 21 CFR 101.9 | Nutrition Labeling of Food (NFP) | critical | lib/utils.ts fdaRound* + workspace NFP render |
| 21 CFR 101.36 | Nutrition Labeling of Dietary Supplements (SFP) | critical | lib/utils.ts fdaRound* + workspace SFP render |
| 21 CFR 111.205 | Master Manufacturing Record (MMR) | high | Base Sheet architecture (planned) + PA-review state machinery |
| 21 CFR 111.255 | Batch Production Record (BPR) | high | Batch Sheet architecture (planned) |
| Public Law 108-282 (FALCPA) + 117-11 (FASTER Act) | Big-9 species naming | critical | lib/utils.ts detectAllergens + lib/supplementAllergen.ts detectAllergensDetailed + workspace |

Scheduled via `.github/workflows/cfr-watch.yml` (cron `0 6 * * 0` — Sunday 06:00 UTC). Opens GitHub issues on substantive change via `--github` mode.

**Test coverage** — 38 test files cover the engine layer: allergen gate, allergen detection, FDA rounding, NDI keyword discipline, parse-formula unit preservation, path-A product-class routing, reviewState transitions, scheduled-process supplement-mode, section-2 Tier-A discipline, section-3 regulatory-limits + product-class routing, section-3d Bucket-A gate, section-4 disclaimer, section-5 spec-coverage cascade, section-6 UL-gate cascade, serving model + size, supplement-allergen / B12 DV / Bucket-1 gate / build-disclaimers / disease-claim gate / identity-test gate / net-quantity gate / safety keyword boundaries / stacks / tos, synonym matching, Wave 1.5b–e backfill discipline, workspace-mode hydration. No tests for UI render-layer.

---

## §8 — Schema landed (types/index.ts)

`types/index.ts` is 1753 lines. Key interfaces:

| Interface | Lines | Field count (approx) | Readiness |
|---|---|---|---|
| `Nutrition` | 55-89 | 16 fields incl. `addedSugars` | shipped + consumed |
| `Ingredient` (formula-row shape) | 119-134 | 8 fields | shipped + consumed |
| `IndustrialIngredient` (catalog-row shape) | 811-1025 | ~25 fields incl. provenance | core fields consumed; `provenance`, `falcpaExemptionStatus`, several functional fields populated sparsely |
| `SavedFormulation` | 239-308 + extensions :1462-1511 | 22 fields incl. `reviews?`, `attestations?`, `catalogSnapshot`, `finishedProductDensity`, `batchSheetTemplate`, `baseBatchSizeG`, `partNumber`, `productClass` | core consumed; `reviews`, `attestations` declared but unused in UI (Grep zero matches in app/); `catalogSnapshot` defaults to `'legacy-pre-schema-lock'` at every save (page.tsx:1459, 1488) |
| `FormulationVersion` | 210-234 + extensions :1513-1537 | 12 fields | consumed at version-snapshot path; `catalogSnapshot` + `finishedProductDensity` + `baseBatchSizeG` declared, schema-only |
| `BatchSheet` | 1384-1455 | 14 fields incl. `harmCriticalChecks`, `allergenCleaning`, `qaResults`, `signoffs`, `executionRecord`, `ingredientLots` | **scaffold-only** — type lands; no UI consumer; Batch tab renders from `batchSheetTemplate` string only |
| `Provenance` discriminated union | 1618-1738 | 9 variants | schema-only |
| `Sourced<T>` | 1748-1751 | 2 fields | schema-only |
| `Review` (PA-review entity) | 385-419 | 8 fields + 5 transitions schema | scaffold-only (state machine landed + tested; no UI invocation) |
| `ReviewTransition` | 350-373 | 6 fields | scaffold-only |
| `IdentityTestAttestation` | 473-517 | 9 fields | scaffold-only (no operator UI; `attestations` array on SavedFormulation unused) |
| `CatalogSnapshotRef` | 1220-1245 | discriminated union (`'legacy-pre-schema-lock'` / `'version-pin'`) | only `'legacy-pre-schema-lock'` written today; `version-pin` waits on catalog versioning infrastructure |
| `ConcentrationRatio` (FJC vendor-spec) | 1571-1580 | 4 fields | scaffold-only |
| `Confidence` enum + `RangedValue` + `ValueRange` | 32-49 | 5 levels (measured/calculated/estimated/inferred/unknown) | partially consumed in filing-readiness; not surfaced as ConfidencePill in the workspace |
| `ProductClass` enum | 166-203 | 8 classes | shipped + enforced at save (page.tsx:1419-1422 hard refusal) |
| `ReviewState` enum | 336-341 | 5 states | scaffold-only |
| `FunctionalRole` enum | 597-638 | 41 tags | consumed for catalog enrichment; render-side surface present but sparse |
| `SustainabilityCert` enum | 547-578 | 28 certs | consumed in Sourcing tab filters |

---

## §9 — Persistence state

**Survives page reload:**

| Item | Storage key | Source |
|---|---|---|
| Workspace mode preference | localStorage; `lib/workspaceMode.ts:59` `WORKSPACE_MODE_STORAGE_KEY` | lib/workspaceMode.ts:140+ hydrate helpers |
| Per-mode TOS acceptance | localStorage; `lib/supplementTos.ts:84` `fw-tos-supp-v1` | lib/supplementTos.ts |
| Appearance (light/dim/dark) | localStorage `fw-appearance` | page.tsx:524, 534 |
| Batch Sheet execution canvas draft (in-progress) | localStorage `fw_batchSheetTemplate_draft` | page.tsx:485, 492 |
| Supplier qualifications | localStorage `fw-supplier-qualifications-v1` | lib/supplierQualifications.ts:84, 91, 104 |

**Does NOT survive page reload:**

| Item | Reason |
|---|---|
| **Saved formulations** | `savedFormulations` is `useState<SavedFormulation[]>([])` (page.tsx:323) with **no localStorage hydrate/persist effect**. Grep `setSavedFormulations` returns 4 hits, all React state assignments (page.tsx:323, 1478, 1523, 2968). `saveFormulation()` at page.tsx:1410-1527 writes to React state only. Page reload → empty list. |
| **Version snapshots** | Carried in-memory on `SavedFormulation.versions[]`. Lost with parent formulation on reload. |
| **PA reviews** | `reviews?: Review[]` field exists on SavedFormulation (types/index.ts:297) but no code path writes it. |
| **Identity-test attestations** | `attestations?` field exists (types/index.ts:307) but no code path writes it. |
| **Batch Sheet captures** | `BatchSheet` interface exists (types/index.ts:1384) but no UI consumer writes/persists instances. PREVIEW banner at page.tsx:9420 explicitly acknowledges. |
| **Provenance annotations** | `provenance?: Record<string, Provenance>` field exists (types/index.ts:1024) but never written. |

**Supabase scaffold:**
- `lib/supabase.ts:30-65` exports a stub-shaped `supabase` client; the real `@supabase/supabase-js` package is **not installed** (comment at supabase.ts:21-24 acknowledges).
- `supabase/schema.sql` ships with 3 tables (profiles + formulations + supplier_qualifications), RLS enabled per-row, owner_id scoping, JSONB `data` column for formulation payload.
- `isSupabaseConfigured` flag at supabase.ts:45 toggles cloud vs local-only mode — currently always `false` in any environment without `NEXT_PUBLIC_SUPABASE_URL` + `_ANON_KEY` env vars set.
- No `lib/supabase.ts` consumer in workspace today (Grep `import { supabase }` returns zero matches in `app/`).

**Launch-blocker #4 (per `[[save-auth-launch-blocking]]`) = wiring Supabase formulations + profiles tables + auth flow into `setSavedFormulations` + initial-load hydrate.**

---

## §10 — Out-of-scope (explicit list — what the tool does NOT do today)

Verified via Grep / read against actual code state. Each bullet names the search that confirmed absence.

- **Bulk ingredient catalog upload** — no CSV/Excel ingest UI; ingredients added one-paste-at-a-time per Build tab. (Grep `csv|xlsx|upload` in app/ → no ingestion path.)
- **Browse / search / filter UI for Saved Formulas beyond Saved tab list** — no global formula search outside command-palette (Ctrl+K) hits at page.tsx:1784.
- **Vendor / supplier relationship management beyond the directory + qualifications tracker** — no contact log, no quote history, no contract storage. Supplier registry is read-only catalog data at `lib/data/suppliers.ts`.
- **PA-review packet curation / submission workflow** — no UI surface generates a submission packet, no upload-to-PA flow, no PA-side review interface. `evaluateReviewStateGate` exists in lib but no consumer in app/ (Grep zero matches).
- **Identity-test attestation operator UI** — no attestation entry form (Grep `attestations` in `app/workspace/page.tsx` → zero matches).
- **Persistence layer for Batch Sheet captures** — no consumer of the `BatchSheet` type in workspace (Grep returns only `batchSheetTemplate` string field).
- **Spec sheet / PDS export pipeline** — no `canExportPDS` or equivalent emission gate in code (Grep zero matches).
- **Label artwork export (PDF / press-ready)** — print-to-PDF on the workspace HTML is the only "export"; no artwork-targeted export.
- **Multi-user / team / sharing** — no auth state machine consumes shared formulations (Supabase RLS scaffolded but client not wired).
- **In-app authentication beyond TOS gate** — `app/login/page.tsx` exists per Glob but no auth state hooks into Supabase (Supabase package not installed).
- **Acidified-foods pH predictor** — roadmap doc at `docs/roadmap/acidified-foods-ph-predictor.md` describes Phase F4-A/B/C; no predictor code lands today. Filing readiness for AF treats specs as inputs only.
- **F3 Tier 1 supplier-spec scraping / agentic catalog ingestion** — engineering brief at `docs/agents/f3-tier-1-supplier-spec-scraping-engineering-brief-2026-05-23.md`; no scraper code in `scripts/`.
- **Catalog versioning infrastructure** — `CatalogSnapshotRef` discriminated union includes `'version-pin'` variant but every save writes `'legacy-pre-schema-lock'` (page.tsx:1459, 1488).
- **Hold / Release Batch Sheet workflow with `qa_hold` auto-transition** — `BatchStatus` enum exists (types/index.ts:1274) but no UI workflow drives state transitions.
- **Operator profile / OperatorProfile capture (Packet Tier 1 per Packet memo)** — `profiles` table exists in supabase/schema.sql but no client-side capture surface.
- **PA pilot operator-side workflow** — distinct from PA Directory (Authorities tab is read-only listings); no PA-account / PA-inbox / PA-comments UI.
- **Multi-product-class spec expansion** — `lib/trackedSpecs.ts:25` is F&B-shaped (pH/aw/brix/moisture/aceticAcid/bostwick/brookfield); supplements spec system (capsule hardness, friability, disintegration, peroxide value, CFU through expiry) not present.
- **Density input for serving-size volume conversion at the save layer** — `finishedProductDensity?: number | null` field is declared on SavedFormulation (types/index.ts:1469) but the per-formulation density-capture UI doesn't surface a required prompt when servingUnit is volumetric. (Per `[[density-input-servings-calc]]` and `[[serving-size-volume-parens-directive]]` — UI/render layer enforcement is pending.)

---

## §11 — Bugs / gaps surfaced during inventory

Not a fix list — surface notes only. Strategic-session decides routing.

1. **Saved-formulations persistence missing.** `useState` only, no localStorage/Supabase. Acknowledged as launch-blocker #4. (page.tsx:323 + saveFormulation at :1410-1527.)

2. **`evaluateReviewStateGate`, `evaluateIdentityTestGate`, `evaluateDiseaseClaimGate`, `evaluateSupplementBucket1Gate` are scaffold-shipped + tested but NOT wired into UI consumers.** The library is ready; the workspace doesn't call the gate-shaped functions. Of the 4, only `evaluateAllergenGate` is wired (page.tsx:1294). The non-gate detector siblings (`analyzeDraftClaim`, `detectStructureFunctionClaims`, `analyzeNDI`, `checkSupplementSafety`) ARE wired and produce advisory output. The refusal-bearing gate-shape is built but unused.

3. **`BatchSheet` type lands without a UI consumer.** Schema at types/index.ts:1384-1455 is rich (harm-critical-check capture, allergen-cleaning verification, QA results, signoffs); Batch tab renders from `batchSheetTemplate` string only. PREVIEW banner at page.tsx:9420 acknowledges schema/UI mismatch.

4. **`Provenance` schema landed without per-field annotation pass.** Every catalog value renders without provenance metadata; the foundational doctrine (`[[catalog-must-be-coa-spec-sheet-anchored]]`) is articulated but the data layer remains LLM-typed. Schema is ready; the audit pass to populate it isn't run.

5. **`CatalogSnapshotRef = 'version-pin'` variant is unreachable from the save path.** Every saveFormulation call writes `{ kind: 'legacy-pre-schema-lock' }` (page.tsx:1459, 1488). Catalog versioning infrastructure (per-data-file version tags + monotonic increment) doesn't ship.

6. **`addedSugars` field defined and populated for refined sweeteners** (ingredients.ts:16-49 doctrine + 16+ refined-sweetener entries populated 2026-05-25) **but the NFP render-side declaration line ("Includes Xg Added Sugars") is unverified by this inventory.** The catalog input is correct; the workspace output verification is downstream.

7. **`falcpaExemptionStatus = 'operator-decision'` has no per-formulation override UI yet.** Catalog-side default-declare is correct; operator can't toggle the conservative-declare-or-strip choice per-formulation (page.tsx:752 comment acknowledges).

8. **In-flight today (2026-05-25, not yet committed):**
   - `c58c02a` (matcher head-token length-diff guard)
   - `ecd1aab` (Anchovies (Paste) catalog entry)
   - `c81cdc0` (capsule diagnostic dedup)
   - `f04ab08` (Format B regression — "Contains: ... and undefined" leak)
   - `df4b6b5` (SFP Servings Per Container "0" fix + Batch Sheet allergen copy)
   - `23aa693` (Format B umbrella+species default flip + SFP/NFP white-bg label preview fix)
   - Branch `fix/anchovies-paste-catalog-entry-2026-05-25` per task context — not the branch this inventory is being authored on.

9. **F&B sub-mode catalogs (`baking`, `catering`, `feeds`, `sausage`) ship fully populated but are not in `MODE_ORDER`** (modes.ts:200). They aren't "missing" — they're deferred via a one-line array. Re-enabling requires zero code outside `MODE_ORDER`.

10. **`MOLLUSKS` allergen category exists in the union** (supplementAllergen.ts:75) **but is advisory-only** (regulatoryTier `'international-additional'`); not part of FALCPA Big-9 hard-stop. Jurisdiction-selector to elevate when customer indicates CA/EU/AUS-NZ market scope is deferred per allergen.ts:90-95.

11. **Supabase client is a stub.** `lib/supabase.ts:30-64` returns a no-op auth stub; the real `@supabase/supabase-js` package is uninstalled per the comment at supabase.ts:21-24. `isSupabaseConfigured` is `false` in any environment without env-vars set. Server-side schema (supabase/schema.sql) is fully written + RLS-enabled and ready to deploy; client wire-up is the gap.

12. **Test coverage is engine-layer, not UI-layer.** 38 test files cover library functions (allergen detection, FDA rounding, scheduled-process determination, supplement gates, etc.). Workspace UI render correctness has no automated coverage — the Anchovies / Format B / capsule-dedup catches happened via operator manual verification, not test failure.

---

## Most-load-bearing findings for strategic session

- **The biggest gap between codebase state and operator mental model is persistence.** Operators interact with the workspace expecting "save" to mean "this exists tomorrow." Today the code writes to React state and loses everything on reload. The schema for what to persist (`SavedFormulation` + version snapshots + reviews + attestations + provenance + Batch Sheets) is fully landed; the Supabase schema is fully landed; the wire-up between them is the gap.
- **Multiple regulatory engines ship as gates (refusal-bearing functions exported with `evaluate*Gate` naming) but aren't called from the UI.** The library is more rigorous than the workspace consumes. Wiring is needed for: ReviewStateGate, IdentityTestGate, DiseaseClaimGate, SupplementBucket1Gate. The detector siblings (`analyzeDraftClaim`, `detectStructureFunctionClaims`) ARE wired — but as advisory, not refusal-bearing.
- **`BatchSheet` + `Provenance` + `Review` + `IdentityTestAttestation` represent rich operator-grade schema that has landed without consumer wiring.** Each is independently a Track A item.
- **Catalog enrichment foundation (`provenance: Record<string, Provenance>`) is present in the type system but never written.** Foundational doctrine `[[catalog-must-be-coa-spec-sheet-anchored]]` articulates the work; the schema accepts the work; the catalog audit pass to populate it hasn't run.
- **Tab roster is wide: 10 tabs ship.** Home + Build + Cost + Sourcing + Batch + Filing + Authorities + Services + Saved + Ingredient Library. The Build → Cost → Filing → Print loop is the canonical advisor demo path and it works end-to-end on a single session — what doesn't work is the next-session continuity.
