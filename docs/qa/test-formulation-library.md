# Test Formulation Library — 2026-06-22

**Four purposes from one corpus:** (1) QA / regression substrate, (2) demo material, (3) operator-onboarding starting points, (4) seed of the north-star predicted-vs-measured corpus.

**Each entry is a real, copy-pasteable list** in bulk-paste format (`Name  AMOUNT UNIT`, one ingredient per line). Entry #1 is the canonical smoke-test formula — shared with [pre-launch-checklist §A](../launch/pre-launch-checklist.md) (one path: ship = test = demo).

**Expected behavior key:** **R** = resolves to catalog (Tier-1/2) · **FP** = bare ambiguous term → Tier-3 force-pick chooser · **U** = no catalog match → Tier-4 UNDOCUMENTED (honest). These are *grounded* — R names verified present in `lib/data/supplements.ts`; FP names are the registered force-pick terms in `lib/formSets.ts`.

> **Status:** working drafts — usable NOW for testing/demo. The *canonized* set (which become the official corpus + their final amounts/claims) is **PENDING co-founder / Process-Authority ratification**. CFU-unit handling for probiotics (#7) is a known parser edge, flagged below.

---

### 1. Sleep & Recovery Stack  *(canonical — = pre-launch §A)*
```
Magnesium Glycinate (Albion TRAACS) 300 mg
L-Theanine (Suntheanine) 200 mg
Melatonin 3 mg
Ashwagandha 600 mg
DHA 500 mg
Calm Proprietary Blend 200 mg
```
**Exercises:** R (Mag Glycinate, L-Theanine, Melatonin) · FP (Ashwagandha → KSM-66/Sensoril licensing; DHA → algal/fish/krill/calamari + species cascade) · U (Calm Proprietary Blend). Add a disease-y claim in the claim field to fire the WS-B gate, then export the FVR.

### 2. Daily Multivitamin
```
Vitamin C (Ascorbic Acid) 90 mg
Vitamin D3 (Cholecalciferol) 25 mcg
Vitamin K2 (MK-7) 90 mcg
Methylcobalamin (B12) 500 mcg
Calcium Citrate 200 mg
Magnesium Glycinate 100 mg
Zinc 15 mg
Selenium 55 mcg
Niacin 16 mg
```
**Exercises:** heavy R + %DV math · FP (Selenium) · Zinc may collide (multiple forms → Tier-3 confirm). Specific-form lines (Ascorbic Acid, D3, MK-7) resolve directly — *not* force-pick.

### 3. Sports Pre-Workout
```
Creatine Monohydrate (Creapure) 5000 mg
Beta-Alanine (CarnoSyn) 3200 mg
L-Citrulline Malate 6000 mg
Caffeine Anhydrous 200 mg
L-Theanine (Suntheanine) 100 mg
Taurine 1000 mg
PumpMax Proprietary Blend 2500 mg
```
**Exercises:** R (Creatine, L-Theanine) · U (proprietary blend, + likely Beta-Alanine/Citrulline/Taurine free-text) · high ingredient count · caffeine/UL surfacing.

### 4. Women's Health / Prenatal
```
5-MTHF Methylfolate (Quatrefolic) 800 mcg
Iron 27 mg
Vitamin D 25 mcg
Calcium Citrate 250 mg
DHA 450 mg
Choline Bitartrate 550 mg
```
**Exercises:** R (5-MTHF, Calcium Citrate) · FP (**Vitamin D** → D2/D3/lichen; **DHA** → source + species) · Iron (bare → multiple-form collision/Tier-3). UL-sensitive (Iron, D).

### 5. Immune Stack
```
Vitamin C 500 mg
Zinc Picolinate 15 mg
Vitamin D3 (Cholecalciferol) 50 mcg
Elderberry Extract 150 mg
Quercetin 500 mg
```
**Exercises:** FP (**Vitamin C** bare → ascorbic/sodium/calcium/Ester-C) · R (Zinc Picolinate, D3, Elderberry) · Quercetin (R or U).

### 6. Omega-3 (source disambiguation)
```
DHA 500 mg
EPA 300 mg
Vitamin E (Mixed Tocopherols) 15 mg
```
**Exercises:** FP (**DHA** + **EPA** → algal/fish/krill/calamari; fish → FALCPA species; calamari → mollusk dual-jurisdiction) · R (Vitamin E specific form).

### 7. Probiotic Multi-Strain
```
Probiotic Blend 10 Billion CFU
Lactobacillus acidophilus 5 Billion CFU
Inulin (Prebiotic Fiber) 2000 mg
```
**Exercises:** FP→**structuredCapture** route ("Probiotic Blend" → per-strain capture, not a form chooser). **⚠ Known edge:** "Billion CFU" isn't a parseable unit — the bulk-paste qty parser only recognizes mass/volume units (mg/mcg/g/ml…), so CFU lines won't extract a quantity cleanly. *This entry is the regression case that exercises probiotic CFU-unit handling — expect it to surface the gap, not parse cleanly.*

### 8. Iodine / Thyroid Support
```
Iodine 150 mcg
Selenium 200 mcg
L-Tyrosine 500 mg
Ashwagandha 600 mg
```
**Exercises:** FP ×3 (**Iodine** → KI/KIO₃/NaI/kelp triple-marker + narrow-therapeutic-window; **Selenium**; **Ashwagandha**) · L-Tyrosine (R or U). Stress-tests multiple force-picks in one paste.

---

**Coverage:** collectively these exercise every registered force-pick term (Selenium, Iodine, DHA/EPA, Vitamin C, Vitamin D, Ashwagandha, Probiotic-Blend), the structuredCapture route, the honest UNDOCUMENTED path, %DV math, the CFU-unit edge, and (with a claim added) the WS-B gate + FVR export. A green run across the library is a real regression signal.

*Next session: co-founder ratifies the canonical set + final amounts/claims; CC wires the library into the regression run.*
