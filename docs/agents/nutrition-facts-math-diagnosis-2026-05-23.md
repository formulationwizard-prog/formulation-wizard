# Nutrition Facts Math Diagnosis (Phase 1)

**Author:** CC, 2026-05-23 (Phase 1 investigation per [[nutrition-facts-math-broken]])
**Purpose:** Surface specific bugs per math layer to inform Opus architectural routing + fix scope sizing
**Audience:** Next Opus architecture session

---

## Math chain (current architecture)

```
Per-ingredient nutrition (per-100g) [lib/data/*.ts catalog entries]
        ↓
Per-ingredient mass conversion:
    ingredient.qty × UNIT_TO_GRAMS[ingredient.unit]
    [lib/utils.ts:14-27]
        ↓
Batch-total nutrition aggregation:
    nutrition[key] += per_ingredient_nutrition × (mass_grams / 100)
    [page.tsx — setNutrition(n) at line 674]
        ↓
Per-serving scale:
    scale = servingSizeInGrams / totalBatchGrams (F&B mode)
    scale = 1.0 (supplements mode)
    [lib/supplementMath.ts:116-123]
        ↓
Where servingSizeInGrams = servingSize × UNIT_TO_GRAMS[servingUnit]
And   totalBatchGrams = Σ(ing.qty × UNIT_TO_GRAMS[ing.unit])
    [page.tsx:581, 687]
        ↓
Per-serving render:
    perServing(val) = val × scale
    %DV = (val × scale / dv) × 100
    [page.tsx:1020-1022]
        ↓
FDA rounding:
    fdaRoundCalories, fdaRoundFat, fdaRoundGrams, fdaRoundPercentDV
    [lib/utils.ts:164-231]
        ↓
NFP/SFP render
    [page.tsx:5711+ NFP; 5685 SFP]
```

---

## Bug list per layer

### LAYER 1 — UNIT_TO_GRAMS (critical, root cause)

**Location:** `lib/utils.ts:14-27`

```typescript
export const UNIT_TO_GRAMS: Record<string, number> = {
  mcg: 0.000001,
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,       // mass oz (correct)
  lb: 453.592,       // mass lb (correct)
  ml: 1,             // ← assumes water density (1.0 g/ml)
  L: 1000,           // ← assumes water density
  'fl oz': 29.5735,  // ← assumes water density
  tsp: 4.92892,      // ← assumes water density
  tbsp: 14.7868,     // ← assumes water density
  cup: 236.588,      // ← assumes water density
};
```

**Bug:** Volume units (ml, L, fl oz, tsp, tbsp, cup) convert to grams assuming water density (1.0 g/ml). This is wrong for every non-water product.

**Impact magnitude per common product:**

| Product | True density | Error in tbsp serving | Error in cup serving |
|---|---|---|---|
| Water | 1.00 g/ml | 0% | 0% |
| Lemon juice | 1.03 g/ml | -3% (underweighs) | -3% |
| Salsa | ~1.10 g/ml | -10% | -10% |
| Honey | 1.42 g/ml | -42% | -42% |
| Vegetable oil | 0.92 g/ml | +8% (overweighs) | +8% |
| Olive oil | 0.91 g/ml | +9% | +9% |
| Maple syrup | 1.33 g/ml | -33% | -33% |
| Molasses | 1.45 g/ml | -45% | -45% |

**Cascade:** This single table feeds:
- `servingSizeInGrams` (page.tsx:581) — wrong for volume-input serving sizes
- `totalBatchGrams` (page.tsx:687) — wrong for any volume-input ingredient
- `perServing(val) = val × scale` (page.tsx:1020) — wrong because scale depends on both
- `%DV = (val × scale / dv) × 100` (page.tsx:1022) — wrong cascading from scale

**Fix path:** Volume-to-mass conversion needs **finished-product density** (per [[density-input-servings-calc]]) AND **per-ingredient density** (already partly exists in `lib/parseFormula.ts INGREDIENT_DENSITIES` for bulk-paste resolution but not used in nutrition math).

### LAYER 2 — Catalog nutrition data sparsity

**Coverage:**
- `lib/data/supplements.ts`: 292 of 392 entries (74%) have `nutrition: {}` (empty)
- `lib/data/ingredients.ts`: substantial portion empty; many populated only with calories+carbs+sodium (incomplete macro set)
- `lib/data/catering.ts`, `lib/data/baking.ts`, `lib/data/feeds.ts`, `lib/data/sausage.ts`: not yet sampled — likely similar pattern

**Bug:** When a formula contains ingredients with empty `nutrition: {}`, aggregation silently produces zero contribution from those ingredients. Result: total nutrition values are systematically under-reported.

**Specific examples** (from supplements catalog, per session reads):
- Glucosamine HCl: `nutrition: {}`
- Chondroitin Sulfate Sodium: `nutrition: {}`
- MSM: `nutrition: {}`
- Hyaluronic Acid: `nutrition: {}`
- Boswellia Extract: `nutrition: {}`
- → N1 Joint Health Stack: ALL ingredients have empty nutrition → SFP shows zero macros (correct in this case since supplements don't typically declare macros, but the math layer doesn't differentiate)

**For F&B side:** Tomato Sauce, Salt, etc. should have populated nutrition. Need to verify per-entry coverage in F&B catalog.

**Fix path:** Catalog enrichment. Two options:
- Manual entry per ingredient (~hours per category)
- F3 Tier 1 agentic scraping per [[coa-library-strategic-decision]] (supplier spec sheets carry nutrition data)

### LAYER 3 — State variable mismatch (suspected; needs verification)

**Observation from F&B salsa screenshot:**
- Serving & Package Size card: Serving Size = 2, Unit = tbsp; Package Size = 8, Unit = oz; Servings/Container = 7.7
- NFP rendered: "1 servings per container" + "Serving size 0g"

**These don't match.** The NFP should read `{servingsPerContainer}` (state variable) and `{servingSize}{servingUnit}` (state variables). If the card values are 2/tbsp/8/oz/7.7, the NFP should display them.

**Hypothesis 1:** NFP reads from a different state path (legacy state vs new Serving & Package Size card state — Round 11 Phase 3 #25l count-based form sync mentioned in code comments may have introduced dual-state).

**Hypothesis 2:** NFP rendering happens before state updates from the card propagate.

**Hypothesis 3:** Operator's reported state was captured mid-render where defaults were still active.

**Investigation needed:** Add console logging at NFP render site for `servingSize`, `servingUnit`, `servingsPerContainer` values at render time; correlate with card state at same instant. ~30 min CC + operator at keyboard to reproduce.

### LAYER 4 — Per-100g per-ingredient nutrition assumption

**Comment at page.tsx:1015-1016:**
> Nutrition values in `nutrition` are summed totals for the entire batch (each ingredient contributes its per-100g × (qty/100)).

**Bug verification needed:** This assumes catalog entries store nutrition values **per 100g** (FDA convention for nutrition labeling). Need to verify:
- Are catalog `nutrition: { calories: 884, totalFat: 100, ... }` values actually per-100g?
- For ingredients in volume units (oil at "per 100ml"?), is conversion correct?
- For trace ingredients (vitamins at "per 100g of formulation" or "per 100g of pure compound"?), is convention applied consistently?

Example to verify: Olive Oil entry shows `nutrition: { calories: 884, totalFat: 100 }`. 884 kcal/100g is the FDA-standard value for olive oil. ✓ But the entry stores 100g of FAT per 100g — that's correct for pure oil.

Compare: Tomato Paste shows `nutrition: { calories: 82, totalCarbs: 19, totalSugars: 12, protein: 4, sodium: 59 }`. 82 kcal/100g is reasonable for tomato paste. ✓

So the per-100g convention appears consistent for entries that have data. The bug isn't in the convention — it's in:
- Empty entries (Layer 2)
- Volume-to-mass conversion (Layer 1)
- State propagation (Layer 3)

### LAYER 5 — FDA rounding (correct)

**Location:** `lib/utils.ts:164-231`

```typescript
export function fdaRoundCalories(kcal: number): string {
  if (kcal < 5) return '0';
  if (kcal < 50) return String(Math.round(kcal / 5) * 5);
  return String(Math.round(kcal / 10) * 10);
}

export function fdaRoundFat(g: number): string {
  if (g < 0.5) return '0';
  if (g < 5) { ... }  // 0.5g increments
  ...
}

export function fdaRoundGrams(g: number): string {
  if (g < 0.5) return '0';
  if (g < 1) return 'less than 1';
  return String(Math.round(g));
}

export function fdaRoundPercentDV(pct: number): string {
  if (pct < 2) return '0';
  if (pct <= 10) return String(Math.round(pct / 2) * 2);
  ...
}
```

**Audit:** These rounding rules match 21 CFR 101.9(c) requirements:
- Calories: <5 = 0; 5-50 = round to nearest 5; >50 = round to nearest 10 ✓
- Fat: <0.5 = 0; 0.5-5 = 0.5g increments; >5 = nearest 1g ✓
- %DV: <2 = 0; round per FDA scale ✓

**No bug found at this layer.** Math at this layer is FDA-compliant.

**Caveat:** Layer 5 is downstream of Layers 1-3. Correct rounding on wrong input still produces wrong labels.

### LAYER 6 — Daily Value table (mostly correct)

**Location:** `lib/nutritionClaims.ts:38-75` (DAILY_VALUES) + inline in page.tsx:5750-5753 (Vit D / Ca / Fe / K block)

**Audit against 21 CFR 101.9(c)(8)(iv) 2016 rule:**

| Nutrient | DV in code | FDA spec | Correct? |
|---|---|---|---|
| Total Fat | 78g | 78g | ✓ |
| Saturated Fat | 20g | 20g | ✓ |
| Cholesterol | 300mg | 300mg | ✓ |
| Sodium | 2300mg | 2300mg | ✓ |
| Total Carbs | 275g | 275g | ✓ |
| Dietary Fiber | 28g | 28g | ✓ |
| Added Sugars | 50g | 50g | ✓ |
| Protein | 50g | 50g | ✓ |
| Vitamin D | 20mcg | 20mcg | ✓ |
| Calcium | 1300mg | 1300mg | ✓ |
| Iron | 18mg | 18mg | ✓ |
| Potassium | 4700mg | 4700mg | ✓ |
| Vitamin A | 900mcg RAE | 900mcg RAE | ✓ |
| Vitamin C | 90mg | 90mg | ✓ |
| Vitamin E | 15mg | 15mg | ✓ |
| Vitamin K | 120mcg | 120mcg | ✓ |
| Thiamin | 1.2mg | 1.2mg | ✓ |
| Riboflavin | 1.3mg | 1.3mg | ✓ |
| Niacin | 16mg NE | 16mg NE | ✓ |
| Vitamin B6 | 1.7mg | 1.7mg | ✓ |
| Folate | 400mcg DFE | 400mcg DFE | ✓ |
| Vitamin B12 | 2.4mcg | 2.4mcg | ✓ |
| Biotin | 30mcg | 30mcg | ✓ |
| Pantothenic Acid | 5mg | 5mg | ✓ |
| Phosphorus | 1250mg | 1250mg | ✓ |
| Iodine | 150mcg | 150mcg | ✓ |
| Magnesium | 420mg | 420mg | ✓ |
| Zinc | 11mg | 11mg | ✓ |
| Selenium | 55mcg | 55mcg | ✓ |
| Copper | 0.9mg | 0.9mg | ✓ |
| Manganese | 2.3mg | 2.3mg | ✓ |
| Chromium | 35mcg | 35mcg | ✓ |
| Molybdenum | 45mcg | 45mcg | ✓ |
| Chloride | 2300mg | 2300mg | ✓ |
| Choline | 550mg | 550mg | ✓ |

**No bug found.** DV table values are correct per FDA 2016 rule.

**Coverage gap:** DV table doesn't include some FDA-regulated nutrients (e.g., some "added" categories). But the existing entries are correct.

---

## Root cause analysis

**Layer 1 (UNIT_TO_GRAMS water-density assumption) is the structural root cause.** It cascades through Layers 2, 4 silently. Even with perfect rounding (Layer 5) and correct DV (Layer 6), wrong volume-mass conversion produces wrong labels.

**Layer 2 (sparse catalog nutrition) is orthogonal but compounding.** Even with Layer 1 fixed, empty `nutrition: {}` produces under-reported labels.

**Layer 3 (state mismatch) is suspected but unverified.** Needs reproduction with console logging.

---

## Fix scope sizing

### Critical (launch-blocking)

**Layer 1 fix:** Per-ingredient density + finished-product density. Two options:
- **Inline density per ingredient** (extend catalog with `density: number` field; aggregate density-weighted)
- **Operator-supplied finished-product density** per [[density-input-servings-calc]] (simpler; less precise per-ingredient)

CC recommendation: **operator-supplied finished-product density for MVP** (per density memo). Per-ingredient density is post-MVP precision.

Effort: ~4-6 hours (add field to formulation state, wire into `servingSizeInGrams` calc, wire into `totalBatchGrams` calc, surface in UI, validation).

**Layer 2 fix:** Catalog enrichment for top-N entries with empty nutrition. Two options:
- Manual entry (~hours per category)
- F3 Tier 1 agentic scraping per [[coa-library-strategic-decision]] (3-week engineering)

CC recommendation: **manual for top-50 launch-critical entries; F3 Tier 1 for long tail post-launch.**

Effort manual: ~8-15 hours per major category (F&B, supplements separately).

**Layer 3 verification:** Console-log reproduction (~30 min CC + operator).

Effort: ~30 min initial; fix scope depends on findings.

### Non-critical (Layer 5, Layer 6)

No fix needed. Audit-confirmed correct.

---

## Recommended sequence

**Pre-August (launch-critical):**

1. **Verify Layer 3 (state mismatch)** — quick reproduction to confirm bug shape. If real, fix.
2. **Layer 1 fix** — operator-supplied finished-product density input + wire into `servingSizeInGrams` + `totalBatchGrams`. Per [[density-input-servings-calc]] proposal.
3. **Layer 2 manual enrichment** — top-50 launch-critical F&B + top-20 launch-critical supplement entries with populated `nutrition: { }`.
4. **Comprehensive test fixtures** — per-formula tests with manually-computed expected values per [[nutrition-facts-math-broken]] Phase 3.
5. **SME validation pass** — operator or co-founder validates math against expected values per fixture.

**Post-launch:**

6. **Per-ingredient density** — refinement over operator-supplied finished-product density.
7. **F3 Tier 1 agentic enrichment** — automated catalog nutrition completion.
8. **Layer 6 DV table extensions** — additional nutrients if FDA scope expands.

---

## What's NOT broken (clear)

- FDA rounding rules (Layer 5) — correct per 21 CFR 101.9(c)
- DV table values (Layer 6) — correct per FDA 2016 rule
- NFP rendering structure (page.tsx:5711+) — FDA-compliant format with bold lines, indent, %DV column
- SFP rendering structure (page.tsx:5685+) — appears compliant per 21 CFR 101.36 format
- Per-100g convention in catalog — appears consistent for populated entries
- Aggregation logic shape — `nutrition[key] += per_ingredient × (mass/100)` is correct architecturally

The math architecture is mostly right. The bugs are in:
- The UNIT_TO_GRAMS table treating volume as mass-equivalent (Layer 1)
- Sparse catalog data (Layer 2)
- Possible state mismatch (Layer 3)

---

## Cross-references

- [[nutrition-facts-math-broken]] — operator's launch-blocker #5 framing
- [[density-input-servings-calc]] — Layer 1 fix path (operator-supplied density)
- [[coa-library-strategic-decision]] — F3 Tier 1 Layer 2 long-term fix path
- [[base-sheet-batch-sheet-architecture]] — density lives on Base Sheet; per-serving math at Batch Sheet
- [[launch-blockers-2026-05-23]] — this is launch-blocker #5
- [[phase-5-architecture-surfaces]] — F1 composite artifacts include NFP/SFP
- `lib/utils.ts:14-27` UNIT_TO_GRAMS — Layer 1 fix target
- `lib/utils.ts:164-231` fdaRound* — confirmed correct
- `lib/nutritionClaims.ts:38-75` DAILY_VALUES — confirmed correct
- `lib/supplementMath.ts:116-123` computePerServingScale — correct architecture
- `app/workspace/page.tsx:581` servingSizeInGrams derivation — Layer 1 cascade
- `app/workspace/page.tsx:687` totalBatchGrams derivation — Layer 1 cascade
- `app/workspace/page.tsx:674` setNutrition — aggregation target
- `app/workspace/page.tsx:5711+` NFP render — Layer 3 state read site
- `app/workspace/page.tsx:5685+` SFP render — supplement counterpart
- `lib/data/supplements.ts` — 74% empty nutrition coverage gap
- `lib/data/ingredients.ts` — F&B nutrition coverage TBD; needs sampling
