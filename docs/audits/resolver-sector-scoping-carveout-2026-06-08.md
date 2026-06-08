# Resolver / Search (#16) — Carve-Out Framing + Status

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; artifact #16).
**Verdict:** This is the **architectural carve-out** flagged earlier (spec §7 cross-artifact doctrine), not a rookie fix. CC frames it; the decisions route to operator/Opus.

---

## Resolver status — already substantially guarded (audit)
`lib/parseFormula.ts` `findBestMatchWithTier` is **tiered**, and the no-silent-substitution doctrine is already structurally present:
- **Tier 1-2** — confident (whole-word prefix on the catalog side).
- **Tier 3** — ambiguous / suffix-similar → **REQUIRES user confirmation** before import (the "Celery Seed → Chia Seeds" suffix-similarity case surfaces here, not as a silent swap).
- **Tier 4** — no confident match → "no match found" + actions.
- **Wave-1.5d collision detection** — bare "Methylfolate" matching two branded forms → flagged collision, not first-by-iteration silent substitution.

So [[catalog-resolver-never-silently-substitutes]] is **largely enforced by construction.** The gaps below are enhancements/architecture, not a broken guardrail.

---

## Routed items (decisions for operator/Opus — NOT solo-built)

### 1. Sector-scoping architecture (the core carve-out)
- **Per-entry sector classification** — each catalog entry tagged Nutra / F&B / both, so the resolver + search only surface sector-appropriate entries.
- **Source-tier architecture** — USDA = **base-only for F&B**, never a Nutra source (the USDA-in-Nutra search leak Wizard caught).
- **Search-index sector scope** — the index respects the active sector (no ketchup in a Nutraceuticals search).
- *Why it routes:* it spans the catalog schema, the resolver, and the search index — an architectural decision about multi-sector data shape, not a local fix. **Design question for routing:** sector as a per-entry enum field vs. separate per-sector catalogs vs. a tag-filter layer?

### 2. B6→B2 nutrient-identity guardrail (resolver enhancement)
- The B6→B2 incident: query "Vitamin B6" with no catalog "Vitamin B6" name → fuzzy-crossed to "Vitamin B2 (Riboflavin)" (a **different nutrient**). The tiered guardrail should have caught this as Tier 3.
- **Enhancement:** when a query names a specific nutrient and the best match crosses to a *different* named nutrient (B6≠B2, retinol≠riboflavin), force Tier 3 (confirmation) regardless of token-similarity score. *Routes because it needs the nutrient-identity taxonomy (which DV-class / vitamin a match belongs to) — couples resolver to the DV table.*

### 3. Catalog-synonym gap (rulebook-governed)
- The B6 case was partly a **missing synonym**: the catalog has "Pyridoxine HCl (USP, Tier-A)" but no "Vitamin B6" alias. Add "Vitamin B6" (+ "dl-Alpha-Tocopherol"→Vitamin E, etc.) as catalog synonyms. *Routes through the Catalog Authoring Rulebook + the catalog-entry-validator, not a freehand edit.*

### 4. R12 substring false-positives (already sequenced)
- The deferred word-boundary fixes (flour→Wheat, cream→Milk, egg→Eggs in the allergen engine, #3). Cross-engine sweep is R12. Harnessed as todo-targets in #3.

---

## Recommendation
Route #1 (sector-scoping) to an Opus architecture session — it's the foundation for the F&B re-entry (Q4) and shouldn't be improvised. #2 + #3 can ride the same session (they're smaller but couple to taxonomy + the rulebook). The resolver's core guardrail is sound today; none of this is launch-blocking for the **supplement** August MVP (single-sector — the leak matters when F&B turns on).
