# Bucket 3 — Mineral Tier-Pair Verifications Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (Bucket 3 batch; see `docs/audits/q-audit-1-final-routing.md` Section 4)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Tier-attribution disambiguation for 5 mineral tier-pairs. Each pair carries Tier-A / Tier-B placeholder naming with `PENDING TIER VERIFICATION` suffix during Step 0.5b. Supplier-COA evidence determines whether the higher-cost entry warrants `Pharmaceutical-Grade Sourcing` attribution (per §II.9a Refinement 5 evidence-strength bar) or whether both entries are Commodity Sourcing variants distinguished only by cost.

The shared evidence shape across all 5 pairs: one entry has a supplier set leaning toward recognized pharma/food-grade chemical specialists (Dr. Paul Lohmann + Magnesia GmbH + Jungbunzlauer + Gadot Biochemical), and the sibling entry has a supplier set leaning toward commodity-tier or mixed-tier producers. Cost gap reflects manufacturing-tier difference, but supplier-COA evidence is needed to confirm Pharmaceutical-Grade vs Commodity Sourcing attribution at the rulebook's evidence bar.

### The 5 pairs

**B3.1 — Magnesium Oxide**
- Line 42 [$4.20] → `Magnesium Oxide (USP, Tier-A)` — Dr. Paul Lohmann + Magnesia GmbH + Premier Magnesia
- Line 162 [$1.80] → `Magnesium Oxide (USP, Tier-B)` — Martin Marietta Magnesia + RHI Magnesita + Premier Magnesia
- Shared supplier: Premier Magnesia (appears on both sides)

**B3.2 — Magnesium Citrate**
- Line 43 [$7.80] → `Magnesium Citrate (USP, Tier-A)` — Jungbunzlauer + Gadot Biochemical + Dr. Paul Lohmann
- Line 163 [$6.80] → `Magnesium Citrate (USP, Tier-B)` — Jungbunzlauer + Global Calcium + Dr. Paul Lohmann
- Shared suppliers: Jungbunzlauer + Dr. Paul Lohmann (appear on both sides) — supplier-overlap pattern suggests tier-pair may not lock cleanly

**B3.3 — Calcium Citrate**
- Line 40 [$8.50] → `Calcium Citrate (USP, Tier-A)` — Jungbunzlauer + Gadot Biochemical + Dr. Paul Lohmann
- Line 157 [$4.50] → `Calcium Citrate (USP, Tier-B)` — Jungbunzlauer + Balchem + Gadot Biochemical
- Shared suppliers: Jungbunzlauer + Gadot Biochemical (appear on both sides)

**B3.4 — Copper Gluconate**
- Line 49 [$42] → `Copper Gluconate (USP, Tier-A)` — Jungbunzlauer + Dr. Paul Lohmann + Gadot Biochemical
- Line 180 [$28] → `Copper Gluconate (USP, Tier-B)` — Dr. Paul Lohmann + Jungbunzlauer
- Shared suppliers: Jungbunzlauer + Dr. Paul Lohmann (appear on both sides)

**B3.5 — Potassium Iodide**
- Line 51 [$58] → `Potassium Iodide (USP, Tier-A)` — Deepwater Chemicals + Iofina Chemical + SQM ("Food-Grade" qualifier replaced — regulatory baseline per §II.9a Refinement 1)
- Line 190 [$38] → `Potassium Iodide (USP, Tier-B)` — Dr. Paul Lohmann + SQM
- Shared supplier: SQM (appears on both sides; major commodity iodine producer)

## Where This Lands Once Verified

`lib/data/supplements.ts` — 10 entries across 5 pairs. Resolution path per pair:

- **(a) Tier-distinction confirmed (Tier-A supplier set verified as uniformly-pharma sourcing; Tier-B supplier set commodity sourcing):** Rename Tier-A → `(USP, Pharmaceutical-Grade Sourcing)`; rename Tier-B → `(USP, Commodity Sourcing)`. Both entries retain as legitimate tier-pair variants per §IV.23 supplier-tier differentiation axis.
- **(b) Tier-distinction NOT confirmed (supplier-overlap pattern means neither side is uniformly tier-specific; cost gap reflects market timing or volume pricing rather than manufacturing tier):** Consolidate to single entry; deprecate redundant entry; supplier-set union into survivor.
- **(c) Step 1 manufacturer/vendor restructure:** When Step 1 schema migration lands the structured `manufacturer` field, supplier sets restructure into `manufacturer: { type: 'commodity', knownManufacturers: [...] }`. Tier-attribution may become a sub-field of the structured form rather than encoded in display name.

Per §II.9a Refinement 5 evidence-strength bar, single-entry locks (no PENDING suffix) require uniformly-pharma supplier evidence. The Bucket 3 batch's heavy supplier-overlap pattern (Jungbunzlauer + Dr. Paul Lohmann + Gadot Biochemical appear across multiple pairs in both Tier-A and Tier-B roles) is what triggers Tier-A / Tier-B placeholder framing rather than direct lock per Encoding β.

## Open Questions for PA / Supplier-COA

Common to all 5 pairs:

1. **Supplier-COA evidence per supplier per pair:** Does each supplier produce the substance at Pharmaceutical-Grade specifications (USP-NF identity + assay + heavy metals + microbial spec) or Commodity/Technical Grade (food-grade, industrial-grade, or feed-grade)? Same supplier may produce multiple tiers internally.
2. **Heavy-supplier-overlap implications:** Jungbunzlauer + Dr. Paul Lohmann + Gadot Biochemical appear on both sides of multiple pairs. Does the supplier produce single-tier output that gets re-classified by buyer-tier purchaser, OR multiple-tier output that the catalog needs to disambiguate per-pair?
3. **Cost-tier alignment:** Does the cost differential ($4.20 vs $1.80 for Mg Oxide; $58 vs $38 for KI; $42 vs $28 for Cu Gluconate) reflect manufacturing-tier difference, OR raw-material market timing, OR supplier-relationship pricing variance? Cost alone doesn't establish tier; supplier-COA does.
4. **B3.5 specific — current `(USP, Food-Grade)` qualifier:** Line 51 currently named `Potassium Iodide (USP, Food-Grade)`. Per §II.9a Refinement 1, "Food-Grade" alongside "USP" is double-baseline framing — neither qualifier differentiates from the sibling line 190. Deepwater Chemicals + Iofina Chemical (specialty iodine producers) supplier set on line 51 vs Dr. Paul Lohmann (pharma-tier) on line 190 inverts the expected Tier-A/Tier-B mapping if pharma-tier evidence dominates Refinement 5 attribution.
5. **B3.1 specific — Magnesia GmbH on Tier-A:** Magnesia GmbH's pharma-tier vs industrial-tier production mix needs verification. If Magnesia GmbH produces predominantly industrial-tier MgO with occasional pharma-tier output, the line 42 supplier set may not uniformly meet Refinement 5 bar.
6. **Per Round 12 Step 1 refactor:** Once Step 1 lands the structured `manufacturer` field, do these tier-pairs become single entries with tier as a sub-field, OR do they remain separate entries with tier encoded in the entry name? Architectural-policy decision pending; the operator + Opus discussion of this is captured in `docs/architecture/cost-and-vendor-architecture.md` §3.

## Context

Surfaced during Q-Audit-1 per-pair routing (Bucket 3 batch — all 5 pairs routed mechanically per shared evidence shape; see `docs/audits/q-audit-1-final-routing.md` Section 4). The §II.9a Refinement 5 (evidence-strength bar) is the discipline pattern that triggered batch routing rather than per-pair lock — when supplier evidence is mixed across a tier-pair, PENDING TIER VERIFICATION via Tier-A / Tier-B placeholder framing is the routing per Meta-option 1 retroactive Option Y discipline (Encoding β).

**Step 0.5 disposition:** All 10 entries rename to Tier-A / Tier-B + PENDING TIER VERIFICATION suffix during Step 0.5b. Supplier-COA verification resolves to Pharmaceutical-Grade Sourcing / Commodity Sourcing attribution post-Phase 2 Wave B.

**Cross-references:**
- `docs/audits/q-audit-1-final-routing.md` Section 4 (per-pair routing decisions for B3.1–B3.5)
- `docs/audits/q-audit-1-final-routing.md` Section 11 Pattern A (mechanical framework-fit meta-observation)
- `docs/architecture/catalog-authoring-rulebook.md` §II.9a Refinement 5 (tier-attribution evidence-strength bar)
- `docs/architecture/catalog-authoring-rulebook.md` §II.9a Refinement 1 (regulatory-baseline solo qualifiers; "Food-Grade" replacement context for B3.5)
- `docs/architecture/cost-and-vendor-architecture.md` (manufacturer/vendor distinction; Step 1 architectural lock affecting downstream restructure path)
