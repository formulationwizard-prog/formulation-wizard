# Audit: Q-Audit-1 Pre-Screen — Per-Pair Routing Classification

**Audit type:** Read-only enumeration. Pre-screen of Audit #1's ~25 same-SKU duplicate pairs + bonus Algae Oil pair + joint-family cross-category pairs surfaced through Q-Audit-3.
**Authored:** 2026-05-20
**Authored-by:** Claude Code (session-bounded, pause-and-surface discipline)
**Reviewed-by:** _pending operator + Opus relay_

**Scope:** Each pair classified into one of four buckets per operator's Q-Audit-1 framing:
- **Bucket 1** — Mechanical-obvious Path A (deprecate clearly inferior)
- **Bucket 2** — Mechanical-obvious Path B (upgrade in place per §38a Miss-mode B)
- **Bucket 3** — Mechanical-obvious rename-both (legitimate tier pair)
- **Bucket 4** — Judgment-required

Plus two exit categories:
- **Deferred** — PENDING-suffix entries deferred to Phase 2 verification queue cadence
- **No-action** — legitimate form variants per §IV.23 (no consolidation needed)

**Safety lock:** Read-only audit. No catalog changes. No commits. Outputs scoped to `docs/audits/`.

---

## Executive summary

**Total pairs pre-screened: 33** (Audit #1's ~25 + bonus Algae Oil + 3 joint-family cross-category + 4 Q-Audit-4 0.5c.vii form variants).

| Bucket | Count | Estimated operator review time |
|---|---|---|
| **Bucket 1 — Path A obvious** | 3 | ~5 min bulk confirm |
| **Bucket 2 — Path B obvious** | 4 | ~10 min bulk confirm (supplier-set union pattern) |
| **Bucket 3 — Rename-both obvious** | 5 | ~10 min bulk confirm |
| **Bucket 4 — Judgment-required** | 17 | ~10-15 min each individually = **2.8-4.25 hours** |
| **Deferred** (Phase 2 queue) | 1 | n/a (separate cadence) |
| **No-action** (legitimate variants) | 4 | n/a |

**Pause-and-surface finding worth flagging up front:** Bucket 4 is meaningfully larger than the audit charter's "probably 1-1.5 hours" estimate suggested. At 17 pairs needing individual judgment × 10-15 min each, the total operator+Opus engagement for Bucket 4 is ~2.8-4.25 hours, not 1-1.5. **Worth calibrating expectations before kickoff.**

Most Bucket 4 pairs cluster on three recurring patterns:
- **Naming-convention discipline questions** (8 pairs: 5 B-vitamins + 3 amino acids) — which naming convention is canonical? Pattern may admit a single architectural decision that resolves multiple pairs at once.
- **Borderline-marketing qualifiers** (2 pairs: Zinc Picolinate "Premium", Selenium "Organic") — §IX.41 AP-09 adjudication.
- **Cross-category seam routing** (4 pairs: 3 joint-family + CoQ10 Ubiquinol) — already routed by Q-Audit-3; remaining work is consolidation per-pair.

If pattern-level decisions land first, Bucket 4 could compress to ~5 pairs of true individual judgment instead of 17. Worth surfacing for routing.

---

## Bucket 1 — Mechanical-obvious Path A (deprecate clearly inferior)

Three pairs. Survivor selection unambiguous per evidence.

### B1.1 — CDP-Choline / Citicoline

| Field | Deprecated | Survivor |
|---|---|---|
| Entry name | `CDP-Choline (Citicoline, Cognizin)` | `Citicoline / CDP-Choline (Cognizin, Kyowa Hakko)` |
| Line | 229 | 398 |
| Category | Fatty Acids | Vitamins (→ Specialty Compounds per Q-Audit-3 0.5c.iv) |
| Cost | $320 | $340 |
| Schema shape | Wave 1 minimal + synonyms | Wave 2 Phase 1 (regulatoryStatus 'NDI-notified' + coaTemplateType + functionalRole + bioactives) |
| Citation | Bare notes | FDA NDI #1196 (Cognizin, acknowledged 2014) |

**Why obvious:** Line 398 has substantively superior schema (Wave 2 Phase 1 shape with structured regulatoryStatus + functionalRole + bioactives + NDI citation). Line 229 is Wave 1 minimal shape with no regulatoryStatus or bioactives. Same branded product (Kyowa Hakko Cognizin). Same supplier set (Kyowa Hakko sole).

**Survivor recommendation:** Keep line 398. Deprecate line 229. Coupled with Q-Audit-3 0.5c.iv migration of line 398 to Specialty Compounds. Preserve line 229's synonyms array (`['cdp-choline', 'citicoline', 'cognizin', 'cytidine diphosphate choline']`) into line 398 before deletion.

### B1.2 — L-Theanine (Suntheanine)

| Field | Deprecated | Survivor |
|---|---|---|
| Entry name | `L-Theanine (Suntheanine, Taiyo)` | `L-Theanine (Suntheanine, Pharma)` |
| Line | 201 | 57 |
| Category | Amino Acids | Amino Acids |
| Cost | $480 | $480 |
| Suppliers | Taiyo + **Zhejiang NHU** | Taiyo (Suntheanine) + NutraScience |

**Why obvious:** Line 201 lists Zhejiang NHU as a Suntheanine supplier — but Taiyo International is the **sole licensor of Suntheanine** per Suntheanine branded-form discipline. Zhejiang NHU producing Suntheanine would be a licensing violation. The line 201 supplier attribution is a **catalog data error**, not a legitimate alternative-supplier listing. Line 57's Taiyo + NutraScience supplier set is correct (NutraScience distributes Taiyo-licensed Suntheanine).

**Survivor recommendation:** Keep line 57. Deprecate line 201. The Zhejiang NHU supplier listing on line 201 should NOT migrate to survivor (it's the data error).

### B1.3 — MCC PH-102

| Field | Deprecated | Survivor |
|---|---|---|
| Entry name | `Microcrystalline Cellulose (MCC PH-102, Larger)` | `Microcrystalline Cellulose (MCC, PH-102)` |
| Line | 320 | 107 |
| Category | Excipients | Excipients |
| Cost | $6.80 | $6.50 |
| Suppliers | FMC BioPolymer (Avicel) + Asahi Kasei | JRS Pharma (VIVAPUR) + Asahi Kasei (Ceolus) + FMC BioPolymer (Avicel) + DuPont |

**Why obvious:** Line 107 has broader supplier set (4 suppliers vs 2), marginally lower cost, and identical PH-102 grade. Line 320's `"Larger"` qualifier is **redundant per MCC grade convention** — PH-102 IS the larger-particle (100 µm) standard grade (PH-101 is 50 µm; PH-200 is 200 µm). The qualifier adds no information and is non-compliant with §II.9 (parenthetical clauses should encode verifiable structured-field values, not redundant descriptors).

**Survivor recommendation:** Keep line 107. Deprecate line 320. Supplier set union not needed (line 107 already has broader set).

---

## Bucket 2 — Mechanical-obvious Path B (upgrade in place per §38a Miss-mode B)

Four pairs. Newer-shape entry is structural survivor; older entries' substantive content (supplier sets, citations, MW derivations) preserves into survivor before deletion.

### B2.1 — Curcumin 95% Sabinsa C3 (triple-entry)

| Field | Deprecated #1 | Deprecated #2 | Survivor |
|---|---|---|---|
| Entry name | `Turmeric Extract (95% Curcuminoids)` | `Turmeric Extract (Curcumin 95%, Sabinsa C3)` | `Curcumin 95% (Sabinsa C3 Complex, Branded)` |
| Line | 65 | 233 | 458 |
| Category | Herbal Extracts | Botanicals | Herbal Extracts |
| Cost | $85 | $68 | $180 |
| Schema shape | Wave 1 minimal | Wave 2 Phase 1 minimal | Wave 3 Phase 3a full shape (regulatoryStatus + pharmacopeialReference + coaTemplateType + functionalRole + bioactives 95/91/77 ratio) |
| Suppliers | Sabinsa C3 + Indena Meriva + Naturex + Verdure BCM-95 | Sabinsa C3 + Indena Meriva + Arjuna Natural | Sabinsa (C3 Complex) sole |

**Why Path B fits:** Line 458 has Wave 1.5+ shape but **fewer suppliers** (Sabinsa sole) than older entries. The Sabinsa C3 Complex IS Sabinsa-only branded — line 458 supplier set is correct for the branded form. But the older entries listed additional suppliers because they were ambiguously-named (both branded C3 and generic 95% conflated). Path B: line 458 stays as branded-form survivor; the generic 95% curcumin from line 65/233 covered by **Curcumin 95% (Commodity Tier, Generic) [line 457]** (already authored in Wave 3 Phase 3a as the canonical commodity entry).

**Upgrade target:** Line 458. Content to preserve: nothing — line 458 is shape-current and correctly sole-supplier-attributed for Sabinsa C3.

**Note:** The generic 95% curcumin operators previously found via lines 65/233 now resolves to line 457 (commodity tier). Cost gap ($50 line 457 vs $180 line 458) reflects branded-vs-commodity legitimately.

### B2.2 — Curcumin Meriva (pair)

| Field | Deprecated | Survivor |
|---|---|---|
| Entry name | `Curcumin Phytosome (Meriva, Indena)` | `Curcumin Meriva (Indena, Phytosome with Soy Lecithin)` |
| Line | 234 | 460 |
| Category | Botanicals | Herbal Extracts |
| Cost | $180 | $320 |
| Schema shape | Wave 2 Phase 1 minimal | Wave 3 Phase 3a full shape (regulatoryStatus 'NDI-notified' + pharmacopeialReference + bioactives 20% curcuminoids phytosome-bound) |
| Allergens | Soybeans | Soybeans |
| Suppliers | Indena (Meriva) | Indena (Meriva) |

**Why Path B fits:** Same product (Indena Meriva). Same supplier. Same allergen. Line 460 has Wave 1.5+ shape + FDA NDI citation. Line 234 is minimal shape. No supplier-set union needed (same sole supplier).

**Upgrade target:** Line 460. Content to preserve from line 234: nothing substantive (line 460 already comprehensive).

**Cost-gap note:** Line 460's $320 vs line 234's $180 is notable. Line 460 cost may be more current; worth verifying during 0.5c work but not a blocker.

### B2.3 — Saw Palmetto Extract (triple-entry)

| Field | Deprecated #1 | Deprecated #2 | Survivor |
|---|---|---|---|
| Entry name | `Saw Palmetto Extract (85% Fatty Acids, CO₂)` | `Saw Palmetto Extract (85–95% Fatty Acids)` | `Saw Palmetto (Serenoa repens, 85% Fatty Acids/Sterols, CO2-Extracted)` |
| Line | 70 | 248 | 466 |
| Category | Herbal Extracts | Botanicals | Herbal Extracts |
| Cost | $180 | $180 | $120 |
| Schema shape | Wave 1 minimal | Wave 2 Phase 1 minimal | Wave 3 Phase 3a full shape (regulatoryStatus + pharmacopeialReference USP-NF + coaTemplateType + functionalRole + bioactives 85% total fatty acids and sterols via GC-FID) |
| Suppliers | Indena + Euromed + Valensa International | Euromed + Indena (ProstaAid) + Valensa (USPlus) | Indena + Euromed + Naturex |

**Why Path B fits:** Same pattern as Curcumin B2.1 — Wave-3 entry is shape-current. Supplier-set union surfaces 5 unique suppliers across the three entries: Indena, Euromed, Valensa International / Valensa USPlus (same Valensa, different sub-brand), Indena ProstaAid (sub-brand), Naturex. Survivor's set (Indena + Euromed + Naturex) is missing **Valensa**.

**Upgrade target:** Line 466. Content to preserve: **add Valensa to supplier set** (with disambiguation between USPlus and ProstaAid sub-brand naming — likely "Valensa (USPlus)" per current industry-standard naming).

### B2.4 — Bromelain (cross-category)

| Field | Deprecated | Survivor |
|---|---|---|
| Entry name | `Bromelain (Pineapple, 2400 GDU/g)` | `Bromelain (GDU/g 2,400, from Pineapple)` |
| Line | 305 | 85 |
| Category | Antioxidants | Enzymes (per Q-Audit-3 0.5c.ii primary-mechanism call) |
| Cost | $160 | $180 |
| Schema shape | Wave 2 Phase 1 minimal | Wave 1 minimal |
| Suppliers | Sabinsa + Enzyme Development Corporation | Enzymatic Deutschland (Brom-mine) + Specialty Enzymes + Deerland Enzymes |

**Why Path B fits:** Same 2400 GDU/g standardization. Per Q-Audit-3 0.5c.ii routing, Enzymes is the canonical category (per §III.18 primary-mechanism). Line 85 wins category placement. But line 305's supplier set (Sabinsa + Enzyme Development Corporation) is **substantively additional** — those suppliers don't appear on line 85.

**Upgrade target:** Line 85. Content to preserve: **add Sabinsa + Enzyme Development Corporation to supplier set** (line 85 becomes 5-supplier entry).

---

## Bucket 3 — Mechanical-obvious rename-both (legitimate tier pair)

Five pairs. Cost gap + supplier-set distinction indicates legitimate tier pair, but current names don't encode the tier per §II.9. Pattern: rename both entries with explicit tier qualifier following Wave-2-Phase-1 pattern (e.g., `(USP, Pharmaceutical-Grade)` vs `(USP, Commodity Sourcing)`).

### B3.1 — Magnesium Oxide pair

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name (current) | `Magnesium Oxide (USP)` | `Magnesium Oxide (USP)` |
| Line | 42 | 162 |
| Cost | $4.20 | $1.80 |
| Cost ratio | 2.3x | (commodity baseline) |
| Suppliers | Dr. Paul Lohmann + Magnesia GmbH + Premier Magnesia | Martin Marietta Magnesia + RHI Magnesita + Premier Magnesia |

**Rename proposal:**
- Line 42 → `Magnesium Oxide (USP, Pharmaceutical-Grade)`
- Line 162 → `Magnesium Oxide (USP, Commodity Sourcing)`

Tier differentiation rationale: cost gap + supplier-tier difference (Dr. Paul Lohmann is pharma-grade specialist; Martin Marietta is commodity-mining-source).

### B3.2 — Magnesium Citrate pair

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name (current) | `Magnesium Citrate (USP)` | `Magnesium Citrate (USP)` |
| Line | 43 | 163 |
| Cost | $7.80 | $6.80 |
| Suppliers | Jungbunzlauer + Gadot Biochemical + Dr. Paul Lohmann | Jungbunzlauer + Global Calcium + Dr. Paul Lohmann |

**Rename proposal:**
- Line 43 → `Magnesium Citrate (USP, Pharmaceutical-Grade)`
- Line 163 → `Magnesium Citrate (USP, Commodity Sourcing)`

Modest cost gap; supplier-set overlap (Jungbunzlauer + Dr. Paul Lohmann common). Tier difference is less stark than Mg Oxide but real.

### B3.3 — Calcium Citrate pair

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name (current) | `Calcium Citrate (USP)` | `Calcium Citrate (USP)` |
| Line | 40 | 157 |
| Cost | $8.50 | $4.50 |
| Cost ratio | 1.9x | (commodity baseline) |
| Suppliers | Jungbunzlauer + Gadot Biochemical + Dr. Paul Lohmann | Jungbunzlauer + Balchem + Gadot Biochemical |

**Rename proposal:**
- Line 40 → `Calcium Citrate (USP, Pharmaceutical-Grade)`
- Line 157 → `Calcium Citrate (USP, Commodity Sourcing)`

### B3.4 — Copper Gluconate pair

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name (current) | `Copper Gluconate (USP)` | `Copper Gluconate (USP)` |
| Line | 49 | 180 |
| Cost | $42 | $28 |
| Suppliers | Jungbunzlauer + Dr. Paul Lohmann + Gadot Biochemical | Dr. Paul Lohmann + Jungbunzlauer |

**Rename proposal:**
- Line 49 → `Copper Gluconate (USP, Pharmaceutical-Grade)`
- Line 180 → `Copper Gluconate (USP, Commodity Sourcing)`

### B3.5 — Potassium Iodide pair

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name (current) | `Potassium Iodide (USP, Food-Grade)` | `Potassium Iodide (USP)` |
| Line | 51 | 190 |
| Cost | $58 | $38 |
| Suppliers | Deepwater Chemicals + Iofina Chemical + SQM | Dr. Paul Lohmann + SQM |

**Rename proposal:**
- Line 51 → `Potassium Iodide (USP, Pharmaceutical-Grade)` (current "Food-Grade" qualifier replaced — Food-Grade is the GRAS designation, not a tier indicator per §II.9; both entries are food-grade-suitable)
- Line 190 → `Potassium Iodide (USP, Commodity Sourcing)`

**Note:** "Food-Grade" qualifier on line 51 should be replaced rather than preserved. Per §II.9, parenthetical clauses encode tier or differentiation; "Food-Grade" is the regulatory baseline for ALL supplement-grade iodide. Worth surface-back if "Food-Grade" should be retained for clarity in operator-facing display.

---

## Bucket 4 — Judgment-required

Seventeen pairs. Each needs operator+Opus call. Grouped by recurring pattern for batch routing efficiency.

### B4 Pattern 1 — Naming-convention discipline question (8 pairs: 5 B-vitamins + 3 amino acids)

**The pattern:** Wave 1 entries use `Vitamin BN (Form ...)` naming convention. Wave 2 Phase 1 entries use `Form (BN, USP)` or `Form (USP)` naming convention. Significant cost gaps suggest tier differentiation, but naming doesn't reflect it.

**Single architectural question that resolves all 8 pairs:**

> Which naming convention is canonical per §II.9?
> - **Option A:** `Vitamin BN (Form, Tier)` — vitamin-prefixed framing (Wave 1 pattern)
> - **Option B:** `Form (BN, USP, Tier)` — form-first framing (Wave 2 Phase 1 pattern)
> - **Option C:** Both legitimate; the differentiation IS the convention (tier-pair-with-different-naming-conventions becomes a §II.9 valid encoding)

Recommend Option B per chemistry-first / form-first discipline. Per §II.9 example: `Vitamin B12 (Cyanocobalamin 1% on Mannitol)` — Wave 1 uses Vitamin BN prefix but with form qualifier. Wave 2's `Cyanocobalamin (B12, USP)` flips to form-first. Industry convention is mixed; PA review packets typically use form-first.

**The 8 pairs (resolved by single decision):**

| # | Substance | Wave 1 entry | Wave 2 entry | Cost gap |
|---|---|---|---|---|
| B4.1.1 | Thiamine (B1) | `Vitamin B1 (Thiamine HCl)` [line 21, $180] | `Thiamine HCl (B1, USP)` [line 130, $58] | 3.1x |
| B4.1.2 | Niacinamide (B3) | `Vitamin B3 (Niacinamide USP)` [line 23, $45] | `Niacinamide (B3, USP)` [line 133, $18] | 2.5x |
| B4.1.3 | Calcium Pantothenate (B5) | `Vitamin B5 (Calcium d-Pantothenate)` [line 24, $85] | `d-Calcium Pantothenate (B5, USP)` [line 138, $32] | 2.7x |
| B4.1.4 | Pyridoxine HCl (B6) | `Vitamin B6 (Pyridoxine HCl)` [line 25, $120] | `Pyridoxine HCl (B6, USP)` [line 140, $38] | 3.2x |
| B4.1.5 | P5P Active B6 | `Vitamin B6 P-5-P (Pyridoxal-5-Phosphate)` [line 26, $680] | `Pyridoxal 5-Phosphate (P5P, Active B6)` [line 141, $145] | 4.7x |
| B4.1.6 | L-Lysine HCl | `L-Lysine HCl (Pharma Grade, 78%)` [line 54, $8] | `L-Lysine HCl (USP)` [line 200, $14] | 0.6x (inverted) |
| B4.1.7 | L-Citrulline Malate | `L-Citrulline Malate 2:1` [line 56, $52] | `L-Citrulline Malate 2:1 (USP)` [line 199, $32] | 1.6x |
| B4.1.8 | Taurine | `Taurine (USP, Crystalline)` [line 58, $14] | `Taurine (USP)` [line 208, $8.50] | 1.6x |

**Subtle note on B4.1.5 (P5P):** 4.7x cost gap is the largest in this group and may indicate **genuine quality-tier difference**, not just naming-convention discipline. Worth checking during 0.5b execution whether the cost gap is sustainably tier-real OR transcription drift.

**Subtle note on B4.1.6 (Lysine):** Cost gap **inverted** — Wave 1 entry is CHEAPER despite "Pharma Grade" framing. Likely indicates line 54 is mislabeled "Pharma Grade" when it's actually commodity-sourced, OR pricing data is stale. Worth flagging for operator review.

**Bulk-resolution path:** Pick Option A/B/C above; apply to all 8 pairs uniformly with tier qualifier (Pharmaceutical-Grade vs Commodity Sourcing) added per Bucket 3 pattern. Reduces 8 individual decisions to 1 architectural call + 8 mechanical renames.

### B4 Pattern 2 — Borderline-marketing qualifier (§IX.41 AP-09 adjudication) (2 pairs)

**B4.2.1 — Zinc Picolinate "Premium"**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Zinc Picolinate (USP)` | `Zinc Picolinate (Premium)` |
| Line | 46 | 172 |
| Cost | $68 | $38 |
| Elemental Zn | 20% | 21% |
| Suppliers | Dr. Paul Lohmann + Gadot Biochemical + Balchem | Thorne Research + Jarrow Formulas Bulk |

**Question:** "Premium" qualifier on line 172 is borderline marketing per §IX.41 AP-09 (no quality-tier semantics; reads as aspirational). Options:
- **(a)** Rename line 172 to explicit tier (`(Bulk, Specialty Brand)` or similar — what bulk-specialty tier framing applies?)
- **(b)** Consolidate to single entry; line 46 survives (no "Premium" claim)
- **(c)** Both retained with tier-naming renames per Bucket 3 pattern

Also subtle: cost INVERSION (line 172 "Premium" is CHEAPER) suggests the naming is misleading regardless.

**B4.2.2 — Selenium L-Selenomethionine "Organic"**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Selenium L-Selenomethionine (USP)` | `Selenomethionine (Organic Selenium)` |
| Line | 48 | 186 |
| Cost | $520 | $320 |
| Suppliers | Pharma Nord + NSF Biotech + Dr. Paul Lohmann | Lalmin Se (Lallemand) + Alltech + Sabinsa |

**Question:** "Organic Selenium" qualifier on line 186 is ambiguous — does it mean USDA Organic (Class-3 buyer-requirement) OR "organic-chemistry" meaning (organic compound vs. inorganic salt — distinguishing from sodium selenite)? Line 186 notes ("Organic Se. 200 mcg typical.") suggest the latter (organic-chemistry meaning). Options:
- **(a)** Rename line 186 to clarify: `Selenomethionine (Organic-Compound Se, USP)` — explicit chemistry framing
- **(b)** Rename line 186 differently: `Selenomethionine (Premium, Selenium-Yeast Source)` — Lalmin / Alltech are yeast-source specialists
- **(c)** Consolidate to line 48; line 186 deprecated
- **(d)** Both retained per tier-pair pattern

Worth flagging: line 186 supplier set (Lalmin Se / Alltech / Sabinsa) is **substantively distinct** from line 48 (Pharma Nord / NSF Biotech / Dr. Paul Lohmann) — these are different supplier ecosystems (Lalmin = selenium-yeast specialist; Pharma Nord = pharmaceutical-grade specialist). Likely legitimate tier pair, just badly named.

### B4 Pattern 3 — Cross-category seam routing (4 pairs: 3 joint-family + 1 CoQ10)

**Already routed by Q-Audit-3 to migrate to canonical category (Specialty Compounds for joint-family per Q-Audit-3 0.5c.i; CoQ10 Ubiquinol per primary-mechanism call).** Remaining work per-pair is consolidation routing within the target category.

**B4.3.1 — Glucosamine Sulfate Potassium**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Glucosamine Sulfate 2KCl (USP)` | `Glucosamine Sulfate Potassium (USP)` |
| Line | 91 | 295 |
| Category (current) | Specialty Compounds | Specialty |
| Cost | $24 | $12 |
| Allergens | Shellfish | Crustacean Shellfish |
| Suppliers | Pfizer CentroVet + CJ CheilJedang + Zhejiang Aoxing | TSI USA + Rottapharm (Dona) |

**Question:** Per Q-Audit-3 0.5c.i, both migrate to Specialty Compounds. Consolidation routing within Specialty Compounds: which survives?
- Line 91 has "2KCl" naming (explicit potassium-chloride stabilization).
- Line 295 has cleaner "Sulfate Potassium" naming + Rottapharm Dona supplier (European clinical-evidence-distinct brand).
- Cost gap 2x suggests tier difference but no explicit tier in name.

Options:
- **(a)** Path A consolidate: pick survivor (likely line 295 for cleaner naming + Dona brand) + supplier-set union
- **(b)** Path B preservation: pick survivor + careful preservation of line 91's allergen framing + cost data
- **(c)** Rename-both per tier (Bucket 3 pattern): `Glucosamine Sulfate 2KCl (USP, Pharmaceutical-Grade)` + `Glucosamine Sulfate Potassium (USP, Commodity / Dona)`

**B4.3.2 — Chondroitin Sulfate**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Chondroitin Sulfate Sodium (Bovine, 90%)` | `Chondroitin Sulfate 90% (Bovine, USP)` |
| Line | 92 | 296 |
| Category (current) | Specialty Compounds | Specialty |
| Cost | $48 | $32 |
| Suppliers | Bioiberica + PB Leiner + CJ CheilJedang | TSI USA + Bioiberica |

**Question:** Same shape as B4.3.1. Path A vs Path B vs Rename-both.

**B4.3.3 — MSM**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `MSM (Methylsulfonylmethane, OptiMSM)` | `MSM (Methylsulfonylmethane, USP)` |
| Line | 93 | 297 |
| Category (current) | Specialty Compounds | Specialty |
| Cost | $18 | $9.80 |
| Suppliers | Bergstrom Nutrition (OptiMSM) + Balchem | Bergstrom Nutrition (OptiMSM) + Cardinal Nutrition |

**Question:** Same shape as B4.3.1 + B4.3.2. Note: BOTH entries reference Bergstrom Nutrition (OptiMSM) branded form. Likely line 93 is OptiMSM-only branded; line 297 mixes OptiMSM with Cardinal generic. Consolidation may need to separate branded-vs-generic.

**B4.3.4 — CoQ10 Ubiquinol**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `CoQ10 Ubiquinol (Reduced Active Form)` | `CoQ10 Ubiquinol (Kaneka QH, Reduced Form)` |
| Line | 90 | 267 |
| Category (current) | Specialty Compounds | Antioxidants |
| Cost | $720 | $580 |
| Suppliers | Kaneka (KanekaQH) + Mitsubishi Gas Chemical | Kaneka (QH) sole |

**Question:** Both reference Kaneka QH branded form. Per §III.18 primary-mechanism, antioxidant IS the load-bearing mechanism — line 267's Antioxidants category MAY be correct. Question: (a) Specialty Compounds wins per existing convention (CoQ10 ubiquinone at line 89 + line 266 are both Specialty Compounds); (b) Antioxidants wins per primary-mechanism; (c) split the category families (ubiquinone Specialty / ubiquinol Antioxidants — strange but possible).

**Note:** This is a Round 12-class category decision separate from the per-pair consolidation. Worth surfacing.

### B4 Pattern 4 — Subtle tier-pair-or-consolidate (5 pairs)

**B4.4.1 — Mg Stearate**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Magnesium Stearate (Vegetable Grade)` | `Magnesium Stearate (Vegetable)` |
| Line | 108 | 325 |
| Cost | $12 | $6.50 |
| Suppliers | Peter Greven Food Tech + Faci Asia Pacific + IOI Oleo | Peter Greven + Faci Asia + Mallinckrodt |

**Question:** Naming differs only in `(Grade)` suffix. Cost gap 1.8x. Suppliers partial-overlap. Could be rename-both per Bucket 3 OR consolidate. The "Vegetable Grade" qualifier MAY be the implicit tier indicator already (line 108 = pharma; line 325 = commodity). Worth confirming.

**B4.4.2 — Vitamin D3 Vegan Lichen**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Vitamin D3 Cholecalciferol (Vegan, Lichen)` | `Vitamin D3 Vegan (Lichen-Sourced)` |
| Line | 33 | 122 |
| Cost | $1100 | $1200 |
| Suppliers | Kappa Bioscience (K2VITAL D3) + Nordic Naturals Industrial + MicrobioCos | Vitashine (ESB Developments) + Lumi Vegan D3 |

**Question:** Naming differs slightly. Suppliers ENTIRELY DIFFERENT (no overlap). Cost gap modest (1.1x). Both are lichen-source vegan D3 — same chemistry. Likely tier pair (Kappa Bioscience is pharma-grade specialist; Vitashine is consumer-direct brand) OR consolidation candidate.

Worth flagging: this might genuinely be **two different lichen-D3 supplier-ecosystem tier products**, not a duplicate.

**B4.4.3 — Vitamin K2 MK-7**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Vitamin K2 MK-7 (Natto, 0.2% on MCC)` | `Vitamin K2 MK-7 (NattoPharma, 2%)` |
| Line | 36 | 128 |
| Cost | $6500 | $1500 |
| Cost ratio | 4.3x | (commodity baseline) |
| potencyFactor | 0.002 | (not present) |
| Suppliers | Kappa Bioscience (K2VITAL) + NattoPharma (MenaQ7) + Gnosis by Lesaffre | NattoPharma (MenaQ7) + Kappa Bioscience + Gnosis by Lesaffre |

**Question:** Line 36 explicitly shows the **carrier-loaded form** (0.2% on MCC with potencyFactor 0.002 per §II.10). Line 128 names "2%" which is the **standardization** (concentration of MK-7 in extract). These are NOT the same product — line 36 is the carrier-diluted finished commercial form for tablet/capsule formulation; line 128 is the higher-potency raw concentrate.

**This may actually be a legitimate form variant per §IV.23 (carrier-loaded vs concentrated), NOT a duplicate.** Should reclassify as **No-action** (legitimate variant) if confirmed. Worth grep-verifying potencyFactor presence on line 128 to confirm.

**B4.4.4 — L-Arginine HCl**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `L-Arginine HCl (USP)` | `L-Arginine HCl (USP)` |
| Line | 55 | 198 |
| Cost | $28 | $24 |
| Suppliers | Ajinomoto + CJ CheilJedang + Kyowa Hakko | Kyowa Hakko + Ajinomoto + Evonik |

**Question:** Identical naming. Modest cost gap. Suppliers overlap (Ajinomoto + Kyowa). Each has one distinct supplier (CJ CheilJedang on 55; Evonik on 198). Consolidate via supplier-set union OR rename-both (Pharmaceutical-Grade vs Commodity) per Bucket 3 pattern?

**B4.4.5 — Creatine Monohydrate Creapure**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Creatine Monohydrate (Creapure, USP)` | `Creatine Monohydrate (Creapure)` |
| Line | 60 | 205 |
| Cost | $14 | $22 |
| Suppliers | AlzChem (Creapure) + Kyowa Hakko + NutraBio | AlzChem (Creapure) + Goldwell Pharma + GNC Bulk |

**Question:** Cost gap **inverted** (Wave 1 cheaper than Wave 2). Both AlzChem Creapure-branded. Suppliers partial-overlap (AlzChem common). Consolidate or rename-both?

**Note:** AlzChem is sole licensor of Creapure. Both entries list non-AlzChem additional suppliers (Kyowa + NutraBio; Goldwell + GNC Bulk) — these are **distributors of Creapure**, not separate Creapure producers. Worth verifying whether all named additional suppliers have current AlzChem distributorship agreements (similar shape to the Suntheanine Zhejiang NHU finding in B1.2).

### B4 Pattern 5 — Trivial naming difference (1 pair)

**B4.5.1 — L-Carnitine Tartrate**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `L-Carnitine L-Tartrate (USP)` | `L-Carnitine Tartrate (USP)` |
| Line | 61 | 203 |
| Cost | $55 | $48 |
| Suppliers | Lonza (Carnipure) + Northeast Pharmaceutical + Kyowa Hakko | Lonza (Carnipure) + Northeast Pharmaceutical |

**Question:** Naming differs only in `L-Tartrate` vs `Tartrate`. Same substance. Supplier set distinguishes (Kyowa Hakko on line 61). Modest cost gap. Likely consolidate via supplier-set union — but the small difference + Lonza Carnipure branded suggests possibly Bucket 1 (Path A consolidate to line 61 as fuller-supplier entry).

### B4 Pattern 6 — Chromium Picolinate huge cost gap (1 pair)

**B4.6.1 — Chromium Picolinate ChromeMate**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Chromium Picolinate (USP)` | `Chromium Picolinate (ChromeMate, USP)` |
| Line | 50 | 183 |
| Cost | $480 | $68 |
| Cost ratio | 7x | (branded baseline) |
| Suppliers | Nutrition 21 (Chromax) + Dr. Paul Lohmann + Merck KGaA | Nutrition 21 (Chromax) + InterHealth (ChromeMate) |

**Question:** 7x cost gap is the largest in the audit. Line 50 lists Nutrition 21 (Chromax brand) + commodity suppliers; line 183 explicitly names ChromeMate (InterHealth) — a SEPARATE brand from Chromax. These may be TWO LEGITIMATE BRANDED FORMS (Chromax vs ChromeMate, two distinct branded chromium picolinates), poorly named on both sides. Worth surfacing as triple-routing:
- **(a)** Path A consolidate to Chromax (line 50, Nutrition 21 sole supplier post-cleanup)
- **(b)** Path B preserve both as separate ChromeMate / Chromax branded entries (rename to clarify branding on both sides)
- **(c)** Rename one as commodity tier + one as branded

Likely (b) — both are legitimate branded forms; current naming conflates them.

### B4 Pattern 7 — Algae Oil DHA pair (1 pair)

**B4.7.1 — Algae Oil DHA/EPA vs Algal DHA Life's DHA**

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Algae Oil DHA/EPA (Vegan, Schizochytrium)` | `Algal DHA Oil (Life's DHA, DSM)` |
| Line | 104 | 220 |
| Category | Omega-3s | Omega-3s |
| Cost | $95 | $120 |
| Suppliers | DSM (life'sOMEGA) + Corbion (AlgaPrime) + Evonik (Veramaris) | DSM (Life's DHA) + Corbion (AlgaPrime) |

**Question:** Same Schizochytrium algal source. Supplier overlap (DSM + Corbion common). Line 220 names "Life's DHA" specifically; line 104 mentions "life'sOMEGA" — these are **DIFFERENT DSM BRANDED LINES**. Life's DHA is DSM's DHA-focused product; life'sOMEGA is DSM's broader EPA+DHA product. So line 104 is the EPA+DHA broader product; line 220 is the DHA-only specific product.

**Could be legitimate form variants (DHA-only vs EPA+DHA), NOT a duplicate.** Worth surface-back. If confirmed, reclassify as **No-action** (legitimate variant).

---

## Deferred

### D1 — L. acidophilus NCFM CFU discrepancy

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Lactobacillus acidophilus NCFM (50 Billion CFU/g)` | `Lactobacillus acidophilus NCFM (Danisco — 10B CFU, PENDING POTENCY VERIFICATION)` |
| Line | 80 | 281 |
| CFU | 50B | 10B |

**Status:** PENDING-suffix per [[project_phase_2_verification_queue]]. Per Q-Audit-5 routing, deferred to Phase 2 verification queue cadence — NOT in Step 0.5 scope. Resolution waits for PA verification of which CFU value is supplier-spec-correct.

---

## No-action — Legitimate form variants per §IV.23

These were noted in Audit #1 as "appears to be a duplicate" but per §IV.23 valid differentiation analysis are **legitimate form variants**. No consolidation needed; no rename needed.

### NA1 — Fish Oil 18/12 form variants

- `Fish Oil 18/12 (EPA/DHA, Triglyceride)` [line 101, TG, $22]
- `Fish Oil 18/12 EE (Concentrated)` [line 216, EE, $35]

TG vs EE is distinct chemistry per §IV.23 (different bioavailability profiles). Legitimate.

### NA2 — Fish Oil 40/20 form variants

- `Fish Oil 40/20 (Concentrated EPA/DHA, Ethyl Ester)` [line 102, EE, $65]
- `Fish Oil 40/20 TG (Triglyceride Form)` [line 218, TG, $72]

Same TG-vs-EE distinction. Legitimate.

### NA3 — Flaxseed Oil conventional vs organic

- `Flaxseed Oil (Organic, Cold-Pressed)` [line 224 — wait, this IS organic-named already? Confirming]

Actually, on closer inspection of line 224: the entry is `Flaxseed Oil (Organic, Cold-Pressed)` (claims organic) but at $12 cost lower than line 378's `Flaxseed Oil (Organic, Cold-Pressed)` at $18. **Both claim Organic**, both same description.

**Reclassification:** This is actually a **same-SKU duplicate**, NOT no-action. Adds 1 to Bucket 4 work. Flagging as B4.8.1 below.

Let me also check line 224's content vs line 378 — line 224's notes say "ALA omega-3 vegetarian. Conversion to EPA/DHA minimal." Line 378's notes say "USDA Organic cold-pressed flaxseed oil. Vegetarian ALA omega-3 source." Both organic; line 378 has organic certification structured fields (organicAvailable: true + sustainabilityCerts: ['usda-organic', 'non-gmo-verified', 'kosher']) while line 224 does NOT have those structured fields despite the name claiming organic.

**This is a substantive finding:** line 224's name says `(Organic, ...)` but the structured fields don't carry the organic certification. Per [[feedback_sku_name_matches_field_data]] — SKU display names must match underlying field data — line 224 has a **naming-vs-field discrepancy** that's a harm-critical silent-failure concern.

### B4.8.1 (NEW pair surfaced during pre-screen) — Flaxseed Oil Organic naming-vs-fields discrepancy

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Flaxseed Oil (Organic, Cold-Pressed)` | `Flaxseed Oil (Organic, Cold-Pressed)` |
| Line | 224 | 378 |
| Cost | $12 | $18 |
| `organicAvailable` field | Not present | true |
| `sustainabilityCerts` field | Not present | ['usda-organic', 'non-gmo-verified', 'kosher'] |
| Suppliers | Bioriginal Food + Jarrow Formulas Bulk | Barlean's Organic + Spectrum Organic + Nutiva Organic |

**Question:** Per [[feedback_sku_name_matches_field_data]], line 224's "(Organic, ...)" naming claim is unsupported by structured fields. Two options:
- **(a)** Line 224 is the conventional/non-organic flaxseed oil mis-named — rename to `Flaxseed Oil (Conventional, Cold-Pressed)` + fix structured fields. Line 378 keeps Organic naming.
- **(b)** Line 224 is genuinely organic but missing structured-field backfill — add `organicAvailable: true` + `sustainabilityCerts` to line 224, then both are legitimate tier pairs (different supplier ecosystems).
- **(c)** Consolidate to line 378 (which has correct structured fields) and deprecate line 224.

This is a harm-critical-floor adjacent finding (silent-failure pathway — operator pastes "Flaxseed Oil Organic" and gets one or the other entry without knowing whether organic certification is verified).

**Adds to Bucket 4 count: 17 → 18 pairs.**

### NA4 — Hemp Seed Oil

- `Hemp Seed Oil (Organic, Unrefined)` [line 379]

Single entry. No pair found. Stays in Fatty Acids per Q-Audit-4 (3:1 omega-6:omega-3 ratio, omega-6-dominant).

### NA5 — Krill Oil Superba 2 (post-0.5c.vii)

- `Krill Oil (Superba, Phospholipid-Bound)` [line 103, Aker BioMarine Superba + Enzymotec K-REAL + Neptune Technologies]
- `Krill Oil (Superba 2, Aker BioMarine)` [line 219, Aker BioMarine Superba 2 + Rimfrost]

Superba vs Superba 2 are **brand evolution** (Aker's product generations). Same Antarctic krill source. Different brand-version supplier sets. Could be legitimate brand-evolution tier-pair OR consolidation candidate.

**Actually adds to Bucket 4:** B4.9.1.

| Field | Entry #1 | Entry #2 |
|---|---|---|
| Entry name | `Krill Oil (Superba, Phospholipid-Bound)` | `Krill Oil (Superba 2, Aker BioMarine)` |
| Line | 103 | 219 |
| Cost | $180 | $240 |
| Suppliers | Aker BioMarine (Superba) + Enzymotec (K-REAL, Frutarom) + Neptune Technologies | Aker BioMarine (Superba 2) + Rimfrost |

**Question:** Aker's Superba vs Superba 2 are distinct products (Superba 2 is the newer-generation higher-PL-content product). Three options:
- **(a)** Keep both as legitimate brand-version tier pair; rename for clarity (e.g., `Krill Oil (Aker Superba, Gen 1)` + `Krill Oil (Aker Superba 2, Gen 2)`)
- **(b)** Consolidate to Superba 2 (newer-gen survivor) with Enzymotec/Neptune/Rimfrost supplier-set union
- **(c)** Keep both unchanged (current state)

**Adds to Bucket 4 count: 18 → 19 pairs.**

---

## Total tally (revised)

| Bucket | Final count | Note |
|---|---|---|
| **Bucket 1 — Path A obvious** | 3 | CDP-Choline + L-Theanine Suntheanine + MCC PH-102 |
| **Bucket 2 — Path B obvious** | 4 | Curcumin C3 + Curcumin Meriva + Saw Palmetto + Bromelain |
| **Bucket 3 — Rename-both obvious** | 5 | Mg Oxide + Mg Citrate + Ca Citrate + Cu Gluconate + K Iodide |
| **Bucket 4 — Judgment-required** | **19** | (revised up from 17 after pre-screen surfaced Flaxseed Organic discrepancy + Krill Oil Superba/Superba 2) |
| **Deferred** (Phase 2 queue) | 1 | L. acidophilus NCFM CFU |
| **No-action** (legitimate variants) | 2 | Fish Oil 18/12 TG vs EE + Fish Oil 40/20 EE vs TG |

**Total: 34 pair-equivalents pre-screened.**

---

## Pause-and-surface findings during pre-screen

Two new findings surfaced that the original Audit #1 didn't explicitly flag:

**1. Flaxseed Oil Organic naming-vs-fields discrepancy (B4.8.1).** Line 224 carries `(Organic, Cold-Pressed)` in its name but lacks `organicAvailable: true` and `sustainabilityCerts` structured fields. Per [[feedback_sku_name_matches_field_data]] this is a harm-critical silent-failure adjacent concern. Routes to Bucket 4 with three options.

**2. Krill Oil Superba vs Superba 2 brand-version question (B4.9.1).** Both Aker BioMarine but different product generations. Wasn't in Audit #1's explicit duplicate inventory but surfaces during Q-Audit-4 0.5c.vii cross-category enforcement work.

Neither finding requires methodology pivot — both fit Bucket 4. Pause-and-surface trigger NOT required per audit charter (didn't surface a new finding category outside the four buckets). But worth surfacing for operator visibility.

---

## Recommended routing for Bucket 4

Bucket 4's 19 pairs cluster around **6 recurring patterns**, not 19 distinct decisions:

| Pattern | Pairs | Single decision that resolves them |
|---|---|---|
| **Naming-convention discipline** (Wave 1 vs Wave 2 framing) | 8 | Pick canonical naming convention (Option A/B/C per B4 Pattern 1) → apply to all 8 |
| **Borderline-marketing qualifier** (Premium, Organic-Se) | 2 | Per §IX.41 AP-09 rename-or-consolidate decision per pair |
| **Cross-category seam consolidation** (joint + CoQ10) | 4 | Per-pair Path A/B/Rename-both routing |
| **Subtle tier-pair-or-consolidate** | 5 | Per-pair Path A/B/Rename-both routing |
| **Trivial naming difference (L-Tartrate)** | 1 | Likely Bucket 1 on closer review |
| **Harm-critical adjacent (Flaxseed Organic)** | 1 | Priority pair due to silent-failure risk |
| **Brand-version question (Krill Superba/Superba 2)** | 1 | Per-pair Path A/B/Rename-both routing |

**Operator+Opus engagement estimate (revised):**
- **B4 Pattern 1 architectural decision:** ~10-15 min (resolves 8 pairs at once)
- **B4 Patterns 2-6:** ~10-15 min per pair × 11 pairs = 1.8-2.75 hours
- **Total: ~2-3 hours** if Pattern 1 architectural decision compresses 8 pairs to 1 decision

This is closer to the audit charter's "1-1.5 hours" estimate, but still meaningfully over.

---

## What's next

Per operator's Q-Audit-1 framing:

1. **Mechanical-bulk confirmation of Bucket 1 + Bucket 2 + Bucket 3** (~12 pairs total) — ~25 min of operator review against this artifact's evidence per pair.
2. **B4 Pattern 1 naming-convention architectural decision** (resolves 8 pairs at once) — ~10-15 min.
3. **B4 Patterns 2-6 per-pair routing** (11 pairs) — ~1.8-2.75 hours.

Total operator+Opus engagement: ~2.5-3.5 hours to fully lock Q-Audit-1.

After Q-Audit-1 locks, Step 0.5 scope is fully finalized and ready for execution-wave authoring + validator-gated commits.

---

## Audit metadata

**Files read:**
- [lib/data/supplements.ts](../../lib/data/supplements.ts) — pair re-verification via targeted Grep + Read

**Verification methodology:**
- For each Audit #1 pair: re-read both entries in their current line context; verified entry contents match Audit #1's claims; classified per 4-bucket taxonomy with evidence rationale.
- Bonus pair (Algae Oil) per Q-Audit-4: verified line 104 vs line 220.
- Joint-family pairs per Q-Audit-3: verified lines 91/295, 92/296, 93/297.
- Q-Audit-4 0.5c.vii form variants: verified TG vs EE pairings; Superba vs Superba 2 distinction.
- New finding (Flaxseed Organic naming-vs-fields): surfaced via cross-check of name claim vs structured fields per [[feedback_sku_name_matches_field_data]] discipline.

**No code changes. No commits. Outputs scoped to `docs/audits/`. Pause-and-surface discipline applied for 2 new findings within existing 4-bucket taxonomy.**

— Q-Audit-1 pre-screen complete. Standing by for operator + Opus routing on the 3 mechanical buckets + 19 Bucket 4 pairs (or 6 pattern decisions if Pattern 1 architectural call compresses Bucket 4).
