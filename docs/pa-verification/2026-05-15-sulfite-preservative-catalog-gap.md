# Sulfite Preservative Catalog Gap — PA Verification Pending

**Queued:** 2026-05-15 (surfaced during Round 10 visual review as Finding #15)
**Round / Section:** Round 10 visual-review follow-up (post-Section 3b.1)
**Status:** PENDING

## Background

Visual Test 2 (Bucket A red-banner verification — beverage with sulfite over 100 ppm cap) revealed that the F&B catalog has **no sulfite preservative ingredient** available to add to a formulation. Sulfite cap enforcement in lib/regulatoryLimits.ts (Section 3b.1 with declarationTriggerPpm + Section 3b.2 with fresh-produce prohibition) is fully wired, but a customer-zero formulator cannot actually trigger the cap because no sulfite-named ingredient exists in the selectable catalog.

This is a catalog gap separate from the regulatory-limits work. The compliance check fires correctly when a sulfite ingredient IS present (verified by tests against synthetic ingredients in lib/__tests__/section-3b1-regulatory-limits.test.ts and section-3b2-product-class-routing.test.ts). The gap is at the catalog layer — no sulfite SKU exists for the user to select.

## What's Needed from PA

This is a **catalog expansion** queued behind PA verification of regulatory values for each sulfite form. Forms to consider:

- [ ] **Sodium metabisulfite (Na₂S₂O₅)** — most common food-grade sulfite preservative. CAS 7681-57-4.
- [ ] **Potassium metabisulfite (K₂S₂O₅)** — wine industry standard. CAS 16731-55-8.
- [ ] **Sodium bisulfite (NaHSO₃)** — used in dried fruit, juices, wine. CAS 7631-90-5.
- [ ] **Sulfur dioxide (SO₂)** — gaseous; rarely directly added but referenced as the equivalent unit for all sulfite caps. CAS 7446-09-5.

Per substance, PA needs to verify:

- [ ] **Cap value(s)** — sulfite caps are stated as "ppm SO₂ equivalent" across most regulations. Per-product-category caps vary substantially:
  - General foods: 100 ppm (21 CFR 182.3766 et al.) — already in REGULATORY_LIMITS
  - Wine: ~350 ppm (TTB jurisdiction; outside FDA)
  - Dried fruit: higher (specific caps per product)
  - Lemon juice (bottled): different cap
  - Shrimp: specific cap for sulfite treatment
  - Fresh produce: PROHIBITED (already enforced via prohibitedInCategories: ['fresh-produce'])
- [ ] **Citations** — primary citation 21 CFR 182.3766 (sodium bisulfite) / 182.3637 (sodium metabisulfite) / 182.3739 (potassium metabisulfite) / 182.3862 (sulfur dioxide); declaration trigger 21 CFR 101.100(a)(4); fresh produce prohibition per FDA 1986 ruling. PA confirms current authoritative citation set.
- [ ] **`activeFraction` (SO₂ equivalent)** — caps are stated in SO₂ basis. For sodium metabisulfite: ~67.4% SO₂ by mass (Na₂S₂O₅ MW 190.11; 2× SO₂ MW 64.06 per molecule). For potassium metabisulfite: ~57.6% SO₂. For sodium bisulfite: ~61.6% SO₂. PA confirms whether the catalog entries should be tagged with `activeFraction` (engine multiplies in checkCompliance to compare against the SO₂ cap) or whether the cap should be re-stated per-salt with the equivalence pre-baked.
- [ ] **`namePatterns`** — substring patterns to match. Must respect the Round 10 Section 3b.1 trailing-space precision discipline:
  - sodium metabisulfite (existing pattern in current SULFITES entry)
  - potassium metabisulfite (existing)
  - sodium bisulfite (existing)
  - potassium bisulfite (new — symmetric with potassium meta)
  - 'sulfite ' (trailing space — existing, defensive against substring collision with 'sulfite-free' / 'sulfite-ammonia caramel')
  - PA confirms additions / removals
- [ ] **`appliesToCategories`** — sulfite use is generally permitted across F&B productClasses EXCEPT fresh-produce (already prohibited). PA confirms whether to scope explicitly or leave the cap universally applicable.
- [ ] **`contextualLimits`** — if per-product-category caps (dried fruit higher, lemon juice different, etc.) are in Round 10/11+ scope, PA enumerates the contexts + per-context caps.
- [ ] **`denominatorBasis`** — 'total' (finished-product mass) per 21 CFR convention; PA confirms.

## Where This Lands Once Verified

**Two-layer landing:**

1. **Catalog entries** (lib/data/ingredients.ts or wherever the F&B catalog is sourced) — add sulfite preservative SKUs as selectable ingredients. Each entry gets the appropriate chemistry profile (mostly neutral pH dry powder; verified or ai-estimate per PA standard).

2. **Regulatory-limits chemistry alignment** (lib/foodScience.ts INGREDIENT_SPECS) — chemistry rows for each new catalog SKU. The existing SULFITES entry in lib/regulatoryLimits.ts may need refinement (e.g., split into per-salt entries with activeFraction, or extend namePatterns to cover the new SKU names).

The existing SULFITES entry in lib/regulatoryLimits.ts is the routing target — its caps + prohibitions already fire correctly. Catalog work adds the user-selectable SKUs so the gate has something to fire against.

## Open Questions for PA

1. **Granularity** — should sulfites be ONE catalog entry per chemical species (sodium metabisulfite + potassium metabisulfite + sodium bisulfite as separate SKUs), or grouped as "Sulfite Preservatives (Generic)" with the species selected as a secondary field? Granular is cleaner regulatorily; generic is easier UX.
2. **Wine-industry caps** — sulfite use in wine is TTB-regulated (Title 27 CFR), not FDA. Out of scope for this catalog gap (FDA-side enforcement)?
3. **Per-product-category cap variances** (dried fruit higher, lemon juice different, etc.) — Round 10 scope or defer to Round 11+ catalog pass?
4. **activeFraction tagging precedent** — currently used in Prague Powder entries (activeFraction: 0.0625 for sodium nitrite content). Sulfite caps could follow the same pattern with activeFraction=0.674 for sodium metabisulfite. PA confirms whether to extend the activeFraction mechanism or restate caps per-salt.

## Severity for Round 10 ship

**Cosmetic** — does not block Round 10 merge.

The compliance logic is verified by unit tests against synthetic ingredients. The user-facing impact is that Visual Test 2's "build a beverage with sulfite > 100 ppm" path can't be exercised end-to-end. The Bucket A red-banner code path IS verified by other test paths (e.g., sodium benzoate over 0.1% cap in beverage productClass — same MEASURED-input semantics, same hard-stop banner).

If sulfite UX is important for customer-zero specifically, this can be addressed before Round 10 merge as a small catalog-only commit (no chemistry-limits changes) once PA verifies which forms / caps / namePatterns / activeFraction are correct.

## Do NOT activate autonomously

Per PA-verification queue discipline ("PA fills the blanks"), CC does not commit sulfite catalog entries with assumed cap values, activeFraction conversions, or per-category cap variances. Wait for PA-verified values.
