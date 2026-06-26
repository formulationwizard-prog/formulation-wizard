# Integration Walkthrough — Findings Inventory (2026-06-23)

**Branch under test:** `integration-aug-mvp` (Tier-3 + WS-B gate + FVR + docs, integrated).
**Method:** Wizard walks each of the 18 test-library formulations live in the browser (CC can't click). CC grounds each finding (code-trace + CFR-anchor) and categorizes. **No architecture written until the inventory is complete** (don't construct against a partial model).

**Library:** 8 supplement ([library](test-formulation-library.md)) + 10 F&B ([library](test-formulation-library-fb.md)) = **18**.

---

## Finding categories

- **🔴 MISBRANDING-HOLE** — produces a non-compliant output by default. MVP-blocking / ship-stop.
- **🟡 TRUTH-PRECISION** — honest-engine accuracy issue (engine states something imprecisely). Fix-in-place.
- **🔵 UX-GAP** — operator-facing friction; not safety, affects usability.
- **⚪ ARCH-OBSERVATION** — needs design before code.

---

## Findings log

| # | Formulation | Cat | Finding | Grounding | Disposition |
|---|---|---|---|---|---|
| F-1 | Supp #1 Sleep & Recovery | 🔴 | Proprietary blend / compound ingredient enters as opaque `foodData:null` via free-text Add box + bulk-paste Tier-4 "Skip"-only — no component listing | [page.tsx:1706-1707](../../app/workspace/page.tsx#L1706); 21 CFR 101.36(c) / 101.4(b)(2) | → composability memo (L0 closes hole) |
| F-2 | Supp #1 Sleep & Recovery | 🟡 | Tier-3 force-picks miscounted as "low-confidence partial matches (head-token/suffix)" in the summary banner | [page.tsx:4975](../../app/workspace/page.tsx#L4975) + [5023-5024](../../app/workspace/page.tsx#L5023) | → bundle with L0 |
| **F-3** | **Supp #2 Daily Multivitamin** | **🔴** | **SFP inflates every active + %DV by (capsule fill ÷ actives total) = 660/421.6 = 1.566×** (Vit C 90→141/157%, Niacin 16→25.05/157%, B12 500→783, Ca/Mg scaled). **Regression** of the 2026-06-05 SFP-inflation bug: `SUPPLEMENT_CONVENTION_B_ENABLED` flipped to **true** (2026-06-07); the "blank-until-real fill makes B safe" rationale fails once an operator enters a real fill weight > actives total → silent overstatement = misbranding. | flag [supplementMath.ts:200](../../lib/supplementMath.ts#L200); scale [supplementMath.ts:138-139](../../lib/supplementMath.ts#L138); `deriveSupplementServingMassG` [230-238](../../lib/supplementMath.ts#L230); doctrine warning [148-190](../../lib/supplementMath.ts#L148); 21 CFR 101.36(b)/(d) | **ROUTE-REQUIRED** — carve-out file + overturns/repairs LOCKED Convention-A-for-August doctrine. Ship-stop. Wizard + Opus ruling. |
| F-4 | Supp #2 Daily Multivitamin | 🟡 | Bare "Vitamin D3 (Cholecalciferol) 25 mcg" / "Vitamin K2 (MK-7) 90 mcg" default-resolve to **carrier-loaded SKUs** (1M IU/g, 2%) → 25 mcg D3 reads 1 mcg/5%. Carrier-loaded guard *warns* honestly, but default-SKU choice mangles novice intent. | carrier-loaded potencyFactor doctrine; near-zero-active guard | scope at L-build / catalog-resolution review |
| F-5 | Supp #2 Daily Multivitamin | 🔵 | "Vitamin C (Ascorbic Acid)" force-picks despite the form named in parens — could auto-resolve. (Library annotation #2 wrongly claims it resolves directly — doc fix.) | formSet match on "vitamin c" ignores parenthetical | low-priority UX + doc fix |
| F-1↻ | Supp #3 Sports Pre-Workout | 🔴 | F-1 **recurs** (PumpMax Proprietary Blend) — confirms the blind-spot is systematic, not one-off. | same as F-1 | → composability (L0) |
| **F-3↻** | **Supp #3 Sports Pre-Workout** | **🔴** | **F-3 confirmed BIDIRECTIONAL.** Here fill (660 mg) < Σactives (15,500 mg) → scale **0.0426** → actives *deflated*: Creatine 5000→**213 mg**, Beta-Alanine 3200→136, Citrulline 6000→255, Caffeine 200→8.5. Misbranding by gross *understatement*. Proves the bug = `computePerServingScale`=fill/total, afflicting **every count-form where fill ≠ Σactives** (the norm). Producibility correctly flags "over-fill impossible" but SFP scales to it anyway — not reconciled. | same as F-3 | **ROUTE-REQUIRED — ship-stop** (escalates F-3 scope) |
| F-6 | Supp #3 Sports Pre-Workout | 🔵 | Delivery form defaulted to **Capsule** for a pre-workout (15.5 g = powder/scoop). Bad default *compounds* F-3 (mass-form would give scale=1.0). Form default should follow product type. | — | scope w/ F-3 fix |
| F-3↻ | Supp #4 Prenatal | 🔴 | F-3 3rd confirmation — scale 660/1278 = 0.5164 (Folate 800→413, Iron→2.8, Choline→116). Systematic. | same as F-3 | (recurrence) |
| F-7 | Supp #4 Prenatal | 🟡 | Bare **"Iron"** auto-resolves (Tier-1/2 match, no confirm) to **Iron Bisglycinate (Ferrochel, 20% Fe)** — but iron is UL-sensitive + multi-form (sulfate/fumarate/bisglycinate, differing elemental % + UL). Should **force-pick** like Selenium/Iodine. `formSets.ts` missing UL-sensitive minerals (Iron, likely Zn/Mg/Ca when bare). | force-pick registry coverage gap | scope w/ catalog/formSet review |
| F-8 | Supp #4 Prenatal | 🔵 | Capsule supplement shows an INFERRED `pH 7.00 ± 0.50` in the status bar — pH is an F&B/114 concept, not meaningful for a dry capsule + not a tracked spec here. Irrelevant spec surfaced. | — | low-priority; verify not load-bearing |
| F-4↻ | Supp #4 Prenatal | 🟡 | DHA→"Fish Oil 18/12 EE (Concentrated)" — 450 mg = ~54 mg actual DHA (12% concentrate). Same family as F-4 (concentration/carrier default obscures real active). | concentrationRatio / carrier doctrine | scope w/ F-4 |
| OBS-1 | Supp #4 Prenatal, #6 Omega-3 | ✅? | WS-B gate fired: "Blocked 1 critical / 1 hard-stop" (recurs #6). **GREEN if the critical is legitimate** (gate blocking a real problem = §A step 5/6 win). Wizard to expand + confirm not a false block. | WS-B gate | verify legitimacy |
| F-9 | Supp #6 Omega-3 | 🟡 | cGMP-program panel labels control points **"Critical Control Points (CCP)"** — but CCP is **HACCP / 21 CFR 117 / 123 / 120** terminology; **21 CFR 111** (supplement cGMP) uses *specifications + process controls*, not CCPs. Conflates two frameworks. *May be intentional shorthand — verify intent.* (Panel itself is GREEN + honestly disclaimed.) | regulatory terminology precision | verify intent w/ build |
| F-3↻ | Supp #6 Omega-3 | 🔴 | recurrence — scale 660/800 = 0.825 (Fish Oil 500→413, Krill 300→248). | same as F-3 | (recurrence) |
| OBS-2 | Supp #6 Omega-3 | ℹ️ | Vit E pasted "Mixed Tocopherols" (natural) resolved to "dl-alpha tocopherol (synthetic)" — opposite stereochem + different IU→mg factor. Likely operator pick; note Vit E natural-vs-synthetic + IU conversion complexity for the Vit E formSet. | — | low / note |
| **F-10** | **Supp #7 Probiotic Multi-Strain** | **🔴** | **Bulk-paste silently drops any line with an unrecognized unit.** (1) `QTY_UNIT_PATTERN` has **no CFU/Billion/IU** — only mass/volume. (2) Unparseable lines are **silently discarded** (`if (rawQty<=0) continue`) — no row, no warning. Result: 3-line probiotic → 1 row; **both probiotic strains vanished**. structuredCapture route never reached (drop precedes match). Launch-relevant — Probiotics is a named category; CFU is its native unit. Silent data-loss = honest-engine violation. | [parseFormula.ts:115](../../lib/parseFormula.ts#L115) (pattern); [parseFormula.ts:810](../../lib/parseFormula.ts#L810) (silent drop) | **ROUTE/BUILD — add CFU/IU units + surface dropped lines.** Launch-relevant. |

| **F-11** | **Supp #8 Iodine/Thyroid** | **🟡** | **F-3 applied inconsistently across one SFP.** L-Tyrosine 500→**660** mg (×1.319 = F-3) but Iodine 150→150 mcg/100% (correct) and Selenium 200→106 mcg/192% (elemental, not F-3-scaled). *Hypothesis (untraced):* factored micronutrients use servingDoseEngine + bypass `perServing(×scale)`; plain ingredients get F-3-scaled. **Sharpens F-3: two SFP paths, only one carries the bug — fix must trace both.** | (untraced — flag for F-3 fix trace) | trace w/ F-3 fix |
| OBS-3 | Supp #8 Iodine/Thyroid | ℹ️ | Ashwagandha→KSM-66 (licensing-gated) routed to licensing queue + **excluded** from add (3 of 4 landed). Verify intended vs. silent-drop (operator's Ashwagandha absent from formula). | licensing-gate path | verify intent |

*(append as findings surface)*

---

## Per-formulation walk status

**Supplements (Nutraceuticals mode)** — capture: paste tier distribution · force-pick triggers · honest-unmatched · allergen/NDI/%DV/UL · WS-B gate · FVR render.

| # | Formulation | Walked? | Findings |
|---|---|---|---|
| 1 | Sleep & Recovery Stack *(canonical §A)* | ✅ | F-1, F-2 |
| 2 | Daily Multivitamin | ✅ | **F-3 (🔴 ship-stop)**, F-4, F-5 |
| 3 | Sports Pre-Workout | ✅ | **F-1↻, F-3↻ (🔴)**, F-6 |
| 4 | Women's Health / Prenatal | ✅ | F-3↻, **F-7**, **F-8**, F-4↻, OBS-1 (gate fired ✅?) |
| 5 | Immune Stack | ✅ | F-3↻ (scale .5665), F-4↻ (D3 carrier) — no new class |
| 6 | Omega-3 (source disambiguation) | ✅ | F-3↻ (.825), **F-9** (CCP terminology), OBS-1↻, OBS-2; cGMP panel GREEN |
| 7 | Probiotic Multi-Strain | ✅ | **F-10 (🔴 silent line-drop — strains vanish)**, F-3↻, F-9↻ |
| 8 | Iodine / Thyroid Support | ✅ | **F-11** (F-3 inconsistent), OBS-3; Iodine force-pick GREEN. **— supplements 8/8 complete —** |

**F&B (Food & Beverage mode)** — capture: NFP (101.9) · FALCPA + RBD-oil exemption · acidified `bucketAGate` / 114 filing · honest-unmatched.

| # | Formulation | Walked? | Findings |
|---|---|---|---|
| 1 | Classic Vinaigrette 🜂 | ☐ | — |
| 2 | Louisiana Hot Sauce 🜂 | ☐ | — |
| 3 | Creamy Caesar Dressing ⚠🜂 | ☐ | *(watch: Fish/anchovy + multi-allergen + RBD soybean-oil exemption)* |
| 4 | Smoky BBQ Sauce 🜂 | ☐ | — |
| 5 | Chocolate Protein Shake ⚠ | ☐ | *(low-acid contrast — should NOT trigger 114)* |
| 6 | Teriyaki Marinade ⚠🜂 | ☐ | *(Soy + Wheat double-allergen via soy sauce)* |
| 7 | Thai Peanut Sauce ⚠🜂 | ☐ | — |
| 8 | Roasted Red Pepper Hummus ⚠🜂 | ☐ | *(Sesame/tahini detection)* |
| 9 | Citrus Sports Beverage 🜂 | ☐ | — |
| 10 | Classic Mayonnaise ⚠🜂 | ☐ | *(watch: RBD soybean-oil must NOT declare Soy)* |

---

*On a complete inventory: integrated architecture decisions (composability memo revised/confirmed against the full surface; other findings scoped per category), then the layered L0→L5 build against the locked model.*
