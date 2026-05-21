# Zinc Picolinate (Thorne/Jarrow) — Supplier-Set Disambiguation Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (B4.2.1 deferral)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Disambiguate whether `Zinc Picolinate (Premium)` [line 172] represents:

- **(a)** Malformed catalog data — finished-product consumer brands (Thorne Research, Jarrow Formulas Bulk) mislisted as raw-ingredient manufacturers
- **(b)** Legitimate consumer-distribution-channel reference encoded pre-manufacturer/vendor-refactor (Thorne/Jarrow as `commonlyDistributedThrough` references per Round 12 Step 1 architectural lock)
- **(c)** Real different product genuinely sourced through Thorne Research / Jarrow Formulas Bulk as authorized distributors of a specific zinc picolinate product not available elsewhere

The entries:

- Line 46 `Zinc Picolinate (USP)` Minerals @ $68/kg — Dr. Paul Lohmann + Gadot Biochemical + Balchem (recognizable pharma-grade specialists)
- Line 172 `Zinc Picolinate (Premium)` Minerals @ $38/kg — Thorne Research + Jarrow Formulas Bulk (finished-product consumer brands)

Plus: "Premium" qualifier on line 172 doesn't survive §II.9a Refinement 2 (borderline-marketing solo qualifiers don't differentiate) regardless of resolution path. Cost INVERSION ($68 USP vs $38 "Premium" — "Premium" cheaper) signals naming/data inconsistency. Elemental Zn differs (20% vs 21%) — within measurement variance but signals data-quality concern.

## Where This Lands Once Verified

`lib/data/supplements.ts` lines 46 + 172. All resolution paths drop "Premium" qualifier. Three paths:

- **(a) Malformed data:** deprecate line 172 entirely; supplier-set should never have been catalog-level (Thorne/Jarrow are finished-product brands)
- **(b) Consumer-distribution restructure:** line 172 restructured during Step 1 manufacturer/vendor refactor (Thorne/Jarrow → `commonlyDistributedThrough`; upstream manufacturer identified; "Premium" replaced with explicit tier qualifier IF tier-verified)
- **(c) Real tier-pair:** line 172 renamed to explicit tier-qualifier (if Thorne/Jarrow legitimately distribute a raw-ingredient form); rename per §II.9a + Bucket 3 pattern

## Open Questions for PA / Supplier-COA

1. Do Thorne Research and Jarrow Formulas Bulk distribute raw zinc picolinate as ingredient suppliers (B2B), OR only sell finished consumer products (B2C)?
2. If raw-ingredient distribution: who is the upstream manufacturer Thorne/Jarrow source from? (Likely Nutrition 21 Chromax, but verify.)
3. If finished-product-only: who currently uses this catalog entry's supplier listing for B2B sourcing decisions? (If no one — confirmed malformed data; deprecate.)
4. What's the actual current elemental Zn % spec — 20% per line 46 or 21% per line 172? Industry standard for zinc picolinate is ~20-21% depending on hydration state.
5. Per Round 12 Step 1 refactor: should line 46's supplier set (Dr. Paul Lohmann + Gadot + Balchem) be classified as `manufacturer: { type: 'commodity', knownManufacturers: [...] }` per the architectural lock?

## Context

Surfaced during Q-Audit-1 per-pair routing (B4.2.1; see `docs/audits/q-audit-1-final-routing.md` Section 8). The manufacturer/vendor confusion pattern surfaces clearly here — Thorne Research and Jarrow Formulas are well-known consumer supplement brands, not raw-ingredient chemical manufacturers. Same shape as the broader pattern (Vitamin D3 Vegan Lichen, Chromium Picolinate, Krill Oil) where pre-manufacturer/vendor-refactor `suppliers: string[]` arrays conflate manufacturers with distributors with consumer-product brands.

**Step 0.5 disposition:** Both entries retain with `PENDING SPEC VERIFICATION` suffix; "Premium" qualifier flagged for replacement regardless of resolution path.
