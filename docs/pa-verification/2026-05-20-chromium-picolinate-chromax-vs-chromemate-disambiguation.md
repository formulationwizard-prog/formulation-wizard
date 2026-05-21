# Chromium Picolinate (Chromax vs ChromeMate) — Multi-Brand Disambiguation Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (Cluster C C.2 deferral)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Disambiguate two distinct branded chromium picolinate forms conflated in current catalog supplier-set listings:

- Line 50 `Chromium Picolinate (USP)` Minerals @ $480/kg — Nutrition 21 (**Chromax**) + Dr. Paul Lohmann + Merck KGaA
- Line 183 `Chromium Picolinate (ChromeMate, USP)` Minerals @ $68/kg — Nutrition 21 (**Chromax**) + InterHealth (**ChromeMate**)

**7× cost gap** — meaningfully outside legitimate tier-pair spread (typical 1.5-3×); strong signal of substantive product distinction.

**Chromax (Nutrition 21)** and **ChromeMate (InterHealth)** are two distinct branded forms of chromium picolinate with different clinical-evidence bases. Both entries reference Chromax in supplier set; only line 183 names ChromeMate explicitly. Line 50 also lists Dr. Paul Lohmann + Merck KGaA as commodity-pharma chromium picolinate sources.

Per §II.9a Refinement 4 (pre-consolidation positioning-in-naming check), line 183's ChromeMate naming encodes brand positioning that consolidation would erase. Per §II.9a Refinement 5 (tier-attribution evidence-strength bar), supplier evidence is mixed — both branded + commodity suppliers conflated in both entries.

## Where This Lands Once Verified

`lib/data/supplements.ts` lines 50 + 183. Three resolution paths:

- **(a) Three-product structure (RECOMMENDED route per pre-screen).** Restructure during Round 12 Step 1 manufacturer/vendor refactor into THREE distinct entries:
  - `Chromium Picolinate (Chromax, Nutrition 21 — Branded)` — Nutrition 21 sole `manufacturer`
  - `Chromium Picolinate (ChromeMate, InterHealth — Branded)` — InterHealth sole `manufacturer`
  - `Chromium Picolinate (USP, Commodity Sourcing)` — `manufacturer: { type: 'commodity', knownManufacturers: ['Dr. Paul Lohmann', 'Merck KGaA', ...] }`
- **(b) Two-product structure:** retain Chromax + ChromeMate as legitimate branded forms; consolidate commodity-pharma sources into a single Chromax-branded entry with `commonlyDistributedThrough` references for commodity-tier distribution
- **(c) Consolidate to commodity USP + defer branded variants:** treat as commodity USP single entry; author Chromax and ChromeMate as separate dedicated entries in subsequent waves

## Open Questions for PA / Supplier-COA

1. **Chromax (Nutrition 21):** Confirm Nutrition 21 sole licensor of Chromax branded form. What's the current cost-per-kg for Chromax direct from Nutrition 21?
2. **ChromeMate (InterHealth):** Confirm InterHealth sole licensor of ChromeMate. What's the current cost-per-kg? Is the $68 on line 183 accurate?
3. **Clinical-evidence distinction:** Chromax and ChromeMate have separate clinical-evidence bases per industry literature. Are they reasonably substitutable for operator-formulation purposes, or do they have substantively different bioavailability / clinical positioning?
4. **Chemistry verification subscope:** Are Chromax and ChromeMate chemically identical (both are chromium picolinate) OR do they differ in chelation, stabilization, or carrier? (Industry consensus is they're both chromium picolinate; verify.)
5. **Commodity sourcing legitimacy:** Do Dr. Paul Lohmann + Merck KGaA produce USP-grade chromium picolinate? At what spec? Cost-per-kg should align with line 50's $480 vs line 183's $68 — but the 7× gap suggests line 50's commodity reading is wrong.
6. Per Round 12 Step 1 refactor: which suppliers are `manufacturer` vs `commonlyDistributedThrough` references?

## Context

Surfaced during Q-Audit-1 per-pair routing (Cluster C C.2; see `docs/audits/q-audit-1-final-routing.md` Section 7 + Section 11 Pattern B). 7× cost gap was the largest in the entire Q-Audit-1 surfacing; positioning-in-naming check (Refinement 4) and multi-brand confusion together routed strongly to Phase 2 queue. Same shape as Krill Oil multi-brand conflation — pre-refactor `suppliers: string[]` array mixes competing branded products.

**Step 0.5 disposition:** Both entries retain with `PENDING SPEC VERIFICATION` suffix until manufacturer/vendor restructure resolution.
