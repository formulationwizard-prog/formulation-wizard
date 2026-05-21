# Audit: Duplicate-SKU Sweep across Substance Families

**Audit type:** Read-only enumeration. Audit #1 in the unattended Round-12-scoping series. No code changes; no commits.
**Authored:** 2026-05-20
**Authored-by:** Claude Code (session-bounded, pause-and-surface discipline)
**Reviewed-by:** _pending operator + Opus relay_

**Scope:** §38a unscoped-grep methodology applied to `lib/data/supplements.ts` (642 lines, 405 ingredient entries). All substance families specified in audit charter walked; emergent families surfaced during sweep added.

**Q-Sh resolutions applied:** Per §6 of [docs/audits/rulebook-vs-types-drift.md](rulebook-vs-types-drift.md). regulatoryStatus values treated as match-equivalent across casing variants (e.g., `'GRAS'` ≡ `'gras'`); confidenceLevel matching N/A (no entries carry field); `sustainabilityCerts` arrays treated as semantically equivalent to rulebook Class-3 booleans.

**Not in scope:** Per-entry survivor recommendation execution. Catalog modifications. Test backfill. PA-verification queue routing. Those are Round 12 wave work; this audit produces the canonical input list.

---

## Executive summary

**Pause-and-surface trigger fired** at duplicate count ≥ 10 (per audit charter). Final count: **~25 confirmed Same-SKU duplicate pairs + 5 substance-family cross-category splits**. Catalog hygiene work is meaningfully larger than the audit charter anticipated (charter expected step-5-precedent count of ~2-4 cases).

### Finding-class breakdown

| Class | Count | Description |
|---|---|---|
| **Same-SKU duplicates** (need consolidation) | ~25 pairs | Same form, no name-differentiation reflecting tier/source distinction. Per §IV.23 these are saturation-rule violations. |
| **Intentional tier pairs** (legitimate, per `project_supplements_two_wave_ingestion`) | ~12 pairs | Different naming explicitly reflects supplier-tier / sourcing / certification differentiation. Validated by cross-reference annotations in entry notes. |
| **Cross-category splits** (Round 12 cleanup) | 5 substance families | Same substance present in two categories. Mushroom-family pattern (4 families) + Choline-family three-category split. |
| **Legitimate form variants** (no consolidation needed) | Many | Distinct chemistry (ascorbic acid vs sodium ascorbate; folic acid vs methylfolate; pyridoxine HCl vs P5P). |
| **Stripped-name collisions** (Tier-2 normalization risk) | 0 found | No cross-entry collisions where different substances normalize to same string. |

### Routing implication for Round 12

The catalog-wide-deduplication scope this audit surfaces is meaningful but contained. Round 12 should treat it as **a discrete sub-wave** within Step 1 — likely Step 7 or Step 8 — rather than a per-entry case-by-case migration. Each duplicate pair has a clear-evidence survivor selection (schema shape, citation quality, data completeness) that mechanical rules can apply.

The cross-category splits (mushroom family + choline family) are **higher-judgment** work — they touch §III.18 primary-mechanism category-assignment decisions and need operator + Opus framing.

---

## 1. Methodology

### Substance families audited

Walked entries lines 19-504 covering 405 ingredients across these families:

1. **Choline** — bitartrate / alpha-GPC / CDP-choline / phosphatidylcholine / L-threonate / lecithin
2. **Magnesium** — glycinate / citrate / oxide / threonate / malate / bisglycinate / sulfate / chloride / taurate / orotate / stearate / ascorbate
3. **B-vitamins** — B1 thiamine / B2 riboflavin / B3 niacin variants / B5 pantothenate / B6 pyridoxine variants / B7 biotin / B9 folate variants / B12 cobalamin variants
4. **Omega-3 forms** — fish oil EE/TG, krill oil, algae oil, flax oil, evening primrose, borage, hemp seed
5. **Probiotic strains** — strain-ID formatting across L. acidophilus / L. rhamnosus / L. plantarum / B. animalis lactis / etc.
6. **Curcumin variants** — commodity 95% / Sabinsa C3 / BCM-95 / Meriva phytosome
7. **Caffeine variants** — Anhydrous USP / Green Tea Extract 50%
8. **Melatonin variants** — Crystalline USP / Time-Release HPMC
9. **Calcium** (emergent) — carbonate / citrate / citrate-malate / lactate / gluconate / hydroxyapatite
10. **Iron** (emergent) — bisglycinate Ferrochel / sulfate / fumarate / gluconate / heme polypeptide
11. **Zinc** (emergent) — picolinate / gluconate / bisglycinate / oxide / citrate
12. **Vitamin C variants** (emergent) — ascorbic acid / sodium ascorbate / calcium ascorbate / magnesium ascorbate / ascorbyl palmitate / liposomal
13. **Vitamin D variants** (emergent) — D3 cholecalciferol multiple potencies + lichen / D2 ergocalciferol
14. **Vitamin E variants** (emergent) — d-alpha tocopheryl acetate / mixed tocopherols / tocotrienols
15. **Vitamin K variants** (emergent) — K1 phytonadione / K2 MK-7 multi-source / K2 MK-4
16. **Mushroom families** (emergent crossover concern) — Lion's Mane / Reishi / Cordyceps / Chaga / Maitake / Turkey Tail
17. **Excipients** (emergent) — MCC grades / Mg Stearate / various

### Per-family methodology

1. **Substantive root identification** — for each family, identify primary substantive root token (e.g., 'choline', 'magnesium', 'b12').
2. **Unscoped grep** — Grep whole file for substantive root (case-insensitive).
3. **Read truncated lines** — Grep truncates long single-line entries; targeted Read calls capture full entry content.
4. **Match categorization** — classify each match per 4-class taxonomy below.
5. **Per-duplicate analysis** — for each Same-SKU duplicate pair: identify survivor recommendation per (a) schema-shape completeness, (b) citation quality, (c) data completeness/accuracy.

### 4-class match taxonomy (per audit charter)

| Class | Definition | Round 12 treatment |
|---|---|---|
| **Same SKU duplicate** | Two entries are substantively the same product (same form, same chemistry, no name differentiation reflecting tier/source) | **Consolidate** — survivor recommendation per evidence; deprecated entry removed |
| **Intentional tier pair** | Same form, but different supplier tier / sourcing tier / certification tier, explicitly reflected in entry name | **Keep both** — validated commercial architecture per [[project_supplements_two_wave_ingestion]] |
| **Cross-category split** | Same substance present in two or more categories | **Operator+Opus call** per §III.18 primary-mechanism-wins |
| **Stripped-name collision** | Different substances whose normalized synonyms (per `normalizeIngredientName`) collide | **§II.8a collision discipline** — block at authoring layer |
| **Legitimate form variant** | Distinct chemistry / standardization / carrier reflected in entry name (per §IV.23 valid differentiation) | **Keep both** — not a duplicate |

---

## 2. Per-family findings

Note on referencing: per [[feedback_persistent_refs_use_names_not_line_numbers]], all references below cite **entry name first**, with line numbers as auxiliary navigation only. Line numbers will drift; entry names persist.

### 2A. Choline family — three-category split + 1 confirmed duplicate

**Cross-category split (Round 12 cleanup ticket per [[project_choline_gap_critical]]):**

Choline-family entries currently split across **three categories**:

| Entry name | Category | Notes |
|---|---|---|
| Phosphatidylcholine (PC 35%, Soy) | **Fatty Acids** | Line 227 |
| Alpha-GPC (L-Alpha-Glycerylphosphorylcholine) | **Fatty Acids** | Line 228, Soy variant |
| CDP-Choline (Citicoline, Cognizin) | **Fatty Acids** | Line 229 |
| Choline Bitartrate (USP) | **Specialty Compounds** | Line 396, Wave 1.5 step-5 upgrade |
| Alpha-GPC 50% (AlphaSize, Synthetic) | **Vitamins** | Line 397, synthetic variant |
| Citicoline / CDP-Choline (Cognizin, Kyowa Hakko) | **Vitamins** | Line 398 |
| Phosphatidylcholine 30% (Soy Lecithin-Derived) | **Vitamins** | Line 399 |
| Phosphatidylcholine 30% (Sunflower Lecithin-Derived, Allergen-Free) | **Vitamins** | Line 400 |
| Choline L-Threonate (PENDING NDI VERIFICATION) | **Vitamins** | Line 401 |
| Lecithin (Soy, Liquid, USP) | **Excipients** | Line 352, source material |
| Sunflower Lecithin (Liquid) | **Excipients** | Line 353, allergen-free source |

Per rulebook §VIII.38 Wave 1.5 spec, the canonical category is **Specialty Compounds** (delivery-substrate isolates, not micronutrient-DV-frame). Wave 1.5 step-5 moved Choline Bitartrate to Specialty Compounds. Remaining 7 choline-family entries in Fatty Acids + Vitamins need migration.

**Confirmed Same-SKU duplicate within Choline family:**

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| CDP-Choline (Citicoline, Cognizin) [Fatty Acids, $320] **vs** Citicoline / CDP-Choline (Cognizin, Kyowa Hakko) [Vitamins, $340] | **Survivor: line 398 (Vitamins entry)** | Wave-2-Phase-1 shape includes regulatoryStatus + functionalRole + bioactives; explicit NDI #1196 acknowledgment; cleaner notes. The Fatty Acids entry (line 229) is the older minimal-shape version. |

**Legitimate form variants (NOT duplicates) within Choline:**

| Variants | Differentiation axis |
|---|---|
| Alpha-GPC Soy (line 228) vs Alpha-GPC 50% Synthetic AlphaSize (line 397) | Source: lecithin-derived vs synthetic; potencyFactor 1.0 vs 0.5 |
| PC 35% Soy (line 227) vs PC 30% Soy (line 399) vs PC 30% Sunflower allergen-free (line 400) | Concentration + source; harm-critical allergen differential per Wave 1.5e |

### 2B. Magnesium family — 2 confirmed duplicates + 1 confirmed step-5 cleanup

**Already resolved during step-5 inaugural (per memory [[project_catalog_duplicate_sku_audit_ticket]]):**

- Magnesium L-Threonate (Magtein, AIDP) — line 166 consolidation; former duplicate at line 303 deleted in Wave 1.5 step-5 closure commit (88f100e).

**Newly surfaced Same-SKU duplicates:**

| Pair | Naming differentiation? | Survivor recommendation | Reasoning |
|---|---|---|---|
| Magnesium Oxide (USP) [line 42, $4.20, Dr. Paul Lohmann + Magnesia GmbH + Premier Magnesia] **vs** Magnesium Oxide (USP) [line 162, $1.80, Martin Marietta + RHI Magnesita + Premier Magnesia] | **No naming differentiation** (both `Magnesium Oxide (USP)`) | **Operator+Opus call** — likely needs renaming both to reflect actual tier distinction (e.g., `(USP, Pharmaceutical-Grade)` vs `(USP, Commodity Sourcing)`) following the existing Wave-2-Phase-1 pattern. Per §IV.23, identical names with different costs are saturation-rule borderline. |
| Magnesium Citrate (USP) [line 43, $7.80] **vs** Magnesium Citrate (USP) [line 163, $6.80] | **No naming differentiation** | Same pattern as Mg Oxide — needs renaming, not consolidation. Suppliers partially overlap; cost gap modest. |

**Legitimate tier pairs within Magnesium (already named correctly):**

- Magnesium Glycinate (Chelated, Albion TRAACS) [line 41, $22] vs Magnesium Glycinate (Generic Chelate, Commodity Sourcing) [line 164, $14] — explicit name differentiation + cross-reference in notes.

**Magnesium Stearate duplicate (Excipients):**

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Magnesium Stearate (Vegetable Grade) [line 108, $12] **vs** Magnesium Stearate (Vegetable) [line 325, $6.50] | **Survivor: line 108** | Slightly fuller notes ("0.25-1% typical. Vegetable (palm) vs bovine grades"); supplier set slightly more comprehensive (IOI Oleo present). Line 325 supplier overlap. No naming-tier differentiation; consolidate. |

### 2C. B-vitamins family — 5 confirmed duplicates

The Wave 1 (lines 21-29) + Wave 2 Phase 1 (lines 130-148) two-wave pattern produces duplicate B-vitamin entries with **inconsistent naming convention**: Wave 1 uses `Vitamin BN (Form ...)` framing; Wave 2 uses `(Form (BN, ...))` framing. Both forms present for the same substance.

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Vitamin B1 (Thiamine HCl) [line 21, $180] **vs** Thiamine HCl (B1, USP) [line 130, $58] | **Operator+Opus call** | Same substance, ~3x cost gap, different supplier sets. Likely tier-pair-without-naming-differentiation. Treatment: rename one or both to explicit tier. Naming convention discipline: rulebook §II.9 (`Common Name (Form, Supplier, Standardization)`) suggests `Thiamine HCl (USP, ...)` should be canonical. |
| Vitamin B3 (Niacinamide USP) [line 23, $45] **vs** Niacinamide (B3, USP) [line 133, $18] | **Operator+Opus call** | Same substance, ~2.5x cost gap. Same naming-convention question as B1. |
| Vitamin B5 (Calcium d-Pantothenate) [line 24, $85] **vs** d-Calcium Pantothenate (B5, USP) [line 138, $32] | **Operator+Opus call** | Same substance, ~2.5x cost gap. Line 24 carries Wave 1.5b synonym backfill (synonyms array); line 138 does not. **Survivor: line 24** if consolidating to single entry; line 138 has lower cost reflecting more recent commodity pricing. |
| Vitamin B6 (Pyridoxine HCl) [line 25, $120] **vs** Pyridoxine HCl (B6, USP) [line 140, $38] | **Operator+Opus call** | Same pattern. |
| Vitamin B6 P-5-P (Pyridoxal-5-Phosphate) [line 26, $680] **vs** Pyridoxal 5-Phosphate (P5P, Active B6) [line 141, $145] | **Operator+Opus call** | Same active form (P5P), different naming, ~4.5x cost gap. Notable: cost gap larger than other B-vitamins, suggesting genuine quality-tier difference; needs explicit naming. |

**Note on synonyms:** Wave 1 entries lines 24, 27, 28, 94, 149 carry synonyms arrays from Wave 1.5b backfill. The Wave 2 entries (lines 130-148) do NOT carry synonyms. This is **catalog inconsistency** but not a deduplication issue per se — synonym backfill for Wave 2 entries is a separate Round 12 ticket.

**Methylcobalamin tier pair (intentional, validated):**

- Methylcobalamin (Vitamin B12 Active) [line 29, $1200, premium] vs Methylcobalamin (B12 Active, Commodity Sourcing) [line 146, $580] — explicit name differentiation + cross-reference. **Keep both.**

**Cyanocobalamin form variants (intentional, validated):**

- Vitamin B12 (Cyanocobalamin 1% on Mannitol) [line 28, $220, triturate] vs Cyanocobalamin (B12, USP — Pure Powder, No Carrier) [line 145, $380, pure powder] — different forms (triturate vs pure powder), different potencyFactor (0.01 vs 1.0). **Keep both.**

### 2D. Vitamin C family — 0 duplicates

All Vitamin C entries are legitimate form variants:
- Ascorbic Acid USP (line 30)
- Sodium Ascorbate (line 31)
- Calcium Ascorbate (line 150)
- Magnesium Ascorbate (line 151)
- Ascorbyl Palmitate (line 152)
- Liposomal Vitamin C Altrient/LivOn (line 153)

Distinct chemistry. **No deduplication needed.**

### 2E. Calcium family — 1 confirmed duplicate

**Tier pair (intentional):**
- Calcium Carbonate (USP, Limestone) [line 39, $2.80] vs Calcium Carbonate (Limestone, Commodity Sourcing) [line 156, $1.20] — explicit name differentiation.

**Same-SKU duplicate:**

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Calcium Citrate (USP) [line 40, $8.50] **vs** Calcium Citrate (USP) [line 157, $4.50] | **Operator+Opus call** | Same naming. Cost gap suggests tier difference; needs explicit naming per §IV.23 Saturation Test. |

Legitimate variants: Calcium Citrate Malate (line 158), Calcium Lactate (line 159), Calcium Gluconate (line 160), Calcium Hydroxyapatite (line 161). Distinct chemistry.

### 2F. Iron family — 1 confirmed duplicate + 1 PENDING-flagged case

**PENDING case (already known per [[project_phase_2_verification_queue]]):**
- Iron Bisglycinate (Ferrochel, Albion — 20% Fe) [line 44] vs Iron Bisglycinate (Ferrochel — 18% Fe, PENDING SPEC VERIFICATION) [line 175] — flagged 18%-vs-20% elemental Fe discrepancy. **Resolution pending PA verification.**

**Same-SKU duplicate:**

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Ferrous Sulfate (Dried, USP) [line 45, $4.80, Dr. Paul Lohmann + Gadot + DIPHARMA] **vs** Ferrous Sulfate (USP) [line 176, $3.20, Dr. Paul Lohmann + Global Calcium] | **Survivor: line 45** | Slightly fuller notes; supplier set partially distinct (line 176 has Global Calcium). Cost gap modest; consolidate. |

Legitimate variants: Ferrous Fumarate (line 177, 33% Fe), Ferrous Gluconate (line 178, 12% Fe), Heme Iron Polypeptide (line 179). Distinct chemistry.

### 2G. Zinc family — 1 confirmed duplicate + 2 tier pairs

**Tier pairs (intentional):**
- Zinc Gluconate (USP, Pharmaceutical-Grade Sourcing) [line 47, $28] vs Zinc Gluconate (USP, Commodity Sourcing) [line 171, $18] — explicit differentiation.
- Zinc Picolinate (USP) [line 46, $68] vs Zinc Picolinate (Premium) [line 172, $38] — naming differs but "Premium" is opaque/borderline-marketing (§II.9 + §IX.41 AP-09 anti-pattern concern).

**Same-SKU duplicate concern:**

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Zinc Picolinate (USP) [line 46, $68] **vs** Zinc Picolinate (Premium) [line 172, $38] | **Operator+Opus call** | Naming-convention issue: "Premium" is borderline marketing copy per §IX.41 AP-09. Either rename line 172 to explicit differentiation (`(Bulk, Specialty)` or `(Pharmaceutical-Grade)`) OR consolidate. |

Legitimate form variants: Zinc Bisglycinate (line 173), Zinc Citrate (line 174), Zinc Oxide (line 404 — Wave 2 Phase 1).

### 2H. Vitamin D family — 0 duplicates

Legitimate variants:
- Vitamin D3 Cholecalciferol (100,000 IU/g on MCC) [line 32]
- Vitamin D3 Cholecalciferol (Vegan, Lichen) [line 33]
- Vitamin D3 1M IU/g (Cholecalciferol, USP) [line 121]
- Vitamin D3 Vegan (Lichen-Sourced) [line 122]
- Vitamin D2 (Ergocalciferol, USP) [line 123]

Lines 33 + 122 are both "Vegan Lichen" — borderline. Cost difference ($1100 vs $1200) and supplier set differs. **Operator+Opus call** — likely tier pair without explicit differentiation. Lines 32 vs 121 differ in potency stamp.

### 2I. Vitamin K family — 1 confirmed duplicate

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Vitamin K2 MK-7 (Natto, 0.2% on MCC) [line 36, $6500, Kappa + NattoPharma + Gnosis] **vs** Vitamin K2 MK-7 (NattoPharma, 2%) [line 128, $1500, NattoPharma + Kappa + Gnosis] | **Operator+Opus call** | Different potency stamps (0.2% on MCC carrier vs 2% — but the 2% reflects standardization, not free MK-7 fraction). Both reference same supplier ecosystem. Notes don't cross-reference each other. Likely tier pair OR genuine duplicate. |

Legitimate variants: K1 Phytonadione (line 127), K2 MK-4 (line 129).

### 2J. Amino Acids family — 5 confirmed duplicates

The Amino Acids two-wave pattern produces:

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| L-Lysine HCl (Pharma Grade, 78%) [line 54, $8, Ajinomoto + CJ + ADM + Evonik] **vs** L-Lysine HCl (USP) [line 200, $14, Ajinomoto + CJ Bio + Evonik] | **Operator+Opus call** | Same substance. Costs inverted (line 54 cheaper despite "Pharma Grade" framing). Naming differs. Supplier sets overlap heavily. |
| L-Arginine HCl (USP) [line 55, $28] **vs** L-Arginine HCl (USP) [line 198, $24] | **Survivor: line 55** | Same name, same form, modest cost gap. Slightly different supplier sets. **Consolidate.** |
| L-Citrulline Malate 2:1 [line 56, $52] **vs** L-Citrulline Malate 2:1 (USP) [line 199, $32] | **Operator+Opus call** | Same 2:1 ratio. Line 199 has explicit USP. Cost gap moderate. |
| L-Theanine (Suntheanine, Pharma) [line 57, $480, Taiyo + NutraScience] **vs** L-Theanine (Suntheanine, Taiyo) [line 201, $480, Taiyo + Zhejiang NHU] | **Survivor: line 57** | Same Suntheanine branded product, identical cost. Different supplier list (Zhejiang NHU on line 201 likely unauthorized — Taiyo is sole Suntheanine licensor). **Consolidate.** |
| Creatine Monohydrate (Creapure, USP) [line 60, $14, AlzChem + Kyowa + NutraBio] **vs** Creatine Monohydrate (Creapure) [line 205, $22, AlzChem + Goldwell + GNC] | **Operator+Opus call** | Same Creapure product. Cost gap reverse-direction. Naming differs trivially. Supplier sets differ. |
| L-Carnitine L-Tartrate (USP) [line 61, $55] **vs** L-Carnitine Tartrate (USP) [line 203, $48] | **Operator+Opus call** | Naming differs trivially ("L-Carnitine L-Tartrate" vs "L-Carnitine Tartrate"); same substance. Supplier sets overlap. |
| Taurine (USP, Crystalline) [line 58, $14] **vs** Taurine (USP) [line 208, $8.50] | **Operator+Opus call** | Same substance. Wave 1 entry adds "Crystalline" qualifier (true but not tier-differentiating per §II.9 form spec). Cost gap modest. |

### 2K. Mushroom family cross-category splits — 4 substance families

This is the largest cross-category-split finding. Each of 4 mushroom families exists in BOTH `Mushroom Extracts` (correct per §III.18 primary-mechanism) and `Botanicals` (incorrect category):

| Substance | Mushroom Extracts entry | Botanicals entry | Recommendation |
|---|---|---|---|
| Lion's Mane | Lion's Mane Extract (30% Polysaccharides, Fruiting Body) [line 74, $180] | Lion's Mane Extract (Hericium erinaceus, 30% Polysaccharides) [line 260, $180] (categorized as Herbal Extracts, not Botanicals — but related cross-category issue) | **Consolidate to Mushroom Extracts.** Same standardization, same cost, same supplier ecosystem. |
| Reishi | Reishi Mushroom Extract (30% Beta-Glucans) [line 75, $160] | Reishi Extract (Ganoderma lucidum, 30% Polysaccharides) [line 261, $140] | **Different standardizations** (Beta-Glucans vs Polysaccharides as markers). May be legitimately distinct OR mis-labeled. Operator+Opus call. |
| Cordyceps | Cordyceps CS-4 Extract (30% Polysaccharides) [line 76, $220] | Cordyceps Militaris Extract (7% Cordycepin) [line 262, $220] | **Different standardizations** (Polysaccharides vs Cordycepin). Legitimate. **Keep both but move Botanicals entry to Mushroom Extracts.** |
| Chaga | Chaga Extract (30% Polysaccharides, 2% Triterpenes) [line 77, $280] | Chaga Extract (Inonotus obliquus, 30% Polysaccharides) [line 263, $160] | **Same primary standardization** (30% Polysaccharides). Cost gap large; line 77 adds Triterpenes spec. Likely legitimate tier pair OR true duplicate. |

**Plus** Wave 3 Phase 3a additions (lines 471-475) introduced **new** Mushroom Extracts entries with shape-current Wave 1.5+ schema (regulatoryStatus + functionalRole + bioactives):

- Lion's Mane (Hericium erinaceus, Fruiting Body, 30% Polysaccharides) [line 471]
- Reishi (Ganoderma lucidum, Fruiting Body, 30% Beta-glucans) [line 472]
- Cordyceps militaris (Fruiting Body, 0.3% Adenosine + Cordycepin) [line 473]

Compared to existing lines 74-77, the Wave 3 Phase 3a entries are **shape-current** and may render the older entries obsolete entirely. **This means each mushroom family now has THREE candidate entries** (Mushroom Extracts old + Botanicals/Herbal old + Mushroom Extracts Wave-3-shape-current). The Wave-3-shape-current entry is likely the survivor in each case.

### 2L. Curcumin family — 1 confirmed duplicate + Wave 3 shape replacements

**Same-SKU duplicate:**

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Turmeric Extract (Curcumin 95%, Sabinsa C3) [line 233, $68] **vs** Turmeric Extract (95% Curcuminoids) [line 65, $85] | **Survivor: line 233** | Line 233 explicit Sabinsa C3 branded form; line 65 has broader supplier list but generic naming. The new shape-current Curcumin 95% (Sabinsa C3 Complex, Branded) [line 458, $180] is the canonical replacement. |

**Wave 3 Phase 3a shape-current Curcumin entries (lines 457-460):**

- Curcumin 95% (Commodity Tier, Generic) [line 457] — NEW commodity entry
- Curcumin 95% (Sabinsa C3 Complex, Branded) [line 458] — REPLACES line 233 + line 65
- Curcumin BCM-95 (Arjuna, Bioavailable with Turmeric Oils) [line 459]
- Curcumin Meriva (Indena, Phytosome with Soy Lecithin) [line 460] — REPLACES line 234

After Round 12 cleanup, the Curcumin family should consolidate from ~6 entries to 4 (the Wave 3 Phase 3a shape-current set).

### 2M. Probiotic strains — 1 PENDING-flagged case + 1 dosage discrepancy

**Already known per [[project_phase_2_verification_queue]]:**

- L. acidophilus NCFM at 50B CFU [line 80, Danisco/IFF + Chr. Hansen + Lallemand] vs L. acidophilus NCFM (Danisco — 10B CFU, PENDING POTENCY VERIFICATION) [line 281, DuPont+IFF] — 5x CFU discrepancy.

**Legitimate variants (NOT duplicates) — strain-specific clinical-evidence-distinct:**

The probiotic catalog (~20 strain entries across Wave 1 + Wave 2 Phase 1 + Wave 2 Phase 2) is mostly clean — each strain ID is unique (DSM 17938, BB536, B420, HN001, HN019, GG, etc.). The shape varies (Wave 2 entries carry regulatoryStatus + functionalRole + bioactives; Wave 1 entries do not).

### 2N. Caffeine family — 0 duplicates (Wave 1.5 step-5 just resolved)

- Caffeine Anhydrous (USP, Pharmaceutical-Grade) [line 498, Wave 1.5c step-5]
- Caffeine from Green Tea Extract (50% Caffeine, USP Identity) [line 499, Wave 1.5c step-5]

Source-tier differentiation explicit per Wave 1.5e qualified-synonym discipline. **Keep both.**

### 2O. Melatonin family — 0 duplicates (Wave 1.5 step-5 just resolved)

- Melatonin (USP, Crystalline) [line 94]
- Melatonin (Time-Release Coated Granule, 30% USP) [line 95, Wave 1.5c step-5]

Form-tier differentiation explicit. **Keep both.**

### 2P. Omega-3 family — Cross-category concern + 0 hard duplicates

Omega-3 entries split across `Omega-3s` (lines 101-104) and `Fatty Acids` (lines 216-219). This is **NOT a same-SKU duplication** but a **category-split concern**:

| Substance | Omega-3s | Fatty Acids |
|---|---|---|
| Fish Oil 18/12 | Fish Oil 18/12 (EPA/DHA, Triglyceride) [line 101, $22] | Fish Oil 18/12 EE (Concentrated) [line 216, $35] |
| Fish Oil 40/20 | Fish Oil 40/20 (Concentrated EPA/DHA, Ethyl Ester) [line 102, $65] | Fish Oil 40/20 TG (Triglyceride Form) [line 218, $72] |
| Krill Oil | Krill Oil (Superba, Phospholipid-Bound) [line 103, $180] | Krill Oil (Superba 2, Aker BioMarine) [line 219, $240] |
| Algae Oil | Algae Oil DHA/EPA (Vegan, Schizochytrium) [line 104, $95] | Algal DHA Oil (Life's DHA, DSM) [line 220, $120] |

These pair across categories with **distinct form differentiation** (TG vs EE; Superba vs Superba 2). Differentiation IS explicit per §IV.23. **Likely legitimate** but the category split (`Omega-3s` vs `Fatty Acids`) is itself a Round 12 cleanup ticket per §III.17 splitting-categories logic — should one category absorb the other?

### 2Q. Excipients family — 1 confirmed duplicate

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Microcrystalline Cellulose (MCC, PH-102) [line 107, $6.50, JRS + Asahi + FMC + DuPont] **vs** Microcrystalline Cellulose (MCC PH-102, Larger) [line 320, $6.80, FMC + Asahi] | **Survivor: line 107** | Same PH-102 grade. Line 107 has broader supplier set; cost slightly lower. Line 320 adds "Larger" qualifier which is borderline — PH-102 IS the larger-particle standard grade, so the qualifier is redundant. **Consolidate.** |

Legitimate variants: MCC PH-101 [line 319, 50 µm], MCC PH-200 [line 321, 200 µm]. Distinct mesh.

### 2R. Joint-support family — 2 cross-category-split-related duplicates

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Glucosamine Sulfate 2KCl (USP) [line 91, **Specialty Compounds**, $24] **vs** Glucosamine Sulfate Potassium (USP) [line 295, **Specialty**, $12] | **Operator+Opus call** | Same product (potassium-chloride-stabilized glucosamine sulfate). Different categories (`Specialty Compounds` vs `Specialty` — rulebook §III.15 legacy synonyms per "Specialty Compounds and Specialty are currently both present (legacy)"). Round-12 cleanup: consolidate categories + consolidate entries. |
| Chondroitin Sulfate Sodium (Bovine, 90%) [line 92, **Specialty Compounds**, $48] **vs** Chondroitin Sulfate 90% (Bovine, USP) [line 296, **Specialty**, $32] | **Operator+Opus call** | Same product. Same cross-category split as Glucosamine. |
| MSM (Methylsulfonylmethane, OptiMSM) [line 93, **Specialty Compounds**, $18] **vs** MSM (Methylsulfonylmethane, USP) [line 297, **Specialty**, $9.80] | **Operator+Opus call** | Same substance; line 93 carries OptiMSM branded form. Line 297 supplier set distinct (Cardinal Nutrition). Different categories. |
| Bromelain (GDU/g 2,400, from Pineapple) [line 85, **Enzymes**, $180] **vs** Bromelain (Pineapple, 2400 GDU/g) [line 305, **Antioxidants**, $160] | **Operator+Opus call** | Same enzyme standardization. Cross-category split (`Enzymes` vs `Antioxidants`). Per §III.18 primary-mechanism, Enzymes is correct (catalytic enzyme function). Per [[project_enzyme_categorization_review]] this category-split is logged Round-12+ ticket. **Consolidate to Enzymes.** |

### 2S. CoQ10 family — 1 confirmed duplicate

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| CoQ10 Ubiquinol (Reduced Active Form) [line 90, $720, Kaneka KanekaQH + Mitsubishi] **vs** CoQ10 Ubiquinol (Kaneka QH, Reduced Form) [line 267, $580, Kaneka QH sole] | **Operator+Opus call** | Same Kaneka QH product. Cost gap modest. Different categories (line 90 Specialty Compounds; line 267 Antioxidants). Per §III.18 primary-mechanism, antioxidant is the primary mechanism — line 267 category may be correct. **Consolidate to Antioxidants if §III.18 lands that way.** |

**Tier pair (intentional):**
- CoQ10 (Ubiquinone, Kaneka Q10) [line 89, $380] vs CoQ10 Ubiquinone (99% Pure, Commodity) [line 266, $220] — explicit differentiation.

### 2T. Saw Palmetto — 1 confirmed duplicate

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Saw Palmetto Extract (85% Fatty Acids, CO₂) [line 70, $180] **vs** Saw Palmetto Extract (85–95% Fatty Acids) [line 248, $180] | **Operator+Opus call** | Same standardization range (line 248 widens to 85-95% from line 70's 85%). Same cost. Supplier sets overlap. **Likely consolidate** but Wave 3 Phase 3a shape-current Saw Palmetto (Serenoa repens, 85% Fatty Acids/Sterols, CO2-Extracted) [line 466, $120] is the canonical replacement. |

### 2U. Other notable duplicates

| Pair | Survivor recommendation | Reasoning |
|---|---|---|
| Copper Gluconate (USP) [line 49, $42] **vs** Copper Gluconate (USP) [line 180, $28] | **Operator+Opus call** | Same name, same form, modest cost gap. Same naming-convention issue as Mg Oxide/Citrate. |
| Potassium Iodide (USP, Food-Grade) [line 51, $58] **vs** Potassium Iodide (USP) [line 190, $38] | **Operator+Opus call** | Line 51 adds "Food-Grade" qualifier (true but not tier-differentiating). Same substance. |
| Selenium L-Selenomethionine (USP) [line 48, $520] **vs** Selenomethionine (Organic Selenium) [line 186, $320] | **Operator+Opus call** | Same active compound. Line 48 explicit "L-" prefix and "(USP)"; line 186 generic. Cost gap modest. |
| Chromium Picolinate (USP) [line 50, $480, Nutrition 21 + Dr. Paul Lohmann + Merck] **vs** Chromium Picolinate (ChromeMate, USP) [line 183, $68, Nutrition 21 + InterHealth] | **Operator+Opus call** | Same substance, large cost gap (7x). Line 50 doesn't reference ChromeMate brand. Likely tier-pair-without-naming-differentiation. |

### 2V. Cross-category split in mineral-vs-specialty space — 0 confirmed (Magtein step-5 cleanup landed)

Magnesium L-Threonate (Magtein) appropriately stays in Minerals per §VIII.38 + §III.18 primary-mechanism. Cognitive-support tag captured via functionalRole.

---

## 3. Stripped-name collision inventory

**No cross-entry collisions found.** The §II.8a per-entry synonym discipline + Wave 1.5e qualified-synonym refinements appear to be holding — entries do not normalize to colliding strings across the catalog as currently authored.

The closest call: bare `'phosphatidylcholine'` would have collided across PC 35% Soy / PC 30% Soy / PC 30% Sunflower — but the Wave 1.5e refinement explicitly removed bare claims from each (qualified synonyms only). Same shape for bare `'alpha-gpc'`, bare `'lecithin'`, bare `'choline'`, bare `'caffeine'`, bare `'melatonin'`. Wave 1.5e discipline is operating as designed.

---

## 4. Round 12 implications

### 4A. Step 1 schema migration impact on duplicate handling

Round 12 Step 1 (per Q1 resolution: Comprehensive Step 1 with field-batched commits) will migrate every entry through the universal-required field additions (Gap #1-6) + per-category required (Gap #7) + the 3 shape reconciliations (Sh1/Sh2/Sh3).

**Duplicates compound migration cost.** Every duplicate pair is two entries that BOTH need migration. Consolidating duplicates BEFORE Step 1 reduces total migration work.

**Recommendation:** insert a **Step 0.5** between Step 0 (Per-Category Audit) and Step 1 (Schema Migration): consolidate this audit's ~25 confirmed Same-SKU duplicates. Reduces Step 1 cost by ~25 entries; resolves catalog hygiene independent of the schema migration; can ship as its own batch of commits.

### 4B. Cross-category split scope

5 substance families have cross-category splits:

1. **Choline family** (3-category split) — Wave 1.5 step-5 started migration; needs completion of remaining 7 entries
2. **Mushroom family** (4 substance families × Mushroom Extracts vs Botanicals/Herbal Extracts) — Wave 3 Phase 3a created shape-current Mushroom Extracts entries; old Botanicals/Herbal entries are now obsolete
3. **Joint family** (Specialty Compounds vs Specialty category synonyms per §III.15 legacy) — 3-4 entries affected
4. **Enzyme family** (Bromelain in Enzymes vs Antioxidants) — already logged per [[project_enzyme_categorization_review]]
5. **Omega-3 family** (Omega-3s vs Fatty Acids categories) — broader category-split question per §III.17

Per §III.18 primary-mechanism-wins, each split has a clear canonical category. Per [[feedback_refactors_wait_for_stable_data_layer]] these are normally deferred — but Round 12 schema migration is a natural window to bundle them in.

### 4C. Naming-convention discipline

Multiple Same-SKU duplicates surface a recurring naming-convention violation: **Wave 1 entries (lines 19-115) frequently lack explicit tier-differentiation in the entry name**, even when the Wave 2 Phase 1 counterpart adds tier qualifier in notes via `(vs. line X)` cross-reference.

Examples:
- Mg Oxide (USP) at line 42 doesn't say `(Pharmaceutical-Grade)` despite the line 162 counterpart implicitly being commodity
- Calcium Citrate (USP) at line 40 + line 157 — neither names the tier
- Most B-vitamin Wave-1 entries (B1/B3/B5/B6/P5P) don't carry tier qualifier despite cost gaps vs Wave-2 counterparts

Per §II.9, the name should encode the structured-field value (tier, supplier, certification). The duplicates without naming differentiation should either:
- **Rename to explicit tier** (canonical fix per §II.9) — keep both entries with clearer naming
- **Consolidate** — one entry survives; the other deprecated

Recommend: **operator+Opus framing on which pattern applies per family.** Probably mixed — some pairs genuinely need both tiers; others are accidental duplicates.

---

## 5. Open routing questions for operator + Opus

**Q-Audit-1 — Tier-pair-vs-consolidation routing per Same-SKU pair.** ~17 of the ~25 confirmed duplicates need per-pair routing on: (a) rename both with explicit tier differentiation, (b) consolidate to one survivor, or (c) defer to Round 12+ refactor wave. The decision matrix per pair is consistent (cost gap × supplier overlap × naming-convention discipline), but the calls themselves are operator+Opus.

**Q-Audit-2 — Wave 3 Phase 3a shape-current replacements.** For Mushroom family + Curcumin family + Saw Palmetto, Wave 3 Phase 3a authored shape-current entries with full Wave 1.5+ field shape (regulatoryStatus + functionalRole + bioactives). The older Wave 1 + Wave 2 entries appear obsolete. Treatment options: (a) deprecate older entries immediately as part of consolidation step, (b) keep older entries pending Round 12 Step 1 migration completion (so cross-section can be verified), (c) other.

**Q-Audit-3 — Specialty Compounds vs Specialty category synonyms.** Per rulebook §III.15, both are "currently both present (legacy)." Cross-category duplicates (Glucosamine Sulfate Potassium, Chondroitin, MSM) span this seam. Treatment options: (a) collapse `Specialty` into `Specialty Compounds` as part of Round 12 Step 0 work, (b) keep both names but consolidate the cross-category duplicates per primary entry, (c) other.

**Q-Audit-4 — Omega-3s vs Fatty Acids category boundary.** Per rulebook §III.15, both `Omega-3s` and `Fatty Acids` are in the taxonomy. The Wave 1 + Wave 2 split positions Omega-3 EPA/DHA in both. Treatment options: (a) consolidate to Omega-3s (per consumer-facing primary-mechanism framing), (b) consolidate to Fatty Acids (per chemistry-honest framing), (c) keep both with explicit role differentiation, (d) defer until Round 12 §III.17 split-review.

**Q-Audit-5 — Step 0.5 insertion before Step 1.** Recommend inserting a duplicate-consolidation sub-wave between Step 0 (per-category audit) and Step 1 (schema migration). Reduces migration scope by ~25 entries. Routing: (a) yes, insert Step 0.5, (b) bundle duplicate consolidation INTO Step 1 batches (one commit per substance family touching both consolidation + migration), (c) defer to after Step 1.

---

## 6. Pause-and-surface trigger

Per audit charter:
> More than 10 confirmed Same SKU duplicates across all families — suggests catalog hygiene work is meaningfully larger than anticipated; worth surfacing before committing methodology.

**Trigger fires.** Final count ~25 confirmed Same-SKU duplicate pairs; threshold 10; ratio 2.5×.

**Action taken:** This audit is the surface-back. No catalog changes proposed; no commits made. Operator + Opus routing required on:
- Q-Audit-1 through Q-Audit-5 above
- Step 0.5 insertion decision
- Cross-category split treatment for 5 substance families

---

## 7. Audit metadata

**Files read:**
- [lib/data/supplements.ts](../../lib/data/supplements.ts) — full ingredient section (lines 19-504; lines 505+ are product types/process templates, out of scope)

**Catalog stats:**
- 642 total lines
- 405 ingredient entries (Grep-counted top-level `^  \{` occurrences)
- Entries span Wave 1 (value-tier, lines 19-115), Wave 2 Phase 1 (premium-tier + organic SKUs, lines 117-389), Wave 2 Phase 1+2 additions (Choline + mineral salts + probiotic strains + trace minerals, lines 390-431), Wave 3 Phase 3a (botanicals + mushrooms + metabolites, lines 435-487), Wave 1.5 (lines 94-95, 396, 489-503 — distributed)

**Verification methodology:**
- Substantive-root Grep per family (e.g., `choline`, `magnesium`, `b12`, `cobalamin`, `cyanocobalamin`)
- Targeted Read for Grep-truncated single-line entries
- Per-pair evidence review: schema-shape completeness, citation quality, data completeness, naming-convention discipline per §II.9 + §IV.23

**No code changes. No commits. Outputs scoped to `docs/audits/`. Pause-and-surface discipline applied per >10 duplicate trigger.**

— Audit #1 complete. Round 12 sequencing input now consists of: Audit #2 drift inventory (60 findings, 58 confirmed) + Audit #1 duplicate inventory (~25 pairs + 5 cross-category splits) + §6 Q-Sh resolutions. Step 0 + Step 0.5 + Step 1 scope can land with grep-verified evidence as foundation.
