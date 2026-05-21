# Q-Audit-1 Final Routing — Consolidated Per-Pair Resolution

**Status:** Canonical routing artifact for Q-Audit-1 per-pair work. Supersedes pre-screen (`q-audit-1-pre-screen.md`) structurally; pre-screen retained as audit trail for the pre-routing evidence base.
**Authored:** 2026-05-20 operator + Opus + CC session (post-Q-Audit-1 closure).
**Scope:** 34 pair-equivalents processed during Q-Audit-1 per-pair routing → 32 resolved + 7 deferred to Phase 2 verification queue (counting cluster B reclassifications and B4.4.3 K2 MK-7 reclassification).
**Framework backing:**
- `docs/architecture/catalog-authoring-rulebook.md` §II.9a — Five qualifier-discipline refinements (regulatory-baseline; borderline-marketing; Organic-overload; positioning-in-naming check; tier-attribution evidence-strength bar)
- `docs/architecture/cost-and-vendor-architecture.md` — Four-layer architecture; manufacturer/vendor distinction; cost reframe
- `docs/audits/rulebook-vs-types-drift.md` §6 — Q-Sh1/Sh2/Sh3 + Q1 reconciliations + cross-references

---

## 1. Header + scope

### Session origin

Q-Audit-1 emerged from Audit #1 (`duplicate-sku-sweep.md`) which surfaced ~26 same-SKU duplicates against a ~10-duplicate pause-and-surface threshold. Pre-screen (`q-audit-1-pre-screen.md`) classified 34 pair-equivalents into 4-bucket taxonomy + Deferred + No-action. Per-pair routing session worked through all bucket assignments with framework-driven decisions; this artifact captures the consolidated routing.

### Resolution counts

| Category | Count | Description |
|---|---|---|
| Pairs/entries resolved | 32 | Routing locked; Step 0.5 execution work scoped |
| Pairs deferred to Phase 2 queue | 7 | Substance-disambiguation queue files; supplier-COA verification required |
| Tier-pair verifications added to Phase 2 queue | 16 | Bucket 3 (5) + Pattern 1 (11); Encoding β per Meta-option 1 retroactive discipline |
| No-action reclassifications | 4 | Legitimate form variants per §IV.23; no consolidation/rename needed |

**Total Phase 2 verification queue scope from this session:** ~23 items (6 new substance-disambiguation + 16 tier-pair + L. acidophilus NCFM pre-existing per [[project_phase_2_verification_queue]]).

### Architecture context

This routing operates against the framework established this session:
- **§II.9a five refinements** govern naming discipline + tier-attribution evidence bar
- **Option Y discipline** governs PENDING TIER VERIFICATION routing when supplier-tier evidence is mixed/weak
- **Cost reframe + manufacturer/vendor distinction** ground the supplier-tier vs vendor-channel disambiguation that drives multiple Phase 2 queue routings

---

## 2. Bucket 1 — Path A obvious (4 entries)

Clearly superior survivor per evidence; deprecate sibling; supplier-set union if applicable.

### B1.1 — CDP-Choline / Citicoline

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `CDP-Choline (Citicoline, Cognizin)` | `Citicoline / CDP-Choline (Cognizin, Kyowa Hakko)` |
| Line | 229 | 398 |
| Category | Fatty Acids | Vitamins → **Specialty Compounds** per 0.5c.iv |
| Schema | Wave 1 minimal + synonyms | Wave 2 Phase 1 (regulatoryStatus 'NDI-notified' + bioactives + NDI #1196) |

**Action:** Keep line 398; deprecate line 229. **Preserve line 229's synonyms array** (`['cdp-choline', 'citicoline', 'cognizin', 'cytidine diphosphate choline']`) into line 398 before deletion. Coupled with 0.5c.iv category migration to Specialty Compounds.

### B1.2 — L-Theanine Suntheanine

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `L-Theanine (Suntheanine, Taiyo)` | `L-Theanine (Suntheanine, Pharma)` |
| Line | 201 | 57 |
| Suppliers | Taiyo + **Zhejiang NHU** (incorrect Suntheanine attribution) | Taiyo (Suntheanine) + NutraScience |

**Action:** Keep line 57; deprecate line 201. **Zhejiang NHU does NOT migrate to survivor** — catalog data error (Taiyo is sole Suntheanine licensor; Zhejiang NHU producing Suntheanine would be licensing violation).

### B1.3 — MCC PH-102

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `Microcrystalline Cellulose (MCC PH-102, Larger)` | `Microcrystalline Cellulose (MCC, PH-102)` |
| Line | 320 | 107 |

**Action:** Keep line 107; deprecate line 320. The "Larger" qualifier on line 320 is redundant — PH-102 IS the larger-particle (100 µm) standard grade. Supplier-set union not needed (line 107 already broader).

### B1.4 — L-Carnitine L-Tartrate (reclassified from B4.5.1)

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `L-Carnitine Tartrate (USP)` | `L-Carnitine L-Tartrate (USP)` |
| Line | 203 | 61 |

**Action:** Keep line 61 (chemistry-precise "L-" stereoisomer prefix + broader supplier set); deprecate line 203. Supplier-set union not needed.

---

## 3. Bucket 2 — Path B obvious (4 pairs)

Newer-shape entry is structural survivor; older entries' substantive content (supplier sets, citations) preserves into survivor before deletion.

### B2.1 — Curcumin Sabinsa C3 (triple-entry consolidation)

| Field | Deprecated #1 | Deprecated #2 | Survivor |
|---|---|---|---|
| Entry | `Turmeric Extract (95% Curcuminoids)` | `Turmeric Extract (Curcumin 95%, Sabinsa C3)` | `Curcumin 95% (Sabinsa C3 Complex, Branded)` |
| Line | 65 | 233 | 458 |

**Action:** Keep line 458; deprecate lines 65 + 233. Generic commodity curcumin now covered by separately-authored `Curcumin 95% (Commodity Tier, Generic)` [line 457] — Wave 3 Phase 3a shape-current bifurcation.

### B2.2 — Curcumin Meriva

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `Curcumin Phytosome (Meriva, Indena)` | `Curcumin Meriva (Indena, Phytosome with Soy Lecithin)` |
| Line | 234 | 460 |

**Action:** Keep line 460; deprecate line 234. Same Indena Meriva product; line 460 has Wave 1.5+ shape + FDA NDI citation. $320 cost on line 460 stands (line 234's $180 may be stale).

### B2.3 — Saw Palmetto (triple-entry consolidation)

| Field | Deprecated #1 | Deprecated #2 | Survivor |
|---|---|---|---|
| Entry | `Saw Palmetto Extract (85% Fatty Acids, CO₂)` | `Saw Palmetto Extract (85–95% Fatty Acids)` | `Saw Palmetto (Serenoa repens, 85% Fatty Acids/Sterols, CO2-Extracted)` |
| Line | 70 | 248 | 466 |

**Action:** Keep line 466; deprecate lines 70 + 248. **Add `Valensa (USPlus)` to line 466's supplier set** — older entries had Valensa International + Valensa USPlus references; survivor's current set (Indena + Euromed + Naturex) is missing Valensa.

### B2.4 — Bromelain (cross-category)

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `Bromelain (Pineapple, 2400 GDU/g)` | `Bromelain (GDU/g 2,400, from Pineapple)` |
| Line | 305 | 85 |
| Category | Antioxidants | **Enzymes** per Q-Audit-3 0.5c.iii primary-mechanism |

**Action:** Keep line 85 in Enzymes; deprecate line 305. **Add `Sabinsa` + `Enzyme Development Corporation` to line 85's supplier set** — line 85 becomes 5-supplier entry.

---

## 4. Bucket 3 — Rename-both, Tier-A/Tier-B placeholders (5 pairs)

**Encoding β applied per Meta-option 1 retroactive Option Y discipline.** All 5 pairs use Tier-A / Tier-B placeholder naming during Step 0.5b; tier-attribution resolves to Pharmaceutical-Grade / Commodity Sourcing in Phase 2 verification queue Wave B.

### B3.1 — Magnesium Oxide

- Line 42 [$4.20, Dr. Paul Lohmann + Magnesia GmbH + Premier Magnesia] → `Magnesium Oxide (USP, Tier-A)` PENDING TIER VERIFICATION
- Line 162 [$1.80, Martin Marietta + RHI Magnesita + Premier Magnesia] → `Magnesium Oxide (USP, Tier-B)` PENDING TIER VERIFICATION

### B3.2 — Magnesium Citrate

- Line 43 [$7.80] → `Magnesium Citrate (USP, Tier-A)` PENDING TIER VERIFICATION
- Line 163 [$6.80] → `Magnesium Citrate (USP, Tier-B)` PENDING TIER VERIFICATION

### B3.3 — Calcium Citrate

- Line 40 [$8.50] → `Calcium Citrate (USP, Tier-A)` PENDING TIER VERIFICATION
- Line 157 [$4.50] → `Calcium Citrate (USP, Tier-B)` PENDING TIER VERIFICATION

### B3.4 — Copper Gluconate

- Line 49 [$42] → `Copper Gluconate (USP, Tier-A)` PENDING TIER VERIFICATION
- Line 180 [$28] → `Copper Gluconate (USP, Tier-B)` PENDING TIER VERIFICATION

### B3.5 — Potassium Iodide

- Line 51 [$58] → `Potassium Iodide (USP, Tier-A)` PENDING TIER VERIFICATION ("Food-Grade" qualifier replaced — regulatory baseline)
- Line 190 [$38] → `Potassium Iodide (USP, Tier-B)` PENDING TIER VERIFICATION

**Phase 2 queue:** All 5 pairs enter as tier-pair verifications. Single queue file `docs/pa-verification/2026-05-20-bucket-3-tier-pair-verifications.md` covers all 5; supplier-COA evidence determines Pharmaceutical-Grade vs Commodity Sourcing attribution.

---

## 5. Bucket 3-adjacent — B4.8.1 Flaxseed Oil Organic rename (1 entry)

### B4.8.1 — Flaxseed Oil "Organic" naming-vs-fields discrepancy

| Line | Current name | Action |
|---|---|---|
| 224 | `Flaxseed Oil (Organic, Cold-Pressed)` (suppliers + structured fields don't support Organic claim) | **Rename to `Flaxseed Oil (Cold-Pressed)`** — drop unsupported Organic claim |
| 378 | `Flaxseed Oil (Organic, Cold-Pressed)` (structured fields back the Organic claim: `organicAvailable: true` + `sustainabilityCerts: ['usda-organic', ...]`) | **Keeps current name** — backed by fields |

**Action:** Path A rename of line 224 per harm-critical floor compliance (display name was overclaiming organic without structured-field backing). Post-rename: legitimate conventional-vs-organic tier pair (cost gap $12 conventional / $18 organic supports differentiation).

**No Phase 2 queue routing** — discipline-driven rename per §II.9a Refinement 3 "Organic" qualifier overload anti-pattern.

---

## 6. Pattern 1 batch — Convention rename + tier PENDING (12 pair-equivalents)

**Encoding β applied** for consistency with Bucket 3 discipline. All 11 tier-pairs get Tier-A / Tier-B placeholders + PENDING TIER VERIFICATION during Step 0.5b; line 48 standalone locks as Pharmaceutical-Grade without PENDING (Refinement 5 evidence-strength bar — uniformly-pharma supplier set).

### 6A — Original 8 B-vitamin + amino acid pairs

| # | Substance | Wave 1 entry | Wave 2 entry | Renamed (both) |
|---|---|---|---|---|
| B4.1.1 | Thiamine (B1) | line 21 ($180) | line 130 ($58) | `Thiamine HCl (USP, Tier-A/B)` PENDING TIER VERIFICATION |
| B4.1.2 | Niacinamide (B3) | line 23 ($45) | line 133 ($18) | `Niacinamide (USP, Tier-A/B)` PENDING TIER VERIFICATION |
| B4.1.3 | Calcium Pantothenate (B5) | line 24 ($85) | line 138 ($32) | `d-Calcium Pantothenate (USP, Tier-A/B)` PENDING TIER VERIFICATION |
| B4.1.4 | Pyridoxine HCl (B6) | line 25 ($120) | line 140 ($38) | `Pyridoxine HCl (USP, Tier-A/B)` PENDING TIER VERIFICATION |
| B4.1.5 | P5P Active B6 | line 26 ($680) | line 141 ($145) | `Pyridoxal 5-Phosphate (P5P, Tier-A/B)` PENDING TIER VERIFICATION |
| B4.1.6 | L-Lysine HCl | line 54 ($8) | line 200 ($14) | `L-Lysine HCl (USP, Tier-A/B)` PENDING TIER VERIFICATION (cost inversion flagged) |
| B4.1.7 | L-Citrulline Malate | line 56 ($52) | line 199 ($32) | `L-Citrulline Malate 2:1 (USP, Tier-A/B)` PENDING TIER VERIFICATION |
| B4.1.8 | Taurine | line 58 ($14) | line 208 ($8.50) | `Taurine (USP, Tier-A/B)` PENDING TIER VERIFICATION |

**Synonyms preservation:** Vitamin-prefix designations (B1/B3/B5/B6) migrate to `synonyms` array on both entries. Pattern matches §II.9a form-first canonical convention.

### 6B — Line 48 standalone (no PENDING)

| Line | Renamed |
|---|---|
| 48 | `L-Selenomethionine (USP, Pharmaceutical-Grade)` — locks per Refinement 5 evidence-strength bar (Pharma Nord + NSF Biotech + Dr. Paul Lohmann uniformly pharmaceutical-tier) |

### 6C — Three added pair-equivalents

| Pair | Wave 1 | Wave 2 | Renamed |
|---|---|---|---|
| Mg Stearate | line 108 ($12) | line 325 ($6.50) | `Magnesium Stearate (Vegetable, USP, Tier-A/B)` PENDING TIER VERIFICATION |
| L-Arginine HCl | line 55 ($28) | line 198 ($24) | `L-Arginine HCl (USP, Tier-A/B)` PENDING TIER VERIFICATION |
| Creatine Monohydrate | line 60 ($14) | line 205 ($22) | `Creatine Monohydrate (Creapure, USP, Tier-A/B)` PENDING TIER VERIFICATION (AlzChem sole manufacturer; Step 1 cleanup flag) |

**Phase 2 queue:** All 11 tier-pairs enter as tier-pair verifications. Single queue file `docs/pa-verification/2026-05-20-pattern-1-tier-pair-verifications.md` covers all 11. Creatine specifically flags Step 1 manufacturer/vendor restructure (Kyowa/NutraBio/Goldwell/GNC → `commonlyDistributedThrough`; AlzChem → `manufacturer`).

---

## 7. B4.3.x cross-category seam — 4 routing decisions

### B4.3.1 — Glucosamine Sulfate Potassium

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `Glucosamine Sulfate Potassium (USP)` | `Glucosamine Sulfate 2KCl (USP)` |
| Line | 295 | 91 |

**Action:** Keep line 91 in Specialty Compounds (chemistry-precise "2KCl" naming); deprecate line 295. Required preservation work:

- **FALCPA allergen string upgrade (MANDATORY per harm-critical floor):** `['Shellfish']` → `['Crustacean Shellfish']` on line 91
- **Supplier-set union:** add `TSI USA` + `Rottapharm (Dona)` to line 91 (interim array shape; restructures via Round 12 Step 1 manufacturer/vendor refactor)
- **Notes union:** add line 295's Dona clinical-evidence context to line 91's technical framing

### B4.3.2 — Chondroitin Sulfate

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `Chondroitin Sulfate 90% (Bovine, USP)` | `Chondroitin Sulfate Sodium (Bovine, 90%)` |
| Line | 296 | 92 |

**Action:** Keep line 92 in Specialty Compounds (chemistry-precise "Sodium" salt-form naming); deprecate line 296. Supplier-set union: add `TSI USA` to line 92.

### B4.3.3 — MSM (DEFERRED)

**Routing: Phase 2 verification queue per Refinement 4 positioning-in-naming check.** Line 93 names OptiMSM brand; line 297 uses USP-only framing. Both list Bergstrom Nutrition (OptiMSM) as supplier. Cannot disambiguate (a) two distinct products vs (b) catalog-authoring inconsistency without supplier-COA evidence. Both entries retain with PENDING SPEC VERIFICATION during Step 0.5b.

**Queue file:** `docs/pa-verification/2026-05-20-msm-optimsm-vs-usp-disambiguation.md`

### B4.3.4 — CoQ10 Ubiquinol

| Field | Deprecated | Survivor |
|---|---|---|
| Entry | `CoQ10 Ubiquinol (Kaneka QH, Reduced Form)` | `CoQ10 Ubiquinol (Reduced Active Form)` |
| Line | 267 | 90 |
| Category | Antioxidants | **Specialty Compounds** per §III.18 + ubiquinone-family consistency (lines 89 + 266) |

**Action:** Keep line 90 in Specialty Compounds; deprecate line 267. Cost gap ($720 vs $580) resolved by cost-as-indicative reframe (no tier-attribution needed). No supplier-set union (Kaneka common to both).

---

## 8. B4.2.x borderline-marketing — 2 routing decisions

### B4.2.1 — Zinc Picolinate "Premium" (DEFERRED)

**Routing: Phase 2 verification queue per manufacturer/vendor confusion pattern.** Line 172's "suppliers" (Thorne Research + Jarrow Formulas Bulk) are finished-product consumer brands, not raw-ingredient manufacturers — pre-manufacturer/vendor-refactor malformation. "Premium" qualifier doesn't survive §II.9a Refinement 2 regardless of resolution path.

**Queue file:** `docs/pa-verification/2026-05-20-zinc-picolinate-thorne-jarrow-supplier-disambiguation.md`. Three resolution paths captured in queue scope:
- (a) Line 172 deprecated entirely (malformed catalog data — Thorne/Jarrow are finished-product brands)
- (b) Line 172 restructured during Step 1 manufacturer/vendor refactor (Thorne/Jarrow → `commonlyDistributedThrough`; upstream manufacturer identified)
- (c) Line 172 renamed to explicit tier-qualifier (if Thorne/Jarrow legitimately distribute raw ingredient)

All three paths drop "Premium" qualifier.

### B4.2.2 — Selenium L-Selenomethionine (reclassified to No-action)

**Routing: No-action (legitimate form variants per §IV.23) + line 186 rename per §II.9a Refinement 3 "Organic" disambiguation.**

| Line | Current name | Action |
|---|---|---|
| 48 | `Selenium L-Selenomethionine (USP)` | Renames in Pattern 1 batch (Section 6B) to `L-Selenomethionine (USP, Pharmaceutical-Grade)` |
| 186 | `Selenomethionine (Organic Selenium)` | **Rename to `Selenomethionine (Selenium-Yeast, Yeast-Bound Form)`** — explicit chemistry-form framing; "Organic" qualifier overload resolved |

Pure synthetic L-selenomethionine (line 48) vs selenium-yeast-bound selenomethionine (line 186) are distinct chemistry/sourcing per §IV.23 form-axis differentiation. No consolidation.

---

## 9. Phase 2 verification queue — 7 deferred items + 16 tier-pair verifications

### Substance-disambiguation queue files (7 items)

| # | Substance | Surfacing event | Queue file |
|---|---|---|---|
| 1 | Vitamin K2 MK-7 | B4.4.3 — cost + allergen + form inconsistencies | `2026-05-20-vitamin-k2-mk7-supplier-spec-reconciliation.md` |
| 2 | L. acidophilus NCFM | Pre-existing per [[project_phase_2_verification_queue]] — CFU discrepancy (50B vs 10B) | (existing queue file) |
| 3 | MSM | B4.3.3 — OptiMSM vs USP positioning-in-naming | `2026-05-20-msm-optimsm-vs-usp-disambiguation.md` |
| 4 | Zinc Picolinate | B4.2.1 — Thorne/Jarrow manufacturer/vendor confusion | `2026-05-20-zinc-picolinate-thorne-jarrow-supplier-disambiguation.md` |
| 5 | Vitamin D3 Vegan Lichen | Cluster C C.1 — Nordic Naturals/Vitashine/Lumi manufacturer disambiguation | `2026-05-20-vegan-d3-lichen-manufacturer-disambiguation.md` |
| 6 | Chromium Picolinate | Cluster C C.2 — Chromax vs ChromeMate (7x cost gap; multi-brand confusion) | `2026-05-20-chromium-picolinate-chromax-vs-chromemate-disambiguation.md` |
| 7 | Krill Oil | Cluster C C.3 — Aker Superba vs Superba 2 + Enzymotec + Neptune + Rimfrost conflation | `2026-05-20-krill-oil-multi-brand-disambiguation.md` |

### Tier-pair verifications (16 items batched into 2 queue files)

| Batch | Pairs | Queue file |
|---|---|---|
| Bucket 3 (5 pairs) | Mg Oxide, Mg Citrate, Ca Citrate, Cu Gluconate, K Iodide | `2026-05-20-bucket-3-tier-pair-verifications.md` |
| Pattern 1 (11 pairs) | 8 B-vit/AA original + Mg Stearate + L-Arginine + Creatine | `2026-05-20-pattern-1-tier-pair-verifications.md` |

**Total Phase 2 queue scope from this session:** ~23 items (6 new substance-disambiguation + L. acidophilus pre-existing + 16 tier-pair verifications batched).

---

## 10. No-action reclassifications — 4 entries (legitimate form variants)

Per §IV.23 valid differentiation axes (form / supplier-tier / certification / standardization / carrier), these entries are legitimate form variants, NOT duplicates. No consolidation; no rename.

| Pair | §IV.23 axis | Differentiation |
|---|---|---|
| Fish Oil 18/12 TG (line 101) vs Fish Oil 18/12 EE (line 216) | Form | Triglyceride vs Ethyl Ester chemistry (different bioavailability) |
| Fish Oil 40/20 EE (line 102) vs Fish Oil 40/20 TG (line 218) | Form | Same TG-vs-EE distinction |
| L-Selenomethionine USP (line 48) vs Selenomethionine Selenium-Yeast (line 186) | Form | Pure synthetic vs yeast-bound chemistry |
| Algae Oil DHA/EPA life'sOMEGA (line 104) vs Algal DHA Life's DHA (line 220) | Form | DSM branded product lines — EPA+DHA broader vs DHA-only specific |

---

## 11. Cross-pair patterns observed

Four patterns surfaced during the per-pair routing work; each captures a meta-observation about how the framework operated.

### Pattern A — Framework consistency: Pattern 1 batch grew naturally from 8 to 12 pair-equivalents

Mg Stearate + L-Arginine HCl + Creatine Monohydrate Creapure all fit Pattern 1's evidence shape (heavy supplier overlap on major-tier suppliers; modest-to-significant cost gap; weak tier-evidence per Refinement 5). The framework didn't need to be customized for these pairs — they matched Pattern 1's existing convention rename + Encoding β + Phase 2 queue routing mechanically.

**Meta-observation:** The §II.9a framework, once articulated, applies uniformly across pairs of similar evidence shape. Pattern matching becomes mechanical once the framework is stable.

### Pattern B — Phase 2 queue grew significantly via manufacturer/vendor confusion routing

Vitamin D3 Vegan Lichen + Chromium Picolinate + Krill Oil + Zinc Picolinate all surface the same pre-manufacturer/vendor-refactor malformation pattern: `suppliers: string[]` array conflates raw-ingredient manufacturers with finished-product consumer brands or distributors. The architectural lock (Step 1 manufacturer/vendor refactor) is the natural resolution path.

**Meta-observation:** The architectural decisions made this session (manufacturer/vendor distinction) are load-bearing — ~half the remaining individual Bucket 4 pairs resolved via routing to the architectural-refactor path. Architectural locks aren't decorative; they unlock substantial downstream catalog hygiene work.

### Pattern C — Reclassifications happen on closer review with framework applied

L-Carnitine L-Tartrate (B4.5.1 → Bucket 1 reclassify) and Algae Oil DHA (B4.7.1 → No-action reclassify) both reclassified during per-pair routing when the framework was applied uniformly. Pre-screen had categorized them in Bucket 4 based on surface-level cost gap signals; framework application caught that the underlying evidence supported different routing.

**Meta-observation:** Pre-screen categorization is a starting hypothesis; framework-driven per-pair routing produces the durable classification. The framework catches what surface-level pre-screen misses.

### Pattern D — Verification discipline maturation across the session

Five §II.9 / Option Y refinements surfaced through bidirectional verification between operator framing + Claude reasoning + CC grep evidence. The refinements weren't pre-existing rulebook content; they emerged through the per-pair routing work as the routing-decision evidence demanded clearer principles:

1. **Refinement 1** (regulatory-baseline solo qualifiers don't differentiate) surfaced via B3.5 Potassium Iodide
2. **Refinement 2** (borderline-marketing solo qualifiers don't differentiate) surfaced via B4.2.1 Zinc Picolinate "Premium"
3. **Refinement 3** ("Organic" qualifier overload disambiguation) surfaced via B4.8.1 Flaxseed + B4.2.2 Selenium
4. **Refinement 4** (pre-consolidation positioning-in-naming check) surfaced via B4.3.3 MSM push-back
5. **Refinement 5** (tier-attribution evidence-strength bar) surfaced via line 48 single-entry case

The catalog-authoring rulebook §II.9a section (committed at hash `159de40`) is the durable artifact capturing this discipline maturation; the per-pair routing decisions in this final-routing artifact are the worked examples that produced the discipline.

**Meta-observation:** The verification-architecture isn't just catching errors; it's producing discipline refinements that future-Claude sessions inherit. The discipline-maturation pattern operates at every layer where state can be checked against assumption — catalog content (Q-Audit-3 enzyme split; K2 MK-7 allergen finding; Pattern 1 cherry-picked anomaly flags) AND git state (Block 1 Commit 1 scope mismatch). Useful discipline observation worth holding.

---

## 12. Step 0.5 scope implications

### Sub-task breakdown

| Sub-task | Work | Entry count |
|---|---|---|
| **0.5a** Same-SKU consolidations | Bucket 1 (4) + Bucket 2 (4) + B4.3.1 + B4.3.2 + B4.3.4 | ~11 consolidations (deletions paired with survivor edits) |
| **0.5b** Naming-convention renames | Bucket 3 (10 entries) + B4.8.1 (1) + Pattern 1 batch (23 entries) + B4.2.2 line 186 (1) | ~35 renames |
| **0.5c.i** Joint family migration (Specialty → Specialty Compounds) | 9 entries | per Q-Audit-3 routing |
| **0.5c.ii** Digestive enzyme migration (Specialty → Enzymes) | 6 entries | per [[project_enzyme_categorization_review]] forward |
| **0.5c.iii** Bromelain consolidation (Enzymes survivor) | folded into B2.4 in 0.5a | (counted above) |
| **0.5c.iv** Choline family + Phosphatidylserine migration → Specialty Compounds | 8 entries (7 choline + 1 PS) | per Q-Audit-3 + Q-Audit-4 PS routing |
| **0.5c.v** Mushroom triple-entry consolidation | 6 deprecations + 3 survivor supplier-set unions | per Q-Audit-2 |
| **0.5c.vi** §III.15 enum update + validator M15 verification | Rulebook + validator commit | (rulebook + cost-vendor-architecture + §II.9a already landed in Block 1 commits) |
| **0.5c.vii** Omega-3 category enforcement | 6 entries (mis-categorized omega-3 sources in Fatty Acids → Omega-3s) | per Q-Audit-4 routing |

**Total Step 0.5 work:** ~75 catalog-entry touches + rulebook/validator updates. Estimated **5-8 sessions of focused Step 0.5 execution work**.

### Step 0.5 sequencing within

- **0.5a + 0.5c.iii (Bromelain)** ship together — consolidation work
- **0.5b + 0.5c.vi (§III.15 enum)** ship together — naming-convention + rulebook enforcement
- **0.5c.i through 0.5c.v** ship per-category (parallel sub-streams)
- **0.5c.vii (Omega-3 enforcement)** ships independently — narrow scope

### Validator gating throughout

Every Step 0.5 commit runs through Catalog Entry Validator (`.claude/agents/catalog-entry-validator.md`). Verdict states:
- **PASS** — commit proceeds
- **PUSHBACK-ENTRY** — entry-specific authoring error; blocks commit until fixed
- **PUSHBACK-STRUCTURAL** — informational (Step 1 schema-prerequisite hasn't landed during Step 0.5); does NOT block commit
- **ROUTING-REQUIRED** — operator+Opus judgment call surfaces back

---

## 13. Round 12 sequencing locks

### Step ordering

1. **Step 0** — Per-category audit (lighter than rider implied; this audit's drift inventory + this routing artifact satisfy most of Step 0 scope)
2. **Step 0.5** — Catalog hygiene wave (5-8 sessions per §12 above)
3. **Step 1** — Schema migration (single architectural commit per Q1 Comprehensive routing)
4. **Step 1 sub-waves** — Field-batched commits (one field migrated across all 600 entries per commit)
5. **Steps 2-8** — Per-entry / per-field backfills per rider scope

### Step 1 scope (consolidated from this session)

Step 1 architectural commit contains:

- **Audit #2 schema migrations** — ~51 field additions + 3 shape reconciliations (Q-Sh1/Sh2/Sh3 per `docs/audits/rulebook-vs-types-drift.md` §6)
- **Cost reframe** — `costEstimateAsOf` + `costBuyerTierAssumption` companion fields per `docs/architecture/cost-and-vendor-architecture.md` Stage 1
- **Manufacturer/vendor distinction** — `suppliers: string[]` → structured `manufacturer` field per `docs/architecture/cost-and-vendor-architecture.md` Section 3
- **§II.9a + §III.15 enum update + validator M15 update** — folded into Step 0.5c.vi or Step 1 per execution-ordering preference

**Step 1 estimate:** ~12-25 sessions of focused migration work (grown from rider's original 10-20 estimate due to cost + manufacturer/vendor additions).

### Phase 2 verification queue parallel-track

Phase 2 verification queue (~23 items from this session + L. acidophilus NCFM pre-existing) processes parallel-track to Step 1. PA verification cadence is independent of schema-migration cadence; items resolve as supplier-COA evidence returns.

When tier-pair verifications resolve (Phase 2 Wave B), Tier-A / Tier-B placeholder naming gets replaced with Pharmaceutical-Grade / Commodity Sourcing per Encoding β post-verification convention.

When substance-disambiguation queue items resolve, entries either consolidate (Path A), restructure via manufacturer/vendor refactor (Path B), or deprecate (Path C) per the queue-file resolution paths.

### Cross-domain transfer (F&B Recipe Validator, Q4 2026+)

The four-layer architecture + §II.9a discipline framework + Option Y PENDING-suffix verification pattern transfer to the F&B Recipe Validator build per `docs/architecture/cost-and-vendor-architecture.md` Section 6. Q-Audit-1's worked-example evidence base provides the cross-domain template.

---

## 14. Closing note

Q-Audit-1 closed cleanly. 32 pair-equivalents resolved + 7 deferred + 4 No-action reclassified. Five rulebook discipline refinements surfaced + committed. Round 12 sequencing locked. Phase 2 verification queue scoped at ~23 items. Step 0.5 execution work ready to kick off in subsequent sessions.

This artifact is the canonical consolidated output of Q-Audit-1 per-pair routing. Pre-screen (`q-audit-1-pre-screen.md`) is retained as audit trail for pre-routing evidence base; this artifact supersedes it structurally.

Future-Claude sessions executing Step 0.5 should treat this artifact as the per-pair routing source-of-truth. Per-pair decisions, queue-routings, and Phase 2 verifications are all enumerated here with line numbers + framework backing references.

— Q-Audit-1 Final Routing artifact authored 2026-05-20; operator + Opus + CC session post-Q-Audit-1 closure.
