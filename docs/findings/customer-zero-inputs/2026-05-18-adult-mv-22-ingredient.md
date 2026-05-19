---
date: 2026-05-18
session: Round 11 Phase 3 Wave 1.5 post-fix browser re-verification
formulation: Constructed-equivalent adult multivitamin (Centrum-shape, 22 ingredients)
input-source: constructed-from-catalog
catalog-commit-hash: d4e8d71
template-version: v1
---

# 22-ingredient adult MV paste — Wave 1.5 post-fix verification

## Paste-list

```
Vitamin A 900 mcg
Vitamin C 90 mg
Vitamin D3 25 mcg
Vitamin E 15 mg
Vitamin K2 100 mcg
Thiamine 1.2 mg
Riboflavin 1.3 mg
Niacinamide 16 mg
Vitamin B6 1.7 mg
Folate 400 mcg
Vitamin B12 2.4 mcg
Biotin 30 mcg
Pantothenic Acid 5 mg
Calcium 200 mg
Iron 8 mg
Magnesium 100 mg
Zinc 11 mg
Selenium 55 mcg
Iodine 150 mcg
Chromium 35 mcg
Manganese 2.3 mg
Copper 0.9 mg
```

## Context

This paste-list is **NOT** the original 2026-05-17 customer-zero Test 1 paste from the Daily Reset MV v2 verification round — that original list lives only in operator session memory and was not preserved as a repo artifact. This is a constructed-equivalent shaped like a typical adult multivitamin (Centrum-style composition) built from common operator-paste names. The intent is to exercise the synonym infrastructure across a realistic multi-ingredient paste, not to reproduce the specific original 22-ingredient input.

Constructing the artifact retroactively addresses a process gap surfaced in the verification round: verification inputs that surfaced multiple gaps + bugs should not live only in operator session memory. This artifact establishes the `docs/findings/customer-zero-inputs/` convention. Future Test 1 re-runs preserve their paste-lists here.

## Expected resolution (per-line, by tier)

| # | Paste line | Expected entry | Expected tier | Rationale |
|---|------------|----------------|---------------|-----------|
| 1 | `Vitamin A 900 mcg` | Vitamin A entry | 2 (stripped-name) | "Vitamin A" matches stripped catalog name |
| 2 | `Vitamin C 90 mg` | Vitamin C (Ascorbic Acid USP, Fine) | 2 (stripped-name) | "Vitamin C" strips to "Vitamin C" |
| 3 | `Vitamin D3 25 mcg` | Vitamin D3 entry | 2 (stripped-name) | — |
| 4 | `Vitamin E 15 mg` | Vitamin E entry (collision pre-1.5d) | 3 (1.5d: collision-detect) | Catalog has 3 Vitamin E forms |
| 5 | `Vitamin K2 100 mcg` | Vitamin K2 entry | 2 (stripped-name) | — |
| 6 | `Thiamine 1.2 mg` | Vitamin B1 (Thiamine HCl) | 2 (whole-word elsewhere) | "Thiamine" matches via head-token |
| 7 | `Riboflavin 1.3 mg` | Vitamin B2 (Riboflavin USP) | 1 (single-sub-ingredient) | subIngredients=['Riboflavin'] |
| 8 | `Niacinamide 16 mg` | Vitamin B3 (Niacinamide USP) | 1 (single-sub-ingredient) | subIngredients=['Niacinamide'] |
| 9 | `Vitamin B6 1.7 mg` | Vitamin B6 (Pyridoxine HCl) | 2 (stripped-name) | "Vitamin B6" strips to "Vitamin B6" |
| 10 | `Folate 400 mcg` | Vitamin B9 (Folic Acid USP) | 1 (synonym, Wave 1.5b) | Synonym backfill target |
| 11 | `Vitamin B12 2.4 mcg` | Vitamin B12 (Cyanocobalamin 1% on Mannitol) | 2 (stripped-name) | — |
| 12 | `Biotin 30 mcg` | d-Biotin (Vitamin H, USP) | 1 (synonym, Wave 1.5c) | Synonym backfill target |
| 13 | `Pantothenic Acid 5 mg` | Vitamin B5 (Calcium d-Pantothenate) | 1 (synonym, Wave 1.5b) | Synonym backfill target |
| 14 | `Calcium 200 mg` | varies (collision) | 3 (1.5d: collision-detect) | Catalog has 5+ Calcium forms |
| 15 | `Iron 8 mg` | Iron entry | 2 or 3 | Multiple iron forms in catalog |
| 16 | `Magnesium 100 mg` | varies (collision) | 3 (1.5d: collision-detect) | Catalog has multiple Mg forms |
| 17 | `Zinc 11 mg` | Zinc Oxide (USP) | 1 or 2 | Token match to Zinc Oxide |
| 18 | `Selenium 55 mcg` | Selenium L-Selenomethionine (USP) | 1 or 2 | Token match |
| 19 | `Iodine 150 mcg` | (no catalog entry) | 4 | Gap — Wave 2 Phase 1+ ticket |
| 20 | `Chromium 35 mcg` | Chromium Picolinate (USP) | 1 or 2 | Token match |
| 21 | `Manganese 2.3 mg` | Manganese entry | 2 or 4 | Form-specific entries only |
| 22 | `Copper 0.9 mg` | Copper Gluconate (USP) | 2 or 3 | Multiple Cu forms in catalog |

## Actual resolution (captured 2026-05-18 from operator browser preview screenshot)

**Headline:** `Parsed 22 rows (21 matched) • 1 unmatched`

**Confirmed lines** (from operator screenshot of the bulk-paste preview):
- Line 17 `Zinc 11 mg` → **Zinc Oxide (USP)** ✓ (Pasted: "Zinc" • Supplier: U.S. Zinc)
- Line 18 `Selenium 55 mcg` → **Selenium L-Selenomethionine (USP)** ✓ (Supplier: Pharma Nord)
- Line 19 `Iodine 150 mcg` → ✗ **No match** (Tier 4 — "may be in USDA, or out of catalog scope")
- Line 20 `Chromium 35 mcg` → **Chromium Picolinate (USP)** ✓ (Supplier: Nutrition 21 / Chromax)

**Tier breakdown** (inferred from headline 21/22 with 1 unmatched being Iodine): 21 lines matched at Tier 1 or Tier 2 (emerald `✓ Matched` treatment). No amber `⚠ Confirm match` rows observed in the visible portion of the screenshot — pre-1.5d collision behavior still in effect at the time of this verification (Wave 1.5d collision-detection fix would have routed Vitamin E, Calcium, Magnesium pastes through Tier 3 amber prompts).

**Math check:** 22 paste lines, 21 matched, 1 unmatched (Iodine confirmed visible). Therefore the previously-dropped Folate / Biotin / Pantothenic Acid (lines 10, 12, 13) are all in the matched 21 — the 2026-05-17 customer-zero gap is closed.

## Findings

### Resolved gaps from prior runs

- **Folate / Biotin / Pantothenic Acid** (2026-05-17 Test 1 silent-drop trio) → all three resolve at Tier 1 via Wave 1.5b/c synonym backfills. Closure verified by math check (22 - 1 unmatched = 21 matched, must include the trio).

### Newly-surfaced gaps

- **Iodine catalog gap** → no NDI_TABLE-resolvable Iodine entry exists in `lib/data/supplements.ts`. The substance is in `NDI_TABLE` as grandfathered (Iodine / Kelp keyword) but no catalog entry surfaces for operator paste of "Iodine 150 mcg". Add Potassium Iodide or Kelp entry. **Disposition:** Wave 2 Phase 1+ ticket (NOT Wave 1.5d).

### Unexpected behavior (non-gap)

- **NDI Compliance Check showed Unknown for Caffeine / Melatonin / St. John's Wort** during ancillary single-ingredient verification (lines 10–11 of the verification list, not in this 22-ingredient paste). Caffeine clearly has authoritative pre-1994 ODI basis (21 CFR 182.1180 GRAS) — gap in NDI_TABLE, not catalog. **Disposition:** Closed inline by Wave 1.5d (Caffeine added to NDI_TABLE as grandfathered; Melatonin + SJW stay UNDOCUMENTED per two-state discipline pending Round 12 PA-research).
- **Choline-family NDI overgeneralization** → bare 'choline' keyword in NDI_TABLE substring-matched into PC, Alpha-GPC, CDP-Choline. **Disposition:** Closed inline by Wave 1.5d NDI keyword-match refactor (substring → whole-word boundary + per-keyword `boundaryMode: 'standalone-token'` for choline).
- **Disclaimer pluralization sensitivity** (Metafolin plural / B5 + Quatrefolic singular) — claim-counter sensitive to specific phrasing in catalog notes. **Disposition:** Round 12 ticket on claim-detection consistency (NOT Wave 1.5d).
- **Catalog stripped-name collisions** (30+) — surfaced during Wave 1.5d audit. Most innocuous (intentional value-tier/premium-tier duplicates); one harm-critical (PC 30% Soy vs Sunflower allergen-profile differential). **Disposition:** Documented in [docs/findings/2026-05-18-catalog-stripped-name-collisions.md](../2026-05-18-catalog-stripped-name-collisions.md); Round 12 cleanup work.

## Disposition

| Finding | Disposition |
|---------|-------------|
| Folate / Biotin / Pantothenic Acid silent-drop closure verified | Closed (Wave 1.5b/c synonym backfills, this verification) |
| Iodine catalog gap | Wave 2 Phase 1+ ticket — add Potassium Iodide entry |
| Caffeine NDI_TABLE gap | Closed by Wave 1.5d (NDI_TABLE addition) |
| Choline-family NDI overgeneralization | Closed by Wave 1.5d (NDI keyword-match refactor + boundaryMode='standalone-token') |
| Melatonin NDI status | Round 12 PA-research ticket — pre-1994 supplement-market evidence pending |
| St. John's Wort NDI status | Round 12 PA-research ticket — authoritative-basis citation pending |
| Choline-family branded-form NDI specificity (Cognizin / Chemi Nutra Alpha-GPC) | Round 12 PA-research ticket |
| Disclaimer pluralization phrasing-sensitivity | Round 12 ticket — claim-detection consistency |
| Catalog stripped-name collisions (30+) | Round 12 cleanup — see catalog-stripped-name-collisions finding doc |
