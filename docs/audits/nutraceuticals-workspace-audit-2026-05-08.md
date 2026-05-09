# Nutraceuticals Workspace — Shipped State Audit

**Date:** 2026-05-08
**Source files reviewed:**
- `lib/modes.ts` (mode registry, 199 lines)
- `lib/data/supplements.ts` (catalog + product types + process templates + packaging, 626 lines, ~387 ingredient SKUs)
- `app/workspace/page.tsx` (single-file workspace UI, 9,140 lines — supplements branches at multiple `mode === 'supplements'` gates)
- `lib/supplementLabeling.ts` (Supplement Facts panel engine, 397 lines)
- `lib/supplementSafetyLimits.ts` (UL + interaction-herb checker, 812 lines)
- `lib/supplementNDI.ts` (NDI/ODI classifier, 235 lines)
- `lib/supplementClaims.ts` (claims validator + DSHEA disclaimer, 498 lines)
- `lib/supplementCompatibility.ts` (pairwise incompatibility rules, 350 lines)
- `lib/supplementStability.ts` (overage / shelf-life loss model, 308 lines)
- `lib/supplementRetailFit.ts` (retailer unacceptable-ingredient screen, 230 lines)
- `lib/parseFormula.ts` (Round 5 tier-based bulk paste matcher, mode-aware via `mc.ingredientDB`)
- `lib/ingredientStatement.ts` (21 CFR 101.4 ingredient statement assembly)
- `components/DeterminationEngineCard.tsx` (F&B determination engine — bypassed for supplements with `info` placeholder)
- `types/index.ts` (schema definitions for `drugInteractions`, `functionalRole`, `bioactives`, `regulatoryStatus`, `coaTemplateType`, `pharmacopeialReference`)
- `docs/regulatory/phase-1-companion-compliance-spec.md` (aspirational Bucket-1 / Bucket-2 spec, NOT implemented)
- `docs/regulatory/phase-1-nutraceuticals-regulatory-map.md` (regulatory map, planning artifact)

**Audit method:** File-by-file inspection, grep across the repo for schema field consumers (UI/engine/component), and cross-referencing the regulatory specs in `docs/regulatory/` against actual code paths in `lib/` and `app/workspace/page.tsx`. Where infrastructure exists but the consumer chain breaks, flagged as PARTIAL with specific notes on what is and isn't wired.

---

## Capability matrix

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| 1 | Ingredient catalog depth | **SHIPPED** | ~387 supplement SKUs across 14 supplement-category buckets, surfaced in Database tab via `mc.categories` and the Build-tab autocomplete. Fully selectable from Nutraceuticals workspace. `lib/data/supplements.ts:17-488`; `app/workspace/page.tsx:2133-2181`, `app/workspace/page.tsx:494-510`. |
| 2 | Drug interaction screening | **PARTIAL** | Two distinct mechanisms with different shipped status: (a) `supplementSafetyLimits.ts` `INTERACTION_HERBS` table (~9 curated herbs — St. John's Wort, ginkgo, garlic, ginseng, kava, 5-HTP) **DOES** surface in Safety panel as `tier: 'interaction'` findings (`app/workspace/page.tsx:4395-4420`, `lib/supplementSafetyLimits.ts:488-547`, 700-715). (b) The schema-level `drugInteractions: DrugInteraction[]` field on `IndustrialIngredient` is **populated only on Mucuna pruriens** (`lib/data/supplements.ts:454`) and is **NOT consumed by any UI component, engine, or panel** — verified via `Grep "drugInteractions"`: only matches in `types/index.ts:579` and the one Mucuna entry. Schema field is dead-data. |
| 3 | Functional role classification | **PARTIAL** | `functionalRole` enum exists in `types/index.ts:536` and is populated on ~75 supplement entries (adaptogens, cognitive, anti-inflammatory, etc., all of Wave 2/3a). **Not consumed by UI** — verified via `Grep "functionalRole"`: matches only in `types/index.ts`, `lib/data/ingredients.ts`, `lib/data/supplements.ts`, plus the two unstaged audit MD files in repo root. No filter, no surfacing, no regulatory pathway driven by it. |
| 4 | Supplement Facts panel assembly | **SHIPPED** | Full 21 CFR 101.36-shaped renderer at `app/workspace/page.tsx:4751-4860` driven by `lib/supplementLabeling.ts:buildSupplementFacts`. Handles: serving size with delivery-form noun ("2 Capsules" / "1 Scoop (30 g)"), calories, macros (conditionally), Vitamins+Minerals with `%DV` per 21 CFR 101.36 Table 1, Other Actives with †, "Other Ingredients" excipient list, Contains: allergens, mandatory DSHEA disclaimer footer. Print-to-PDF supported. |
| 5 | Master Manufacturing Record (MMR) | **NOT BUILT** | MMR per 21 CFR 111.205-210 is referenced **only as procedure-step text** inside `lib/data/supplements.ts:506-507` process templates ("Verify Master Manufacturing Record (MMR) is current and approved per 21 CFR 111.205"). No MMR generator, no template, no document export. Confirmed by `Grep "MMR\|Master Manufacturing Record\|21 CFR 111\.205"` returning matches only in `lib/data/supplements.ts` and `docs/regulatory/*` aspirational docs. |
| 6 | Identity testing workflows | **NOT BUILT** | 21 CFR 111.75 identity testing exists only as: (a) a step in process templates (`lib/data/supplements.ts:509`), (b) a `coaTemplateType` schema field that drives nothing, and (c) a Phase 1 Companion spec section. **No COA upload UI, no identity-test method library, no test-record generator** — confirmed by `Grep "CoaTemplateType\|coaTemplateType"` returning no matches under `app/` or `components/`. |
| 7 | Stability protocol integration | **PARTIAL** | A live overage / shelf-life **loss-prediction** engine ships (`lib/supplementStability.ts` + `app/workspace/page.tsx:5720-5900`). User picks shelf-life months, storage, packaging conditions; engine returns required formulate-at amounts so end-of-shelf-life CFU/IU/mg matches label claim per 21 CFR 101.36(b)(3)(iv). Cited as "21 CFR 101.36(b)(3)(iv) · USP <1150>". **What is NOT shipped**: 21 CFR 111.175 stability **protocol** (test plan, accelerated/real-time pull-points, retention sample tracking, stability-data submission). The engine is a math model, not a stability program manager. |
| 8 | cGMP documentation | **PARTIAL** | Process-template text in `SUPPLEMENT_PROCESS_TEMPLATES` includes BPR/MMR/identity-test step language and QA checkpoints (`lib/data/supplements.ts:503-601`) — these surface as Process tab content, but they are **descriptive procedure copy, not a generated BPR document**. There is no batch-record generator, no deviation log, no change-control workflow. The text reminds the user that 21 CFR 111.255 BPRs are required; the tool does not produce one. |
| 9 | Determination Engine for supplements | **NOT BUILT (intentional bypass)** | `components/DeterminationEngineCard.tsx:67-74` short-circuits at `if (modeId === 'supplements')` and renders a static "DSHEA / 21 CFR 111 framework — bypass acidified logic" info card with no classification. There is no NDI vs conventional classifier, no disease-claim-risk classifier, no structure/function claim validator at the determination-engine level. (Some related logic — NDI status on individual ingredients, disease-claim language detection on a draft copy box — exists separately, see #2 and #10.) |
| 10 | DSHEA compliance | **PARTIAL** | What ships: (a) **Mandatory DSHEA disclaimer** rendered at the bottom of every Supplement Facts panel (`app/workspace/page.tsx:4855`), (b) **Structure/function claim library** keyed to ingredient names with citations (`lib/supplementClaims.ts`, surfaced at `app/workspace/page.tsx:5270-5710`), (c) **Disease-claim language detector** that scans a user-pasted draft copy box (`analyzeDraftClaim`, surfaced as the Claims Validator with red-flag findings), (d) **Auto-generated disclaimers** based on which structure/function claims are active (`buildDisclaimers`). What is NOT shipped: the **30-day FDA notification workflow** under DSHEA §6 for new structure/function claims (no submission generator, no notification log) — explicitly listed in Companion Spec §A5 item lower-priority deferral. |
| 11 | Confidence taxonomy on supplement chemistry | **NOT BUILT** | The `Confidence` type and `ConfidencePill` component (`components/ConfidencePill.tsx`) ship and are wired to F&B specs (pH, a_w, brix, cost — see `lib/foodScience.ts:605+` and `app/workspace/page.tsx:1666-1689`). **Not extended to supplement chemistry**: `Grep "ConfidencePill\|confidence"` returns zero matches in `lib/supplementLabeling.ts`, `lib/supplementSafetyLimits.ts`, `lib/supplementStability.ts`, `lib/supplementClaims.ts`. Potency/identity/purity/microbial/heavy-metals values render as plain numbers without a confidence tier. The 2026-05-07 honest-estimate reframe (per saved memory) has not propagated to supplement panels. |
| 12 | Bulk paste / formulation building | **SHIPPED** | Round 5 tier-based matcher (`lib/parseFormula.ts`) is invoked at `app/workspace/page.tsx:2947` against `INDUSTRIAL_DB` which is `mc.ingredientDB` for the active mode (`app/workspace/page.tsx:82`) — so bulk paste **is mode-aware** and uses the supplements catalog when in supplements mode. Tier-3 (medium-confidence) matches require explicit user confirmation before import. Formulation-building (add/remove/edit ingredient rows, batch totals, save/load, version history, comparison) is the same code path F&B uses and works in supplements. |

**Summary counts:** SHIPPED 4 · PARTIAL 5 · NOT BUILT 3.

---

## SHIPPED capabilities — detail

### 1. Ingredient catalog depth — SHIPPED

A customer-zero user lands on the Database tab and sees ~387 supplement SKUs filtered by mode-aware category list. Categories present (with counts from `Grep -oE "category: '[^']+'" lib/data/supplements.ts | sort | uniq -c`):

| Category | Count |
|---|---|
| Vitamins | 61 |
| Minerals | 58 |
| Botanicals | 44 |
| Excipients | 43 |
| Herbal Extracts | 32 |
| Amino Acids | 29 |
| Probiotics | 19 |
| Fatty Acids | 18 |
| Specialty Compounds | 17 |
| Antioxidants | 17 |
| Specialty | 15 |
| Mushroom Extracts | 9 |
| Prebiotics | 7 |
| Omega-3s | 5 |
| Enzymes | 2 |

Each entry carries supplier list, allergens, costPerKg, USP/USP-NF or pharmacopeial reference where applicable, and notes including dose / standardization / pre/post-1994 status. Wave 2 Phase 1, Wave 2 Phase 2, and Wave 3a entries also carry `regulatoryStatus`, `coaTemplateType`, `bioactives`, `functionalRole` data fields — present in the JSON but not surfaced in any rendered UI surface yet. From the workspace, the user can `+ Add` from Database (`app/workspace/page.tsx:2172`) or autocomplete-search from the Build tab (`app/workspace/page.tsx:494-510`).

### 4. Supplement Facts panel — SHIPPED

`app/workspace/page.tsx:4745-4860` renders a 21 CFR 101.36-shaped panel from `buildSupplementFacts` (`lib/supplementLabeling.ts`). Sections in render order:

- **Serving Size** with delivery-form noun ("2 Capsules", "1 Scoop (30 g)", "1 Dropper (1 ml)"), driven by `suppDeliveryForm` state and `SUPP_FORM_NOUN` map at `app/workspace/page.tsx:189`.
- **Servings Per Container** (auto-calculated from package size ÷ serving size, user-overridable).
- **Calories** (only if ≥5 per 21 CFR 101.36).
- **Macronutrient rows** (Total Fat / Total Carb / Total Sugars / Protein / Sodium) — conditionally rendered.
- **Vitamins & Minerals** with %DV from `DV_TABLE` (21 CFR 101.36 Table 1) at `lib/supplementLabeling.ts:57-100+`. `elementalFactor` corrects mineral salts (Ca carbonate 40% Ca, Fe bisglycinate 20% Fe, etc.).
- **Other Actives** (herbals, amino acids, mushrooms, specialty) marked with `†`.
- **Other Ingredients** statement — excipients only, descending weight order.
- **Contains:** allergen line.
- **Mandatory DSHEA disclaimer** as final footer.

Print-to-PDF supported via `printLabel()`. The panel correctly distinguishes itself from the FDA Nutrition Facts panel via `mc.labelMode === 'supplement-facts'`.

### 12. Bulk paste — SHIPPED

`parsePastedFormula(pasteText, INDUSTRIAL_DB)` accepts markdown tables, TSV, pipe-separated, comma-separated, or plain "Soybean Oil 700 g" / "700g Soybean Oil" formats (`lib/parseFormula.ts:1-60`). Returns ranked match tiers (1 exact, 2 high-confidence partial, 3 medium-confidence partial requiring user confirmation, 4 no match). Tier-3 matches default to `accepted: false` so the user must explicitly confirm before they import — the Celery Seed → Chia Seeds suffix-collision bug from prior round is preventatively addressed. Because `INDUSTRIAL_DB` resolves to `mc.ingredientDB`, paste auto-targets the supplements catalog when in supplements mode.

Standard formulation-building (manual add via Build tab, edit qty/unit, drag-to-reorder via persistent state, save+version, compare) works identically to F&B.

### 10. DSHEA compliance — partial-but-meaningful (see PARTIAL below)
DSHEA disclaimer + structure/function library + draft-copy disease-claim detector are operational. See PARTIAL section for what's missing.

---

## PARTIAL capabilities — detail

### 2. Drug interaction screening — PARTIAL

**What ships (works end-to-end):** the Safety panel at `app/workspace/page.tsx:4395-4500` enumerates a curated list of ~9 herbs at `lib/supplementSafetyLimits.ts:488-547` (St. John's Wort, ginkgo, ginger, garlic, ginseng, kava, hawthorn, valerian, 5-HTP/L-tryptophan) with their drug-class interactions (SSRIs, MAOIs, warfarin, oral contraceptives, anti-hypertensives, etc.). When any of these ingredients are in the formulation, `matchInteraction` at `lib/supplementSafetyLimits.ts:701-715` emits a `tier: 'interaction'` finding which renders as a styled warning row.

**What does NOT ship:** the schema-level `drugInteractions: DrugInteraction[]` field defined at `types/index.ts:572-579` and populated **on exactly one ingredient** (Mucuna pruriens, `lib/data/supplements.ts:454` — with structured MAOI/levodopa/antipsychotic/antihypertensive entries) is **dead data**. `Grep "drugInteractions"` returns matches only in `types/index.ts` and the one Mucuna entry plus a comment on line 450. No engine reads the field; no panel renders it. The stated design intent in the schema doc string ("surfaced prominently in the Nutraceuticals workspace as contraindication warnings, not buried in notes") is **unimplemented**.

**Customer-zero experience:** customer adding St. John's Wort sees a Safety-panel interaction warning. Customer adding Mucuna pruriens sees no contraindication anywhere — the interaction information lives only in the ingredient's `notes` text field and structured `drugInteractions` array, neither of which surfaces a hazard pill.

### 3. Functional role classification — PARTIAL

**What ships:** ~75 ingredients in Wave 2 Phase 1 / Wave 2 Phase 2 / Wave 3a carry populated `functionalRole` arrays (`adaptogen`, `cognitive-support`, `cardiovascular-support`, `liver-support`, `gut-health`, `immune-support`, `weight-management`, `bone-support`, `prebiotic`, `fiber`, `antioxidant`, `flavonoid`, `polyphenol`, etc.). The enum extension is locked into `types/index.ts`.

**What does NOT ship:** no UI consumer. `Grep "functionalRole"` across `app/`, `components/`, and the supplement libs returns zero matches outside the data file itself. The role tags do not drive: (a) Database-tab filtering, (b) suggestion / cross-sell, (c) regulatory pathway routing, (d) any visible badge on ingredient rows or Supplement Facts. Field is wired into the data layer; consumer chain ends there.

### 7. Stability protocol integration — PARTIAL

**What ships:** the overage / loss model (`lib/supplementStability.ts`, surfaced at `app/workspace/page.tsx:5720-5900`) projects per-ingredient end-of-shelf-life loss as a function of category-level `baseAnnualLossPct` × storage modifier × packaging modifier (amber, desiccant, nitrogen flush, tocopherol antioxidant). User selects target shelf-life months and storage condition, engine returns required formulate-at amount per label-claim line. Cites 21 CFR 101.36(b)(3)(iv) and USP <1150>.

**What does NOT ship:** 21 CFR 111.175 stability **protocol management** — accelerated-vs-real-time pull-point planning, retention sample tracking, stability-test result logging, OOS investigation, expiry-extension justification on real data. The shipped engine is a predictive math model with conservative industry-default constants. A customer with their own stability data has no place to enter it; the model can't be overridden by measured data; there's no protocol-document generator.

### 8. cGMP documentation — PARTIAL

**What ships:** process-template **text** at `lib/data/supplements.ts:503-601` for three product types (Multivitamin, Protein Blend, Omega-3 Softgel) describing 17-step batch procedures with QA checkpoints citing 21 CFR 111.205 (MMR), 21 CFR 111.255 (BPR), 21 CFR 111.75 (identity), USP <905> (weight uniformity), USP <232> (heavy metals), USP <701> (disintegration). Surfaces as Process tab content in supplements mode.

**What does NOT ship:** any actual document generator. No MMR template auto-fills with the user's formulation; no BPR draft is produced from the inputs; no deviation form, no change-control log, no electronic signature, no batch-record archive. The procedural text is reference content, not a workflow.

### 10. DSHEA compliance — PARTIAL

**What ships:**
- Mandatory DSHEA disclaimer rendered as the bottom footer of every Supplement Facts panel (`app/workspace/page.tsx:4855`).
- Curated structure/function claim library keyed to ~50 ingredient names, each with marketing-template phrasings + citation source — surfaced as "Defensible structure/function claims" rows in the Claims Validator.
- Disease-claim language detector at `analyzeDraftClaim()` — user pastes intended marketing copy, engine flags disease-claim words ("treats", "cures", "prevents", "diagnoses", specific disease names) and surfaces them as red-flag findings.
- Auto-generated disclaimer block based on which structure/function claims are active (`buildDisclaimers`).
- Nutrient content claim auto-detection per 21 CFR 101.54 thresholds (10% / 20% / 50% / 100% DV) emitting "Good source", "Excellent source", "High in", "Concentrated source" templates.

**What does NOT ship:** DSHEA §6 / 21 CFR 101.93 30-day **FDA notification workflow** — no submission generator, no notification log, no tracking of which claims have been notified vs which haven't.

---

## NOT BUILT capabilities — detail

### 5. Master Manufacturing Record (MMR) — NOT BUILT

`Grep "MMR\|Master Manufacturing Record\|21 CFR 111\.205"` returns matches in three files only:
- `lib/data/supplements.ts:506-507` — text inside a process-template step ("Verify Master Manufacturing Record (MMR) is current and approved").
- `docs/regulatory/phase-1-companion-compliance-spec.md` — aspirational spec.
- `docs/regulatory/phase-1-nutraceuticals-regulatory-map.md` — regulatory map / planning doc.

No generator, template, form, or export path. A customer-zero user cannot produce an MMR from this tool today.

### 6. Identity testing workflows — NOT BUILT

`Grep "21 CFR 111\.75\|identity test\|COA upload"` returns matches in the same three files plus the `coaTemplateType` schema field. The schema defines values like `'extract'`, `'isolate'`, `'mineral-salt'`, `'probiotic-strain'`, `'whole-food-powder'`, `'vitamin-form'` (`types/index.ts:414-422`) — these are populated on Wave 2 / Wave 3 entries — but **no consumer reads them**: zero matches under `app/`, `components/`. There is no COA upload form, no identity-test method library, no test-record archive.

### 9. Determination Engine for supplements — NOT BUILT (intentional bypass)

`components/DeterminationEngineCard.tsx:67-74` reads:

```ts
if (modeId === 'supplements') {
  return {
    titleKey: 'determination.dietarySupplement.title',
    reasonKey: 'determination.dietarySupplement.reason',
    filingKey: 'determination.filing.dietarySupplement',
    severity: 'info',
  };
}
```

The card renders a single static info card and exits before any classification logic runs. There is no analog to the F&B Acid / Acidified / Acidified-in-Process / LACF / Shelf-Stable Dry classifier for supplements. Some adjacent classification work happens elsewhere (per-ingredient NDI status in `lib/supplementNDI.ts`, draft disease-claim detection in `lib/supplementClaims.ts`) — but the at-a-glance "your formulation is classified as X, requires filing Y" determination card does not exist for supplements.

### 11. Confidence taxonomy on supplement chemistry — NOT BUILT

The taxonomy (`Confidence`, `RangedValue`, `ConfidencePill`) ships in `components/ConfidencePill.tsx` and `lib/foodScience.ts:605+` and is wired to F&B equilibrium pH, water activity, brix, low-acid component %, cost, sustainability. **Not extended to supplements:** zero matches in `lib/supplementLabeling.ts`, `lib/supplementSafetyLimits.ts`, `lib/supplementStability.ts`, `lib/supplementClaims.ts` for `ConfidencePill` or `confidence`. Numeric values on the Supplement Facts panel (potency mg/mcg/IU/CFU, %DV, identity, purity, heavy-metals limits, microbial limits) render as plain numbers with no confidence tier and no per-metric range. The 2026-05-07 architectural reframe (per saved memory `feedback_confidence_taxonomy_foundational.md`) has not propagated.

---

## Landing-page-relevant findings

The following can be **honestly claimed today as Nutraceuticals workspace deliverables** (safest copy for v1 launch):

1. **"21 CFR 101.36 Supplement Facts panel — generated automatically from your formulation."**
   - Anchor: `lib/supplementLabeling.ts` + `app/workspace/page.tsx:4745-4860`. Renders correctly with serving-size + delivery-form translation, %DV per Table 1, `†` for actives without DVs, "Other Ingredients" excipient list, allergen "Contains:" line, mandatory DSHEA disclaimer.

2. **"~387 supplement SKUs across 14 categories — vitamins, minerals, botanicals, herbal extracts, mushroom extracts, probiotic strains, prebiotics, amino acids, omega-3s, enzymes, specialty compounds, plus a full excipient library — with verified suppliers, USP/USP-NF references, pharmacopeial monographs, and form-specific potency factors (e.g. Vitamin D3 100,000 IU/g on MCC carrier)."**
   - Anchor: `lib/data/supplements.ts:17-488`.

3. **"NDI / Old-Dietary-Ingredient compliance check on every ingredient — pre-1994 grandfathering, FDA NDI notification numbers, GRAS-food classification, and 'NDI required' warning surfaced inline."**
   - Anchor: `lib/supplementNDI.ts` + `app/workspace/page.tsx:4599-4694`. Honest copy here is "compliance check" / "risk flag," not "regulatory clearance."

4. **"DSHEA structure/function claims library plus a disease-claim language detector that scans your draft marketing copy and flags lines that would cross into disease-claim territory; auto-generated disclaimers under 21 CFR 101.93."**
   - Anchor: `lib/supplementClaims.ts` + `app/workspace/page.tsx:5270-5710`.

5. **"Tolerable Upper Intake Level (UL) safety check across vitamins/minerals/botanicals — IOM, FDA, EFSA limits — with population modifiers for pregnancy, pediatric, and athletic / NSF-Certified-for-Sport audiences. Banned-ingredient and drug-interaction-herb screening (St. John's Wort, ginkgo, kava, garlic, ginseng, etc.) included."**
   - Anchor: `lib/supplementSafetyLimits.ts` + `app/workspace/page.tsx:4395-4500`.

6. **"Stability + overage modeling: enter your shelf life, storage condition, and packaging (amber bottle / desiccant / nitrogen flush / tocopherol antioxidant) and the tool returns required formulate-at amounts so your label claims hold true through expiry per 21 CFR 101.36(b)(3)(iv)."**
   - Anchor: `lib/supplementStability.ts` + `app/workspace/page.tsx:5720-5900`. Honest framing: this is a **predictive model with conservative industry-default constants**, not a stability-protocol manager.

7. **"Ingredient compatibility checker — pairwise rules for known incompatibilities (iron + vitamin E pro-oxidation, calcium + iron absorption competition, calcium + phosphate precipitation, capsule-shell + fill conflicts, hygroscopic-pair packaging requirements)."**
   - Anchor: `lib/supplementCompatibility.ts` + `app/workspace/page.tsx:5903+`.

8. **"Retail channel fit screen — runs your formulation against Whole Foods, Sprouts, Target Clean, etc. unacceptable-ingredient lists and surfaces blocked / caution channels."**
   - Anchor: `lib/supplementRetailFit.ts` + `app/workspace/page.tsx:6552+`. Note honest framing: lists are **approximations** of public retailer standards and need verification.

9. **"Bulk-paste a starting formula from a spreadsheet, markdown table, or text dump and the tool tier-matches every line against the supplement catalog — Tier-1/2 imports automatically; Tier-3 (suffix-similarity ambiguity, head-token mismatch) requires explicit user confirmation before import to prevent silent substitutions."**
   - Anchor: `lib/parseFormula.ts` + `app/workspace/page.tsx:2944-2950`.

### Should NOT be claimed in v1 launch copy (aspirational / not built)

- **"Master Manufacturing Records (21 CFR 111.205-210) generated automatically"** — text reminders only, no document generator. **Do not claim.**
- **"Batch Production Records (21 CFR 111.255)"** — same. **Do not claim.**
- **"Identity testing workflow / COA upload / 21 CFR 111.75 compliance"** — schema fields exist, no UI. **Do not claim.**
- **"Drug interaction screening across all ingredients"** — partial only; works for ~9 hand-curated herbs. Per-ingredient `drugInteractions` field is dead data populated on a single SKU (Mucuna). **Claim narrowly as "drug-interaction-herb screening" with examples (St. John's Wort, ginkgo, etc.) — not "drug interactions on every ingredient."**
- **"Determination engine for NDI vs conventional, disease claim risk, structure/function validation"** — does not exist as a unified determination engine for supplements (the F&B engine is bypassed). Some pieces exist independently (NDI status panel, draft disease-claim detector). **Do not claim a "supplement determination engine"; claim the individual checks instead.**
- **"30-day FDA notification workflow for structure/function claims"** — not built. **Do not claim.**
- **"Confidence-tiered estimates for potency, identity, purity, microbial limits, heavy metals"** — taxonomy exists for F&B specs only. **Do not claim for supplements.**
- **"Functional-role-driven ingredient discovery / filtering / regulatory routing"** — data layer exists, no UI consumer. **Do not claim.**
- **"Stability protocol management per 21 CFR 111.175"** — overage prediction model only, not a protocol manager. **Claim "stability + overage modeling," not "stability protocols."**
- **"cGMP documentation / batch records / deviation handling / change control"** — process-template text only. **Do not claim documentation generation.**

### Ambiguities the operator should clarify before copy ships

1. **Is "Confidence taxonomy" a v1 launch claim?** The taxonomy exists for F&B (pH, a_w, cost) but has not been extended to supplement chemistry per the 2026-05-07 architectural reframe. Companion-spec language treats it as foundational. If the operator wants to claim confidence-tiered estimates as a workspace-wide capability, it would currently be misleading for the supplements panel — most supplement values render as plain numbers. Decide: claim it as "F&B today, supplements next" or omit until extended.
2. **"PA-review-ready packets" framing.** The Companion Spec § 0 explicitly locks the model: "The customer's own Process Authority reviews everything before it goes to production. The tool produces draft outputs and PA-review-ready packets. The tool does not certify compliance. The PA does." If the landing page is marketing the workspace as a PA-review-packet-producer, the operator should confirm whether the packet *export format* exists today or is aspirational — `Grep "PA-review\|review packet"` in `app/` returns zero matches; the framing exists only in `docs/regulatory/`.
3. **Drug-interaction copy precision.** Distinguish "drug-interaction warnings on a curated list of ~9 high-risk herbs" (what ships) from "drug interactions on every ingredient with documented contraindications" (what the schema implies but the UI does not deliver). The Mucuna case is an honest-failure example — the data is in the catalog, the user does not see it.
4. **"Customer-zero" workspace gating.** The Phase 1 Companion treats Bucket-1 (harm-critical, must-be-100%) items as launch-blocking. The operator should confirm whether MVP launches with Bucket-1 items only-partially-implemented (e.g., identity-testing field exists in schema, no consumer) or whether MVP scope tightens before August 2026 to match what the workspace actually surfaces. Landing-page copy probably should not claim Bucket-1 capabilities the workspace does not yet enforce.
