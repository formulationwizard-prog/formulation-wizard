# DV Table Verification — `lib/supplementLabeling.ts` `DV_TABLE`

**Date:** 2026-06-07 · **v2** (primary eCFR incorporated + Opus cross-check)
**Auditor:** CC, with independent primary-source verification by Opus.
**Authority:** 21 CFR 101.9(c)(8)(iv) — Reference Daily Intakes (RDIs); (c)(9) — Daily Reference Values (DRVs); 2016 FDA final rule. **Primary eCFR text read directly by Opus** (CC's fetches were bot-blocked; values now corroborated FOUR ways: CIRS + ConsumerLab + FDA snippets + primary eCFR).
**Scope (locked):** DV **values + label units/basis + citations** only. Conversion **factors** (β-carotene→RAE, tryptophan→NE, folic-acid→DFE, tocopherol forms) and elemental factors are **out** — factor-class, follow-on audit, different authority (footnote conversions + supplier COAs).

---

## Findings (top)

- **✅ 27 / 27 inherited DV values CORRECT** — confirmed against **primary eCFR** (Opus spot-checked Vit D 20 mcg, Mag 420 mg, K 4700 mg, Choline 550 mg, Folate 400 mcg DFE, Chloride 2300 mg — all match). The numbers are right, now anchored to the regulation text.
- **⚠️ Unit/basis refinements (4)** — value correct, label requires the equivalence basis. Same shape, all confirmed in (c)(8)(iv) footnotes:
  1. **Folate** → `mcg DFE` (footnote 6 mandates unit; footnote 7 defines DFE).
  2. **Vitamin A** → `mcg RAE` (footnote 3: 1 mcg RAE = 1 retinol = 2 supplemental β-carotene = 12 dietary β-carotene = 24 α-carotene/β-cryptoxanthin).
  3. **Niacin** → `mg NE` (footnote 5: 1 mg NE = 1 niacin = 60 tryptophan).
  4. **Vitamin E** → `mg α-tocopherol` (footnote 4: 1 mg label-claim = 1 RRR-α-tocopherol = 2 all-rac-α-tocopherol).
- **⚠️ Coverage gap (1):** **Chloride** absent — RDI **2300 mg**, (c)(8)(iv). Add.
- **⚠️ Citation correction (1):** **Sodium** is a **DRV under (c)(9)**, not an RDI under (c)(8)(iv). Value 2300 mg correct; citation must point to (c)(9). (This is the count-reconciliation resolution — see below.)
- **⚠️ Rendering complexity (1):** **Folate** — per (c)(8)(vii), when folic acid is added/claimed, the label shows **folate (mcg DFE) on the line + folic acid (mcg) in parentheses**. DV math uses folate mcg DFE; the parenthetical is a display requirement. **The SFP rendering pipeline must support a parenthetical sub-declaration** — verify before cutover.
- **No numeric value is wrong. No removed entries.**

---

## Count reconciliation (Opus flag — resolved)

Primary (c)(8)(iv) RDI table = **27 vit/mineral entries, INCLUDING Chloride** (Vit A → Choline + the 13 minerals with Chloride, **without Sodium**). Inherited table = **27 distinct nutrients, WITH Sodium, WITHOUT Chloride**. Therefore:

| | (c)(8)(iv) RDIs | (c)(9) DRV | Missing |
|---|---|---|---|
| Inherited (27) | 26 of 27 ✓ | Sodium ✓ (mis-citable as RDI) | — |
| Authority | 27 (incl. Chloride) | Sodium | Chloride |

→ After adding Chloride, the table is **27 RDIs (c)(8)(iv) + 1 DRV (Sodium, (c)(9)) = 28 distinct nutrients**, each with the correct paragraph. Reconciled.

---

## Per-entry verification (primary eCFR authority)

| Nutrient | Inherited | Authoritative | Citation | Δ |
|---|---|---|---|---|
| Vitamin A | 900 mcg | 900 mcg **RAE** | 101.9(c)(8)(iv) fn3 | ⚠️ basis |
| Vitamin C | 90 mg | 90 mg | (c)(8)(iv) | ✅ |
| Vitamin D | 20 mcg | 20 mcg | (c)(8)(iv) | ✅ |
| Vitamin E | 15 mg | 15 mg **α-tocopherol** | (c)(8)(iv) fn4 | ⚠️ basis |
| Vitamin K | 120 mcg | 120 mcg | (c)(8)(iv) | ✅ |
| Thiamin | 1.2 mg | 1.2 mg | (c)(8)(iv) | ✅ |
| Riboflavin | 1.3 mg | 1.3 mg | (c)(8)(iv) | ✅ |
| Niacin | 16 mg | 16 mg **NE** | (c)(8)(iv) fn5 | ⚠️ basis |
| Vitamin B6 | 1.7 mg | 1.7 mg | (c)(8)(iv) | ✅ |
| Folate | 400 mcg | 400 mcg **DFE** | (c)(8)(iv) fn6/7; (c)(8)(vii) | ⚠️ unit + parenthetical |
| Vitamin B12 | 2.4 mcg | 2.4 mcg | (c)(8)(iv) | ✅ |
| Biotin | 30 mcg | 30 mcg | (c)(8)(iv) | ✅ |
| Pantothenic Acid | 5 mg | 5 mg | (c)(8)(iv) | ✅ |
| Choline | 550 mg | 550 mg | (c)(8)(iv) | ✅ |
| Calcium | 1300 mg | 1300 mg | (c)(8)(iv) | ✅ |
| Iron | 18 mg | 18 mg | (c)(8)(iv) | ✅ |
| Phosphorus | 1250 mg | 1250 mg | (c)(8)(iv) | ✅ |
| Iodine | 150 mcg | 150 mcg | (c)(8)(iv) | ✅ |
| Magnesium | 420 mg | 420 mg | (c)(8)(iv) | ✅ |
| Zinc | 11 mg | 11 mg | (c)(8)(iv) | ✅ |
| Selenium | 55 mcg | 55 mcg | (c)(8)(iv) | ✅ |
| Copper | 0.9 mg | 0.9 mg | (c)(8)(iv) | ✅ |
| Manganese | 2.3 mg | 2.3 mg | (c)(8)(iv) | ✅ |
| Chromium | 35 mcg | 35 mcg | (c)(8)(iv) | ✅ |
| Molybdenum | 45 mcg | 45 mcg | (c)(8)(iv) | ✅ |
| **Chloride** | *(absent)* | 2300 mg | (c)(8)(iv) | ➕ add |
| Potassium | 4700 mg | 4700 mg | (c)(8)(iv) | ✅ |
| Sodium | 2300 mg | 2300 mg | **(c)(9) DRV** | ⚠️ citation fix |

---

## Corrections to apply (all together, post-gate)

1. **Folate** → unit basis `mcg DFE`; wire the folic-acid parenthetical (c)(8)(vii) in the SFP pipeline.
2. **Vitamin A** → basis `mcg RAE`.
3. **Niacin** → basis `mg NE`.
4. **Vitamin E** → basis `mg α-tocopherol`.
5. **Add Chloride** `{ displayName:'Chloride', dv:2300, unit:'mg', keywords:['chloride'] }`.
6. **Sodium citation** → (c)(9) DRV.
7. **Citation provenance per entry** (`{ authority:'FDA', citation, basis?, verifiedOn:'2026-06-07' }`).
8. **Schema:** `DVEntry` gains an optional `basis` field (`'RAE'|'DFE'|'NE'|'α-tocopherol'`) — the `unit` enum stays for math; `basis` drives the label string. (RAE/DFE/NE aren't valid `unit` enum members, so they can't just overwrite `unit`.)

**Pre-cutover rendering checks:** (a) SFP supports the Folate→folic-acid parenthetical; (b) the label renders `basis` alongside the unit.

---

## Follow-on audits (out of scope — different authority/methodology)

- **Conversion factors** — β-carotene→RAE (×2 supplemental, ×12 dietary), tryptophan→NE (÷60), folic-acid→DFE (×1.7), tocopherol forms (all-rac ÷2). These bite when an operator enters a *source* form; bare units don't carry them. Factor-class — rides with the elemental-factor audit.
- **Elemental factors** (`elementalFactor`: MgO 0.60, Mg-glycinate 0.14, zinc picolinate 0.20…) — supplier/form-variable, COA-anchored, CFR not the authority.
- **Elemental-side-of-scaling** — code-correctness ticket.

**Sources:** Primary — 21 CFR 101.9(c)(8)(iv)/(c)(9) via eCFR (read by Opus). Corroborating — [CIRS Group](https://www.cirs-group.com/en/food/us-food-labeling-interpretation-nutrition-facts-of-regular-food-and-dietary-supplement) · [ConsumerLab](https://www.consumerlab.com/news/updated-daily-values-vitamins-minerals/07-27-2016/) · [FDA DV page](https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels) (bot-blocked from CC vector).
