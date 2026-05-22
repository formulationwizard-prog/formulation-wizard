# Pattern 1 — B-Vitamin / Amino Acid / Excipient Tier-Pair Verifications Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (Pattern 1 batch; see `docs/audits/q-audit-1-final-routing.md` Section 6)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Tier-attribution disambiguation for 11 tier-pairs across three substance families: B-vitamins (5 pairs), amino acids (3 original), excipient + amino acids + branded form (3 added). Each pair carries Tier-A / Tier-B placeholder naming with `PENDING TIER VERIFICATION` suffix during Step 0.5b. Supplier-COA evidence determines whether the higher-cost entry warrants `Pharmaceutical-Grade Sourcing` attribution (per §II.9a Refinement 5 evidence-strength bar) or whether both entries are Commodity Sourcing variants distinguished only by cost.

The shared evidence shape across Pattern 1 pairs: **heavy supplier-overlap on major-tier suppliers** (Kyowa Hakko + Ajinomoto + CJ Bio + Evonik common across multiple amino-acid pairs; DSM + Lonza + similar pharma-tier producers common across B-vitamin pairs), **modest-to-significant cost gap** between Wave 1 and Wave 2 entries, **weak tier-evidence** per Refinement 5 — supplier overlap means neither entry has uniformly-tier-specific suppliers that would lock attribution at the single-entry level.

### B-Vitamin pairs (5)

**B4.1.1 — Thiamine HCl**
- Line 21 [$180] → `Thiamine HCl (USP, Tier-A)`
- Line 130 [$58] → `Thiamine HCl (USP, Tier-B)`

**B4.1.2 — Niacinamide**
- Line 23 [$45] → `Niacinamide (USP, Tier-A)`
- Line 133 [$18] → `Niacinamide (USP, Tier-B)`

**B4.1.3 — d-Calcium Pantothenate**
- Line 24 [$85] → `d-Calcium Pantothenate (USP, Tier-A)`
- Line 138 [$32] → `d-Calcium Pantothenate (USP, Tier-B)`

**B4.1.4 — Pyridoxine HCl**
- Line 25 [$120] → `Pyridoxine HCl (USP, Tier-A)`
- Line 140 [$38] → `Pyridoxine HCl (USP, Tier-B)`

**B4.1.5 — P5P (Pyridoxal 5-Phosphate)**
- Line 26 [$680] → `Pyridoxal 5-Phosphate (P5P, Tier-A)`
- Line 141 [$145] → `Pyridoxal 5-Phosphate (P5P, Tier-B)`

### Amino acid pairs (3 original)

**B4.1.6 — L-Lysine HCl (COST INVERSION + HIDDEN TIER-ATTRIBUTION FLAGGED)**
- Line 54 [$8] CURRENT name `L-Lysine HCl (Pharma Grade, 78%)` — Ajinomoto + CJ CheilJedang + ADM + Evonik → renames to `L-Lysine HCl (USP, Tier-A)` PENDING TIER VERIFICATION
- Line 200 [$14] CURRENT name `L-Lysine HCl (USP)` — Ajinomoto + CJ Bio + Evonik → renames to `L-Lysine HCl (USP, Tier-B)` PENDING TIER VERIFICATION
- **Cost inversion:** Wave 1 ($8) is CHEAPER than Wave 2 ($14). This inverts the typical Pattern 1 cost-gap direction (Wave 1 higher cost = pharma tier).
- **Hidden tier-attribution:** Line 54's current name includes "(Pharma Grade, 78%)" — a tier-attribution claim per §II.9a Refinement 5 (not surfaced by hyphenated-form grep on `Pharmaceutical-Grade`; non-hyphenated form). Renaming to `(USP, Tier-A)` PENDING removes the hidden claim during Step 0.5b. Whether the "Pharma Grade" claim is supplier-COA-substantiated is itself a Refinement 5 verification question.

**B4.1.7 — L-Citrulline Malate 2:1**
- Line 56 [$52] → `L-Citrulline Malate 2:1 (USP, Tier-A)`
- Line 199 [$32] → `L-Citrulline Malate 2:1 (USP, Tier-B)` — Kyowa Hakko (USA) + Ajinomoto

**B4.1.8 — Taurine**
- Line 58 [$14] → `Taurine (USP, Tier-A)`
- Line 208 [$8.50] → `Taurine (USP, Tier-B)` — Kyowa Hakko + Brother Enterprises + Qianjiang Yongan

### Added pairs (3)

**Magnesium Stearate**
- Line 108 [$12] → `Magnesium Stearate (Vegetable, USP, Tier-A)`
- Line 325 [$6.50] → `Magnesium Stearate (Vegetable, USP, Tier-B)`

**L-Arginine HCl**
- Line 55 [$28] → `L-Arginine HCl (USP, Tier-A)` — Ajinomoto + CJ CheilJedang + Kyowa Hakko
- Line 198 [$24] → `L-Arginine HCl (USP, Tier-B)` — Kyowa Hakko + Ajinomoto + Evonik

**Creatine Monohydrate Creapure (COST INVERSION + STEP 1 CLEANUP FLAG)**
- Line 60 [$14] → `Creatine Monohydrate (Creapure, USP, Tier-A)`
- Line 205 [$22] → `Creatine Monohydrate (Creapure, USP, Tier-B)` — Kyowa + NutraBio + Goldwell + GNC
- **Cost inversion:** Wave 2 ($22) is HIGHER than Wave 1 ($14).
- **Manufacturer/vendor confusion:** Wave 2 supplier set is malformed — AlzChem is the SOLE manufacturer of Creapure (branded creatine); Kyowa + NutraBio + Goldwell + GNC are downstream distributors and finished-product brands, NOT raw-ingredient manufacturers. Per Round 12 Step 1 manufacturer/vendor refactor, these distribute through `commonlyDistributedThrough` reference; `manufacturer.brandName: 'Creapure'` with `manufacturer.name: 'AlzChem'`. The "tier-pair" framing may dissolve entirely post-Step-1 (single entry with tier as sub-field, or two entries with manufacturer disambiguation rather than tier-attribution).

## Where This Lands Once Verified

`lib/data/supplements.ts` — 22 entries across 11 pairs. Resolution path per pair:

- **(a) Tier-distinction confirmed (Tier-A supplier set is uniformly-pharma; Tier-B is mixed or commodity):** Rename Tier-A → `(USP, Pharmaceutical-Grade Sourcing)`; rename Tier-B → `(USP, Commodity Sourcing)`. Both entries retain as legitimate tier-pair variants per §IV.23 supplier-tier axis.
- **(b) Tier-distinction NOT confirmed (heavy supplier-overlap means neither side is uniformly tier-specific; cost gap reflects market timing or relationship pricing rather than manufacturing tier):** Consolidate; supplier-set union into survivor; deprecate redundant entry.
- **(c) Cost inversion resolves to data error (L-Lysine HCl B4.1.6, Creatine Monohydrate Creapure):** Correct cost data; route to tier-attribution per the corrected evidence base.
- **(d) Creatine Monohydrate specifically — Step 1 dissolution path:** Once `manufacturer` field lands per Round 12 Step 1, "Creapure" branded form becomes single entry with `manufacturer.brandName: 'Creapure'` + `manufacturer.name: 'AlzChem'` + `commonlyDistributedThrough: ['Kyowa', 'NutraBio', 'Goldwell', 'GNC']`. Tier-pair framing dissolves into single-entry shape with manufacturer disambiguation rather than tier-attribution encoding.

## Open Questions for PA / Supplier-COA

Common to all 11 pairs:

1. **Supplier-COA evidence per supplier per pair:** Does each supplier produce the substance at Pharmaceutical-Grade specifications (USP/EP/JP identity + assay + impurity limits + heavy metals + microbial spec) or Commodity/Technical-Grade (food-grade-only, feed-grade, or industrial-grade)?
2. **Heavy-supplier-overlap implications:** When the same supplier (e.g., Kyowa Hakko, Ajinomoto) appears across multiple pairs in different tier-roles, does that supplier produce single-tier output that gets re-classified by buyer-tier purchaser? Or does the supplier produce multiple tiers internally?
3. **Cost-tier alignment at the substance-family level:** Is the typical cost gap (Wave 1 high, Wave 2 low) a reliable proxy for Pharmaceutical-Grade vs Commodity Sourcing across the B-vitamin / amino-acid families? Or is the gap explainable by purchase volume, relationship duration, or contract structure rather than manufacturing tier?
4. **Cost-inversion specific cases:**
   - L-Lysine HCl B4.1.6 ($8 Wave 1 vs $14 Wave 2 + hidden "Pharma Grade" claim on Wave 1): is the tier assignment inverted (Wave 1 is actually Tier-B and Wave 2 is Tier-A)? Or is the "Pharma Grade, 78%" on Wave 1 a misclaim that supplier-COA disconfirms? Or is the Wave 2 cost mis-specified?
   - Creatine Monohydrate Creapure ($14 Wave 1 vs $22 Wave 2): is the Wave 2 supplier set functioning as a finished-product distribution channel rather than tier? Per Step 1 refactor, this restructures to `commonlyDistributedThrough`.
5. **Per Round 12 Step 1 refactor — manufacturer/vendor distinction:** Pattern 1 pairs may dissolve into single entries with structured `manufacturer` field per the Step 1 architectural lock (`docs/architecture/cost-and-vendor-architecture.md` §3). Should tier-attribution become a sub-field of the structured `manufacturer` form (e.g., `manufacturer: { tier: 'pharmaceutical' | 'commodity', ... }`) or a sibling field on the entry itself?

## Context

Surfaced during Q-Audit-1 per-pair routing (Pattern 1 batch — 11 pairs across three substance families with shared evidence shape per Pattern A meta-observation; see `docs/audits/q-audit-1-final-routing.md` Section 6 + Section 11 Pattern A). The §II.9a Refinement 5 (evidence-strength bar) is the discipline pattern that triggered batch routing — when supplier evidence is mixed across a tier-pair, PENDING TIER VERIFICATION via Tier-A / Tier-B placeholder framing is the routing per Meta-option 1 retroactive Option Y discipline (Encoding β).

The pattern grew naturally from 8 original B-vitamin + amino-acid pairs to 12 pair-equivalents (counting the 3 added pairs + B4.1.6 cost inversion + Creatine Monohydrate Step 1 flag) during per-pair routing, reflecting framework-fit consistency per Pattern A meta-observation.

**Step 0.5 disposition:** All 22 entries rename to Tier-A / Tier-B + PENDING TIER VERIFICATION suffix during Step 0.5b. Supplier-COA verification resolves to Pharmaceutical-Grade Sourcing / Commodity Sourcing attribution post-Phase 2 Wave B. Creatine Monohydrate specifically flags for Step 1 manufacturer/vendor restructure; B4.1.6 L-Lysine HCl flags for cost-data verification + hidden-tier-attribution-claim disambiguation.

**Cross-references:**
- `docs/audits/q-audit-1-final-routing.md` Section 6 (per-pair routing decisions for B4.1.1–B4.1.8 + added pairs)
- `docs/audits/q-audit-1-final-routing.md` Section 11 Pattern A (mechanical framework-fit meta-observation; Pattern 1 batch grew naturally from 8 to 12 pair-equivalents)
- `docs/architecture/catalog-authoring-rulebook.md` §II.9a Refinement 5 (tier-attribution evidence-strength bar)
- `docs/architecture/cost-and-vendor-architecture.md` (manufacturer/vendor distinction; Step 1 architectural lock; Creapure-specific restructure trigger; affects tier-pair dissolution path)
- `docs/audits/pre-step-0-5b-catalog-drift-audit.md` (catalog-drift audit surfaces B4.1.6 line 54 hidden tier-attribution claim — "Pharma Grade, 78%" — that non-hyphenated grep caught)
