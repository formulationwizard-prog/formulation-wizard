# Catalog Authoring Rulebook

**Status:** Living constitution for `lib/data/supplements.ts` and adjacent catalog data layers.
**Authority:** Governs Claude's authoring proposals + the human operator's accept/reject calls.
**Established:** 2026-05-17 (Round 11 Phase 3 post-A.5; born from operator-side Test 1–4 verification surfacing 7 catalog gaps, 4 code bugs, 1 UX gap in one session).
**Audience:** Claude (catalog-authoring agent) primary; human operator (Wizard) secondary; downstream regulatory inspectors tertiary.
**Review cadence:** Quarterly. Drift-watch trigger: any new catalog category, any new harm-critical field, any FDA enforcement action on an ingredient class we carry.

---

## How to use this document

When you (Claude) propose a catalog entry, edit, or category change, **every rule below applies**. When a rule conflicts with another, follow the precedence ladder in §I.7. When you can't satisfy a rule, **stop and surface the gap** to the operator — don't paper over it with an estimate.

When the human operator gives a directive that would violate a rule, **push back with the rule cited** and propose a compliant alternative. The discipline note: directives are not absolute commands; they're inputs the rulebook gates [[feedback_bidirectional_verification]].

---

# Part I — Foundations

## 1. Mission & Non-Goals

### Mission
Be the single source of truth for dietary-supplement ingredient data backing the Formulation Wizard workspace. Every per-ingredient claim the workspace makes downstream — Supplement Facts Panel rendering, Safety / UL gate, Stability projection, NDI compliance, Cost rollup, Compatibility findings, Claims validator, Retail Fit, Producibility — pulls from this catalog. The catalog's correctness is the product's correctness.

### Non-Goals
- **Not a regulatory determination engine.** The catalog encodes what's known; the determination engine + qualified PA reviewer make the legal call.
- **Not a clinical evidence library.** We cite primary sources; we don't reproduce monographs. The bar is "enough to make defensible workspace decisions," not "exhaustive clinical review."
- **Not a supplier directory.** Supplier names appear on SKU-specific entries; we don't endorse, rank, or recommend.
- **Not a marketing claim library.** Functional-role tags are dosage-substantiated [[feedback_dosage_substantiation_rule]], not aspirational.
- **Not a recipe book.** Stacks are predictability patterns (§VII), not formulation recommendations to operators.

## 2. Authorities & Citation Hierarchy

Every load-bearing field on every entry must be traceable to a citation. The authority hierarchy resolves disputes:

| Tier | Authority | Examples | Used for |
|---|---|---|---|
| 1 | **US Federal regulation** | 21 CFR 111 (cGMP), 21 CFR 101.36 (Supplement Facts), DSHEA §403(r)(6), FDA NDI database, FDA Import Alerts | Regulatory status, label requirements, banned/restricted, NDI |
| 2 | **US Federal scientific authority** | IOM/NAM Dietary Reference Intakes (DRI), FDA Daily Value (DV) Tables, NIH ODS factsheets, USP Dietary Supplements Compendium (DSC) monographs | UL values, RDA/AI, identity testing, purity specs |
| 3 | **International authority** | EFSA opinions, WHO/JECFA, ICH Q1A (stability), Codex Alimentarius | Stability projections, cross-jurisdiction reference |
| 4 | **Independent third-party** | NSF International, USP Verified, Informed Sport, GOED (Omega-3) | Quality certification thresholds, oxidation limits, athlete-safe ingredients |
| 5 | **Peer-reviewed clinical literature** | PubMed-indexed, ≥ 2 independent trials, n ≥ 30 per arm | Typical-use doses, clinical thresholds (e.g., B6 neuropathy at 50 mg) |
| 6 | **Supplier Certificate of Analysis (COA)** | DSM, Lonza, Balchem, Indena, Schwabe specs | Potency factors, standardization, allergens (must verify against Tier 1–5 when possible) |
| 7 | **Industry consensus** | NBJ, CRN guidance, Examine.com evidence grading, ConsumerLab | Tie-breaker only; never load-bearing alone |

**Citation format on every entry:** `citation: { authority: 'IOM (NAM)', source: 'DRI 2001, Table 3-1', tier: 2 }`. Keep `source` short enough to fit a workspace UI tooltip (≤ 80 chars).

**90% rule:** at least 90% of entries must cite Tier 1–4. Tier 6 alone is acceptable only for supplier-spec fields (potencyFactor, standardization) that have no public-authority equivalent.

## 3. Three-Class Value Taxonomy applied to catalog fields

Every rendered value classifies into one of four classes [[feedback_three_class_value_taxonomy]]. Catalog fields inherit the class semantics of their downstream consumer:

| Class | Examples in catalog | Rendering primitive |
|---|---|---|
| **1a — Numeric, range-supported** | `ul`, `dv`, `potencyFactor`, `elementalFactor`, `costPerKg`, `density`, `stabilityHalfLife` | Numeric with ± confidence interval |
| **1b — State / categorical** | `category`, `regulatoryStatus`, `tier (1/2/3 supplier licensing)`, `deliveryForm`, `confidenceLevel` | Enum chip / pill |
| **2 — Reference** | `citation.source`, `supplierName`, `pubMedIds` | Hyperlink / external pointer |
| **3 — Buyer requirements** | `isVegan`, `isHalal`, `isKosher`, `isOrganic`, `isAllergenFree (FALCPA)` | Boolean badge with COA-verification status |

**Class drives confidence rendering.** Never paint a Class-1a value without its range. Never paint a Class-3 value without its COA-verification flag.

## 4. Confidence Levels

Five levels, in increasing certainty:

| Level | When to use | UI rendering |
|---|---|---|
| **Verified-Lab** | Internal or third-party lab analysis run against this specific SKU within the last 12 months | Green check, no ± |
| **Verified-Supplier-COA** | Current supplier COA cited within last 12 months; supplier has cGMP audit | Green check, supplier name |
| **Estimated** | Computed from Tier 1–4 authority for a generic form; no SKU-specific data | Amber ~ symbol, ± range |
| **Inferred** | Computed from chemistry / cross-reference / industry consensus | Amber ~ symbol, wider ± range |
| **Undocumented** | No data; field is blank or default | Red ⚠ icon, "Not yet investigated" |

**Default for harm-critical fields = Undocumented.** Never default to a "safe-looking" zero or null when the meaning would be "no concerns documented." See §I.5.

**Required UI consequence:** the workspace's Determination Engine and Safety card both consume `confidenceLevel`. An entry with Undocumented allergens contributes to a "spec coverage <70%" warning [[project_honest_estimate_reframe]].

## 5. Harm-Critical Floor (NEVER OVERRIDE)

Four fields where an empty/null/missing value MUST be interpreted as **UNDOCUMENTED, not VERIFIED-SAFE** [[feedback_harm_critical_fields_default_undocumented]]:

| Field | Meaning of empty | Required action |
|---|---|---|
| `allergens` | Not yet investigated — operator must verify via COA | Workspace blocks "no major allergens" rendering until either (a) populated with a list or (b) explicitly marked `allergensInvestigated: true, allergensFound: []` |
| `drugInteractions` | Not yet investigated — could carry serious risk | Safety card renders Inferred-with-caveat; no green check |
| `regulatoryStatus.US` | Cannot infer DSHEA-grandfathered status — likely NDI or novel | Determination Engine routes to PA verification queue |
| `ndiStatus` | Pre-1994 status unknown — must investigate FDA NDI database | NDI Compliance Check renders amber-warn, not green |

**This is non-negotiable.** A single "VERIFIED-SAFE" rendering on an UNDOCUMENTED field is a silent-failure pathway to harm. The catalog's job is to never let that happen.

## 6. World-Class Quality Benchmarks (measurable bar)

| Benchmark | Measurement | Target |
|---|---|---|
| **USP DSC parity** | % of entries whose `name`, `category`, `potencyFactor`, `elementalFactor`, `identitySpec` match a published USP DSC monograph (where one exists) | ≥ 95% match (allowed deviation: SKU-specific potency-factor adjustments) |
| **NSF cross-check** | % of athletic / sport-relevant entries that cross-check against NSF Certified for Sport ingredient list | 100% (no ingredient flagged by NSF as banned/restricted may be present without explicit `bannedForAthletic: true` flag) |
| **Examine.com evidence-grade parity** | % of functional-role-tagged entries whose tagged role matches Examine's evidence grade (B or higher) for that effect at typical-use dose | ≥ 80% (rest go to PA queue for evidence-review) |
| **Tier-1–4 citation rate** | % of entries citing US Federal regulation, US Federal scientific authority, international authority, or independent third-party | ≥ 90% |
| **Operator bulk-paste resolution** | % of ingredients in the top-100 most-pasted competitor labels (per quarterly competitor methodology, §IV.21) that resolve via bulk-paste | ≥ 95% by August 2026 |
| **Test coverage** | % of entries with at least one bulk-paste resolution test + one SFP rendering test in `lib/__tests__/` | 100% (gating: §VI) |

These are the ground-truth quality metrics. They are checked on every catalog PR via a CI report (to be built — currently manual). "Comprehensive" is not enough; "passes the bar" is what matters.

## 7. Conflict Resolution Hierarchy

When two rules clash, resolve in this order:

1. **Harm-Critical Floor (§I.5)** — never overridden. If a rule says "fill in allergens to enable claim X," but COA hasn't arrived, the answer is "no claim X, regardless of business pressure."
2. **Authority Hierarchy (§I.2)** — higher-tier authority wins. USP DSC monograph beats supplier COA. Supplier COA beats consensus.
3. **Operator-blocking severity (§IV.20, S1 > S2 > S3 > S4)** — when two valid additions compete for priority, prioritize the one blocking the most operator workflows.
4. **Trend signals (§IV.19)** — last tie-breaker. Trending NEVER overrides harm-critical or authority. Trending DOES move priority within the same authority tier.
5. **Operator preference / brand fit** — last-mile customization. Within compliance.

Example: operator says "add MitoQ (Mitoquinone Mesylate) urgently because it's trending on TikTok."
- Tier 1: harm-critical? MitoQ has limited human-safety data above 80 mg/day → caution flag. No outright ban.
- Tier 2: authority? Tier-5 evidence (small clinical studies). Tier-2 silent. Tier-3 silent.
- Tier 3: operator-blocking? Not in top-100 paste-list — S3 trend signal, not S1.
- Tier 4: trending? Yes, social media surging.
- Resolution: **add with Confidence-Inferred + PA-verification queue entry for pre-launch evidence review**. Don't commit as Verified-anything. Don't tag with functional roles until evidence improves.

---

# Part II — Entry Schema

## 8. Required vs Optional Fields (per category)

**Universal required (every entry):**
- `name` (display name, see §II.9)
- `category` (one of the §III.15 taxonomy)
- `tier` (Class 1b — see §III.16: value / premium / specialty)
- `confidenceLevel` (§I.4)
- `citation` (at least one, §I.2)
- `regulatoryStatus.US` (Class 1b enum)
- `lastReviewedDate` + `reviewedBy`

### §II.8 Transition rider — Wave 1.5–Wave 4 schema gap (added 2026-05-19)

**Status:** Active deferral, scope-bounded. Closed by a Round 12+ catalog-wide schema-migration wave.

**Surfacing event:** Catalog Entry Validator v1 inaugural smoke test (2026-05-19) against `Caffeine Anhydrous (USP, Pharmaceutical-Grade)`. Agent reported PUSHBACK on seven gap-affected patterns whose live-catalog occurrence count is **zero (or near-zero) across ~600 entries** (verified Grep across the initial 5 + step-3-retry surfacing 2 more):

- **Gap #1 — Structured `citation: { authority, source, tier }` object** — live catalog cites in trailing `// Source: ...` comments.
- **Gap #2 — `confidenceLevel` enum** — no entry carries the field.
- **Gap #3 — `regulatoryStatus.US` object form** — live catalog uses bare-string form (`regulatoryStatus: 'GRAS'`); 68 of 68 occurrences. Schema is `{ US: ..., CA?: ... }` per §II.14.
- **Gap #4 — `lastReviewedDate` + `reviewedBy`** — neither present on any entry (precedent exists in `stacks.ts`).
- **Gap #5 — Per-tag `evidenceNote` for functional-role tags** — live catalog has narrative substantiation in `notes`; not structured per Appendix A.
- **Gap #6 — `allergensInvestigated` / `allergensFound` flag pair** — surfaced by step 3-retry (2026-05-19). The M4 §I.5 harm-critical floor rule documents these flags as an alternative remediation when `confidenceLevel` isn't set. Grep-verified: 0 of ~600 entries carry the flags. Same structural shape as Gaps #1–5: rulebook construct that hasn't landed in the catalog.
- **Gap #7 — Per-category required fields per §II.8 (broad)** — surfaced by step 3-retry (2026-05-19). §II.8's "Required per-category (additional)" table enumerates fields per category (Vitamins: `dv`/`unit`/`dvKeyword`; Specialty Compounds: `mechanism`/`evidenceGrade`; etc.). For Specialty Compounds, `mechanism` + `evidenceGrade` are catalog-wide absent (Grep-verified: 0 of ~600 entries; the 1 Grep false-positive was nested `mechanism:` inside `drugInteractions` for a different field). Other categories likely have analogous catalog-wide-absent per-category fields, not yet exhaustively audited. **The specific per-category gap inventory is itself a Round 12+ audit-step prerequisite to the migration wave** — see migration scope below.

**Decision (operator + Wizard, 2026-05-19):** Path (b) — accept gap as known-deferred per [[feedback_refactors_wait_for_stable_data_layer]] + [[project_supplements_two_wave_ingestion]]. The rulebook captures both the target schema (§II.8 universal-required) AND the explicit acknowledgment that Wave 1.5-era entries pre-date it. Round 12+ schema-migration wave closes the gap deliberately.

**Forward-looking requirement — schema-prerequisite acknowledgment (amended 2026-05-19 post-step-5-iteration-3):** New catalog entries from 2026-05-19 forward MUST carry Gap #1–6 fields **once Round 12+ Step 1 (TypeScript schema additions to `IndustrialIngredient` interface in `types/index.ts`) has landed**. Until Step 1 lands, new entries author at **same-category parity** — same shape as existing Wave 1.5b/c siblings within their respective categories. For example, Choline Bitartrate authors at parity with existing Alpha-GPC / CDP-Choline / Phosphatidylcholine (PC 35% Soy) schema shapes; Magtein authors at parity with existing Minerals + Specialty Compounds entries. Gap #7 (per-category required fields) remains conditionally required: a new entry must populate the per-category fields IF the entry's category has at least one prior entry with those fields populated; otherwise the per-category fields defer to the Round 12+ audit-step + migration wave. The four remaining Wave 1.5 entries (Caffeine-from-Green-Tea, Melatonin Time-Release, Choline Bitartrate, Magtein) author at same-category parity per this amendment.

**Schema-prerequisite acknowledgment (closure-claims-bidirectional discipline applied to the rider itself):** This amendment acknowledges that the rider's original "non-negotiable" framing (committed 9789fed, 2026-05-19) assumed a prerequisite that hadn't been verified at authoring time. Grep verification of `types/index.ts` during step 5 entry-1 inaugural exercise revealed:

- `RegulatoryStatus` is a string union (`'GRAS' | 'GRAS-self-affirmed' | ...`), NOT an object schema with jurisdiction keys
- `FunctionalRole` is an enum of tag-name strings, NOT a per-tag-with-evidenceNote object array
- Other Gap #1–6 fields may be absent from the `IndustrialIngredient` interface (full audit per Round 12+ Step 0)

The prerequisite is now explicit. The migration sequence is durable: Round 12+ **Step 0 audit** (per-category required field audit, this rider's existing scope) precedes **Step 1 schema migration** (TypeScript type additions to `types/index.ts`) precedes **forward-looking requirement enforcement** (Gap #1–6 non-negotiability lifts to enforceable).

Verification-as-discovery pattern note: this amendment is itself a worked example of the validator's first production exercise surfacing a structural prerequisite gap the rider's authoring didn't anticipate. Future rulebook amendments that propose new field shapes should include a type-system verification step before being marked enforceable. Pattern name candidate: *spec-vs-type-system prerequisite verification*.

**Step 1 detection protocol (validator-mechanical, two-layer):**

1. **Type-system check (primary):** Grep `types/index.ts` for new field shapes — `tier?:` on `IndustrialIngredient`; object-form `regulatoryStatus` with `US` key; `{ tag: FunctionalRole; evidenceNote: string }` per-tag-evidenceNote object array; `confidenceLevel?:` enum; `allergensInvestigated?:` boolean + `allergensFound?:` array; `lastReviewedDate?:` + `reviewedBy?:` paired fields; `citation?:` structured `{ authority, source, tier }` array. If new field shapes present in the interface → Step 1 has landed.
2. **Marker file (authoritative override):** existence of `docs/catalog/round-12-schema-migration-step-1-complete.md` confirms Step 1 landed regardless of type-system state. If marker file disagrees with type-system check, surface the disagreement as a routing-question — do NOT silent-assume either reading is correct.

**Same-category parity identification protocol:** The new entry's `category` field determines the parity reference. The validator reads other entries in the same category, identifies the dominant schema shape (e.g., for Specialty Compounds: bare-string `regulatoryStatus`, enum-array `functionalRole`, no `confidenceLevel`/`tier`/`lastReviewedDate`/`reviewedBy`/structured-`citation[]`), and confirms the new entry's shape matches. For multi-category-fit entries (per §III.18 primary-mechanism-wins), the **primary category** determines the parity reference. For novel-family entries (Gap 5 of Inventory 4 — no precedent in catalog), no parity reference exists → routes to operator decision via Gap 5 framing.

**Four step-5 entries — future-migration scope:** Caffeine-from-Green-Tea, Melatonin Time-Release, Choline Bitartrate, and Magtein author at same-category parity per this amendment. Once Round 12+ Step 1 lands, these four (along with all other ~600 pre-migration entries) are migrated in Step 7 (allergens-flag backfill) + Step 8 (per-category required-field backfill per Step 0 audit output) of the migration scope. The four entries aren't "stuck" at pre-migration shape — they join the broader migration cohort.

**Gap #6 closure semantics (verification-path requirement, added 2026-05-19; gated on schema prerequisite per amendment above):** "Closure" on Gap #6 for a new entry means EITHER (a) `allergensInvestigated: true, allergensFound: [list-or-empty]` with `confidenceLevel` reflecting the verification source (Verified-Supplier-COA at minimum) OR (b) `confidenceLevel: 'Undocumented'` with explicit acknowledgment that allergen content hasn't been verified. The flag pair is non-negotiable **once schema prerequisite has landed**; the verification path is not. Same closure-claims-bidirectional discipline as elsewhere in the rulebook — the closure isn't satisfied by adding the flag with an aspirational value; it requires either positive verification or explicit Undocumented status. The Round 12+ migration wave applies the same logic to ~600 existing entries (Step 7 of the migration scope): entries where allergen content has been investigated populate the flag pair with their verified findings; remaining entries demote to `confidenceLevel: 'Undocumented'`. No silent-empty default once enforceable.

**Validator implication (Catalog Entry Validator v1):** verdict status splits into:

- **PUSHBACK-ENTRY** — mechanical FAILs on rule violations specific to the proposed entry's authoring. Blocks commit until fixed.
- **PUSHBACK-STRUCTURAL** — mechanical FAILs ONLY on the five gap-affected fields above, AND **all five are absent** from the entry. Informational; does NOT block individual commit. Logs as accumulated schema-migration work.

**Mechanical distinguisher (no git-blame access required):** the validator classifies a structural-vs-entry pushback by counting how many of the six universal-mechanically-countable gap-affected fields (Gaps #1–6) are present. Gap #7 (per-category required fields) is NOT in the distinguisher arithmetic because its presence/absence is category-specific and varies across the catalog (some categories have widely-present per-category fields; others are catalog-wide absent — the Round 12+ audit-step produces the canonical per-category list).

- **0 of 6 present** → Wave 1.5-era pre-migration entry → PUSHBACK-STRUCTURAL on missing Gap #1–6 fields. Gap #7 failures (M5 missing per-category required fields) route via the M5-sub-step Grep audit (see below).
- **1–5 of 6 present** → operator started migration on this entry → expect all 6 → PUSHBACK-ENTRY on the missing ones (partial migration is itself an authoring error).
- **6 of 6 present** → fully migrated for universal-required + allergens-flag → standard checks apply.

**Paired-fields slot counting (added 2026-05-19 post-Test-6a):** Gap #4 (`lastReviewedDate` + `reviewedBy`) and Gap #6 (`allergensInvestigated` + `allergensFound`) each count as **ONE slot, NOT two**. The pair counts as "present" only when BOTH fields are populated. Partial credit (one field present, other absent) means the slot is "absent" — the pair is treated as semantically unitary because the fields are authored together (one without the other is itself an authoring error; M4 + M17 enforce this respectively). The denominator stays 6 (Gaps #1–6) with Gap #4 and Gap #6 each as paired-fields-single-slot. Worked example from Test 6a (2026-05-19): fixture with `confidenceLevel: 'Estimated'` + `lastReviewedDate: '2026-05-19'` + `reviewedBy: 'Step-4 test fixture'` counts as **2/6** (Gap #2 + Gap #4-pair), NOT 3/6.

PUSHBACK-ENTRY + PUSHBACK-STRUCTURAL co-occurring → status is PUSHBACK-ENTRY (entry-specific fix takes precedence; structural gap noted but not blocking on its own).

**Gap #7 per-category sub-protocol (validator M5 augmentation):** when M5 (per-category required fields) FAILs for an entry, the validator runs a category-specific Grep against `lib/data/supplements.ts` for each missing per-category field. If 0 entries in the same category carry that field → catalog-wide absent → PUSHBACK-STRUCTURAL (Gap #7 deferral). If ≥1 entries in the same category carry that field → catalog-wide pattern exists → PUSHBACK-ENTRY (entry must adopt the existing pattern). This decision is per-field, not per-entry-aggregate; an entry may simultaneously have some per-category fields routing structural and others routing entry-level.

**Round 12+ schema-migration scope:** ~600 entries × ≥ 6 universal fields + per-category fields per audit = ≥ ~3600 field-migrations. Estimated as a single coordinated wave with an audit-step prerequisite:

**Step 0 (audit prerequisite — must complete before backfill steps):**
For each of the 14 §III.15 categories, Grep `lib/data/supplements.ts` for each §II.8 per-category required field. Identify which fields are present in 0% of entries for that category (catalog-wide absent → Gap #7 in-scope for migration) vs. present in some entries (partial; out of Gap #7 scope; per-entry backfill via the validator's normal PUSHBACK-ENTRY path during routine catalog work). Output: `docs/catalog/round-12-per-category-audit.md` with the canonical category × field × present-count matrix. This audit feeds steps 7+'s scope.

**Steps 1–7 (backfill, after audit):**
1. Schema additions to `IndustrialIngredient` type (adds the universal-required + allergens-flag + per-audit category-required fields)
2. Per-entry backfill of `confidenceLevel` (Estimated default; Verified-Supplier-COA for top-N entries with current COAs on file)
3. Per-entry backfill of `regulatoryStatus.US` object form from bare-string source
4. Per-entry backfill of `lastReviewedDate` (migration-batch date) + `reviewedBy` ('Round-12-schema-migration')
5. Per-entry backfill of structured `citation[]` array from trailing-comment parse
6. Per-functional-tag backfill of `evidenceNote` from `notes` field where substantively present
7. Per-entry backfill of `allergensInvestigated` + `allergensFound` for entries where allergen content has been investigated; remaining entries demote to `confidenceLevel: 'Undocumented'` per M4 floor
8. Per-category required-field backfill per Step 0 audit output (e.g., Specialty Compounds `mechanism` + `evidenceGrade`; other categories per audit)

Out of scope for this rider: actual migration execution. The rider sets validator behavior; the migration wave is a separate work item with the audit step as its explicit kickoff prerequisite.

**Validator implementation:** [.claude/agents/catalog-entry-validator.md](.claude/agents/catalog-entry-validator.md) (Refinement 1 integration, 2026-05-19). The validator's four-state verdict logic (PASS / PUSHBACK-ENTRY / PUSHBACK-STRUCTURAL / ROUTING-REQUIRED) operationalizes this rider. Round 12+ schema-migration wave will need to touch BOTH files — this rider's removal AND the validator's state machine — together. Cross-reference discipline prevents drift between the rulebook layer and the agent layer.

**Closure criteria:** when the Round 12+ schema-migration wave lands, this rider is removed from §II.8. The strict universal-required reading becomes definitive. PUSHBACK-STRUCTURAL retires from the validator's verdict states.

**Pattern note:** this rider is itself a worked example of the rulebook-as-hypothesis + verification-iterations-as-discovery-channel pattern operating at the validator-build layer. Rulebook describes intended state; validator stress-tests rulebook against catalog; gap surfaces; rider acknowledges gap + sets discipline for closure. Same shape as the Wave 1.5d §38a two-miss-mode disambiguation — different layer, same discipline.

**Required per-category (additional):**

| Category | Additional required |
|---|---|
| Vitamins | `dv` (Daily Value), `unit` (mg / mcg / IU), `dvKeyword` (lowercase phrase for findDVEntry — see §II.9 naming + §IX.41 anti-pattern), `potencyFactor` for carrier-loaded SKUs, `ul` if Tier-1 authority publishes one |
| Minerals | `elementalFactor` (% elemental mass), `dv`, `unit`, `dvKeyword`, `ul`, `formNotes` (chelate vs salt vs oxide implications) |
| Amino Acids | `optimalDose` range, `bioavailabilityNotes`, `commonPairings` |
| Herbal Extracts | `latinName` (genus species), `partUsed` (root/leaf/seed/etc.), `standardizationMarker` ("X% Y-compound"), `extractionMethod` (CO₂, water, ethanol, etc.), `interactionFlags`, `pregnancyContraindicated`, `latinNameVerified` (boolean) |
| Mushroom Extracts | Same as Herbal + `betaGlucanContent`, `mushroomFruitingBodyVsMycelium` |
| Probiotics | `strainId` (genus + species + strain code, e.g., "Lactobacillus rhamnosus GG"), `cfuPerGram`, `viableThroughExpiry`, `licensingTier` (1/2/3 per [[reference_probiotic_supplier_licensing_tiers]]), `requiresColdChain` |
| Prebiotics | `fiberType` (inulin, FOS, GOS, etc.), `degreeOfPolymerization`, `tolerableDoseRange` (GI tolerance) |
| Specialty / Antioxidants | `mechanism` (one-liner), `evidenceGrade` (A/B/C/D per Examine.com or NIH ODS) |
| Excipients | `function` (binder/disintegrant/flow agent/lubricant/etc.), `typicalUsagePct`, `compatibilityWarnings` |

**Optional but valuable on every entry:**
- `sustainabilityNotes` (carbon, water, sourcing geography)
- `priceHistory` (last 4 quarterly snapshots if available)
- `versionHistory[]` (entry-level changelog)

## 8a. Synonyms — REQUIRED from Wave 1.5 forward

**The Rule:** Every catalog entry authored from Wave 1.5 (2026-05-17) forward MUST carry a `synonyms?: string[]` field with at least 2 names that operators realistically type. For most ingredients this means primary consumer name + 1+ alternate consumer names. For **single-canonical-name compounds** (e.g., Melatonin — operators almost universally type "melatonin") the second slot may be filled by the IUPAC / chemical name (e.g., "n-acetyl-5-methoxytryptamine"); note the rationale in the entry's `notes` field. Pre-Wave-1.5 entries get synonyms added during the Wave 1.5b backfill commit.

**Why this is mandatory (not optional):** The original "optional but valuable" framing was the structural weakness that produced the bulk-paste matchability gap surfaced 2026-05-17. Operators paste natural names ("Folate 400 mcg") that don't match formal SKU names ("Vitamin B9 (Folic Acid USP)") via substring. Without synonyms the entry is unreachable from realistic operator workflows — equivalent to not being in the catalog at all.

**Schema:** `synonyms?: string[]` on `IndustrialIngredient` (types/index.ts).

**Storage convention:** lowercase strings as a human would naturally type them. The bulk-paste parser handles variant normalization via `normalizeIngredientName` (lib/parseFormula.ts):
- Lowercases input
- Strips parenthetical qualifiers — `(synthetic)` / `(USP)` disappear
- Maps dashes and slashes to spaces — `5-HTP` → `5 htp`, `B-1/2` → `b 1 2`
- Strips punctuation (commas, periods, colons, etc.)
- Collapses whitespace and trims

This means the synonyms array stays small and human-readable; the parser handles the explosion of operator-typed variants. Do NOT enumerate every capitalization variant.

### ✅ DO (Wave 1.5+ pattern)

```typescript
{
  name: 'Vitamin B9 (Folic Acid USP)',
  // ... other fields ...
  synonyms: ['folate', 'folic acid', 'vitamin b9', 'b9'],
}
// Bulk-paste matches all of: "Folate", "FOLATE", "folic acid",
// "Folic Acid (synthetic)", "Folic-Acid, USP", "Vitamin B9", "B9", etc.
```

### ❌ DON'T

```typescript
synonyms: ['Folate', 'FOLATE', 'folate', 'Folic Acid', 'folic acid', 'FOLIC ACID']
// Capitalization variants — normalization handles this. Bloat without value.

synonyms: ['vitamin b9']
// Single synonym — violates §IX.40 item 16 (≥ 2 alternate names).

synonyms: ['folate', 'folate']
// Duplicates — synonym collisions break deterministic matching.
```

**Matching contract:** Per-entry synonyms resolve at **Tier 1** in the bulk-paste matcher (authored synonyms are a high-confidence claim by us about which natural names map here). The legacy module-level `SYNONYMS` table in lib/parseFormula.ts remains as a fallback for F&B-era data (sugar, salt, vinegars) and resolves at Tier 2.

**Collision discipline:** No two entries may share a normalized synonym. Tests should assert this on every catalog change. Surface collisions as a build-time error, not runtime.

### Wave 1.5e refinement — harm-critical-sibling synonym discipline (2026-05-18)

The Wave 1.5e browser verification surfaced a distinct synonym-layer failure mode that the Tier 1 / Tier 2 / collision-detection layers above do not catch:

**Failure mode:** when ONE entry in a family of variants claims the **bare technical name** of the substance as a synonym (e.g., `'phosphatidylcholine'` on PC 35% Soy), and OTHER variants exist in the catalog (e.g., PC 30% Soy, PC 30% Sunflower) with materially different harm profiles, the bare-name synonym match preempts the cross-entry semantic check. Sibling variants become invisible to bare-name operator paste. Worked example: pre-1.5e bare `Phosphatidylcholine` paste silently resolved to PC 35% Soy (Soybeans allergen); PC 30% Sunflower (allergen-free) was invisible — operators targeting allergen-free products silently committed Soy and got an undeclared Big-9 allergen on the finished product label.

**The Rule:** when proposing a synonym for an entry that is a member of a substance family with multiple variants (different sources, concentrations, branded forms, or formulations), the author MUST:

1. Grep the catalog for all entries in the same substance family (multi-keyword grep per §38a)
2. For each variant pair, identify whether **harm-profile differentials** exist:
   - **Allergen profile differential** (FALCPA Big 9 allergen present in one variant but not another)
   - **Identity-test attestation differential** (different identity-test method required per ingredient class — Wave 2+ data)
   - **Regulatory-status differential** (NDI / GRAS / pre-DSHEA / pending status differs)
3. **If harm-profile differentials exist among variants**, the bare technical name (e.g., `'phosphatidylcholine'`, `'lecithin'`) MUST NOT be claimed as a synonym by any single variant. Bare paste of the technical name routes through the parser's cross-entry semantic check (lib/parseFormula.ts findHarmCriticalSiblings) → Tier 3 disambiguation.
4. **Only qualified synonyms** are claimed by specific variants:
   - **Concentration-qualified:** `'phosphatidylcholine 35%'`, `'pc 35%'`
   - **Source-qualified:** `'soy phosphatidylcholine'`, `'soy lecithin'`, `'soybean lecithin'`
   - **Brand-qualified:** `'metafolin'`, `'quatrefolic'`, `'cognizin'`, `'KSM-66'`

The parser-layer cross-entry check (Wave 1.5e, `findHarmCriticalSiblings`) provides the **runtime safety net**; this rule prevents the authoring-time mistake that triggers the runtime check. Belt-and-suspenders integrity model — same shape as §B3 substance validation: both authoring discipline and parser-layer enforcement.

### ✅ DO (Wave 1.5e+ pattern for substance-family entries)

```typescript
// Family member entry with sibling variants having allergen differential:
{
  name: 'Phosphatidylcholine (PC 35%, Soy)',
  allergens: ['Soybeans'],
  synonyms: ['phosphatidylcholine 35%', 'pc 35%', 'soy phosphatidylcholine'],
  // Qualified-form synonyms only — bare 'phosphatidylcholine' routes
  // through findHarmCriticalSiblings to Tier 3 disambiguation surfacing
  // PC 30% Sunflower (allergen-free sibling).
}
```

### ❌ DON'T (Wave 1.5e+ anti-pattern)

```typescript
// Family member entry claiming the bare technical name when harm-critical
// siblings exist:
{
  name: 'Phosphatidylcholine (PC 35%, Soy)',
  allergens: ['Soybeans'],
  synonyms: ['phosphatidylcholine', 'pc', 'phosphatidyl choline'],
  // Bare 'phosphatidylcholine' silently resolves here — Sunflower variant
  // becomes invisible to operator paste. Harm-critical floor violation.
}
```

**Verifying compliance during authoring:** in addition to the §IX.40 item 16 check (≥ 2 synonyms), the §38a combinatorial grep MUST surface all family-member entries; the author checks each variant pair's allergen / regulatory-status fields. If any pair differs, qualified-only-synonyms applies. The pre-commit checklist item is non-negotiable when entries with potentially-family-bearing names are being authored.

## 9. Naming Convention (with counter-examples)

**The Rule:** Display name = `Common Name (Form, Supplier, Standardization)` where each parenthetical clause encodes a verifiable structured-field value.

**Why:** SKU display names must match underlying field data [[feedback_sku_name_matches_field_data]]. Operators read names and infer characteristics; if the name lies, the inference is wrong, and harm follows.

### ✅ DO

```
Calcium Citrate (USP, Pharmaceutical-Grade)              → category=Minerals, certification=USP-verified
Vitamin B12 (Cyanocobalamin 1% on Mannitol)              → potencyFactor=0.01, carrier=Mannitol
Iron Bisglycinate (Ferrochel, Albion — 20% Fe)           → supplier=Albion, brand=Ferrochel, elementalFactor=0.20
Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)           → supplier=Ixoreal, brand=KSM-66, standardization=5% withanolides
Vitamin D3 Vegan (Lichen-Sourced)                        → source=lichen, vegan=true via COA
```

### ❌ DON'T

```
Calcium Citrate (Vegan, Non-GMO, Allergen-Free)
  → "Vegan/Non-GMO/Allergen-Free" are Class-3 buyer requirements; they belong in
     structured fields (`isVegan`, `isNonGmo`, `allergens: []`), NOT the display
     name. Display-name claims that aren't backed by COA-verified structured fields
     are a silent-failure pathway.

Vitamin C 1000 mg
  → No supplier, no form (ascorbic acid? sodium ascorbate?), no quality grade.
     Operator can't audit it. If we don't have the data, we don't have the entry.

Magnesium "Best Form"
  → Marketing copy in display name. Forbidden.

Super Premium Probiotic Blend
  → Marketing copy + opacity (which strains? at what CFU?). Forbidden. List
     each strain as a separate entry; let stacks (§VII) reference the blend.

Turmeric (95% Curcuminoids, Standardized, Organic, Vegan, Non-GMO, Gluten-Free, Soy-Free)
  → Display-name buyer-requirement creep. The 95% standardization is fine
     (it's a Tier-6 supplier spec); the rest belong in structured fields.
```

## 10. PotencyFactor + ElementalFactor

These two fields are the most-mishandled in current catalog work. Get them right:

### PotencyFactor (carrier-loaded SKUs)
- **What:** Fraction of ingredient mass that IS the canonical active. Default 1.0.
- **When non-1.0:** Beadlets ("Vitamin A Palmitate 500,000 IU/g" ≈ 0.15), triturates ("Vitamin B12 Cyanocobalamin 1% on Mannitol" = 0.01), spray-dried (varies), microencapsulated (varies).
- **How to derive:** Supplier COA → `(active mass per gram) / 1,000,000 mcg` for IU-based vitamins; explicit % for non-IU. Verify against a second supplier COA if possible.
- **Common errors caught by this rule:** Vitamin A beadlet entered as "3500 mcg of pure retinol" — actually 525 mcg active. Vitamin B12 triturate entered as "2.4 mcg active" — actually 0.024 mcg active.

### ElementalFactor (mineral salts and chelates)
- **What:** Fraction of ingredient mass that is the **elemental mineral**. Tied to chemistry, not supplier.
- **When non-1.0:** Always for mineral salts and chelates. Values:

| Form | Mineral | ElementalFactor |
|---|---|---|
| Calcium carbonate | Ca | 0.40 |
| Calcium citrate | Ca | 0.21 |
| Calcium glycinate | Ca | 0.18 |
| Iron sulfate (ferrous) | Fe | 0.20 |
| Iron bisglycinate (Ferrochel) | Fe | 0.20 |
| Iron fumarate (ferrous) | Fe | 0.33 |
| Magnesium oxide | Mg | 0.60 |
| Magnesium citrate | Mg | 0.16 |
| Magnesium glycinate | Mg | 0.14 |
| Zinc picolinate | Zn | 0.20 |
| Zinc gluconate | Zn | 0.14 |
| Zinc bisglycinate | Zn | 0.20 |
| Selenium L-selenomethionine | Se | 0.40 |
| Iodine (Potassium iodide) | I | 0.76 |
| Copper gluconate | Cu | 0.14 |
| Manganese bisglycinate | Mn | 0.32 |
| Chromium picolinate | Cr | 0.12 |
| Molybdenum glycinate | Mo | 0.10 |

These are chemistry-derived (atomic weight ratios). No supplier variation. Use these constants; do not estimate.

## 11. Label-Claim vs Ingredient-Mass Doctrine

**The Architectural Rule:** Operator entries represent **label-claim (active mass) by industry convention**. Catalog entries STORE ingredient mass. The system back-computes ingredient mass via `potencyFactor` (for carrier-loaded SKUs) and `elementalFactor` (for mineral salts) at the bulk-paste boundary.

**Why this matters (Bug #13 surfaced 2026-05-17):**
- Operator pastes "Vitamin B12 2.4 mcg" intending **2.4 mcg of B12 active** (industry-standard label claim).
- If parser matches to "Vitamin B12 (Cyanocobalamin 1% on Mannitol)" and treats 2.4 mcg as **ingredient mass**, the active is 0.024 mcg — 100× under-stated.
- Industry convention: label claims are always active mass. The system must honor this.

### Implementation contract

At the bulk-paste resolution boundary in `lib/parseFormula.ts`:

```typescript
// Pseudocode — actual implementation belongs in bulk-paste matcher
const labelClaimMass = parsedQty;  // operator's entered value = active mass
const sku = matchSkuByName(parsedName);
const ingredientMassToFormulate =
  labelClaimMass
    / (sku.potencyFactor ?? 1)
    / (sku.elementalFactor ?? 1);
const rowQty = ingredientMassToFormulate;  // what goes into the formulation row
const rowDisplayLabelClaim = labelClaimMass;  // what the SFP / safety / etc. uses
```

Downstream surfaces consume `rowDisplayLabelClaim` (== label-claim active mass) directly. The "raw ingredient mass to formulate at" is what the Batch Sheet uses for sourcing.

### ✅ DO

Encode `potencyFactor` and `elementalFactor` on every carrier-loaded or salt-form SKU. Make bulk-paste apply the inverse automatically.

### ❌ DON'T

- Encode `potencyFactor: 1.0` on a 1% triturate and ask operators to enter "240 mcg" to get 2.4 mcg active. (This is the current pre-fix behavior — the operator's mental model is broken.)
- Mix the two representations across surfaces. The SFP and Safety card must agree on which one is which.

## 12. Functional-Role Tags

**The Rule:** Every functional-role tag must be defensible at typical-use dose, not extract-grade equivalents [[feedback_dosage_substantiation_rule]].

### ✅ DO

```
Ashwagandha (KSM-66, 5% Withanolides):
  functionalTags: ['adaptogenic', 'cortisol-modulating', 'stress-support']
  evidenceNote: 'Adaptogenic + cortisol-modulating: clinical at 600 mg/day
                 of KSM-66 standardized extract (Lopresti 2019). Stress-support
                 alignment with traditional Ayurvedic use.'
```

### ❌ DON'T

```
Coconut Sugar:
  functionalTags: ['prebiotic-fiber']
  → WRONG. Coconut sugar is ~2-5% inulin, ~95% sucrose. At typical use
     (1-2 tsp = 4-8 g), inulin delivery is <0.5 g — sub-therapeutic for
     prebiotic effect. Tag is not dosage-substantiated.
     [[feedback_coconut_sugar_not_inulin]]

Matcha:
  functionalTags: ['nootropic']
  → WRONG at 1-2 g typical serving. L-theanine + caffeine effect is real
     but matcha's L-theanine content (~10-25 mg/g) puts a 1-2 g serving
     below the 100-200 mg L-theanine clinically tested for nootropic effect.
     Tag is overstated.
```

### Tag standards
Every functional tag must come with:
- A typical-use-dose threshold ("≥ X mg/day for effect")
- An evidence-grade pointer (Examine.com, NIH ODS, Cochrane Review)
- A clinical-trial citation (≥ 1 trial, ≥ 30 subjects per arm) OR Tier-1/2 authority statement

If the tag fails any of these at typical use, **don't tag it**. The catalog is not a marketing surface.

## 13. Nutrition & Bioactives Consistency

**The Rule:** Same-compound values must match exactly across both nutrition and bioactives fields [[feedback_nutrition_bioactives_consistency]].

Example: Vitamin C in an Acerola Cherry extract entry. If `nutrition.vitaminC` says 17%, then `bioactives.vitaminCContent` must say 17%. Discrepancy = silent inconsistency = downstream feature breakage.

During enrichment passes, **correct the wrong existing value** — don't preserve historical mistakes to "avoid breaking history."

## 14. Multi-Jurisdiction Regulatory Schema

**The Rule:** `regulatoryStatus` is a record keyed by jurisdiction, not a single string. Even if August 2026 is US-only, the schema accommodates Canada / EU / UK / AU from day one.

### Schema

```typescript
regulatoryStatus: {
  US: 'dshea-grandfathered' | 'ndi-notified' | 'ndi-not-yet-notified' | 'novel-no-pathway' | 'banned' | 'gras' | 'restricted';
  CA?: 'nhpid-approved' | 'nhpid-not-listed' | 'rx-only' | 'banned';
  EU?: 'novel-food-authorized' | 'novel-food-not-authorized' | 'traditional-thmp' | 'banned';
  UK?: 'thr-traditional' | 'unauthorized';
  AU?: 'tga-listed' | 'tga-registered' | 'banned';
}
```

**Defer per-entry encoding** of CA/EU/UK/AU until a target market beyond US is named — but the type definition and codepaths accommodate it now. The workspace shows US status by default; "Target Market" selector unlocks others when populated.

---

# Part III — Categorization Rules

## 15. Category Taxonomy

Current 14 categories (frozen unless §III.17 split applies):

```
Vitamins              Minerals             Amino Acids
Herbal Extracts       Mushroom Extracts    Botanicals
Probiotics            Prebiotics           Enzymes
Specialty Compounds   Specialty            Antioxidants
Omega-3s              Fatty Acids          Excipients
```

**Naming consistency check:** "Specialty Compounds" and "Specialty" are currently both present (legacy). Treat as synonyms until a deliberate cleanup pass; new entries default to "Specialty Compounds."

**Off-list categories surface unordered, NOT invisible** [[feedback_category_names_must_match_modes_list]]. The consumer of `category` in `lib/modes.ts` is additive — typos render the entry, just below grouped categories. Cleanup is vocabulary discipline, not bug-fixing. Always verify consumer function before treating mismatch as bug [[feedback_verify_consumer_function_before_mismatch_is_bug]].

## 16. Multi-Tier Strategy (Value vs Premium SKU pairing)

`lib/data/supplements.ts` has a two-wave ingestion seam [[project_supplements_two_wave_ingestion]] — value-tier entries (commodity-priced, generic forms) and premium-tier entries (branded SKUs, third-party verified, supplier-specific). Systematic SKU duplication is **intentional commercial architecture**, not a bug.

### When to add both tiers
For top-100-paste nutrients (S1 per §IV.20), add **both** value and premium entries. Operator pastes "Vitamin C 500 mg" → value-tier match (Ascorbic Acid USP, generic). Operator pastes "Vitamin C (Quali-C, DSM) 500 mg" → premium-tier match.

### When value-only is enough
- Niche / specialty ingredients with no premium-branded alternative
- Excipients (always commodity)

### When premium-only is enough
- Strictly licensed strains (Tier-3 [[reference_probiotic_supplier_licensing_tiers]]) where no commodity exists
- Branded extracts with proprietary standardization (KSM-66 Ashwagandha, EGb 761 Ginkgo, BCM-95 Curcumin)

## 17. Splitting Categories

**When to split (the Prebiotics-from-Probiotics pattern [[project_prebiotic_misfile]]):**
- ≥ 4 entries exist in a category that don't share the category's defining property
- ≥ 1 downstream consumer would benefit from the distinction
- Splitting is reversible (entries can move back)

**How to split:**
1. Propose the split in a memory note [[project_prebiotic_misfile]] style
2. Identify mis-filed entries (by name + structured property)
3. Add new category to §III.15 taxonomy
4. Update mis-filed entries; preserve names exactly
5. Backfill tests for both old and new categories
6. Commit as a single atomic change

## 18. Enzyme / Adaptogen / Nootropic Edge Cases

[[project_enzyme_categorization_review]] notes 10 enzymes tagged Antioxidants/Specialty. The pattern: an enzyme is also an antioxidant (SOD = both); category disambiguation is hard.

**The Rule:** Primary functional mechanism wins category assignment. Secondary effects become tags, not categories.
- SOD (Superoxide Dismutase) → primary mechanism is catalytic enzyme function → category=**Enzymes**, tags=['antioxidant']
- Glutathione → primary mechanism is antioxidant + cofactor → category=**Antioxidants**, tags=['precursor', 'detoxification-support']

Defer category re-assignment for the existing 10 enzymes to post-Wave-5 [[project_enzyme_categorization_review]] (preserves architectural-refactor-after-data-layer-stabilizes discipline [[feedback_refactors_wait_for_stable_data_layer]]).

---

# Part IV — Trends, Predictability, and Cost-of-Omission

## 19. Trend Inputs + Refresh Cadence

**Monthly trend sweep** (Claude proposes; operator confirms direction):

| Source | What it tells us | Lag |
|---|---|---|
| **Innova Market Insights** | Global supplement product launches by ingredient | 2-3 months |
| **Nutrition Business Journal (NBJ)** | US supplement category growth | 6-12 months |
| **Mintel Reports** | Consumer-driven trend forecasting | 3-6 months |
| **SPINS retail data** | US natural-channel POS by SKU | 1-2 months |
| **Google Trends** | Consumer search interest | Real-time |
| **Reddit `r/Supplements`, `r/Nootropics`** | Enthusiast formulator discussion | Real-time, biased toward novelty |
| **TikTok health hashtags** | Mass-consumer awareness (#guthealth, #cortisol, #adaptogen) | Real-time, high noise |
| **Examine.com search velocity** | Evidence-curious consumer interest | Real-time |
| **FDA Warning Letter activity** | Negative trend signal (ingredient flagged for compliance issue) | Real-time |
| **NSF Certified for Sport additions** | Athletic-tier supplier signal | Quarterly |

**Refresh cadence:**
- Real-time sources: **monthly** sweep at start of month
- Lagging sources (NBJ, Mintel): **quarterly**
- FDA Warning Letter activity: **continuous** (any time PA review touches the catalog)

**Output of each sweep:** a list of `proposedAdditions[]`, `proposedDeprecations[]`, `proposedReclassifications[]`. Each entry tagged with **trend source(s)** + **operator-blocking severity (§IV.20)** + **confidence level (§I.4)**.

**Discipline note:** trending NEVER overrides §I.7 conflict-resolution hierarchy. A trending compound with Undocumented harm-critical fields stays in the PA queue, not the catalog.

## 20. Cost-of-Omission Framework

**The Rule:** Catalog gaps are weighted by **operator-blocking severity**, not market trend alone. This is what determines priority order in any wave.

### Severity tiers

| Tier | Definition | Action |
|---|---|---|
| **S1** | Ingredient appears in the top-100 most-pasted competitor labels (per §IV.21 quarterly competitor methodology). Catalog gap = active workflow block. | **Immediate add** in next mini-wave; do not defer past 14 days. |
| **S2** | Ingredient appears as a must-have in ≥ 1 §VII predictability stack. Catalog gap = workspace can't recommend a complete formulation. | **Add in the next planned wave.** |
| **S3** | Trending per §IV.19 but not yet operator-pasted. Catalog gap = future workflow risk. | **PA verification queue first**, then add when evidence + regulatory clear. |
| **S4** | Long-tail / specialty interest. Niche operator request. | **Add only on explicit operator request** with named formulation context. |

### Today's S1 catalog gaps (from 2026-05-17 operator-side test surface)

- Folate / Methylfolate / 5-MTHF (Vitamin B9)
- Biotin (Vitamin B7)
- Pantothenic Acid (Vitamin B5)
- Caffeine Anhydrous
- Melatonin
- St. John's Wort (Hypericum perforatum)
- Garlic Extract (concentrated, allicin-standardized)
- 5 Choline forms [[project_choline_gap_critical]]: Bitartrate, Alpha-GPC, CDP-Choline, Phosphatidylcholine, L-threonate

These get **Wave 1.5** (§VIII.38). No deferral.

## 21. Competitor Reverse-Engineering Methodology

**The closed-loop test for "trending + predictability":** if we ran every Sprouts top-100 multivitamin through the workspace today, what % would bulk-paste resolve cleanly? Target: ≥ 95% by August 2026.

### Quarterly methodology

1. **Sample frame:** for each major category (multivitamin, sleep, focus, pre-workout, women's hormonal, men's prostate, joint, immune, gut, longevity), pull the top-100 SKUs by:
   - Sprouts e-commerce best-sellers
   - Whole Foods best-sellers
   - Amazon Best Sellers (sub-category specific)
   - GNC top sellers
   - Vitacost top sellers
2. **Tabulate:** for each SKU's Supplement Facts panel, extract every active ingredient. Aggregate frequency-of-appearance per category.
3. **Cross-reference:** against current `lib/data/supplements.ts`. Identify gaps where ingredient appears in ≥ 20% of category SKUs but is absent from catalog.
4. **Score:** every gap is S1 (catalog-blocking). Add to next wave.
5. **Resolution test:** simulate the top-100 paste-list through bulk-paste resolution. Compute % cleanly resolved (no unmatched rows).

**Cadence:** **Quarterly** (every 90 days). Output committed to `docs/catalog/competitor-reverse-engineering-YYYY-Q.md`.

### Why this matters
Without this methodology, the catalog grows by intuition and demand-only feedback (operator asks for X, we add X). The operator only asks once they've tried to use it — that's S1 detection by failure. Quarterly reverse-engineering proactively closes S1 gaps before they bite an operator.

## 22. Wave Sizing Rule — predictable companions in same commit

**The Rule:** When adding 1 ingredient, also evaluate its top-3 most predictable companions in §VII stacks. If any are also missing from the catalog, **add them in the same commit**.

### Example
Operator requests "add NMN (Nicotinamide Mononucleotide)." NMN companions in the longevity stack:
- Resveratrol (top-1 NMN companion in 80% of NMN products)
- Trimethylglycine / TMG (methylation-support companion)
- Spermidine (autophagy companion)

Are any of these missing from the catalog? If yes, add together. Commit message: `feat(catalog): NMN + longevity-stack companions (Resveratrol, TMG)`.

### Anti-pattern: one-ingredient-per-commit
Don't add NMN alone if its companions are also missing. The next operator will paste an NMN-based longevity stack and hit the same UX failure mode we just patched.

## 23. Saturation Test — when to STOP adding SKU variants

**The Rule:** Before adding a 4th SKU variant of one nutrient, justify the differentiation.

### Valid differentiation reasons (any one is sufficient)
- **Form**: ascorbic acid vs sodium ascorbate vs calcium ascorbate vs ester-C — distinct chemistry, distinct dose-tolerability profiles
- **Supplier-tier**: commodity (CN) vs pharma-grade (DSM) — distinct purity / cost-tier
- **Certification**: USP-verified vs NSF Certified for Sport vs organic — distinct retail-channel fit
- **Standardization**: 80% silymarin vs 65% silymarin (milk thistle) — distinct potency
- **Carrier**: pure vs 1% triturate vs beadlet — distinct formulation-handling

### Invalid differentiation reasons (saturation triggered)
- **Supplier rebrand**: same SKU, two suppliers selling identical specs — pick one canonical entry
- **Country of origin**: same chemistry, China vs India — handle via `sourcingNotes`, not new entry
- **Buyer-requirement variations**: same SKU with vs without "Vegan" claim — handle via Class-3 boolean fields, not new entry

When saturation triggers, **propose deprecation of the weakest variant** rather than adding a new one.

---

# Part V — Verification Gates

## 24. PA-Verification Queue

[[reference_pa_verification_queue_folder]] — `docs/pa-verification/` holds items requiring Process Authority verification before shipping.

**When an entry goes to PA queue (not directly to catalog):**
- Regulatory status uncertain (post-1994 ingredient without confirmed NDI notification)
- Functional-role tagging is evidence-supported but at borderline dose for typical use
- Harm-critical fields require expert review (e.g., new compound with limited drug-interaction data)
- Tier-3 product-exclusive licensing in question

**Queue entry format:**
```markdown
# YYYY-MM-DD - <ingredient name>
**Proposed entry:** <draft of catalog entry>
**Fields PA must verify:**
- regulatoryStatus.US: <proposed> — verify against FDA NDI database
- functionalTags: <proposed> — verify evidence-grade at typical-use dose
- ul: <proposed or unknown>
**Source citations:** <Tier 1-5 citations>
**Drain criteria:** PA sign-off recorded in file; entry then committed to catalog with `confidenceLevel: Verified-Supplier-COA` or higher.
```

## 25. Supplier-Spec Verification Queue

[[project_phase_2_verification_queue]] — for entries where supplier spec data needs cross-verification.

**PENDING-suffix pattern:** entry name carries " PENDING" in the display name until verified. Workspace renders entries with PENDING suffix in amber-warn, blocking commercial use.

**Current PENDING items:** Iron Bisglycinate Fe%, L. acidophilus NCFM CFU, Calcium Carbonate Limestone Commodity sourcing.

**Discipline note:** persistent memory refs use names, not line numbers [[feedback_persistent_refs_use_names_not_line_numbers]]. Track PENDING items by entry name + PENDING suffix, not by file line.

## 26. Strain/SKU Licensing Verification

[[project_licensing_verification_queue]] + [[reference_probiotic_supplier_licensing_tiers]] — strains we can't add without B2B licensing confirmed.

### Three-tier framework

| Tier | Definition | Catalog implication |
|---|---|---|
| **1 — Open commercial** | Generic strain, multiple suppliers, no licensing constraint | Add freely |
| **2 — Mixed model** | Branded strain available via multiple supplier licenses | Add with supplier specified; verify license is current |
| **3 — Product-exclusive** | Licensed to a single brand owner; cannot be used in competing products | Block until B2B licensing confirmed; PENDING-suffix while pending |

Tier-3 examples: Yakult Honsha strains, Danone strains, Meiji strains, Snow Brand strains. Don't add without confirmed licensing path.

## 27. Bidirectional Verification on Directives

[[feedback_bidirectional_verification]] — agent pushback on directives is the verification standard working. When the operator gives a directive that conflicts with this rulebook, Claude:

1. **States the rule clearly** ("Rulebook §I.5 Harm-Critical Floor prohibits committing this entry with empty allergens.")
2. **Names the conflict** ("Operator directive 'ship today' conflicts with rule 'PA verification before commercial.'")
3. **Proposes alternatives** ("Options: (a) add as PENDING with allergen-investigation file in supplier-spec queue, (b) wait for supplier COA, (c) document explicit override with operator + Wizard sign-off.")

This is not insubordination; it's the verification standard. The discipline note: directives are inputs the rulebook gates.

## 28. Review & Decay Cadence

**The Rule:** Catalogs rot. Every entry carries `lastReviewedDate` + `reviewedBy`. Stale entries surface in workspace UI with amber-warn.

### Review tiers

| Field class | Cadence | Trigger |
|---|---|---|
| Harm-critical fields (allergens, drugInteractions, ndiStatus, regulatoryStatus) | **Quarterly** | Calendar; any FDA action on the ingredient class |
| Typical-use doses, evidence grades, functional tags | **Annually** | Calendar; new Examine.com / NIH ODS / Cochrane update |
| Cost / supplier specs / potency factors | **Annually** | Calendar; on supplier COA update |
| Stability halflives, oxidation profiles | **Annually** | Calendar; on new ICH Q1A literature |
| Display name, category | **On-trigger only** | When schema change forces |

### Trigger events (immediate review regardless of calendar)
- FDA Warning Letter on the ingredient class
- FDA Import Alert addition
- USP DSC monograph revision
- Supplier announces SKU discontinuation or reformulation
- Operator surfaces a discrepancy via workspace UI

### Stale-entry rendering
Workspace shows amber-warn on entries past their cadence. Operator can use; the warning is "this data may have drifted; verify against current supplier COA before commercial release."

---

# Part VI — Test Discipline

## 29. Pre-Commit Tests per Entry

**The Rule:** A catalog entry can't merge without at least three tests in `lib/__tests__/`:

1. **Bulk-paste resolution test** — paste-text (`"<ingredient name> <qty> <unit>"`) matches the entry; resolution returns the right SKU; no false positives or negatives.
2. **SFP rendering test** — entry → DV%, display name, group classification per `findDVEntry`.
3. **Safety-engine test** — typical-use dose triggers expected tier (ok / caution / warning / critical / banned / interaction).

### Why
We discovered Folate / Biotin / Pantothenic Acid missing **only when an operator pasted a multivitamin** in Test 1 of the 2026-05-17 verification round. The test gate would have caught this at the time the SFP rendering of `findDVEntry('Folate')` test was authored — there'd be no DV entry to test against, so the test would have failed during catalog authoring, not during operator use.

### Test file convention
- One test file per category: `lib/__tests__/supplement-catalog-{category}.test.ts`
- Tests grouped by entry; each entry's three required tests are co-located
- Use existing `lib/__tests__/supplement-safety-keyword-boundaries.test.ts` as template

## 30. Bulk-Paste Resolution Tests

Per-entry test shape:

```typescript
it('"Folate 400 mcg" resolves to Folate entry with DV % calculated', () => {
  const result = parsePastedFormula('Folate 400 mcg', SUPPLEMENT_DB);
  expect(result[0].matched).toBeDefined();
  expect(result[0].matched?.name).toBe('Folate (as Folic Acid USP)');
  expect(result[0].parsedQty).toBe(400);
  expect(result[0].parsedUnit).toBe('mcg');
});

it('"Methylfolate 800 mcg" resolves to methylated folate entry (active form)', () => {
  const result = parsePastedFormula('Methylfolate 800 mcg', SUPPLEMENT_DB);
  expect(result[0].matched?.name).toBe('5-MTHF Methylfolate (Quatrefolic, Gnosis)');
});

it('"folic acid 400mcg" (lowercase + spacing) resolves', () => {
  const result = parsePastedFormula('folic acid 400mcg', SUPPLEMENT_DB);
  expect(result[0].matched?.name).toBe('Folate (as Folic Acid USP)');
});

it('"Folate 400 mcg DFE" resolves with DFE annotation preserved', () => {
  const result = parsePastedFormula('Folate 400 mcg DFE', SUPPLEMENT_DB);
  expect(result[0].matched).toBeDefined();
  expect(result[0].annotations).toContain('DFE');
});
```

## 31. SFP Rendering Tests

```typescript
it('Folate renders in SFP at entered value with 100% DV', () => {
  const facts = buildSupplementFacts({
    ingredients: [{ name: 'Folate (as Folic Acid USP)', qty: 400, unit: 'mcg', ... }],
    mode: 'supplements',
    servingSizeInGrams: 0.0004,
    totalBatchGrams: 0.0004,
    ...
  });
  const folate = facts.vitaminMineralRows.find(r => r.displayName.includes('Folate'));
  expect(folate?.amount).toBe(400);
  expect(folate?.unit).toBe('mcg');
  expect(folate?.percentDV).toBe(100);
});
```

## 32. Safety-Engine Coverage Tests

```typescript
it('Folate at 1500 mcg fires safety warning (above 1000 mcg UL)', () => {
  const findings = checkSupplementSafety(
    [{ name: 'Folate (as Folic Acid USP)', qty: 1500, unit: 'mcg', ... }],
    new Map([['Folate (as Folic Acid USP)', 1.5]]) // 1500 mcg in mg
  );
  const folate = findings.find(f => f.limitName === 'Folic Acid (synthetic)');
  expect(folate?.tier).toBe('warning');  // 1500 / 1000 = 150% UL
});
```

---

# Part VII — Stacks as First-Class Data Entities

## 33. Stack Schema

**The Rule:** A "predictability stack" is not just a discovery pattern — it's a NAMED ENTITY in `lib/data/stacks.ts`. The workspace consumes stack data to recommend missing companions when an operator pastes a partial formulation.

### Schema (`lib/data/stacks.ts`)

```typescript
export interface Stack {
  id: string;                    // STACK.MULTIVITAMIN_CORE
  displayName: string;           // "Daily Multivitamin Core"
  category: 'foundational' | 'targeted' | 'specialty';
  description: string;           // One-paragraph clinical context
  mustHave: StackMember[];       // Recommended in ≥ 95% of category SKUs
  commonCompanion: StackMember[]; // Recommended in 50-95%
  optional: StackMember[];       // < 50% but operator-relevant
  dosageProfile: DosageProfile;
  citations: Citation[];
}

export interface StackMember {
  ingredientName: string;        // Matches catalog entry name
  typicalDoseRange: { min: number; max: number; unit: string };
  rationale: string;             // Why this ingredient in this stack
}

export interface DosageProfile {
  intendedAudience: 'general' | 'pregnancy' | 'pediatric' | 'athletic' | 'menopausal' | 'senior';
  totalServingMassMg: { min: number; max: number };
  unitsPerServing: number;
  deliveryForm: SupplementDeliveryForm[];
}
```

## 34. Named Standard Stacks (initial set)

| Stack ID | Display | mustHave (examples) | commonCompanion |
|---|---|---|---|
| `STACK.MULTIVITAMIN_CORE` | Daily Multivitamin Core | A, C, D, E, K, B-complex (B1-B12), Folate, Biotin, Pantothenic Acid, Ca, Mg, Zn, Se, Cu, Mn, Cr, Mo, I | Iron, Iodine, Boron, Choline |
| `STACK.PRENATAL_CORE` | Prenatal Multi Core | Folate 800-1000 mcg, Iron, Iodine, Choline, DHA, Vitamin D | Vit K2, Magnesium, Calcium, B12, B6 |
| `STACK.SLEEP` | Sleep Support | Melatonin, Magnesium Glycinate, L-Theanine | GABA, Glycine, Apigenin, Tart Cherry |
| `STACK.FOCUS` | Focus / Nootropic | Caffeine, L-Theanine, Lion's Mane | Bacopa, Rhodiola, Citicoline, B-complex |
| `STACK.PRE_WORKOUT` | Pre-Workout | Caffeine, Beta-Alanine, Creatine, Citrulline Malate | L-Tyrosine, Betaine, Taurine, B-vitamins |
| `STACK.RECOVERY_BCAA` | Post-Workout / Recovery | BCAAs (2:1:1), Glutamine, Electrolytes | Tart Cherry, HMB, Magnesium |
| `STACK.WOMENS_HORMONAL` | Women's Hormonal Balance | Iron, Folate, B6, B12, Calcium, D, Mg | Vitex (Chasteberry), DIM, EPO, Black Cohosh (cycle-stage dependent) |
| `STACK.MENS_PROSTATE` | Men's Prostate | Saw Palmetto, Zinc, Lycopene, Selenium | Pygeum, Stinging Nettle, Vitamin D, Pumpkin Seed |
| `STACK.JOINT` | Joint Support | Glucosamine, Chondroitin, MSM, Curcumin | Boswellia, Collagen Type II, Hyaluronic Acid, Omega-3 |
| `STACK.IMMUNE` | Immune Support | Vitamin C, Vitamin D, Zinc, Elderberry, Echinacea | Quercetin, NAC, Selenium, Beta-Glucan, Andrographis |
| `STACK.GUT` | Gut / Digestive Health | Probiotic Multi-Strain, Prebiotic Fiber, Digestive Enzymes | L-Glutamine, DGL, Slippery Elm, Bone Broth Protein |
| `STACK.LONGEVITY` | Longevity / NAD+ | NMN, Resveratrol, TMG, Quercetin | Fisetin, Spermidine, CoQ10/PQQ, Rapamycin (Rx-bridge) |
| `STACK.METABOLIC` | Metabolic / Blood Sugar | Berberine, Chromium, Cinnamon, Alpha-Lipoic Acid | Gymnema Sylvestre, Bitter Melon, Magnesium, B-vitamins |
| `STACK.LIVER_DETOX` | Liver Support | Milk Thistle, NAC, Glutathione, B-complex | Choline, Artichoke, Dandelion Root, Selenium |
| `STACK.STRESS_ADAPTOGEN` | Stress / Adaptogen | Ashwagandha (KSM-66), Rhodiola, Phosphatidylserine | L-Theanine, Magnesium, B-vitamins, Holy Basil |
| `STACK.HEART_CV` | Cardiovascular | Omega-3 (EPA/DHA), CoQ10, Magnesium, Vitamin K2 | Garlic, Hawthorn, L-Carnitine, Niacin (low-dose) |
| `STACK.BONE` | Bone Health | Calcium, Vitamin D3, Vitamin K2 MK-7, Magnesium | Boron, Strontium, Silica, Vitamin C |
| `STACK.SKIN_HAIR_NAILS` | Beauty | Biotin, Collagen Peptides, Vitamin C, Hyaluronic Acid | Silica, Zinc, Vitamin E, Astaxanthin, Bamboo Extract |
| `STACK.EYE_HEALTH` | Eye / Vision | Lutein, Zeaxanthin, Bilberry, Vitamin A | Astaxanthin, Omega-3, Zinc, Vitamin C/E |
| `STACK.MOOD` | Mood Support | 5-HTP, B-complex, Magnesium, Omega-3 | St. John's Wort, SAMe, L-Tyrosine, Saffron Extract |

## 35. Recommendation Engine Integration

When operator pastes a partial formulation, workspace runs:

```typescript
// Pseudocode
const stacksMatched = detectStacksFromFormulation(currentIngredients);
for (const stack of stacksMatched) {
  const missing = stack.mustHave.filter(m =>
    !currentIngredients.some(ing => ing.name.toLowerCase().includes(m.ingredientName.toLowerCase()))
  );
  if (missing.length > 0 && missing.length / stack.mustHave.length < 0.3) {
    // Operator has ≥ 70% of the stack — recommend the rest
    surface(`This looks like ${stack.displayName}. You're missing ${missing.length} typical companion(s): ${missing.map(m => m.ingredientName).join(', ')}.`);
  }
}
```

### Stack-completion rendering
Above 70% match: amber-info chip "**Looks like a [stack] formulation — 4 more typical companions available**."
Below 30% match: no surface (avoid false positives on niche formulations).

## 36. Stack Evolution Rules

- **Add a stack** when ≥ 3 operators paste similar formulations OR when a category (sleep, focus, etc.) clearly maps to industry-standard categorization.
- **Modify a stack** when a stack's mustHave drifts (e.g., methylfolate is replacing folic acid in mustHave; track via versionHistory).
- **Deprecate a stack** rarely — stacks have long lives. Mostly we evolve them.

---

# Part VIII — Wave Plan

## 37. The 6-Wave Sequence

[[project_august_2026_mvp]] — 525-entry target by August 2026.

| Wave | Target completion | Scope | Status |
|---|---|---|---|
| **Wave 1** | (complete) | Value-tier foundations: vitamins, minerals, common forms | ✅ Complete (lines 19-115 in supplements.ts) |
| **Wave 2 Phase 1** | (complete) | Premium-tier vitamins + minerals, branded SKUs | ✅ Complete (lines 117-349) |
| **Wave 2 Phase 2** | Q3 2026 | Choline category (5 forms) [[project_choline_gap_critical]], Prebiotic split [[project_prebiotic_misfile]], Iron/Calcium PENDING resolution | 🔄 In progress |
| **Wave 3a** | Q3 2026 | Women's hormonal, men's prostate, herbal extracts depth (~50 entries) | 🔄 Partial |
| **Wave 3b** | Q3 2026 | Mushroom extracts depth, adaptogens depth (~30 entries) | ⏳ Pending |
| **Wave 4** | Q4 2026 | Specialty / nootropic / longevity (~50 entries); SCHEMA-LOCK enforced before this wave | ⏳ Pending |
| **Wave 5** | Q4 2026 | Athletic / pre-workout / recovery (~40 entries) | ⏳ Pending |
| **Wave 6** | Q1 2027 (post-launch) | Long-tail + emerging trends + multi-jurisdiction encoding | ⏳ Post-launch |

## 38a. Pre-Authoring Catalog State Verification (NEW — added 2026-05-17 from Wave 1.5a stress-test)

**The Rule:** Before drafting any catalog entry, grep `lib/data/supplements.ts` for the proposed display name AND common synonyms. If a substantially-equivalent entry exists, the work is **matchability fix** (Cat 1 — add synonyms to the existing entry, do not author a duplicate), not **new entry** (Cat 2).

**Why this rule exists:** Wave 1.5 was originally framed as "15 missing catalog entries." Pre-flight verification at entry #1 revealed 8 of 15 were already in the catalog under formal SKU names that the bulk-paste parser couldn't reach from natural consumer names. Without this verification, Claude would have authored 8 duplicate entries — same ingredient represented twice, with downstream drift risk between the two versions (same shape as the legacy detectAllergens two-sources-of-truth bug). The 30-second grep check catches it; "I'll add a new entry for X" without verification is the anti-pattern.

**Discipline pattern:** catalog-state verification before catalog authoring is the same discipline as code-trace verification before code authoring. Both are pre-flight checks against assumption drift.

**Concrete check (every entry, every commit):**

```bash
# Multi-keyword grep — common name + formal name + class designator
# + any obvious chemical/branded variants. Single-keyword grep misses
# entries hidden behind formal SKU naming (e.g., "Vitamin B9 (Folic
# Acid USP)" won't surface on grep "folate").
grep -i "folate\|folic acid\|vitamin b9\|methylfolate\|metafolin\|quatrefolic" lib/data/supplements.ts

# If results found → matchability fix (Cat 1: add synonyms to existing).
# If nothing → new entry (Cat 2: proceed to §IX.40 17-item checklist).
```

**Pattern for the grep query** — at minimum include:
1. The primary consumer name (e.g., `folate`)
2. The likely formal-SKU pattern (e.g., `folic acid`, `vitamin b9`)
3. Active-form / branded variants (e.g., `methylfolate`, `metafolin`, `quatrefolic`)
4. Class designator if applicable (e.g., `b-complex`, `mineral chelate`)

Wave 1.5a stress-test surfaced the lesson: single-keyword grep ("folate") wouldn't have caught the existing "Vitamin B9 (Folic Acid USP)" entry. Multi-keyword grep is the discipline.

**Unscoped-grep requirement (added 2026-05-19 step-5 entry-1):** The §38a multi-keyword grep MUST be **unscoped** (whole-file `lib/data/supplements.ts`), NOT category-scoped or line-range-scoped. Category-scoped grep misses pre-existing entries that are mis-categorized — the very class of finding §38a's Cat 1 vs Cat 2 decision is designed to catch. Surfacing event: Choline Bitartrate step-5 inaugural authoring (2026-05-19) — pre-existing entry at line 397 was mis-categorized `'Vitamins'` (rulebook §VIII.38 says Specialty Compounds); my category-scoped grep around lines 225-228 (Choline-family Fatty Acids cluster) missed it; the validator's unscoped whole-file grep caught it and routed via §38a Miss-mode B Cat 1 backfill discipline.

**Outcomes:**
- **Existing entry found** → Cat 1: add `synonyms[]` to existing entry, write bulk-paste resolution tests asserting the natural names now match. Do NOT author a parallel entry.
- **No equivalent entry** → Cat 2: proceed to §IX.40 16-item pre-commit checklist.

### Two-miss-mode disambiguation (Wave 1.5d refinement, 2026-05-18)

The Wave 1.5d Lecithin §38a grep-gap finding (operator verification 2026-05-18) surfaced that §38a fails in two distinct ways. Naming them separately matters because they have different velocity profiles and different fixes:

**Miss-mode A — grep-discipline gap (process failure).** The grep was anchored to focal-entry-side terms, not anticipated-operator-paste shapes. Author searched for keywords around the entry they were drafting; didn't search for the natural names operators might paste. Result: pre-existing entries elsewhere in the catalog (different category, different naming convention) weren't surfaced.

- **Worked example:** Wave 1.5b authoring around Phosphatidylcholine deliberately did NOT claim 'lecithin' as a synonym on the PC entry, with the commit note "reserved for future dedicated lecithin entry." But a Lecithin (Soy, Liquid, USP) entry already existed in the Excipients category — surfaced operator-side when bulk-paste of "Soy Lecithin 100 mg" resolved via the existing entry, not Tier 4 no-match. The 1.5b grep was anchored on Phosphatidylcholine-side terms; no grep for "lecithin" standalone.
- **Fix:** rulebook-level. Run **combinatorial grep across all anticipated operator-paste shapes**, not just keywords anchored to the focal entry's canonical name. For each entry being authored, the grep pattern includes (1) consumer paste names of THIS entry, (2) consumer paste names of related/adjacent substances, (3) names the operator might confusingly paste targeting THIS entry (e.g., parent material name, related compound name).
- **Velocity:** one-time rulebook update prevents the failure mode forever.

**Miss-mode B — catalog-data quality gap (per-entry failure).** Grep surfaced the pre-existing entry, but the entry is missing current-schema fields (synonyms, regulatoryStatus, functionalRole, coaTemplateType, bioactives, pharmacopeialReference). Operator paste resolves but the entry is F&B-era shape and doesn't carry the harm-critical-grade metadata Wave 1.5+ entries do.

- **Worked example:** the same Lecithin (Soy, Liquid, USP) entry once surfaced was found to lack synonyms, regulatoryStatus, pharmacopeialReference, coaTemplateType — all introduced in Wave 1.5+ schema additions. Operator paste resolved via implicit Tier 1 single-sub-ingredient match (entry's `subIngredients: ['Soy Lecithin']` matched the query exactly) rather than explicit Tier 1 synonym match.
- **Fix:** per-entry data work. Add missing fields to the existing entry, write the missing tests per §VI.29.
- **Velocity:** ongoing data work that may surface again as other F&B-era entries get touched in future waves.

### In-commit vs defer-to-later-wave decision rule (Miss-mode B)

When §38a grep surfaces a pre-existing entry that lacks current-schema fields, log it as a **catalog-data finding** and choose:

- **Upgrade in-commit** when (a) the gap is verification-coherent with the current commit's scope (e.g., the same entry that surfaced the §38a grep-gap), AND (b) the upgrade is small (one entry, well-understood field set). The PA-verification queue and rulebook §VI.29 test gate constrain in-commit work to substantiated changes only — no speculative metadata fill.
- **Defer to later wave** when the gap is incidental (entry surfaced via §38a check on a different entry, no direct verification coupling) OR the upgrade is large (multiple entries, fields that require PA-verification, schema-driven changes). Add to the catalog-finding queue in `docs/findings/` for explicit Round X assignment.

The decision discipline avoids the failure mode where a routine synonym authoring task quietly turns into a 30-entry F&B-schema upgrade pass. Scope creep is the enemy of verification-coherent batches.

**Worked example:** Wave 1.5d upgraded Lecithin (Soy, Liquid, USP) in-commit (verification-coherent, one entry, well-understood fields: synonyms / regulatoryStatus / pharmacopeialReference / coaTemplateType). The adjacent Sunflower Lecithin (Liquid) entry has the same F&B-era shape but was NOT in 1.5d scope — it's a deferred catalog-data finding for a later wave. The rule applied cleanly.

## 38. Wave 1.5 — Today's Gap Closure

**Inserted between Wave 2 Phase 1 (complete) and Wave 2 Phase 2 (in progress).** Closes operator-visible S1 gaps from 2026-05-17 verification round. Estimated ~15 entries.

**Authoring sequence (per §38a discovery):**
- **Wave 1.5a** — architectural: `synonyms?: string[]` schema field + `parsePastedFormula` synonym matching + rulebook revisions (§II.8a + §VIII.38a + §IX.40 item 16). One-time investment unlocks ~400 existing entries.
- **Wave 1.5b** — Cat 1 backfill: add `synonyms[]` to the 8 existing entries (Folate / Methylfolate ×2 / B5 / Melatonin / Alpha-GPC / CDP-Choline / Phosphatidylcholine) with bulk-paste resolution tests.
- **Wave 1.5c** — Cat 2 new entries: 7 truly-missing ingredients (Biotin / Caffeine Anhydrous / Caffeine Green Tea / Melatonin Time-Release / St. John's Wort / Garlic Extract / Choline Bitartrate / Magtein) through the full §IX.40 16-item checklist.

### Contents (S1-priority, blocking operator workflows)

| Ingredient | Category | Stack(s) |
|---|---|---|
| Folate (Folic Acid USP) — generic value-tier | Vitamins | MV core, Prenatal |
| 5-MTHF / Methylfolate (Quatrefolic, Gnosis) — premium-tier | Vitamins | MV core, Prenatal |
| Biotin (Vitamin B7) — value-tier | Vitamins | MV core, Beauty |
| Pantothenic Acid (Vitamin B5) — value-tier | Vitamins | MV core |
| Caffeine Anhydrous (USP) | Specialty Compounds | Pre-Workout, Focus |
| Caffeine from Green Tea Extract (50% caffeine, decaffeinated alt) | Specialty Compounds | Focus, premium pre-workout |
| Melatonin (USP, Crystalline) — value-tier | Specialty Compounds | Sleep |
| Melatonin (Time-Release) — premium-tier | Specialty Compounds | Sleep |
| St. John's Wort (Hypericum perforatum, 0.3% hypericin) | Herbal Extracts | Mood |
| Garlic Extract (allicin-standardized, 1.3% allicin) | Botanicals | Heart-CV, Immune |
| Choline Bitartrate (40% choline) | Specialty Compounds | MV core, Liver-Detox |
| Alpha-GPC (50% L-α-GPC) | Specialty Compounds | Focus, Athletic |
| CDP-Choline / Citicoline (Cognizin, Kyowa Hakko) — premium | Specialty Compounds | Focus |
| Phosphatidylcholine (Lecithin-derived, 35% PC) | Specialty Compounds | Liver-Detox, Cognitive |
| L-Threonate / Magtein (Magnesium L-Threonate) — also a Mg salt | Minerals | Cognitive, Sleep-premium |

### Wave 1.5 Definition of Done
- All 15 entries authored per Part II schema
- All carry minimum-three tests per §VI.29
- DV table updated for B5, B7, B9 entries (3 new keyword sets)
- Safety table updated for caffeine, melatonin where not already present (already in `lib/supplementSafetyLimits.ts` — verify)
- Stack assignments added to `lib/data/stacks.ts`
- Re-run Test 1 (Daily Reset MV v2) — confirm 22-of-22 ingredients resolve, SFP rendering correct
- Commit + memory pointer to this rulebook

## 39. Schema-Lock Discipline Before Wave 4

**The Rule:** No schema changes (field additions, type modifications, breaking renames) after Wave 4 starts. Wave 4 entries depend on stable type definitions for the next ~80 entries.

If a schema change is needed mid-wave, **pause the wave**, apply the schema change as its own commit + migration script, and resume. Don't let schema drift contaminate authored entries.

---

# Part IX — Operating Rules

## 40. Pre-Commit Checklist (every catalog entry passes before merge)

```
□  Pre-authoring catalog state verification done (§38a grep check) —
   confirms entry is Cat 2 (new), not Cat 1 (matchability fix on existing entry)
□  Display name follows §II.9 convention (Common Name (Form, Supplier, Standardization))
□  Display name does NOT include Class-3 buyer-requirement claims (vegan/non-GMO/etc.)
□  Category matches §III.15 taxonomy
□  Tier (value/premium/specialty) assigned
□  Confidence Level assigned (Verified-Lab / Verified-Supplier-COA / Estimated / Inferred / Undocumented)
□  ≥ 1 Tier-1–4 citation (per §I.2)
□  Harm-critical fields (allergens, drugInteractions, ndiStatus, regulatoryStatus.US) populated OR explicitly Undocumented
□  PotencyFactor + ElementalFactor accurate (§II.10) — chemistry-derived for minerals, supplier-COA for carriers
□  Functional-role tags dosage-substantiated at typical use (§II.12)
□  Nutrition / bioactives consistent for same compound (§II.13)
□  `synonyms[]` populated with ≥ 2 alternate consumer-facing names per §II.8a;
   no normalized-form collisions with other catalog entries
□  Three tests authored per §VI.29 (bulk-paste, SFP render, safety-engine);
   the bulk-paste test asserts ≥ 1 synonym resolves to this entry at Tier 1
□  Stack membership assigned (mustHave / commonCompanion / optional) for at least one §VII.34 named stack
□  Trend source + severity tier (S1-S4) documented in commit message
□  Companion ingredients (per §IV.22 wave-sizing rule) evaluated; added in same commit if missing
□  Memory note created if entry surfaces a new pattern, anti-pattern, or refactor ticket
```

## 41. Anti-Patterns (don't do these)

### ❌ AP-01: Display name carries claims that aren't in structured fields
Already covered in §II.9 counter-examples. Repeated here because it's the highest-impact anti-pattern by harm potential.

### ❌ AP-02: Empty harm-critical field rendered as "no concerns"
The catalog must surface UNDOCUMENTED, never auto-render to VERIFIED-SAFE. See §I.5.

### ❌ AP-03: Adding an ingredient without its predictability companions
Operator pastes a typical formulation; ingredient X resolves; common companion Y was never added. Operator experiences a partial workflow break. See §IV.22.

### ❌ AP-04: Function-role tagging without dosage substantiation
"Coconut sugar — prebiotic-fiber" at typical use is sub-therapeutic. Tagging it misleads operators. See §II.12.

### ❌ AP-05: SKU display name implying compliance/regulatory characteristics
"Calcium Citrate (Vegan, Non-GMO, Allergen-Free)" — these are structured-field claims, not naming claims. See §II.9.

### ❌ AP-06: Hardcoded values that should derive from data
[[project_refactor_ticket_categories_from_data]] — categories hardcoded in `lib/modes.ts` should derive from the data layer. Quick-patches per wave are acceptable; refactor when Wave 5 lands.

### ❌ AP-07: One-ingredient-per-commit when companions are missing
See §IV.22.

### ❌ AP-08: Reordering DV_TABLE / SUPPLEMENT_SAFETY_LIMITS / catalog entries to "fix" a matching bug
The fix is the matching algorithm (word-boundary regex, see Round 11 keyword-collision work), not the ordering. Ordering-dependent matching is fragile.

### ❌ AP-09: Marketing copy in `hazard`, `mitigation`, or `evidenceNote` fields
Keep these tight, clinical, citation-backed. No "this powerful adaptogen supports..." language. The catalog is not a sales surface.

### ❌ AP-10: Skipping the PA-verification queue under business pressure
Conflict-resolution §I.7 hierarchy is non-negotiable. PA review exists because the downside of skipping it is product harm + regulatory action.

## 42. Refactor Triggers

[[feedback_refactors_wait_for_stable_data_layer]] — architectural refactors wait until data layer stabilizes. Quick-patches OK; explicit refactor-tickets for the interim.

**Triggers to revisit:**
- A category has > 50 entries → consider splitting (e.g., split Herbal Extracts into "Adaptogens", "Calming Herbs", "Antimicrobials")
- A schema field is touched by > 5 commits in a quarter → consider promoting to its own type/file
- A test file exceeds 1000 lines → consider splitting per-entry-group
- An anti-pattern is repeated > 3 times → consider promoting to a lint rule

## 43. Memory Discipline

[[feedback_persistent_refs_use_names_not_line_numbers]] — line numbers drift; names persist. When writing a memory note about a catalog item, reference by **entry name**, never by file line.

Memory notes for catalog work focus on:
- **Patterns** (the prebiotic-misfile pattern)
- **Anti-patterns** (the coconut-sugar tagging anti-pattern)
- **Tickets** (deferred refactors, decisions, PA-verification items)
- **Constraints** (Tier-3 strain licensing, supplier-spec PENDING queue)

Do NOT write memory for: catalog data itself (it's in supplements.ts), citations (they're in the entry), test cases (they're in __tests__).

## 44. Brand-Voice Consistency

[[project_parallel_brand_workstream]] — the Wizard maintains a brand-voice workstream. Catalog entry copy (display names, hazard/mitigation text, evidence notes) influences brand voice.

**Voice rules for catalog copy:**
- **Clinical-precise:** "Chronic excess causes peripheral neuropathy" not "Could potentially cause some issues."
- **Citation-backed:** every claim ends with or implies a citation.
- **Non-marketing:** no "powerful," "amazing," "natural," "synergistic" — these are marketing words, not data.
- **Operator-respect:** assume the operator is a qualified formulator; don't over-explain basic chemistry.
- **No anthropomorphism:** "This supplement supports..." → "Clinical evidence at X mg/day supports..."

When in doubt, defer to the brand-voice docs in `docs/brand/`.

---

# Part X — Appendices

## A. Common Functional-Role Tags + Dosage Thresholds

| Tag | Threshold for tagging | Example ingredients |
|---|---|---|
| `adaptogenic` | ≥ 200 mg standardized extract; cortisol/HPA-axis effect documented | Ashwagandha (KSM-66 600 mg), Rhodiola (3% rosavins, 200 mg) |
| `nootropic` | Clinical cognitive effect at typical dose | L-Theanine (200 mg), Lion's Mane (1 g standardized) |
| `cortisol-modulating` | RCT-demonstrated cortisol effect | Ashwagandha (≥ 300 mg/day, 8 wks) |
| `gaba-ergic` | Demonstrated GABA-A or GABA-B agonism | Magnolia bark, Lemon Balm |
| `serotonergic` | Pre-cursor or modulator of serotonin | 5-HTP (50-100 mg), L-Tryptophan (500 mg) |
| `prebiotic-fiber` | ≥ 3 g fermentable fiber per serving | Inulin, FOS, GOS, Acacia Gum, Psyllium |
| `probiotic` | ≥ 1 billion CFU at expiry of clinically-studied strain | Lactobacillus rhamnosus GG, Bifidobacterium infantis |
| `antioxidant` | Documented ORAC > 1000 or specific ROS-scavenging mechanism | Vitamin C, Glutathione, Astaxanthin, SOD |
| `chelator` | Demonstrated metal-binding affinity at supplemental doses | EDTA, NAC, Chlorella, Cilantro Extract |
| `methylation-support` | Cofactor or substrate in methylation pathway | Methylfolate, Methylcobalamin, TMG, SAMe |
| `mitochondrial-support` | Documented ATP / Complex-I-IV effect at supplemental dose | CoQ10 (100 mg), PQQ (10-20 mg), L-Carnitine (500 mg) |
| `joint-support` | Connective-tissue or anti-inflammatory effect at typical dose | Glucosamine (1500 mg), Curcumin (BCM-95, 500 mg) |
| `bone-support` | Bone-mineral-density effect at typical dose | Vitamin K2 MK-7 (90 mcg), Boron, Strontium |
| `immune-support` | Demonstrated effect on URTI severity/duration or NK-cell activity | Vitamin C, Zinc, Elderberry (300 mg standardized), Beta-Glucan |
| `cardiovascular-support` | Effect on lipids, BP, endothelial function, or platelet | Omega-3 (EPA+DHA 1 g/day), CoQ10, Berberine |
| `hormonal-balance` | Hormone-pathway effect; female- or male-specific noted | Vitex / Chasteberry, DIM, Saw Palmetto, Maca |
| `stress-support` | Self-rated stress reduction in clinical trials | Ashwagandha, L-Theanine, Holy Basil, Magnolia |
| `sleep-support` | Sleep-onset, duration, or quality effect | Melatonin (0.3-5 mg), Magnesium Glycinate, Apigenin |
| `cognitive-support` | Memory, focus, processing-speed effects | Bacopa (300 mg, 12+ wks), Phosphatidylserine (100 mg) |

## B. Known-Licensed Strains (Tier 3 — block until licensing confirmed)

| Strain | Licensor | Status |
|---|---|---|
| Lactobacillus casei Shirota | Yakult Honsha | Tier 3 — product-exclusive |
| Bifidobacterium animalis subsp. lactis DN-173 010 | Danone | Tier 3 |
| Lactobacillus casei Shirota (LcS) | Yakult | Tier 3 |
| Lactobacillus rhamnosus HN001 | Fonterra (formerly Howaru) | Tier 2 — licensed multi-supplier |
| Lactobacillus rhamnosus GG (ATCC 53103) | Valio + DuPont (cross-licensed) | Tier 2 |
| Lactobacillus reuteri DSM 17938 | BioGaia | Tier 3 |
| L. plantarum 299v | Probi | Tier 2 |
| Bifidobacterium longum BB536 | Morinaga | Tier 2 |
| L. paracasei F19 | Probi | Pending — licensing TBD |

[[project_licensing_verification_queue]] — verify before adding.

## C. Allergen Mapping (FALCPA Big 9 + Mustard)

[[feedback_no_deletions]] retained. Big 9 FALCPA allergens (effective Jan 1, 2023) + Mustard (Canada/EU-relevant, Tier-separated):

| Allergen | FALCPA-mandatory | Notes |
|---|---|---|
| Milk | Yes | Casein, whey — present in some probiotic carriers |
| Eggs | Yes | Lysozyme (rare in supplements) |
| Fish | Yes | Fish oil, fish-derived collagen, fish gelatin |
| Crustacean shellfish | Yes | Glucosamine HCl from crustacean (chitin extraction) |
| Tree nuts | Yes | Almond, walnut, coconut (FDA classifies as tree nut), Brazil nut |
| Peanuts | Yes | Rare in supplements, but check excipient sourcing |
| Wheat | Yes | Gluten in maltodextrin (potential cross-contam) |
| Soy | Yes | Soy lecithin, soy isoflavones, soy protein isolate, soy-derived vitamin E |
| Sesame | Yes (Jan 2023 addition) | Rare in supplements; check oil-based excipients |
| Mustard | No (Tier-separated) | Required Canada (NHPID), EU; flag for multi-jurisdiction |

**Cross-contamination tier:** explicitly distinguish `contains` vs `mayContain` (facility cross-contam). Operator MUST verify against supplier COA before commercial release [[feedback_harm_critical_fields_default_undocumented]].

## D. Regulatory Status Decision Tree (US, August 2026 target)

```
Is the ingredient marketed as a dietary supplement in the US BEFORE October 15, 1994?
├── YES → status: 'dshea-grandfathered'
│         (citation: DSHEA §8 / 21 CFR 190.6 grandfather clause)
│
└── NO → Has the ingredient been the subject of an FDA-accepted NDI Notification?
         ├── YES → status: 'ndi-notified'
         │         (cite the NDI submission #; verify in FDA NDI database)
         │
         └── NO → Is the ingredient GRAS for a relevant food use?
                  ├── YES → status: 'gras'
                  │         (cite GRAS Notice # or FDA self-affirmed GRAS dossier)
                  │
                  └── NO → status: 'ndi-not-yet-notified' OR 'novel-no-pathway'
                            • If pre-market notification is viable: PA queue
                            • If not (banned compound, e.g.): status: 'banned'
                            • Default: BLOCK from commercial supplement use
```

## E. Catalog Version + Hash (Audit Trail)

Each catalog commit produces a content-addressable hash on `lib/data/supplements.ts`. Format:

```
Catalog version: catalog.v.YYYY.QQ.NN
SHA-256 of supplements.ts: <64-char hex>
Generated: <ISO timestamp>
Authored-by: <Claude session ID or human handle>
Reviewed-by: <Wizard signoff or self-review>
```

Stored in `docs/catalog/versions.log`. PA-verification queue items reference catalog version they apply to. Regulatory inspectors can verify which catalog version was active on which date.

---

# Closing notes

This rulebook is a living document. It WILL be amended as the catalog grows and as the workspace surfaces new failure modes. The discipline:

- **Amend by Pull Request, not in-place edit.** Every rulebook change is reviewable and reversible.
- **Cite the surfacing event** for new rules (which operator test, which audit finding, which PA review prompted this addition).
- **Update memory pointers** when sections move or rules supersede.
- **Test the rulebook** — every quarterly competitor-reverse-engineering pass tests whether catalog discipline holds. If we're falling below the 95% bulk-paste resolution target, the rulebook is failing to enforce.

The catalog's job is to never let a silent failure ship to an operator. This rulebook is how we enforce that job.

**End of rulebook v1.**
