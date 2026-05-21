# Audit: Catalog Authoring Rulebook vs `types/index.ts` Drift

**Audit type:** Read-only enumeration. Audit #2 in the unattended Round-12-scoping series. No code changes; no commits.
**Authored:** 2026-05-20
**Authored-by:** Claude Code (session-bounded, pause-and-surface discipline)
**Reviewed-by:** _pending operator + Opus relay_

**Scope:** Mechanical grep-verification of every field-shape reference in [docs/architecture/catalog-authoring-rulebook.md](../architecture/catalog-authoring-rulebook.md) against [types/index.ts](../../types/index.ts). Adjacent type files consulted where the rulebook explicitly locates the schema there ([lib/data/stacks.ts](../../lib/data/stacks.ts), [lib/servingModel.ts](../../lib/servingModel.ts), [lib/sustainability.ts](../../lib/sustainability.ts)).

**Not in scope:** Per-entry `lib/data/supplements.ts` audits (that's Audit #1 — duplicate-SKU sweep). Validator-mechanical rule-implementation drift (that's a separate `.claude/agents/catalog-entry-validator.md` audit if surfacing-back routes us there).

---

## Executive summary

**Drift findings:** **60 total.** Categorized:

| Drift type | Count | Of which: in iteration-3 rider scope | Of which: NEW (beyond rider) |
|---|---|---|---|
| Structural | 47 | 30 | 17 |
| Shape | 8 | 3 | 5 |
| Naming | 5 | 0 | 5 |
| **Total** | **60** | **33** | **27** |

**Threshold-pause trigger fires.** The audit charter (operator directive, 2026-05-20) specified: *"If audit surfaces > 15 drift findings, pause and surface even if no individual finding requires judgment."*

60 findings is **4× the threshold**. 27 findings are NEW — meaning beyond the schema gaps the §II.8 transition rider's Gap #1–7 already anticipated.

**Routing implication for Round 12 Step 1:** The schema-migration scope is meaningfully larger than the rider's enumerated Gap #1–7. The rider's existing closure framing — "Step 1 schema additions to `IndustrialIngredient` interface" — needs to be re-scoped before Step 1 can ship as a single coordinated commit.

**Recommended next action (operator + Opus):** Review NEW findings (Section 5) before authorizing Audit #1. Two routing questions in Section 6.

---

## 1. Definitions

Three drift categories, each with a distinct migration treatment:

- **Structural drift** — field referenced in rulebook but absent from type system entirely. Migration: **add the field** to the relevant interface.
- **Shape drift** — field exists in type system, but with different shape than rulebook describes (string-union vs object, different enum value set, different decomposition). Migration: **change the shape** (potentially breaking change requiring per-entry data migration).
- **Naming drift** — field exists in type system under a different name than the rulebook references. Migration: **rename** (rulebook update OR type-system rename — judgment call per finding).

**Convention used in this audit:** "rulebook says X" = the rulebook references field name `X` with implied/stated shape `S`. "type system has Y" = the actual TypeScript interface in `types/index.ts` (or co-located stack/serving-model file if the rulebook explicitly anchors there).

---

## 2. Structural drift (field referenced in rulebook, absent from type system)

### 2A. Universal-required on `IndustrialIngredient` (rulebook §II.8) — in iteration-3 Gap #1–6 scope

| # | Rulebook field | Rulebook citation | Expected shape per rulebook | Type-system status | Rider Gap# |
|---|---|---|---|---|---|
| S1 | `confidenceLevel` | §II.8 universal-required + §I.4 | Enum field on `IndustrialIngredient` | Absent | Gap #2 |
| S2 | `citation` | §II.8 universal-required + §I.2 | `{ authority, source, tier }[]` on entry | Absent (`StackCitation` exists for stacks only) | Gap #1 |
| S3 | `lastReviewedDate` | §II.8 universal-required + §V.28 | ISO date string on entry | Absent on `IndustrialIngredient` (PRESENT on `Stack`, line 88 stacks.ts — pattern-precedented) | Gap #4 |
| S4 | `reviewedBy` | §II.8 universal-required + §V.28 | String on entry | Absent | Gap #4 |
| S5 | `allergensInvestigated` | §I.5 harm-critical floor (transition rider Gap #6) | Boolean on entry | Absent | Gap #6 |
| S6 | `allergensFound` | §I.5 harm-critical floor (transition rider Gap #6) | String array on entry | Absent | Gap #6 |

**Note on Gap #4 pair:** Rulebook authoring discipline treats `lastReviewedDate` + `reviewedBy` as paired-fields-single-slot (one is meaningless without the other — see validator's M4 + paired-fields slot-counting post-Test-6a clarification). Migration treatment: add both together.

**Note on Gap #6 pair:** Same paired-fields shape. Plus M4 floor: empty `allergensFound` only acceptable when `allergensInvestigated: true` (verified-empty) OR when `confidenceLevel: 'Undocumented'` is set explicitly.

### 2B. Per-category required (rulebook §II.8 per-category table) — in iteration-3 Gap #7 scope

Rulebook's per-category required-field table enumerates fields per the 14 §III.15 categories. Iteration-3 rider Gap #7 explicitly defers these to a "Round 12+ Step 0 audit prerequisite" — meaning the per-category-field gap is in scope but uninventoried.

This audit performs the inventory.

**Vitamins:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S7 | `dv` | Number (Daily Value mass) | Absent |
| S8 | `unit` | Mass unit string (top-level on entry — distinct from `Bioactive.unit`) | Absent on `IndustrialIngredient` |
| S9 | `dvKeyword` | Lowercase phrase for `findDVEntry` (§II.9 + §IX.41) | Absent |
| S10 | `ul` | Tolerable Upper Intake Level number | Absent (`lib/supplementSafetyLimits.ts` table; not on entry) |

**Minerals:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S11 | `elementalFactor` | Fraction (0–1) of mass that is elemental mineral (§II.10 table) | Absent — chemistry-derived, no supplier variation per rulebook |
| S12 | `formNotes` | String — chelate vs salt vs oxide implications | Absent |

(Plus shared with Vitamins: `dv`, `unit`, `dvKeyword`, `ul`)

**Amino Acids:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S13 | `optimalDose` | `{ min: number, max: number, unit }` | Absent |
| S14 | `bioavailabilityNotes` | String | Absent |
| S15 | `commonPairings` | String array | Absent |

**Herbal Extracts:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S16 | `latinName` | `Genus species` string | Absent |
| S17 | `partUsed` | Root/leaf/seed/etc. string | Absent |
| S18 | `standardizationMarker` | `"X% Y-compound"` (e.g., `"5% withanolides"`) | Absent at top level (`Bioactive.isMarkerCompound` is the per-bioactive flag — different concept) |
| S19 | `extractionMethod` | CO₂/water/ethanol/etc. string | Absent |
| S20 | `interactionFlags` | Array | Absent |
| S21 | `pregnancyContraindicated` | Boolean | Absent |
| S22 | `latinNameVerified` | Boolean | Absent |

**Mushroom Extracts** (same as Herbal +):

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S23 | `betaGlucanContent` | Number/string | Absent |
| S24 | `mushroomFruitingBodyVsMycelium` | Enum | Absent |

**Probiotics:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S25 | `strainId` | Genus + species + strain code string | Absent |
| S26 | `cfuPerGram` | Number | Absent at top level (`Bioactive.unit: 'CFU'` for live cultures — different shape) |
| S27 | `viableThroughExpiry` | Boolean / spec | Absent |
| S28 | `licensingTier` | 1/2/3 enum per [[reference_probiotic_supplier_licensing_tiers]] | Absent |
| S29 | `requiresColdChain` | Boolean | Absent |

**Prebiotics:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S30 | `fiberType` | Enum (inulin/FOS/GOS/etc.) | Absent |
| S31 | `degreeOfPolymerization` | Number | Absent |
| S32 | `tolerableDoseRange` | `{ min, max, unit }` GI-tolerance range | Absent |

**Specialty Compounds / Antioxidants:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S33 | `mechanism` | One-liner string at TOP LEVEL on entry | Absent at top level (`DrugInteraction.mechanism` exists for interactions only — different scope) |
| S34 | `evidenceGrade` | A/B/C/D per Examine.com or NIH ODS | Absent |

**Excipients:**

| # | Field | Expected shape | Type-system status |
|---|---|---|---|
| S35 | `function` | Binder/disintegrant/flow-agent/lubricant enum | Absent |
| S36 | `compatibilityWarnings` | Array | Absent (`matrixCompatibility?: MatrixCompatibility[]` exists — captures ingredient×format compatibility, NOT ingredient×ingredient compatibility per rulebook intent) |

**Iteration-3 Gap #7 sub-finding:** Per-category required-field inventory is **30 fields** across 8 categories (Vitamins/Minerals/Amino Acids/Herbal Extracts/Mushroom Extracts/Probiotics/Prebiotics/Specialty/Excipients). The rider's Step 0 audit prerequisite is therefore meaningfully large; treating it as a 1–2-hour prep task before Step 1 would under-scope it.

### 2C. NEW structural drift (NOT in iteration-3 rider scope)

These 17 findings the rider did not enumerate. They are new prerequisites for Round 12 Step 1 schema migration.

| # | Rulebook field | Rulebook citation | Expected shape | Type-system status |
|---|---|---|---|---|
| S37 | `tier` (value/premium/specialty) | §II.8 universal-required + §I.3 Class-1b | Enum on `IndustrialIngredient` | Absent. (`SupplierTier` exists on `SupplierInfo` with different enum: `commodity/specialty/premium/craft` — different scope: supplier-grade tier, not entry-grade tier) |
| S38 | `sustainabilityNotes` | §II.8 optional-but-valuable | String | Absent (`sustainabilityCerts: SustainabilityCert[]` exists — different field: enum array of cert types, not free-text notes) |
| S39 | `priceHistory` | §II.8 optional-but-valuable | Array of `{quarter, price}` snapshots | Absent |
| S40 | `versionHistory[]` | §II.8 optional-but-valuable | Entry-level changelog array | Absent (`FormulationVersion[]` exists on `SavedFormulation` — different scope: formulation history, not entry history) |
| S41 | `density` | §I.3 Class-1a numeric example | Numeric with confidence interval | Absent |
| S42 | `stabilityHalfLife` | §I.3 Class-1a numeric example | Numeric with confidence interval | Absent |
| S43 | `isAllergenFree` (FALCPA) | §I.3 Class-3 buyer-requirement | Boolean badge with COA-verification status | Absent (catalog encodes via `allergens: string[]` and Gap #6 flag pair — different shape) |
| S44 | `pubMedIds` | §I.3 Class-2 reference | String array of PubMed IDs | Absent |
| S45 | `deliveryForm` | §I.3 Class-1b state | Enum on entry | Absent at IndustrialIngredient level (`SupplementDeliveryForm` exists in `lib/servingModel.ts` as a TYPE; no FIELD on entry) |
| S46 | `brand` | §II.9 naming convention (parenthetical clauses encode structured-field values) | String | Absent (brand is in the entry `name` parenthetical only — not a separate field) |
| S47 | `carrier` | §II.9 naming (e.g., MCC, Mannitol) | String | Absent (carrier is in name parenthetical only) |
| S48 | `standardization` | §II.9 naming (e.g., 5% withanolides) | String | Absent at top level (`standardizationMarker` belongs to Herbal/Mushroom per-category fields — but a generic top-level `standardization` is implied by §II.9 for non-herbal SKUs too, e.g., the "1.3% allicin" garlic example) |
| S49 | `Citation` interface (catalog-level) | §I.2 citation hierarchy | `{ authority, source, tier }` | Absent in `types/index.ts`. `StackCitation` exists in `lib/data/stacks.ts` with shape `{ context, authority, source }` — different shape (no `tier`; has `context`). Catalog-level Citation needs its own interface OR `StackCitation` needs to migrate to cover both. |
| S50 | `evidenceNote` (catalog-level per-tag) | §II.12 functional-role tags | Per-tag structured object | Absent (see Shape Drift Sh5 — related but tracked as shape drift on `functionalRole`) |
| S51 | `RegulatoryStatus` jurisdictions (CA, EU, UK, AU) | §II.14 multi-jurisdiction schema | `regulatoryStatus.CA`, `.EU`, `.UK`, `.AU` enums | Absent — type system has only `RegulatoryStatus` flat union. (Note: rulebook §II.14 explicitly says "defer per-entry encoding" until target market named — but type definition + codepaths must accommodate now. Type definition does NOT accommodate.) |
| S52 | `versionNotes` on `IndustrialIngredient` | §V.28 review cadence + Stack has `versionNotes?` (stacks.ts:90) | String | Absent on `IndustrialIngredient` (PRESENT on `Stack`) |
| S53 | `MEASURED` enum-value-tier (Tier-6 supplier COA) | §I.4 confidence taxonomy header comment in types/index.ts:18 | `'measured'` is in `Confidence` enum BUT rulebook §I.4 names FIVE levels with different semantics | Half-present — see Shape Sh3 |

Wait — S53 is more naturally Shape drift, not structural. Moving to Section 3 below; renumbering closes at S52 (15 NEW structural findings; total structural = 47 corrected to **45**).

*Audit-discipline note:* the structural drift count revised from 47 → 45 mid-write. Total drift count revised: **60 → 58**. Threshold-trigger still fires (>15). NEW drift count revised: 27 → 25.

---

## 3. Shape drift (field exists, different shape)

### 3A. In iteration-3 rider scope

| # | Field | Rulebook shape | Type-system shape | Rider Gap# | Migration treatment |
|---|---|---|---|---|---|
| Sh1 | `regulatoryStatus` | Jurisdiction-keyed object `{ US, CA?, EU?, UK?, AU? }` (§II.14) | Bare string union (`RegulatoryStatus` type) | Gap #3 | Breaking — per-entry migration of bare-string → object form |
| Sh2 | Per-tag `evidenceNote` | `{ tag: FunctionalRole; evidenceNote: string }[]` (§II.12) | `functionalRole?: FunctionalRole[]` bare enum array (line 887 types/index.ts) | Gap #5 | Breaking — per-entry restructure of array |
| Sh3 | `confidenceLevel` enum value set | `'Verified-Lab' \| 'Verified-Supplier-COA' \| 'Estimated' \| 'Inferred' \| 'Undocumented'` (§I.4) | `Confidence = 'measured' \| 'calculated' \| 'estimated' \| 'inferred' \| 'unknown'` (line 32 types/index.ts) | Gap #2 | Reconcile — see §3C routing question |

### 3B. NEW shape drift (NOT in iteration-3 scope)

| # | Field | Rulebook shape | Type-system shape | Migration treatment |
|---|---|---|---|---|
| Sh4 | `RegulatoryStatus` US enum values | `'dshea-grandfathered' \| 'ndi-notified' \| 'ndi-not-yet-notified' \| 'novel-no-pathway' \| 'banned' \| 'gras' \| 'restricted'` (§II.14 schema; lowercase kebab) | `'GRAS' \| 'GRAS-self-affirmed' \| 'NDI-notified' \| 'NDI-required-not-notified' \| 'food-additive' \| 'color-additive' \| 'dietary-ingredient-pre-DSHEA' \| 'EU-novel-food-cleared' \| 'pending'` (line 694 types/index.ts; mixed case) | Reconcile — see §3C routing question. NOT just casing: different value sets too (type system has `food-additive`/`color-additive`/`EU-novel-food-cleared` that rulebook omits; rulebook has `restricted`/`novel-no-pathway` that type system omits) |
| Sh5 | `ndiStatus` (separate field) | §I.5 + §IX.40 treat as discrete harm-critical field | Rolled into `RegulatoryStatus` enum (`'NDI-notified'`, `'NDI-required-not-notified'`) | Decomposition mismatch — rulebook implies dedicated field; type system folds into status enum |
| Sh6 | `typicalUsagePct` (Excipients) | Top-level field on Excipient entry (§II.8 per-category) | Nested as `usageRange.typicalPct` (UsageRange interface line 672) | Decomposition mismatch — concept captured, structure different |
| Sh7 | `isVegan` / `isKosher` / `isHalal` / `isOrganic` / `isNonGmo` | Top-level Class-3 boolean badges (§I.3 buyer-requirements table) | Encoded via `sustainabilityCerts: SustainabilityCert[]` enum-membership (`'vegan'`, `'kosher'`, `'halal'`, `'usda-organic'`, `'non-gmo-verified'`) + `organicAvailable?: boolean` for organic specifically | Encoding mismatch — type system uses cert-array membership; rulebook implies boolean per-claim. **Judgment call** — current encoding may be intentional (one source of truth for cert claims); see §3C routing question |
| Sh8 | `Nutrition.vitaminC` | Referenced as field in §II.13 same-compound-consistency example (`nutrition.vitaminC says 17%`) | `Nutrition` interface (line 55) omits `vitaminC`; has only `vitaminD`, `calcium`, `iron`, `potassium` among micronutrients | Type-system completeness gap — `Nutrition` is intentionally thin (`Partial<Nutrition>` used everywhere) but rulebook example assumes vitaminC field |

### 3C. Open routing questions on Shape drift

Three shape-drift findings require judgment before Round 12 Step 1 can scope cleanly:

**Q-Sh1 — Confidence enum reconciliation (Sh3).** The rulebook §I.4 levels distinguish by *source* (Lab vs Supplier-COA vs computed). The `Confidence` type in types/index.ts:32 distinguishes by *chemistry-soundness* (measured-physical vs calculated-from-MEASURED-inputs vs estimated-approximation). These are **non-isomorphic mappings** — e.g., "Verified-Supplier-COA" in rulebook = "measured" in type system, but rulebook has no equivalent for type-system's distinction between "calculated" and "estimated" (both would collapse to rulebook "Estimated"). **Routing:** rulebook adopts type-system semantics, OR type system gains rulebook semantics, OR both coexist as separate fields. This is a foundational decision because `confidenceLevel` is required on every entry per §II.8 + §IX.40.

**Q-Sh2 — RegulatoryStatus enum reconciliation (Sh4).** The two enums encode different ontologies. Rulebook treats GRAS, NDI, banned, restricted as a US-jurisdiction-specific 7-value enum. Type system treats GRAS, NDI, food-additive (21 CFR 172), color-additive (21 CFR 73), pre-DSHEA, EU-novel-food, pending as a 9-value union mixing US + EU statuses. **Routing:** if type-system enum migrates to per-jurisdiction object (Sh1), the US sub-enum still needs a value-set decision — rulebook subset, type-system subset, or union. Also affects: §IX.40 pre-commit checklist references "ndi-not-yet-notified" (lowercase) — every checklist invocation needs the canonical casing.

**Q-Sh3 — Class-3 booleans vs SustainabilityCert encoding (Sh7).** Current encoding (cert-array membership) is *defensible*: one source of truth for cert claims, COA-verification status implicit in the cert presence. Rulebook's `isVegan` / `isHalal` framing predates the SustainabilityCert design. **Routing:** rulebook §I.3 example table needs updating to match type-system encoding, OR type system grows redundant boolean accessors. Recommend: rulebook update (simpler, no migration). But this is operator-call.

---

## 4. Naming drift (field exists, different name)

All 5 findings NEW (not in iteration-3 scope).

| # | Rulebook name | Type-system name | Location | Migration treatment |
|---|---|---|---|---|
| N1 | `functionalTags` | `functionalRole` (line 887 types/index.ts) | IndustrialIngredient | Reconcile — pick one, update other. Rulebook uses `functionalTags` throughout §II.12 + §IX.40 + Appendix A; type system uses `functionalRole`. |
| N2 | `unitsPerServing` | `unitsPerServingTypical` (line 56 stacks.ts) | DosageProfile (Stack) | Reconcile — rulebook §VII.33 names `unitsPerServing`; actual field is `unitsPerServingTypical`. |
| N3 | `Citation` (interface) | `StackCitation` (line 63 stacks.ts) | Stack-level. Catalog-level Citation interface doesn't exist (see also S49). | Reconcile — defensible to keep stack-specific name; but rulebook §VII.33 Stack schema example uses bare `Citation[]`. |
| N4 | `supplierName` | `suppliers: string[]` (IndustrialIngredient) + `SupplierInfo.name` (separate registry) | Decomposition — rulebook §I.3 Class-2 reference example names singular `supplierName`; actual storage is plural array + separate registry lookup | Reconcile — likely rulebook update (current encoding is correct for multi-supplier reality). |
| N5 | `deliveryForm` (catalog field) | `SupplementDeliveryForm` (type only) + `DosageProfile.deliveryForm` (Stack field) — NO field on IndustrialIngredient | Cross-cuts S45 (structural) — type exists, FIELD on catalog entry absent | Decide: does catalog entry need `deliveryForm` field directly, OR is it always inferred from category? |

---

## 5. Round 12 Step 1 implications

Per iteration-3 rider, "Step 1 schema additions to `IndustrialIngredient` interface in `types/index.ts`" was framed as a single coordinated TypeScript-only commit. This audit surfaces that Step 1 must address:

**5A. In-rider-scope work (33 findings) — already anticipated:**
- 6 universal-required field additions (S1–S6)
- 30 per-category required field additions (S7–S36, distributed across 8 categories)
- 3 shape-drift migrations (Sh1, Sh2, Sh3) — these are *breaking changes* requiring per-entry data migration alongside type changes
- Rider's Step 7 (allergens-flag backfill) + Step 8 (per-category required-field backfill per Step 0 audit) already encompass these

**5B. NEW work surfaced by this audit (25 findings) — needs explicit scoping decision:**

Each NEW finding needs a per-finding routing decision before Step 1 commits to a scope. Three classes:

**Class A — Add to Step 1 scope (recommend):** Findings whose absence would require *another* schema migration after Step 1 lands. Doing them together avoids a second migration wave.

- S37 (`tier` value/premium/specialty) — universal-required per §II.8, only reason it wasn't in rider Gap #1–6 list is omission
- S52 (`versionNotes`) — pattern-precedented on `Stack`; trivial add
- S49 (catalog-level `Citation` interface) — rider Gap #1 implies this; the audit makes it explicit

**Class B — Defer to dedicated wave or roll into rulebook update:** Findings where the *rulebook* is what needs to change, not the type system.

- S43 (`isAllergenFree`) — encoding via existing `allergens` + Gap #6 flag pair is correct; rulebook §I.3 table needs update
- Sh7 (Class-3 booleans `isVegan`/etc.) — current `sustainabilityCerts` encoding is correct
- N4 (`supplierName` singular) — current `suppliers[]` + `SupplierInfo` decomposition is correct
- Per §3C, Sh3 (`confidenceLevel` semantics) and Sh4 (`RegulatoryStatus` US enum) need foundational decisions; once made, one side updates to match

**Class C — Genuine open scoping question:** Findings where neither rulebook nor type system is obviously right.

- S38–S40 (`sustainabilityNotes`, `priceHistory`, `versionHistory[]`) — rulebook §II.8 lists as "optional but valuable"; they really are optional and the codebase hasn't needed them yet
- S41–S42 (`density`, `stabilityHalfLife`) — rulebook §I.3 names as Class-1a examples; do we need them as catalog fields now or are they future-spec?
- S44 (`pubMedIds`) — citation evolution: rulebook §I.2 implies pub-med IDs are sub-fields of the structured Citation; could be `Citation.pubMedIds` instead of a top-level entry field
- S45 + N5 (`deliveryForm` on entry) — judgment call about whether catalog entries carry delivery form directly
- S46–S48 (`brand`, `carrier`, `standardization`) — §II.9 says parenthetical clauses encode structured-field values; current pattern is name-parenthetical-only. Do we lift to fields?
- S50 (catalog-level per-tag `evidenceNote`) — tracked separately from Sh2 (the per-tag-shape change); confirms scope

**Class D — Pre-existing absence with explicit deferral rationale:**
- S51 (CA/EU/UK/AU regulatory enums) — rulebook §II.14 explicitly defers per-entry encoding; type definition deferral aligns

**5C. Step 0 (audit prerequisite) is bigger than the rider implied.**

The rider says: "For each of the 14 §III.15 categories, Grep `lib/data/supplements.ts` for each §II.8 per-category required field. Identify which fields are present in 0% of entries..."

This audit performed the *types-side* of that work — confirming 30 per-category required fields are catalog-wide absent at the **type system** level (which guarantees they're 0% present in entries too, since the field can't be set without the type permitting it).

Step 0 is therefore lighter than the rider implied — the per-entry audit is moot for catalog-wide-absent fields. Step 0 reduces to: **confirm the per-category audit matches this drift inventory**, and proceed to Step 1.

---

## 6. Open routing questions for operator + Opus

**Q1 — Scope of Round 12 Step 1.** Two paths:

- **Path A — Conservative.** Step 1 ships exactly the iteration-3 rider's Gap #1–6 universal-required additions (S1–S6). Per-category Gap #7 work (S7–S36) becomes Step 1.5 or Step 2. NEW findings (Sections 2C, 3B, Class B/C from §5B) deferred to a follow-up scoping wave.
- **Path B — Comprehensive.** Step 1 ships everything in this audit's "Class A — Add to Step 1 scope" recommendation: Gap #1–6 + 30 per-category required fields + 3 NEW Class-A findings (S37, S49, S52) + the 3 shape-drift migrations. ~36 field additions + 3 shape changes in one coordinated commit.

Recommend **Path B** — Step 1 fragmentation creates more risk than scope-density. Migration touches ~600 entries either way; doing it in one wave avoids the partial-migration problem the validator's PUSHBACK-STRUCTURAL is designed to catch.

**Q2 — Foundational reconciliation decisions before Step 1 starts.** Three (Q-Sh1, Q-Sh2, Q-Sh3 from §3C) need operator + Opus calls before Step 1 type definitions can be written. Recommend resolving these as a precondition to Step 1, not during it.

---

## 7. Pause-and-surface trigger

Per audit charter:
> If audit surfaces > 15 drift findings (rough threshold), pause and surface even if no individual finding requires judgment. Reason: drift count above ~15 suggests the schema migration scope is meaningfully larger than iteration-3 anticipated, which is itself a routing-relevant finding before audit #1 runs.

**Trigger fires.** 58 total findings; 25 NEW; threshold ratio 3.9×.

**Action taken:** This audit is the surface-back. Audit #1 (duplicate-SKU sweep) is HALTED pending operator + Opus review and routing decision per Q1 + Q2 above.

**Suggested next step for operator:** Relay this audit to Opus for routing. Two paths forward when Opus responds:

1. **If routing greenlights Audit #1** — CC resumes per the original sequential plan; the duplicate-SKU sweep's grep methodology incorporates field-name vocabulary from this audit (especially Sh4's enum-value reconciliation question, which affects how duplicate-SKU detection treats `regulatoryStatus` matching).
2. **If routing redirects to Step 1 scoping decision first** — Audit #1 deferred; Step 1 scope routing-question becomes the next work.

---

## 8. Audit metadata

**Files read:**
- [docs/architecture/catalog-authoring-rulebook.md](../architecture/catalog-authoring-rulebook.md) (1271 lines)
- [types/index.ts](../../types/index.ts) (1088 lines)
- [lib/data/stacks.ts](../../lib/data/stacks.ts) (first 120 lines — schema-relevant section)
- [lib/servingModel.ts](../../lib/servingModel.ts) (`SupplementDeliveryForm` block)
- [lib/sustainability.ts](../../lib/sustainability.ts) (`isOrganic` grep verification only)

**Verification greps:**
- `elementalFactor|lastReviewedDate|reviewedBy|allergensInvestigated|allergensFound|ndiStatus|confidenceLevel` against `types/` — 0 matches (confirmed absent)
- `^export (interface|type) (Stack|StackMember|DosageProfile|SupplementDeliveryForm|Citation)\b` repo-wide — Stack interfaces in lib/data/stacks.ts; SupplementDeliveryForm in lib/servingModel.ts; no catalog-level Citation interface
- Per-category fields (latinName/partUsed/standardizationMarker/extractionMethod/strainId/cfuPerGram/licensingTier/evidenceGrade/dvKeyword) — only present in rulebook + validator-agent doc files, never in `types/` or other code files
- `functionalTags|isVegan|isKosher|isHalal|isOrganic|isNonGmo|isAllergenFree` — present only in rulebook + validator-agent docs; `isOrganic` derived property in `lib/sustainability.ts`

**No code changes. No commits. Outputs scoped to `docs/audits/`. Pause-and-surface discipline applied.**

— Audit #2 complete. Audit #1 halted pending routing.

---

## 6. Reconciliations resolved — 2026-05-20

Resolved by operator + Opus reasoning support during fresh-attention session, 2026-05-20, after Audit #2 surface-back. Applied to Audit #1 methodology and Round 12 Step 1 scope.

**Durable-artifact discipline:** these resolutions were initially captured in operator + Opus reasoning session only. To prevent future CC sessions from re-discovering the same context gap, they are committed here as the canonical record. Future readers (any CC session, validator agent, F&B Recipe Validator build) should treat this section as authoritative on the four reconciliations below.

### Q-Sh1 — `confidenceLevel`: source-based

**Decision:** Adopt rulebook's 5-value source-based enum: `Verified-Lab`, `Verified-Supplier-COA`, `Estimated`, `Inferred`, `Undocumented`.

**Operator framing (verbatim):** *"It all has to be source-driven. The only science we are predicting is when they are combined with other ingredients with reputable sources."*

**Architectural reasoning:** The catalog layer stores source-documented facts. The prediction layer (pH predictor, shelf-life models, claim substantiation) operates downstream of those facts with its own uncertainty annotations. Conflating chemistry-soundness into the catalog layer would mix storage with inference. Source-based aligns with PA-as-authority architecture (PA verifies evidence chains), with harm-critical-floor discipline (UNDOCUMENTED is the safe-default sentinel), and with bidirectional verification (claims trace to sources).

**Migration implication:** Round 12 Step 1 renames type-system enum to source-based values. Existing code using `confidenceLevel` migrates accordingly. UNDOCUMENTED is the default for empty harm-critical fields per M4 discipline.

### Q-Sh2 — `RegulatoryStatus`: lowercase-kebab, object form, verification state split

**Decision A — Capitalization:** lowercase-with-dashes matching 21 CFR text convention (`gras`, `gras-self-affirmed`, `ndi-notified`, `ndi-required-not-notified`, `food-additive`, `color-additive`, `dietary-ingredient-pre-dshea`).

**Operator framing (verbatim):** *"Match the 21 CFR way!"*

**Decision B — Structure:** Full Split — three separate fields, each doing one job:

1. **`regulatoryStatus`** — object form with jurisdiction keys (`us`, `eu`, etc.); each jurisdiction has its appropriate enum of regulatory categories. US: the 7 lowercase-kebab values above.
2. **`regulatoryStatusVerificationState`** — separate field tracking verification process. Values: `pending` / `verified` / `pa-reviewed` (final naming subject to small refinement during migration).
3. **`confidenceLevel`** — source-based per Q-Sh1.

**Operator framing:** *"Full Split."*

**Architectural reasoning:** The current type-system enum conflates three dimensions (regulatory categories + jurisdictions + verification process state). Each dimension needs its own field for clean queries, PA-review state machinery support, and multi-jurisdiction extensibility (F&B/pet food expansion will need this).

**Migration implication:** Round 12 Step 1 splits the current 9-value enum:
- 7 values become US regulatory categories under object form
- `EU-novel-food-cleared` moves to EU jurisdiction field
- `pending` migrates to verification-state field

### Q-Sh3 — Class-3 claims: nested object with `claimed` boolean + certifications array

**Decision:** Path C — nested object per Class-3 claim type. Each claim has a `claimed` boolean (for mechanical rules) AND a `certifications` array (for PA audit trail).

Shape:
```typescript
class3Claims: {
  vegan: { claimed: boolean; certifications?: Certification[] };
  organic: { claimed: boolean; certifications?: Certification[] };
  nonGMO: { claimed: boolean; certifications?: Certification[] };
  glutenFree: { claimed: boolean; certifications?: Certification[] };
  kosher: { claimed: boolean; certifications?: Certification[] };
  halal: { claimed: boolean; certifications?: Certification[] };
  allergenFree: { claimed: boolean; certifications?: Certification[] };
  soyFree: { claimed: boolean; certifications?: Certification[] };
}
```

Certification interface includes: `body`, `certId`, `expiry`, `certStandard`.

**Operator framing:** *"Path C!"*

**Architectural reasoning:** Booleans alone (current rulebook) lose certification audit-trail data. Array alone (current type-system `sustainabilityCerts`) makes mechanical rules brittle (M11 string-search). Path C captures both — the boolean answers "is this claimed?"; the certifications answer "by what authority?" Both dimensions needed for PA-review and harm-critical-floor discipline.

**Migration implication:** Round 12 Step 1 deprecates `sustainabilityCerts` array. Existing entries migrate by parsing array contents into per-claim certification objects.

### Q1 — Step 1 scope: Comprehensive with field-batched commits

**Decision:** Option 1 — Comprehensive Step 1 with field-batched commit sequencing. All ~51 field changes + 3 shape reconciliations land in one coordinated Round 12 Step 1 wave. Commits are field-batched (one field migrated across all 600 entries per commit) rather than entry-batched.

**Operator framing:** *"1."* (selecting Option 1 from the three-option routing.)

**Architectural reasoning:** Audit #2 surfaced the canonical scope; fragmenting it artificially creates partial-state windows during which authoring happens against incomplete schema. Q-Sh1/Sh2/Sh3 shape changes are tightly coupled — consumers transition once rather than across multiple waves. Field-batched commits keep catalog state uniform throughout migration; per-entry cost dominates per-field cost so fragmenting doesn't save time.

**Migration implication:** Round 12 Step 1 work is ~10-20 sessions of focused effort. Validator runs throughout to catch drift, regressions, partial-migration errors. Tests migrate alongside.

### Implications for Audit #1 methodology

**regulatoryStatus matching in duplicate detection:**
- Treat current mixed-case values (e.g., `'GRAS'`) and lowercase-kebab values (e.g., `'gras'`) as match-equivalent during the audit. Both forms represent the same regulatory category; the casing migration happens during Round 12 Step 1.
- Object-form values (`{ us: 'gras' }`) don't yet exist in the catalog; audit operates on current bare-string form.
- Verification-state-collision (e.g., `regulatoryStatus: 'pending'` on multiple entries) is a noise pattern, not a substance-equivalence pattern. Surface separately if found.

**confidenceLevel matching in duplicate detection:**
- The catalog does not currently carry `confidenceLevel` on any entry (Audit #2 §2A confirmed 0 of ~600 entries have the field). Matching logic is therefore N/A for current-state duplicate detection — no field to match on.
- After Round 12 Step 1 migration, confidenceLevel will be source-based per Q-Sh1; future audits use that enum.

**Class-3 claims matching:**
- Current `sustainabilityCerts` arrays and rulebook-described per-claim booleans are encoding the same underlying claims. Audit treats them as semantically equivalent during duplicate detection.
- Future per-claim nested-object form (Path C) doesn't yet exist in the catalog; audit operates on current `sustainabilityCerts` array form.

### Subsequent architectural decisions (added 2026-05-20)

Following the four foundational reconciliations above, additional architectural decisions landed during the same operator + Opus session that extend the framework. Cross-references for future readers:

- **Cost-architecture reframe** — catalog cost as indicative reference, not authoritative; four-layer roadmap from catalog → vendor → formulation → inventory — captured at [docs/architecture/cost-and-vendor-architecture.md](../architecture/cost-and-vendor-architecture.md).
- **Manufacturer/vendor distinction** — catalog truth = manufacturer-verified; vendor = operator-layer per-operator data — captured in the same document.
- **Five §II.9 / Option Y qualifier-discipline refinements** — regulatory-baseline + borderline-marketing + Organic-overload + positioning-in-naming check + tier-attribution evidence-strength bar — captured at [docs/architecture/catalog-authoring-rulebook.md](../architecture/catalog-authoring-rulebook.md) §9a.

All three artifacts land in the same atomic commit batch following Q-Audit-1 closure 2026-05-20.

---

— §6 appended 2026-05-20 post-resolution. Audit #1 cleared to proceed with matching logic specified above.
