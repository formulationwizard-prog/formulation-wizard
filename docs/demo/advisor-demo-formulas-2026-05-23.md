# Advisor Demo Formulas — 2026-05-23

8 paste-able formulas (4 Nutraceuticals + 4 F&B) chosen to exercise different compliance surfaces of the workspace. Each formula's "demonstrates" section identifies the specific compliance machinery it activates.

**How to use:** Open the relevant workspace (Nutraceuticals or F&B), open Bulk Paste, paste the formula block, observe what the workspace surfaces. The compliance-rigor story IS the observed behavior — allergen auto-detection, UNDOCUMENTED defaults, NDI status surfacing, %DV ordering, harm-critical floor enforcement, PA verification queue routing.

---

## Nutraceuticals (4)

### N1 — Joint Health Stack

```
Glucosamine HCl 1500 mg
Chondroitin Sulfate 800 mg
MSM 1000 mg
Hyaluronic Acid 80 mg
Boswellia Extract 200 mg
```

**Demonstrates:**
- **FALCPA harm-critical allergen disclosure** — Glucosamine HCl carries Crustacean Shellfish allergen (Big-9). Workspace auto-detects, populates allergen statement, blocks "no allergens detected" silent-failure.
- **Specialty Compounds category** — freshly migrated in commit `fcde45e` (today's 0.5c.i work). All 4 joint-family ingredients now in canonical category.
- **MSM Phase 2 PA verification queue** — references `docs/pa-verification/2026-05-20-msm-optimsm-vs-usp-disambiguation.md`; workspace surfaces the open queue item rather than silently picking a form.
- **Multi-supplier sourcing** — Glucosamine HCl has 3 suppliers post-0.5c.i; cost analysis shows tier differential.

### N2 — Daily Multivitamin (Adult Female)

```
Vitamin A (Retinyl Palmitate) 700 mcg RAE
Vitamin D3 (Cholecalciferol) 20 mcg
Vitamin E (d-Alpha Tocopherol) 15 mg
Vitamin K2 MK-7 100 mcg
Vitamin C (Ascorbic Acid) 90 mg
Thiamine HCl 1.2 mg
Riboflavin 1.3 mg
Niacinamide 16 mg
Pyridoxal 5-Phosphate 1.7 mg
Methylfolate (Metafolin) 400 mcg DFE
Methylcobalamin 2.4 mcg
Iron Bisglycinate 18 mg
Calcium Citrate 200 mg
Magnesium Glycinate 100 mg
Zinc Picolinate 8 mg
L-Selenomethionine 55 mcg
```

**Demonstrates:**
- **DV table coverage end-to-end** — every ingredient has a %DV; SFP renders 21 CFR 101.36 format with descending-by-weight ordering.
- **Form-specific selection discipline** — P5P over generic Pyridoxine HCl, Methylfolate over folic acid, Methylcobalamin over cyanocobalamin. Workspace differentiates branded forms (Metafolin) from generic.
- **Elemental-factor back-computation** — Calcium Citrate label-claim mass back-computes to elemental calcium; potencyFactor doctrine applied at bulk-paste boundary.
- **Iron Bisglycinate Fe% PENDING** — Phase 2 supplier-spec verification queue; workspace surfaces the open PENDING flag rather than asserting a verified value.
- **Audience-aware UL warnings** — for Adult Female demographic, retinol + iron limits enforced per intended-audience routing.

### N3 — Methylation / Cognitive Support

```
Methylfolate (Quatrefolic) 800 mcg DFE
Methylcobalamin 1000 mcg
SAMe 400 mg
TMG (Betaine Anhydrous) 1500 mg
Choline Bitartrate 500 mg
Bacopa Monnieri Extract (Bacognize) 300 mg
L-Theanine (Suntheanine) 200 mg
```

**Demonstrates:**
- **SAMe Fermentation-Derived rename** — landed today in commit `fcde45e` per §II.9a Refinement 3 chemistry-form discipline. Demo shows the resolved canonical name.
- **Brand-locked synonym discipline** — bare "Methylfolate" or "5-MTHF" surfaces Tier-3 ambiguity (Metafolin vs Quatrefolic both registered); workspace requires explicit brand to land. Tests the silent-substitution prevention.
- **NDI-status differentiation** — Bacognize is NDI-notified; SAMe is GRAS-self-affirmed; TMG is GRAS; Choline Bitartrate has its own NDI route. Workspace surfaces the regulatory mix.
- **Branded extract standardization** — Bacognize specifies bacopaside content; workspace carries the standardization in the entry name and SFP.

### N4 — Sleep Support (PA verification queue trigger) — REFINED 2026-05-23

```
Melatonin 3 mg
L-Theanine (Suntheanine) 200 mg
Magnesium Glycinate (Albion TRAACS) 200 mg
GABA 100 mg
```

**Demonstrates:**
- **PA verification queue surfacing** — Melatonin NDI status is PENDING per `docs/pa-verification/2026-05-18-melatonin-ndi-status.md`. Workspace surfaces the pending PA review rather than asserting a verified status; ties into the PA-as-authority reframe.
- **Single-canonical-name discipline** — Melatonin has multiple SKUs (crystalline vs time-release); bare "melatonin" routes to crystalline per Wave 1.5b §II.8a edge case; TR-qualified synonyms required for time-release form.
- **Branded chelate vs commodity** — Magnesium Glycinate (Albion TRAACS) Tier-1 brand-locked; bypasses the branded-vs-generic tier ambiguity that bare "Magnesium Glycinate" would surface. Demonstrates tier-attribution discipline at paste time.
- **Dosage validation** — 3 mg melatonin is mid-range; workspace flags if operator enters off-range (high doses degrade sleep architecture per AASM clinical guideline).

**Refinement note (2026-05-23):** Original formula included Valerian Root Extract 300 mg + Chamomile Extract 200 mg; neither is in current catalog. Refined Path B per pre-demo verification — kept the 4 ingredients that resolve cleanly Tier-1/2 + tell the same Melatonin-PA-queue compliance story without 2 no-match interruptions during demo flow.

---

## Food & Beverage (4)

### F1 — Acidified Salsa (jarred, shelf-stable)

```
Tomatoes (Diced) 12 oz
Onions (Diced) 2 oz
Bell Peppers (Diced) 2 oz
Jalapeños (Diced) 0.5 oz
Garlic (Minced) 0.25 oz
Distilled White Vinegar (5% acidity) 2 oz
Lime Juice (Fresh) 0.5 oz
Salt 0.2 oz
Cilantro (Fresh) 0.15 oz
Cumin (Ground) 0.05 oz
```

**Demonstrates:**
- **21 CFR 114 acidified-foods classification gate** — workspace identifies the formulation as acidified per FDA framework; routes to Scheduled Process filing requirement.
- **pH equilibrium predictor (Q4 2026 roadmap)** — when built, workspace predicts equilibrium pH with confidence + range per `docs/roadmap/acidified-foods-ph-predictor.md`; honest-uncertainty-as-moat principle in action.
- **PA verification gate** — acidified foods require measured equilibrium pH for filing; workspace shows the predictor as screening tool only, PA verification gates the filing.
- **Mode-gate cleanliness** — F&B workspace routes to LACF/FSMA framework, not DSHEA. Demonstrates Finding #25 mode-gate fix.

### F2 — Salad Dressing (Caesar-style emulsion)

```
Olive Oil 8 oz
Egg Yolks (Pasteurized) 1.5 oz
Lemon Juice (Fresh) 1 oz
Apple Cider Vinegar 0.5 oz
Anchovies (Paste) 0.25 oz
Garlic (Minced) 0.15 oz
Parmesan Cheese (Grated) 1 oz
Dijon Mustard 0.25 oz
Worcestershire Sauce 0.1 oz
Black Pepper 0.05 oz
Salt 0.1 oz
```

**Demonstrates:**
- **Multi-allergen FALCPA disclosure** — Egg (yolks), Milk (parmesan), Fish (anchovies), plus possible Soy + Wheat in Worcestershire Sauce sub-ingredients. 3-5 of the Big-9 triggered in a single formulation.
- **Emulsion specs (w/o)** — water-in-oil with multiple aqueous phases (lemon, vinegar); workspace surfaces emulsion-specific stability concerns.
- **Combined pH + aw gates** — preservation system relies on both pH (acid) and aw (oil phase); workspace evaluates both compliance gates.
- **Sub-ingredient identity discipline** — Worcestershire Sauce has its own ingredient declaration; workspace exercises sub-ingredient declaration per FDA format.

### F3 — Hot Sauce (pepper sauce, pH-gated shelf-stable)

```
Habanero Peppers (Fresh) 8 oz
White Vinegar (5% acidity) 4 oz
Carrots (Cooked) 2 oz
Onions (Sautéed) 1 oz
Lime Juice 0.5 oz
Salt 0.25 oz
Garlic (Roasted) 0.2 oz
Sugar 0.15 oz
```

**Demonstrates:**
- **pH gate (<4.6 acidified threshold)** — workspace evaluates whether formulation meets acidified-foods classification.
- **LACF vs acidified determination** — workspace routes to the correct FDA framework based on pH + processing method.
- **Allergen-clean formulation** — exercises the inverse compliance surface: workspace correctly renders "no major allergens detected" only when allergens have been investigated AND found absent (per harm-critical floor doctrine — empty ≠ verified-safe).
- **Honest-uncertainty on pH prediction** — same predictor surface as F1 but simpler matrix; confidence interval renders.

### F4 — Electrolyte Beverage Mix (dry powder) — DROPPED from advisor demo 2026-05-23

**Pre-demo verification result:** F&B catalog doesn't carry Potassium Chloride, Magnesium Citrate (only in supplements catalog), Beta Carotene, or "Natural Lemon Flavor" (closest match is Pure Lemon Extract — different form). 3-4 no-match interruptions would dilute the F&B disclosure-discipline story this formula was meant to demonstrate.

**Original formula preserved for reference** (revisit when F&B catalog deepens to include supplement-shape isolate ingredients):

```
Sucrose 14 g
Sodium Chloride 0.5 g
Potassium Chloride 0.3 g
Magnesium Citrate 0.1 g
Citric Acid 0.4 g
Natural Lemon Flavor 0.05 g
Stevia Extract 0.02 g
Beta Carotene (Color) 0.005 g
```

**Demonstrations this formula would have shown (deferred until catalog deepens):** electrolyte mEq/mg conversions; natural flavor disclosure obligation; color additive (Color) qualifier; sweetener disclosure discipline.

**Demo arc replacement:** Drop F4; F&B portion is now F1 → F2 → F3. Total advisor demo: 4 supplements (N1-N4) + 3 food (F1-F3) = 7 formulas.

---

## Demo framing for the advisor (suggested narrative arc)

1. **Open with N1 (Joint Health Stack)** — strongest immediate compliance story. Crustacean Shellfish allergen auto-detected; the empty-allergen UNDOCUMENTED-not-VERIFIED-SAFE distinction is observable; multiple suppliers + cost differential shows the commercial decision support.
2. **Then N2 (Multivitamin)** — full DV table exercise; %DV ordering; PENDING flags surface visibly. Shows the workspace at production volume (16 ingredients).
3. **Then N4 (Sleep Support)** — PA verification queue surfacing on Melatonin; demonstrates the customer-owned PA model (workspace surfaces uncertainty, PA decides).
4. **N3 (Methylation) as bonus** if time allows — brand-locked synonym discipline + chemistry-form rename discipline; these are the subtle correctness wins that compound.

5. **Switch modes to F&B.** F1 (Salsa) for pH compliance gate + acidified-foods filing. F2 (Caesar dressing) for multi-allergen + emulsion specs. F3 (Hot Sauce) for the LACF/acidified determination + clean-allergen verification.
6. **F4 (Beverage) dropped from this demo** per pre-demo verification — F&B catalog doesn't yet carry supplement-shape isolate ingredients. Revisit when catalog deepens.

## Risk: ingredient resolution check

Some entries may not resolve cleanly against current catalog (catalog at 392 entries; not every paste-able phrasing will Tier 1 match). **Suggestion:** run a quick pre-demo bulk-paste rehearsal against each formula. Catalog "no match" surfacing is itself a compliance feature (T-II.C.4 from the QA plan), but during a live demo you want zero surprises — especially on the supplement formulas which exercise SKU-specific resolution heavily.

CC can pre-verify each formula's ingredient resolution against current `lib/data/supplements.ts` if you want — ~5 min, catches any drift before the advisor sees it. Say the word.

---

## Pre-demo verification results (executed 2026-05-23)

Catalog grepped against all 8 formulas. Findings split into 3 categories:

### Category 1: Clean Tier-1/2 resolution (will land smoothly)

**Supplements:** Glucosamine HCl (`Shellfish-Derived` allergen will surface), Chondroitin Sulfate, Boswellia Extract, Vitamin E (d-Alpha Tocopherol), Vitamin C (Ascorbic Acid), L-Selenomethionine, Quatrefolic, SAMe (post-rename), TMG/Betaine, Choline Bitartrate, Bacognize, Suntheanine/L-Theanine, Melatonin, GABA.

**F&B:** Distilled White Vinegar 5%, Apple Cider Vinegar, Citric Acid, Cumin, Cilantro, Anchovy Paste, Parmesan Cheese Powder, Dijon Mustard, Worcestershire Sauce, Black Pepper, Habanero Peppers, Carrots, Sucrose, Stevia, Salt.

### Category 2: Tier-3 ambiguous (multiple SKUs — workspace WILL surface disambiguation)

This is a compliance feature working as designed (T-II.C.5 from QA plan). The workspace prevents silent SKU substitution. **For the demo:** this is the silent-substitution-prevention story — use it as a compliance demonstration.

| Demo ingredient | Catalog options |
|---|---|
| MSM | Specialty Compounds OptiMSM (line 91) vs Specialty USP (line 286) — Phase 2 PA queue routing |
| Hyaluronic Acid | Sodium Low MW (96) vs Injuv (287) vs Hydrolyzed (288) — 3-way |
| Vitamin D3 / Cholecalciferol | Multiple potencies (32, 33 vegan-lichen, 119) |
| Vitamin K2 MK-7 | Natto 0.2% (36) vs NattoPharma 2% (126) — tier-pair |
| Thiamine HCl / Niacinamide / P5P | All have Tier-A + Tier-B siblings (tier-attribution discipline) |
| Methylcobalamin | Pharma-grade (29) vs Commodity (144) |
| Iron Bisglycinate | 20% Fe Ferrochel (44) vs 18% Fe **PENDING SPEC VERIFICATION** (173) — Phase 2 queue surfaces |
| Calcium Citrate | Tier-A (40) + Tier-B (155) + CCM Calcium Citrate Malate (156) — 3-way |
| Magnesium Glycinate | Albion TRAACS branded (41) vs Commodity (162) — tier discipline |
| Zinc Picolinate | USP (46) vs Premium (170) |
| Magnesium Citrate | Tier-A (43) + Tier-B (161) |
| Tomatoes | IQF Diced (122) + Roma (198) + Beefsteak (199) + Cherry (200) + Paste (67) + Puree (128) — form-specific |
| Onions | IQF Diced (118) + Yellow Fresh (185) + Red (186) + Sweet (187) — form-specific |
| Bell Peppers | IQF Mixed (120) + Red (194) + Green (195) + Yellow (196) |
| Olive Oil | Extra Virgin (47) + Pure/Light (48) + Pomace (49) |
| Garlic | IQF Minced (119) + Fresh Bulbs (188) — form-specific |

**Bare-name pastes for any of these will hit Tier-3 disambiguation.** The workspace asks "which one?"; operator picks; resolution is logged. **This is the silent-failure prevention story — lean into it.**

### Category 3: NO-MATCH (will surface as no-match — also a compliance feature, T-II.C.4)

These ingredients are not in the catalog. Workspace will surface as no-match rather than silently substituting near-matches. **For the demo:** this is the harm-critical-floor / UNDOCUMENTED discipline in action — the workspace refuses to pretend it knows something it doesn't.

**Supplements (N4 Sleep Support):**
- Valerian Root Extract — NOT IN CATALOG
- Chamomile Extract — NOT IN CATALOG

**F&B (F4 Electrolyte Beverage):**
- Sodium Chloride — likely Tier-2 head-token fallback to Salt (line 77); may also surface as ambiguous
- Potassium Chloride — NOT IN F&B CATALOG
- Magnesium Citrate — IS in supplements catalog (lines 43, 161) but NOT in F&B catalog; behavior depends on mode-gate (cross-mode lookup not standard)
- Beta Carotene — NOT IN F&B CATALOG
- Natural Lemon Flavor — closest match is `Pure Lemon Extract (Oil-Based)` (line 358); likely Tier-3 ambiguous or no-match

**F&B (F2 Caesar):**
- Egg Yolks (Pasteurized) — catalog has only `Egg Yolk Powder` (line 152); likely Tier-3 ambiguous (form mismatch: liquid pasteurized vs spray-dried powder)

---

## Two demo paths

### Path A — Lean into ambiguities + no-matches as compliance demonstrations

**Narrative:** Every ambiguous resolution + every no-match is the workspace doing its job. Frame each surfacing as a compliance win.

Concrete demo beats this enables:
- N1: Glucosamine HCl → Shellfish allergen auto-detects; MSM ambiguity surfaces Phase 2 PA queue; HA 3-way disambiguation shows form-specific selection
- N2: Tier-A/B disambiguation on 5+ B-vitamins shows tier-attribution discipline; Iron Bisglycinate PENDING SPEC VERIFICATION surfaces Phase 2 queue prominently
- N3: SAMe rename works cleanly (today's commit); Quatrefolic brand-locked synonym lands Tier-1; bare "Methylfolate" would surface 2-way disambiguation
- N4: Melatonin NDI status PENDING PA queue surfaces; Valerian + Chamomile no-match demonstrates harm-critical floor discipline (workspace doesn't pretend to know)
- F1-F3: Tomato / Onion / Bell Pepper / Olive Oil ambiguities demonstrate form-specific compliance
- F4: Potassium Chloride + Beta Carotene + Natural Lemon Flavor no-matches reinforce harm-critical discipline

**Pros:** Tells the strongest compliance story; no formula rewrites needed.
**Cons:** Demo flow has more interactive disambiguation steps; not "click → done." Advisor needs to engage with the workspace's clarifying prompts.

### Path B — Refine formulas for cleaner resolution (smoother demo flow)

**Concrete refinements** that resolve cleanly Tier-1/2:

| Demo ingredient | Refined to | Why |
|---|---|---|
| Methylfolate (Metafolin) | `Methylfolate (Metafolin) 400 mcg DFE` | Already canonical; no change |
| Iron Bisglycinate 18 mg | `Iron Bisglycinate (Ferrochel — 20% Fe) 18 mg` | Picks the verified-Fe% SKU; avoids PENDING SPEC ambiguity |
| Calcium Citrate 200 mg | `Calcium Citrate (USP, Tier-A) 200 mg` | Picks Tier-A; avoids 3-way |
| Magnesium Glycinate 100 mg | `Magnesium Glycinate (Albion TRAACS) 100 mg` | Picks branded; avoids tier ambiguity |
| Vitamin D3 20 mcg | `Vitamin D3 Cholecalciferol (100,000 IU/g on MCC) 20 mcg` | Specifies form; avoids 3-way |
| Vitamin K2 MK-7 100 mcg | `Vitamin K2 MK-7 (Natto, 0.2% on MCC) 100 mcg` | Specifies SKU; avoids tier ambiguity |
| Valerian Root Extract 300 mg | **REMOVE from N4 formula or substitute another in-catalog calming ingredient** (e.g., another L-Theanine pairing) | Not in catalog |
| Chamomile Extract 200 mg | **REMOVE or substitute** | Not in catalog |
| F4 Potassium Chloride 0.3 g | **REMOVE or substitute** | Not in F&B catalog |
| F4 Magnesium Citrate 0.1 g | **REMOVE or move formula to Nutraceuticals workspace** | Not in F&B catalog; works in supplements |
| F4 Beta Carotene (Color) 0.005 g | **REMOVE or substitute** | Not in F&B catalog |
| F2 Egg Yolks (Pasteurized) 1.5 oz | `Egg Yolk Powder 0.5 oz` (rehydrate) OR change to Whole Egg Powder | Powder is the catalog form |

**Pros:** Cleaner demo flow; every paste lands Tier-1/2; no interactive disambiguation.
**Cons:** Loses some compliance-feature demonstrations (Tier-3 ambiguity + no-match surfacing); formulas look more SKU-specific (less "operator-typed" feel).

### CC recommendation

**Hybrid: Path A for N1-N3 + F1-F3, Path B for N4 + F4.**

- N1-N3 and F1-F3 have rich Tier-3 ambiguity surface (MSM, HA, K2, Tier-A/B vitamins, Tomato/Onion forms) — the compliance demonstrations are the demo's strongest beats. Don't refine these.
- N4 has 2 no-match ingredients (Valerian + Chamomile) on a formula where the goal is showing PA queue surfacing (Melatonin). Two no-matches dilute that beat. Substitute them: `Magnesium Glycinate 200 mg + L-Theanine (Suntheanine) 200 mg + GABA 100 mg + Melatonin 3 mg` covers the same sleep-stack story with all Tier-1/2 matches.
- F4 has 3-4 no-match ingredients; the formula concept (electrolyte beverage) is fine but the F&B catalog isn't deep enough on supplement-shape ingredients. Either move F4 to Nutraceuticals workspace OR substitute a simpler beverage like sweetened citrus drink that lands cleanly.

**Your call on which path per formula.** I can write the refined formula blocks if you pick Path B for any.

---

## Disambiguation walkthrough — what the workspace will ask during the demo

Use this as a reference card during the live demo. Each Tier-3 ingredient triggers a "which one?" prompt; this table tells you what to pick and why each pick is a compliance demonstration.

### N1 — Joint Health Stack disambiguation

| Paste line | Workspace surfaces | Pick | Compliance story |
|---|---|---|---|
| `MSM 1000 mg` | OptiMSM (Specialty Compounds, line 91) vs MSM USP (Specialty, line 286) — Phase 2 PA queue flag visible | OptiMSM | Phase 2 PA queue surfacing — demonstrates the queue isn't decorative, it's gating |
| `Hyaluronic Acid 80 mg` | Sodium Low MW 50 kDa (96) vs Injuv (287) vs Hydrolyzed Low MW Skin (288) | Injuv | 3-way form-specific selection — joint vs skin claims depend on MW; workspace prevents wrong-form substitution |

Other 3 ingredients (Glucosamine HCl, Chondroitin Sulfate, Boswellia) land Tier-1/2 with no prompt.

### N2 — Daily Multivitamin disambiguation (10+ disambiguation prompts)

| Paste line | Workspace surfaces | Pick | Compliance story |
|---|---|---|---|
| `Vitamin D3 (Cholecalciferol) 20 mcg` | 100k IU/g MCC (32) vs Vegan Lichen (33) vs 1M IU/g (119) | 100k IU/g MCC | Form-specific potencyFactor differs; back-computation discipline |
| `Vitamin K2 MK-7 100 mcg` | Natto 0.2% (36) vs NattoPharma 2% (126) | Either per cost preference | Tier-pair; potencyFactor differs 0.002 vs 0.02 |
| `Thiamine HCl 1.2 mg` | Tier-A (21) vs Tier-B (128) | Tier-A | Tier-attribution discipline; PENDING TIER VERIFICATION flag visible |
| `Niacinamide 16 mg` | Tier-A (23) vs Tier-B (131) | Tier-A | Same |
| `Pyridoxal 5-Phosphate 1.7 mg` | Tier-A (26) vs Tier-B (139) | Tier-A | Same |
| `Methylfolate (Metafolin) 400 mcg DFE` | Tier-1 brand match (141) | Auto-resolved | Brand-locked synonym — bare "Methylfolate" would hit Tier-3 between Metafolin vs Quatrefolic; specifying Metafolin lands Tier-1 |
| `Methylcobalamin 2.4 mcg` | Pharma-grade (29) vs Commodity (144) | Pharma-grade | Sourcing tier discipline |
| `Iron Bisglycinate 18 mg` | Ferrochel 20% Fe (44) vs Ferrochel 18% Fe **PENDING SPEC VERIFICATION** (173) | **Demonstrate the PENDING flag** | **STRONGEST DEMO BEAT** — workspace literally shows where catalog has unresolved verification in flight; Phase 2 supplier-spec queue surfacing inline |
| `Calcium Citrate 200 mg` | Tier-A (40) vs Tier-B (155) vs Calcium Citrate Malate CCM (156) | Tier-A | 3-way disambiguation; premium-vs-commodity-vs-CCM differentiation |
| `Magnesium Glycinate 100 mg` | Albion TRAACS (41) vs Commodity (162) | Albion TRAACS | Branded chelate vs generic; bioavailability differential |
| `Zinc Picolinate 8 mg` | USP (46) vs Premium (170) | Either | Tier discipline |

Vitamin E (d-Alpha Tocopherol), Vitamin C (Ascorbic Acid), L-Selenomethionine, Retinyl Palmitate, Riboflavin — land Tier-1/2.

### N3 — Methylation / Cognitive disambiguation

| Paste line | Workspace surfaces | Pick | Compliance story |
|---|---|---|---|
| `Methylfolate (Quatrefolic) 800 mcg DFE` | Tier-1 brand match (142) | Auto-resolved | Brand-locked synonym — without "Quatrefolic", would hit Tier-3 with Metafolin |
| `Methylcobalamin 1000 mcg` | Pharma (29) vs Commodity (144) | Pharma | Same as N2 |

SAMe, TMG, Choline Bitartrate, Bacognize, L-Theanine — all Tier-1/2 (post today's SAMe rename).

### N4 — Sleep Support disambiguation (REFINED — minimal prompts)

| Paste line | Workspace surfaces | Pick | Compliance story |
|---|---|---|---|
| `Melatonin 3 mg` | Crystalline (92) — bare "melatonin" Tier-1 to crystalline per §II.8a | Auto-resolved | Single-canonical-name routing |

L-Theanine (Suntheanine specified), Magnesium Glycinate (Albion TRAACS specified), GABA — Tier-1/2.

**Bonus moment:** Melatonin SFP rendering surfaces PENDING NDI status from `docs/pa-verification/2026-05-18-melatonin-ndi-status.md` — the PA verification queue isn't a separate dashboard, it's surfaced inline at use time. Point this out during demo.

### F1 — Acidified Salsa disambiguation

| Paste line | Workspace surfaces | Pick | Compliance story |
|---|---|---|---|
| `Tomatoes (Diced) 12 oz` | IQF Diced (122) vs Roma Fresh (198) vs Beefsteak (199) vs Cherry (200) vs Paste (67) vs Puree (128) | IQF Diced or Roma | Form-specific — Brix/pH differ; prevents wrong-form selection |
| `Onions (Diced) 2 oz` | IQF Diced (118) vs Yellow/Red/Sweet Fresh (185-187) | IQF Diced | Same form-specificity |
| `Bell Peppers (Diced) 2 oz` | IQF Mixed (120) vs Red/Green/Yellow Fresh (194-196) | IQF Mixed | Same |
| `Jalapeños (Diced) 0.5 oz` | IQF Diced (121) vs Fresh (191) vs Mash (416) | IQF Diced | Same |
| `Garlic (Minced) 0.25 oz` | IQF Minced (119) vs Fresh Bulbs (188) vs Powder (114) | IQF Minced | Same |
| `Lime Juice (Fresh) 0.5 oz` | Only Concentrate (125); Fresh limes (202) is whole fruit | Tier-3 between Concentrate vs fresh-juicing calc | Form mismatch surfaces; honest about catalog limitation |

White Vinegar 5%, Cilantro, Cumin, Salt — Tier-1/2.

### F2 — Caesar dressing disambiguation

| Paste line | Workspace surfaces | Pick | Compliance story |
|---|---|---|---|
| `Olive Oil 8 oz` | Extra Virgin (47) vs Pure/Light (48) vs Pomace (49) | Extra Virgin | Grade discipline — fatty acid profile + smoke point differ |
| `Egg Yolks (Pasteurized) 1.5 oz` | Only Egg Yolk Powder (152) — form mismatch | **Tier-4 no-match or Tier-3 form-substitute prompt** | Workspace doesn't silently substitute powder for liquid; surfaces the form gap |
| `Lemon Juice (Fresh) 1 oz` | Only Concentrate (124) | Concentrate or fresh-juicing calc | Form mismatch |
| `Garlic (Minced) 0.15 oz` | Same as F1 | Same | Same |

Apple Cider Vinegar, Anchovy Paste (Fish), Parmesan (Milk), Dijon (Mustard), Worcestershire (Fish via sub-ingredients), Black Pepper, Salt — Tier-1/2. **Multi-allergen pile-up demonstrates FALCPA disclosure auto-detection** — this is one of the strongest F&B moments.

### F3 — Hot Sauce disambiguation

| Paste line | Workspace surfaces | Pick | Compliance story |
|---|---|---|---|
| `Habanero Peppers (Fresh) 8 oz` | Tier-1 match (192) | Auto-resolved | Clean |
| `Onions (Sautéed) 1 oz` | Multiple Onion entries — none specifies "Sautéed" | Tier-3 form question | Process-state-specific compliance (sautéing changes water activity) |
| `Carrots (Cooked) 2 oz` | Tier-2 head-token match to Fresh (206); "Cooked" form qualifier may surface | Form prompt likely | Process-state compliance |
| `Garlic (Roasted) 0.2 oz` | Same as F1/F2 + "Roasted" form qualifier | Form mismatch | Process-state compliance |
| `Lime Juice 0.5 oz` | Same as F1 | Same | Same |

White Vinegar 5%, Salt, Sugar — Tier-1/2.

---

## Demo rehearsal recommendation

Run each formula's bulk-paste flow once before the advisor sees it. ~10 min total. Highest-value demo prep:

- You know exactly which buttons to click on each disambiguation prompt
- Advisor sees confident workspace navigation, not "what do I pick?"
- You can pre-narrate each compliance moment ("watch — workspace asks which form")
- Any unexpected behavior (catalog drift, prompt phrasing) gets caught pre-demo, not on stage

**Strongest single moment to rehearse and own:** N2 Iron Bisglycinate PENDING SPEC VERIFICATION. The workspace literally shows the advisor where the catalog has unresolved verification work in flight. That's the customer-owned PA model in one screen.
