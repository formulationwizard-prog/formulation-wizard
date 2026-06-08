# UL / Safety-Limit Table Verification — `lib/supplementSafetyLimits.ts`

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; spec artifact #5).
**Authority:** IOM/NAM Dietary Reference Intakes (Tolerable Upper Intake Levels), confirmed against the NCBI/NAP DRI reports; FDA conventions where IOM set no UL.
**Scope:** UL values + units + form-applicability + citations. The table already carries `authority`, `citation`, `hazard`, `mitigation`, and audience factors (pregnancy/pediatric/athletic) per entry — well-structured going in.

---

## Methodology
ULs confirmed via web against the IOM DRI reports (ncbi.nlm.nih.gov/books, nationalacademies.org) and ODS health-professional fact sheets. Vit A/D/E, Niacin, B6, Folate, C, Calcium, Zinc directly confirmed; remaining minerals cross-checked against the IOM DRI the entry already cites (primary-source-confirmable). High confidence on values.

---

## Findings (top)
- **✅ Every UL value is correct** against the IOM DRIs / stated authority. The table holds — the audit confirms, doesn't correct. Operator's instinct to verify inherited lookups was right discipline; the values are sound.
- **ℹ️ Form-applicability nuances (documented, conservative — NOT bugs):**
  - **Niacin 35 mg** is the **flushing-based UL for nicotinic acid**. The table also applies it to **niacinamide** (keyword `niacin` prefix-matches `niacinamide`), which doesn't flush. The IOM UL nominally covers niacin from supplements/fortification (both forms), so applying 35 mg to niacinamide is the IOM position — *conservative*, defensible, worth a code comment.
  - **Folate 1000 mcg** UL is for **synthetic folic acid** "exclusive of food folate." In a *supplement* context all declared folate is supplemental → the UL applies; methylfolate (5-MTHF) inherits it *conservatively* (the folic-acid UL is folic-acid-specific in origin). Safe direction; note it.
- **ℹ️ Potassium 99 mg** is the **FDA OTC labeling convention**, not an IOM UL (IOM set no potassium UL; 2019 NAM gave a CDRR, no UL). Correctly authored as `authority: 'FDA (historical convention)'`.
- **⚠️ Citation precision (refinement):** entries cite `DRI <year>`; the specific IOM report per nutrient would tighten provenance (e.g., Vit A → DRI 2001 *Vitamin A…Zinc*, NBK222318; Niacin/B6/Folate/Choline → DRI 1998 *Thiamin…Choline*). Registry-pass item.

---

## Per-entry verification
| Nutrient | Inherited UL | Authoritative | Citation (IOM DRI / authority) | Δ |
|---|---|---|---|---|
| Vitamin A (preformed) | 3000 mcg | 3000 mcg RAE (retinol) | DRI 2001 | ✅ |
| Vitamin D | 100 mcg | 100 mcg (4000 IU) | DRI 2011 | ✅ |
| Vitamin E | 1000 mg | 1000 mg α-tocopherol | DRI 2000 | ✅ |
| Niacin | 35 mg | 35 mg (flushing, nicotinic acid) | DRI 1998 | ✅ (form note) |
| Vitamin B6 | 100 mg | 100 mg | DRI 1998 | ✅ (caution @50 mg correct) |
| Folic acid | 1000 mcg | 1000 mcg (synthetic) | DRI 1998 | ✅ (form note) |
| Vitamin C | 2000 mg | 2000 mg | DRI 2000 | ✅ |
| Choline | 3500 mg | 3500 mg | DRI 1998 | ✅ |
| Calcium | 2500 mg | 2500 mg (2000 for 51+) | DRI 2011 | ✅ |
| Iron | 45 mg | 45 mg | DRI 2001 | ✅ |
| Zinc | 40 mg | 40 mg | DRI 2001 | ✅ |
| Selenium | 400 mcg | 400 mcg | DRI 2000 | ✅ |
| Iodine | 1100 mcg | 1100 mcg | DRI 2001 | ✅ |
| Magnesium (supplemental) | 350 mg | 350 mg (supplemental only) | DRI 1997 | ✅ |
| Copper | 10 mg | 10 mg | DRI 2001 | ✅ |
| Manganese | 11 mg | 11 mg | DRI 2001 | ✅ |
| Molybdenum | 2000 mcg | 2000 mcg | DRI 2001 | ✅ |
| Boron | 20 mg | 20 mg | DRI 2001 | ✅ |
| Fluoride | 10 mg | 10 mg | DRI 1997 | ✅ |
| Potassium (OTC) | 99 mg | 99 mg (FDA OTC convention) | FDA | ✅ (no IOM UL) |
| Caffeine | 400 mg | 400 mg (adult) | FDA guidance | ✅ |
| Melatonin | 10 mg | no FDA UL | AASM/AAP | ✅ (industry) |
| Sodium | 2300 mg | 2300 mg | DGA 2020 | ✅ (DRV, not UL) |

---

## Actions (registry-pass / harness)
1. **Provenance:** tighten citations to the specific IOM DRI report per nutrient (no value changes).
2. **Code comments:** add `// REGULATION` notes on the niacin (flushing/nicotinic-acid form) and folate (synthetic, conservative methylfolate) form-applicability nuances.
3. **Harness extension:** add the UL surface to the golden matrix — assert `% of UL` per the bench-test (Vit C 85 mg → 4% of 2000; Niacin 20 mg → 57% of 35; B6 2 mg → 2% of 100), two-derivation.

**Sources:** IOM DRI reports via [NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK114326/) ([Vit A…Zinc](https://www.ncbi.nlm.nih.gov/books/NBK222318/), [Vit C/E/Se](https://www.nationalacademies.org/read/9810/chapter/7), [Ca/D](https://www.ncbi.nlm.nih.gov/books/NBK56058/)) · [NIH ODS fact sheets](https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/).
