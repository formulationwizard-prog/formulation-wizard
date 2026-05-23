# supplementAllergen.ts Wire-Up Assessment (for Launch-Blocker 1B)

**Author:** CC, 2026-05-23 (parallel investigation while operator URL re-verifies allergen fixes)
**Purpose:** Scope the work required to wire `lib/supplementAllergen.ts` `detectAllergensDetailed()` + `generateContainsStatement()` into the workspace UI, replacing the legacy `lib/utils.ts` `detectAllergens()`. This is launch-blocker 1B per [`project_launch_blockers_2026_05_23.md`](../../../.claude/...).
**Audience:** Next Opus architecture session — informs execution scope, sequencing, and the question of whether F3 Tier 1 (agentic supplier-spec scraping) should land BEFORE wire-up.

---

## TL;DR

**Wire-up itself is small** — 3 callsite changes + render adaptation. Estimated 2-4 hours focused CC work.

**Catalog data enrichment is the bigger task** — manual: ~hours per category; F3 Tier 1 agentic: ~weeks of infrastructure but scales.

**Wire-up + catalog enrichment are complementary, not alternative.** Wire-up changes how data flows; F3 Tier 1 changes how data gets collected. Both needed for full FALCPA species-naming compliance.

**Recommended sequence:** Wire-up first (unlocks the UI capability), manual catalog enrichment for top-N entries (immediate compliance value), F3 Tier 1 in parallel as automation pipeline (long-tail).

---

## Current state

### Legacy `lib/utils.ts` `detectAllergens(text: string): string[]`

- Returns category names only: `['Fish', 'Crustacean Shellfish', 'Eggs']`
- Word-boundary-START regex (post commits `e273536` + `04665d8`) prevents substring false-positives
- Category names match `ALLERGENS_LIST` entries: Milk / Eggs / Fish / Crustacean Shellfish / Tree Nuts / Peanuts / Wheat / Soybeans / Sesame / Mustard
- No species output, no gate-refusal capability, no regulatory-tier surfacing

### New `lib/supplementAllergen.ts` (Round 11 Phase 2 Step 4 — landed)

- `detectAllergensDetailed(text: string): AllergenMatch[]`
- Each match: `{ category, species, matchedKeyword, requiresSpeciesNaming, regulatoryTier }`
- Species mapping: Tree Nuts (8 species), Fish (4 species via `anchov` stem), Shellfish (5 species)
- Generic-term detection with `requiresSpeciesNaming: true, species: undefined` for gate refusal
- `generateContainsStatement(matches): string` produces FDA-format "Contains: X, Y, and Z." with Oxford comma + dedup
- `evaluateAllergenGate(input): AllergenGateResult` returns hard-stop with citation when species-naming requirement violated
- Already integrated with `supplementBucket1Gate.ts` composition registry via `B1_ALLERGEN_ITEM_ID`

**The module is built and tested. Wire-up just means using it.**

---

## Wire-up scope — code changes

### Three `detectAllergens()` callsites in `app/workspace/page.tsx`

| Line | Current use | Replacement strategy |
|---|---|---|
| 645 | USDA fallback ingredient resolution — `detectAllergens((food.description \|\| '') + ' ' + (food.ingredients \|\| ''))` returns `string[]`, stored on Ingredient | Call `detectAllergensDetailed(...)` instead; convert to `string[]` of category names for legacy Ingredient.allergens compat, OR migrate Ingredient.allergens to richer shape |
| 672 | Aggregation across all ingredients — `detectAllergens(item.name).forEach(a => allAllergens.add(a))` populates Set | Same — `detectAllergensDetailed(item.name).forEach(...)` |
| 1026 | Add Ingredient form fallback — `selectedFood?.allergens \|\| detectAllergens(newIngredient)` | Same — `detectAllergensDetailed(...)` with shape adaptation |

**Net code change at callsites: ~3 lines, plus shape adaptation logic.**

### `allergenStatement` rendering — 5 consumer sites

`allergenStatement: string[]` is the UI state variable. Five render sites:

| Line | Render context |
|---|---|
| 156 | `useState<string[]>([])` declaration |
| 2125-2128 | Top-bar badge: "X allergens" count + tooltip |
| 5685-5686 | SFP "Contains: X" line |
| **6108-6110** | Main Allergen Statement card (where the recent bug surfaced) |
| 9309-9315 | Filing / Batch Sheet render |
| 9580-9581 | Another render (likely PDF export) |

**Two strategies for the render adaptation:**

**Strategy A — Adapter at boundary** (minimum-change):
- Keep `allergenStatement: string[]` shape
- Compute it by `generateContainsStatement(matches).replace(/^Contains: |\.$/g, '').split(/, (?:and )?/)` (or similar)
- All 5 render sites stay unchanged
- LOSES some richness (no per-allergen regulatory tier surfacing, no inline gate-refusal triggers)

**Strategy B — Rich-shape migration**:
- Change `allergenStatement` to `AllergenMatch[]`
- Update 5 render sites to consume new shape
- Surfaces species naming + regulatory tier in UI
- Enables gate refusal at render time (red border when violations exist)

CC lean: **Strategy A first** (lands the compliance fix quickly), Strategy B as follow-up (unlocks gate-refusal UI). Both are launch-blocker-adjacent work.

### Hard-stop gate integration

`evaluateAllergenGate()` already exists. Wiring it into the export pipeline (Save as PDF, etc.) is a separate small task — block PDF export when species-naming gate fires. ~30 min. Could be bundled with Strategy A wire-up.

---

## Catalog data enrichment scope

Wire-up changes how data FLOWS. The catalog DATA itself still needs species enrichment to get full FALCPA-compliant output.

### Entries needing species notation

**Crustacean Shellfish entries** (need species):

| File | Entry | Current `allergens` | Target |
|---|---|---|---|
| `lib/data/supplements.ts:285` | Glucosamine HCl (USP, Shellfish-Derived) | `['Crustacean Shellfish']` | `['Crustacean Shellfish (Shrimp, Crab)']` (industrial source) |
| `lib/data/catering.ts:20` | Shrimp (16/20 ct, Raw, EZ-Peel) | `['Crustacean Shellfish']` (just updated) | `['Crustacean Shellfish (Shrimp)']` |
| (Future) Krill Oil entries | — | — | `['Crustacean Shellfish (Krill)']` — add `krill` to SHELLFISH_SPECIES map |
| (Other Glucosamine variants) | various | various | per-source species |

**Fish entries** (need species):

| File | Entry | Current | Target |
|---|---|---|---|
| `lib/data/catering.ts:19` | Atlantic Salmon Fillet | `['Fish']` | `['Fish (Salmon)']` |
| (Worcestershire sub-ingredients) | — | — | Species inheritance via `detectAllergensDetailed` on Anchovies sub-ingredient |

**Mollusks** (NOT federal Big-9; need new category):

| File | Entry | Current | Target |
|---|---|---|---|
| `lib/data/ingredients.ts:518` | Oyster Sauce (Industrial) | `['Shellfish', 'Wheat']` | `['Mollusks (Oyster)', 'Wheat']` — requires adding Mollusks category to AllergenCategory type |

### Catalog enrichment effort

**Manual approach:** ~hours per major category. The catalog is small enough (~400 entries) that systematic per-entry review is feasible. Each entry needs:
1. Identify allergen source (industrial knowledge — what's the typical species for Glucosamine HCl? Crab + Shrimp)
2. Update `allergens` array with parenthetical species notation
3. Update notes if species varies by supplier

**F3 Tier 1 agentic approach (per [[coa-library-strategic-decision]]):** scraping supplier spec sheets automatically populates species data. But requires 2-3 weeks engineering for the infrastructure.

**Trade-off:** Manual enrichment ships compliance value immediately for top-N entries; F3 Tier 1 scales to long tail over weeks. NOT mutually exclusive — manual covers launch-critical SKUs, agentic covers everything else over time.

---

## What's NOT changing

- The `supplementAllergen.ts` module itself — already correct
- The supplementBucket1Gate composition registry — already wired
- Existing tests in `supplement-allergen-gate.test.ts` — pass against current module
- The catalog-entry-validator's M1/M11 rules — independent of allergen logic
- The harm-critical-floor doctrine — already encoded in module

---

## Recommended execution sequence

1. **Phase 1 — Wire-up (Strategy A) + manual enrichment of top-10 launch-critical entries** — ~3-5 hours focused CC work. Immediate compliance value. Lands species naming on `Contains:` line for major SKUs.

2. **Phase 2 — Strategy B render migration + gate refusal in export pipeline** — ~2-3 hours. Unlocks rich UI surfacing of species + regulatory tier + hard-stop refusal at PDF export.

3. **Phase 3 — Add Mollusks category** + update AllergenCategory type + Oyster Sauce + similar entries — ~1-2 hours.

4. **Parallel: F3 Tier 1 prototype** (per [[coa-library-strategic-decision]]) — 2-3 weeks engineering for scraping infrastructure. Lands long-tail catalog enrichment automatically.

**Phase 1 alone covers launch-blocker 1B for the August demo + initial paying customers.** Phases 2-3 + F3 Tier 1 are post-launch hardening / automation.

---

## Estimated work

| Phase | CC work | Operator/Opus dependencies |
|---|---|---|
| 1 — Wire-up + top-10 enrichment | 3-5 hours focused | Operator green-light on Strategy A approach + manual enrichment scope |
| 2 — Strategy B render migration | 2-3 hours | Operator design review on rich-shape UI |
| 3 — Mollusks category | 1-2 hours | Opus routing on category addition (rulebook §III.15 enum update) |
| F3 Tier 1 (parallel) | 2-3 weeks engineering | Strategic decision per [[coa-library-strategic-decision]] |

**Net Phase 1 + 2 + 3:** ~6-10 hours CC work over 2-3 focused sessions. Substantially less than the "2-3 hour" rough estimate in the launch-blocker memo — the new module already did the heavy lifting.

---

## Insight for next Opus session

**The F3 Tier 1 "re-route" framing in the COA library memo was imprecise.** F3 Tier 1 doesn't replace the wire-up — it changes how catalog data gets populated. Both are needed for full FALCPA species-naming.

Refined framing: **Wire-up is the UI/code work; F3 Tier 1 is the data-collection automation.** Pursue both in parallel; wire-up unlocks immediate compliance, Tier 1 scales the data layer over weeks.

This means launch-blocker 1B can be SUBSTANTIALLY addressed in 6-10 hours of focused CC work (Phases 1-3 above) — bringing it down from "launch-blocking for August" to "near-term sprint work." Whether to also pursue F3 Tier 1 pre-launch becomes a separate question about long-tail catalog quality, not a gating dependency.

---

## Cross-references

- [[launch-blockers-2026-05-23]] — 1B is the bucket this work falls under; original estimate was "2-3 hour session"
- [[coa-library-strategic-decision]] — F3 Tier 1 agentic-collection model; complementary to this work, not alternative
- [[phase-5-architecture-surfaces]] — F1/F2/F3 feature waves; this work falls under F3 (collection automation) BUT wire-up itself is independent and can proceed without F3
- [[honest-estimate-reframe]] — confidence taxonomy applies to species-naming inference when catalog data is incomplete
- `lib/supplementAllergen.ts` — the module being wired up; already built, tested, registered
- `lib/utils.ts` — legacy `detectAllergens()` being replaced
- `app/workspace/page.tsx` — 3 callsites (645, 672, 1026) + 5 render sites (156, 2125, 5685, 6108, 9309, 9580)
- `lib/__tests__/supplement-allergen-gate.test.ts` — existing test coverage for the new module
- `lib/__tests__/detect-allergens.test.ts` — legacy detector tests; will need decommissioning after wire-up
